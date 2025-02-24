<script setup>
import { onMounted, ref, reactive, computed, markRaw } from "vue"
import { createDoodle } from "../doodle/main.js"
import { randomPoints, randomRects } from "~/tools"
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
  state.doodle.addShapes(defaultShapes)
}
// 清空标注
const clear = () => {
  state.doodle.clear()
}
// 随机生成10000个点标注
const random10000Points = async () => {
  const points = randomPoints(state.viewer, 10000)
  state.doodle.addShapes(points)
}
// 随机生成1000个点标注
const random10000Rects = async () => {
  const rects = randomRects(state.viewer, 1000)
  state.doodle.addShapes(rects)
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
    <div
      class="h-40px w-full flex-shrink-0 flex justify-between items-center px-5 border-b"
    >
      <span class="flex">
        <img src="/vite.svg" class="mr-3" width="25" />
        <span class="text-20px">Doodle</span>
      </span>
      <a
        href="https://github.com/WT-SML/doodle"
        target="_blank"
        class="w-20px h-20px"
      >
        <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <title>GitHub</title>
          <path
            d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
          ></path>
        </svg>
      </a>
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
            <n-button size="tiny" @click="random10000Rects()">
              生成1000个矩形标注
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
