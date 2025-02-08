import { Application, Graphics, Container, Texture } from "pixi.js"
import { drawShapes, render } from "./render"
import osd from "openseadragon"
import {
  handleMouseDown,
  handleMouseUp,
  handleMouseMove,
} from "./mouse-handler"
import RBush from "rbush"
import { getBounds } from "./bounds"
import { generateAnchors, getHoverAnchor, getHoverShape } from "./geometry"
import _, { first, set } from "lodash"
import { onKeyStroke } from "@vueuse/core"
import { Assets } from "pixi.js"
import { Sprite } from "pixi.js"
import { randomPoints } from "../src/tools"

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
  points = []
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
        const dp = this.viewer.viewport.viewerElementToImageCoordinates(
          new osd.Point(this.mouse.x, this.mouse.y)
        )
        this.mouse.dx = dp.x
        this.mouse.dy = dp.y
        handleMouseMove(this)
        // 悬浮的shape
        this.hoverShape = getHoverShape(this)
        // 悬浮的
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
    this.viewer.addHandler("animation", () => {
      // render(this)
    })
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
    this.pixiApp.ticker.add((time) => {
      // render(this)
    })
  }
  // 添加图形（批量）
  addShapes(shapes) {
    const _shapes = _.cloneDeep(shapes)
    this.shapes.push(..._shapes)
    for (const shape of _shapes) {
      this.bounds.insert(getBounds(shape, this))
    }
    render(this)
    // drawShapes(this)
  }
  // 添加图形
  addShape(shape) {
    const _shape = _.cloneDeep(shape)
    this.shapes.push(_shape)
    this.bounds.insert(getBounds(_shape, this))
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
  // 创建pixi
  async createPixi() {
    const osdDom = this.viewer.canvas
    const app = new Application()
    this.pixiApp = app
    this.texture = await Assets.load("/1.png")
    await app.init({ resizeTo: osdDom, backgroundAlpha: 0 })
    // @ts-ignore
    osdDom.appendChild(app.canvas)
    app.canvas.style.pointerEvents = "none"
    app.canvas.style.position = "absolute"
    app.canvas.style.top = "0"
    app.canvas.style.left = "0"

    const container = new Container()
    app.stage.addChild(container)

    // const texture = Texture.WHITE
    const texture = await Assets.load("https://pixijs.com/assets/bunny.png")
    // const points = randomPoints(this.viewer, 10000)
    // for (const v of points) {
    //   const bunny = new Sprite(texture)
    //   bunny.anchor.set(0.5)
    //   bunny.x = v.pos[0]
    //   bunny.y = v.pos[1]
    //   container.addChild(bunny)
    //   this.points.push(bunny)
    // }
    app.ticker.add((time) => {
      const viewport = this.viewer.viewport
      const flipped = viewport.getFlip()
      const p = viewport.pixelFromPoint(new osd.Point(0, 0), true)
      if (flipped) {
        p.x = viewport._containerInnerSize.x - p.x
      }
      const scale = this.getScale()
      this.scale = scale
      this.translate = p
      this.pixiApp.stage.x = p.x
      this.pixiApp.stage.y = p.y
      this.pixiApp.stage.scale = scale
      for (const v of this.points) {
        v.scale = 1 / this.scale
      }
    })
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
}
