// game.js

// 1. Configuração da Cena
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas') });
renderer.setSize(window.innerWidth, window.innerHeight);

// 2. Luz
const ambientLight = new THREE.AmbientLight(0x404040); // Luz ambiente suave
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5); // Luz direcional
directionalLight.position.set(1, 1, 1).normalize();
scene.add(directionalLight);

// 3. Criar a "Terra" (Blocos)
const blockSize = 1; // Tamanho de cada bloco
const gridSize = 10; // Tamanho da grade de blocos (10x10)

// Função para criar um bloco
function createBlock(x, y, z, color) {
    const geometry = new THREE.BoxGeometry(blockSize, blockSize, blockSize);
    const material = new THREE.MeshLambertMaterial({ color: color }); // LambertMaterial reage à luz
    const block = new THREE.Mesh(geometry, material);
    block.position.set(x * blockSize, y * blockSize, z * blockSize);
    scene.add(block);
}

// Gerar uma base de blocos
for (let x = -gridSize / 2; x < gridSize / 2; x++) {
    for (let z = -gridSize / 2; z < gridSize / 2; z++) {
        // Cor "aleatória" para simular diferentes tipos de blocos sem texturas
        // Usamos um truque simples para variar a cor baseada na posição
        let blockColor;
        if ((x + z) % 3 === 0) {
            blockColor = 0x6B8E23; // Verde musgo
        } else if ((x + z) % 3 === 1) {
            blockColor = 0x8B4513; // Marrom terra
        } else {
            blockColor = 0x483C32; // Cinza rocha
        }
        createBlock(x, 0, z, blockColor); // Criar blocos no nível Y=0
    }
}

// 4. Posição da Câmera
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0); // Aponta a câmera para o centro da cena

// 5. Render Loop (Animação)
function animate() {
    requestAnimationFrame(animate);

    // Exemplo de movimento da câmera para ver os blocos
    // camera.rotation.y += 0.005; 

    renderer.render(scene, camera);
}

animate();

// 6. Redimensionamento da Janela
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 7. Interatividade (Exemplo: Mover a câmera com setas)
const moveSpeed = 0.1;
document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'ArrowUp':
            camera.position.z -= moveSpeed;
            break;
        case 'ArrowDown':
            camera.position.z += moveSpeed;
            break;
        case 'ArrowLeft':
            camera.position.x -= moveSpeed;
            break;
        case 'ArrowRight':
            camera.position.x += moveSpeed;
            break;
        case 'q': // 'q' para subir
            camera.position.y += moveSpeed;
            break;
        case 'e': // 'e' para descer
            camera.position.y -= moveSpeed;
            break;
    }
});	
