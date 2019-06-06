/*! Reticulum - v2.1.2
 * http://skezo.github.io/examples/basic.html
 *
 * Copyright (c) 2015 Skezo;
 * Licensed under the MIT license */
var Reticulum = (function () {
    var INTERSECTED = null;

    var collisionList = [];
    var raycaster;
    var vector;
    var clock;
    var reticle = {};
    var fuse = {};

    var frustum;
    var cameraViewProjectionMatrix;

    var parentContainer

    var settings = {
        camera: null,
        proximity: false,
        lockDistance: false
    };

    var vibrate = navigator.vibrate ? navigator.vibrate.bind(navigator) : function () {};

    fuse.initiate = function (options) {
        var parameters = options || {};

        this.visible = parameters.visible !== false;
        this.globalDuration = parameters.duration || 2.5;
        this.vibratePattern = parameters.vibrate || 100;
        this.color = parameters.color || 0x00fff6;
        this.innerRadius = parameters.innerRadius || reticle.innerRadiusTo;
        this.outerRadius = parameters.outerRadius || reticle.outerRadiusTo;
        this.clickCancel = parameters.clickCancelFuse === undefined ? false : parameters.clickCancelFuse;
        this.phiSegments = 1;
        this.thetaSegments = 32;
        this.thetaStart = Math.PI / 2;
        this.duration = this.globalDuration;
        this.timeDone = false;
        var geometry = new THREE.RingGeometry(this.innerRadius, this.outerRadius, this.thetaSegments, this.phiSegments, this.thetaStart, 0);
        this.mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
            color: this.color,
            side: THREE.BackSide,
            fog: false
        }));
        this.mesh.visible = this.visible;

        this.mesh.position.z = 0.0001;
        this.mesh.rotation.y = 180 * (Math.PI / 180);
        parentContainer.add(this.mesh);
    };

    fuse.out = function () {
        this.active = false;
        this.mesh.visible = false;
        this.timeDone = false;
        this.update(0);
    }

    fuse.over = function (duration, visible) {
        this.duration = duration || this.globalDuration;
        this.active = true;
        this.update(0);
        this.mesh.visible = visible || this.visible;
    }

    fuse.update = function (elapsed) {
        if (!this.active || fuse.timeDone) return;

        var gazedTime = elapsed / this.duration;
        var thetaLength = gazedTime * (Math.PI * 2);
        this.mesh.geometry.dispose();
        this.mesh.geometry = new THREE.RingBufferGeometry(this.innerRadius, this.outerRadius, this.thetaSegments, this.phiSegments, this.thetaStart, thetaLength);
        if (gazedTime >= 1) {
            this.active = false;
        }
    }

    reticle.initiate = function (options) {
        var parameters = options || {};

        parameters.hover = parameters.hover || {};
        parameters.click = parameters.click || {};

        this.active = true;
        this.visible = parameters.visible !== false;
        this.restPoint = parameters.restPoint || settings.camera.far - 10.0;
        this.globalColor = parameters.color || 0xcc0000;
        this.innerRadius = parameters.innerRadius || 0.0004;
        this.outerRadius = parameters.outerRadius || 0.003;
        this.worldPosition = new THREE.Vector3();
        this.ignoreInvisible = parameters.ignoreInvisible !== false;

        this.innerRadiusTo = parameters.hover.innerRadius || 0.02;
        this.outerRadiusTo = parameters.hover.outerRadius || 0.024;
        this.globalColorTo = parameters.hover.color || this.color;
        this.vibrateHover = parameters.hover.vibrate || 50;
        this.hit = false;

        this.vibrateClick = parameters.click.vibrate || 50;
        this.speed = parameters.hover.speed || 5;
        this.moveSpeed = 0;

        this.globalColor = new THREE.Color(this.globalColor);
        this.color = this.globalColor.clone();
        this.globalColorTo = new THREE.Color(this.globalColorTo);
        this.colorTo = this.globalColorTo.clone();

        var geometry = new THREE.RingGeometry(this.innerRadius, this.outerRadius, 32, 3, 0, Math.PI * 2);
        var geometryScale = new THREE.RingGeometry(this.innerRadiusTo, this.outerRadiusTo, 32, 3, 0, Math.PI * 2);

        geometry.morphTargets.push({
            name: "target1",
            vertices: geometryScale.vertices
        });

        this.mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
            color: this.color,
            morphTargets: true,
            fog: false
        }));
        this.mesh.visible = this.visible;
        this.setDepthAndScale();
        parentContainer.add(this.mesh);
    };

    reticle.setDepthAndScale = function (depth) {
        parentContainer.position.x = 0;
        parentContainer.position.y = 0;
        parentContainer.position.z = -10;
        parentContainer.scale.set(10, 10, 10);
    };

    reticle.update = function (delta) {
        if (!this.active) return;

        var accel = delta * this.speed;
        if (this.hit) {
            this.moveSpeed += accel;
            this.moveSpeed = Math.min(this.moveSpeed, 1);
        } else {
            this.moveSpeed -= accel;
            this.moveSpeed = Math.max(this.moveSpeed, 0);
        }
        this.mesh.morphTargetInfluences[0] = this.moveSpeed;
        this.color = this.globalColor.clone();
        this.mesh.material.color = this.color.lerp(this.colorTo, this.moveSpeed);
    };

    var initiate = function (camera, options) {
        options = options || {};

        settings.camera = camera;
        settings.proximity = options.proximity || settings.proximity;
        settings.lockDistance = options.lockDistance || settings.lockDistance;
        options.reticle = options.reticle || {};
        options.fuse = options.fuse || {};

        raycaster = new THREE.Raycaster();
        vector = new THREE.Vector2(0, 0);
        if (options.near && options.near >= 0) {
            raycaster.near = options.near;
        }
        if (options.far && options.far >= 0) {
            raycaster.far = options.far;
        }

        parentContainer = new THREE.Object3D();
        settings.camera.add(parentContainer);

        if (settings.proximity) {
            frustum = new THREE.Frustum();
            cameraViewProjectionMatrix = new THREE.Matrix4();
        }

        clock = new THREE.Clock(true);
        reticle.initiate(options.reticle);
        fuse.initiate(options.fuse);
    };

    var destroy = function () {
        var INTERSECTED = null;

        var collisionList = [];
        var raycaster = null;
        var vector = null;
        var clock = null;
        var reticle = {};
        var fuse = {};

        var frustum = null;
        var cameraViewProjectionMatrix = null;

        for (var i in parentContainer.children) {
            parentContainer.remove(parentContainer.children[i]);
            if (parentContainer.children[i] instanceof THREE.Mesh) {
                parentContainer.children[i].geometry.dispose();
                parentContainer.children[i].material.dispose();
            }
        }
        settings.camera.remove(parentContainer);
    };

    var proximity = function () {
        var camera = settings.camera;
        var showReticle = false;
        camera.updateMatrixWorld();
        camera.matrixWorldInverse.getInverse(camera.matrixWorld);
        cameraViewProjectionMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        frustum.setFromMatrix(cameraViewProjectionMatrix);

        for (var i = 0, l = collisionList.length; i < l; i++) {
            var newObj = collisionList[i];
            if (!newObj.reticulumData.gazeable) {
                continue;
            }
            if (reticle.ignoreInvisible && !newObj.visible) {
                continue;
            }
            if (frustum.intersectsObject(newObj)) {
                showReticle = true;
                break;
            }
        }
        reticle.mesh.visible = showReticle;
    };

    var detectHit = function () {
        raycaster.setFromCamera(vector, settings.camera);

        var intersects = raycaster.intersectObjects(collisionList);
        var intersectsCount = intersects.length;
        if (intersectsCount) {
            var newObj;
            var point = intersects[0].point;
            for (var i = 0, l = intersectsCount; i < l; i++) {
                newObj = intersects[i].object;
                if (!newObj.reticulumData.gazeable) {
                    if (newObj == INTERSECTED) {
                        gazeOut(INTERSECTED)
                    }
                    newObj = null;
                    continue;
                }
                if (reticle.ignoreInvisible && !newObj.visible) {
                    newObj = null;
                    continue;
                }
                break;
            }
            if (newObj === null) return;
            if (INTERSECTED != newObj) {
                if (INTERSECTED) {
                    gazeOut(INTERSECTED);
                };
                INTERSECTED = newObj;
                
                gazeOver(INTERSECTED);
            } else {
                gazeLong(INTERSECTED, point);
            }
        } else {
            if (INTERSECTED) {
                gazeOut(INTERSECTED);
            }
            INTERSECTED = null;

        }
    };

    var setColor = function (threeObject, color) {
        threeObject.material.color.setHex(color);
    };

    var gazeOut = function (threeObject) {
        threeObject.userData.hitTime = 0;
        fuse.out();

        reticle.hit = false;
        reticle.setDepthAndScale();

        if (threeObject.onGazeOut != null) {
            threeObject.onGazeOut();
        }
    };

    var gazeOver = function (threeObject) {
        var threeObjectData = threeObject.reticulumData;
        reticle.colorTo = threeObjectData.reticleHoverColor || reticle.globalColorTo;
        fuse.over(threeObjectData.fuseDuration, threeObjectData.fuseVisible);
        if (threeObjectData.fuseColor) {
            setColor(fuse.mesh, threeObjectData.fuseColor);
        }
        threeObject.userData.hitTime = clock.getElapsedTime();
        vibrate(reticle.vibrateHover);
        if (threeObject.onGazeOver != null) {
            threeObject.onGazeOver();
        }
    };

    var gazeLong = function (threeObject, point) {
        var distance;
        var elapsed = clock.getElapsedTime();
        var gazeTime = elapsed - threeObject.userData.hitTime;
        if (reticle.active) {
            if (!settings.lockDistance) {
                reticle.worldPosition.setFromMatrixPosition(threeObject.matrixWorld);
                distance = settings.camera.position.distanceTo(reticle.worldPosition);
                distance -= threeObject.geometry.boundingSphere.radius;
            }
            reticle.hit = true;
            if (!settings.lockDistance) {
                reticle.setDepthAndScale(distance);
            }
        }
        if (gazeTime >= fuse.duration && !fuse.active && !fuse.timeDone) {
            fuse.timeDone = true;
            fuse.mesh.visible = false;
            vibrate(fuse.vibratePattern);
            if (threeObject.onGazeLong != null) {
                threeObject.onGazeLong(distance, point);
            }
            threeObject.userData.hitTime = elapsed;
        } else {
            fuse.update(gazeTime);
        }
    };

    return {
        add: function (threeObject, options) {
            var parameters = options || {};
            threeObject.reticulumData = {};
            threeObject.reticulumData.gazeable = true;
            threeObject.reticulumData.reticleHoverColor = null;
            if (parameters.reticleHoverColor) {
                threeObject.reticulumData.reticleHoverColor = new THREE.Color(parameters.reticleHoverColor);
            }
            threeObject.reticulumData.fuseDuration = parameters.fuseDuration || null;
            threeObject.reticulumData.fuseColor = parameters.fuseColor || null;
            threeObject.reticulumData.fuseVisible = parameters.fuseVisible === undefined ? null : parameters.fuseVisible;
            threeObject.reticulumData.clickCancelFuse = parameters.clickCancelFuse === undefined ? null : parameters.clickCancelFuse;
            threeObject.onGazeOver = parameters.onGazeOver || null;
            threeObject.onGazeOut = parameters.onGazeOut || null;
            threeObject.onGazeLong = parameters.onGazeLong || null;

            collisionList.push(threeObject);
        },
        remove: function (threeObject) {
            var index = collisionList.indexOf(threeObject);
            threeObject.reticulumData.gazeable = false;
            if (index > -1) {
                collisionList.splice(index, 1);
            }
        },
        update: function () {
            var delta = clock.getDelta();
            detectHit();
            if (settings.proximity) {
                proximity();
            }
            reticle.update(delta);
        },
        init: function (camera, options) {
            var c = camera || null;
            var o = options || {};
            if (!c instanceof THREE.Camera) {
                console.error("ERROR: Camera was not correctly defined. Unable to initiate Reticulum.");
                return;
            }
            initiate(c, o);
        },
        dispose: function () {
            destroy();
        }
    };
})();