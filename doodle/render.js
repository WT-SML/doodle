import osd from "openseadragon"
import { lineAngle, pointRotate } from "geometric"

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
  // 已有形状
  for (const shape of doodle.shapes) {
    drawShape(shape, doodle)
  }
  // 新增形状
  if (doodle.tempShape && !doodle.tempShape.id)
    drawShape(doodle.tempShape, doodle)
  // 锚点
  drawAnchors(doodle)
}

// 绘制shape
export const drawShape = (shape, doodle) => {
  const isHover = doodle.hoverShape && doodle.hoverShape.id === shape.id
  const isEdit =
    doodle.tempShape && doodle.tempShape.id && doodle.tempShape.id === shape.id

  const strokeWidth =
    (isHover ? doodle.strokeWidth + 1 : doodle.strokeWidth) / doodle.scale
  const pointRadius =
    (isHover ? doodle.pointRadius + 1 : doodle.pointRadius) / doodle.scale
  const alpha = isEdit ? 0.2 : 0

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
      graphics.fill({
        color: doodle.parseColor(shape.color || doodle.color),
        alpha,
      })
      break
    case doodle.tools.polygon:
      // 多边形
      graphics.poly(pos)
      graphics.stroke({
        width: strokeWidth,
        color: doodle.parseColor(shape.color || doodle.color),
      })
      graphics.fill({
        color: doodle.parseColor(shape.color || doodle.color),
        alpha,
      })
      break
    case doodle.tools.circle:
      // 圆
      graphics.circle(pos[0], pos[1], pos[2])
      graphics.stroke({
        width: strokeWidth,
        color: doodle.parseColor(shape.color || doodle.color),
      })
      graphics.fill({
        color: doodle.parseColor(shape.color || doodle.color),
        alpha,
      })
      break
    case doodle.tools.ellipse:
      // 椭圆
      graphics.ellipse(pos[0], pos[1], pos[2], pos[3])
      graphics.stroke({
        width: strokeWidth,
        color: doodle.parseColor(shape.color || doodle.color),
      })
      graphics.fill({
        color: doodle.parseColor(shape.color || doodle.color),
        alpha,
      })
      break
    case doodle.tools.path:
      // 路径
      graphics.poly(pos, false)
      graphics.stroke({
        width: strokeWidth,
        color: doodle.parseColor(shape.color || doodle.color),
      })
      graphics.fill({
        color: doodle.parseColor(shape.color || doodle.color),
        alpha,
      })
      break
    case doodle.tools.closed_path:
      // 闭合路径
      graphics.poly(pos)
      graphics.stroke({
        width: strokeWidth,
        color: doodle.parseColor(shape.color || doodle.color),
      })
      graphics.fill({
        color: doodle.parseColor(shape.color || doodle.color),
        alpha,
      })
      break
    case doodle.tools.line:
      // 直线
      graphics.poly(pos, false)
      graphics.stroke({
        width: strokeWidth,
        color: doodle.parseColor(shape.color || doodle.color),
      })
      graphics.fill({
        color: doodle.parseColor(shape.color || doodle.color),
        alpha: 0,
      })
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
      graphics.fill({
        color: doodle.parseColor(shape.color || doodle.color),
        alpha: 0,
      })
      break
    case doodle.tools.point:
      // 点
      graphics.circle(pos[0], pos[1], pointRadius)
      const myStrokeWidth = (isEdit ? doodle.strokeWidth + 2 : 0) / doodle.scale
      const fillColor = isEdit ? "#FFFFFF" : shape.color || doodle.color
      graphics.stroke({
        width: myStrokeWidth,
        color: doodle.parseColor(shape.color || doodle.color),
      })
      graphics.fill({
        color: doodle.parseColor(fillColor),
        alpha: 1,
      })
      break
    default:
      break
  }
}

// 获取箭头的path
export const generateArrowPath = (shape, doodle) => {
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

// 绘制锚点
export const drawAnchors = (doodle) => {
  const strokeWidth = (doodle.strokeWidth + 2) / doodle.scale
  const anchorRadius = doodle.anchorRadius / doodle.scale
  const graphics = doodle.graphics
  for (const anchor of doodle.anchors) {
    graphics.circle(anchor.x, anchor.y, anchorRadius)
    graphics.stroke({
      width: strokeWidth,
      color: doodle.parseColor(doodle.tempShape?.color || doodle.color),
    })
    graphics.fill({
      color: doodle.parseColor("#FFFFFF"),
      alpha: 1,
    })
  }
}
