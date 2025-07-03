import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.165.0/three.module.min.js';
// Importamos o PointerLockControls diretamente dos exemplos do Three.js via CDN
import { PointerLockControls } from 'https://unpkg.com/three@0.165.0/examples/jsm/controls/PointerLockControls.js';

let scene, camera, renderer;
let controls; // Nosso PointerLockControls

// Variáveis para o movimento do jogador
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

// Velocidade de movimento (ajuste conforme a preferência)
const playerSpeed = 0.08; // Reduzido um pouco para um movimento mais controlável

// Posição inicial do jogador
const initialPlayerPosition = new THREE.Vector3(0, 1.7, 0); // Altura de 1.7 para simular uma pessoa

const init = () => {
    // 1. Cena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Cor de céu azul
    scene.fog = new THREE.Fog(0x87CEEB, 0.1, 50); // Adiciona névoa para simular distância

    // 2. Câmera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    // A posição da câmera será gerenciada pelo PointerLockControls. Não precisamos definir aqui.
    // camera.position.set(0, 1.7, 0);

    // 3. Renderizador
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('game-container').appendChild(renderer.domElement);

    // 4. Luzes
    const ambientLight = new THREE.AmbientLight(0x404040); // Luz ambiente
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // Luz direcional
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    // 5. Chão (um plano simples)
    const floorGeometry = new THREE.PlaneGeometry(100, 100);
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x808080, side: THREE.DoubleSide });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2; // Gira para ficar horizontal
    scene.add(floor);

    // 6. Adicionar alguns cubos coloridos para teste
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1); // Cubo de 1x1x1 unidade

    // Cubo Vermelho
    const redMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    const redBox = new THREE.Mesh(boxGeometry, redMaterial);
    redBox.position.set(5, 0.5, -5); // Posição (x, y, z) - y = 0.5 para ficar no chão
    scene.add(redBox);

    // Cubo Verde
    const greenMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
    const greenBox = new THREE.Mesh(boxGeometry, greenMaterial);
    greenBox.position.set(-5, 0.5, 5);
    scene.add(greenBox);

    // Cubo Azul
    const blueMaterial = new THREE.MeshLambertMaterial({ color: 0x0000ff });
    const blueBox = new THREE.Mesh(boxGeometry, blueMaterial);
    blueBox.position.set(0, 0.5, -10);
    scene.add(blueBox);

    // Cubo Amarelo (maior)
    const largeBoxGeometry = new THREE.BoxGeometry(2, 2, 2);
    const yellowMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
    const yellowBox = new THREE.Mesh(largeBoxGeometry, yellowMaterial);
    yellowBox.position.set(10, 1, 0); // y = 1 para ficar no chão (metade da altura)
    scene.add(yellowBox);

    // --- Configuração dos PointerLockControls ---
    controls = new PointerLockControls(camera, document.body); // O segundo argumento é o elemento para escutar eventos de mouse

    // Adicionar o objeto de controle à cena. Ele contém a câmera.
    scene.add(controls.getObject());

    // Configurar a posição inicial da câmera (do objeto de controle)
    controls.getObject().position.copy(initialPlayerPosition);

    // Event listener para quando o ponteiro é travado/destravado
    controls.addEventListener('lock', () => {
        console.log('Pointer locked');
        // Você pode ocultar elementos de UI aqui se quiser
    });

    controls.addEventListener('unlock', () => {
        console.log('Pointer unlocked');
        // Você pode mostrar um menu de pausa aqui
    });

    // Event listener para o clique do mouse para travar o ponteiro
    document.addEventListener('click', () => {
        controls.lock(); // Tenta travar o ponteiro do mouse
    });

    // --- Event Listeners para Movimento WASD ---
    const onKeyDown = (event) => {
        switch (event.code) {
            case 'KeyW':
                moveForward = true;
                break;
            case 'KeyA':
                moveLeft = true;
                break;
            case 'KeyS':
                moveBackward = true;
                break;
            case 'KeyD':
                moveRight = true;
                break;
        }
    };

    const onKeyUp = (event) => {
        switch (event.code) {
            case 'KeyW':
                moveForward = false;
                break;
            case 'KeyA':
                moveLeft = false;
                break;
            case 'KeyS':
                moveBackward = false;
                break;
            case 'KeyD':
                moveRight = false;
                break;
        }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // Redimensionar a cena quando a janela for redimensionada
    window.addEventListener('resize', onWindowResize, false);

    // Iniciar o loop de animação
    animate();
};

const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
};

let prevTime = performance.now(); // Para calcular o delta de tempo

const animate = () => {
    requestAnimationFrame(animate);

    const time = performance.now();
    const delta = (time - prevTime) / 1000; // Tempo em segundos desde o último frame

    // --- Lógica de Movimento ---
    if (controls.isLocked) { // Mover apenas se o ponteiro estiver travado
        // O PointerLockControls tem métodos para mover, que consideram a rotação da câmera
        if (moveForward) controls.moveForward(playerSpeed * delta * 60); // Multiplicamos por 60 para normalizar a velocidade (FPS)
        if (moveBackward) controls.moveBackward(playerSpeed * delta * 60);
        if (moveLeft) controls.moveRight(-playerSpeed * delta * 60); // Mover para a esquerda é mover para a direita com valor negativo
        if (moveRight) controls.moveRight(playerSpeed * delta * 60);
    }

    prevTime = time; // Atualiza o tempo para o próximo frame

    renderer.render(scene, camera);
};

init();