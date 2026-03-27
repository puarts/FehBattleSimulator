const acorn = require('acorn');

const BROWSER_GLOBALS = new Set([
    'window', 'self', 'globalThis', 'document', 'navigator', 'location', 'history',
    'console', 'alert', 'confirm', 'prompt',
    'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
    'requestAnimationFrame', 'cancelAnimationFrame',
    'fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource',
    'URL', 'URLSearchParams',
    'localStorage', 'sessionStorage',
    'performance', 'crypto',
    'MutationObserver', 'IntersectionObserver', 'ResizeObserver',
    'CustomEvent', 'Event', 'MouseEvent', 'KeyboardEvent',
    'HTMLElement', 'HTMLCanvasElement', 'HTMLImageElement', 'HTMLInputElement',
    'Node', 'NodeList', 'Element', 'DocumentFragment',
    'Image', 'Audio', 'FormData', 'Blob', 'File', 'FileReader',
    'Canvas', 'CanvasRenderingContext2D',
    // Built-in JS globals
    'Object', 'Array', 'String', 'Number', 'Boolean', 'Symbol',
    'Map', 'Set', 'WeakMap', 'WeakSet',
    'Promise', 'Proxy', 'Reflect',
    'JSON', 'Math', 'Date', 'RegExp',
    'Error', 'TypeError', 'RangeError', 'ReferenceError', 'SyntaxError', 'URIError', 'EvalError',
    'Function', 'GeneratorFunction', 'AsyncFunction',
    'ArrayBuffer', 'DataView', 'Float32Array', 'Float64Array',
    'Int8Array', 'Int16Array', 'Int32Array',
    'Uint8Array', 'Uint16Array', 'Uint32Array', 'Uint8ClampedArray',
    'BigInt', 'BigInt64Array', 'BigUint64Array',
    'parseInt', 'parseFloat', 'isNaN', 'isFinite',
    'encodeURI', 'decodeURI', 'encodeURIComponent', 'decodeURIComponent',
    'eval', 'undefined', 'NaN', 'Infinity',
    // Common browser APIs
    'atob', 'btoa',
    'getComputedStyle',
    'matchMedia',
    'queueMicrotask',
    'structuredClone',
]);

/**
 * Parse JavaScript source code into an AST.
 * @param {string} code - JavaScript source code
 * @returns {Object} Acorn AST
 */
function parseCode(code) {
    return acorn.parse(code, {
        sourceType: 'script',
        ecmaVersion: 'latest',
        locations: true,
    });
}

/**
 * Extract top-level definitions and external references from JS source code.
 * @param {string} code - JavaScript source code
 * @param {Object} [ast] - Pre-parsed AST (optional, will parse if not provided)
 * @returns {{ defines: string[], references: string[] }}
 */
function extractSymbols(code, ast) {
    if (!ast) {
        ast = parseCode(code);
    }

    const defines = new Set();
    const references = new Set();

    // 1. Extract top-level definitions
    for (const node of ast.body) {
        switch (node.type) {
            case 'ClassDeclaration':
                if (node.id) defines.add(node.id.name);
                break;
            case 'FunctionDeclaration':
                if (node.id) defines.add(node.id.name);
                break;
            case 'VariableDeclaration':
                for (const declarator of node.declarations) {
                    if (declarator.id && declarator.id.type === 'Identifier') {
                        defines.add(declarator.id.name);
                    }
                }
                break;
        }
    }

    // 2. Extract references using scope tracking
    // Scope stack: each entry is a Set of locally declared names
    const scopeStack = [new Set(defines)]; // top-level defines are in scope

    function currentScope() {
        return scopeStack[scopeStack.length - 1];
    }

    function isInScope(name) {
        for (let i = scopeStack.length - 1; i >= 0; i--) {
            if (scopeStack[i].has(name)) return true;
        }
        return false;
    }

    function addToScope(name) {
        currentScope().add(name);
    }

    function pushScope() {
        scopeStack.push(new Set());
    }

    function popScope() {
        if (scopeStack.length <= 1) {
            throw new Error('Scope stack underflow: attempted to pop the top-level scope');
        }
        scopeStack.pop();
    }

    function addParamsToScope(params) {
        for (const param of params) {
            if (param.type === 'Identifier') {
                addToScope(param.name);
            } else if (param.type === 'AssignmentPattern' && param.left.type === 'Identifier') {
                addToScope(param.left.name);
            } else if (param.type === 'RestElement' && param.argument.type === 'Identifier') {
                addToScope(param.argument.name);
            }
        }
    }

    function addDeclarationsToScope(node) {
        if (node.type === 'VariableDeclaration') {
            for (const decl of node.declarations) {
                if (decl.id && decl.id.type === 'Identifier') {
                    addToScope(decl.id.name);
                }
            }
        }
    }

    // Custom recursive walker to properly track scopes
    function walkNode(node, parentType, parentKey) {
        if (!node || typeof node !== 'object') return;
        if (!node.type) {
            // Could be an array
            if (Array.isArray(node)) {
                for (const child of node) {
                    walkNode(child, parentType, parentKey);
                }
            }
            return;
        }

        switch (node.type) {
            case 'Identifier': {
                // Skip identifiers that are:
                // - Property names in member expressions (foo.bar -> skip bar)
                // - Method/property definitions in classes
                // - Object keys in object literals
                // - Variable declaration ids (handled separately)
                if (parentKey === 'property' && parentType === 'MemberExpression') break;
                if (parentKey === 'key' && (parentType === 'MethodDefinition' || parentType === 'Property')) break;
                if (parentKey === 'id' && (parentType === 'ClassDeclaration' || parentType === 'FunctionDeclaration'
                    || parentType === 'FunctionExpression' || parentType === 'VariableDeclarator')) break;
                if (parentKey === 'label' || parentKey === 'local' || parentKey === 'exported') break;

                const name = node.name;
                if (!isInScope(name) && !BROWSER_GLOBALS.has(name)) {
                    references.add(name);
                }
                break;
            }

            case 'FunctionDeclaration':
            case 'FunctionExpression':
            case 'ArrowFunctionExpression': {
                pushScope();
                if (node.id && node.type !== 'ArrowFunctionExpression') {
                    addToScope(node.id.name);
                }
                addParamsToScope(node.params || []);
                // Pre-scan for var declarations (hoisted)
                hoistVarDeclarations(node.body);
                walkNode(node.body, node.type, 'body');
                popScope();
                break;
            }

            case 'ClassDeclaration':
            case 'ClassExpression': {
                // Walk superclass in current scope
                if (node.superClass) {
                    walkNode(node.superClass, node.type, 'superClass');
                }
                // Walk class body
                walkNode(node.body, node.type, 'body');
                break;
            }

            case 'BlockStatement': {
                // Only create new scope for blocks that aren't function bodies
                // (function bodies already pushed a scope)
                const isFunctionBody = parentType === 'FunctionDeclaration'
                    || parentType === 'FunctionExpression'
                    || parentType === 'ArrowFunctionExpression';
                if (!isFunctionBody) {
                    pushScope();
                }
                for (const stmt of node.body) {
                    // Add block-scoped declarations (const/let)
                    if (stmt.type === 'VariableDeclaration' && stmt.kind !== 'var') {
                        addDeclarationsToScope(stmt);
                    }
                    walkNode(stmt, node.type, 'body');
                }
                if (!isFunctionBody) {
                    popScope();
                }
                break;
            }

            case 'ForStatement': {
                pushScope();
                if (node.init) {
                    if (node.init.type === 'VariableDeclaration') {
                        addDeclarationsToScope(node.init);
                    }
                    walkNode(node.init, node.type, 'init');
                }
                if (node.test) walkNode(node.test, node.type, 'test');
                if (node.update) walkNode(node.update, node.type, 'update');
                walkNode(node.body, node.type, 'body');
                popScope();
                break;
            }

            case 'ForInStatement':
            case 'ForOfStatement': {
                pushScope();
                if (node.left.type === 'VariableDeclaration') {
                    addDeclarationsToScope(node.left);
                    walkNode(node.left, node.type, 'left');
                } else {
                    walkNode(node.left, node.type, 'left');
                }
                walkNode(node.right, node.type, 'right');
                walkNode(node.body, node.type, 'body');
                popScope();
                break;
            }

            case 'CatchClause': {
                pushScope();
                if (node.param) {
                    if (node.param.type === 'Identifier') {
                        addToScope(node.param.name);
                    }
                }
                walkNode(node.body, node.type, 'body');
                popScope();
                break;
            }

            case 'VariableDeclaration': {
                for (const decl of node.declarations) {
                    // Walk the init expression (not the id)
                    if (decl.init) {
                        walkNode(decl.init, 'VariableDeclarator', 'init');
                    }
                }
                break;
            }

            case 'MemberExpression': {
                walkNode(node.object, node.type, 'object');
                // Only walk computed properties (foo[bar] -> walk bar)
                if (node.computed) {
                    walkNode(node.property, node.type, 'property_computed');
                }
                // Non-computed property (foo.bar) -> skip bar (handled in Identifier case)
                break;
            }

            case 'MethodDefinition': {
                // Skip the key (method name), walk the value (function)
                walkNode(node.value, node.type, 'value');
                break;
            }

            case 'Property': {
                // For shorthand properties {a} where key === value, we still want to check the value
                if (node.shorthand) {
                    // In shorthand, key and value are the same identifier
                    // We want to check if it's a reference
                    walkNode(node.value, node.type, 'value');
                } else {
                    // Walk computed keys
                    if (node.computed) {
                        walkNode(node.key, node.type, 'key_computed');
                    }
                    walkNode(node.value, node.type, 'value');
                }
                break;
            }

            default: {
                // Generic traversal for all other node types
                for (const key of Object.keys(node)) {
                    if (key === 'type' || key === 'start' || key === 'end' || key === 'loc'
                        || key === 'sourceType' || key === 'raw' || key === 'value'
                        || key === 'name' || key === 'operator' || key === 'prefix'
                        || key === 'kind' || key === 'computed' || key === 'shorthand'
                        || key === 'method' || key === 'async' || key === 'generator'
                        || key === 'static' || key === 'optional' || key === 'delegate'
                        || key === 'directive' || key === 'regex') {
                        continue;
                    }
                    const child = node[key];
                    if (child && typeof child === 'object') {
                        if (Array.isArray(child)) {
                            for (const item of child) {
                                if (item && typeof item === 'object' && item.type) {
                                    walkNode(item, node.type, key);
                                }
                            }
                        } else if (child.type) {
                            walkNode(child, node.type, key);
                        }
                    }
                }
                break;
            }
        }
    }

    function hoistVarDeclarations(node) {
        if (!node || typeof node !== 'object') return;
        if (node.type === 'VariableDeclaration' && node.kind === 'var') {
            addDeclarationsToScope(node);
        }
        // Don't descend into nested functions
        if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression'
            || node.type === 'ArrowFunctionExpression') {
            return;
        }
        for (const key of Object.keys(node)) {
            const child = node[key];
            if (child && typeof child === 'object') {
                if (Array.isArray(child)) {
                    for (const item of child) {
                        if (item && typeof item === 'object' && item.type) {
                            hoistVarDeclarations(item);
                        }
                    }
                } else if (child.type) {
                    hoistVarDeclarations(child);
                }
            }
        }
    }

    // Walk all top-level statements
    for (const node of ast.body) {
        walkNode(node, 'Program', 'body');
    }

    return {
        defines: [...defines].sort(),
        references: [...references].sort(),
    };
}

module.exports = { extractSymbols, parseCode, BROWSER_GLOBALS };
