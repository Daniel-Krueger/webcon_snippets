window.dkr = window.dkr || {};
dkr.missingRequiredFieldsHandler = dkr.missingRequiredFieldsHandler || {};
// Enforce a clear array without erroneous fields.
dkr.missingRequiredFieldsHandler.erroneousFields = [];
dkr.missingRequiredFieldsHandler.rowLabelForRegEx = {
  "de": "Zeile",
  "en": "row",
  "pl": "",
  "it": "riga",
  "sl": "vrstica",
  "ro": "Rand"
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

dkr.missingRequiredFieldsHandler.handleTabClickInErroneousField = function (event, currentElement, updatedFieldNumber) {
  // It's an error field, stop the default behavior      
  event.preventDefault(); // Prevent default Tab key behavior
  //debugger;
  nextField = dkr.missingRequiredFieldsHandler.erroneousFields[updatedFieldNumber + 1];

  // If it was the last field, go back to the first field.
  if (nextField == null) {
    nextField = dkr.missingRequiredFieldsHandler.erroneousFields[0]
  }

  // Trigger the focusOut event, so that the value gets stored in the state
  eventObject = new Event("focusout", { bubbles: true });
  currentElement.dispatchEvent(eventObject);
  setTimeout(() => { dkr.missingRequiredFieldsHandler.ensureNoMoreErrorsInCurrentField(currentElement, nextField); }, 50);
}

dkr.missingRequiredFieldsHandler.ensureNoMoreErrorsInCurrentField = function (currentElement, nextField) {
  let parent = currentElement.parentNode;
  while (parent != document) {
    if (parent.classList && parent.classList.contains('stylePanel')) {
      break;
    }
    parent = parent.parentNode;
  }
  const attributeErrorsPanel = parent.querySelector('.attributeErrorsPanel');
  // No more errors, go to next element
  if (!attributeErrorsPanel || attributeErrorsPanel.children.length == 0) {

    console.log("Calling set focus for:" + nextField)
    SetFocus(nextField)
    setTimeout(() => { dkr.missingRequiredFieldsHandler.handleSpecialFields(nextField); }, 100);
  }
}


dkr.missingRequiredFieldsHandler.handleSpecialFields = function (nextField) {
  if (nextField.indexOf('AttDateTime') > -1) {
    // Open date time selector
    document.querySelector(`#${nextField.substring(0, nextField.indexOf('_'))} .date-time-control__button`).click();
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
    }, 100);
    // Focus field upon closing
  }
  if (nextField.indexOf('AttChoose') > -1) {
    // Open popupsearch
    let searchButton = document.querySelector(`#${nextField.substring(0, nextField.indexOf('_'))} .picker-search-button`)
    if (searchButton) {
      searchButton.click();

      setTimeout(() => {
        // watch whether popup search is completed
        let dateTimeObserver = new MutationObserver((mutationList, observer) => {
          // upon closing refocus the element 
          if (mutationList[0].removedNodes.length > 0 && mutationList[0].removedNodes[0].classList.contains("modal-outer")) {
            setTimeout(() => {
              console.log("Refocus field after closing popup search: " + nextField)
              let pickerCheckButton = document.querySelector(`#${nextField.substring(0, nextField.indexOf('_'))} .picker-check-button`)
              if (pickerCheckButton) {
                // A popup search field can not be focused using SetFocus
                pickerCheckButton.focus()
              }

            }, 150);
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

dkr.missingRequiredFieldsHandler.MutationCallback = function (mutationList, observer) {
  dkr.missingRequiredFieldsHandler.observerCounter++;
  console.log("Observer counter " + dkr.missingRequiredFieldsHandler.observerCounter);
  // Not an error dialog
  isErrorDialog = false
  try {
    if (mutationList?.[0]?.addedNodes?.[0]) {
      isErrorDialog = mutationList[0].addedNodes[0].children?.[0]?.classList.contains("form-error-modal")
    }
    else {
      if (mutationList?.[0]?.removedNodes?.[0]) {
        isErrorDialog = mutationList[0].removedNodes[0].children?.[0]?.classList.contains("form-error-modal")
      }
    }
  }
  finally {
  }

  if (isErrorDialog != true) return;

  // User navigated away from a form, we don't need the observer any longer
  // G_EDITVIEW and G_EDITMODE may be true on the dashboard too. -> We can't use it
  // Testing whether the URL points to a page displaying an existing or new element.
  if (document.location.href.indexOf("/element/") == -1 && document.location.href.indexOf("/start/") == -1) {
    console.log("Disconnecting missing required fields observer for " + document.location.href);
    document.removeEventListener("keydown", dkr.missingRequiredFieldsHandler.tabEventListener);
    dkr.missingRequiredFieldsHandler.tabEventListener.
      observer.disconnect();
  }

  // Missing comment handler has been used; It's not about missing required fields
  if (document.getElementById("missingCommentContinueButton") != null) return;

  // Focusing a non item list field, when the modal is closed. The fields have already been set at this point in time.
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

  // The first container is "Validation error" and the "second container" any error. 
  // If there's more than two elements (one error), not only the comment is missing, which need to be corrected.
  let errorContainer = document.querySelectorAll(".form-error-modal div.form-errors-panel__errors-container__error");
  dkr.missingRequiredFieldsHandler.erroneousFields = [];
  let rowLabel = dkr.missingRequiredFieldsHandler.rowLabelForRegEx[G_BROWSER_LANGUAGE.substr(0, 2)]
  if (!rowLabel) {
    alert("Label for 'row' is not defined for language :'" + G_BROWSER_LANGUAGE.substr(0, 2));
    return
  }
  let itemListFields = []
  errorContainer.forEach((item) => {
    let displayName = item.getAttribute("data-key").substring(0, item.getAttribute("data-key").length - 1);
    itemListName = displayName.match("(.*), " + rowLabel + " \\d+");
    if (itemListName != null && itemListName.length == 2) displayName = itemListName[1];
    let field = window.model.controls.find((item) => { return item.name.translated == displayName && (item.fieldName.indexOf("Att") == 0 || item.fieldName.indexOf("SubElems") == 0) })
    if (field != null) {
      if (field.fieldName.indexOf("SubElems") == 0) {
        itemListFields.push(field.fieldName);
      }
      else {
        dkr.missingRequiredFieldsHandler.erroneousFields.push(field.fieldName)
      }
      console.log("Adding required field :" + field.fieldName)
    }
  })
  // I have no idea how to switch to another field if we have an error in a item list using tabs. So lets add the item lists at the end.
  dkr.missingRequiredFieldsHandler.erroneousFields = dkr.missingRequiredFieldsHandler.erroneousFields.concat(itemListFields);

  // Remove all event listeners, to ensure there's only a single one.
  document.removeEventListener("keydown", dkr.missingRequiredFieldsHandler.tabEventListener);
  document.addEventListener("keydown", dkr.missingRequiredFieldsHandler.tabEventListener);

}

if (typeof (dkr.missingRequiredFieldsHandler.ModalContentObserver) === "undefined") {
  //debugger;
  dkr.missingRequiredFieldsHandler.observerCounter = 0;
  dkr.missingRequiredFieldsHandler.ModalContentObserver = new MutationObserver(dkr.missingRequiredFieldsHandler.MutationCallback);

  dkr.missingRequiredFieldsHandler.ModalContentObserver.observe(document.getElementById("Modals"), {
    subtree: true,
    childList: true,
  });


  console.log("Missing required field observer created");
}
console.log("Missing required field handler loaded");