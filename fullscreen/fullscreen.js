window.dkr = window.dkr || {};
dkr.fullscreen = dkr.fullscreen || {};
switch (G_BROWSER_LANGUAGE) {
    case 'de-DE':
        dkr.fullscreen.enterFullScreenTitle = "Vollbildmodus aktivieren"
        dkr.fullscreen.exitFullScreenTitle = "Zur Standardansicht zurückkehren"
        dkr.fullscreen.exitFullScreenLabel = "Vollbildmodus verlassen"        
        break;

    default:
        dkr.fullscreen.enterFullScreenTitle = "Show in full screen"
        dkr.fullscreen.exitFullScreenTitle = "Return to standard view"
        dkr.fullscreen.exitFullScreenLabel = "Leave full screen"
        break;
}

dkr.fullscreen.exitFullScreenButtonId = "exitFullScreenButton"

/* This property is used to store various global variables required by different functions.
 * It is necessary to have a dedicated object for this purpose as the default property dkr needs to be 
 * initialized for each form. Sometimes, properties need to be saved to prevent multiple executions 
 * across workflow instances, such as adding event listeners.
*/
window.dkrSPAproperties = window.dkrSPAproperties || {};

dkr.fullscreen.onFullScreenChange = function () {
    // console.log("dkr.fullscreen.onFullScreenChange")
    var fullscreenElement =
        document.fullscreenElement ||
        document.mozFullScreenElement ||
        document.webkitFullscreenElement;
    // We are ignoring the entering because, we need to handle the event ourselves to define the element to show.
    if (!fullscreenElement) {
        setTimeout(() => {
            // console.log("Exiting full screen")
            const exitFullscreen = dkr?.fullscreen?.fullscreenExited;
            if (typeof exitFullscreen === 'function') {
                exitFullscreen();
            }
        }, 0);
    }
}
dkr.fullscreen.toggleFullscreen = function () {
    var fullscreenElement =
        document.fullscreenElement ||
        document.mozFullScreenElement ||
        document.webkitFullscreenElement;
    if (!fullscreenElement) {
        // console.log("Entering custom full screen");
        document.getElementById("centerPanel")?.requestFullscreen().then(() => {
            dkr.fullscreen.fullscreenEntered();
        });
    } else {
        document.exitFullscreen().then(() => {
            dkr.fullscreen.fullscreenExited();

        });
    }
}

dkr.fullscreen.fullscreenEntered = function () {
    const pathPanel = document.getElementById("pathPanel");
    const mainFormPage = document.getElementById("main-form-page");
    if (!mainFormPage) return;
    if (pathPanel) {
        pathPanel.style.display = 'none';
    }
    let buttonHtml = `
    <div class="toolbar-button__wrapper" style="position: fixed; top: 10px; right: 10px; z-index: 1000;">
      <button id="${dkr.fullscreen.exitFullScreenButtonId}" title="${dkr.fullscreen.exitFullScreenTitle}" onclick="dkr.fullscreen.toggleFullscreen()" class="webcon-button toolbar-button__wrapper--toolbar-button webcon-button--padding-medium standard-focus-visible webcon-button--icon-button no-background th-hover" aria-label="Admin" id="dkrExitFullScreen" tabindex="0" type="button">
    <i class="icon ms-Icon ms-Icon--BackToWindow ms-Icon--standard" aria-hidden="true" data-disabled="false">
    </i><span style="margin-left:5px">${dkr.fullscreen.exitFullScreenLabel}</span>
      </button></div>
  `
    mainFormPage.insertAdjacentHTML("beforeend", buttonHtml);
}

dkr.fullscreen.fullscreenExited = function () {
    const pathPanel = document.getElementById("pathPanel");
    const button = document.getElementById(dkr.fullscreen.exitFullScreenButtonId);
    if (button?.parentNode) {
        button.parentNode.remove();
    }
    if (pathPanel) {
        pathPanel.style.display = 'block';
    }
}

dkr.fullscreen.execute = function () {

    dkr.fullscreen.addEnterFullScreenButtonToToolbar(1, 10)
    // We don't want to add multiple events.
    if (dkrSPAproperties.fullscreenListenerAdded) {
        return;
    }

    // // Listen for F11 keypress to provide execute our custom fullscreen logic
    document.addEventListener('keyup', (event) => {
        if (event.key === 'F11') {
            event.preventDefault(); // Prevent default F11 action
            // We cannot reference the function directly here like this:
            // dkr.fullscreen.toggleFullscreen();
            // The reason for this is, that JavaScript will create a direct reference to the function
            // If the user navigates to different forms, the script will be loaded multiple times.
            // Due to this, the initial reference will be lost and it won't work any longer.
            setTimeout(() => {
                // console.log("F11 intercepted")
                const toggleFullscreen = dkr?.fullscreen?.toggleFullscreen;
                if (typeof toggleFullscreen === 'function') {
                    toggleFullscreen();
                }
            }, 0);

        }
    });

    // There still seem to be different event implementations in the browser. 
    // I was not able to intercept the fullscreenchange with edge, when he user used the hotkeys.
    // Which is the only reason why these listeners are added.
    document.addEventListener('fullscreenchange', () => {
        setTimeout(() => {
            const onFullScreenChange = dkr?.fullscreen?.onFullScreenChange;
            if (typeof onFullScreenChange === 'function') {
                onFullScreenChange();
            }
        }, 0)
    }, false);
    document.addEventListener('webkitfullscreenchange', () => {
        setTimeout(() => {
            const onFullScreenChange = dkr?.fullscreen?.onFullScreenChange;
            if (typeof onFullScreenChange === 'function') {
                onFullScreenChange();
            }
        }, 0)
    }, false);
    document.addEventListener('mozfullscreenchange', () => {
        setTimeout(() => {
            const onFullScreenChange = dkr?.fullscreen?.onFullScreenChange;
            if (typeof onFullScreenChange === 'function') {
                onFullScreenChange();
            }
        }, 0)
    }, false);
    
    dkrSPAproperties.fullscreenListenerAdded = true;
}

dkr.fullscreen.addEnterFullScreenButtonToToolbar = function (counter, maxTries) {
    let rightToolbar = document.querySelector("#formContainer .top-bar-toolbar-menu--placement-right");
    if (rightToolbar == null) {
        if (counter < maxTries) {
            setTimeout(() => {
                counter++;
                dkr.fullscreen.addEnterFullScreenButtonToToolbar(counter, maxTries);
            }, 75)

        }
        return;
    }

    let buttonHtml = `
            <div class="toolbar-button__wrapper">
                <button id="dkrFullscreen" title="${dkr.fullscreen.enterFullScreenTitle}" onclick="dkr.fullscreen.toggleFullscreen()" class="webcon-button toolbar-button__wrapper--toolbar-button webcon-button--padding-medium standard-focus-visible webcon-button--icon-button no-background th-hover" aria-label="Admin" id="dkrEnterFullScreen" tabindex="0" type="button">
                    <i class="icon ms-Icon ms-Icon--ChromeFullScreen ms-Icon--standard" aria-hidden="true" data-disabled="false">
                    </i>
                </button></div >
                    `
    rightToolbar.insertAdjacentHTML("afterbegin", buttonHtml);
}
dkr.fullscreen.execute();
console.log('Fullscreen script loaded');
