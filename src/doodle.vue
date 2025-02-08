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
// import fragment from "./instancedGeometry.frag"
// import vertex from "./instancedGeometry.vert"
// import source from "./instancedGeometry.wgsl"

const fragment = `
in vec2 vUV;
uniform sampler2D uTexture;
uniform float time;

void main() {
    gl_FragColor = texture(uTexture, vUV + sin( (time + (vUV.x) * 14.) ) * 0.1 );
}
`
const vertex = `
in vec2 aPosition;
in vec2 aUV;
in vec2 aPositionOffset;

out vec2 vUV;

uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;


void main() {

    mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
    gl_Position = vec4((mvp * vec3(aPosition + aPositionOffset, 1.0)).xy, 0.0, 1.0);

    vUV = aUV;
}
`
const source = `
struct GlobalUniforms {
    uProjectionMatrix:mat3x3<f32>,
    uWorldTransformMatrix:mat3x3<f32>,
    uWorldColorAlpha: vec4<f32>,
    uResolution: vec2<f32>,
}

struct LocalUniforms {
    uTransformMatrix:mat3x3<f32>,
    uColor:vec4<f32>,
    uRound:f32,
}


@group(0) @binding(0) var<uniform> globalUniforms : GlobalUniforms;
@group(1) @binding(0) var<uniform> localUniforms : LocalUniforms;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) vUV: vec2<f32>,
};


@vertex
fn mainVert(
    @location(0) aPosition : vec2<f32>,
    @location(1) aUV : vec2<f32>,
    @location(2) aPositionOffset : vec2<f32>,
) -> VertexOutput {     
    var mvp = globalUniforms.uProjectionMatrix 
        * globalUniforms.uWorldTransformMatrix 
        * localUniforms.uTransformMatrix;
    
    var output: VertexOutput;

    output.position = vec4<f32>(mvp * vec3<f32>(aPosition+aPositionOffset, 1.0), 1.0);
    output.vUV = aUV;

    return output; 
};

struct WaveUniforms {
    time:f32,
}

@group(2) @binding(1) var uTexture : texture_2d<f32>;
@group(2) @binding(2) var uSampler : sampler;
@group(2) @binding(3) var<uniform> waveUniforms : WaveUniforms;

@fragment
fn mainFrag(
    @location(0) vUV: vec2<f32>,
) -> @location(0) vec4<f32> {
    return textureSample(uTexture, uSampler, vUV + sin( (waveUniforms.time + (vUV.x) * 14.) ) * 0.1);
};
`

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
  const points = randomPoints(state.viewer, 100000)
  // doodle.addShapes(points)
  const spinnyBG = await Assets.load(
    "https://pixijs.com/assets/bg_scene_rotate.jpg"
  )
  const totalTriangles = points.length
  const instancePositionBuffer = new Buffer({
    data: new Float32Array(totalTriangles * 2),
    usage: BufferUsage.VERTEX | BufferUsage.COPY_DST,
  })
  const triangles = []
  for (const i in points) {
    const v = points[i]
    triangles[i] = {
      x: v.pos[0],
      y: v.pos[1],
      ox: v.pos[0],
      oy: v.pos[1],
      speed: 1 + Math.random() * 2,
    }
  }
  const geometry = new Geometry({
    attributes: {
      aPosition: [
        -10,
        -10, // x, y
        10,
        -10, // x, y
        10,
        10, // x, y,
        -10,
        10, // x, y,
      ],
      aUV: [0, 0, 1, 0, 1, 1, 0, 1],
      aPositionOffset: {
        buffer: instancePositionBuffer,
        instance: true,
      },
    },
    indexBuffer: [0, 1, 2, 0, 2, 3],
    instanceCount: totalTriangles,
  })
  const gl = { vertex, fragment }
  const gpu = {
    vertex: {
      entryPoint: "mainVert",
      source,
    },
    fragment: {
      entryPoint: "mainFrag",
      source,
    },
  }
  const shader = Shader.from({
    gl,
    gpu,
    resources: {
      uTexture: spinnyBG.source,
      uSampler: spinnyBG.source.style,
      waveUniforms: {
        time: { value: 1, type: "f32" },
      },
    },
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
