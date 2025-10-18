export class ComputeKernel {
  constructor(gl, options) {
    this.gl = gl;
    this.shader = options.shader;
    this.mesh = options.mesh;
    this.uniforms = options.uniforms;
    this.outputFBO = options.output;
    this.blend = options.blend;
    this.nobind = options.nobind;
    this.nounbind = options.nounbind;
  }

  run() {
    if (this.outputFBO && !this.nobind) {
      this.outputFBO.bind();
    }

    let textureUnit = 0;
    for (const name in this.uniforms) {
      if (this.uniforms.hasOwnProperty(name)) {
        const value = this.uniforms[name];
        if (value.bindTexture && !value.bound) {
          value.bindTexture(textureUnit++);
        }
      }
    }

    this.shader.use();
    this.shader.uniforms(this.uniforms);

    if (this.blend === "add") {
      // Check if blending with float attachments is supported
      const ext = this.gl.getExtension("EXT_float_blend");
      if (ext && this.outputFBO) {
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE);
        this.gl.enable(this.gl.BLEND);
      } else {
        // Fallback: disable blending if not supported
        this.gl.disable(this.gl.BLEND);
        if (!ext && !this._warnedBlend) {
          console.warn("Float blending not supported, force addition disabled");
          this._warnedBlend = true;
        }
      }
    } else {
      this.gl.disable(this.gl.BLEND);
    }

    this.mesh.draw(this.shader);

    if (this.outputFBO && !this.nounbind) {
      this.outputFBO.unbind();
    }

    for (const name in this.uniforms) {
      if (this.uniforms.hasOwnProperty(name)) {
        const value = this.uniforms[name];
        if (value.bindTexture && value.bound) {
          value.unbindTexture();
        }
      }
    }
  }
}
