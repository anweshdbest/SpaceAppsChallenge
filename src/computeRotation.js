/*global define*/
define(['require'], function(require) {
    "use strict";
    /*global Cesium*/

    function findRotation(positions) {
        var p0 = Cesium.Cartesian3.subtract(positions[0], positions[1]);
        Cesium.Cartesian3.multiplyByScalar(p0, 0.5, p0);
        Cesium.Cartesian3.add(p0, positions[1]);

        var p1 = Cesium.Cartesian3.subtract(positions[3], positions[2]);
        Cesium.Cartesian3.multiplyByScalar(p1, 0.5, p1);
        Cesium.Cartesian3.add(p1, positions[2]);

        var p1ToP0 = Cesium.Cartesian3.subtract(p0, p1);
        var direction = Cesium.Cartesian3.normalize(p1ToP0);

        var center = Cesium.Cartesian3.add(p1, Cesium.Cartesian3.multiplyByScalar(p1ToP0, 0.5));
        Cesium.Cartesian3.normalize(center, center);

        var north = Cesium.Cartesian3.cross(center, Cesium.Cartesian3.UNIT_Z);
        Cesium.Cartesian3.cross(north, center, north);

        var angle = Math.acos(Cesium.Cartesian3.dot(north, direction));
        return angle + Cesium.Math.PI_OVER_TWO;
    }

    return findRotation;
});