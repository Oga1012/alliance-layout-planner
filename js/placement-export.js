// =======================================
// ゲーム内配置リスト・CSV書き出し
// =======================================

const placementCoordinateBody =
    document.getElementById(
        "placement-coordinate-body"
    );

const placementCoordinateSummary =
    document.getElementById(
        "placement-coordinate-summary"
    );

const exportPlacementCsvButton =
    document.getElementById(
        "export-placement-csv"
    );


function getPlacementCoordinateRows() {
    const app = window.AllianceApp;
    const rows = [];

    function addRow(
        category,
        name,
        mapX,
        mapY,
        details
    ) {
        const gameCoordinate =
            app.getGameCoordinate(
                mapX,
                mapY
            );

        if (!gameCoordinate) {
            return;
        }

        rows.push({
            category: category,
            name: name,
            mapX: Number(mapX),
            mapY: Number(mapY),
            width:
                details &&
                details.width || 1,
            height:
                details &&
                details.height || 1,
            kingdom:
                gameCoordinate.kingdom,
            x: gameCoordinate.x,
            y: gameCoordinate.y,
            priority:
                details &&
                details.priority || "",
            preferredTime:
                details &&
                details.preferredTime || "",
            note:
                details &&
                details.note || ""
        });
    }

    if (app.state.headquarters) {
        addRow(
            "本部",
            "同盟本部",
            app.state.headquarters.x,
            app.state.headquarters.y,
            {
                width:
                    app.settings.headquarters.width,
                height:
                    app.settings.headquarters.height
            }
        );
    }

    ["bear1", "bear2"].forEach(
        function (type, index) {
            const trap =
                app.state.bearTraps[type];

            if (!trap) {
                return;
            }

            addRow(
                "熊罠",
                `熊罠${index + 1}`,
                trap.x,
                trap.y,
                {
                    width:
                        app.settings[type].width,
                    height:
                        app.settings[type].height,
                    note:
                        `${app.state.bearTrapTimes[type]} UTC`
                }
            );
        }
    );

    app.state.flags.forEach(
        function (flag, index) {
            addRow(
                "旗",
                `旗${index + 1}`,
                flag.x,
                flag.y,
                {
                    note:
                        flag.parentId
                            ? "接続中"
                            : "接続切れ"
                }
            );
        }
    );

    app.state.fixedBuildings.forEach(
        function (building) {
            const definition =
                typeof getFixedBuildingDefinition ===
                "function"
                    ? getFixedBuildingDefinition(
                        building.type
                    )
                    : null;

            addRow(
                "固定施設",
                definition
                    ? definition.name
                    : building.type,
                building.x,
                building.y,
                {
                    width:
                        app.settings.fixedBuilding.width,
                    height:
                        app.settings.fixedBuilding.height
                }
            );
        }
    );

    app.state.players
        .filter(
            function (player) {
                return (
                    player.isPlaced &&
                    Number.isFinite(
                        Number(player.x)
                    ) &&
                    Number.isFinite(
                        Number(player.y)
                    )
                );
            }
        )
        .forEach(
            function (player) {
                addRow(
                    "プレイヤー",
                    player.name,
                    Number(player.x),
                    Number(player.y),
                    {
                        width:
                            app.settings.player.width,
                        height:
                            app.settings.player.height,
                        priority:
                            player.priority || "",
                        preferredTime:
                            player.preferredTime || "",
                        note:
                            [
                                player.allianceRank,
                                player.accountType
                            ]
                                .filter(Boolean)
                                .join(" / ")
                    }
                );
            }
        );

    return rows;
}


function refreshPlacementCoordinateList() {
    if (
        !placementCoordinateBody ||
        !placementCoordinateSummary
    ) {
        return;
    }

    const app = window.AllianceApp;
    const rows =
        getPlacementCoordinateRows();

    placementCoordinateBody.innerHTML = "";

    if (!app.state.headquarters) {
        placementCoordinateSummary.textContent =
            "本部を配置すると座標一覧を表示します。";

        appendPlacementEmptyRow(
            "本部がまだ配置されていません。"
        );

        if (exportPlacementCsvButton) {
            exportPlacementCsvButton.disabled =
                true;
        }

        return;
    }

    const settings =
        app.cloneGameCoordinates(
            app.state.gameCoordinates
        );

    const playerCount =
        rows.filter(
            function (row) {
                return (
                    row.category ===
                    "プレイヤー"
                );
            }
        ).length;

    placementCoordinateSummary.textContent =
        `#${settings.kingdom}・全${rows.length}件（プレイヤー${playerCount}人）`;

    rows.forEach(function (row) {
        const tableRow =
            document.createElement("tr");

        tableRow.className =
            "placement-coordinate-clickable";
        tableRow.tabIndex = 0;
        tableRow.setAttribute(
            "role",
            "button"
        );
        tableRow.setAttribute(
            "aria-label",
            `${row.name}をマップで表示`
        );
        tableRow.title =
            "クリックするとマップ上の位置へ移動します";

        tableRow.addEventListener(
            "click",
            function () {
                focusPlacementOnMap(row);
            }
        );

        tableRow.addEventListener(
            "keydown",
            function (event) {
                if (
                    event.key !== "Enter" &&
                    event.key !== " "
                ) {
                    return;
                }

                event.preventDefault();
                focusPlacementOnMap(row);
            }
        );

        [
            row.category,
            row.name,
            row.x,
            row.y
        ].forEach(function (value, columnIndex) {
            const cell =
                document.createElement("td");

            if (
                row.category === "プレイヤー" &&
                columnIndex === 1
            ) {
                cell.classList.add("i18n-skip");
            }

            cell.textContent =
                String(value);

            tableRow.appendChild(cell);
        });

        placementCoordinateBody.appendChild(
            tableRow
        );
    });

    if (exportPlacementCsvButton) {
        exportPlacementCsvButton.disabled =
            rows.length === 0;
    }
}


function focusPlacementOnMap(row) {
    const mapContainer =
        document.getElementById(
            "map-container"
        );

    if (!mapContainer) {
        return;
    }

    document
        .querySelectorAll(
            ".placement-focus"
        )
        .forEach(function (cell) {
            cell.classList.remove(
                "placement-focus"
            );
        });

    const width =
        Math.max(1, Number(row.width) || 1);
    const height =
        Math.max(1, Number(row.height) || 1);

    for (
        let y = row.mapY;
        y < row.mapY + height;
        y++
    ) {
        for (
            let x = row.mapX;
            x < row.mapX + width;
            x++
        ) {
            const cell =
                typeof getCell === "function"
                    ? getCell(x, y)
                    : null;

            if (cell) {
                cell.classList.add(
                    "placement-focus"
                );
            }
        }
    }

    const cellSize =
        parseFloat(
            getComputedStyle(
                document.documentElement
            ).getPropertyValue(
                "--cell-size"
            )
        ) || 30;

    const targetLeft =
        (row.mapX + width / 2) *
            cellSize -
        mapContainer.clientWidth / 2;

    const targetTop =
        (row.mapY + height / 2) *
            cellSize -
        mapContainer.clientHeight / 2;

    if (
        typeof mapContainer.scrollTo ===
        "function"
    ) {
        mapContainer.scrollTo({
            left: Math.max(0, targetLeft),
            top: Math.max(0, targetTop),
            behavior: "smooth"
        });
    } else {
        mapContainer.scrollLeft =
            Math.max(0, targetLeft);
        mapContainer.scrollTop =
            Math.max(0, targetTop);
    }

    if (placementCoordinateSummary) {
        placementCoordinateSummary.textContent =
            `${row.name}：X${row.x} Y${row.y} を表示しています。`;
    }

    window.setTimeout(
        function () {
            document
                .querySelectorAll(
                    ".placement-focus"
                )
                .forEach(function (cell) {
                    cell.classList.remove(
                        "placement-focus"
                    );
                });
        },
        2600
    );
}


function appendPlacementEmptyRow(message) {
    const tableRow =
        document.createElement("tr");

    const cell =
        document.createElement("td");

    cell.colSpan = 4;
    cell.className =
        "placement-coordinate-empty";
    cell.textContent = message;

    tableRow.appendChild(cell);
    placementCoordinateBody.appendChild(
        tableRow
    );
}


function escapePlacementCsvValue(value) {
    const text =
        String(value ?? "");

    return (
        `"${text.replace(/"/g, '""')}"`
    );
}


function createPlacementCsvFileName() {
    const app = window.AllianceApp;
    const currentLayout =
        typeof app.getCurrentLayout ===
        "function"
            ? app.getCurrentLayout()
            : null;

    const layoutName =
        String(
            currentLayout &&
            currentLayout.name ||
            "layout"
        )
            .replace(/[\\/:*?"<>|]/g, "_")
            .trim() || "layout";

    return `${layoutName}_ゲーム内配置.csv`;
}


function exportPlacementCoordinatesCsv() {
    const app = window.AllianceApp;
    const rows =
        getPlacementCoordinateRows();

    if (
        !app.state.headquarters ||
        rows.length === 0
    ) {
        alert(
            "先に本部と配置物を設定してください。"
        );
        return;
    }

    const header = [
        "種類",
        "名前",
        "王国",
        "X",
        "Y",
        "優先度",
        "希望時間",
        "備考"
    ];

    const csvRows = [header]
        .concat(
            rows.map(function (row) {
                return [
                    row.category,
                    row.name,
                    row.kingdom,
                    row.x,
                    row.y,
                    row.priority,
                    row.preferredTime,
                    row.note
                ];
            })
        )
        .map(function (row) {
            return row
                .map(
                    escapePlacementCsvValue
                )
                .join(",");
        })
        .join("\r\n");

    const blob =
        new Blob(
            ["\uFEFF", csvRows],
            {
                type:
                    "text/csv;charset=utf-8"
            }
        );

    const downloadUrl =
        URL.createObjectURL(blob);

    const downloadLink =
        document.createElement("a");

    downloadLink.href = downloadUrl;
    downloadLink.download =
        createPlacementCsvFileName();

    document.body.appendChild(
        downloadLink
    );
    downloadLink.click();
    downloadLink.remove();

    URL.revokeObjectURL(downloadUrl);

    placementCoordinateSummary.textContent =
        `ゲーム内配置CSVを保存しました（${rows.length}件）。`;
}


if (exportPlacementCsvButton) {
    exportPlacementCsvButton.addEventListener(
        "click",
        exportPlacementCoordinatesCsv
    );
}


window.refreshPlacementCoordinateList =
    refreshPlacementCoordinateList;

window.getPlacementCoordinateRows =
    getPlacementCoordinateRows;
