import karas from 'karas';
import { version } from '../package.json';

const { mode, ca, util, inject, animate: { frame } } = karas;

const RootList = [];

class Root extends karas.Root {
  appendTo(dom) {
    RootList.push(this);
    this.__dom = dom;
    this.__isDestroyed = false;
    this.__initProps();
    let tagName = this.tagName;
    let params = Object.assign({}, ca, this.props.contextAttributes);
    if(tagName === 'canvas') {
      this.__ctx = dom.getContext('2d');
      this.__renderMode = mode.CANVAS;
    }
    else if(tagName === 'webgl') {
      // 优先手动指定，再自动判断，最后兜底
      let gl, webgl2 = this.props.webgl2;
      if(!util.isNil(webgl2)) {
        if(webgl2) {
          gl = dom.getContext('webgl2', params);
        }
        if(!gl) {
          gl = dom.getContext('webgl', params);
        }
        this.__ctx = gl;
      }
      else {
        gl = this.__ctx = dom.getContext('webgl2', params)
          || dom.getContext('webgl', params);
      }
      this.__initShader(gl);
      this.__renderMode = mode.WEBGL;
    }
    this.draw(true);
    if(this.__dom.__root && this.__dom.__root instanceof Root) {
      this.__dom.__root.destroy();
    }
    this.__dom.__root = this;
    frame.removeRoot(this);
    frame.addRoot(this);
  }

  destroy() {
    super.destroy();
    let i = RootList.indexOf(this);
    if(i > -1) {
      RootList.splice(i, 1);
    }
  }
}

// Root引用指过来
let createVd = karas.createVd;
karas.createVd = function(tagName, props, children) {
  if(['canvas', 'svg', 'webgl'].indexOf(tagName) > -1) {
    return new Root(tagName, props, children);
  }
  return createVd(tagName, props, children);
};

if(typeof requestAnimationFrame === 'undefined') {
  inject.requestAnimationFrame = function(cb) {
    if(!cb || !RootList[0]) {
      return;
    }
    return RootList[0].__dom.requestAnimationFrame(cb);
  };

  inject.cancelAnimationFrame = function(id) {
    if(!RootList[0]) {
      return;
    }
    return RootList[0].__dom.cancelAnimationFrame(id);
  };
}

const IMG = inject.IMG;
const INIT = inject.INIT;
const LOADING = inject.LOADING;
const LOADED = inject.LOADED;
const FONT = inject.FONT;

inject.measureImg = function(url, cb) {
  if(!RootList.length && !wx.createImage) {
    return;
  }
  if(Array.isArray(url)) {
    if(!url.length) {
      return cb && cb();
    }
    let count = 0;
    let len = url.length;
    let list = [];
    url.forEach((item, i) => {
      inject.measureImg(item, function(cache) {
        list[i] = cache;
        if(++count === len) {
          cb && cb(list);
        }
      });
    });
    return;
  }
  else if(!url || !util.isString(url)) {
    inject.error('Measure img invalid: ' + url);
    cb && cb({
      state: LOADED,
      success: false,
      url,
    });
    return;
  }
  let cache = IMG[url] = IMG[url] || {
    state: INIT,
    task: [],
  };
  if(cache.state === LOADED) {
    cb && cb(cache);
  }
  else if(cache.state === LOADING) {
    cb && cache.task.push(cb);
  }
  else {
    cache.state = LOADING;
    cb && cache.task.push(cb);
    let img;
    if(wx.createImage) {
      img = wx.createImage();
    }
    else {
      img = RootList[0].__dom.createImage();
    }
    img.onload = function() {
      cache.state = LOADED;
      cache.success = true;
      cache.width = img.width;
      cache.height = img.height;
      cache.source = img;
      cache.url = url;
      let list = cache.task.splice(0);
      list.forEach(cb => cb(cache));
    };
    img.onerror = function(e) {
      cache.state = LOADED;
      cache.success = false;
      cache.url = url;
      let list = cache.task.splice(0);
      list.forEach(cb => cb(cache));
    };
    img.src = url;
  }
};

inject.isDom = function(o) {
  return o && (o.tagName || o.createImage);
}

const CANVAS = {};

function offscreenCanvas(key, width, height, message, contextAttributes) {
  let o;
  if(!key) {
    o = wx.createOffscreenCanvas ? wx.createOffscreenCanvas({ type: '2d', width, height }) : wx.createCanvas();
  }
  else if(!CANVAS[key]) {
    o = CANVAS[key] = wx.createOffscreenCanvas ? wx.createOffscreenCanvas({ type: '2d', width, height }) : wx.createCanvas();
  }
  else {
    o = CANVAS[key];
  }
  if(!wx.createOffscreenCanvas) {
    o.width = width;
    o.height = height;
  }
  let ctx = o.getContext('2d', contextAttributes);
  if(!ctx) {
    inject.error('Total canvas memory use exceeds the maximum limit');
  }
  return {
    canvas: o,
    ctx,
    available: true,
    release() {
      ctx.globalAlpha = 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, width, height);
      this.available = false;
    },
  };
}

inject.hasOffscreenCanvas = function(key) {
  return key && CANVAS.hasOwnProperty(key);
};

inject.getOffscreenCanvas = function(width, height, key, message, contextAttributes) {
  return offscreenCanvas(key, width, height, message, contextAttributes);
};

inject.loadFont = function(fontFamily, url, cb) {
  if(!wx.loadFontFace) {
    return;
  }
  if(util.isFunction(url)) {
    cb = url;
    url = fontFamily;
  }
  if(Array.isArray(url)) {
    if(!url.length) {
      return cb();
    }
    let count = 0;
    let len = url.length;
    let list = [];
    url.forEach((item, i) => {
      inject.loadFont(item.fontFamily, item.url, function(cache) {
        list[i] = cache;
        if(++count === len) {
          cb(list);
        }
      });
    });
    return;
  }
  else if(!url || !util.isString(url)) {
    inject.error('Load font invalid: ' + url);
    cb && cb({
      state: LOADED,
      success: false,
      url,
    });
    return;
  }
  if(!fontFamily) {
    fontFamily = url;
  }
  let cache = FONT[url] = FONT[url] || {
    state: INIT,
    task: [],
  };
  if(cache.state === LOADED) {
    cb && cb(cache);
  }
  else if(cache.state === LOADING) {
    cb && cache.task.push(cb);
  }
  else {
    cache.state = LOADING;
    cb && cache.task.push(cb);
    if(url instanceof ArrayBuffer) {
      success(url);
    }
    else {
      wx.loadFontFace({
        family: fontFamily,
        source: `url("${url}")`,
        success,
        fail: error,
      });
    }
    function success() {
      cache.state = LOADED;
      cache.success = true;
      cache.url = url;
      let list = cache.task.splice(0);
      list.forEach(cb => cb(cache, ab));
    }
    function error() {
      cache.state = LOADED;
      cache.success = false;
      cache.url = url;
      let list = cache.task.splice(0);
      list.forEach(cb => cb(cache));
    }
  }
}

karas.wxVersion = version;

export default karas;
