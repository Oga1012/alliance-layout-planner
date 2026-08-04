// =======================================
// アプリ全体の設定・状態
// =======================================

window.AllianceApp = {
    settings: {
        gridSize: 100,

        headquarters: {
            width: 3,
            height: 3,
            territorySize: 15
        },

        flag: {
            width: 1,
            height: 1,
            territorySize: 7
        },

        player: {
            width: 2,
            height: 2,
            minimumTerritoryCells: 2
        },

        bear1: {
            width: 3,
            height: 3
        },

        bear2: {
            width: 3,
            height: 3
        },

        fixedBuilding: {
            width: 2,
            height: 2
        }
    },

    state: {
    // 現在選択している配置ツール
    selectedTool: "hq",

    // 現在表示中のレイアウト
    headquarters: null,
    flags: [],
    bearTraps: {
        bear1: null,
        bear2: null
    },
    fixedBuildings: [],
    bearTrapTimes: {
        bear1: "12:00",
        bear2: "13:00"
    },
    hqDirection: "east",
    territoryCells: new Set(),

    // プレイヤー名簿は全レイアウト共通
    players: [],
    selectedPlayerId: null,

    // 複数レイアウト
    layouts: [],

    // 現在開いているレイアウトID
    currentLayoutId: null,

    // Undo用の履歴
    history: [],

    // Redo用の履歴
    redoHistory: []
}
};


// =======================================
// 座標を「X,Y」の文字列にする
// =======================================

window.AllianceApp.createCoordinateKey = function (x, y) {
    return `${x},${y}`;
};


// =======================================
// 施設がマップ内に収まるか確認する
// =======================================

window.AllianceApp.isInsideGrid = function (
    x,
    y,
    width,
    height
) {
    const gridSize =
        window.AllianceApp.settings.gridSize;

    return (
        x >= 0 &&
        y >= 0 &&
        x + width <= gridSize &&
        y + height <= gridSize
    );
};


// =======================================
// 一意のIDを作る
// =======================================

window.AllianceApp.createUniqueId = function (prefix) {
    const randomText =
        Math.random()
            .toString(36)
            .slice(2, 10);

    return (
        `${prefix}-${Date.now()}-${randomText}`
    );
};


// =======================================
// プレイヤーIDを作る
// =======================================

window.AllianceApp.createPlayerId = function (index) {
    return window.AllianceApp.createUniqueId(
        `player-${index}`
    );
};


// =======================================
// レイアウトIDを作る
// =======================================

window.AllianceApp.createLayoutId = function () {
    return window.AllianceApp.createUniqueId(
        "layout"
    );
};


// =======================================
// 旗IDを作る
// =======================================

window.AllianceApp.createFlagId = function () {
    return window.AllianceApp.createUniqueId(
        "flag"
    );
};


// =======================================
// プレイヤー名を整える
// =======================================

window.AllianceApp.normalizePlayerName = function (name) {
    return String(name || "")
        .replace(/^\uFEFF/, "")
        .trim();
};

window.AllianceApp.normalizePlayerData =
    function (player) {
        const source =
            player || {};

        const priority =
            String(
                source.priority || ""
            )
                .trim()
                .toUpperCase();

        return {
            id: source.id,
            name:
                window.AllianceApp
                    .normalizePlayerName(
                        source.name
                    ),
            priority:
                [
                    "SS",
                    "S",
                    "A",
                    "B",
                    "C",
                    "D"
                ].includes(priority)
                    ? priority
                    : "",
            preferredTime:
                String(
                    source.preferredTime || ""
                ).trim(),
            allianceRank:
                String(
                    source.allianceRank || ""
                ).trim(),
            accountType:
                String(
                    source.accountType || ""
                ).trim(),
            isPlaced:
                source.isPlaced === true,
            x:
                source.x ?? null,
            y:
                source.y ?? null
        };
    };

window.AllianceApp.getPlayerRankClass =
    function (player) {
        const priority =
            String(
                player &&
                player.priority ||
                ""
            )
                .trim()
                .toLowerCase();

        return priority
            ? `player-rank-${priority}`
            : "player-rank-unset";
    };

window.AllianceApp.timeToMinutes =
    function (timeText) {
        const matched =
            String(timeText || "")
                .trim()
                .match(
                    /^(\d{1,2}):(\d{2})$/
                );

        if (!matched) {
            return null;
        }

        const hours =
            Number(matched[1]);

        const minutes =
            Number(matched[2]);

        if (
            hours < 0 ||
            hours > 23 ||
            minutes < 0 ||
            minutes > 59
        ) {
            return null;
        }

        return hours * 60 + minutes;
    };

window.AllianceApp.getPreferredBearType =
    function (player) {
        const app =
            window.AllianceApp;

        const preferredMinutes =
            app.timeToMinutes(
                player &&
                player.preferredTime
            );

        if (preferredMinutes === null) {
            return null;
        }

        function circularDistance(
            first,
            second
        ) {
            const difference =
                Math.abs(first - second);

            return Math.min(
                difference,
                1440 - difference
            );
        }

        const bear1Minutes =
            app.timeToMinutes(
                app.state
                    .bearTrapTimes.bear1
            );

        const bear2Minutes =
            app.timeToMinutes(
                app.state
                    .bearTrapTimes.bear2
            );

        if (
            bear1Minutes === null ||
            bear2Minutes === null
        ) {
            return null;
        }

        return (
            circularDistance(
                preferredMinutes,
                bear1Minutes
            ) <=
            circularDistance(
                preferredMinutes,
                bear2Minutes
            )
        )
            ? "bear1"
            : "bear2";
    };


// =======================================
// レイアウト名を整える
// =======================================

window.AllianceApp.normalizeLayoutName = function (name) {
    const normalizedName =
        String(name || "").trim();

    if (!normalizedName) {
        return "名称未設定";
    }

    return normalizedName;
};


// =======================================
// プレイヤー人数を取得
// =======================================

window.AllianceApp.getPlayerCounts = function () {
    const players =
        window.AllianceApp.state.players;

    const total =
        players.length;

    const placed =
        players.filter(function (player) {
            return player.isPlaced === true;
        }).length;

    return {
        total: total,
        placed: placed,
        unplaced: total - placed
    };
};


// =======================================
// 本部データを複製する
// =======================================

window.AllianceApp.cloneHeadquarters = function (
    headquarters
) {
    if (!headquarters) {
        return null;
    }

    return {
        x: headquarters.x,
        y: headquarters.y
    };
};

// =======================================
// 熊罠データを複製する
// =======================================

window.AllianceApp.cloneBearTraps = function (
    bearTraps
) {
    const source =
        bearTraps || {};

    function cloneTrap(trap) {
        if (!trap) {
            return null;
        }

        return {
            x: Number(trap.x),
            y: Number(trap.y)
        };
    }

    return {
        bear1: cloneTrap(source.bear1),
        bear2: cloneTrap(source.bear2)
    };
};

window.AllianceApp.cloneFixedBuildings =
    function (fixedBuildings) {
        const validTypes =
            new Set([
                "coal",
                "farm",
                "lumber",
                "iron"
            ]);

        return (
            Array.isArray(fixedBuildings)
                ? fixedBuildings
                : []
        )
            .filter(
                function (building) {
                    return (
                        building &&
                        validTypes.has(
                            building.type
                        )
                    );
                }
            )
            .map(
                function (building) {
                    return {
                        type: building.type,
                        x: Number(building.x),
                        y: Number(building.y)
                    };
                }
            );
    };

window.AllianceApp.cloneBearTrapTimes = function (
    bearTrapTimes
) {
    const source =
        bearTrapTimes || {};

    return {
        bear1:
            String(
                source.bear1 || "12:00"
            ),
        bear2:
            String(
                source.bear2 || "13:00"
            )
    };
};


// =======================================
// 旗データを正しい形式に整える
// =======================================

window.AllianceApp.normalizeFlagData = function (
    flag
) {
    if (!flag) {
        return null;
    }

    const app =
        window.AllianceApp;

    return {
        id:
            flag.id ||
            app.createFlagId(),

        parentId:
            flag.parentId ||
            null,

        x:
            Number(flag.x),

        y:
            Number(flag.y)
    };
};


// =======================================
// 旗データを複製する
// =======================================

window.AllianceApp.cloneFlags = function (flags) {
    const app =
        window.AllianceApp;

    return (flags || [])
        .map(function (flag) {
            return app.normalizeFlagData(flag);
        })
        .filter(function (flag) {
            return flag !== null;
        });
};


// =======================================
// IDから旗を取得する
// =======================================

window.AllianceApp.getFlagById = function (
    flagId
) {
    if (!flagId) {
        return null;
    }

    return (
        window.AllianceApp.state.flags.find(
            function (flag) {
                return flag.id === flagId;
            }
        ) || null
    );
};


// =======================================
// 指定した旗につながる子旗を取得する
// =======================================

window.AllianceApp.getChildFlags = function (
    parentId
) {
    return window.AllianceApp.state.flags.filter(
        function (flag) {
            return flag.parentId === parentId;
        }
    );
};


// =======================================
// 指定した旗に子旗があるか確認する
// =======================================

window.AllianceApp.hasChildFlags = function (
    flagId
) {
    return (
        window.AllianceApp.getChildFlags(
            flagId
        ).length > 0
    );
};


// =======================================
// 旗の接続先を設定する
// =======================================

window.AllianceApp.setFlagParent = function (
    flagId,
    parentId
) {
    const app =
        window.AllianceApp;

    const flag =
        app.getFlagById(flagId);

    if (!flag) {
        return false;
    }

    if (flagId === parentId) {
        return false;
    }

    if (
        parentId !== null &&
        parentId !== "hq" &&
        !app.getFlagById(parentId)
    ) {
        return false;
    }

    flag.parentId =
        parentId || null;

    return true;
};


// =======================================
// 現在のプレイヤー配置を取得する
// =======================================

window.AllianceApp.getCurrentPlayerPlacements =
    function () {
        const players =
            window.AllianceApp.state.players;

        return players
            .filter(function (player) {
                return player.isPlaced === true;
            })
            .map(function (player) {
                return {
                    playerId: player.id,
                    x: player.x,
                    y: player.y
                };
            });
    };

// =======================================
// プレイヤー配置データを複製する
// =======================================

window.AllianceApp.clonePlayerPlacements =
    function (playerPlacements) {
        return (playerPlacements || []).map(
            function (placement) {
                return {
                    playerId: placement.playerId,
                    x: placement.x,
                    y: placement.y
                };
            }
        );
    };


// =======================================
// 新しい空のレイアウトデータを作る
// =======================================

window.AllianceApp.createEmptyLayout =
    function (layoutName) {
        return {
            id: window.AllianceApp.createLayoutId(),

            name:
                window.AllianceApp.normalizeLayoutName(
                    layoutName
                ),

            headquarters: null,

            flags: [],

            bearTraps: {
                bear1: null,
                bear2: null
            },

            fixedBuildings: [],

            bearTrapTimes: {
                bear1: "12:00",
                bear2: "13:00"
            },

            hqDirection: "east",

            playerPlacements: [],

            createdAt:
                new Date().toISOString(),

            updatedAt:
                new Date().toISOString()
        };
    };


// =======================================
// 現在のレイアウトを取得する
// =======================================

window.AllianceApp.getCurrentLayout = function () {
    const app =
        window.AllianceApp;

    return (
        app.state.layouts.find(
            function (layout) {
                return (
                    layout.id ===
                    app.state.currentLayoutId
                );
            }
        ) || null
    );
};


// =======================================
// IDからレイアウトを取得する
// =======================================

window.AllianceApp.getLayoutById = function (
    layoutId
) {
    return (
        window.AllianceApp.state.layouts.find(
            function (layout) {
                return layout.id === layoutId;
            }
        ) || null
    );
};

// =======================================
// 現在の配置状態のスナップショットを作る
// =======================================

window.AllianceApp.createHistorySnapshot =
    function () {
        const app =
            window.AllianceApp;

        return {
            layoutId:
                app.state.currentLayoutId,

            headquarters:
                app.cloneHeadquarters(
                    app.state.headquarters
                ),

            flags:
                app.cloneFlags(
                    app.state.flags
                ),

            bearTraps:
                app.cloneBearTraps(
                    app.state.bearTraps
                ),

            fixedBuildings:
                app.cloneFixedBuildings(
                    app.state.fixedBuildings
                ),

            bearTrapTimes:
                app.cloneBearTrapTimes(
                    app.state.bearTrapTimes
                ),

            hqDirection:
                app.state.hqDirection ||
                "east",

            players:
                app.state.players.map(
                    function (player) {
                        return {
                            id: player.id,
                            name: player.name,
                            priority:
                                player.priority || "",
                            preferredTime:
                                player.preferredTime || "",
                            allianceRank:
                                player.allianceRank || "",
                            accountType:
                                player.accountType || "",
                            x: player.x,
                            y: player.y,
                            isPlaced:
                                player.isPlaced
                        };
                    }
                ),

            selectedPlayerId:
                app.state.selectedPlayerId
        };
    };

// =======================================
// 現在の配置状態を履歴へ保存する
// =======================================

window.AllianceApp.saveHistory =
    function () {
        const app =
            window.AllianceApp;

        const snapshot =
            app.createHistorySnapshot();

        app.state.history.push(
            snapshot
        );

        if (
            app.state.history.length > 50
        ) {
            app.state.history.shift();
        }

        app.state.redoHistory = [];
    };

// =======================================
// 履歴の状態を画面へ反映する
// =======================================

window.AllianceApp.restoreHistorySnapshot =
    function (snapshot) {
        const app =
            window.AllianceApp;

        if (!snapshot) {
            return false;
        }

        app.state.headquarters =
            app.cloneHeadquarters(
                snapshot.headquarters
            );

        app.state.flags =
            app.cloneFlags(
                snapshot.flags
            );

        app.state.bearTraps =
            app.cloneBearTraps(
                snapshot.bearTraps
            );

        app.state.fixedBuildings =
            app.cloneFixedBuildings(
                snapshot.fixedBuildings
            );

        app.state.bearTrapTimes =
            app.cloneBearTrapTimes(
                snapshot.bearTrapTimes
            );

        app.state.hqDirection =
            snapshot.hqDirection ||
            "east";

        app.state.players =
            snapshot.players.map(
                function (player) {
                    return app.normalizePlayerData(
                        player
                    );
                }
            );

        app.state.selectedPlayerId =
            snapshot.selectedPlayerId;

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
            typeof app.saveCurrentLayoutState ===
            "function"
        ) {
            app.saveCurrentLayoutState();
        }

        app.autoSave();

        return true;
    };

// =======================================
// 直前の配置状態へ戻す
// =======================================

window.AllianceApp.undo =
    function () {
        const app =
            window.AllianceApp;

        if (
            !app.state.history ||
            app.state.history.length === 0
        ) {
            return false;
        }

        const snapshot =
            app.state.history[
                app.state.history.length - 1
            ];

        if (
            snapshot.layoutId !==
            app.state.currentLayoutId
        ) {
            app.state.history = [];
            app.state.redoHistory = [];
            return false;
        }

        const currentSnapshot =
            app.createHistorySnapshot();

        app.state.history.pop();

        app.state.redoHistory.push(
            currentSnapshot
        );

        if (
            app.state.redoHistory.length > 50
        ) {
            app.state.redoHistory.shift();
        }

        return app.restoreHistorySnapshot(
            snapshot
        );
    };

// =======================================
// Undoで戻した操作をやり直す
// =======================================

window.AllianceApp.redo =
    function () {
        const app =
            window.AllianceApp;

        if (
            !app.state.redoHistory ||
            app.state.redoHistory.length === 0
        ) {
            return false;
        }

        const snapshot =
            app.state.redoHistory[
                app.state.redoHistory.length - 1
            ];

        if (
            snapshot.layoutId !==
            app.state.currentLayoutId
        ) {
            app.state.redoHistory = [];
            return false;
        }

        const currentSnapshot =
            app.createHistorySnapshot();

        app.state.redoHistory.pop();

        app.state.history.push(
            currentSnapshot
        );

        if (
            app.state.history.length > 50
        ) {
            app.state.history.shift();
        }

        return app.restoreHistorySnapshot(
            snapshot
        );
    };

// =======================================
// 現在の画面状態をレイアウトへ保存する
// =======================================

window.AllianceApp.saveCurrentLayoutState =
    function () {
        const app =
            window.AllianceApp;

        const currentLayout =
            app.getCurrentLayout();

        if (!currentLayout) {
            return false;
        }

        currentLayout.headquarters =
            app.cloneHeadquarters(
                app.state.headquarters
            );

        currentLayout.flags =
            app.cloneFlags(
                app.state.flags
            );

        currentLayout.bearTraps =
            app.cloneBearTraps(
                app.state.bearTraps
            );

        currentLayout.fixedBuildings =
            app.cloneFixedBuildings(
                app.state.fixedBuildings
            );

        currentLayout.bearTrapTimes =
            app.cloneBearTrapTimes(
                app.state.bearTrapTimes
            );

        currentLayout.hqDirection =
            app.state.hqDirection ||
            "east";

        currentLayout.playerPlacements =
            app.clonePlayerPlacements(
                app.getCurrentPlayerPlacements()
            );

        currentLayout.updatedAt =
            new Date().toISOString();

        return true;
    };


// =======================================
// プレイヤー配置を一度すべて解除する
// =======================================

window.AllianceApp.clearPlayerPlacements =
    function () {
        window.AllianceApp.state.players.forEach(
            function (player) {
                player.isPlaced = false;
                player.x = null;
                player.y = null;
            }
        );
    };


// =======================================
// レイアウトのプレイヤー配置を反映する
// =======================================

window.AllianceApp.applyPlayerPlacements =
    function (playerPlacements) {
        const app =
            window.AllianceApp;

        app.clearPlayerPlacements();

        const placements =
            playerPlacements || [];

        placements.forEach(function (placement) {
            const player =
                app.state.players.find(
                    function (item) {
                        return (
                            item.id ===
                            placement.playerId
                        );
                    }
                );

            if (!player) {
                return;
            }

            player.isPlaced = true;
            player.x = placement.x;
            player.y = placement.y;
        });
    };


// =======================================
// レイアウトを画面へ読み込む
// =======================================

window.AllianceApp.loadLayoutState =
    function (layoutId) {
        const app =
            window.AllianceApp;

        const layout =
            app.getLayoutById(layoutId);

        if (!layout) {
            console.error(
                "指定されたレイアウトが見つかりません。",
                layoutId
            );

            return false;
        }

        app.state.currentLayoutId =
            layout.id;

        app.state.headquarters =
            app.cloneHeadquarters(
                layout.headquarters
            );

        app.state.flags =
            app.cloneFlags(
                layout.flags
            );

        app.state.bearTraps =
            app.cloneBearTraps(
                layout.bearTraps
            );

        app.state.fixedBuildings =
            app.cloneFixedBuildings(
                layout.fixedBuildings
            );

        app.state.bearTrapTimes =
            app.cloneBearTrapTimes(
                layout.bearTrapTimes
            );

        app.state.hqDirection =
            layout.hqDirection ||
            "east";

        app.applyPlayerPlacements(
            layout.playerPlacements
        );

        app.state.selectedPlayerId = null;

        app.state.territoryCells.clear();

        return true;
    };

// =======================================
// 新しいレイアウトを作る
// =======================================

window.AllianceApp.addNewLayout =
    function (layoutName) {
        const app =
            window.AllianceApp;

        app.saveCurrentLayoutState();

        const newLayout =
            app.createEmptyLayout(layoutName);

        app.state.layouts.push(newLayout);

        app.loadLayoutState(newLayout.id);

        return newLayout;
    };


// =======================================
// 現在のレイアウトを複製する
// =======================================

window.AllianceApp.duplicateCurrentLayout =
    function (newLayoutName) {
        const app =
            window.AllianceApp;

        app.saveCurrentLayoutState();

        const currentLayout =
            app.getCurrentLayout();

        if (!currentLayout) {
            return null;
        }

        const duplicateLayout = {
            id: app.createLayoutId(),

            name:
                app.normalizeLayoutName(
                    newLayoutName ||
                    `${currentLayout.name} のコピー`
                ),

            headquarters:
                app.cloneHeadquarters(
                    currentLayout.headquarters
                ),

            flags:
                app.cloneFlags(
                    currentLayout.flags
                ),

            bearTraps:
                app.cloneBearTraps(
                    currentLayout.bearTraps
                ),

            fixedBuildings:
                app.cloneFixedBuildings(
                    currentLayout.fixedBuildings
                ),

            bearTrapTimes:
                app.cloneBearTrapTimes(
                    currentLayout.bearTrapTimes
                ),

            hqDirection:
                currentLayout.hqDirection ||
                "east",

            playerPlacements:
                app.clonePlayerPlacements(
                    currentLayout.playerPlacements
                ),

            createdAt:
                new Date().toISOString(),

            updatedAt:
                new Date().toISOString()
        };

        app.state.layouts.push(
            duplicateLayout
        );

        app.loadLayoutState(
            duplicateLayout.id
        );

        return duplicateLayout;
    };


// =======================================
// レイアウトを切り替える
// =======================================

window.AllianceApp.switchLayout =
    function (layoutId) {
        const app =
            window.AllianceApp;

        if (
            layoutId ===
            app.state.currentLayoutId
        ) {
            return true;
        }

        app.saveCurrentLayoutState();

        return app.loadLayoutState(
            layoutId
        );
    };


// =======================================
// 現在のレイアウト名を変更する
// =======================================

window.AllianceApp.renameCurrentLayout =
    function (newLayoutName) {
        const app =
            window.AllianceApp;

        const currentLayout =
            app.getCurrentLayout();

        if (!currentLayout) {
            return false;
        }

        currentLayout.name =
            app.normalizeLayoutName(
                newLayoutName
            );

        currentLayout.updatedAt =
            new Date().toISOString();

        return true;
    };


// =======================================
// レイアウトを削除する
// =======================================

window.AllianceApp.deleteLayout =
    function (layoutId) {
        const app =
            window.AllianceApp;

        if (app.state.layouts.length <= 1) {
            return {
                success: false,
                message:
                    "最後のレイアウトは削除できません。"
            };
        }

        const deleteIndex =
            app.state.layouts.findIndex(
                function (layout) {
                    return layout.id === layoutId;
                }
            );

        if (deleteIndex === -1) {
            return {
                success: false,
                message:
                    "削除するレイアウトが見つかりません。"
            };
        }

        const deletingCurrentLayout =
            layoutId ===
            app.state.currentLayoutId;

        app.state.layouts.splice(
            deleteIndex,
            1
        );

        if (deletingCurrentLayout) {
            const nextIndex =
                Math.min(
                    deleteIndex,
                    app.state.layouts.length - 1
                );

            const nextLayout =
                app.state.layouts[nextIndex];

            app.loadLayoutState(
                nextLayout.id
            );
        }

        return {
            success: true,
            message:
                "レイアウトを削除しました。"
        };
    };


// =======================================
// 名簿変更後に配置データを整理する
// =======================================

window.AllianceApp.cleanLayoutPlayerPlacements =
    function () {
        const app =
            window.AllianceApp;

        const validPlayerIds =
            new Set(
                app.state.players.map(
                    function (player) {
                        return player.id;
                    }
                )
            );

        app.state.layouts.forEach(
            function (layout) {
                layout.playerPlacements =
                    layout.playerPlacements.filter(
                        function (placement) {
                            return validPlayerIds.has(
                                placement.playerId
                            );
                        }
                    );
            }
        );
    };


// =======================================
// 保存済みレイアウトの旗データを整える
// =======================================

window.AllianceApp.normalizeAllLayoutFlags =
    function () {
        const app =
            window.AllianceApp;

        app.state.layouts.forEach(
            function (layout) {
                layout.flags =
                    app.cloneFlags(
                        layout.flags
                    );
            }
        );
    };


// =======================================
// 最初のレイアウトを準備する
// =======================================

window.AllianceApp.initializeLayouts =
    function () {
        const app =
            window.AllianceApp;

        if (app.state.layouts.length > 0) {
            app.normalizeAllLayoutFlags();

            return;
        }

        const firstLayout =
            app.createEmptyLayout("案A");

        app.state.layouts.push(
            firstLayout
        );

        app.state.currentLayoutId =
            firstLayout.id;
    };


// 最初のレイアウトを作成
window.AllianceApp.initializeLayouts();

console.log(
    "state.js 読み込みOK：旗の親子関係対応"
);
