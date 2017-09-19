$(function () {
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera( 80, window.innerWidth / window.innerHeight, 0.1, 1000 );
  var renderer = new THREE.WebGLRenderer({
	antialias: true,
	alpha: true
	});
  //renderer.setClearColor( 0x000000, 0 );
  
  var axes = new THREE.AxisHelper( 20 );

  //renderer.setClearColorHex(0xEEEEEE);
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );
  
  scene.add(axes);


  var spotLight = new THREE.SpotLight( 0xffffff );
  spotLight.position.set( 100, 100, 100 );
 scene.add( spotLight );
  /*var spotLight = new THREE.SpotLight( 0xffffff );
  spotLight.position.set( 0, 0, 500 );
  scene.add(spotLight );*/
  
  var geometry = new THREE.BoxGeometry( 1, 1, 1 );
  var material = new THREE.MeshLambertMaterial( { color: 0x00ff00 } );
  var cube = new THREE.Mesh( geometry, material );
  //scene.add( cube );
  var loader = new THREE.OBJMTLLoader();
  
  var base = '';
  
  // load an obj / mtl resource pair
  loader.load(
	  // OBJ resource URL
	  'models/untitled-scene.obj',
	  // MTL resource URL
	  'models/untitled-scene.mtl',
	  // Function when both resources are loaded
	  function ( object ) {
		var scale = .1
		base = object;
		object.scale.set(scale, scale, scale)
		console.log(object)
		/*object.traverse( function (child) {
          if ( child instanceof THREE.Mesh ) {
              child.material.map = THREE.ImageUtils.loadTexture( '../img/bg.png');
              child.material.needsUpdate = true;
          }
      });*/
		scene.add( object );
	  },
	  // Function called when downloads progress
	  function ( xhr ) {
		  console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
	  },
	  // Function called when downloads error
	  function ( xhr ) {
		  console.log( 'An error happened' );
	  }
  );
  
  camera.position.z = 10;
  function render() {
	requestAnimationFrame( render );
	renderer.render( scene, camera );
	
    base.rotation.x += 0.1;
    base.rotation.y += 0.1;
    base.rotation.z += 0.01;
	
  }
  render();
  
});