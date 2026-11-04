import type Phaser from 'phaser'

export const SKY_COLOR = '#5c94fc'

// Draw on a two-pixel grid to match the character's 2x source pixels.
function drawCloud(graphics: Phaser.GameObjects.Graphics, x: number, y: number, lobes: number, bush = false) {
  const width = 20 + lobes * 12
  const height = 18
  const occupied = (column: number, row: number) => {
    if (column < 0 || column >= width || row < 0 || row >= height) return false
    if (bush && row > 14) return false
    for (let lobe = 0; lobe < lobes; lobe++) {
      const center = 16 + lobe * 12
      if (((column - center) / 10) ** 2 + ((row - 8) / 8) ** 2 <= 1) return true
      if (((column - (center - 8)) / 8) ** 2 + ((row - 11) / 5) ** 2 <= 1) return true
      if (((column - (center + 8)) / 8) ** 2 + ((row - 11) / 5) ** 2 <= 1) return true
    }
    return false
  }

  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) {
      if (!occupied(column, row)) continue
      const edge = !occupied(column - 1, row) || !occupied(column + 1, row)
        || !occupied(column, row - 1) || !occupied(column, row + 1)
      const shadow = row > 11 && !occupied(column + 2, row + 3)
      const color = bush
        ? edge ? 0x183808 : shadow ? 0x009800 : 0x80d010
        : edge ? 0x2948a8 : shadow ? 0xb8d8f8 : 0xfffcf4
      graphics.fillStyle(color).fillRect(x + column * 2, y + row * 2, 2, 2)
    }
  }
  for (let lobe = 0; lobe < lobes; lobe++) {
    const detailX = x + (13 + lobe * 12) * 2
    graphics.fillStyle(bush ? 0x006800 : 0x7194cc)
    graphics.fillRect(detailX, y + 18, 2, 4)
    graphics.fillRect(detailX + 8, y + 20, 2, 4)
  }
}

export function drawBackground(scene: Phaser.Scene, width: number, height: number, ground: number) {
  scene.cameras.main.setBackgroundColor(SKY_COLOR)
  const art = scene.add.graphics()

  drawCloud(art, 64, 76, 1)
  drawCloud(art, 280, 48, 3)
  drawCloud(art, 560, 96, 2)
  drawCloud(art, 806, 54, 2)
  drawCloud(art, 164, ground - 30, 3, true)
  drawCloud(art, 536, ground - 30, 2, true)
  drawCloud(art, 864, ground - 30, 1, true)

  for (let y = ground; y < height; y += 32) {
    for (let x = 0; x < width; x += 32) {
      art.fillStyle(0x181820).fillRect(x, y, 32, 32)
      art.fillStyle(0xc84c0c).fillRect(x + 2, y + 2, 28, 28)
      art.fillStyle(0xfcb48c)
      art.fillRect(x + 2, y + 2, 28, 2)
      art.fillRect(x + 2, y + 4, 2, 10)
      art.fillRect(x + 4, y + 18, 10, 2)
      art.fillRect(x + 18, y + 20, 2, 8)
      art.fillStyle(0x181820)
      art.fillRect(x + 20, y + 2, 2, 12)
      art.fillRect(x + 18, y + 12, 4, 4)
      art.fillRect(x + 2, y + 16, 16, 2)
      art.fillRect(x + 14, y + 18, 2, 12)
      art.fillRect(x + 18, y + 18, 12, 2)
      art.fillStyle(0x882c08)
      art.fillRect(x + 4, y + 28, 10, 2)
      art.fillRect(x + 28, y + 20, 2, 10)
    }
  }
}

export function drawPipe(scene: Phaser.Scene, x: number, top: number, height: number) {
  const art = scene.add.graphics().setDepth(3)
  const outline = 0x102800
  art.fillStyle(outline).fillRect(x - 32, top + 20, 64, height - 20)
  // Hard bands, rather than a smooth gradient, preserve the NES palette style.
  const bands = [
    { offset: -30, width: 6, color: 0x80d010 },
    { offset: -24, width: 4, color: 0xd8f878 },
    { offset: -20, width: 8, color: 0x80d010 },
    { offset: -12, width: 26, color: 0x00a800 },
    { offset: 14, width: 8, color: 0x008000 },
    { offset: 22, width: 8, color: 0x005800 },
  ]
  for (const band of bands) {
    art.fillStyle(band.color).fillRect(x + band.offset, top + 22, band.width, height - 22)
  }
  art.fillStyle(outline).fillRect(x - 36, top, 72, 24)
  for (const band of bands) {
    art.fillStyle(band.color).fillRect(x + band.offset, top + 2, band.width, 18)
  }
  art.fillStyle(0x80d010).fillRect(x - 34, top + 2, 4, 18)
  art.fillStyle(0x005800).fillRect(x + 30, top + 2, 4, 18)
  art.fillStyle(0xd8f878).fillRect(x - 34, top + 2, 68, 2)
  art.fillStyle(0x004000).fillRect(x - 34, top + 20, 68, 2)
  art.fillStyle(outline).fillRect(x - 30, top + 24, 60, 2)
}

