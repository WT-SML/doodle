// 顶点着色器
export const vertex = `
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
// 片元着色器
export const fragment = `
  in vec3 vColor;

  void main() {
    gl_FragColor = vec4(vColor, 1.0);
  }
`
