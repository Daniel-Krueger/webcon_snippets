// The dkrSPAproperties object holds the created observers.
// This is necessary to avoid creating multiple observers for the same purpose, which could happen, if the user navigates away from the form and then returns to it.
window.dkrSPAproperties = window.dkrSPAproperties || {};

window.dkr = window.dkr || {}
dkr.singleRowEditApplyAndAddNew = {}
dkr.singleRowEditApplyAndAddNew.clickEditButtonMaxIterations = 20;
dkr.singleRowEditApplyAndAddNew.floatingPortalAttribute = "data-floating-ui-portal";
dkr.singleRowEditApplyAndAddNew.subElementParentDivId = "SubelementsEditView";
dkr.singleRowEditApplyAndAddNew.applyAndNewButtonId = "apply-and-add-new-button";
dkr.singleRowEditApplyAndAddNew.applyAndNextButtonQuerySelector = "button[data-key='next-button']"
dkr.singleRowEditApplyAndAddNew.applyAndNewButtonLabel = {
    "de": "Speichern und neu",
    "en": "Apply and add new",
    "pl": "Zastosuj i dodaj nowy"
}
dkr.singleRowEditApplyAndAddNew.itemLists = [{ listId: null, columnId: null, }];

dkr.singleRowEditApplyAndAddNew.createApplyAndNewButton = function (applyAndNextButton, currentItemListId) {
    let clonedButton = applyAndNextButton.cloneNode(true);
    clonedButton.removeAttribute('disabled');
    clonedButton.classList.remove("button--disabled");
    clonedButton.setAttribute('data-key', dkr.singleRowEditApplyAndAddNew.applyAndNewButtonId);
    const buttonContent = clonedButton.querySelector('.button__content');
    if (buttonContent) {
        // Get the browser language, e.g., 'de-de' -> 'de'
        const lang = (window.G_BROWSER_LANGUAGE || 'en').split('-')[0].toLowerCase();
        buttonContent.textContent = dkr.singleRowEditApplyAndAddNew.applyAndNewButtonLabel[lang] || dkr.singleRowEditApplyAndAddNew.applyAndNewButtonLabel['en'];
    }
    dkr.singleRowEditApplyAndAddNew.applyVisibility(currentItemListId, clonedButton);

    clonedButton.addEventListener('click', function () {
        console.log("clicked apply and add new");
        // Capture the resolved list id for the click handler
        const listId = currentItemListId;
        window.webcon.businessRules.subelementAddNewRow(listId).then(() => {
            const okButton = document.querySelector("button[data-key='ok-button']");
            if (okButton) {
                okButton.click();
                dkr.singleRowEditApplyAndAddNew.openDialogForNewRow(0, dkr.singleRowEditApplyAndAddNew.clickEditButtonMaxIterations, listId);
            }
        }).catch(err => console.error('subelementAddNewRow failed', err));
    });

    applyAndNextButton.parentNode.insertBefore(clonedButton, applyAndNextButton.nextSibling);
    new MutationObserver(function () {
        console.log("Mutation observed, updating apply and new button visibility");
        dkr.singleRowEditApplyAndAddNew.applyVisibility(currentItemListId, clonedButton);
    }).observe(applyAndNextButton, { attributes: true});
}

dkr.singleRowEditApplyAndAddNew.applyVisibility = function (currentItemListId, addApplyAndNewButton) {
    const addRowAllowed = document.querySelector(`div[id='SubElems_${currentItemListId}']  button.subelem-addRow`);
    console.log("Checking apply and new button visibility for listId:", currentItemListId);
    if (!addRowAllowed) {
        addApplyAndNewButton.style.display = "none";
    }
    else {
        addApplyAndNewButton.style.display = "inherit";
        5
        // Enable or disable the button based on whether it's the last row
        const modalHeader = document.querySelector(".modal-window__header");
        let isLastRow = modalHeader.innerText.endsWith(" " + SubelementCountRows(currentItemListId));
        if (isLastRow) {
            addApplyAndNewButton.classList.remove("button--disabled");
            addApplyAndNewButton.removeAttribute('disabled');
        }
        else {
            addApplyAndNewButton.classList.add("button--disabled");
            addApplyAndNewButton.setAttribute('disabled', 'disabled');
        }
    }
}

dkr.singleRowEditApplyAndAddNew.modalModifications = function (querySelector) {
    const applyAndNextButton = document.querySelector(querySelector);

    if (!applyAndNextButton) {
        return;
    }

    const subElementsParentDiv = document.getElementById(dkr.singleRowEditApplyAndAddNew.subElementParentDivId);
    if (!subElementsParentDiv) return;

    let currentItemListId = null;
    for (const item of dkr.singleRowEditApplyAndAddNew.itemLists) {
        if (!item.columnId) continue;
        const matchingChild = subElementsParentDiv.querySelector(`div[data-id="${item.columnId}"]`);
        if (matchingChild) {
            // Matching child found, you can add your logic here
            console.log(`Found child div with data-id="${item.columnId}"`);
            currentItemListId = item.listId;
            break;
        }
    }
    if (!currentItemListId) {
        console.log("No matching item list found");
        return;
    }

    const addApplyAndNewButton = document.querySelector(`button[data-key='${dkr.singleRowEditApplyAndAddNew.applyAndNewButtonId}']`);
    if (addApplyAndNewButton) {
        dkr.singleRowEditApplyAndAddNew.applyVisibility(currentItemListId, addApplyAndNewButton);
        return;
    }

    // Create apply and add new button by cloning the existing apply button
    dkr.singleRowEditApplyAndAddNew.createApplyAndNewButton(applyAndNextButton, currentItemListId);
}

dkr.singleRowEditApplyAndAddNew.openDialogForNewRow = function (currentIteration, maxIterations, listId) {
    var editButton = document.querySelector(`div[id='SubElems_${listId}'] tr[data-index='${SubelementCountRows(listId)}'] button.subelements-action-button__edit-row`);
    // verify that attachments are available
    if (!editButton) {
        if (currentIteration <= maxIterations) {
            currentIteration++;
            setTimeout(function () { dkr.singleRowEditApplyAndAddNew.openDialogForNewRow(currentIteration, maxIterations, listId); }, 10)
        }
        else {
            console.log("Edit button not found, dialog will not be opened...");
        }
        return;
    }
    editButton.click();
}

// In 2026, the modal is no longer added as a child of #Modals, but as a direct child of body
// with data-floating-ui-portal attribute containing SubelementsEditView
dkr.singleRowEditApplyAndAddNew.observeModalCreation = function (callback) {
    // If body observer already exists, do not create a new one
    if (window.dkrSPAproperties.singleRowEditApplyAndAddNew_bodyObserver) {
        return;
    }

    console.log("Adding new 'Single row edit apply and add new' body observer for WEBCON BPS 2026");

    // Observer to watch body for floating portal divs
    const bodyObserver = new MutationObserver(function (mutationsList, observer) {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1 && node.hasAttribute(dkr.singleRowEditApplyAndAddNew.floatingPortalAttribute)) {
                        // Found floating portal, check if it contains SubelementsEditView
                        const existingSubElementsDiv = node.querySelector(`#${dkr.singleRowEditApplyAndAddNew.subElementParentDivId}`);
                        if (existingSubElementsDiv) {
                            console.log("Found existing SubelementsEditView in floating portal, setting up button observer");
                            //     callback(dkr.singleRowEditApplyAndAddNew.applyAndNextButtonQuerySelector);
                            //     return;
                            // }
                            dkr.singleRowEditApplyAndAddNew.observeApplyNextButton(callback, node);
                            return;
                        }
                    }
                }
            }
        }
    });

    // We don't need to watch the subtree, the floating portal is always added directly to the body
    bodyObserver.observe(document.body, { childList: true });
    window.dkrSPAproperties.singleRowEditApplyAndAddNew_bodyObserver = bodyObserver;
};


// This function sets up an observer for the floating portal and will check any changes to its child hierarchy for the "Apply Next" button.
dkr.singleRowEditApplyAndAddNew.observeApplyNextButton = function (callback, modalsDiv) {
    if (!modalsDiv) return null;

    // Check if "Apply and new" button already exists
    const existingApplyAndNewButton = document.querySelector(`button[data-key='${dkr.singleRowEditApplyAndAddNew.applyAndNewButtonId}']`);
    if (existingApplyAndNewButton) {
        return null;
    }
    // If button observer already exists
    if (window.dkrSPAproperties.singleRowEditApplyAndAddNew_ModalObserver) {
        // If the "Apply and new" button doesn't exist, the observer may be stale - disconnect and recreate
        if (!existingApplyAndNewButton) {
            console.log("Apply and new button doesn't exist but observer does - cleaning up stale observer");
            window.dkrSPAproperties.singleRowEditApplyAndAddNew_ModalObserver.disconnect();
            delete window.dkrSPAproperties.singleRowEditApplyAndAddNew_ModalObserver;
        } else {
            // Observer exists and button exists, no need to create a new one
            return window.dkrSPAproperties.singleRowEditApplyAndAddNew_ModalObserver;
        }
    }

    // If we reach here, either no observer exists or we cleaned up a stale one - create a new observer and immediately create the button
    // The observer will be used to update  the visibility of the button
    callback(dkr.singleRowEditApplyAndAddNew.applyAndNextButtonQuerySelector);
};

dkr.singleRowEditApplyAndAddNew.observeModalCreation(dkr.singleRowEditApplyAndAddNew.modalModifications);
console.log("Single row edit apply and new logic for WEBCON BPS 2026 loaded.");
