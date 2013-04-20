function refreshGrid(searchTerm){
    searchRegExp = new RegExp(searchTerm, 'i');
    var store = Ext.getCmp('dataGrid').getStore();
    store.clearFilter();
    if(searchRegExp !== '') {
        store.filter("schools", searchRegExp);
    }
}

Ext.onReady(function() {
        var ISS_store= Ext.create('Ext.data.JsonStore', {
            fields: ['taken_utc','mission_name','schools'],
            data: ISS_JSON,
            sorters: [{property:'taken_utc', direction: 'DESC'}]
        });

        var grid = Ext.create('Ext.grid.Panel', {
            xtype: 'gridpanel',
            id: 'dataGrid',
            title: 'View Data',
            collapsed: true,
            store: ISS_store,
            columns: [
                { header: 'Mission', dataIndex: 'mission_name', flex: 1},
                { header: 'Time', dataIndex: 'taken_utc', width: 110},
                { header: 'School', dataIndex: 'schools', width: 150 }
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