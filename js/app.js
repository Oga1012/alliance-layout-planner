// =======================================
// アプリ開始
// =======================================

// LocalStorageに保存データがあれば復元する
const restoredFromLocalStorage =
    window.AllianceApp.loadFromLocalStorage();

createGrid();
renderMap();

// レイアウト管理画面を更新
if (
    typeof refreshLayoutUi ===
    "function"
) {
    refreshLayoutUi();
}

// プレイヤー管理画面を更新
if (
    typeof refreshPlayerUi ===
    "function"
) {
    refreshPlayerUi();
}

if (
    typeof refreshCoordinateUi ===
    "function"
) {
    refreshCoordinateUi();
}

if (
    typeof refreshBearTrapUi ===
    "function"
) {
    refreshBearTrapUi();
}

console.log(
    "Alliance Layout Planner 起動",
    {
        restoredFromLocalStorage:
            restoredFromLocalStorage
    }
);

// =======================================
// 戻す・やり直すボタン
// =======================================

const undoButton =
    document.getElementById(
        "undo-button"
    );

const redoButton =
    document.getElementById(
        "redo-button"
    );

if (undoButton) {
    undoButton.addEventListener(
        "click",
        function () {
            window.AllianceApp.undo();
        }
    );
}

if (redoButton) {
    redoButton.addEventListener(
        "click",
        function () {
            window.AllianceApp.redo();
        }
    );
}

window.AllianceApp.refreshHistoryButtons();

// =======================================
// Ctrl+Zで戻す・Ctrl+Yでやり直す
// =======================================

document.addEventListener(
    "keydown",
    function (event) {
        const key =
            event.key.toLowerCase();

        const isUndoShortcut =
            event.ctrlKey &&
            !event.shiftKey &&
            key === "z";

        const isRedoShortcut =
            event.ctrlKey &&
            (
                key === "y" ||
                (
                    event.shiftKey &&
                    key === "z"
                )
            );

        if (
            !isUndoShortcut &&
            !isRedoShortcut
        ) {
            return;
        }

        const activeElement =
            document.activeElement;

        const isTyping =
            activeElement &&
            (
                activeElement.tagName ===
                    "INPUT" ||
                activeElement.tagName ===
                    "TEXTAREA" ||
                activeElement.isContentEditable
            );

        if (isTyping) {
            return;
        }

        event.preventDefault();

        if (isUndoShortcut) {
            window.AllianceApp.undo();
            return;
        }

        window.AllianceApp.redo();
    }
);
