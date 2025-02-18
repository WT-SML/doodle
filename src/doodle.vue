<script setup>
import { onMounted, ref, reactive, computed, markRaw } from "vue"
import { createDoodle } from "../doodle/main.js"
import { randomPoints } from "~/tools"
import { defaultShapes } from "~/tools/default-shapes"
import { defaultOsdConf } from "~/tools/default-osd-conf"
import osd from "openseadragon"
import _ from "lodash"
import { useFps } from "@vueuse/core"
import {
  NButton,
  NCheckbox,
  useMessage,
  NMessageProvider,
  NColorPicker,
} from "naive-ui"
import {
  Application,
  Assets,
  Buffer,
  BufferUsage,
  Geometry,
  GlProgram,
  Mesh,
  Shader,
} from "pixi.js"

const message = useMessage()

// 模式和描述的映射
const modeDescMap = computed(() => {
  if (!state.doodle) return {}
  return {
    [state.doodle.tools.move]: "移动",
    [state.doodle.tools.rect]: "矩形",
    [state.doodle.tools.polygon]: "多边形",
    [state.doodle.tools.circle]: "圆",
    [state.doodle.tools.ellipse]: "椭圆",
    [state.doodle.tools.path]: "路径",
    [state.doodle.tools.closed_path]: "闭合路径",
    [state.doodle.tools.line]: "直线",
    [state.doodle.tools.arrow_line]: "箭头直线",
    [state.doodle.tools.point]: "点",
  }
})

const fps = useFps()

const osdRef = ref(null)

const state = reactive({
  viewer: null, // osd画布
  doodle: null, // 避免涂鸦对象被vue代理产生性能问题
  mode: null, // 模式
  brushColor: null, // 画笔颜色
})

// 初始化osd
const initOSD = () => {
  const tileSources =
    "http://openseadragon.github.io/example-images/duomo/duomo.dzi"
  const osdConf = {
    ..._.cloneDeep(defaultOsdConf),
    element: osdRef.value,
    tileSources, // 瓦片源
  }
  const viewer = new osd.Viewer(osdConf)
  state.viewer = markRaw(viewer)
}
// 初始化标注插件
const initDoodle = () => {
  const doodle = createDoodle({
    viewer: state.viewer,
    onAdd: (shape) => {
      doodle.addShape(shape)
    },
    onRemove: (shape) => {
      doodle.removeShape(shape)
    },
    onUpdate: (shape) => {
      doodle.updateShape(shape)
    },
  })
  state.doodle = markRaw(doodle)
  // 初始化模式
  state.mode = doodle.mode
  // 初始化画笔颜色
  state.brushColor = doodle.brushColor
}
// 销毁
const destroy = () => {
  if (!state.doodle) return
  state.doodle.destroy()
  state.doodle = null
}
// 创建涂鸦实例
const init = () => {
  if (state.doodle) return
  // 初始化标注插件
  initDoodle()
  // 渲染默认的 shapes
  setTimeout(() => {
    state.doodle.addShapes(defaultShapes)
  }, 1000)
}
// 清空标注
const clear = () => {
  state.doodle.clear()
}
// 随机生成10000个点标注
const random10000Points = async () => {
  const points = randomPoints(state.viewer, 10000)
  // doodle.addShapes(points)

  const vertex = `
in vec2 aPosition;
in vec2 aPositionOffset;
in vec3 aColor;

out vec3 vColor;

uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;

void main() {
    mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
    gl_Position = vec4((mvp * vec3(aPosition + aPositionOffset, 1.0)).xy, 0.0, 1.0);
    vColor = aColor; 
}
    
    `

  const fragment = ` 
  in vec3 vColor;
  void main() {
    gl_FragColor = vec4(vColor, 1.0);
}
    `

  const totalTriangles = points.length
  const instancePositionBuffer = new Buffer({
    data: new Float32Array(totalTriangles * 2),
    usage: BufferUsage.VERTEX | BufferUsage.COPY_DST,
  })
  const instanceColorBuffer = new Buffer({
    data: new Float32Array(totalTriangles * 3), // 每个三角形三个值（r, g, b）
    usage: BufferUsage.VERTEX | BufferUsage.COPY_DST,
  })
  const triangles = []
  const colorData = instanceColorBuffer.data

  function hexToRGB(hex) {
    // 去掉可能存在的 #
    hex = hex.replace(/^#/, '');
    // 将 3 位简写转为 6 位
    if(hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }
    const intVal = parseInt(hex, 16);
    const r = ((intVal >> 16) & 255) / 255;
    const g = ((intVal >> 8) & 255) / 255;
    const b = (intVal & 255) / 255;
    return [r, g, b];
}

  for (const i in points) {
    const v = points[i]
    const color = hexToRGB(v.color)
    triangles[i] = {
      x: v.pos[0],
      y: v.pos[1],
      ox: v.pos[0],
      oy: v.pos[1],
      speed: 1 + Math.random() * 2,
      r: color[0],
      g: color[1],
      b: color[2],
    }
    const { r, g, b } = triangles[i]
    const index = i * 3
    colorData[index] = r
    colorData[index + 1] = g
    colorData[index + 2] = b
  }
  instanceColorBuffer.update()

  // 设置圆形近似的分段数和半径
  const segments = 40
  const radius = 6
  const vertexCount = segments + 2 // 中心点 + 圆周上 (segments + 1) 个点（闭合圆周）

  // 创建顶点数组，每个顶点 2 个分量 (x, y)
  const positions = new Float32Array(vertexCount * 2)

  // 第一个顶点为圆心，位置 (0, 0)；对应的 UV 为 (0.5, 0.5)
  positions[0] = 0
  positions[1] = 0

  // 生成圆周上的顶点数据
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    // 将顶点数据存入 positions 数组
    positions[(i + 1) * 2] = x
    positions[(i + 1) * 2 + 1] = y
  }

  // 如果不指定绘制模式，需要生成索引数组将三角扇转换为三角形列表
  // 每个三角形使用圆心（索引 0）和圆周上相邻的两个点
  const indices = new Uint16Array(segments * 3)
  for (let i = 0; i < segments; i++) {
    indices[i * 3] = 0 // 圆心
    indices[i * 3 + 1] = i + 1 // 当前圆周点
    indices[i * 3 + 2] = i + 2 // 下一个圆周点
  }
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
    instanceCount: totalTriangles,
  })
  const gl = { vertex, fragment }
  const shader = Shader.from({
    gl,
  })
  const triangleMesh = new Mesh({
    geometry,
    shader,
  })
  const app = state.doodle.pixiApp
  app.stage.addChild(triangleMesh)
  app.ticker.add(() => {
    const scale = state.doodle.scale
    triangleMesh.scale = 1 / scale
    const data = instancePositionBuffer.data
    let count = 0
    for (let i = 0; i < totalTriangles; i++) {
      const triangle = triangles[i]
      triangle.x = triangle.ox * scale
      triangle.y = triangle.oy * scale
      data[count++] = triangle.x
      data[count++] = triangle.y
    }
    instancePositionBuffer.update()
  })
}
// 设置模式
const setMode = (mode) => {
  state.mode = mode
  state.doodle.setMode(mode)
}
// 设置画笔颜色
const setBrushColor = (color) => {
  state.brushColor = color
  state.doodle.setBrushColor(color)
}
// 复制所有标注信息
const copyAllShapes = async () => {
  const shapes = state.doodle.getShapes()
  const shapesString = JSON.stringify(shapes)
  try {
    await navigator.clipboard.writeText(shapesString)
    message.success("已复制！")
  } catch (err) {
    message.error("复制失败！")
  }
}

onMounted(() => {
  initOSD()
  state.viewer.addHandler("open", () => {
    init()
  })
})
</script>

<template>
  <div class="w-100vw h-100vh overflow-hidden flex flex-col">
    <n-message-provider />
    <!-- 顶部导航 -->
    <div class="h-40px flex-shrink-0 flex items-center px-5 border-b">
      <img src="/vite.svg" class="mr-3" width="25" />
      <span class="text-20px">Doodle</span>
    </div>
    <div class="flex-grow flex">
      <!-- 侧边导航 -->
      <div class="w-200px flex-shrink-0 border-r p-3">
        <div class="mb-2">模式：</div>
        <div v-if="state.doodle" class="pl-5 mb-3 flex flex-col">
          <n-checkbox
            v-for="(v, k) in state.doodle.tools"
            :key="k"
            :label="modeDescMap[v]"
            @update:checked="setMode(v)"
            :checked="v === state.mode"
          />
        </div>
        <div class="mb-2">颜色：</div>
        <div v-if="state.doodle" class="pl-5 mb-3">
          <n-color-picker
            :modes="['hex']"
            :show-alpha="false"
            :swatches="[
              '#ffffff',
              '#c12c1f',
              '#e18a3b',
              '#c3d94e',
              '#2a6e3f',
              '#007175',
              '#3271ae',
              '#8a1874',
            ]"
            v-model:value="state.brushColor"
            @update:value="setBrushColor"
          />
        </div>
        <div class="mb-2">测试按钮：</div>
        <div class="pl-5 flex flex-col gap-y-10px">
          <n-button v-if="!state.doodle" size="tiny" @click="init()">
            创建Doodle实例
          </n-button>
          <template v-else>
            <n-button size="tiny" @click="destroy()"> 销毁Doodle实例 </n-button>
            <n-button size="tiny" @click="clear()"> 清空所有标注 </n-button>
            <n-button size="tiny" @click="random10000Points()">
              生成10000个点标注
            </n-button>
            <n-button size="tiny" @click="copyAllShapes()">
              复制所有标注信息
            </n-button>
          </template>
        </div>
      </div>
      <!-- 画布 -->
      <div class="flex-grow bg-[#eee]">
        <div ref="osdRef" class="osd h-full"></div>
      </div>
    </div>
    <!-- 底部信息 -->
    <div class="flex-shrink-0 h-25px border-t flex items-center px-3 text-12px">
      <span> FPS：{{ fps }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
