// 云阶模式 - 散落布局, 字符组随机偏移旋转
(function(){
'use strict';
var U=window.ModeUtils;

window.ModeYunjie={
  createLine:function(line,lyricsLayer){
    return U.createScatteredLine(line,lyricsLayer,{
      wrapClass:'',
      groupClass:'',
      xRange:200,
      yRange:60,
      rotateRange:12,
      scaleMin:1.0,
      scaleRange:0.3
    });
  }
};
})();
