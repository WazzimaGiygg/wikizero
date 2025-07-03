import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.165.0/three.module.min.js';

let scene, camera, renderer;
let player; // Representa o jogador/câmera
let controls; // Para controlar o movimento do jogador (PointerLockControls)

const init = () => {
    // 1. Cena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Cor de céu azul

    // 2. Câmera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.7, 0); // Posição da câmera (altura de um humano)

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


    // Ajuste da câmera para ser "filha" do player ou gerenciada diretamente
    // Em um FPS, a câmera *é* o jogador.

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

const animate = () => {
    requestAnimationFrame(animate);

    // Lógica do jogo aqui (movimento do jogador, lógica de tiro, inimigos, etc.)

    renderer.render(scene, camera);
};

// Adicionar um ouvinte de evento para quando o usuário clicar para travar o ponteiro
// (Isso é crucial para o controle de um FPS)
document.addEventListener('click', () => {
    // Em um jogo real, você chamaria controls.lock(); aqui
    // Exemplo simplificado para mostrar a intenção:
    // document.body.requestPointerLock();
    console.log("Mouse clicked, pointer lock would be requested here.");
});


init();