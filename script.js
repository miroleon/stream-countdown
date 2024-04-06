// Define the initial countdown duration in minutes and seconds – up here for easy access
const countdownTime = {
    minutes: 0,
    seconds: 10
};

// Initialize variables for 3D scene parameters – up here for easy access
let targetFogDensity = 0.003;
let initialFogDensity = targetFogDensity * 1.25;
let initialCameraZ = 100;
let targetCameraZ = initialCameraZ*0.75;
let initialWallWidth = 10;
let wallScalar = 25;

// Store the start time of the countdown, initially unset
let startTime = null;

function startCountdown() {
    // Convert the initial countdown duration to total seconds
    let totalSeconds = countdownTime.minutes * 60 + countdownTime.seconds;

    // Access the ring progress element and retrieve its initial stroke offset, which is set in the CSS as 0
    const ringProgress = document.querySelector('.ring-progress');

    // This takes the intiial stroke-daharray that we set in the CSS
    // There we calculated the circumference to set the stroke-dasharray to form a full ring. This means C = 2π x radius, i.e. 2π x 40 = 251.2 (radius can be found in the svg element in the HTML)
    const initialRingOffset = parseFloat(getComputedStyle(ringProgress).getPropertyValue('stroke-dasharray'));

    // Record the current time as the start time of the countdown
    startTime = Date.now();

    // Create an interval to update the countdown every 100 milliseconds
    const countdownInterval = setInterval(() => {
        // Calculate elapsed time and remaining time in different units
        const elapsedMilliseconds = Date.now() - startTime;
        const remainingSeconds = totalSeconds - elapsedMilliseconds / 1000;
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = Math.floor(remainingSeconds % 60);

        // Update the countdown display with minutes and seconds
        // We first get the DOM elements for minutes and seconds
        // Then we set their inner text to the minutes and seconds
        // We check if the minutes and seconds are greater than 0 by using the ternary operator
        // A ternary operator is a shorthand for if-else statements and takes the form of condition ? exprIfTrue : exprIfFalse
        // If the condition is true, exprIfTrue is executed, otherwise exprIfFalse is executed
        // If the minutes or seconds are greater than 0, we we use padStart to pad the minutes and seconds with a leading 0, meaning that we force the minutes and seconds to be 2 digits long
        // If the minutes or seconds are less than 0,i.e. if the countdown ran out, we set the minutes and seconds to "00"
        document.getElementById('minutes').innerText = minutes > 0 ? minutes.toString().padStart(2, '0') : "00";
        document.getElementById('seconds').innerText = seconds > 0 ? seconds.toString().padStart(2, '0') : "00";

        // Calculate and apply the new stroke offset to the ring progress element
        // We calculate the progress percentage by dividing the remaining seconds by the total seconds and multiplying by 100
        // E.g. if we have 10 seconds remaining out of 100 seconds, the progress percentage is 10 / 100 * 100 = 10%
        const progressPercentage = (remainingSeconds / totalSeconds) * 100;

        // We calculate the new stroke offset by subtracting the progress percentage from 100 and dividing by 100 to get a value between 0 and 1
        // Then we multiply by the initial ring offset (i.e. 251.2) to get the new stroke offset (i.e. 251.2 * 0.9 = 226.08) and store it in ringOffset
        const ringOffset = (100 - progressPercentage) / 100 * initialRingOffset;

        // We set the stroke dash offset of the ring progress element to the new ring offset
        // In our example, this means we set the stroke dash offset to 226.08, which means that 90% of the ring is hidden
        ringProgress.style.strokeDashoffset = ringOffset;

        // Counting the number of times the interval runs
        console.log('Interval running');

        // Clear the interval so that it stops updating the countdown to save some CPU cycles
        if (remainingSeconds <= 0) {

            // Check whether the conditional is triggered
            console.log('Clearing interval');

            // Clear the interval
            clearInterval(countdownInterval);

            // Check whether the interval is cleared
            console.log('Interval cleared');
        }
    },
        // This is the update frequency in milliseconds, i.e. 100 milliseconds here. You may up this value to reduce the update frequency and save some CPU cycles. However, that will affect the smoothness of the countdown animation.
        100);
}

// Start the countdown when the window loads
window.onload = startCountdown;

// Import necessary modules from THREE.js for 3D rendering
import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';
import { RGBELoader } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/RenderPass.js';
import { AfterimagePass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/AfterimagePass.js';
import { UnrealBloomPass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FBXLoader } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/loaders/FBXLoader.js';

let composer;

let mixer;

// Setup the renderer with default background color and device aspect ratio
var renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas'), antialias: true });
renderer.setClearColor(0x11151c);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

const clock = new THREE.Clock();

var scene = new THREE.Scene();

// Add gradient HDR for light and color
const hdrEquirect = new RGBELoader()
    .setPath('https://miroleon.github.io/daily-assets/')
    .load('gradient.hdr', function () {

        hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;
    });

// Add gradient HDR to scene environment
scene.environment = hdrEquirect;

// Add fog (check top of the code for initalFogDensity)
scene.fog = new THREE.FogExp2(0x11151c, initialFogDensity);

// Set a camera amd position
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

// initialCameraZ is set at the top of the code
camera.position.z = initialCameraZ;
camera.position.y = 50;

// Material setup
// Add a relatively light color to the wall and set the envMap and envMapIntensity to ensure that the HDR has an effect
var wall_mat = new THREE.MeshPhysicalMaterial({
    color: 0xff7700,
    envMap: hdrEquirect,
    envMapIntensity: 0.5
});

// Set color black so that the human does NOT react to the HDR
var human_mat = new THREE.MeshStandardMaterial({
    color: 0x000000
});

// Set FBXLoader to load the 3D assets
const loader = new FBXLoader();
loader.load('https://miroleon.github.io/daily-assets/human_walk_04.fbx', function (human) {

    // Add mixer for animation
    mixer = new THREE.AnimationMixer(human);
    const action = mixer.clipAction(human.animations[0]);
    action.play();

    human.traverse(function (child) {
        if (child.isMesh) {
            child.material = human_mat;
        }

        human.position.set(0, 1.5, -100);
        human.scale.setScalar(0.05);
        human.rotation.y = 0;

    });

    scene.add(human);

});

// Create a simple plane to use as the wall and set position
const wall_geo = new THREE.PlaneGeometry(initialWallWidth, 100, 1, 1);
const wall = new THREE.Mesh(wall_geo, wall_mat);
scene.add(wall);
wall.position.set(0, 50, -110);

// POST PROCESSING
// Add RenderPass to use post processing
const renderScene = new RenderPass(scene, camera);

// Add AfterImage for a blurry move transition
const afterimagePass = new AfterimagePass();
afterimagePass.uniforms['damp'].value = 0.9;

// Add bloom parameters and bloom to add more glow to the objects to highlight the HDR reflections
const bloomparams = {
    exposure: 1,
    bloomStrength: 1.5,
    bloomThreshold: 0.1,
    bloomRadius: 1
};

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = bloomparams.bloomThreshold;
bloomPass.strength = bloomparams.bloomStrength;
bloomPass.radius = bloomparams.bloomRadius;

// Add all to the composer to send the post processing to the renderer
composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(afterimagePass);
composer.addPass(bloomPass);

// RESIZE
window.addEventListener('resize', onWindowResize);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Define easing function for smooth transitions
// The parameter t stands as a placeholder for progress later
function easeOutCubic(t) {
    // The function returns the value for 1-(1-t)^3, which is a cubic easing function
    // This allows us to turn in input value of, e.g., 0.5 into an output value of 0.875
    // Since 0 and 1 stay as they are, this means that the transition will be faster at the beginning and slower at the end
    return 1 - Math.pow(1 - t, 3);
}

// Update function to handle 3D scene updates based on countdown
function update() {
    const delta = clock.getDelta();

    if (startTime) {
        // Calculate remaining time
        const totalSeconds = countdownTime.minutes * 60 + countdownTime.seconds;
        const elapsedSeconds = (Date.now() - startTime) / 1000;
        const remainingSeconds = totalSeconds - elapsedSeconds;

        if (remainingSeconds > 0) {
            const progress = elapsedSeconds / totalSeconds;
            const easedProgress = easeOutCubic(progress);

            camera.position.z = initialCameraZ - (easedProgress * (initialCameraZ - targetCameraZ));

            console.log('camera z: ' + camera.position.z)

            scene.fog.density = initialFogDensity - (easedProgress * (initialFogDensity - targetFogDensity));

            console.log('fog density: ' + scene.fog.density)

            wall.scale.x = 1 + (wallScalar * easedProgress);
        }
    }

    // Update mixer
    if (mixer) mixer.update(delta / 1.5);
}

// Animation loop to render the 3D scene
function animate() {
    update();
    composer.render();
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);