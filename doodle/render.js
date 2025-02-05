import osd from "openseadragon"
import { lineAngle, pointRotate, pointInPolygon, lineLength } from "geometric"

// 渲染方法
export const render = (doodle) => {
  doodle.graphics.clear()
  const viewport = doodle.viewer.viewport
  const flipped = viewport.getFlip()
  const p = viewport.pixelFromPoint(new osd.Point(0, 0), true)
  if (flipped) {
    p.x = viewport._containerInnerSize.x - p.x
  }
  const scale = doodle.getScale()
  doodle.scale = scale
  doodle.translate = p
  doodle.graphics.x = p.x
  doodle.graphics.y = p.y
  doodle.graphics.scale = scale
  drawShapes(doodle)
}
// 绘制shapes
export const drawShapes = (doodle) => {
  for (const shape of doodle.shapes) {
    drawShape(shape, doodle)
  }
  // 新增或者编辑的
  if (doodle.tempShape) drawShape(doodle.tempShape, doodle)
  // 悬浮的
}
// 绘制shape
export const drawShape = (shape, doodle) => {
  const strokeWidth = doodle.strokeWidth / doodle.scale
  const r = doodle.r / doodle.scale
  const graphics = doodle.graphics
  const pos = shape.pos
  switch (shape.type) {
    case doodle.tools.rect:
      // 矩形
      graphics.rect(pos[0], pos[1], pos[2], pos[3])
      graphics.stroke({
        width: strokeWidth,
        color: doodle.parseColor(shape.color || doodle.color),
      })
      graphics.fill(doodle.parseColor(shape.color || doodle.color), 0)
      break
    case doodle.tools.polygon:
      // 多边形
      graphics.poly(pos)
      graphics.stroke({
        width: strokeWidth,
        color: doodle.parseColor(shape.color || doodle.color),
      })
      graphics.fill(doodle.parseColor(shape.color || doodle.color), 0)
      break
    case doodle.tools.circle:
      // 圆
      graphics.circle(pos[0], pos[1], pos[2])
      graphics.stroke({
        width: strokeWidth,
        color: doodle.parseColor(shape.color || doodle.color),
      })
      graphics.fill(doodle.parseColor(shape.color || doodle.color), 0)
      break
    case doodle.tools.ellipse:
      // 椭圆
      graphics.ellipse(pos[0], pos[1], pos[2], pos[3])
      graphics.stroke({
        width: strokeWidth,
        color: doodle.parseColor(shape.color || doodle.color),
      })
      graphics.fill(doodle.parseColor(shape.color || doodle.color), 0)
      break
    case doodle.tools.path:
      // 路径
      graphics.poly(pos, false)
      graphics.stroke({
        width: strokeWidth,
        color: doodle.parseColor(shape.color || doodle.color),
      })
      graphics.fill(doodle.parseColor(shape.color || doodle.color), 0)
      break
    case doodle.tools.closed_path:
      // 闭合路径
      graphics.poly(pos)
      graphics.stroke({
        width: strokeWidth,
        color: doodle.parseColor(shape.color || doodle.color),
      })
      graphics.fill(doodle.parseColor(shape.color || doodle.color), 0)
      break
    case doodle.tools.line:
      // 直线
      graphics.poly(pos, false)
      graphics.stroke({
        width: strokeWidth,
        color: doodle.parseColor(shape.color || doodle.color),
      })
      graphics.fill(doodle.parseColor(shape.color || doodle.color), 0)
      break
    case doodle.tools.arrow_line:
      // 箭头直线
      graphics.poly(pos, false)
      // 箭头
      graphics.poly(generateArrowPath(shape, doodle), false)
      graphics.stroke({
        width: strokeWidth,
        color: doodle.parseColor(shape.color || doodle.color),
      })
      graphics.fill(doodle.parseColor(shape.color || doodle.color), 0)
      break
    case doodle.tools.point:
      // 点
      graphics.circle(pos[0], pos[1], r)
      graphics.stroke({
        width: 0,
        color: doodle.parseColor(shape.color || doodle.color),
      })
      graphics.fill(doodle.parseColor(shape.color || doodle.color), 1)
      break
    default:
      break
  }
}
// 获取箭头的path
const generateArrowPath = (shape, doodle) => {
  const startPoint = [shape.pos[0], shape.pos[1]]
  const endPoint = [shape.pos[2], shape.pos[3]]
  // @ts-ignore
  const angle = lineAngle([startPoint, endPoint])
  const referencePoint = [endPoint[0], endPoint[1] + 10 / doodle.scale]
  // @ts-ignore
  const pointA = pointRotate(referencePoint, angle + 90 + 30, endPoint)
  // @ts-ignore
  const pointB = pointRotate(referencePoint, angle + 90 - 30, endPoint)
  return [pointA[0], pointA[1], endPoint[0], endPoint[1], pointB[0], pointB[1]]
}
