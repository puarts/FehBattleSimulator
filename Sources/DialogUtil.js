/// @file
/// @brief jQuery UIダイアログの代替ユーティリティ

function openDialogById(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('dialog-open');
}

function closeDialogById(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('dialog-open');
}

// Escapeキーで最前面のダイアログを閉じる
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const openDialogs = document.querySelectorAll('.sim-dialog.dialog-open');
        if (openDialogs.length > 0) {
            const lastDialog = openDialogs[openDialogs.length - 1];
            lastDialog.classList.remove('dialog-open');
        }
    }
});

function initSimDialog(id, title, options = {}) {
    const el = document.getElementById(id);
    if (!el || el.dataset.dialogInit) return;
    el.dataset.dialogInit = '1';
    el.classList.add('sim-dialog');

    const width = options.width || 370;

    // タイトルバー追加
    const titlebar = document.createElement('div');
    titlebar.className = 'sim-dialog-titlebar';
    const titleSpan = document.createElement('span');
    titleSpan.textContent = title;
    const closeX = document.createElement('button');
    closeX.className = 'sim-dialog-close';
    closeX.type = 'button';
    closeX.textContent = '\u00D7';
    closeX.addEventListener('click', () => closeDialogById(id));
    titlebar.appendChild(titleSpan);
    titlebar.appendChild(closeX);
    el.insertBefore(titlebar, el.firstChild);

    // コンテンツラッパー
    const content = document.createElement('div');
    content.className = 'sim-dialog-content';
    while (el.childNodes.length > 1) {
        content.appendChild(el.childNodes[1]);
    }
    el.appendChild(content);

    // 閉じるボタンペイン
    const buttonPane = document.createElement('div');
    buttonPane.className = 'sim-dialog-buttonpane';

    if (options.buttons) {
        for (const btnDef of options.buttons) {
            const button = document.createElement('button');
            button.className = btnDef.class || 'dialog-button';
            const btnText = document.createElement('span');
            btnText.className = 'dialog-button-text';
            btnText.textContent = btnDef.text || '閉じる';
            button.appendChild(btnText);
            button.addEventListener('click', () => {
                if (btnDef.click) {
                    btnDef.click(id);
                } else {
                    closeDialogById(id);
                }
            });
            buttonPane.appendChild(button);
        }
    } else {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'dialog-button';
        const closeBtnText = document.createElement('span');
        closeBtnText.className = 'dialog-button-text';
        closeBtnText.textContent = '閉じる';
        closeBtn.appendChild(closeBtnText);
        closeBtn.addEventListener('click', () => closeDialogById(id));
        buttonPane.appendChild(closeBtn);
    }

    el.appendChild(buttonPane);

    // 幅設定
    el.style.width = width + 'px';
}

export { openDialogById, closeDialogById, initSimDialog };
