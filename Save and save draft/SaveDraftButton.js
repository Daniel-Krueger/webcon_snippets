window.ccls = window.ccls || {};
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
        if (new URLSearchParams(document.location.search).get("debug") == 'saveDraft') {
            debugger;
        }
    }
    // The pathId is passed as a string so we need to parse it to an int.
    pathId = parseInt(pathId);
    // if this is a an existing element: hide the save draft path and return

    if (!(await ccls.utils.getGlobal('G_EDITVIEW')) || !(G_WFELEM === '0#')) {
        // hide path in "available paths" buttons" group
        let paths =  ccls.utils.basicPathInformation;
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

//ccls.addSaveDraftButton.createSaveDraftButton('PATHID', 'AlternativeLabel');
console.log("save draft button logic executed");