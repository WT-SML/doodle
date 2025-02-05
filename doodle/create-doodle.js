import { Doodle } from "./doodle"

// 创建涂鸦实例
export const createDoodle = (conf) => {
  return new Doodle(conf)
}
