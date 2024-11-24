// If this is not opened in modal, don't do anything
if (document.location.href.indexOf("isModal") == -1) {
  return;
}

window.ccls = window.ccls || {};
ccls.utils = ccls.utils || {};

// will return the number followed the preceding element
// example url: /db/1/app/14/start/wf/278/dt/332
// "db" would return 1 while wf would return 278
// if no url is provided, document.location.href will be used.
ccls.utils.getIdFromUrl = function (precedingElement, url) {
  if (typeof (url) == "undefined") url = document.location.href;
  return url.match("\/" + precedingElement + "\/([0-9]*)\/")[1];
}
ccls.modal = ccls.modal || {};
ccls.modal.child = ccls.modal.child || {};
ccls.modal.child.startDebugger = function () {
  // Start debugger, if debug parameter is set and dev tools are started.
  if (new URLSearchParams(document.location.search).get("debug") == "modalDialogChild") {
    debugger;
    return true;
  }
  return false;
}

ccls.modal.child.VersionDependingValues = [
  {
    version: '0.0.0.0',
    values: {
      'customStyles': `
       #formContainer { margin-top:0px;}      
      `
    }
  }
  , {
    version: '2025.1.1.1',
    values: {
      'customStyles': `
       #formContainer { margin-top:2px;;background-color: var(--colorNeutralBackground1)}
        #centerPanel {background-color: var(--colorNeutralBackground1)}
        div.dynamic-form {background-color: var(--colorNeutralBackground1) !important}
      `
    }
  }
];
//#endregion

ccls.modal.child.versionValues = ccls.utils.getVersionValues(ccls.modal.child.VersionDependingValues);

//#region setup tracking navigation changes, to check whether the child dialog should be closed.
// Requires "Show confirmation" on the path which should close the dialog and that the url is called within embeded mode
ccls.modal.trackNavigation = ccls.modal.trackNavigation || {};
ccls.modal.trackNavigation.onUrlChange = function () {
  ccls.modal.child.startDebugger();
  if (document.location.href.indexOf("element/confirm") > -1) {

    setTimeout(() => {
      // Passing the db and instance id of the created/modified element to the parent window.
      // We can't use G_WFElem. In case of dictionaries this can be 0, so we get the instance id from the link.      
      let url = $("a", $(".signature"))[0].href;
      let instanceId = ccls.utils.getIdFromUrl("element", url)
      let dbId = ccls.utils.getIdFromUrl("db", url)
      // The timeout of 400 will allow the user to see, that his actions have been processed.
      parent.ccls.modal.dialog.close({ "dbId": dbId, "instanceId": instanceId })
    }, 400);
  } else {
    ccls.modal.trackNavigation.infiniteUrlChangeCheck = setTimeout(ccls.modal.trackNavigation.onUrlChange, 250);
  }
};
// Previously a  mutationsobserver was used, but it was not working correctly in newer edge versions
ccls.modal.trackNavigation.infiniteUrlChangeCheck = setTimeout(ccls.modal.trackNavigation.onUrlChange, 250);
//#endregion


//#region UI element changes, if they don't exist yet



(() => {
  //ccls.modal.child.startDebugger();
  console.log("Styling the child dialog.")
  let cclsStyle = document.createElement('style');
  let darkThemes = [
    "a24dcfc2-2b14-4de8-8af3-7952a0a2cf61",//WEBCON Dark
    "6ec43cab-2ccf-438a-b0be-54388d7b43be",//CC  Dark 

  ];
  // Color for light themes
  let themedColor = "#ffab0045";
  let themedColorHover = "#ff9c00c4";

  // Color for dark themes
  if (darkThemes.indexOf(window.initModel.userTheme) > -1) {
    themedColor = "#ff9c00c4";
    themedColorHover = "#ffab0045";
  }
  if (ccls.modal.showFullForm == true) {
    cclsStyle.innerHTML = `
      .dynamic-form.modern #pathPanel 
      #cclsCloseDialogButton} {
      background-color: ${themedColor};
      }
      .dynamic-form.modern #pathPanel 
      #cclsCloseDialogButton:hover {
      background-color: ${themedColorHover};
      }
      `;
  } else {
    cclsStyle.innerHTML = `
      ${ccls.modal.child.versionValues.customStyles}
      .dynamic-form.modern #pathPanel 
      #cclsCloseDialogButton} {
      background-color: ${themedColor};
      }
      .dynamic-form.modern #pathPanel 
      #cclsCloseDialogButton:hover {
      background-color: ${themedColorHover};
      }
      .top-bar-header,
      .ms-promotedActionButton-text {
        display: none;
      }

      .redux-toastr {
        display: none;
      }
      .rightBar {
        display:none;
      }
      `;
  }
  document.getElementsByTagName('head')[0].appendChild(cclsStyle);
})();

//#endregion

//#region close button
ccls.modal.closeButton = ccls.modal.closeButton || {};
ccls.modal.closeButton.label = "";
ccls.modal.closeButton.tryCounter = 0;

ccls.modal.closeButton.addCloseDialogButton = function () {
  if ($(".ms-promotedActionButton-text").length != 1) {
    if (ccls.modal.closeButton.tryCounter < 5) {
      ccls.modal.closeButton.tryCounter++;
      setTimeout(ccls.modal.addCloseDialogButton, 100);
    }
    else {
      console.log("Try counter exceeded maximum tries, close button won't be added.");
    }
    return;
  }
  console.log("Add close button to path panel");

  // Copy existing button to add a new one we will use.
  $(".pathPanelRow").prepend(
    $(".path-button-container").first().wrapAll("<div>").parent().html()
  );
  let closeButton = $(".pathPanelButton:first");
  // Changes to the copied button
  closeButton.attr("id", "cclsCloseDialogButton");
  closeButton.attr("value", ccls.modal.closeButton.label);
  closeButton.click(function () { parent.ccls.modal.dialog.close(); });
  $(".form-button__title", closeButton).text(ccls.modal.closeButton.label);
};

if (ccls.modal.closeButton.displayAsPath == true) {
  // Labels
  switch (window.initModel.userLang.substr(0, 2)) {
    case "de":
      ccls.modal.closeButton.label = "Dialog schließen";
      break;

    default:
      ccls.modal.closeButton.label = "Close dialog";
      break;
  }
  $(document).ready(function () {
    setTimeout(ccls.modal.closeButton.addCloseDialogButton, 100);
  });
}

//#endregion 

//#region Setting up communication between parent and child
class Message {
  constructor(type, body) {
    this.type = type;
    this.body = body;
  }
}
window.addEventListener("message", (e) => {
  let data = e.data;
  //ccls.modal.child.startDebugger();
  if (data.type == "sendURL") {
    let url;
    if (document.location.href.indexOf("start/wf") > -1) {
      url = `/db/${ccls.utils.getIdFromUrl("db")}/app/${GetPairID(G_APP)}/start/wf/${ccls.utils.getIdFromUrl("wf")}/dt/${ccls.utils.getIdFromUrl("dt")}/form` + document.location.search;
    }
    else {
      url = `/db/${ccls.utils.getIdFromUrl("db")}/app/${GetPairID(G_APP)}/element/${GetPairID(G_WFELEM)}/form` + document.location.search;
    }
    window.parent.postMessage(new Message("fullUrl", { url: url }));
  }
  if (data.type == "parentClosing") {
    // Release current document if in edit mode
    if ((document.location.href.indexOf("start/wf") == -1) && (document.location.href.indexOf("/confirm") == -1)) {
      if (G_EDITVIEW) {
        // We don't need the result.
        let elementId = ccls.utils.getIdFromUrl("element");
        console.log("Execute release checkout for child instance:" + elementId);
        let options = {
          method: 'GET',
          headers: {}
        };

        fetch(`/api/nav/db/${ccls.utils.getIdFromUrl("db")}/app/${GetPairID(G_APP)}/element/${elementId}/checkout/release`, options).then(
          () => {
          });
      }
    }
    console.log("Child dialog closed");
    window.parent.postMessage(new Message("childClosed", data.body))
  }
});

//#endregion

//the last line of a script must not be a comment otherwise you get an error
console.log("modal dialog child logic loaded");
