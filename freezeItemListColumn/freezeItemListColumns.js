window.ccls = window.ccls || {};
ccls.freezeItemListColumns = {}
ccls.freezeItemListColumns.fallBackColor = "#f2f2f2"
ccls.freezeItemListColumns.themedFrozenColumnBackgroundColor = {
    "49a92de4-6095-4024-911a-515ae1a81e44": "#f2f2f2" // +"default
    , "860305cd-602f-42c4-9999-e1825639c59c": "#f2f2f2" // +"webcon light
    , "a24dcfc2-2b14-4de8-8af3-7952a0a2cf61": "#656565" // +"webcon dark
    , "e3ea9d4f-9370-4707-bfe6-1e59dfd0b1a4": "#f2f2f2" // +"webcon white
    , "4f0a5ab0-5956-4856-87d7-da95b681587e": "#eaeaeb" // +"cc  light theme
    , "6ec43cab-2ccf-438a-b0be-54388d7b43be": "#5f646c" // +"cc  dark theme
}


ccls.freezeItemListColumns.stylingTemplate = `
<style>
/* based on https://stackoverflow.com/questions/45071085/freeze-first-row-and-first-column-of-table */
#SubElems_ITEMLISTID table th {
  text-align: center;
  position: sticky;
  top: 0;
  z-index: 2;
}
/* Freeze header of column (x) */
#SubElems_ITEMLISTID  table th:nth-child(COLUMNNUMBER) {
  left: 0;
  z-index: 3;
}
/* Freeze row cell of column (x) */
#SubElems_ITEMLISTID table tbody tr td:nth-child(COLUMNNUMBER) {
  position: sticky;
  left: 0;
  z-index:1;
background-color: FROZENCOLUMNBACKGROUNDCOLOR
}
/* END repeat for each column wich should be freezed */
  </style>
`;

ccls.freezeItemListColumns.addFreezing = function (itemListId, column)
{
    let color = ccls.freezeItemListColumns.themedFrozenColumnBackgroundColor[initModel.userTheme]
    if (color == null) color = ccls.freezeItemListColumns.fallBackColor;
    $(document.head).append(
        ccls.freezeItemListColumns.stylingTemplate.replaceAll(
            'ITEMLISTID', itemListId
        ).replaceAll(
            'COLUMNNUMBER', column
        ).replaceAll(
            'FROZENCOLUMNBACKGROUNDCOLOR', color
        )
    );
}

//the last line of a script must not be a comment
console.log("freeze item list column logic loaded");
