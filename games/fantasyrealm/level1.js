// level1.js
const levelData = {
    // Definimos a largura total do nosso mundo para que a câmera saiba até onde ir
    // Um valor maior que a largura do canvas permite scroll horizontal
    worldWidth: 2000, // Exemplo: 2.5x a largura do canvas inicial (800 * 2.5)
    groundY: 50, // Altura do chão a partir da base do canvas (50 pixels de altura do chão)

    platforms: [
        // Exemplo: O chão inicial
        { x: 0, y: 0, width: 800, height: 50, type: 'ground' }, // Chão da tela inicial
        { x: 800, y: 0, width: 400, height: 50, type: 'ground' }, // Continuação do chão

        // Blocos flutuantes (ex: o primeiro conjunto de 3 blocos)
        { x: 250, y: 150, width: 32, height: 32, type: 'block' },
        { x: 282, y: 150, width: 32, height: 32, type: 'block' },
        { x: 314, y: 150, width: 32, height: 32, type: 'block' },

        // Outros exemplos
        { x: 500, y: 100, width: 64, height: 32, type: 'block' }, // Bloco mais alto
        // Adicione mais plataformas, baseando-se no World 1-1:
        // Blocos acima do jogador, escada final, etc.
    ],

    pipes: [
        // Exemplo: O primeiro cano
        { x: 400, y: 0, width: 64, height: 64, type: 'pipe' }, // Y=0 significa base na linha do chão
        // Adicione mais canos
    ],

    enemies: [
        // Inimigos com posições iniciais
        { x: 300, y: 0, type: 'goomba' }, // Y=0 para que a lógica de gravidade o posicione no chão
        { x: 600, y: 0, type: 'goomba' },
        // Adicione mais inimigos conforme o World 1-1
    ],

    deathZones: [
        // Abismos (se y for a partir do topo do canvas, ajustamos)
        { x: 1200, y: 50, width: 150, height: 200, type: 'pit' }, // Um abismo de exemplo
        // Outros pontos onde o jogador pode cair
    ],

    endPoint: { x: 1800, y: 0, width: 50, height: 200 } // Posição do poste da bandeira
};
