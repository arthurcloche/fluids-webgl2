const keys = (o) => {
  const a = [];
  for (const name in o) {
    a.push(name);
  }
  return a;
};

export class Shader {
  constructor(gl, vertexSource, fragmentSource) {
    this.gl = gl;
    this.program = this.makeProgram(vertexSource, fragmentSource);
    this.uniformLocations = {};
    this.uniformValues = {};
    this.uniformNames = [];
    this.attributeLocations = {};
  }

  use() {
    this.gl.useProgram(this.program);
  }

  prepareUniforms(values) {
    this.uniformNames = keys(values);
    for (let i = 0; i < this.uniformNames.length; i++) {
      const name = this.uniformNames[i];
      this.uniformLocations[name] = this.gl.getUniformLocation(
        this.program,
        name
      );
    }
  }

  uniforms(values) {
    if (this.uniformNames.length === 0) {
      this.prepareUniforms(values);
    }

    for (let i = 0; i < this.uniformNames.length; i++) {
      const name = this.uniformNames[i];
      const location = this.uniformLocations[name];
      const value = values[name];

      if (location === null) continue;

      if (value.uniform) {
        if (!value.equals(this.uniformValues[name])) {
          value.uniform(location);
          value.set(this.uniformValues, name);
        }
      } else if (value.length) {
        let value2 = this.uniformValues[name];
        if (value2 !== undefined) {
          let j;
          for (j = 0; j < value.length; j++) {
            if (value[j] !== value2[j]) break;
          }
          if (j !== value.length) {
            for (j = 0; j < value.length; j++) {
              value2[j] = value[j];
            }
          }
        } else {
          this.uniformValues[name] = new Float32Array(value);
        }

        switch (value.length) {
          case 2:
            this.gl.uniform2fv(location, value);
            break;
          case 3:
            this.gl.uniform3fv(location, value);
            break;
          case 4:
            this.gl.uniform4fv(location, value);
            break;
          case 9:
            this.gl.uniformMatrix3fv(location, false, value);
            break;
          case 16:
            this.gl.uniformMatrix4fv(location, false, value);
            break;
        }
      } else {
        if (value !== this.uniformValues[name]) {
          this.gl.uniform1f(location, value);
          this.uniformValues[name] = value;
        }
      }
    }
  }

  getUniformLocation(name) {
    if (this.uniformLocations[name] === undefined) {
      this.uniformLocations[name] = this.gl.getUniformLocation(
        this.program,
        name
      );
    }
    return this.uniformLocations[name];
  }

  getAttribLocation(name) {
    if (!(name in this.attributeLocations)) {
      const location = this.gl.getAttribLocation(this.program, name);
      if (location < 0) {
        throw new Error("undefined attribute " + name);
      }
      this.attributeLocations[name] = location;
    }
    return this.attributeLocations[name];
  }

  makeShader(shaderType, source) {
    const shader = this.gl.createShader(shaderType);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.log(this.gl.getShaderInfoLog(shader), shaderType, source);
      throw new Error(
        'Compiler exception: "' + this.gl.getShaderInfoLog(shader) + '"'
      );
    }
    return shader;
  }

  makeProgram(vertexSource, fragmentSource) {
    const vertexShader = this.makeShader(this.gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.makeShader(
      this.gl.FRAGMENT_SHADER,
      fragmentSource
    );
    const program = this.gl.createProgram();

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      throw new Error(
        "Linker exception: " + this.gl.getProgramInfoLog(program)
      );
    }

    return program;
  }
}

export class ShaderManager {
  constructor(gl, resources, options = {}) {
    this.gl = gl;
    this.resources = resources;
    this.shaders = [];
    this.prefix = options.prefix || "shaders/";
    this.includeExpression = /#include "([^"]+)"/g;
  }

  preprocess(name, content) {
    return content.replace(this.includeExpression, (_, name) => {
      return this.getSource(name);
    });
  }

  getSource(name) {
    const content = this.resources[this.prefix + name];
    if (content == null) {
      throw new Error("shader not found: " + name);
    }
    return this.preprocess(name, content);
  }

  get(vertex, frag) {
    if (!frag) {
      frag = vertex;
    }
    frag += ".frag";
    vertex += ".vertex";
    const key = frag + ";" + vertex;
    if (!(key in this.shaders)) {
      this.shaders[key] = new Shader(
        this.gl,
        this.getSource(vertex),
        this.getSource(frag)
      );
    }
    return this.shaders[key];
  }
}
