// 颜色转换
export const hexToRGB = (hex) => {
  // 去掉可能存在的 #
  hex = hex.replace(/^#/, "")
  // 将 3 位简写转为 6 位
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("")
  }
  const intVal = parseInt(hex, 16)
  const r = ((intVal >> 16) & 255) / 255
  const g = ((intVal >> 8) & 255) / 255
  const b = (intVal & 255) / 255
  return [r, g, b]
}
// 生成圆形的geometry
export const generateCircleGeometry = (segments = 40, radius = 6) => {
  const vertexCount = segments + 2 // 中心点 + 圆周上 (segments + 1) 个点（闭合圆周）
  // 创建顶点数组，每个顶点 2 个分量 (x, y)
  const positions = new Float32Array(vertexCount * 2)
  // 第一个顶点为圆心，位置 (0, 0)；对应的 UV 为 (0.5, 0.5)
  positions[0] = 0
  positions[1] = 0
  // 生成圆周上的顶点数据
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    // 将顶点数据存入 positions 数组
    positions[(i + 1) * 2] = x
    positions[(i + 1) * 2 + 1] = y
  }
  // 如果不指定绘制模式，需要生成索引数组将三角扇转换为三角形列表
  // 每个三角形使用圆心（索引 0）和圆周上相邻的两个点
  const indices = new Uint16Array(segments * 3)
  for (let i = 0; i < segments; i++) {
    indices[i * 3] = 0 // 圆心
    indices[i * 3 + 1] = i + 1 // 当前圆周点
    indices[i * 3 + 2] = i + 2 // 下一个圆周点
  }
  return { positions, indices }
}
