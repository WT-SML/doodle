import resolve from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"

export default {
  input: "doodle/main.js",
  output: {
    file: "doodle-dist/doodle.js",
    format: "es",
    inlineDynamicImports: true, // 内联动态导入
    sourcemap: true,
  },
  plugins: [resolve(), commonjs()],
}
