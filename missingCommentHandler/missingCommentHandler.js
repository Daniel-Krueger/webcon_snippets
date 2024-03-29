
window.dkr = window.dkr || {};
dkr.missingCommentHandler = dkr.missingCommentHandler || {};

//#region Labels in different languages
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
//#endregion


dkr.missingCommentHandler.VersionDependingValues = [
  {
    version: '0.0.0.0',
    values: {
      modifyErrorPanel: function () {
        // The first container is "Validation error" and the "second container" any error. 
        // If there's more than two elements (one error), not only the comment is missing, which need to be corrected.
        let errorContainer = document.querySelectorAll(".form-error-modal div.form-errors-panel__errors-container__error");

        if (errorContainer.length != 2) {
          return;
        }

        let modalErrorDialog = document.querySelector(".form-error-modal");

        let errorText = dkr.missingCommentHandler.missingCommentErrorLabel[window.initModel.userLang.substr(0, 2)]
        if (!errorText) {
          alert("Label for 'missing comment on path' is not defined for language :'" + window.initModel.userLang.substr(0, 2));
          return
        }
        let continueBtnLbl = dkr.missingCommentHandler.continueBtnLabel[window.initModel.userLang.substr(0, 2)]

        let errorMessage = errorContainer[1].getAttribute('data-key');

        // It's not a missing comment error
        if (!errorMessage.startsWith(errorText)) return;

        errorContainer[1].insertAdjacentHTML('afterend', '<div id="newComment"><textarea id="newCommentText" class="text-area standard-focus wfFormControl form-control" rows="5" cols="20" ></textarea></div>');
        let pathTitle = errorMessage.substring(errorMessage.indexOf(':') + 1);
        let uiPathDefinition = ccls.utils.basicPathInformation.filter(item => item.title == pathTitle.trim());

        let closeButton = $(".form-error-modal__close-button", modalErrorDialog);
        closeButton.hide();
        let buttonHtml = `<button id="missingCommentContinueButton" onClick="dkr.missingCommentHandler.tryAgainPathExecution(${uiPathDefinition[0].id})" class="webcon-button animated standard-focus form-error-modal__close-button modal-button th-button-default webcon-button--padding-default standard-focus" data-key="${continueBtnLbl}" tabindex="0" type="button"><div class="typography typography-font-size-standard webcon-button__title">${continueBtnLbl}</div></button>`;
        closeButton[0].insertAdjacentHTML('afterend', buttonHtml);
      }

    }
  }, {
    version: '2023.1.3.29',
    values: {
      modifyErrorPanel: function () {
        // The first container is "Validation error" and the "second container" any error. 
        // If there's more than two elements (one error), not only the comment is missing, which need to be corrected.
        let errorContainer = document.querySelectorAll(".form-errors-panel div.form-errors-panel__errors-container__error");

        if (errorContainer.length != 1) {
          return;
        }

        let modalErrorDialog = document.querySelector(".form-error-modal");

        let errorText = dkr.missingCommentHandler.missingCommentErrorLabel[window.initModel.userLang.substr(0, 2)]
        if (!errorText) {
          alert("Label for 'missing comment on path' is not defined for language :'" + window.initModel.userLang.substr(0, 2));
          return
        }
        let continueBtnLbl = dkr.missingCommentHandler.continueBtnLabel[window.initModel.userLang.substr(0, 2)]

        let errorMessage = errorContainer[0].children[1].getAttribute('data-key');

        // It's not a missing comment error
        if (!errorMessage.startsWith(errorText)) return;

        errorContainer[0].insertAdjacentHTML('afterend', '<div id="newComment"><textarea id="newCommentText" class="text-area standard-focus wfFormControl form-control" rows="5" cols="20" ></textarea></div>');
        let pathTitle = errorMessage.substring(errorMessage.indexOf(':') + 1);
        let uiPathDefinition = ccls.utils.basicPathInformation.filter(item => item.title == pathTitle.trim());

        let closeButton = $(".form-error-modal__close-button", modalErrorDialog);
        closeButton.hide();
        let buttonHtml = `<button id="missingCommentContinueButton" onClick="dkr.missingCommentHandler.tryAgainPathExecution(${uiPathDefinition[0].id})" class="webcon-button animated standard-focus form-error-modal__close-button modal-button th-button-default webcon-button--padding-default standard-focus" data-key="${continueBtnLbl}" tabindex="0" type="button"><div class="typography typography-font-size-standard webcon-button__title">${continueBtnLbl}</div></button>`;
        closeButton[0].insertAdjacentHTML('afterend', buttonHtml);


      }
    }
  }
];
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
  //dkr.missingCommentHandler.observerCounter++;
  //console.log("Observer counter " + dkr.missingCommentHandler.observerCounter);

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

  dkr.missingCommentHandler.versionValues.modifyErrorPanel();


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
