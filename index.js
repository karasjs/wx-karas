(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('karas')) :
  typeof define === 'function' && define.amd ? define(['karas'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.karas = factory(global.karas));
})(this, (function (karas) { 'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  var karas__default = /*#__PURE__*/_interopDefaultLegacy(karas);

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }
  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", {
      writable: false
    });
    return Constructor;
  }
  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function");
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true
      }
    });
    Object.defineProperty(subClass, "prototype", {
      writable: false
    });
    if (superClass) _setPrototypeOf(subClass, superClass);
  }
  function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) {
      return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _getPrototypeOf(o);
  }
  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };
    return _setPrototypeOf(o, p);
  }
  function _superPropBase(object, property) {
    while (!Object.prototype.hasOwnProperty.call(object, property)) {
      object = _getPrototypeOf(object);
      if (object === null) break;
    }
    return object;
  }
  function _get() {
    if (typeof Reflect !== "undefined" && Reflect.get) {
      _get = Reflect.get.bind();
    } else {
      _get = function _get(target, property, receiver) {
        var base = _superPropBase(target, property);
        if (!base) return;
        var desc = Object.getOwnPropertyDescriptor(base, property);
        if (desc.get) {
          return desc.get.call(arguments.length < 3 ? target : receiver);
        }
        return desc.value;
      };
    }
    return _get.apply(this, arguments);
  }

  var version = "0.81.1";

  var mode = karas__default["default"].mode,
    ca = karas__default["default"].ca,
    util = karas__default["default"].util,
    inject = karas__default["default"].inject;
  var RootList = [];
  var Root = /*#__PURE__*/function (_karas$Root) {
    _inherits(Root, _karas$Root);
    function Root() {
      return _karas$Root.apply(this, arguments) || this;
    }
    _createClass(Root, [{
      key: "appendTo",
      value: function appendTo(dom) {
        RootList.push(this);
        this.__dom = dom;
        this.__isDestroyed = false;
        this.__initProps();
        var tagName = this.tagName;
        var params = Object.assign({}, ca, this.props.contextAttributes);
        if (tagName === 'canvas') {
          this.__ctx = dom.getContext('2d');
          this.__renderMode = mode.CANVAS;
        } else if (tagName === 'webgl') {
          // 优先手动指定，再自动判断，最后兜底
          var gl,
            webgl2 = this.props.webgl2;
          if (!util.isNil(webgl2)) {
            if (webgl2) {
              gl = dom.getContext('webgl2', params);
            }
            if (!gl) {
              gl = dom.getContext('webgl', params);
            }
            this.__ctx = gl;
          } else {
            gl = this.__ctx = dom.getContext('webgl2', params) || dom.getContext('webgl', params);
          }
          this.__initShader(gl);
          this.__renderMode = mode.WEBGL;
        }
        this.draw(true);
        if (this.__dom.__root && this.__dom.__root instanceof Root) {
          this.__dom.__root.destroy();
        }
        this.__dom.__root = this;
      }
    }, {
      key: "destroy",
      value: function destroy() {
        _get(_getPrototypeOf(Root.prototype), "destroy", this).call(this);
        var i = RootList.indexOf(this);
        if (i > -1) {
          RootList.splice(i, 1);
        }
      }
    }]);
    return Root;
  }(karas__default["default"].Root); // Root引用指过来
  var createVd = karas__default["default"].createVd;
  karas__default["default"].createVd = function (tagName, props, children) {
    if (['canvas', 'svg', 'webgl'].indexOf(tagName) > -1) {
      return new Root(tagName, props, children);
    }
    return createVd(tagName, props, children);
  };
  if (typeof requestAnimationFrame === 'undefined') {
    inject.requestAnimationFrame = function (cb) {
      if (!cb || !RootList[0]) {
        return;
      }
      return RootList[0].__dom.requestAnimationFrame(cb);
    };
    inject.cancelAnimationFrame = function (id) {
      if (!RootList[0]) {
        return;
      }
      return RootList[0].__dom.cancelAnimationFrame(id);
    };
  }
  var IMG = inject.IMG;
  var INIT = inject.INIT;
  var LOADING = inject.LOADING;
  var LOADED = inject.LOADED;
  var FONT = inject.FONT;
  inject.measureImg = function (url, cb) {
    if (!RootList.length && !wx.createImage) {
      return;
    }
    if (Array.isArray(url)) {
      if (!url.length) {
        return cb && cb();
      }
      var count = 0;
      var len = url.length;
      var list = [];
      url.forEach(function (item, i) {
        inject.measureImg(item, function (cache) {
          list[i] = cache;
          if (++count === len) {
            cb && cb(list);
          }
        });
      });
      return;
    } else if (!url || !util.isString(url)) {
      inject.error('Measure img invalid: ' + url);
      cb && cb({
        state: LOADED,
        success: false,
        url: url
      });
      return;
    }
    var cache = IMG[url] = IMG[url] || {
      state: INIT,
      task: []
    };
    if (cache.state === LOADED) {
      cb && cb(cache);
    } else if (cache.state === LOADING) {
      cb && cache.task.push(cb);
    } else {
      cache.state = LOADING;
      cb && cache.task.push(cb);
      var img;
      if (wx.createImage) {
        img = wx.createImage();
      } else {
        img = RootList[0].__dom.createImage();
      }
      img.onload = function () {
        cache.state = LOADED;
        cache.success = true;
        cache.width = img.width;
        cache.height = img.height;
        cache.source = img;
        cache.url = url;
        var list = cache.task.splice(0);
        list.forEach(function (cb) {
          return cb(cache);
        });
      };
      img.onerror = function (e) {
        cache.state = LOADED;
        cache.success = false;
        cache.url = url;
        var list = cache.task.splice(0);
        list.forEach(function (cb) {
          return cb(cache);
        });
      };
      img.src = url;
    }
  };
  inject.isDom = function (o) {
    return o && (o.tagName || o.createImage);
  };
  var CANVAS = {};
  function offscreenCanvas(key, width, height, message) {
    var o;
    if (!key) {
      o = wx.createOffscreenCanvas ? wx.createOffscreenCanvas({
        type: '2d',
        width: width,
        height: height
      }) : wx.createCanvas();
    } else if (!CANVAS[key]) {
      o = CANVAS[key] = wx.createOffscreenCanvas ? wx.createOffscreenCanvas({
        type: '2d',
        width: width,
        height: height
      }) : wx.createCanvas();
    } else {
      o = CANVAS[key];
    }
    if (!wx.createOffscreenCanvas) {
      o.width = width;
      o.height = height;
    }
    var ctx = o.getContext('2d');
    return {
      canvas: o,
      ctx: ctx,
      available: true,
      release: function release() {
        ctx.globalAlpha = 1;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, width, height);
        this.available = false;
      }
    };
  }
  inject.hasOffscreenCanvas = function (key) {
    return key && CANVAS.hasOwnProperty(key);
  };
  inject.getOffscreenCanvas = function (width, height, key, message) {
    return offscreenCanvas(key, width, height);
  };
  inject.loadFont = function (fontFamily, url, cb) {
    if (!wx.loadFontFace) {
      return;
    }
    if (util.isFunction(url)) {
      cb = url;
      url = fontFamily;
    }
    if (Array.isArray(url)) {
      if (!url.length) {
        return cb();
      }
      var count = 0;
      var len = url.length;
      var list = [];
      url.forEach(function (item, i) {
        inject.loadFont(item.fontFamily, item.url, function (cache) {
          list[i] = cache;
          if (++count === len) {
            cb(list);
          }
        });
      });
      return;
    } else if (!url || !util.isString(url)) {
      inject.error('Load font invalid: ' + url);
      cb && cb({
        state: LOADED,
        success: false,
        url: url
      });
      return;
    }
    if (!fontFamily) {
      fontFamily = url;
    }
    var cache = FONT[url] = FONT[url] || {
      state: INIT,
      task: []
    };
    if (cache.state === LOADED) {
      cb && cb(cache);
    } else if (cache.state === LOADING) {
      cb && cache.task.push(cb);
    } else {
      var success = function success() {
        cache.state = LOADED;
        cache.success = true;
        cache.url = url;
        var list = cache.task.splice(0);
        list.forEach(function (cb) {
          return cb(cache, ab);
        });
      };
      var error = function error() {
        cache.state = LOADED;
        cache.success = false;
        cache.url = url;
        var list = cache.task.splice(0);
        list.forEach(function (cb) {
          return cb(cache);
        });
      };
      cache.state = LOADING;
      cb && cache.task.push(cb);
      if (url instanceof ArrayBuffer) {
        success(url);
      } else {
        wx.loadFontFace({
          family: fontFamily,
          source: "url(\"".concat(url, "\")"),
          success: success,
          fail: error
        });
      }
    }
  };
  karas__default["default"].wxVersion = version;

  return karas__default["default"];

}));
//# sourceMappingURL=index.js.map
