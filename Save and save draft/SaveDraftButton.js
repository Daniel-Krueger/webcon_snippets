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
            'isNewInstance': function () { return G_WFELEM === '0#' },
            'getButtonHtml': function (pathId) {
                return `<div class="toolbar-button__wrapper">
<button id="SaveDraftToolbarButton" title="${ccls.addSaveDraftButton.saveDraftButtonLabel}"  tabindex="0" type="button" aria-label="${ccls.addSaveDraftButton.saveDraftButtonLabel}" class="webcon-button toolbar-button webcon-button--padding-medium standard-focus webcon-button--icon-button no-background th-hover"  onclick="MoveToNextStep(${pathId})" >
    <i class="icon ms-Icon ms-Icon--Save ms-Icon--standard" aria-hidden="true" data-disabled="false"></i>
    <div class="typography typography-font-size-standard webcon-button__title">${ccls.addSaveDraftButton.saveDraftButtonLabel}</div>
</button>
</div>
`;
            }
        }
    }
    , {
        version: '2023.1.1.1',
        values: {
            'isNewInstance': function () { return G_WFELEM === '0#' },
            'getButtonHtml': function (pathId) {
                return `<div class="toolbar-button__wrapper">
<button id="SaveDraftToolbarButton" title="${ccls.addSaveDraftButton.saveDraftButtonLabel}"  tabindex="0" type="button" aria-label="${ccls.addSaveDraftButton.saveDraftButtonLabel}" class="webcon-button toolbar-button__wrapper--toolbar-button webcon-button--padding-medium standard-focus webcon-button--icon-button no-background th-hover"  onclick="MoveToNextStep(${pathId})" >
    <i class="icon ms-Icon ms-Icon--Save ms-Icon--standard" aria-hidden="true" data-disabled="false"></i>
    <div class="typography typography-font-size-standard webcon-button__title">${ccls.addSaveDraftButton.saveDraftButtonLabel}</div>
</button>
</div>
`;
            }
        }
    }
    , {
        version: '2024.1.1.1',
        values: {
            'isNewInstance': function () { return G_WFELEM === null },
            'getButtonHtml': function (pathId) {
                return `<div class="toolbar-button__wrapper">
<button id="SaveDraftToolbarButton" title="${ccls.addSaveDraftButton.saveDraftButtonLabel}"  tabindex="0" type="button" aria-label="${ccls.addSaveDraftButton.saveDraftButtonLabel}" class="webcon-button toolbar-button__wrapper--toolbar-button webcon-button--padding-medium standard-focus webcon-button--icon-button no-background th-hover"  onclick="MoveToNextStep(${pathId})" >
    <i class="icon ms-Icon ms-Icon--Save ms-Icon--standard" aria-hidden="true" data-disabled="false"></i>
    <div class="typography typography-font-size-standard webcon-button__title">${ccls.addSaveDraftButton.saveDraftButtonLabel}</div>
</button>
</div>
`;
            }
        }
    }
    , {
        version: '2025.1.1.1',
        values: {
            'isNewInstance': function () { return G_WFELEM === null },
            'getButtonHtml': function (pathId) {
                return `<div class="toolbar-button__wrapper">
<button id="SaveDraftToolbarButton" title="${ccls.addSaveDraftButton.saveDraftButtonLabel}"  tabindex="0" type="button" aria-label="${ccls.addSaveDraftButton.saveDraftButtonLabel}" class="webcon-ui button button--subtle button--medium toolbar-button__button"  onclick="MoveToNextStep(${pathId})" >
    <span class="webcon-ui text text__body-1-strong text__base button__content"><div class="toolbar-button__wrapper--button-content">
        <i class="icon ms-Icon ms-Icon--Reply ms-Icon--standard" aria-hidden="true" data-disabled="false"></i>${ccls.addSaveDraftButton.saveDraftButtonLabel}</div>
    </span>
</button>
</div>
`;
            }
        }
    }

];
//#endregion

ccls.addSaveDraftButton.versionValues = ccls.utils.getVersionValues(ccls.addSaveDraftButton.VersionDependingValues);

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

    if (!ccls.addSaveDraftButton.versionValues.isNewInstance()) {
        // hide path in "available paths" buttons" group
        let paths = ccls.utils.basicPathInformation;
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
    saveButton.innerHTML = ccls.addSaveDraftButton.versionValues.getButtonHtml(pathId);
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