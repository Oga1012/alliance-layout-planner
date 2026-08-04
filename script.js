const GRID_SIZE = 100;

const MIN_CELL_SIZE = 12;
const MAX_CELL_SIZE = 60;
const DEFAULT_CELL_SIZE = 30;

const grid = document.getElementById("grid");
const mapContainer = document.getElementById("map-container");
const statusDisplay = document.getElementById("status");
const instruction = document.getElementById("instruction");

const zoomInButton = document.getElementById("zoom-in");
const zoomOutButton = document.getElementById("zoom-out");
const zoomDisplay = document.getElementById("zoom-display");
const resetViewButton = document.getElementById("reset-view");
const clearMapButton = document.getElementById("clear-map");

const layerTerritory = document.getElementById("layer-territory");
const layerHq = document.getElementById("layer-hq");

const toolButtons = document.querySelectorAll(".tool-button");

const cells = [];

let selectedTool = "hq";
let cellSize = DEFAULT_CELL_SIZE;

let headquarters = null;
let territoryCells = new Set();

let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let scrollStartLeft = 0;
let scrollStartTop = 0;
let dragDistance = 0;
let suppressNextClick = false;


/* =========================
   100×100マスを作成
========================= */

function createGrid() {
    for (let y = 1; y <= GRID_SIZE; y++) {
        const row = [];

        for (let x = 1; x <= GRID_SIZE; x++) {
            const cell = document.createElement("div");

            cell.className = "cell";

            if (x % 10 === 0) {
                cell.classList.add("major-x");
            }

            if (y % 10 === 0) {
                cell.classList.add("major-y");
            }

            cell.dataset.x = x;
            cell.dataset.y = y;

            cell.title = `X ${x} / Y ${y}`;

            cell.addEventListener("mouseenter", () => {
                showCoordinates(x, y);
                showPlacementPreview(x, y);
            });

            cell.addEventListener("mouseleave", () => {
                clearPlacementPreview();
            });

            cell.addEventListener("click", () => {
                handleCellClick(x, y);
            });

            grid.appendChild(cell);
            row.push(cell);
        }

        cells.push(row);
    }
}


/* =========================
   座標表示
========================= */

function showCoordinates(x, y) {
    statusDisplay.textContent = `座標：X ${x} / Y ${y}`;
}


/* =========================
   ツール選択
========================= */

toolButtons.forEach((button) => {
    button.addEventListener("click", () => {
        if (button.disabled) {
            return;
        }

        selectedTool = button.dataset.tool;

        toolButtons.forEach((item) => {
            item.classList.remove("active");
        });

        button.classList.add("active");

        updateToolMode();
    });
});


function updateToolMode() {
    if (selectedTool === "pan") {
        mapContainer.classList.add("pan-mode");

        instruction.textContent =
            "盤面をドラッグすると、表示位置を移動できます。";

        return;
    }

    mapContainer.classList.remove("pan-mode");

    if (selectedTool === "hq") {
        instruction.textContent =
            "配置したいマスをクリックしてください。クリックしたマスが同盟本部3×3の左上になります。";
    }
}


/* =========================
   セルをクリックしたとき
========================= */

function handleCellClick(x, y) {
    if (suppressNextClick) {
        suppressNextClick = false;
        return;
    }

    if (selectedTool === "pan") {
        return;
    }

    if (selectedTool === "hq") {
        placeHeadquarters(x, y);
    }
}


/* =========================
   本部配置
========================= */

function placeHeadquarters(x, y) {
    const width = 3;
    const height = 3;

    if (!isInsideGrid(x, y, width, height)) {
        alert("本部が盤面の外にはみ出します。");
        return;
    }

    headquarters = {
        x,
        y,
        width,
        height
    };

    createHeadquartersTerritory();
    renderMap();

    instruction.textContent =
        `同盟本部を X ${x} / Y ${y} に配置しました。別の場所をクリックすると置き直せます。`;
}


/* =========================
   本部領地を作成
========================= */

function createHeadquartersTerritory() {
    territoryCells.clear();

    if (!headquarters) {
        return;
    }

    /*
      本部は3×3。
      本部の中心は左上座標から+1マス。

      15×15領地なので、
      中心から上下左右に7マスずつ広げる。
    */

    const centerX = headquarters.x + 1;
    const centerY = headquarters.y + 1;

    const territoryStartX = centerX - 7;
    const territoryStartY = centerY - 7;

    for (let y = territoryStartY; y < territoryStartY + 15; y++) {
        for (let x = territoryStartX; x < territoryStartX + 15; x++) {
            if (x >= 1 && x <= GRID_SIZE &&
                y >= 1 && y <= GRID_SIZE) {

                territoryCells.add(`${x},${y}`);
            }
        }
    }
}


/* =========================
   配置可能範囲の確認
========================= */

function isInsideGrid(x, y, width, height) {
    return (
        x >= 1 &&
        y >= 1 &&
        x + width - 1 <= GRID_SIZE &&
        y + height - 1 <= GRID_SIZE
    );
}


/* =========================
   配置プレビュー
========================= */

function showPlacementPreview(x, y) {
    clearPlacementPreview();

    if (selectedTool !== "hq") {
        return;
    }

    const valid = isInsideGrid(x, y, 3, 3);

    for (let offsetY = 0; offsetY < 3; offsetY++) {
        for (let offsetX = 0; offsetX < 3; offsetX++) {
            const targetX = x + offsetX;
            const targetY = y + offsetY;

            const cell = getCell(targetX, targetY);

            if (!cell) {
                continue;
            }

            if (valid) {
                cell.classList.add("preview-valid");
            } else {
                cell.classList.add("preview-invalid");
            }
        }
    }
}


function clearPlacementPreview() {
    document
        .querySelectorAll(".preview-valid, .preview-invalid")
        .forEach((cell) => {
            cell.classList.remove(
                "preview-valid",
                "preview-invalid"
            );
        });
}


/* =========================
   マップ再描画
========================= */

function renderMap() {
    for (let y = 1; y <= GRID_SIZE; y++) {
        for (let x = 1; x <= GRID_SIZE; x++) {
            const cell = getCell(x, y);

            cell.classList.remove(
                "territory",
                "hq",
                "hq-center"
            );
        }
    }

    if (layerTerritory.checked) {
        territoryCells.forEach((coordinate) => {
            const [x, y] = coordinate
                .split(",")
                .map(Number);

            const cell = getCell(x, y);

            if (cell) {
                cell.classList.add("territory");
            }
        });
    }

    if (layerHq.checked && headquarters) {
        for (let offsetY = 0; offsetY < headquarters.height; offsetY++) {
            for (let offsetX = 0; offsetX < headquarters.width; offsetX++) {
                const targetX = headquarters.x + offsetX;
                const targetY = headquarters.y + offsetY;

                const cell = getCell(targetX, targetY);

                if (cell) {
                    cell.classList.add("hq");
                }
            }
        }

        const centerCell = getCell(
            headquarters.x + 1,
            headquarters.y + 1
        );

        if (centerCell) {
            centerCell.classList.add("hq-center");
        }
    }
}


/* =========================
   セル取得
========================= */

function getCell(x, y) {
    if (
        x < 1 ||
        x > GRID_SIZE ||
        y < 1 ||
        y > GRID_SIZE
    ) {
        return null;
    }

    return cells[y - 1][x - 1];
}


/* =========================
   レイヤー切替
========================= */

layerTerritory.addEventListener("change", renderMap);
layerHq.addEventListener("change", renderMap);


/* =========================
   ズーム
========================= */

function changeZoom(newCellSize, cursorX = null, cursorY = null) {
    newCellSize = Math.max(
        MIN_CELL_SIZE,
        Math.min(MAX_CELL_SIZE, newCellSize)
    );

    const oldCellSize = cellSize;

    const containerRect =
        mapContainer.getBoundingClientRect();

    let localX;
    let localY;

    if (cursorX === null || cursorY === null) {
        localX = mapContainer.clientWidth / 2;
        localY = mapContainer.clientHeight / 2;
    } else {
        localX = cursorX - containerRect.left;
        localY = cursorY - containerRect.top;
    }

    const worldX =
        (mapContainer.scrollLeft + localX) /
        oldCellSize;

    const worldY =
        (mapContainer.scrollTop + localY) /
        oldCellSize;

    cellSize = newCellSize;

    document.documentElement.style.setProperty(
        "--cell-size",
        `${cellSize}px`
    );

    requestAnimationFrame(() => {
        mapContainer.scrollLeft =
            worldX * cellSize - localX;

        mapContainer.scrollTop =
            worldY * cellSize - localY;
    });

    const zoomPercent =
        Math.round(
            (cellSize / DEFAULT_CELL_SIZE) * 100
        );

    zoomDisplay.textContent =
        `${zoomPercent}%`;
}


zoomInButton.addEventListener("click", () => {
    changeZoom(cellSize + 3);
});


zoomOutButton.addEventListener("click", () => {
    changeZoom(cellSize - 3);
});


mapContainer.addEventListener(
    "wheel",
    (event) => {
        event.preventDefault();

        const zoomAmount =
            event.deltaY < 0 ? 2 : -2;

        changeZoom(
            cellSize + zoomAmount,
            event.clientX,
            event.clientY
        );
    },
    {
        passive: false
    }
);


/* =========================
   盤面ドラッグ移動
========================= */

mapContainer.addEventListener("mousedown", (event) => {
    const canDrag =
        selectedTool === "pan" ||
        event.button === 1;

    if (!canDrag) {
        return;
    }

    event.preventDefault();

    isDragging = true;
    dragDistance = 0;

    mapContainer.classList.add("dragging");

    dragStartX = event.clientX;
    dragStartY = event.clientY;

    scrollStartLeft =
        mapContainer.scrollLeft;

    scrollStartTop =
        mapContainer.scrollTop;
});


window.addEventListener("mousemove", (event) => {
    if (!isDragging) {
        return;
    }

    const moveX =
        event.clientX - dragStartX;

    const moveY =
        event.clientY - dragStartY;

    dragDistance +=
        Math.abs(event.movementX) +
        Math.abs(event.movementY);

    mapContainer.scrollLeft =
        scrollStartLeft - moveX;

    mapContainer.scrollTop =
        scrollStartTop - moveY;
});


window.addEventListener("mouseup", () => {
    if (!isDragging) {
        return;
    }

    isDragging = false;

    mapContainer.classList.remove("dragging");

    if (dragDistance > 5) {
        suppressNextClick = true;
    }
});


/* =========================
   表示位置リセット
========================= */

resetViewButton.addEventListener("click", () => {
    changeZoom(DEFAULT_CELL_SIZE);

    requestAnimationFrame(() => {
        mapContainer.scrollLeft = 0;
        mapContainer.scrollTop = 0;
    });
});


/* =========================
   全消去
========================= */

clearMapButton.addEventListener("click", () => {
    const confirmed = confirm(
        "配置した施設と領地をすべて消去しますか？"
    );

    if (!confirmed) {
        return;
    }

    headquarters = null;
    territoryCells.clear();

    renderMap();

    instruction.textContent =
        "配置内容を消去しました。同盟本部を配置してください。";
});


/* =========================
   初期実行
========================= */

createGrid();
renderMap();
updateToolMode();