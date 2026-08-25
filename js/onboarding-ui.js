// =======================================
// 初回準備ガイド
// =======================================

(function () {
    const modal =
        document.getElementById(
            "setup-guide-modal"
        );

    const openButton =
        document.getElementById(
            "open-setup-guide"
        );

    const closeButton =
        document.getElementById(
            "close-setup-guide"
        );

    const startButton =
        document.getElementById(
            "start-setup-guide"
        );

    const doNotShowCheckbox =
        document.getElementById(
            "setup-guide-do-not-show"
        );

    if (
        !modal ||
        !openButton ||
        !closeButton ||
        !startButton
    ) {
        return;
    }

    const storageKey =
        "alliance-layout-setup-guide-hidden:v1";

    let previouslyFocusedElement = null;

    function hasValidCoordinates(app) {
        const settings =
            app.state.gameCoordinates || {};

        return (
            Number.isFinite(
                Number(settings.kingdom)
            ) &&
            Number.isFinite(
                Number(settings.headquartersX)
            ) &&
            Number.isFinite(
                Number(settings.headquartersY)
            )
        );
    }

    function getGuideProgress() {
        const app = window.AllianceApp;

        if (!app || !app.state) {
            return {
                bears: false,
                headquarters: false,
                flags: false,
                playerData: false,
                playerPlacement: false
            };
        }

        const bearTraps =
            app.state.bearTraps || {};

        const flags =
            Array.isArray(app.state.flags)
                ? app.state.flags
                : [];

        const players =
            Array.isArray(app.state.players)
                ? app.state.players
                : [];

        return {
            bears: Boolean(
                bearTraps.bear1 &&
                bearTraps.bear2
            ),

            headquarters: Boolean(
                app.state.headquarters &&
                hasValidCoordinates(app)
            ),

            flags: flags.length > 0,

            playerData: players.length > 0,

            playerPlacement:
                players.length > 0 &&
                players.some(function (player) {
                    return player.isPlaced;
                })
        };
    }

    function updateGuideProgress() {
        const progress =
            getGuideProgress();

        const stepMap = {
            bears: progress.bears,
            headquarters:
                progress.headquarters,
            flags: progress.flags,
            "player-data":
                progress.playerData,
            "player-placement":
                progress.playerPlacement
        };

        Object.keys(stepMap).forEach(
            function (stepName) {
                const step =
                    modal.querySelector(
                        `[data-guide-step="${stepName}"]`
                    );

                if (!step) {
                    return;
                }

                const isComplete =
                    stepMap[stepName];

                step.classList.toggle(
                    "is-complete",
                    isComplete
                );

                const number =
                    step.querySelector(
                        ".setup-guide-number"
                    );

                const status =
                    step.querySelector(
                        ".setup-guide-status"
                    );

                if (number) {
                    number.textContent =
                        isComplete
                            ? "✓"
                            : String(
                                Array.from(
                                    modal.querySelectorAll(
                                        ".setup-guide-step"
                                    )
                                ).indexOf(step) + 1
                            );
                }

                if (status) {
                    status.textContent =
                        isComplete
                            ? "完了"
                            : stepName === "flags"
                                ? "任意"
                                : "未完了";
                }
            }
        );
    }

    function openGuide() {
        previouslyFocusedElement =
            document.activeElement;

        if (doNotShowCheckbox) {
            try {
                doNotShowCheckbox.checked =
                    localStorage.getItem(
                        storageKey
                    ) === "true";
            } catch (error) {
                doNotShowCheckbox.checked =
                    false;
            }
        }

        updateGuideProgress();

        modal.hidden = false;
        modal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "setup-guide-open"
        );

        requestAnimationFrame(function () {
            closeButton.focus();
        });
    }

    function saveAutomaticDisplayPreference() {
        try {
            if (
                doNotShowCheckbox &&
                doNotShowCheckbox.checked
            ) {
                localStorage.setItem(
                    storageKey,
                    "true"
                );
            } else {
                localStorage.removeItem(
                    storageKey
                );
            }
        } catch (error) {
            console.warn(
                "使い方ガイドの設定を保存できませんでした。",
                error
            );
        }
    }

    function closeGuide() {
        saveAutomaticDisplayPreference();

        modal.hidden = true;
        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "setup-guide-open"
        );

        if (
            previouslyFocusedElement &&
            typeof previouslyFocusedElement.focus ===
                "function"
        ) {
            previouslyFocusedElement.focus();
        }
    }

    function openSidePanel(contentId) {
        const content =
            document.getElementById(
                contentId
            );

        const toggleButton =
            document.querySelector(
                `.panel-toggle[aria-controls="${contentId}"]`
            );

        if (
            toggleButton &&
            toggleButton.getAttribute(
                "aria-expanded"
            ) !== "true"
        ) {
            toggleButton.click();
        }

        const panel =
            content
                ? content.closest("section")
                : null;

        const scrollTarget =
            panel || content;

        if (scrollTarget) {
            setTimeout(function () {
                scrollTarget.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }, 80);
        }
    }

    function startPreparation() {
        closeGuide();
        openSidePanel(
            "bear-settings-content"
        );
    }

    openButton.addEventListener(
        "click",
        openGuide
    );

    closeButton.addEventListener(
        "click",
        closeGuide
    );

    startButton.addEventListener(
        "click",
        startPreparation
    );

    modal
        .querySelectorAll("[data-guide-close]")
        .forEach(function (element) {
            element.addEventListener(
                "click",
                closeGuide
            );
        });

    modal
        .querySelectorAll(
            ".setup-guide-action"
        )
        .forEach(function (button) {
            button.addEventListener(
                "click",
                function () {
                    const panelId =
                        button.dataset
                            .guidePanel;

                    const toolName =
                        button.dataset
                            .guideTool;

                    closeGuide();

                    if (toolName) {
                        const toolButton =
                            document.querySelector(
                                `.tool-button[data-tool="${toolName}"]`
                            );

                        if (toolButton) {
                            toolButton.click();
                        }
                    }

                    if (panelId) {
                        openSidePanel(panelId);
                    }
                }
            );
        });

    document.addEventListener(
        "keydown",
        function (event) {
            if (
                event.key === "Escape" &&
                !modal.hidden
            ) {
                closeGuide();
            }
        }
    );

    let shouldShowAutomatically = true;

    try {
        shouldShowAutomatically =
            localStorage.getItem(
                storageKey
            ) !== "true";
    } catch (error) {
        console.warn(
            "使い方ガイドの設定を読み込めませんでした。",
            error
        );
    }

    if (shouldShowAutomatically) {
        setTimeout(openGuide, 350);
    }
})();
