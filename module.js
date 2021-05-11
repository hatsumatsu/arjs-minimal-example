/// TEST:
/// Make a working example on portrait:
/// 	ARSource 
/// 		sourceWidth: 480,
/// 		sourceHeight: 640
///
///     renderer.setSize( 640, 480 )
///
///     ARContext
///         no canvas dimensions set     

import { ArToolkitProfile, ArToolkitSource, ArToolkitContext, ArMarkerControls} from '@hatsumatsu/ar.js/three.js/build/ar-threex.js';
import * as THREE from 'three';

import cameraParam from '/data/camera_para.dat';

var onRenderFcts= [];

var renderer;
var scene;
var camera;

var arToolkitSource;
var arToolkitContext;

function initScene() {
	// RENDERER
	renderer	= new THREE.WebGLRenderer({
		antialias: true,
		alpha: true
	});
	renderer.setClearColor(new THREE.Color('lightgrey'), 0)
	// if( window.innerWidth > window.innerHeight ) {
		renderer.setSize( 640, 480 );
	// } else {
		// renderer.setSize( 480, 640 );
	// }
	renderer.domElement.style.position = 'absolute'
	renderer.domElement.style.top = '0px'
	renderer.domElement.style.left = '0px'
	document.body.appendChild( renderer.domElement );


	// SCENE 
	scene	= new THREE.Scene();


	// CAMERA
	camera = new THREE.Camera();
	scene.add(camera);

	scene.visible = false


	// OBJECTS
	var geometry = new THREE.BoxGeometry(1,1,1);
	var material = new THREE.MeshNormalMaterial({
		transparent : true,
		opacity: 0.5,
		side: THREE.DoubleSide
	});
	var mesh = new THREE.Mesh( geometry, material );
	mesh.position.y	= geometry.parameters.height/2
	scene.add( mesh );

	var geometry = new THREE.TorusKnotGeometry(0.3,0.1,64,16);
	var material = new THREE.MeshNormalMaterial();
	var mesh = new THREE.Mesh( geometry, material );
	mesh.position.y	= 0.5
	scene.add( mesh );

	onRenderFcts.push(function(delta){
		mesh.rotation.x += Math.PI*delta
	})

	onRenderFcts.push(function(){
		renderer.render( scene, camera );
	})
}


function initAR() {
	// SOURCE
	arToolkitSource = new ArToolkitSource({
		// to read from the webcam
		sourceType : 'webcam',

		// sourceWidth: window.innerWidth > window.innerHeight ? 640 : 480,
		// sourceHeight: window.innerWidth > window.innerHeight ? 480 : 640,
		sourceWidth: 640,
		sourceHeight: 480,		
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

	    console.log( 'arToolkitSource', arToolkitSource, arToolkitSource.domElement.videoWidth, arToolkitSource.domElement.videoHeight );
	    window.arToolkitSource = arToolkitSource;

	    setTimeout( function() {
			// CONTEXT
			arToolkitContext = new ArToolkitContext({
				cameraParametersUrl: cameraParam,
				detectionMode: 'mono_and_matrix',
				matrixCodeType: '3x3',
				patternRatio: 0.5,

				canvasWidth: 640,
				canvasHeight: 480
			})
			arToolkitContext.init(function onCompleted(){
				camera.projectionMatrix.copy( arToolkitContext.getProjectionMatrix() );

				arToolkitContext.arController.orientation = getSourceOrientation();
				arToolkitContext.arController.options.orientation = getSourceOrientation();

				console.log( 'arToolkitContext', arToolkitContext );
				window.arToolkitContext = arToolkitContext;
			})


			// MARKER
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

		}, 1000 );	    
	})






	onRenderFcts.push(function(){
		if( !arToolkitContext || !arToolkitSource || arToolkitSource.ready === false ) {
			return;
		}

		arToolkitContext.update( arToolkitSource.domElement )

		scene.visible = camera.visible
	})	
}



function initARSource() {

}

function initARContext() {
	
}


initScene();
initAR();


// run the rendering loop
var lastTimeMsec= null
requestAnimationFrame(function animate(nowMsec){
	// keep looping
	requestAnimationFrame( animate );
	// measure time
	lastTimeMsec = lastTimeMsec || nowMsec-1000/60
	var deltaMsec = Math.min(200, nowMsec - lastTimeMsec)
	lastTimeMsec = nowMsec
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
		arToolkitContext.arController.orientation = getSourceOrientation();
		arToolkitContext.arController.options.orientation = getSourceOrientation();

		console.log( 'Context.arController', arToolkitContext.arController.width, arToolkitContext.arController.height, arToolkitContext.arController.orientation );
	}
}






function getScreenOrientation() {
	if( window.innerWidth > window.innerHeight ) {
		return 'landscape';
	} else {
		return 'portrait';
	}
}

function getSourceOrientation() {
	if( !arToolkitSource ) {
		return null;
	}

	console.log( 'actual source dimensions', arToolkitSource.domElement.videoWidth, arToolkitSource.domElement.videoHeight )

	if( arToolkitSource.domElement.videoWidth > arToolkitSource.domElement.videoHeight ) {
		console.log( 'source orientation', 'landscape' );
		return 'landscape';
	} else {
		console.log( 'source orientation', 'portrait' );
		return 'portrait';
	}
}