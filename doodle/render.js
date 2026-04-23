import osd from "openseadragon"
import { lineAngle, pointRotate } from "geometric"

// 渲染方法
export const render = (doodle) => {
	const viewport = doodle.viewer.viewport // osd 视口对象
	const scale = doodle.getScale() // 缩放
	const flipped = viewport.getFlip() // 翻转
	const angle = viewport.getRotation(true) // 旋转角度
	let rotation = angle * (Math.PI / 180) // 旋转弧度
	// 归一化到 [0, 2π] 范围
	if (rotation < 0) rotation += 2 * Math.PI
	if (rotation > 2 * Math.PI) rotation -= 2 * Math.PI
	// 旋转翻转
	rotation = flipped ? -rotation : rotation
	// 图像左上角原点相对于视口的偏移
	const origin = viewport.pixelFromPoint(new osd.Point(0, 0), true)
	if (flipped) {
		origin.x = viewport._containerInnerSize.x - origin.x
	}
	const tx = origin.x // x轴平移
	const ty = origin.y // y轴平移
	doodle.scale = scale
	doodle.translate.x = tx
	doodle.translate.y = ty
	doodle.pixiApp.stage.x = tx
	doodle.pixiApp.stage.y = ty
	doodle.pixiApp.stage.scale.set(flipped ? -scale : scale, scale)
	doodle.pixiApp.stage.rotation = rotation
	// 更新非点图形
	drawShapes(doodle)
	// Mesh
	updatePointMesh(doodle)
}
// 更新点的Mesh
export const updatePointMesh = (doodle) => {
	if (!doodle.pointMesh) return
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
	const colorGroup = {}
	const graphics = doodle.graphics
	const strokeWidth = doodle.strokeWidth / doodle.scale
	const largeStrokeWidth = (doodle.strokeWidth + 1) / doodle.scale
	const pointStrokeWidth = (doodle.strokeWidth + 2) / doodle.scale
	// 已有形状
	for (const shape of doodle.shapes) {
		// 点单独渲染
		if (shape.type === doodle.tools.point) continue
		// 新增or编辑形状单独渲染
		if (doodle.tempShape && doodle.tempShape.id === shape.id) continue
		// hover形状单独渲染
		if (doodle.hoverShape && doodle.hoverShape.id === shape.id) continue
		// 分组
		if (colorGroup[shape.color]) {
			colorGroup[shape.color].push(shape)
		} else {
			colorGroup[shape.color] = [shape]
		}
	}
	for (const k in colorGroup) {
		const v = colorGroup[k]
		for (const shape of v) {
			drawShape(shape, doodle)
		}
		// 染色
		graphics.stroke({
			width: strokeWidth,
			color: doodle.parseColor(k),
		})
		graphics.fill({
			color: doodle.parseColor(k),
			alpha: 0,
		})
	}
	if (
		doodle.tempShape &&
		doodle.hoverShape &&
		doodle.tempShape.id === doodle.hoverShape.id
	) {
		// 新增or编辑形状 和 hover形状是同一个
		drawShape(doodle.tempShape, doodle)
		// 染色
		if (doodle.tempShape.type === doodle.tools.point) {
			// 点
			graphics.stroke({
				width: pointStrokeWidth,
				color: doodle.parseColor(doodle.tempShape.color),
			})
			graphics.fill({
				color: doodle.parseColor("#FFFFFF"),
				alpha: 1,
			})
		} else {
			// 其他
			graphics.stroke({
				width: largeStrokeWidth,
				color: doodle.parseColor(doodle.tempShape.color),
			})
			graphics.fill({
				color: doodle.parseColor(doodle.tempShape.color),
				alpha: 0.2,
			})
		}
	} else {
		// 新增or编辑形状
		if (doodle.tempShape) {
			drawShape(doodle.tempShape, doodle)
			// 染色
			if (doodle.tempShape.type === doodle.tools.point) {
				// 点
				graphics.stroke({
					width: pointStrokeWidth,
					color: doodle.parseColor(doodle.tempShape.color),
				})
				graphics.fill({
					color: doodle.parseColor("#FFFFFF"),
					alpha: 1,
				})
			} else {
				graphics.stroke({
					width: strokeWidth,
					color: doodle.parseColor(doodle.tempShape.color),
				})
				graphics.fill({
					color: doodle.parseColor(doodle.tempShape.color),
					alpha: doodle.tempShape.id ? 0.2 : 0,
				})
			}
		}
		// hover形状
		if (doodle.hoverShape) {
			drawShape(doodle.hoverShape, doodle)
			if (doodle.hoverShape.type === doodle.tools.point) {
				// 点
				graphics.stroke({
					width: pointStrokeWidth,
					color: doodle.parseColor(doodle.hoverShape.color),
				})
				graphics.fill({
					color: doodle.parseColor(doodle.hoverShape.color),
					alpha: 1,
				})
			} else {
				graphics.stroke({
					width: largeStrokeWidth,
					color: doodle.parseColor(doodle.hoverShape.color),
				})
				graphics.fill({
					color: doodle.parseColor(doodle.hoverShape.color),
					alpha: 0,
				})
			}
		}
	}
	// 锚点
	drawAnchors(doodle)
}

// 绘制shape
export const drawShape = (shape, doodle) => {
	const isHover = doodle.hoverShape && doodle.hoverShape.id === shape.id
	const pointRadius =
		(isHover ? doodle.pointRadius + 1 : doodle.pointRadius) / doodle.scale
	const color = shape.id
		? shape.color || doodle.defaultColor
		: shape.color || doodle.brushColor
	const graphics = doodle.graphics
	const pos = shape.pos
	switch (shape.type) {
		case doodle.tools.rect:
			// 矩形
			graphics.rect(pos[0], pos[1], pos[2], pos[3])
			break
		case doodle.tools.polygon:
			// 多边形
			graphics.poly(pos, !!shape.id)
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
			graphics.poly(pos, !!shape.id)
			break
		case doodle.tools.line:
			// 直线
			graphics.poly(pos, false)
			break
		case doodle.tools.arrow_line:
			// 箭头直线
			graphics.poly(pos, false)
			// 箭头
			graphics.poly(generateArrowPath(shape, doodle), false)
			break
		case doodle.tools.point:
			// 点
			graphics.circle(pos[0], pos[1], pointRadius)
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
