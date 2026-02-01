// The dkrSPAproperties object holds the created observers.
// This is necessary to avoid creating multiple observers for the same purpose, which could happen, if the user navigates away from the form and then returns to it.
window.dkrSPAproperties = window.dkrSPAproperties || {};


window.dkr = window.dkr || {}
dkr.singleRowEditApplyAndAddNew = {}
dkr.singleRowEditApplyAndAddNew.clickEditButtonMaxIterations = 20;
dkr.singleRowEditApplyAndAddNew.modalsId = "Modals";
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
}

dkr.singleRowEditApplyAndAddNew.applyVisibility = function (currentItemListId, addApplyAndNewButton) {
    const addRowAllowed = document.querySelector(`div[id='SubElems_${currentItemListId}']  button.subelem-addRow`);

    if (!addRowAllowed) {
        addApplyAndNewButton.style.display = "none";

    }
    else {
        addApplyAndNewButton.style.display = "inherit";

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
    let columnId = null;
    for (const item of dkr.singleRowEditApplyAndAddNew.itemLists) {
        if (!item.columnId) continue;
        const matchingChild = subElementsParentDiv.querySelector(`div[data-id="${item.columnId}"]`);
        if (matchingChild) {
            // Matching child found, you can add your logic here
            console.log(`Found child div with data-id="${item.columnId}"`);
            currentItemListId = item.listId;
            columnId = item.columnId;
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

// We want to add an observer to the <div id="Modals"> element.
// This will allow us to modify the "Add New" button when it appears.
// In some cases the div is not present and we need to add an observer to the body to watch for its creation.
// If it already exists, we will set up the button observer directly.
dkr.singleRowEditApplyAndAddNew.observeModalCreation = function (callback) {

    if (window.dkrSPAproperties.singleRowEditApplyAndAddNew_ModalObserver) {
        return;
    } else {
        // If the modal already exists, set up button observer without setting up the body observer
        const modalsDiv = document.getElementById(dkr.singleRowEditApplyAndAddNew.modalsId);
        if (modalsDiv) {
            dkr.singleRowEditApplyAndAddNew.observeApplyNextButton(callback, modalsDiv);
            return;
        }
    }
    // If body observer already exists, do not create a new one
    // If it already exists and will add the observer to the modal dialog as soon as it appears.
    if (window.dkrSPAproperties.singleRowEditApplyAndAddNew_bodyObserver) {
        return;
    }

    console.log("Adding new 'Single row edit apply and add new' body observer");
    // First observer: watch body for #modals div
    const bodyObserver = new MutationObserver(function (mutationsList, observer) {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1 && node.id === dkr.singleRowEditApplyAndAddNew.modalsId) {
                        // Found #Modals, add button observer and stop watching body.
                        dkr.singleRowEditApplyAndAddNew.observeApplyNextButton(callback, node);
                        observer.disconnect();
                        window.dkrSPAproperties.singleRowEditApplyAndAddNew_bodyObserver = null;
                        return;
                    }
                }
            }
        }
    });
    // We don't need to watch the subtree, the modal is always added directly to the body
    bodyObserver.observe(document.body, { childList: true });
    window.dkrSPAproperties.singleRowEditApplyAndAddNew_bodyObserver = bodyObserver;

};

// This function sets up an observer for modals div and will check any changes to it's child hierarchy for the "Add New" button.
dkr.singleRowEditApplyAndAddNew.observeApplyNextButton = function (callback, modalsDiv) {
    if (!modalsDiv) return null;

    // If button observer already exists, do not create a new one
    if (window.dkrSPAproperties.singleRowEditApplyAndAddNew_ModalObserver) {
        return;
    }

    console.log("Adding new 'Single row edit apply and add new' observer");
    const buttonObserver = new MutationObserver(function () {
        const element = modalsDiv.querySelector(dkr.singleRowEditApplyAndAddNew.applyAndNextButtonQuerySelector);
        if (element) {
            callback(dkr.singleRowEditApplyAndAddNew.applyAndNextButtonQuerySelector);
        }
    });
    buttonObserver.observe(modalsDiv, { childList: true, subtree: true });
    window.dkrSPAproperties.singleRowEditApplyAndAddNew_ModalObserver = buttonObserver;
    return buttonObserver;
};


dkr.singleRowEditApplyAndAddNew.observeModalCreation(dkr.singleRowEditApplyAndAddNew.modalModifications);
console.log("Single row edit apply and new logic loaded.");

