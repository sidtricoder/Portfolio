import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import * as dat from 'dat.gui';
import gsap from 'gsap';

// 🌎 Scene Setup
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x87ceeb, 0.0008); // Add atmospheric fog

// 🎥 Camera (FPS-style)
const camera = new THREE.PerspectiveCamera(
    75, window.innerWidth / window.innerHeight, 0.1, 1000
);
camera.position.set(0, 2, 5);

// 🖥️ Renderer with enhanced settings
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x87ceeb); // Light blue sky color
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

// 🌟 Post-processing setup
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.3, // strength
    0.4, // radius
    0.85 // threshold
);
composer.addPass(bloomPass);

const outputPass = new OutputPass();
composer.addPass(outputPass);

// 🎛️ GUI Controls
const gui = new dat.GUI();
const params = {
    exposure: 1.0,
    bloomStrength: 0.3,
    bloomRadius: 0.4,
    bloomThreshold: 0.85,
    dayNightSpeed: 0.001,
    weatherEnabled: true,
    fogDensity: 0.0008
};

gui.add(params, 'exposure', 0.1, 2).onChange(value => {
    renderer.toneMappingExposure = value;
});
gui.add(params, 'bloomStrength', 0.0, 3.0).onChange(value => {
    bloomPass.strength = value;
});
gui.add(params, 'bloomRadius', 0.0, 1.0).onChange(value => {
    bloomPass.radius = value;
});
gui.add(params, 'bloomThreshold', 0.0, 1.0).onChange(value => {
    bloomPass.threshold = value;
});
gui.add(params, 'dayNightSpeed', 0.0, 0.01);
gui.add(params, 'weatherEnabled');
gui.add(params, 'fogDensity', 0.0, 0.005).onChange(value => {
    scene.fog.density = value;
});

// Hide GUI initially, show when 'G' is pressed
gui.domElement.style.display = 'none';

// 💡 Enhanced Lighting System
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

// Dynamic Sun and Directional Light
const sunLight = new THREE.DirectionalLight(0xfff3e0, 1.5);
sunLight.position.set(5, 10, 5);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 50;
sunLight.shadow.camera.left = -25;
sunLight.shadow.camera.right = 25;
sunLight.shadow.camera.top = 25;
sunLight.shadow.camera.bottom = -25;
scene.add(sunLight);

// Animated Sun with glow effect
const sunGeometry = new THREE.SphereGeometry(0.8, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xffff00,
    transparent: true,
    opacity: 0.9
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.position.set(5, 10, 5);
scene.add(sun);

// Sun Glow Effect
const sunGlowGeometry = new THREE.SphereGeometry(1.2, 32, 32);
const sunGlowMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 1.0 },
        color: { value: new THREE.Color(0xffaa00) }
    },
    vertexShader: `
        varying vec3 vNormal;
        void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        uniform vec3 color;
        varying vec3 vNormal;
        void main() {
            float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            gl_FragColor = vec4(color, intensity * (0.8 + 0.2 * sin(time * 2.0)));
        }
    `,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true
});
const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
sunGlow.position.copy(sun.position);
scene.add(sunGlow);

// Additional atmospheric lights
const moonLight = new THREE.DirectionalLight(0x6699ff, 0.3);
moonLight.position.set(-5, 8, -5);
moonLight.visible = false;
scene.add(moonLight);

// Point lights for mystical atmosphere (reduced for performance)
const mysticalLights = [];
for (let i = 0; i < 4; i++) {
    const light = new THREE.PointLight(0x66aaff, 0.5, 20);
    light.position.set(
        Math.random() * 200 - 100,
        2 + Math.random() * 8,
        Math.random() * 200 - 100
    );
    scene.add(light);
    mysticalLights.push(light);
}

// 🌿 Enhanced Ground with Water and Terrain Variety
const groundGeometry = new THREE.PlaneGeometry(1000, 1000, 50, 50);
const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x228B22,
    roughness: 0.8,
    metalness: 0.1
});

// Add some height variation to ground
const groundVertices = groundGeometry.attributes.position.array;
for (let i = 0; i < groundVertices.length; i += 3) {
    groundVertices[i + 2] = Math.random() * 0.5; // Z is height when rotated
}
groundGeometry.attributes.position.needsUpdate = true;
groundGeometry.computeVertexNormals();

const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
ground.receiveShadow = true;
scene.add(ground);

// 🌊 Water Feature
const waterGeometry = new THREE.PlaneGeometry(50, 50, 20, 20);
const waterMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 1.0 },
        color: { value: new THREE.Color(0x006994) },
        opacity: { value: 0.7 }
    },
    vertexShader: `
        uniform float time;
        varying vec2 vUv;
        void main() {
            vUv = uv;
            vec3 pos = position;
            pos.z += sin(pos.x * 0.5 + time) * 0.3;
            pos.z += sin(pos.y * 0.3 + time * 1.5) * 0.2;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        uniform vec3 color;
        uniform float opacity;
        varying vec2 vUv;
        void main() {
            vec2 uv = vUv;
            float wave = sin(uv.x * 10.0 + time) * sin(uv.y * 10.0 + time * 1.3) * 0.1;
            gl_FragColor = vec4(color + wave, opacity);
        }
    `,
    transparent: true,
    side: THREE.DoubleSide
});

const water = new THREE.Mesh(waterGeometry, waterMaterial);
water.rotation.x = -Math.PI / 2;
water.position.set(-60, 0.1, -60);
scene.add(water);

// 🏔️ Mountain Range with Flowing River
function createMountain(position, scale, height) {
    const mountainGeometry = new THREE.ConeGeometry(scale, height, 8, 3);
    const mountainMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8B7355,
        roughness: 0.9
    });
    
    // Deform the geometry for more natural look
    const vertices = mountainGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
        vertices[i] += (Math.random() - 0.5) * scale * 0.3;
        vertices[i + 2] += (Math.random() - 0.5) * scale * 0.3;
    }
    mountainGeometry.attributes.position.needsUpdate = true;
    mountainGeometry.computeVertexNormals();
    
    const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
    mountain.position.set(position.x, position.y, position.z);
    mountain.castShadow = true;
    mountain.receiveShadow = true;
    scene.add(mountain);
    
    // Add snow cap
    if (height > 15) {
        const snowGeometry = new THREE.ConeGeometry(scale * 0.7, height * 0.3, 8);
        const snowMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const snowCap = new THREE.Mesh(snowGeometry, snowMaterial);
        snowCap.position.set(position.x, position.y + height * 0.6, position.z);
        scene.add(snowCap);
    }
}

// Create mountain range in the background
const mountainPositions = [
    { x: -150, y: 8, z: -100, scale: 25, height: 20 },
    { x: -120, y: 10, z: -120, scale: 30, height: 25 },
    { x: -180, y: 6, z: -80, scale: 20, height: 18 },
    { x: 150, y: 12, z: -100, scale: 35, height: 30 },
    { x: 120, y: 8, z: -120, scale: 28, height: 22 },
    { x: 180, y: 10, z: -90, scale: 32, height: 26 }
];

mountainPositions.forEach(pos => {
    createMountain(pos, pos.scale, pos.height);
});

// 🌊 Flowing River from Mountains
function createRiver() {
    const riverPath = [
        { x: -150, z: -100 },
        { x: -120, z: -80 },
        { x: -90, z: -70 },
        { x: -70, z: -65 },
        { x: -60, z: -60 }
    ];
    
    for (let i = 0; i < riverPath.length - 1; i++) {
        const start = riverPath[i];
        const end = riverPath[i + 1];
        
        const riverSegmentGeometry = new THREE.PlaneGeometry(
            Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.z - start.z, 2)) || 20, 8, 10, 2
        );
        const riverSegmentMaterial = waterMaterial.clone();
        const riverSegment = new THREE.Mesh(riverSegmentGeometry, riverSegmentMaterial);
        
        riverSegment.position.set(
            (start.x + end.x) / 2,
            0.05,
            (start.z + end.z) / 2
        );
        riverSegment.rotation.x = -Math.PI / 2;
        riverSegment.rotation.z = Math.atan2(end.z - start.z, end.x - start.x);
        
        scene.add(riverSegment);
    }
}
createRiver();

// 🌿 Jungle Elements
function addJungleElements() {
    // Dense vegetation areas
    const jungleAreas = [
        { center: { x: -80, z: 50 }, radius: 30 },
        { center: { x: 60, z: -50 }, radius: 25 },
        { center: { x: 100, z: 80 }, radius: 35 }
    ];
    
    jungleAreas.forEach(area => {
        // Add dense bushes
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * area.radius;
            const x = area.center.x + Math.cos(angle) * distance;
            const z = area.center.z + Math.sin(angle) * distance;
            
            loadModel("/Models/plant_bushLarge.glb", [x, 0, z], [1 + Math.random(), 1 + Math.random(), 1 + Math.random()]);
        }
        
        // Add hanging moss
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * area.radius * 0.8;
            const x = area.center.x + Math.cos(angle) * distance;
            const z = area.center.z + Math.sin(angle) * distance;
            
            loadModel("/Models/hanging_moss.glb", [x, 3 + Math.random() * 2, z], [1, 1, 1]);
        }
        
        // Add mushroom groups
        for (let i = 0; i < 6; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * area.radius;
            const x = area.center.x + Math.cos(angle) * distance;
            const z = area.center.z + Math.sin(angle) * distance;
            
            const mushroomType = Math.random() > 0.5 ? "mushroom_redGroup.glb" : "mushroom_tanGroup.glb";
            loadModel(`/Models/${mushroomType}`, [x, 0, z], [1.2, 1.2, 1.2]);
        }
    });
    
    // Add lily pads near water
    for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 15 + Math.random() * 20;
        const x = -60 + Math.cos(angle) * distance;
        const z = -60 + Math.sin(angle) * distance;
        
        const lilyType = Math.random() > 0.5 ? "lily_large.glb" : "lily_small.glb";
        loadModel(`/Models/${lilyType}`, [x, 0.02, z], [1, 1, 1]);
    }
    
    // Scattered logs and rocks
    for (let i = 0; i < 20; i++) {
        const x = (Math.random() - 0.5) * 300;
        const z = (Math.random() - 0.5) * 300;
        
        if (Math.random() > 0.5) {
            const logType = ["log.glb", "log_large.glb", "log_stack.glb"][Math.floor(Math.random() * 3)];
            loadModel(`/Models/${logType}`, [x, 0, z], [1, 1, 1]);
        } else {
            const rockType = ["rock_smallA.glb", "rock_smallB.glb", "rock_smallC.glb"][Math.floor(Math.random() * 3)];
            loadModel(`/Models/${rockType}`, [x, 0, z], [1, 1, 1]);
        }
    }
    
    // Add various grass types
    for (let i = 0; i < 50; i++) {
        const x = (Math.random() - 0.5) * 400;
        const z = (Math.random() - 0.5) * 400;
        
        const grassType = ["grass.glb", "grass_large.glb", "grass_leafs.glb"][Math.floor(Math.random() * 3)];
        loadModel(`/Models/${grassType}`, [x, 0, z], [0.8 + Math.random() * 0.4, 0.8 + Math.random() * 0.4, 0.8 + Math.random() * 0.4]);
    }
}

// Initialize jungle elements
addJungleElements();

// 🎮 Player
const player = new THREE.Object3D();
player.position.set(0, 2, 0);
scene.add(player);
camera.position.set(0, 2, 5);
player.add(camera);

// 🕹️ Movement Variables
const movement = { forward: false, backward: false, left: false, right: false, jumping: false };
const speed = 0.1;
const gravity = -0.02;
let velocityY = 0;

// 🎬 Game State
let gameStarted = false;

// 🚀 Enhanced Start Game Function
function startGame() {
    gameStarted = true;
    document.getElementById("welcome-screen").style.display = "none";
    document.getElementById("loading").style.display = "none";
    
    if (window.innerWidth < 768) { // Only show controls on mobile
        document.getElementById("controls").style.display = "flex";
    } else {
        // Show HUD and teleport guide on desktop
        document.getElementById("hud").style.display = "block";
        document.getElementById("teleport-guide").style.display = "block";
    }
    
    // Hide GUI initially
    gui.domElement.style.display = 'none';
    
    animate(); // Start animation loop
}

document.getElementById("start-button").addEventListener("click", startGame);

// 🎮 Enhanced Game Initialization
function showLoadingScreen() {
    document.getElementById("loading").style.display = "block";
    setTimeout(() => {
        document.getElementById("loading").style.display = "none";
    }, 2000); // Show loading for 2 seconds
}

// Show loading screen on page load
showLoadingScreen();

// ⌨️ Enhanced Keyboard Controls
document.addEventListener("keydown", (event) => {
    if (!gameStarted) return; // Disable controls until game starts
    if (event.key === "w" || event.key === "ArrowUp") movement.forward = true;
    if (event.key === "s" || event.key === "ArrowDown") movement.backward = true;
    if (event.key === "a" || event.key === "ArrowLeft") movement.left = true;
    if (event.key === "d" || event.key === "ArrowRight") movement.right = true;
    if (event.key === " " && !movement.jumping) {
        velocityY = 0.3;
        movement.jumping = true;
    }
    // Toggle GUI with 'G' key
    if (event.key === "g" || event.key === "G") {
        gui.domElement.style.display = gui.domElement.style.display === 'none' ? 'block' : 'none';
    }
    // Teleport to different areas
    if (event.key === "1") teleportToArea("projects");
    if (event.key === "2") teleportToArea("education");
    if (event.key === "3") teleportToArea("certificates");
    if (event.key === "4") teleportToArea("water");
    if (event.key === "5") teleportToArea("center");
});

document.addEventListener("keyup", (event) => {
    if (!gameStarted) return;
    if (event.key === "w" || event.key === "ArrowUp") movement.forward = false;
    if (event.key === "s" || event.key === "ArrowDown") movement.backward = false;
    if (event.key === "a" || event.key === "ArrowLeft") movement.left = false;
    if (event.key === "d" || event.key === "ArrowRight") movement.right = false;
});

// 🎯 Mouse Look
let isLocked = false;
let rotationSpeed = 0.002;
document.body.addEventListener("click", () => {
    if (gameStarted) document.body.requestPointerLock();
});
document.addEventListener("pointerlockchange", () => isLocked = document.pointerLockElement === document.body);
document.addEventListener("mousemove", (event) => {
    if (isLocked && gameStarted) {
        player.rotation.y -= event.movementX * rotationSpeed;
        camera.rotation.x -= event.movementY * rotationSpeed;
        camera.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, camera.rotation.x));
    }
});

// 📱 Touch Controls for Camera
let touchStartX = 0, touchStartY = 0;
document.addEventListener("touchstart", (event) => {
    if (!gameStarted) return;
    if (event.touches.length === 2) {
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
    }
});
document.addEventListener("touchmove", (event) => {
    if (!gameStarted) return;
    if (event.touches.length === 2) {
        const deltaX = event.touches[0].clientX - touchStartX;
        const deltaY = event.touches[0].clientY - touchStartY;
        player.rotation.y -= deltaX * rotationSpeed;
        camera.rotation.x -= deltaY * rotationSpeed;
        camera.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, camera.rotation.x));
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
    }
});

// 🕹️ Joystick Controls
const joystickContainer = document.getElementById("joystick-container");
const joystick = document.getElementById("joystick");
let joystickActive = false;
let joystickOrigin = { x: 0, y: 0 };

joystickContainer.addEventListener("touchstart", (event) => {
    if (!gameStarted) return;
    joystickActive = true;
    const rect = joystickContainer.getBoundingClientRect();
    joystickOrigin.x = rect.left + rect.width / 2;
    joystickOrigin.y = rect.top + rect.height / 2;
});

joystickContainer.addEventListener("touchmove", (event) => {
    if (!gameStarted || !joystickActive) return;
    const touch = event.touches[0];
    let dx = touch.clientX - joystickOrigin.x;
    let dy = touch.clientY - joystickOrigin.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = 50;

    if (distance > maxDistance) {
        dx = (dx / distance) * maxDistance;
        dy = (dy / distance) * maxDistance;
    }

    joystick.style.left = `${25 + dx}px`;
    joystick.style.top = `${25 + dy}px`;

    movement.forward = dy < -10;
    movement.backward = dy > 10;
    movement.left = dx < -10;
    movement.right = dx > 10;
});

joystickContainer.addEventListener("touchend", () => {
    if (!gameStarted) return;
    joystickActive = false;
    joystick.style.left = "25px";
    joystick.style.top = "25px";
    movement.forward = false;
    movement.backward = false;
    movement.left = false;
    movement.right = false;
});

// ⬆️ Jump Button
document.getElementById("jump-button").addEventListener("touchstart", () => {
    if (!gameStarted || movement.jumping) return;
    velocityY = 0.3;
    movement.jumping = true;
});

// 📌 Clickable and Animated Objects
const clickableObjects = [];
const animatedObjects = [];
const arrows = [];
const particles = [];

// ✨ Particle System
class Particle {
    constructor(position, velocity, color, life) {
        this.position = position.clone();
        this.velocity = velocity.clone();
        this.color = color;
        this.life = life;
        this.maxLife = life;
        
        const geometry = new THREE.SphereGeometry(0.02 + Math.random() * 0.03);
        const material = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.8
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        scene.add(this.mesh);
    }
    
    update() {
        this.life -= 0.016; // Assuming 60fps
        this.position.add(this.velocity);
        this.velocity.multiplyScalar(0.98); // Drag
        this.mesh.position.copy(this.position);
        
        const alpha = this.life / this.maxLife;
        this.mesh.material.opacity = alpha * 0.8;
        
        if (this.life <= 0) {
            scene.remove(this.mesh);
            return false;
        }
        return true;
    }
}

function createParticleExplosion(position, color = 0xffffff, count = 20) {
    for (let i = 0; i < count; i++) {
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            Math.random() * 3 + 1,
            (Math.random() - 0.5) * 2
        );
        const particle = new Particle(position, velocity, color, 2 + Math.random() * 2);
        particles.push(particle);
    }
}

// 🚀 Teleportation System
function teleportToArea(area) {
    const positions = {
        "projects": new THREE.Vector3(40, 2, 40),
        "education": new THREE.Vector3(60, 2, 60),
        "certificates": new THREE.Vector3(80, 2, 80),
        "water": new THREE.Vector3(-60, 2, -60),
        "center": new THREE.Vector3(0, 2, 0)
    };
    
    if (positions[area]) {
        createParticleExplosion(player.position, 0x00ffff, 30);
        
        gsap.to(player.position, {
            x: positions[area].x,
            y: positions[area].y,
            z: positions[area].z,
            duration: 1.5,
            ease: "power2.inOut",
            onComplete: () => {
                createParticleExplosion(player.position, 0x00ff00, 30);
            }
        });
    }
}

// 🔎 Function to Make Objects Clickable and Add Enhanced Arrow
function makeClickable(object, section) {
    object.traverse((child) => {
        if (child.isMesh) {
            child.userData.section = section;
            clickableObjects.push(child);
        }
    });

    // Enhanced Animated Arrow with glow
    const arrowGeometry = new THREE.ConeGeometry(0.3, 0.8, 8);
    const arrowMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff0000,
        transparent: true,
        opacity: 0.8
    });
    const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
    arrow.position.set(object.position.x, object.position.y + 4, object.position.z);
    arrow.rotation.x = Math.PI; // Point downward
    
    // Add glow to arrow
    const arrowGlowGeometry = new THREE.ConeGeometry(0.4, 1.0, 8);
    const arrowGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0xff4444,
        transparent: true,
        opacity: 0.3
    });
    const arrowGlow = new THREE.Mesh(arrowGlowGeometry, arrowGlowMaterial);
    arrowGlow.position.copy(arrow.position);
    arrowGlow.rotation.x = Math.PI;
    
    scene.add(arrow);
    scene.add(arrowGlow);
    arrows.push({ arrow, glow: arrowGlow, baseY: arrow.position.y });
    
    // Add click particles effect
    arrow.userData.clickEffect = () => {
        createParticleExplosion(arrow.position, 0xff0000, 15);
    };
}

// 🔄 Enhanced Function to Load 3D Models with Effects
const loader = new GLTFLoader();
function loadModel(path, position, scale, section = null, animateType = null, special = false) {
    loader.load(path, (gltf) => {
        const model = gltf.scene;
        model.position.set(...position);
        model.scale.set(...scale);
        model.castShadow = true;
        model.receiveShadow = true;
        
        // Add special effects for important objects
        if (special) {
            const light = new THREE.PointLight(0x4444ff, 0.5, 10);
            light.position.copy(model.position);
            light.position.y += 3;
            scene.add(light);
            
            // Add floating particles around special objects
            setInterval(() => {
                if (Math.random() < 0.3) {
                    const particlePos = model.position.clone();
                    particlePos.add(new THREE.Vector3(
                        (Math.random() - 0.5) * 6,
                        Math.random() * 4 + 1,
                        (Math.random() - 0.5) * 6
                    ));
                    const velocity = new THREE.Vector3(0, 0.1, 0);
                    const particle = new Particle(particlePos, velocity, 0x4444ff, 3);
                    particles.push(particle);
                }
            }, 1000);
        }
        
        scene.add(model);
        if (section) makeClickable(model, section);
        if (animateType) animatedObjects.push({ object: model, type: animateType, originalY: model.position.y });
    });
}

// 🌳 Enhanced Tree System with Variety and Clustering
const treeTypes = [
    'tree_pineTallA.glb', 'tree_pineTallB.glb', 'tree_palmTall.glb', 'tree_default.glb',
    'tree_oak.glb', 'tree_simple.glb', 'tree_tall.glb', 'tree_pineRoundA.glb'
];

// Create tree clusters for more natural look
const treeClusters = [
    { center: { x: 0, z: 30 }, radius: 25, density: 40 },
    { center: { x: -40, z: -20 }, radius: 20, density: 30 },
    { center: { x: 60, z: 10 }, radius: 15, density: 25 },
    { center: { x: 20, z: -50 }, radius: 18, density: 35 }
];

treeClusters.forEach((cluster, clusterIndex) => {
    for (let i = 0; i < cluster.density; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * cluster.radius;
        const x = cluster.center.x + Math.cos(angle) * distance;
        const z = cluster.center.z + Math.sin(angle) * distance;
        
        const treeType = treeTypes[Math.floor(Math.random() * treeTypes.length)];
        const scale = 1.5 + Math.random() * 1.5;
        
        loadModel(`/Models/${treeType}`, [x, 0, z], [scale, scale, scale]);
    }
});

// 🏰 Floating Islands for Major Sections
function createFloatingIsland(position, size, section) {
    // Island base
    const islandGeometry = new THREE.CylinderGeometry(size, size * 0.8, 2, 32);
    const islandMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8B4513,
        roughness: 0.8
    });
    const island = new THREE.Mesh(islandGeometry, islandMaterial);
    island.position.set(position.x, position.y + 3, position.z);
    island.castShadow = true;
    island.receiveShadow = true;
    scene.add(island);
    
    // Grass top
    const grassGeometry = new THREE.CylinderGeometry(size * 1.1, size * 1.1, 0.2, 32);
    const grassMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    const grass = new THREE.Mesh(grassGeometry, grassMaterial);
    grass.position.set(position.x, position.y + 4.1, position.z);
    scene.add(grass);
    
    // Make island float
    animatedObjects.push({ 
        object: island, 
        type: "float", 
        originalY: island.position.y,
        partner: grass
    });
    
    return island;
}

// Create floating islands for different sections
const projectIsland = createFloatingIsland({ x: 40, y: 5, z: 40 }, 8, "projects");
const educationIsland = createFloatingIsland({ x: -50, y: 7, z: 50 }, 6, "education");
const certificateIsland = createFloatingIsland({ x: 80, y: 6, z: -30 }, 7, "certificates");

// 📜 Personal Information (Enhanced Signpost with Portal Effect)
loadModel("/Models/sign.glb", [
    8,
    0,
    8
], [2, 2, 2], "Personal Information", null, true);

// Add mystical portal near signpost
const portalGeometry = new THREE.RingGeometry(1, 2, 32);
const portalMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 1.0 },
        color1: { value: new THREE.Color(0x00ffff) },
        color2: { value: new THREE.Color(0xff00ff) }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        uniform vec3 color1;
        uniform vec3 color2;
        varying vec2 vUv;
        void main() {
            vec2 center = vec2(0.5, 0.5);
            float dist = distance(vUv, center);
            float wave = sin(dist * 20.0 - time * 5.0) * 0.5 + 0.5;
            vec3 color = mix(color1, color2, wave);
            float alpha = smoothstep(0.3, 0.5, dist) * (1.0 - smoothstep(0.48, 0.5, dist));
            gl_FragColor = vec4(color, alpha);
        }
    `,
    transparent: true,
    side: THREE.DoubleSide
});
const portal = new THREE.Mesh(portalGeometry, portalMaterial);
portal.position.set(12, 2, 8);
portal.rotation.x = -Math.PI / 2;
scene.add(portal);
animatedObjects.push({ object: portal, type: "portal" });

// 🪨 Enhanced Project Displays with Variety
const projectRocks = [
    { model: "rock_largeA.glb", pos: [35, 0, 35], section: "Star Classification" },
    { model: "rock_largeB.glb", pos: [45, 0, 40], section: "Pneumonia Detection" },
    { model: "rock_largeC.glb", pos: [40, 0, 50], section: "Grocery Management" },
    { model: "statue_obelisk.glb", pos: [50, 0, 35], section: "Restaurant Management" },
    { model: "rock_largeD.glb", pos: [35, 0, 45], section: "Travel Genie" },
    { model: "statue_column.glb", pos: [45, 0, 50], section: "Interest Calculator" }
];

projectRocks.forEach((rock, index) => {
    loadModel(`/Models/${rock.model}`, rock.pos, [2.5, 2.5, 2.5], rock.section, "glow", true);
    
    // Add surrounding details
    if (index % 2 === 0) {
        loadModel("/Models/campfire_stones.glb", [
            rock.pos[0] + 3,
            0,
            rock.pos[2] + 3
        ], [1, 1, 1], null, "fire");
    }
});

// � Enhanced Education Flowers with Magical Effects
function addEnhancedFlower(position, label, color = 0xFF69B4) {
    const stemGeometry = new THREE.CylinderGeometry(0.08, 0.08, 1.5, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x00AA00 });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.set(position[0], 0.75, position[1]);
    stem.castShadow = true;
    stem.receiveShadow = true;
    scene.add(stem);

    // Multi-layered petals
    for (let i = 0; i < 3; i++) {
        const petalGeometry = new THREE.SphereGeometry(0.3 - i * 0.05, 8, 6);
        const petalMaterial = new THREE.MeshStandardMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.8 - i * 0.1
        });
        const petal = new THREE.Mesh(petalGeometry, petalMaterial);
        petal.position.set(position[0], 1.5 + i * 0.1, position[1]);
        petal.scale.y = 0.3;
        petal.castShadow = true;
        petal.receiveShadow = true;
        scene.add(petal);
        
        if (i === 0) makeClickable(petal, label);
        animatedObjects.push({ object: petal, type: "flower", originalY: petal.position.y });
    }
}

addEnhancedFlower([-45, 45], "Class X", 0xFF1493);
addEnhancedFlower([-50, 55], "Class XII", 0xFF69B4);
addEnhancedFlower([-55, 50], "IIIT Bangalore", 0x9370DB);

// 🏆 Enhanced Certificate Monuments
const certificateModels = [
    { model: "statue_obelisk.glb", pos: [75, 0, -25], section: "Data Science Certification" },
    { model: "statue_column.glb", pos: [85, 0, -30], section: "Machine Learning Certification" },
    { model: "statue_columnDamaged.glb", pos: [80, 0, -35], section: "Python Basic Certification" },
    { model: "statue_ring.glb", pos: [90, 0, -25], section: "JEE Mains" },
    { model: "statue_head.glb", pos: [75, 0, -35], section: "JEE Advanced" },
    { model: "statue_block.glb", pos: [85, 0, -40], section: "NDA Qualified" }
];

certificateModels.forEach((cert, index) => {
    loadModel(`/Models/${cert.model}`, cert.pos, [1.5, 1.5, 1.5], cert.section, "monument", true);
    
    // Add torch-like lighting around certificates
    const torchLight = new THREE.PointLight(0xffaa00, 1, 8);
    torchLight.position.set(cert.pos[0] + 2, 3, cert.pos[2] + 2);
    torchLight.castShadow = true;
    scene.add(torchLight);
});

// 🛶 Enhanced Canoe with Water Trail
loadModel("/Models/canoe.glb", [-55, 0.1, -55], [2.5, 2.5, 2.5], null, "canoe");
loadModel("/Models/canoe_paddle.glb", [-53, 0.5, -57], [1.5, 1.5, 1.5], null, "paddle");

// 🌟 Mystical Elements (Optimized)
// Floating crystals (reduced for performance)
for (let i = 0; i < 6; i++) {
    const crystalGeometry = new THREE.OctahedronGeometry(0.5);
    const crystalMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(Math.random(), 0.8, 0.6),
        transparent: true,
        opacity: 0.7
    });
    const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
    crystal.position.set(
        (Math.random() - 0.5) * 200,
        5 + Math.random() * 10,
        (Math.random() - 0.5) * 200
    );
    scene.add(crystal);
    animatedObjects.push({ 
        object: crystal, 
        type: "crystal", 
        originalY: crystal.position.y,
        rotationSpeed: (Math.random() - 0.5) * 0.02
    });
}

// 🔎 Enhanced Raycasting for Click Detection with Visual Feedback
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseClick(event) {
    if (!gameStarted) return;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(clickableObjects, true);

    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        if (clickedObject.userData.section) {
            // Create click effect
            createParticleExplosion(intersects[0].point, 0xffffff, 25);
            showPortfolioSection(clickedObject.userData.section);
            
            // Add click sound effect (placeholder for future audio implementation)
            console.log("Click sound effect triggered");
        }
    }
}
window.addEventListener("click", onMouseClick);
window.addEventListener("touchstart", (event) => {
    if (!gameStarted || event.touches.length !== 1) return;
    mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(clickableObjects, true);
    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        if (clickedObject.userData.section) {
            showPortfolioSection(clickedObject.userData.section);
        }
    }
});

// 📝 Show Portfolio Section in Pop-up
function showPortfolioSection(section) {
    const popup = document.getElementById("portfolio-popup");
    const popupTitle = document.getElementById("popup-title");
    const popupDescription = document.getElementById("popup-description");

    let descriptions = {
        "Personal Information": "Siddharth Brijesh Tripathi\nAhmedabad, Gujarat - India\n+917622085960\nsiddharth.tripathi@iiitb.ac.in\nLinkedIn: siddharth-brijesh-tripathi\nGitHub: siddh-coder\nEmail: siddharthtripathi3824@gmail.com\n\nObjective: Actively seeking internship opportunities in Data Science, Machine Learning, and AI. Passionate about applying analytical skills, machine learning models, and software development expertise to real-world problems.",
        "Star Classification": "Built a web app to classify stars, galaxies, and quasars using photometric data with 7 pre-trained models (SVM, Random Forest, etc.) and majority voting. Featured interactive inputs and educational content (Streamlit, scikit-learn, Jan 2025).",
        "Pneumonia Detection": "A web app to detect pneumonia from chest X-ray images using DenseNet121, ResNet50, and Inception_v3 with an ensemble prediction. CPU-compatible with Streamlit for image uploads (Flask, PyTorch, Dec 2024).",
        "Grocery Management": "CLI tool with options to add/remove items and place orders, implemented with file-based storage (C, Nov 2024).",
        "Restaurant Management": "GUI tool to streamline restaurant operations, built with Tkinter (Python, Tkinter, Oct 2024).",
        "Travel Genie": "Web app for travel planning using destination and dates, developed with Streamlit and Google Generative AI (Streamlit, Sep 2024).",
        "Interest Calculator": "GUI application to calculate Simple and Compound Interest, utilized Java Swing for the interface (Java, Java Swing, May 2022).",
        "Class X": "CISCE (ICSE) Class X - 97.83% (July 2022)",
        "Class XII": "CBSE Class XII - 94.00% (May 2024)",
        "IIIT Bangalore": "IIIT Bangalore - Integrated MTech in Computer Science and Engineering, 3.46/4.00 (Expected 2029)",
        "Data Science Certification": "Data Science Certification - Finlatics (Oct 2024)",
        "Machine Learning Certification": "Machine Learning Certification - Finlatics (Oct 2024)",
        "Python Basic Certification": "Python (Basic) Certification - HackerRank (Aug 2024)",
        "JEE Mains": "JEE Mains: Rank 7195 (April 2024)",
        "JEE Advanced": "JEE Advanced: Rank 11172 (June 2024)",
        "NDA Qualified": "Qualified NDA Written Exam (April 2024)",
    };

    popupTitle.innerText = section;
    popupDescription.innerText = descriptions[section] || "More details coming soon.";

    popup.style.display = "flex";
    popup.classList.add("fade-in");
}

// 🚪 Close Pop-up
document.getElementById("close-popup").addEventListener("click", () => {
    const popup = document.getElementById("portfolio-popup");
    popup.classList.remove("fade-in");
    setTimeout(() => {
        popup.style.display = "none";
    }, 300);
});

// 📏 Handle Window Resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    
    // Update bloom pass
    bloomPass.setSize(window.innerWidth, window.innerHeight);
    
    // Ensure controls visibility updates on resize
    if (gameStarted) {
        document.getElementById("controls").style.display = window.innerWidth < 768 ? "flex" : "none";
    }
}
window.addEventListener("resize", onWindowResize);

// 📊 HUD and UI Management
function updateHUD() {
    if (gameStarted) {
        document.getElementById('fps').textContent = Math.round(1 / 0.016);
        document.getElementById('objects').textContent = scene.children.length;
        document.getElementById('position').textContent = 
            `${Math.round(player.position.x)}, ${Math.round(player.position.y)}, ${Math.round(player.position.z)}`;
    }
}

// Update HUD every second
setInterval(updateHUD, 1000);

// 🎬 Enhanced Animation Loop with Day/Night Cycle and Advanced Effects
let time = 0;
let dayNightCycle = 0;

function animate() {
    time += 0.016; // Assuming 60fps
    dayNightCycle += params.dayNightSpeed;
    
    if (!gameStarted) {
        composer.render(); // Use composer for post-processing
        requestAnimationFrame(animate);
        return;
    }

    requestAnimationFrame(animate);

    // Player Movement
    let moveX = 0, moveZ = 0;
    if (movement.forward) moveZ -= speed;
    if (movement.backward) moveZ += speed;
    if (movement.left) moveX -= speed;
    if (movement.right) moveX += speed;

    let playerDirection = new THREE.Vector3(moveX, 0, moveZ);
    playerDirection.applyEuler(player.rotation);
    player.position.add(playerDirection);

    // Gravity and Jumping
    velocityY += gravity;
    player.position.y += velocityY;

    if (player.position.y <= 2) {
        player.position.y = 2;
        movement.jumping = false;
        velocityY = 0;
    }

    // Day/Night Cycle
    const dayIntensity = (Math.sin(dayNightCycle) + 1) / 2;
    const nightIntensity = 1 - dayIntensity;
    
    sunLight.intensity = dayIntensity * 1.5;
    moonLight.intensity = nightIntensity * 0.8;
    ambientLight.intensity = 0.2 + dayIntensity * 0.3;
    
    // Update sun position
    const sunAngle = dayNightCycle;
    sun.position.x = Math.cos(sunAngle) * 20;
    sun.position.y = Math.sin(sunAngle) * 15 + 5;
    sun.position.z = 5;
    sunLight.position.copy(sun.position);
    sunGlow.position.copy(sun.position);
    
    // Update sun glow shader
    sunGlowMaterial.uniforms.time.value = time;
    
    // Update water shader
    waterMaterial.uniforms.time.value = time;
    
    // Update portal shader
    if (portalMaterial) {
        portalMaterial.uniforms.time.value = time;
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        if (!particles[i].update()) {
            particles.splice(i, 1);
        }
    }

    // Animate mystical lights
    mysticalLights.forEach((light, index) => {
        light.intensity = 0.3 + Math.sin(time * 2 + index) * 0.2;
        light.position.y = 2 + Math.sin(time + index) * 2;
    });

    // Enhanced Object Animations (Optimized)
    animatedObjects.forEach((obj, index) => {
        switch (obj.type) {
            case "canoe":
                obj.object.position.y = Math.sin(time * 2) * 0.15 + 0.1;
                obj.object.rotation.z = Math.sin(time * 1.5) * 0.05;
                break;
                
            case "float":
                obj.object.position.y = obj.originalY + Math.sin(time + index) * 0.5;
                if (obj.partner) {
                    obj.partner.position.y = obj.object.position.y + 1.1;
                }
                break;
                
            case "fire":
                obj.object.position.y = Math.sin(time * 4 + index) * 0.1;
                break;
                
            case "crystal":
                obj.object.position.y = obj.originalY + Math.sin(time + index * 0.8) * 1.5;
                obj.object.rotation.y += obj.rotationSpeed;
                break;
                
            case "portal":
                obj.object.rotation.z += 0.01;
                break;
        }
    });

    // Enhanced Arrow Animations (Optimized)
    if (time % 0.1 < 0.016) { // Update arrows less frequently
        arrows.forEach((arrowData, index) => {
            const { arrow, glow, baseY } = arrowData;
            const newY = baseY + Math.sin(time * 2 + index * 0.5) * 0.5;
            arrow.position.y = newY;
            glow.position.y = newY;
            
            // Pulsing glow effect
            glow.material.opacity = 0.2 + Math.sin(time * 3 + index) * 0.1;
        });
    }

    // Weather effects (if enabled and reduced frequency)
    if (params.weatherEnabled && Math.random() < 0.005) {
        // Occasional magical sparkles
        const sparklePos = new THREE.Vector3(
            player.position.x + (Math.random() - 0.5) * 20,
            player.position.y + Math.random() * 10,
            player.position.z + (Math.random() - 0.5) * 20
        );
        const sparkleVel = new THREE.Vector3(0, 0.2, 0);
        const sparkle = new Particle(sparklePos, sparkleVel, 0xffffaa, 1.5);
        particles.push(sparkle);
    }

    composer.render();
}
animate(); // Start with static rendering until game begins
