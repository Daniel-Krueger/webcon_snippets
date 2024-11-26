dkr = window.dkr || {};
dkr.largeForm = {};

dkr.largeForm.activeTab = null;
dkr.largeForm.showAttachments = false;
dkr.largeForm.showBusinessEntity = false;
dkr.largeForm.setActiveTab = function () {
    /* Get the active tab id */
    let activeTabElement = document.querySelector('.tab--active');
    if (activeTabElement && activeTabElement.attributes['attribute-menu-trigger']) {
        let attributeValue = activeTabElement.attributes['attribute-menu-trigger'].value;
        let parts = attributeValue.split('_');
        if (parts.length > 1) {
            dkr.largeForm.activeTab = parts[1];
        }
    }
}
/* the attachments are not loaded yet, so we need to wait for them, 
 but we need to make sure, that they should still be displayed */
dkr.largeForm.setAttachmentVisibility = function () {
    let attempts = 0;
    const maxAttempts = 7;
    const interval = 50;

    const toggleVisibility = () => {
        let systemAttachmentsElement = document.querySelector("[id^='SEL_SystemAttachments_']");

        if (attempts >= maxAttempts) {
            clearInterval(intervalId);
        }

        if (systemAttachmentsElement) {
            systemAttachmentsElement.style.display = dkr.largeForm.showAttachments ? 'inherit' : 'none';
            clearInterval(intervalId);
        } else
            attempts++;
    };
    const intervalId = setInterval(toggleVisibility, interval);
}

dkr.largeForm.showTabContent = function (formLogic) {
    dkr.largeForm.setActiveTab();
    console.log(`Activated tab: ${dkr.largeForm.activeTab}`);
    dkr.largeForm.showBusinessEntity = false;
    dkr.largeForm.showAttachments = false;
    if (!dkr.largeForm.activeTab) {
        alert('No active tab found');
        return;
    }
    if (typeof (formLogic) === "function") { formLogic(); }
    let systemBusinessEntityElement = document.querySelector("[id^='SEL_SystemCompany_']");
    systemBusinessEntityElement.style.display = dkr.largeForm.showBusinessEntity ? 'inherit' : 'none';
    dkr.largeForm.setAttachmentVisibility();
}
dkr.largeForm.showTabContent = function (formLogic) {
    dkr.largeForm.setActiveTab();
    console.log(`Activated tab: ${dkr.largeForm.activeTab}`);
    dkr.largeForm.showBusinessEntity = false;
    dkr.largeForm.showAttachments = false;
    if (!dkr.largeForm.activeTab) {
        alert('No active tab found');
        return;
    }
    if (typeof (formLogic) === "function") { formLogic(); }
    let systemBusinessEntityElement = document.querySelector("[id^='SEL_SystemCompany_']");
    systemBusinessEntityElement.style.display = dkr.largeForm.showBusinessEntity ? 'inherit' : 'none';
    dkr.largeForm.setAttachmentVisibility();
}
dkr.largeForm.defineGroupLayout = function (columnId, width, labelsAbove) {
    let group = document.getElementById(`Group_${columnId}`);
    if (!group) {
        return
    }
    group.style.gridColumn = `span ${width}`;
    if (labelsAbove) {
        group.classList.add('group--labels-above');
        let styleElement = document.createElement('style');
        styleElement.innerHTML = `
    #Group_${columnId} .grid-template__value, 
    #Group_${columnId} .grid-template__label {
        grid-column: span 12 !important;
    }
    #Group_${columnId} .grid-template__panel{
        padding-top:0px !important;
        padding-bottom:0px!important;
    }
`;
        group.appendChild(styleElement);

    }

}

console.log('Custom tab logic loaded');