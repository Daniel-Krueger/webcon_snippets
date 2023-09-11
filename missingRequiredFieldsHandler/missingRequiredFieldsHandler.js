window.dkr = window.dkr || {};

dkr.missingRequiredFieldsHandler = dkr.missingRequiredFieldsHandler || {};
// Enforce a clear array without erroneous fields.
dkr.missingRequiredFieldsHandler.erroneousFields = [];
dkr.missingRequiredFieldsHandler.rowLabelForRegEx = {
  "de": "Zeile",
  "en": "row",
  "pl": "wiersz",
  "it": "riga",
  "sl": "vrstica",
  "ro": "Rand"
}
dkr.missingRequiredFieldsHandler.preventLeavingFieldWithError = true;
dkr.missingRequiredFieldsHandler.VersionDependingValues = [
  {
    version: '0.0.0.0',
    values: {
      getFieldFromControls: async function (displayName) {
        return (await ccls.utils.getLiteModel()).controls.find((item) => { return item.displayName == displayName && (item.fieldName.indexOf("Att") == 0 || item.fieldName.indexOf("SubElems") == 0) })
      }

    }
  }, {
    version: '2023.1.1.1',
    values: {
      getFieldFromControls: async function (displayName) {
        return (await ccls.utils.getLiteModel()).controls.find((item) => { return item.name.translated == displayName && (item.fieldName.indexOf("Att") == 0 || item.fieldName.indexOf("SubElems") == 0) })
      }
    }
  }
];
dkr.missingRequiredFieldsHandler.versionValues = ccls.utils.getVersionValues(dkr.missingRequiredFieldsHandler.VersionDependingValues);

//#region Handle tab click in error field
dkr.missingRequiredFieldsHandler.handleTabClickInErroneousField = function (event, currentElement, updatedFieldNumber) {
  // It's an error field, stop the default behavior      
  event.preventDefault();
  nextField = dkr.missingRequiredFieldsHandler.erroneousFields[updatedFieldNumber + 1];

  // If it was the last field, go back to the first field.
  if (nextField == null) {
    nextField = dkr.missingRequiredFieldsHandler.erroneousFields[0]
  }

  // Trigger the focusOut event, so that the value gets stored in the state
  eventObject = new Event("focusout", { bubbles: true });
  currentElement.dispatchEvent(eventObject);
  // Wait, so that the event get's processed
  setTimeout(() => { dkr.missingRequiredFieldsHandler.ensureNoMoreErrorsInCurrentField(currentElement, nextField); }, 50);
}

dkr.missingRequiredFieldsHandler.ensureNoMoreErrorsInCurrentField = function (currentElement, nextField) {

  // No more errors, go to next element
  if (dkr.missingRequiredFieldsHandler.preventLeavingFieldWithError) {

    let parent = currentElement.parentNode;
    while (parent != document) {
      if (parent.classList && parent.classList.contains('stylePanel')) {
        break;
      }
      parent = parent.parentNode;
    }
    const attributeErrorsPanel = parent.querySelector('.attributeErrorsPanel');

    if (attributeErrorsPanel && attributeErrorsPanel.children.length > 0) {
      console.log("Not leaving the field, there's still an error");
      return;
    }
  }
  console.log("Calling set focus for:" + nextField)
  SetFocus(nextField)
  setTimeout(() => { dkr.missingRequiredFieldsHandler.handleSpecialFields(nextField); }, 200);
}


dkr.missingRequiredFieldsHandler.handleSpecialFields = function (nextField) {
  if (nextField.indexOf('AttDateTime') > -1) {
    // Open date time selector
    document.querySelector(`#${nextField.substring(0, nextField.indexOf('_'))} .date-time-control__button`).click();
    // Wait until the click event was processed
    setTimeout(() => {
      // watch whether it's closed
      let dateTimeObserver = new MutationObserver((mutationList, observer) => {
        // upon closing refocus the element 
        if (mutationList[0].removedNodes.length > 0) {
          console.log("Refocus field after closing date time picker: " + nextField)
          SetFocus(nextField);
          observer.disconnect();
        }
      });
      dateTimeObserver.observe(document.getElementsByTagName("body")[0], {
        subtree: true,
        childList: true,
      });
    }, 200);
    // Focus field upon closing
  }
  if (nextField.indexOf('AttChoose') > -1) {
    // Open popup search
    let searchButton = document.querySelector(`#${nextField.substring(0, nextField.indexOf('_'))} .picker-search-button`)
    if (searchButton) {
      searchButton.click();

      setTimeout(() => {
        // watch whether popup search is completed
        let dateTimeObserver = new MutationObserver((mutationList, observer) => {
          // upon closing refocus the element 
          if (mutationList[0].removedNodes.length > 0 && mutationList[0].removedNodes[0].classList.contains("modal-outer")) {
            console.log("Refocus field after closing popup search: " + nextField)
            let pickerCheckButton = document.querySelector(`#${nextField.substring(0, nextField.indexOf('_'))} .picker-check-button`)
            if (pickerCheckButton) {
              // A popup search field can not be focused using SetFocus
              pickerCheckButton.focus()
            }
            observer.disconnect();
          }
        });
        dateTimeObserver.observe(document.getElementById("Modals"), {
          subtree: true,
          childList: true,
        });
      }, 100);
    }
  }
}
//#endregion


//#region Modal dialog watcher / and tab handler
dkr.missingRequiredFieldsHandler.MutationCallback = async function (mutationList, observer) {
  dkr.missingRequiredFieldsHandler.observerCounter++;
  console.log("Missing required field observer counter " + dkr.missingRequiredFieldsHandler.observerCounter);

  // Only process in case of an error dialog
  isErrorDialog = false
  if (mutationList?.[0]?.addedNodes?.[0]) {
    isErrorDialog = mutationList[0].addedNodes[0].children?.[0]?.classList.contains("form-error-modal")
  }
  else {
    if (mutationList?.[0]?.removedNodes?.[0]) {
      isErrorDialog = mutationList[0].removedNodes[0].children?.[0]?.classList.contains("form-error-modal")
    }
  }

  if (isErrorDialog != true) return;

  // User navigated away from a form, we don't need the observer any longer
  // G_EDITVIEW and G_EDITMODE may be true on the dashboard too. -> We can't use it
  // Testing whether the URL points to a page displaying an existing or new element.
  if (document.location.href.indexOf("/element/") == -1 && document.location.href.indexOf("/start/") == -1) {
    console.log("Disconnecting missing required fields observer for " + document.location.href);
    dkr.missingRequiredFieldsHandler.abortController.abort("Cleaning up event listener");
    observer.disconnect();
  }

  // Missing comment handler has been used; It's not about missing required fields
  if (document.getElementById("missingCommentContinueButton") != null) return;

  // Prepare focusing a non item list field, when the modal is closed. The fields have already been set when this is executed.
  if (mutationList[0].removedNodes.length > 0) {
    if (dkr.missingRequiredFieldsHandler.erroneousFields.length > 0) {
      // Overwrites the default behavior to prevent that an item lists would have the focus.
      // But only if it's not an item list. The setfocus for item lists is weird, as it does work sometimes.
      if (dkr.missingRequiredFieldsHandler.erroneousFields[0].indexOf("SubElems") == -1) {
        SetFocus(dkr.missingRequiredFieldsHandler.erroneousFields[0]);
        setTimeout(() => {
          dkr.missingRequiredFieldsHandler.handleSpecialFields(dkr.missingRequiredFieldsHandler.erroneousFields[0]);
        }, 100);
      }
    }
    return;
  }

  let errorContainer = document.querySelectorAll(".form-error-modal div.form-errors-panel__errors-container__error");
  dkr.missingRequiredFieldsHandler.erroneousFields = [];
  let rowLabel = dkr.missingRequiredFieldsHandler.rowLabelForRegEx[window.initModel.userLang.substr(0, 2)]
  if (!rowLabel) {
    alert("Label for 'row' is not defined for language :'" + window.initModel.userLang.substr(0, 2));
    return
  }
  let itemListFields = [];
  
  // Loading the model once so that we can reuse it later
  (await ccls.utils.getLiteModel());
  errorContainer.forEach( (item) =>{
    let displayName = item.getAttribute("data-key").substring(0, item.getAttribute("data-key").length - 1);
    itemListName = displayName.match("(.*), " + rowLabel + " \\d+");
    if (itemListName != null && itemListName.length == 2) displayName = itemListName[1];
    dkr.missingRequiredFieldsHandler.versionValues.getFieldFromControls(displayName).then((field)=> {
      if (field != null) {
          if (field.fieldName.indexOf("SubElems") == 0) {
            itemListFields.push(field.fieldName);
          }
          else {
            dkr.missingRequiredFieldsHandler.erroneousFields.push(field.fieldName)
          }
          console.log("Adding required field :" + field.fieldName)
        }
    });
  })

  // I have no idea how to switch to another field if we have an error in a item list using tabs. So lets add the item lists at the end.
  dkr.missingRequiredFieldsHandler.erroneousFields = dkr.missingRequiredFieldsHandler.erroneousFields.concat(itemListFields);

  // Remove all event listeners, to ensure there's only a single one.
  //document.removeEventListener("keydown", dkr.missingRequiredFieldsHandler.tabEventListener);  
  dkr.missingRequiredFieldsHandler.abortController.abort("Cleaning up listeners");
  dkr.missingRequiredFieldsHandler.abortController = new AbortController();
  document.addEventListener("keydown", dkr.missingRequiredFieldsHandler.tabEventListener, { signal: dkr.missingRequiredFieldsHandler.abortController.signal });

}


dkr.missingRequiredFieldsHandler.tabEventListener = function (event) {
  if (event.key === "Tab") {
    //debugger;
    // Implement your custom logic here
    // For example, you can move the focus to a specific element instead of the next focusable element:
    const currentElement = document.activeElement;
    let parent = currentElement.parentNode;
    while (parent != document) {
      // Found container of the current field
      if (parent.classList && parent.classList.contains('form-field-panel-decorator')) {
        let updatedFieldNumber = -1;

        // Check whether the current field is a field which had an error in the error dialog.
        for (i = 0; i < dkr.missingRequiredFieldsHandler.erroneousFields.length; i++) {
          if (dkr.missingRequiredFieldsHandler.erroneousFields[i].indexOf(parent.id + '_') > -1) {
            updatedFieldNumber = i;
            break;
          }
        }
        if (updatedFieldNumber > -1 && updatedFieldNumber < dkr.missingRequiredFieldsHandler.erroneousFields.length) {
          // Normal tab behavior for date time and autocomplete fields so that the button gets activated
          if (currentElement.classList.contains("date-time-control__input") == false
            && currentElement.classList.contains("autocomplete-input__input") == false) {
            dkr.missingRequiredFieldsHandler.handleTabClickInErroneousField(event, currentElement, updatedFieldNumber)
          }
        }
        break;
      }
      parent = parent.parentNode;
    }
  }
}
//#endregion


if (typeof (dkr.missingRequiredFieldsHandler.ModalContentObserver) === "undefined") {
  //debugger;
  dkr.missingRequiredFieldsHandler.abortController = new AbortController();
  dkr.missingRequiredFieldsHandler.observerCounter = 0;
  dkr.missingRequiredFieldsHandler.ModalContentObserver = new MutationObserver(dkr.missingRequiredFieldsHandler.MutationCallback);

  dkr.missingRequiredFieldsHandler.ModalContentObserver.observe(document.getElementById("Modals"), {
    subtree: true,
    childList: true,
  });
  console.log("Missing required field observer created");
}
// Remove existing tabEventListener just in case.
dkr.missingRequiredFieldsHandler.abortController.abort("Page reloaded, cleaning up listeners");
console.log("Missing required field handler loaded");