// 流光模式 - 行内水平排列, 视差3D
(function(){
'use strict';
var U=window.ModeUtils;

window.ModeLiuguang={
  createLine:function(line,lyricsLayer){
    return U.createScatteredLine(line,lyricsLayer,{
      wrapClass:'liuguang-wrap',
      groupClass:'liuguang-group',
      xRange:8,
      yRange:6,
      rotateRange:4,
      scaleMin:1.0,
      scaleRange:0.1
    });
  }
};
})();
