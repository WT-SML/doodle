import osd from "openseadragon"
import { lineAngle, pointRotate } from "geometric"

// 渲染方法
export const render = (doodle) => {
  const viewport = doodle.viewer.viewport
  const flipped = viewport.getFlip()
  const p = viewport.pixelFromPoint(new osd.Point(0, 0), true)
  if (flipped) {
    p.x = viewport._containerInnerSize.x - p.x
  }
  const scale = doodle.getScale()
  doodle.scale = scale
  doodle.translate = p
  doodle.pixiApp.stage.x = p.x
  doodle.pixiApp.stage.y = p.y
  doodle.pixiApp.stage.scale = scale
  // 更新非点图形
  drawShapes(doodle)
  // Mesh
  updatePointMesh(doodle)
}
// 更新点的Mesh
export const updatePointMesh = (doodle) => {
  const scale = doodle.scale
  doodle.pointMesh.scale = 1 / scale
  const instancePositionBuffer =
    doodle.pointMesh.geometry.attributes.aPositionOffset.buffer
  const data = instancePositionBuffer.data
  let count = 0
  for (let _i in doodle.points) {
    let i = Number(_i)
    const point = doodle.points[i]
    data[count++] = point.pos[0] * scale
    data[count++] = point.pos[1] * scale
  }
  instancePositionBuffer.update()
}

// 绘制shapes
export const drawShapes = (doodle) => {
  doodle.graphics.clear()
  // 已有形状
  for (const shape of doodle.shapes) {
    if (doodle.tempShape && doodle.tempShape.id === shape.id) continue
    if (shape.type === doodle.tools.point) continue
    drawShape(shape, doodle)
  }
  // 新增形状
  if (doodle.tempShape) drawShape(doodle.tempShape, doodle)
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
  const color = shape.id
    ? shape.color || doodle.defaultColor
    : shape.color || doodle.brushColor

  const graphics = doodle.graphics
  const pos = shape.pos

  switch (shape.type) {
    case doodle.tools.rect:
      // 矩形
      graphics.rect(pos[0], pos[1], pos[2], pos[3])
      graphics.stroke({
        width: strokeWidth,
        color: doodle.parseColor(color),
      })
      graphics.fill({
        color: doodle.parseColor(color),
        alpha,
      })
      break
    case doodle.tools.polygon:
      // 多边形
      graphics.poly(pos, !!shape.id)
      graphics.stroke({
        width: strokeWidth,
        color: doodle.parseColor(color),
      })
      graphics.fill({
        color: doodle.parseColor(color),
        alpha,
      })
      // 闭合锚点
      if (!shape.id) {
        const anchorStrokeWidth = (doodle.strokeWidth + 2) / doodle.scale
        const anchorRadius = doodle.anchorRadius / doodle.scale
        graphics.circle(pos[0], pos[1], anchorRadius)
        graphics.stroke({
          width: anchorStrokeWidth,
          color: doodle.parseColor(color),
        })
        graphics.fill({
          color: doodle.parseColor("#FFFFFF"),
          alpha: 1,
        })
      }
      break
    case doodle.tools.circle:
      // 圆
      graphics.circle(pos[0], pos[1], pos[2])
      graphics.stroke({
        width: strokeWidth,
        color: doodle.parseColor(color),
      })
      graphics.fill({
        color: doodle.parseColor(color),
        alpha,
      })
      break
    case doodle.tools.ellipse:
      // 椭圆
      graphics.ellipse(pos[0], pos[1], pos[2], pos[3])
      graphics.stroke({
        width: strokeWidth,
        color: doodle.parseColor(color),
      })
      graphics.fill({
        color: doodle.parseColor(color),
        alpha,
      })
      break
    case doodle.tools.path:
      // 路径
      graphics.poly(pos, false)
      graphics.stroke({
        width: strokeWidth,
        color: doodle.parseColor(color),
      })
      graphics.fill({
        color: doodle.parseColor(color),
        alpha,
      })
      break
    case doodle.tools.closed_path:
      // 闭合路径
      graphics.poly(pos, !!shape.id)
      graphics.stroke({
        width: strokeWidth,
        color: doodle.parseColor(color),
      })
      graphics.fill({
        color: doodle.parseColor(color),
        alpha,
      })
      break
    case doodle.tools.line:
      // 直线
      graphics.poly(pos, false)
      graphics.stroke({
        width: strokeWidth,
        color: doodle.parseColor(color),
      })
      graphics.fill({
        color: doodle.parseColor(color),
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
        color: doodle.parseColor(color),
      })
      graphics.fill({
        color: doodle.parseColor(color),
        alpha: 0,
      })
      break
    case doodle.tools.point:
      // 点
      graphics.circle(pos[0], pos[1], pointRadius)
      const myStrokeWidth = (isEdit ? doodle.strokeWidth + 2 : 0) / doodle.scale
      const fillColor = isEdit ? "#FFFFFF" : color
      graphics.stroke({
        width: myStrokeWidth,
        color: doodle.parseColor(color),
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
  const color = doodle.tempShape?.id
    ? doodle.tempShape?.color || doodle.defaultColor
    : doodle.tempShape?.color || doodle.brushColor
  for (const anchor of doodle.anchors) {
    graphics.circle(anchor.x, anchor.y, anchorRadius)
    graphics.stroke({
      width: strokeWidth,
      color: doodle.parseColor(color),
    })
    graphics.fill({
      color: doodle.parseColor("#FFFFFF"),
      alpha: 1,
    })
  }
}
