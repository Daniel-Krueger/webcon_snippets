window.ccls = window.ccls || {};

//#region utility functions
ccls.utils = ccls.utils || {};
// will return the number followed the preceding element
// example url: /db/1/app/14/start/wf/278/dt/332
// "db" would return 1 while wf would return 278
// if no url is provided, document.location.href will be used.
ccls.utils.getIdFromUrl = function (precedingElement, url) {
  if (typeof (url) == "undefined") url = document.location.href;
  return url.match("\/" + precedingElement + "\/([0-9]*)\/")[1];
}
ccls.utils.continueAlsoPageIsDirty = function () {
  if (JSON.stringify(sessionStorage.getItem('WebconBPS_FormIsDirty')).contains("true")) {
    let confirmReloadMessage;
    switch (G_BROWSER_LANGUAGE.substr(0, 2)) {
      case "de":
        confirmReloadMessage = "Die Seite soll neugeladen werden, bisherige Änderungen werden nicht gespeichert. Wollen Sie fortfahren.";
        break;

      default:
        confirmReloadMessage = "All unsaved data entered on the form will be lost. Do you wish to continue?";
        break;
    }

    return confirm(confirmReloadMessage);
  }
  return false;
}

//#endregion

ccls.modal = ccls.modal || {};
ccls.modal.dialog = ccls.modal.dialog || {};
ccls.modal.dialog.startDebugger = function () {
  // Start debugger, if debug parameter is set and dev tools are started.
  if (new URLSearchParams(document.location.search).get("debug") == "modalDialogParent") {
    debugger;
    return true;
  }
  return false;
}

//#region closing functions
ccls.modal.dialog.closeFunctions = ccls.modal.dialog.closeFunctions || {};

// All entered data may be lost
ccls.modal.dialog.closeFunctions.displayAttachment = function (parameters) {
  // parameters {"dbId":1,"elementId":123,"attachmentId":456};
  if (parameters == null) {
    console.log("No parameters have been provided");
    return;
  }

  if (typeof (parameters.dbId) == "undefined") {
    parameters.dbId = ccls.utils.getIdFromUrl("db");
  }

  if (!ccls.utils.continueAlsoPageIsDirtycontinueAlsoPageIsDirty) return;

  var url = `"/api/nav/db/${parameters.dbId}/element/${parameters.elementId}/attachments/${parameters.attachmentId}/edit?withRedirect=true"`;
  console.log(`Opening edit document URL: '${url}'`);
  window.location = url;
}


// This will trigger the refresh button in the tool bar
// If you only need to reload datatables, there's no need to call this.
ccls.modal.dialog.closeFunctions.executeRefreshButton = function (parameters) {
  if (!ccls.utils.continueAlsoPageIsDirtycontinueAlsoPageIsDirty) return;
  $("#ReloadToolbarButton").click();
}

// internal function for setting the field, can be called from a custom function
// can be used to populate a picker which uses the instance id as id of the picker value
ccls.modal.dialog.closeFunctions.setInstanceIdForField = function (parameters, targetField) {
  if (parameters == null) {
    console.log("No parameters have been provided");
    return;
  }
  SetValue(targetField, parameters.instanceId);
}

// internal function for setting the field, can be called from a custom function
// can be used to populate a picker which uses the instance id as id of the picker value of an item list
// if row is not provided or -1 the last row will be used.
ccls.modal.dialog.closeFunctions.setInstanceIdForItemListColumn  = function (parameters, targetItemList, targetColumn, row) {
  if (parameters == null) {
    console.log("No parameters have been provided");
    return;
  }
  if (typeof (row) === "undefined" || row === -1) {
    SetSubValue(targetItemList, SubelementCountRows(targetItemList), targetColumn, parameters.instanceId);
  }
  else {
    SetSubValue(targetItemList, row, targetColumn, parameters.instanceId);
  }
}

// internal function for setting the field, can be called from a custom function
// can be used to populate a picker which uses the Guid of an instance, for example dictionaries
// The Guid will be retrieved by getting the model of the provided instance id.
ccls.modal.dialog.closeFunctions.setGuidForField = function (parameters, targetField) {
  if (parameters == null) {
    console.log("No parameters have been provided");
    return;
  }
  $.getJSON(`/api/nav/db/${parameters.dbId}/element/${parameters.instanceId}/desktop`, (data) => {
    ccls.modal.dialog.startDebugger();
    SetValue(targetField, data.liteData.liteModel.formInfo.guid);
  });
}

// internal function for setting a column in an item list
// can be used to populate a picker which uses the Guid of an instance, for example dictionaries
// if row is not provided or -1 the last row will be used.
// The Guid will be retrieved by getting the model of the provided instance id.
ccls.modal.dialog.closeFunctions.setGuidForItemListColumn = function (parameters, targetItemList, targetColumn, row) {
  if (parameters == null) {
    console.log("No parameters have been provided");
    return;
  }
  $.getJSON(`/api/nav/db/${parameters.dbId}/element/${parameters.instanceId}/desktop`, (data) => {
    ccls.modal.dialog.startDebugger();
    if (typeof (row) === "undefined" || row === -1) {
      SetSubValue(targetItemList, SubelementCountRows(targetItemList), targetColumn, data.liteData.liteModel.formInfo.guid);
    }
    else {
      SetSubValue(targetItemList, row, targetColumn, data.liteData.liteModel.formInfo.guid);
    }
  });
}


// Example which needs to be added to the html field
// Function
//ccls.modal.dialog.closeFunctions.setNewCustomer= function (parameters) {    
//  ccls.modal.dialog.closeFunctions.setGuidForField(parameters,'FIELD');
//}
// The startWorkflow function can be called with the parameter closeFunction set to ccls.modal.dialog.closeFunctions.setNewCustomer


ccls.modal.dialog.customClosingFunction = undefined;
ccls.modal.dialog.close = function (parameters) {
  ccls.modal.dialog.startDebugger();
  document.getElementById('cclsModal').style.display = "none";
  document.getElementById("cclsModaliframe").src = "about:blank";
  // Will trigger reload of any data tables.
  $("button", $(".reload-button-container")).click();
  $("span", $(".reload-button-container")).click()
  if (typeof (ccls.modal.dialog.customClosingFunction) == 'function' && typeof (parameters) != "undefined") {
    ccls.modal.dialog.customClosingFunction(parameters);
  }
};

//#endregion

//#region functions to display the dialog

// parameter titleLabels: {"default": "Default title","de":"Title de","en":"Title en"}
// parameter url: 
// {   "dbId": 1,   "elementId": 1 }
// parameter searchParameters
// {
//   "TargetColumn":"SourceColumn",
//   "WFD_AttText1":"WFD_AttText10"
// }
ccls.modal.dialog.displayWorkflow = function (titleLabels, urlParametersAsString, searchParametersAsString, dimensions, closeFunction) {
  ccls.modal.dialog.startDebugger();
  console.log(urlParametersAsString);
  let urlParameters = JSON.parse("{" + urlParametersAsString + "}");

  if (!(typeof (urlParameters.dbId) == "number")) urlParameters.dbId = ccls.utils.getIdFromUrl("db");
  if (!(typeof (urlParameters.elementId) == "number")) {
    alert(`Element id is not a number, passed value '${urlParameters.workflowId}'`);
    return;
  }
  let urlSearchParams = ccls.modal.dialog.getSearchParams(searchParametersAsString);
  let url = `/embed/form/db/${urlParameters.dbId}/element/${urlParameters.elementId}/form?${urlSearchParams.toString()}`
  ccls.modal.dialog.internalOpen(titleLabels, url, dimensions, closeFunction);
}

// parameter titleLabels: {"default": "Default title","de":"Title de","en":"Title en"}
// parameter url: 
// {   "dbId": 1,   "businessEntity": 1,   "workflowId": 123,   "formTypeId": 456,   "parentInstance": 123 } dbId, businessEntity and parentInstance are optional.
// parameter searchParameters
// {
//   "TargetColumn":"SourceColumn",
//   "WFD_AttText1":"WFD_AttText10"
// }
ccls.modal.dialog.startWorkflow = function (titleLabels, urlParametersAsString, searchParametersAsString, dimensions, closeFunction) {
  ccls.modal.dialog.startDebugger();
  console.log(urlParametersAsString);
  let urlParameters = JSON.parse("{" + urlParametersAsString + "}");

  if (!(typeof (urlParameters.dbId) == "number")) urlParameters.dbId = ccls.utils.getIdFromUrl("db");


  if (!(typeof (urlParameters.workflowId) == "number")) {
    alert(`Workflow id is not a number, passed value '${urlParameters.workflowId}'`);
    return;
  }

  if (!(typeof (urlParameters.formTypeId) == "number")) {
    alert(`Form type id is not a number, passed value '${urlParameters.formTypeId}'`);
    return;
  }

  let urlSearchParams = ccls.modal.dialog.getSearchParams(searchParametersAsString);
  if (!(typeof (urlParameters.businessEntity) == "number")) urlParameters.businessEntity = GetPairID(G_COM);
  urlSearchParams.append("com_id", urlParameters.businessEntity)
  if (typeof (urlParameters.parentInstance) == "number") urlSearchParams.append("parent_wfdid", urlParameters.parentInstance);

  let url = `/embed/form/db/${urlParameters.dbId}/start/wf/${urlParameters.workflowId}/dt/${urlParameters.formTypeId}/form?${urlSearchParams.toString()}`
  ccls.modal.dialog.internalOpen(titleLabels, url, dimensions, closeFunction);
};

ccls.modal.dialog.internalOpen = function (titleLabels, url, dimensions, closeFunction) {
  console.log(url);
  let titles = JSON.parse("{" + titleLabels + "}");
  let title = titles[G_BROWSER_LANGUAGE.substr(0, 2)];
  if (typeof (title) == "undefined") title = titles.default;

  // Display modal and set information
  document.getElementById("cclsModaliframe").src = url;
  document.getElementById("cclsModalTitle").innerText = title;
  document.getElementById('cclsModal').style.display = "block";
  if (dimensions != undefined) {
    $(".modal-window").attr("style", "z-index: 2003;" + dimensions);
  }

  if (typeof (closeFunction) == "function") {
    ccls.modal.dialog.customClosingFunction = closeFunction;
  }
}

// Will generate the search parameters which should be added to the url.
// Example:
// searchParametersAsString: "WFD_AttText1":"WFD_AttText10"
// If the field AttText10 contains the value
// Is this  my 
// lucky day?
// The search parameters will be 
// ?isModal=1&WFD_AttText1=Is%20this%20%20my%20%0Alucky%20day%3F'
ccls.modal.dialog.getSearchParams = function (searchParametersAsString) {

  console.log(searchParametersAsString);
  let searchParameters = JSON.parse("{" + searchParametersAsString + "}")
  let urlSearchParams = new URLSearchParams("isModal=1");
  for (const parameter in searchParameters) {
    let parameterValue = searchParameters[parameter];
    if (parameterValue.toString().indexOf("WFD_") > -1) {
      parameterValue = GetValue(parameterValue);
    }
    urlSearchParams.append(parameter, encodeURIComponent(parameterValue))
  }
  if (ccls.modal.dialog.startDebugger()) urlSearchParams.append("debug", "modalDialogChild")
  return urlSearchParams;
}

//#endregion

//#region defining dialog 
ccls.modal.dialog.startingLayoutDefinitionStyle = null;
ccls.modal.dialog.toggleExpand = function () {
  ccls.modal.dialog.startDebugger();
  if ($("#cclsModalLayoutDefinition").hasClass("expanded")) {
    // Enable window 
    $("#cclsModalLayoutDefinition").removeClass("expanded")
    $("#cclsModalLayoutDefinition").attr("style", ccls.modal.dialog.startingLayoutDefinitionStyle)
    $("#cclsExpandButtonIcon").addClass("ms-Icon--FullScreen")
    $("#cclsExpandButtonIcon").removeClass("ms-Icon--BackToWindow")
  } else {
    // Enable fullscreen
    ccls.modal.dialog.startingLayoutDefinitionStyle = $("#cclsModalLayoutDefinition").attr("style");
    $("#cclsModalLayoutDefinition").addClass("expanded")
    $("#cclsModalLayoutDefinition").attr("style", "z-index: 2003;height: 95%; width: 95%;")
    $("#cclsExpandButtonIcon").addClass("ms-Icon--BackToWindow")
    $("#cclsExpandButtonIcon").removeClass("ms-Icon--FullScreen")


  }
};

ccls.modal.dialog.replaceWindow = function () {
  ccls.modal.dialog.startDebugger();
  if (!ccls.utils.continueAlsoPageIsDirty()) return;
  document.getElementById("cclsModaliframe").contentWindow.postMessage(new Message("sendURL", null));
};
//#endregion
ccls.modal.dialog.dialogHtml =
  `
  <div id="cclsModal" class="modal-outer" style="display:none">
    <div
      id="cclsModalLayoutDefinition"
      class="modal-window animation100 modal-window--large"
      style="z-index: 2003"
    >
      <header>
        <div class="title-container expandable">
          <div class="title" id="cclsModalTitle"></div>
          <div class="subtitle"></div>
        </div>

        <div class="actions">
        <!-- reusing the expand class to match the styling, but moving the position of the element with the style -->
          <div id="cclsOpenInNewWindow" class="expand" style="right: 60px;">
            <button
              class="webcon-button webcon-button--padding-default standard-focus webcon-button--icon-button no-hover no-background th-hover"
              aria-label="Close"
              tabindex="0"
              type="button"
            >
            <i class="icon ms-Icon ms-Icon--OpenInNewWindow ms-Icon--standard" aria-hidden="true" data-disabled="false"></i>
         
            </button>
            </div>
          <div id="cclsExpandDialog" class="expand">
            <button
              class="webcon-button webcon-button--padding-default standard-focus webcon-button--icon-button no-hover no-background th-hover"
              aria-label="Full screen"
              tabindex="0"
              type="button"
            >
              <i
                id="cclsExpandButtonIcon"
                class="icon ms-Icon ms-Icon--FullScreen ms-Icon--standard"
                aria-hidden="true"
                data-disabled="false"
              ></i>
            </button>
          </div>
          <div id="cclsCloseDialog" class="close">
            <button
              class="webcon-button webcon-button--padding-default standard-focus webcon-button--icon-button no-hover no-background th-hover"
              aria-label="Close"
              tabindex="0"
              type="button"
            >
              <i
                class="icon ms-Icon ms-Icon--ChromeClose ms-Icon--standard"
                aria-hidden="true"
                data-disabled="false"
              ></i>
            </button>
          </div>
        </div>
      </header>
      <iframe id="cclsModaliframe" height="100%"></iframe>
    </div>
    <div class="modal-background animation04" style="z-index: 2002"></div>
  </div>

`;

$(document.body).append(ccls.modal.dialog.dialogHtml);
// Add events
$("#cclsCloseDialog > button").click(function () {
  ccls.modal.dialog.close();
});
$("#cclsExpandDialog > button").click(function () {
  ccls.modal.dialog.toggleExpand();
});
$("#cclsOpenInNewWindow > button").click(function () {
  ccls.modal.dialog.replaceWindow();
});
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
  if (data.type == "fullUrl") {
    if (data.body.url.contains("?")) {
      data.body.url += '&'
    }
    else {
      data.body.url += '?'
    }
    document.location.href = data.body.url + "returnUrl=" + encodeURIComponent(document.location.href);
  }
});
//#endregion

//the last line of a script must not be a comment
console.log("modal dialog parent logic executed");

