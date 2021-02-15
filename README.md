# wx-karas
A karas runtime on Weixin.

[![NPM version](https://img.shields.io/npm/v/wx-karas.svg)](https://npmjs.org/package/wx-karas)

## INSTALL
```
npm install wx-karas
```

## Demo
```jsx
import karas from 'wx-karas';

Page({
  onLoad() {
    const query = wx.createSelectorQuery()
    query.select('#canvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        const canvas = res[0].node;
        karas.parse(
          {
            tagName: 'canvas',
            props: {
              width: 360,
              height: 360,
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
