import { lineLength } from "geometric"

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

// 获取鼠标处理器 TODO:
const getMouseHandler = (doodle) => {
  // 工具对应的鼠标处理函数
  const toolsMouseMap = {
    // 移动
    [doodle.tools.move]: {
      // 按下
      handleMouseDown: () => {
        if (isMouseOutside.value) {
          return
        }
        const curMouseDownTimestamp = new Date().getTime()
        lastMouseDownTimestamp = curMouseDownTimestamp
        // 在锚点上按下
        if (state.tempShape && hoverAnchor.value) {
          props.viewer.setMouseNavEnabled(false)
          tempCurMousePoint = dziCoordByMouse.value
          tempAnchor = _.cloneDeep(hoverAnchor.value)
          tempShape = _.cloneDeep(state.tempShape)
          return
        }
        // 在编辑的shape上按下
        if (
          state.tempShape &&
          hoverShape.value &&
          state.tempShape.id === hoverShape.value.id
        ) {
          props.viewer.setMouseNavEnabled(false)
          tempCurMousePoint = dziCoordByMouse.value
          tempAnchor = null
          tempShape = _.cloneDeep(state.tempShape)
          return
        }
        tempCurMousePoint = null
        tempShape = null
        tempAnchor = null
        props.viewer.setMouseNavEnabled(true)
      },
      // 抬起
      handleMouseUp: () => {
        if (isMouseOutside.value) {
          return
        }
        const curMouseDownTimestamp = new Date().getTime()
        const diff = curMouseDownTimestamp - lastMouseDownTimestamp
        if (diff < 150) {
          // 短按
          // 短按了锚点
          if (hoverAnchor.value) {
            return
          }
          // 短按了形状
          if (hoverShape.value) {
            // 当前有编辑中的形状
            if (state.tempShape) {
              if (state.tempShape.id !== hoverShape.value.id) {
                const originalShape = props.shapes.find(
                  (item) => item.id === state.tempShape.id
                )
                if (
                  JSON.stringify(originalShape) !==
                  JSON.stringify(state.tempShape)
                ) {
                  emits("update", state.tempShape)
                }
                state.tempShape = _.cloneDeep(hoverShape.value)
              }
              // 当前没有编辑中的形状
            } else {
              state.tempShape = _.cloneDeep(hoverShape.value)
            }
            return
          }
          // 短按空白区域
          if (state.tempShape) {
            // 如果有临时shape则触发编辑保存
            const originalShape = props.shapes.find(
              (item) => item.id === state.tempShape.id
            )
            if (
              JSON.stringify(originalShape) !== JSON.stringify(state.tempShape)
            ) {
              emits("update", state.tempShape)
            }
            state.tempShape = null
          }
        } else {
          // 长按
        }
      },
      // 移动
      handleMouseMove: () => {
        // 在锚点上移动
        if (state.tempShape && tempAnchor && isLeftMousePressed.value) {
          const diff = {
            x: dziCoordByMouse.value.x - tempCurMousePoint.x,
            y: dziCoordByMouse.value.y - tempCurMousePoint.y,
          }
          const anchorHandleMoveFuncMap = {
            // 矩形
            [doodle.tools.RECT]: (shape, cloneShape, tempAnchor, diff) => {
              // 左上
              if (
                tempAnchor.x === cloneShape.meta.x &&
                tempAnchor.y === cloneShape.meta.y
              ) {
                if (diff.x < cloneShape.meta.width) {
                  shape.meta.x = cloneShape.meta.x + diff.x
                  shape.meta.width = cloneShape.meta.width - diff.x
                } else {
                  shape.meta.x = cloneShape.meta.x + cloneShape.meta.width
                  shape.meta.width = diff.x - cloneShape.meta.width
                }
                if (diff.y < cloneShape.meta.height) {
                  shape.meta.y = cloneShape.meta.y + diff.y
                  shape.meta.height = cloneShape.meta.height - diff.y
                } else {
                  shape.meta.y = cloneShape.meta.y + cloneShape.meta.height
                  shape.meta.height = diff.y - cloneShape.meta.height
                }
                return
              }
              // 右上
              if (
                tempAnchor.x === cloneShape.meta.x + cloneShape.meta.width &&
                tempAnchor.y === cloneShape.meta.y
              ) {
                if (diff.x < -cloneShape.meta.width) {
                  shape.meta.x =
                    cloneShape.meta.x + cloneShape.meta.width + diff.x
                  shape.meta.width = -diff.x - cloneShape.meta.width
                } else {
                  shape.meta.width = cloneShape.meta.width + diff.x
                }
                if (diff.y > cloneShape.meta.height) {
                  shape.meta.y = cloneShape.meta.y + cloneShape.meta.height
                  shape.meta.height = diff.y - cloneShape.meta.height
                } else {
                  shape.meta.y = cloneShape.meta.y + diff.y
                  shape.meta.height = cloneShape.meta.height - diff.y
                }
                return
              }
              // 左下
              if (
                tempAnchor.x === cloneShape.meta.x &&
                tempAnchor.y === cloneShape.meta.y + cloneShape.meta.height
              ) {
                if (diff.x < cloneShape.meta.width) {
                  shape.meta.x = cloneShape.meta.x + diff.x
                  shape.meta.width = cloneShape.meta.width - diff.x
                } else {
                  shape.meta.x = cloneShape.meta.x + cloneShape.meta.width
                  shape.meta.width = diff.x - cloneShape.meta.width
                }
                if (-diff.y > cloneShape.meta.height) {
                  shape.meta.y =
                    cloneShape.meta.y + cloneShape.meta.height + diff.y
                  shape.meta.height = -diff.y - cloneShape.meta.height
                } else {
                  shape.meta.height = cloneShape.meta.height + diff.y
                }
              }
              // 右下
              if (
                tempAnchor.x === cloneShape.meta.x + cloneShape.meta.width &&
                tempAnchor.y === cloneShape.meta.y + cloneShape.meta.height
              ) {
                if (diff.x < -cloneShape.meta.width) {
                  shape.meta.x =
                    cloneShape.meta.x + cloneShape.meta.width + diff.x
                  shape.meta.width = -diff.x - cloneShape.meta.width
                } else {
                  shape.meta.width = cloneShape.meta.width + diff.x
                }
                if (-diff.y > cloneShape.meta.height) {
                  shape.meta.y =
                    cloneShape.meta.y + cloneShape.meta.height + diff.y
                  shape.meta.height = -diff.y - cloneShape.meta.height
                } else {
                  shape.meta.height = cloneShape.meta.height + diff.y
                }
                return
              }
            },
            // 多边形
            [doodle.tools.POLYGON]: (shape, cloneShape, tempAnchor, diff) => {
              let i = 0
              for (const _i in cloneShape.meta.points) {
                const item = cloneShape.meta.points[_i]
                if (item.x === tempAnchor.x && item.y === tempAnchor.y) {
                  i = Number(_i)
                }
              }
              shape.meta.points[i].x = tempAnchor.x + diff.x
              shape.meta.points[i].y = tempAnchor.y + diff.y
            },
            // 圆
            [doodle.tools.CIRCLE]: (shape, cloneShape, tempAnchor, diff) => {
              const ret = Math.max(cloneShape.meta.rx + diff.x, 1)
              shape.meta.rx = ret
              shape.meta.ry = ret
            },
            // 椭圆
            [doodle.tools.ELLIPSE]: (shape, cloneShape, tempAnchor, diff) => {
              // 上边的点
              if (
                tempAnchor.x === cloneShape.meta.cx &&
                tempAnchor.y === cloneShape.meta.cy - cloneShape.meta.ry
              ) {
                const ret = Math.max(cloneShape.meta.ry - diff.y, 1)
                shape.meta.ry = ret
                return
              }
              // 右边的点
              if (
                tempAnchor.x === cloneShape.meta.cx + cloneShape.meta.rx &&
                tempAnchor.y === cloneShape.meta.cy
              ) {
                const ret = Math.max(cloneShape.meta.rx + diff.x, 1)
                shape.meta.rx = ret
                return
              }
            },
            // 直线
            [doodle.tools.LINE]: (shape, cloneShape, tempAnchor, diff) => {
              // 起始点
              if (
                tempAnchor.x === cloneShape.meta.x1 &&
                tempAnchor.y === cloneShape.meta.y1
              ) {
                shape.meta.x1 = cloneShape.meta.x1 + diff.x
                shape.meta.y1 = cloneShape.meta.y1 + diff.y
                return
              }
              // 结束点
              if (
                tempAnchor.x === cloneShape.meta.x2 &&
                tempAnchor.y === cloneShape.meta.y2
              ) {
                shape.meta.x2 = cloneShape.meta.x2 + diff.x
                shape.meta.y2 = cloneShape.meta.y2 + diff.y
                return
              }
            },
            // 箭头直线
            [doodle.tools.ARROW_LINE]: (
              shape,
              cloneShape,
              tempAnchor,
              diff
            ) => {
              // 起始点
              if (
                tempAnchor.x === cloneShape.meta.x1 &&
                tempAnchor.y === cloneShape.meta.y1
              ) {
                shape.meta.x1 = cloneShape.meta.x1 + diff.x
                shape.meta.y1 = cloneShape.meta.y1 + diff.y
                return
              }
              // 结束点
              if (
                tempAnchor.x === cloneShape.meta.x2 &&
                tempAnchor.y === cloneShape.meta.y2
              ) {
                shape.meta.x2 = cloneShape.meta.x2 + diff.x
                shape.meta.y2 = cloneShape.meta.y2 + diff.y
                return
              }
            },
          }
          anchorHandleMoveFuncMap[state.tempShape.type](
            state.tempShape,
            tempShape,
            tempAnchor,
            diff
          )
          return
        }
        // 在编辑的shape上移动
        if (state.tempShape && tempShape && isLeftMousePressed.value) {
          const diff = {
            x: dziCoordByMouse.value.x - tempCurMousePoint.x,
            y: dziCoordByMouse.value.y - tempCurMousePoint.y,
          }
          const shapeHandleMoveFuncMap = {
            // 矩形
            [doodle.tools.RECT]: (shape, cloneShape, diff) => {
              shape.meta.x = cloneShape.meta.x + diff.x
              shape.meta.y = cloneShape.meta.y + diff.y
            },
            // 多边形
            [doodle.tools.POLYGON]: (shape, cloneShape, diff) => {
              shape.meta.points = cloneShape.meta.points.map((item) => ({
                x: item.x + diff.x,
                y: item.y + diff.y,
              }))
            },
            // 圆
            [doodle.tools.CIRCLE]: (shape, cloneShape, diff) => {
              shape.meta.cx = cloneShape.meta.cx + diff.x
              shape.meta.cy = cloneShape.meta.cy + diff.y
            },
            // 椭圆
            [doodle.tools.ELLIPSE]: (shape, cloneShape, diff) => {
              shape.meta.cx = cloneShape.meta.cx + diff.x
              shape.meta.cy = cloneShape.meta.cy + diff.y
            },
            // 路径
            [doodle.tools.PATH]: (shape, cloneShape, diff) => {
              shape.meta.d = cloneShape.meta.d.map((item) => ({
                x: item.x + diff.x,
                y: item.y + diff.y,
              }))
            },
            // 闭合路径
            [doodle.tools.CLOSED_PATH]: (shape, cloneShape, diff) => {
              shape.meta.d = cloneShape.meta.d.map((item) => ({
                x: item.x + diff.x,
                y: item.y + diff.y,
              }))
            },
            // 直线
            [doodle.tools.LINE]: (shape, cloneShape, diff) => {
              shape.meta.x1 = cloneShape.meta.x1 + diff.x
              shape.meta.x2 = cloneShape.meta.x2 + diff.x
              shape.meta.y1 = cloneShape.meta.y1 + diff.y
              shape.meta.y2 = cloneShape.meta.y2 + diff.y
            },
            // 箭头直线
            [doodle.tools.ARROW_LINE]: (shape, cloneShape, diff) => {
              shape.meta.x1 = cloneShape.meta.x1 + diff.x
              shape.meta.x2 = cloneShape.meta.x2 + diff.x
              shape.meta.y1 = cloneShape.meta.y1 + diff.y
              shape.meta.y2 = cloneShape.meta.y2 + diff.y
            },
            // 点
            [doodle.tools.POINT]: (shape, cloneShape, diff) => {
              shape.meta.cx = cloneShape.meta.cx + diff.x
              shape.meta.cy = cloneShape.meta.cy + diff.y
            },
          }
          shapeHandleMoveFuncMap[state.tempShape.type](
            state.tempShape,
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
        if (isMouseOutside.value) {
          return
        }
        if (state.tempShape !== null) {
          return
        }
        state.tempShape = {
          id: null,
          type: doodle.tools.RECT,
          meta: {
            x: dziCoordByMouse.value.x,
            y: dziCoordByMouse.value.y,
            width: 0,
            height: 0,
          },
          // 临时变量
          temp: {
            start: {
              x: dziCoordByMouse.value.x,
              y: dziCoordByMouse.value.y,
            },
            end: {
              x: dziCoordByMouse.value.x,
              y: dziCoordByMouse.value.y,
            },
          },
        }
      },
      // 抬起
      handleMouseUp: () => {
        if (!state.tempShape) {
          return
        }
        if (!state.tempShape.meta.width || !state.tempShape.meta.height) {
          state.tempShape = null
          return
        }
        delete state.tempShape.temp
        state.tempShape.id = new Date().getTime()
        emits("add", state.tempShape)
        state.tempShape = null
      },
      // 移动
      handleMouseMove: () => {
        if (!state.tempShape) {
          return
        }
        state.tempShape.temp.end = dziCoordByMouse.value
        state.tempShape.meta.x = Math.min(
          state.tempShape.temp.end.x,
          state.tempShape.temp.start.x
        )
        state.tempShape.meta.y = Math.min(
          state.tempShape.temp.end.y,
          state.tempShape.temp.start.y
        )
        state.tempShape.meta.width = Math.abs(
          state.tempShape.temp.end.x - state.tempShape.temp.start.x
        )
        state.tempShape.meta.height = Math.abs(
          state.tempShape.temp.end.y - state.tempShape.temp.start.y
        )
      },
    },
    // 多边形
    [doodle.tools.polygon]: {
      // 按下
      handleMouseDown: () => {
        if (isMouseOutside.value) {
          return
        }
        const curMouseDownTimestamp = new Date().getTime()
        const diff = curMouseDownTimestamp - lastMouseDownTimestamp
        lastMouseDownTimestamp = curMouseDownTimestamp
        const clickPoint = isPolygonToolToStartPointTooClose.value
          ? state.tempShape.meta.points[0]
          : dziCoordByMouse.value
        const x = clickPoint.x
        const y = clickPoint.y
        const initPolygonShape = () => {
          state.tempShape = {
            id: null,
            type: doodle.tools.POLYGON,
            meta: {
              points: [
                {
                  x,
                  y,
                },
                {
                  x,
                  y,
                },
              ],
            },
          }
        }
        const completeShape = () => {
          state.tempShape.meta.points.pop()
          state.tempShape.id = new Date().getTime()
          emits("add", state.tempShape)
          state.tempShape = null
        }
        const addPoint = () => {
          for (const v of state.tempShape.meta.points.slice(
            0,
            state.tempShape.meta.points.length - 1
          )) {
            if (x === v.x && y === v.y) {
              return
            }
          }
          state.tempShape.meta.points.push({
            x,
            y,
          })
        }
        if (state.tempShape === null) {
          initPolygonShape()
        } else {
          // 如果离初始点靠的太近 直接完成
          if (
            state.tempShape.meta.points.length > 3 &&
            isPolygonToolToStartPointTooClose.value
          ) {
            completeShape()
          } else {
            addPoint()
          }
        }
        if (diff < 300) {
          lastMouseDownTimestamp = 0
          if (state.tempShape === null) {
            return
          }
          if (state.tempShape.meta.points.length > 3) {
            completeShape()
          }
        }
      },
      // 抬起
      handleMouseUp: () => {},
      // 移动
      handleMouseMove: () => {
        if (!state.tempShape) {
          return
        }
        if (isPolygonToolToStartPointTooClose.value) {
          state.tempShape.meta.points[state.tempShape.meta.points.length - 1] =
            state.tempShape.meta.points[0]
          return
        }
        state.tempShape.meta.points[state.tempShape.meta.points.length - 1] =
          dziCoordByMouse.value
      },
    },
    // 圆
    [doodle.tools.circle]: {
      // 按下
      handleMouseDown: () => {
        if (isMouseOutside.value) {
          return
        }
        if (state.tempShape !== null) {
          return
        }
        state.tempShape = {
          id: null,
          type: doodle.tools.CIRCLE,
          meta: {
            cx: dziCoordByMouse.value.x,
            cy: dziCoordByMouse.value.y,
            rx: 0,
            ry: 0,
          },
          // 临时变量
          temp: {
            start: {
              x: dziCoordByMouse.value.x,
              y: dziCoordByMouse.value.y,
            },
            end: {
              x: dziCoordByMouse.value.x,
              y: dziCoordByMouse.value.y,
            },
          },
        }
      },
      // 抬起
      handleMouseUp: () => {
        if (!state.tempShape) {
          return
        }
        if (!state.tempShape.meta.rx || !state.tempShape.meta.ry) {
          state.tempShape = null
          return
        }
        delete state.tempShape.temp
        state.tempShape.id = new Date().getTime()
        emits("add", state.tempShape)
        state.tempShape = null
      },
      // 移动
      handleMouseMove: () => {
        if (!state.tempShape) {
          return
        }
        state.tempShape.temp.end = dziCoordByMouse.value
        const diffX = Math.abs(
          state.tempShape.temp.end.x - state.tempShape.temp.start.x
        )
        const diffY = Math.abs(
          state.tempShape.temp.end.y - state.tempShape.temp.start.y
        )
        const maxDiff = Math.max(diffX, diffY)
        const r = maxDiff / 2
        const circleCenterPoint = {
          x: (state.tempShape.temp.end.x + state.tempShape.temp.start.x) / 2,
          y: (state.tempShape.temp.end.y + state.tempShape.temp.start.y) / 2,
        }
        state.tempShape.meta.cx = circleCenterPoint.x
        state.tempShape.meta.cy = circleCenterPoint.y
        state.tempShape.meta.rx = r
        state.tempShape.meta.ry = r
      },
    },
    // 椭圆
    [doodle.tools.ellipse]: {
      // 按下
      handleMouseDown: () => {
        if (isMouseOutside.value) {
          return
        }
        if (state.tempShape !== null) {
          return
        }
        state.tempShape = {
          id: null,
          type: doodle.tools.ELLIPSE,
          meta: {
            cx: dziCoordByMouse.value.x,
            cy: dziCoordByMouse.value.y,
            rx: 0,
            ry: 0,
          },
          // 临时变量
          temp: {
            start: {
              x: dziCoordByMouse.value.x,
              y: dziCoordByMouse.value.y,
            },
            end: {
              x: dziCoordByMouse.value.x,
              y: dziCoordByMouse.value.y,
            },
          },
        }
      },
      // 抬起
      handleMouseUp: () => {
        if (!state.tempShape) {
          return
        }
        if (!state.tempShape.meta.rx || !state.tempShape.meta.ry) {
          state.tempShape = null
          return
        }
        delete state.tempShape.temp
        state.tempShape.id = new Date().getTime()
        emits("add", state.tempShape)
        state.tempShape = null
      },
      // 移动
      handleMouseMove: () => {
        if (!state.tempShape) {
          return
        }
        state.tempShape.temp.end = dziCoordByMouse.value
        const circleCenterPoint = {
          x: (state.tempShape.temp.end.x + state.tempShape.temp.start.x) / 2,
          y: (state.tempShape.temp.end.y + state.tempShape.temp.start.y) / 2,
        }
        state.tempShape.meta.cx = circleCenterPoint.x
        state.tempShape.meta.cy = circleCenterPoint.y
        state.tempShape.meta.rx =
          Math.abs(state.tempShape.temp.end.x - state.tempShape.temp.start.x) /
          2
        state.tempShape.meta.ry =
          Math.abs(state.tempShape.temp.end.y - state.tempShape.temp.start.y) /
          2
      },
    },
    // 路径
    [doodle.tools.path]: {
      // 按下
      handleMouseDown: () => {
        if (isMouseOutside.value) {
          return
        }
        if (state.tempShape !== null) {
          return
        }
        state.tempShape = {
          id: null,
          type: doodle.tools.PATH,
          meta: {
            d: [dziCoordByMouse.value],
          },
        }
      },
      // 抬起
      handleMouseUp: () => {
        if (!state.tempShape) {
          return
        }
        if (state.tempShape.meta.d.length < 2) {
          state.tempShape = null
          return
        }
        state.tempShape.id = new Date().getTime()
        emits("add", state.tempShape)
        state.tempShape = null
      },
      // 移动
      handleMouseMove: () => {
        if (!state.tempShape) {
          return
        }
        state.tempShape.meta.d.push(dziCoordByMouse.value)
      },
    },
    // 闭合路径
    [doodle.tools.closed_path]: {
      // 按下
      handleMouseDown: () => {
        if (isMouseOutside.value) {
          return
        }
        if (state.tempShape !== null) {
          return
        }
        state.tempShape = {
          id: null,
          type: doodle.tools.CLOSED_PATH,
          meta: {
            d: [dziCoordByMouse.value],
          },
        }
      },
      // 抬起
      handleMouseUp: () => {
        if (!state.tempShape) {
          return
        }
        if (state.tempShape.meta.d.length < 2) {
          state.tempShape = null
          return
        }
        state.tempShape.id = new Date().getTime()
        emits("add", state.tempShape)
        state.tempShape = null
      },
      // 移动
      handleMouseMove: () => {
        if (!state.tempShape) {
          return
        }
        state.tempShape.meta.d.push(dziCoordByMouse.value)
      },
    },
    // 直线
    [doodle.tools.line]: {
      // 按下
      handleMouseDown: () => {
        if (isMouseOutside.value) {
          return
        }
        if (state.tempShape !== null) {
          return
        }
        state.tempShape = {
          id: null,
          type: doodle.tools.LINE,
          meta: {
            x1: dziCoordByMouse.value.x,
            y1: dziCoordByMouse.value.y,
            x2: dziCoordByMouse.value.x,
            y2: dziCoordByMouse.value.y,
          },
        }
      },
      // 抬起
      handleMouseUp: () => {
        if (!state.tempShape) {
          return
        }
        if (
          state.tempShape.meta.x1 === state.tempShape.meta.x2 &&
          state.tempShape.meta.y1 === state.tempShape.meta.y2
        ) {
          state.tempShape = null
          return
        }
        state.tempShape.id = new Date().getTime()
        emits("add", state.tempShape)
        state.tempShape = null
      },
      // 移动
      handleMouseMove: () => {
        if (!state.tempShape) {
          return
        }
        state.tempShape.meta.x2 = dziCoordByMouse.value.x
        state.tempShape.meta.y2 = dziCoordByMouse.value.y
      },
    },
    // 箭头直线
    [doodle.tools.arrow_line]: {
      // 按下
      handleMouseDown: () => {
        if (isMouseOutside.value) {
          return
        }
        if (state.tempShape !== null) {
          return
        }
        state.tempShape = {
          id: null,
          type: doodle.tools.ARROW_LINE,
          meta: {
            x1: dziCoordByMouse.value.x,
            y1: dziCoordByMouse.value.y,
            x2: dziCoordByMouse.value.x,
            y2: dziCoordByMouse.value.y,
          },
        }
      },
      // 抬起
      handleMouseUp: () => {
        if (!state.tempShape) {
          return
        }
        if (
          state.tempShape.meta.x1 === state.tempShape.meta.x2 &&
          state.tempShape.meta.y1 === state.tempShape.meta.y2
        ) {
          state.tempShape = null
          return
        }
        state.tempShape.id = new Date().getTime()
        emits("add", state.tempShape)
        state.tempShape = null
      },
      // 移动
      handleMouseMove: () => {
        if (!state.tempShape) {
          return
        }
        state.tempShape.meta.x2 = dziCoordByMouse.value.x
        state.tempShape.meta.y2 = dziCoordByMouse.value.y
      },
    },
    // 点
    [doodle.tools.point]: {
      // 按下
      handleMouseDown: () => {
        if (isMouseOutside.value) {
          return
        }
        emits("add", {
          id: new Date().getTime(),
          type: doodle.tools.POINT,
          meta: {
            cx: dziCoordByMouse.value.x,
            cy: dziCoordByMouse.value.y,
          },
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
