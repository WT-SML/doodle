import { Application, Graphics } from "pixi.js"
import { render } from "./render"
import osd from "openseadragon"
import {
  handleMouseDown,
  handleMouseUp,
  handleMouseMove,
} from "./mouse-handler"
import RBush from "rbush"
import { getBounds } from "./bounds"
import { getHoverShape } from "./geometry"

export class Doodle {
  // 工具列表
  tools = {
    move: "MOVE", // 移动
    rect: "RECT", // 矩形
    polygon: "POLYGON", // 多边形
    circle: "CIRCLE", // 圆
    ellipse: "ELLIPSE", // 椭圆
    path: "PATH", // 路径
    closed_path: "CLOSED_PATH", // 闭合路径
    line: "LINE", // 直线
    arrow_line: "ARROW_LINE", // 箭头直线
    point: "POINT", // 点
  }
  // 配置
  conf = {
    viewer: null,
  }
  pixiApp // pixi app
  graphics // pixi graphics
  tracker // 鼠标跟踪器
  mode = this.tools.move // 模式
  viewer // osd的画布
  shapes = [] // 形状数组
  bounds
  scale = 1 // 缩放
  // 平移
  translate = {
    x: 0,
    y: 0,
  }
  r = 6 // 点半径
  strokeWidth = 2 // 线宽
  color = "#FF0000" // 颜色
  hitRadius = 5 // 光标的碰撞半径
  tempShape // 临时shape（新增和编辑时）
  hoverShape // 悬浮的shape
  // 鼠标
  mouse = {
    x: 0,
    y: 0,
    dx: 0,
    dy: 0,
    isPressed: false,
  }
  constructor(conf) {
    // 存储配置
    this.conf = {
      ...this.conf,
      ...conf,
    }
    // 画布
    this.viewer = this.conf.viewer
    ;(async () => {
      // 初始化 pxii
      await this.createPixi()
      // 初始化 边界
      this.createBounds()
      // 初始化 鼠标跟踪器
      this.createMouseTracker()
      // 监听键盘
      this.listenKeyboard()
      // 开始循环
      this.startLoop()
    })()
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
        handleMouseDown(this)
      },
      releaseHandler: (e) => {
        handleMouseUp(this)
      },
      moveHandler: (e) => {
        // @ts-ignore
        this.mouse.x = e.position.x
        // @ts-ignore
        this.mouse.y = e.position.y
        const dp = this.viewer.viewport.viewerElementToImageCoordinates(
          new osd.Point(this.mouse.x, this.mouse.y)
        )
        this.mouse.dx = dp.x
        this.mouse.dy = dp.y
        handleMouseMove(this)
        this.hoverShape = getHoverShape(this)
      },
    })
    // 启用鼠标跟踪器
    tracker.setTracking(true)
    this.tracker = tracker
  }
  // 设置模式
  setMode(mode) {
    this.mode = mode
    this.viewer.setMouseNavEnabled(mode === this.tools.move)
  }
  // 销毁 TODO:
  deatroy() {}
  // 监听键盘 TODO:
  listenKeyboard() {}
  // 帧循环
  startLoop() {
    this.pixiApp.ticker.add(() => {
      render(this)
    })
  }
  // 添加图形（批量）
  addShapes(shapes) {
    this.shapes.push(...shapes)
    for (const shape of shapes) {
      this.bounds.insert(getBounds(shape))
    }
  }
  // 添加图形
  addShape(shape) {
    this.shapes.push(shape)
    this.bounds.insert(getBounds(shape))
  }
  // 删除图形（批量）
  removeShapes(shapes) {
    const ids = shapes.map((item) => item.id)
    this.shapes = this.shapes.filter((item) => !ids.includes(item.id))
    for (const shape of shapes) {
      this.bounds.remove(shape, (a, b) => {
        return a.id === b.id
      })
    }
  }
  // 删除图形
  removeShape(shape) {
    this.shapes = this.shapes.filter((item) => item.id !== shape.id)
    this.bounds.remove(shape, (a, b) => {
      return a.id === b.id
    })
  }
  // 创建pixi
  async createPixi() {
    const osdDom = this.viewer.canvas
    const app = new Application()
    this.pixiApp = app
    await app.init({ resizeTo: osdDom, backgroundAlpha: 0 })
    // @ts-ignore
    osdDom.appendChild(app.canvas)
    app.canvas.style.pointerEvents = "none"
    app.canvas.style.position = "absolute"
    app.canvas.style.top = "0"
    app.canvas.style.left = "0"
    const graphics = new Graphics()
    this.graphics = graphics
    app.stage.addChild(graphics)
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
}
