import {
    ArToolkitProfile,
    ArToolkitSource,
    ArToolkitContext,
    ArMarkerControls,
} from '@hatsumatsu/ar.js/three.js/build/ar-threex.js';
import * as THREE from 'three';

import cameraParam from '/data/camera_para.dat';

var renderer;
var scene;
var camera;
var clock;
var cube;
var torus;

var arToolkitSource;
var arToolkitContext;
var arMarkerControls;

//
// THREE JS SCENE
//
function initScene() {
    console.log('initScene()');

    // CLOCK
    clock = new THREE.Clock();

    // RENDERER
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
    });
    renderer.setClearColor(new THREE.Color('black'), 0);
    renderer.setSize(640, 480);
    renderer.setAnimationLoop(() => {
        updateAR();
        updateScene(clock.getDelta());

        renderer.render(scene, camera);
    });

    document.body.appendChild(renderer.domElement);

    // SCENE
    scene = new THREE.Scene();

    // CAMERA
    camera = new THREE.Camera();
    scene.add(camera);

    scene.visible = false;

    // OBJECTS
    // cube
    var cubeGeometry = new THREE.BoxBufferGeometry(1, 1, 1);
    var cubeMaterial = new THREE.MeshNormalMaterial({
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
    });
    cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.y = 0.5;
    scene.add(cube);

    // torus
    var torusGeometry = new THREE.TorusKnotBufferGeometry(0.3, 0.1, 64, 16);
    var torusMaterial = new THREE.MeshNormalMaterial();
    torus = new THREE.Mesh(torusGeometry, torusMaterial);
    torus.scale.set(0.8, 0.8, 0.8);
    torus.position.y = 0.5;
    scene.add(torus);
}

function updateScene(delta) {
    if (!torus) {
        return;
    }

    torus.rotation.x += Math.PI * delta;
}

//
// AR
//
function initARSource() {
    console.log('initARSource()');

    if (arToolkitSource) {
        console.warn('ArToolkitSource is already initiated.');
        return;
    }

    arToolkitSource = new ArToolkitSource({
        sourceType: 'webcam',
        sourceWidth: window.innerWidth > window.innerHeight ? 640 : 480,
        sourceHeight: window.innerWidth > window.innerHeight ? 480 : 640,
    });

    arToolkitSource.init(() => {
        arToolkitSource.domElement.addEventListener('canplay', () => {
            console.log(
                'arToolkitSource',
                'canplay',
                'actual source dimensions',
                `${arToolkitSource.domElement.videoWidth} x ${arToolkitSource.domElement.videoHeight}`
            );

            initARContext();
        });
    });
}

function initARContext() {
    console.log('initARContext()');

    if (arToolkitContext) {
        console.warn('ArToolkitContext is already initiated.');
        return;
    }

    // CONTEXT
    arToolkitContext = new ArToolkitContext({
        cameraParametersUrl: cameraParam,
        detectionMode: 'mono_and_matrix',
        matrixCodeType: '3x3',
        patternRatio: 0.5,

        // canvasWidth: arToolkitSource.domElement.videoWidth,
        // canvasHeight: arToolkitSource.domElement.videoHeight
    });

    arToolkitContext.init(() => {
        camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());

        // arToolkitContext.arController.orientation = getSourceOrientation();
        // arToolkitContext.arController.options.orientation = getSourceOrientation();

        initARMarkers();

        console.log('arToolkitContext', arToolkitContext);
    });
}

function initARMarkers() {
    console.log('initARMarkers()');

    // MARKER
    arMarkerControls = new ArMarkerControls(arToolkitContext, camera, {
        type: 'barcode',
        barcodeValue: 0,
        smooth: true,
        changeMatrixMode: 'cameraTransformMatrix',
    });

    console.log('ArMarkerControls', arMarkerControls);
}

function initAR() {
    console.log('initAR()');

    initARSource();
}

function updateAR() {
    if (!arToolkitContext || !arToolkitSource || !arToolkitSource.ready || !arMarkerControls) {
        return;
    }

    if (!scene || !camera) {
        return;
    }

    arToolkitContext.update(arToolkitSource.domElement);

    scene.visible = camera.visible;
}

function disposeAR() {
    console.log('disposeAR()');

    disposeARSource();
    disposeARContext();
}

function disposeARSource() {
    console.log('disposeARSource()');

    if (arToolkitSource) {
        arToolkitSource.dispose();
    }
    arToolkitSource = null;
}

function disposeARContext() {
    console.log('disposeARContext()');

    if (arToolkitContext) {
        arToolkitContext.dispose();
    }
    arToolkitContext = null;

    // arMarkerControls are already disposed in `arToolkitContext.dispose()`
    arMarkerControls = null;
}

var initTimer = null;

function onResize() {
    if (initTimer) {
        clearTimeout(initTimer);
    }

    initTimer = setTimeout(() => {
        disposeAR();
        initAR();
    }, 1000);
}

function bindEvents() {
    window.addEventListener('resize', () => {
        onResize();
    });

    document.querySelector('[data-ui-role="init"]').addEventListener('click', () => {
        initAR();
    });

    document.querySelector('[data-ui-role="dispose"]').addEventListener('click', () => {
        disposeAR();
    });
}

function getSourceOrientation() {
    if (!arToolkitSource) {
        return null;
    }

    console.log(
        'getSourceOrientation()',
        `${arToolkitSource.domElement.videoWidth} x ${arToolkitSource.domElement.videoHeight}`
    );

    if (arToolkitSource.domElement.videoWidth > arToolkitSource.domElement.videoHeight) {
        return 'landscape';
    } else {
        return 'portrait';
    }
}

function init() {
    console.log('init()');

    initScene();
    initAR();
    bindEvents();
}

init();
