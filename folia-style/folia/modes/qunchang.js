// 群唱模式 - 简洁文字显示
(function(){
'use strict';
window.ModeQunchang={
  createLine:function(line,lyricsLayer){
    var wrap=document.createElement('div');
    wrap.className='lyric-line-wrap lyric-simple';
    wrap.dataset.duration=line.duration_ms||2000;
    wrap.dataset.endtime=String(line.time_ms+(line.duration_ms||2000));
    var el=document.createElement('div');
    el.className='lyric-simple-text';
    el.textContent=line.text||'';
    wrap.appendChild(el);
    lyricsLayer.appendChild(wrap);
    return wrap;
  }
};
})();
