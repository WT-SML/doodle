### Doodle

Doodle 是一个高性能的 deepzoom 绘图标注插件。它可以轻松实现数十万可交互图形的同屏渲染。

### 在线体验

Demo 地址：[https://wt-sml.github.io/doodle/](https://wt-sml.github.io/doodle/)

### 安装

```bash
pnpm install @wtsml/doodle
```

### 使用

```js
import { createDoodle } from "@wtsml/doodle"

// 创建doodle实例
const doodle = createDoodle({
  viewer, // openseadragon viewer
  // 监听添加 shape 事件
  onAdd: (shape) => {
    doodle.addShape(shape)
  },
  // 监听删除 shape 事件
  onRemove: (shape) => {
    doodle.removeShape(shape)
  },
  // 监听更新 shape 事件
  onUpdate: (shape) => {
    doodle.updateShape(shape)
  },
  // 监听选中 shape 事件
  onSelect: (shape) => {
    console.log("选中了shape", shape)
  },
})

// 添加图形
doodle.addShapes(shapes) // shape的数据结构参考后面 “shape对象结构示例” 部分
```

### 属性

#### tools

支持的绘图工具枚举。

其默认值为：

```js
// 绘图工具列表
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
```

#### conf

type : `object`

使用 `createDoodle` 创建 doodle 实例时的入参。

`conf` 里应该至少包含 `viewer` 参数，`viewer` 是 openseadragon 的画布实例。

#### pixiApp

type : `object`

doodle 底层使用 pixi.js 实现，pixiApp 是 pixi 的实例。

#### mode

type : `string`

doodle 当前所处的绘图模式，可以通过 `setMode` 方法切换绘图模式。

#### viewer

type : `object`

openseadragon 的画布实例。

#### shapes

type : `object[]`

shape 列表，所有绘制的图形都保存在这里。

数据结构参考后面 “shape 对象结构示例” 部分。

可以通过 `getShapes` API 获取它的克隆副本。

#### bounds

type : `object[]`

所有 shape 的边界列表。doodle 为了更高的性能，为每个 shape 都保存了边界信息，方便后续的计算。

数据结构为：

```js
{
  minX: 0,
  minY: 0,
  maxX: 0,
  maxY: 0,
  id: null,
}
```

#### scale

type : `number`

缩放信息。

#### translate

type : `object`

平移信息。

数据结构为：

```js
{
  x: 0,
  y: 0,
}
```

#### strokeWidth

type : `number`

图形线宽。默认值为 2。

#### defaultColor

type : `string`

图形默认颜色。默认值为 `#FF0000` 红色。可以通过 `setDefaultColor` API 修改。

#### brushColor

type : `string`

画笔颜色。默认值为 `#FF0000` 红色。可以通过 `setBrushColor` API 修改。

#### hitRadius

type : `number`

光标的碰撞检测半径。默认值为 5。

#### anchorRadius

type : `number`

锚点半径。默认值为 5。

#### pointRadius

type : `number`

点半径。默认值为 6。

#### tempShape

type : `object`

临时 shape，新增和编辑图形时，临时创建的 shape 副本。

#### hoverShape

type : `object`

鼠标悬浮的 shape。

#### mouse

type : `object`

鼠标相关信息。
其结构为：

```js
// 鼠标
mouse = {
  x: 0, // 视口x
  y: 0, // 视口y
  dx: 0, // 画布x
  dy: 0, // 画布y
  isPressed: false, // 是否按下
}
```

#### readonly

type : `boolean`

只读模式。只读模式下，无法使用绘制功能。可以通过 `setReadOnly` API 切换。

### API

#### setMode(mode: string): void

设置绘图模式，其入参合法值应为 `tools` 枚举中的值。

#### setPan(pan: boolean): void

设置画布是否允许拖动。

#### addShapes(shapes: object[]): void

添加图形（批量）。

#### addShape(shape: object): void

添加图形（单个）。

#### removeShapes(shapes: object[]): void

删除图形（批量）。

#### removeShape(shape: object): void

删除图形（单个）。

#### updateShapes(shapes: object[]): void

更新图形（批量）。

#### updateShape(shape: object): void

更新图形（单个）。

#### selectShape(shape: object): void

选择图形。

#### clear(): void

清空所有的 shape。

#### destroy(): void

销毁 doodle 实例。

#### getScale(): number

获取缩放比例。

#### getShapes(): object[]

获取所有图形的克隆副本。

#### setDefaultColor(color: string): void

设置默认颜色。

#### setBrushColor(color: string): void

设置画笔颜色。

#### setReadOnly: (readonly: boolean) => void

设置只读模式。

#### moveToShape(shape: object, immediately: boolean): void

移动视野至指定图形。

如果 `immediately` 为 `true` 则立即移动，没有过渡动画。默认为 `false`，有过渡动画。

### 事件

#### onAdd: (shape: object) => void

添加 shape 事件。

#### onRemove: (shape: object) => void

删除 shape 事件。

#### onUpdate: (shape: object) => void

更新 shape 事件。

#### onSelect: (shape: object) => void

选中 shape 事件。

### shape 对象结构示例

```js
export const defaultShapes = [
  // 矩形
  {
    id: "uLi2gbqSx6sX2a40GiYzr",
    type: "rect",
    // pos 结构为 [x, y, width, height]，表示矩形左上角的点坐标x,y与矩形的宽高width,height
    pos: [1428, 2067, 1384, 969],
    color: "#0000ff",
  },
  // 多边形
  {
    id: "pPLz_t2P4ph0U9QWyGhxK",
    type: "polygon",
    // pos 结构为 [x, y, x, y, x, y,...]，表示多边形各个点的坐标x,y的循环
    pos: [
      4654, 2049, 4178, 2596, 4628, 3098, 5465, 3116, 5924, 2587, 5395, 2058,
    ],
    color: "#e74c3c",
  },
  // 圆
  {
    id: "CkJbGZOs1VE68YAzPUGtf",
    type: "circle",
    // pos 结构为 [x, y, r]，x,y为圆心坐标，r为半径
    pos: [8366, 2605, 608],
    color: "#4cd137",
  },
  // 椭圆
  {
    id: "DOvh2VnbUDFX97ZUtak4V",
    type: "ellipse",
    // pos 结构为 [x, y, rx, ry]，x,y为圆心坐标，rx为横轴半径，ry为纵轴半径
    pos: [12064, 2746, 1185, 581],
    color: "#3271ae",
  },
  // 直线
  {
    id: "de3_sHY_w3EL76TeKYRZn",
    type: "line",
    // pos 结构为 [x, y, x, y]，分别为起点和终点的x,y坐标
    pos: [8260, 4447, 9238, 6272],
    color: "#1abc9c",
  },
  // 箭头直线
  {
    id: "Jta8DSQvx40n9KXZ7ELyY",
    type: "arrow_line",
    // pos 结构为 [x, y, x, y]，分别为起点和终点的x,y坐标
    pos: [11442, 6166, 12809, 4544],
    color: "#9c88ff",
  },
  // 点
  {
    id: "v5uPfeRhZFdBMA-Y16D7L",
    type: "point",
    // pos 结构为 [x, y]，表示点的x,y坐标
    pos: [2098, 7603],
    color: "#00ff00",
  },
  // 路径
  {
    id: "YPb7Wk4eQAkNPCKm-kj7C",
    type: "path",
    // pos 结构为 [x, y, x, y, x, y,...]，表示路径各个点的坐标x,y的循环
    pos: [
      1877, 4632, 1868, 4632, 1860, 4632, 1816, 4641, 1754, 4659, 1692, 4668,
      1648, 4685, 1604, 4694, 1525, 4729, 1445, 4765, 1392, 4809, 1357, 4861,
      1339, 4906, 1339, 4950, 1339, 4994, 1339, 5038, 1366, 5100, 1392, 5144,
      1428, 5196, 1454, 5241, 1481, 5285, 1489, 5338, 1498, 5390, 1498, 5461,
      1436, 5523, 1366, 5593, 1278, 5664, 1216, 5743, 1181, 5796, 1172, 5849,
      1172, 5902, 1207, 5955, 1269, 6008, 1339, 6052, 1419, 6104, 1516, 6140,
      1630, 6157, 1833, 6157, 2133, 6157, 2397, 6166, 2565, 6166, 2653, 6157,
      2741, 6078, 2829, 5955, 2891, 5858, 2909, 5761, 2909, 5673, 2900, 5584,
      2865, 5487, 2829, 5426, 2785, 5382, 2759, 5355, 2750, 5338, 2732, 5302,
      2732, 5276, 2741, 5249, 2776, 5214, 2829, 5152, 2882, 5082, 2926, 5011,
      2962, 4941, 2970, 4861, 2970, 4791, 2970, 4729, 2944, 4668, 2926, 4615,
      2900, 4579, 2882, 4544, 2856, 4526, 2812, 4500, 2768, 4474, 2715, 4465,
      2644, 4465, 2556, 4465, 2477, 4465, 2415, 4474, 2380, 4482, 2371, 4491,
    ],
    color: "#e18a3b",
  },
  // 闭合路径
  {
    id: "QDKEJhCju3gY_ClCOhp9H",
    type: "closed_path",
    // pos 结构为 [x, y, x, y, x, y,...]，表示路径各个点的坐标x,y的循环
    pos: [
      4980, 4350, 4980, 4359, 4936, 4385, 4848, 4421, 4716, 4465, 4592, 4509,
      4496, 4553, 4416, 4597, 4372, 4668, 4363, 4738, 4407, 4835, 4513, 4923,
      4645, 5011, 4778, 5108, 4883, 5188, 4919, 5223, 4927, 5258, 4927, 5311,
      4883, 5373, 4804, 5426, 4716, 5487, 4637, 5549, 4548, 5602, 4496, 5664,
      4478, 5699, 4478, 5743, 4504, 5787, 4557, 5849, 4637, 5937, 4769, 6016,
      4892, 6078, 4972, 6113, 4980, 6122, 4980, 6131, 4954, 6166, 4927, 6210,
      4919, 6237, 4927, 6246, 4954, 6272, 5016, 6298, 5121, 6351, 5227, 6387,
      5342, 6395, 5465, 6395, 5580, 6395, 5703, 6378, 5844, 6351, 6003, 6298,
      6109, 6263, 6197, 6210, 6285, 6149, 6356, 6069, 6426, 5981, 6470, 5902,
      6505, 5814, 6514, 5743, 6523, 5673, 6541, 5602, 6541, 5531, 6541, 5461,
      6550, 5390, 6550, 5329, 6532, 5276, 6532, 5214, 6523, 5161, 6514, 5117,
      6505, 5055, 6497, 5011, 6497, 4950, 6488, 4897, 6470, 4844, 6461, 4800,
      6453, 4756, 6444, 4694, 6435, 4650, 6417, 4606, 6409, 4562, 6391, 4526,
      6364, 4482, 6329, 4447, 6294, 4412, 6259, 4385, 6206, 4368, 6144, 4359,
      6109, 4341, 6074, 4341, 6012, 4350, 5959, 4385, 5906, 4438, 5862, 4474,
      5827, 4500, 5791, 4509, 5747, 4509, 5721, 4509, 5694, 4509, 5686, 4509,
      5677, 4500, 5650, 4447, 5633, 4394, 5615, 4333, 5597, 4271, 5580, 4218,
      5571, 4147, 5553, 4095, 5545, 4059, 5545, 4042, 5527, 4024, 5509, 4015,
      5492, 3998, 5465, 3989, 5430, 3989, 5395, 3980, 5377, 3980, 5351, 3980,
      5324, 3980, 5315, 3980, 5307, 3980,
    ],
    color: "#fedc5e",
  },
]
```

### 注意事项

- 在 vue 项目中，为了最佳性能，请使用 markRaw 将 doodle 实例设为非响应式对象，例如 `state.doodle = markRaw(doodle)` 。

### 贡献

- [红叶](https://github.com/WT-SML)
