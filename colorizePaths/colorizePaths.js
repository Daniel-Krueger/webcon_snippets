window.ccls = window.ccls || {};
ccls.colorizePaths = {};
// #region colorize logic 
ccls.colorizePaths.webconData = "";
ccls.colorizePaths.dummyData =
    '[{"id":222,"name":"Grey","color":"default"},{"id":223,"name":"Blue","color":"#FF0093DC"},{"id":224,"name":"Red","color":"#FFDC002E"},{"id":225,"name":"orange multi en-US","color":"#FFFFA500"},{"id":226,"name":"Yellow en only","color":"#FFFFFF00"},{"id":227,"name":"Green en-GB","color":"#FF9ACD32"},{"id":228,"name":"Purple en-US","color":"#FFD1ABE5"},{"id":229,"name":"Black","color":"#FF000000"},]';

ccls.colorizePaths.setDummyData = function () { ccls.colorizePaths.webconData = ccls.colorizePaths.dummyData; }

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
    if (ccls.colorizePaths.webconData != "") {
        // Placing the html field in the bottom panel won't require the timeout to be executed, it's just a safety measure.
        var availablePathsElement = document.getElementsByClassName("wfPathPanelCaption");
        if (availablePathsElement.length == 0) {
            if (retryCounter < 5) {
                setTimeout(() => {
                    ccls.colorizePaths.colorize(debug, retryCounter + 1)
                }, 50);
            }
            return;
        }

        let pathInformation = JSON.parse(
            ccls.colorizePaths.webconData.replace(",]", "]")
        );

        let pathButtons = document.getElementsByClassName("pathPanelButton");
        let paths = (await ccls.utils.getLiteModel()).paths;
        for (let i = 0; i < pathButtons.length; i++) {
            let currentButton = pathButtons[i];
            if (currentButton.id == 'ccls_SavePathButton')
                continue;
            let uiPathDefinition = paths.filter(item => item.title == currentButton.value);
            if (uiPathDefinition.length != 1) {
                console.log(`initModel did not containt a path with a title '${currentButton.value}'; this shouldn't happen.`);
                continue;
            }
            let currentPathInformation = pathInformation.filter(item => item.id == uiPathDefinition[0].id);
            if (currentPathInformation.length != 1) {
                console.log(`The business rule did not return path information of path id '${uiPathDefinition.id}' and name '${uiPathDefinition.databaseName}'`);
                continue;
            }
            let pathStyling = ccls.colorizePaths.buttonStyling[currentPathInformation[0].color];
            if (pathStyling == null) {
                console.log(`No styling is defined for color '${currentPathInformation[0].color}' which has been returned for path id '${uiPathDefinition.id}' and name '${uiPathDefinition.databaseName}'`);
                continue;
            }
            currentButton.classList.add(pathStyling.class);
        }
        let userLanguage = window.initModel.userLang.substring(0, 2)
        let documentation = ccls.colorizePaths.documentation[userLanguage] != null ? ccls.colorizePaths.documentation[userLanguage] : ccls.colorizePaths.documentation.default;
        let html = `<i class="icon ms-Icon ms-Icon--Info ms-Icon--standard descriptionTooltipIcon" aria-hidden="true" data-disabled="false" title="${documentation}" ></i> `
        availablePathsElement[0].insertAdjacentHTML('afterend', html);
    }
};

// #endregion

// #region styling
ccls.colorizePaths.lightThemeStyles = {
    // grey path
    "default":
    {
        "class": "ccls_greyPathButtonLightTheme"
    }
    // blue path
    , "#FF0093DC": {
        "class": "ccls_bluePathButtonLightTheme"
    }
    // red path
    , "#FFDC002E": {
        "class": "ccls_redPathButtonLightTheme"
    }
    // orange path
    , "#FFFFA500": {
        "class": "ccls_orangePathButtonLightTheme"
    }

    // yellow path
    , "#FFFFFF00": {
        "class": "ccls_yellowPathButtonLightTheme"
    }

    // green path
    , "#FF9ACD32": {
        "class": "ccls_greenPathButtonLightTheme"
    }

    // purple path
    , "#FFD1ABE5": {
        "class": "ccls_purplePathButtonLightTheme"
    }
    // black path
    , "#FF000000": {
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
    }
    // red path
    , "#FFDC002E": {
        "class": "ccls_redPathButtonDarkTheme"
    }
    // orange path
    , "#FFFFA500": {
        "class": "ccls_orangePathButtonDarkTheme"
    }

    // yellow path
    , "#FFFFFF00": {
        "class": "ccls_yellowPathButtonDarkTheme"
    }

    // green path
    , "#FF9ACD32": {
        "class": "ccls_greenPathButtonDarkTheme"
    }

    // purple path
    , "#FFD1ABE5": {
        "class": "ccls_purplePathButtonDarkTheme"
    }
    // black path
    , "#FF000000": {
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