import Phaser from 'phaser'
import playerSheet from '../assets/tanner-the-plumber.png'
import { drawBackground, drawPipe } from './scenery'
import controlsGuide from '../assets/controls-guide.svg'

export type Controls = {
  left: boolean
  right: boolean
  jump: boolean
  enter: boolean
  run: boolean
}

const WIDTH = 960
const HEIGHT = 480
const GROUND = 400
const PIPE_HEIGHT = 96
// Tuned for 2x artwork: acceleration, momentum and hold-dependent jump arcs.
// These approximate the NES feel rather than emulating its fixed-point engine.
const MOVEMENT = {
  walkSpeed: 180,
  runSpeed: 300,
  walkAcceleration: 700,
  runAcceleration: 900,
  braking: 1550,
  friction: 650,
  airAcceleration: 420,
  airBraking: 650,
  jumpSpeed: 520,
  movingJumpBonus: 60,
  heldGravity: 1200,
  fallGravity: 3000,
  terminalVelocity: 720,
}
const FRAME = { idle: 0, turn: 4, jump: 5 }
const pipes = [
  { x: 440, height: PIPE_HEIGHT, label: 'TECHNOLOGY', href: '/technology' },
  { x: 790, height: PIPE_HEIGHT, label: 'FOOD & WINE', href: '/food-and-wine' },
]

export function createGame(parent: HTMLElement, controls: Controls, onReady: () => void, onMenu: () => void = () => {}) {
  class LandingScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite
    private entering = false
    private wasJumping = false
    private jumpReleased = false

    preload() {
      this.load.spritesheet('player', playerSheet, { frameWidth: 16, frameHeight: 16 })
      this.load.svg('controls-guide', controlsGuide, { width: 400, height: 104 })
    }

    create() {
      drawBackground(this, WIDTH, HEIGHT, GROUND)
      const guide = this.add.image(16, 16, 'controls-guide')
        .setOrigin(0).setDepth(10).setScrollFactor(0).setAlpha(0.72).setScale(0.75)
      // Only the Esc keycap is clickable; the rest of the legend is static.
      guide.setInteractive(new Phaser.Geom.Rectangle(204, 70, 44, 28), Phaser.Geom.Rectangle.Contains)
      guide.on('pointerdown', onMenu)

      this.add.text(WIDTH / 2, 152, 'WELCOME TO WARP ZONE!', {
        fontFamily: 'Warp Pixel', fontSize: '16px', color: '#ffffff',
      }).setOrigin(0.5)

      const solids = this.physics.add.staticGroup()
      const floor = this.add.zone(WIDTH / 2, GROUND + 40, WIDTH, 80)
      solids.add(floor)

      for (const pipe of pipes) {
        const top = GROUND - pipe.height
        drawPipe(this, pipe.x, top, pipe.height)
        solids.add(this.add.zone(pipe.x, top + pipe.height / 2, 72, pipe.height))
        this.add.text(pipe.x, top - 30, pipe.label, {
          fontFamily: 'Warp Pixel', fontSize: '16px', color: '#ffffff',
        }).setOrigin(0.5)
      }

      this.anims.create({
        key: 'walk', frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
        frameRate: 10, repeat: -1,
      })
      this.player = this.physics.add.sprite(100, GROUND - 16, 'player', FRAME.idle)
        .setScale(2).setDepth(2).setCollideWorldBounds(true)
        .setMaxVelocity(MOVEMENT.runSpeed, MOVEMENT.terminalVelocity)
      this.player.body!.setSize(12, 16).setOffset(2, 0)
      this.physics.add.collider(this.player, solids)
      this.physics.world.setBounds(0, 0, WIDTH, HEIGHT)
      onReady()
    }

    update() {
      if (!this.player || this.entering) return
      const body = this.player.body as Phaser.Physics.Arcade.Body
      const direction = Number(controls.right) - Number(controls.left)
      const grounded = body.blocked.down
      const speed = Math.abs(body.velocity.x)
      const reversing = direction !== 0 && Math.sign(body.velocity.x) !== direction && speed > 10
      const skidding = grounded && reversing && speed > 45
      const targetSpeed = controls.run ? MOVEMENT.runSpeed
        : grounded ? MOVEMENT.walkSpeed : Math.max(MOVEMENT.walkSpeed, speed)

      if (direction) {
        const acceleration = grounded
          ? (reversing ? MOVEMENT.braking : controls.run ? MOVEMENT.runAcceleration : MOVEMENT.walkAcceleration)
          : (reversing ? MOVEMENT.airBraking : MOVEMENT.airAcceleration)
        // Decelerate gently after releasing run; never discard existing momentum.
        const overLimit = !reversing && speed > targetSpeed
        this.player.setAccelerationX(overLimit ? -Math.sign(body.velocity.x) * MOVEMENT.friction : direction * acceleration)
        this.player.setDragX(0)
        // Facing stays locked in the air, as in the original platformer.
        if (grounded) this.player.setFlipX(direction < 0)
        // Settle at the limit within one fixed step, avoiding repeated overshoots.
        if (!reversing && Math.abs(speed - targetSpeed) <= Math.max(acceleration, MOVEMENT.friction) / 60) {
          this.player.setVelocityX(direction * targetSpeed).setAccelerationX(0)
        }
      } else {
        this.player.setAccelerationX(0).setDragX(grounded ? MOVEMENT.friction : 0)
      }

      const jumpPressed = controls.jump && !this.wasJumping
      this.wasJumping = controls.jump
      const launching = jumpPressed && grounded
      if (launching) {
        this.jumpReleased = false
        const jumpBoost = Math.min(speed / MOVEMENT.runSpeed, 1) * MOVEMENT.movingJumpBonus
        this.player.setVelocityY(-(MOVEMENT.jumpSpeed + jumpBoost))
      }
      if (!controls.jump) this.jumpReleased = true
      // Once released, pressing jump again midair cannot extend the same jump.
      const holdingRise = body.velocity.y < 0 && controls.jump && !this.jumpReleased
      this.player.setGravityY(holdingRise ? MOVEMENT.heldGravity : MOVEMENT.fallGravity)

      if (!grounded || launching) {
        this.player.anims.stop()
        this.player.setFrame(FRAME.jump)
      } else if (skidding) {
        this.player.anims.stop()
        this.player.setFrame(FRAME.turn)
      } else if (speed > 10) {
        this.player.play('walk', true)
        this.player.anims.timeScale = Phaser.Math.Clamp(speed / MOVEMENT.walkSpeed, 0.35, 1.7)
      } else {
        this.player.anims.stop()
        this.player.setFrame(FRAME.idle)
      }

      const pipe = pipes.find((candidate) =>
        Math.abs(this.player.x - candidate.x) < 22 &&
        Math.abs(body.bottom - (GROUND - candidate.height)) < 4 && body.blocked.down,
      )
      if (pipe && controls.enter) {
        this.entering = true
        this.player.anims.stop()
        body.enable = false
        this.player.setFrame(FRAME.idle).setX(pipe.x)
        this.tweens.add({
          targets: this.player, y: this.player.y + 64, alpha: 0, duration: 450,
          onComplete: () => window.location.assign(pipe.href),
        })
      }
    }
  }

  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: WIDTH,
    height: HEIGHT,
    render: { pixelArt: true, roundPixels: true },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, fps: 60, fixedStep: true } },
    input: { keyboard: false },
    scene: LandingScene,
    banner: false,
  })
}
