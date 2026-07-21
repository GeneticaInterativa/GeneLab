import * as THREE from 'three';

// 1. O PALCO
const container = document.getElementById('hero-dna-canvas');
const width = container.clientWidth;
const height = container.clientHeight;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
camera.position.z = 25; 

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(width, height);
// Limita a resolução máxima para poupar o processador do celular
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.2); 
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xffffff, 4.0); 
mainLight.position.set(10, 20, 15);
scene.add(mainLight);

const rimLight = new THREE.DirectionalLight(0x20B2AA, 6); 
rimLight.position.set(-15, -10, -15);
scene.add(rimLight);

// 2. MATERIAL
const configVidro = { roughness: 0.15, transmission: 0.9, thickness: 1.5, clearcoat: 1.0 };
const materialDNA = new THREE.MeshPhysicalMaterial({ color: 0x9195d2, ...configVidro });

// 3. CONSTRUINDO A ESTRUTURA GLOBAL
const dnaGroup = new THREE.Group();
scene.add(dnaGroup);

const totalDegraus = 60; 
const degraus = []; 

for (let i = 0; i < totalDegraus; i++) { 
    const degrauGroup = new THREE.Group();

    const geoBase = new THREE.CylinderGeometry(0.15, 0.15, 4.4, 32); 
    const base = new THREE.Mesh(geoBase, materialDNA);
    base.rotation.z = Math.PI / 2;
    degrauGroup.add(base);
    
    const geoFita = new THREE.SphereGeometry(0.35, 32, 32);
    const esferaEsq = new THREE.Mesh(geoFita, materialDNA);
    const esferaDir = new THREE.Mesh(geoFita, materialDNA);
    esferaEsq.position.x = -2.2; 
    esferaDir.position.x = 2.2;
    degrauGroup.add(esferaEsq, esferaDir);

    const posHelice = new THREE.Vector3(
        Math.cos(i * 0.3) * 2.5,  
        (i - totalDegraus/2) * 0.4, 
        Math.sin(i * 0.3) * 2.5   
    );
    const rotHeliceY = i * 0.3; 

    let posX, posY, posZ;
    let indexBraco = i % 30; 
    posY = (indexBraco - 14.5) * 0.35; 
    
    posX = Math.pow(posY * 0.25, 3) * 3; 
    if (i >= 30) posX = -posX; 
    posZ = Math.sin(i) * 0.2; 

    const posCromossomo = new THREE.Vector3(posX, posY, posZ);

    degrauGroup.userData = { posCromossomo, posHelice, rotHeliceY };
    
    dnaGroup.add(degrauGroup);
    degraus.push(degrauGroup);
}

// 4. PARTÍCULAS FLUTUANTES
const geoParticulas = new THREE.BufferGeometry();
const numParticulas = 150;
const posParticulas = new Float32Array(numParticulas * 3);
for(let i = 0; i < numParticulas * 3; i++) posParticulas[i] = (Math.random() - 0.5) * 40; 
geoParticulas.setAttribute('position', new THREE.BufferAttribute(posParticulas, 3));
const particulas = new THREE.Points(geoParticulas, new THREE.PointsMaterial({ size: 0.15, color: 0x5b64ee, transparent: true, opacity: 0.6 }));
scene.add(particulas);

// 5. SISTEMA DE ESCALA INTELIGENTE (RESPONSIVIDADE 3D)
function ajustarCamera() {
    const newWidth = container.clientWidth;
    const newHeight = container.clientHeight;
    
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight);

    if (window.innerWidth < 576) {
        // Celular: Aumentamos a escala para compensar a tela estreita
        dnaGroup.scale.set(1.4, 1.4, 1.4);
        camera.position.z = 25; 
    } else if (window.innerWidth < 992) {
        // Tablet: Escala intermediária maior que o desktop
        dnaGroup.scale.set(1.5, 1.5, 1.5);
        camera.position.z = 25;
    } else {
        // Desktop: Escala padrão (100%)
        dnaGroup.scale.set(1, 1, 1);
        camera.position.z = 25;
    }
}

window.addEventListener('resize', ajustarCamera);
ajustarCamera();

// 6. MOTOR DE ANIMAÇÃO E O "MODO SONO"
let isVisivelHero = false; 
const clock = new THREE.Clock();
const tempoCiclo = 18; 
const suavizar = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

function animar() {
    if (!isVisivelHero) return; 
    
    requestAnimationFrame(animar);
    
    const tempoReal = clock.getElapsedTime();
    const t = (tempoReal % tempoCiclo) / tempoCiclo; 
    
    let formatT = 0; 
    if (t > 0.05 && t < 0.35) formatT = suavizar((t - 0.05) / 0.30);
    else if (t >= 0.35 && t <= 0.70) formatT = 1;
    else if (t > 0.70 && t < 0.85) formatT = 1 - suavizar((t - 0.70) / 0.15);
    
    degraus.forEach((degrau) => {
        degrau.position.lerpVectors(degrau.userData.posCromossomo, degrau.userData.posHelice, formatT);
        degrau.rotation.y = THREE.MathUtils.lerp(0, degrau.userData.rotHeliceY, formatT);
    });

    dnaGroup.rotation.y = t * Math.PI * 4; 
    dnaGroup.position.y = Math.sin(t * Math.PI * 2) * 0.5; 
    
    particulas.rotation.y = tempoReal * 0.03;
    particulas.rotation.x = tempoReal * 0.01;

    renderer.render(scene, camera);
}

const observerHero = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            if (!isVisivelHero) {
                isVisivelHero = true;
                animar(); 
                console.log("DNA Hero Ligado!"); 
            }
        } else {
            isVisivelHero = false;
            console.log("DNA Hero Dormindo Zzz..."); 
        }
    });
}, { threshold: 0.01 }); 

observerHero.observe(container);

// Renderiza a primeira "foto" para o DNA não sumir antes do Intersection Observer ligar a animação
renderer.render(scene, camera);