// =======================================
// CSV読み込み用の要素
// =======================================

const playerCsvFileInput =
    document.getElementById("player-csv-file");

const importPlayerCsvButton =
    document.getElementById("import-player-csv");


// =======================================
// CSV読込ボタン
// =======================================

if (importPlayerCsvButton) {
    importPlayerCsvButton.addEventListener(
        "click",
        importPlayerCsv
    );
}


// =======================================
// CSVを読み込む
// =======================================

function importPlayerCsv() {
    const app = window.AllianceApp;

    if (
        !playerCsvFileInput ||
        playerCsvFileInput.files.length === 0
    ) {
        showCsvMessage(
            "CSVファイルを選択してください。",
            true
        );

        return;
    }

    const file =
        playerCsvFileInput.files[0];

    const reader =
        new FileReader();

    reader.onload = function (event) {
        const csvText =
            event.target.result;

        try {
            const playerRecords =
                parsePlayerCsv(csvText);

            if (playerRecords.length === 0) {
                showCsvMessage(
                    "プレイヤー名を読み込めませんでした。",
                    true
                );

                return;
            }

            const shouldReplace =
                app.state.players.length === 0 ||
                confirm(
                    "現在のプレイヤー名簿を新しいCSVで置き換えます。\n" +
                    "各レイアウトのプレイヤー配置も解除されます。\n\n" +
                    "続けますか？"
                );

            if (!shouldReplace) {
                return;
            }

            // 先に現在のレイアウト状態を保存
            if (
                typeof app.saveCurrentLayoutState ===
                "function"
            ) {
                app.saveCurrentLayoutState();
            }

            // 新しい名簿を作成
            app.state.players =
                playerRecords.map(
                    function (playerData, index) {
                        return {
                            id:
                                app.createPlayerId(
                                    index
                                ),

                            name:
                                playerData.name,

                            priority:
                                playerData.priority,

                            preferredTime:
                                playerData.preferredTime,

                            allianceRank:
                                playerData.allianceRank,

                            accountType:
                                playerData.accountType,

                            isPlaced:
                                false,

                            x:
                                null,

                            y:
                                null,

                            csvData: {
                                プレイヤー名:
                                    playerData.name,
                                優先度:
                                    playerData.priority,
                                希望時間:
                                    playerData.preferredTime,
                                同盟ランク:
                                    playerData.allianceRank,
                                本体サブ:
                                    playerData.accountType
                            }
                        };
                    }
                );

            app.state.selectedPlayerId =
                null;

            // 全レイアウトのプレイヤー配置を解除
            app.state.layouts.forEach(
                function (layout) {
                    layout.playerPlacements = [];
                    layout.updatedAt =
                        new Date().toISOString();
                }
            );

            if (
                typeof app.cleanLayoutPlayerPlacements ===
                "function"
            ) {
                app.cleanLayoutPlayerPlacements();
            }

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
                typeof renderMap ===
                "function"
            ) {
                renderMap();
            }

            showCsvMessage(
                `${playerRecords.length}名を読み込みました。`,
                false
            );
        } catch (error) {
            console.error(error);

            showCsvMessage(
                "CSVの読み込み中にエラーが発生しました。",
                true
            );
        }
    };

    reader.onerror = function () {
        showCsvMessage(
            "CSVファイルを読み込めませんでした。",
            true
        );
    };

    reader.readAsText(file, "UTF-8");
}


// =======================================
// CSVテキストを解析
// =======================================

function parsePlayerCsv(csvText) {
    const app = window.AllianceApp;

    const normalizedText =
        String(csvText || "")
            .replace(/^\uFEFF/, "")
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n");

    const rows =
        normalizedText
            .split("\n")
            .map(function (line) {
                return parseCsvLine(line);
            })
            .filter(function (row) {
                return row.some(
                    function (value) {
                        return (
                            String(value).trim() !==
                            ""
                        );
                    }
                );
            });

    if (rows.length === 0) {
        return [];
    }

    const header =
        rows[0].map(
            function (value) {
                return String(value).trim();
            }
        );

    const playerNameColumnIndex =
        findPlayerNameColumnIndex(header);

    const priorityColumnIndex =
        findCsvColumnIndex(
            header,
            [
                "優先度",
                "配置ランク",
                "priority"
            ]
        );

    const preferredTimeColumnIndex =
        findCsvColumnIndex(
            header,
            [
                "希望時間",
                "希望時刻",
                "参加希望時間",
                "time"
            ]
        );

    const allianceRankColumnIndex =
        findCsvColumnIndex(
            header,
            [
                "同盟ランク",
                "rank"
            ]
        );

    const accountTypeColumnIndex =
        findCsvColumnIndex(
            header,
            [
                "本体サブ",
                "本体/サブ",
                "mainorsub",
                "accounttype"
            ]
        );

    const startRowIndex =
        playerNameColumnIndex >= 0
            ? 1
            : 0;

    const targetColumnIndex =
        playerNameColumnIndex >= 0
            ? playerNameColumnIndex
            : 0;

    const playerRecords = [];

    const duplicateCheck =
        new Set();

    for (
        let rowIndex = startRowIndex;
        rowIndex < rows.length;
        rowIndex++
    ) {
        const row =
            rows[rowIndex];

        const rawName =
            row[targetColumnIndex];

        const playerName =
            app.normalizePlayerName(
                rawName
            );

        if (!playerName) {
            continue;
        }

        const duplicateKey =
            playerName.toLowerCase();

        if (
            duplicateCheck.has(
                duplicateKey
            )
        ) {
            continue;
        }

        duplicateCheck.add(
            duplicateKey
        );

        playerRecords.push({
            name:
                playerName,

            priority:
                normalizePlayerPriority(
                    priorityColumnIndex >= 0
                        ? row[priorityColumnIndex]
                        : ""
                ),

            preferredTime:
                normalizePreferredTime(
                    preferredTimeColumnIndex >= 0
                        ? row[
                            preferredTimeColumnIndex
                        ]
                        : ""
                ),

            allianceRank:
                allianceRankColumnIndex >= 0
                    ? String(
                        row[
                            allianceRankColumnIndex
                        ] || ""
                    ).trim()
                    : "",

            accountType:
                accountTypeColumnIndex >= 0
                    ? String(
                        row[
                            accountTypeColumnIndex
                        ] || ""
                    ).trim()
                    : ""
        });
    }

    return playerRecords;
}

function findCsvColumnIndex(
    header,
    acceptedNames
) {
    for (
        let index = 0;
        index < header.length;
        index++
    ) {
        const normalizedHeader =
            String(header[index] || "")
                .trim()
                .toLowerCase()
                .replace(/[\s_-]+/g, "");

        const matched =
            acceptedNames.some(
                function (acceptedName) {
                    return (
                        normalizedHeader ===
                        String(acceptedName)
                            .trim()
                            .toLowerCase()
                            .replace(
                                /[\s_-]+/g,
                                ""
                            )
                    );
                }
            );

        if (matched) {
            return index;
        }
    }

    return -1;
}

function normalizePlayerPriority(value) {
    const priority =
        String(value || "")
            .trim()
            .toUpperCase();

    return [
        "SS",
        "S",
        "A",
        "B",
        "C",
        "D"
    ].includes(priority)
        ? priority
        : "";
}

function normalizePreferredTime(value) {
    const text =
        String(value || "").trim();

    if (!text) {
        return "";
    }

    const matched =
        text.match(
            /^(\d{1,2}):(\d{2})$/
        );

    if (!matched) {
        return "";
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
        return "";
    }

    return (
        `${String(hours).padStart(2, "0")}:` +
        String(minutes).padStart(2, "0")
    );
}


// =======================================
// CSVの1行を解析
// =======================================

function parseCsvLine(line) {
    const values = [];

    let currentValue = "";
    let insideQuotes = false;

    for (
        let index = 0;
        index < line.length;
        index++
    ) {
        const character =
            line[index];

        if (character === '"') {
            const nextCharacter =
                line[index + 1];

            if (
                insideQuotes &&
                nextCharacter === '"'
            ) {
                currentValue += '"';
                index++;
            } else {
                insideQuotes =
                    !insideQuotes;
            }

            continue;
        }

        if (
            character === "," &&
            !insideQuotes
        ) {
            values.push(
                currentValue
            );

            currentValue = "";

            continue;
        }

        currentValue +=
            character;
    }

    values.push(
        currentValue
    );

    return values;
}


// =======================================
// プレイヤー名列を探す
// =======================================

function findPlayerNameColumnIndex(header) {
    const acceptedNames = [
        "プレイヤー名",
        "プレイヤー",
        "名前",
        "name",
        "player",
        "playername",
        "player name"
    ];

    for (
        let index = 0;
        index < header.length;
        index++
    ) {
        const normalizedHeader =
            String(header[index])
                .trim()
                .toLowerCase()
                .replace(/\s+/g, "");

        const matched =
            acceptedNames.some(
                function (acceptedName) {
                    return (
                        normalizedHeader ===
                        acceptedName
                            .toLowerCase()
                            .replace(/\s+/g, "")
                    );
                }
            );

        if (matched) {
            return index;
        }
    }

    return -1;
}


// =======================================
// CSVメッセージ表示
// =======================================

function showCsvMessage(
    message,
    isError
) {
    const messageElement =
        document.getElementById(
            "csv-import-message"
        );

    if (!messageElement) {
        return;
    }

    messageElement.textContent =
        message;

    messageElement.classList.toggle(
        "error",
        isError
    );

    messageElement.classList.toggle(
        "success",
        !isError
    );
}


console.log(
    "csv.js 読み込みOK"
);
