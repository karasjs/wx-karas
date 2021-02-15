import karas from 'karas';
import { version } from '../package.json';

karas.inject.requestAnimationFrame = function(cb) {
  setTimeout(cb, 1000 / 60);
};

class Root extends karas.Root {
  appendTo(dom) {
    this.__dom = dom;
    this.__children = karas.builder.initRoot(this.__cd, this);
    this.__initProps();
    this.__root = this;
    this.cache = !!this.props.cache;
    this.__refreshLevel = karas.refresh.level.REFLOW;
    this.__ctx = dom.getContext('2d');
    this.__renderMode = karas.mode.CANVAS;
    this.__defs = {
      clear() {},
    };
    this.refresh(null, true);
  }
}

// Root引用指过来
let createVd = karas.createVd;
karas.createVd = function(tagName, props, children) {
  if(['canvas', 'svg'].indexOf(tagName) > -1) {
    return new Root(tagName, props, children);
  }
  return createVd(tagName, props, children);
};

const IMG = karas.inject.IMG;
const INIT = karas.inject.INIT;
const LOADING = karas.inject.LOADING;
const LOADED = karas.inject.LOADED;

karas.inject.measureImg = function(url, cb, optinos = {}) {
  let { root: { dom, ctx } } = optinos;
  let cache = IMG[url] = IMG[url] || {
    state: INIT,
    task: [],
  };
  if(cache.state === LOADED) {
    cb(cache);
  }
  else if(cache.state === LOADING) {
    cache.task.push(cb);
  }
  else {
    cache.state = LOADING;
    cache.task.push(cb);
    let img = dom.createImage();
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
    img.onerror = function() {
      cache.state = LOADED;
      cache.success = false;
      cache.url = url;
      let list = cache.task.splice(0);
      list.forEach(cb => cb(cache));
    }
    img.src = url;
  }
};

karas.inject.isDom = function(o) {
  return o && karas.util.isFunction(o.createImage);
}

const CANVAS = {};
const CANVAS_LIST = [];
const WEBGL_LIST = [];

function cache(key, width, height, hash, message) {
  let o;
  if(!key) {
    let target = hash === CANVAS ? CANVAS_LIST : WEBGL_LIST;
    if(target.length) {
      o = target.pop();
    }
    else {
      o = wx.createOffscreenCanvas(width, height);
    }
  }
  else if(!hash[key]) {
    o = hash[key] = wx.createOffscreenCanvas(width, height);
  }
  else {
    o = hash[key];
  }
  o.width = width;
  o.height = height;
  return {
    canvas: o,
    ctx: hash === CANVAS ? o.getContext('2d')
      : (o.getContext('webgl') || o.getContext('experimental-webgl')),
    draw() {
      // 空函数，仅对小程序提供hook特殊处理，flush缓冲
    },
    available: true,
    release() {
      if(hash === CANVAS) {
        CANVAS_LIST.push(this.canvas);
      }
      else {
        WEBGL_LIST.push(this.canvas);
      }
      this.canvas = null;
      this.ctx = null;
    },
  };
}

function cacheCanvas(key, width, height, message) {
  return cache(key, width, height, CANVAS, message);
}

karas.inject.hasCacheCanvas = function(key) {
  return key && CANVAS.hasOwnProperty(key);
};

karas.inject.getCacheCanvas = function(width, height, key, message) {
  return cacheCanvas(key, width, height, message);
};

karas.inject.releaseCacheCanvas = function(o) {
  CANVAS_LIST.push(o);
};

karas.inject.delCacheCanvas = function(key) {
  key && delete CANVAS[key];
};

karas.wxVersion = version;

export default karas;
