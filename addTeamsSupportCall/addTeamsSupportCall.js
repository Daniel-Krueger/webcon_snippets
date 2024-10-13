window.dkr = window.dkr || {};
dkr.teamsSupport = {};
dkr.teamsSupport.recipients = null
dkr.teamsSupport.hoverInformation = null;
dkr.teamsSupport.icon = "ms-Icon--UnknownCall" //"ms-Icon--TeamsLogo"
// Message which should be passed to teams. This value will be encoded.
dkr.teamsSupport.message = null;
// Will add the current URL to the message, even if the message is null.
dkr.teamsSupport.addUrlToMessage = true;
// If true the msteams protocol won't be used this will open a new tab in the browser.
// This will allow the user to select whether the desktop app or the web app should be used.
dkr.teamsSupport.useWebApp = false;

dkr.teamsSupport.startChat = function (users, customMessage, addUrlToMessage, useWebApp) {

  console.log(`Starting teams chat for users: '${users}'`)

  let usersParameter = encodeURIComponent(users.replaceAll(';', ','))
  //let usersParameter = users.replace(';', ',')
  let message = customMessage || "";
  if (addUrlToMessage) {
    let url = document.location.href.substring(0, document.location.href.length - document.location.search.length)
    url = url.replace('edit', '').replace('admin', '')
    message += " " + url
  }
  if (useWebApp) {
    window.open(`https://teams.microsoft.com:/l/chat/0/0?users=${usersParameter}&message=${encodeURIComponent(message)}`, "_blank")
  }
  else {
    window.open(`msteams:/l/chat/0/0?users=${usersParameter}&message=${encodeURIComponent(message)}`)
  }
}


dkr.teamsSupport.prepareTeamsSupport = function (counter, maxTries) {
  if (dkr.teamsSupport.recipients == null || dkr.teamsSupport.recipients == '') {
    return;

  }
  let rightToolbar = document.querySelector(".top-bar-toolbar-menu--placement-right");
  if (rightToolbar == null) {
    if (counter < maxTries) {
      setTimeout(() => {
        counter++;
        dkr.teamsSupport.prepareTeamsSupport(counter, maxTries);
      }, 75)

    }
    return;
  }

  let buttonHtml = `
  <div class="toolbar-button__wrapper">
    <button id="dkrTeamsSupportLink" class="webcon-button toolbar-button__wrapper--toolbar-button webcon-button--padding-medium standard-focus-visible webcon-button--icon-button no-background th-hover" aria-label="Admin" id="AdminToolbarButton" tabindex="0" type="button">
      <i class="icon ms-Icon ${dkr.teamsSupport.icon} ms-Icon--standard" aria-hidden="true" data-disabled="false">
      </i>
    </button></div>
`
  rightToolbar.insertAdjacentHTML("afterbegin", buttonHtml);
  let button = rightToolbar.querySelector("button");
  button.title = dkr.teamsSupport.hoverInformation;
  button.onclick = () => { dkr.teamsSupport.startChat(dkr.teamsSupport.recipients, dkr.teamsSupport.message, dkr.teamsSupport.addUrlToMessage, dkr.teamsSupport.useWebApp); };

}
//the last line of a script must not be a comment
console.log("Add Teams support call logic executed");
