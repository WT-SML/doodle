import { v4 as uuidv4 } from "uuid"
// 随机颜色
export const getRandomHexColor = () => {
  // 生成 0 ~ 0xFFFFFF 之间的随机整数
  const randomInt = Math.floor(Math.random() * 0x1000000)
  // 转换为16进制字符串，并确保长度为6位（不足则补零）
  const hexColor = randomInt.toString(16).padStart(6, "0")
  return `#${hexColor}`
}
// 随机点标注
export const randomPoints = (viewer, count = 0) => {
  const dziWidth = viewer.source.width
  const dziHeight = viewer.source.height
  const points = []
  for (let i = 0; i < count; i++) {
    const x = Math.random() * dziWidth
    const y = Math.random() * dziHeight
    points.push({
      id: uuidv4(),
      type: "point",
      pos: [x, y],
      color: getRandomHexColor(),
    })
  }
  return points
}
// 随机矩形标注
export const randomRects = (viewer, count = 0) => {
  const dziWidth = viewer.source.width
  const dziHeight = viewer.source.height
  const points = []
  for (let i = 0; i < count; i++) {
    const x = Math.random() * dziWidth
    const y = Math.random() * dziHeight
    points.push({
      id: uuidv4(),
      type: "rect",
      pos: [x, y, 200, 200],
      color: getRandomHexColor(),
    })
  }
  return points
}
