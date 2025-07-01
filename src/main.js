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
scene.fog = new THREE.FogExp2(0x87ceeb, 0.0008);

// 🎥 Camera (FPS-style)
const camera = new THREE.PerspectiveCamera(
    75, window.innerWidth / window.innerHeight, 0.1, 1000
);
camera.position.set(0, 2, 5);

// 🖥️ Renderer with enhanced settings
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x87ceeb);
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
    0.3, 0.4, 0.85
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

// GUI setup
gui.add(params, 'exposure', 0.1, 2).onChange(value => {
    renderer.toneMappingExposure = value;
});
gui.add(params, 'bloomStrength', 0.0, 3.0).onChange(value => {
    bloomPass.strength = value;
});
gui.add(params, 'fogDensity', 0.0, 0.005).onChange(value => {
    scene.fog.density = value;
});
gui.domElement.style.display = 'none';

// 💡 Enhanced Lighting System
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

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

// 🌿 Enhanced Ground
const groundGeometry = new THREE.PlaneGeometry(1000, 1000, 50, 50);
const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x228B22,
    roughness: 0.8,
    metalness: 0.1
});

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

// 🏔️ Simple Mountains
function createMountain(position, scale, height) {
    const mountainGeometry = new THREE.ConeGeometry(scale, height, 8);
    const mountainMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8B7355,
        roughness: 0.9
    });
    
    const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
    mountain.position.set(position.x, position.y, position.z);
    mountain.castShadow = true;
    mountain.receiveShadow = true;
    scene.add(mountain);
}

// Create mountain range
const mountainPositions = [
    { x: -150, y: 8, z: -100 },
    { x: -120, y: 10, z: -120 },
    { x: 150, y: 12, z: -100 },
    { x: 120, y: 8, z: -120 }
];

mountainPositions.forEach(pos => {
    createMountain(pos, 25, 20);
});

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
let gameStarted = false;

// 📊 Arrays for objects and animations
const clickableObjects = [];
const animatedObjects = [];
const arrows = [];
const particles = [];

// ✨ Particle System
class Particle {
    constructor(position, velocity, color, life) {
        this.position = position.clone();
        this.velocity = velocity.clone();
        this.life = life;
        this.maxLife = life;
        
        const geometry = new THREE.SphereGeometry(0.02);
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
        this.life -= 0.016;
        this.position.add(this.velocity);
        this.velocity.multiplyScalar(0.98);
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

function createParticleExplosion(position, color = 0xffffff, count = 15) {
    for (let i = 0; i < count; i++) {
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            Math.random() * 2 + 1,
            (Math.random() - 0.5) * 2
        );
        const particle = new Particle(position, velocity, color, 1 + Math.random());
        particles.push(particle);
    }
}

// 🚀 Teleportation System
function teleportToArea(area) {
    const positions = {
        "projects": new THREE.Vector3(40, 2, 40),
        "education": new THREE.Vector3(-50, 2, 50),
        "certificates": new THREE.Vector3(80, 2, -30),
        "water": new THREE.Vector3(-60, 2, -60),
        "center": new THREE.Vector3(0, 2, 0)
    };
    
    if (positions[area]) {
        createParticleExplosion(player.position, 0x00ffff, 20);
        
        gsap.to(player.position, {
            x: positions[area].x,
            y: positions[area].y,
            z: positions[area].z,
            duration: 1.5,
            ease: "power2.inOut",
            onComplete: () => {
                createParticleExplosion(player.position, 0x00ff00, 20);
            }
        });
    }
}

// 🚀 Start Game Function
function startGame() {
    gameStarted = true;
    document.getElementById("welcome-screen").style.display = "none";
    document.getElementById("loading").style.display = "none";
    
    if (window.innerWidth < 768) {
        document.getElementById("controls").style.display = "flex";
    } else {
        document.getElementById("hud").style.display = "block";
        document.getElementById("teleport-guide").style.display = "block";
    }
    
    animate();
}

// 📊 HUD Management
function updateHUD() {
    if (gameStarted) {
        const hud = document.getElementById('hud');
        if (hud) {
            const fps = document.getElementById('fps');
            const objects = document.getElementById('objects');
            const position = document.getElementById('position');
            
            if (fps) fps.textContent = Math.round(1 / 0.016);
            if (objects) objects.textContent = scene.children.length;
            if (position) {
                position.textContent = 
                    `${Math.round(player.position.x)}, ${Math.round(player.position.y)}, ${Math.round(player.position.z)}`;
            }
        }
    }
}

setInterval(updateHUD, 1000);

// 🎮 Enhanced Keyboard Controls
document.addEventListener("keydown", (event) => {
    if (!gameStarted) return;
    if (event.key === "w" || event.key === "ArrowUp") movement.forward = true;
    if (event.key === "s" || event.key === "ArrowDown") movement.backward = true;
    if (event.key === "a" || event.key === "ArrowLeft") movement.left = true;
    if (event.key === "d" || event.key === "ArrowRight") movement.right = true;
    if (event.key === " " && !movement.jumping) {
        velocityY = 0.3;
        movement.jumping = true;
    }
    if (event.key === "g" || event.key === "G") {
        const isVisible = gui.domElement.style.display !== 'none';
        gui.domElement.style.display = isVisible ? 'none' : 'block';
        
        // Position the GUI panel to avoid overlap with teleport guide
        if (!isVisible) {
            gui.domElement.style.position = 'fixed';
            gui.domElement.style.top = '20px';
            gui.domElement.style.right = '250px'; // Offset from teleport guide
            gui.domElement.style.zIndex = '1600';
        }
    }
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

document.addEventListener("pointerlockchange", () => {
    isLocked = document.pointerLockElement === document.body;
});

document.addEventListener("mousemove", (event) => {
    if (isLocked && gameStarted) {
        player.rotation.y -= event.movementX * rotationSpeed;
        camera.rotation.x -= event.movementY * rotationSpeed;
        camera.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, camera.rotation.x));
    }
});

// 🕹️ Mobile Controls
const joystickContainer = document.getElementById("joystick-container");
const joystick = document.getElementById("joystick");
let joystickActive = false;
let joystickOrigin = { x: 0, y: 0 };

if (joystickContainer) {
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
}

// Jump Button
const jumpButton = document.getElementById("jump-button");
if (jumpButton) {
    jumpButton.addEventListener("touchstart", () => {
        if (!gameStarted || movement.jumping) return;
        velocityY = 0.3;
        movement.jumping = true;
    });
}

// 🔄 Enhanced 3D Model Loading
const loader = new GLTFLoader();
function loadModel(path, position, scale, section = null, animateType = null) {
    loader.load(path, (gltf) => {
        const model = gltf.scene;
        model.position.set(...position);
        model.scale.set(...scale);
        model.castShadow = true;
        model.receiveShadow = true;
        scene.add(model);
        
        if (section) makeClickable(model, section);
        if (animateType) animatedObjects.push({ object: model, type: animateType, originalY: model.position.y });
    });
}

// 🔎 Make Objects Clickable
function makeClickable(object, section) {
    object.traverse((child) => {
        if (child.isMesh) {
            child.userData.section = section;
            clickableObjects.push(child);
        }
    });

    // Enhanced Arrow
    const arrowGeometry = new THREE.ConeGeometry(0.3, 0.8, 8);
    const arrowMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff0000,
        transparent: true,
        opacity: 0.8
    });
    const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
    arrow.position.set(object.position.x, object.position.y + 4, object.position.z);
    arrow.rotation.x = Math.PI;
    
    scene.add(arrow);
    arrows.push({ arrow, baseY: arrow.position.y });
}

// Load Portfolio Elements
loadModel("/Models/sign.glb", [8, 0, 8], [2, 2, 2], "Personal Information");

// Projects
loadModel("/Models/rock_largeA.glb", [35, 0, 35], [2.5, 2.5, 2.5], "Star Classification");
loadModel("/Models/rock_largeB.glb", [45, 0, 40], [2.5, 2.5, 2.5], "Pneumonia Detection");
loadModel("/Models/rock_largeC.glb", [40, 0, 50], [2.5, 2.5, 2.5], "Grocery Management");

// Education
function addFlower(position, label, color = 0xFF69B4) {
    const stemGeometry = new THREE.CylinderGeometry(0.08, 0.08, 1.5, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x00AA00 });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.set(position[0], 0.75, position[1]);
    scene.add(stem);

    const petalGeometry = new THREE.SphereGeometry(0.3, 8, 6);
    const petalMaterial = new THREE.MeshStandardMaterial({ color: color });
    const petal = new THREE.Mesh(petalGeometry, petalMaterial);
    petal.position.set(position[0], 1.5, position[1]);
    petal.scale.y = 0.3;
    scene.add(petal);
    
    makeClickable(petal, label);
}

addFlower([-45, 45], "Class X", 0xFF1493);
addFlower([-50, 55], "Class XII", 0xFF69B4);
addFlower([-55, 50], "IIIT Bangalore", 0x9370DB);

// Certificates
loadModel("/Models/statue_obelisk.glb", [75, 0, -25], [1.5, 1.5, 1.5], "Data Science Certification");
loadModel("/Models/statue_column.glb", [85, 0, -30], [1.5, 1.5, 1.5], "Machine Learning Certification");
loadModel("/Models/statue_ring.glb", [90, 0, -25], [1.5, 1.5, 1.5], "JEE Mains");

// Trees
const treeTypes = ['tree_pineTallA.glb', 'tree_oak.glb', 'tree_simple.glb', 'tree_tall.glb'];
for (let i = 0; i < 30; i++) {
    const treeType = treeTypes[Math.floor(Math.random() * treeTypes.length)];
    const x = (Math.random() - 0.5) * 200;
    const z = (Math.random() - 0.5) * 200;
    loadModel(`/Models/${treeType}`, [x, 0, z], [1.5, 1.5, 1.5]);
}

// 🔎 Click Detection
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
            createParticleExplosion(intersects[0].point, 0xffffff, 15);
            showPortfolioSection(clickedObject.userData.section);
        }
    }
}

window.addEventListener("click", onMouseClick);

// 📝 Portfolio Section Display
function showPortfolioSection(section) {
    const popup = document.getElementById("portfolio-popup");
    const popupTitle = document.getElementById("popup-title");
    const popupDescription = document.getElementById("popup-description");

    const descriptions = {
        "Personal Information": "Siddharth Brijesh Tripathi\\nAhmedabad, Gujarat - India\\n+917622085960\\nsiddharth.tripathi@iiitb.ac.in\\nLinkedIn: siddharth-brijesh-tripathi\\nGitHub: siddh-coder\\n\\nObjective: Seeking internship opportunities in Data Science, Machine Learning, and AI.",
        "Star Classification": "Built a web app to classify stars, galaxies, and quasars using photometric data with 7 pre-trained models (SVM, Random Forest, etc.) and majority voting. (Streamlit, scikit-learn, Jan 2025)",
        "Pneumonia Detection": "A web app to detect pneumonia from chest X-ray images using DenseNet121, ResNet50, and Inception_v3 with ensemble prediction. (Flask, PyTorch, Dec 2024)",
        "Grocery Management": "CLI tool with options to add/remove items and place orders, implemented with file-based storage (C, Nov 2024)",
        "Class X": "CISCE (ICSE) Class X - 97.83% (July 2022)",
        "Class XII": "CBSE Class XII - 94.00% (May 2024)",
        "IIIT Bangalore": "IIIT Bangalore - Integrated MTech in Computer Science and Engineering, 3.46/4.00 (Expected 2029)",
        "Data Science Certification": "Data Science Certification - Finlatics (Oct 2024)",
        "Machine Learning Certification": "Machine Learning Certification - Finlatics (Oct 2024)",
        "JEE Mains": "JEE Mains: Rank 7195 (April 2024)"
    };

    if (popup && popupTitle && popupDescription) {
        popupTitle.innerText = section;
        popupDescription.innerText = descriptions[section] || "More details coming soon.";
        popup.style.display = "flex";
        popup.classList.add("fade-in");
    }
}

// Close Popup
const closePopup = document.getElementById("close-popup");
if (closePopup) {
    closePopup.addEventListener("click", () => {
        const popup = document.getElementById("portfolio-popup");
        if (popup) {
            popup.classList.remove("fade-in");
            setTimeout(() => {
                popup.style.display = "none";
            }, 300);
        }
    });
}

// 📏 Window Resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", onWindowResize);

// 🎬 Animation Loop
let time = 0;
let dayNightCycle = 0;

function animate() {
    time += 0.016;
    dayNightCycle += params.dayNightSpeed;
    
    if (!gameStarted) {
        composer.render();
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

    const playerDirection = new THREE.Vector3(moveX, 0, moveZ);
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

    // Update water shader
    if (waterMaterial && waterMaterial.uniforms) {
        waterMaterial.uniforms.time.value = time;
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        if (!particles[i].update()) {
            particles.splice(i, 1);
        }
    }

    // Animate arrows
    arrows.forEach((arrowData, index) => {
        if (arrowData.arrow) {
            const newY = arrowData.baseY + Math.sin(time * 2 + index * 0.5) * 0.5;
            arrowData.arrow.position.y = newY;
            arrowData.arrow.rotation.y += 0.01;
        }
    });

    // Animate objects
    animatedObjects.forEach((obj) => {
        if (obj.type === "float" && obj.object) {
            obj.object.position.y = obj.originalY + Math.sin(time) * 0.5;
        }
    });

    composer.render();
}

// Initialize
function init() {
    // Show loading screen
    const loading = document.getElementById("loading");
    if (loading) {
        loading.style.display = "block";
        setTimeout(() => {
            loading.style.display = "none";
        }, 2000);
    }
    
    // Set up start button
    const startButton = document.getElementById("start-button");
    if (startButton) {
        startButton.addEventListener("click", startGame);
    }
    
    animate();
}

// Start when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
