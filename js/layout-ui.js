// =======================================
// レイアウト管理UI
// =======================================

const layoutSelect =
    document.getElementById("layout-select");

const currentLayoutNameElement =
    document.getElementById(
        "current-layout-name"
    );

const layoutMessageElement =
    document.getElementById(
        "layout-message"
    );

const newLayoutButton =
    document.getElementById("new-layout");

const duplicateLayoutButton =
    document.getElementById(
        "duplicate-layout"
    );

const renameLayoutButton =
    document.getElementById(
        "rename-layout"
    );

const deleteLayoutButton =
    document.getElementById(
        "delete-layout"
    );


// =======================================
// レイアウト選択
// =======================================

if (layoutSelect) {
    layoutSelect.addEventListener(
        "change",
        function () {
            switchLayoutFromUi(
                layoutSelect.value
            );
        }
    );
}


// =======================================
// 新規レイアウト
// =======================================

if (newLayoutButton) {
    newLayoutButton.addEventListener(
        "click",
        createNewLayoutFromUi
    );
}


// =======================================
// レイアウト複製
// =======================================

if (duplicateLayoutButton) {
    duplicateLayoutButton.addEventListener(
        "click",
        duplicateLayoutFromUi
    );
}


// =======================================
// 名前変更
// =======================================

if (renameLayoutButton) {
    renameLayoutButton.addEventListener(
        "click",
        renameLayoutFromUi
    );
}


// =======================================
// 削除
// =======================================

if (deleteLayoutButton) {
    deleteLayoutButton.addEventListener(
        "click",
        deleteLayoutFromUi
    );
}


// =======================================
// 新規レイアウトを作成
// =======================================

function createNewLayoutFromUi() {
    const app = window.AllianceApp;

    if (
        typeof app.addNewLayout !==
        "function"
    ) {
        showLayoutMessage(
            "新規レイアウト作成機能を利用できません。",
            true
        );

        return;
    }

    const defaultName =
        createDefaultLayoutName();

    const inputName =
        window.prompt(
            "新しいレイアウト名を入力してください。",
            defaultName
        );

    if (inputName === null) {
        return;
    }

    const layoutName =
        app.normalizeLayoutName(
            inputName
        ) || defaultName;

    if (isDuplicateLayoutName(layoutName)) {
        showLayoutMessage(
            "同じ名前のレイアウトがすでにあります。",
            true
        );

        return;
    }

    app.addNewLayout(layoutName);

    refreshAfterLayoutChange();

    app.autoSave();

    showLayoutMessage(
        `「${layoutName}」を作成しました。`,
        false
    );
}


// =======================================
// 現在のレイアウトを複製
// =======================================

function duplicateLayoutFromUi() {
    const app = window.AllianceApp;

    const currentLayout =
        app.getCurrentLayout();

    if (!currentLayout) {
        showLayoutMessage(
            "複製するレイアウトがありません。",
            true
        );

        return;
    }

    if (
        typeof app.duplicateCurrentLayout !==
        "function"
    ) {
        showLayoutMessage(
            "レイアウト複製機能を利用できません。",
            true
        );

        return;
    }

    const defaultName =
        createCopyLayoutName(
            currentLayout.name
        );

    const inputName =
        window.prompt(
            "複製後のレイアウト名を入力してください。",
            defaultName
        );

    if (inputName === null) {
        return;
    }

    const layoutName =
        app.normalizeLayoutName(
            inputName
        ) || defaultName;

    if (isDuplicateLayoutName(layoutName)) {
        showLayoutMessage(
            "同じ名前のレイアウトがすでにあります。",
            true
        );

        return;
    }

        app.duplicateCurrentLayout(
        layoutName
    );

    refreshAfterLayoutChange();

    app.autoSave();

    showLayoutMessage(
        `「${layoutName}」を作成しました。`,
        false
    );
}


// =======================================
// レイアウトを切り替える
// =======================================

function switchLayoutFromUi(layoutId) {
    const app = window.AllianceApp;

    if (!layoutId) {
        return;
    }

    if (
        layoutId ===
        app.state.currentLayoutId
    ) {
        return;
    }

    if (
        typeof app.switchLayout !==
        "function"
    ) {
        showLayoutMessage(
            "レイアウト切替機能を利用できません。",
            true
        );

        return;
    }

    const targetLayout =
        app.getLayoutById(layoutId);

    if (!targetLayout) {
        showLayoutMessage(
            "選択したレイアウトが見つかりません。",
            true
        );

        refreshLayoutUi();

        return;
    }

    app.switchLayout(layoutId);

    app.state.selectedPlayerId =
        null;

    refreshAfterLayoutChange();

    showLayoutMessage(
        `「${targetLayout.name}」へ切り替えました。`,
        false
    );
}


// =======================================
// 現在のレイアウト名を変更
// =======================================

function renameLayoutFromUi() {
    const app = window.AllianceApp;

    const currentLayout =
        app.getCurrentLayout();

    if (!currentLayout) {
        showLayoutMessage(
            "名前を変更するレイアウトがありません。",
            true
        );

        return;
    }

    const inputName =
        window.prompt(
            "新しいレイアウト名を入力してください。",
            currentLayout.name
        );

    if (inputName === null) {
        return;
    }

    const layoutName =
        app.normalizeLayoutName(
            inputName
        );

    if (!layoutName) {
        showLayoutMessage(
            "レイアウト名を入力してください。",
            true
        );

        return;
    }

    if (
        layoutName !== currentLayout.name &&
        isDuplicateLayoutName(layoutName)
    ) {
        showLayoutMessage(
            "同じ名前のレイアウトがすでにあります。",
            true
        );

        return;
    }

    if (
        typeof app.renameCurrentLayout !==
        "function"
    ) {
        showLayoutMessage(
            "名前変更機能を利用できません。",
            true
        );

        return;
    }

    app.renameCurrentLayout(
        layoutName
    );

    refreshLayoutUi();

    app.autoSave();

    showLayoutMessage(
        `レイアウト名を「${layoutName}」へ変更しました。`,
        false
    );
}


// =======================================
// 現在のレイアウトを削除
// =======================================

function deleteLayoutFromUi() {
    const app = window.AllianceApp;

    if (
        app.state.layouts.length <= 1
    ) {
        showLayoutMessage(
            "最後の1つのレイアウトは削除できません。",
            true
        );

        return;
    }

    const currentLayout =
        app.getCurrentLayout();

    if (!currentLayout) {
        showLayoutMessage(
            "削除するレイアウトがありません。",
            true
        );

        return;
    }

    const confirmed =
        window.confirm(
            `「${currentLayout.name}」を削除しますか？\n\n` +
            "配置した本部・旗・プレイヤー情報も削除されます。"
        );

    if (!confirmed) {
        return;
    }

    if (
        typeof app.deleteLayout !==
        "function"
    ) {
        showLayoutMessage(
            "レイアウト削除機能を利用できません。",
            true
        );

        return;
    }

    const deletedName =
        currentLayout.name;

    app.deleteLayout(
        currentLayout.id
    );

    app.state.selectedPlayerId =
        null;

    refreshAfterLayoutChange();

    showLayoutMessage(
        `「${deletedName}」を削除しました。`,
        false
    );
}


// =======================================
// レイアウトUIを更新
// =======================================

function refreshLayoutUi() {
    const app = window.AllianceApp;

    if (!layoutSelect) {
        return;
    }

    const currentLayout =
        app.getCurrentLayout();

    layoutSelect.innerHTML = "";

    app.state.layouts.forEach(
        function (layout) {
            const option =
                document.createElement(
                    "option"
                );

            option.value =
                layout.id;

            option.textContent =
                layout.name;

            if (
                layout.id ===
                app.state.currentLayoutId
            ) {
                option.selected = true;
            }

            layoutSelect.appendChild(
                option
            );
        }
    );

    if (currentLayoutNameElement) {
        currentLayoutNameElement.textContent =
            currentLayout
                ? currentLayout.name
                : "なし";
    }

    if (deleteLayoutButton) {
        deleteLayoutButton.disabled =
            app.state.layouts.length <= 1;
    }
}


// =======================================
// レイアウト変更後の画面更新
// =======================================

function refreshAfterLayoutChange() {
    const app =
        window.AllianceApp;

    if (
        typeof renderMap ===
        "function"
    ) {
        renderMap();
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
        typeof refreshCoordinateUi ===
        "function"
    ) {
        refreshCoordinateUi();
    }

    refreshLayoutUi();

    app.autoSave();
}


// =======================================
// レイアウト名重複確認
// =======================================

function isDuplicateLayoutName(
    layoutName
) {
    const app = window.AllianceApp;

    const normalizedTarget =
        String(layoutName)
            .trim()
            .toLowerCase();

    return app.state.layouts.some(
        function (layout) {
            return (
                String(layout.name)
                    .trim()
                    .toLowerCase() ===
                normalizedTarget
            );
        }
    );
}


// =======================================
// 新規レイアウトの初期名
// =======================================

function createDefaultLayoutName() {
    const app = window.AllianceApp;

    let layoutNumber = 1;

    while (true) {
        const candidateName =
            `案${convertNumberToLetter(
                layoutNumber
            )}`;

        if (
            !isDuplicateLayoutName(
                candidateName
            )
        ) {
            return candidateName;
        }

        layoutNumber++;
    }
}


// =======================================
// 複製レイアウト名
// =======================================

function createCopyLayoutName(
    originalName
) {
    let candidateName =
        `${originalName} コピー`;

    let copyNumber = 2;

    while (
        isDuplicateLayoutName(
            candidateName
        )
    ) {
        candidateName =
            `${originalName} コピー${copyNumber}`;

        copyNumber++;
    }

    return candidateName;
}


// =======================================
// 数字をアルファベットへ変換
// 1=A、2=B、27=AA
// =======================================

function convertNumberToLetter(number) {
    let result = "";
    let currentNumber = number;

    while (currentNumber > 0) {
        currentNumber--;

        result =
            String.fromCharCode(
                65 +
                (
                    currentNumber % 26
                )
            ) +
            result;

        currentNumber =
            Math.floor(
                currentNumber / 26
            );
    }

    return result;
}


// =======================================
// レイアウトメッセージ
// =======================================

function showLayoutMessage(
    message,
    isError
) {
    if (!layoutMessageElement) {
        return;
    }

    layoutMessageElement.textContent =
        message;

    layoutMessageElement.classList.toggle(
        "error",
        isError
    );

    layoutMessageElement.classList.toggle(
        "success",
        !isError
    );
}


// =======================================
// 初期表示
// =======================================

refreshLayoutUi();

console.log(
    "layout-ui.js 読み込みOK"
);
