window.dkr = window.dkr || {};
dkr.helpPage = {};
dkr.helpPage.dbId;
dkr.helpPage.attachmentId;
dkr.helpPage.displayMethod;
dkr.helpPage.disableButton = false;
dkr.helpPage.noHelpDefinedLabel = "No help defined";
dkr.helpPage.dialogDimensions = "height:95%; width:50%;min-width:400px;"

dkr.helpPage.useDisplayAttachment = function (title, dbId, attachmentId, dimensions) {
  dkr.helpPage.dbId = dbId;
  dkr.helpPage.attachmentId = attachmentId;
  dkr.helpPage.disableButton = !attachmentId;
  if (dimensions) {
    dkr.helpPage.dialogDimensions = dimensions;
  }
  dkr.helpPage.displayMethod = function () {
    ccls.modal.dialog.displayAttachment(title, { "dbId": dkr.helpPage.dbId, "attachmentId": dkr.helpPage.attachmentId }, dkr.helpPage.dialogDimensions)
  }
}

dkr.helpPage.useDisplayURLInDialog = function (title, url, dimensions) {
  dkr.helpPage.disableButton = !url;
  dkr.helpPage.url = url;
  if (dimensions) {
    dkr.helpPage.dialogDimensions = dimensions;
  }
  dkr.helpPage.displayMethod = function () {
    ccls.modal.dialog.displayUrl(title, dkr.helpPage.url, dkr.helpPage.dialogDimensions)
  }
}

dkr.helpPage.useDisplayURLInNewTab = function (url) {
  dkr.helpPage.disableButton = !url;
  dkr.helpPage.url = url;
  dkr.helpPage.displayMethod = function () {
    window.open(dkr.helpPage.url, "_blank")
  }
}

dkr.helpPage.prepareHelpPage = function () {
  let wrapper = document.getElementById("formContainer");
  // don't display the help icon in case the element is shown as a preview.
  if (wrapper.parentElement.parentElement.parentElement.parentElement.parentElement.className == "configuration-sidebar__content") {
    return;
  }
  let helpPageButton = document.getElementById("helpPage");
  helpPageButton.style.display = "block";
  if (dkr.helpPage.disableButton) {
    helpPageButton.disabled = true;
    helpPageButton.title = dkr.helpPage.noHelpDefinedLabel;
  }
  wrapper.insertBefore(helpPageButton, wrapper.firstChild);
}
//the last line of a script must not be a comment
console.log("help page logic executed");
