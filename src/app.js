/*global define*/
define(function(require) {
    "use strict";
    /*global Cesium*/

    return function() {
        var viewHome = require('./viewHome');
        var createImageryProviderViewModels = require('./createImageryProviderViewModels');

        var widget = new Cesium.CesiumWidget('cesiumContainer');
        var centralBody = widget.centralBody;

        var ellipsoid = centralBody.getEllipsoid();

        centralBody.logoOffset = new Cesium.Cartesian2(300, 26);

        var clock = widget.clock;
        clock.currentTime = new Cesium.JulianDate();
        clock.startTime = clock.currentTime.addDays(-5);
        clock.stopTime = clock.currentTime.addDays(5);
        clock.multiplier = 1;
        clock.clockRange = Cesium.ClockRange.LOOP_STOP;

        var clockViewModel = new Cesium.ClockViewModel(clock);

        var animationViewModel = new Cesium.AnimationViewModel(clockViewModel);

        var animationWidget = new Cesium.Animation('animationContainer', animationViewModel);

        var timelineWidget = new Cesium.Timeline('timelineContainer', clock);

        function onTimelineScrub(e) {
            clock.currentTime = e.timeJulian;
            clock.shouldAnimate = false;
        }
        timelineWidget.addEventListener('settime', onTimelineScrub, false);

        var fullscreenWidget = new Cesium.FullscreenWidget('fullscreenContainer', document.body);

        var scene = widget.scene;
        var transitioner = new Cesium.SceneTransitioner(scene);

        var sceneModePickerWidget = new Cesium.SceneModePicker('sceneModePickerContainer', transitioner);

        var camera3D = scene.getCamera().clone();
        var canvas = widget.canvas;
        var viewHomeButton = document.getElementById('viewHomeButton');
        viewHomeButton.addEventListener('click', function() {
            viewHome(scene, transitioner, canvas, ellipsoid, camera3D);
        });

        var imageryLayers = centralBody.getImageryLayers();
        var imageryProviderViewModels = createImageryProviderViewModels();
        var baseLayerPicker = new Cesium.BaseLayerPicker('baseLayerPickerContainer', imageryLayers, imageryProviderViewModels);
        baseLayerPicker.viewModel.selectedItem(imageryProviderViewModels[0]);

        var primitives = scene.getPrimitives();
        var camera = scene.getCamera();

        var dynamicObjectCollection = new Cesium.DynamicObjectCollection();
        var visualizers = new Cesium.VisualizerCollection(Cesium.CzmlDefaults.createVisualizers(scene), dynamicObjectCollection);
        function loadCzml(url) {
            return Cesium.loadJson(url).then(function(czml) {
                Cesium.processCzml(czml, dynamicObjectCollection, url);
                visualizers.update(Cesium.Iso8601.MINIMUM_VALUE);
            });
        }
        loadCzml('/Assets/all.czml');

        var terrainProvider = new Cesium.CesiumTerrainProvider({
            url : 'http://cesium.agi.com/smallterrain'
        });

        // centralBody.terrainProvider = terrainProvider;

        // Pipeline
        // csv to JSON
        // Resize or tile images

        // Graphics
        // Compute rotation angle
        // blend layers
        // Sample terrain to draw outline

        var extent = new Cesium.Extent(Cesium.Math.toRadians(-74.56466667), Cesium.Math.toRadians(-36.93666667), Cesium.Math.toRadians(-72.361), Cesium.Math.toRadians(-35.185));

        /*
         * centralBody.getImageryLayers().addImageryProvider(new
         * Cesium.SingleTileImageryProvider({ url : 'Assets/12148.jpg', extent :
         * extent }));
         */

        var polygon = new Cesium.Polygon();
        polygon.setPositions(ellipsoid.cartographicArrayToCartesianArray([Cesium.Cartographic.fromDegrees(-72.361, -36.18833333), Cesium.Cartographic.fromDegrees(-73.184, -36.93666667), Cesium.Cartographic.fromDegrees(-74.56466667, -35.92333333), Cesium.Cartographic.fromDegrees(-73.73933333, -35.185)]), 0.0, Cesium.Math.toRadians(30.0));
        polygon.material = new Cesium.Material.fromType(scene.getContext(), 'Image');
        polygon.material.uniforms.image = 'Assets/12148.jpg';
        primitives.add(polygon);

        // camera.controller.viewExtent(extent, ellipsoid);

        scene.render();
        var flight = Cesium.CameraFlightPath.createAnimationCartographic(scene.getFrameState(), {
            destination : Cesium.Cartographic.fromDegrees(-72.5926666666667, -36.679, 100000.0)
        });
        scene.getAnimations().add(flight);
    };
});