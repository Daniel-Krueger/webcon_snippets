
window.ccls = window.ccls || {};

//#region utility functions
//#endregion

ccls.confirmationDialog = {};
// configuration fields
ccls.confirmationDialog.groupingField;
ccls.confirmationDialog.confirmationDialogTitle;


//#region breadcrumb logic
//ccls.breadcrumb.regex = /element\/\d*\/form/i;
ccls.confirmationDialog.promise;
ccls.confirmationDialog.promiseResolve;
ccls.confirmationDialog.promiseReject;
ccls.confirmationDialog.executePathTransition = false;
Object.defineProperty(ccls.confirmationDialog, "group", {
  get() {
    if (this.value != null) return this.value;
    if (ccls.confirmationDialog.groupingField > 0) {
      this.value = document.getElementById(`Group_${ccls.confirmationDialog.groupingField}`);
      return this.value;
    }
    else {
      console.log("Id of grouping field is not defined");
    }
  },
});

ccls.confirmationDialog.saveButtonAction = function () {
  // let newValueElement = document.getElementById("newValue");
  // console.log("Confirmation dialog save button action executed", newValueElement);
  // let value = newValue.value;  
  ccls.confirmationDialog.cleanUpDialog();
  ccls.confirmationDialog.executePathTransition = true;
  ccls.confirmationDialog.promiseResolve(true);
}


ccls.confirmationDialog.cancelButtonAction = function () {
  console.log("Confirmation dialog cancel button action executed");
  ccls.confirmationDialog.cleanUpDialog();
  //Reject doesn't really work causes errors.
  debugger;
  ccls.confirmationDialog.executePathTransition = false;
  // Would cancel the promise in a "normal" form rule but we want to return "false" for the advanced confirmation dialog
  //ccls.confirmationDialog.promiseReject({ message: "Action cancelled by user." })
  ccls.confirmationDialog.promiseResolve(false);
}

ccls.confirmationDialog.cleanUpDialog = function () {

  let modalContentElement = document.getElementById("modalContent");
  // I have no idea why firstChild is text so let's use children[0]
  ccls.confirmationDialog.group.insertAdjacentElement("beforeend", modalContentElement.children[0]);
  document.getElementById('Modals').innerHTML = '';
  let inputs = $("input, select", $(ccls.confirmationDialog.group))
  $.each(inputs, function (item, value) {
    let fieldIdElement = ccls.confirmationDialog.getParentDiv(value);
    SetValue("WFD_" + fieldIdElement.id, value.value);

  });

}
ccls.confirmationDialog.getParentDiv = function (currentElement) {
  if (currentElement.parentElement == null) return null;
  if (currentElement.tagName = 'DIV' && currentElement.id.startsWith("Att")) {
    return currentElement
  }
  return this.getParentDiv(currentElement.parentElement);
}

ccls.confirmationDialog.newPromise = function () {
  let modals = document.getElementById("Modals");
  let insertHtml = ccls.confirmationDialog.getPreviewHTML();
  modals.innerHTML = insertHtml;
  let modalContentElement = document.getElementById("modalContent");
  modalContentElement.insertAdjacentElement("beforeend", ccls.confirmationDialog.group.firstChild);
  // $elements= $(ccls.confirmationDialog.group.firstChild).clone(true)
  // $elements.appendTo(modalContentElement)
  ccls.confirmationDialog.promise = new Promise((resolve, reject) => {
    ccls.confirmationDialog.promiseResolve = resolve;
    ccls.confirmationDialog.promiseReject = reject;
  })
  return ccls.confirmationDialog.promise;
};

ccls.confirmationDialog.init = function () {
  // ccls.confirmationDialog.group.style.display = "none";
  $(".header-panel__header", $(ccls.confirmationDialog.group)).hide();
}

ccls.confirmationDialog.getPreviewHTML = function () {
  return `
<div id="" class="modal-outer">
    <div class="modal-window animation100 attachment-preview-modal"
        data-name="" style="z-index: 2003;">
        <header>
            <div class="title-container expandable">
                <div class="title">${ccls.confirmationDialog.confirmationDialogTitle}</div>
                <div class="subtitle"></div>
            </div>
            <div class="actions">
                <div class="close"><button
                        class="webcon-button webcon-button--padding-default standard-focus webcon-button--icon-button no-hover no-background th-hover"
                        aria-label="Close" tabindex="0" type="button" onclick="ccls.confirmationDialog.cancelButtonAction()"><i
                            class="icon ms-Icon ms-Icon--ChromeClose ms-Icon--standard" aria-hidden="true"
                            data-disabled="false" ></i></button></div>
            </div>
        </header>
        <section class="th-main modal-window--no-padding" >
        <div class="main-panel col-xs-12 dynamic-form modern" id="modalContent">
        </div>
        </section>
        <footer class="footer">
          <div class="footer-right">
          <button onclick="ccls.confirmationDialog.saveButtonAction();"class="webcon-button animated standard-focus subelements-popup-buttons__confirm-button modal-button th-button-accept webcon-button--padding-default standard-focus" data-key="ok-button" tabindex="0" type="button"><div class="typography typography-font-size-standard webcon-button__title">Save</div></button>
          <button onclick="ccls.confirmationDialog.cancelButtonAction();" class="webcon-button animated standard-focus subelements-popup-buttons__cancel-button modal-button th-button-default webcon-button--padding-default standard-focus" data-key="close-button" tabindex="0" type="button"><div class="typography typography-font-size-standard webcon-button__title">Cancel</div></button>
          </div>
          </footer>
    </div>
    <div class="modal-background animation04" style="z-index: 2002;"></div>
</div>
`;
};

//#endregion

//the last line of a script must not be a comment
console.log("Promise logic loaded");



