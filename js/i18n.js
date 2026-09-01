// =======================================
// 日本語・英語・繁體中文の切り替え
// =======================================

(function () {
    const supportedLanguages = [
        "ja",
        "en",
        "zh-Hant"
    ];

    const storageKey =
        "alliance-layout-language:v1";

    const catalog = {
        "同盟レイアウト作成ツール": ["Alliance Layout Planner", "聯盟佈局規劃工具"],
        "座標：X -- / Y --": ["Coordinates: X -- / Y --", "座標：X -- / Y --"],
        "配置": ["Place", "配置"],
        "同盟本部": ["Alliance HQ", "聯盟總部"],
        "本部": ["HQ", "總部"],
        "旗": ["Flag", "旗幟"],
        "熊罠1": ["Bear Trap 1", "獵熊陷阱1"],
        "熊罠2": ["Bear Trap 2", "獵熊陷阱2"],
        "熊罠": ["Bear Trap", "獵熊陷阱"],
        "プレイヤー": ["Player", "玩家"],
        "石炭工場": ["Coal Mine", "煤礦場"],
        "牧場": ["Farm", "牧場"],
        "製材所": ["Lumberyard", "木材場"],
        "鉄鉱場": ["Iron Mine", "鐵礦場"],
        "操作": ["Controls", "操作"],
        "盤面移動": ["Pan Map", "移動畫面"],
        "表示位置を戻す": ["Reset View", "重設視野"],
        "↶ 戻す": ["↶ Undo", "↶ 復原"],
        "↷ やり直す": ["↷ Redo", "↷ 重做"],
        "？ 使い方": ["? Help", "？ 使用說明"],
        "全消去": ["Clear All", "全部清除"],
        "表示": ["Display", "顯示"],
        "領地": ["Territory", "領地"],
        "接続線": ["Connection Lines", "連接線"],
        "固定施設": ["Fixed Facilities", "固定設施"],
        "レイアウト管理": ["Layout Management", "佈局管理"],
        "現在のレイアウト": ["Current Layout", "目前佈局"],
        "レイアウト選択": ["Select Layout", "選擇佈局"],
        "案A": ["Plan A", "方案A"],
        "ゲーム内座標": ["In-game Coordinates", "遊戲內座標"],
        "王国": ["State", "王國"],
        "本部 X": ["HQ X", "總部 X"],
        "本部 Y": ["HQ Y", "總部 Y"],
        "ゲーム内配置リスト": ["In-game Placement List", "遊戲內配置清單"],
        "CSV保存": ["Save CSV", "儲存CSV"],
        "PNG画像保存": ["Save PNG", "儲存PNG圖片"],
        "種類": ["Type", "類型"],
        "名前": ["Name", "名稱"],
        "新規": ["New", "新增"],
        "複製": ["Duplicate", "複製"],
        "名前変更": ["Rename", "重新命名"],
        "削除": ["Delete", "刪除"],
        "JSON保存": ["Save JSON", "儲存JSON"],
        "JSON読込": ["Load JSON", "讀取JSON"],
        "熊罠設定": ["Bear Trap Settings", "獵熊陷阱設定"],
        "熊罠1 開始": ["Bear Trap 1 Start", "獵熊陷阱1開始"],
        "熊罠2 開始": ["Bear Trap 2 Start", "獵熊陷阱2開始"],
        "本部の方向": ["HQ Direction", "總部方向"],
        "北": ["North", "北"],
        "南": ["South", "南"],
        "東": ["East", "東"],
        "西": ["West", "西"],
        "自動配置方法": ["Auto-layout Mode", "自動配置方式"],
        "本部＋旗": ["HQ + Flags", "總部＋旗幟"],
        "手動本部＋旗だけ": ["Manual HQ + Flags Only", "手動總部＋僅旗幟"],
        "本部と旗を自動配置": ["Auto-place HQ and Flags", "自動配置總部與旗幟"],
        "プレイヤー管理": ["Player Management", "玩家管理"],
        "プレイヤーCSV": ["Player CSV", "玩家CSV"],
        "CSVを読み込む": ["Load CSV", "讀取CSV"],
        "CSVを選択してください。": ["Select a CSV file.", "請選擇CSV檔案。"],
        "仮プレイヤー": ["Temporary Players", "臨時玩家"],
        "仮": ["Temp", "臨時"],
        "名簿が未確定でも配置を試せます": ["Try layouts before the roster is final", "名單尚未確定也能測試配置"],
        "人数": ["Count", "人數"],
        "優先度": ["Priority", "優先度"],
        "希望": ["Preference", "偏好"],
        "未設定": ["Not Set", "未設定"],
        "未振分": ["Unassigned", "未分配"],
        "仮プレイヤーを追加": ["Add Temporary Players", "新增臨時玩家"],
        "仮だけ削除": ["Delete Temporary Only", "僅刪除臨時玩家"],
        "名前は「仮01」から自動で付きます。": ["Names are assigned automatically from “Temp 01”.", "名稱會從「臨時01」開始自動編號。"],
        "プレイヤーを自動配置": ["Auto-place Players", "自動配置玩家"],
        "優先度と希望時間を使って配置します。": ["Uses priority and preferred time for placement.", "依優先度與希望時間進行配置。"],
        "登録人数": ["Registered", "登記人數"],
        "配置済み": ["Placed", "已配置"],
        "未配置": ["Unplaced", "未配置"],
        "プレイヤー一覧": ["Player List", "玩家清單"],
        "選択中：なし": ["Selected: None", "已選擇：無"],
        "名前検索": ["Search Name", "搜尋名稱"],
        "名前の一部を入力": ["Enter part of a name", "輸入部分名稱"],
        "配置状態": ["Placement Status", "配置狀態"],
        "未配置だけ": ["Unplaced Only", "僅未配置"],
        "すべて": ["All", "全部"],
        "配置済みだけ": ["Placed Only", "僅已配置"],
        "絞り込み解除": ["Reset Filters", "清除篩選"],
        "はじめに": ["GETTING STARTED", "開始使用"],
        "プレイヤーを配置するまでの準備": ["Prepare to Place Players", "配置玩家前的準備"],
        "上から順番に進めると、レイアウトを作成できます。": ["Follow these steps in order to create your layout.", "依序完成以下步驟即可建立佈局。"],
        "熊罠の時間を入力して設置": ["Set Times and Place Bear Traps", "輸入時間並配置獵熊陷阱"],
        "熊罠1・熊罠2の開始時間を入力し、マップ上へ設置します。": ["Enter the start times for Bear Traps 1 and 2, then place them on the map.", "輸入獵熊陷阱1與2的開始時間，並將它們配置在地圖上。"],
        "熊罠設定を開く": ["Open Bear Trap Settings", "開啟獵熊陷阱設定"],
        "同盟本部を設置して座標を入力": ["Place the Alliance HQ and Enter Coordinates", "配置聯盟總部並輸入座標"],
        "本部を手動で設置し、ゲーム内の王国・X・Y座標を入力します。": ["Place the HQ manually and enter the in-game State, X, and Y coordinates.", "手動配置總部，並輸入遊戲內的王國、X與Y座標。"],
        "本部・座標設定を開く": ["Open HQ and Coordinate Settings", "開啟總部與座標設定"],
        "本部と旗を自動配置（任意）": ["Auto-place HQ and Flags (Optional)", "自動配置總部與旗幟（選用）"],
        "熊罠に対する本部の方角を選び、本部＋旗または旗だけを自動配置できます。": ["Choose the HQ direction from the bear traps, then auto-place the HQ and flags or flags only.", "選擇總部相對於獵熊陷阱的方向，再自動配置總部與旗幟，或僅配置旗幟。"],
        "自動配置設定を開く": ["Open Auto-layout Settings", "開啟自動配置設定"],
        "プレイヤーデータを準備": ["Prepare Player Data", "準備玩家資料"],
        "CSVを読み込むか、人数を指定して仮プレイヤーを作成します。": ["Load a CSV or specify a count to create temporary players.", "讀取CSV，或指定人數建立臨時玩家。"],
        "プレイヤー管理を開く": ["Open Player Management", "開啟玩家管理"],
        "プレイヤーを配置": ["Place Players", "配置玩家"],
        "ランク・戦力・希望時間をもとに、熊罠の近くへ自動配置します。": ["Auto-place players near bear traps based on rank, power, and preferred time.", "依排名、戰力與希望時間，將玩家自動配置在獵熊陷阱附近。"],
        "配置画面を開く": ["Open Placement Panel", "開啟配置畫面"],
        "次回から自動表示しない": ["Do not show automatically next time", "下次不要自動顯示"],
        "準備を始める": ["Start Setup", "開始準備"],
        "完了": ["Complete", "完成"],
        "任意": ["Optional", "選用"],
        "未完了": ["Not Complete", "未完成"],
        "なし": ["None", "無"],
        "接続中": ["Connected", "已連接"],
        "接続切れ": ["Disconnected", "連接中斷"],
        "配置データはまだありません。": ["No placement data yet.", "目前沒有配置資料。"],
        "本部を配置すると座標一覧を表示します。": ["Place the HQ to display the coordinate list.", "配置總部後會顯示座標清單。"],
        "本部を配置すると、マスに合わせてゲーム座標を表示します。": ["Place the HQ to show in-game coordinates for each grid cell.", "配置總部後，會依格子顯示遊戲座標。"],
        "レイアウトは自動的に「案A」から開始します。": ["Layouts start automatically with “Plan A”.", "佈局會自動從「方案A」開始。"],
        "時刻はレイアウトごとに保存されます。": ["Times are saved for each layout.", "時間會依各佈局分別儲存。"],
        "CSVを読み込むと、ここにプレイヤー名が表示されます。": ["Load a CSV to display player names here.", "讀取CSV後，玩家名稱會顯示在這裡。"],
        "条件に合うプレイヤーはいません。": ["No players match the filters.", "沒有符合條件的玩家。"],
        "使い方ガイドを閉じる": ["Close the help guide", "關閉使用說明"],
        "レイアウト作成の手順を表示": ["Show layout setup instructions", "顯示佈局建立步驟"],
        "元に戻す（Ctrl+Z）": ["Undo (Ctrl+Z)", "復原（Ctrl+Z）"],
        "やり直す（Ctrl+Y）": ["Redo (Ctrl+Y)", "重做（Ctrl+Y）"],
        "「同盟本部」を選び、配置したいマスをクリックしてください。 クリックしたマスが本部の左上になります。": ["Select “Alliance HQ,” then click the desired grid cell. The clicked cell becomes the HQ’s top-left corner.", "選擇「聯盟總部」，再點擊要配置的格子。所點選的格子會成為總部的左上角。"],
        "「同盟本部」を配置します。クリックしたマスが本部の左上になります。": ["Place the Alliance HQ. The clicked cell becomes its top-left corner.", "配置聯盟總部。所點選的格子會成為總部的左上角。"],
        "「旗」を配置します。現在の領地とつながるマスをクリックしてください。": ["Place a flag. Click a cell that connects to the current territory.", "配置旗幟。請點擊可與目前領地連接的格子。"],
        "「熊罠1」を配置します。3×3の中心にするマスをクリックしてください。": ["Place Bear Trap 1. Click the cell that should be the center of its 3×3 area.", "配置獵熊陷阱1。請點擊要作為3×3範圍中心的格子。"],
        "「熊罠2」を配置します。3×3の中心にするマスをクリックしてください。": ["Place Bear Trap 2. Click the cell that should be the center of its 3×3 area.", "配置獵熊陷阱2。請點擊要作為3×3範圍中心的格子。"],
        "一覧からプレイヤーを選び、配置したいマスをクリックしてください。クリックしたマスが2×2の左上になります。": ["Select a player from the list, then click the desired cell. The clicked cell becomes the top-left corner of the 2×2 city.", "從清單選擇玩家，再點擊要配置的格子。所點選的格子會成為2×2城市的左上角。"],
        "石炭工場を配置します。クリックしたマスが2×2の左上になります。": ["Place the Coal Mine. The clicked cell becomes its 2×2 top-left corner.", "配置煤礦場。所點選的格子會成為2×2設施的左上角。"],
        "牧場を配置します。クリックしたマスが2×2の左上になります。": ["Place the Farm. The clicked cell becomes its 2×2 top-left corner.", "配置牧場。所點選的格子會成為2×2設施的左上角。"],
        "製材所を配置します。クリックしたマスが2×2の左上になります。": ["Place the Lumberyard. The clicked cell becomes its 2×2 top-left corner.", "配置木材場。所點選的格子會成為2×2設施的左上角。"],
        "鉄鉱場を配置します。クリックしたマスが2×2の左上になります。": ["Place the Iron Mine. The clicked cell becomes its 2×2 top-left corner.", "配置鐵礦場。所點選的格子會成為2×2設施的左上角。"],
        "マップをドラッグして表示位置を移動します。": ["Drag the map to move the view.", "拖曳地圖以移動畫面。"],
        "配置するツールを選択してください。": ["Select a placement tool.", "請選擇配置工具。"],
        "本部がまだ配置されていません。": ["The HQ has not been placed yet.", "尚未配置總部。"],
        "希望時刻未設定": ["Preferred Time Not Set", "未設定希望時間"],
        "プレイヤー優先度の色": ["Player priority colors", "玩家優先度顏色"]
    };

    const dynamicRules = {
        en: [
            [/^座標：X (\d+) \/ Y (\d+)$/, "Coordinates: X $1 / Y $2"],
            [/^熊罠1：([0-9]+)人$/, "Bear Trap 1: $1 players"],
            [/^熊罠2：([0-9]+)人$/, "Bear Trap 2: $1 players"],
            [/^希望時刻未設定：([0-9]+)人$/, "Preferred Time Not Set: $1 players"],
            [/^表示：([0-9]+) \/ ([0-9]+)人$/, "Showing: $1 / $2 players"],
            [/^選択中：なし$/, "Selected: None"],
            [/^優先度 (.+)$/, "Priority $1"],
            [/^#([0-9]+)・全([0-9]+)件（プレイヤー([0-9]+)人）$/, "#$1 · $2 items ($3 players)"],
            [/^(.+)をマップで表示$/, "Show $1 on the map"]
        ],
        "zh-Hant": [
            [/^座標：X (\d+) \/ Y (\d+)$/, "座標：X $1 / Y $2"],
            [/^熊罠1：([0-9]+)人$/, "獵熊陷阱1：$1人"],
            [/^熊罠2：([0-9]+)人$/, "獵熊陷阱2：$1人"],
            [/^希望時刻未設定：([0-9]+)人$/, "未設定希望時間：$1人"],
            [/^表示：([0-9]+) \/ ([0-9]+)人$/, "顯示：$1 / $2人"],
            [/^選択中：なし$/, "已選擇：無"],
            [/^優先度 (.+)$/, "優先度 $1"],
            [/^#([0-9]+)・全([0-9]+)件（プレイヤー([0-9]+)人）$/, "#$1・共$2筆（玩家$3人）"],
            [/^(.+)をマップで表示$/, "在地圖上顯示$1"]
        ]
    };

    const phraseRules = {
        en: [
            [/同盟本部/g, "Alliance HQ"],
            [/熊罠1/g, "Bear Trap 1"],
            [/熊罠2/g, "Bear Trap 2"],
            [/熊罠/g, "Bear Trap"],
            [/プレイヤー/g, "player"],
            [/レイアウト/g, "layout"],
            [/ゲーム内/g, "in-game "],
            [/ゲーム/g, "Game"],
            [/座標/g, "coordinates"],
            [/領地/g, "territory"],
            [/接続切れ/g, "disconnected"],
            [/接続中/g, "connected"],
            [/自動配置/g, "auto-placement"],
            [/手動配置/g, "manual placement"],
            [/配置済み/g, "placed"],
            [/未配置/g, "unplaced"],
            [/配置/g, "placement"],
            [/優先度/g, "priority"],
            [/希望時間/g, "preferred time"],
            [/希望時刻/g, "preferred time"],
            [/未設定/g, "not set"],
            [/未振分/g, "unassigned"],
            [/旗/g, "flag"],
            [/本部/g, "HQ"],
            [/固定施設/g, "fixed facility"],
            [/王国/g, "State"],
            [/削除/g, "delete"],
            [/保存/g, "save"],
            [/読込/g, "load"],
            [/読み込/g, "load"],
            [/選択中/g, "Selected"],
            [/表示/g, "Display"],
            [/未完了/g, "Not complete"],
            [/完了/g, "Complete"],
            [/続けますか/g, "Continue?"],
            [/先に/g, "First, "],
            [/してください/g, "please."],
            [/できません/g, "cannot be done"],
            [/ありません/g, "not found"],
            [/見つかりません/g, "was not found"],
            [/(\d+)名/g, "$1 players"],
            [/(\d+)人/g, "$1 players"],
            [/(\d+)本/g, "$1 flags"],
            [/(\d+)件/g, "$1 items"]
        ],
        "zh-Hant": [
            [/同盟本部/g, "聯盟總部"],
            [/熊罠1/g, "獵熊陷阱1"],
            [/熊罠2/g, "獵熊陷阱2"],
            [/熊罠/g, "獵熊陷阱"],
            [/プレイヤー/g, "玩家"],
            [/レイアウト/g, "佈局"],
            [/ゲーム内/g, "遊戲內"],
            [/ゲーム/g, "遊戲"],
            [/座標/g, "座標"],
            [/領地/g, "領地"],
            [/接続切れ/g, "連接中斷"],
            [/接続中/g, "已連接"],
            [/自動配置/g, "自動配置"],
            [/手動配置/g, "手動配置"],
            [/配置済み/g, "已配置"],
            [/未配置/g, "未配置"],
            [/配置/g, "配置"],
            [/優先度/g, "優先度"],
            [/希望時間/g, "希望時間"],
            [/希望時刻/g, "希望時間"],
            [/未設定/g, "未設定"],
            [/未振分/g, "未分配"],
            [/旗/g, "旗幟"],
            [/本部/g, "總部"],
            [/固定施設/g, "固定設施"],
            [/王国/g, "王國"],
            [/削除/g, "刪除"],
            [/保存/g, "儲存"],
            [/読込/g, "讀取"],
            [/読み込/g, "讀取"],
            [/選択中/g, "已選擇"],
            [/表示/g, "顯示"],
            [/未完了/g, "未完成"],
            [/完了/g, "完成"],
            [/続けますか/g, "要繼續嗎？"],
            [/先に/g, "請先"],
            [/してください/g, "。"],
            [/できません/g, "無法執行"],
            [/ありません/g, "不存在"],
            [/見つかりません/g, "找不到"],
            [/(\d+)名/g, "$1人"],
            [/(\d+)人/g, "$1人"],
            [/(\d+)本/g, "$1面旗幟"],
            [/(\d+)件/g, "$1筆"]
        ]
    };

    const originalText = new WeakMap();
    const originalAttributes = new WeakMap();
    const selfUpdatedText = new WeakSet();
    const selfUpdatedAttributes = new WeakMap();
    const observedRoots = [];
    const observers = [];
    const translatedAttributes = [
        "title",
        "placeholder",
        "aria-label"
    ];

    let currentLanguage = "ja";

    function normalizeLanguage(language) {
        if (language === "zh-TW" || language === "zh-HK" || language === "zh-Hant") {
            return "zh-Hant";
        }

        if (language && language.toLowerCase().startsWith("ja")) {
            return "ja";
        }

        return supportedLanguages.includes(language)
            ? language
            : "en";
    }

    function getInitialLanguage() {
        try {
            const savedLanguage =
                localStorage.getItem(storageKey);

            if (supportedLanguages.includes(savedLanguage)) {
                return savedLanguage;
            }
        } catch (error) {
            console.warn("Language preference could not be loaded.", error);
        }

        return normalizeLanguage(
            navigator.language || "en"
        );
    }

    function translateCore(source, language) {
        if (!source || language === "ja") {
            return source;
        }

        const normalizedSource =
            source.replace(/\s+/g, " ").trim();

        const entry =
            catalog[source] ||
            catalog[normalizedSource];

        if (entry) {
            return language === "en"
                ? entry[0]
                : entry[1];
        }

        const matchingDynamicRule =
            dynamicRules[language].find(
                function (rule) {
                    return rule[0].test(
                        normalizedSource
                    );
                }
            );

        if (matchingDynamicRule) {
            return normalizedSource.replace(
                matchingDynamicRule[0],
                matchingDynamicRule[1]
            );
        }

        let translated = source;

        phraseRules[language].forEach(
            function (rule) {
                translated = translated.replace(
                    rule[0],
                    rule[1]
                );
            }
        );

        return translated;
    }

    function translate(source, language) {
        if (typeof source !== "string") {
            return source;
        }

        const leadingWhitespace =
            source.match(/^\s*/)[0];

        const trailingWhitespace =
            source.match(/\s*$/)[0];

        const content = source.trim();

        if (!content) {
            return source;
        }

        return (
            leadingWhitespace +
            translateCore(
                content,
                language || currentLanguage
            ) +
            trailingWhitespace
        );
    }

    function shouldIgnore(node) {
        const element =
            node.nodeType === Node.ELEMENT_NODE
                ? node
                : node.parentElement;

        if (
            element &&
            element.closest(
                ".temporary-player-badge"
            )
        ) {
            return false;
        }

        if (
            element &&
            element.closest(
                ".player-list-name"
            )
        ) {
            return true;
        }

        return Boolean(
            element &&
            element.closest(
                ".i18n-skip, #grid"
            )
        );
    }

    function markAttributeAsSelfUpdated(
        element,
        attributeName
    ) {
        let names =
            selfUpdatedAttributes.get(element);

        if (!names) {
            names = new Set();
            selfUpdatedAttributes.set(
                element,
                names
            );
        }

        names.add(attributeName);
    }

    function translateTextNode(
        node,
        captureOriginal
    ) {
        if (shouldIgnore(node)) {
            return;
        }

        if (
            captureOriginal ||
            !originalText.has(node)
        ) {
            originalText.set(
                node,
                node.nodeValue
            );
        }

        const source = originalText.get(node);
        const translated =
            translate(source, currentLanguage);

        if (node.nodeValue === translated) {
            return;
        }

        selfUpdatedText.add(node);
        node.nodeValue = translated;
    }

    function translateElementAttributes(
        element,
        captureOriginal
    ) {
        if (shouldIgnore(element)) {
            return;
        }

        let originals =
            originalAttributes.get(element);

        if (!originals) {
            originals = new Map();
            originalAttributes.set(
                element,
                originals
            );
        }

        translatedAttributes.forEach(
            function (attributeName) {
                if (!element.hasAttribute(attributeName)) {
                    return;
                }

                if (
                    captureOriginal ||
                    !originals.has(attributeName)
                ) {
                    originals.set(
                        attributeName,
                        element.getAttribute(
                            attributeName
                        )
                    );
                }

                const source =
                    originals.get(attributeName);

                const translated =
                    translate(source, currentLanguage);

                if (
                    element.getAttribute(
                        attributeName
                    ) === translated
                ) {
                    return;
                }

                markAttributeAsSelfUpdated(
                    element,
                    attributeName
                );

                element.setAttribute(
                    attributeName,
                    translated
                );
            }
        );
    }

    function translateTree(
        root,
        captureOriginal
    ) {
        if (!root || shouldIgnore(root)) {
            return;
        }

        if (root.nodeType === Node.TEXT_NODE) {
            translateTextNode(
                root,
                captureOriginal
            );
            return;
        }

        if (root.nodeType !== Node.ELEMENT_NODE) {
            return;
        }

        translateElementAttributes(
            root,
            captureOriginal
        );

        const elementWalker =
            document.createTreeWalker(
                root,
                NodeFilter.SHOW_ELEMENT
            );

        while (elementWalker.nextNode()) {
            translateElementAttributes(
                elementWalker.currentNode,
                captureOriginal
            );
        }

        const textWalker =
            document.createTreeWalker(
                root,
                NodeFilter.SHOW_TEXT
            );

        while (textWalker.nextNode()) {
            translateTextNode(
                textWalker.currentNode,
                captureOriginal
            );
        }
    }

    function handleMutations(mutations) {
        mutations.forEach(function (mutation) {
            if (
                mutation.type === "characterData"
            ) {
                if (
                    selfUpdatedText.has(
                        mutation.target
                    )
                ) {
                    selfUpdatedText.delete(
                        mutation.target
                    );
                    return;
                }

                translateTextNode(
                    mutation.target,
                    true
                );
                return;
            }

            if (
                mutation.type === "attributes"
            ) {
                const names =
                    selfUpdatedAttributes.get(
                        mutation.target
                    );

                if (
                    names &&
                    names.has(
                        mutation.attributeName
                    )
                ) {
                    names.delete(
                        mutation.attributeName
                    );
                    return;
                }

                translateElementAttributes(
                    mutation.target,
                    true
                );
                return;
            }

            mutation.addedNodes.forEach(
                function (node) {
                    translateTree(node, true);
                }
            );
        });
    }

    function observeRoot(root) {
        if (!root) {
            return;
        }

        observedRoots.push(root);

        const observer =
            new MutationObserver(
                handleMutations
            );

        observer.observe(root, {
            subtree: true,
            childList: true,
            characterData: true,
            attributes: true,
            attributeFilter:
                translatedAttributes
        });

        observers.push(observer);
    }

    function applyLanguage(language) {
        currentLanguage =
            normalizeLanguage(language);

        document.documentElement.lang =
            currentLanguage;

        const languageSelect =
            document.getElementById(
                "language-select"
            );

        if (languageSelect) {
            languageSelect.value =
                currentLanguage;
        }

        observedRoots.forEach(
            function (root) {
                translateTree(root, false);
            }
        );

        try {
            localStorage.setItem(
                storageKey,
                currentLanguage
            );
        } catch (error) {
            console.warn(
                "Language preference could not be saved.",
                error
            );
        }

        window.dispatchEvent(
            new CustomEvent(
                "alliance-language-change",
                {
                    detail: {
                        language:
                            currentLanguage
                    }
                }
            )
        );
    }

    const originalAlert =
        window.alert.bind(window);

    const originalConfirm =
        window.confirm.bind(window);

    const originalPrompt =
        window.prompt.bind(window);

    window.alert = function (message) {
        return originalAlert(
            translate(
                String(message),
                currentLanguage
            )
        );
    };

    window.confirm = function (message) {
        return originalConfirm(
            translate(
                String(message),
                currentLanguage
            )
        );
    };

    window.prompt = function (
        message,
        defaultValue
    ) {
        return originalPrompt(
            translate(
                String(message),
                currentLanguage
            ),
            defaultValue
        );
    };

    window.AllianceI18n = {
        t: function (source) {
            return translate(
                source,
                currentLanguage
            );
        },

        getLanguage: function () {
            return currentLanguage;
        },

        setLanguage: applyLanguage
    };

    [
        document.querySelector("header"),
        document.getElementById("instruction"),
        document.getElementById("side-panel"),
        document.getElementById("setup-guide-modal")
    ].forEach(observeRoot);

    const bodyObserver =
        new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                mutation.addedNodes.forEach(
                    function (node) {
                        if (
                            node.nodeType ===
                                Node.ELEMENT_NODE &&
                            node.matches(
                                ".mobile-action-menu"
                            )
                        ) {
                            translateTree(
                                node,
                                true
                            );
                        }
                    }
                );
            });
        });

    bodyObserver.observe(document.body, {
        childList: true
    });

    const languageSelect =
        document.getElementById(
            "language-select"
        );

    if (languageSelect) {
        languageSelect.addEventListener(
            "change",
            function () {
                applyLanguage(
                    languageSelect.value
                );
            }
        );
    }

    applyLanguage(getInitialLanguage());
})();
