// 云阶模式 - 散落布局, 字符组随机偏移旋转
(function(){
'use strict';
var U=window.ModeUtils;

window.ModeYunjie={
  createLine:function(line,lyricsLayer){
    var seed=line.time_ms/1000;
    var allChars=U.buildAllChars(line);
    var groups=U.groupChars(allChars,seed);

    var wrap=document.createElement('div');
    wrap.className='lyric-line-wrap';
    wrap.dataset.duration=line.duration_ms||2000;
    wrap.dataset.endtime=String(line.time_ms+(line.duration_ms||2000));

    for(var g=0;g<groups.length;g++){
      var group=groups[g];
      var gSeed=seed+g*10;
      var r1=U.seededRandom(gSeed+1);
      var r2=U.seededRandom(gSeed+2);
      var r3=U.seededRandom(gSeed+3);
      var r4=U.seededRandom(gSeed+4);
      var xOff=(r1-0.5)*200;
      var yOff=(r2-0.5)*60;
      var rotate=(r3-0.5)*12;
      var scale=1.0+r4*0.3;

      var groupEl=document.createElement('div');
      groupEl.className='word-group';
      groupEl.style.opacity='0';
      groupEl.dataset.x=xOff;
      groupEl.dataset.y=yOff;
      groupEl.dataset.rotate=rotate;
      groupEl.dataset.scale=scale;

      for(var ci=0;ci<group.length;ci++){
        var ch=group[ci];
        if(U.isEngWord(ch.text)){
          groupEl.appendChild(U.createEngEl(ch));
        }else{
          var charEl=U.createCharEl(ch);
          if(U.isNonEng(ch.text)){
            var ring=document.createElement('span');
            ring.className='word-ring';
            charEl.appendChild(ring);
            charEl._ring=ring;
          }
          groupEl.appendChild(charEl);
        }
      }

      var deco=document.createElement('span');
      deco.className='word-deco';
      deco.dataset.dir=r1>0.5?'rtl':'ltr';
      groupEl.appendChild(deco);
      wrap.appendChild(groupEl);
    }
    lyricsLayer.appendChild(wrap);
    U.markSpinChars(wrap);
    return wrap;
  }
};
})();
