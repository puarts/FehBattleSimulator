// ブラウザコンソールで実行するスニペット
// 各ファイルロード前後のwindowプロパティ差分を記録する

// 使い方:
// 1. ブラウザのDevToolsコンソールで before を記録
// 2. <script>タグでファイルをロード
// 3. after を記録して差分を表示

// Step 1: ロード前のグローバルを記録
const before = new Set(Object.getOwnPropertyNames(window));

// Step 2: ファイルをロード（手動で<script>タグを追加するか、import()を使用）
// 例: const script = document.createElement('script');
//     script.src = 'Sources/Unit.js';
//     document.head.appendChild(script);

// Step 3: ロード後に差分を確認（上記スクリプトのonload内で実行）
// script.onload = () => {
//     const after = new Set(Object.getOwnPropertyNames(window));
//     const added = [...after].filter(name => !before.has(name));
//     console.log('Added globals:', added);
// };
