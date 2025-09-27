// The dkrSPAproperties object holds the created observers.
// This is necessary to avoid creating multiple observers for the same purpose, which could happen, if the user navigates away from the form and then returns to it.
window.dkrSPAproperties = window.dkrSPAproperties || {};


window.dkr = window.dkr || {}
dkr.chooseFieldAddNew = {}
dkr.chooseFieldAddNew.modalsId = "Modals"
// Depending on the type of choose field, we need a different query selector to identify the "Add New" button.
dkr.chooseFieldAddNew.addNewButtonPopupSearchQuerySelector = "a.picker-search-modal__add-new-button"
dkr.chooseFieldAddNew.addNewButtonAutoCompleteSearchQuerySelector = "a.autocomplete-dropdown-header__add-new-item, a.autocomplete-dropdown-footer__add-new-item"
dkr.chooseFieldAddNew.executeSearchAgain = function () {
    const searchButton = document.querySelector("#Modals button.picker-search-button")
    if (searchButton) {
        searchButton.click();
    }
}

// This function modifies the "Add New" button to remove the target attribute, if it is a JavaScript link.
// Due to the fact, that the a tag has the target attribute set to "_blank", it opens the link in a new tab and will prevent the modal from being displayed.
// This is the only reason, why all the other functions are necessary.
dkr.chooseFieldAddNew.modifyAddNewButton = function (querySelector) {
    const element = document.querySelector(querySelector);
    if (!element) {
        return;
    }

    if (element.href.trim().toLowerCase().startsWith('javascript')) {
        element.removeAttribute('target');
        console.log("Updating add new button");
    }
}


// We want to add an observer to the <div id="Modals"> element.
// This will allow us to modify the "Add New" button when it appears.
// In some cases the div is not present and we need to add an observer to the body to watch for its creation.
// If it already exists, we will set up the button observer directly.
dkr.chooseFieldAddNew.observeModalAndButton = function (callback) {

    if (window.dkrSPAproperties.chooseFieldAddNew_buttonObserver) {
        return;
    } else {
        // If the modal already exists, set up button observer without setting up the body observer
        const modalsDiv = document.getElementById(dkr.chooseFieldAddNew.modalsId);
        if (modalsDiv) {
            dkr.chooseFieldAddNew.observeAddNewButton(callback, modalsDiv);
            return;
        }
    }
    // If body observer already exists, do not create a new one
    // It already exists and will add the observer to the modal dialog as soo as it appears.
    if (window.dkrSPAproperties.chooseFieldAddNew_bodyObserver) {
        return;
    }

    console.log("Adding new 'choose field body' observer");
    // First observer: watch body for #modals div
    const bodyObserver = new MutationObserver(function (mutationsList, observer) {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1 && node.id === dkr.chooseFieldAddNew.modalsId) {
                        // Found #Modals, add button observer and stop watching body.
                        dkr.chooseFieldAddNew.observeAddNewButton(callback, node);
                        observer.disconnect();
                        window.dkrSPAproperties.chooseFieldAddNew_bodyObserver = null;
                        return;
                    }
                }
            }
        }
    });
    bodyObserver.observe(document.body, { childList: true });
    window.dkrSPAproperties.chooseFieldAddNew_bodyObserver = bodyObserver;

};

// This function sets up an observer for modals div and will check any changes to it's child hierarchy for the "Add New" button.
dkr.chooseFieldAddNew.observeAddNewButton = function (callback, modalsDiv) {
    if (!modalsDiv) return null;

    // If button observer already exists, do not create a new one
    if (window.dkrSPAproperties.chooseFieldAddNew_buttonObserver) {
        return;
    }

    console.log("Adding new 'choose field add new button' observer");
    const buttonObserver = new MutationObserver(function () {
        const element = modalsDiv.querySelector(dkr.chooseFieldAddNew.addNewButtonPopupSearchQuerySelector);
        if (element) {
            callback(dkr.chooseFieldAddNew.addNewButtonPopupSearchQuerySelector);
        }
    });
    buttonObserver.observe(modalsDiv, { childList: true, subtree: true });
    window.dkrSPAproperties.chooseFieldAddNew_buttonObserver = buttonObserver;
    return buttonObserver;
};

// We need a different observer for choose fields of type autocomplete. 
// If the autocomplete dropdown is opened, it will add div with a '.webcon-dropdown' class to the body.
dkr.chooseFieldAddNew.observeDropdownAddNewButton = function (callback) {
    if (window.dkrSPAproperties.chooseFieldAddNew_dropdownObserver) {
        return;
    }
    const observer = new MutationObserver(() => {
        console.log("Choose field dropdown observer triggered");
        const dropdown = document.body.querySelector('.webcon-dropdown');
        if (dropdown) {
            const addNewBtn = dropdown.querySelector(dkr.chooseFieldAddNew.addNewButtonAutoCompleteSearchQuerySelector);
            if (addNewBtn) {
                callback(dkr.chooseFieldAddNew.addNewButtonAutoCompleteSearchQuerySelector);
            }
            const dropdownObserver = new MutationObserver(() => {
                const addNewBtn = dropdown.querySelector(dkr.chooseFieldAddNew.addNewButtonAutoCompleteSearchQuerySelector);
                if (addNewBtn) {
                    callback(dkr.chooseFieldAddNew.addNewButtonAutoCompleteSearchQuerySelector);
                }
            });
            dropdownObserver.observe(dropdown, { childList: true, subtree: true });
            window.dkrSPAproperties.chooseFieldAddNew_dropdownInnerObserver = dropdownObserver;
        }
    });
    observer.observe(document.body, { childList: true });
    window.dkrSPAproperties.chooseFieldAddNew_dropdownObserver = observer;
};

dkr.chooseFieldAddNew.observeModalAndButton(dkr.chooseFieldAddNew.modifyAddNewButton);
dkr.chooseFieldAddNew.observeDropdownAddNewButton(dkr.chooseFieldAddNew.modifyAddNewButton);
console.log("Choose field add new button logic loaded.");
