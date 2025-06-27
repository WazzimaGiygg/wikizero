const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 480,
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 800 }, debug: false }
  },
  scene: {
    preload, create, update
  }
};

const game = new Phaser.Game(config);

let player, cursors, map, tileset, layer;

function preload() {
  this.load.image('tiles', 'assets/tileset.png');
  this.load.tilemapTiledJSON('map', 'assets/map.json');
  this.load.spritesheet('player', 'assets/player.png', { frameWidth: 32, frameHeight: 32 });
}

function create() {
  map = this.make.tilemap({ key: 'map' });
  tileset = map.addTilesetImage('tileset', 'tiles');
  layer = map.createLayer('ground', tileset, 0, 0);
  layer.setCollisionByProperty({ collides: true });

  player = this.physics.add.sprite(100, 300, 'player');
  player.setBounce(0.1);
  player.setCollideWorldBounds(true);
  this.physics.add.collider(player, layer);

  this.anims.create({
    key: 'run',
    frames: this.anims.generateFrameNumbers('player', { start: 0, end: 1 }),
    frameRate: 6,
    repeat: -1
  });

  cursors = this.input.keyboard.createCursorKeys();
}

function update() {
  player.body.setVelocityX(0);

  if (cursors.left.isDown) {
    player.setVelocityX(-150);
    player.flipX = true;
    player.anims.play('run', true);
  } else if (cursors.right.isDown) {
    player.setVelocityX(150);
    player.flipX = false;
    player.anims.play('run', true);
  } else {
    player.anims.stop();
  }

  if (cursors.up.isDown && player.body.onFloor()) {
    player.setVelocityY(-350);
  }
}
