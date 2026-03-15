window.dkr = window.dkr || {};
dkr.collapseItemListsGroups = {};
dkr.collapseItemListsGroups.Timeout = 0;
dkr.collapseItemListsGroups.TimeoutMax = 4;

// Helper function to handle retry logic
dkr.collapseItemListsGroups.retryExecution = function (currentIteration, maxIterations, itemListId, collapseAllGroups, hideGrandTotalSummaryRow) {
    // Set default values if parameters are not provided
    if (typeof collapseAllGroups === 'undefined') collapseAllGroups = true;
    if (typeof hideGrandTotalSummaryRow === 'undefined') hideGrandTotalSummaryRow = true;
    
    if (currentIteration <= maxIterations) {
        currentIteration++;
        setTimeout(function () {
            dkr.collapseItemListsGroups.execute(currentIteration, maxIterations, itemListId, collapseAllGroups, hideGrandTotalSummaryRow);
        }, 333);
    }
};


dkr.collapseItemListsGroups.execute = function (currentIteration, maxIterations, itemListId, collapseAllGroups, hideGrandTotalSummaryRow) {
    // Set default values if parameters are not provided
    if (typeof collapseAllGroups === 'undefined') collapseAllGroups = true;
    if (typeof hideGrandTotalSummaryRow === 'undefined') hideGrandTotalSummaryRow = true;

    // Start debugger, if debug parameter is set and dev tools are started.
    if (new URLSearchParams(document.location.search).get("debug") == 1) {
        debugger;
    }

    var table = document.querySelector(`#SubElems_${itemListId}`);
    if (!table) {
        dkr.collapseItemListsGroups.retryExecution(currentIteration, maxIterations, itemListId, collapseAllGroups, hideGrandTotalSummaryRow);
        return;
    }

    // Always apply custom styling
    dkr.collapseItemListsGroups.applyCustomStyling(table, itemListId, hideGrandTotalSummaryRow);

    // Initialize the expand/collapse all functionality
    dkr.collapseItemListsGroups.initializeExpandCollapseAll(table, collapseAllGroups);
}

dkr.collapseItemListsGroups.initializeExpandCollapseAll = function (table, collapseAllGroups) {
    var headerExpanderCell = table.querySelector('.subelem-group-expander-header');

    // Check if icon already exists to avoid duplicate initialization
    var existingIcon = headerExpanderCell.querySelector('.dkr-expand-collapse-all-icon');
    if (existingIcon) {
        return;
    }

    // Add the expand/collapse all icon to the header
    var iconContainer = headerExpanderCell.querySelector('.typography span');
    if (iconContainer) {
        iconContainer.innerHTML = '<i class="icon ms-Icon ms-Icon--ChevronUp ms-Icon--standard dkr-expand-collapse-all-icon" aria-hidden="true" data-disabled="false"></i>';

        // Add click event listener to toggle all groups
        headerExpanderCell.addEventListener('click', function () {
            dkr.collapseItemListsGroups.toggleAllGroups(table, headerExpanderCell);
        });

        // Set initial state and trigger initial collapse
        headerExpanderCell.classList.add('subelem-row__chevron');
        if (collapseAllGroups) headerExpanderCell.click();
    }
}

dkr.collapseItemListsGroups.toggleAllGroups = function (table, headerExpanderCell) {
    var groupRows = table.querySelectorAll('.subelem-row--group');

    if (!groupRows.length) return;

    // Check the current state of the header expand/collapse element
    var headerIsCollapsed = headerExpanderCell.classList.contains('subelem-row__chevron--collapsed');
    console.log("Toggling groups. Current header state isCollapsed:", headerIsCollapsed);

    if (headerIsCollapsed) {
        // Expand all collapsed groups
        dkr.collapseItemListsGroups.clickGroupsByState(groupRows, false);
        headerExpanderCell.classList.remove('subelem-row__chevron--collapsed');
    } else {
        // Collapse all expanded groups
        dkr.collapseItemListsGroups.clickGroupsByState(groupRows, true);
        headerExpanderCell.classList.add('subelem-row__chevron--collapsed');
    }
}

// Helper function to click group chevron icons based on state
dkr.collapseItemListsGroups.clickGroupsByState = function (groupRows, shouldBeCollapsed) {
    groupRows.forEach(function (row) {
        var chevronCell = row.querySelector('.subelem-row__chevron');
        if (!chevronCell) return;

        var isCurrentlyCollapsed = chevronCell.classList.contains('subelem-row__chevron--collapsed');
        var needsAction = shouldBeCollapsed ? !isCurrentlyCollapsed : isCurrentlyCollapsed;

        if (needsAction) {
            var chevronIcon = chevronCell.querySelector('i');
            if (chevronIcon) {
                chevronIcon.click();
            }
        }
    });
};

dkr.collapseItemListsGroups.applyCustomStyling = function (table, itemListId, hideGrandTotalSummaryRow) {
    // Create a style element and attach it to the table
    var existingStyle = table.querySelector('.dkr-custom-styling');
    if (existingStyle) {
        return; // Style already applied
    }

    var styleElement = document.createElement('style');
    styleElement.classList.add('dkr-custom-styling');
    
    var styleContent = '';
    
    // Only add grand total hiding styles if requested
    if (hideGrandTotalSummaryRow) {
        styleContent = `
            #SubElems_${itemListId} .subelem-summary-row--total-sum { display: none; }
        `;
    }
    
    // Always add these general styling improvements
    styleContent += `
        .dynamic-form.modern #SubElems_${itemListId} td.subelem-base-cell.subelem-cell.subelem-item-id.ordinal-cell .ordinal-cell__value { padding-top: 0px; }
        .dynamic-form.modern #SubElems_${itemListId} .subelements .subelem-summary-row--partial-sum .subelem-summary-cell .subelem-summary-cell__container { padding-bottom: 0px; }
    `;
    
    styleElement.textContent = styleContent;

    // Append the style element to the table
    table.appendChild(styleElement);
}

console.log("Collapse Item Lists Groups script loaded.");