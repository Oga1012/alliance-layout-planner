// ========================================
// 熊罠の開始時刻設定
// ========================================

const bear1StartTimeInput =
    document.getElementById(
        "bear1-start-time"
    );

const bear2StartTimeInput =
    document.getElementById(
        "bear2-start-time"
    );

const bearTimeMessage =
    document.getElementById(
        "bear-time-message"
    );

const hqDirectionSelect =
    document.getElementById(
        "hq-direction"
    );

const autoLayoutModeSelect =
    document.getElementById(
        "auto-layout-mode"
    );

const bear1Summary =
    document.getElementById(
        "bear1-summary"
    );

const bear2Summary =
    document.getElementById(
        "bear2-summary"
    );

const unassignedSummary =
    document.getElementById(
        "unassigned-summary"
    );

const autoGenerateLayoutButton =
    document.getElementById(
        "auto-generate-layout"
    );

function normalizeBearTime(value, fallback) {
    const text =
        String(value || "").trim();

    if (
        /^\d{2}:\d{2}$/.test(text)
    ) {
        return text;
    }

    return fallback;
}

function updateBearTrapTime(
    type,
    inputElement
) {
    const app = window.AllianceApp;

    const fallback =
        type === "bear1"
            ? "12:00"
            : "13:00";

    const newTime =
        normalizeBearTime(
            inputElement.value,
            fallback
        );

    if (
        app.state.bearTrapTimes[type] ===
        newTime
    ) {
        return;
    }

    app.saveHistory();

    app.state.bearTrapTimes[type] =
        newTime;

    renderMap();

    if (
        typeof refreshPlayerUi ===
        "function"
    ) {
        refreshPlayerUi();
    }

    app.autoSave();

    if (bearTimeMessage) {
        bearTimeMessage.textContent =
            `${
                type === "bear1"
                    ? "熊罠1"
                    : "熊罠2"
            }を ${newTime} UTC に設定しました。`;
    }
}

function refreshBearTrapUi() {
    const app = window.AllianceApp;

    if (bear1StartTimeInput) {
        bear1StartTimeInput.value =
            normalizeBearTime(
                app.state.bearTrapTimes.bear1,
                "12:00"
            );
    }

    if (bear2StartTimeInput) {
        bear2StartTimeInput.value =
            normalizeBearTime(
                app.state.bearTrapTimes.bear2,
                "13:00"
            );
    }

    if (hqDirectionSelect) {
        hqDirectionSelect.value =
            app.state.hqDirection ||
            "east";
    }

    const autoLayoutMode =
        autoLayoutModeSelect
            ? autoLayoutModeSelect.value
            : "headquarters-and-flags";

    const preserveHeadquarters =
        autoLayoutMode === "flags-only";

    if (hqDirectionSelect) {
        hqDirectionSelect.disabled =
            preserveHeadquarters;
    }

    if (autoGenerateLayoutButton) {
        autoGenerateLayoutButton.disabled =
            !app.state.bearTraps.bear1 ||
            !app.state.bearTraps.bear2 ||
            (
                preserveHeadquarters &&
                !app.state.headquarters
            );

        autoGenerateLayoutButton.textContent =
            preserveHeadquarters
                ? "手動本部を残して旗を自動配置"
                : "本部と旗を自動配置";
    }

    refreshBearGroupSummary();
}


if (autoLayoutModeSelect) {
    autoLayoutModeSelect.addEventListener(
        "change",
        function () {
            const preserveHeadquarters =
                autoLayoutModeSelect.value ===
                "flags-only";

            refreshBearTrapUi();

            if (bearTimeMessage) {
                bearTimeMessage.textContent =
                    preserveHeadquarters
                        ? "先に本部を手動配置すると、その位置を残して旗だけ自動配置します。"
                        : "熊罠を基準に、本部と旗をまとめて自動配置します。";
            }
        }
    );
}

function createPrioritySummary(players) {
    const priorities = [
        "SS",
        "S",
        "A",
        "B",
        "C",
        "D"
    ];

    const counts = {};

    priorities.forEach(
        function (priority) {
            counts[priority] = 0;
        }
    );

    counts.unset = 0;

    players.forEach(function (player) {
        const priority =
            player.priority || "";

        if (
            priorities.includes(
                priority
            )
        ) {
            counts[priority]++;
        } else {
            counts.unset++;
        }
    });

    return [
        ...priorities.map(
            function (priority) {
                return (
                    `${priority}:${counts[priority]}`
                );
            }
        ),
        `未設定:${counts.unset}`
    ].join(" / ");
}

function setBearSummaryCard(
    element,
    title,
    players
) {
    if (!element) {
        return;
    }

    element.innerHTML = "";

    const heading =
        document.createElement("strong");

    heading.textContent =
        `${title}：${players.length}人`;

    const details =
        document.createElement("span");

    details.textContent =
        createPrioritySummary(players);

    element.appendChild(heading);
    element.appendChild(details);
}

function refreshBearGroupSummary() {
    const app = window.AllianceApp;

    const groups = {
        bear1: [],
        bear2: [],
        unassigned: []
    };

    app.state.players.forEach(
        function (player) {
            const bearType =
                app.getPreferredBearType(
                    player
                );

            if (bearType) {
                groups[bearType].push(
                    player
                );
            } else {
                groups.unassigned.push(
                    player
                );
            }
        }
    );

    setBearSummaryCard(
        bear1Summary,
        "熊罠1",
        groups.bear1
    );

    setBearSummaryCard(
        bear2Summary,
        "熊罠2",
        groups.bear2
    );

    setBearSummaryCard(
        unassignedSummary,
        "希望時刻未設定",
        groups.unassigned
    );
}

if (bear1StartTimeInput) {
    bear1StartTimeInput.addEventListener(
        "change",
        function () {
            updateBearTrapTime(
                "bear1",
                bear1StartTimeInput
            );
        }
    );
}

if (bear2StartTimeInput) {
    bear2StartTimeInput.addEventListener(
        "change",
        function () {
            updateBearTrapTime(
                "bear2",
                bear2StartTimeInput
            );
        }
    );
}

if (hqDirectionSelect) {
    hqDirectionSelect.addEventListener(
        "change",
        function () {
            const app =
                window.AllianceApp;

            const direction =
                hqDirectionSelect.value;

            if (
                ![
                    "north",
                    "south",
                    "east",
                    "west"
                ].includes(direction) ||
                app.state.hqDirection ===
                    direction
            ) {
                return;
            }

            app.saveHistory();

            app.state.hqDirection =
                direction;

            app.autoSave();

            if (bearTimeMessage) {
                const labels = {
                    north: "北",
                    south: "南",
                    east: "東",
                    west: "西"
                };

                bearTimeMessage.textContent =
                    `本部の方向を「${labels[direction]}」に設定しました。`;
            }
        }
    );
}

if (autoGenerateLayoutButton) {
    autoGenerateLayoutButton.addEventListener(
        "click",
        function () {
            if (
                typeof
                    autoGenerateHeadquartersAndFlags !==
                "function"
            ) {
                return;
            }

            autoGenerateHeadquartersAndFlags({
                preserveHeadquarters:
                    autoLayoutModeSelect &&
                    autoLayoutModeSelect.value ===
                        "flags-only"
            });
        }
    );
}

refreshBearTrapUi();
