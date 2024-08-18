window.dkr = window.dkr || {}
dkr.changeUserIconForNewTasks = {}
dkr.changeUserIconForNewTasks.incompleteTaskIcon = "ms-Icon--FollowUser"
dkr.changeUserIconForNewTasks.newTaskIcon = "ms-Icon--D365TalentInsight"
// The number of milliseconds we wait, until the DOM changes have been applied.
dkr.changeUserIconForNewTasks.DOMUpdateDelay = 50;
dkr.changeUserIconForNewTasks.taskIds = []

dkr.changeUserIconForNewTasks.changeIcons = function () {
    const infoPanel = document.querySelector(".formElementInfoPanel")
    if (infoPanel != null) {
        dkr.changeUserIconForNewTasks.taskIds.forEach(element => {
            iconElement = document.querySelector(`div[data-task-id='${element}'] i`, infoPanel)
            if (iconElement != null) {
                iconElement.classList.remove(dkr.changeUserIconForNewTasks.incompleteTaskIcon)
                iconElement.classList.add(dkr.changeUserIconForNewTasks.newTaskIcon)
            }
        });
    }
}


dkr.changeUserIconForNewTasks.attachInfoButtonClick = function () {
    const infoButton = document.querySelector("button.infoBtn")
    if (infoButton) {
        infoButton.addEventListener('click', dkr.changeUserIconForNewTasks.infoButtonClick);
    }
}


dkr.changeUserIconForNewTasks.attachInfoPanelDetailsClick = function () {
    const storyboardIcon = document.querySelector('i.ms-Icon--Storyboard');
    if (storyboardIcon) {
        const storyboardDiv = storyboardIcon.closest('div');
        if (storyboardDiv) {
            storyboardDiv.addEventListener('click', dkr.changeUserIconForNewTasks.infoPanelDetailsClick);
        }
    }
}

// Clicking on the info button adds or removes the 'Details' panel from the DOM. Therefore, we need to
// 1. Add the click event to the Details 'button' 
// 2. Update the icons 
dkr.changeUserIconForNewTasks.infoButtonClick = function () {
    setTimeout(() => {
        dkr.changeUserIconForNewTasks.attachInfoPanelDetailsClick();
        dkr.changeUserIconForNewTasks.changeIcons();
    }, dkr.changeUserIconForNewTasks.DOMUpdateDelay);
}

// If the user clicks on the 'Details' button the 'Details' have probably not been visible.
// If they are not visible, they don't exist in the DOM and we need to update the icons.
dkr.changeUserIconForNewTasks.infoPanelDetailsClick = function () {
    setTimeout(dkr.changeUserIconForNewTasks.changeIcons, dkr.changeUserIconForNewTasks.DOMUpdateDelay)
}

dkr.changeUserIconForNewTasks.init = function (nonDisplayedTasks, formRenderingTime) {
    if (typeof (formRenderingTime) != "undefined") {
        formRenderingTime = 200;
    }
    if (nonDisplayedTasks.toString().length == 0)
        return;
    dkr.changeUserIconForNewTasks.taskIds = nonDisplayedTasks.split(",");
       
    setTimeout(() => {
         dkr.changeUserIconForNewTasks.attachInfoButtonClick();
        dkr.changeUserIconForNewTasks.attachInfoPanelDetailsClick();
        dkr.changeUserIconForNewTasks.changeIcons();
    }, formRenderingTime);

}

console.log("Change user icon for new tasks logic has been loaded.")
