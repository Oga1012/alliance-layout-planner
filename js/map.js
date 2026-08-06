// ========================================
// マップ基本設定
// ========================================

const GRID_SIZE = 100;

// ========================================
// 旗ドラッグ管理
// ========================================

let suppressNextMapClick = false;

const MOBILE_LONG_PRESS_DELAY = 550;
const MOBILE_LONG_PRESS_MOVE_LIMIT = 12;

let mobileLongPressTimer = null;
let suppressContextMenuUntil = 0;

const mobileTouchState = {
    startClientX: null,
    startClientY: null,
    cellX: null,
    cellY: null,
    longPressTriggered: false
};

const mobileMoveState = {
    active: false,
    type: null,
    id: null,
    grabOffsetX: 0,
    grabOffsetY: 0
};

let mobileActionTarget = null;

const flagDragState = {
    active: false,
    flagId: null,
    startX: null,
    startY: null,
    targetX: null,
    targetY: null
};

const playerDragState = {
    active: false,
    playerId: null,
    startX: null,
    startY: null,
    targetX: null,
    targetY: null,
    grabOffsetX: 0,
    grabOffsetY: 0
};

window.addEventListener(
    "mouseup",
    handleFlagDragMouseUp
);

window.addEventListener(
    "mouseup",
    handlePlayerDragMouseUp
);

// ========================================
// マップを作成
// ========================================

function createGrid() {
    const mapElement =
        document.getElementById("map") ||
        document.getElementById("game-map") ||
        document.getElementById("grid");

    if (!mapElement) {
        console.error(
            "マップを表示する要素が見つかりません。"
        );

        return;
    }

    mapElement.innerHTML = "";

    mapElement.style.position = "relative";

    mapElement.style.gridTemplateColumns =
        `repeat(${GRID_SIZE}, 30px)`;

    mapElement.style.gridTemplateRows =
        `repeat(${GRID_SIZE}, 30px)`;

    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const cell =
                document.createElement("div");

            cell.classList.add("cell");

            cell.dataset.x = x;
            cell.dataset.y = y;

            cell.addEventListener(
                "click",
                function () {
                    handleMapClick(x, y);
                }
            );

            cell.addEventListener(
                "mousedown",
                function (event) {
                    handleFlagDragMouseDown(
                        event,
                        x,
                        y
                    );

                    handlePlayerDragMouseDown(
                        event,
                        x,
                        y
                    );
                }
            );

            cell.addEventListener(
                "touchstart",
                function (event) {
                    handleMapTouchStart(
                        event,
                        x,
                        y
                    );
                },
                {
                    passive: true
                }
            );

            cell.addEventListener(
                "touchmove",
                handleMapTouchMove,
                {
                    passive: true
                }
            );

            cell.addEventListener(
                "touchend",
                handleMapTouchEnd,
                {
                    passive: false
                }
            );

            cell.addEventListener(
                "touchcancel",
                cancelMobileLongPress,
                {
                    passive: true
                }
            );

            cell.addEventListener(
                "contextmenu",
                function (event) {
                    event.preventDefault();

                    if (mobileLongPressTimer) {
                        const actionTarget =
                            findMobileActionTarget(
                                x,
                                y
                            );

                        if (actionTarget) {
                            triggerMobileLongPress(
                                actionTarget
                            );
                        }

                        return;
                    }

                    if (
                        Date.now() <
                        suppressContextMenuUntil
                    ) {
                        return;
                    }

                    handleMapRightClick(x, y);
                }
            );

            cell.addEventListener(
                "mouseenter",
                function () {
                    updateCoordinateDisplay(x, y);
                    updateFlagDragTarget(x, y);
                    updatePlayerDragTarget(x, y);
                }
            );

            mapElement.appendChild(cell);
        }
    }

    const connectionLayer =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
        );

    connectionLayer.id =
        "flag-connection-layer";

    connectionLayer.setAttribute(
        "width",
        String(GRID_SIZE * 30)
    );

    connectionLayer.setAttribute(
        "height",
        String(GRID_SIZE * 30)
    );

    connectionLayer.setAttribute(
        "viewBox",
        `0 0 ${GRID_SIZE * 30} ${GRID_SIZE * 30}`
    );

    connectionLayer.style.position =
        "absolute";

    connectionLayer.style.left = "0";
    connectionLayer.style.top = "0";

    connectionLayer.style.width =
        `${GRID_SIZE * 30}px`;

    connectionLayer.style.height =
        `${GRID_SIZE * 30}px`;

    connectionLayer.style.pointerEvents =
        "none";

    connectionLayer.style.zIndex = "5";

    mapElement.appendChild(
        connectionLayer
    );

    ensureMobileActionMenu();

    calculateTerritory();
    renderMap();
}


// ========================================
// 指定した座標のマスを取得
// ========================================

function getCell(x, y) {
    if (!isInsideGrid(x, y)) {
        return null;
    }

    return document.querySelector(
        `.cell[data-x="${x}"][data-y="${y}"]`
    );
}


// ========================================
// マップをクリックしたとき
// ========================================

function handleMapClick(x, y) {
    const app = window.AllianceApp;

    if (suppressNextMapClick) {
        suppressNextMapClick = false;
        return;
    }

    if (!app) {
        console.error(
            "AllianceAppが読み込まれていません。"
        );

        return;
    }

    if (
        app.state.selectedTool === "hq"
    ) {
        placeHeadquarters(x, y);
        return;
    }

    if (
        app.state.selectedTool === "flag"
    ) {
        placeFlag(x, y);
        return;
    }

    if (mobileMoveState.active) {
        handleMobileMoveDestination(
            x,
            y
        );
        return;
    }

    if (
        app.state.selectedTool === "bear1" ||
        app.state.selectedTool === "bear2"
    ) {
        placeBearTrap(
            app.state.selectedTool,
            x,
            y
        );
        return;
    }

    if (
        app.state.selectedTool === "player"
    ) {
        placePlayer(x, y);
        return;
    }

    if (
        app.state.selectedTool.startsWith(
            "fixed-"
        )
    ) {
        placeFixedBuilding(
            app.state.selectedTool.replace(
                "fixed-",
                ""
            ),
            x,
            y
        );
    }
}

// ========================================
// 旗をマウスでつかむ
// ========================================

function handleFlagDragMouseDown(
    event,
    x,
    y
) {
    const app = window.AllianceApp;

    if (
        event.button !== 0 ||
        !app ||
        app.state.selectedTool !== "flag"
    ) {
        return;
    }

    const flag =
        app.state.flags.find(
            function (item) {
                return (
                    item.x === x &&
                    item.y === y
                );
            }
        );

    if (!flag) {
        return;
    }

    event.preventDefault();

    flagDragState.active = true;
    flagDragState.flagId = flag.id;
    flagDragState.startX = flag.x;
    flagDragState.startY = flag.y;
    flagDragState.targetX = flag.x;
    flagDragState.targetY = flag.y;

    updateFlagDragTarget(x, y);
}

// ========================================
// 旗の移動先候補を更新する
// ========================================

function updateFlagDragTarget(x, y) {
    if (!flagDragState.active) {
        return;
    }

    flagDragState.targetX = x;
    flagDragState.targetY = y;

    clearFlagDragPreview();

    const sourceCell =
        getCell(
            flagDragState.startX,
            flagDragState.startY
        );

    if (sourceCell) {
        sourceCell.classList.add(
            "flag-drag-source"
        );
    }

    const targetCell =
        getCell(x, y);

    if (!targetCell) {
        return;
    }

    const canMove =
        canMoveFlagTo(
            flagDragState.flagId,
            x,
            y
        );

    targetCell.classList.add(
        canMove
            ? "flag-drag-valid"
            : "flag-drag-invalid"
    );
}

// ========================================
// マウスを離した場所へ旗を移動する
// ========================================

function handleFlagDragMouseUp(event) {
    if (!flagDragState.active) {
        return;
    }

    const targetElement =
        event.target &&
        typeof event.target.closest ===
            "function"
            ? event.target.closest(".cell")
            : null;

    if (!targetElement) {
        cancelFlagDrag(false);
        return;
    }

    const x =
        Number(targetElement.dataset.x);

    const y =
        Number(targetElement.dataset.y);

    finishFlagDrag(x, y);
}

// ========================================
// 旗ドラッグを確定する
// ========================================

function finishFlagDrag(x, y) {
    const app = window.AllianceApp;

    const flagId =
        flagDragState.flagId;

    const startX =
        flagDragState.startX;

    const startY =
        flagDragState.startY;

    suppressNextMapClick = true;

    if (
        x === startX &&
        y === startY
    ) {
        cancelFlagDrag(true);
        return;
    }

    if (
        !canMoveFlagTo(
            flagId,
            x,
            y
        )
    ) {
        cancelFlagDrag(true);
        return;
    }

    const movingFlag =
        app.state.flags.find(
            function (flag) {
                return flag.id === flagId;
            }
        );

    if (!movingFlag) {
        cancelFlagDrag(true);
        return;
    }

    app.saveHistory();

    movingFlag.x = x;
    movingFlag.y = y;

    clearFlagDragState();

    calculateTerritory();

    renderMap();
    refreshPlayerUi();

    app.autoSave();
}

// ========================================
// 旗を移動できる場所か確認する
// ========================================

function canMoveFlagTo(
    flagId,
    x,
    y
) {
    const app = window.AllianceApp;

    if (!isInsideGrid(x, y)) {
        return false;
    }

    const overlapsAnotherFlag =
        app.state.flags.some(
            function (flag) {
                return (
                    flag.id !== flagId &&
                    flag.x === x &&
                    flag.y === y
                );
            }
        );

    if (overlapsAnotherFlag) {
        return false;
    }

    if (isInsideHeadquarters(x, y)) {
        return false;
    }

    if (isCellOccupiedByPlayer(x, y)) {
        return false;
    }

    if (
        doesRectangleOverlapBearTrap(
            x,
            y,
            1,
            1
        )
    ) {
        return false;
    }

    if (
        doesRectangleOverlapFixedBuilding(
            x,
            y,
            1,
            1
        )
    ) {
        return false;
    }

    return true;
}

// ========================================
// 旗ドラッグを取り消す
// ========================================

function cancelFlagDrag(
    keepClickSuppressed
) {
    suppressNextMapClick =
        keepClickSuppressed === true;

    clearFlagDragState();
}

function clearFlagDragState() {
    flagDragState.active = false;
    flagDragState.flagId = null;
    flagDragState.startX = null;
    flagDragState.startY = null;
    flagDragState.targetX = null;
    flagDragState.targetY = null;

    clearFlagDragPreview();
}

function clearFlagDragPreview() {
    document
        .querySelectorAll(
            ".flag-drag-source, " +
            ".flag-drag-valid, " +
            ".flag-drag-invalid"
        )
        .forEach(
            function (cell) {
                cell.classList.remove(
                    "flag-drag-source",
                    "flag-drag-valid",
                    "flag-drag-invalid"
                );
            }
        );
}

// ========================================
// プレイヤーをマウスでつかむ
// ========================================

function handlePlayerDragMouseDown(
    event,
    x,
    y
) {
    const app = window.AllianceApp;

    if (
        event.button !== 0 ||
        !app ||
        app.state.selectedTool !== "player"
    ) {
        return;
    }

    const player =
        findPlayerAtCell(x, y);

    if (!player) {
        return;
    }

    event.preventDefault();

    app.state.selectedPlayerId =
        player.id;

    playerDragState.active = true;
    playerDragState.playerId = player.id;
    playerDragState.startX = player.x;
    playerDragState.startY = player.y;
    playerDragState.grabOffsetX =
        x - player.x;
    playerDragState.grabOffsetY =
        y - player.y;
    playerDragState.targetX = player.x;
    playerDragState.targetY = player.y;

    refreshPlayerUi();
    updatePlayerDragTarget(x, y);
}

// ========================================
// 指定マスにいるプレイヤーを取得する
// ========================================

function findPlayerAtCell(x, y) {
    const app = window.AllianceApp;

    const width =
        app.settings.player.width || 2;

    const height =
        app.settings.player.height || 2;

    return (
        app.state.players.find(
            function (player) {
                if (!player.isPlaced) {
                    return false;
                }

                return (
                    x >= player.x &&
                    x < player.x + width &&
                    y >= player.y &&
                    y < player.y + height
                );
            }
        ) || null
    );
}

// ========================================
// プレイヤーの移動先候補を更新する
// ========================================

function updatePlayerDragTarget(
    hoveredX,
    hoveredY
) {
    if (!playerDragState.active) {
        return;
    }

    const targetX =
        hoveredX -
        playerDragState.grabOffsetX;

    const targetY =
        hoveredY -
        playerDragState.grabOffsetY;

    playerDragState.targetX = targetX;
    playerDragState.targetY = targetY;

    clearPlayerDragPreview();
    renderPlayerDragSource();

    const canMove =
        canMovePlayerTo(
            playerDragState.playerId,
            targetX,
            targetY
        );

    renderPlayerDragTarget(
        targetX,
        targetY,
        canMove
    );
}

function renderPlayerDragSource() {
    const app = window.AllianceApp;

    const width =
        app.settings.player.width || 2;

    const height =
        app.settings.player.height || 2;

    for (
        let offsetY = 0;
        offsetY < height;
        offsetY++
    ) {
        for (
            let offsetX = 0;
            offsetX < width;
            offsetX++
        ) {
            const cell =
                getCell(
                    playerDragState.startX +
                        offsetX,
                    playerDragState.startY +
                        offsetY
                );

            if (cell) {
                cell.classList.add(
                    "player-drag-source"
                );
            }
        }
    }
}

function renderPlayerDragTarget(
    targetX,
    targetY,
    canMove
) {
    const app = window.AllianceApp;

    const width =
        app.settings.player.width || 2;

    const height =
        app.settings.player.height || 2;

    for (
        let offsetY = 0;
        offsetY < height;
        offsetY++
    ) {
        for (
            let offsetX = 0;
            offsetX < width;
            offsetX++
        ) {
            const cell =
                getCell(
                    targetX + offsetX,
                    targetY + offsetY
                );

            if (!cell) {
                continue;
            }

            cell.classList.add(
                canMove
                    ? "player-drag-valid"
                    : "player-drag-invalid"
            );
        }
    }
}

// ========================================
// マウスを離した場所へプレイヤーを移動する
// ========================================

function handlePlayerDragMouseUp(event) {
    if (!playerDragState.active) {
        return;
    }

    const targetElement =
        event.target &&
        typeof event.target.closest ===
            "function"
            ? event.target.closest(".cell")
            : null;

    if (!targetElement) {
        cancelPlayerDrag(false);
        return;
    }

    finishPlayerDrag(
        playerDragState.targetX,
        playerDragState.targetY
    );
}

function finishPlayerDrag(x, y) {
    const app = window.AllianceApp;

    const playerId =
        playerDragState.playerId;

    const startX =
        playerDragState.startX;

    const startY =
        playerDragState.startY;

    suppressNextMapClick = true;

    if (
        x === startX &&
        y === startY
    ) {
        cancelPlayerDrag(true);
        return;
    }

    if (
        !canMovePlayerTo(
            playerId,
            x,
            y
        )
    ) {
        cancelPlayerDrag(true);
        return;
    }

    const movingPlayer =
        app.state.players.find(
            function (player) {
                return player.id === playerId;
            }
        );

    if (!movingPlayer) {
        cancelPlayerDrag(true);
        return;
    }

    app.saveHistory();

    movingPlayer.x = x;
    movingPlayer.y = y;
    movingPlayer.isPlaced = true;

    clearPlayerDragState();

    renderMap();
    refreshPlayerUi();

    app.autoSave();
}

// ========================================
// プレイヤーを移動できる場所か確認する
// ========================================

function canMovePlayerTo(
    playerId,
    x,
    y
) {
    const app = window.AllianceApp;

    const width =
        app.settings.player.width || 2;

    const height =
        app.settings.player.height || 2;

    if (
        !canPlaceRectangle(
            x,
            y,
            width,
            height
        )
    ) {
        return false;
    }

    const minimumTerritoryCells =
        app.settings.player
            .minimumTerritoryCells || 2;

    if (
        countTerritoryCellsInsideRectangle(
            x,
            y,
            width,
            height
        ) < minimumTerritoryCells
    ) {
        return false;
    }

    if (
        doesRectangleOverlapHeadquarters(
            x,
            y,
            width,
            height
        )
    ) {
        return false;
    }

    if (
        doesRectangleOverlapFlag(
            x,
            y,
            width,
            height
        )
    ) {
        return false;
    }

    if (
        doesRectangleOverlapBearTrap(
            x,
            y,
            width,
            height
        )
    ) {
        return false;
    }

    if (
        doesRectangleOverlapFixedBuilding(
            x,
            y,
            width,
            height
        )
    ) {
        return false;
    }

    if (
        doesRectangleOverlapPlayer(
            x,
            y,
            width,
            height,
            playerId
        )
    ) {
        return false;
    }

    return true;
}

function cancelPlayerDrag(
    keepClickSuppressed
) {
    suppressNextMapClick =
        keepClickSuppressed === true;

    clearPlayerDragState();
}

function clearPlayerDragState() {
    playerDragState.active = false;
    playerDragState.playerId = null;
    playerDragState.startX = null;
    playerDragState.startY = null;
    playerDragState.targetX = null;
    playerDragState.targetY = null;
    playerDragState.grabOffsetX = 0;
    playerDragState.grabOffsetY = 0;

    clearPlayerDragPreview();
}

function clearPlayerDragPreview() {
    document
        .querySelectorAll(
            ".player-drag-source, " +
            ".player-drag-valid, " +
            ".player-drag-invalid"
        )
        .forEach(
            function (cell) {
                cell.classList.remove(
                    "player-drag-source",
                    "player-drag-valid",
                    "player-drag-invalid"
                );
            }
        );
}

// ========================================
// スマートフォンの長押し操作
// ========================================

function handleMapTouchStart(
    event,
    x,
    y
) {
    if (
        event.touches.length !== 1 ||
        mobileMoveState.active
    ) {
        return;
    }

    const actionTarget =
        findMobileActionTarget(x, y);

    if (!actionTarget) {
        return;
    }

    cancelMobileLongPress();

    const touch = event.touches[0];

    mobileTouchState.startClientX =
        touch.clientX;
    mobileTouchState.startClientY =
        touch.clientY;
    mobileTouchState.cellX = x;
    mobileTouchState.cellY = y;
    mobileTouchState.longPressTriggered =
        false;

    mobileLongPressTimer =
        window.setTimeout(
            function () {
                triggerMobileLongPress(
                    actionTarget
                );
            },
            MOBILE_LONG_PRESS_DELAY
        );
}

function triggerMobileLongPress(
    actionTarget
) {
    if (mobileLongPressTimer) {
        window.clearTimeout(
            mobileLongPressTimer
        );
    }

    mobileLongPressTimer = null;
    mobileTouchState.longPressTriggered =
        true;
    suppressNextMapClick = true;
    suppressContextMenuUntil =
        Date.now() + 1200;

    if (
        navigator.vibrate &&
        typeof navigator.vibrate ===
            "function"
    ) {
        navigator.vibrate(35);
    }

    openMobileActionMenu(actionTarget);
}

function handleMapTouchMove(event) {
    if (
        !mobileLongPressTimer ||
        event.touches.length !== 1
    ) {
        return;
    }

    const touch = event.touches[0];

    const movedX = Math.abs(
        touch.clientX -
        mobileTouchState.startClientX
    );

    const movedY = Math.abs(
        touch.clientY -
        mobileTouchState.startClientY
    );

    if (
        movedX >
            MOBILE_LONG_PRESS_MOVE_LIMIT ||
        movedY >
            MOBILE_LONG_PRESS_MOVE_LIMIT
    ) {
        cancelMobileLongPress();
    }
}

function handleMapTouchEnd(event) {
    const wasLongPress =
        mobileTouchState.longPressTriggered;

    cancelMobileLongPress();

    if (!wasLongPress) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();
    suppressNextMapClick = true;
}

function cancelMobileLongPress() {
    if (mobileLongPressTimer) {
        window.clearTimeout(
            mobileLongPressTimer
        );
    }

    mobileLongPressTimer = null;
    mobileTouchState.startClientX = null;
    mobileTouchState.startClientY = null;
    mobileTouchState.cellX = null;
    mobileTouchState.cellY = null;
    mobileTouchState.longPressTriggered =
        false;
}

function findMobileActionTarget(x, y) {
    const app = window.AllianceApp;

    if (!app) {
        return null;
    }

    const flag =
        app.state.flags.find(
            function (item) {
                return (
                    item.x === x &&
                    item.y === y
                );
            }
        );

    if (flag) {
        return {
            kind: "flag",
            id: flag.id,
            label: "同盟旗",
            grabOffsetX: 0,
            grabOffsetY: 0
        };
    }

    const player =
        findPlayerAtCell(x, y);

    if (player) {
        return {
            kind: "player",
            id: player.id,
            label: player.name,
            grabOffsetX: x - player.x,
            grabOffsetY: y - player.y
        };
    }

    const bearTrap =
        findBearTrapAtCell(x, y);

    if (bearTrap) {
        return {
            kind: "bear",
            type: bearTrap.type,
            label:
                bearTrap.type === "bear1"
                    ? "熊罠1"
                    : "熊罠2"
        };
    }

    const fixedBuilding =
        findFixedBuildingAtCell(x, y);

    if (fixedBuilding) {
        const definition =
            getFixedBuildingDefinition(
                fixedBuilding.type
            );

        return {
            kind: "fixed",
            type: fixedBuilding.type,
            label: definition
                ? definition.name
                : "固定施設"
        };
    }

    return null;
}

function ensureMobileActionMenu() {
    if (
        document.getElementById(
            "mobile-action-menu"
        )
    ) {
        return;
    }

    const menu =
        document.createElement("div");

    menu.id = "mobile-action-menu";
    menu.className = "mobile-action-menu";
    menu.hidden = true;
    menu.setAttribute("aria-hidden", "true");

    menu.innerHTML = `
        <div class="mobile-action-sheet"
             role="dialog"
             aria-modal="true"
             aria-labelledby="mobile-action-title">
            <div class="mobile-action-handle"></div>
            <h2 id="mobile-action-title"></h2>
            <p>操作を選んでください</p>
            <button type="button"
                    data-mobile-action="move">
                移動
            </button>
            <button type="button"
                    class="mobile-action-delete"
                    data-mobile-action="delete">
                削除
            </button>
            <button type="button"
                    class="mobile-action-cancel"
                    data-mobile-action="cancel">
                キャンセル
            </button>
        </div>
    `;

    menu.addEventListener(
        "click",
        function (event) {
            const actionButton =
                event.target.closest(
                    "[data-mobile-action]"
                );

            if (actionButton) {
                handleMobileAction(
                    actionButton.dataset
                        .mobileAction
                );
                return;
            }

            if (event.target === menu) {
                closeMobileActionMenu();
            }
        }
    );

    document.body.appendChild(menu);

    const moveCancelButton =
        document.createElement("button");

    moveCancelButton.id =
        "mobile-move-cancel";
    moveCancelButton.type = "button";
    moveCancelButton.hidden = true;
    moveCancelButton.textContent =
        "移動をキャンセル";

    moveCancelButton.addEventListener(
        "click",
        function () {
            clearMobileMoveState();
            renderMap();
        }
    );

    document.body.appendChild(
        moveCancelButton
    );
}

function openMobileActionMenu(target) {
    ensureMobileActionMenu();

    const menu =
        document.getElementById(
            "mobile-action-menu"
        );

    mobileActionTarget = target;

    const title =
        menu.querySelector(
            "#mobile-action-title"
        );

    const moveButton =
        menu.querySelector(
            '[data-mobile-action="move"]'
        );

    title.textContent = target.label;
    moveButton.hidden =
        ![
            "flag",
            "player"
        ].includes(target.kind);

    menu.hidden = false;
    menu.setAttribute(
        "aria-hidden",
        "false"
    );

    window.requestAnimationFrame(
        function () {
            menu.classList.add("open");
        }
    );
}

function closeMobileActionMenu() {
    const menu =
        document.getElementById(
            "mobile-action-menu"
        );

    if (!menu) {
        return;
    }

    menu.classList.remove("open");
    menu.hidden = true;
    menu.setAttribute(
        "aria-hidden",
        "true"
    );

    mobileActionTarget = null;
}

function handleMobileAction(action) {
    const target = mobileActionTarget;

    if (!target) {
        closeMobileActionMenu();
        return;
    }

    if (action === "move") {
        startMobileMove(target);
        closeMobileActionMenu();
        return;
    }

    closeMobileActionMenu();

    if (action !== "delete") {
        return;
    }

    if (target.kind === "flag") {
        deleteFlag(target.id);
        return;
    }

    if (target.kind === "player") {
        unplacePlayer(target.id);
        return;
    }

    if (target.kind === "bear") {
        removeBearTrap(target.type);
        return;
    }

    if (target.kind === "fixed") {
        removeFixedBuilding(target.type);
    }
}

function startMobileMove(target) {
    mobileMoveState.active = true;
    mobileMoveState.type = target.kind;
    mobileMoveState.id = target.id;
    mobileMoveState.grabOffsetX =
        target.grabOffsetX || 0;
    mobileMoveState.grabOffsetY =
        target.grabOffsetY || 0;

    renderMobileMoveSource();

    const cancelButton =
        document.getElementById(
            "mobile-move-cancel"
        );

    if (cancelButton) {
        cancelButton.hidden = false;
    }

    const instruction =
        document.getElementById(
            "instruction"
        );

    if (instruction) {
        instruction.textContent =
            `${target.label}の移動先をタップしてください。`;
    }
}

function renderMobileMoveSource() {
    const app = window.AllianceApp;

    document
        .querySelectorAll(
            ".mobile-move-source"
        )
        .forEach(
            function (cell) {
                cell.classList.remove(
                    "mobile-move-source"
                );
            }
        );

    if (
        !mobileMoveState.active ||
        !app
    ) {
        return;
    }

    if (mobileMoveState.type === "flag") {
        const flag =
            app.state.flags.find(
                function (item) {
                    return (
                        item.id ===
                        mobileMoveState.id
                    );
                }
            );

        const cell = flag
            ? getCell(flag.x, flag.y)
            : null;

        if (cell) {
            cell.classList.add(
                "mobile-move-source"
            );
        }

        return;
    }

    const player =
        app.state.players.find(
            function (item) {
                return (
                    item.id ===
                    mobileMoveState.id
                );
            }
        );

    if (!player) {
        return;
    }

    const width =
        app.settings.player.width || 2;
    const height =
        app.settings.player.height || 2;

    for (
        let offsetY = 0;
        offsetY < height;
        offsetY++
    ) {
        for (
            let offsetX = 0;
            offsetX < width;
            offsetX++
        ) {
            const cell =
                getCell(
                    player.x + offsetX,
                    player.y + offsetY
                );

            if (cell) {
                cell.classList.add(
                    "mobile-move-source"
                );
            }
        }
    }
}

function handleMobileMoveDestination(
    tappedX,
    tappedY
) {
    const app = window.AllianceApp;

    if (
        !mobileMoveState.active ||
        !app
    ) {
        return;
    }

    const targetX =
        tappedX -
        mobileMoveState.grabOffsetX;
    const targetY =
        tappedY -
        mobileMoveState.grabOffsetY;

    const canMove =
        mobileMoveState.type === "flag"
            ? canMoveFlagTo(
                mobileMoveState.id,
                targetX,
                targetY
            )
            : canMovePlayerTo(
                mobileMoveState.id,
                targetX,
                targetY
            );

    if (!canMove) {
        alert(
            "この場所へは移動できません。別のマスをタップしてください。"
        );
        return;
    }

    const shouldMove = confirm(
        "この場所へ移動しますか？"
    );

    if (!shouldMove) {
        return;
    }

    app.saveHistory();

    if (mobileMoveState.type === "flag") {
        const flag =
            app.state.flags.find(
                function (item) {
                    return (
                        item.id ===
                        mobileMoveState.id
                    );
                }
            );

        if (flag) {
            flag.x = targetX;
            flag.y = targetY;
        }

        clearMobileMoveState();
        calculateTerritory();
    } else {
        const player =
            app.state.players.find(
                function (item) {
                    return (
                        item.id ===
                        mobileMoveState.id
                    );
                }
            );

        if (player) {
            player.x = targetX;
            player.y = targetY;
            player.isPlaced = true;
        }

        clearMobileMoveState();
    }

    renderMap();
    refreshPlayerUi();
    app.autoSave();
}

function clearMobileMoveState() {
    mobileMoveState.active = false;
    mobileMoveState.type = null;
    mobileMoveState.id = null;
    mobileMoveState.grabOffsetX = 0;
    mobileMoveState.grabOffsetY = 0;

    document
        .querySelectorAll(
            ".mobile-move-source"
        )
        .forEach(
            function (cell) {
                cell.classList.remove(
                    "mobile-move-source"
                );
            }
        );

    const cancelButton =
        document.getElementById(
            "mobile-move-cancel"
        );

    if (cancelButton) {
        cancelButton.hidden = true;
    }

    const app = window.AllianceApp;

    if (
        app &&
        typeof updateInstruction ===
            "function"
    ) {
        updateInstruction(
            app.state.selectedTool
        );
    }
}

// ========================================
// マップを右クリックしたとき
// ========================================

function handleMapRightClick(x, y) {
    const app = window.AllianceApp;

    if (!app) {
        return;
    }

    const clickedFlag =
        app.state.flags.find(
            function (flag) {
                return (
                    flag.x === x &&
                    flag.y === y
                );
            }
        );

    if (clickedFlag) {
        deleteFlag(clickedFlag.id);
        return;
    }

    const clickedBearTrap =
        findBearTrapAtCell(x, y);

    if (clickedBearTrap) {
        removeBearTrap(
            clickedBearTrap.type
        );
        return;
    }

    const clickedFixedBuilding =
        findFixedBuildingAtCell(x, y);

    if (clickedFixedBuilding) {
        removeFixedBuilding(
            clickedFixedBuilding.type
        );
        return;
    }

    const clickedPlayer =
        findPlayerAtCell(x, y);

    if (clickedPlayer) {
        unplacePlayer(clickedPlayer.id);
    }
}

// ========================================
// プレイヤーを未配置へ戻す
// ========================================

function unplacePlayer(playerId) {
    const app = window.AllianceApp;

    const player =
        app.state.players.find(
            function (item) {
                return (
                    item.id === playerId &&
                    item.isPlaced
                );
            }
        );

    if (!player) {
        return;
    }

    const shouldUnplace =
        confirm(
            `「${player.name}」を未配置へ戻しますか？`
        );

    if (!shouldUnplace) {
        return;
    }

    app.saveHistory();

    player.isPlaced = false;
    player.x = null;
    player.y = null;

    app.state.selectedPlayerId =
        player.id;

    renderMap();
    refreshPlayerUi();

    app.autoSave();
}

function getFixedBuildingDefinition(type) {
    const definitions = {
        coal: {
            name: "同盟石炭工場",
            label: "石炭"
        },
        farm: {
            name: "同盟牧場",
            label: "牧場"
        },
        lumber: {
            name: "同盟製材所",
            label: "製材"
        },
        iron: {
            name: "同盟鉄鉱場",
            label: "鉄鉱"
        }
    };

    return definitions[type] || null;
}

function placeFixedBuilding(type, x, y) {
    const app = window.AllianceApp;

    const definition =
        getFixedBuildingDefinition(type);

    if (!definition) {
        return;
    }

    const width =
        app.settings.fixedBuilding.width;

    const height =
        app.settings.fixedBuilding.height;

    if (
        !canPlaceRectangle(
            x,
            y,
            width,
            height
        )
    ) {
        alert(
            `${definition.name}がマップの外にはみ出します。`
        );
        return;
    }

    if (
        doesRectangleOverlapHeadquarters(
            x,
            y,
            width,
            height
        ) ||
        doesRectangleOverlapFlag(
            x,
            y,
            width,
            height
        ) ||
        doesRectangleOverlapBearTrap(
            x,
            y,
            width,
            height
        ) ||
        doesRectangleOverlapPlayer(
            x,
            y,
            width,
            height,
            null
        ) ||
        doesRectangleOverlapFixedBuilding(
            x,
            y,
            width,
            height,
            type
        )
    ) {
        alert(
            "ほかの施設やプレイヤーと重なる場所には置けません。"
        );
        return;
    }

    const currentBuilding =
        app.state.fixedBuildings.find(
            function (building) {
                return (
                    building.type === type
                );
            }
        );

    if (
        currentBuilding &&
        currentBuilding.x === x &&
        currentBuilding.y === y
    ) {
        return;
    }

    if (
        currentBuilding &&
        !confirm(
            `${definition.name}をこの場所へ移動しますか？`
        )
    ) {
        return;
    }

    app.saveHistory();

    app.state.fixedBuildings =
        app.state.fixedBuildings.filter(
            function (building) {
                return (
                    building.type !== type
                );
            }
        );

    app.state.fixedBuildings.push({
        type: type,
        x: x,
        y: y
    });

    renderMap();
    app.autoSave();
}

function removeFixedBuilding(type) {
    const app = window.AllianceApp;

    const definition =
        getFixedBuildingDefinition(type);

    const exists =
        app.state.fixedBuildings.some(
            function (building) {
                return (
                    building.type === type
                );
            }
        );

    if (!definition || !exists) {
        return;
    }

    if (
        !confirm(
            `${definition.name}を未配置へ戻しますか？`
        )
    ) {
        return;
    }

    app.saveHistory();

    app.state.fixedBuildings =
        app.state.fixedBuildings.filter(
            function (building) {
                return (
                    building.type !== type
                );
            }
        );

    renderMap();
    app.autoSave();
}

function findFixedBuildingAtCell(x, y) {
    const app = window.AllianceApp;

    const width =
        app.settings.fixedBuilding.width;

    const height =
        app.settings.fixedBuilding.height;

    return (
        app.state.fixedBuildings.find(
            function (building) {
                return (
                    x >= building.x &&
                    x < building.x + width &&
                    y >= building.y &&
                    y < building.y + height
                );
            }
        ) || null
    );
}

// ========================================
// 熊罠を配置する
// ========================================

function placeBearTrap(type, x, y) {
    const app = window.AllianceApp;

    if (
        type !== "bear1" &&
        type !== "bear2"
    ) {
        return;
    }

    const settings =
        app.settings[type];

    const width =
        settings.width || 3;

    const height =
        settings.height || 3;

    const placementX =
        x - Math.floor(width / 2);

    const placementY =
        y - Math.floor(height / 2);

    if (
        !canPlaceRectangle(
            placementX,
            placementY,
            width,
            height
        )
    ) {
        alert(
            "熊罠がマップの外にはみ出します。"
        );
        return;
    }

    if (
        doesRectangleOverlapHeadquarters(
            placementX,
            placementY,
            width,
            height
        ) ||
        doesRectangleOverlapFlag(
            placementX,
            placementY,
            width,
            height
        ) ||
        doesRectangleOverlapPlayer(
            placementX,
            placementY,
            width,
            height,
            null
        ) ||
        doesRectangleOverlapBearTrap(
            placementX,
            placementY,
            width,
            height,
            type
        ) ||
        doesRectangleOverlapFixedBuilding(
            placementX,
            placementY,
            width,
            height
        )
    ) {
        alert(
            "ほかの施設やプレイヤーと重なる場所には置けません。"
        );
        return;
    }

    const currentTrap =
        app.state.bearTraps[type];

    if (
        currentTrap &&
        (
            currentTrap.x !== placementX ||
            currentTrap.y !== placementY
        )
    ) {
        const shouldMove =
            confirm(
                `${type === "bear1" ? "熊罠1" : "熊罠2"}をこの場所へ移動しますか？`
            );

        if (!shouldMove) {
            return;
        }
    }

    if (
        currentTrap &&
        currentTrap.x === placementX &&
        currentTrap.y === placementY
    ) {
        return;
    }

    app.saveHistory();

    app.state.bearTraps[type] = {
        x: placementX,
        y: placementY
    };

    renderMap();

    if (
        typeof refreshBearTrapUi ===
        "function"
    ) {
        refreshBearTrapUi();
    }

    app.autoSave();
}

// ========================================
// 熊罠を未配置へ戻す
// ========================================

function removeBearTrap(type) {
    const app = window.AllianceApp;

    if (!app.state.bearTraps[type]) {
        return;
    }

    const name =
        type === "bear1"
            ? "熊罠1"
            : "熊罠2";

    if (
        !confirm(
            `${name}を未配置へ戻しますか？`
        )
    ) {
        return;
    }

    app.saveHistory();
    app.state.bearTraps[type] = null;

    renderMap();

    if (
        typeof refreshBearTrapUi ===
        "function"
    ) {
        refreshBearTrapUi();
    }

    app.autoSave();
}

// ========================================
// 指定マスにある熊罠を取得する
// ========================================

function findBearTrapAtCell(x, y) {
    const app = window.AllianceApp;

    for (const type of ["bear1", "bear2"]) {
        const trap =
            app.state.bearTraps[type];

        if (!trap) {
            continue;
        }

        const settings =
            app.settings[type];

        if (
            x >= trap.x &&
            x < trap.x + settings.width &&
            y >= trap.y &&
            y < trap.y + settings.height
        ) {
            return {
                type: type,
                trap: trap
            };
        }
    }

    return null;
}

function deleteFlag(flagId) {
    const app = window.AllianceApp;

    const targetFlag =
        app.state.flags.find(
            function (flag) {
                return (
                    flag.id === flagId
                );
            }
        );

    if (!targetFlag) {
        return;
    }

    const shouldDelete =
        confirm(
            "この旗を削除しますか？\n\n" +
            "接続が切れた旗は削除されず、切断状態として残ります。"
        );

    if (!shouldDelete) {
        return;
    }

    app.saveHistory();

    app.state.flags =
        app.state.flags.filter(
            function (flag) {
                return (
                    flag.id !== flagId
                );
            }
        );

    calculateTerritory();

    renderMap();
    refreshPlayerUi();

    app.autoSave();
}

// ========================================
// 同盟本部を配置
// ========================================

// ========================================
// 熊罠を基準に本部と旗を自動配置する
// ========================================

function autoGenerateHeadquartersAndFlags() {
    const app = window.AllianceApp;

    const bear1 =
        app.state.bearTraps.bear1;

    const bear2 =
        app.state.bearTraps.bear2;

    if (!bear1 || !bear2) {
        alert(
            "先に熊罠1と熊罠2を配置してください。"
        );
        return;
    }

    const hasExistingLayout =
        app.state.headquarters ||
        app.state.flags.length > 0 ||
        app.state.players.some(
            function (player) {
                return player.isPlaced;
            }
        );

    if (
        hasExistingLayout &&
        !confirm(
            "現在の本部・旗・プレイヤー配置を自動配置で置き換えます。\n" +
            "プレイヤー名簿と熊罠は残ります。\n\n続けますか？"
        )
    ) {
        return;
    }

    app.saveHistory();

    app.state.headquarters =
        createAutomaticHeadquarters();

    app.state.flags = [];
    resetPlayerPlacements();

    const playerGroups = {
        bear1: [],
        bear2: []
    };

    app.state.players.forEach(
        function (player) {
            const bearType =
                app.getPreferredBearType(
                    player
                );

            if (bearType) {
                playerGroups[bearType].push(
                    player
                );
            }
        }
    );

    const autoFlagPoints = [];

    const bear1Cluster =
        addAutomaticBearCluster(
            "bear1",
            playerGroups.bear1.length,
            autoFlagPoints
        );

    const bear2Cluster =
        addAutomaticBearCluster(
            "bear2",
            playerGroups.bear2.length,
            autoFlagPoints
        );

    const hqCenter = {
        x:
            app.state.headquarters.x + 1,
        y:
            app.state.headquarters.y + 1
    };

    connectAutomaticClusterToHeadquarters(
        bear1Cluster,
        hqCenter,
        autoFlagPoints
    );

    connectAutomaticClusterToHeadquarters(
        bear2Cluster,
        hqCenter,
        autoFlagPoints
    );

    app.state.flags =
        autoFlagPoints.map(
            function (point) {
                return {
                    id:
                        app.createFlagId(),
                    parentId: null,
                    x: point.x,
                    y: point.y
                };
            }
        );

    calculateTerritory();
    renderMap();
    refreshPlayerUi();

    if (
        typeof refreshBearTrapUi ===
        "function"
    ) {
        refreshBearTrapUi();
    }

    app.autoSave();

    const connectedCount =
        getConnectedFlagIds().size;

    const messageElement =
        document.getElementById(
            "bear-time-message"
        );

    if (messageElement) {
        messageElement.textContent =
            `本部と旗${app.state.flags.length}本を自動配置しました。` +
            ` 接続中：${connectedCount}本。`;
    }
}

function createAutomaticHeadquarters() {
    const app = window.AllianceApp;

    const bearCenters =
        ["bear1", "bear2"].map(
            function (type) {
                const trap =
                    app.state.bearTraps[type];

                return {
                    x: trap.x + 1,
                    y: trap.y + 1
                };
            }
        );

    const averageX =
        Math.round(
            (
                bearCenters[0].x +
                bearCenters[1].x
            ) / 2
        );

    const averageY =
        Math.round(
            (
                bearCenters[0].y +
                bearCenters[1].y
            ) / 2
        );

    const minimumX =
        Math.min(
            bearCenters[0].x,
            bearCenters[1].x
        );

    const maximumX =
        Math.max(
            bearCenters[0].x,
            bearCenters[1].x
        );

    const minimumY =
        Math.min(
            bearCenters[0].y,
            bearCenters[1].y
        );

    const maximumY =
        Math.max(
            bearCenters[0].y,
            bearCenters[1].y
        );

    const direction =
        app.state.hqDirection ||
        "east";

    let centerX = averageX;
    let centerY = averageY;

    if (direction === "north") {
        centerY = minimumY - 24;
    } else if (direction === "south") {
        centerY = maximumY + 24;
    } else if (direction === "west") {
        centerX = minimumX - 24;
    } else {
        centerX = maximumX + 24;
    }

    centerX =
        Math.max(
            1,
            Math.min(
                GRID_SIZE - 2,
                centerX
            )
        );

    centerY =
        Math.max(
            1,
            Math.min(
                GRID_SIZE - 2,
                centerY
            )
        );

    return {
        x: centerX - 1,
        y: centerY - 1
    };
}

function addAutomaticBearCluster(
    type,
    playerCount,
    autoFlagPoints
) {
    const app = window.AllianceApp;

    const trap =
        app.state.bearTraps[type];

    const center = {
        x: trap.x + 1,
        y: trap.y + 1
    };

    const requiredFlagCount =
        Math.max(
            4,
            Math.min(
                12,
                Math.ceil(
                    playerCount / 7
                )
            )
        );

    const headquartersCenter = {
        x:
            app.state.headquarters.x + 1,
        y:
            app.state.headquarters.y + 1
    };

    const differenceX =
        headquartersCenter.x - center.x;

    const differenceY =
        headquartersCenter.y - center.y;

    const nearOffset = (
        Math.abs(differenceX) >=
        Math.abs(differenceY)
    )
        ? {
            x: Math.sign(differenceX) * 2,
            y: 0
        }
        : {
            x: 0,
            y: Math.sign(differenceY) * 2
        };

    const clusterPoints = [];

    const nearPoint =
        addAutomaticFlagNear(
            center.x + nearOffset.x,
            center.y + nearOffset.y,
            autoFlagPoints,
            null,
            true
        );

    if (nearPoint) {
        clusterPoints.push(nearPoint);
    }

    const outerFlagCount =
        Math.max(
            8,
            requiredFlagCount - 1
        );

    const offsets =
        createAutomaticClusterOffsets(
            outerFlagCount
        );

    offsets.forEach(
        function (offset) {
            const point =
                addAutomaticFlagNear(
                    center.x + offset.x,
                    center.y + offset.y,
                    autoFlagPoints,
                    null
                );

            if (point) {
                clusterPoints.push(point);
            }
        }
    );

    return clusterPoints;
}

function createAutomaticClusterOffsets(
    requiredCount
) {
    const offsets = [];

    for (
        let radius = 5;
        offsets.length < requiredCount &&
        radius <= 29;
        radius += 6
    ) {
        const ringOffsets = [
            { x: 0, y: -radius },
            { x: radius, y: 0 },
            { x: 0, y: radius },
            { x: -radius, y: 0 },
            { x: -radius, y: -radius },
            { x: radius, y: -radius },
            { x: radius, y: radius },
            { x: -radius, y: radius }
        ];

        for (const offset of ringOffsets) {
            offsets.push(offset);

            if (
                offsets.length >=
                requiredCount
            ) {
                break;
            }
        }
    }

    return offsets.slice(
        0,
        requiredCount
    );
}

function connectAutomaticClusterToHeadquarters(
    clusterPoints,
    hqCenter,
    autoFlagPoints
) {
    if (clusterPoints.length === 0) {
        return;
    }

    let current =
        clusterPoints
            .slice()
            .sort(
                function (first, second) {
                    return (
                        getChebyshevDistance(
                            first,
                            hqCenter
                        ) -
                        getChebyshevDistance(
                            second,
                            hqCenter
                        )
                    );
                }
            )[0];

    let guard = 0;

    while (
        getChebyshevDistance(
            current,
            hqCenter
        ) > 10 &&
        guard < 30
    ) {
        guard++;

        const target = {
            x:
                current.x +
                Math.sign(
                    hqCenter.x - current.x
                ) *
                Math.min(
                    6,
                    Math.abs(
                        hqCenter.x - current.x
                    )
                ),
            y:
                current.y +
                Math.sign(
                    hqCenter.y - current.y
                ) *
                Math.min(
                    6,
                    Math.abs(
                        hqCenter.y - current.y
                    )
                )
        };

        const nextPoint =
            addAutomaticFlagNear(
                target.x,
                target.y,
                autoFlagPoints,
                current
            );

        if (
            !nextPoint ||
            (
                nextPoint.x === current.x &&
                nextPoint.y === current.y
            )
        ) {
            break;
        }

        current = nextPoint;
    }
}

function addAutomaticFlagNear(
    targetX,
    targetY,
    autoFlagPoints,
    previousPoint,
    allowBearPlayerZone = false
) {
    const offsets = [
        [0, 0],
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
        [-2, 0],
        [2, 0],
        [0, -2],
        [0, 2]
    ];

    for (const offset of offsets) {
        const x = targetX + offset[0];
        const y = targetY + offset[1];

        const existingPoint =
            autoFlagPoints.find(
                function (point) {
                    return (
                        point.x === x &&
                        point.y === y
                    );
                }
            );

        if (existingPoint) {
            return existingPoint;
        }

        if (
            previousPoint &&
            getChebyshevDistance(
                previousPoint,
                { x: x, y: y }
            ) > 7
        ) {
            continue;
        }

        if (
            !isAutomaticFlagPositionAvailable(
                x,
                y,
                autoFlagPoints,
                allowBearPlayerZone
            )
        ) {
            continue;
        }

        const point = {
            x: x,
            y: y
        };

        autoFlagPoints.push(point);
        return point;
    }

    return null;
}

function isAutomaticFlagPositionAvailable(
    x,
    y,
    autoFlagPoints,
    allowBearPlayerZone = false
) {
    if (!isInsideGrid(x, y)) {
        return false;
    }

    if (isInsideHeadquarters(x, y)) {
        return false;
    }

    if (
        doesRectangleOverlapBearTrap(
            x,
            y,
            1,
            1
        )
    ) {
        return false;
    }

    if (
        doesRectangleOverlapFixedBuilding(
            x,
            y,
            1,
            1
        )
    ) {
        return false;
    }

    const app = window.AllianceApp;

    const isInsideBearPlayerZone =
        ["bear1", "bear2"].some(
            function (type) {
                const trap =
                    app.state.bearTraps[type];

                if (!trap) {
                    return false;
                }

                const center = {
                    x: trap.x + 1,
                    y: trap.y + 1
                };

                return (
                    getChebyshevDistance(
                        { x: x, y: y },
                        center
                    ) <= 4
                );
            }
        );

    if (
        isInsideBearPlayerZone &&
        !allowBearPlayerZone
    ) {
        return false;
    }

    return !autoFlagPoints.some(
        function (point) {
            return (
                point.x === x &&
                point.y === y
            );
        }
    );
}

function getChebyshevDistance(
    first,
    second
) {
    return Math.max(
        Math.abs(first.x - second.x),
        Math.abs(first.y - second.y)
    );
}

function placeHeadquarters(x, y) {
    const app = window.AllianceApp;

    const width =
        app.settings.headquarters.width || 3;

    const height =
        app.settings.headquarters.height || 3;

    if (
        !canPlaceRectangle(
            x,
            y,
            width,
            height
        )
    ) {
        alert(
            "同盟本部がマップの外にはみ出します。"
        );

        return;
    }

    if (
        doesRectangleOverlapBearTrap(
            x,
            y,
            width,
            height
        )
    ) {
        alert(
            "熊罠と重なる場所には本部を置けません。"
        );
        return;
    }

    if (
        doesRectangleOverlapFixedBuilding(
            x,
            y,
            width,
            height
        )
    ) {
        alert(
            "固定施設と重なる場所には本部を置けません。"
        );
        return;
    }

    const hasFlags =
        app.state.flags.length > 0;

    const hasPlacedPlayers =
        app.state.players.some(
            function (player) {
                return player.isPlaced;
            }
        );

    if (
        hasFlags ||
        hasPlacedPlayers
    ) {
        const shouldReset =
            confirm(
                "同盟本部を置き直すと、旗とプレイヤーの配置がリセットされます。\n" +
                "CSVで読み込んだプレイヤー名は残ります。\n\n" +
                "続けますか？"
            );

        if (!shouldReset) {
            return;
        }
    }

    app.saveHistory();

    app.state.headquarters = {
        x: x,
        y: y
    };

    app.state.flags = [];

    resetPlayerPlacements();

    calculateTerritory();
    renderMap();
    refreshPlayerUi();

    app.autoSave();
}


// ========================================
// 旗を配置
// ========================================

function placeFlag(x, y) {
    const app = window.AllianceApp;

    if (!app.state.headquarters) {
        alert(
            "先に同盟本部を配置してください。"
        );

        return;
    }

    const flagAlreadyExists =
        app.state.flags.some(
            function (flag) {
                return (
                    flag.x === x &&
                    flag.y === y
                );
            }
        );

    if (flagAlreadyExists) {
        alert(
            "この場所にはすでに旗があります。"
        );

        return;
    }

    if (
        isInsideHeadquarters(
            x,
            y
        )
    ) {
        alert(
            "同盟本部の上には旗を置けません。"
        );

        return;
    }

    if (
        isCellOccupiedByPlayer(
            x,
            y
        )
    ) {
        alert(
            "プレイヤーが配置されている場所には旗を置けません。"
        );

        return;
    }

    if (
        doesRectangleOverlapBearTrap(
            x,
            y,
            1,
            1
        )
    ) {
        alert(
            "熊罠の上には旗を置けません。"
        );
        return;
    }

    if (
        doesRectangleOverlapFixedBuilding(
            x,
            y,
            1,
            1
        )
    ) {
        alert(
            "固定施設の上には旗を置けません。"
        );
        return;
    }

    if (
        !doesFlagConnectToTerritory(
            x,
            y
        )
    ) {
        alert(
            "この場所では領地がつながりません。\n" +
            "本部または既存の旗の領地と、重なるか隣接する場所へ置いてください。"
        );

        return;
    }

    const parentId =
        findFlagParentId(
            x,
            y
        );

    app.saveHistory();

    app.state.flags.push({
        id: app.createFlagId(),
        parentId: parentId,
        x: x,
        y: y
    });

    calculateTerritory();
    renderMap();

    app.autoSave();
}

function findFlagParentId(flagX, flagY) {
    const app = window.AllianceApp;

    const flagTerritorySize =
        app.settings.flag.territorySize || 7;

    const flagRadius =
        Math.floor(flagTerritorySize / 2);

    const headquarters =
        app.state.headquarters;

    if (headquarters) {
        const headquartersWidth =
            app.settings.headquarters.width || 3;

        const headquartersHeight =
            app.settings.headquarters.height || 3;

        const headquartersTerritorySize =
            app.settings.headquarters.territorySize || 15;

        const headquartersRadius =
            Math.floor(
                headquartersTerritorySize / 2
            );

        const headquartersCenterX =
            headquarters.x +
            Math.floor(
                headquartersWidth / 2
            );

        const headquartersCenterY =
            headquarters.y +
            Math.floor(
                headquartersHeight / 2
            );

        if (
            squareTerritoriesConnect(
                flagX,
                flagY,
                flagRadius,
                headquartersCenterX,
                headquartersCenterY,
                headquartersRadius
            )
        ) {
            return "hq";
        }
    }

    let nearestFlag = null;
    let nearestDistance = Infinity;

    app.state.flags.forEach(function (flag) {
        const connects =
            squareTerritoriesConnect(
                flagX,
                flagY,
                flagRadius,
                flag.x,
                flag.y,
                flagRadius
            );

        if (!connects) {
            return;
        }

        const distance =
            Math.abs(flagX - flag.x) +
            Math.abs(flagY - flag.y);

        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestFlag = flag;
        }
    });

    return nearestFlag
        ? nearestFlag.id
        : null;
}


function squareTerritoriesConnect(
    firstCenterX,
    firstCenterY,
    firstRadius,
    secondCenterX,
    secondCenterY,
    secondRadius
) {
    const firstLeft =
        firstCenterX - firstRadius;

    const firstRight =
        firstCenterX + firstRadius;

    const firstTop =
        firstCenterY - firstRadius;

    const firstBottom =
        firstCenterY + firstRadius;

    const secondLeft =
        secondCenterX - secondRadius;

    const secondRight =
        secondCenterX + secondRadius;

    const secondTop =
        secondCenterY - secondRadius;

    const secondBottom =
        secondCenterY + secondRadius;

    const horizontalGap =
        Math.max(
            0,
            secondLeft - firstRight - 1,
            firstLeft - secondRight - 1
        );

    const verticalGap =
        Math.max(
            0,
            secondTop - firstBottom - 1,
            firstTop - secondBottom - 1
        );

    return (
        horizontalGap === 0 &&
        verticalGap === 0
    );
}

function getConnectedFlagIds() {
    const app = window.AllianceApp;

    const connectedFlagIds =
        new Set();

    const pendingFlagIds = [];

    const headquarters =
        app.state.headquarters;

    app.state.flags.forEach(
        function (flag) {
            flag.parentId = null;
        }
    );

    if (!headquarters) {
        return connectedFlagIds;
    }

    const headquartersWidth =
        app.settings.headquarters.width || 3;

    const headquartersHeight =
        app.settings.headquarters.height || 3;

    const headquartersTerritorySize =
        app.settings.headquarters.territorySize || 15;

    const headquartersRadius =
        Math.floor(
            headquartersTerritorySize / 2
        );

    const headquartersCenterX =
        headquarters.x +
        Math.floor(
            headquartersWidth / 2
        );

    const headquartersCenterY =
        headquarters.y +
        Math.floor(
            headquartersHeight / 2
        );

    const flagTerritorySize =
        app.settings.flag.territorySize || 7;

    const flagRadius =
        Math.floor(
            flagTerritorySize / 2
        );

    app.state.flags.forEach(
        function (flag) {
            const connectsToHeadquarters =
                squareTerritoriesConnect(
                    flag.x,
                    flag.y,
                    flagRadius,
                    headquartersCenterX,
                    headquartersCenterY,
                    headquartersRadius
                );

            if (!connectsToHeadquarters) {
                return;
            }

            flag.parentId = "hq";

            connectedFlagIds.add(
                flag.id
            );

            pendingFlagIds.push(
                flag.id
            );
        }
    );

    while (pendingFlagIds.length > 0) {
        const currentFlagId =
            pendingFlagIds.shift();

        const currentFlag =
            app.state.flags.find(
                function (flag) {
                    return (
                        flag.id ===
                        currentFlagId
                    );
                }
            );

        if (!currentFlag) {
            continue;
        }

        app.state.flags.forEach(
            function (candidateFlag) {
                if (
                    connectedFlagIds.has(
                        candidateFlag.id
                    )
                ) {
                    return;
                }

                const connects =
                    squareTerritoriesConnect(
                        currentFlag.x,
                        currentFlag.y,
                        flagRadius,
                        candidateFlag.x,
                        candidateFlag.y,
                        flagRadius
                    );

                if (!connects) {
                    return;
                }

                candidateFlag.parentId =
                    currentFlag.id;

                connectedFlagIds.add(
                    candidateFlag.id
                );

                pendingFlagIds.push(
                    candidateFlag.id
                );
            }
        );
    }

    return connectedFlagIds;
}

// ========================================
// プレイヤーを配置
// ========================================

function placePlayer(x, y) {
    const app = window.AllianceApp;

    if (!app.state.headquarters) {
        alert(
            "先に同盟本部を配置してください。"
        );

        return;
    }

    if (
        app.state.players.length === 0
    ) {
        alert(
            "先にプレイヤーCSVを読み込んでください。"
        );

        return;
    }

    if (
        !app.state.selectedPlayerId
    ) {
        alert(
            "プレイヤー一覧から配置するプレイヤーを選んでください。"
        );

        return;
    }

    const player =
        app.state.players.find(
            function (item) {
                return (
                    item.id ===
                    app.state.selectedPlayerId
                );
            }
        );

    if (!player) {
        alert(
            "選択中のプレイヤーが見つかりません。"
        );

        return;
    }

    const width =
        app.settings.player.width || 2;

    const height =
        app.settings.player.height || 2;

    if (
        !canPlaceRectangle(
            x,
            y,
            width,
            height
        )
    ) {
        alert(
            "プレイヤーの2×2がマップの外にはみ出します。"
        );

        return;
    }

    const territoryCellCount =
        countTerritoryCellsInsideRectangle(
            x,
            y,
            width,
            height
        );

    const minimumTerritoryCells =
        app.settings.player
            .minimumTerritoryCells || 2;

    if (
        territoryCellCount <
        minimumTerritoryCells
    ) {
        alert(
            "プレイヤーは2×2のうち、最低2マスが領地内に入る必要があります。\n" +
            `現在は${territoryCellCount}マスだけ領地内です。`
        );

        return;
    }

    if (
        doesRectangleOverlapHeadquarters(
            x,
            y,
            width,
            height
        )
    ) {
        alert(
            "同盟本部と重なる場所には配置できません。"
        );

        return;
    }

    if (
        doesRectangleOverlapFlag(
            x,
            y,
            width,
            height
        )
    ) {
        alert(
            "旗と重なる場所には配置できません。"
        );

        return;
    }

    if (
        doesRectangleOverlapBearTrap(
            x,
            y,
            width,
            height
        )
    ) {
        alert(
            "熊罠と重なる場所には配置できません。"
        );
        return;
    }

    if (
        doesRectangleOverlapFixedBuilding(
            x,
            y,
            width,
            height
        )
    ) {
        alert(
            "固定施設と重なる場所には配置できません。"
        );
        return;
    }

    if (
        doesRectangleOverlapPlayer(
            x,
            y,
            width,
            height,
            player.id
        )
    ) {
        alert(
            "他のプレイヤーと重なる場所には配置できません。"
        );

        return;
    }

    app.saveHistory();

    player.x = x;
    player.y = y;
    player.isPlaced = true;

    selectNextUnplacedPlayer(
        player.id
    );

    renderMap();
    refreshPlayerUi();

    app.autoSave();
}


// ========================================
// 次の未配置プレイヤーを自動選択
// ========================================

function selectNextUnplacedPlayer(currentPlayerId) {
    const app = window.AllianceApp;

    const currentIndex =
        app.state.players.findIndex(function (player) {
            return player.id === currentPlayerId;
        });

    let nextPlayer = null;

    for (
        let index = currentIndex + 1;
        index < app.state.players.length;
        index++
    ) {
        if (!app.state.players[index].isPlaced) {
            nextPlayer = app.state.players[index];
            break;
        }
    }

    if (!nextPlayer) {
        nextPlayer =
            app.state.players.find(function (player) {
                return !player.isPlaced;
            });
    }

    app.state.selectedPlayerId =
        nextPlayer ? nextPlayer.id : null;
}


// ========================================
// プレイヤー配置だけリセット
// ========================================

function resetPlayerPlacements() {
    const app = window.AllianceApp;

    app.state.players.forEach(function (player) {
        player.isPlaced = false;
        player.x = null;
        player.y = null;
    });

    app.state.selectedPlayerId = null;
}

function autoPlacePlayers() {
    const app = window.AllianceApp;

    if (
        !app.state.headquarters ||
        !app.state.bearTraps.bear1 ||
        !app.state.bearTraps.bear2
    ) {
        alert(
            "先に熊罠2つと本部・旗を配置してください。"
        );
        return;
    }

    if (app.state.players.length === 0) {
        alert(
            "先にプレイヤーCSVを読み込んでください。"
        );
        return;
    }

    const hasPlacedPlayers =
        app.state.players.some(
            function (player) {
                return player.isPlaced;
            }
        );

    if (
        hasPlacedPlayers &&
        !confirm(
            "現在のプレイヤー配置を自動配置で置き換えます。\n\n続けますか？"
        )
    ) {
        return;
    }

    app.saveHistory();
    resetPlayerPlacements();

    const priorityOrder = {
        SS: 0,
        S: 1,
        A: 2,
        B: 3,
        C: 4,
        D: 5,
        "": 6
    };

    const sortedPlayers =
        app.state.players
            .map(
                function (player, index) {
                    return {
                        player: player,
                        originalIndex: index
                    };
                }
            )
            .sort(
                function (first, second) {
                    const priorityDifference =
                        (
                            priorityOrder[
                                first.player.priority ||
                                ""
                            ] ?? 6
                        ) -
                        (
                            priorityOrder[
                                second.player.priority ||
                                ""
                            ] ?? 6
                        );

                    if (priorityDifference !== 0) {
                        return priorityDifference;
                    }

                    return (
                        first.originalIndex -
                        second.originalIndex
                    );
                }
            )
            .map(
                function (item) {
                    return item.player;
                }
            );

    const occupiedCells = new Set();

    const candidatesByBear = {
        bear1:
            createAutomaticPlayerCandidates(
                "bear1"
            ),
        bear2:
            createAutomaticPlayerCandidates(
                "bear2"
            )
    };

    const placedByBear = {
        bear1: 0,
        bear2: 0
    };

    let placedCount = 0;

    sortedPlayers.forEach(
        function (player) {
            const preferredBearType =
                app.getPreferredBearType(
                    player
                );

            let bearOrder;

            if (preferredBearType) {
                bearOrder = [
                    preferredBearType,
                    preferredBearType === "bear1"
                        ? "bear2"
                        : "bear1"
                ];
            } else {
                bearOrder = (
                    placedByBear.bear1 <=
                    placedByBear.bear2
                )
                    ? ["bear1", "bear2"]
                    : ["bear2", "bear1"];
            }

            let selectedPlacement = null;
            let selectedBearType = null;

            for (const bearType of bearOrder) {
                selectedPlacement =
                    findAutomaticPlayerPlacement(
                        candidatesByBear[
                            bearType
                        ],
                        occupiedCells,
                        bearType,
                        true
                    );

                if (selectedPlacement) {
                    selectedBearType =
                        bearType;
                    break;
                }
            }

            if (!selectedPlacement) {
                for (const bearType of bearOrder) {
                    selectedPlacement =
                        findAutomaticPlayerPlacement(
                            candidatesByBear[
                                bearType
                            ],
                            occupiedCells,
                            bearType,
                            false
                        );

                    if (selectedPlacement) {
                        selectedBearType =
                            bearType;
                        break;
                    }
                }
            }

            if (!selectedPlacement) {
                return;
            }

            player.x = selectedPlacement.x;
            player.y = selectedPlacement.y;
            player.isPlaced = true;

            markAutomaticPlayerCells(
                selectedPlacement.x,
                selectedPlacement.y,
                occupiedCells
            );

            placedByBear[
                selectedBearType
            ]++;

            placedCount++;
        }
    );

    const nextPlayer =
        sortedPlayers.find(
            function (player) {
                return !player.isPlaced;
            }
        );

    app.state.selectedPlayerId =
        nextPlayer
            ? nextPlayer.id
            : null;

    renderMap();
    refreshPlayerUi();
    app.autoSave();

    const unplacedCount =
        app.state.players.length -
        placedCount;

    const messageElement =
        document.getElementById(
            "auto-player-message"
        );

    if (messageElement) {
        messageElement.textContent =
            `${placedCount}人を自動配置しました。` +
            ` 熊罠1：${placedByBear.bear1}人、` +
            `熊罠2：${placedByBear.bear2}人、` +
            `未配置：${unplacedCount}人。`;
    }
}

function createAutomaticPlayerCandidates(
    bearType
) {
    const app = window.AllianceApp;

    const trap =
        app.state.bearTraps[bearType];

    if (!trap) {
        return [];
    }

    const width =
        app.settings.player.width || 2;

    const height =
        app.settings.player.height || 2;

    const minimumTerritoryCells =
        app.settings.player
            .minimumTerritoryCells || 2;

    const trapCenter = {
        x: trap.x + 1,
        y: trap.y + 1
    };

    const otherBearType =
        bearType === "bear1"
            ? "bear2"
            : "bear1";

    const otherTrap =
        app.state.bearTraps[
            otherBearType
        ];

    const otherCenter =
        otherTrap
            ? {
                x: otherTrap.x + 1,
                y: otherTrap.y + 1
            }
            : null;

    const candidates = [];

    for (
        let y = 0;
        y <= GRID_SIZE - height;
        y++
    ) {
        for (
            let x = 0;
            x <= GRID_SIZE - width;
            x++
        ) {
            if (
                countTerritoryCellsInsideRectangle(
                    x,
                    y,
                    width,
                    height
                ) <
                minimumTerritoryCells
            ) {
                continue;
            }

            if (
                doesRectangleOverlapHeadquarters(
                    x,
                    y,
                    width,
                    height
                ) ||
                doesRectangleOverlapFlag(
                    x,
                    y,
                    width,
                    height
                ) ||
                doesRectangleOverlapBearTrap(
                    x,
                    y,
                    width,
                    height
                ) ||
                doesRectangleOverlapFixedBuilding(
                    x,
                    y,
                    width,
                    height
                )
            ) {
                continue;
            }

            const playerCenter = {
                x: x + (width - 1) / 2,
                y: y + (height - 1) / 2
            };

            const targetDistance =
                getAutomaticPlayerDistance(
                    playerCenter,
                    trapCenter
                );

            const otherDistance =
                otherCenter
                    ? getAutomaticPlayerDistance(
                        playerCenter,
                        otherCenter
                    )
                    : Infinity;

            candidates.push({
                x: x,
                y: y,
                distance: targetDistance,
                belongsToTarget:
                    targetDistance <=
                    otherDistance
            });
        }
    }

    return candidates.sort(
        function (first, second) {
            if (
                first.distance !==
                second.distance
            ) {
                return (
                    first.distance -
                    second.distance
                );
            }

            if (first.y !== second.y) {
                return first.y - second.y;
            }

            return first.x - second.x;
        }
    );
}

function findAutomaticPlayerPlacement(
    candidates,
    occupiedCells,
    bearType,
    targetAreaOnly
) {
    for (const candidate of candidates) {
        if (
            targetAreaOnly &&
            !candidate.belongsToTarget
        ) {
            continue;
        }

        if (
            areAutomaticPlayerCellsFree(
                candidate.x,
                candidate.y,
                occupiedCells
            )
        ) {
            return candidate;
        }
    }

    return null;
}

function areAutomaticPlayerCellsFree(
    x,
    y,
    occupiedCells
) {
    for (
        let offsetY = 0;
        offsetY < 2;
        offsetY++
    ) {
        for (
            let offsetX = 0;
            offsetX < 2;
            offsetX++
        ) {
            if (
                occupiedCells.has(
                    `${x + offsetX},${y + offsetY}`
                )
            ) {
                return false;
            }
        }
    }

    return true;
}

function markAutomaticPlayerCells(
    x,
    y,
    occupiedCells
) {
    for (
        let offsetY = 0;
        offsetY < 2;
        offsetY++
    ) {
        for (
            let offsetX = 0;
            offsetX < 2;
            offsetX++
        ) {
            occupiedCells.add(
                `${x + offsetX},${y + offsetY}`
            );
        }
    }
}

function getAutomaticPlayerDistance(
    first,
    second
) {
    const differenceX =
        first.x - second.x;

    const differenceY =
        first.y - second.y;

    return (
        differenceX * differenceX +
        differenceY * differenceY
    );
}


// ========================================
// プレイヤー関連UIを更新
// ========================================

function refreshPlayerUi() {
    if (typeof renderPlayerList === "function") {
        renderPlayerList();
    }

    if (typeof updatePlayerCounts === "function") {
        updatePlayerCounts();
    }

    if (typeof updateSelectedPlayerDisplay === "function") {
        updateSelectedPlayerDisplay();
    }
}


// ========================================
// 本部内か確認
// ========================================

function isInsideHeadquarters(x, y) {
    const app = window.AllianceApp;
    const headquarters =
        app.state.headquarters;

    if (!headquarters) {
        return false;
    }

    const width =
        app.settings.headquarters.width || 3;

    const height =
        app.settings.headquarters.height || 3;

    return (
        x >= headquarters.x &&
        x < headquarters.x + width &&
        y >= headquarters.y &&
        y < headquarters.y + height
    );
}


// ========================================
// 旗の領地が既存領地とつながるか確認
// ========================================

// ========================================
// 旗の領地が既存領地と接続するか確認
// 重なる場合と、上下左右で隣接する場合を許可
// ========================================

function doesFlagConnectToTerritory(flagX, flagY) {
    const app = window.AllianceApp;

    const territorySize =
        app.settings.flag.territorySize || 7;

    const radius =
        Math.floor(territorySize / 2);

    // 新しい旗の領地になる全マスを確認
    for (
        let y = flagY - radius;
        y <= flagY + radius;
        y++
    ) {
        for (
            let x = flagX - radius;
            x <= flagX + radius;
            x++
        ) {
            if (!isInsideGrid(x, y)) {
                continue;
            }

            // 同じマスで重なっているか確認
            const currentKey =
                app.createCoordinateKey(x, y);

            if (
                app.state.territoryCells.has(
                    currentKey
                )
            ) {
                return true;
            }

            // 上下左右で隣接しているか確認
            const adjacentCells = [
                { x: x - 1, y: y },
                { x: x + 1, y: y },
                { x: x, y: y - 1 },
                { x: x, y: y + 1 }
            ];

            const isAdjacent =
                adjacentCells.some(
                    function (cell) {
                        if (
                            !isInsideGrid(
                                cell.x,
                                cell.y
                            )
                        ) {
                            return false;
                        }

                        const adjacentKey =
                            app.createCoordinateKey(
                                cell.x,
                                cell.y
                            );

                        return (
                            app.state.territoryCells.has(
                                adjacentKey
                            )
                        );
                    }
                );

            if (isAdjacent) {
                return true;
            }
        }
    }

    return false;
}


// ========================================
// 長方形内の領地マス数を数える
// ========================================

function countTerritoryCellsInsideRectangle(
    startX,
    startY,
    width,
    height
) {
    const app = window.AllianceApp;

    let territoryCellCount = 0;

    for (
        let y = startY;
        y < startY + height;
        y++
    ) {
        for (
            let x = startX;
            x < startX + width;
            x++
        ) {
            const key =
                app.createCoordinateKey(x, y);

            if (app.state.territoryCells.has(key)) {
                territoryCellCount++;
            }
        }
    }

    return territoryCellCount;
}


// ========================================
// 本部との重なりを確認
// ========================================

function doesRectangleOverlapHeadquarters(
    x,
    y,
    width,
    height
) {
    const app = window.AllianceApp;
    const headquarters =
        app.state.headquarters;

    if (!headquarters) {
        return false;
    }

    const headquartersWidth =
        app.settings.headquarters.width || 3;

    const headquartersHeight =
        app.settings.headquarters.height || 3;

    return rectanglesOverlap(
        x,
        y,
        width,
        height,
        headquarters.x,
        headquarters.y,
        headquartersWidth,
        headquartersHeight
    );
}


// ========================================
// 旗との重なりを確認
// ========================================

function doesRectangleOverlapFlag(
    x,
    y,
    width,
    height
) {
    const app = window.AllianceApp;

    return app.state.flags.some(function (flag) {
        return rectanglesOverlap(
            x,
            y,
            width,
            height,
            flag.x,
            flag.y,
            1,
            1
        );
    });
}


// ========================================
// 他プレイヤーとの重なりを確認
// ========================================

// ========================================
// 熊罠との重なりを確認する
// ========================================

function doesRectangleOverlapBearTrap(
    x,
    y,
    width,
    height,
    ignoredType
) {
    const app = window.AllianceApp;

    return ["bear1", "bear2"].some(
        function (type) {
            if (type === ignoredType) {
                return false;
            }

            const trap =
                app.state.bearTraps[type];

            if (!trap) {
                return false;
            }

            const settings =
                app.settings[type];

            return rectanglesOverlap(
                x,
                y,
                width,
                height,
                trap.x,
                trap.y,
                settings.width,
                settings.height
            );
        }
    );
}

function doesRectangleOverlapPlayer(
    x,
    y,
    width,
    height,
    ignoredPlayerId
) {
    const app = window.AllianceApp;

    const playerWidth =
        app.settings.player.width || 2;

    const playerHeight =
        app.settings.player.height || 2;

    return app.state.players.some(function (player) {
        if (!player.isPlaced) {
            return false;
        }

        if (player.id === ignoredPlayerId) {
            return false;
        }

        return rectanglesOverlap(
            x,
            y,
            width,
            height,
            player.x,
            player.y,
            playerWidth,
            playerHeight
        );
    });
}

function doesRectangleOverlapFixedBuilding(
    x,
    y,
    width,
    height,
    ignoredType
) {
    const app = window.AllianceApp;

    const fixedWidth =
        app.settings.fixedBuilding.width;

    const fixedHeight =
        app.settings.fixedBuilding.height;

    return app.state.fixedBuildings.some(
        function (building) {
            if (
                building.type ===
                ignoredType
            ) {
                return false;
            }

            return rectanglesOverlap(
                x,
                y,
                width,
                height,
                building.x,
                building.y,
                fixedWidth,
                fixedHeight
            );
        }
    );
}


// ========================================
// 指定マスにプレイヤーがいるか確認
// ========================================

function isCellOccupiedByPlayer(x, y) {
    const app = window.AllianceApp;

    const playerWidth =
        app.settings.player.width || 2;

    const playerHeight =
        app.settings.player.height || 2;

    return app.state.players.some(function (player) {
        if (!player.isPlaced) {
            return false;
        }

        return (
            x >= player.x &&
            x < player.x + playerWidth &&
            y >= player.y &&
            y < player.y + playerHeight
        );
    });
}


// ========================================
// 長方形同士が重なるか確認
// ========================================

function rectanglesOverlap(
    firstX,
    firstY,
    firstWidth,
    firstHeight,
    secondX,
    secondY,
    secondWidth,
    secondHeight
) {
    return !(
        firstX + firstWidth <= secondX ||
        secondX + secondWidth <= firstX ||
        firstY + firstHeight <= secondY ||
        secondY + secondHeight <= firstY
    );
}


// ========================================
// 全領地を計算
// ========================================

function calculateTerritory() {
    const app = window.AllianceApp;

    app.state.territoryCells.clear();

    const headquarters =
        app.state.headquarters;

    if (headquarters) {
        const width =
            app.settings.headquarters.width || 3;

        const height =
            app.settings.headquarters.height || 3;

        const territorySize =
            app.settings.headquarters.territorySize || 15;

        const centerX =
            headquarters.x +
            Math.floor(width / 2);

        const centerY =
            headquarters.y +
            Math.floor(height / 2);

        addSquareTerritory(
            centerX,
            centerY,
            territorySize
        );
    }

    const connectedFlagIds =
        getConnectedFlagIds();

    const flagTerritorySize =
        app.settings.flag.territorySize || 7;

    app.state.flags.forEach(function (flag) {
        if (
            !connectedFlagIds.has(flag.id)
        ) {
            return;
        }

        addSquareTerritory(
            flag.x,
            flag.y,
            flagTerritorySize
        );
    });
}


// ========================================
// 正方形の領地を追加
// ========================================

function addSquareTerritory(
    centerX,
    centerY,
    territorySize
) {
    const app = window.AllianceApp;

    const radius =
        Math.floor(territorySize / 2);

    for (
        let y = centerY - radius;
        y <= centerY + radius;
        y++
    ) {
        for (
            let x = centerX - radius;
            x <= centerX + radius;
            x++
        ) {
            if (!isInsideGrid(x, y)) {
                continue;
            }

            const key =
                app.createCoordinateKey(x, y);

            app.state.territoryCells.add(key);
        }
    }
}


// ========================================
// マップを再描画
// ========================================

function renderMap() {
    const app = window.AllianceApp;

    if (!app) {
        return;
    }

    const allCells =
        document.querySelectorAll(".cell");

    allCells.forEach(function (cell) {
        cell.classList.remove(
            "territory",
            "hq",
            "flag",
            "bear-trap",
            "bear1",
            "bear2",
            "player",
            "disconnected-flag",
            "flag-placeable",
            "flag-drag-source",
            "flag-drag-valid",
            "flag-drag-invalid",
            "player-drag-source",
            "player-drag-valid",
            "player-drag-invalid",
            "player-rank-ss",
            "player-rank-s",
            "player-rank-a",
            "player-rank-b",
            "player-rank-c",
            "player-rank-d",
            "player-rank-unset",
            "fixed-building",
            "fixed-coal",
            "fixed-farm",
            "fixed-lumber",
            "fixed-iron"
        );

        cell.textContent = "";
        cell.title = "";
    });

    app.state.territoryCells.forEach(
        function (coordinateKey) {
            const coordinates =
                coordinateKey.split(",");

            const x =
                Number(coordinates[0]);

            const y =
                Number(coordinates[1]);

            const cell =
                getCell(x, y);

            if (cell) {
                cell.classList.add(
                    "territory"
                );
            }
        }
    );

    renderHeadquarters();
    renderFlags();
    renderBearTraps();
    renderFixedBuildings();
    renderPlayers();
    renderFlagPlacementHints();
    renderFlagConnections();
}

function renderFixedBuildings() {
    const app = window.AllianceApp;

    const layerToggle =
        document.getElementById(
            "layer-fixed"
        );

    if (
        layerToggle &&
        !layerToggle.checked
    ) {
        return;
    }

    const width =
        app.settings.fixedBuilding.width;

    const height =
        app.settings.fixedBuilding.height;

    app.state.fixedBuildings.forEach(
        function (building) {
            const definition =
                getFixedBuildingDefinition(
                    building.type
                );

            if (!definition) {
                return;
            }

            for (
                let y = building.y;
                y < building.y + height;
                y++
            ) {
                for (
                    let x = building.x;
                    x < building.x + width;
                    x++
                ) {
                    const cell =
                        getCell(x, y);

                    if (cell) {
                        cell.classList.add(
                            "fixed-building",
                            `fixed-${building.type}`
                        );
                        cell.title =
                            definition.name;
                    }
                }
            }

            const labelCell =
                getCell(
                    building.x,
                    building.y
                );

            if (labelCell) {
                const label =
                    document.createElement(
                        "span"
                    );

                label.className =
                    "fixed-building-label";

                label.textContent =
                    definition.label;

                labelCell.appendChild(label);
            }
        }
    );
}

// ========================================
// 熊罠を表示する
// ========================================

function renderBearTraps() {
    const app = window.AllianceApp;

    const layerToggle =
        document.getElementById(
            "layer-bears"
        );

    if (
        layerToggle &&
        !layerToggle.checked
    ) {
        return;
    }

    ["bear1", "bear2"].forEach(
        function (type) {
            const trap =
                app.state.bearTraps[type];

            if (!trap) {
                return;
            }

            const settings =
                app.settings[type];

            const label =
                type === "bear1"
                    ? "熊1"
                    : "熊2";

            for (
                let y = trap.y;
                y < trap.y + settings.height;
                y++
            ) {
                for (
                    let x = trap.x;
                    x < trap.x + settings.width;
                    x++
                ) {
                    const cell =
                        getCell(x, y);

                    if (cell) {
                        cell.classList.add(
                            "bear-trap",
                            type
                        );
                        cell.title =
                            type === "bear1"
                                ? "熊罠1"
                                : "熊罠2";
                    }
                }
            }

            const labelCell =
                getCell(
                    trap.x,
                    trap.y
                );

            if (labelCell) {
                const time =
                    app.state
                        .bearTrapTimes[type];

                const labelElement =
                    document.createElement(
                        "span"
                    );

                labelElement.className =
                    "bear-trap-label";

                labelElement.textContent =
                    `${label} ${time} UTC`;

                labelCell.appendChild(
                    labelElement
                );
            }
        }
    );
}


// ========================================
// 本部を表示
// ========================================

function renderHeadquarters() {
    const app = window.AllianceApp;
    const headquarters =
        app.state.headquarters;

    if (!headquarters) {
        return;
    }

    const width =
        app.settings.headquarters.width || 3;

    const height =
        app.settings.headquarters.height || 3;

    for (
        let y = headquarters.y;
        y < headquarters.y + height;
        y++
    ) {
        for (
            let x = headquarters.x;
            x < headquarters.x + width;
            x++
        ) {
            const cell =
                getCell(x, y);

            if (cell) {
                cell.classList.add("hq");
                cell.title = "同盟本部";
            }
        }
    }

    const centerCell =
        getCell(
            headquarters.x + Math.floor(width / 2),
            headquarters.y + Math.floor(height / 2)
        );

    if (centerCell) {
        centerCell.textContent = "HQ";
    }
}


// ========================================
// 旗を表示
// ========================================

function renderFlags() {
    const app = window.AllianceApp;

    const connectedFlagIds =
        getConnectedFlagIds();

    app.state.flags.forEach(
        function (flag) {
            const cell =
                getCell(
                    flag.x,
                    flag.y
                );

            if (!cell) {
                return;
            }

            cell.classList.add(
                "flag"
            );

            if (
                !connectedFlagIds.has(
                    flag.id
                )
            ) {
                cell.classList.add(
                    "disconnected-flag"
                );
            }

            cell.textContent = "F";

            cell.title =
                connectedFlagIds.has(flag.id)
                    ? "同盟旗"
                    : "接続切れの旗";
        }
    );
}

function renderFlagConnections() {
    const app = window.AllianceApp;

    const connectionLayer =
        document.getElementById(
            "flag-connection-layer"
        );

    if (!connectionLayer) {
        return;
    }

    connectionLayer.innerHTML = "";

    const connectionToggle =
        document.getElementById(
            "layer-connections"
        );

    const flagToggle =
        document.getElementById(
            "layer-flags"
        );

    if (
        !connectionToggle ||
        !connectionToggle.checked ||
        (
            flagToggle &&
            !flagToggle.checked
        )
    ) {
        return;
    }

    const headquarters =
        app.state.headquarters;

    const headquartersWidth =
        app.settings.headquarters.width || 3;

    const headquartersHeight =
        app.settings.headquarters.height || 3;

    app.state.flags.forEach(
        function (flag) {
            if (!flag.parentId) {
                return;
            }

            let parentX = null;
            let parentY = null;

            if (
                flag.parentId === "hq" &&
                headquarters
            ) {
                parentX =
                    headquarters.x +
                    Math.floor(
                        headquartersWidth / 2
                    );

                parentY =
                    headquarters.y +
                    Math.floor(
                        headquartersHeight / 2
                    );
            } else {
                const parentFlag =
                    app.state.flags.find(
                        function (item) {
                            return (
                                item.id ===
                                flag.parentId
                            );
                        }
                    );

                if (!parentFlag) {
                    return;
                }

                parentX = parentFlag.x;
                parentY = parentFlag.y;
            }

            const line =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "line"
                );

            line.setAttribute(
                "x1",
                String(parentX * 30 + 15)
            );

            line.setAttribute(
                "y1",
                String(parentY * 30 + 15)
            );

            line.setAttribute(
                "x2",
                String(flag.x * 30 + 15)
            );

            line.setAttribute(
                "y2",
                String(flag.y * 30 + 15)
            );

            line.setAttribute(
                "stroke",
                "#ffd54f"
            );

            line.setAttribute(
                "stroke-width",
                "3"
            );

            line.setAttribute(
                "stroke-linecap",
                "round"
            );

            line.setAttribute(
                "stroke-dasharray",
                "6 4"
            );

            line.setAttribute(
                "opacity",
                "0.9"
            );

            connectionLayer.appendChild(
                line
            );
        }
    );
}

function renderFlagPlacementHints() {
    const app = window.AllianceApp;

    if (!app) {
        return;
    }

    if (flagDragState.active) {
        return;
    }

    if (
        app.state.selectedTool !== "flag"
    ) {
        return;
    }

    if (!app.state.headquarters) {
        return;
    }

    for (
        let y = 0;
        y < GRID_SIZE;
        y++
    ) {
        for (
            let x = 0;
            x < GRID_SIZE;
            x++
        ) {
            if (
                !canShowFlagPlacementHint(
                    x,
                    y
                )
            ) {
                continue;
            }

            const cell =
                getCell(x, y);

            if (!cell) {
                continue;
            }

            cell.classList.add(
                "flag-placeable"
            );

            cell.title =
                "旗を設置できます";
        }
    }
}

function canShowFlagPlacementHint(
    x,
    y
) {
    const app = window.AllianceApp;

    const flagAlreadyExists =
        app.state.flags.some(
            function (flag) {
                return (
                    flag.x === x &&
                    flag.y === y
                );
            }
        );

    if (flagAlreadyExists) {
        return false;
    }

    if (isInsideHeadquarters(x, y)) {
        return false;
    }

    if (isCellOccupiedByPlayer(x, y)) {
        return false;
    }

    if (
        doesRectangleOverlapBearTrap(
            x,
            y,
            1,
            1
        )
    ) {
        return false;
    }

    if (
        doesRectangleOverlapFixedBuilding(
            x,
            y,
            1,
            1
        )
    ) {
        return false;
    }

    if (
        !doesFlagConnectToTerritory(
            x,
            y
        )
    ) {
        return false;
    }

    return true;
}

// ========================================
// プレイヤーを表示
// ========================================

function renderPlayers() {
    const app = window.AllianceApp;

    const width =
        app.settings.player.width || 2;

    const height =
        app.settings.player.height || 2;

    app.state.players.forEach(function (player) {
        if (!player.isPlaced) {
            return;
        }

        const rankClass =
            app.getPlayerRankClass(
                player
            );

        for (
            let y = player.y;
            y < player.y + height;
            y++
        ) {
            for (
                let x = player.x;
                x < player.x + width;
                x++
            ) {
                const cell =
                    getCell(x, y);

                if (cell) {
                    cell.classList.add("player");
                    cell.classList.add(rankClass);
                    cell.title = player.name;
                }
            }
        }

        const nameCell =
            getCell(player.x, player.y);

        if (nameCell) {
            const nameLabel =
                document.createElement("span");

            nameLabel.className =
                "player-name-label";

            nameLabel.classList.add(
                rankClass
            );

            nameLabel.textContent =
                player.name;

            nameCell.appendChild(
                nameLabel
            );
        }
    });
}


// ========================================
// マップ用の短い名前を作る
// ========================================

function createPlayerLabel(playerName) {
    const name =
        String(playerName || "").trim();

    if (name.length <= 3) {
        return name;
    }

    return name.slice(0, 3);
}


// ========================================
// 建物がマップ内に収まるか確認
// ========================================

function canPlaceRectangle(
    x,
    y,
    width,
    height
) {
    return (
        x >= 0 &&
        y >= 0 &&
        x + width <= GRID_SIZE &&
        y + height <= GRID_SIZE
    );
}


// ========================================
// 座標がマップ内か確認
// ========================================

function isInsideGrid(x, y) {
    return (
        x >= 0 &&
        x < GRID_SIZE &&
        y >= 0 &&
        y < GRID_SIZE
    );
}


// ========================================
// 座標表示
// ========================================

function updateCoordinateDisplay(x, y) {
    const coordinateElement =
        document.getElementById("status") ||
        document.getElementById("coordinates") ||
        document.getElementById("coordinate-display");

    if (coordinateElement) {
        coordinateElement.textContent =
            `座標：X ${x + 1} / Y ${y + 1}`;
    }
}
