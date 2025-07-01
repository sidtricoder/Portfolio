import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// 🌎 Scene Setup
const scene = new THREE.Scene();

// 🎥 Camera (FPS-style)
const camera = new THREE.PerspectiveCamera(
    75, window.innerWidth / window.innerHeight, 0.1, 1000
);
camera.position.set(0, 2, 5);

// 🖥️ Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x87ceeb); // Light blue sky color
renderer.shadowMap.enabled = true; // Enable shadows
document.body.appendChild(renderer.domElement);

// 💡 Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Sun and Directional Light
const sunLight = new THREE.DirectionalLight(0xfff3e0, 1.5);
sunLight.position.set(5, 10, 5);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 1024;
sunLight.shadow.mapSize.height = 1024;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 50;
scene.add(sunLight);

// Visible Sun
const sunGeometry = new THREE.SphereGeometry(0.5, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.position.set(5, 10, 5);
scene.add(sun);

// 🌿 Infinite Ground
const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
ground.receiveShadow = true;
scene.add(ground);

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

// 🚀 Start Game Function
function startGame() {
    gameStarted = true;
    document.getElementById("welcome-screen").style.display = "none";
    if (window.innerWidth < 768) { // Only show controls on mobile
        document.getElementById("controls").style.display = "flex";
    }
    animate(); // Start animation loop
}

document.getElementById("start-button").addEventListener("click", startGame);

// ⌨️ Keyboard Controls
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

// 🔎 Function to Make Objects Clickable and Add Arrow
function makeClickable(object, section) {
    object.traverse((child) => {
        if (child.isMesh) {
            child.userData.section = section;
            clickableObjects.push(child);
        }
    });

    const arrowGeometry = new THREE.ConeGeometry(0.2, 0.5, 32);
    const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
    arrow.position.set(object.position.x, object.position.y + 3, object.position.z);
    arrow.rotation.x = Math.PI; // Point downward
    scene.add(arrow);
    arrows.push(arrow);
}

// 🔄 Function to Load 3D Models
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
        if (animateType) animatedObjects.push({ object: model, type: animateType });
    });
}

// 🌳 Increased Density of Trees
const treeTypes = [
    'tree_pineTallA.glb', 'tree_pineTallB.glb', 'tree_palmTall.glb', 'tree_default.glb',
    'tree_oak.glb', 'tree_simple.glb', 'tree_tall.glb', 'tree_pineRoundA.glb'
];
treeTypes.forEach((tree, index) => {
    for (let i = 0; i < 32; i++) {
        loadModel(`/Models/${tree}`, [
            (index * 15) + (Math.random() * 60 - 30),
            0,
            (i * 5) + (Math.random() * 40 - 20)
        ], [2, 2, 2]);
    }
});

// 📜 Personal Information (Signpost)
loadModel("/Models/sign.glb", [
    5 + Math.random() * 10,
    0,
    5 + Math.random() * 10
], [1.5, 1.5, 1.5], "Personal Information");

// 🪨 Group of Big Rocks (Projects)
loadModel("/Models/rock_largeA.glb", [20 + Math.random() * 20, 0, 20 + Math.random() * 20], [2, 2, 2], "Star Classification");
loadModel("/Models/rock_largeA.glb", [30 + Math.random() * 20, 0, 30 + Math.random() * 20], [2, 2, 2], "Pneumonia Detection");
loadModel("/Models/rock_largeA.glb", [40 + Math.random() * 20, 0, 40 + Math.random() * 20], [2, 2, 2], "Grocery Management");
loadModel("/Models/rock_largeA.glb", [50 + Math.random() * 20, 0, 50 + Math.random() * 20], [2, 2, 2], "Restaurant Management");
loadModel("/Models/rock_largeA.glb", [60 + Math.random() * 20, 0, 60 + Math.random() * 20], [2, 2, 2], "Travel Genie");
loadModel("/Models/rock_largeA.glb", [70 + Math.random() * 20, 0, 70 + Math.random() * 20], [2, 2, 2], "Interest Calculator");

// 🌸 Group of Flowers (Education)
function addFlower(position, label) {
    const stemGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 32);
    const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x00FF00 });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.set(position[0], 0.5, position[1]);
    stem.castShadow = true;
    stem.receiveShadow = true;
    scene.add(stem);

    const petalGeometry = new THREE.SphereGeometry(0.2, 32, 32);
    const petalMaterial = new THREE.MeshStandardMaterial({ color: 0xFF69B4 });
    const petal = new THREE.Mesh(petalGeometry, petalMaterial);
    petal.position.set(position[0], 1, position[1]);
    petal.castShadow = true;
    petal.receiveShadow = true;
    scene.add(petal);

    makeClickable(petal, label);
}

addFlower([40 + Math.random() * 20, 40 + Math.random() * 20], "Class X");
addFlower([50 + Math.random() * 20, 50 + Math.random() * 20], "Class XII");
addFlower([60 + Math.random() * 20, 60 + Math.random() * 20], "IIIT Bangalore");

// 🏆 Group of Statues (Certificates and Scores)
loadModel("/Models/statue_obelisk.glb", [60 + Math.random() * 20, 0, 60 + Math.random() * 20], [1, 1, 1], "Data Science Certification");
loadModel("/Models/statue_obelisk.glb", [70 + Math.random() * 20, 0, 70 + Math.random() * 20], [1, 1, 1], "Machine Learning Certification");
loadModel("/Models/statue_obelisk.glb", [80 + Math.random() * 20, 0, 80 + Math.random() * 20], [1, 1, 1], "Python Basic Certification");
loadModel("/Models/statue_obelisk.glb", [90 + Math.random() * 20, 0, 90 + Math.random() * 20], [1, 1, 1], "JEE Mains");
loadModel("/Models/statue_obelisk.glb", [95 + Math.random() * 20, 0, 95 + Math.random() * 20], [1, 1, 1], "JEE Advanced");
loadModel("/Models/statue_obelisk.glb", [100 + Math.random() * 20, 0, 100 + Math.random() * 20], [1, 1, 1], "NDA Qualified");

// 🛶 Canoe
loadModel("/Models/canoe.glb", [-30 + Math.random() * 20, 0.1, -30 + Math.random() * 20], [2.5, 2.5, 2.5], null, "canoe");

// 🔎 Raycasting for Click Detection
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
            showPortfolioSection(clickedObject.userData.section);
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
    // Ensure controls visibility updates on resize
    if (gameStarted) {
        document.getElementById("controls").style.display = window.innerWidth < 768 ? "flex" : "none";
    }
}
window.addEventListener("resize", onWindowResize);

// 🎬 Animation Loop
let time = 0;
function animate() {
    if (!gameStarted) {
        renderer.render(scene, camera); // Render static scene before game starts
        requestAnimationFrame(animate);
        return;
    }

    requestAnimationFrame(animate);

    let moveX = 0, moveZ = 0;
    if (movement.forward) moveZ -= speed;
    if (movement.backward) moveZ += speed;
    if (movement.left) moveX -= speed;
    if (movement.right) moveX += speed;

    let playerDirection = new THREE.Vector3(moveX, 0, moveZ);
    playerDirection.applyEuler(player.rotation);
    player.position.add(playerDirection);

    velocityY += gravity;
    player.position.y += velocityY;

    if (player.position.y <= 2) {
        player.position.y = 2;
        movement.jumping = false;
        velocityY = 0;
    }

    // Animate Objects
    animatedObjects.forEach((obj) => {
        if (obj.type === "canoe") {
            obj.object.position.y = Math.sin(Date.now() * 0.002) * 0.1 + 0.1;
        }
    });

    // Animate Arrows
    arrows.forEach((arrow) => {
        arrow.position.y = 3 + Math.sin(Date.now() * 0.002) * 0.3;
    });

    renderer.render(scene, camera);
}
animate(); // Start with static rendering until game begins
