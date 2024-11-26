dkr.largeForm.showTabContent(
    () => {
        /* Start of your logic   */
        /* These variables are set to false by default. If you want to show either one, set them to true
            dkr.largeForm.showBusinessEntity = false;
            dkr.largeForm.showAttachments = false;
        */
        /* Hide every element */
        HideComment();

        /* Render only those who should be visible for the current tab  */
        if (dkr.largeForm.activeTab == '#{WFCON:1471}#') {
            dkr.largeForm.showBusinessEntity = true;
            dkr.largeForm.defineGroupLayout("#{WFCON:2493}#", 6,true);
            dkr.largeForm.defineGroupLayout("#{WFCON:2496}#", 6,true);
            dkr.largeForm.defineGroupLayout("#{WFCON:2492}#", 12);
        }
        if (dkr.largeForm.activeTab == '#{WFCON:1480}#') {
            dkr.largeForm.defineGroupLayout("#{WFCON:2494}#", 12);
            dkr.largeForm.defineGroupLayout("#{WFCON:1638}#", 6);
            dkr.largeForm.defineGroupLayout("#{WFCON:1563}#", 6);
            dkr.largeForm.defineGroupLayout("#{WFCON:1635}#", 12);
            dkr.largeForm.defineGroupLayout("#{WFCON:2495}#", 12);
            dkr.largeForm.defineGroupLayout("#{WFCON:1599}#", 6);
            dkr.largeForm.defineGroupLayout("#{WFCON:1627}#", 6);
        }
        if (dkr.largeForm.activeTab == '#{WFCON:1548}#') {
            ShowComment();
        }
        if (dkr.largeForm.activeTab == '#{WFCON:1479}#') {
            dkr.largeForm.defineGroupLayout("#{WFCON:1561}#", 12);
            dkr.largeForm.defineGroupLayout("#{WFCON:1843}#", 8,true);
            dkr.largeForm.defineGroupLayout("#{WFCON:1598}#", 4,true);
        }
        if (dkr.largeForm.activeTab == '#{WFCON:1493}#') {
            dkr.largeForm.defineGroupLayout("#{WFCON:1561}#", 12);
            dkr.largeForm.defineGroupLayout("#{WFCON:2506}#", 5);
            dkr.largeForm.defineGroupLayout("#{WFCON:2507}#", 7);
        }
        /* End of your form logic */
    });