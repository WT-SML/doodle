import resolve from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import terser from "@rollup/plugin-terser"

export default {
  input: "doodle/main.js",
  output: [
    {
      file: "doodle-dist/doodle.js",
      format: "es",
      inlineDynamicImports: true, // 内联动态导入
    },
    {
      file: "doodle-dist/doodle.min.js",
      format: "es",
      inlineDynamicImports: true, // 内联动态导入
      plugins: [terser()], // 使用 terser 压缩
    },
  ],
  plugins: [resolve(), commonjs()],
}
