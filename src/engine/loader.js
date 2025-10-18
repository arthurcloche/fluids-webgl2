export class Loader {
  constructor(root) {
    this.root = root || "";
    this.resources = {};
  }

  load(resources, ready, error, progress) {
    let pending = 0;
    let total = 0;
    let failed = 0;

    const success_ = (src, data) => {
      this.resources[src] = data;
      pending--;
      if (pending === 0) {
        if (ready) {
          ready(this);
        }
      } else if (progress) {
        progress(total, pending, failed);
      }
    };

    const error_ = (src, e) => {
      pending--;
      failed++;
      this.resources[src] = null;
      e.src = src;
      if (error) {
        error(this, e);
      }
    };

    for (let i = 0; i < resources.length; i++) {
      const resource = resources[i];
      // allows loading in multiple stages
      if (resource in this.resources) {
        continue;
      }
      pending++;
      total++;
      if (/\.(jpe?g|gif|png)$/.test(resource)) {
        this._loadImage(resource, success_, error_);
      } else if (/\.(og(g|a)|mp3)$/.test(resource)) {
        this._loadAudio(resource, success_, error_);
      } else if (/\.json$/.test(resource)) {
        this._loadJSON(resource, success_, error_);
      } else if (/\.(bin|raw)/.test(resource)) {
        this._loadBin(resource, success_, error_);
      } else {
        this._loadData(resource, success_, error_);
      }
    }

    if (pending === 0 && ready) {
      // always call AFTER the mainloop
      window.setTimeout(() => {
        ready(this);
      }, 1);
    } else {
      if (progress) {
        progress(total, pending, failed);
      }
    }
  }

  _loadImage(src, success, error) {
    const img = document.createElement("img");
    img.onload = () => {
      success(src, img);
    };
    img.onerror = (e) => {
      error(src, e);
    };
    img.src = this.root + src;
  }

  _loadJSON(src, success, error) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", src, true);
    xhr.onload = function () {
      try {
        const data = JSON.parse(this.response);
        success(src, data);
      } catch (ex) {
        error(src, ex);
      }
    };
    xhr.onerror = (err) => {
      error(src, err);
    };
    xhr.send();
  }

  _loadBin(src, success, error) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", src, true);
    xhr.responseType = "arraybuffer";
    xhr.onload = function () {
      success(src, this.response);
    };
    xhr.onerror = (err) => {
      error(src, err);
    };
    xhr.send();
  }

  _loadData(src, success, error) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", src, true);
    xhr.onload = function () {
      success(src, this.response);
    };
    xhr.onerror = (err) => {
      error(src, err);
    };
    xhr.send();
  }
}
