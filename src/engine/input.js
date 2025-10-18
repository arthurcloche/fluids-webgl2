import { clamp } from "./utils.js";

// mapping keycodes to names
const keyname = {
  32: "SPACE",
  13: "ENTER",
  9: "TAB",
  8: "BACKSPACE",
  16: "SHIFT",
  17: "CTRL",
  18: "ALT",
  20: "CAPS_LOCK",
  144: "NUM_LOCK",
  145: "SCROLL_LOCK",
  37: "LEFT",
  38: "UP",
  39: "RIGHT",
  40: "DOWN",
  33: "PAGE_UP",
  34: "PAGE_DOWN",
  36: "HOME",
  35: "END",
  45: "INSERT",
  46: "DELETE",
  27: "ESCAPE",
  19: "PAUSE",
};

export class InputHandler {
  constructor(element) {
    this.offset = { x: 0, y: 0 };
    this.width = 0;
    this.height = 0;
    this.onClick = null;
    this.onKeyUp = null;
    this.onKeyDown = null;
    this.hasFocus = true;
    this.bind(element);
    this.reset();
  }

  bind(element) {
    this.element = element;
    this.updateOffset();

    document.addEventListener("keydown", (e) => {
      if (!this.keyDown(e.keyCode)) {
        e.preventDefault();
      }
    });

    document.addEventListener("keyup", (e) => {
      if (!this.keyUp(e.keyCode)) {
        e.preventDefault();
      }
    });

    window.addEventListener("click", (e) => {
      if (e.target !== element) {
        this.blur();
      } else {
        this.focus();
      }
    });

    window.addEventListener("blur", (e) => {
      this.blur();
    });

    document.addEventListener("mousemove", (e) => {
      this.mouseMove(e.pageX, e.pageY);
    });

    element.addEventListener("mousedown", (e) => {
      this.mouseDown();
    });

    element.addEventListener("mouseup", (e) => {
      this.mouseUp();
    });

    // prevent text selection
    document.addEventListener("selectstart", (e) => {
      if (this.hasFocus) e.preventDefault();
    });
  }

  updateOffset() {
    const offset = this.element.getBoundingClientRect();
    this.offset = { x: offset.left, y: offset.top };
    this.width = this.element.clientWidth || this.element.width;
    this.height = this.element.clientHeight || this.element.height;
  }

  blur() {
    this.hasFocus = false;
    this.reset();
  }

  focus() {
    if (!this.hasFocus) {
      this.hasFocus = true;
      this.reset();
    }
  }

  reset() {
    this.keys = {};
    for (let i = 65; i < 128; i++) {
      this.keys[String.fromCharCode(i)] = false;
    }
    for (const i in keyname) {
      if (keyname.hasOwnProperty(i)) {
        this.keys[keyname[i]] = false;
      }
    }
    this.mouse = { down: false, x: 0, y: 0 };
  }

  keyDown(key) {
    const name = this._getKeyName(key);
    const wasDown = this.keys[name];
    this.keys[name] = true;
    if (this.onKeyDown && !wasDown) {
      this.onKeyDown(name);
    }
    return this.hasFocus;
  }

  keyUp(key) {
    const name = this._getKeyName(key);
    this.keys[name] = false;
    if (this.onKeyUp) {
      this.onKeyUp(name);
    }
    return this.hasFocus;
  }

  mouseDown() {
    this.mouse.down = true;
  }

  mouseUp() {
    this.mouse.down = false;
    if (this.hasFocus && this.onClick) {
      this.onClick(this.mouse.x, this.mouse.y);
    }
  }

  mouseMove(x, y) {
    const newX = clamp(x - this.offset.x, 0, this.width);
    const newY = clamp(y - this.offset.y, 0, this.height);
    this.mouse.x = newX;
    this.mouse.y = newY;
  }

  _getKeyName(key) {
    if (key in keyname) {
      return keyname[key];
    }
    return String.fromCharCode(key);
  }
}
