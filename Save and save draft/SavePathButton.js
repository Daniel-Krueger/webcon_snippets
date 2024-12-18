window.ccls = window.ccls || {};
if (ccls.addSaveButtonAsPath?.TimeoutId != undefined) {
    console.log("clear timeout");
    clearTimeout(ccls.addSaveButtonAsPath.TimeoutId);
}

ccls.addSaveButtonAsPath = {};
ccls.addSaveButtonAsPath.Timeout = 0;
ccls.addSaveButtonAsPath.TimeoutMax = 4;
ccls.addSaveButtonAsPath.saveButtonId = "SaveToolbarButton";
ccls.addSaveButtonAsPath.saveButton = null;

ccls.addSaveButtonAsPath.VersionDependingValues = [
    {
        version: '0.0.0.0',
        values: {
            'buttonClasses': 'btn btn-default btn-md form-button pathPanelButton',
            'isNewInstance': function () { return G_WFELEM === '0#' }

        }
    }
    , {
        version: '2024.1.1.1',
        values: {
            'buttonClasses': 'btn btn-default btn-md form-button pathPanelButton',
            'isNewInstance': function () { return G_WFELEM === null }
        }
    }
    , {
        version: '2025.1.1.1',
        values: {
            'buttonClasses': 'webcon-ui button button--default button--medium form-button pathPanelButton',
            'isNewInstance': function () { return G_WFELEM === null }
        }
    }
];
ccls.addSaveButtonAsPath.versionValues = ccls.utils.getVersionValues(ccls.addSaveButtonAsPath.VersionDependingValues);
// Define the label of the path
switch (window.initModel.userLang.substring(0, 2)) {
    case "de":
        ccls.addSaveButtonAsPath.savePathLabel = "Speichern";
        break;
    default:
        ccls.addSaveButtonAsPath.savePathLabel = "Save";
        break;
}


ccls.addSaveButtonAsPath.createPathButton = async function (alternativeLabel) {
    // Only execute if it's not ie11 which is used in the outlook addin
    if (typeof (window.msCrypto) == "undefined") {
        // Start debugger, if debug parameter is set and dev tools are started.
        if (new URLSearchParams(document.location.search).get("debug") == 1) {
            debugger;
        }
    }

    // When the document switches from edit to view mode in "My task view" the script is executd twice
    if (document.getElementById("ccls_SavePathButton") != null) {
        return
    }

    // return, if we are not in edit mode or this is a new element.
    if (!(ccls.utils.getGlobal("G_EDITVIEW") || ccls.addSaveButtonAsPath.versionValues.isNewInstance())) {
        return;
    }

    if (typeof (alternativeLabel) == "string" && alternativeLabel.length > 0) {
        ccls.addSaveButtonAsPath.savePathLabel = alternativeLabel;
    }


    ccls.addSaveButtonAsPath.saveButton = document.getElementById(ccls.addSaveButtonAsPath.saveButtonId)
    var pathPanelRow = document.getElementsByClassName("pathPanelRow");

    // verify that the save button exists, if the button is not available after the 4th try, it was probably hidden in the form field matrix
    if (ccls.addSaveButtonAsPath.saveButton == null || pathPanelRow.length == 0) {
        if (ccls.addSaveButtonAsPath.Timeout <= ccls.addSaveButtonAsPath.TimeoutMax) {
            ccls.addSaveButtonAsPath.Timeout++;
            ccls.addSaveButtonAsPath.TimeoutId = setTimeout(function () { ccls.addSaveButtonAsPath.createPathButton(alternativeLabel); }, 333)
        }
        return;
    }

    // In case "colorize path" logic is used.
    let colorizePathClass = '';
    if (typeof (ccls.colorizePaths) !== "undefined") {
        ccls.colorizePaths.darkThemes = [
            "a24dcfc2-2b14-4de8-8af3-7952a0a2cf61",//WEBCON Dark            
            "6ec43cab-2ccf-438a-b0be-54388d7b43be",//CC Dark 

        ];

        colorizePathClass = ccls.colorizePaths.darkThemes.indexOf(window.initModel.userTheme) > -1 ? 'ccls_bluePathButtonDarkTheme' : 'ccls_bluePathButtonLightTheme'
    }
    // creating a dummy element and insert the default html code for a path button
    // the only changes to the default html is the label and the MoveToNextStep function 
    var savePathButton = document.createElement('div');
    savePathButton.innerHTML = `<div class="path-button-container"><button id="ccls_SavePathButton" type="button" class="${colorizePathClass} ${ccls.addSaveButtonAsPath.versionValues.buttonClasses}" value="${ccls.addSaveButtonAsPath.savePathLabel}" onClick="document.getElementById(ccls.addSaveButtonAsPath.saveButtonId).click();" style="">  <div class="form-button__title">${ccls.addSaveButtonAsPath.savePathLabel}</div> </button></div>`;

    if (pathPanelRow == null || pathPanelRow.length != 1) {
        console.log("Can not add save path button, path panel row was not found.");
        return;
    }

    var savePathButtonPosition = 0

    // insert the save 'path' button
    if (savePathButtonPosition >= pathPanelRow[0].children.length) {
        pathPanelRow[0].appendChild(savePathButton.firstChild);
    } else {
        pathPanelRow[0].insertBefore(savePathButton.firstChild, pathPanelRow[0].children[savePathButtonPosition]);
    }
}



//ccls.addSaveButtonAsPath.createPathButton('ALTERNATIVELABEL');

console.log("save path button logic executed");
