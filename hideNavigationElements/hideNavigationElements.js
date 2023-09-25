dkr = window.dkr || {};
dkr.global = {};
dkr.global.getIdFromUrl = function (precedingElement, url) {
    if (typeof (url) == "undefined") url = document.location.href;
    let result = url.match("\/" + precedingElement + "\/([0-9]*)");
    return result != null ? result[1] : result;
};
dkr.global.hideNavigation = {};
/*
{
    databaseId :{
        navigationRootNameClass: [Array of application ids for which it should be hidden]
    }
}
*/
dkr.global.hideNavigation.hideConfiguration = {
    "home" :{        
    },
    "1": {
        "starts": [96]
        , "dashboards": [96]
        , "views": [96]
        , "analyze": [96]
        , "forMe": [96]
        , "explore": [96]
    },
    "11": {
        "starts": [8, 24]
        , "dashboards": [8]
        , "views": [8]
        , "analyze": [8]
        , "forMe": [8]
        , "explore": [8]
    }
}
dkr.global.hideNavigation.observerConfig = {
    subtree: true,
    childList: true,
    attributes: true,
    characterData: true,
};

/// Determine whether a navigation element should be displayed or not.
dkr.global.hideNavigation.showOrHideNavigationNode = function (dbId, appId, editModeIsActive, rootName) {
    let element = dkr.global.hideNavigation.sideMenu.querySelector(`li[root-name='${rootName}']`)
    if (element == null) {
        return;
    }
    if (editModeIsActive) {
        element.style.display = "";
        return;
    }
    let shouldHide = dkr.global.hideNavigation.hideConfiguration[dbId]?.[rootName]?.find(i => (i == appId));
    element.style.display = shouldHide ? "none" : "";
}
dkr.global.hideNavigation.counter = 0;

// Watch for any changes  to the navigation
// If any is found, disconnect the observer, set the display style for the elements and reconnect.
dkr.global.hideNavigation.observer = new MutationObserver((mutationsList, observer) => {
    observer.disconnect();
    let dbId = dkr.global.getIdFromUrl("db");
    if (dbId == null) {
        dbId = "home";
    }
    let appId = dkr.global.getIdFromUrl("app");
    let editModeIsActive = document.getElementsByClassName("edit-indicator--active").length > 0;
    dkr.global.hideNavigation.showOrHideNavigationNode(dbId, appId, editModeIsActive, "starts");
    dkr.global.hideNavigation.showOrHideNavigationNode(dbId, appId, editModeIsActive, "dashboards");
    dkr.global.hideNavigation.showOrHideNavigationNode(dbId, appId, editModeIsActive, "views");
    dkr.global.hideNavigation.showOrHideNavigationNode(dbId, appId, editModeIsActive, "analyze");
    dkr.global.hideNavigation.showOrHideNavigationNode(dbId, appId, editModeIsActive, "explore");
    observer.observe(dkr.global.hideNavigation.sideMenu, dkr.global.hideNavigation.observerConfig);
});

// Attach the MutationObserver to the navigation as soon as it's available
// If it doesn't exist, exit the approach after 2 seconds.
// The side-menu also exist, if the navigation is collapsed.
dkr.global.hideNavigation.interval = setInterval(() => {
    dkr.global.hideNavigation.counter++;
    if (dkr.global.hideNavigation.counter > 100) { 
        console.log("HideNavigation hit limit of 100 consecutive calls / 2 seconds");
        clearInterval(dkr.global.hideNavigation.interval);
        return;
    }
    dkr.global.hideNavigation.sideMenu = document.getElementById('side-menu');
    if (dkr.global.hideNavigation.sideMenu != null) {
        dkr.global.hideNavigation.observer.observe(dkr.global.hideNavigation.sideMenu, dkr.global.hideNavigation.observerConfig);
        clearInterval(dkr.global.hideNavigation.interval);
    }
}, 20);
console.log("dkr.global loaded");