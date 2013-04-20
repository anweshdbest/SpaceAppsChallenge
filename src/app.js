/*global define*/
define(function(require) {
    "use strict";
    /*global Cesium*/

    var viewHome = require('./viewHome');
    var createImageryProviderViewModels = require('./createImageryProviderViewModels');

    return function() {
        var widget = new Cesium.CesiumWidget('cesiumContainer');
        var centralBody = widget.centralBody;

        var terrainProvider = new Cesium.CesiumTerrainProvider({
            url : 'http://cesium.agi.com/smallterrain'
        });

        centralBody.terrainProvider = terrainProvider;

        var ellipsoid = centralBody.getEllipsoid();

        centralBody.logoOffset = new Cesium.Cartesian2(300, 26);

        var clock = widget.clock;
        clock.currentTime = Cesium.JulianDate.fromIso8601('20110725T1843Z');
        clock.startTime = clock.currentTime;
        clock.stopTime = clock.currentTime.addDays(4);
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

        var issObjectCollection = new Cesium.DynamicObjectCollection();
        var issVisualizers = new Cesium.VisualizerCollection(Cesium.CzmlDefaults.createVisualizers(scene), issObjectCollection);

        var photoObjectCollection = new Cesium.DynamicObjectCollection();
        var photoVisualizers = new Cesium.VisualizerCollection([new Cesium.DynamicPolygonBatchVisualizer(scene)], photoObjectCollection);
        function loadPhotoCzml(url) {
            photoVisualizers.removeAllPrimitives();
            photoObjectCollection.clear();

            return Cesium.loadJson(url).then(function(czml) {
                Cesium.processCzml(czml, photoObjectCollection, url);
                photoVisualizers.update(Cesium.Iso8601.MINIMUM_VALUE);
            });
        }

        function loadIssCzml(url) {
            issVisualizers.removeAllPrimitives();
            issObjectCollection.clear();

            return Cesium.loadJson(url).then(function(czml) {
                Cesium.processCzml(czml, issObjectCollection, url);
            });
        }

        function loadCzml(missonName) {
            loadPhotoCzml(require.toUrl('../Assets/CZML/' + missonName + '.czml'));
            loadIssCzml(require.toUrl('../Assets/CZML/' + missonName + '_ISS.czml'));
        }

        loadCzml('ISS11_07_image_data');

        clock.onTick.addEventListener(function(time) {
            if (typeof issVisualizers !== 'undefined') {
                issVisualizers.update(clock.currentTime);
            }
        });

        // Pipeline
        // csv to JSON
        // Resize or tile images

        // Graphics
        // Compute rotation angle
        // blend layers
        // Sample terrain to draw outline

        //scene.render();
        //var flight = Cesium.CameraFlightPath.createAnimationCartographic(scene.getFrameState(), {
        //    destination : Cesium.Cartographic.fromDegrees(-72.5926666666667, -36.679, 100000.0)
        //});
        //scene.getAnimations().add(flight);
    };
});