window.dkr = window.dkr || {};
dkr.showAllAttachments = {};
dkr.showAllAttachments.Timeout = 0;
dkr.showAllAttachments.TimeoutMax = 4;

dkr.showAllAttachments.execute = function (currentIteration, maxIterations, collapseToLevel) {

    // Start debugger, if debug parameter is set and dev tools are started.
    if (new URLSearchParams(document.location.search).get("debug") == 1) {
        debugger;
    }

    var items = document.getElementsByClassName("all-attachments-link");
    // verify that attachments are available
    if (items == null || items.length != 1) {
        if (currentIteration <= maxIterations) {
            currentIteration++;
            setTimeout(function () { dkr.showAllAttachments.execute(currentIteration, maxIterations, collapseToLevel); }, 333)
        }
        return;
    }
    items[0].click();
    if (collapseToLevel != null)
        dkr.showAllAttachments.executeCollapseFolders(0, 4, collapseToLevel)
}

dkr.showAllAttachments.executeCollapseFolders = function (currentIteration, maxIterations, collapseToLevel) {

    // Start debugger, if debug parameter is set and dev tools are started.
    if (new URLSearchParams(document.location.search).get("debug") == 1) {
        debugger;
    }
    var attachmentArea = document.querySelector("div.table-tree.all-attachments");    
    // verify that attachments are avialable
    if (attachmentArea == null || attachmentArea.length == 0) {
        if (currentIteration <= maxIterations) {
            currentIteration++;
            setTimeout(function () { dkr.showAllAttachments.executeCollapseFolders(currentIteration, maxIterations, collapseToLevel); }, 333)
        }
        return;
    }
    document.querySelectorAll(`div.table-tree-column.level-${collapseToLevel}`,attachmentArea)

    var elementsToCollapse = document.querySelectorAll(`div.table-tree-column.level-${collapseToLevel}`)
    
    elementsToCollapse.forEach((item) => { item.click() })
}
dkr.showAllAttachments.execute(0, 4, 1)
