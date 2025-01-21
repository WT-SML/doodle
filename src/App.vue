<script setup>
import { onMounted, ref, reactive } from "vue"
import { createDoodle } from "../doodle/main.js"
import { defaultShapes } from "~/tools/default-shapes"
import { defaultOsdConf } from "./tools/default-osd-conf"
import osd from "openseadragon"
import _ from "lodash"
import { useFps } from "@vueuse/core"

const fps = useFps()

const osdRef = ref(null)

const state = reactive({
  viewer: null,
  doodle: null,
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
  state.viewer = new osd.Viewer(osdConf)
}
// 初始化标注插件
const initDoodle = () => {
  const doodle = createDoodle({
    viewer: state.viewer,
    onAdd: (shape) => {
      console.log(shape)
    },
    onRemove: (shape) => {
      console.log(shape)
    },
    onUpdate: (shape) => {
      console.log(shape)
    },
  })
  state.doodle = doodle
}

onMounted(() => {
  initOSD()
  state.viewer.addHandler("open", () => {
    // 初始化标注插件
    initDoodle()
    // 渲染默认的 shapes
    state.doodle.addShapes(_.cloneDeep(defaultShapes))
  })
})
</script>

<template>
  <div class="w-100vw h-100vh overflow-hidden flex flex-col">
    <!-- 顶部导航 -->
    <div
      class="h-40px flex-shrink-0 flex items-center px-5 border border-solid border-l-0 border-r-0 border-t-0"
    >
      <img src="/vite.svg" class="mr-3" width="25" />
      <span class="text-20px">Doodle</span>
    </div>
    <div class="flex-grow flex">
      <!-- 侧边导航 -->
      <div
        class="w-200px flex-shrink-0 border border-solid border-l-0 border-t-0 border-b-0 p-3"
      >
        <button
          v-for="(v, k) in state.doodle?.tools"
          @click="state.doodle.setMode(v)"
          class="block w-full cursor-pointer mb-2"
        >
          {{ v }}
        </button>
      </div>
      <!-- 画布 -->
      <div class="flex-grow bg-[#eee]">
        <div ref="osdRef" class="osd h-full"></div>
      </div>
    </div>
    <!-- 底部信息 -->
    <div
      class="flex-shrink-0 h-25px border border-solid border-l-0 border-b-0 border-b-0 flex items-center px-3 text-12px"
    >
      FPS：{{ fps }}
    </div>
  </div>
</template>

<style>
.osd canvas,
.openseadragon-canvas {
  outline: none !important;
}
</style>
