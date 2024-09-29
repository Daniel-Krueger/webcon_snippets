window.dkr = window.dkr || {}
dkr.addTeamsChatToFields = {}
dkr.addTeamsChatToFields.message = null;
// Will add the current URL to the message, even if the message is null.
dkr.addTeamsChatToFields.addUrlToMessage = false;
// If true the msteams protocol won't be used this will open a new tab in the browser.
// This will allow the user to select whether the desktop app or the web app should be used.
dkr.addTeamsChatToFields.useWebApp = false;
dkr.addTeamsChatToFields.getUserUPNsBusinessRuleId = null
dkr.addTeamsChatToFields.getUserUPNsBusinessRuleParameterId = null
dkr.addTeamsChatToFields.getUserUPNsBusinessRuleName = "GetUserUPNs"
dkr.addTeamsChatToFields.userFields = []

dkr.addTeamsChatToFields.updateFields = function () {
    // We need to execute it in a timeout, in case this function is called inside a form rule which would show/hide fields.
    // In this case the fields are not yet part of the DOM and we need to try a few times.
    dkr.addTeamsChatToFields.userFields.forEach((elementId) => {
        setTimeout(dkr.addTeamsChatToFields.wrapInAnchor(elementId, 1, 4), 10)
    }
    );
}

// The max tries should only be triggered, if the field is part of a hidden tab/collapsed group.
dkr.addTeamsChatToFields.wrapInAnchor = function (elementId, counter, maxTries) {
    // Get the div by its ID
    const divElement = document.getElementById(elementId);

    if (divElement) {
        // Find the span with class 'attributeLabelDisplayName' inside the div
        const spanElement = divElement.querySelector('span.attributeLabelDisplayName');

        if (spanElement && spanElement.parentElement.className != 'dkrTeamsLink') {
            const anchor = document.createElement('a');
            anchor.className = "dkrTeamsLink"
            anchor.style.whiteSpace= "nowrap"
            anchor.onclick = (elementId) => { dkr.addTeamsChatToFields.startChat(elementId); };
            anchor.onclick = (function (id) {
                return function () {
                    dkr.addTeamsChatToFields.startChat(id);
                };
            })(elementId);
            // Replace the span with the anchor in the DOM
            spanElement.parentElement.appendChild(anchor)
            anchor.insertAdjacentHTML("afterbegin", '<i class="icon ms-Icon ms-Icon--TeamsLogo ms-Icon--small form-status-panel__icon" aria-hidden="true" data-disabled="false"></i>');
            anchor.appendChild(spanElement);
        }
    }
    else {
        if (counter <= maxTries) {
            setTimeout(() => {
                counter++;
                dkr.addTeamsChatToFields.wrapInAnchor(elementId, counter, maxTries);
            }, 10);
        }
    }
}

dkr.addTeamsChatToFields.startChat = function (currentField) {

    const fieldValue = GetPairID(GetValue(currentField));
    const parameters = {}
    parameters[dkr.addTeamsChatToFields.getUserUPNsBusinessRuleParameterId] = fieldValue;
    window.webcon.businessRules.executeBusinessRule(
        dkr.addTeamsChatToFields.getUserUPNsBusinessRuleId
        , `${dkr.addTeamsChatToFields.getUserUPNsBusinessRuleName} (ID:${dkr.addTeamsChatToFields.getUserUPNsBusinessRuleId})`
        , {}, parameters).then
        (function (result) {
            if (result.toString() != '') {
                dkr.addTeamsChatToFields.openTeamsUrl(result)

            }
        }
        );
}
dkr.addTeamsChatToFields.openTeamsUrl = function (users) {

    console.log(`Starting teams chat for users: '${users}'`)

    let usersParameter = encodeURIComponent(users.replaceAll(';', ','))
    //let usersParameter = users.replace(';', ',')
    let message = dkr.addTeamsChatToFields.message || "";
    if (dkr.addTeamsChatToFields.addUrlToMessage) {
        let url = document.location.href.substring(0, document.location.href.length - document.location.search.length)
        url = url.replace('edit','').replace('admin','')
        message += " " + url        
    }
    if (dkr.addTeamsChatToFields.useWebApp) {
        window.open(`https://teams.microsoft.com:/l/chat/0/0?users=${usersParameter}&message=${encodeURIComponent(message)}`, "_blank")
    }
    else {
        window.open(`msteams:/l/chat/0/0?users=${usersParameter}&message=${encodeURIComponent(message)}`)
    }
}

console.log("Add teams chat to fields logic has been loaded.")


