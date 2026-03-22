window.dkr = window.dkr || {};
dkr.itemListActions = {};
dkr.itemListActions.Timeout = 0;
dkr.itemListActions.TimeoutMax = 4;
dkr.itemListActions.ActionButtonDefinition = [];
dkr.itemListActions.ItemListActionConfiguration = {};
dkr.itemListActions.buttonsOnClicks = {};

// Helper function to handle retry logic
dkr.itemListActions.retryExecution = function (currentIteration, maxIterations, itemListId, collapseAllGroups, hideGrandTotalSummaryRow) {
    // Set default values if parameters are not provided
    if (typeof collapseAllGroups === 'undefined') collapseAllGroups = true;
    if (typeof hideGrandTotalSummaryRow === 'undefined') hideGrandTotalSummaryRow = true;

    if (currentIteration <= maxIterations) {
        currentIteration++;
        setTimeout(function () {
            dkr.itemListActions.execute(currentIteration, maxIterations, itemListId, collapseAllGroups, hideGrandTotalSummaryRow);
        }, 333);
    }
};


dkr.itemListActions.execute = function (currentIteration, maxIterations, itemListId) {

    var table = document.querySelector(`#SubElems_${itemListId}`);
    if (!table) {
        dkr.itemListActions.retryExecution(currentIteration, maxIterations, itemListId);
        return;
    }

    dkr.itemListActions.createButtons(itemListId);
}
dkr.itemListActions.prepareButtonOnClicks = function () {
    dkr.itemListActions.buttonsOnClicks = {};

    // Loop through all item list configurations
    for (var itemListId in dkr.itemListActions.ItemListActionConfiguration) {
        var configurations = dkr.itemListActions.ItemListActionConfiguration[itemListId];

        // Check each configuration in this item list
        for (var i = 0; i < configurations.length; i++) {
            var config = configurations[i];
            var key = itemListId + '_' + i;

            // If the config has a custom onClick function, use that
            if (config.onClick && typeof config.onClick === 'function') {
                dkr.itemListActions.buttonsOnClicks[key] = config.onClick;
            }
            // If it has a menuActionId but no onClick, create InvokeMenuAction function
            else if (config.menuActionId) {
                dkr.itemListActions.buttonsOnClicks[key] = function (buttonId) {
                    return function () {
                        InvokeMenuAction(buttonId);
                    };
                }(config.menuActionId);
            }
        }
    }
}
dkr.itemListActions.hideMenuButtons = function () {
    var cssRules = [];

    // Loop through all item list configurations
    for (var itemListId in dkr.itemListActions.ItemListActionConfiguration) {
        var configurations = dkr.itemListActions.ItemListActionConfiguration[itemListId];

        // Check each configuration in this item list
        for (var i = 0; i < configurations.length; i++) {
            var config = configurations[i];

            // If hideMenuAction is true and menuActionId exists
            if (config.hideMenuAction === true && config.menuActionId) {

                // Find the corresponding action button definition
                var actionButton = dkr.itemListActions.ActionButtonDefinition.find(function (button) {
                    return button.ACB_ID === config.menuActionId;
                });

                // If found, create CSS rule to hide the button
                if (actionButton && actionButton.ActionTranslation) {
                    cssRules.push('.top-bar-header__toolbar button[data-key="' + CSS.escape(actionButton.ActionTranslation) + '"] {\n    display: none;\n}');
                }
            }
        }
    }

    // Add CSS rules to DOM if any were created
    if (cssRules.length > 0) {
        var cssContainer = document.querySelector('#dkrItemListActionCSSContainer');

        // Set the CSS content
        if (cssContainer) {
            cssContainer.textContent = cssRules.join('\n\n');
        }
        else {
            alert("You need to add a <style> element with the id 'itemListActionCSSContainer' to the form field.");
        }
    }
}
dkr.itemListActions.prepareButtonOnClicks = function () {
    dkr.itemListActions.buttonsOnClicks = {};

    // Loop through all item list configurations
    for (var itemListId in dkr.itemListActions.ItemListActionConfiguration) {
        var configurations = dkr.itemListActions.ItemListActionConfiguration[itemListId];

        // Check each configuration in this item list
        for (var i = 0; i < configurations.length; i++) {
            var config = configurations[i];
            var key = itemListId + '_' + i;

            // If the config has a custom onClick function, use that
            if (config.onClick && typeof config.onClick === 'function') {
                dkr.itemListActions.buttonsOnClicks[key] = config.onClick;
            }
            // If it has a menuActionId but no onClick, create InvokeMenuAction function
            else if (config.menuActionId) {
                dkr.itemListActions.buttonsOnClicks[key] = function (buttonId) {
                    return function () {
                        InvokeMenuAction(buttonId);
                    };
                }(config.menuActionId);
            }
        }
    }

}
dkr.itemListActions.createButtons = function (itemListId) {
    var itemListContainer = document.querySelector('#SubElems_' + itemListId + ' .panelLite');
    if (!itemListContainer) {
        return;
    }

    // Get configurations for this item list
    var configurations = dkr.itemListActions.ItemListActionConfiguration[itemListId];
    if (!configurations) {
        return;
    }

    for (let i = 0; i < configurations.length; i++) {
        var config = configurations[i];

        // Skip if not visible
        if (!config.isVisible) {
            continue;
        }

        var label = '';
        var iconClass = '';

        // If menuActionId is defined, get data from ActionButtonDefinition
        if (config.menuActionId) {
            var actionButton = dkr.itemListActions.ActionButtonDefinition.find(function (button) {
                return button.ACB_ID === config.menuActionId;
            });

            if (actionButton) {
                label = actionButton.ActionTranslation || actionButton.DefaultName || 'Unknown Action';
                iconClass = 'icon-ic_fluent_' + actionButton.ACB_Icon + '_20_regular';
            }
        }
        // Otherwise use direct properties from configuration
        else {
            label = config.label || 'Custom Action';
            iconClass = 'icon-ic_fluent_' + (config.icon || 'apps') + '_20_regular';
        }

        var onClickKey = itemListId + '_' + i;
        var html = `
            <button class="webcon-ui button-base button button--default button--rounded button--medium button--icon-text subelem-addRow"
                    type="button"
                    onclick="dkr.itemListActions.buttonsOnClicks['${onClickKey}']()">
                <span class="button__icon-animation-wrapper">
                    <i class="webcon-ui ${iconClass}" aria-hidden="true"></i>
                </span>
                <div class="webcon-ui webcon-ui-tooltip-ellipsis webcon-ui-tooltip-ellipsis--single button__content button__content--body-1-strong">${label}</div>
            </button>`;

        itemListContainer.insertAdjacentHTML('beforeend', html);
    }
}
dkr.itemListActions.init = function () {
    try {
        dkr.itemListActions.ActionButtonDefinition = JSON.parse(dkr.itemListActions.ActionButtonDefinitionString);
    } catch (error) {
        console.error('Error parsing ActionButtonDefinitionString:', error);
        dkr.itemListActions.ActionButtonDefinition = [];
    } dkr.itemListActions.prepareButtonOnClicks(); dkr.itemListActions.hideMenuButtons();
}
console.log("Item list actions loaded.");