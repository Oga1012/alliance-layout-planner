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
// 現在のレイアウトの配置を全消去
// =======================================

const clearMapButton =
    document.getElementById(
        "clear-map"
    );

if (clearMapButton) {
    clearMapButton.addEventListener(
        "click",
        function () {
            const app =
                window.AllianceApp;

            const hasPlacedPlayers =
                app.state.players.some(
                    function (player) {
                        return player.isPlaced;
                    }
                );

            const hasPlacements =
                Boolean(
                    app.state.headquarters ||
                    app.state.flags.length > 0 ||
                    app.state.bearTraps.bear1 ||
                    app.state.bearTraps.bear2 ||
                    app.state.fixedBuildings.length > 0 ||
                    hasPlacedPlayers
                );

            if (!hasPlacements) {
                const instructionElement =
                    document.getElementById(
                        "instruction"
                    );

                if (instructionElement) {
                    instructionElement.textContent =
                        "消去する配置はありません。";
                }

                return;
            }

            const currentLayout =
                app.getCurrentLayout();

            const layoutName =
                currentLayout
                    ? currentLayout.name
                    : "現在のレイアウト";

            const confirmed =
                window.confirm(
                    `「${layoutName}」の配置をすべて消去しますか？\n\n` +
                    "消去対象：本部、旗、熊罠、固定施設、プレイヤー配置\n" +
                    "プレイヤー名簿・熊罠の開始時刻・ゲーム座標・他のレイアウトは残ります。"
                );

            if (!confirmed) {
                return;
            }

            app.saveHistory();

            app.state.headquarters = null;
            app.state.flags = [];
            app.state.bearTraps = {
                bear1: null,
                bear2: null
            };
            app.state.fixedBuildings = [];
            app.state.territoryCells.clear();
            app.clearPlayerPlacements();
            app.state.selectedPlayerId = null;

            calculateTerritory();
            renderMap();

            if (
                typeof refreshPlayerUi ===
                "function"
            ) {
                refreshPlayerUi();
            }

            if (
                typeof refreshBearTrapUi ===
                "function"
            ) {
                refreshBearTrapUi();
            }

            if (
                typeof refreshCoordinateUi ===
                "function"
            ) {
                refreshCoordinateUi();
            }

            app.saveCurrentLayoutState();
            app.autoSave();
            app.refreshHistoryButtons();

            const instructionElement =
                document.getElementById(
                    "instruction"
                );

            if (instructionElement) {
                instructionElement.textContent =
                    "現在のレイアウトの配置をすべて消去しました。「戻す」で元に戻せます。";
            }
        }
    );
}

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
