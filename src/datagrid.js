function refreshGrid(searchTerm){
    searchRegExp = new RegExp(searchTerm, 'i');
    var store = Ext.getCmp('dataGrid').getStore();
    store.clearFilter();
    if(searchRegExp !== '') {
        store.filter("School", searchRegExp);
    }
}

Ext.onReady(function() {
        var ISS_store= Ext.create('Ext.data.JsonStore', {
            fields: ['Time','Mission', 'School', 'ID', 'ImageURL', 'CZML'],
            data: ISS_JSON,
            sorters: [{property:'Time', direction: 'DESC'}]
        });

        var grid = Ext.create('Ext.grid.Panel', {
            xtype: 'gridpanel',
            id: 'dataGrid',
            title: 'View Data',
            collapsed: true,
            store: ISS_store,
            columns: [
                { header: 'Mission', dataIndex: 'Mission', flex: 1},
                { header: 'Time', dataIndex: 'Time', renderer: function(value){
                    var y = value.slice(0, 4) + '-' + value.slice(4, 6) + '-' + value.slice(6, 8) + ' ' + value.slice(9,11) + ':' + value.slice(11,13);
                    return y;
                }, width: 110},
                { header: 'School', dataIndex: 'School', width: 150 }
            ],
            renderTo: 'grid',
            width: 400,
            animCollapse: false,
            height: 200,
            collapsible: true,
            bbar: [{
                xtype: 'textfield',
                id: 'searchField',
                listeners: {
                    specialkey: function(field, e){
                        if (e.getKey() == e.ENTER) {
                            refreshGrid(field.value);
                        }
                    }
                }
            }, {
                xtype: 'button',
                text: 'Go',
                handler: function() {
                    var searchField = Ext.getCmp('searchField');
                    refreshGrid(searchField.value);
                }
            }]
        });
   });