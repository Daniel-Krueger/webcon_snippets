
{/* 
<div class="ms-Breadcrumb">
  <ul class="ms-Breadcrumb-list" id="cclsBreadcrumb"></ul>
</div> 
*/}

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
    switch (G_BROWSER_LANGUAGE.substr(0, 2)) {
      case "de":
        confirmReloadMessage =
          "Die Seite soll neugeladen werden, bisherige Änderungen werden nicht gespeichert. Wollen Sie fortfahren.";
        break;

      default:
        confirmReloadMessage =
          "All unsaved data entered on the form will be lost. Do you wish to continue?";
        break;
    }

    return confirm(confirmReloadMessage);
  }
  return false;
};
//#endregion

ccls.breadcrumb = {};
//#region breadcrumb logic
ccls.breadcrumb.regex = /element\/\d*\/form/i;

ccls.breadcrumb.navigateTo = function (elementId) {
  if (!ccls.utils.continueAlsoPageIsDirty) return;
  currentElement = document.location.pathname.replace(
    ccls.breadcrumb.regex,
    `element/${elementId}/form?returnurl=`
  );
  document.location.href =
    currentElement + encodeURIComponent(document.location.href);
};
ccls.breadcrumb.webconData = "";
// ccls.breadcrumb.webconData =
//   '[{"id":5615,"parentId":5590,"formType":"Lesebestätigung"},{"id":5590,"parentId":4971,"formType":"Dokumentenverteilung"},{"id":4971,"parentId":3551,"formType":"Revision"},{"id":3551,"parentId":null,"formType":"Veröffentlichtes Rahmendokument"},]';
ccls.breadcrumb.createBreadcrumb = function () {
  // No breadcrumb when form is displayed in  embeded or preview mode
  if (document.location.toString().contains("/embed/") || document.location.toString().contains("insidebar=true")) return;
  ccls.breadcrumb.documentElement = document.getElementById("cclsBreadcrumb");
  if (ccls.breadcrumb.webconData != "") {
    ccls.breadcrumb.data = JSON.parse(
      ccls.breadcrumb.webconData.replace(",]", "]")
    );
    
    let currentParentId = null;
    // The current element won't be displayed as a link, but will be added as text.
    //  This will also allow us to display the current form type in case of a new workfow instance.
    for (let i = 0; i < ccls.breadcrumb.data.length - 1; i++) {
      let result = ccls.breadcrumb.data.filter(
        (item) => item.parentId === currentParentId
      );
      if (result.length > 0) {
        let item = result[0];
        let dummy = document.createElement("li");
        dummy.classList.add("ms-Breadcrumb-listItem");
        let breadcrumbItem = `<a class="ms-Breadcrumb-itemLink" title="${item.signature}: ${item.title}" onClick="ccls.breadcrumb.navigateTo(${item.id})">${item.formType}</a>`;
        if (i + 1 < ccls.breadcrumb.data.length)
          breadcrumbItem +=
            '<i class="ms-Breadcrumb-chevron ms-Icon ms-Icon--ChevronRight"></i>';
        dummy.innerHTML = breadcrumbItem;
        ccls.breadcrumb.documentElement.appendChild(dummy);
        currentParentId = item.id;
      }
    }    
  }

  // Adding the current form type to the breadcrumb as a simple text
  let dummy = document.createElement("li");
  dummy.classList.add("ms-Breadcrumb-listItem");
  let breadcrumbItem = `<span class="ms-Breadcrumb-itemLink" title="" >${GetPairName(G_DOCTYPE)}</span>`;
  dummy.innerHTML = breadcrumbItem;
  ccls.breadcrumb.documentElement.appendChild(dummy);
        
};
//#endregion

//#region breadcrumb styling
ccls.breadcrumb.styling = `
  <style>
    .ms-Breadcrumb {
      font-family: Segoe UI WestEuropean, Segoe UI, -apple-system,
        BlinkMacSystemFont, Roboto, Helvetica Neue, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .ms-Breadcrumb-list {
      display: inline;
      white-space: nowrap;
      padding: 0;
      margin: 0;
    }
    .ms-Breadcrumb-list .ms-Breadcrumb-listItem {
      list-style-type: none;
      vertical-align: top;
      margin: 0;
      padding: 0;
      display: inline-block;
    }
    .ms-Breadcrumb-itemLink {
      font-weight: 100;
      font-size: 21px;
      color: #333;
      display: inline-block;
      padding: 0 4px;
      max-width: 160px;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      vertical-align: top;
    }
    .ms-Breadcrumb-itemLink,
    .ms-Breadcrumb-overflowButton {
      text-decoration: none;
      outline: transparent;
    }
    .ms-Breadcrumb-itemLink:hover,
    .ms-Breadcrumb-overflowButton:hover {
      background-color: #f4f4f4;
      cursor: pointer;
    }
    .ms-Breadcrumb-itemLink:active,
    .ms-Breadcrumb-overflowButton:active {
      outline: transparent;
      background-color: #c8c8c8;
    }
    .ms-Breadcrumb-chevron {
      font-size: 12px;
      color: #666;
      vertical-align: top;
      margin: 10px 4px;
      line-height: 1;
    }
  </style>
  `;
$(document.head).append(ccls.breadcrumb.styling);
//#endregion

//the last line of a script must not be a comment
console.log("breadcrumb logic executed");