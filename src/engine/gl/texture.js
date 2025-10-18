import { extend } from "../utils.js";

export class Texture2D {
  constructor(gl, data, options) {
    this.gl = gl;
    this.texture = gl.createTexture();
    this.unit = -1;
    this.bound = false;
    this.data = data;
    this.options = options;
    this.bindTexture();

    gl.pixelStorei(
      gl.UNPACK_FLIP_Y_WEBGL,
      options.flipY !== undefined ? options.flipY : true
    );
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);

    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      options.internalformat || options.format || gl.RGBA,
      options.format || gl.RGBA,
      options.type || gl.UNSIGNED_BYTE,
      data
    );

    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MAG_FILTER,
      options.mag_filter || gl.LINEAR
    );
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      options.min_filter || gl.LINEAR_MIPMAP_LINEAR
    );
    gl.texParameterf(
      gl.TEXTURE_2D,
      gl.TEXTURE_WRAP_S,
      options.wrap_s || gl.REPEAT
    );
    gl.texParameterf(
      gl.TEXTURE_2D,
      gl.TEXTURE_WRAP_T,
      options.wrap_t || gl.REPEAT
    );

    if (options.mipmap !== false) {
      gl.generateMipmap(gl.TEXTURE_2D);
    }
  }

  setFlipY(flipY) {
    this.bindTexture();
    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, flipY);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.options.internalformat || this.options.format || this.gl.RGBA,
      this.options.format || this.gl.RGBA,
      this.options.type || this.gl.UNSIGNED_BYTE,
      this.data
    );
    if (this.options.mipmap !== false) {
      this.gl.generateMipmap(this.gl.TEXTURE_2D);
    }
  }

  bindTexture(unit) {
    if (unit !== undefined) {
      this.gl.activeTexture(this.gl.TEXTURE0 + unit);
      this.unit = unit;
    }
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.bound = true;
  }

  unbindTexture() {
    this.gl.activeTexture(this.gl.TEXTURE0 + this.unit);
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    this.unit = -1;
    this.bound = false;
  }

  uniform(location) {
    this.gl.uniform1i(location, this.unit);
  }

  equals(value) {
    return this.unit === value;
  }

  set(obj, name) {
    obj[name] = this.unit;
  }
}

export class FBO {
  constructor(gl, width, height, type, format) {
    this.width = width;
    this.height = height;
    this.gl = gl;
    this.unit = -1;

    this.framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);

    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    // WebGL2: Use proper internal formats for float textures
    let internalFormat = format || gl.RGBA;
    let externalFormat = format || gl.RGBA;

    // Map WebGL1 formats to WebGL2 formats
    if (type === gl.FLOAT) {
      if (format === gl.LUMINANCE || format === gl.RED) {
        // Use R16F (0x822D) for better Safari compatibility
        internalFormat = 0x822d; // gl.R16F
        externalFormat = gl.RED;
      } else if (format === gl.RG) {
        internalFormat = 0x822f; // gl.RG16F
        externalFormat = gl.RG;
      } else {
        // Use RGBA16F (0x881A) for better compatibility on Safari
        internalFormat = 0x881a; // gl.RGBA16F
        externalFormat = gl.RGBA;
      }
    }

    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      internalFormat,
      width,
      height,
      0,
      externalFormat,
      type || gl.UNSIGNED_BYTE,
      null
    );

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Depth buffer (optional for compute shaders)
    this.depth = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.depth);
    gl.renderbufferStorage(
      gl.RENDERBUFFER,
      gl.DEPTH_COMPONENT16,
      width,
      height
    );

    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      this.texture,
      0
    );
    gl.framebufferRenderbuffer(
      gl.FRAMEBUFFER,
      gl.DEPTH_ATTACHMENT,
      gl.RENDERBUFFER,
      this.depth
    );

    this.supported =
      gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  bind() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
  }

  unbind() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }

  bindTexture(unit) {
    if (unit !== undefined) {
      this.gl.activeTexture(this.gl.TEXTURE0 + unit);
      this.unit = unit;
    }
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.bound = true;
  }

  unbindTexture() {
    this.gl.activeTexture(this.gl.TEXTURE0 + this.unit);
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    this.unit = -1;
    this.bound = false;
  }

  uniform(location) {
    this.gl.uniform1i(location, this.unit);
  }

  equals(value) {
    return this.unit === value;
  }

  set(obj, name) {
    obj[name] = this.unit;
  }
}
