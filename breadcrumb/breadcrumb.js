{
  /* jQuery references have been removed

  Example breadcrumb loading
  <div id="cclsBreadCrumbContainer" class="ccls-Breadcrumb" style="display:none">
  </div>
  <span id="cclsTitleField">TITLEFIELD</span>

  <script>
  InvokeRule(BREADCRUMB_FORM_RULE)
  ccls.breadcrumb.webconData = 'GET_BREADCRUMB_DATA_RULE'
  //ccls.breadcrumb.textOnly = true;
  //ccls.breadcrumb.showHome = false;
  ccls.breadcrumb.createBreadcrumb();
  </script>
  */
}

window.ccls = window.ccls || {};


//#region initialModel is no longer available in BPS 2023 R2 so we access the desktop endpoint to retrieve the liteModel
ccls.utils = ccls.utils || {};
ccls.utils.getIdFromUrl = function (precedingElement, url) {
    if (typeof (url) == "undefined") url = document.location.href;
    return url.match("\/" + precedingElement + "\/([0-9]*)\/")[1];
};
// If the user clicks fast in the task view in may happen, that the globals don't exist yet.
// This also applies when opening the preview.    
ccls.utils.getGlobal = function (variableName) {
  return new Promise(resolve => {
      if (typeof window[variableName] !== 'undefined') {
          resolve(window[variableName]);
      } else {
          let counter = 0;
          const interval = setInterval(() => {
              if (counter > 50) { // 1 second
                  console.log("GetGlobal hit max iteration of 50!!!");
                  clearInterval(interval);
              }
              console.log("Getglobal counter value: " + counter);
              if (typeof window[variableName] !== 'undefined') {
                  clearInterval(interval);
                  resolve(window[variableName]);
              }
          }, 20);
      }
  });
};
ccls.utils.desktopResult = null;
ccls.utils.getLiteModel = async function () {
    // Desktopresult is null after every save/refresh
    if (ccls.utils.desktopResult != null) {
        return ccls.utils.desktopResult.liteData.liteModel;
    }
    let url;
    if ((await (ccls.utils.getGlobal('G_ISNEW')))) {
        const searchParams = new URLSearchParams(document.location.search);
        url = `/api/nav/db/${ccls.utils.getIdFromUrl('db')}/start/wf/${ccls.utils.getIdFromUrl('wf')}/dt/${ccls.utils.getIdFromUrl('dt')}/desktop?${searchParams.has("com_id") ? 'com_id=' + searchParams.get("com_id") : ''}`
    }
    else {
        url = `/api/nav/db/${ccls.utils.getIdFromUrl('db')}/element/${GetPairID(G_WFELEM)}/desktop`;
    }

    console.log("Calling desktop endpoint");
    // Fetch the JSON resource
    const desktopResult = await fetch(url);

    if (!desktopResult.ok) {
        throw new Error('Failed to fetch desktopModel');
    }

    ccls.utils.desktopResult = await desktopResult.json();

    return ccls.utils.desktopResult.liteData.liteModel;
}
ccls.utils.getSpecificLiteModel = async function (dbId, elementId) {
    url = `/api/nav/db/${dbId}/element/${elementId}/desktop`;

    console.log("Calling desktop endpoint");
    // Fetch the JSON resource
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error('Failed to fetch desktopModel');
    }

    return await response.json();
}
//#endregion
ccls.utils.continueAlsoPageIsDirty = function () {
  if (JSON.stringify(sessionStorage.getItem("WebconBPS_FormIsDirty")).indexOf("true") > -1) {
    let confirmReloadMessage;
    switch (window.initModel.userLang.substr(0, 2)) {
      case "de":
        confirmReloadMessage =
          "Die Seite soll neugeladen werden, bisherige Änderungen werden nicht gespeichert. Wollen Sie fortfahren.";
        break;
      case "pl":
        confirmReloadMessage =
          "Wszystkie niezapisane dane wprowadzone na formularzu zostaną utracone. Czy chcesz kontynuować?";
        break;
      default:
        confirmReloadMessage =
          "All unsaved entered data on the form will be lost. Do you wish to continue?";
        break;
    }

    return confirm(confirmReloadMessage);
  }
  return false;
};

ccls.breadcrumb = {};
//#region breadcrumb logic
//ccls.breadcrumb.regex = /element\/\d*\/form.*/i;
ccls.breadcrumb.textOnly = false;
ccls.breadcrumb.showHome = true;
ccls.breadcrumb.homeLabel;
switch (window.initModel.userLang.substr(0, 2)) {
  case "de":
    ccls.breadcrumb.homeLabel = "Home";
    break;
  case "pl":
    ccls.breadcrumb.homeLabel = "Home";
    break;
  default:
    ccls.breadcrumb.homeLabel = "Home";
    break;
}

ccls.breadcrumb.navigateTo = async function (appId, elementId) {
  if (!ccls.utils.continueAlsoPageIsDirty) return;
  let dbId = ccls.utils.getIdFromUrl('db');
  // We can not fetch the application from the URL because it's not part of the URL from the global task overview.
  // Only the db and element are part of the URL /tasks/db/3/element/2758/form
  let currentAppId = (await ccls.utils.getLiteModel()).formInfo.applicationId;
  let currentElementId = ccls.utils.getIdFromUrl('element');
  // Release current document if in edit mode
  if (G_EDITVIEW == true) {
    let options = {
      method: 'GET',
      headers: {}
    };
    // We don't need the result.
    fetch(`/api/nav/db/${dbId}/app/${currentAppId}/element/${currentElementId}/checkout/release`, options).then();
  }
  elemntToDisplay = `/db/${dbId}/app/${appId}/element/${elementId}/form?returnurl=`

  // Will include the existing return URL
  //document.location.href =
  //    elemntToDisplay + encodeURIComponent(`/db/${dbId}/app/${currentAppId}/element/${currentElementId}/form` + document.location.search);
  // Use only the current return URL
  document.location.href =
    elemntToDisplay + encodeURIComponent(`/db/${dbId}/app/${currentAppId}/element/${currentElementId}/form`);
};
ccls.breadcrumb.webconData = "";
// ccls.breadcrumb.webconData =
//   '[{"id":28153, "parentId":null, "parentLevel":1, "signature":"COSMOCONSULTUserExperience/2023/03/00003", "title":"Parent process", "appId":"110, "formType":"COSMO CONSULT User Experience"},{"id":28174, "parentId":28153, "parentLevel":0, "signature":"COSMOCONSULTUserExperienceChild/2023/03/00020", "title":"AAAAA", "appId":"110, "formType":"COSMO CONSULT User experience child"},]';
ccls.breadcrumb.createBreadcrumb = async function () {
  if (new URLSearchParams(document.location.search).get("debug") == "breadcrumb") {
    debugger;
  }
  // No breadcrumb when form is displayed in  embeded or preview mode
  if (document.location.toString().indexOf("/embed/") > -1 || document.location.toString().indexOf("insidebar=true") > -1) {
    document.getElementById("cclsTitleField").style.display = "none";
    return;
  }

  ccls.breadcrumb.documentElement = document.getElementById("cclsBreadCrumbContainer");
  applicationHomeElement = $('a[data-key="application.home"]')[0]
  let homeUrl = ""
  if (applicationHomeElement != null) {
    homeUrl = applicationHomeElement.href;
    title = applicationHomeElement.innerText;
  }
  else {
    homeUrl = `/db/${ccls.utils.getIdFromUrl("db")}/app/${GetPairID((await ccls.utils.getGlobal('G_APP')))}`;
    title = 'Home';
  }

  $(ccls.breadcrumb.documentElement).show();
  ccls.breadcrumb.documentElement.innerHTML =

    `<ul class="ccls-Breadcrumb-list" id="cclsBreadcrumb">
        <li class="ccls-Breadcrumb-listItem ccls-Breadcrumb-Home" id="ccls-Breadcrumb-Home" ${ccls.breadcrumb.showHome ? "" : "style='display:none'"}>
          <a class="ccls-Breadcrumb-itemLink" title="${title} " href="${homeUrl}" style="text-align:center">
            <span class="ccls-breadcrumb-FormType">${ccls.breadcrumb.homeLabel}</span><br />
            <i class="ms-Icon ms-Icon--Home ccls-breadcrumb-HomeIcon " ></i>
          </a>          
          <i class="ccls-Breadcrumb-chevron ms-Icon ms-Icon--ChevronRight"></i>
        </li>
    </ul>`
    ;
  let breadcrumbList = document.getElementById("cclsBreadcrumb");
  if (ccls.breadcrumb.webconData != "") {
    ccls.breadcrumb.data = JSON.parse(
      ccls.breadcrumb.webconData.replace(",]", "]")
    );

    let currentInstanceId = Number.parseInt(GetPairID(G_WFELEM))


    let breadcrumbDropDownContent = "";
    for (let i = 0; i < ccls.breadcrumb.data.length; i++) {
      item = ccls.breadcrumb.data[i];
      // The current element will be displayed by the HTML field itself
      if (currentInstanceId != item.id) {
        let dummy = document.createElement("li");
        dummy.classList.add("ccls-Breadcrumb-listItem");
        let itemTitle = item.title
        if (itemTitle == null || itemTitle == "") {
          itemTitle = item.formType
        }

        if (this.textOnly) {
          breadcrumbDropDownContent += `<span>${item.signature + ':' + itemTitle}</span>`;
        } else {
          breadcrumbDropDownContent += `<a onClick="ccls.breadcrumb.navigateTo(${item.appId},${item.id})">${item.signature + '(' + item.id + ')' + ':' + itemTitle}</a>`;
        }

        let breadcrumbItem;
        if (this.textOnly) {
          breadcrumbItem = `<div class="ccls-Breadcrumb-itemLeave" title="${item.signature + ':' + itemTitle}"><span class="ccls-breadcrumb-FormType">${item.formType}</span><br />${itemTitle}</div>`;
        } else {
          breadcrumbItem = `<a class="ccls-Breadcrumb-itemLink" title="${item.signature + '(' + item.id + ')' + ':' + itemTitle}" onClick="ccls.breadcrumb.navigateTo(${item.appId},${item.id})"><span class="ccls-breadcrumb-FormType">${item.formType}</span><br />${itemTitle}</a>`;
        }
        breadcrumbItem += '<i class="ccls-Breadcrumb-chevron ms-Icon ms-Icon--ChevronRight"></i>';
        dummy.innerHTML = breadcrumbItem;
        breadcrumbList.insertAdjacentElement("beforeend", dummy);
      }
    }

    if (breadcrumbDropDownContent != "") {

      breadcrumbContent = document.getElementById("ccls-Breadcrumb-Home");
      breadcrumbContent.insertAdjacentHTML("beforeend",
        `
      <div id="ccls-Breadcrumb-DropDown">
        ${breadcrumbDropDownContent}
      </div>
      `);
    }
  }
  // add leave element and using title field
  breadcrumbList.insertAdjacentHTML("beforeend",
    `
        <li class="ccls-Breadcrumb-listItem" >
          <div class="ccls-Breadcrumb-itemLeave" id="cclsBreadcrumbItemLeave">
          <span style="font-size:12px;">${GetPairName(G_DOCTYPE)}</span><br>
          </div>
        </li>
      `);
  let leaveElement = document.getElementById("cclsBreadcrumbItemLeave");
  let titleField = document.getElementById("cclsTitleField");
  leaveElement.insertAdjacentElement("beforeend", titleField);
};
//#endregion

//#region breadcrumb styling
ccls.breadcrumb.styling = `
<style>
.ccls-Breadcrumb {
  font-family: Segoe UI WestEuropean, Segoe UI, -apple-system,
    BlinkMacSystemFont, Roboto, Helvetica Neue, sans-serif;
  -webkit-font-smoothing: antialiased;
  margin-top: -15px;
}
.ccls-Breadcrumb-list {
  display: inline;
  white-space: nowrap;
  padding: 0;
  margin: 0;
}
.ccls-Breadcrumb-list .ccls-Breadcrumb-listItem {
  list-style-type: none;
  vertical-align: top;
  margin: 0;
  padding: 0;
  display: inline-block;
  min-height: 56px;
}
.ccls-Breadcrumb-itemLink {
  font-weight: 100;
  font-size: 21px;
  display: inline-block;
  padding: 0 4px;
  max-width: 350px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  vertical-align: top;
}
.ccls-Breadcrumb-itemLink,
.ccls-Breadcrumb-overflowButton {
  text-decoration: none;
  outline: transparent;
}
.ccls-Breadcrumb-itemLeave {
  font-size: 21px;
  display: inline-block;
  padding: 0 4px;
  max-width: 350px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  vertical-align: top;
}
.ccls-Breadcrumb-itemLink:hover,
.ccls-Breadcrumb-overflowButton:hover {
  cursor: pointer;
}
.ccls-Breadcrumb-itemLink:active,
.ccls-Breadcrumb-overflowButton:active {
  outline: transparent;
}
.ccls-Breadcrumb-chevron {
  font-size: 12px;
  font-weight: bolder;
  margin-top: 28px;
  line-height: 1;
}
.ccls-breadcrumb-FormType {
  font-size: 12px;
}
.ccls-breadcrumb-HomeIcon {
  font-size: 21px;
  /* margin-top: 8px; */
}

#ccls-Breadcrumb-DropDown {
  display: none;
  position: absolute;
  background-color: #fff;
  min-width: 160px;
  z-index: 1;
  padding: 8px;
  border: 1px solid #ccc;
}

#ccls-Breadcrumb-DropDown a {
  display: block;
  padding: 4px 0;
}

.ccls-Breadcrumb-Home:hover #ccls-Breadcrumb-DropDown {
  display: block;
}
.ccls-Breadcrumb-Home {
  position: relative;
  display: inline-block;
}
.ccls-Breadcrumb-list li:nth-last-child(n+4):not(:first-child) {
  display: none;
}
@media only screen and (max-width: 1300px) {
  .ccls-Breadcrumb-list li:not(:last-child):not(:first-child) {
    display: none;
  }
  .ccls-Breadcrumb-Home {
    display: inline-block;
  }
  #ccls-Breadcrumb-DropDown a {
    display: none;
  }
  .ccls-Breadcrumb-Home:hover #ccls-Breadcrumb-DropDown a {
    display: block;
  }
}
</style>
    `;
$("#formContainer").append(ccls.breadcrumb.styling);
//#endregion

//the last line of a script must not be a comment
console.log("breadcrumb logic executed");
