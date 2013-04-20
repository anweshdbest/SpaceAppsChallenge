/*global requirejs,require*/

requirejs.config({
    paths : {
        Widgets : '../Cesium/Widgets'
    }
});

require(['./app', 'domReady!'], function(app) {
    "use strict";
    app();
});