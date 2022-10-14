# wx-karas
A karas runtime on Weixin.

[![NPM version](https://img.shields.io/npm/v/wx-karas.svg)](https://npmjs.org/package/wx-karas)

## INSTALL
```
npm install karas
npm install wx-karas
```
需微信基础库2.16.1以上版本。

## Demo
```jsx
// 小程序
import 'karas';
import karas from 'wx-karas';

Page({
  onLoad() {
    const query = wx.createSelectorQuery()
    query.select('#canvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        const canvas = res[0].node;
        // Canvas 画布的实际绘制宽高
        const width = res[0].width;
        const height = res[0].height;
        const dpr = wx.getWindowInfo().pixelRatio;
        width *= dpr;
        height *= dpr;
        canvas.width = width;
        canvas.height = height;
        
        karas.parse(
          {
            tagName: 'canvas',
            props: {
              width: width,
              height: height,
            },
            children: [
              'Hello world'
            ]
          },
          canvas
        );
      });
  }
});
```
```jsx
// 小游戏
import 'karas';
import karas from 'wx-karas';

const canvas = wx.createCanvas();
let width = canvas.width;
let height = canvas.height;
width *= 2;
height *= 2;
canvas.width = width;
canvas.height = height;

karas.parse(
  {
    tagName: 'canvas',
    props: {
      width: width,
      height: height,
    },
    children: [
      'Hello world'
    ]
  },
  canvas
);
```
