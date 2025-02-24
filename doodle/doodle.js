import {
  Application,
  Graphics,
  Buffer,
  Mesh,
  Shader,
  Geometry,
  BufferUsage,
} from "pixi.js"
import { render } from "./render"
import osd from "openseadragon"
import {
  handleMouseDown,
  handleMouseUp,
  handleMouseMove,
} from "./mouse-handler"
import RBush from "rbush"
import { getBounds } from "./bounds"
import { generateAnchors, getHoverAnchor, getHoverShape } from "./geometry"
import _ from "lodash"
import { onKeyStroke } from "@vueuse/core"
import { fragment, vertex } from "./gl"
import { generateCircleGeometry, hexToRGB } from "./tool"

export class Doodle {
  // 工具列表
  tools = {
    move: "move", // 移动
    rect: "rect", // 矩形
    polygon: "polygon", // 多边形
    circle: "circle", // 圆
    ellipse: "ellipse", // 椭圆
    path: "path", // 路径
    closed_path: "closed_path", // 闭合路径
    line: "line", // 直线
    arrow_line: "arrow_line", // 箭头直线
    point: "point", // 点
  }
  // 配置
  conf = {
    viewer: null,
  }
  pixiApp // pixi app
  graphics // pixi graphics
  pointMesh // 点的Mesh
  points = [] // 点集合
  tracker // 鼠标跟踪器
  mode = this.tools.move // 模式
  viewer // osd的画布
  shapes = [] // 形状数组
  bounds // 边界
  anchors = [] // 锚点数组
  scale = 1 // 缩放
  // 平移
  translate = {
    x: 0,
    y: 0,
  }
  strokeWidth = 2 // 线宽
  defaultColor = "#FF0000" // 默认颜色
  brushColor = "#FF0000" // 画笔颜色
  hitRadius = 5 // 光标的碰撞半径
  anchorRadius = 5 // 锚点半径
  pointRadius = 6 // 点半径
  tempShape = null // 临时shape（新增和编辑时）
  hoverShape = null // 悬浮的shape
  hoverAnchor = null // 悬浮的锚点
  // 鼠标
  mouse = {
    x: 0, // 视口x
    y: 0, // 视口y
    dx: 0, // 画布x
    dy: 0, // 画布y
    isPressed: false, // 是否按下
  }
  constructor(conf) {
    // 存储配置
    this.conf = {
      ...this.conf,
      ...conf,
    }
    this.viewer = this.conf.viewer
    // 初始化 边界
    this.createBounds()
    // 监听键盘
    this.listenKeyboard()
    // 画布
    ;(async () => {
      // 初始化 pxii
      await this.createPixi()
      // 初始化 鼠标跟踪器
      this.createMouseTracker()
      // 开始循环
      this.startLoop()
    })()
  }
  // 清空标注
  clear() {
    this.shapes = []
    this.anchors = []
    this.bounds.clear()
    this.generatePoints()
  }
  // 初始化边界
  createBounds() {
    this.bounds = new RBush()
  }
  // 创建鼠标跟踪器
  createMouseTracker() {
    // 创建一个鼠标跟踪器
    const tracker = new osd.MouseTracker({
      element: this.pixiApp.canvas,
      pressHandler: (e) => {
        this.mouse.isPressed = true
        handleMouseDown(this)
        // 计算锚点
        generateAnchors(this)
        // 更新鼠标样式
        this.updateCursor()
      },
      releaseHandler: (e) => {
        this.mouse.isPressed = false
        handleMouseUp(this)
        // 计算锚点
        generateAnchors(this)
        // 更新鼠标样式
        this.updateCursor()
      },
      moveHandler: (e) => {
        // @ts-ignore
        this.mouse.x = e.position.x
        // @ts-ignore
        this.mouse.y = e.position.y
        const viewportPoint = this.viewer.viewport.pointFromPixel(
          new osd.Point(this.mouse.x, this.mouse.y),
          true
        )
        const dp = this.viewer.viewport.viewer.world
          .getItemAt(0)
          .viewportToImageCoordinates(viewportPoint.x, viewportPoint.y, true)
        this.mouse.dx = dp.x
        this.mouse.dy = dp.y
        handleMouseMove(this)
        // 悬浮的shape
        this.hoverShape = getHoverShape(this)
        // 悬浮的锚点
        this.hoverAnchor = getHoverAnchor(this)
        // 计算锚点
        generateAnchors(this)
        // 更新鼠标样式
        this.updateCursor()
      },
    })
    // 启用鼠标跟踪器
    tracker.setTracking(true)
    this.tracker = tracker
  }
  // 设置模式
  setMode(mode) {
    this.mode = mode
    this.setPan(mode === this.tools.move)
  }
  // 设置允许拖动
  setPan(pan) {
    this.viewer.panHorizontal = pan
    this.viewer.panVertical = pan
  }
  // 销毁
  destroy() {
    this.tracker.setTracking(false)
    this.pixiApp.canvas.remove()
    this.pixiApp.destroy()
  }
  // 监听键盘
  listenKeyboard() {
    onKeyStroke(["Delete"], async (e) => {
      switch (e.code) {
        case "Delete":
          // @ts-ignore
          if (this.tempShape && this.tempShape.id) {
            this.conf.onRemove(this.tempShape)
          }
          break
        default:
          break
      }
    })
  }
  // 帧循环
  startLoop() {
    this.pixiApp.ticker.add(() => {
      render(this)
    })
  }
  generatePoints() {
    this.points = this.shapes.filter(
      // @ts-ignore
      (item) => item.type === this.tools.point && item.id !== this.tempShape?.id
    )
    this.pixiApp.stage.removeChild(this.pointMesh)
    this.pointMesh = this.createPointMesh(this.points)
    this.pixiApp.stage.addChild(this.pointMesh)
  }
  // 添加图形（批量）
  addShapes(shapes) {
    const _shapes = _.cloneDeep(shapes)
    this.shapes.push(..._shapes)
    for (const shape of _shapes) {
      this.bounds.insert(getBounds(shape, this))
    }
    if (shapes.find((shape) => shape.type === this.tools.point)) {
      this.generatePoints()
    }
  }
  // 添加图形
  addShape(shape) {
    const _shape = _.cloneDeep(shape)
    this.shapes.push(_shape)
    this.bounds.insert(getBounds(_shape, this))
    if (shape.type === this.tools.point) {
      this.generatePoints()
    }
  }
  // 删除图形（批量）
  removeShapes(shapes) {
    const ids = shapes.map((item) => item.id)
    this.shapes = this.shapes.filter((item) => !ids.includes(item.id))
    for (const shape of shapes) {
      this.bounds.remove(getBounds(shape, this), (a, b) => {
        return a.id === b.id
      })
    }
    if (shapes.find((shape) => shape.type === this.tools.point)) {
      this.generatePoints()
    }
    // @ts-ignore
    if (shapes.find((shape) => shape.id === this.tempShape?.id)) {
      this.tempShape = null
    }
  }
  // 删除图形
  removeShape(shape) {
    this.shapes = this.shapes.filter((item) => item.id !== shape.id)
    this.bounds.remove(getBounds(shape, this), (a, b) => {
      return a.id === b.id
    })
    if (shape.type === this.tools.point) {
      this.generatePoints()
    }
    // @ts-ignore
    if (shape.id === this.tempShape?.id) {
      this.tempShape = null
    }
  }
  // 更新图形
  updateShapes(shapes) {
    this.removeShapes(shapes)
    this.addShapes(shapes)
  }
  // 更新图形
  updateShape(shape) {
    this.removeShape(shape)
    this.addShape(shape)
  }
  // 更新图形
  selectShape(shape) {
    this.tempShape = _.cloneDeep(shape)
    // 计算锚点
    generateAnchors(this)
  }
  // 创建pixi
  async createPixi() {
    const osdDom = this.viewer.canvas
    const app = new Application()
    this.pixiApp = app
    await app.init({
      resizeTo: osdDom,
      backgroundAlpha: 0,
      antialias: true, // 抗锯齿
    })
    // @ts-ignore
    osdDom.appendChild(app.canvas)
    app.canvas.style.pointerEvents = "none"
    app.canvas.style.position = "absolute"
    app.canvas.style.top = "0"
    app.canvas.style.left = "0"

    // 图形
    const graphics = new Graphics()
    this.graphics = graphics
    app.stage.addChild(graphics)

    // 点的Mesh
    this.generatePoints()

    // @ts-ignore
    window.__PIXI_DEVTOOLS__ = {
      app: app,
    }
  }
  // 获取比例
  getScale() {
    const viewer = this.viewer
    const containerWidth = viewer.viewport.getContainerSize().x
    const zoom = viewer.viewport.getZoom(true)
    return (zoom * containerWidth) / viewer.world.getContentFactor()
  }
  // 解析颜色
  parseColor(color) {
    return parseInt(color.replace("#", "0x"), 16)
  }
  // 获取所有图形
  getShapes() {
    return _.cloneDeep(this.shapes)
  }
  // 设置默认颜色
  setDefaultColor(color) {
    this.defaultColor = color
  }
  // 设置画笔颜色
  setBrushColor(color) {
    this.brushColor = color
  }
  // 更新鼠标样式
  updateCursor() {
    let cursor = "default"
    if (this.mode !== this.tools.move) {
      // 绘制中，使用十字线
      cursor = "crosshair"
    } else if (this.hoverAnchor) {
      // 悬浮在锚点上
      cursor = "pointer"
    } else if (this.hoverShape) {
      // 悬浮在shape上
      // @ts-ignore
      if (this.tempShape && this.hoverShape?.id === this.tempShape?.id) {
        // 悬浮的shape是编辑状态
        if (this.mouse.isPressed) {
          // 按下状态
          cursor = "grabbing"
        } else {
          // 未按下状态
          cursor = "grab"
        }
      } else {
        // 普通悬浮
        cursor = "pointer"
      }
    }
    this.pixiApp.canvas.style.cursor = cursor
  }
  // 创建点Mesh
  createPointMesh(points) {
    const length = points.length
    const instancePositionBuffer = new Buffer({
      data: new Float32Array(length * 2),
      usage: BufferUsage.VERTEX | BufferUsage.COPY_DST,
    })
    const instanceColorBuffer = new Buffer({
      data: new Float32Array(length * 3), // 每个三角形三个值（r, g, b）
      usage: BufferUsage.VERTEX | BufferUsage.COPY_DST,
    })
    const colorData = instanceColorBuffer.data
    for (let _i in points) {
      let i = Number(_i)
      const point = points[i]
      point.rgbColor = hexToRGB(point.color || this.defaultColor)
      const index = i * 3
      colorData[index] = point.rgbColor[0]
      colorData[index + 1] = point.rgbColor[1]
      colorData[index + 2] = point.rgbColor[2]
    }
    instanceColorBuffer.update()
    const { positions, indices } = generateCircleGeometry(40, this.pointRadius)
    const geometry = new Geometry({
      attributes: {
        aPosition: positions,
        aPositionOffset: {
          buffer: instancePositionBuffer,
          instance: true,
        },
        aColor: {
          buffer: instanceColorBuffer,
          instance: true,
        },
      },
      indexBuffer: indices,
      instanceCount: length,
    })
    const gl = { vertex, fragment }
    const shader = Shader.from({
      gl,
    })
    const pointMesh = new Mesh({
      geometry,
      shader,
    })
    return pointMesh
  }
}
