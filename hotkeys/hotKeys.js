window.dkr = window.dkr || {}
// Prevents the script from running multiple times
window.dkrSPAproperties = window.dkrSPAproperties || {};
if (!window.dkrSPAproperties.hotkeysLoaded) {
    dkr.hotkeys = {};
    // I'm assuming that the selectors may change in later versions
    dkr.hotkeys.VersionDependingValues = [
        {
            version: '2025.1.1.1',
            values: {
                selectors: {
                    formEditButton: '#EditToolbarButton',
                    reportEditButton: 'button.report__settings-toolbar-button',
                    closeReportEditButton: '#closeSweConfigButton',
                    saveButton: 'i.ms-Icon--Save',
                    saveModalButton: '#Modals .modal-outer:last-child button[data-key="Save"]',
                    singleEditDialogApplyButton: '#Modals #SubelementsEditViewPopup button[data-key="ok-button"]',
                    acceptModalButton: '#Modals .modal-outer:last-child button[data-key="accept"]:last-of-type',
                    dashboardAcceptButton: 'button[data-name="accept"]',
                    closeModalButton: '#Modals .modal-outer:last-child button[data-key="Close"]:last-of-type',
                    singleEditDialogCloseButton: '#Modals #SubelementsEditViewPopup button[data-key="close-button"]',
                    dashboardCancelButton: 'button[data-name="accept"] + *',
                    dismissSidebarButton: '.sidebar-dash-header__buttons i[class*="icon-ic_fluent_dismiss"]',
                    dismissPreviewSidebarButton: '.webcon-sidebar-dash__header-buttons i[class*="icon-ic_fluent_dismiss"]',
                    dashboardSaveButton: 'button.modal-button[data-key="Save"]',
                    historyButton: '#HistoryToolbarButton',
                    backToInstanceFromHistoryButton: '#HistoryBackToElementButton',
                    openInNewWindowButton: 'i.ms-Icon--OpenInNewWindow'
                }
            }
        }
    ];
    dkr.hotkeys.versionValues = ccls.utils.getVersionValues(dkr.hotkeys.VersionDependingValues);

    dkr.hotkeys.isDashboardUrl = function () {
        return document.location.href.indexOf('dashboard') > -1 || /\/app\/\d+\/?$/.test(document.location.pathname);
    };

    dkr.hotkeys.handleClick = function (event, selector) {
        // const elements = document.querySelectorAll(selector);
        const element = document.querySelector(".configuration-sidebar__content iframe")?.contentDocument.querySelector(selector) || document.querySelector(selector);
        if (element) {
            event.preventDefault();
            // Trigger input event for React controls
            const activeElement = document.activeElement;
            if (activeElement) {
                activeElement.blur();
            }
            element.click();
            return true;
        }
        return false;
    };
    dkr.hotkeys.execute = function () {
        if (window.dkrSPAproperties.hotkeysLoaded) return;

        console.log('Adding hotkey event listeners');
        document.addEventListener('keydown', function (event) {
            // Check if Ctrl and Shift keys are pressed along with another key  
            if (event.ctrlKey && event.shiftKey && event.key !== 'Shift' && event.key !== 'Control') {
                let selectors = dkr.hotkeys.versionValues.selectors;
                switch (event.key) {
                    case 'C':
                        if (dkr.hotkeys.isDashboardUrl()) {
                            if (dkr.hotkeys.handleClick(event, selectors.closeModalButton)
                                || dkr.hotkeys.handleClick(event, selectors.singleEditDialogCloseButton)
                                || dkr.hotkeys.handleClick(event, selectors.dismissSidebarButton)
                                || dkr.hotkeys.handleClick(event, selectors.dashboardCancelButton)) {
                                return;
                            }
                        }

                        if (dkr.hotkeys.handleClick(event, selectors.singleEditDialogCloseButton)) {
                            return; 
                        }
                        if (dkr.hotkeys.handleClick(event, selectors.closeReportEditButton)
                            || dkr.hotkeys.handleClick(event, selectors.dismissPreviewSidebarButton)) {
                            return;
                        }
                        break;
                    case 'E':
                        if (document.location.href.indexOf('form') > -1) {
                            dkr.hotkeys.handleClick(event, selectors.formEditButton);
                        }
                        if (document.location.href.indexOf('report') > -1) {
                            dkr.hotkeys.handleClick(event, selectors.reportEditButton);
                        }
                        break;
                    case 'S':
                    case 'Q':
                        // Modal accept /save buttons
                        if (                            
                            dkr.hotkeys.handleClick(event, selectors.singleEditDialogApplyButton)
                            || dkr.hotkeys.handleClick(event, selectors.acceptModalButton)
                            || dkr.hotkeys.handleClick(event, selectors.saveModalButton)) {
                            return;
                        }

                        if (dkr.hotkeys.isDashboardUrl()) {
                            // Sidebar buttons
                            if (dkr.hotkeys.handleClick(event, selectors.dashboardAcceptButton)
                                || dkr.hotkeys.handleClick(event, selectors.dashboardSaveButton)) {
                                return;
                            }
                        }
                        // General save button
                        if (dkr.hotkeys.handleClick(event, selectors.saveButton)) {
                            return;
                        }
                        break;
                    case 'G':
                        if (dkr.hotkeys.handleClick(event, selectors.openInNewWindowButton)) {
                            return;
                        }
                        break;
                    case 'H':
                        if (dkr.hotkeys.handleClick(event, selectors.historyButton)
                            || dkr.hotkeys.handleClick(event, selectors.backToInstanceFromHistoryButton)) {
                            return;
                        }
                        break;
                }
                console.log(`No implementation was found for the hot key: '${event.key}'`);
            }
        });

        window.dkrSPAproperties.hotkeysLoaded = true;
    };

    dkr.hotkeys.execute();

    console.log('Hotkeys script loaded');
} else {
    console.log('Hotkeys script already loaded');
}