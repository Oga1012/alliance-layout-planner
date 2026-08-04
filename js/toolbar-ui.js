// =======================================
// ツールボタン
// =======================================

const toolButtons =
    document.querySelectorAll(".tool-button");

toolButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        if (button.disabled) {
            return;
        }

        const selectedTool =
            button.dataset.tool;

        window.AllianceApp.state.selectedTool =
            selectedTool;

        toolButtons.forEach(function (item) {
            item.classList.remove("active");
        });

        button.classList.add("active");

        updateInstruction(selectedTool);

        console.log(
            "選択中のツール:",
            selectedTool
        );
    });

});


// =======================================
// 操作説明
// =======================================

function updateInstruction(selectedTool) {

    const instructionElement =
        document.getElementById(
            "instruction"
        );

    if (!instructionElement) {
        return;
    }

    const instructionMessages = {

        hq:
            "「同盟本部」を配置します。クリックしたマスが本部の左上になります。",

        flag:
            "「旗」を配置します。現在の領地とつながるマスをクリックしてください。",

        bear1:
            "「熊罠1」を配置します。3×3の中心にするマスをクリックしてください。",

        bear2:
            "「熊罠2」を配置します。3×3の中心にするマスをクリックしてください。",

        player:
            "一覧からプレイヤーを選び、配置したいマスをクリックしてください。クリックしたマスが2×2の左上になります。",

        "fixed-coal":
            "石炭工場を配置します。クリックしたマスが2×2の左上になります。",

        "fixed-farm":
            "牧場を配置します。クリックしたマスが2×2の左上になります。",

        "fixed-lumber":
            "製材所を配置します。クリックしたマスが2×2の左上になります。",

        "fixed-iron":
            "鉄鉱場を配置します。クリックしたマスが2×2の左上になります。",

        pan:
            "マップをドラッグして表示位置を移動します。"

    };

    instructionElement.textContent =
        instructionMessages[selectedTool] ||
        "配置するツールを選択してください。";
}

const bearLayerToggle =
    document.getElementById(
        "layer-bears"
    );

if (bearLayerToggle) {
    bearLayerToggle.addEventListener(
        "change",
        function () {
            renderMap();
        }
    );
}

const connectionLayerToggle =
    document.getElementById(
        "layer-connections"
    );

if (connectionLayerToggle) {
    connectionLayerToggle.addEventListener(
        "change",
        function () {
            renderMap();
        }
    );
}

const fixedLayerToggle =
    document.getElementById(
        "layer-fixed"
    );

if (fixedLayerToggle) {
    fixedLayerToggle.addEventListener(
        "change",
        function () {
            renderMap();
        }
    );
}


console.log(
    "toolbar-ui.js 読み込みOK"
);
