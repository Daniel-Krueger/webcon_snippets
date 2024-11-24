window.ccls = window.ccls || {};
ccls.colorizePaths = {};
// #region colorize logic 
ccls.colorizePaths.observer = null;
ccls.colorizePaths.observerCounter = 0;
ccls.colorizePaths.webconData = "";
ccls.colorizePaths.dummyData =
    '[{"id":222,"name":"Grey","color":"default"},{"id":223,"name":"Blue","color":"#FF0093DC"},{"id":224,"name":"Red","color":"#FFDC002E"},{"id":225,"name":"orange multi en-US","color":"#FFFFA500"},{"id":226,"name":"Yellow en only","color":"#FFFFFF00"},{"id":227,"name":"Green en-GB","color":"#FF9ACD32"},{"id":228,"name":"Purple en-US","color":"#FFD1ABE5"},{"id":229,"name":"Black","color":"#FF000000"},]';

ccls.colorizePaths.setDummyData = function () { ccls.colorizePaths.webconData = ccls.colorizePaths.dummyData; }

ccls.colorizePaths.VersionDependingValues = [
    {
        version: '0.0.0.0',
        values: {
            'pathPanelQuerySelector': '.wfPathPanelCaption',
            "insertInfoIcon": function (availablePathsPanelElement, iconHtml) {
                availablePathsPanelElement.insertAdjacentHTML('afterend', iconHtml);
            }
        }
    }, {

        version: '2025.1.1.1',
        values: {
            'pathPanelQuerySelector': '#pathPanel',
            "insertInfoIcon": function (availablePathsPanelElement, iconHtml) {
                availablePathsPanelElement.children[0].children[0].insertAdjacentHTML('beforeEnd', iconHtml);
            }
        }
    }];
//#endregion

ccls.colorizePaths.versionValues = ccls.utils.getVersionValues(ccls.colorizePaths.VersionDependingValues);

ccls.colorizePaths.documentation = {
    "default": `
Black: Used by the system
Blue: will do something but it won't leave the step and you will still be responsible
Green: Positive action, will advance the workflow        
Orange: Sends the workflow back to the previous step to get more feedback
Purple: Only available for the system administrator
Red: Negative action will abort/cancel the workflow
Yellow: Workflow will be postponed/scheduled, you will get an reminder on the scheduled date
Grey: Everything else    
        `
    , "de": `
Blau: wird etwas tun, aber es wird den Schritt nicht verlassen und Sie werden immer noch verantwortlich sein
Gelb: Workflow wird verschoben/ geplant, Sie erhalten eine Erinnerung an den geplanten Termin
Grau: Alles andere
Grün: Positive Aktion, wird den Arbeitsablauf vorantreiben    
Lila: Nur für den Systemadministrator zugänglich
Orange: Schickt den Arbeitsablauf zurück zum vorherigen Schritt, um weiteres Feedback zu erhalten
Rot: Negative Aktion führt zum Abbruch des Arbeitsablaufs
Schwarz: Wird vom System verwendet
    `
    , "pl": `
Czarny: Używany przez system
Czerwony: Negatywna akcja powoduje przerwanie/anulowanie przepływu pracy
Fioletowy: Dostępne tylko dla administratora systemu
Niebieski: zrobi coś, ale nie opuści kroku i nadal będziesz odpowiedzialny
Pomarańczowy: Wysyła przepływ pracy z powrotem do poprzedniego kroku, aby uzyskać więcej informacji zwrotnych        
Szary: Wszystko inne 
Zielony: Pozytywne działanie, posunie naprzód przepływ pracy        
Żółty: Przepływ zostanie odłożony/przeprogramowany, użytkownik otrzyma przypomnienie w zaplanowanym terminie
    `
}


ccls.colorizePaths.colorize = async function (debug, retryCounter) {
    if (debug == true) debugger;
    if (typeof (retryCounter) === "undefined") retryCounter = 0;
    if (ccls.utils.basicPathInformation != "") {
        // Placing the html field in the bottom panel won't require the timeout to be executed, it's just a safety measure.
        var availablePathsElement = document.querySelector(ccls.colorizePaths.versionValues.pathPanelQuerySelector);
        if (availablePathsElement == null) {
            if (retryCounter < 10) {
                setTimeout(() => {
                    ccls.colorizePaths.colorize(debug, retryCounter + 1)
                }, 50);
            }
            return;
        }
        if (ccls.colorizePaths.observer == null) {
            ccls.colorizePaths.initMutationObserver();
        }

        // May be set if it is used in combination with the dummy data
        if (ccls.colorizePaths.webconData == '') {
            ccls.colorizePaths.webconData = ccls.utils.basicPathInformation;
        }
        let pathButtons = document.querySelectorAll(".pathPanelButton");
        for (let i = 0; i < pathButtons.length; i++) {
            let currentButton = pathButtons[i];
            if (currentButton.id == 'ccls_SavePathButton')
                continue;
            let uiPathDefinition = ccls.colorizePaths.webconData.filter(item => item.title == currentButton.value);
            if (uiPathDefinition.length != 1) {
                console.log(`Basic path information did not containt a path with a title '${currentButton.value}'; this shouldn't happen.`);
                continue;
            }
            let pathStyling = ccls.colorizePaths.buttonStyling[uiPathDefinition[0].color];
            if (pathStyling == null) {
                console.log(`No styling is defined for color '${uiPathDefinition[0].color}' which has been returned for path id '${uiPathDefinition.id}' and name '${uiPathDefinition.databaseName}'`);
                continue;
            }
            currentButton.classList.add(pathStyling.class);
        }
        if (document.getElementById("ccls_PathDescription") == null) {
            let userLanguage = window.initModel.userLang.substring(0, 2)
            let documentation = ccls.colorizePaths.documentation[userLanguage] != null ? ccls.colorizePaths.documentation[userLanguage] : ccls.colorizePaths.documentation.default;
            let html = `<i id="ccls_PathDescription" class="icon ms-Icon ms-Icon--Info ms-Icon--standard descriptionTooltipIcon" style="padding-left:5px" aria-hidden="true" data-disabled="false" title="${documentation}" ></i> `
            ccls.colorizePaths.versionValues.insertInfoIcon(availablePathsElement, html);
        }
    }
};
ccls.colorizePaths.initMutationObserver = function () {
    const targetNode = document.querySelector("#pathPanel");
    if (!targetNode) {
        console.error('Target node for MutationObserver not found');
        return;
    }
    console.log('Colorize paths MutationObserver execution count in the last second: ' + ccls.colorizePaths.observerCounter);

    const config = { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] };

    const callback = function (mutationsList, observer) {
        if (!document.contains(targetNode)) {
            observer.disconnect(); // Disconnect if the target node is removed
            console.log('Target node removed, observer disconnected');
            return;
        }

        ccls.colorizePaths.observerCounter++;
        if (ccls.colorizePaths.observerCounter > 20) {
            observer.disconnect(); // Disconnect if executed more than 20 times in 1 second
            console.warn('Observer disconnected due to excessive executions');
            return;
        }

        for (let mutation of mutationsList) {
            if (mutation.type === 'childList' || (mutation.type === 'attributes' && mutation.target.className.includes('pathPanelButton'))) {
                observer.disconnect(); // Disconnect to avoid infinite loop
                ccls.colorizePaths.colorize(false); // Re-execute the colorize function
                observer.observe(targetNode, config); // Reconnect the observer
                break;
            }
        }
    };

    // Reset the observer counter every second
    setInterval(() => {
        ccls.colorizePaths.observerCounter = 0;
    }, 1000);

    // Disconnect any existing observer
    if (ccls.colorizePaths.observer) {
        ccls.colorizePaths.observer.disconnect();
    }

    // Create a new observer
    ccls.colorizePaths.observer = new MutationObserver(callback);
    ccls.colorizePaths.observer.observe(targetNode, config);
};


// #endregion

// #region styling
/* until WEBCON BPS 2025 the colors have been saved with FF -> We need to handle both cases*/
ccls.colorizePaths.lightThemeStyles = {
    // grey path
    "default":
    {
        "class": "ccls_greyPathButtonLightTheme"
    }
    // blue path
    , "#FF0093DC": {
        "class": "ccls_bluePathButtonLightTheme"
    }, "#0093DC": {
        "class": "ccls_bluePathButtonLightTheme"
    }
    // red path
    , "#FFDC002E": {
        "class": "ccls_redPathButtonLightTheme"
    }, "#DC002E": {
        "class": "ccls_redPathButtonLightTheme"
    }
    // orange path
    , "#FFFFA500": {
        "class": "ccls_orangePathButtonLightTheme"
    }
    , "#FFA500": {
        "class": "ccls_orangePathButtonLightTheme"
    }
    // yellow path
    , "#FFFFFF00": {
        "class": "ccls_yellowPathButtonLightTheme"
    }, "#FFFF00": {
        "class": "ccls_yellowPathButtonLightTheme"
    }


    // green path
    , "#FF9ACD32": {
        "class": "ccls_greenPathButtonLightTheme"
    }
    , "#9ACD32": {
        "class": "ccls_greenPathButtonLightTheme"
    }
    // purple path
    , "#FFD1ABE5": {
        "class": "ccls_purplePathButtonLightTheme"
    }, "#D1ABE5": {
        "class": "ccls_purplePathButtonLightTheme"
    }
    // black path
    , "#FF000000": {
        "class": "ccls_blackPathButtonLightTheme"
    }, "#000000": {
        "class": "ccls_blackPathButtonLightTheme"
    }
}
ccls.colorizePaths.darkThemeStyles = {
    // grey path
    "default":
    {
        "class": "ccls_greyPathButtonDarkTheme"
    }
    // blue path
    , "#FF0093DC": {
        "class": "ccls_bluePathButtonDarkTheme"
    }, "#0093DC": {
        "class": "ccls_bluePathButtonDarkTheme"
    }
    // red path
    , "#FFDC002E": {
        "class": "ccls_redPathButtonDarkTheme"
    }, "#DC002E": {
        "class": "ccls_redPathButtonDarkTheme"
    }
    // orange path
    , "#FFFFA500": {
        "class": "ccls_orangePathButtonDarkTheme"
    }
    , "#FFA500": {
        "class": "ccls_orangePathButtonDarkTheme"
    }

    // yellow path
    , "#FFFFFF00": {
        "class": "ccls_yellowPathButtonDarkTheme"
    }, "#FFFF00": {
        "class": "ccls_yellowPathButtonDarkTheme"
    }

    // green path
    , "#FF9ACD32": {
        "class": "ccls_greenPathButtonDarkTheme"
    }, "#9ACD32": {
        "class": "ccls_greenPathButtonDarkTheme"
    }

    // purple path
    , "#FFD1ABE5": {
        "class": "ccls_purplePathButtonDarkTheme"
    }, "#D1ABE5": {
        "class": "ccls_purplePathButtonDarkTheme"
    }
    // black path
    , "#FF000000": {
        "class": "ccls_blackPathButtonDarkTheme"
    }, "#000000": {
        "class": "ccls_blackPathButtonDarkTheme"
    }
}

ccls.colorizePaths.darkThemes = [
    "a24dcfc2-2b14-4de8-8af3-7952a0a2cf61",//WEBCON Dark
    "6ec43cab-2ccf-438a-b0be-54388d7b43be",//CC Dark 

];

ccls.colorizePaths.buttonStyling = ccls.colorizePaths.darkThemes.indexOf(window.initModel.userTheme) > -1 ? ccls.colorizePaths.darkThemeStyles : ccls.colorizePaths.lightThemeStyles;
// #endregion


//the last line of a script must not be a comment
console.log("colorizePaths logic executed");