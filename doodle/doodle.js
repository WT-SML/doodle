import { Application, Graphics } from "pixi.js"
import { render } from "./render"

export class Doodle {
  pixiApp // pixi app
  graphics // pixi graphics
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
  // 模式
  mode = this.tools.move
  // 配置
  conf = {
    viewer: null,
  }
  // osd的画布
  viewer
  shapes = [] // 形状数组
  scale = 1 // 缩放
  // 平移
  translate = {
    x: 0,
    y: 0,
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
      // 监听键盘
      this.listenKeyboard()
      // 监听鼠标
      this.listenMouse()
      // 开始循环
      this.startLoop()
    })()
  }
  // 设置模式
  setMode(mode) {
    this.mode = mode
  }
  // 销毁 TODO:
  deatroy() {}
  // 监听键盘 TODO:
  listenKeyboard() {}
  // 监听鼠标 TODO:
  listenMouse() {}
  // 帧循环
  startLoop() {
    this.pixiApp.ticker.add(() => {
      render(this)
    })
  }
  // 添加图形（批量）
  addShapes(shapes) {
    this.shapes.push(...shapes)
  }
  // 添加图形
  addShape(shape) {
    this.shapes.push(shape)
  }
  // 删除图形（批量）
  removeShapes(shapes) {
    const ids = shapes.map((item) => item.id)
    this.shapes = this.shapes.filter((item) => !ids.includes(item.id))
  }
  // 删除图形
  removeShape(shape) {
    this.shapes = this.shapes.filter((item) => item.id !== shape.id)
  }
  // 创建pixi
  async createPixi() {
    const osdDom = this.viewer.canvas
    const app = new Application()
    this.pixiApp = app
    await app.init({ resizeTo: osdDom, backgroundAlpha: 0 })
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
}
