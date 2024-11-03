window.dkr = window.dkr || {}
dkr.infoPanelDetailsModification = {};


dkr.infoPanelDetailsModification.useStartTeamsChatFromTasks = false;
dkr.infoPanelDetailsModification.useNewTaskIcon = false;
//#region Common to all modifications
// The number of milliseconds we wait, until the DOM changes have been applied.
dkr.infoPanelDetailsModification.DOMUpdateDelay = 50;

dkr.infoPanelDetailsModification.attachInfoButtonClick = function () {
    const infoButton = document.querySelector("button.infoBtn")
    if (infoButton) {
        infoButton.addEventListener('click', dkr.infoPanelDetailsModification.infoButtonClick);
    }
}


dkr.infoPanelDetailsModification.attachInfoPanelDetailsClick = function () {
    const storyboardIcon = document.querySelector('i.ms-Icon--Storyboard');
    if (storyboardIcon) {
        const storyboardDiv = storyboardIcon.closest('div');
        if (storyboardDiv) {
            storyboardDiv.addEventListener('click', dkr.infoPanelDetailsModification.infoPanelDetailsClick);
        }
    }
}

// Clicking on the info button adds or removes the 'Details' panel from the DOM. Therefore, we need to
// 1. Add the click event to the Details 'button' 
// 2. Update the icons 
dkr.infoPanelDetailsModification.infoButtonClick = function () {
    setTimeout(() => {
        dkr.infoPanelDetailsModification.attachInfoPanelDetailsClick();
        dkr.infoPanelDetailsModification.executeModification();
    }, dkr.infoPanelDetailsModification.DOMUpdateDelay);
}

// If the user clicks on the 'Details' button the 'Details' have probably not been visible.
// If they are not visible, they don't exist in the DOM and we need to update the icons.
dkr.infoPanelDetailsModification.infoPanelDetailsClick = function () {
    setTimeout(dkr.infoPanelDetailsModification.executeModification, dkr.infoPanelDetailsModification.DOMUpdateDelay)
}

dkr.infoPanelDetailsModification.executeModification = function () {
    if (true == dkr.infoPanelDetailsModification.useStartTeamsChatFromTasks) {
        dkr.infoPanelDetailsModification.addTeamsChatToTasks.replaceUserWithTeamsLink();
    }
    if (true == dkr.infoPanelDetailsModification.useNewTaskIcon) {
        dkr.infoPanelDetailsModification.changeUserIconForNewTasks.changeIcons();
    }
}

dkr.infoPanelDetailsModification.init = function (formRenderingTime) {
    if (typeof (formRenderingTime) == "undefined") {
        formRenderingTime = 200;
    }

    setTimeout(() => {
        dkr.infoPanelDetailsModification.attachInfoButtonClick();
        dkr.infoPanelDetailsModification.attachInfoPanelDetailsClick();
        dkr.infoPanelDetailsModification.executeModification();
    }, formRenderingTime);

}

//#endregion

//#region Change  user icon for new tasks
dkr.infoPanelDetailsModification.changeUserIconForNewTasks = {}
dkr.infoPanelDetailsModification.changeUserIconForNewTasks.incompleteTaskIcon = "ms-Icon--FollowUser"
dkr.infoPanelDetailsModification.changeUserIconForNewTasks.newTaskIcon = "ms-Icon--D365TalentInsight"
dkr.infoPanelDetailsModification.changeUserIconForNewTasks.taskIds = []

dkr.infoPanelDetailsModification.changeUserIconForNewTasks.changeIcons = function () {
    const infoPanel = document.querySelector(".formElementInfoPanel")
    if (infoPanel != null) {
        dkr.infoPanelDetailsModification.changeUserIconForNewTasks.taskIds.forEach(element => {
            iconElement = document.querySelector(`div[data-task-id='${element}'] i`, infoPanel)
            if (iconElement != null) {
                iconElement.classList.remove(dkr.infoPanelDetailsModification.changeUserIconForNewTasks.incompleteTaskIcon)
                iconElement.classList.add(dkr.infoPanelDetailsModification.changeUserIconForNewTasks.newTaskIcon)
            }
        });
    }
}

//#endregion

//#region Add Teams Chat to Tasks
dkr.infoPanelDetailsModification.addTeamsChatToTasks = {};
// The tasks which should be updated
dkr.infoPanelDetailsModification.addTeamsChatToTasks.taskList = null
// Message which should be passed to teams. This value will be encoded.
dkr.infoPanelDetailsModification.addTeamsChatToTasks.message = null;
// Will add the current URL to the message, even if the message is null.
dkr.infoPanelDetailsModification.addTeamsChatToTasks.addUrlToMessage = false;
// If true the msteams protocol won't be used this will open a new tab in the browser.
// This will allow the user to select whether the desktop app or the web app should be used.
dkr.infoPanelDetailsModification.addTeamsChatToTasks.useWebApp = false;
dkr.infoPanelDetailsModification.addTeamsChatToTasks.addTaskArrayToTaskList = function (tasksArray) {
    /* Array content example
    "directCoversTasks": [
            {
                "description": "",
                "deskDescription": null,
                "executorLogin": null,
                "executorName": null,
                "isCcEditTask": false,
                "isCcTask": false,
                "isCoveringTask": true,
                "isCurrentUserTask": false,
                "isFinished": false,
                "taskId": 6708,
                "toGroup": false,
                "userEmail": "abc@example.com",
                "userLogin": "upn@example.com",
                "userName": "Abc UPN"
            }
        ],
    */
    tasksArray.forEach(task => {
        // taskId should be always there anyway but 
        // - we don't want to assign a teams icon to tasks which are assigned to groups
        // - or userlogin without an @ which wouldn't be a UPN required for teams.
        if (task.taskId != null && task.toGroup == false && task.userLogin.indexOf("@") > -1) {
            dkr.infoPanelDetailsModification.addTeamsChatToTasks.taskList[task.taskId] = task;
        }
    });
}
dkr.infoPanelDetailsModification.addTeamsChatToTasks.createTaskList = async function () {
    if (!window.ccls || !window.ccls.utils) {
        console.warn("Common functions (utils.js) has not been loaded.");
        return;
    }

    let liteModel = await ccls.utils.getLiteModel();
    dkr.infoPanelDetailsModification.addTeamsChatToTasks.taskList = {};
    dkr.infoPanelDetailsModification.addTeamsChatToTasks.addTaskArrayToTaskList(liteModel.formInfo.tasksInfo.otherTasks.ccCoversTasks);
    dkr.infoPanelDetailsModification.addTeamsChatToTasks.addTaskArrayToTaskList(liteModel.formInfo.tasksInfo.otherTasks.ccTasks);
    dkr.infoPanelDetailsModification.addTeamsChatToTasks.addTaskArrayToTaskList(liteModel.formInfo.tasksInfo.otherTasks.directCoversTasks);
    dkr.infoPanelDetailsModification.addTeamsChatToTasks.addTaskArrayToTaskList(liteModel.formInfo.tasksInfo.otherTasks.directTasks);
    dkr.infoPanelDetailsModification.addTeamsChatToTasks.addTaskArrayToTaskList(liteModel.formInfo.tasksInfo.standardTasks.ccCoversTasks);
    dkr.infoPanelDetailsModification.addTeamsChatToTasks.addTaskArrayToTaskList(liteModel.formInfo.tasksInfo.standardTasks.ccTasks);
    dkr.infoPanelDetailsModification.addTeamsChatToTasks.addTaskArrayToTaskList(liteModel.formInfo.tasksInfo.standardTasks.directCoversTasks);
    dkr.infoPanelDetailsModification.addTeamsChatToTasks.addTaskArrayToTaskList(liteModel.formInfo.tasksInfo.standardTasks.directTasks);

}
dkr.infoPanelDetailsModification.addTeamsChatToTasks.replaceUserWithTeamsLink = async function () {


    const infoPanel = document.querySelector(".formElementInfoPanel")
    if (infoPanel != null) {
        if (dkr.infoPanelDetailsModification.addTeamsChatToTasks.taskList == null) {
            await dkr.infoPanelDetailsModification.addTeamsChatToTasks.createTaskList();
        }
        if (dkr.infoPanelDetailsModification.addTeamsChatToTasks.taskList == null) {
            return;
        }
        Object.keys(dkr.infoPanelDetailsModification.addTeamsChatToTasks.taskList).forEach(key => {
            let task = dkr.infoPanelDetailsModification.addTeamsChatToTasks.taskList[key];
            let message = dkr.infoPanelDetailsModification.addTeamsChatToTasks.message || "";
            if (dkr.addTeamsChatToFields.addUrlToMessage) {
                let url = document.location.href.substring(0, document.location.href.length - document.location.search.length)
                url = url.replace('edit', '').replace('admin', '')
                message += " " + url
            }
            let taskDiv = document.querySelector(`div[data-task-id='${task.taskId}'] .form-status-panel`, infoPanel)
            taskDiv.insertAdjacentHTML("beforeEnd",
                `
                <i class="icon ms-Icon ms-Icon--TeamsLogo ms-Icon--small form-status-panel__icon" aria-hidden="true" data-disabled="false"></i>                
                <a href="${dkr.infoPanelDetailsModification.addTeamsChatToTasks.useWebApp ? "https://teams.microsoft.com" : "msteams:"}/l/chat/0/0?users=${task.userLogin}&message=${encodeURIComponent(message)}" ${dkr.infoPanelDetailsModification.addTeamsChatToTasks.useWebApp ? 'target="_blank"' : null}>
                </a>
                `);
            // 
            let taskSpanElement = taskDiv.querySelector("span");
            taskSpanElement.style.minWidth = "100%";
            // Move the existing span into the a element after the icon.
            taskDiv.querySelector("a").appendChild(taskSpanElement);

        });
    }


}

//#endregion

console.log("Info panel modification has been loaded.")
