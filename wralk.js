// wralk.js
// MIT License
'use strict'

function WRALK_CONTROLLER(container, camera, speed, max_height, min_height, hit_distance) {
    this.container = container;
    this.MC = null;
    this.MOVE_FW = false;
    this.MOVE_BK = false;
    this.MOVE_LT = false;
    this.MOVE_RT = false;
    this.MOVE_DN = false;
    this.MOVE_UP = false;
    this.LOCK_MOVE_FW = false;
    this.LOCK_MOVE_BK = false;
    this.LOCK_MOVE_LT = false;
    this.LOCK_MOVE_RT = false;
    this.LOCK_MOVE_DN = false;
    this.LOCK_MOVE_UP = false;
    this.PITCH_OBJ = new THREE.Object3D();
    this.PITCH_OBJ.name = 'PITCH_OBJ';
    this.YAW_OBJ = new THREE.Object3D();
    this.YAW_OBJ.name = 'YAW_OBJ';
    this.ROTATION_MATRICES = [];
    this.COLLIDABLE_OBJS = [];
    this.SPEED = speed || 30;
    this.COLLISION = true;
    this.MAX_HEIGHT = max_height;
    this.MIN_HEIGHT = min_height;
    this.HIT_DISTANCE = hit_distance || 40;
    this.PITCH_OBJ.add(camera);
    this.YAW_OBJ.add(this.PITCH_OBJ);
    camera.rotation.set(0, 0, 0);
    this.FLOOR_PLAN_MODE = false;
    this.prepareRotationMatrices();
    this.setKeyControls();
    this.setMouseControls();
}
WRALK_CONTROLLER.prototype = {
    onKeyDown: function (e) {
        TWEEN.removeAll();
        switch (e.keyCode) {
            case 38: // up
            case 87: // w
                this.MOVE_FW = true;
                break;
            case 37: // left
            case 65: // a
                this.MOVE_LT = true;
                break;
            case 40: // down
            case 83: // s
                this.MOVE_BK = true;
                break;
            case 39: // right
            case 68: // d
                this.MOVE_RT = true;
                break;
            case 81: // q
                this.MOVE_DN = true;
                break;
            case 69: // e
                this.MOVE_UP = true;
                break;
        }
    },
    onKeyUp: function (e) {
        switch (e.keyCode) {
            case 38: // up
            case 87: // w
                this.MOVE_FW = false;
                break;
            case 37: // left
            case 65: // a
                this.MOVE_LT = false;
                break;
            case 40: // down
            case 83: // s
                this.MOVE_BK = false;
                break;
            case 39: // right
            case 68: // d
                this.MOVE_RT = false;
                break;
            case 81: // q
                this.MOVE_DN = false;
                break;
            case 69: // e
                this.MOVE_UP = false;
                break;
        }
    },
    onMouseMove: function (YAW_OBJ, PITCH_OBJ, e) {
        let movementX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
        let movementY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;
        let PI_2 = Math.PI / 2;

        YAW_OBJ.rotation.y -= movementX * 0.002;
        if (!this.FLOOR_PLAN_MODE) {
            PITCH_OBJ.rotation.x -= movementY * 0.002;
            PITCH_OBJ.rotation.x = Math.max(-PI_2, Math.min(PI_2, this.PITCH_OBJ.rotation.x));
        }
    },
    setFloorPlanMode: function (set) {
        this.FLOOR_PLAN_MODE = set;
    },
    setKeyControls: function () {
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
    },
    setMouseControls: function () {
        let self = this;
        this.MC = new Hammer(this.container[0], {
            touchAction: 'none'
        });
        this.MC.on('pan', function (e) {
            self.onMouseMove(self.YAW_OBJ, self.PITCH_OBJ, {
                movementX: e.velocityX * 25,
                movementY: e.velocityY * 25
            });
        });
        this.MC.on('tap', function (e) {
            if (e.pointerType === 'mouse') return;
            self.move('MOVE_FW', 1000);
        });
        this.container.on('mousemove', this.onMouseMove.bind(this, this.YAW_OBJ, this.PITCH_OBJ));
    },
    disposeKeyControls: function () {
        document.removeEventListener('keydown', this.onKeyDown, false);
        document.removeEventListener('keyup', this.onKeyUp, false);
    },
    disposeMouseControls: function () {
        this.MC.off('pan');
        this.MC.off('tap');
        this.container.on('mousemove');
    },
    getObject: function () {
        return this.YAW_OBJ;
    },
    getPitchObject: function () {
        return this.PITCH_OBJ;
    },
    lockDirectionByIndex: function (i) {
        if (i === 0)
            this.LOCK_MOVE_FW = true;
        else if (i === 1)
            this.LOCK_MOVE_BK = true;
        else if (i === 2)
            this.LOCK_MOVE_LT = true;
        else if (i === 3)
            this.LOCK_MOVE_RT = true;
        else if (i === 4)
            this.LOCK_MOVE_UP = true;
        else if (i === 5)
            this.LOCK_MOVE_DN = true;
    },
    unlockAllDirections: function () {
        this.LOCK_MOVE_FW = this.LOCK_MOVE_BK = this.LOCK_MOVE_LT = this.LOCK_MOVE_RT = this.LOCK_MOVE_DN = this.LOCK_MOVE_UP = false;
    },
    getDirection: function () {
        let self = this;
        let direction = new THREE.Vector3(0, 0, -1);
        let rotation = new THREE.Euler(0, 0, 0, "YXZ");
        return function (v, self, static_y_rot) {
            rotation.set(static_y_rot ? 0 : self.PITCH_OBJ.rotation.x, static_y_rot ? 0 : self.YAW_OBJ.rotation.y, 0);
            v.copy(direction).applyEuler(rotation);
            return v;
        };
    }(),
    prepareRotationMatrices: function () {
        let rotationMatrixF = new THREE.Matrix4();
        rotationMatrixF.makeRotationY(0);
        this.ROTATION_MATRICES.push(rotationMatrixF);

        let rotationMatrixB = new THREE.Matrix4();
        rotationMatrixB.makeRotationY(180 * Math.PI / 180);
        this.ROTATION_MATRICES.push(rotationMatrixB);

        let rotationMatrixL = new THREE.Matrix4();
        rotationMatrixL.makeRotationY(90 * Math.PI / 180);
        this.ROTATION_MATRICES.push(rotationMatrixL);

        let rotationMatrixR = new THREE.Matrix4();
        rotationMatrixR.makeRotationY((360 - 90) * Math.PI / 180);
        this.ROTATION_MATRICES.push(rotationMatrixR);

        let rotationMatrixU = new THREE.Matrix4();
        rotationMatrixU.makeRotationX(90 * Math.PI / 180);
        this.ROTATION_MATRICES.push(rotationMatrixU);

        let rotationMatrixD = new THREE.Matrix4();
        rotationMatrixD.makeRotationX((360 - 90) * Math.PI / 180);
        this.ROTATION_MATRICES.push(rotationMatrixD);
    },
    hitTest: function () {
        this.unlockAllDirections();
        for (let i = 0; i < 6; i++) {
            let cameraDirection = this.getDirection(new THREE.Vector3(0, 0, 0), this, (i > 3)).clone();
            let direction = cameraDirection.clone();
            direction.applyMatrix4(this.ROTATION_MATRICES[i]);
            let rayCaster = new THREE.Raycaster(this.getObject().position, direction, 0.1, 50);
            let intersects = rayCaster.intersectObjects(this.COLLIDABLE_OBJS);
            if (intersects.length > 0 && intersects[0].distance < this.HIT_DISTANCE) {
                this.lockDirectionByIndex(i);
            }
        }
    },
    isMoving: function () {
        if ((this.MOVE_FW || this.MOVE_BK || this.MOVE_LT || this.MOVE_RT || this.MOVE_DN || this.MOVE_UP) && this.COLLISION && !this.FLOOR_PLAN_MODE) {
            this.hitTest();
        }
    },
    move: function (direction, duration) {
        let self = this;
        self[direction] = true;
        setTimeout(() => {
            self[direction] = false;
        }, (duration || 1000));
    },
    update: function () {
        this.isMoving();

        if (this.MOVE_FW && !this.LOCK_MOVE_FW) {
            this.YAW_OBJ.translateZ(-this.speed);
        }
        if (this.MOVE_BK && !this.LOCK_MOVE_BK) {
            this.YAW_OBJ.translateZ(this.speed);
        }
        if (this.MOVE_LT && !this.LOCK_MOVE_LT) {
            this.YAW_OBJ.translateX(-this.speed);
        }
        if (this.MOVE_RT && !this.LOCK_MOVE_RT) {
            this.YAW_OBJ.translateX(this.speed);
        }
        if (this.MOVE_DN && !this.LOCK_MOVE_DN && this.YAW_OBJ.position.y > this.MIN_HEIGHT) {
            this.YAW_OBJ.translateY(-this.speed);
        }
        if (this.MOVE_UP && !this.LOCK_MOVE_UP && this.YAW_OBJ.position.y < this.MAX_HEIGHT) {
            this.YAW_OBJ.translateY(this.speed);
        }
    }
};

function WRALK(project_url, camera, lights, renderer, background, nav_buttons, objects) {
    this.project_url = project_url;
    this.container = $('div#wralk-scene');
    this.container.append('<div id="wralk-progressbar"><strong></strong></div>');
    this.progressbar = $(this.container.find('div#wralk-progressbar')[0]).circleProgress({
        size: 250,
        animation: false
    });
    this.config.camera = camera || this.config.camera;
    this.config.lights = lights || this.config.lights;
    this.config.background = background || null;
    this.config.renderer = renderer || this.config.renderer;
    this.window_half_size.x = this.container.width() / 2;
    this.window_half_size.y = this.container.height() / 2;
    this.manager = new THREE.LoadingManager();
    this.manager.onStart = this.onStart.bind(this, this.progressbar);
    this.manager.onProgress = this.onProgress.bind(this, this.progressbar);
    this.manager.onLoad = this.onLoad.bind(this, this.progressbar);
    this.loader = new THREE.DRACOLoader(this.manager);
    this.init();
    this.animate();

    this.setNavigateButtons(nav_buttons);
    this.setObjects(objects);
}
WRALK.prototype = {
    project_url: null,
    container: null,
    scene: null,
    renderer: null,
    camera: null,
    control: null,
    manager: null,
    loader: null,
    progressbar: null,
    supported_formats: null,
    meshes: [],
    window_half_size: {
        x: 0,
        y: 0
    },
    config: {
        renderer: null,
        camera: {
            fov: 50,
            near: 1,
            far: 100000,
            speed: 30,
            enabled: true,
            position: {
                x: 0,
                y: 0,
                z: 0
            },
            height: {
                max: 1000,
                min: 0
            }
        },
        scene: {},
        lights: [],
        background: null
    },
    CEILING_OBJS: [],
    VR_DISPLAY: null,
    WRALK_CONTROLLER: null,
    VR_CONTROLLER: null,
    VR_EFFECT: null,
    ENV_MAPS: [],
    constructor: WRALK,
    onStart: function (progressbar, url, itemsLoaded, itemsTotal) {
        progressbar.circleProgress('value', 0);
        this.container.css('background-img', 'none');
    },
    onProgress: function (progressbar, item, loaded, total) {
        let percent = Math.round(loaded / total * 100) / 100;
        progressbar.circleProgress('value', percent);
        progressbar.find('strong').html(Math.round(100 * percent) + '<i>%</i>');
    },
    onLoad: function (progressbar, url, itemsLoaded, itemsTotal) {
        THREE.DRACOLoader.releaseDecoderModule();
        progressbar.fadeOut(2000, function () {
            progressbar.remove();
        });
        this.container.find('div.wralk-menu').show();
        console.log('Loaded');
        this.setEnvMaps();
    },
    addEnvMap: function (material, config) {
        // if (config) {
        //     let urls = [];
        //     let names = ['px', 'nx', 'py', 'ny', 'pz', 'nz'];
        //     for (let i = 0; i < 6; i++) {
        //         let texture_loader = this.getLoaderBySystem(config);
        //         urls.push(texture_loader.url.replace('.ktx', '_' + names[i] + '.ktx'));
        //     }
        //     material.envMap = new THREE.KTXLoader().load(urls);
        //     material.reflectivity = config.reflectivity;
        // }
        if (config && config.position) {
            this.ENV_MAPS.push({
                material: material,
                config: config
            });
        }
    },
    setEnvMaps: function () {
        // CUBEMAPS
        for (const i in this.ENV_MAPS) {
            let env = this.ENV_MAPS[i];
            let cubemap = new THREE.CubeCamera(0.1, 20000, 768);
            cubemap.position.set(env.config.position[0], env.config.position[1], env.config.position[2]);
            if(env.config.refraction) {
                cubemap.mapping = THREE.CubeRefractionMapping;
                env.material.refractionRatio = env.config.refractionRatio || 0.98;
            }
            cubemap.update(this.renderer, this.scene);
            env.material.envMap = cubemap.renderTarget.texture;
            env.material.reflectivity = env.config.reflectivity;
        }
    },
    getMaterialByConfig: function (config, texture) {
        let self = this;
        let material = new THREE[config.type]();
        material.needsUpdate = true;
        if (config.color) {
            material.color = new THREE.Color(parseInt(config.color, 16));
        }
        if (config.emissive) {
            material.emissive = new THREE.Color(parseInt(config.emissive, 16));
        }
        if (config.side) {
            material.side = THREE[config.side];
        }
        if(config.roughness) {
            material.roughness = config.roughness;
        }
        if(config.metalness) {
            material.metalness = config.metalness;
        }
        if(config.specular) {
            material.specular = new THREE.Color(parseInt(config.specular, 16));
        }
        if(config.shininess) {
            material.shininess = config.shininess;
        }
        material.transparent = config.transparent ? config.transparent : false;
        material.alphaTest = config.alphaTest ? config.alphaTest : 0;
        material.opacity = config.opacity ? config.opacity : 1;
        material.bumpScale = config.bumpScale || 1;
        material.lightMapIntensity = config.lightMapIntensity || 1;
        material.aoMapIntensity = config.aoMapIntensity || 1;
        material.map = this.getTextureByConfig(texture.map);
        material.bumpMap = this.getTextureByConfig(texture.bumpMap);
        material.normalMap = this.getTextureByConfig(texture.normalMap);
        material.specularMap = this.getTextureByConfig(texture.specularMap);
        material.lightMap = this.getTextureByConfig(texture.lightMap);
        material.aoMap = this.getTextureByConfig(texture.aoMap);
        this.addEnvMap(material, texture.envMap);

        return material;
    },
    getLoaderBySystem: function (config) {
        if (!config || !config.url) {
            return null;
        }

        let url = config.url;
        let ext = url.split('.').pop().toLowerCase();
        let folder = 'normal';
        if (ext === 'ktx' && this.supported_formats.s3tc) {
            folder = 'dxt';
        }
        if (ext === 'ktx' && this.supported_formats.astc) {
            folder = 'astc';
        }
        if (ext === 'ktx' && this.supported_formats.etc1) {
            folder = 'etc1';
        }
        if (ext === 'ktx' && this.supported_formats.pvrtc) {
            folder = 'pvrtc';
        }

        return {
            loader: ext === 'ktx' ? 'KTXLoader' : 'TextureLoader',
            url: this.project_url.concat(url.substring(0, url.lastIndexOf('/')) + '/' + folder + url.substring(url.lastIndexOf('/'), url.length))
        };
    },
    getTextureByConfig: function (config) {
        let self = this;
        let texture_loader = this.getLoaderBySystem(config);
        let texture = texture_loader && texture_loader.url ? new THREE[texture_loader.loader](this.manager).load(texture_loader.url, function (texture) {
            if (config.repeat && config.repeat.wrapS) {
                texture.wrapS = THREE.RepeatWrapping;
            }
            if (config.repeat && config.repeat.wrapT) {
                texture.wrapT = THREE.RepeatWrapping;
            }
            if (config.repeat && config.repeat.set) {
                texture.repeat.set(config.repeat.set[0], config.repeat.set[1]);
            }
            if (config.offset && config.offset.set) {
                texture.offset.set(config.offset.set[0], config.offset.set[1]);
            }
            if (config.minFilter) {
                texture.minFilter = THREE[config.minFilter];
            }
            if (config.magFilter) {
                texture.magFilter = THREE[config.magFilter];
            }
            if (typeof config.flipY !== 'undefined') {
                texture.flipY = config.flipY || true;
            }
            texture.anisotropy = config.anisotropy ? config.anisotropy : self.renderer.capabilities.getMaxAnisotropy();
        }) : null;

        return texture;
    },
    addObjectToScene: function (mesh_config) {
        let self = this;
        let material = this.getMaterialByConfig(mesh_config.material, mesh_config.texture);
        this.loader.load(this.project_url.concat(mesh_config.mesh), function (geometry) {
            if (geometry.attributes.uv && geometry.attributes.uv.array && (mesh_config.texture.lightMap || mesh_config.texture.aoMap)) {
                geometry.addAttribute('uv2', new THREE.BufferAttribute(geometry.attributes.uv.array, 2));
            }
            let mesh = new THREE.Mesh(geometry, material);
            mesh.name = mesh_config.name;
            mesh.collidable = mesh_config.collidable || false;
            mesh.vrstep = mesh_config.vrstep || false;
            self.scene.add(mesh);
            if (mesh_config.collidable) {
                self.control.COLLIDABLE_OBJS.push(mesh);
            }
            if (mesh_config.ceiling) {
                self.CEILING_OBJS.push(mesh);
            }
        });
    },
    init: function () {
        let config = this.config;
        let wh_size = this.window_half_size;

        let self = this;
        let container = this.container;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xffffff);

        this.addLights(config.lights);
        this.addEquirectangularBg(config.background);

        this.camera = new THREE.PerspectiveCamera(config.camera.fov, (wh_size.x * 2) / (wh_size.y * 2), config.camera.near, config.camera.far);
        this.WRALK_CONTROLLER = new WRALK_CONTROLLER(container, this.camera, config.camera.speed, config.camera.height.max, config.camera.height.min, config.camera.hit_distance);
        this.control = this.WRALK_CONTROLLER;
        this.scene.add(this.control.getObject());
        this.control.getObject().position.set(config.camera.position.x, config.camera.position.y, config.camera.position.z);
        this.control.getObject().rotation.set(config.camera.rotation.x, config.camera.rotation.y, config.camera.rotation.z);
        this.control.speed = config.camera.speed;
        this.control.enabled = config.camera.enabled;

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(container.width(), container.height());
        this.renderer.toneMappingExposure = config.renderer.exposure || 1;
        this.renderer.gammaFactor = config.renderer.gammaFactor || 2;
        container.append(this.renderer.domElement);

        this.supported_formats = {
            astc: this.renderer.extensions.get('WEBGL_compressed_texture_astc'),
            etc1: this.renderer.extensions.get('WEBGL_compressed_texture_etc1'),
            s3tc: this.renderer.extensions.get('WEBGL_compressed_texture_s3tc'),
            pvrtc: this.renderer.extensions.get('WEBGL_compressed_texture_pvrtc')
        };
        console.log(JSON.stringify(this.supported_formats, null, 2));
        if (!this.supported_formats.astc && !this.supported_formats.etc1 && !this.supported_formats.s3tc && !this.supported_formats.pvrtc) {
            alert('Unsupported Platform');
        }

        container.append('<div class="wralk-menu wralk-navigator"></div>');
        container.append('<div class="wralk-menu wralk-footer"></div>');
        this.setVRController();

        window.addEventListener('resize', this.onWindowResize.bind(this, this), false);
    },
    addLights: function (lights) {
        // LIGHTS
        for (const i in lights) {
            let light = lights[i];
            let sceneLight = null;
            if (light.name === 'PointLight') {
                sceneLight = new THREE.PointLight(parseInt(light.color, 16), light.intensity, light.distance, light.decay);
                sceneLight.position.set(light.position[0], light.position[1], light.position[2]);
            } else if (light.name === 'AmbientLight') {
                sceneLight = new THREE.AmbientLight(parseInt(light.color, 16), light.intensity);
            } else if (light.name === 'SpotLight') {
                sceneLight = new THREE.SpotLight(parseInt(light.color, 16), light.intensity, light.distance, light.angle, light.prnumbra, light.decay);
                sceneLight.position.set(light.position[0], light.position[1], light.position[2]);
            } else if (light.name === 'DirectionalLight') {
                sceneLight = new THREE.PointLight(parseInt(light.color, 16), light.intensity);
                sceneLight.position.set(light.position[0], light.position[1], light.position[2]);
            } else if (light.name === 'HemisphereLight') {
                sceneLight = new THREE.HemisphereLight(parseInt(light.color, 16), parseInt(light.groundColor, 16), light.intensity);
                sceneLight.position.set(light.position[0], light.position[1], light.position[2]);
            }
            if (sceneLight) {
                this.scene.add(sceneLight);
            }
        }
    },
    addEquirectangularBg: function (background) {
        if (!background.position || !background.url) {
            return;
        }
        let geometry = new THREE.SphereBufferGeometry(background.position[0], background.position[1], background.position[2]);
        geometry.scale(-1, 1, 1);
        let material = new THREE.MeshBasicMaterial({
            map: new THREE.TextureLoader().load(this.project_url.concat(background.url))
        });
        this.scene.add(new THREE.Mesh(geometry, material));
    },
    addNavigateButton: function (caption, position, rotation, floor_plan) {
        let self = this;
        let btn = $('<button class="wralk-nvg-btn">' + caption + '</button>');
        btn.on('click', function () {
            self.control.getPitchObject().rotation.set(floor_plan ? -1.57 : 0, 0, 0);
            self.control.setFloorPlanMode(floor_plan);
            self.setCeilingVisibility(!floor_plan);
            new TWEEN.Tween(self.getCamera().getObject().position).to({
                x: position[0],
                y: position[1],
                z: position[2]
            }, 3000).easing(TWEEN.Easing.Quartic.Out).start();
            self.getCamera().getObject().rotation.set(rotation[0], rotation[1], rotation[2]);
        });
        this.container.find('div.wralk-navigator').append(btn);
    },
    setNavigateButtons: function (buttons) {
        for (const i in buttons) {
            let btn = buttons[i];
            this.addNavigateButton(btn.caption, btn.position, btn.rotation, btn.floor_plan);
        }
    },
    setObjects: function (objects) {
        for (const i in objects) {
            let obj = objects[i];
            this.addObjectToScene(obj);
        }
    },
    setCeilingVisibility: function (visible) {
        for (const i in this.CEILING_OBJS) {
            this.CEILING_OBJS[i].traverse(function (object) {
                object.visible = visible;
            });
        }
    },
    setVRController: function () {
        let self = this;
        let polyfill = new WebVRPolyfill({
            BUFFER_SCALE: 1
        });
        this.VR_CONTROLLER = new THREE.VRControls(this.camera);
        this.VR_EFFECT = new THREE.VREffect(this.renderer);
        this.VR_EFFECT.setSize(this.renderer.domElement.clientWidth, this.renderer.domElement.clientHeight, false);
        navigator.getVRDisplays().then(function (displays) {
            if (displays.length) {
                let vrbtn = $('<button class="wralk-vr-btn"></button>');
                vrbtn.on('click', function () {
                    self.VR_DISPLAY = displays[0];
                    self.VR_CONTROLLER = new THREE.VRControls(self.camera);
                    self.setVRMode(true);
                });
                self.container.find('div.wralk-footer').append(vrbtn);
                window.addEventListener('vrdisplaypresentchange', self.onVRDisplayPresentChange.bind(this, self));
            } else {
                console.log('Browser does not support WebVR');
            }
        });
        if (self.renderer.domElement.requestFullscreen || self.renderer.domElement.mozRequestFullScreen || self.renderer.domElement.webkitRequestFullscreen || self.renderer.domElement.msRequestFullscreen) {
            let fsbtn = $('<button class="wralk-fs-btn"></button>');
            fsbtn.on('click', function () {
                self.requestFullscreen(self.renderer.domElement);
            });
            self.container.find('div.wralk-footer').append(fsbtn);
        }
    },
    requestFullscreen: function (elem) {
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
    },
    onWindowResize: function (self) {
        self.window_half_size.x = self.container.width() / 2;
        self.window_half_size.y = self.container.height() / 2;

        if (!self.RESIZE_DELAY && self.VR_DISPLAY) {
            self.RESIZE_DELAY = setTimeout(function () {
                self.RESIZE_DELAY = null;
                self.VR_EFFECT.setSize(self.renderer.domElement.clientWidth, self.renderer.domElement.clientHeight, false);
                self.camera.aspect = self.container.width() / self.container.height();
                self.camera.updateProjectionMatrix();
            }, 250);
        } else {
            setTimeout(function () {
                self.camera.aspect = self.container.width() / self.container.height();
                self.camera.updateProjectionMatrix();
                self.renderer.setSize(self.container.width(), self.container.height());
            }, 250);
        }
    },
    onVRDisplayPresentChange: function (self, e) {
        if (!e.detail.display.isPresenting) {
            window.removeEventListener('vrdisplaypresentchange', self.onVRDisplayPresentChange.bind(this, self));
            self.setVRMode(false);
            return;
        }
        this.onWindowResize.bind(this, this);
    },
    getCamera: function () {
        return this.control;
    },
    setVRPaths: function () {
        let self = this;
        this.scene.traverse(function (node) {
            if (node instanceof THREE.Mesh && node.vrstep) {
                Reticulum.add(node, {
                    onGazeLong: function (distance, point) {
                        let yaw = self.camera.parent.parent;
                        yaw.position.x = point.x;
                        yaw.position.z = point.z;
                    }
                });
            }
        });
        Reticulum.init(this.camera, {
            proximity: true
        });
    },
    setVRMode: function (set) {
        this.container.find('div.wralk-menu').toggle(!set);
        this.control = set ? this.VR_CONTROLLER : this.WRALK_CONTROLLER;
        if (set) {
            this.WRALK_CONTROLLER.disposeMouseControls();
            this.VR_DISPLAY.requestPresent([{
                source: this.renderer.domElement
            }]);
            this.setVRPaths();
        } else {
            Reticulum.dispose();
            this.WRALK_CONTROLLER.setMouseControls();
            this.VR_CONTROLLER = null;
            this.VR_DISPLAY = null;
            this.camera.rotation.set(0, 0, 0);
        }
    },
    animate: function () {
        this.control.update();
        if (this.VR_DISPLAY) {
            Reticulum.update();
            this.VR_EFFECT.render(this.scene, this.camera);
            this.VR_DISPLAY.requestAnimationFrame(this.animate.bind(this));
        } else {
            TWEEN.update();
            this.renderer.render(this.scene, this.camera);
            requestAnimationFrame(this.animate.bind(this));
        }
    }
};

function WRALK_LOADER(callback) {
    callback = callback ? callback : Function.prototype;

    let self = this;
    let container = $('div#wralk-scene');
    let data = container.data();
    let wralk_json = data.baseurl.concat(data.project, '/wralk.json');
    let project_url = data.baseurl.concat(data.project, '/');
    container.css('background-image', 'url(' + project_url.concat('cover.jpg') + ')');
    container.css('background-color', '#779ecb');
    $.getJSON(wralk_json, function (json) {
        self.JSON = json;
        self.PROJECT_URL = project_url;
        let playbtn = $('<button id="wralk-play-btn"></button>');
        playbtn.on('click', function () {
            this.remove();
            self.load();
        });
        container.append(playbtn);
        callback(null);
    }).fail(function (jqXHR) {
        if (jqXHR.status === 404) {
            window.location.href = '/';
        }
    });
}

WRALK_LOADER.prototype = {
    WRALK: null,
    JSON: null,
    PROJECT_URL: null,
    constructor: WRALK_LOADER,
    load: function () {
        this.WRALK = new WRALK(this.PROJECT_URL, this.JSON.camera, this.JSON.lights, this.JSON.renderer, this.JSON.background, this.JSON.nav_buttons, this.JSON.objects);
    },
    get: function () {
        return this.WRALK;
    }
};