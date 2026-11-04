import Phaser from 'phaser'
import playerSheet from '../assets/tanner-the-plumber.png'
import { drawBackground, drawPipe } from './scenery'
import controlsGuide from '../assets/controls-guide.svg'
import { sitePath } from '../sitePaths'

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
const PHYSICS_FPS = 60
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
  minimumMovingSpeed: 10,
  minimumSkidSpeed: 45,
}
const ANIMATION = { walkFrameRate: 10, minimumRate: 0.35, maximumRate: 1.7 }
const PIPE_ENTRY = { horizontalTolerance: 22, verticalTolerance: 4, distance: 64, durationMs: 450 }
const FRAME = { idle: 0, turn: 4, jump: 5 }
const PIPES = [
  { x: 440, height: PIPE_HEIGHT, label: 'TECHNOLOGY', href: '/technology' },
  { x: 790, height: PIPE_HEIGHT, label: 'FOOD & WINE', href: '/food-and-wine' },
]

type Pipe = (typeof PIPES)[number]

type PlayerState = Readonly<{
  body: Phaser.Physics.Arcade.Body
  direction: number
  grounded: boolean
  speed: number
  reversing: boolean
  skidding: boolean
}>

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

      for (const pipe of PIPES) {
        const top = GROUND - pipe.height
        drawPipe(this, pipe.x, top, pipe.height)
        solids.add(this.add.zone(pipe.x, top + pipe.height / 2, 72, pipe.height))
        this.add.text(pipe.x, top - 30, pipe.label, {
          fontFamily: 'Warp Pixel', fontSize: '16px', color: '#ffffff',
        }).setOrigin(0.5)
      }

      this.anims.create({
        key: 'walk', frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
        frameRate: ANIMATION.walkFrameRate, repeat: -1,
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

      const state = this.readPlayerState()
      this.updateHorizontalMovement(state)
      const launched = this.updateJump(state)
      this.updateAnimation(state, launched)
      this.updatePipeEntry(state)
    }

    private readPlayerState(): PlayerState {
      const body = this.player.body as Phaser.Physics.Arcade.Body
      const direction = Number(controls.right) - Number(controls.left)
      const grounded = body.blocked.down
      const speed = Math.abs(body.velocity.x)
      const reversing = direction !== 0
        && Math.sign(body.velocity.x) !== direction
        && speed > MOVEMENT.minimumMovingSpeed

      // Snapshot these values before changing velocity so every step uses the
      // same frame's speed and contact state, including jump boost and animation.
      return {
        body,
        direction,
        grounded,
        speed,
        reversing,
        skidding: grounded && reversing && speed > MOVEMENT.minimumSkidSpeed,
      }
    }

    private updateHorizontalMovement(state: PlayerState) {
      const { body, direction, grounded, speed, reversing } = state
      if (direction === 0) {
        this.player.setAccelerationX(0).setDragX(grounded ? MOVEMENT.friction : 0)
        return
      }

      const targetSpeed = this.getTargetSpeed(state)
      const acceleration = this.getAcceleration(state)
      const overLimit = !reversing && speed > targetSpeed

      // Releasing run brakes gently rather than discarding existing momentum.
      let horizontalAcceleration = direction * acceleration
      if (overLimit) horizontalAcceleration = -Math.sign(body.velocity.x) * MOVEMENT.friction
      this.player.setAccelerationX(horizontalAcceleration).setDragX(0)

      // Facing stays locked in the air, as in the original platformer.
      if (grounded) this.player.setFlipX(direction < 0)

      // Settle at the limit within one fixed step, avoiding repeated overshoots.
      const speedTolerance = Math.max(acceleration, MOVEMENT.friction) / PHYSICS_FPS
      if (!reversing && Math.abs(speed - targetSpeed) <= speedTolerance) {
        this.player.setVelocityX(direction * targetSpeed).setAccelerationX(0)
      }
    }

    private getTargetSpeed({ grounded, speed }: PlayerState): number {
      if (controls.run) return MOVEMENT.runSpeed
      if (grounded) return MOVEMENT.walkSpeed
      return Math.max(MOVEMENT.walkSpeed, speed)
    }

    private getAcceleration({ grounded, reversing }: PlayerState): number {
      if (!grounded) {
        return reversing ? MOVEMENT.airBraking : MOVEMENT.airAcceleration
      }
      if (reversing) return MOVEMENT.braking
      return controls.run ? MOVEMENT.runAcceleration : MOVEMENT.walkAcceleration
    }

    private updateJump({ body, grounded, speed }: PlayerState): boolean {
      const jumpPressed = controls.jump && !this.wasJumping
      this.wasJumping = controls.jump
      const launched = jumpPressed && grounded

      if (launched) {
        this.jumpReleased = false
        const jumpBoost = Math.min(speed / MOVEMENT.runSpeed, 1) * MOVEMENT.movingJumpBonus
        this.player.setVelocityY(-(MOVEMENT.jumpSpeed + jumpBoost))
      }
      if (!controls.jump) this.jumpReleased = true

      // Once released, pressing jump again midair cannot extend the same jump.
      const holdingRise = body.velocity.y < 0 && controls.jump && !this.jumpReleased
      this.player.setGravityY(holdingRise ? MOVEMENT.heldGravity : MOVEMENT.fallGravity)
      return launched
    }

    private updateAnimation({ grounded, speed, skidding }: PlayerState, launched: boolean) {
      if (!grounded || launched) {
        this.showPose(FRAME.jump)
        return
      }
      if (skidding) {
        this.showPose(FRAME.turn)
        return
      }
      if (speed > MOVEMENT.minimumMovingSpeed) {
        this.player.play('walk', true)
        this.player.anims.timeScale = Phaser.Math.Clamp(
          speed / MOVEMENT.walkSpeed, ANIMATION.minimumRate, ANIMATION.maximumRate,
        )
        return
      }
      this.showPose(FRAME.idle)
    }

    private showPose(frame: number) {
      this.player.anims.stop()
      this.player.setFrame(frame)
    }

    private updatePipeEntry({ body }: PlayerState) {
      if (!controls.enter) return
      const pipe = PIPES.find((candidate) => this.isStandingOnPipe(candidate, body))
      if (pipe) this.enterPipe(pipe, body)
    }

    private isStandingOnPipe(pipe: Pipe, body: Phaser.Physics.Arcade.Body): boolean {
      const centered = Math.abs(this.player.x - pipe.x) < PIPE_ENTRY.horizontalTolerance
      const onTop = Math.abs(body.bottom - (GROUND - pipe.height)) < PIPE_ENTRY.verticalTolerance
      return centered && onTop && body.blocked.down
    }

    private enterPipe(pipe: Pipe, body: Phaser.Physics.Arcade.Body) {
      this.entering = true
      this.showPose(FRAME.idle)
      body.enable = false
      this.player.setX(pipe.x)
      this.tweens.add({
        targets: this.player,
        y: this.player.y + PIPE_ENTRY.distance,
        alpha: 0,
        duration: PIPE_ENTRY.durationMs,
        onComplete: () => window.location.assign(sitePath(pipe.href)),
      })
    }
  }

  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: WIDTH,
    height: HEIGHT,
    render: { pixelArt: true, roundPixels: true },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, fps: PHYSICS_FPS, fixedStep: true } },
    input: { keyboard: false },
    scene: LandingScene,
    banner: false,
  })
}
