/*global define*/
define(function(require) {
    "use strict";
    /*global Cesium,Leap*/

    var viewHome = require('./viewHome');
    var computeRotation = require('./computeRotation');
    var createImageryProviderViewModels = require('./createImageryProviderViewModels');

    var missionDataPromise = Cesium.loadJson(require.toUrl('../Assets/missions.json'));
    var missionIndexPromise = missionDataPromise.then(function(data) {
        var index = {};
        for ( var i = 0, len = data.length; i < len; ++i) {
            var datum = data[i];
            index[datum.ID] = datum;
        }
        return index;
    });

    return function() {
        var widget = new Cesium.CesiumWidget('cesiumContainer');
        widget._isDestroyed = true;
        var centralBody = widget.centralBody;

        var terrainProvider = new Cesium.CesiumTerrainProvider({
            url : 'http://cesium.agi.com/smallterrain'
        });

        centralBody.terrainProvider = terrainProvider;

        var ellipsoid = centralBody.getEllipsoid();

        centralBody.logoOffset = new Cesium.Cartesian2(370, 26);

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
            cancelViewFromTo();
            viewHome(scene, transitioner, canvas, ellipsoid, camera3D);
        });

        var imageryLayers = centralBody.getImageryLayers();
        var imageryProviderViewModels = createImageryProviderViewModels();
        var baseLayerPicker = new Cesium.BaseLayerPicker('baseLayerPickerContainer', imageryLayers, imageryProviderViewModels);
        baseLayerPicker.viewModel.selectedItem(imageryProviderViewModels[0]);

        var photoObjectCollection = new Cesium.DynamicObjectCollection();
        var photoVisualizers = new Cesium.VisualizerCollection([new Cesium.DynamicPolygonBatchVisualizer(scene)], photoObjectCollection);

        var selectedPhotoPolygon = new Cesium.Polygon();
        selectedPhotoPolygon.material = new Cesium.Material.fromType(scene.getContext(), 'Image');

        var issObjectCollection = new Cesium.DynamicObjectCollection();
        var issVisualizers;

        var currentMissionName;
        function loadCzml(missionName) {
            if (currentMissionName === missionName) {
                return;
            }

            var photoUrl = require.toUrl('../Assets/CZML/' + missionName + '.czml');
            var issUrl = require.toUrl('../Assets/CZML/' + missionName + '_iss.czml');

            photoObjectCollection.clear();
            scene.getPrimitives().remove(selectedPhotoPolygon);
            issObjectCollection.clear();

            if (typeof issVisualizers !== 'undefined') {
                issVisualizers = issVisualizers.destroy();
            }

            Cesium.when.all([Cesium.loadJson(photoUrl), Cesium.loadJson(issUrl)]).then(function(czmlArray) {
                var photoCzml = czmlArray[0];
                var issCzml = czmlArray[1];

                Cesium.processCzml(photoCzml, photoObjectCollection, photoUrl);
                photoVisualizers.update(Cesium.Iso8601.MINIMUM_VALUE);

                scene.getPrimitives().add(selectedPhotoPolygon);

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

        /*
        clock.onTick.addEventListener(function(clock) {
            if (typeof viewFromTo !== 'undefined') {
                viewFromTo.update(clock.currentTime);
            }
            if (typeof issVisualizers !== 'undefined') {
                issVisualizers.update(clock.currentTime);
            }
        });
        */

        var proxy = new Cesium.DefaultProxy('/proxy/');

        function cancelViewFromTo() {
            viewFromTo = undefined;
            scene.getCamera().transform = Cesium.Matrix4.IDENTITY.clone();
        }

        function selectImage(id, extent) {
            cancelViewFromTo();
            var photoPolygon = photoObjectCollection.getObject(id);
            var positions;
            if (typeof extent === 'undefined') {
                positions = photoPolygon.vertexPositions.getValueCartographic(clock.currentTime);
                extent = createExtent(positions);
            }
            scene.getCamera().controller.viewExtent(extent, ellipsoid);

            positions = photoPolygon.vertexPositions.getValueCartesian(clock.currentTime);
            selectedPhotoPolygon.setPositions(positions, 0.0, computeRotation(positions, ellipsoid));
            selectedPhotoPolygon.show = true;

            missionIndexPromise.then(function(missionData) {
                var imageUrl = missionData[id].ImageUrl;
                imageUrl = Number(imageUrl) + 3;
                imageUrl = 'http://images.earthkam.ucsd.edu/main.php?g2_view=core.DownloadItem&g2_itemId=' + imageUrl;
                imageUrl = proxy.getURL(imageUrl);
                selectedPhotoPolygon.material.uniforms.image = imageUrl;
            });
        }

        function createExtent(positions) {
            var minLon = -Math.PI;
            var maxLon = Math.PI;
            var minLat = -Cesium.Math.PI_OVER_TWO;
            var maxLat = Cesium.Math.PI_OVER_TWO;
            for ( var i = 0; i < positions.length; i++) {
                var position = positions[i];
                minLon = Math.max(minLon, position.longitude);
                maxLon = Math.min(maxLon, position.longitude);
                minLat = Math.max(minLat, position.latitude);
                maxLat = Math.min(maxLat, position.latitude);
            }

            return new Cesium.Extent(minLon, minLat, maxLon, maxLat);
        }

        var viewFromTo;
        function pick(coordinates) {
            var pickedObject = scene.pick(coordinates);
            if (typeof pickedObject !== 'undefined') {
                var dynamicObject = pickedObject.dynamicObject;
                if (typeof dynamicObject !== 'undefined') {
                    if (dynamicObject.id === '/Application/STK/Scenario/SpaceAppsChallenge/Satellite/Iss_25544' && typeof viewFromTo === 'undefined') {
                        viewFromTo = new Cesium.DynamicObjectView(dynamicObject, scene, widget.ellipsoid);
                    }
                }

			var index = pickedObject.index;
                if (typeof index !== 'undefined') {
                    var polyObjects = photoObjectCollection.getObjects();
                    for ( var i = 0, length = polyObjects.length; i < length; i++) {
                        if (polyObjects[i]._polygonVisualizerIndex === index) {
                            selectImage(polyObjects[i].id);
                        }
                    }
                }
            }
        }

        var handler = new Cesium.ScreenSpaceEventHandler(scene.getCanvas());
        handler.setInputAction(function(movement) {
            pick(movement.position);
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        // Pipeline
        // csv to JSON
        // Resize or tile images

        // Graphics
        // Compute rotation angle
        // blend layers
        // Sample terrain to draw outline

        var firstValidFrame;
        var pickGesture = false;

        function map(value, inputMin, inputMax, outputMin, outputMax){
            var outVal = ((value - inputMin) / (inputMax - inputMin) * (outputMax - outputMin) + outputMin);
            if(outVal >  outputMax){
                outVal = outputMax;
            }
            if(outVal <  outputMin){
                outVal = outputMin;
            }
            return outVal;
        }

        Leap.loop({enableGestures: true}, function(frame) {
            if (widget._needResize) {
                widget.resize();
                widget._needResize = false;
            }

            var currentTime = widget.clock.tick();
            widget.scene.initializeFrame();
            var camera = scene.getCamera();

            if (frame.valid && frame.hands.length > 0) {
              if (typeof firstValidFrame === 'undefined') {
                  firstValidFrame = frame;
              }
              var translation = firstValidFrame.translation(frame);

              //assign rotation coordinates
              var rotateX = translation[0];
              var rotateY = -map(translation[1], -300, 300, 1, 179);
              var zoom = translation[2];

              var cameraRadius = camera.position.magnitude() - zoom * 100.0;

              //adjust 3D spherical coordinates of the camera
              camera.position.x = cameraRadius * Math.sin(rotateY * Math.PI/180) * Math.cos(rotateX * Math.PI/180);
              camera.position.y = cameraRadius * Math.sin(rotateY * Math.PI/180) * Math.sin(rotateX * Math.PI/180);
              camera.position.z = cameraRadius * Math.cos(rotateY * Math.PI/180);

              var gestures = frame.gestures;
              var length = frame.gestures.length;
              if (length > 0) {
                  for (var i = 0; i < length; ++i) {
                      if (gestures[i].type === 'keyTap') {
                          pickGesture = true;
                      }
                  }
              }
            }

            var p = camera.position.negate().normalize();
            var up = Cesium.Cartesian3.cross(p, Cesium.Cartesian3.UNIT_Z).cross(p);
            camera.controller.lookAt(camera.position, Cesium.Cartesian3.ZERO, up);
            widget.scene.render(currentTime);

            if (pickGesture) {
                pickGesture = false;

                var canvas = scene.getCanvas();
                var x = canvas.clientWidth * 0.5;
                var y = canvas.clientHeight * 0.5;

                pick(new Cesium.Cartesian2(x, y));
            }
          });
    };
});