/**
 * @author mrdoob / http://mrdoob.com/
 */

var _Camera;
var _Scene;
var _Plane;
var _Crash;
var _Status = {};
var scenario;
var __TEST;
var _testFunc;
var _Renderer;

var accel = {};

function getRandom(min, max) {
	return Math.random() * (max - min) + min;
}

function in_array(value, array){
    for(var i = 0; i < array.length; i++){
        if(array[i] == value) return true;
    }
    return false;
}

window.addEventListener("devicemotion", function(){
	accel = {
		x: event.accelerationIncludingGravity.x,
		y: event.accelerationIncludingGravity.y,
		z: event.accelerationIncludingGravity.z
	}
	var $layers = $('.layer');
		$($layers.get().reverse()).each(function(index){
		$(this).css({
			left: accel.y*(index+1)*5, 
			top: accel.x*(index+1)*5
		});
	});
}, false);

var animateCircle;

$(function() {
	var canvas = document.getElementById('circle');
	var context = canvas.getContext('2d');
	var x = canvas.width / 2;
	var y = canvas.height / 2;
	var radius = 40;
	var endPercent = 101;
	var curPerc = 0;
	var counterClockwise = false;
	var circ = Math.PI * 2;
	var quart = Math.PI / 2;
	
	context.lineWidth = 2;
	
	context.shadowOffsetX = 0;
	context.shadowOffsetY = 0;
	context.shadowBlur = 10;
	context.shadowColor = 'transparent';


	animateCircle = function (loaded) {
		var current = curPerc / 100;

		context.clearRect(0, 0, canvas.width, canvas.height);

		context.beginPath();
		context.strokeStyle = '#537297';
		context.arc(x, y, radius, 0, Math.PI * 2 * 100, false);
		context.stroke();
		
		context.beginPath();
		context.strokeStyle = '#fff';
		context.arc(x, y, radius, -(quart), ((circ) * current) - quart, false);
		context.stroke();
		curPerc++;
		if (curPerc < loaded) {
			requestAnimationFrame(function () {
				animateCircle(loaded)
			});
		};
		return true;
	};
});

var APP = {

	Player: function () {

		var loader = new THREE.ObjectLoader();
		var camera, scene, renderer;
		var scripts = {};
		var objects = [], plane;
		var canMove = {};
		var base;
		var progress = 0;
		
		var raycaster = new THREE.Raycaster();
		var mouse = new THREE.Vector2(),
		offset = new THREE.Vector3(),
		lastCoords = new THREE.Vector3(),
		INTERSECTED, SELECTED;
		var clockFixed = false;
		
		this.dom = undefined;

		this.width = 500;
		this.height = 500;
		
		var raycaster = new THREE.Raycaster();

		this.load = function ( json ) {
			
			renderer = new THREE.WebGLRenderer( { antialias: true } );
			//renderer = new THREE.WebGLRenderer( { antialias: true } );
			//renderer = new THREE.CanvasRenderer( { antialias: true } );
			//renderer = new THREE.CanvasRenderer();
			renderer.setPixelRatio( window.devicePixelRatio );
			renderer.sortObjects = false;
			_Renderer = renderer;
			//renderer.shadowMapEnabled = true;
			
			camera = loader.parse( json.camera );
			scene = loader.parse( json.scene );
			
			plane = new THREE.Mesh(
					new THREE.PlaneBufferGeometry( 2000, 2000, 8, 8 ),
					new THREE.MeshBasicMaterial( { color: 0x00ff00, opacity: 0.25, transparent: true } )
			);
			_Plane = plane;

			plane.rotation.x=-1.57;
			plane.rotation.x=-1;
			plane.visible = false
			scene.add( plane );
			
			var axes = new THREE.AxisHelper( 200 );
			//scene.add(axes);

			var faceMap = THREE.ImageUtils.loadTexture('watch3.png');
			var face=scene.getObjectByName('face')
			face.material.map = faceMap
			
			var baseMap = THREE.ImageUtils.loadTexture('kryg2.png');
			var baseBumpMap = THREE.ImageUtils.loadTexture('bump.png');
			var baseLightMap = THREE.ImageUtils.loadTexture('light.png');
			var faceOpMap = THREE.ImageUtils.loadTexture('map_op.png');
			var faceBumpMap = THREE.ImageUtils.loadTexture('bump_1.png');
			var pendulumMap = THREE.ImageUtils.loadTexture('map_pendulum.png');
			var pendulumBump = THREE.ImageUtils.loadTexture('bump_pendulum.png');
			
			var basement=scene.getObjectByName('basement_child', true)
			var pendulum=scene.getObjectByName('pendulum', true)
			
			pendulum.material.map = pendulumMap
			pendulum.material.bumpMap = pendulumBump
			pendulum.material.bumpScale = 0.5
			basement.material.map = baseMap
			basement.material.bumpMap = baseBumpMap
			basement.material.specularMap = baseLightMap
			//face.material.alphaMap = faceOpMap
			face.material.bumpMap = faceBumpMap
			
			base = scene.getObjectByName('basement');
			//base.position.y=-50
			
			var clock = scene.getObjectByName('Clock', true);
			//clock.position.copy(new THREE.Vector3( 20, -2000, -4500 ));
			clock.position.copy(new THREE.Vector3( 0, 350, 0 ));
			clock.rotation.copy(new THREE.Euler( getRandom(0,2), getRandom(0,2), getRandom(5,10), 'XYZ' ));
			objects = scene.getObjectByName('Clock', true).children;
			console.log(objects)
			
			objects.forEach(function(_object){
				_object.geometry.computeBoundingBox()
				var x = _object.geometry.boundingBox.min.x - _object.geometry.boundingBox.max.x
				var y = _object.geometry.boundingBox.min.y - _object.geometry.boundingBox.max.y
				var z = _object.geometry.boundingBox.min.z - _object.geometry.boundingBox.max.z
				console.log(_object.name)
				console.log(-x,-y,-z)
				/*if (object.userData != true) {
					_object.userData.fixed = null;
				}*/
				_object.userData.moved = false;
				_object.userData.rotate = [0, 0, 0];
			});
			scene.getObjectByName('makarona').userData.rotate = [ -3.0212127721289055, 1.4, -1.2148236865151232];
			scene.getObjectByName('makarona').position.x = 300
			
			scripts = {
				keydown: [],
				keyup: [],
				mousedown: [],
				mouseup: [],
				mousemove: [],
				update: []
			};

			for ( var uuid in json.scripts ) {

				var object = scene.getObjectByProperty( 'uuid', uuid, true );

				var sources = json.scripts[ uuid ];

				for ( var i = 0; i < sources.length; i ++ ) {

					var script = sources[ i ];

					var events = ( new Function( 'player', 'scene', 'keydown', 'keyup', 'mousedown', 'mouseup', 'mousemove', 'update', script.source + '\nreturn { keydown: keydown, keyup: keyup, mousedown: mousedown, mouseup: mouseup, mousemove: mousemove, update: update };' ).bind( object ) )( this, scene );

					for ( var name in events ) {

						if ( events[ name ] === undefined ) continue;

						if ( scripts[ name ] === undefined ) {

							console.warn( 'APP.Player: event type not supported (', name, ')' );
							continue;

						}

						scripts[ name ].push( events[ name ].bind( object ) );

					}

				}

			}

			this.dom = renderer.domElement;

		};

		this.setCamera = function ( value ) {

			camera = value;
			camera.aspect = this.width / this.height;
			camera.updateProjectionMatrix();

		};

		this.setSize = function ( width, height ) {

			this.width = width;
			this.height = height;

			camera.aspect = this.width / this.height;
			camera.updateProjectionMatrix();

			renderer.setSize( width*1, height*1 );

		};

		var dispatch = function ( array, event ) {

			for ( var i = 0, l = array.length; i < l; i ++ ) {

				array[ i ]( event );

			}

		};

		var request;

		var animate = function ( time ) {

			request = requestAnimationFrame( animate );

			dispatch( scripts.update, { time: time } );

			renderer.render( scene, camera );
			
			stats.update();
			
			TWEEN.update();
			_Status = {
				plane: plane,
				raycaster: raycaster,
				mouse: mouse,
				offset: offset,
				INTERSECTED: INTERSECTED,
				SELECTED: SELECTED
			}
		};
		
		var motion = function (){
			accel = {
				x: event.accelerationIncludingGravity.x,
				y: event.accelerationIncludingGravity.y,
				z: event.accelerationIncludingGravity.z
			}
			var robject = scene.getObjectByName('Clock').children
			robject.forEach(function(_object, index){
				if (clockFixed != true) {
					var target = {
						rx: _object.userData.rotate[0]-(accel.x/9).toFixed(1),
						ry: _object.userData.rotate[1],
						rz: _object.userData.rotate[2]-(accel.y/9).toFixed(1)
					};
					/*_object.rotation.x = _object.userData.rotate[0]
					_object.rotation.y = _object.userData.rotate[1]
					_object.rotation.z = _object.userData.rotate[2]-event.accelerationIncludingGravity.y/9*/
					//console.log(target.rz)
					//_object.rtween.stop();
					if (_object.userData.moved != true) {
						animateRTween(_object, target, 100, TWEEN.Easing.Linear.None, undefined, true)
					}
					//_object.rotation.z = -event.accelerationIncludingGravity.y/9
				};
			});
		};
		
		this.play = function () {
			
			document.addEventListener( 'keydown', onDocumentKeyDown );
			document.addEventListener( 'keyup', onDocumentKeyUp );
			document.addEventListener( 'mousedown', onDocumentMouseDown );
			document.addEventListener( 'mouseup', onDocumentMouseUp );
			document.addEventListener( 'mousemove', onDocumentMouseMove );
			document.addEventListener( 'touchstart', onDocumentMouseDown );
			document.addEventListener( 'touchend', onDocumentMouseUp );
			document.addEventListener( 'touchmove', onDocumentMouseMove );
			
			
			_Camera = camera
			_Scene = scene
			
			stats = new Stats();
			/*stats.domElement.style.position = 'absolute';
			stats.domElement.style.top = '0px';
			document.body.appendChild( stats.domElement );
*/
			request = requestAnimationFrame( animate );
			//_Crash();
		};

		this.stop = function () {

			document.removeEventListener( 'keydown', onDocumentKeyDown );
			document.removeEventListener( 'keyup', onDocumentKeyUp );
			document.removeEventListener( 'mousedown', onDocumentMouseDown );
			document.removeEventListener( 'mouseup', onDocumentMouseUp );
			document.removeEventListener( 'mousemove', onDocumentMouseMove );

			cancelAnimationFrame( request );

		};
		
		var clockFlyToCamera = function(callback){
			var _clock = scene.getObjectByName('Clock');
			animateTween(_clock, undefined, 3000, TWEEN.Easing.Linear.None, function(){
				callback();
			});
		}
		
		var canMoveFunc = function(arr, callback){
			canMove = {};
			canMove.arr = arr;
			$(canMove).on('fixed', function(e) {
				canMove.arr.splice(canMove.arr.indexOf(e.value),1);
				if (canMove.arr.length == 0) {
					$(canMove).off();
					callback();
				}
			});
		}
		
		var canMoveHands = function(callback){
			arr = [
				scene.getObjectByName('m_hand_box'),
				scene.getObjectByName('h_hand_box')
			]
			canMoveFunc(arr, callback)
		}
		var canMoveFace = function(callback){
			arr = [
				scene.getObjectByName('face')
			]
			canMoveFunc(arr, callback)
		}
		var canMovePendulum = function(callback){
			arr = [
				scene.getObjectByName('pendulum')
			]
			canMoveFunc(arr, callback)
		}
		var canMoveGears = function(callback){
			arr = [
				scene.getObjectByName('gear_1'),
				scene.getObjectByName('gear_2'),
				scene.getObjectByName('gear_3')
			]
			canMoveFunc(arr, callback)
		}
		
		var canMoveMakarona = function(callback){
			arr = [
				scene.getObjectByName('makarona')
			]
			console.log('makarona')
			console.log(arr)
			canMoveFunc(arr, callback)
		}
		
		var lose = function(){
			$('.step-2').fadeOut();
			$('.step-lose').fadeIn();
			$('canvas').fadeOut();
		}
		
		var step3 = function(callback){
			$('.step-3').fadeIn(300, callback());
		}
		
		var cooldown = function(){
			$('.step-2').fadeIn();
			var timer = setInterval(function(){
				var cur = parseInt($('.timer').text());
				if (cur == 0) {
					clearInterval(timer);
					lose();
				} else {
					cur-=1
					$('.timer').text(cur);
					animateCircle(((60-cur)/(60/100)));
				}
			}, 1000)
		}
		
		function moveHands() {
			var h = scene.getObjectByName('h_hand_box');
			var m = scene.getObjectByName('m_hand_box');
			animateRTween(h, target = {rx: 0, ry: -1.283*1, rz: 0}, 6000, TWEEN.Easing.Linear.None)
			animateRTween(m, target = {rx: 0, ry: -1.283*6, rz: 0}, 6000, TWEEN.Easing.Linear.None)
			setTimeout(function(){
				$('.progress-bar').fadeOut();
			}, 1000);
			setTimeout(function(){
				location.href= 'index.html';
			}, 8000);
		}
		
		function progressBar() {
			progress += 10;
			if (progress > 100) {
				progress=100
			}
			$('.step-4 .bg').css({
				'height': progress+'%'
			});
			$('.progress').css({
				'width': progress+'%'
			});
			if (progress==100) {
				setTimeout(function(){
					moveHands();
				}, 1000);
			}
		}
		
		function startClock(callback) {
			$('.step-4').fadeIn();
			//rotateToZero2(scene.getObjectByName('Clock'));
			clockFixed = true;
			target = {
				x: camera.position.x,
				y: 300,
				z: 220,
				rx: camera.rotation.x,
				ry: camera.rotation.y,
				rz: camera.rotation.z
			}
			animateTween(camera, target)
			scene.getObjectByName('Clock').children.forEach(function(_object){
				animateTween(_object, target={x:0, y:0, z:0, rx:0, ry:0, rz:0})
			});
			var pend = 0;
			var cur_pend = 0;
			window.addEventListener("devicemotion", function(event){
				if (parseInt(accel.y) < -2) {
					console.log('low')
					cur_pend = -1;
				} else if (parseInt(accel.y) > 2){
					console.log('hight')
					cur_pend = 1;
				}
				if (pend != cur_pend) {
					pend = cur_pend;
					progressBar();
				}
			}, false);
		}
		
		scenario = function(){
			$('#steps .step-1').fadeIn(300, function(){
				$('#steps .step-1 .btn').bind('click touchend', function(e){
					e.preventDefault();
					$('#steps .step-1').fadeOut(300, function(){
						clockFlyToCamera(function(){
							setTimeout(function(){
								crashAll(function(){
									//window.addEventListener("devicemotion", motion, false);
									//alert('go!')
									cooldown();
									canMoveGears(function(){
										canMovePendulum(function(){
											canMoveFace(function(){
												canMoveHands(function(){
													$('.step-2').fadeOut();	
													lose = function(){};
													step3(function(){
														setTimeout(function(){
															$('.step-3').fadeOut(300, function(){
																startClock(function(){
																		
																});
																/*var makarona = scene.getObjectByName('makarona');
																objects.push(makarona)
																crashOne(makarona)
																canMoveMakarona(function(){
																	startClock(function(){
																		
																	});
																})*/
															});
														}, 2000);
													})
												});
											});
										});
									});
									window.addEventListener("devicemotion", motion, false);
									//motion();
								});
							}, 500);
						});
					})
				});
			})
		}

		//
		
		function rotateToZero(_object) {
			var x = _object.userData.position[0],
				y = _object.userData.position[1],
				z = _object.userData.position[2];
			_object.rotation.x = _object.userData.rotate[0]/(x/_object.position.x)
			_object.rotation.y = _object.userData.rotate[1]/(y/_object.position.y)
			_object.rotation.z = _object.userData.rotate[2]/(z/_object.position.z)
		}
		function rotateToZero2(_object) {
			var target = {x: _object.position.x, y:_object.position.y, z:_object.position.z, rx: 0, ry:0, rz:0,};
			animateRTween(_object, target, 100, undefined, undefined, false);
		}
		
		function fixOnPosition(_object) {
			var minClose = 20;
			if (in_array(_object, canMove.arr)) {
				if (Math.abs(_object.position.x)<=minClose && Math.abs(_object.position.y)<=minClose && Math.abs(_object.position.z)<=minClose) {
					var target = {x: 0, y:0, z:0, rx: 0, ry:0, rz:0,};
					if (SELECTED.name != "makarona") {
						SELECTED.userData.rotate = [0,0,0]
					} else {
						target = {x: 0, y:0, z:0, rx: -3.0212127721289055, ry:1.4, rz:-1.2148236865151232,};
					}
					$(canMove).triggerHandler({
						type: 'fixed',
						value: _object
					});
					_object.userData.fixed = true;
					untouch();
					animateTween(_object, target, undefined, undefined, function(){
					});
				}
				if (_object.name == 'makarona' && Math.abs(_object.position.x)<=3.47 && Math.abs(_object.position.y)>=22 && Math.abs(_object.position.z)<=30) {
					animateOpacity(_object)
					_object.userData.fixed = true;
					$(canMove).triggerHandler({
						type: 'fixed',
						value: _object
					});
					untouch();
				}
			}
		}
		
		function untouch() {
			//console.log(lastCoords)
			//console.log('"position": ['+[SELECTED.position.x,SELECTED.position.y,SELECTED.position.z]+']')
			//SELECTED.userData.moved = false;
			objects.forEach(function(_object, index){
				if (_object.userData.fixed == true) {
				};
				_object.userData.moved = false;
			});
			SELECTED = null
			INTERSECTED = null
		}
		
		var crashOne = function(_object, time, index, callback) {
			time = typeof time !== 'undefined' ? time : 700;
			index = typeof index !== 'undefined' ? index : 0;
			callback = typeof callback !== 'undefined' ? callback : function(){};
			var target = {
				x: _object.userData.position[0],
				y: _object.userData.position[1],
				z: _object.userData.position[2],
			};
			/*if (_object.name != "makarona") {
				_object.userData.rotate = [target.rx, target.ry, target.rz];
			} else {
				var target = {
					x: _object.userData.position[0],
					y: _object.userData.position[1],
					z: _object.userData.position[2],
					rx: -3.0212127721289055,
					ry: 1.4,
					rz: -1.2148236865151232
				};
			}*/
			animatePosTween(_object, target, time+(index*200), TWEEN.Easing.Back.Out, function(){
				callback();
			}, false);
			setTimeout(function(){
				var target = {
					rx: getRandom(-0.5,0.5),
					ry: getRandom(-0.5,0.5),
					rz: getRandom(-0.5,0.5)
				};
				_object.userData.rotate = [target.rx, target.ry, target.rz];
				animateRTween(_object, target, 500, TWEEN.Easing.Quadratic.InOut, function(){
				}, false);
			}, 500)
		}
		
		var crashAll = function(callback) {
			callback = typeof callback !== 'undefined' ? callback : function(){};
			objects.forEach(function(_object, index){
				if (_object.userData.position) {
					crashOne(_object, 3000, index, function(){
						if (index==objects.length-1) {
							callback();
						}
					})
				}
			});
		}
		
		_Crash = crashAll;
		
		var getCoords = function(event){
			var x = event.clientX || event.touches[0].clientX
			var y = event.clientY || event.touches[0].clientY
			mouse.x = ( x / window.innerWidth ) * 2 - 1;
			mouse.y = - ( y / window.innerHeight ) * 2 + 1;
		}
		
		var animateGeneric = function(tween, callback){
			tween.start();
			tween.onComplete(function(){
				callback();
			});
		}
		
		var animateRTween = function(_object, target, time, easing, callback, animate_set){
			target = typeof target !== 'undefined' ? target : {rx: 0, ry:0, rz:0,};
			time = typeof time !== 'undefined' ? time : 1000;
			easing = typeof easing !== 'undefined' ? easing : TWEEN.Easing.Quadratic.InOut;
			callback = typeof callback !== 'undefined' ? callback : function(){};
			animate_set = typeof animate_set !== 'undefined' ? animate_set : true;
			
			_object.userData.animate = animate_set;
			var position = {
				rx: _object.rotation.x,
				ry: _object.rotation.y,
				rz: _object.rotation.z,
			};
			var tween = new TWEEN.Tween(position).to(target, time);
			_object.rtween = tween
			tween.easing(easing);
			tween.onUpdate(function(){
				_object.rotation.x = position.rx;
				_object.rotation.y = position.ry;
				_object.rotation.z = position.rz;
			});
			animateGeneric(tween, function(){
				_object.userData.animate = false
				callback()	
			})
		}
		
		_testFunc = animateRTween
			
		var animateOpacity = function(_object, target, time, easing, callback, animate_set){
			target = typeof target !== 'undefined' ? target : {opacity: 0};
			time = typeof time !== 'undefined' ? time : 100;
			easing = typeof easing !== 'undefined' ? easing : TWEEN.Easing.Linear.None;
			callback = typeof callback !== 'undefined' ? callback : function(){};
			animate_set = typeof animate_set !== 'undefined' ? animate_set : true;
			_object.userData.animate = animate_set;
			var opacity = {
				opacity: _object.material.opacity
			}
			var tween = new TWEEN.Tween(opacity).to(target, time);
			tween.easing(easing);
			tween.onUpdate(function(){
				_object.material.opacity = opacity.opacity;
			});
			animateGeneric(tween, function(){
				_object.userData.animate = false
				callback()	
			})
		}
		
		var animateTween = function(_object, target, time, easing, callback, animate_set){
			
			target = typeof target !== 'undefined' ? target : {x: 0, y:0, z:0, rx: 0, ry:0, rz:0,};
			time = typeof time !== 'undefined' ? time : 1000;
			easing = typeof easing !== 'undefined' ? easing : TWEEN.Easing.Quadratic.InOut;
			callback = typeof callback !== 'undefined' ? callback : function(){};
			animate_set = typeof animate_set !== 'undefined' ? animate_set : true;
			
			_object.userData.animate = animate_set;
			var position = {
				x : _object.position.x,
				y: _object.position.y,
				z: _object.position.z,
				rx: _object.rotation.x,
				ry: _object.rotation.y,
				rz: _object.rotation.z,
			};
			var tween = new TWEEN.Tween(position).to(target, time);
			tween.easing(easing);
			tween.onUpdate(function(){
				_object.position.x = position.x;
				_object.position.y = position.y;
				_object.position.z = position.z;
				_object.rotation.x = position.rx;
				_object.rotation.y = position.ry;
				_object.rotation.z = position.rz;
			});
			animateGeneric(tween, function(){
				_object.userData.animate = false
				callback()	
			})
		}
		
		var animatePosTween = function(_object, target, time, easing, callback, animate_set){
			
			target = typeof target !== 'undefined' ? target : {x: 0, y:0, z:0};
			time = typeof time !== 'undefined' ? time : 1000;
			easing = typeof easing !== 'undefined' ? easing : TWEEN.Easing.Quadratic.InOut;
			callback = typeof callback !== 'undefined' ? callback : function(){};
			animate_set = typeof animate_set !== 'undefined' ? animate_set : true;
			
			_object.userData.animate = animate_set;
			var position = {
				x : _object.position.x,
				y: _object.position.y,
				z: _object.position.z
			};
			var tween = new TWEEN.Tween(position).to(target, time);
			tween.easing(easing);
			tween.onUpdate(function(){
				_object.position.x = position.x;
				_object.position.y = position.y;
				_object.position.z = position.z;
			});
			animateGeneric(tween, function(){
				_object.userData.animate = false
				callback()	
			})
		}

		var onDocumentKeyDown = function (event) {

			dispatch(scripts.keydown, event);
		};

		var onDocumentKeyUp = function ( event ) {

			dispatch(scripts.keyup, event);
		};

		var onDocumentMouseDown = function (event) {
			getCoords(event);
			//console.log('down');
			//console.log(_Status);
			//event.preventDefault();
			var vector = new THREE.Vector3( mouse.x, mouse.y, -0.5 ).unproject( camera );
			var raycaster = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );
			var intersects = raycaster.intersectObjects( objects );
			if ( intersects.length > 0) {
				
				if ( INTERSECTED != intersects[ 0 ].object ) {
					//if ( INTERSECTED ) INTERSECTED.material.color.setHex( INTERSECTED.currentHex );
					INTERSECTED = intersects[ 0 ].object;
					//INTERSECTED.currentHex = INTERSECTED.material.color.getHex();
					plane.position.copy( INTERSECTED.position );
					//plane.position.y=0;
					//console.log(plane.position)
					//plane.lookAt( camera.position );
				}
				
				SELECTED = intersects[ 0 ].object;
				if (SELECTED.name != 'basement' && SELECTED.userData.fixed != true) {
					SELECTED.userData.moved=true;
					if (SELECTED.name != 'makarona' ) {
						rotateToZero2(SELECTED);
					}
					objects.forEach(function(_object, index){
						if (_object.userData.fixed == true) {
							_object.userData.moved = true;
							rotateToZero2(_object);
						};
					});
				}
				lastCoords = SELECTED.position.clone();
				if (SELECTED.userData.animate == true || SELECTED.userData.fixed == true) {
					SELECTED = null
					INTERSECTED = null
				}
				var intersects = raycaster.intersectObject( plane );
				offset.copy( intersects[ 0 ].point ).sub( plane.position );
				document.body.style.cursor = 'move';
			}
			dispatch( scripts.mousedown, event );
		};

		var onDocumentMouseUp = function ( event ) {
			//console.log(event)
			//getCoords(event);
			//event.preventDefault();
			//console.log('up')
			//console.log(_Status)
			//console.log(INTERSECTED)
			if (SELECTED) {
				//console.log('"position": ['+[SELECTED.position.x,SELECTED.position.y,SELECTED.position.z]+']')
				if (SELECTED.userData.fixed != true) {
					crashOne(SELECTED)
				};
				untouch();
			}
			/*if ( INTERSECTED ) {
				plane.position.copy( INTERSECTED.position );
				SELECTED = null;
			}*/
			//INTERSECTED = null;
			document.body.style.cursor = 'auto';
			dispatch( scripts.mouseup, event );
		};

		var onDocumentMouseMove = function (event) {
			//console.log('move')
			//console.log(_Status)
			event.preventDefault();
			
			getCoords(event);
			raycaster.setFromCamera( mouse, camera );
			if ( SELECTED ) {
				var intersects = raycaster.intersectObject( plane );
				SELECTED.position.copy( intersects[ 0 ].point.sub( offset ) );
				if (SELECTED.position.y<5) {
					if (SELECTED.userData.fixY) {
						if (SELECTED.userData.fixY==true) {
							SELECTED.position.y = 5;
						} else {
							SELECTED.userData.fixY=true
						}
					} else {
						SELECTED.userData.fixY=true
					}
					//SELECTED.position.y = 0
				}
				fixOnPosition(SELECTED);
				//rotateToZero(SELECTED);
				return;
			}
			var intersects = raycaster.intersectObjects( objects );
			//console.log(intersects)
			if ( intersects.length > 0 ) {
				if ( INTERSECTED != intersects[ 0 ].object ) {
					//if ( INTERSECTED ) INTERSECTED.material.color.setHex( INTERSECTED.currentHex );
					INTERSECTED = intersects[ 0 ].object;
					//INTERSECTED.currentHex = INTERSECTED.material.color.getHex();
					plane.position.copy( INTERSECTED.position );
					//plane.position.y = 0;
					//plane.lookAt( camera.position );
				}
				document.body.style.cursor = 'pointer';
			} else {
				//if ( INTERSECTED ) INTERSECTED.material.color.setHex( INTERSECTED.currentHex );
				INTERSECTED = null;
				document.body.style.cursor = 'auto';
			}
			dispatch( scripts.mousemove, event );
		};

	}

};
