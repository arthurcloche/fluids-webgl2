# WebGL Fluid Simulation

A GPU-based fluid simulation using WebGL 2 and the Navier-Stokes equations for incompressible flow.

Originally created in 2012, modernized to ES6 modules and WebGL 2 in 2025.

## Running

```bash
make serve
# Open http://localhost:8080
```

Or:
```bash
python3 -m http.server 8080
```

## Requirements

Modern browser with WebGL 2 support:
- Chrome 56+ | Firefox 51+ | Safari 15+ | Edge 79+

## Controls

- **Mouse**: Move over canvas to create fluid motion
- **GUI** (top-right): Adjust simulation parameters
  - iterations: Pressure solver accuracy
  - mouse_force: Interaction strength
  - cursor_size: Interaction area size
  - damping: Energy dissipation (1.0 = none, 0.95 = high)
  - resolution: Simulation detail
  - step: Time step size

## Technical Details

**Modernization:**
- AMD modules → ES6 modules
- WebGL 1 → WebGL 2
- GLSL 100 → GLSL 300 ES
- dat.GUI → lil-gui
- No build step required

**Algorithm:**
1. Advection with damping
2. Force application from mouse
3. Velocity boundary conditions
4. Divergence calculation
5. Pressure solve (Jacobi iteration)
6. Gradient subtraction (make divergence-free)
7. Visualization

All computation happens on the GPU using framebuffer objects and fragment shaders.

## Project Structure

```
├── index.html          # Entry point
├── style.css           # Styles
├── shaders/            # GLSL 300 ES shaders
└── src/
    ├── main.js         # Simulation setup
    ├── compute.js      # Compute kernel wrapper
    └── engine/
        ├── clock.js    # Animation loop
        ├── input.js    # Mouse/keyboard
        ├── loader.js   # Resource loader
        ├── utils.js    # Utilities
        └── gl/         # WebGL utilities
```

## License

This code is not released under an open source license.
You are free to look at it and learn from it but you can't use it for your own projects.

Original: https://29a.ch/sandbox/2012/fluidwebgl/
