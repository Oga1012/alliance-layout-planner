// =======================================
// JSON保存・読込
// v0.2.0：JSON保存
// =======================================


// =======================================
// 保存用データを作成する
// =======================================

window.AllianceApp.createExportData = function () {
    const app =
        window.AllianceApp;

    // 現在表示中の状態をレイアウトへ反映
    app.saveCurrentLayoutState();

    return {
        appName:
            "Alliance Layout Planner",

        version:
            "0.2",

        exportedAt:
            new Date().toISOString(),

        currentLayoutId:
            app.state.currentLayoutId,

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
                        isTemporary:
                            player.isTemporary === true
                    };
                }
            ),

        layouts:
            app.state.layouts.map(
                function (layout) {
                    return {
                        id: layout.id,

                        name: layout.name,

                        headquarters:
                            app.cloneHeadquarters(
                                layout.headquarters
                            ),

                        flags:
                            app.cloneFlags(
                                layout.flags
                            ),

                        bearTraps:
                            app.cloneBearTraps(
                                layout.bearTraps
                            ),

                        fixedBuildings:
                            app.cloneFixedBuildings(
                                layout.fixedBuildings
                            ),

                        bearTrapTimes:
                            app.cloneBearTrapTimes(
                                layout.bearTrapTimes
                            ),

                        hqDirection:
                            layout.hqDirection ||
                            "east",

                        gameCoordinates:
                            app.cloneGameCoordinates(
                                layout.gameCoordinates
                            ),

                        playerPlacements:
                            app.clonePlayerPlacements(
                                layout.playerPlacements
                            ),

                        createdAt:
                            layout.createdAt,

                        updatedAt:
                            layout.updatedAt
                    };
                }
            )
    };
};


// =======================================
// ファイル名用の日付文字列を作成する
// =======================================

window.AllianceApp.createExportFileName =
    function () {
        const now =
            new Date();

        const year =
            now.getFullYear();

        const month =
            String(
                now.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                now.getDate()
            ).padStart(2, "0");

        const hours =
            String(
                now.getHours()
            ).padStart(2, "0");

        const minutes =
            String(
                now.getMinutes()
            ).padStart(2, "0");

        return (
            `AllianceLayout_${year}${month}${day}_${hours}${minutes}.json`
        );
    };


// =======================================
// JSONファイルを保存する
// =======================================

window.AllianceApp.exportJson = function () {
    const app =
        window.AllianceApp;

    try {
        const exportData =
            app.createExportData();

        const jsonText =
            JSON.stringify(
                exportData,
                null,
                2
            );

        const blob =
            new Blob(
                [jsonText],
                {
                    type:
                        "application/json;charset=utf-8"
                }
            );

        const downloadUrl =
            URL.createObjectURL(blob);

        const downloadLink =
            document.createElement("a");

        downloadLink.href =
            downloadUrl;

        downloadLink.download =
            app.createExportFileName();

        document.body.appendChild(
            downloadLink
        );

        downloadLink.click();

        document.body.removeChild(
            downloadLink
        );

        URL.revokeObjectURL(
            downloadUrl
        );

        if (
            typeof showLayoutMessage ===
            "function"
        ) {
            showLayoutMessage(
                "JSONファイルを保存しました。"
            );
        }

        console.log(
            "JSON保存完了",
            exportData
        );

        return true;

    } catch (error) {
        console.error(
            "JSON保存に失敗しました。",
            error
        );

        if (
            typeof showLayoutMessage ===
            "function"
        ) {
            showLayoutMessage(
                "JSONファイルの保存に失敗しました。"
            );
        }

        alert(
            "JSONファイルの保存に失敗しました。"
        );

        return false;
    }
};

// =======================================
// LocalStorage設定
// =======================================

window.AllianceApp.localStorageKey =
    "alliance-layout-planner-data";


// =======================================
// 現在の状態をブラウザへ保存する
// =======================================

window.AllianceApp.saveToLocalStorage =
    function () {
        const app =
            window.AllianceApp;

        try {
            const saveData =
                app.createExportData();

            const jsonText =
                JSON.stringify(saveData);

            localStorage.setItem(
                app.localStorageKey,
                jsonText
            );

            console.log(
                "LocalStorage保存完了",
                saveData
            );

            return true;

        } catch (error) {
            console.error(
                "LocalStorage保存エラー",
                error
            );

            return false;
        }
    };

// =======================================
// 現在の状態をブラウザへ保存する
// =======================================

window.AllianceApp.saveToLocalStorage =
    function () {
        const app =
            window.AllianceApp;

        try {
            const saveData =
                app.createExportData();

            const jsonText =
                JSON.stringify(saveData);

            localStorage.setItem(
                app.localStorageKey,
                jsonText
            );

            console.log(
                "LocalStorage保存完了",
                saveData
            );

            return true;

        } catch (error) {
            console.error(
                "LocalStorage保存エラー",
                error
            );

            return false;
        }
    };


// =======================================
// 自動保存
// =======================================

window.AllianceApp.autoSave =
    function () {
        return window.AllianceApp.saveToLocalStorage();
    };

// =======================================
// LocalStorageから状態を復元する
// =======================================

window.AllianceApp.loadFromLocalStorage =
    function () {
        const app =
            window.AllianceApp;

        try {
            const jsonText =
                localStorage.getItem(
                    app.localStorageKey
                );

            // 保存データがない場合
            if (!jsonText) {
                console.log(
                    "LocalStorageに保存データはありません。"
                );

                return false;
            }

            const savedData =
                JSON.parse(jsonText);

            // 最低限必要なデータを確認
            if (
                !Array.isArray(savedData.players) ||
                !Array.isArray(savedData.layouts) ||
                savedData.layouts.length === 0
            ) {
                console.warn(
                    "LocalStorageの保存データが正しくありません。"
                );

                return false;
            }

            // プレイヤー名簿を復元
            app.state.players =
                savedData.players.map(
                    function (player) {
                        return app.normalizePlayerData({
                            ...player,
                            isPlaced: false,
                            x: null,
                            y: null
                        });
                    }
                );

            // レイアウトを復元
            app.state.layouts =
                savedData.layouts;

            // 保存時に開いていたレイアウトを取得
            let restoreLayoutId =
                savedData.currentLayoutId;

            // 対象レイアウトが見つからない場合は先頭を使う
            const restoreLayoutExists =
                app.state.layouts.some(
                    function (layout) {
                        return (
                            layout.id ===
                            restoreLayoutId
                        );
                    }
                );

            if (!restoreLayoutExists) {
                restoreLayoutId =
                    app.state.layouts[0].id;
            }

            app.state.currentLayoutId =
                restoreLayoutId;

            app.loadLayoutState(
                restoreLayoutId
            );

            console.log(
                "LocalStorage復元完了",
                savedData
            );

            return true;

        } catch (error) {
            console.error(
                "LocalStorage復元エラー",
                error
            );

            return false;
        }
    };


// =======================================
// JSON保存ボタン
// =======================================

const exportJsonButton =
    document.getElementById(
        "export-json"
    );

if (exportJsonButton) {
    exportJsonButton.addEventListener(
        "click",
        function () {
            window.AllianceApp.exportJson();
        }
    );
}

console.log(
    "save-load.js 読み込みOK：JSON保存対応"
);

// =======================================
// JSON読込ボタン
// =======================================

const importJsonButton =
    document.getElementById(
        "import-json"
    );

const importJsonFile =
    document.getElementById(
        "import-json-file"
    );

if (
    importJsonButton &&
    importJsonFile
) {
    importJsonButton.addEventListener(
        "click",
        function () {
            importJsonFile.click();
        }
    );
}

// =======================================
// JSONファイル選択後の処理
// =======================================

if (importJsonFile) {
    importJsonFile.addEventListener(
        "change",
        function (event) {
            const selectedFile =
                event.target.files[0];

            if (!selectedFile) {
                return;
            }

            const reader =
                new FileReader();

            reader.addEventListener(
                "load",
                function () {
                    try {
                        const importData =
                            JSON.parse(
                                reader.result
                            );

                        console.log(
    "JSON読込成功",
    importData
);

// 読み込んだデータをアプリへ反映
const app =
    window.AllianceApp;

app.state.players =
    importData.players.map(
        function (player) {
            return app.normalizePlayerData({
                ...player,
                isPlaced: false,
                x: null,
                y: null
            });
        }
    );

app.state.layouts =
    importData.layouts;

app.state.currentLayoutId =
    importData.currentLayoutId;

// 現在のレイアウトを画面状態へ読み込む
app.loadLayoutState(
    app.state.currentLayoutId
);

// マップと各画面を更新
renderMap();

refreshLayoutUi();

refreshPlayerUi();

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

alert(
    "レイアウトを復元しました。"
);

                    } catch (error) {
                        console.error(
                            "JSON読込エラー",
                            error
                        );

                        alert(
                            "JSONファイルの形式が正しくありません。"
                        );
                    }

                    // 同じファイルを再選択できるようにする
                    importJsonFile.value = "";
                }
            );

            reader.addEventListener(
                "error",
                function () {
                    alert(
                        "JSONファイルを読み込めませんでした。"
                    );

                    importJsonFile.value = "";
                }
            );

            reader.readAsText(
                selectedFile,
                "UTF-8"
            );
        }
    );
}
