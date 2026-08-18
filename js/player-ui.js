// =======================================
// プレイヤー一覧を表示
// =======================================

function renderPlayerList() {
    const app = window.AllianceApp;

    const playerListElement =
        document.getElementById("player-list");

    if (!playerListElement) {
        return;
    }

    playerListElement.innerHTML = "";

    if (app.state.players.length === 0) {
        const emptyMessage =
            document.createElement("p");

        emptyMessage.className =
            "empty-player-message";

        emptyMessage.textContent =
            "CSVを読み込むと、ここにプレイヤー名が表示されます。";

        playerListElement.appendChild(
            emptyMessage
        );

        updatePlayerFilterCount(
            0,
            0
        );

        updateSelectedPlayerDisplay();

        return;
    }

    const priorityOrder = {
        SS: 0,
        S: 1,
        A: 2,
        B: 3,
        C: 4,
        D: 5,
        "": 6
    };

    const filters =
        getPlayerFilters();

    const sortedPlayers =
        app.state.players
            .slice()
            .filter(
                function (player) {
                    const normalizedName =
                        String(player.name || "")
                            .toLocaleLowerCase("ja");

                    if (
                        filters.searchText &&
                        !normalizedName.includes(
                            filters.searchText
                        )
                    ) {
                        return false;
                    }

                    if (
                        filters.status === "placed" &&
                        !player.isPlaced
                    ) {
                        return false;
                    }

                    if (
                        filters.status === "unplaced" &&
                        player.isPlaced
                    ) {
                        return false;
                    }

                    if (
                        filters.priority === "unset" &&
                        player.priority
                    ) {
                        return false;
                    }

                    if (
                        filters.priority !== "all" &&
                        filters.priority !== "unset" &&
                        player.priority !== filters.priority
                    ) {
                        return false;
                    }

                    return true;
                }
            )
            .sort(
                function (first, second) {
                    if (
                        first.isPlaced !==
                        second.isPlaced
                    ) {
                        return first.isPlaced
                            ? 1
                            : -1;
                    }

                    return (
                        (
                            priorityOrder[
                                first.priority || ""
                            ] ?? 6
                        ) -
                        (
                            priorityOrder[
                                second.priority || ""
                            ] ?? 6
                        )
                    );
                }
            );

    updatePlayerFilterCount(
        sortedPlayers.length,
        app.state.players.length
    );

    if (sortedPlayers.length === 0) {
        const noResultsMessage =
            document.createElement("p");

        noResultsMessage.className =
            "empty-player-message";

        noResultsMessage.textContent =
            "条件に合うプレイヤーはいません。";

        playerListElement.appendChild(
            noResultsMessage
        );

        updateSelectedPlayerDisplay();

        return;
    }

    sortedPlayers.forEach(
        function (player) {
            const playerButton =
                document.createElement("button");

            playerButton.type = "button";

            playerButton.className =
                "player-list-button";

            playerButton.classList.add(
                app.getPlayerRankClass(
                    player
                )
            );

            if (player.isPlaced) {
                playerButton.classList.add(
                    "placed"
                );
            }

            if (
                player.id ===
                app.state.selectedPlayerId
            ) {
                playerButton.classList.add(
                    "selected"
                );
            }

            const statusText =
                player.isPlaced
                    ? "配置済み"
                    : "未配置";

            const preferredBearType =
                app.getPreferredBearType(
                    player
                );

            const mainText =
                document.createElement(
                    "span"
                );

            mainText.className =
                "player-list-name";

            mainText.textContent =
                player.name;

            if (player.isTemporary) {
                const temporaryBadge =
                    document.createElement("span");

                temporaryBadge.className =
                    "temporary-player-badge";

                temporaryBadge.textContent =
                    "仮";

                mainText.appendChild(
                    temporaryBadge
                );
            }

            const metaText =
                document.createElement(
                    "span"
                );

            metaText.className =
                "player-list-meta";

            metaText.textContent = [
                player.priority
                    ? `優先度 ${player.priority}`
                    : "優先度 未設定",
                player.preferredTime
                    ? `${player.preferredTime} UTC`
                    : "希望時刻 未設定",
                preferredBearType
                    ? (
                        preferredBearType ===
                        "bear1"
                            ? "熊罠1"
                            : "熊罠2"
                    )
                    : "熊罠 未振分",
                statusText
            ].join(" ・ ");

            playerButton.appendChild(
                mainText
            );

            playerButton.appendChild(
                metaText
            );

            playerButton.addEventListener(
                "click",
                function () {
                    selectPlayer(player.id);
                }
            );

            playerListElement.appendChild(
                playerButton
            );
        }
    );

    updateSelectedPlayerDisplay();
}


// =======================================
// プレイヤーを選択
// =======================================

function selectPlayer(playerId) {
    const app = window.AllianceApp;

    const player =
        app.state.players.find(
            function (item) {
                return item.id === playerId;
            }
        );

    if (!player) {
        return;
    }

    app.state.selectedPlayerId =
        playerId;

    app.state.selectedTool =
        "player";

    const toolButtons =
        document.querySelectorAll(
            ".tool-button"
        );

    const playerToolButton =
        document.getElementById(
            "player-tool-button"
        );

    toolButtons.forEach(function (button) {
        button.classList.remove("active");
    });

    if (playerToolButton) {
        playerToolButton.classList.add(
            "active"
        );
    }

    renderPlayerList();
    updateSelectedPlayerDisplay();

    if (
        typeof updateInstruction ===
        "function"
    ) {
        updateInstruction("player");
    }
}


// =======================================
// 人数表示を更新
// =======================================

function updatePlayerCounts() {
    const app = window.AllianceApp;

    const counts =
        app.getPlayerCounts();

    const totalElement =
        document.getElementById(
            "total-player-count"
        );

    const placedElement =
        document.getElementById(
            "placed-player-count"
        );

    const unplacedElement =
        document.getElementById(
            "unplaced-player-count"
        );

    if (totalElement) {
        totalElement.textContent =
            counts.total;
    }

    if (placedElement) {
        placedElement.textContent =
            counts.placed;
    }

    if (unplacedElement) {
        unplacedElement.textContent =
            counts.unplaced;
    }
}


// =======================================
// 選択中プレイヤー表示を更新
// =======================================

function updateSelectedPlayerDisplay() {
    const app = window.AllianceApp;

    const displayElement =
        document.getElementById(
            "selected-player-display"
        );

    if (!displayElement) {
        return;
    }

    const selectedPlayer =
        app.state.players.find(
            function (player) {
                return (
                    player.id ===
                    app.state.selectedPlayerId
                );
            }
        );

    if (!selectedPlayer) {
        displayElement.textContent =
            "選択中：なし";

        return;
    }

    const preferredBearType =
        app.getPreferredBearType(
            selectedPlayer
        );

    displayElement.textContent = [
        `選択中：${selectedPlayer.name}`,
        selectedPlayer.priority
            ? `優先度 ${selectedPlayer.priority}`
            : "優先度 未設定",
        selectedPlayer.preferredTime
            ? `${selectedPlayer.preferredTime} UTC`
            : "希望時刻 未設定",
        preferredBearType
            ? (
                preferredBearType ===
                "bear1"
                    ? "熊罠1"
                    : "熊罠2"
            )
            : "熊罠 未振分"
    ].join(" / ");
}


// =======================================
// プレイヤー一覧の絞り込み条件
// =======================================

function getPlayerFilters() {
    const searchInput =
        document.getElementById(
            "player-search-input"
        );

    const statusSelect =
        document.getElementById(
            "player-status-filter"
        );

    const prioritySelect =
        document.getElementById(
            "player-priority-filter"
        );

    return {
        searchText:
            searchInput
                ? searchInput.value
                    .trim()
                    .toLocaleLowerCase("ja")
                : "",
        status:
            statusSelect
                ? statusSelect.value
                : "unplaced",
        priority:
            prioritySelect
                ? prioritySelect.value
                : "all"
    };
}


function updatePlayerFilterCount(
    visibleCount,
    totalCount
) {
    const countElement =
        document.getElementById(
            "player-filter-count"
        );

    if (!countElement) {
        return;
    }

    countElement.textContent =
        `表示：${visibleCount} / ${totalCount}人`;
}


function resetPlayerFilters() {
    const searchInput =
        document.getElementById(
            "player-search-input"
        );

    const statusSelect =
        document.getElementById(
            "player-status-filter"
        );

    const prioritySelect =
        document.getElementById(
            "player-priority-filter"
        );

    if (searchInput) {
        searchInput.value = "";
    }

    if (statusSelect) {
        statusSelect.value = "all";
    }

    if (prioritySelect) {
        prioritySelect.value = "all";
    }

    renderPlayerList();
}


// =======================================
// プレイヤーツールの有効・無効
// =======================================

function updatePlayerToolState() {
    const app = window.AllianceApp;

    const playerToolButton =
        document.getElementById(
            "player-tool-button"
        );

    const playerLayerCheckbox =
        document.getElementById(
            "layer-players"
        );

    const autoPlacePlayersButton =
        document.getElementById(
            "auto-place-players"
        );

    const hasPlayers =
        app.state.players.length > 0;

    if (playerToolButton) {
        playerToolButton.disabled =
            !hasPlayers;
    }

    if (playerLayerCheckbox) {
        playerLayerCheckbox.disabled =
            !hasPlayers;
    }

    if (autoPlacePlayersButton) {
        autoPlacePlayersButton.disabled =
            !hasPlayers ||
            !app.state.headquarters ||
            !app.state.bearTraps.bear1 ||
            !app.state.bearTraps.bear2;
    }
}


// =======================================
// プレイヤー関連表示をまとめて更新
// =======================================

function refreshPlayerUi() {
    renderPlayerList();
    updatePlayerCounts();
    updatePlayerToolState();
    updateSelectedPlayerDisplay();
}


// =======================================
// 仮プレイヤーを追加する
// =======================================

function addTemporaryPlayers() {
    const app = window.AllianceApp;

    const countInput =
        document.getElementById(
            "temporary-player-count"
        );

    const prioritySelect =
        document.getElementById(
            "temporary-player-priority"
        );

    const bearSelect =
        document.getElementById(
            "temporary-player-bear"
        );

    const count = Math.floor(
        Number(countInput && countInput.value)
    );

    if (
        !Number.isFinite(count) ||
        count < 1 ||
        count > 200
    ) {
        showTemporaryPlayerMessage(
            "人数は1～200人で入力してください。",
            true
        );
        return;
    }

    const priority =
        prioritySelect
            ? prioritySelect.value
            : "";

    const bearType =
        bearSelect
            ? bearSelect.value
            : "";

    const preferredTime =
        bearType
            ? (
                app.state.bearTrapTimes[
                    bearType
                ] || ""
            )
            : "";

    let nextNumber =
        app.state.players.reduce(
            function (maximum, player) {
                if (!player.isTemporary) {
                    return maximum;
                }

                const matched =
                    String(player.name || "")
                        .match(/^仮(\d+)$/);

                return matched
                    ? Math.max(
                        maximum,
                        Number(matched[1])
                    )
                    : maximum;
            },
            0
        ) + 1;

    if (
        typeof app.saveHistory ===
        "function"
    ) {
        app.saveHistory();
    }

    const addedPlayers = [];

    for (let index = 0; index < count; index++) {
        const temporaryNumber =
            nextNumber + index;

        const temporaryPlayer =
            app.normalizePlayerData({
                id:
                    app.createPlayerId(
                        `temporary-${temporaryNumber}`
                    ),
                name:
                    `仮${String(temporaryNumber).padStart(2, "0")}`,
                priority: priority,
                preferredTime: preferredTime,
                allianceRank: "",
                accountType: "仮",
                isTemporary: true,
                isPlaced: false,
                x: null,
                y: null
            });

        app.state.players.push(
            temporaryPlayer
        );

        addedPlayers.push(
            temporaryPlayer
        );
    }

    if (
        !app.state.selectedPlayerId &&
        addedPlayers.length > 0
    ) {
        app.state.selectedPlayerId =
            addedPlayers[0].id;
    }

    app.saveCurrentLayoutState();
    app.autoSave();

    refreshPlayerUi();

    if (
        typeof refreshBearTrapUi ===
        "function"
    ) {
        refreshBearTrapUi();
    }

    showTemporaryPlayerMessage(
        `${count}人の仮プレイヤーを追加しました。`,
        false
    );
}


// =======================================
// 仮プレイヤーだけ削除する
// =======================================

function deleteTemporaryPlayers() {
    const app = window.AllianceApp;

    const temporaryPlayers =
        app.state.players.filter(
            function (player) {
                return player.isTemporary;
            }
        );

    if (temporaryPlayers.length === 0) {
        showTemporaryPlayerMessage(
            "削除する仮プレイヤーはいません。",
            true
        );
        return;
    }

    const shouldDelete = confirm(
        `${temporaryPlayers.length}人の仮プレイヤーを削除しますか？\n` +
        "実際のプレイヤーは削除されません。"
    );

    if (!shouldDelete) {
        return;
    }

    if (
        typeof app.saveHistory ===
        "function"
    ) {
        app.saveHistory();
    }

    const temporaryIds =
        new Set(
            temporaryPlayers.map(
                function (player) {
                    return player.id;
                }
            )
        );

    app.state.players =
        app.state.players.filter(
            function (player) {
                return !temporaryIds.has(
                    player.id
                );
            }
        );

    if (
        temporaryIds.has(
            app.state.selectedPlayerId
        )
    ) {
        app.state.selectedPlayerId = null;
    }

    app.cleanLayoutPlayerPlacements();
    app.saveCurrentLayoutState();
    app.autoSave();

    refreshPlayerUi();

    if (
        typeof refreshBearTrapUi ===
        "function"
    ) {
        refreshBearTrapUi();
    }

    if (
        typeof renderMap ===
        "function"
    ) {
        renderMap();
    }

    showTemporaryPlayerMessage(
        `${temporaryPlayers.length}人の仮プレイヤーを削除しました。`,
        false
    );
}


function showTemporaryPlayerMessage(
    message,
    isError
) {
    const messageElement =
        document.getElementById(
            "temporary-player-message"
        );

    if (!messageElement) {
        return;
    }

    messageElement.textContent = message;
    messageElement.classList.toggle(
        "error",
        Boolean(isError)
    );
}


const addTemporaryPlayersButton =
    document.getElementById(
        "add-temporary-players"
    );

const deleteTemporaryPlayersButton =
    document.getElementById(
        "delete-temporary-players"
    );

if (addTemporaryPlayersButton) {
    addTemporaryPlayersButton.addEventListener(
        "click",
        addTemporaryPlayers
    );
}

if (deleteTemporaryPlayersButton) {
    deleteTemporaryPlayersButton.addEventListener(
        "click",
        deleteTemporaryPlayers
    );
}

const autoPlacePlayersButton =
    document.getElementById(
        "auto-place-players"
    );

if (autoPlacePlayersButton) {
    autoPlacePlayersButton.addEventListener(
        "click",
        function () {
            if (
                typeof autoPlacePlayers ===
                "function"
            ) {
                autoPlacePlayers();
            }
        }
    );
}


const playerSearchInput =
    document.getElementById(
        "player-search-input"
    );

const playerStatusFilter =
    document.getElementById(
        "player-status-filter"
    );

const playerPriorityFilter =
    document.getElementById(
        "player-priority-filter"
    );

const resetPlayerFiltersButton =
    document.getElementById(
        "reset-player-filters"
    );

if (playerSearchInput) {
    playerSearchInput.addEventListener(
        "input",
        renderPlayerList
    );
}

if (playerStatusFilter) {
    playerStatusFilter.addEventListener(
        "change",
        renderPlayerList
    );
}

if (playerPriorityFilter) {
    playerPriorityFilter.addEventListener(
        "change",
        renderPlayerList
    );
}

if (resetPlayerFiltersButton) {
    resetPlayerFiltersButton.addEventListener(
        "click",
        resetPlayerFilters
    );
}


console.log(
    "player-ui.js 読み込みOK"
);
