import { v4 as uuidv4 } from "uuid"
// 随机颜色
export const getRandomHexColor = () => {
  const colors = [
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#00FFFF",
    "#FF00FF",
    "#000000",
    "#FFFFFF",
  ]
  const randomIndex = Math.floor(Math.random() * colors.length)
  return colors[randomIndex]
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
