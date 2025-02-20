import _ from "lodash"
import { isPolygonToolToStartPointTooClose } from "./geometry"

// 鼠标按下
export const handleMouseDown = (doodle) => {
  getMouseHandler(doodle).handleMouseDown()
}
// 鼠标抬起
export const handleMouseUp = (doodle) => {
  getMouseHandler(doodle).handleMouseUp()
}
// 鼠标移动
export const handleMouseMove = (doodle) => {
  getMouseHandler(doodle).handleMouseMove()
}

let lastMouseDownTimestamp = 0 // 多边形工具下判断双击完成形状的时间戳
let tempCurMousePoint = null // 开始编辑前的鼠标位置
let tempShape = null // 开始编辑前形状的副本
let tempAnchor = null // 开始编辑前锚点的副本

// 获取鼠标处理器
export const getMouseHandler = (doodle) => {
  // 工具对应的鼠标处理函数
  const toolsMouseMap = {
    // 移动
    [doodle.tools.move]: {
      // 按下
      handleMouseDown: () => {
        const curMouseDownTimestamp = new Date().getTime()
        lastMouseDownTimestamp = curMouseDownTimestamp // 多边形工具下判断双击完成形状的时间戳
        // 在锚点上按下
        if (doodle.tempShape && doodle.hoverAnchor) {
          doodle.setPan(false)
          tempCurMousePoint = {
            x: doodle.mouse.dx,
            y: doodle.mouse.dy,
          }
          tempAnchor = _.cloneDeep(doodle.hoverAnchor)
          tempShape = _.cloneDeep(doodle.tempShape)
          return
        }
        // 在编辑的shape上按下
        if (
          doodle.tempShape &&
          doodle.hoverShape &&
          doodle.tempShape.id === doodle.hoverShape.id
        ) {
          doodle.setPan(false)
          tempCurMousePoint = {
            x: doodle.mouse.dx,
            y: doodle.mouse.dy,
          }
          tempAnchor = null
          tempShape = _.cloneDeep(doodle.tempShape)
          return
        }
        tempCurMousePoint = null
        tempShape = null
        tempAnchor = null
        doodle.setPan(true)
      },
      // 抬起
      handleMouseUp: () => {
        const curMouseDownTimestamp = new Date().getTime()
        const diff = curMouseDownTimestamp - lastMouseDownTimestamp
        if (diff < 150) {
          // 短按
          // 短按了锚点
          if (doodle.hoverAnchor) {
            return
          }
          // 短按了形状
          if (doodle.hoverShape) {
            // 当前有编辑中的形状
            if (doodle.tempShape) {
              if (doodle.tempShape.id !== doodle.hoverShape.id) {
                const originalShape = doodle.shapes.find(
                  (item) => item.id === doodle.tempShape.id
                )
                if (
                  JSON.stringify(originalShape) !==
                  JSON.stringify(doodle.tempShape)
                ) {
                  doodle.conf.onUpdate(_.cloneDeep(doodle.tempShape))
                }
                doodle.tempShape = _.cloneDeep(doodle.hoverShape)
              }
              // 当前没有编辑中的形状
            } else {
              doodle.tempShape = _.cloneDeep(doodle.hoverShape)
              if (doodle.tempShape.type === doodle.tools.point) {
                doodle.generatePoints()
              }
            }
            return
          }
          // 短按空白区域
          if (doodle.tempShape) {
            // 如果有临时shape则触发编辑保存
            const originalShape = doodle.shapes.find(
              (item) => item.id === doodle.tempShape.id
            )
            if (
              JSON.stringify(originalShape) !== JSON.stringify(doodle.tempShape)
            ) {
              doodle.conf.onUpdate(_.cloneDeep(doodle.tempShape))
            }
            doodle.tempShape = null
            if (originalShape.type === doodle.tools.point) {
              doodle.generatePoints()
            }
          }
        } else {
          // 长按
        }
      },
      // 移动
      handleMouseMove: () => {
        // 在锚点上移动
        if (doodle.tempShape && tempAnchor && doodle.mouse.isPressed) {
          const diff = {
            x: doodle.mouse.dx - tempCurMousePoint.x,
            y: doodle.mouse.dy - tempCurMousePoint.y,
          }
          const anchorHandleMoveFuncMap = {
            // 矩形
            [doodle.tools.rect]: (shape, cloneShape, tempAnchor, diff) => {
              // 左上
              if (
                tempAnchor.x === cloneShape.pos[0] &&
                tempAnchor.y === cloneShape.pos[1]
              ) {
                if (diff.x < cloneShape.pos[2]) {
                  shape.pos[0] = cloneShape.pos[0] + diff.x
                  shape.pos[2] = cloneShape.pos[2] - diff.x
                } else {
                  shape.pos[0] = cloneShape.pos[0] + cloneShape.pos[2]
                  shape.pos[2] = diff.x - cloneShape.pos[2]
                }
                if (diff.y < cloneShape.pos[3]) {
                  shape.pos[1] = cloneShape.pos[1] + diff.y
                  shape.pos[3] = cloneShape.pos[3] - diff.y
                } else {
                  shape.pos[1] = cloneShape.pos[1] + cloneShape.pos[3]
                  shape.pos[3] = diff.y - cloneShape.pos[3]
                }
                return
              }
              // 右上
              if (
                tempAnchor.x === cloneShape.pos[0] + cloneShape.pos[2] &&
                tempAnchor.y === cloneShape.pos[1]
              ) {
                if (diff.x < -cloneShape.pos[2]) {
                  shape.pos[0] = cloneShape.pos[0] + cloneShape.pos[2] + diff.x
                  shape.pos[2] = -diff.x - cloneShape.pos[2]
                } else {
                  shape.pos[2] = cloneShape.pos[2] + diff.x
                }
                if (diff.y > cloneShape.pos[3]) {
                  shape.pos[1] = cloneShape.pos[1] + cloneShape.pos[3]
                  shape.pos[3] = diff.y - cloneShape.pos[3]
                } else {
                  shape.pos[1] = cloneShape.pos[1] + diff.y
                  shape.pos[3] = cloneShape.pos[3] - diff.y
                }
                return
              }
              // 左下
              if (
                tempAnchor.x === cloneShape.pos[0] &&
                tempAnchor.y === cloneShape.pos[1] + cloneShape.pos[3]
              ) {
                if (diff.x < cloneShape.pos[2]) {
                  shape.pos[0] = cloneShape.pos[0] + diff.x
                  shape.pos[2] = cloneShape.pos[2] - diff.x
                } else {
                  shape.pos[0] = cloneShape.pos[0] + cloneShape.pos[2]
                  shape.pos[2] = diff.x - cloneShape.pos[2]
                }
                if (-diff.y > cloneShape.pos[3]) {
                  shape.pos[1] = cloneShape.pos[1] + cloneShape.pos[3] + diff.y
                  shape.pos[3] = -diff.y - cloneShape.pos[3]
                } else {
                  shape.pos[3] = cloneShape.pos[3] + diff.y
                }
              }
              // 右下
              if (
                tempAnchor.x === cloneShape.pos[0] + cloneShape.pos[2] &&
                tempAnchor.y === cloneShape.pos[1] + cloneShape.pos[3]
              ) {
                if (diff.x < -cloneShape.pos[2]) {
                  shape.pos[0] = cloneShape.pos[0] + cloneShape.pos[2] + diff.x
                  shape.pos[2] = -diff.x - cloneShape.pos[2]
                } else {
                  shape.pos[2] = cloneShape.pos[2] + diff.x
                }
                if (-diff.y > cloneShape.pos[3]) {
                  shape.pos[1] = cloneShape.pos[1] + cloneShape.pos[3] + diff.y
                  shape.pos[3] = -diff.y - cloneShape.pos[3]
                } else {
                  shape.pos[3] = cloneShape.pos[3] + diff.y
                }
                return
              }
            },
            // 多边形
            [doodle.tools.polygon]: (shape, cloneShape, tempAnchor, diff) => {
              let targetIndex = 0
              for (const _i in cloneShape.pos) {
                let i = Number(_i)
                const item = cloneShape.pos[i]
                const next = cloneShape.pos[i + 1]
                if (
                  i % 2 === 0 &&
                  item === tempAnchor.x &&
                  next === tempAnchor.y
                ) {
                  targetIndex = Number(i)
                  break
                }
              }
              shape.pos[targetIndex] = tempAnchor.x + diff.x
              shape.pos[targetIndex + 1] = tempAnchor.y + diff.y
            },
            // 圆
            [doodle.tools.circle]: (shape, cloneShape, tempAnchor, diff) => {
              const ret = Math.max(cloneShape.pos[2] + diff.x, 1)
              shape.pos[2] = ret
            },
            // 椭圆
            [doodle.tools.ellipse]: (shape, cloneShape, tempAnchor, diff) => {
              // 上边的点
              if (
                tempAnchor.x === cloneShape.pos[0] &&
                tempAnchor.y === cloneShape.pos[1] - cloneShape.pos[3]
              ) {
                const ret = Math.max(cloneShape.pos[3] - diff.y, 1)
                shape.pos[3] = ret
                return
              }
              // 右边的点
              if (
                tempAnchor.x === cloneShape.pos[0] + cloneShape.pos[2] &&
                tempAnchor.y === cloneShape.pos[1]
              ) {
                const ret = Math.max(cloneShape.pos[2] + diff.x, 1)
                shape.pos[2] = ret
                return
              }
            },
            // 直线
            [doodle.tools.line]: (shape, cloneShape, tempAnchor, diff) => {
              // 起始点
              if (
                tempAnchor.x === cloneShape.pos[0] &&
                tempAnchor.y === cloneShape.pos[1]
              ) {
                shape.pos[0] = cloneShape.pos[0] + diff.x
                shape.pos[1] = cloneShape.pos[1] + diff.y
                return
              }
              // 结束点
              if (
                tempAnchor.x === cloneShape.pos[2] &&
                tempAnchor.y === cloneShape.pos[3]
              ) {
                shape.pos[2] = cloneShape.pos[2] + diff.x
                shape.pos[3] = cloneShape.pos[3] + diff.y
                return
              }
            },
            // 箭头直线
            [doodle.tools.arrow_line]: (
              shape,
              cloneShape,
              tempAnchor,
              diff
            ) => {
              // 起始点
              if (
                tempAnchor.x === cloneShape.pos[0] &&
                tempAnchor.y === cloneShape.pos[1]
              ) {
                shape.pos[0] = cloneShape.pos[0] + diff.x
                shape.pos[1] = cloneShape.pos[1] + diff.y
                return
              }
              // 结束点
              if (
                tempAnchor.x === cloneShape.pos[2] &&
                tempAnchor.y === cloneShape.pos[3]
              ) {
                shape.pos[2] = cloneShape.pos[2] + diff.x
                shape.pos[3] = cloneShape.pos[3] + diff.y
                return
              }
            },
          }
          anchorHandleMoveFuncMap[doodle.tempShape.type](
            doodle.tempShape,
            tempShape,
            tempAnchor,
            diff
          )
          return
        }
        // 在编辑的shape上移动
        if (doodle.tempShape && tempShape && doodle.mouse.isPressed) {
          const diff = {
            x: doodle.mouse.dx - tempCurMousePoint.x,
            y: doodle.mouse.dy - tempCurMousePoint.y,
          }
          const shapeHandleMoveFuncMap = {
            // 矩形
            [doodle.tools.rect]: (shape, cloneShape, diff) => {
              shape.pos[0] = cloneShape.pos[0] + diff.x
              shape.pos[1] = cloneShape.pos[1] + diff.y
            },
            // 多边形
            [doodle.tools.polygon]: (shape, cloneShape, diff) => {
              shape.pos = cloneShape.pos.map((item, i) => {
                if (i % 2 === 0) {
                  return item + diff.x
                } else {
                  return item + diff.y
                }
              })
            },
            // 圆
            [doodle.tools.circle]: (shape, cloneShape, diff) => {
              shape.pos[0] = cloneShape.pos[0] + diff.x
              shape.pos[1] = cloneShape.pos[1] + diff.y
            },
            // 椭圆
            [doodle.tools.ellipse]: (shape, cloneShape, diff) => {
              shape.pos[0] = cloneShape.pos[0] + diff.x
              shape.pos[1] = cloneShape.pos[1] + diff.y
            },
            // 路径
            [doodle.tools.path]: (shape, cloneShape, diff) => {
              shape.pos = cloneShape.pos.map((item, i) => {
                if (i % 2 === 0) {
                  return item + diff.x
                } else {
                  return item + diff.y
                }
              })
            },
            // 闭合路径
            [doodle.tools.closed_path]: (shape, cloneShape, diff) => {
              shape.pos = cloneShape.pos.map((item, i) => {
                if (i % 2 === 0) {
                  return item + diff.x
                } else {
                  return item + diff.y
                }
              })
            },
            // 直线
            [doodle.tools.line]: (shape, cloneShape, diff) => {
              shape.pos[0] = cloneShape.pos[0] + diff.x
              shape.pos[1] = cloneShape.pos[1] + diff.y
              shape.pos[2] = cloneShape.pos[2] + diff.x
              shape.pos[3] = cloneShape.pos[3] + diff.y
            },
            // 箭头直线
            [doodle.tools.arrow_line]: (shape, cloneShape, diff) => {
              shape.pos[0] = cloneShape.pos[0] + diff.x
              shape.pos[1] = cloneShape.pos[1] + diff.y
              shape.pos[2] = cloneShape.pos[2] + diff.x
              shape.pos[3] = cloneShape.pos[3] + diff.y
            },
            // 点
            [doodle.tools.point]: (shape, cloneShape, diff) => {
              shape.pos[0] = cloneShape.pos[0] + diff.x
              shape.pos[1] = cloneShape.pos[1] + diff.y
            },
          }
          shapeHandleMoveFuncMap[doodle.tempShape.type](
            doodle.tempShape,
            tempShape,
            diff
          )
          return
        }
      },
    },
    // 矩形
    [doodle.tools.rect]: {
      // 按下
      handleMouseDown: () => {
        if (doodle.tempShape !== null) {
          return
        }
        doodle.tempShape = {
          id: null,
          type: doodle.tools.rect,
          pos: [doodle.mouse.dx, doodle.mouse.dy, 0, 0],
          // 临时变量
          temp: {
            start: {
              x: doodle.mouse.dx,
              y: doodle.mouse.dy,
            },
            end: {
              x: doodle.mouse.dx,
              y: doodle.mouse.dy,
            },
          },
          color: doodle.brushColor,
        }
      },
      // 抬起
      handleMouseUp: () => {
        if (!doodle.tempShape) {
          return
        }
        if (!doodle.tempShape.pos[2] || !doodle.tempShape.pos[3]) {
          doodle.tempShape = null
          return
        }
        delete doodle.tempShape.temp
        doodle.tempShape.id = new Date().getTime()
        doodle.conf.onAdd(_.cloneDeep(doodle.tempShape))
        doodle.tempShape = null
      },
      // 移动
      handleMouseMove: () => {
        if (!doodle.tempShape) {
          return
        }
        doodle.tempShape.temp.end = {
          x: doodle.mouse.dx,
          y: doodle.mouse.dy,
        }
        doodle.tempShape.pos[0] = Math.min(
          doodle.tempShape.temp.end.x,
          doodle.tempShape.temp.start.x
        )
        doodle.tempShape.pos[1] = Math.min(
          doodle.tempShape.temp.end.y,
          doodle.tempShape.temp.start.y
        )
        doodle.tempShape.pos[2] = Math.abs(
          doodle.tempShape.temp.end.x - doodle.tempShape.temp.start.x
        )
        doodle.tempShape.pos[3] = Math.abs(
          doodle.tempShape.temp.end.y - doodle.tempShape.temp.start.y
        )
      },
    },
    // 多边形
    [doodle.tools.polygon]: {
      // 按下
      handleMouseDown: () => {
        const curMouseDownTimestamp = new Date().getTime()
        const diff = curMouseDownTimestamp - lastMouseDownTimestamp
        lastMouseDownTimestamp = curMouseDownTimestamp
        const clickPoint = isPolygonToolToStartPointTooClose(doodle)
          ? {
              x: doodle.tempShape.pos[0],
              y: doodle.tempShape.pos[1],
            }
          : {
              x: doodle.mouse.dx,
              y: doodle.mouse.dy,
            }
        const x = clickPoint.x
        const y = clickPoint.y
        const initPolygonShape = () => {
          doodle.tempShape = {
            id: null,
            type: doodle.tools.polygon,
            pos: [x, y, x, y],
            color: doodle.brushColor,
          }
        }
        const completeShape = () => {
          doodle.tempShape.pos.pop()
          doodle.tempShape.pos.pop()
          doodle.tempShape.id = new Date().getTime()
          doodle.conf.onAdd(_.cloneDeep(doodle.tempShape))
          doodle.tempShape = null
        }
        const addPoint = () => {
          for (let _i in doodle.tempShape.pos.slice(0, -2)) {
            let i = Number(_i)
            if (
              i % 2 === 0 &&
              doodle.tempShape.pos[i] === x &&
              doodle.tempShape.pos[i + 1] === y
            ) {
              return
            }
          }
          doodle.tempShape.pos.push(x)
          doodle.tempShape.pos.push(y)
        }
        if (doodle.tempShape === null) {
          initPolygonShape()
        } else {
          // 如果离初始点靠的太近 直接完成
          if (
            doodle.tempShape.pos.length > 6 &&
            isPolygonToolToStartPointTooClose(doodle)
          ) {
            completeShape()
          } else {
            addPoint()
          }
        }
        if (diff < 300) {
          lastMouseDownTimestamp = 0
          if (doodle.tempShape === null) {
            return
          }
          if (doodle.tempShape.pos.length > 6) {
            completeShape()
          }
        }
      },
      // 抬起
      handleMouseUp: () => {},
      // 移动
      handleMouseMove: () => {
        if (!doodle.tempShape) {
          return
        }
        if (isPolygonToolToStartPointTooClose(doodle)) {
          doodle.tempShape.pos[doodle.tempShape.pos.length - 1] =
            doodle.tempShape.pos[1]
          doodle.tempShape.pos[doodle.tempShape.pos.length - 2] =
            doodle.tempShape.pos[0]
          return
        }
        doodle.tempShape.pos[doodle.tempShape.pos.length - 1] = doodle.mouse.dy
        doodle.tempShape.pos[doodle.tempShape.pos.length - 2] = doodle.mouse.dx
      },
    },
    // 圆
    [doodle.tools.circle]: {
      // 按下
      handleMouseDown: () => {
        if (doodle.tempShape !== null) {
          return
        }
        doodle.tempShape = {
          id: null,
          type: doodle.tools.circle,
          pos: [doodle.mouse.dx, doodle.mouse.dy, 0],
          // 临时变量
          temp: {
            start: {
              x: doodle.mouse.dx,
              y: doodle.mouse.dy,
            },
            end: {
              x: doodle.mouse.dx,
              y: doodle.mouse.dy,
            },
          },
          color: doodle.brushColor,
        }
      },
      // 抬起
      handleMouseUp: () => {
        if (!doodle.tempShape) {
          return
        }
        if (!doodle.tempShape.pos[2]) {
          doodle.tempShape = null
          return
        }
        delete doodle.tempShape.temp
        doodle.tempShape.id = new Date().getTime()
        doodle.conf.onAdd(_.cloneDeep(doodle.tempShape))
        doodle.tempShape = null
      },
      // 移动
      handleMouseMove: () => {
        if (!doodle.tempShape) {
          return
        }
        doodle.tempShape.temp.end = {
          x: doodle.mouse.dx,
          y: doodle.mouse.dy,
        }
        const diffX = Math.abs(
          doodle.tempShape.temp.end.x - doodle.tempShape.temp.start.x
        )
        const diffY = Math.abs(
          doodle.tempShape.temp.end.y - doodle.tempShape.temp.start.y
        )
        const maxDiff = Math.max(diffX, diffY)
        const r = maxDiff / 2
        const circleCenterPoint = {
          x: (doodle.tempShape.temp.end.x + doodle.tempShape.temp.start.x) / 2,
          y: (doodle.tempShape.temp.end.y + doodle.tempShape.temp.start.y) / 2,
        }
        doodle.tempShape.pos[0] = circleCenterPoint.x
        doodle.tempShape.pos[1] = circleCenterPoint.y
        doodle.tempShape.pos[2] = r
      },
    },
    // 椭圆
    [doodle.tools.ellipse]: {
      // 按下
      handleMouseDown: () => {
        if (doodle.tempShape !== null) {
          return
        }
        doodle.tempShape = {
          id: null,
          type: doodle.tools.ellipse,
          pos: [doodle.mouse.dx, doodle.mouse.dy, 0, 0],
          // 临时变量
          temp: {
            start: {
              x: doodle.mouse.dx,
              y: doodle.mouse.dy,
            },
            end: {
              x: doodle.mouse.dx,
              y: doodle.mouse.dy,
            },
          },
          color: doodle.brushColor,
        }
      },
      // 抬起
      handleMouseUp: () => {
        if (!doodle.tempShape) {
          return
        }
        if (!doodle.tempShape.pos[2] || !doodle.tempShape.pos[3]) {
          doodle.tempShape = null
          return
        }
        delete doodle.tempShape.temp
        doodle.tempShape.id = new Date().getTime()
        doodle.conf.onAdd(_.cloneDeep(doodle.tempShape))
        doodle.tempShape = null
      },
      // 移动
      handleMouseMove: () => {
        if (!doodle.tempShape) {
          return
        }
        doodle.tempShape.temp.end = {
          x: doodle.mouse.dx,
          y: doodle.mouse.dy,
        }
        const circleCenterPoint = {
          x: (doodle.tempShape.temp.end.x + doodle.tempShape.temp.start.x) / 2,
          y: (doodle.tempShape.temp.end.y + doodle.tempShape.temp.start.y) / 2,
        }
        doodle.tempShape.pos[0] = circleCenterPoint.x
        doodle.tempShape.pos[1] = circleCenterPoint.y
        doodle.tempShape.pos[2] =
          Math.abs(
            doodle.tempShape.temp.end.x - doodle.tempShape.temp.start.x
          ) / 2
        doodle.tempShape.pos[3] =
          Math.abs(
            doodle.tempShape.temp.end.y - doodle.tempShape.temp.start.y
          ) / 2
      },
    },
    // 路径
    [doodle.tools.path]: {
      // 按下
      handleMouseDown: () => {
        if (doodle.tempShape !== null) {
          return
        }
        doodle.tempShape = {
          id: null,
          type: doodle.tools.path,
          pos: [doodle.mouse.dx, doodle.mouse.dy],
          color: doodle.brushColor,
        }
      },
      // 抬起
      handleMouseUp: () => {
        if (!doodle.tempShape) {
          return
        }
        if (doodle.tempShape.pos.length < 4) {
          doodle.tempShape = null
          return
        }
        doodle.tempShape.id = new Date().getTime()
        doodle.conf.onAdd(_.cloneDeep(doodle.tempShape))
        doodle.tempShape = null
      },
      // 移动
      handleMouseMove: () => {
        if (!doodle.tempShape) {
          return
        }
        doodle.tempShape.pos.push(doodle.mouse.dx)
        doodle.tempShape.pos.push(doodle.mouse.dy)
      },
    },
    // 闭合路径
    [doodle.tools.closed_path]: {
      // 按下
      handleMouseDown: () => {
        if (doodle.tempShape !== null) {
          return
        }
        doodle.tempShape = {
          id: null,
          type: doodle.tools.closed_path,
          pos: [doodle.mouse.dx, doodle.mouse.dy],
          color: doodle.brushColor,
        }
      },
      // 抬起
      handleMouseUp: () => {
        if (!doodle.tempShape) {
          return
        }
        if (doodle.tempShape.pos.length < 4) {
          doodle.tempShape = null
          return
        }
        doodle.tempShape.id = new Date().getTime()
        doodle.conf.onAdd(_.cloneDeep(doodle.tempShape))
        doodle.tempShape = null
      },
      // 移动
      handleMouseMove: () => {
        if (!doodle.tempShape) {
          return
        }
        doodle.tempShape.pos.push(doodle.mouse.dx)
        doodle.tempShape.pos.push(doodle.mouse.dy)
      },
    },
    // 直线
    [doodle.tools.line]: {
      // 按下
      handleMouseDown: () => {
        if (doodle.tempShape !== null) {
          return
        }
        doodle.tempShape = {
          id: null,
          type: doodle.tools.line,
          pos: [
            doodle.mouse.dx,
            doodle.mouse.dy,
            doodle.mouse.dx,
            doodle.mouse.dy,
          ],
          color: doodle.brushColor,
        }
      },
      // 抬起
      handleMouseUp: () => {
        if (!doodle.tempShape) {
          return
        }
        if (
          doodle.tempShape.pos[0] === doodle.tempShape.pos[2] &&
          doodle.tempShape.pos[1] === doodle.tempShape.pos[3]
        ) {
          doodle.tempShape = null
          return
        }
        doodle.tempShape.id = new Date().getTime()
        doodle.conf.onAdd(_.cloneDeep(doodle.tempShape))
        doodle.tempShape = null
      },
      // 移动
      handleMouseMove: () => {
        if (!doodle.tempShape) {
          return
        }
        doodle.tempShape.pos[2] = doodle.mouse.dx
        doodle.tempShape.pos[3] = doodle.mouse.dy
      },
    },
    // 箭头直线
    [doodle.tools.arrow_line]: {
      // 按下
      handleMouseDown: () => {
        if (doodle.tempShape !== null) {
          return
        }
        doodle.tempShape = {
          id: null,
          type: doodle.tools.arrow_line,
          pos: [
            doodle.mouse.dx,
            doodle.mouse.dy,
            doodle.mouse.dx,
            doodle.mouse.dy,
          ],
          color: doodle.brushColor,
        }
      },
      // 抬起
      handleMouseUp: () => {
        if (!doodle.tempShape) {
          return
        }
        if (
          doodle.tempShape.pos[0] === doodle.tempShape.pos[2] &&
          doodle.tempShape.pos[1] === doodle.tempShape.pos[3]
        ) {
          doodle.tempShape = null
          return
        }
        doodle.tempShape.id = new Date().getTime()
        doodle.conf.onAdd(_.cloneDeep(doodle.tempShape))
        doodle.tempShape = null
      },
      // 移动
      handleMouseMove: () => {
        if (!doodle.tempShape) {
          return
        }
        doodle.tempShape.pos[2] = doodle.mouse.dx
        doodle.tempShape.pos[3] = doodle.mouse.dy
      },
    },
    // 点
    [doodle.tools.point]: {
      // 按下
      handleMouseDown: () => {
        doodle.conf.onAdd({
          id: new Date().getTime(),
          type: doodle.tools.point,
          pos: [doodle.mouse.dx, doodle.mouse.dy],
          color: doodle.brushColor,
        })
      },
      // 抬起
      handleMouseUp: () => {},
      // 移动
      handleMouseMove: () => {},
    },
  }
  return toolsMouseMap[doodle.mode]
}
