// =======================================
// ゲーム内座標設定UI
// =======================================

const kingdomNumberInput =
    document.getElementById("kingdom-number");

const headquartersGameXInput =
    document.getElementById("headquarters-game-x");

const headquartersGameYInput =
    document.getElementById("headquarters-game-y");

const gameCoordinateMessage =
    document.getElementById("game-coordinate-message");


function readIntegerInput(inputElement) {
    if (
        !inputElement ||
        inputElement.value.trim() === ""
    ) {
        return null;
    }

    const value = Number(inputElement.value);

    return Number.isInteger(value)
        ? value
        : null;
}


function saveGameCoordinateSettings() {
    const app = window.AllianceApp;

    const kingdom =
        readIntegerInput(kingdomNumberInput);
    const headquartersX =
        readIntegerInput(headquartersGameXInput);
    const headquartersY =
        readIntegerInput(headquartersGameYInput);

    if (
        kingdom === null ||
        kingdom < 1 ||
        headquartersX === null ||
        headquartersY === null
    ) {
        if (gameCoordinateMessage) {
            gameCoordinateMessage.textContent =
                "王国・本部X・本部Yを整数で入力してください。";
        }

        return false;
    }

    const previous =
        app.cloneGameCoordinates(
            app.state.gameCoordinates
        );

    if (
        previous.kingdom === kingdom &&
        previous.headquartersX === headquartersX &&
        previous.headquartersY === headquartersY
    ) {
        return true;
    }

    app.state.gameCoordinates = {
        kingdom: kingdom,
        headquartersX: headquartersX,
        headquartersY: headquartersY
    };

    app.saveCurrentLayoutState();
    app.autoSave();

    if (gameCoordinateMessage) {
        gameCoordinateMessage.textContent =
            `保存しました：#${kingdom} 本部 X${headquartersX} Y${headquartersY}`;
    }

    return true;
}


function refreshCoordinateUi() {
    const app = window.AllianceApp;
    const settings =
        app.cloneGameCoordinates(
            app.state.gameCoordinates
        );

    if (kingdomNumberInput) {
        kingdomNumberInput.value =
            String(settings.kingdom);
    }

    if (headquartersGameXInput) {
        headquartersGameXInput.value =
            String(settings.headquartersX);
    }

    if (headquartersGameYInput) {
        headquartersGameYInput.value =
            String(settings.headquartersY);
    }

    if (gameCoordinateMessage) {
        gameCoordinateMessage.textContent =
            app.state.headquarters
                ? `基準：#${settings.kingdom} 本部 X${settings.headquartersX} Y${settings.headquartersY}`
                : "本部を配置すると、マスに合わせてゲーム座標を表示します。";
    }
}


[
    kingdomNumberInput,
    headquartersGameXInput,
    headquartersGameYInput
].forEach(function (inputElement) {
    if (!inputElement) {
        return;
    }

    inputElement.addEventListener(
        "input",
        saveGameCoordinateSettings
    );
});
