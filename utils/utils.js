window.ccls = window.ccls || {};
ccls.utils = ccls.utils || {};
ccls.utils.getIdFromUrl = function (precedingElement, url) {
  if (typeof (url) == "undefined") url = document.location.href;
  return url.match("\/" + precedingElement + "\/([0-9]*)\/")[1];
};

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

//#region Get lite model
ccls.utils.desktopResult = null;
ccls.utils.getFetchHeaders = function () {
  const headers = new Headers();
  const impersonatorData = localStorage.getItem("WebconBPS_Impersonator");
  if (impersonatorData) {
    try {
      const parsedData = JSON.parse(impersonatorData);
      if (parsedData.login) {
        headers.append("X-Impersonateperson", parsedData.login);
      }
    } catch (error) {
    }
  }
  return headers;
}

ccls.utils.getLiteModel = async function () {
  // Desktopresult is null after every save/refresh
  if (ccls.utils.desktopResult != null) {
    return ccls.utils.desktopResult.liteData.liteModel;
  }
  let url;
  const options = {
    method: "GET",
    headers: ccls.utils.getFetchHeaders(),
  };
  if ((await (ccls.utils.getGlobal('G_ISNEW')))) {
    const searchParams = new URLSearchParams(document.location.search);
    url = `/api/nav/db/${ccls.utils.getIdFromUrl('db')}/start/wf/${ccls.utils.getIdFromUrl('wf')}/dt/${ccls.utils.getIdFromUrl('dt')}/desktop?${searchParams.has("com_id") ? 'com_id=' + searchParams.get("com_id") : ''}`
  }
  else {
    url = `/api/nav/db/${ccls.utils.getIdFromUrl('db')}/element/${GetPairID(G_WFELEM)}/desktop`;
    if (document.location.pathname.endsWith("/edit")) {
      url += "/edit";
    }
  }

  console.log("Calling desktop endpoint");
  // Fetch the JSON resource
  const desktopResult = await fetch(url, options);

  if (!desktopResult.ok) {
    throw new Error('Failed to fetch desktopModel');
  }

  ccls.utils.desktopResult = await desktopResult.json();

  return ccls.utils.desktopResult.liteData.liteModel;
}
//#endregion

//#region version handling
ccls.utils.Version = function (s) {
    this.arr = s.split('.').map(Number);
}
ccls.utils.Version.prototype.compareTo = function (v) {
    for (var i = 0; ; i++) {
        if (i >= v.arr.length) return i >= this.arr.length ? 0 : 1;
        if (i >= this.arr.length) return -1;
        var diff = this.arr[i] - v.arr[i]
        if (diff) return diff > 0 ? 1 : -1;
    }
}
ccls.utils.getVersionValues = function (versionValues) {
    let webconVersion = new ccls.utils.Version(window.window.initModel.version);
    let currentVersionValue = versionValues.findLast(entry => webconVersion.compareTo(new ccls.utils.Version(entry.version)) > -1).values;
    return currentVersionValue;

}
//#endregion

console.log("utils have been loaded");