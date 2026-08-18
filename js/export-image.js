// =======================================
// レイアウトPNG画像書き出し
// =======================================

const exportLayoutPngButton =
    document.getElementById(
        "export-layout-png"
    );


function getLayoutExportBounds() {
    const app = window.AllianceApp;
    const points = [];

    function includeRectangle(
        x,
        y,
        width,
        height
    ) {
        if (
            !Number.isFinite(Number(x)) ||
            !Number.isFinite(Number(y))
        ) {
            return;
        }

        points.push({
            x: Number(x),
            y: Number(y)
        });

        points.push({
            x: Number(x) + width - 1,
            y: Number(y) + height - 1
        });
    }

    app.state.territoryCells.forEach(
        function (key) {
            const parts = key
                .split(",")
                .map(Number);

            if (
                Number.isFinite(parts[0]) &&
                Number.isFinite(parts[1])
            ) {
                points.push({
                    x: parts[0],
                    y: parts[1]
                });
            }
        }
    );

    if (app.state.headquarters) {
        includeRectangle(
            app.state.headquarters.x,
            app.state.headquarters.y,
            app.settings.headquarters.width,
            app.settings.headquarters.height
        );
    }

    app.state.flags.forEach(
        function (flag) {
            includeRectangle(
                flag.x,
                flag.y,
                1,
                1
            );
        }
    );

    ["bear1", "bear2"].forEach(
        function (type) {
            const trap =
                app.state.bearTraps[type];

            if (!trap) {
                return;
            }

            includeRectangle(
                trap.x,
                trap.y,
                app.settings[type].width,
                app.settings[type].height
            );
        }
    );

    app.state.fixedBuildings.forEach(
        function (building) {
            includeRectangle(
                building.x,
                building.y,
                app.settings.fixedBuilding.width,
                app.settings.fixedBuilding.height
            );
        }
    );

    app.state.players.forEach(
        function (player) {
            if (!player.isPlaced) {
                return;
            }

            includeRectangle(
                player.x,
                player.y,
                app.settings.player.width,
                app.settings.player.height
            );
        }
    );

    if (points.length === 0) {
        return null;
    }

    const gridSize =
        app.settings.gridSize;
    const margin = 2;

    return {
        minX: Math.max(
            0,
            Math.min.apply(
                null,
                points.map(
                    function (point) {
                        return point.x;
                    }
                )
            ) - margin
        ),
        minY: Math.max(
            0,
            Math.min.apply(
                null,
                points.map(
                    function (point) {
                        return point.y;
                    }
                )
            ) - margin
        ),
        maxX: Math.min(
            gridSize - 1,
            Math.max.apply(
                null,
                points.map(
                    function (point) {
                        return point.x;
                    }
                )
            ) + margin
        ),
        maxY: Math.min(
            gridSize - 1,
            Math.max.apply(
                null,
                points.map(
                    function (point) {
                        return point.y;
                    }
                )
            ) + margin
        )
    };
}


function exportLayoutAsPng() {
    const app = window.AllianceApp;

    if (!app.state.headquarters) {
        alert(
            "先に同盟本部を配置してください。"
        );
        return;
    }

    const bounds =
        getLayoutExportBounds();

    if (!bounds) {
        alert(
            "画像にする配置データがありません。"
        );
        return;
    }

    const cellSize = 28;
    const leftMargin = 58;
    const rightMargin = 18;
    const headerHeight = 82;
    const bottomHeight = 58;
    const gridWidth =
        (bounds.maxX - bounds.minX + 1) *
        cellSize;
    const gridHeight =
        (bounds.maxY - bounds.minY + 1) *
        cellSize;

    const canvas =
        document.createElement("canvas");

    canvas.width =
        leftMargin +
        gridWidth +
        rightMargin;
    canvas.height =
        headerHeight +
        gridHeight +
        bottomHeight;

    const context =
        canvas.getContext("2d");

    if (!context) {
        alert(
            "PNG画像を作成できませんでした。"
        );
        return;
    }

    drawLayoutExport(
        context,
        canvas,
        bounds,
        {
            cellSize: cellSize,
            leftMargin: leftMargin,
            headerHeight: headerHeight,
            gridWidth: gridWidth,
            gridHeight: gridHeight
        }
    );

    canvas.toBlob(
        function (blob) {
            if (!blob) {
                alert(
                    "PNG画像を作成できませんでした。"
                );
                return;
            }

            const downloadUrl =
                URL.createObjectURL(blob);
            const downloadLink =
                document.createElement("a");

            downloadLink.href = downloadUrl;
            downloadLink.download =
                createLayoutPngFileName();

            document.body.appendChild(
                downloadLink
            );
            downloadLink.click();
            downloadLink.remove();

            URL.revokeObjectURL(
                downloadUrl
            );

            const summary =
                document.getElementById(
                    "placement-coordinate-summary"
                );

            if (summary) {
                summary.textContent =
                    "レイアウトのPNG画像を保存しました。";
            }
        },
        "image/png"
    );
}


function drawLayoutExport(
    context,
    canvas,
    bounds,
    options
) {
    const app = window.AllianceApp;
    const cellSize = options.cellSize;
    const left = options.leftMargin;
    const top = options.headerHeight;

    context.fillStyle = "#f8fafc";
    context.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    drawExportHeader(
        context,
        canvas.width
    );

    for (
        let y = bounds.minY;
        y <= bounds.maxY;
        y++
    ) {
        for (
            let x = bounds.minX;
            x <= bounds.maxX;
            x++
        ) {
            const drawX =
                left +
                (x - bounds.minX) *
                cellSize;
            const drawY =
                top +
                (y - bounds.minY) *
                cellSize;

            context.fillStyle =
                app.state.territoryCells.has(
                    app.createCoordinateKey(
                        x,
                        y
                    )
                )
                    ? "#d9f7df"
                    : "#ffffff";

            context.fillRect(
                drawX,
                drawY,
                cellSize,
                cellSize
            );
        }
    }

    drawExportGrid(
        context,
        bounds,
        options
    );

    drawExportHeadquarters(
        context,
        bounds,
        options
    );
    drawExportBearTraps(
        context,
        bounds,
        options
    );
    drawExportFixedBuildings(
        context,
        bounds,
        options
    );
    drawExportFlags(
        context,
        bounds,
        options
    );
    drawExportPlayers(
        context,
        bounds,
        options
    );
    drawExportGameAxes(
        context,
        bounds,
        options
    );
    drawExportLegend(
        context,
        canvas,
        options
    );
}


function getExportRectangle(
    x,
    y,
    width,
    height,
    bounds,
    options
) {
    return {
        x:
            options.leftMargin +
            (x - bounds.minX) *
            options.cellSize,
        y:
            options.headerHeight +
            (y - bounds.minY) *
            options.cellSize,
        width:
            width * options.cellSize,
        height:
            height * options.cellSize
    };
}


function drawExportHeader(
    context,
    canvasWidth
) {
    const app = window.AllianceApp;
    const layout =
        typeof app.getCurrentLayout ===
        "function"
            ? app.getCurrentLayout()
            : null;
    const settings =
        app.cloneGameCoordinates(
            app.state.gameCoordinates
        );

    context.fillStyle = "#172033";
    context.fillRect(
        0,
        0,
        canvasWidth,
        64
    );

    context.fillStyle = "#ffffff";
    context.font =
        'bold 24px "Yu Gothic", Meiryo, sans-serif';
    context.textBaseline = "middle";
    context.fillText(
        layout && layout.name
            ? layout.name
            : "同盟レイアウト",
        18,
        24
    );

    context.fillStyle = "#bfdbfe";
    context.font =
        '14px "Yu Gothic", Meiryo, sans-serif';
    context.fillText(
        `王国 #${settings.kingdom}　同盟本部 X${settings.headquartersX} Y${settings.headquartersY}`,
        18,
        48
    );
}


function drawExportGrid(
    context,
    bounds,
    options
) {
    const left = options.leftMargin;
    const top = options.headerHeight;
    const width = options.gridWidth;
    const height = options.gridHeight;
    const cellSize = options.cellSize;

    context.lineWidth = 1;

    for (
        let x = bounds.minX;
        x <= bounds.maxX + 1;
        x++
    ) {
        const drawX =
            left +
            (x - bounds.minX) *
            cellSize;

        context.strokeStyle =
            x % 5 === 0
                ? "#94a3b8"
                : "#d8dee6";
        context.beginPath();
        context.moveTo(drawX, top);
        context.lineTo(
            drawX,
            top + height
        );
        context.stroke();
    }

    for (
        let y = bounds.minY;
        y <= bounds.maxY + 1;
        y++
    ) {
        const drawY =
            top +
            (y - bounds.minY) *
            cellSize;

        context.strokeStyle =
            y % 5 === 0
                ? "#94a3b8"
                : "#d8dee6";
        context.beginPath();
        context.moveTo(left, drawY);
        context.lineTo(
            left + width,
            drawY
        );
        context.stroke();
    }

    context.strokeStyle = "#475569";
    context.lineWidth = 2;
    context.strokeRect(
        left,
        top,
        width,
        height
    );
}


function drawExportGameAxes(
    context,
    bounds,
    options
) {
    const app = window.AllianceApp;
    const cellSize = options.cellSize;

    context.fillStyle = "#334155";
    context.font =
        '10px "Yu Gothic", Meiryo, sans-serif';

    for (
        let x = bounds.minX;
        x <= bounds.maxX;
        x++
    ) {
        if (
            x !== bounds.minX &&
            x % 5 !== 0
        ) {
            continue;
        }

        const coordinate =
            app.getGameCoordinate(
                x,
                bounds.minY
            );

        context.textAlign = "center";
        context.textBaseline = "bottom";
        context.fillText(
            `X${coordinate.x}`,
            options.leftMargin +
                (x - bounds.minX + 0.5) *
                cellSize,
            options.headerHeight - 3
        );
    }

    for (
        let y = bounds.minY;
        y <= bounds.maxY;
        y++
    ) {
        if (
            y !== bounds.minY &&
            y % 5 !== 0
        ) {
            continue;
        }

        const coordinate =
            app.getGameCoordinate(
                bounds.minX,
                y
            );

        context.textAlign = "right";
        context.textBaseline = "middle";
        context.fillText(
            `Y${coordinate.y}`,
            options.leftMargin - 5,
            options.headerHeight +
                (y - bounds.minY + 0.5) *
                cellSize
        );
    }
}


function drawExportBlock(
    context,
    rectangle,
    fillColor,
    borderColor,
    label,
    textColor
) {
    context.fillStyle = fillColor;
    context.fillRect(
        rectangle.x + 1,
        rectangle.y + 1,
        rectangle.width - 2,
        rectangle.height - 2
    );

    context.strokeStyle = borderColor;
    context.lineWidth = 2;
    context.strokeRect(
        rectangle.x + 1,
        rectangle.y + 1,
        rectangle.width - 2,
        rectangle.height - 2
    );

    context.save();
    context.beginPath();
    context.rect(
        rectangle.x + 3,
        rectangle.y + 3,
        rectangle.width - 6,
        rectangle.height - 6
    );
    context.clip();

    context.fillStyle =
        textColor || "#ffffff";
    context.font =
        'bold 12px "Yu Gothic", Meiryo, sans-serif';
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(
        fitExportText(
            context,
            label,
            rectangle.width - 8
        ),
        rectangle.x +
            rectangle.width / 2,
        rectangle.y +
            rectangle.height / 2
    );

    context.restore();
}


function fitExportText(
    context,
    text,
    maxWidth
) {
    const value = String(text || "");

    if (
        context.measureText(value).width <=
        maxWidth
    ) {
        return value;
    }

    let shortened = value;

    while (
        shortened.length > 1 &&
        context.measureText(
            `${shortened}…`
        ).width > maxWidth
    ) {
        shortened =
            shortened.slice(0, -1);
    }

    return `${shortened}…`;
}


function drawExportHeadquarters(
    context,
    bounds,
    options
) {
    const app = window.AllianceApp;
    const headquarters =
        app.state.headquarters;

    if (!headquarters) {
        return;
    }

    drawExportBlock(
        context,
        getExportRectangle(
            headquarters.x,
            headquarters.y,
            app.settings.headquarters.width,
            app.settings.headquarters.height,
            bounds,
            options
        ),
        "#2563eb",
        "#1e3a8a",
        "同盟本部",
        "#ffffff"
    );
}


function drawExportFlags(
    context,
    bounds,
    options
) {
    const app = window.AllianceApp;

    app.state.flags.forEach(
        function (flag, index) {
            const connected =
                Boolean(flag.parentId);

            drawExportBlock(
                context,
                getExportRectangle(
                    flag.x,
                    flag.y,
                    1,
                    1,
                    bounds,
                    options
                ),
                connected
                    ? "#f59e0b"
                    : "#ffffff",
                connected
                    ? "#b45309"
                    : "#dc2626",
                String(index + 1),
                connected
                    ? "#ffffff"
                    : "#111827"
            );
        }
    );
}


function drawExportBearTraps(
    context,
    bounds,
    options
) {
    const app = window.AllianceApp;

    ["bear1", "bear2"].forEach(
        function (type, index) {
            const trap =
                app.state.bearTraps[type];

            if (!trap) {
                return;
            }

            drawExportBlock(
                context,
                getExportRectangle(
                    trap.x,
                    trap.y,
                    app.settings[type].width,
                    app.settings[type].height,
                    bounds,
                    options
                ),
                index === 0
                    ? "#7c3aed"
                    : "#be123c",
                index === 0
                    ? "#4c1d95"
                    : "#881337",
                `熊罠${index + 1} ${app.state.bearTrapTimes[type]}`,
                "#ffffff"
            );
        }
    );
}


function drawExportFixedBuildings(
    context,
    bounds,
    options
) {
    const app = window.AllianceApp;
    const colors = {
        coal: "#475569",
        farm: "#16a34a",
        lumber: "#a16207",
        iron: "#64748b"
    };

    app.state.fixedBuildings.forEach(
        function (building) {
            const definition =
                typeof getFixedBuildingDefinition ===
                "function"
                    ? getFixedBuildingDefinition(
                        building.type
                    )
                    : null;

            drawExportBlock(
                context,
                getExportRectangle(
                    building.x,
                    building.y,
                    app.settings.fixedBuilding.width,
                    app.settings.fixedBuilding.height,
                    bounds,
                    options
                ),
                colors[building.type] ||
                    "#64748b",
                "#334155",
                definition
                    ? definition.label
                    : building.type,
                "#ffffff"
            );
        }
    );
}


function drawExportPlayers(
    context,
    bounds,
    options
) {
    const app = window.AllianceApp;
    const colors = {
        SS: "#facc15",
        S: "#fb7185",
        A: "#c084fc",
        B: "#60a5fa",
        C: "#34d399",
        D: "#94a3b8",
        "": "#e2e8f0"
    };

    app.state.players.forEach(
        function (player) {
            if (!player.isPlaced) {
                return;
            }

            const priority =
                String(
                    player.priority || ""
                ).toUpperCase();

            drawExportBlock(
                context,
                getExportRectangle(
                    player.x,
                    player.y,
                    app.settings.player.width,
                    app.settings.player.height,
                    bounds,
                    options
                ),
                colors[priority] ||
                    colors[""],
                "#334155",
                player.name,
                "#172033"
            );
        }
    );
}


function drawExportLegend(
    context,
    canvas,
    options
) {
    const items = [
        ["#d9f7df", "領地"],
        ["#2563eb", "本部"],
        ["#f59e0b", "旗"],
        ["#7c3aed", "熊罠"],
        ["#facc15", "プレイヤー（ランク色）"]
    ];
    const y =
        options.headerHeight +
        options.gridHeight +
        28;
    let x = options.leftMargin;

    context.font =
        '12px "Yu Gothic", Meiryo, sans-serif';
    context.textBaseline = "middle";
    context.textAlign = "left";

    items.forEach(function (item) {
        context.fillStyle = item[0];
        context.fillRect(
            x,
            y - 7,
            14,
            14
        );
        context.strokeStyle = "#64748b";
        context.strokeRect(
            x,
            y - 7,
            14,
            14
        );

        context.fillStyle = "#334155";
        context.fillText(
            item[1],
            x + 19,
            y
        );

        x +=
            29 +
            context.measureText(
                item[1]
            ).width;

        if (x > canvas.width - 180) {
            return;
        }
    });
}


function createLayoutPngFileName() {
    const app = window.AllianceApp;
    const layout =
        typeof app.getCurrentLayout ===
        "function"
            ? app.getCurrentLayout()
            : null;
    const name =
        String(
            layout && layout.name ||
            "layout"
        )
            .replace(/[\\/:*?"<>|]/g, "_")
            .trim() || "layout";

    return `${name}_同盟レイアウト.png`;
}


if (exportLayoutPngButton) {
    exportLayoutPngButton.addEventListener(
        "click",
        exportLayoutAsPng
    );
}


window.exportLayoutAsPng =
    exportLayoutAsPng;
