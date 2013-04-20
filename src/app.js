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

        var photoObjectCollection = new Cesium.DynamicObjectCollection();
        var photoVisualizers = new Cesium.VisualizerCollection([new Cesium.DynamicPolygonBatchVisualizer(scene)], photoObjectCollection);

        var issObjectCollection = new Cesium.DynamicObjectCollection();
        var issVisualizers;

        var currentMissionName;
        function loadCzml(missionName) {
            if (currentMissionName === missionName) {
                return;
            }

            var photoUrl = require.toUrl('../Assets/CZML/' + missionName + '.czml');
            var issUrl = require.toUrl('../Assets/CZML/' + missionName + '_ISS.czml');

            photoObjectCollection.clear();
            issObjectCollection.clear();

            if (typeof issVisualizers !== 'undefined') {
                issVisualizers = issVisualizers.destroy();
            }

            Cesium.when.all([Cesium.loadJson(photoUrl), Cesium.loadJson(issUrl)]).then(function(czmlArray) {
                var photoCzml = czmlArray[0];
                var issCzml = czmlArray[1];

                Cesium.processCzml(photoCzml, photoObjectCollection, photoUrl);
                photoVisualizers.update(Cesium.Iso8601.MINIMUM_VALUE);

                Cesium.processCzml(issCzml, issObjectCollection, issUrl);
                issVisualizers = new Cesium.VisualizerCollection(Cesium.CzmlDefaults.createVisualizers(scene), issObjectCollection);

                var document = issObjectCollection.getObject('document');
                if (typeof document !== 'undefined' && typeof document.clock !== 'undefined') {
                    clock.startTime = document.clock.startTime;
                    clock.stopTime = document.clock.stopTime;
                    clock.clockRange = document.clock.clockRange;
                    clock.clockStep = document.clock.clockStep;
                    clock.multiplier = document.clock.multiplier;
                    clock.currentTime = document.clock.currentTime;

                    timelineWidget.zoomTo(clock.startTime, clock.stopTime);
                    clockViewModel.synchronize();
                }
            });
        }

        loadCzml('ISS13_01_image_data');

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