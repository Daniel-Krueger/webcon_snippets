window.ccls = window.ccls || {};

ccls.utils = ccls.utils || {};

// If the user clicks fast in the task view in may happen, that the globals don't exist yet.
// This also applies when opening the preview.    
ccls.utils.getGlobal = function (variableName) {
    return new Promise(resolve => {
        if (typeof window[variableName] !== 'undefined') {
            resolve(window[variableName]);
        } else {
            const interval = setInterval(() => {
                if (typeof window[variableName] !== 'undefined') {
                    clearInterval(interval);
                    resolve(window[variableName]);
                }
            }, 20); // Check every 100ms
        }
    });    
};

if (ccls.addSaveButtonAsPath?.TimeoutId != undefined) {
    console.log("clear timeout");
    clearTimeout(ccls.addSaveButtonAsPath.TimeoutId);
}

ccls.addSaveButtonAsPath = {};
ccls.addSaveButtonAsPath.Timeout = 0;
ccls.addSaveButtonAsPath.TimeoutMax = 4;
ccls.addSaveButtonAsPath.saveButtonId = "SaveToolbarButton";
ccls.addSaveButtonAsPath.saveButton = null;

// Define the label of the path
switch (window.initModel.userLang.substring(0, 2)) {
    case "de":
        ccls.addSaveButtonAsPath.savePathLabel = "Speichern";
        break;
    default:
        ccls.addSaveButtonAsPath.savePathLabel = "Save";
        break;
}


ccls.addSaveButtonAsPath.createPathButton = async function (alternativeLabel, counter) {
    if (typeof (counter) == "undefined") {
        counter = 1
    }
    else {
        counter++;
    }
    console.log(counter)

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
    if (!(await ccls.utils.getGlobal('G_EDITVIEW')) || G_WFELEM.startsWith("0")) {
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
            ccls.addSaveButtonAsPath.TimeoutId = setTimeout(function () { ccls.addSaveButtonAsPath.createPathButton(alternativeLabel, counter); }, 333)
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
    savePathButton.innerHTML = `<div class="path-button-container"><button id="ccls_SavePathButton" type="button" class="${colorizePathClass} btn btn-default btn-md form-button pathPanelButton"value="${ccls.addSaveButtonAsPath.savePathLabel}" onClick="document.getElementById(ccls.addSaveButtonAsPath.saveButtonId).click();" style="">  <div class="form-button__title">${ccls.addSaveButtonAsPath.savePathLabel}</div> </button></div>`;

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



ccls.addSaveButtonAsPath.createPathButton(#{BRP:45}#);

console.log("save path button logic executed");