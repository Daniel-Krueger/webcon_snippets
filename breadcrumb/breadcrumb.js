{
  /* 
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

//#region utility functions
ccls.utils = ccls.utils || {};
// will return the number followed the preceding element
// example url: /db/1/app/14/start/wf/278/dt/332
// "db" would return 1 while wf would return 278
// if no url is provided, document.location.href will be used.
ccls.utils.getIdFromUrl = function (precedingElement, url) {
  if (typeof url == "undefined") url = document.location.href;
  return url.match("\/" + precedingElement + "\/([0-9]*)\/")[1];
};
ccls.utils.continueAlsoPageIsDirty = function () {
  if (
    JSON.stringify(sessionStorage.getItem("WebconBPS_FormIsDirty")).contains(
      "true"
    )
  ) {
    let confirmReloadMessage;
    let homeLabel;
    switch (G_BROWSER_LANGUAGE.substr(0, 2)) {
      case "de":
        confirmReloadMessage =
          "Die Seite soll neugeladen werden, bisherige Änderungen werden nicht gespeichert. Wollen Sie fortfahren.";
        homeLabel = "Home";
        break;
      case "pl":
        confirmReloadMessage =
          "Wszystkie niezapisane dane wprowadzone na formularzu zostaną utracone. Czy chcesz kontynuować?";
        homeLabel = "Home";
        break;
      default:
        confirmReloadMessage =
          "All unsaved entered data on the form will be lost. Do you wish to continue?";
        homeLabel = "Home";
        break;
    }

    return confirm(confirmReloadMessage);
  }
  return false;
};
//#endregion

ccls.breadcrumb = {};
//#region breadcrumb logic
//ccls.breadcrumb.regex = /element\/\d*\/form/i;
ccls.breadcrumb.textOnly = false;
ccls.breadcrumb.showHome = true;
ccls.breadcrumb.homeLabel;
switch (G_BROWSER_LANGUAGE.substr(0, 2)) {
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

ccls.breadcrumb.navigateTo = function (appId, elementId) {
  if (!ccls.utils.continueAlsoPageIsDirty) return;

  elemntToDisplay = `/db/${ccls.utils.getIdFromUrl('db')}/app/${appId}/element/${elementId}/form?returnurl=`
  document.location.href =
    elemntToDisplay + encodeURIComponent(document.location.href);
};
ccls.breadcrumb.webconData = "";
// ccls.breadcrumb.webconData =
//   '[{"id":28153, "parentId":null, "parentLevel":1, "signature":"COSMOCONSULTUserExperience/2023/03/00003", "title":"Parent process", "appId":"110, "formType":"COSMO CONSULT User Experience"},{"id":28174, "parentId":28153, "parentLevel":0, "signature":"COSMOCONSULTUserExperienceChild/2023/03/00020", "title":"AAAAA", "appId":"110, "formType":"COSMO CONSULT User experience child"},]';
ccls.breadcrumb.createBreadcrumb = function () {
  if (new URLSearchParams(document.location.search).get("debug") == "breadcrumb") {
    debugger;
  }
  // No breadcrumb when form is displayed in  embeded or preview mode
  if (document.location.toString().contains("/embed/") || document.location.toString().contains("insidebar=true")) {
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
    homeUrl = `/db/${ccls.utils.getIdFromUrl("db")}/app/${GetPairID(G_APP)}`;
    title = 'Home';
  }

  $(ccls.breadcrumb.documentElement).show();
  ccls.breadcrumb.documentElement.innerHTML =

    `<ul class="ccls-Breadcrumb-list" id="cclsBreadcrumb">
        <li class="ccls-Breadcrumb-listItem ccls-Breadcrumb-Home" id="ccls-Breadcrumb-Home" ${ccls.breadcrumb.showHome ? "" : "style='display:none'"}>
          <a class="ccls-Breadcrumb-itemLink" title="${title}" href="${homeUrl}" style="text-align:center">
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
          breadcrumbDropDownContent += `<span>${item.signature}: ${itemTitle}</span>`;
        } else {
          breadcrumbDropDownContent += `<a onClick="ccls.breadcrumb.navigateTo(${item.appId},${item.id})">${item.signature}: ${itemTitle}</a>`;
        }
        
        let breadcrumbItem;
        if (this.textOnly) {
          breadcrumbItem = `<div class="ccls-Breadcrumb-itemLeave" title="${item.signature}: ${itemTitle}"><span class="ccls-breadcrumb-FormType">${item.formType}</span><br />${itemTitle}</div>`;
        } else {
          breadcrumbItem = `<a class="ccls-Breadcrumb-itemLink" title="${item.signature}: ${itemTitle}" onClick="ccls.breadcrumb.navigateTo(${item.appId},${item.id})"><span class="ccls-breadcrumb-FormType">${item.formType}</span><br />${itemTitle}</a>`;
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
