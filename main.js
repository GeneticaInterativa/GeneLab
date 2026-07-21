import * as THREE from 'three';

const container = document.getElementById('dna-canvas-container');
const width = container.clientWidth;
const height = container.clientHeight;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
camera.position.z = 15; 

// alpha: true garante o fundo transparente!
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(width, height);
container.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Aumentei um pouco para o fundo claro
scene.add(ambientLight);

const direcional = new THREE.DirectionalLight(0x00d2ff, 3); 
direcional.position.set(5, 5, 5);
scene.add(direcional);

const dnaContainer = new THREE.Group(); 
scene.add(dnaContainer);

const dnaGroup = new THREE.Group(); 
dnaContainer.add(dnaGroup);

const materialA = new THREE.MeshPhysicalMaterial({ color: 0xd3d603, roughness: 0.3 }); 
const materialT = new THREE.MeshPhysicalMaterial({ color: 0x9CCC65, roughness: 0.3 }); 
const materialC = new THREE.MeshPhysicalMaterial({ color: 0xc0bd20, roughness: 0.3 }); 
const materialG = new THREE.MeshPhysicalMaterial({ color: 0xFF7043, roughness: 0.3 }); 
const materialFita = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.1 }); 

const basesClicaveis = []; 

for (let i = 0; i < 20; i++) { 
    const degrauGroup = new THREE.Group(); 
    let matEsquerda, matDireita, nomeEsq, nomeDir;

    if (i % 4 === 0) {
        matEsquerda = materialA; matDireita = materialT;
        nomeEsq = "Adenina"; nomeDir = "Timina";
    } else if (i % 4 === 1) {
        matEsquerda = materialC; matDireita = materialG;
        nomeEsq = "Citosina"; nomeDir = "Guanina";
    } else if (i % 4 === 2) {
        matEsquerda = materialT; matDireita = materialA;
        nomeEsq = "Timina"; nomeDir = "Adenina";
    } else {
        matEsquerda = materialG; matDireita = materialC;
        nomeEsq = "Guanina"; nomeDir = "Citosina";
    }

    const geometriaBase = new THREE.CylinderGeometry(0.3, 0.3, 3, 32); 
    const baseEsquerda = new THREE.Mesh(geometriaBase, matEsquerda);
    const baseDireita = new THREE.Mesh(geometriaBase, matDireita);

    baseEsquerda.userData = { nome: nomeEsq, par: nomeDir };
    baseDireita.userData = { nome: nomeDir, par: nomeEsq };

    baseEsquerda.rotation.z = Math.PI / 2;
    baseDireita.rotation.z = Math.PI / 2;
    baseEsquerda.position.x = -1.5; 
    baseDireita.position.x = 1.5;  

    degrauGroup.add(baseEsquerda);
    degrauGroup.add(baseDireita);

    const geometriaFita = new THREE.SphereGeometry(0.6, 16, 16); 
    const esferaEsquerda = new THREE.Mesh(geometriaFita, materialFita);
    const esferaDireita = new THREE.Mesh(geometriaFita, materialFita);
    esferaEsquerda.position.x = -3.1;
    esferaDireita.position.x = 3.1;

    const dadosEsqueleto = { tipo: 'esqueleto', nome: 'Esqueleto Açúcar-Fosfato' };
    esferaEsquerda.userData = dadosEsqueleto;
    esferaDireita.userData = dadosEsqueleto;

    basesClicaveis.push(baseEsquerda, baseDireita, esferaEsquerda, esferaDireita);

    degrauGroup.add(esferaEsquerda);
    degrauGroup.add(esferaDireita);

    degrauGroup.position.y = (i - 10) * 1.2; 
    degrauGroup.rotation.y = i * 0.4;       
    dnaGroup.add(degrauGroup); 
}

dnaContainer.rotation.z = -0.7; 
dnaContainer.rotation.x = 0.3;  

// --- VARIÁVEL QUE CONTROLA O SONO ---
let isVisivelMain = false;

// --- MOTOR DE ANIMAÇÃO ---
function animar() {
    // SE NÃO ESTIVER NA TELA, PAUSA TUDO!
    if (!isVisivelMain) return; 
    
    requestAnimationFrame(animar);
    dnaGroup.rotation.y -= 0.003; 
    renderer.render(scene, camera);
}

// --- O VIGIA DE TELA (INTERSECTION OBSERVER) ---
const observerMain = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Entrou na tela: Acorda
            if (!isVisivelMain) {
                isVisivelMain = true;
                animar(); 
                console.log("DNA Molecular Ligado!");
            }
        } else {
            // Saiu da tela: Dorme
            isVisivelMain = false;
            console.log("DNA Molecular Dormindo Zzz...");
        }
    });
}, { threshold: 0.01 });

// Pede para o vigia ficar de olho na caixa do DNA Molecular
observerMain.observe(container);
animar(); 

window.addEventListener('resize', () => {
    const newWidth = container.clientWidth;
    const newHeight = container.clientHeight;
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight);
});

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const painel = document.getElementById('info-panel');
const titulo = document.getElementById('info-titulo');
const texto = document.getElementById('info-texto');

let baseSelecionada = null;

window.addEventListener('click', (event) => {
    const rect = container.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersecoes = raycaster.intersectObjects(basesClicaveis);

    if (intersecoes.length > 0) {
        const objetoClicado = intersecoes[0].object;
        const dados = objetoClicado.userData;

        if (baseSelecionada) {
            baseSelecionada.scale.set(1, 1, 1);
        }

        baseSelecionada = objetoClicado;
        baseSelecionada.scale.set(1.2, 1.2, 1.2); 

        if (dados.tipo === 'esqueleto') {
            titulo.innerText = `Estrutura: ${dados.nome}`;
            texto.innerText = `Você clicou no corrimão da hélice. Esta estrutura é formada por moléculas alternadas de um grupo fosfato e um açúcar (desoxirribose), que dão suporte à fita de DNA.`;
        } else {
            titulo.innerText = `Ligação: ${dados.nome}`;
            texto.innerText = `Você clicou na base ${dados.nome}. No pareamento do DNA, ela se liga através de pontes de hidrogênio exclusivamente com a ${dados.par}.`;
        }

        painel.style.display = 'block';
    }
});

document.getElementById('btn-fechar').addEventListener('click', () => {
    painel.style.display = 'none';
    if (baseSelecionada) {
        baseSelecionada.scale.set(1, 1, 1);
        baseSelecionada = null; 
    }
});

function abrirInterface(tipo) {
    // 1. Remove a classe 'ativo' de todos os cards para indicar seleção visual
    document.querySelectorAll('.card-modulo').forEach(card => card.style.borderColor = '#E0E5EC');
    
    // 2. Aplica destaque ao card clicado
    event.currentTarget.style.borderColor = '#20B2AA';

    // 3. Direciona para a interface correspondente
    switch(tipo) {
        case 'escala':
            console.log("Carregando Interface: Visualização de Escalas");
            // Se for uma página separada: window.location.href = 'escala.html';
            // Se for um modal/painel na mesma página, chame a função de renderização aqui
            break;
        case 'mutacao':
            console.log("Carregando Interface: Mutação em Tempo Real");
            break;
        case 'especies':
            console.log("Carregando Interface: Comparativo de Espécies");
            break;
    }
}

