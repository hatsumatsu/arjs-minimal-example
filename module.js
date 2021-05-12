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
function initAR() {
    console.log('initAR()');

    initARSource();
}

function initARSource() {
    console.log('initARSource()');

    arToolkitSource = new ArToolkitSource({
        sourceType: 'webcam',
        // sourceWidth: window.innerWidth > window.innerHeight ? 640 : 480,
        // sourceHeight: window.innerWidth > window.innerHeight ? 480 : 640,
        sourceWidth: 640,
        sourceHeight: 480,
    });

    arToolkitSource.init(() => {
        arToolkitSource.domElement.addEventListener('canplay', () => {
            console.log(
                'canplay',
                'actual source dimensions',
                arToolkitSource.domElement.videoWidth,
                arToolkitSource.domElement.videoHeight
            );

            initARContext();
        });

        window.arToolkitSource = arToolkitSource;
    });
}

function initARContext() {
    console.log('initARContext()');

    // CONTEXT
    arToolkitContext = new ArToolkitContext({
        cameraParametersUrl: cameraParam,
        detectionMode: 'mono_and_matrix',
        matrixCodeType: '3x3',
        patternRatio: 0.5,

        canvasWidth: arToolkitSource.domElement.videoWidth,
        canvasHeight: arToolkitSource.domElement.videoHeight,
    });

    arToolkitContext.init(() => {
        arToolkitContext.arController.orientation = getSourceOrientation();
        arToolkitContext.arController.options.orientation = getSourceOrientation();

        renderer.setSize(arToolkitSource.domElement.videoWidth, arToolkitSource.domElement.videoHeight);

        camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());

        // MARKER
        arMarkerControls = new ArMarkerControls(arToolkitContext, camera, {
            type: 'barcode',
            barcodeValue: 0,
            smooth: true,
            changeMatrixMode: 'cameraTransformMatrix',
        });

        // onResize();

        window.arToolkitContext = arToolkitContext;
        window.arMarkerControls = arMarkerControls;

        console.log('ArMarkerControls', arMarkerControls);

        log();
    });
}

function updateAR() {
    if (!arToolkitContext || !arToolkitSource || !arToolkitSource.ready) {
        return;
    }

    if (!scene || !camera) {
        return;
    }

    arToolkitContext.update(arToolkitSource.domElement);

    scene.visible = camera.visible;
}

function disposeARSource() {
    console.log('disposeARSource()');

    const video = document.querySelector('#arjs-video');

    if (video) {
        video?.srcObject?.getTracks().map((track) => track.stop());
        video.remove();
    }

    arToolkitSource = null;
}

function disposeARContext() {
    console.log('disposeARContext()');

    if (arToolkitContext?.arController?.cameraParam?.dispose) {
        arToolkitContext.arController.cameraParam.dispose();
    }

    if (arToolkitContext?.arController?.dispose) {
        arToolkitContext.arController.dispose();
    }

    if (arMarkerControls?.dispose) {
        arMarkerControls.dispose();
    }

    arToolkitContext = null;
    arMarkerControls = null;
}

function onResize() {
    setTimeout(() => {
        // Let's try to set some values based on the log...

        // set controller orientation
        arToolkitContext.arController.orientation = getSourceOrientation();
        arToolkitContext.arController.options.orientation = getSourceOrientation();

        // set controller dimensions
        arToolkitContext.arController.width = arToolkitSource?.domElement?.videoWidth;
        arToolkitContext.arController.height = arToolkitSource?.domElement?.videoHeight;

        arToolkitContext.arController.canvas.width = arToolkitContext.arController.ctx.canvas.width =
            arToolkitSource?.domElement?.videoWidth;
        arToolkitContext.arController.canvas.height = arToolkitContext.arController.ctx.canvas.height =
            arToolkitSource?.domElement?.videoHeight;

        log();
    }, 2000);
}

function bindEvents() {
    window.addEventListener('resize', () => {
        onResize();
    });
}

function log() {
    console.table({
        screen: `${window.innerWidth} x ${window.innerHeight}`,
        // this is directly copied from above:
        'requested source': `640 x 480`,
        //'requested source': `${window.innerWidth > window.innerHeight ? 640 : 480} x ${
        //    window.innerWidth > window.innerHeight ? 480 : 640
        // }`,
        arToolkitSource: `${arToolkitSource?.domElement?.videoWidth} x ${arToolkitSource?.domElement?.videoHeight}`,
        'arToolkitContext.arController': `${arToolkitContext?.arController?.width} x ${arToolkitContext?.arController?.height} ${arToolkitContext?.arController?.orientation}`,
        'arToolkitContext.arController.canvas': `${arToolkitContext?.arController?.canvas?.width} x ${arToolkitContext?.arController?.canvas?.height}`,
        'arToolkitContext.arController.ctx.canvas': `${arToolkitContext?.arController?.ctx?.canvas?.width} x ${arToolkitContext?.arController?.ctx?.canvas?.height}`,
        'arToolkitContext.arController.camera_mat': JSON.stringify(arToolkitContext?.arController?.camera_mat),
        'threejs renderer': `${renderer?.getSize()?.x} x ${renderer?.getSize()?.y}`,
    });

    console.log('arToolkitContext.arController', arToolkitContext?.arController);
}

function getSourceOrientation() {
    if (!arToolkitSource) {
        return null;
    }

    console.log(
        'actual source dimensions',
        arToolkitSource.domElement.videoWidth,
        arToolkitSource.domElement.videoHeight
    );

    if (arToolkitSource.domElement.videoWidth > arToolkitSource.domElement.videoHeight) {
        console.log('source orientation', 'landscape');
        return 'landscape';
    } else {
        console.log('source orientation', 'portrait');
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
