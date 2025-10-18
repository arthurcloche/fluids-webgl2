import { extend } from "../utils.js";
import { ShaderManager } from "./shader.js";
import { Texture2D } from "./texture.js";
import { Buffer } from "./mesh.js";

export class Context {
  constructor(gl, resources) {
    this.gl = gl;
    this.resources = resources;
    this.shaderManager = new ShaderManager(gl, resources);
  }

  getBuffer(name, target, mode) {
    const data = this.resources[name];
    return new Buffer(this.gl, data, target, mode);
  }

  getFBO() {
    // placeholder
  }

  getTexture(name, options) {
    const image = this.resources[name];
    return new Texture2D(this.gl, image, options);
  }

  getShader(name) {
    // placeholder
  }
}

const log_error = (el, msg, id) => {
  if (window.console && window.console.error) console.error(id, msg);
};

export const initialize = (canvas, options, onerror) => {
  const upgrade = "Try upgrading to the latest version of Firefox or Chrome.";

  onerror = onerror || log_error;

  if (!canvas.getContext) {
    onerror(
      canvas,
      "canvas is not supported by your browser. " + upgrade,
      "no-canvas"
    );
    return;
  }

  const context_options = extend(
    {
      alpha: false,
      depth: true,
      stencil: false,
      antialias: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
    },
    options.context
  );

  const extensions = options.extensions || {};

  // Try WebGL2 first
  let gl = canvas.getContext("webgl2", context_options);
  if (gl == null) {
    onerror(
      canvas,
      "WebGL 2 is not supported by your browser. " + upgrade,
      "no-webgl2"
    );
    return;
  }

  if (
    options.vertex_texture_units &&
    gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) <
      options.vertex_texture_units
  ) {
    onerror(
      canvas,
      "This application needs at least two vertex texture units which are not supported by your browser. " +
        upgrade,
      "no-vertex-texture-units"
    );
    return;
  }

  // Float textures are core in WebGL2, no extension needed
  // EXT_color_buffer_float is available by default in WebGL2 for float rendering

  // Enable EXT_float_blend for blending with float textures (required in Safari)
  const floatBlendExt = gl.getExtension("EXT_float_blend");
  if (!floatBlendExt) {
    console.warn(
      "EXT_float_blend not supported - blending with float textures may not work"
    );
  }

  // Enable EXT_color_buffer_float for rendering to float textures
  const colorBufferFloatExt = gl.getExtension("EXT_color_buffer_float");
  if (!colorBufferFloatExt) {
    console.warn("EXT_color_buffer_float not supported");
  }

  if (window.WebGLDebugUtils && options.debug) {
    if (options.log_all) {
      gl = WebGLDebugUtils.makeDebugContext(gl, undefined, function () {
        console.log.apply(console, arguments);
      });
    } else {
      gl = WebGLDebugUtils.makeDebugContext(gl);
    }
  }

  if (context_options.depth) {
    gl.enable(gl.DEPTH_TEST);
  } else {
    gl.disable(gl.DEPTH_TEST);
  }
  gl.enable(gl.CULL_FACE);

  gl.lost = false;
  canvas.addEventListener(
    "webglcontextlost",
    () => {
      onerror(canvas, "Lost webgl context!", "context-lost");
      gl.lost = true;
    },
    false
  );

  return gl;
};
