// =======================================
// サイドパネルの折り畳み
// =======================================

(function () {
    const mobileQuery =
        window.matchMedia("(max-width: 768px)");

    const storagePrefix =
        "alliance-layout-panel:";

    function getStorageKey(contentId) {
        const deviceType =
            mobileQuery.matches
                ? "mobile"
                : "desktop";

        return (
            storagePrefix +
            deviceType +
            ":" +
            contentId
        );
    }

    function setPanelOpen(
        button,
        content,
        isOpen,
        saveState
    ) {
        button.setAttribute(
            "aria-expanded",
            String(isOpen)
        );

        content.hidden = !isOpen;

        const icon =
            button.querySelector(
                ".panel-toggle-icon"
            );

        if (icon) {
            icon.textContent =
                isOpen ? "⌃" : "⌄";
        }

        if (!saveState) {
            return;
        }

        try {
            localStorage.setItem(
                getStorageKey(content.id),
                isOpen ? "open" : "closed"
            );
        } catch (error) {
            console.warn(
                "折り畳み状態を保存できませんでした。",
                error
            );
        }
    }

    function getInitialState(contentId) {
        try {
            const savedState =
                localStorage.getItem(
                    getStorageKey(contentId)
                );

            if (savedState === "open") {
                return true;
            }

            if (savedState === "closed") {
                return false;
            }
        } catch (error) {
            console.warn(
                "折り畳み状態を読み込めませんでした。",
                error
            );
        }

        return !mobileQuery.matches;
    }

    function initializePanelToggle(button) {
        const contentId =
            button.getAttribute(
                "aria-controls"
            );

        const content =
            document.getElementById(
                contentId
            );

        if (!content) {
            return;
        }

        setPanelOpen(
            button,
            content,
            getInitialState(contentId),
            false
        );

        button.addEventListener(
            "click",
            function () {
                const isCurrentlyOpen =
                    button.getAttribute(
                        "aria-expanded"
                    ) === "true";

                setPanelOpen(
                    button,
                    content,
                    !isCurrentlyOpen,
                    true
                );
            }
        );
    }

    document
        .querySelectorAll(".panel-toggle")
        .forEach(initializePanelToggle);
})();
