// 获取形状边界
export const getBounds = (shape, doodle) => {
  const shapeTypeGetBoundsFuncMap = {
    // 矩形
    [doodle.tools.rect]: (shape) => {
      return {
        minX: shape.pos[0],
        minY: shape.pos[1],
        maxX: shape.pos[0] + shape.pos[2],
        maxY: shape.pos[1] + shape.pos[3],
        id: shape.id,
      }
    },
    // 多边形
    [doodle.tools.polygon]: (shape) => {
      return {
        ...getPolygonBounds(shape.pos),
        id: shape.id,
      }
    },
    // 圆
    [doodle.tools.circle]: (shape) => {
      return {
        minX: shape.pos[0] - shape.pos[2],
        minY: shape.pos[1] - shape.pos[2],
        maxX: shape.pos[0] + shape.pos[2],
        maxY: shape.pos[1] + shape.pos[2],
        id: shape.id,
      }
    },
    // 椭圆
    [doodle.tools.ellipse]: (shape) => {
      return {
        minX: shape.pos[0] - shape.pos[2],
        minY: shape.pos[1] - shape.pos[3],
        maxX: shape.pos[0] + shape.pos[2],
        maxY: shape.pos[1] + shape.pos[3],
        id: shape.id,
      }
    },
    // 路径
    [doodle.tools.path]: (shape) => {
      return {
        ...getPolygonBounds(shape.pos),
        id: shape.id,
      }
    },
    // 闭合路径
    [doodle.tools.closed_path]: (shape) => {
      return {
        ...getPolygonBounds(shape.pos),
        id: shape.id,
      }
    },
    // 直线
    [doodle.tools.line]: (shape) => {
      return {
        minX: Math.min(shape.pos[0], shape.pos[2]),
        minY: Math.min(shape.pos[1], shape.pos[3]),
        maxX: Math.max(shape.pos[0], shape.pos[2]),
        maxY: Math.max(shape.pos[1], shape.pos[3]),
        id: shape.id,
      }
    },
    // 箭头直线
    [doodle.tools.arrow_line]: (shape) => {
      return {
        minX: Math.min(shape.pos[0], shape.pos[2]),
        minY: Math.min(shape.pos[1], shape.pos[3]),
        maxX: Math.max(shape.pos[0], shape.pos[2]),
        maxY: Math.max(shape.pos[1], shape.pos[3]),
        id: shape.id,
      }
    },
    // 点
    [doodle.tools.point]: (shape) => {
      return {
        minX: shape.pos[0],
        minY: shape.pos[1],
        maxX: shape.pos[0],
        maxY: shape.pos[1],
        id: shape.id,
      }
    },
  }
  return shapeTypeGetBoundsFuncMap[shape.type](shape)
}

// 获取多边形边界
export const getPolygonBounds = (pos) => {
  const xMap = pos.filter((item, i) => i % 2 === 0)
  const yMap = pos.filter((item, i) => i % 2 !== 0)
  return {
    minX: Math.min(...xMap),
    minY: Math.min(...yMap),
    maxX: Math.max(...xMap),
    maxY: Math.max(...yMap),
  }
}
