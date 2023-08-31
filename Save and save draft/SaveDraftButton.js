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


//# region versions
ccls.utils = ccls.utils || {};
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
ccls.addSaveDraftButton = {};
ccls.addSaveDraftButton.Timeout = 0;
ccls.addSaveDraftButton.TimeoutMax = 4;
ccls.addSaveDraftButton.leftToolbarClass = "top-bar-toolbar-menu--placement-left";
ccls.addSaveDraftButton.centerPanelId = "centerPanel";
ccls.addSaveDraftButton.newToolbarButtonId = "NewToolbarButton";
ccls.addSaveDraftButton.returnToolbarButtonId = "ReturnToolbarButton";
ccls.addSaveDraftButton.VersionDependingValues = [
    {
        version: '0.0.0.0',
        values: {
            'buttonClasses': "webcon-button toolbar-button webcon-button--padding-medium standard-focus webcon-button--icon-button no-background th-hover"
        }
    }, {
        version: '2023.1.1.1',
        values: {
            'buttonClasses': "webcon-button toolbar-button__wrapper--toolbar-button webcon-button--padding-medium standard-focus webcon-button--icon-button no-background th-hover"
        }
    }
    // Just a test to check that this works
    , {
        version: '2023.1.2.1',
        values: {
            'buttonClasses': "webcon-button toolbar-button__wrapper--toolbar-button webcon-button--padding-medium standard-focus webcon-button--icon-button no-background th-hover"
        }
    }
];
//#endregion

ccls.addSaveDraftButton.versionValues = ccls.utils.getVersionValues(ccls.addSaveDraftButton.VersionDependingValues);
ccls.addSaveDraftButton.buttonClasses = ccls.addSaveDraftButton.versionValues.buttonClasses;

ccls.addSaveDraftButton.saveButton = null;
// Define the label of the path
switch (window.initModel.userLang.substring(0, 2)) {
    case "de":
        ccls.addSaveDraftButton.saveDraftButtonLabel = "Entwurf speichern";
        break;
    case "pl":
        ccls.addSaveDraftButton.saveDraftButtonLabel = "Zapisz tymczasowo";
        break;
    default:
        ccls.addSaveDraftButton.saveDraftButtonLabel = "Save draft";
        break;
}

ccls.addSaveDraftButton.createSaveDraftButton = async function (pathId, alternativeLabel) {
    // Only execute if it's not ie11 which is used in the outlook addin
    if (typeof (window.msCrypto) == "undefined") {
        // Start debugger, if debug parameter is set and dev tools are started.
        if (new URLSearchParams(document.location.search).get("debug") == 1) {
            debugger;
        }
    }
    // The pathId is passed as a string so we need to parse it to an int.
    pathId = parseInt(pathId);
    // if this is a an existing element: hide the save draft path and return
    
    if (!(await ccls.utils.getGlobal('G_EDITVIEW')) || !(G_WFELEM === '0#')) {
        // hide path in "available paths" buttons" group
        let paths = (await ccls.utils.getLiteModel()).paths;
        if (paths.length > 0) {
            let draftPath = paths.find(i => i.id == pathId);
            if (draftPath !== undefined) {
                HidePath(pathId);
                let existingToolbar = document.getElementById(ccls.addSaveDraftButton.centerPanelId)
                existingToolbar.insertAdjacentHTML("beforeend", `<style>div[data-key="${draftPath.title}"]{display:none;}</style>`)
            }
        }
        return
    }

    if (typeof (alternativeLabel) == "string" && alternativeLabel.length > 0) {
        ccls.addSaveDraftButton.saveDraftButtonLabel = alternativeLabel;
    }


    var items = document.getElementsByClassName(ccls.addSaveDraftButton.leftToolbarClass);
    // verify that there is exactly one LeftToolbar
    if (items == null || items.length != 1) {
        if (ccls.addSaveDraftButton.Timeout <= ccls.addSaveDraftButton.TimeoutMax) {
            ccls.addSaveDraftButton.Timeout++;
            setTimeout(function () { ccls.addSaveDraftButton.createSaveDraftButton(pathId); }, 333)
        }
        return;
    }

    // creating a dummy element and insert the default html code for the save button
    // the only changes to the default html is the label and the MoveToNextStep function 
    var saveButton = document.createElement('div');
    saveButton.innerHTML = `<div class="toolbar-button__wrapper">
<button id="SaveDraftToolbarButton" title="${ccls.addSaveDraftButton.saveDraftButtonLabel}"  tabindex="0" type="button" aria-label="${ccls.addSaveDraftButton.saveDraftButtonLabel}" class="${ccls.addSaveDraftButton.buttonClasses}"  onclick="MoveToNextStep(${pathId})" >
    <i class="icon ms-Icon ms-Icon--Save ms-Icon--standard" aria-hidden="true" data-disabled="false"></i>
    <div class="typography typography-font-size-standard webcon-button__title">${ccls.addSaveDraftButton.saveDraftButtonLabel}</div>
</button>
</div>
`;
    var leftToolbar = items[0];

    // Get the target position of the draft button
    var saveDraftButtonPosition
    for (saveDraftButtonPosition = 0; saveDraftButtonPosition < leftToolbar.children.length; saveDraftButtonPosition++) {
        if (leftToolbar.children[saveDraftButtonPosition].children[0].id == ccls.addSaveDraftButton.newToolbarButtonId ||
            leftToolbar.children[saveDraftButtonPosition].children[0].id == ccls.addSaveDraftButton.returnToolbarButtonId) {
            continue
        }
        break;
    }

    // insert the draft button
    if (saveDraftButtonPosition >= leftToolbar.children.length) {
        leftToolbar.appendChild(saveButton.firstChild)
    } else {
        leftToolbar.insertBefore(saveButton.firstChild, leftToolbar.children[saveDraftButtonPosition])
    }
}

ccls.addSaveDraftButton.createSaveDraftButton(#{BRP:21}#,#{BRP:23}#);
console.log("save draft button logic executed");