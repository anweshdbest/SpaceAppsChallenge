    $(function () {
        var pqSearch = {
            txt: "",
            rowIndices: [],
            curIndx: null,
            colIndx: 0,
            sortIndx: null,
            sortDir:null,
            results: null,
            prevResult: function () {
                var colIndx = this.colIndx,
                    rowIndices = this.rowIndices;
                if (rowIndices.length == 0) {
                    this.curIndx = null;
                }
                else if (this.curIndx == null || this.curIndx == 0) {
                    this.curIndx = rowIndices.length - 1;
                }
                else {
                    this.curIndx--;
                }
                this.updateSelection(colIndx);
            },
            nextResult: function () {
                var rowIndices = this.rowIndices;
                if (rowIndices.length == 0) {
                    this.curIndx = null;
                }
                else if (this.curIndx == null) {
                    this.curIndx = 0;
                }
                else if (this.curIndx < rowIndices.length - 1) {
                    this.curIndx++;
                }
                else {
                    this.curIndx = 0;
                }
                this.updateSelection();
            },
            updateSelection: function () {
                var colIndx = this.colIndx,
                    curIndx = this.curIndx,
                    rowIndices = this.rowIndices;
                $grid.pqGrid("setSelection", null);
                $grid.pqGrid("setSelection", { rowIndx: rowIndices[curIndx], colIndx: colIndx });
            },
            search: function () {
                var txt = $("input.pq-search-txt").val().toUpperCase(),
                    colIndx = $("select#pq-crud-select-column").val(),
                    DM = $grid.pqGrid("option", "dataModel"),
                    sortIndx = DM.sortIndx,
                    sortDir = DM.sortDir;
                if (txt == this.txt && colIndx == this.colIndx && sortIndx == this.sortIndx && sortDir == this.sortDir) {
                    return;
                }
                this.rowIndices = [], this.curIndx = null;
                this.sortIndx = sortIndx;
                this.sortDir = sortDir;
                if (colIndx != this.colIndx) {
                    $grid.pqGrid("option", "customData", null);
                    $grid.pqGrid("refreshColumn", { colIndx: this.colIndx });
                    this.colIndx = colIndx;
                }

                if (txt != null && txt.length > 0) {
                    txt = txt.toUpperCase();

                    var data = DM.data;
                    for (var i = 0; i < data.length; i++) {
                        var row = data[i];
                        var cell = row[this.colIndx].toUpperCase();
                        if (cell.indexOf(txt) != -1) {
                            this.rowIndices.push(i);
                        }
                    }
                }
                $grid.pqGrid("option", "customData", { foundRowIndices: this.rowIndices, txt: txt, searchColIndx: colIndx });
                $grid.pqGrid("refreshColumn", { colIndx: colIndx });
                this.txt = txt;
            },
            render: function (ui) {
                rowIndx = ui.rowIndx,
                rowData=ui.rowData,
                dataIndx = ui.dataIndx,
                colIndx = ui.colIndx,
                val = rowData[dataIndx];

                if (ui.customData) {
                    var rowIndices = ui.customData.foundRowIndices,
                    searchColIndx = ui.customData.searchColIndx,
                    txt = ui.customData.txt,
                    txtUpper = txt.toUpperCase(),
                    valUpper = val.toUpperCase();
                    if ($.inArray(rowIndx, rowIndices) != -1 && colIndx == searchColIndx) {
                        var indx = valUpper.indexOf(txtUpper);
                        if (indx >= 0) {
                            var txt1 = val.substring(0, indx);
                            var txt2 = val.substring(indx, indx + txt.length);
                            var txt3 = val.substring(indx + txt.length);
                            return txt1 + "<span style='background:yellow;color:#333;'>" + txt2 + "</span>" + txt3;
                        }
                        else {
                            return val;
                        }
                    }
                }
                return val;
            }
        }
        var newObj = { width: 400, height: 200, sortIndx: 0,
            title: "ISS Data",
            selectionModel: {type:'none'},
            resizable: true
        };

        newObj.dataModel = {data:ISS_Data};
        newObj.colModel = [{title:"ID", dataType:"integer", hidden:true},
                           {title:"Time", width:100, dataType:"string"},
                           {title:"Mission", width:130, dataType:"string"},
                           {title:"School", width:130, dataType:"string"},
                           {title:"ImageUrl", dataType:"string", hidden:true},
                           {title:"CZML", dataType:"string", hidden:true}];
        $.extend(newObj.colModel[1], {render: function (ui) {
            rowData=ui.rowData,
            dataIndx = ui.dataIndx,
            colIndx = ui.colIndx,
            value = rowData[dataIndx];
            if (value.indexOf('-') === -1){
                var y = value.slice(0, 4) + '-' + value.slice(4, 6) + '-' + value.slice(6, 8) + ' ' + value.slice(9,11) + ':' + value.slice(11,13);
                ui.rowData[ui.dataIndx] = y;
            }



            return pqSearch.render(ui);
        }
        });
        $.extend(newObj.colModel[2], {render: function (ui) {
            return pqSearch.render(ui);
        }
        });
        $.extend(newObj.colModel[3], { render: function (ui) {
            return pqSearch.render(ui);
        }
        });

        $.extend(newObj.colModel[3], {
            render: function (ui) {
                var rowData = ui.rowData; ;
                if (rowData[4] < 0) {
                    return "<img src='/Content/images/arrow-us-down.gif'/>&nbsp;" + rowData[3];
                }
                else {
                    return "<img src='/Content/images/arrow-us-up.gif'/>&nbsp;" + rowData[3];
                }
            }, width: 100
        });



        //append the search toolbar in top section of grid
        $("#grid_search").on("pqgridrender", function (evt, obj) {
            var $toolbar = $("<div class='pq-grid-toolbar pq-grid-toolbar-search'></div>").appendTo($(".pq-grid-top", this));

            $("<span>Search</span>").appendTo($toolbar);

            $("<input type='text' class='pq-search-txt'/>").appendTo($toolbar).keyup(function (evt) {
                pqSearch.search();
                if (evt.keyCode == 38) {
                    pqSearch.prevResult();
                }
                else {
                    pqSearch.nextResult();
                }
            });

            $("<select id='pq-crud-select-column'>\
                <option value='1'>Mission</option>\
                <option value='3'>School</option>\
                </select>").appendTo($toolbar).change(function () {
                    pqSearch.search();
                    pqSearch.nextResult();
                });
            $("<span class='pq-separator'></span>").appendTo($toolbar);

            $("<button title='Previous Result'></button>")
                    .appendTo($toolbar)
                    .button({ icons: { primary: "ui-icon-circle-triangle-w" }, text: false }).bind("click", function (evt) {
                        pqSearch.prevResult();
                    });
            $("<button title='Next Result'></button>")
                    .appendTo($toolbar)
                    .button({ icons: { primary: "ui-icon-circle-triangle-e" }, text: false }).bind("click", function (evt) {
                        pqSearch.nextResult();
                    });
        });
        ///refresh the search after grid sort.
        $("#grid_search").on("pqgridsort", function (evt, obj) {
            pqSearch.search();
            pqSearch.nextResult();
        });

        var $grid = $("#grid_search").pqGrid(newObj);

    });