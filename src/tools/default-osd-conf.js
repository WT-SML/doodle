export const defaultOsdConf = {
  showNavigator: false, // 显示小地图
  // navigatorPosition: "TOP_LEFT", // 设置缩略图的位置
  showNavigationControl: false, // 设置为false以防止出现默认导航控件。 注意，如果设置为false，由选项zoomInButton、zoomOutButton等设置的自定义按钮将呈现为非活动状态。
  // animationTime: 0.3, // 动画过度时间
  // defaultZoomLevel: 0, // 第一次打开图像或单击主页按钮时使用的缩放级别。 如果为0，则调整以适合查看器。
  // maxZoomPixelRatio: 2, // 允许放大以影响最高级别像素比的最大比率。 这可以设置为Infinity，允许“无限”缩放图像，但如果HTML5 Canvas无法在查看设备上使用，这在视觉上就不那么有效了。
  // minZoomLevel: 1, // 最小缩放等级
  // maxZoomLevel: 80, // 最大缩放等级
  zoomPerClick: 1.0, // 每次鼠标点击或触摸点击的“缩放距离”。 注意:将此设置为1.0将有效地禁用点击缩放功能
  visibilityRatio: 0.5, // 源图像必须保持在视口中的百分比(从0到1的数字)。 如果图像被拖动超过这个限制，它将“反弹”回来，直到达到最小的能见度比。 将其设置为0并将wrapHorizontal(或wrapVertical)设置为true将提供无限滚动视口的效果。
  // wrapHorizontal: false, // 设置为true强制图像在视口中水平包装。 用于表示球体或圆柱体表面的地图或图像。
  // zoomPerScroll: 1.2, // 滚轮缩放速度
  // timeout: 120000, // 一个映像作业完成所需要的最大毫秒数。
  // navigatorAutoFade: false, // 自动隐藏小地图
  // debugMode: false, // 调试模式
  // debugGridColor: "#D95F02", // 调试模式网格颜色
  // autoResize: true, // 设置为 false 以防止轮询查看器大小更改。对于提供自定义调整大小行为很有用。
  // preserveImageSizeOnResize: true, // 设置为 true 以在调整查看器大小时保留图像大小。这需要 autoResize=true（默认）。
  // minScrollDeltaTime: 50, // 画布滚动事件之间的毫秒数。此值有助于标准化不同设备之间的画布滚动事件的速率，从而使速度较快的设备减速到足以使缩放控制更易于管理。
  crossOriginPolicy: true,
}
