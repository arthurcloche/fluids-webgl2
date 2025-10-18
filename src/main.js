import { Loader } from "./engine/loader.js";
import { Clock } from "./engine/clock.js";
import { InputHandler } from "./engine/input.js";
import { debounce } from "./engine/utils.js";
import { ShaderManager } from "./engine/gl/shader.js";
import * as geometry from "./engine/gl/geometry.js";
import { FBO, Texture2D } from "./engine/gl/texture.js";
import { Mesh } from "./engine/gl/mesh.js";
import * as glcontext from "./engine/gl/context.js";
import { ComputeKernel } from "./compute.js";

const canvas = document.getElementById("c");

const gl = glcontext.initialize(
  canvas,
  {
    context: {
      depth: false,
    },
    debug: false,
    extensions: {},
  },
  fail
);

const options = {
  iterations: 32,
  mouse_force: 0.25,
  resolution: 0.5,
  cursor_size: 100,
  step: 1 / 120,
  damping: 1.0,
  divergence_scale: 0.5,
  // Visualization
  velocity_scale: 1.5,
  velocity_offset: 0.5,
  show_pressure: true,
  show_velocity: true,
  render_mode: "fluidPlay", // "fluidPlay" or "visualize"
};

let gui;
const clock = new Clock(canvas);
const input = new InputHandler(canvas);
const loader = new Loader();
const resources = loader.resources;
let shaders;

if (gl) {
  shaders = new ShaderManager(gl, resources);
  window.gl = gl;
}

function fail(el, msg, id) {
  console.error("WebGL initialization failed:", msg, id);
}

function createTextCanvas(width, height) {
  const textCanvas = document.createElement("canvas");
  textCanvas.width = width;
  textCanvas.height = height;
  const ctx = textCanvas.getContext("2d");

  // White background
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, width, height);

  // Black text
  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Calculate font size based on canvas dimensions
  const fontSize = Math.min(width, height) * 0.08;
  ctx.font = `${fontSize}px Arial, sans-serif`;

  // Draw text in the center
  ctx.fillText("Be water, my friend", width / 2, height / 2);

  return textCanvas;
}

function hasFloatLuminanceFBOSupport() {
  const fbo = new FBO(gl, 32, 32, gl.FLOAT, gl.RED);
  return fbo.supported;
}

function init() {
  const format = hasFloatLuminanceFBOSupport() ? gl.RED : gl.RGBA;

  const onresize = debounce(() => {
    // Match original: use getBoundingClientRect() without DPR
    const rect = canvas.getBoundingClientRect();
    const width = rect.width * options.resolution;
    const height = rect.height * options.resolution;
    input.updateOffset();
    setup(width, height, format);
  }, 250);

  window.addEventListener("resize", onresize);

  // Initialize GUI if available
  if (typeof window !== "undefined" && window.lil && window.lil.GUI) {
    gui = new window.lil.GUI();

    const simFolder = gui.addFolder("Simulation");
    simFolder.add(options, "iterations", 2, 128, 2).name("pressure iterations");
    simFolder.add(options, "damping", 0.9, 1.0, 0.001).name("velocity damping");
    simFolder
      .add(options, "divergence_scale", 0.0, 1.0, 0.01)
      .name("divergence scale");
    simFolder
      .add(options, "step", {
        "1/1024": 1 / 1024,
        "1/240": 1 / 240,
        "1/120": 1 / 120,
        "1/60": 1 / 60,
        "1/30": 1 / 30,
        "1/10": 1 / 10,
      })
      .name("time step");
    simFolder.close();

    const inputFolder = gui.addFolder("Input");
    inputFolder.add(options, "mouse_force", 0, 1, 0.001).name("force");
    inputFolder
      .add(options, "cursor_size", 8, 1000, 1)
      .onFinishChange(onresize)
      .name("radius");
    inputFolder.close();

    const visualFolder = gui.addFolder("Visualization");
    visualFolder
      .add(options, "velocity_scale", 0, 5, 0.1)
      .name("velocity scale");
    visualFolder
      .add(options, "velocity_offset", 0, 1, 0.1)
      .name("velocity offset");
    visualFolder.add(options, "show_pressure").name("show pressure");
    visualFolder.add(options, "show_velocity").name("show velocity");
    visualFolder.close();

    const renderFolder = gui.addFolder("Rendering");
    renderFolder
      .add(options, "render_mode", {
        "Fluid Play": "fluidPlay",
        Visualize: "visualize",
      })
      .name("render mode");
    renderFolder
      .add(options, "resolution", {
        quarter: 0.25,
        half: 0.5,
        full: 1.0,
        double: 2.0,
        quadruple: 4.0,
      })
      .onFinishChange(onresize);
    renderFolder.close();
  }

  // Initial resize
  onresize();

  // Force another resize after a short delay to ensure CSS is loaded
  setTimeout(() => {
    const rect = canvas.getBoundingClientRect();
    const width = rect.width * options.resolution;
    const height = rect.height * options.resolution;
    setup(width, height, format);
  }, 100);

  clock.start();
}

function setup(width, height, singleComponentFboFormat) {
  canvas.width = Math.floor(width);
  canvas.height = Math.floor(height);

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.lineWidth(1.0);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  const px_x = 1.0 / canvas.width;
  const px_y = 1.0 / canvas.height;
  const px = new Float32Array([px_x, px_y]);
  const px1 = new Float32Array([1, canvas.width / canvas.height]);

  const inside = new Mesh(gl, {
    vertex: geometry.screen_quad(1.0 - px_x * 2.0, 1.0 - px_y * 2.0),
    attributes: {
      position: {},
    },
  });

  const all = new Mesh(gl, {
    vertex: geometry.screen_quad(1.0, 1.0),
    attributes: {
      position: {},
    },
  });

  const boundary = new Mesh(gl, {
    mode: gl.LINES,
    vertex: new Float32Array([
      -1 + px_x * 0.0,
      -1 + px_y * 0.0,
      -1 + px_x * 0.0,
      -1 + px_y * 2.0,
      1 - px_x * 0.0,
      -1 + px_y * 0.0,
      1 - px_x * 0.0,
      -1 + px_y * 2.0,
      -1 + px_x * 0.0,
      1 - px_y * 0.0,
      -1 + px_x * 0.0,
      1 - px_y * 2.0,
      1 - px_x * 0.0,
      1 - px_y * 0.0,
      1 - px_x * 0.0,
      1 - px_y * 2.0,
      -1 + px_x * 0.0,
      1 - px_y * 0.0,
      -1 + px_x * 2.0,
      1 - px_y * 0.0,
      -1 + px_x * 0.0,
      -1 + px_y * 0.0,
      -1 + px_x * 2.0,
      -1 + px_y * 0.0,
      1 - px_x * 0.0,
      1 - px_y * 0.0,
      1 - px_x * 2.0,
      1 - px_y * 0.0,
      1 - px_x * 0.0,
      -1 + px_y * 0.0,
      1 - px_x * 2.0,
      -1 + px_y * 0.0,
    ]),
    attributes: {
      position: {
        size: 2,
        stride: 16,
        offset: 0,
      },
      offset: {
        size: 2,
        stride: 16,
        offset: 8,
      },
    },
  });

  const velocityFBO0 = new FBO(gl, canvas.width, canvas.height, gl.FLOAT);
  const velocityFBO1 = new FBO(gl, canvas.width, canvas.height, gl.FLOAT);
  const divergenceFBO = new FBO(
    gl,
    canvas.width,
    canvas.height,
    gl.FLOAT,
    singleComponentFboFormat
  );
  const pressureFBO0 = new FBO(
    gl,
    canvas.width,
    canvas.height,
    gl.FLOAT,
    singleComponentFboFormat
  );
  const pressureFBO1 = new FBO(
    gl,
    canvas.width,
    canvas.height,
    gl.FLOAT,
    singleComponentFboFormat
  );

  // Clear all FBOs to zero to prevent garbage data
  [
    velocityFBO0,
    velocityFBO1,
    divergenceFBO,
    pressureFBO0,
    pressureFBO1,
  ].forEach((fbo) => {
    fbo.bind();
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    fbo.unbind();
  });

  const advectVelocityKernel = new ComputeKernel(gl, {
    shader: shaders.get("kernel", "advect"),
    mesh: inside,
    uniforms: {
      px: px,
      px1: px1,
      scale: options.damping,
      velocity: velocityFBO0,
      source: velocityFBO0,
      dt: options.step,
    },
    output: velocityFBO1,
  });

  const velocityBoundaryKernel = new ComputeKernel(gl, {
    shader: shaders.get("boundary", "advect"),
    mesh: boundary,
    uniforms: {
      px: px,
      scale: -1.0,
      velocity: velocityFBO1,
      source: velocityFBO1,
      dt: 1 / 120,
    },
    output: velocityFBO1,
  });

  const cursor = new Mesh(gl, {
    vertex: geometry.screen_quad(
      px_x * options.cursor_size * 2,
      px_y * options.cursor_size * 2
    ),
    attributes: {
      position: {},
    },
  });

  const addForceKernel = new ComputeKernel(gl, {
    shader: shaders.get("cursor", "addForce"),
    mesh: cursor,
    blend: "add",
    uniforms: {
      px: px,
      force: new Float32Array([0.5, 0.2]),
      center: new Float32Array([0.5, 0.4]),
      scale: new Float32Array([
        options.cursor_size * px_x,
        options.cursor_size * px_y,
      ]),
    },
    output: velocityFBO1,
  });

  const divergenceKernel = new ComputeKernel(gl, {
    shader: shaders.get("kernel", "divergence"),
    mesh: all,
    uniforms: {
      velocity: velocityFBO1,
      px: px,
      divergence_scale: options.divergence_scale,
    },
    output: divergenceFBO,
  });

  const jacobiKernel = new ComputeKernel(gl, {
    shader: shaders.get("kernel", "jacobi"),
    mesh: all,
    nounbind: true,
    uniforms: {
      pressure: pressureFBO0,
      divergence: divergenceFBO,
      alpha: -1,
      beta: 0.25,
      px: px,
    },
    output: pressureFBO1,
  });

  const pressureBoundaryKernel = new ComputeKernel(gl, {
    shader: shaders.get("boundary", "jacobi"),
    mesh: boundary,
    nounbind: true,
    nobind: true,
    uniforms: {
      pressure: pressureFBO0,
      divergence: divergenceFBO,
      alpha: -1.0,
      beta: 0.25,
      px: px,
    },
    output: pressureFBO1,
  });

  const subtractPressureGradientKernel = new ComputeKernel(gl, {
    shader: shaders.get("kernel", "subtractPressureGradient"),
    mesh: all,
    uniforms: {
      scale: 1.0,
      pressure: pressureFBO0,
      velocity: velocityFBO1,
      px: px,
    },
    output: velocityFBO0,
  });

  const subtractPressureGradientBoundaryKernel = new ComputeKernel(gl, {
    shader: shaders.get("boundary", "subtractPressureGradient"),
    mesh: boundary,
    uniforms: {
      scale: -1.0,
      pressure: pressureFBO0,
      velocity: velocityFBO1,
      px: px,
    },
    output: velocityFBO0,
  });

  const drawKernel = new ComputeKernel(gl, {
    shader: shaders.get("kernel", "visualize"),
    mesh: all,
    uniforms: {
      velocity: velocityFBO0,
      pressure: pressureFBO0,
      px: px,
      velocity_scale: options.velocity_scale,
      velocity_offset: options.velocity_offset,
      show_pressure: options.show_pressure ? 1.0 : 0.0,
      show_velocity: options.show_velocity ? 1.0 : 0.0,
    },
    output: null,
  });

  // Create text canvas and texture
  const textCanvas = createTextCanvas(canvas.width, canvas.height);
  const textTexture = new Texture2D(gl, textCanvas, {
    format: gl.RGBA,
    type: gl.UNSIGNED_BYTE,
    wrap_s: gl.CLAMP_TO_EDGE,
    min_filter: gl.LINEAR,
    wrap_t: gl.CLAMP_TO_EDGE,
    mag_filter: gl.LINEAR,
    mipmap: false,
  });

  // Create fluid play kernel that uses the fluid simulation with the text
  const fluidPlayKernel = new ComputeKernel(gl, {
    shader: shaders.get("kernel", "fluidPlay"),
    mesh: all,
    uniforms: {
      velocity: velocityFBO0,
      pressure: pressureFBO0,
      textTexture: textTexture,
      px: px,
      time: 0.0,
    },
    output: null,
  });

  let x0 = input.mouse.x;
  let y0 = input.mouse.y;

  clock.ontick = (dt) => {
    const x1 = input.mouse.x * options.resolution;
    const y1 = input.mouse.y * options.resolution;
    let xd = x1 - x0;
    let yd = y1 - y0;

    x0 = x1;
    y0 = y1;
    if (x0 === 0 && y0 === 0) xd = yd = 0;

    advectVelocityKernel.uniforms.dt = options.step * 1.0;
    advectVelocityKernel.uniforms.scale = options.damping;
    advectVelocityKernel.run();

    // Match original exactly
    addForceKernel.uniforms.force[0] =
      xd * px_x * options.cursor_size * options.mouse_force;
    addForceKernel.uniforms.force[1] =
      -yd * px_y * options.cursor_size * options.mouse_force;
    addForceKernel.uniforms.center[0] = x0 * px_x * 2.0 - 1.0;
    addForceKernel.uniforms.center[1] = (y0 * px_y * 2.0 - 1.0) * -1;

    addForceKernel.run();
    velocityBoundaryKernel.run();

    divergenceKernel.uniforms.divergence_scale = options.divergence_scale;
    divergenceKernel.run();

    let p0 = pressureFBO0;
    let p1 = pressureFBO1;
    let p_;

    for (let i = 0; i < options.iterations; i++) {
      jacobiKernel.uniforms.pressure = p0;
      jacobiKernel.outputFBO = p1;
      pressureBoundaryKernel.uniforms.pressure = p0;
      pressureBoundaryKernel.outputFBO = p1;
      jacobiKernel.run();
      pressureBoundaryKernel.run();
      p_ = p0;
      p0 = p1;
      p1 = p_;
    }

    subtractPressureGradientKernel.run();
    subtractPressureGradientBoundaryKernel.run();

    // Render based on selected mode
    if (options.render_mode === "fluidPlay") {
      // Update fluid play shader with time
      fluidPlayKernel.uniforms.time = clock.time * 0.001;
      fluidPlayKernel.run();
    } else {
      // Update visualization parameters for drawKernel
      drawKernel.uniforms.velocity_scale = options.velocity_scale;
      drawKernel.uniforms.velocity_offset = options.velocity_offset;
      drawKernel.uniforms.show_pressure = options.show_pressure ? 1.0 : 0.0;
      drawKernel.uniforms.show_velocity = options.show_velocity ? 1.0 : 0.0;
      drawKernel.run();
    }
  };
}

if (gl) {
  loader.load(
    [
      "shaders/advect.frag",
      "shaders/addForce.frag",
      "shaders/divergence.frag",
      "shaders/jacobi.frag",
      "shaders/subtractPressureGradient.frag",
      "shaders/visualize.frag",
      "shaders/fluidPlay.frag",
      "shaders/cursor.vertex",
      "shaders/boundary.vertex",
      "shaders/kernel.vertex",
    ],
    init
  );
} else {
  console.error("WebGL2 context not available!");
}
