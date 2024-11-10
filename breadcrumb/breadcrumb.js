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
ccls.breadcrumb = {};
//#region breadcrumb logic
//ccls.breadcrumb.regex = /element\/\d*\/form.*/i;
ccls.breadcrumb.textOnly = false;
ccls.breadcrumb.showHome = true;
ccls.breadcrumb.showWorkflowId = true;
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

ccls.breadcrumb.VersionDependingValues = [
  {
    version: '0.0.0.0',
    values: {
      'moveBreadcrumb': function () { }
    }
  }
  , {
    version: '2025.1.1.1',
    values: {
      'moveBreadcrumb': function () {
        let navigationHeader = document.querySelector("#formContainer .webcon-ui .banner__header");
        navigationHeader.children[0].remove()
        navigationHeader.appendChild(ccls.breadcrumb.documentElement)
      }
    }
  }
];
ccls.breadcrumb.versionValues = ccls.utils.getVersionValues(ccls.breadcrumb.VersionDependingValues);

ccls.breadcrumb.navigateTo = async function (appId, elementId, event) {
  if (!ccls.utils.continueAlsoPageIsDirty) return;
  let dbId = ccls.utils.getIdFromUrl('db');

  // We can not fetch the application from the URL because it's not part of the URL from the global task overview.
  // Only the db and element are part of the URL /tasks/db/3/element/2758/form  
  let currentAppId = appId > 0 ? appId : ccls.utils.applicationId

  let currentElementId = elementId > 0 ? elementId : ccls.utils.getIdFromUrl('element');
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

  let url = elemntToDisplay + encodeURIComponent(`/db/${dbId}/app/${currentAppId}/element/${currentElementId}/form`);

  if (event.ctrlKey) {
    window.open(url, '_blank');
  } else {
    document.location.href = url;
  }
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
          breadcrumbDropDownContent += `<a onClick="ccls.breadcrumb.navigateTo(${item.appId},${item.id},event)">${item.signature + (ccls.breadcrumb.showWorkflowId ? ' (' + item.id + ')' : '') + ': ' + itemTitle}</a>`;
        }

        let breadcrumbItem;
        if (this.textOnly) {
          breadcrumbItem = `<div class="ccls-Breadcrumb-itemLeave" title="${item.signature + ':' + itemTitle}"><span class="ccls-breadcrumb-FormType">${item.formType}</span><br />${itemTitle}</div>`;
        } else {
          breadcrumbItem = `<a class="ccls-Breadcrumb-itemLink" title="${item.signature + (ccls.breadcrumb.showWorkflowId ? ' (' + item.id + ')' : '') + ': ' + itemTitle}" onClick="ccls.breadcrumb.navigateTo(${item.appId},${item.id},event)"><span class="ccls-breadcrumb-FormType">${item.formType}</span><br />${itemTitle}</a>`;
        }
        breadcrumbItem += '<i class="ccls-Breadcrumb-chevron ms-Icon ms-Icon--ChevronRight"></i>';
        dummy.innerHTML = breadcrumbItem;
        breadcrumbList.insertAdjacentElement("beforeend", dummy);
      }
    }

    if (breadcrumbDropDownContent != "") {

      breadcrumbContent = document.getElementById("formContainer");
      breadcrumbContent.insertAdjacentHTML("beforeend",
        `
      <div id="ccls-Breadcrumb-DropDown">
        ${breadcrumbDropDownContent}
      </div>
      `);
      ccls.breadcrumb.setupHomeIconDropDownHoverEffect();
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
  let leaveElement = breadcrumbList.querySelector("#cclsBreadcrumbItemLeave");
  let titleField = document.getElementById("cclsTitleField");
  leaveElement.insertAdjacentElement("beforeend", titleField);
  ccls.breadcrumb.versionValues.moveBreadcrumb();
};

ccls.breadcrumb.setupHomeIconDropDownHoverEffect = function () {


  const breadcrumbHome = document.getElementById("ccls-Breadcrumb-Home");
  const breadcrumbDropDown = document.getElementById("ccls-Breadcrumb-DropDown");


  // Function to show the dropdown
  function showDropdown() {
    const rect = breadcrumbHome.getBoundingClientRect();
    // breadcrumbDropDown.style.top = `${rect.bottom + window.scrollY}px`;
    // breadcrumbDropDown.style.left = `${rect.left + window.scrollX}px`;
    breadcrumbDropDown.style.top = `${rect.top - 20 + window.scrollY}px`;
    breadcrumbDropDown.style.display = "block";
  }

  // Function to hide the dropdown
  function hideDropdown() {
    breadcrumbDropDown.style.display = "none";
  }

  // Show dropdown when hovering over breadcrumb
  breadcrumbHome.addEventListener("mouseenter", showDropdown);

  // Keep dropdown visible when hovering over it
  breadcrumbDropDown.addEventListener("mouseenter", showDropdown);

  // Hide dropdown only when the mouse leaves both elements
  breadcrumbHome.addEventListener("mouseleave", function () {
    setTimeout(() => {
      if (!breadcrumbDropDown.matches(':hover')) hideDropdown();
    }, 400); // Slight delay to ensure mouseenter can be triggered on dropdown
  });

  breadcrumbDropDown.addEventListener("mouseleave", hideDropdown);
}
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
  z-index: 999;
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
   /* display: none; */
  }
  .ccls-Breadcrumb-Home:hover #ccls-Breadcrumb-DropDown a {
    /* display: block; */
  }
}
</style>
    `;
$("#formContainer").append(ccls.breadcrumb.styling);
//#endregion

//the last line of a script must not be a comment
console.log("breadcrumb logic executed");
