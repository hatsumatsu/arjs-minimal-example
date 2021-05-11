import { ArToolkitProfile, ArToolkitSource, ArToolkitContext, ArMarkerControls} from '@hatsumatsu/ar.js/three.js/build/ar-threex.js';
import * as THREE from 'three';

import cameraParam from '/data/camera_para.dat';


//////////////////////////////////////////////////////////////////////////////////
//		Init
//////////////////////////////////////////////////////////////////////////////////

// init renderer
var renderer	= new THREE.WebGLRenderer({
	antialias: true,
	alpha: true
});
renderer.setClearColor(new THREE.Color('lightgrey'), 0)
renderer.setSize( 640, 480 );
renderer.domElement.style.position = 'absolute'
renderer.domElement.style.top = '0px'
renderer.domElement.style.left = '0px'
document.body.appendChild( renderer.domElement );

// array of functions for the rendering loop
var onRenderFcts= [];

// init scene and camera
var scene	= new THREE.Scene();

//////////////////////////////////////////////////////////////////////////////////
//		Initialize a basic camera
//////////////////////////////////////////////////////////////////////////////////

// Create a camera
var camera = new THREE.Camera();
scene.add(camera);

////////////////////////////////////////////////////////////////////////////////
//          handle arToolkitSource
////////////////////////////////////////////////////////////////////////////////

var arToolkitSource = new ArToolkitSource({
	// to read from the webcam
	sourceType : 'webcam',

	sourceWidth: 480,
	sourceHeight: 640,
	// displayWidth: 480,
	// displayHeight: 640,	

	// // to read from an image
	// sourceType : 'image',
	// sourceUrl : ArToolkitContext.baseURL + '../data/images/img.jpg',

	// to read from a video
	// sourceType : 'video',
	// sourceUrl : ArToolkitContext.baseURL + '../data/videos/headtracking.mp4',
})

arToolkitSource.init(function onReady(){
    setTimeout(() => {
        onResize()
    }, 2000);

    console.log( 'arToolkitSource', arToolkitSource );
    window.arToolkitSource = arToolkitSource;
})


////////////////////////////////////////////////////////////////////////////////
//          initialize arToolkitContext
////////////////////////////////////////////////////////////////////////////////


// create atToolkitContext
var arToolkitContext = new ArToolkitContext({
	cameraParametersUrl: cameraParam,
	detectionMode: 'mono_and_matrix',
	matrixCodeType: '3x3',
	patternRatio: 0.5,

	// canvasWidth: 480,
	// canvasHeight: 640
})
// initialize it
arToolkitContext.init(function onCompleted(){
	// copy projection matrix to camera
	camera.projectionMatrix.copy( arToolkitContext.getProjectionMatrix() );

	arToolkitContext.arController.orientation = getOrientation();
	arToolkitContext.arController.options.orientation = getOrientation();

	console.log( 'arToolkitContext', arToolkitContext );
	window.arToolkitContext = arToolkitContext;
})

// update artoolkit on every frame
onRenderFcts.push(function(){
	if( arToolkitSource.ready === false )	return

	arToolkitContext.update( arToolkitSource.domElement )

	// update scene.visible if the marker is seen
	scene.visible = camera.visible
})

////////////////////////////////////////////////////////////////////////////////
//          Create a ArMarkerControls
////////////////////////////////////////////////////////////////////////////////

// init controls for camera
var markerControls = new ArMarkerControls(arToolkitContext, camera, {
	type : 'barcode',
	barcodeValue: 0,
	smooth: true,
	// patternUrl : './data/data/patt.hiro',
	// patternUrl : ArToolkitContext.baseURL + '../data/data/patt.kanji',
	// as we controls the camera, set changeMatrixMode: 'cameraTransformMatrix'
	changeMatrixMode: 'cameraTransformMatrix'
})

console.log( 'ArMarkerControls', ArMarkerControls );
window.ArMarkerControls = ArMarkerControls;

// as we do changeMatrixMode: 'cameraTransformMatrix', start with invisible scene
scene.visible = false

//////////////////////////////////////////////////////////////////////////////////
//		add an object in the scene
//////////////////////////////////////////////////////////////////////////////////

// add a torus knot
var geometry	= new THREE.BoxGeometry(1,1,1);
var material	= new THREE.MeshNormalMaterial({
	transparent : true,
	opacity: 0.5,
	side: THREE.DoubleSide
});
var mesh	= new THREE.Mesh( geometry, material );
mesh.position.y	= geometry.parameters.height/2
scene.add( mesh );

var geometry	= new THREE.TorusKnotGeometry(0.3,0.1,64,16);
var material	= new THREE.MeshNormalMaterial();
var mesh	= new THREE.Mesh( geometry, material );
mesh.position.y	= 0.5
scene.add( mesh );

onRenderFcts.push(function(delta){
	mesh.rotation.x += Math.PI*delta
})

//////////////////////////////////////////////////////////////////////////////////
//		render the whole thing on the page
//////////////////////////////////////////////////////////////////////////////////

// render the scene
onRenderFcts.push(function(){
	renderer.render( scene, camera );
})



// run the rendering loop
var lastTimeMsec= null
requestAnimationFrame(function animate(nowMsec){
	// keep looping
	requestAnimationFrame( animate );
	// measure time
	lastTimeMsec	= lastTimeMsec || nowMsec-1000/60
	var deltaMsec	= Math.min(200, nowMsec - lastTimeMsec)
	lastTimeMsec	= nowMsec
	// call each update function
	onRenderFcts.forEach(function(onRenderFct){
		onRenderFct(deltaMsec/1000, nowMsec/1000)
	})
})

// handle resize
window.addEventListener('resize', function(){
	setTimeout(() => {
		onResize()
	}, 2000 );
})

function onResize(){
	arToolkitSource.onResizeElement()
	arToolkitSource.copyElementSizeTo(renderer.domElement)
	if( arToolkitContext.arController !== null ) {
		arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas)
	}


	// set orientation of arController
	if( arToolkitContext.arController !== null ) {
		arToolkitContext.arController.orientation = getOrientation();
		arToolkitContext.arController.options.orientation = getOrientation();
	}
}

function getOrientation() {
	if( window.innerWidth > window.innerHeight ) {
		console.log( 'landscape' );
		return 'landscape';
	} else {
		console.log( 'portrait' );
		return 'portrait';
	}
}