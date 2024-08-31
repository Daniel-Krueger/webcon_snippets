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



function setPreviewToDocument(selectedAttachmentId)
    {
        let modals = document.getElementById("Modals");

        // link to preview workflow holding the documents
        // let previewProcessId = jsonContent.WFD_AttText6;
        // let updatePreviewProcessSourceUrl = "/db/1/app/22/element/" + previewProcessId + "/form/edit";
        // console.log(updatePreviewProcessSourceUrl);
        let previewDocumentUrl = "/api/nav/db/#{DBID}#/attachments/##attachmentId##/preview?hash=0&amp;isdesignerdesk=0";
        previewDocumentUrl = previewDocumentUrl.replace("##attachmentId##", selectedAttachmentId);

        console.log("preview-url:" + previewDocumentUrl);

        
        if (localStorage.getItem("WebconBPS_Impersonator") != null)
        {
            var xhr = new XMLHttpRequest();

            xhr.open('GET', previewDocumentUrl);
            xhr.onreadystatechange = function () {
                if (this.readyState === this.DONE) {
                  if (this.status === 200) {
                    // this.response is a Blob, because we set responseType above
                    var data_url = URL.createObjectURL(this.response);
                    let insertHtml = previewHTML.replace("##iframeSrc##", data_url);
                    insertHtml = insertHtml.replace("##documentName##", ccls_attachmentTitle);
                    modals.innerHTML = insertHtml;
        
                    document.getElementById("modalContent").style.visibility = "visible";
                    document.getElementById("spinner-container").style.display = "hidden";
                  } else {
                    console.error('no pdf :(');
                  }
                }
              };
              xhr.setRequestHeader("x-impersonateperson",JSON.parse(localStorage.getItem("WebconBPS_Impersonator")).login)
            xhr.responseType = 'blob';
            //xhr.setRequestHeader('Authorization', 'Bearer ' + token);
            xhr.send();            
        }
        else {
            let insertHtml = previewHTML.replace("##iframeSrc##", previewDocumentUrl);
            insertHtml = insertHtml.replace("##documentName##", ccls_attachmentTitle);
            modals.innerHTML = insertHtml;

            document.getElementById("modalContent").style.visibility = "visible";
            document.getElementById("spinner-container").style.display = "hidden";
            //let insertHtml = previewHTML.replace("##iframeSrc##", previewDocumentUrl);
            //modals.innerHTML = insertHtml;

        }
    }


    let value = GetSubValue(1606, currentRowNumberVariable, 'DET_Att7')

    if (value == null) {return }
    
    let newValue = value.split(';').filter(value => value.includes('#')).join(';');
    
    if (value != newValue) {
    
      SetSubValue(1606, currentRowNumberVariable, 'DET_Att7',newValue)
    
      console.log(`Removing invalid from row ${currentRowNumberVariable}  old value ${value} new value ${newValue}`);
    
    }