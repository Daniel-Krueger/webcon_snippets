window.ccls = window.ccls || {};
ccls.modal = ccls.modal || {};
ccls.modal.dialog = ccls.modal.dialog || {};
// Either "workflowInstance" or "external"; We don't know the URL of a workflowInstance, as it may have been changed upon path transition.
// Therefore we need to get the url from the child window via a post message.
ccls.modal.dialog.replaceWindowBehavior;
// The label of the close button in the respective language
ccls.modal.dialog.closeBtnLabel = {
  "de": "Schließen",
  "en": "Close",
  "pl": "Zamknij",
  "it": "Chiudi",
  "sl": "Zapri",
  "ro": "Închide"
}

ccls.modal.dialog.downloadBtnLabel = {
  "de": "Download",
  "en": "Download",
  "pl": "Pobierz",
  "it": "Scarica",
  "sl": "Prenesi",
  "ro": "Descarcă"
}

// it may happen that the message handlers have not been removed -> There may be multiple calls to the close function.
ccls.modal.dialog.closedParameters = null;
ccls.modal.dialog.VersionDependingValues = [
  {
    version: '0.0.0.0',
    values: {
      'encodeParametersTwice': true,
      'modalDialogContainerClasses': "modal-window animation100 modal-window--large",
      'modalDialogHeaderElement': "header",
      'modalDialogHeaderElementClasses': "modal-window__header",
      dialogStyling: function () {
        document.getElementById('cclsModalLayoutDefinition').style.padding = "12px";
        let footerRight = document.querySelector('#cclsModalLayoutDefinition .footer-right');
        footerRight.style.display = "flex";
        footerRight.style.justifyContent = "flex-end";

      }
    }
  }, {
    version: '2023.1.3.118',
    values: {
      'encodeParametersTwice': false,
      'modalDialogContainerClasses': "modal-window animation100 modal-window--large",
      'modalDialogHeaderElement': "header",
      'modalDialogHeaderElementClasses': "",
      dialogStyling: function () {
        document.getElementById('cclsModalLayoutDefinition').style.padding = "12px";
        let footerRight = document.querySelector('#cclsModalLayoutDefinition .footer-right');
        footerRight.style.display = "flex";
        footerRight.style.justifyContent = "flex-end";
        document.querySelector('#cclsModalLayoutDefinition #footerCloseButton').setAttribute("class","webcon-button animated modal-button th-button-default webcon-button--padding-default")

      }

    }
  }
  , {
    version: '2024.1.1.1',
    values: {
      'encodeParametersTwice': false,
      'modalDialogContainerClasses': "modal-window animation100 attachment-preview-modal modal-window--align-center",
      'modalDialogHeaderElement': "div",
      'modalDialogHeaderElementClasses': "modal-window__header",
      dialogStyling: function () {

      }
    }
  }
];
//#endregion

ccls.modal.dialog.versionValues = ccls.utils.getVersionValues(ccls.modal.dialog.VersionDependingValues);


ccls.modal.dialog.startDebugger = function () {
  // Start debugger, if debug parameter is set and dev tools are started.
  if (new URLSearchParams(document.location.search).get("debug") == "modalDialogParent") {
    debugger;
    return true;
  }
  return false;
}
ccls.modal.dialog.getThemeGuid = function () {
  let themeClass = document.body.className.split(' ').find(cls => cls.startsWith('theme-'));
  let themeGuid = themeClass ? themeClass.replace('theme-', '') : '00000000-0000-0000-0000-000000000000';
  return themeGuid;
}
ccls.modal.dialog.closingTimeout = null;
//#region closing functions
ccls.modal.dialog.closeFunctions = ccls.modal.dialog.closeFunctions || {};

// This will trigger the refresh button in the tool bar
// If you only need to reload datatables, there's no need to call this.
ccls.modal.dialog.closeFunctions.executeRefreshButton = function (parameters) {
  if (!ccls.utils.continueAlsoPageIsDirty) return;
  let reloadButton = $("#ReloadToolbarButton");
  if (reloadButton.length == 1) { reloadButton[0].click() }
}

ccls.modal.dialog.isFirstCall = function (parameters) {
  if (parameters == null) {
    console.log("No parameters have been provided");
    ccls.modal.dialog.closedParameters = null;
    return false;
  }
  parameters.instanceId = parameters.instanceId ?? parameters.elementId;
  if (ccls.modal.dialog.closedParameters?.dbId == parameters.dbId &&
    ccls.modal.dialog.closedParameters?.instanceId == parameters.instanceId
  ) {
    return false;
  }
  ccls.modal.dialog.closedParameters = parameters;
  return true;

}
// internal function for setting the field, can be called from a custom function
// can be used to populate a picker which uses the instance id as id of the picker value
ccls.modal.dialog.closeFunctions.setInstanceIdForField = function (parameters, targetField) {
  if (!ccls.modal.dialog.isFirstCall(parameters)) {
    return;
  }

  SetValue(targetField, parameters.instanceId);
}

// internal function for displaying an attachment, after the dialog has been closed
ccls.modal.dialog.closeFunctions.displayAttachment = function (parameters) {
  // parameters {"dbId":1,"elementId":123,"attachmentId":456};
  if (!ccls.modal.dialog.isFirstCall(parameters)) {
    return;
  }

  if (typeof (parameters.dbId) == "undefined") {
    parameters.dbId = ccls.utils.getIdFromUrl("db");
  }

  if (!ccls.utils.continueAlsoPageIsDirty) return;

  var url = `"/api/nav/db/${parameters.dbId}/element/${parameters.elementId}/attachments/${parameters.attachmentId}/edit?withRedirect=true"`;
  console.log(`Opening edit document URL: '${url}'`);
  window.location = url;
}

// internal function for setting the field, can be called from a custom function
// can be used to populate a picker which uses the instance id as id of the picker value of an item list
// if row is not provided or -1 the last row will be used.
ccls.modal.dialog.closeFunctions.setInstanceIdForItemListColumn = function (parameters, targetItemList, targetColumn, row) {
  if (!ccls.modal.dialog.isFirstCall(parameters)) {
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
ccls.modal.dialog.closeFunctions.setGuidForField = async function (parameters, targetField) {
  if (!ccls.modal.dialog.isFirstCall(parameters)) {
    return;
  }
  const data = await ccls.utils.getSpecificLiteModel(parameters.dbId, parameters.instanceId);
  ccls.modal.dialog.startDebugger();
  SetValue(targetField, data.liteData.liteModel.formInfo.guid);
}

// internal function for setting a column in an item list
// can be used to populate a picker which uses the Guid of an instance, for example dictionaries
// if row is not provided or -1 the last row will be used.
// The Guid will be retrieved by getting the model of the provided instance id.
ccls.modal.dialog.closeFunctions.setGuidForItemListColumn = async function (parameters, targetItemList, targetColumn, row) {
  if (!ccls.modal.dialog.isFirstCall(parameters)) {
    return;
  }

  const data = await ccls.utils.getSpecificLiteModel(parameters.dbId, parameters.instanceId);
  ccls.modal.dialog.startDebugger();
  if (typeof (row) === "undefined" || row === -1) {
    SetSubValue(targetItemList, SubelementCountRows(targetItemList), targetColumn, data.liteData.liteModel.formInfo.guid);
  }
  else {
    SetSubValue(targetItemList, row, targetColumn, data.liteData.liteModel.formInfo.guid);
  }
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
  document.removeEventListener("keydown", ccls.modal.dialog.closeOnEscape);
  document.getElementById("cclsModaliframe").contentWindow.postMessage(new Message("parentClosing", parameters));
  ccls.modal.dialog.closingTimeout = setTimeout(() => {
    console.log('Closing modal due to timeout');
    ccls.modal.dialog.childClosed(parameters);
  }, 100);
};
ccls.modal.dialog.closeOnEscape = function (event) {
  if (event.key === "Escape") {
    ccls.modal.dialog.close()
  }
}
ccls.modal.dialog.childClosed = function (parameters) {
  clearTimeout(ccls.modal.dialog.closingTimeout);
  document.getElementById('cclsModal').style.display = "none";
  // Caused checkout errors in BPS 2023 R2. Needs to be revisited at later version.
  //document.getElementById("cclsModaliframe").src = "about:blank";

  // If we refresh the page, we don't need to execute individual refreshs.
  if (ccls.modal.dialog.customClosingFunction == ccls.modal.dialog.closeFunctions.executeRefreshButton) {
    ccls.modal.dialog.closeFunctions.executeRefreshButton();
    return;
  }

  // Will trigger reload of any data tables.
  // switched from element.click()  to  setTimeout(() => { element.click() }, index * 122) and used a random "random" interval
  // executing the refresh button simultaneously  breaks the refresh as of BPS 2023 R2
  //  Needs to be revisited at later version.
  // $(".reload-button-container").find("button").each((index, element) => { element.click() });
  // $(".reload-button-container").find("span").each((index, element) => { element.click() });
  $(".reload-button-container").find("button").each((index, element) => { setTimeout(() => { element.click() }, index * 122) });
  $(".reload-button-container").find("span").each((index, element) => { setTimeout(() => { element.click() }, index * 99) });
  if (typeof (ccls.modal.dialog.customClosingFunction) == 'function') {
    ccls.modal.dialog.customClosingFunction(parameters);
  }
}
//#endregion

//#region functions to display the dialog


//ccls.modal.dialog.displayAttachment('dialog title', {"dbId":1,"attachmentId":456});
ccls.modal.dialog.displayAttachment = function (title, parameters, dimensions) {
  if (parameters == null) {
    console.log("No parameters have been provided");
    return;
  }
  if (typeof (parameters.dbId) == "undefined") {
    parameters.dbId = ccls.utils.getIdFromUrl("db");
  }

  let modals = document.getElementById("Modals");


  if (localStorage.getItem("WebconBPS_Impersonator") != 'null') {
    var xhr = new XMLHttpRequest();

    xhr.open('GET', previewDocumentUrl);
    xhr.onreadystatechange = function () {
      if (this.readyState === this.DONE) {
        if (this.status === 200) {
          var data_url = URL.createObjectURL(this.response);
          let insertHtml = previewHTML.replaceAll("##iframeSrc##", data_url);
          insertHtml = insertHtml.replaceAll("##documentName##", ccls_attachmentTitle);
          modals.innerHTML = insertHtml;

          document.querySelector(".ccls-loading-container__children").style.visibility = "visible";
          document.querySelector(".ccls-loading-container__spinner").style.visibility = "hidden";
        } else {
          console.error('no pdf :(');
        }
      }
    };
    xhr.responseType = 'blob';
    xhr.withCredentials = true;
    xhr.setRequestHeader("x-impersonateperson", JSON.parse(localStorage.getItem("WebconBPS_Impersonator")).login)
    xhr.send();
  }
  else {
    var url = `/attachments/db/${parameters.dbId}/preview/${parameters.attachmentId}?hash=` + Date.now();
    console.log(`Display attachment: '${url}'`);
    ccls.modal.dialog.displayiFrame('"default":"' + title + '"', url, dimensions, null, false)

  }
}
//ccls.modal.dialog.displayUrl('dialog title', 'https://example.com');
ccls.modal.dialog.displayUrl = function (title, url, dimensions) {
  ccls.modal.dialog.startDebugger();
  ccls.modal.dialog.displayiFrame('"default":"' + title + '"', url, dimensions, null, false);
}

ccls.modal.dialog.loadiFrameInBackground = function (title, url, spinnerText, dimensions) {
  ccls.modal.dialog.startDebugger();

  ccls.modal.dialog.displayiFrame('"default":"' + title + '"', url, dimensions, null, false);
  ccls.modal.dialog.showModalDialogSpinner(spinnerText);
}

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
  let url = `/embed/form/db/${urlParameters.dbId}/element/${urlParameters.elementId}/form?${urlSearchParams.toString()}&theme=${ccls.modal.dialog.getThemeGuid()}`
  ccls.modal.dialog.displayiFrame(titleLabels, url, dimensions, closeFunction, true);
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

  let url = `/embed/form/db/${urlParameters.dbId}/start/wf/${urlParameters.workflowId}/dt/${urlParameters.formTypeId}/form?${urlSearchParams.toString()}&theme=${ccls.modal.dialog.getThemeGuid()}`
  ccls.modal.dialog.displayiFrame(titleLabels, url, dimensions, closeFunction, true);

};

ccls.modal.dialog.displayiFrame = function (titleLabels, url, dimensions, closeFunction, opensWorkflowInstance) {
  console.log(url)
  let iFrame = document.getElementById("cclsModaliframe")
  iFrame.src = url;
  iFrame.style.display = "block";
  document.getElementById("cclsModalInnerHtml").innerHTML = "";
  document.getElementById("cclsOpenInNewWindow").style.display = "block";
  ccls.modal.dialog.internalOpen(titleLabels, dimensions, closeFunction, opensWorkflowInstance);
  ccls.modal.dialog.showModalDialogContent();
}


ccls.modal.dialog.displayHTML = function (title, parameters, dimensions, closeFunction) {
  if (parameters == null) {
    console.log("No parameters have been provided");
    return;
  }

  let iFrame = document.getElementById("cclsModaliframe")
  iFrame.src = "";
  iFrame.style.display = "none";
  document.getElementById("cclsModalInnerHtml").innerHTML = parameters.innerHTML;
  document.getElementById("cclsOpenInNewWindow").style.display = "none";
  ccls.modal.dialog.internalOpen('"default":"' + title + '"', dimensions, closeFunction, false);
  ccls.modal.dialog.showModalDialogContent();
}

ccls.modal.dialog.internalOpen = function (titleLabels, dimensions, closeFunction, opensWorkflowInstance) {
  let titles = JSON.parse("{" + titleLabels + "}");
  let title = titles[window.initModel.userLang.substr(0, 2)];
  if (typeof (title) == "undefined") title = titles.default;
  ccls.modal.dialog.replaceWindowBehavior = typeof (opensWorkflowInstance) == "undefined" || opensWorkflowInstance == true ? "workflowInstance" : "external";


  document.getElementById("cclsModalTitle").innerText = title;

  if (dimensions == undefined) {
    dimensions = "height:95%; width:95%";
  }

  if (G_ISMOBILE) {
    dimensions = " height:95%; width:95%"
  }

  $(".modal-window").attr("style", "z-index: 2003;" + dimensions);
  document.getElementById('cclsModal').style.display = "block";
  document.addEventListener("keydown", ccls.modal.dialog.closeOnEscape);

  if (typeof (closeFunction) == "function") {
    ccls.modal.dialog.customClosingFunction = closeFunction;
  }
  ccls.modal.dialog.versionValues.dialogStyling();
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
      parameterValue = GetValue(parameterValue.replace("WFD_", ""));
    }
    urlSearchParams.append(parameter, ccls.modal.dialog.versionValues.encodeParametersTwice ? encodeURIComponent(parameterValue) : parameterValue)
  }
  if (ccls.modal.dialog.startDebugger()) urlSearchParams.append("debug", "modalDialogChild")
  return urlSearchParams;
}

//#endregion

//#region defining dialog 
ccls.modal.dialog.startingLayoutDefinitionStyle = null;
ccls.modal.dialog.showModalDialogContent = function () {
  document.getElementById('cclsModal').style.display = "block";
  document.querySelector(".ccls-loading-container__spinner").style.display = "none";
  document.querySelector(".ccls-loading-container__children").style.display = "block";
  document.querySelector(".ccls-loading-container__children").style.opacity = 100;
  document.getElementById('cclsModalDialogSpinnerText').innerText = null;
}
ccls.modal.dialog.showModalDialogSpinner = function (spinnerText) {
  document.getElementById('cclsModal').style.display = "block";
  document.querySelector(".ccls-loading-container__spinner").style.display = "block";
  // We need ti display the children because the iFrame won't be loaded, if the container is not displayed.
  document.querySelector(".ccls-loading-container__children").style.display = "block";
  document.querySelector(".ccls-loading-container__children").style.opacity = 0;
  document.getElementById('cclsModalDialogSpinnerText').innerText = spinnerText;
}
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
  ccls.modal.dialog.close();
  //if (!ccls.utils.continueAlsoPageIsDirty()) return;
  if (ccls.modal.dialog.replaceWindowBehavior == "workflowInstance") {
    document.getElementById("cclsModaliframe").contentWindow.postMessage(new Message("sendURL", null));
  }
  else {
    console.log("open iframe url in new tab");
    window.open(document.getElementById("cclsModaliframe").src, "_blank");
  }
};
//#endregion
ccls.modal.dialog.dialogHtml =
  `<style>
  #cclsModal {
    font-family: var(--fontFamilyBase);  
  }
  #cclsModalLayoutDefinition  > ${ccls.modal.dialog.versionValues.modalDialogHeaderElement} {
    cursor:move;
  }
  #cclsModal" .modal-window {
    max-height: calc(100% - 10px);
    top: 5px;
  }
  #cclsModalTitle {
    font-weight: 600;
    font-size: var(--fontSize20);    
  }
.ccls-loading-container__spinner .webcon-ui{  
    display: flex;
    align-items: center;
    flex-direction: column;
}
  </style>
 <div id="cclsModal" class="modal-outer" style="display:none">
	<div id="cclsModalLayoutDefinition" class="${ccls.modal.dialog.versionValues.modalDialogContainerClasses}" style="z-index: 2003">
		<${ccls.modal.dialog.versionValues.modalDialogHeaderElement} class=${ccls.modal.dialog.versionValues.modalDialogHeaderElementClasses}>
		<div class="title-container expandable">
			<div class="title" id="cclsModalTitle"></div>
			<div class="subtitle"></div>
		</div>
		<div class="actions">
			<!-- reusing the expand class to match the styling, but moving the position of the element with the style -->
			<div id="cclsOpenInNewWindow" class="expand" style="right: 60px;">
				<button class="webcon-button webcon-button--padding-default standard-focus webcon-button--icon-button no-hover no-background th-hover" aria-label="Close" tabindex="0" type="button">
					<i class="icon ms-Icon ms-Icon--OpenInNewWindow ms-Icon--standard" aria-hidden="true" data-disabled="false"></i>
				</button>
			</div>
			<div id="cclsExpandDialog" class="expand">
				<button class="webcon-button webcon-button--padding-default standard-focus webcon-button--icon-button no-hover no-background th-hover" aria-label="Full screen" tabindex="0" type="button">
					<i id="cclsExpandButtonIcon" class="icon ms-Icon ms-Icon--FullScreen ms-Icon--standard" aria-hidden="true" data-disabled="false"></i>
				</button>
			</div>
			<div id="cclsCloseDialog" class="close">
				<button class="webcon-button webcon-button--padding-default standard-focus webcon-button--icon-button no-hover no-background th-hover" aria-label="Close" tabindex="0" type="button">
					<i class="icon ms-Icon ms-Icon--ChromeClose ms-Icon--standard" aria-hidden="true" data-disabled="false"></i>
				</button>
			</div>
		</div>
	</${ccls.modal.dialog.versionValues.modalDialogHeaderElement}>
	<div class="modal-window__section modal-window__section--no-padding" style="height:100%">
		<!-- <iframe id="cclsModaliframe" height="100%" width="100%" style="border:0px"></iframe> -->
		<div class="attachment-preview-modal__content" style="height:100%">
			<div class="loading-container" aria-busy="false" style="height:100%">
				<div class="loading-container__spinner ccls-loading-container__spinner">
					<div class="loading-container__spinner-overlay"></div>
					<div class="loading-container__spinner-image">
						<div aria-label="Loading" role="progressbar" class="webcon-ui spinner spinner--left">
              <div id="cclsModalDialogSpinnerText"></div>

							<div class="webcon-ui spinner__circle spinner__circle--primary spinner__circle--huge">
								<div class="webcon-ui spinner__circle-outline">									
								</div>
							</div>
						</div>
					</div>
				</div>
				<div class="loading-container__children ccls-loading-container__children" style="height:100%">
					<div class="attachment-preview-modal__loading-frame" style="height:100%">
						<!-- <iframe id="cclsModaliframe" class="attachment-preview-modal__content__frame" src="##iframeSrc##" style=""/> -->
						<iframe id="cclsModaliframe" class="attachment-preview-modal__content__frame" height="100%" width="100%" style="border:0px"></iframe>
            <div id="cclsModalInnerHtml"></div>
					</div>
				</div>
			</div>
		</div>
	</div>
	<!-- <div class="modal-background animation04" style="z-index: 2002"></div> -->
	<div class="footer">
		<div class="footer-right">
			<!-- 
        <button class="webcon-ui button button--primary button--medium animated standard-focus-visible attachment-preview-modal__download-button modal-button attachment-preview-modal__content__button" type="button" data-key="Download">
          <span class="webcon-ui text text__body-1-strong text__base button__content">Download</span>
        </button>
        -->
			<button id="footerCloseButton" class="webcon-ui button button--default button--medium animated standard-focus-visible attachment-preview-modal__close-button modal-button attachment-preview-modal__content__button" type="button" data-key="Close">
				<span class="webcon-ui text text__body-1-strong text__base button__content">Close</span>
			</button>
		</div>
	</div>
</div>
`;

$("#formContainer").append(ccls.modal.dialog.dialogHtml);
// Add events
$("#cclsCloseDialog > button").on('click', function () {
  ccls.modal.dialog.close();
});
$("#footerCloseButton").on('click', function () {
  ccls.modal.dialog.close();
});
$("#cclsExpandDialog > button").on('click', function () {
  ccls.modal.dialog.toggleExpand();
});
$("#cclsOpenInNewWindow > button").on('click', function () {
  ccls.modal.dialog.replaceWindow();
});
ccls.modal.dialog.dragElement = function (element) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  element.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    element.style.top = (element.offsetTop - pos2) + "px";
    element.style.left = (element.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

ccls.modal.dialog.dragElement(document.querySelector("#cclsModalLayoutDefinition"));
//#endregion 

//#region Setting up communication between parent and child
class Message {
  constructor(type, body) {
    this.type = type;
    this.body = body;
  }
}

// Remove all event listeners, to ensure there's only a single one.
//document.removeEventListener("keydown", dkr.missingRequiredFieldsHandler.tabEventListener);  
if (typeof (ccls.modal.dialog.abortController) !== "undefined") {
  ccls.modal.dialog.abortController.abort("Cleaning up parent logic post message handler");
}
ccls.modal.dialog.abortController = new AbortController();
ccls.modal.dialog.parentMessageHandler = function (e) {
  if (e.data) {
    let data = e.data;
    if (data.type == "fullUrl") {
      if (data.body.url.indexOf("?") > -1) {
        data.body.url += '&'
      }
      else {
        data.body.url += '?'
      }
      let url = data.body.url + "returnUrl=" + encodeURIComponent(document.location.href);
      window.open(url, "_blank");
    }
    if (data.type == "childClosed") {
      ccls.modal.dialog.childClosed(data.body)

    }
  }
}
window.addEventListener("message", ccls.modal.dialog.parentMessageHandler, { signal: ccls.modal.dialog.abortController.signal });
//#endregion

//the last line of a script must not be a comment
console.log("modal dialog parent logic executed");
