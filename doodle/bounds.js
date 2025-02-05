 // 获取形状边界
 export const getBounds = (shape) => {
  return shapeTypeGetBoundsFuncMap[shape.type](shape)
}
const shapeTypeGetBoundsFuncMap = {
  // 移动
  MOVE: (shape) => {},
  // 矩形
  RECT: (shape) => {
    return {
      minX: shape.meta.x,
      minY: shape.meta.y,
      maxX: shape.meta.x + shape.meta.width,
      maxY: shape.meta.y + shape.meta.height,
      id: shape.id,
    }
  },
  // 多边形
  POLYGON: (shape) => {
    return {
      ...getPolygonBounds(shape.meta.points),
      id: shape.id,
    }
  },
  // 圆
  CIRCLE: (shape) => {
    return {
      minX: shape.meta.cx - shape.meta.rx,
      minY: shape.meta.cy - shape.meta.ry,
      maxX: shape.meta.cx + shape.meta.rx,
      maxY: shape.meta.cy + shape.meta.ry,
      id: shape.id,
    }
  },
  // 椭圆
  ELLIPSE: (shape) => {
    return {
      minX: shape.meta.cx - shape.meta.rx,
      minY: shape.meta.cy - shape.meta.ry,
      maxX: shape.meta.cx + shape.meta.rx,
      maxY: shape.meta.cy + shape.meta.ry,
      id: shape.id,
    }
  },
  // 路径
  PATH: (shape) => {
    return {
      ...getPolygonBounds(shape.meta.d),
      id: shape.id,
    }
  },
  // 闭合路径
  CLOSED_PATH: (shape) => {
    return {
      ...getPolygonBounds(shape.meta.d),
      id: shape.id,
    }
  },
  // 直线
  LINE: (shape) => {
    return {
      minX: Math.min(shape.meta.x1, shape.meta.x2),
      minY: Math.min(shape.meta.y1, shape.meta.y2),
      maxX: Math.max(shape.meta.x1, shape.meta.x2),
      maxY: Math.max(shape.meta.y1, shape.meta.y2),
      id: shape.id,
    }
  },
  // 箭头直线
  ARROW_LINE: (shape) => {
    return {
      minX: Math.min(shape.meta.x1, shape.meta.x2),
      minY: Math.min(shape.meta.y1, shape.meta.y2),
      maxX: Math.max(shape.meta.x1, shape.meta.x2),
      maxY: Math.max(shape.meta.y1, shape.meta.y2),
      id: shape.id,
    }
  },
  // 点
  POINT: (shape) => {
    return {
      minX: shape.meta.cx,
      minY: shape.meta.cy,
      maxX: shape.meta.cx,
      maxY: shape.meta.cy,
      id: shape.id,
    }
  },
  // 多选
  MULTISELECT: (shape) => {},
  // 排除
  EXCLUSION: (shape) => {},
}