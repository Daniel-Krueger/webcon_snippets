window.dkr = window.dkr || {}
dkr.addTeamsChatToTasks = {}
// The number of milliseconds we wait, until the DOM changes have been applied.
dkr.addTeamsChatToTasks.DOMUpdateDelay = 50;
// The tasks which should be updated
dkr.addTeamsChatToTasks.taskList = null
// Message which should be passed to teams. This value will be encoded.
dkr.addTeamsChatToTasks.message = null;
// Will add the current URL to the message, even if the message is null.
dkr.addTeamsChatToTasks.addUrlToMessage = false;
// If true the msteams protocol won't be used this will open a new tab in the browser.
// This will allow the user to select whether the desktop app or the web app should be used.
dkr.addTeamsChatToTasks.useWebApp = false;
dkr.addTeamsChatToTasks.addTaskArrayToTaskList = function (tasksArray) {    
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
            dkr.addTeamsChatToTasks.taskList[task.taskId] = task;
        }
    });
}
dkr.addTeamsChatToTasks.createTaskList = async function () {
    if (!window.ccls || !window.ccls.utils) {
        console.warn("Common functions (utils.js) has not been loaded.");
        return;
    }

    let liteModel = await ccls.utils.getLiteModel();
    dkr.addTeamsChatToTasks.taskList = {};
    dkr.addTeamsChatToTasks.addTaskArrayToTaskList(liteModel.formInfo.tasksInfo.otherTasks.ccCoversTasks);
    dkr.addTeamsChatToTasks.addTaskArrayToTaskList(liteModel.formInfo.tasksInfo.otherTasks.ccTasks);
    dkr.addTeamsChatToTasks.addTaskArrayToTaskList(liteModel.formInfo.tasksInfo.otherTasks.directCoversTasks);
    dkr.addTeamsChatToTasks.addTaskArrayToTaskList(liteModel.formInfo.tasksInfo.otherTasks.directTasks);
    dkr.addTeamsChatToTasks.addTaskArrayToTaskList(liteModel.formInfo.tasksInfo.standardTasks.ccCoversTasks);
    dkr.addTeamsChatToTasks.addTaskArrayToTaskList(liteModel.formInfo.tasksInfo.standardTasks.ccTasks);
    dkr.addTeamsChatToTasks.addTaskArrayToTaskList(liteModel.formInfo.tasksInfo.standardTasks.directCoversTasks);
    dkr.addTeamsChatToTasks.addTaskArrayToTaskList(liteModel.formInfo.tasksInfo.standardTasks.directTasks);

}
dkr.addTeamsChatToTasks.replaceUserWithTeamsLink = async function () {
    const infoPanel = document.querySelector(".formElementInfoPanel")
    if (infoPanel != null) {
        if (dkr.addTeamsChatToTasks.taskList == null) {
            await dkr.addTeamsChatToTasks.createTaskList();
        }
        if (dkr.addTeamsChatToTasks.taskList == null) {
            return;
        }
        Object.keys(dkr.addTeamsChatToTasks.taskList).forEach(key => {
            let task = dkr.addTeamsChatToTasks.taskList[key];
            let message = dkr.addTeamsChatToTasks.message || "";
            if (dkr.addTeamsChatToFields.addUrlToMessage) {
                let url = document.location.href.substring(0, document.location.href.length - document.location.search.length)
                url = url.replace('edit','').replace('admin','')
                message += " " + url        
            }
            let taskDiv = document.querySelector(`div[data-task-id='${task.taskId}'] .form-status-panel`, infoPanel)
            taskDiv.insertAdjacentHTML("beforeEnd",
                `
                <i class="icon ms-Icon ms-Icon--TeamsLogo ms-Icon--small form-status-panel__icon" aria-hidden="true" data-disabled="false"></i>                
                <a href="${dkr.addTeamsChatToTasks.useWebApp ? "https://teams.microsoft.com" : "msteams:"}/l/chat/0/0?users=${task.userLogin}&message=${encodeURIComponent(message)}" ${dkr.addTeamsChatToTasks.useWebApp ? 'target="_blank"' :null}>
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


dkr.addTeamsChatToTasks.attachInfoButtonClick = function () {
    const infoButton = document.querySelector("button.infoBtn")
    if (infoButton) {
        infoButton.addEventListener('click', dkr.addTeamsChatToTasks.infoButtonClick);
    }
}


dkr.addTeamsChatToTasks.attachInfoPanelDetailsClick = function () {
    const storyboardIcon = document.querySelector('i.ms-Icon--Storyboard');
    if (storyboardIcon) {
        const storyboardDiv = storyboardIcon.closest('div');
        if (storyboardDiv) {
            storyboardDiv.addEventListener('click', dkr.addTeamsChatToTasks.infoPanelDetailsClick);
        }
    }
}

// Clicking on the info button adds or removes the 'Details' panel from the DOM. Therefore, we need to
// 1. Add the click event to the Details 'button' 
// 2. Update the icons 
dkr.addTeamsChatToTasks.infoButtonClick = function () {
    setTimeout(() => {
        dkr.addTeamsChatToTasks.attachInfoPanelDetailsClick();
        dkr.addTeamsChatToTasks.replaceUserWithTeamsLink();
    }, dkr.addTeamsChatToTasks.DOMUpdateDelay);
}

// If the user clicks on the 'Details' button the 'Details' have probably not been visible.
// If they are not visible, they don't exist in the DOM and we need to update the icons.
dkr.addTeamsChatToTasks.infoPanelDetailsClick = function () {
    setTimeout(dkr.addTeamsChatToTasks.replaceUserWithTeamsLink, dkr.addTeamsChatToTasks.DOMUpdateDelay)
}

dkr.addTeamsChatToTasks.init = function (formRenderingTime) {
    if (typeof (formRenderingTime) == "undefined") {
        formRenderingTime = 200;
    }

    setTimeout(() => {
        dkr.addTeamsChatToTasks.attachInfoButtonClick();
        dkr.addTeamsChatToTasks.attachInfoPanelDetailsClick();
        dkr.addTeamsChatToTasks.replaceUserWithTeamsLink();
    }, formRenderingTime);

}

console.log("Add teams chat to tasks logic has been loaded.")
