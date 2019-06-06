# wralk
Helper class for three.js controller, loader and scene. It helps to create whole scene and walk through into 3D models on the web, mobile and VR supported devices.

## Demos

http://wralk.azmicirit.com/demo

http://wralk.azmicirit.com/villavr

## Dependencies

all.js
 - jQuery v3.3.1 
 - Bootstrap v4.0.0 
 - Progressbar.js

all.css
 - Bootstrap v4.0.0

 wralk-dep.js

 - Three.js
 - DracoLoader
 - Hammer.JS
 - KTXLoader
 - tween.js
 - webvr-polyfill - VR support for browsers https://webvr.info/
 - VRControls
 - VREffect.js
 - stats.js (optional)

## Supported Loaders and Components

### Models
- DRACO .drc

But you change your Loader Class as you want, at line 262
https://github.com/azmicirit/wralk/blob/76a1dc0b8a51461d8a06d2cec662c12cafaf540d/wralk.js#L262

``` this.loader = new THREE.DRACOLoader(this.manager); ```

Draco is best for high poly scenes so I chose it as format. For more details https://github.com/google/draco

### Textures
- png, jpg and ktx (recommended)

### Lights
- PointLight
- AmbientLight
- SpotLight
- DirectionalLight
- HemisphereLight

If you are baking a lightmap, you won't need to add a light into scene.

## Sample Scene

 - `Camera <object>` first person camera
 - `lights <array>`
 - `renderer <object>`
 - `background <object>`
 - `nav_buttons <array<object>>`
 - `objects <array<object>>`
    - `mesh <url>` default is draco model
    - `name <string>`
    - `texture <object>` more details at line 432: getTextureByConfig() https://github.com/azmicirit/wralk/blob/76a1dc0b8a51461d8a06d2cec662c12cafaf540d/wralk.js#L432
      - map
      - bumpMap
      - normalMap
      - specularMap
      - lightMap
      - aoMap
    - `material <object>`
      - MeshBasicMaterial https://threejs.org/docs/#api/en/materials/MeshBasicMaterial
      - MeshLambertMaterial https://threejs.org/docs/#api/en/materials/MeshLambertMaterial
      - MeshPhongMaterial https://threejs.org/docs/#api/en/materials/MeshPhongMaterial
  - `collidable <boolean>` is collidable to first person camera
  - `vrstep <boolean>` move first person camera to aim when this mesh is focused in VR mode.
``` 
{
  "camera": {
    "fov": 50,
    "near": 1,
    "far": 50000,
    "speed": 20,
    "enabled": true,
    "hit_distance": 150,
    "position": {
      "x": 8600,
      "y": 1600,
      "z": 4000
    },
    "rotation": {
      "x": 0,
      "y": 7,
      "z": 0
    },
    "height": {
      "max": 30000,
      "min": -30000
    }
  },
  "lights": [],
  "renderer": {
    "exposure": 1
  },
  "background": {},
  "nav_buttons": [{
    "caption": "Kat Planı",
    "position": [6900, 12000, 730],
    "rotation": [0, 7.86, 0],
    "floor_plan": true
  }],
  "objects": [{
    "mesh": "m/floor",
    "name": "m/floor",
    "texture": {
      "map": {
        "url": "t/floor_texture.ktx",
        "repeat": {
          "wrapS": true,
          "wrapT": true,
          "set": [5, 5]
        }
      },
      "lightMap": {
        "url": "t/floor_lightmap.png"
      }
    },
    "material": {
      "type": "MeshPhongMaterial"
    },
    "collidable": true,
    "vrstep": true
  }]
}
```

## Minify All Javascripts

Dependency orders are important and wralk-dep.js reticulum.js and wralk.js respectively.

` uglifyjs .\wralk-dep.js .\reticulum.js .\app\public\vendors\wralk\wralk.js  -o .\wralk.js -c -m `