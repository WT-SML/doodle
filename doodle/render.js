import osd from "openseadragon"

export const render = (doodle) => {
  doodle.graphics.clear()
  const viewport = doodle.viewer.viewport
  const flipped = viewport.getFlip()
  const p = viewport.pixelFromPoint(new osd.Point(0, 0), true)
  if (flipped) {
    p.x = viewport._containerInnerSize.x - p.x
  }
  const scaleY = doodle.getScale()
  const scaleX = flipped ? -scaleY : scaleY
  const rotation = viewport.getRotation()
  doodle.scale = scaleY
  doodle.translate = p
  const canvasP = doodle.viewer.viewport.viewerElementToImageCoordinates(
    new osd.Point(0, 0)
  )
  doodle.graphics.x = p.x
  doodle.graphics.y = p.y
  doodle.graphics.scale = scaleY
  drawShapes(doodle)
}
export const drawShapes = (doodle) => {
  const graphics = doodle.graphics
  for (const shape of doodle.shapes) {
    const pos = shape.pos
    switch (shape.type) {
      case doodle.tools.rect:
        // 矩形
        graphics.rect(pos[0], pos[1], pos[2], pos[3])
        break
      case doodle.tools.polygon:
        // 多边形
        graphics.poly(pos)
        break
      case doodle.tools.circle:
        // 圆
        graphics.circle(pos[0], pos[1], pos[2])
        break
      case doodle.tools.ellipse:
        // 椭圆
        graphics.ellipse(pos[0], pos[1], pos[2], pos[3])
        break
      case doodle.tools.path:
        // 路径
        graphics.poly(pos, false)
        break
      case doodle.tools.closed_path:
        // 闭合路径
        graphics.poly(pos)
        break
      case doodle.tools.line:
        // 直线
        graphics.poly(pos, false)
        break
      case doodle.tools.arrow_line:
        // 箭头直线
        graphics.poly(pos, false)
        break
      case doodle.tools.point:
        // 点
        const r = 5 / doodle.scale
        graphics.circle(pos[0], pos[1], r)
        break
      default:
        break
    }
  }
  const strokeWidth = 2 / doodle.scale
  graphics.stroke({ width: strokeWidth, color: 0xff0000 })
}
