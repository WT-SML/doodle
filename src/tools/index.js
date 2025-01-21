export const randomPoints = (viewer, count = 0) => {
  const dziWidth = viewer.source.width
  const dziHeight = viewer.source.height
  const points = []
  for (let i = 0; i < count; i++) {
    const x = Math.random() * dziWidth
    const y = Math.random() * dziHeight
    points.push({
      id: String(Date.now() - count + i),
      type: "POINT",
      pos: [x, y],
    })
  }
  return points
}
