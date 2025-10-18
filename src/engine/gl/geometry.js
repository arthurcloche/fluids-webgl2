export const grid = (size) => {
  const buffer = new Float32Array(size * size * 6 * 3);
  let i = 0;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      buffer[i++] = x / size;
      buffer[i++] = 0;
      buffer[i++] = y / size;

      buffer[i++] = x / size;
      buffer[i++] = 0;
      buffer[i++] = (y + 1) / size;

      buffer[i++] = (x + 1) / size;
      buffer[i++] = 0;
      buffer[i++] = (y + 1) / size;

      buffer[i++] = x / size;
      buffer[i++] = 0;
      buffer[i++] = y / size;

      buffer[i++] = (x + 1) / size;
      buffer[i++] = 0;
      buffer[i++] = (y + 1) / size;

      buffer[i++] = (x + 1) / size;
      buffer[i++] = 0;
      buffer[i++] = y / size;
    }
  }
  return buffer;
};

// convert a gl.TRIANGLES mesh into a wireframe for rendering with gl.LINES
export const wireFrame = (input) => {
  const output = new Float32Array(input.length * 2);
  const triangles = input.length / 9;
  for (let t = 0; t < triangles; t++) {
    for (let v1 = 0; v1 < 3; v1++) {
      const v2 = (v1 + 1) % 3;
      for (let i = 0; i < 3; i++) {
        output[t * 18 + v1 * 3 + i] = input[t * 9 + v1 * 3 + i];
        output[t * 18 + v1 * 3 + 9 + i] = input[t * 9 + v2 * 3 + i];
      }
    }
  }
  return output;
};

export const screen_quad = (xscale = 1, yscale = xscale) => {
  return new Float32Array([
    -xscale,
    yscale,
    0,
    -xscale,
    -yscale,
    0,
    xscale,
    -yscale,
    0,

    -xscale,
    yscale,
    0,
    xscale,
    -yscale,
    0,
    xscale,
    yscale,
    0,
  ]);
};

export const cube = (scale = 1) => {
  return new Float32Array([
    // back
    scale,
    scale,
    scale,
    scale,
    -scale,
    scale,
    -scale,
    -scale,
    scale,

    scale,
    scale,
    scale,
    -scale,
    -scale,
    scale,
    -scale,
    scale,
    scale,

    // front
    -scale,
    scale,
    -scale,
    -scale,
    -scale,
    -scale,
    scale,
    scale,
    -scale,

    scale,
    scale,
    -scale,
    -scale,
    -scale,
    -scale,
    scale,
    -scale,
    -scale,

    // left
    -scale,
    scale,
    scale,
    -scale,
    -scale,
    -scale,
    -scale,
    scale,
    -scale,

    -scale,
    scale,
    scale,
    -scale,
    -scale,
    scale,
    -scale,
    -scale,
    -scale,

    // right
    scale,
    scale,
    scale,
    scale,
    scale,
    -scale,
    scale,
    -scale,
    -scale,

    scale,
    scale,
    scale,
    scale,
    -scale,
    -scale,
    scale,
    -scale,
    scale,

    // top
    scale,
    scale,
    scale,
    -scale,
    scale,
    scale,
    -scale,
    scale,
    -scale,

    scale,
    scale,
    -scale,
    scale,
    scale,
    scale,
    -scale,
    scale,
    -scale,

    // bottom
    -scale,
    -scale,
    -scale,
    -scale,
    -scale,
    scale,
    scale,
    -scale,
    scale,

    -scale,
    -scale,
    -scale,
    scale,
    -scale,
    scale,
    scale,
    -scale,
    -scale,
  ]);
};
