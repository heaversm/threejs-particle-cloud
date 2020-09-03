var _w, _h;
var group;
var container, controls, stats;
var particlesData = [];
var camera, scene, renderer;
var positions, colors;
var particles;
var pointCloud;
var particlePositions;
var linesMesh;

var maxParticleCount = 1500;
var particleCount = 1000;
var r = 800;
var rHalf = r / 2;

var anim_speed = 1;
var anim = true;

var autoSave;

var gui;

var effectController = {
  morphing_speed: 0.05,
  animate: true,
  showDots: true,
  showLines: true,
  anim_speed: 1,
  minDistance: 0,
  limitConnections: false,
  maxConnections: 20,
  particleCount: 10,
};

var firstMorphHasOccurred = false;

init();
animate();
initGUI();
initTween();
initAudio();

var morphTarget = [];
var startMorph;
var morphStartedAt;
var targetShapes;

function initTextAnim() {
  console.log("init text anim");
  document.querySelector(".text-container").classList.toggle("active", true);
  anime({
    targets: ".text-container path",
    strokeDashoffset: [anime.setDashoffset, 0],
    easing: "easeInOutSine",
    duration: 5000,
    delay: function (el, i) {
      return i * 250;
    },
    direction: "alternate",
    loop: true,
  });
}

function initTween() {
  gsap.to(effectController, {
    minDistance: 120,
    particleCount: 500,
    duration: 5,
    onUpdate: function () {
      particleCount = parseInt(effectController.particleCount);
      particles.setDrawRange(0, particleCount);
    },
  });

  gsap.to(camera.position, {
    z: 3500,
    duration: 30,
    onComplete: () => {
      gsap.to(camera.position, {
        z: 200,
        duration: 5,
        delay: 30,
      });
    },
  });
}

function initAudio() {
  container.addEventListener("click", startAudio);
}

function startAudio() {
  container.removeEventListener("click", startAudio);
  document.getElementById("audio").play();
}

function initGUI() {
  gui = new dat.GUI();
  gui.add(effectController, "limitConnections");
  gui.add(effectController, "showLines").onChange(function (value) {
    linesMesh.visible = value;
  });
  gui.add(effectController, "showDots").onChange(function (value) {
    pointCloud.visible = value;
  });
  gui.add(effectController, "minDistance", 10, 300).listen();
  gui
    .add(effectController, "particleCount", 0, maxParticleCount, 1)
    .onChange(function (value) {
      particleCount = parseInt(value);
      particles.setDrawRange(0, particleCount);
    });
  gui.add(camera.position, "z", 1000, 5000).step(100);
  gui.close();
}

function init() {
  // initGUI();

  container = document.getElementById("container");
  _w = container.clientWidth;
  _h = container.clientHeight;
  console.log(_w, _h);

  camera = new THREE.PerspectiveCamera(45, _w / _h, 1, 4000);
  camera.position.z = 500;

  controls = new THREE.OrbitControls(camera, container);
  scene = new THREE.Scene();
  group = new THREE.Group();
  scene.add(group);

  var material = new THREE.MeshNormalMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.5,
  });

  var octGeom = new THREE.OctahedronGeometry(600, 0);
  var dodecGeom = new THREE.DodecahedronGeometry(600, 0);
  var sphereGeom = new THREE.SphereGeometry(600, 16, 16);
  var icoGeom = new THREE.IcosahedronGeometry(600, 0);
  var coneGeom = new THREE.ConeGeometry(600, 900, 32);
  var cylinderGeom = new THREE.CylinderGeometry(400, 600, 600, 32);
  var ringGeom = new THREE.RingGeometry(200, 600, 32);
  var torusGeom = new THREE.TorusKnotGeometry(600, 200, 100, 16);

  var shape1 = new THREE.Mesh(octGeom, material);
  shape1.points = [];

  var shape2 = new THREE.Mesh(sphereGeom, material);
  shape2.points = [];

  var shape3 = new THREE.Mesh(coneGeom, material);
  shape3.points = [];

  var shape4 = new THREE.Mesh(torusGeom, material);
  shape4.points = [];

  var shape5 = new THREE.Mesh(dodecGeom, material);
  shape5.points = [];

  var shape6 = new THREE.Mesh(cylinderGeom, material);
  shape6.points = [];

  targetShapes = [shape1, shape3, shape2, shape4, shape5, shape6];

  // var helper = new THREE.BoxHelper( new THREE.Mesh( new THREE.BoxGeometry( r, r, r ) ) );
  // helper.material.color.setHex( 0x080808 );
  // helper.material.blending = THREE.AdditiveBlending;
  // helper.material.transparent = true;
  // group.add( helper );

  var segments = maxParticleCount * maxParticleCount;

  positions = new Float32Array(segments * 3);
  // colors = new Float32Array( segments * 3 );
  colors = new Float32Array(segments * 3);

  var pMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 1,
    blending: THREE.AdditiveBlending,
    transparent: true,
    sizeAttenuation: false,
  });

  particles = new THREE.BufferGeometry();
  particlePositions = new Float32Array(maxParticleCount * 3);

  for (var i = 0; i < maxParticleCount; i++) {
    var x = Math.random() * r - r / 2;
    var y = Math.random() * r - r / 2;
    var z = Math.random() * r - r / 2;

    particlePositions[i * 3] = x;
    particlePositions[i * 3 + 1] = y;
    particlePositions[i * 3 + 2] = z;

    particlesData.push({
      velocity: new THREE.Vector3(
        -1 + Math.random() * 2,
        -1 + Math.random() * 2,
        -1 + Math.random() * 2
      ),
      numConnections: 0,
    });
  }

  particles.setDrawRange(0, particleCount);
  particles.addAttribute(
    "position",
    new THREE.BufferAttribute(particlePositions, 3).setDynamic(true)
  );

  pointCloud = new THREE.Points(particles, pMaterial);
  group.add(pointCloud);

  var geometry = new THREE.BufferGeometry();

  geometry.addAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3).setDynamic(true)
  );
  geometry.addAttribute(
    "color",
    new THREE.BufferAttribute(colors, 3).setDynamic(true)
  );

  geometry.computeBoundingSphere();

  geometry.setDrawRange(0, 0);

  var material = new THREE.LineBasicMaterial({
    vertexColors: THREE.VertexColors,
    blending: THREE.AdditiveBlending,
    color: 0xffffff,
    transparent: true,
  });

  linesMesh = new THREE.LineSegments(geometry, material);
  group.add(linesMesh);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(_w, _h);
  // renderer.setClearColor(new THREE.Color(0x110d0e, 1.0));

  renderer.gammaInput = true;
  renderer.gammaOutput = true;

  container.appendChild(renderer.domElement);

  stats = new Stats();
  stats.domElement.style.position = "absolute";
  stats.domElement.style.top = "0px";

  window.addEventListener("resize", onWindowResize, false);
}

function onWindowResize() {
  camera.aspect = _w / _h;
  camera.updateProjectionMatrix();

  renderer.setSize(_w, _h);
}

function intersect(cur_point, _target) {
  var direction = new THREE.Vector3(0, 0, 0);

  var startPoint = cur_point;

  var directionVector = direction.sub(startPoint);

  var ray = new THREE.Raycaster(
    startPoint,
    directionVector.clone().normalize()
  );

  scene.updateMatrixWorld(); // required, since you haven't rendered yet

  var rayIntersects = ray.intersectObjects([_target], true);

  if (rayIntersects[0]) {
    return rayIntersects[0].point;
  }
  return null;
}

function getObjectPoints(_target, _targetPoints) {
  group.add(_target);

  for (var i = 0; i < particleCount; i++) {
    var cur_pos = new THREE.Vector3(
      particlePositions[i * 3] * 1000,
      particlePositions[i * 3 + 1] * 1000,
      particlePositions[i * 3 + 2] * 1000
    );

    var inter_point = intersect(cur_pos, _target);
    if (inter_point) {
      _targetPoints.push(inter_point.clone());
    } else {
      _targetPoints.push(
        new THREE.Vector3(
          particlePositions[i * 3],
          particlePositions[i * 3 + 1],
          particlePositions[i * 3 + 2]
        )
      );
    }
  }

  group.remove(_target);
}
function getClosest() {
  for (var i = 0; i < particleCount; i++) {
    var min_dist = 3500;
    var min_i = 0;

    var cur_pos = new THREE.Vector3(
      particlePositions[i * 3],
      particlePositions[i * 3 + 1],
      particlePositions[i * 3 + 2]
    );

    var particleData = particlesData[i];

    for (var j = 0; j < morphTarget.length; j++) {
      var dx = cur_pos.x + particleData.velocity.x * 20 - morphTarget[j].x;
      var dy = cur_pos.y + particleData.velocity.y * 20 - morphTarget[j].y;
      var dz = cur_pos.z + particleData.velocity.z * 20 - morphTarget[j].z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < min_dist) {
        min_dist = dist;
        min_i = j;
      }
    }
    particlesData[i].cur_pos = morphTarget[min_i];

    morphTarget.splice(min_i, 1);
  }
}

function animate() {
  var vertexpos = 0;
  var colorpos = 0;
  var numConnected = 0;

  for (var i = 0; i < particleCount; i++) particlesData[i].numConnections = 0;

  for (var i = 0; i < particleCount; i++) {
    var particleData = particlesData[i];

    var zero = new THREE.Vector3(0, 0, 0);
    var cur_pos = new THREE.Vector3(
      particlePositions[i * 3],
      particlePositions[i * 3 + 1],
      particlePositions[i * 3 + 2]
    );

    if (anim) {
      if (startMorph) {
        if (
          counter - morphStartedAt >
          20 * (0.1 / effectController.morphing_speed)
        )
          startMorph = false;
        particlePositions[i * 3] =
          cur_pos.x * (1 - effectController.morphing_speed) +
          particlesData[i].cur_pos.x * effectController.morphing_speed;
        particlePositions[i * 3 + 1] =
          cur_pos.y * (1 - effectController.morphing_speed) +
          particlesData[i].cur_pos.y * effectController.morphing_speed;
        particlePositions[i * 3 + 2] =
          cur_pos.z * (1 - effectController.morphing_speed) +
          particlesData[i].cur_pos.z * effectController.morphing_speed;
      } else {
        particlePositions[i * 3] -=
          particleData.velocity.x * effectController.anim_speed;
        particlePositions[i * 3 + 1] -=
          particleData.velocity.y * effectController.anim_speed;
        particlePositions[i * 3 + 2] -=
          particleData.velocity.z * effectController.anim_speed;
      }
    }

    if (
      effectController.limitConnections &&
      particleData.numConnections >= effectController.maxConnections
    )
      continue;

    // Check collision
    for (var j = i + 1; j < particleCount; j++) {
      var particleDataB = particlesData[j];
      if (
        effectController.limitConnections &&
        particleDataB.numConnections >= effectController.maxConnections
      )
        continue;

      var dx = particlePositions[i * 3] - particlePositions[j * 3];
      var dy = particlePositions[i * 3 + 1] - particlePositions[j * 3 + 1];
      var dz = particlePositions[i * 3 + 2] - particlePositions[j * 3 + 2];

      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < effectController.minDistance) {
        particleData.numConnections++;
        particleDataB.numConnections++;

        var alpha = 1.0 - dist / effectController.minDistance;

        positions[vertexpos++] = particlePositions[i * 3];
        positions[vertexpos++] = particlePositions[i * 3 + 1];
        positions[vertexpos++] = particlePositions[i * 3 + 2];

        positions[vertexpos++] = particlePositions[j * 3];
        positions[vertexpos++] = particlePositions[j * 3 + 1];
        positions[vertexpos++] = particlePositions[j * 3 + 2];

        colors[colorpos++] = alpha;
        colors[colorpos++] = alpha;
        colors[colorpos++] = alpha;

        colors[colorpos++] = alpha;
        colors[colorpos++] = alpha;
        colors[colorpos++] = alpha;

        numConnected++;
      }
    }
  }

  linesMesh.geometry.setDrawRange(0, numConnected * 2);
  linesMesh.geometry.attributes.position.needsUpdate = true;
  linesMesh.geometry.attributes.color.needsUpdate = true;

  pointCloud.geometry.attributes.position.needsUpdate = true;

  requestAnimationFrame(animate);

  stats.update();
  render();
}
var frame = 0;
var frame_num = 0;
var counter = 0;
var current_shape = 0;

function render() {
  frame++;
  counter++;

  if (frame == 1) {
    for (var i = 0; i < targetShapes.length; i++) {
      getObjectPoints(targetShapes[i], targetShapes[i].points);
    }
  }

  var time = Date.now() * 0.001;
  group.rotation.y += (0.1 * Math.PI) / 180; //autorotate

  renderer.render(scene, camera);

  if (frame % 300 == 0) {
    //MH - controls when we begin morphing
    if (!firstMorphHasOccurred) {
      firstMorphHasOccurred = true;
      initTextAnim();
    }
    targetShapes[current_shape].points = [];
    getObjectPoints(
      targetShapes[current_shape],
      targetShapes[current_shape].points
    );

    morphTarget = targetShapes[current_shape].points.slice(0);

    getClosest();
    morphStartedAt = counter;
    startMorph = true;
    var prev_shape = current_shape;
    while (current_shape == prev_shape) {
      current_shape = Math.floor(Math.random() * targetShapes.length);
    }
    // console.log(current_shape);
  }
}
