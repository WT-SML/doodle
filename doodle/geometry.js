import { lineLength, pointInPolygon } from "geometric"

// 点是否在shape内
export const pointInShape = (doodle, point, shape, buffer) => {
  if (!shape) {
    return false
  }
  const groupPairs = (arr) => {
    return arr.reduce((result, item, index) => {
      if (index % 2 === 0) {
        result.push(arr.slice(index, index + 2))
      }
      return result
    }, [])
  }
  const shapeTypePointInShapeFuncMap = {
    // 移动
    [doodle.tools.move]: (point, shape, buffer) => {},
    // 矩形
    [doodle.tools.rect]: (point, shape, buffer) => {
      return (
        point.x >= shape.pos[0] &&
        point.x <= shape.pos[0] + shape.pos[2] &&
        point.y >= shape.pos[1] &&
        point.y <= shape.pos[1] + shape.pos[3]
      )
    },
    // 多边形
    [doodle.tools.polygon]: (point, shape, buffer) => {
      return pointInPolygon([point.x, point.y], groupPairs(shape.pos))
    },
    // 圆
    [doodle.tools.circle]: (point, shape, buffer, rotation = 0) => {
      const cos = Math.cos(rotation)
      const sin = Math.sin(rotation)
      const dx = point.x - shape.pos[0]
      const dy = point.y - shape.pos[1]
      const tdx = cos * dx + sin * dy
      const tdy = sin * dx - cos * dy
      return (
        (tdx * tdx) / (shape.pos[2] * shape.pos[2]) +
          (tdy * tdy) / (shape.pos[2] * shape.pos[2]) <=
        1
      )
    },
    // 椭圆
    [doodle.tools.ellipse]: (point, shape, buffer, rotation = 0) => {
      const cos = Math.cos(rotation)
      const sin = Math.sin(rotation)
      const dx = point.x - shape.pos[0]
      const dy = point.y - shape.pos[1]
      const tdx = cos * dx + sin * dy
      const tdy = sin * dx - cos * dy
      return (
        (tdx * tdx) / (shape.pos[2] * shape.pos[2]) +
          (tdy * tdy) / (shape.pos[3] * shape.pos[3]) <=
        1
      )
    },
    // 路径
    [doodle.tools.path]: (point, shape, buffer) => {
      return pointInPolygon([point.x, point.y], groupPairs(shape.pos))
    },
    // 闭合路径
    [doodle.tools.closed_path]: (point, shape, buffer) => {
      return pointInPolygon([point.x, point.y], groupPairs(shape.pos))
    },
    // 直线
    [doodle.tools.line]: (point, shape, buffer) => {
      const { x, y } = point
      const dx = shape.pos[2] - shape.pos[0]
      const dy = shape.pos[3] - shape.pos[1]
      const d = Math.sqrt(dx * dx + dy * dy)
      const cross = Math.abs((x - shape.pos[0]) * dy - (y - shape.pos[1]) * dx)
      const dist = cross / d
      return dist <= buffer
    },
    // 箭头直线
    [doodle.tools.arrow_line]: (point, shape, buffer) => {
      const { x, y } = point
      const dx = shape.pos[2] - shape.pos[0]
      const dy = shape.pos[3] - shape.pos[1]
      const d = Math.sqrt(dx * dx + dy * dy)
      const cross = Math.abs((x - shape.pos[0]) * dy - (y - shape.pos[1]) * dx)
      const dist = cross / d
      return dist <= buffer
    },
    // 点
    [doodle.tools.point]: (point, shape, buffer) => {},
  }
  return shapeTypePointInShapeFuncMap[shape.type](point, shape, buffer)
}

// 获取shape的面积
export const getShapeArea = (doodle, shape) => {
  const shapeTypeGetShapeAreaFuncMap = {
    // 移动
    [doodle.tools.move]: (shape) => {},
    // 矩形
    [doodle.tools.rect]: (shape) => {
      return shape.pos[2] * shape.pos[3]
    },
    // 多边形
    [doodle.tools.polygon]: (shape) => {
      return getPolygonArea(shape.pos)
    },
    // 圆
    [doodle.tools.circle]: (shape) => {
      return shape.pos[2] * shape.pos[2] * Math.PI
    },
    // 椭圆
    [doodle.tools.ellipse]: (shape) => {
      return shape.pos[2] * shape.pos[3] * Math.PI
    },
    // 路径
    [doodle.tools.path]: (shape) => {
      return getPolygonArea(shape.pos)
    },
    // 闭合路径
    [doodle.tools.closed_path]: (shape) => {
      return getPolygonArea(shape.pos)
    },
    // 直线
    [doodle.tools.line]: (shape) => {
      return 0
    },
    // 箭头直线
    [doodle.tools.arrow_line]: (shape) => {
      return 0
    },
    // 点
    [doodle.tools.point]: (shape) => {
      return -1
    },
  }
  return shapeTypeGetShapeAreaFuncMap[shape.type](shape)
}

// 获取多边形面积
export const getPolygonArea = (pos) => {
  let area = 0
  const n = pos.length / 2
  for (let i = 0; i < n; i++) {
    const x1 = pos[2 * i]
    const y1 = pos[2 * i + 1]
    const x2 = pos[2 * ((i + 1) % n)]
    const y2 = pos[2 * ((i + 1) % n) + 1]
    area += x1 * y2 - x2 * y1
  }
  return Math.abs(area) / 2
}

// 多边形工具下距离初始点过近
export const isPolygonToolToStartPointTooClose = (doodle) => {
  if (!doodle.tempShape) {
    return false
  }
  if (doodle.tempShape.type !== doodle.tools.polygon) {
    return false
  }
  return (
    lineLength([
      [doodle.tempShape.pos[0], doodle.tempShape.pos[1]],
      [doodle.mouse.dx, doodle.mouse.dy],
    ]) <
    14 / doodle.scale
  )
}

// 获取悬浮的shape
export const getHoverShape = (doodle) => {
  if (doodle.mode !== doodle.tools.move) {
    return null
  }
  const scale = doodle.scale
  const buffer = scale ? doodle.hitRadius / scale : doodle.hitRadius
  const { dx, dy } = doodle.mouse
  const mouseBounds = {
    minX: dx - buffer,
    minY: dy - buffer,
    maxX: dx + buffer,
    maxY: dy + buffer,
  }
  // 外接矩形的粗略命中
  const cursoryHitBounds = doodle.bounds.search(mouseBounds)
  // 详细的命中
  const shapes = doodle.shapes
  const detailedHitBounds = cursoryHitBounds.filter((bounds) => {
    const shape = shapes.find((item) => item.id === bounds.id)
    if (shape?.type === doodle.tools.point) {
      return true
    }
    return pointInShape(doodle, { x: dx, y: dy }, shape, buffer)
  })
  // 返回详细命中中的面积最小的那一个
  if (detailedHitBounds.length) {
    if (detailedHitBounds.length === 1) {
      return shapes.find((item) => item.id === detailedHitBounds[0].id)
    }
    detailedHitBounds.sort((a, b) => {
      const shapeA = shapes.find((item) => item.id === a.id)
      const shapeB = shapes.find((item) => item.id === b.id)
      // @ts-ignore
      return getShapeArea(doodle, shapeA) - getShapeArea(doodle, shapeB)
    })
    return shapes.find((item) => item.id === detailedHitBounds[0].id)
  }
  return null
}

// 生成锚点列表
export const generateAnchors = (doodle) => {
  let getAnchors = (doodle) => {
    if (!doodle.tempShape) {
      return []
    }
    if (!doodle.tempShape.id) {
      return []
    }
    const shapeGetAnchorsFuncMap = {
      // 矩形
      [doodle.tools.rect]: (shape) => {
        return [
          // 左上
          { x: shape.pos[0], y: shape.pos[1] },
          // 右上
          { x: shape.pos[0] + shape.pos[2], y: shape.pos[1] },
          // 左下
          { x: shape.pos[0], y: shape.pos[1] + shape.pos[3] },
          // 右下
          {
            x: shape.pos[0] + shape.pos[2],
            y: shape.pos[1] + shape.pos[3],
          },
        ]
      },
      // 多边形
      [doodle.tools.polygon]: (shape) => {
        let ret = []
        for (let i = 0; i < shape.pos.length; i += 2) {
          ret.push({
            x: shape.pos[i],
            y: shape.pos[i + 1],
          })
        }
        return ret
      },
      // 圆
      [doodle.tools.circle]: (shape) => {
        return [
          {
            x: shape.pos[0] + shape.pos[2],
            y: shape.pos[1],
          },
        ]
      },
      // 椭圆
      [doodle.tools.ellipse]: (shape) => {
        return [
          {
            x: shape.pos[0],
            y: shape.pos[1] - shape.pos[3],
          },
          {
            x: shape.pos[0] + shape.pos[2],
            y: shape.pos[1],
          },
        ]
      },
      // 直线
      [doodle.tools.line]: (shape) => {
        return [
          { x: shape.pos[0], y: shape.pos[1] },
          { x: shape.pos[2], y: shape.pos[3] },
        ]
      },
      // 箭头直线
      [doodle.tools.arrow_line]: (shape) => {
        return [
          { x: shape.pos[0], y: shape.pos[1] },
          { x: shape.pos[2], y: shape.pos[3] },
        ]
      },
    }
    if (shapeGetAnchorsFuncMap[doodle.tempShape.type]) {
      return shapeGetAnchorsFuncMap[doodle.tempShape.type](doodle.tempShape)
    }
    return []
  }
  doodle.anchors = getAnchors(doodle)
}
// 悬浮的锚点
export const getHoverAnchor = (doodle) => {
  if (!doodle.anchors.length) {
    return null
  }
  for (const v of doodle.anchors) {
    if (
      lineLength([
        [v.x, v.y],
        [doodle.mouse.dx, doodle.mouse.dy],
      ]) <
      (doodle.anchorRadius + 2) / doodle.scale
    ) {
      return v
    }
  }
  return null
}
