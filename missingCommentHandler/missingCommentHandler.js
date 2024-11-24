
window.dkr = window.dkr || {};
dkr.missingCommentHandler = dkr.missingCommentHandler || {};

//#region Labels in different languages
// The label of the window title in the respective language
dkr.missingCommentHandler.windowTitleLabel = {
  "de": "Kommentar erforderlich",
  "en": "Comment required",
  "pl": "Wymagany komentarz"
}

// The label of the error message in the languages.
dkr.missingCommentHandler.missingCommentErrorLabel = {
  "de": "Kommentar auf folgendem Pfad erforderlich",
  "en": "Comment is required on path",
  "pl": "Komentarz jest wymagany na ścieżce",
  "it": "Il commento è obbligatorio",
  "sl": "Potrebno je vnesti komentar",
  "ro": "Comentariul este obligatoriu pe calea"
}

// The label of the continue button in the respective language
dkr.missingCommentHandler.continueBtnLabel = {
  "de": "Weiter",
  "en": "Continue",
  "pl": "Kontynuuj",
  "it": "Procedi",
  "sl": "Nadaljuj",
  "ro": "Mai departe"

}

// The label of the close button in the respective language
dkr.missingCommentHandler.closeBtnLabel = {
  "de": "Abbrechen",
  "en": "Cancel",
  "pl": "Anuluj"
}

//#endregion

// This will place the close button, which get's renamed to cancel, on the left and the "continue" button on the right.
dkr.missingCommentHandler.cancelButtonOnTheLeft = false;

dkr.missingCommentHandler.VersionDependingValues = [
  {
    version: '0.0.0.0',
    values: {
      'errorContainerSelector': '.form-error-modal div.form-errors-panel__errors-container__error',
      'buttonStyle':'webcon-button animated standard-focus form-error-modal__close-button modal-button th-button-default webcon-button--padding-default standard-focus'
    }
  }, {
    version: '2023.1.3.202',
    values: {
      'errorContainerSelector': '.form-error-modal div.form-errors-panel__errors-container',
      'buttonStyle':'webcon-button animated standard-focus form-error-modal__close-button modal-button th-button-default webcon-button--padding-default standard-focus'
    }
  }
  , {
    version: '2024.1.1.1',
    values: {
      'errorContainerSelector': '.form-error-modal div.error-list__errors-container',
      'buttonStyle':'webcon-button animated standard-focus form-error-modal__close-button modal-button th-button-default webcon-button--padding-default standard-focus'
    }
  }, {
    version: '2025.1.1.1',
    values: {
      'errorContainerSelector': '.form-error-modal div.error-list__errors-container',
      'buttonStyle':'webcon-ui button button--primary button--medium toolbar-button__button'
    }
  }
];
//#endregion
dkr.missingCommentHandler.versionValues = ccls.utils.getVersionValues(dkr.missingCommentHandler.VersionDependingValues);

dkr.missingCommentHandler.tryAgainPathExecution = function (pathId) {
  //debugger;
  let newCommentText = document.getElementById('newCommentText');
  let commentTextArea = document.getElementsByClassName("comments-body")[0].firstChild

  // Set the value in the comment box
  var nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
  eventObject = new Event("input", { bubbles: true });
  nativeTextAreaValueSetter.call(commentTextArea, newCommentText.value);
  commentTextArea.dispatchEvent(eventObject);

  // Only setting the input is not enough, we need to call another event to update the state
  eventObject = new Event("focusout", { bubbles: true });
  commentTextArea.dispatchEvent(eventObject);

  // Execute the path again, after the event has been dispatched and the states have been updated. 
  setTimeout(() => { MoveToNextStep(pathId) }, 100);
}

dkr.missingCommentHandler.MutationCallback = async function (mutationList, observer) {
  dkr.missingCommentHandler.observerCounter++;
  console.log("Missing comment handler observer counter " + dkr.missingCommentHandler.observerCounter);

  // User navigated away from a form, we don't need the observer any longer
  // G_EDITVIEW and G_EDITMODE may be true on the dashboard too. -> We can't use it
  // Testing whether the URL points to a page displaying an existing or new element.
  if (document.location.href.indexOf("/element/") == -1 && document.location.href.indexOf("/start/") == -1) {
    console.log("Disconnecting observer for " + document.location.href);
    delete dkr.missingCommentHandler.ModalContentObserver;
    observer.disconnect();
  }

  // Adding the continue button will modify the modal dialog -> Skip another execution.
  // observer.disconnect(); is not used because the user may close the modal dialog via X, would not provide a comment and we have to check it again.
  if (document.getElementById("newComment") != null) return;


  // The first container is "Validation error" and the "second container" any error. 
  // If there's more than two elements (one error), not only the comment is missing, which need to be corrected.
  let errorContainer = document.querySelectorAll(dkr.missingCommentHandler.versionValues.errorContainerSelector);

  // Exit, if the error container does not contain a single error.
  if (!(errorContainer.length == 1 && errorContainer[0].children.length == 1)) {
    return;
  }
  errorContainer = errorContainer[0];
  let modalErrorDialog = document.querySelector(".form-error-modal");
  let userLanguage = window.initModel.userLang.substr(0, 2)
  let errorText = dkr.missingCommentHandler.missingCommentErrorLabel[userLanguage]
  if (!errorText) {
    alert("Label for 'missing comment on path' is not defined for language :'" + userLanguage);
    return
  }

  // It's not a missing comment error
  let errorMessageText = errorContainer.innerText
  let missingCommentTextPosition = errorMessageText.indexOf(errorText)
  if (missingCommentTextPosition == -1) return;

  // There are two : in the inner text, one after the 'field' and one in the error message.
  let pathTitle = errorMessageText.substring(errorMessageText.indexOf(':', missingCommentTextPosition) + 1);
  let uiPathDefinition = (await ccls.utils.getLiteModel()).paths.filter(item => item.title == pathTitle.trim());
  let windowTitleLabel = dkr.missingCommentHandler.windowTitleLabel[userLanguage]
  let continueBtnLbl = dkr.missingCommentHandler.continueBtnLabel[userLanguage]
  let closeBtnLabel = dkr.missingCommentHandler.closeBtnLabel[userLanguage]

  errorContainer.parentElement.insertAdjacentHTML('afterend', '<div id="newComment"><textarea id="newCommentText" class="text-area standard-focus wfFormControl form-control" rows="5" cols="20" ></textarea></div>');


  // Set the title of the error dialog to something more friendly
  modalErrorDialog.querySelector(".title").innerText = windowTitleLabel
  //Hide the error icon and "validation error" part of the message
  errorContainer.parentElement.style.display = "none";
  //Change the label of the standard close button to abort
  let closeButton = modalErrorDialog.querySelector(".form-error-modal__close-button");
  closeButton.innerText = closeBtnLabel
  let buttonHtml = `<button id="missingCommentContinueButton" onClick="dkr.missingCommentHandler.tryAgainPathExecution(${uiPathDefinition[0].id})" class="${dkr.missingCommentHandler.versionValues.buttonStyle}" data-key="${continueBtnLbl}" tabindex="0" type="button"><div class="typography typography-font-size-standard webcon-button__title">${continueBtnLbl}</div></button>`;
  closeButton.insertAdjacentHTML(dkr.missingCommentHandler.cancelButtonOnTheLeft ? 'afterend' : 'beforebegin', buttonHtml);

}

if (typeof (dkr.missingCommentHandler.ModalContentObserver) === "undefined") {
  //debugger;
  dkr.missingCommentHandler.observerCounter = 0;
  dkr.missingCommentHandler.ModalContentObserver = new MutationObserver(dkr.missingCommentHandler.MutationCallback);

  dkr.missingCommentHandler.ModalContentObserver.observe(document.getElementById("Modals"), {
    subtree: true,
    childList: true,
  });


  console.log("Missing comment observer created");
}
console.log("Missing comment handler loaded");
