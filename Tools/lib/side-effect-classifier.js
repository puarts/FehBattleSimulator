const acorn = require('acorn');

// Priority (highest to lowest):
// initialization-root > registry-provider > prototype-extension > global-assignment > global-mutable-state > global-constant > pure-definition
const CATEGORY_PRIORITY = {
    'pure-definition': 0,
    'global-constant': 1,
    'global-mutable-state': 2,
    'global-assignment': 3,
    'prototype-extension': 4,
    'registry-provider': 5,
    'initialization-root': 6,
};

/**
 * Classify the side-effect category of a JS file based on its top-level statements.
 * @param {string} code - JavaScript source code
 * @param {Object} [ast] - Pre-parsed AST (optional)
 * @returns {string} One of: pure-definition, global-constant, global-mutable-state,
 *                   global-assignment, registry-provider, prototype-extension, initialization-root
 */
function classifySideEffects(code, ast) {
    if (!ast) {
        ast = acorn.parse(code, {
            sourceType: 'script',
            ecmaVersion: 'latest',
        });
    }

    let maxCategory = 'pure-definition';

    function updateCategory(category) {
        if (CATEGORY_PRIORITY[category] > CATEGORY_PRIORITY[maxCategory]) {
            maxCategory = category;
        }
    }

    for (const node of ast.body) {
        const category = classifyStatement(node);
        if (category) {
            updateCategory(category);
        }
    }

    return maxCategory;
}

/**
 * Classify a single top-level statement.
 * @param {Object} node - AST node
 * @returns {string|null} Category or null if it's a pure declaration
 */
function classifyStatement(node) {
    if (node.type === 'ClassDeclaration' || node.type === 'FunctionDeclaration') {
        return null; // pure-definition (default)
    }

    if (node.type === 'VariableDeclaration') {
        return classifyVariableDeclaration(node);
    }

    if (node.type === 'ExpressionStatement') {
        return classifyExpression(node.expression);
    }

    // Any other top-level statement is initialization
    return 'initialization-root';
}

/**
 * Classify a top-level VariableDeclaration.
 * For g_ prefixed variables, sub-classify based on initializer:
 * - global-constant: literal, template literal, or constant expressions only
 * - global-mutable-state: let/var with null, false, "", 0, [], {} etc.
 * - global-assignment: new expressions, function calls, or other runtime execution
 */
function classifyVariableDeclaration(node) {
    let result = null;

    for (const decl of node.declarations) {
        if (!decl.id || decl.id.type !== 'Identifier') continue;
        const name = decl.id.name;
        if (!name.startsWith('g_') && !name.startsWith('G_')) continue;

        if (!decl.init) {
            // let g_x; (no initializer) — mutable state
            result = higherPriority(result, 'global-mutable-state');
            continue;
        }

        if (node.kind !== 'const' && isMutableStateInit(decl.init)) {
            // let/var g_x = null, false, "", 0 — mutable state placeholder
            result = higherPriority(result, 'global-mutable-state');
        } else if (isConstantExpression(decl.init)) {
            result = higherPriority(result, 'global-constant');
        } else {
            // new Foo(), fetchData(), createFoo() etc. — runtime execution
            result = higherPriority(result, 'global-assignment');
        }
    }

    return result; // null if no g_ variables found (pure-definition)
}

function higherPriority(a, b) {
    if (!a) return b;
    return CATEGORY_PRIORITY[a] >= CATEGORY_PRIORITY[b] ? a : b;
}

/**
 * Check if an expression is a constant (can be evaluated at parse time).
 * Includes: literals, template literals with only literal parts, string concatenation
 * of constants, unary expressions on literals, identifier references to other constants.
 */
function isConstantExpression(node) {
    if (!node) return false;

    switch (node.type) {
        case 'Literal':
            return true;
        case 'TemplateLiteral':
            // All expressions in the template must be constant
            return node.expressions.every(expr => isConstantExpression(expr));
        case 'UnaryExpression':
            return isConstantExpression(node.argument);
        case 'BinaryExpression':
            // String/number concatenation of constants
            return isConstantExpression(node.left) && isConstantExpression(node.right);
        case 'Identifier':
            // Reference to another variable — conservatively treat as constant
            // (e.g., g_imageRootPath = g_siteRootPath + "path/")
            return true;
        case 'MemberExpression':
            // e.g., SomeEnum.VALUE — treat as constant
            return !node.computed;
        default:
            return false;
    }
}

/**
 * Check if an initializer represents mutable state placeholder values.
 * null, undefined, false, true, 0, "", [], {}
 */
function isMutableStateInit(node) {
    if (!node) return false;

    if (node.type === 'Literal') {
        return node.value === null || node.value === false || node.value === ''
            || node.value === 0;
    }

    if (node.type === 'Identifier' && (node.name === 'undefined' || node.name === 'null')) {
        return true;
    }

    // Empty array literal []
    if (node.type === 'ArrayExpression' && node.elements.length === 0) {
        return true;
    }

    // Empty object literal {}
    if (node.type === 'ObjectExpression' && node.properties.length === 0) {
        return true;
    }

    return false;
}

/**
 * Classify a top-level expression.
 */
function classifyExpression(expr) {
    if (isPrototypeExtension(expr)) {
        return 'prototype-extension';
    }

    if (isRegistryCall(expr)) {
        return 'registry-provider';
    }

    if (expr.type === 'AssignmentExpression') {
        if (expr.left.type === 'Identifier' && expr.left.name.startsWith('g_')) {
            return 'global-assignment';
        }
    }

    return 'initialization-root';
}

/**
 * Check if an expression is Object.assign(*.prototype, ...)
 */
function isPrototypeExtension(expr) {
    if (expr.type !== 'CallExpression') return false;
    const callee = expr.callee;
    if (callee.type !== 'MemberExpression') return false;
    if (callee.object.type !== 'Identifier' || callee.object.name !== 'Object') return false;
    if (callee.property.type !== 'Identifier' || callee.property.name !== 'assign') return false;

    const args = expr.arguments;
    if (args.length < 2) return false;
    const firstArg = args[0];
    if (firstArg.type !== 'MemberExpression') return false;
    if (firstArg.property.type !== 'Identifier' || firstArg.property.name !== 'prototype') return false;

    return true;
}

/**
 * Check if an expression is a registry call (*.register*() or Vue.component())
 */
function isRegistryCall(expr) {
    if (expr.type !== 'CallExpression') return false;
    const callee = expr.callee;
    if (callee.type !== 'MemberExpression') return false;

    const method = callee.property;
    if (method.type !== 'Identifier') return false;

    if (callee.object.type === 'Identifier' && callee.object.name === 'Vue'
        && method.name === 'component') {
        return true;
    }

    if (method.name.startsWith('register')) {
        return true;
    }

    return false;
}

module.exports = { classifySideEffects };
