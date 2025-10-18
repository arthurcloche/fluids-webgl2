export const extend = (...args) => {
  const target = args[0];
  for (let i = 1; i < args.length; i++) {
    const source = args[i];
    for (const name in source) {
      target[name] = source[name];
    }
  }
  return target;
};

export const debounce = (f, delay) => {
  let timeout;
  let this_;
  let arguments_;

  const run = () => {
    f.apply(this_, arguments_);
  };

  return function (...args) {
    this_ = this;
    arguments_ = args;
    clearTimeout(timeout);
    timeout = setTimeout(run, delay);
  };
};

export const clamp = (a, b, c) => {
  return a < b ? b : a > c ? c : a;
};

export const getHashValue = (name, default_) => {
  const match = window.location.hash.match("[#,]+" + name + "(=([^,]*))?");
  if (!match) {
    return default_;
  }
  return match.length === 3 && match[2] != null ? match[2] : true;
};
