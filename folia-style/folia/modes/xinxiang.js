// 心象模式 - 爱心曲线排布, 碰撞回避, 英雄词
(function(){
'use strict';
var U=window.ModeUtils;

function heartX(t){return 16*Math.pow(Math.sin(t),3)}
function heartY(t){return 13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t)}

window.ModeXinxiang={
  createLine:function(line,lyricsLayer){
    var seed=line.time_ms/1000;
    var allChars=U.buildAllChars(line);
    // 心象: 每个字符单独一组
    var groups=[];
    for(var ci=0;ci<allChars.length;ci++) groups.push([allChars[ci]]);

    var wrap=document.createElement('div');
    wrap.className='lyric-line-wrap xinxiang-wrap';
    wrap.dataset.duration=line.duration_ms||2000;
    wrap.dataset.endtime=String(line.time_ms+(line.duration_ms||2000));

    var fullText=allChars.map(function(c){return c.text}).join('');
    var vw=Math.min(window.innerWidth,1200);
    var xinxiangFontPx=U.chooseFontPx(vw,fullText)*1.12;
    var heroIdx=U.pickHeroWord(allChars,fullText);
    var hasCJK=allChars.some(function(c){return U.isCJK(c.text)});
    var lineHeight=Math.round(xinxiangFontPx*(hasCJK?1.22:1.1));
    var viewportW=Math.min(window.innerWidth*0.7,800);
    var viewportH=Math.min(window.innerHeight*0.65,600);

    var preferred=[];
    var totalChars=groups.length;
    for(var g=0;g<totalChars;g++){
      var t=(g/totalChars)*Math.PI*2;
      preferred.push({x:heartX(t)/16*(viewportW/2),y:-heartY(t)/17*(viewportH/2)});
    }

    var cs=U.createCollisionSystem(lineHeight);
    var heroMetrics=heroIdx>=0?{centerX:preferred[heroIdx].x,centerY:preferred[heroIdx].y,width:xinxiangFontPx*1.46*0.6}:null;

    var order=[];for(var g=0;g<totalChars;g++)order.push(g);
    order.sort(function(a,b){return(b===heroIdx?1:0)-(a===heroIdx?1:0)});

    var finalPositions=[];
    var bounds={minX:-viewportW/2-72,maxX:viewportW/2+72,minY:-viewportH/2,maxY:viewportH/2};
    for(var oi=0;oi<order.length;oi++){
      var idx=order[oi];
      var px=preferred[idx].x,py=preferred[idx].y;
      var isHero=(idx===heroIdx);
      var emphasis=isHero?1.46:1.0;
      var emScale=emphasis;
      var cw=xinxiangFontPx*emScale*0.6*(isHero?1.48:1.26);
      var ch=xinxiangFontPx*emScale*0.95*(isHero?1.36:1.24);
      var pad=isHero?16:8;

      if(!isHero&&heroMetrics){
        var rep=U.repelFromHero(px,py,cw,heroMetrics,pad);
        px=rep.x;py=rep.y;
      }

      var res=U.ellipticalSearch(px,py,cw,ch,pad,bounds,cs,emphasis,xinxiangFontPx,lineHeight);
      cs.pushRect(res.x,res.y,cw,ch,pad);

      var outX=res.x+cw/2,outY=res.y-ch*0.46;
      var outLen=Math.max(Math.hypot(outX,outY),1);
      var driftX=(outX/outLen)*(5+U.seededRandom(idx*7)*6);
      var driftY=(outY/outLen)*0.72*(5+U.seededRandom(idx*8)*6);

      finalPositions[idx]={x:res.x,y:res.y,scale:emphasis,driftX:driftX,driftY:driftY,rotate:(U.seededRandom(idx*3)-0.5)*12};
    }

    for(var g=0;g<groups.length;g++){
      var group=groups[g];
      var fp=finalPositions[g];
      var groupEl=document.createElement('div');
      groupEl.className='word-group xinxiang-group';
      groupEl.style.opacity='0';
      groupEl.dataset.x=fp.x;
      groupEl.dataset.y=fp.y;
      groupEl.dataset.rotate=fp.rotate;
      groupEl.dataset.scale=fp.scale;
      groupEl.dataset.fontPx=xinxiangFontPx;
      groupEl.dataset.isHero=(g===heroIdx)?'1':'0';
      groupEl.dataset.driftX=fp.driftX;
      groupEl.dataset.driftY=fp.driftY;
      groupEl.dataset.passedRotate=fp.rotate;

      for(var ci=0;ci<group.length;ci++){
        var ch=group[ci];
        if(U.isEngWord(ch.text)){
          groupEl.appendChild(U.createEngEl(ch));
        }else{
          var charEl=U.createRingCharEl(ch);
          groupEl.appendChild(charEl);
        }
      }

      var deco=document.createElement('span');
      deco.className='word-deco';
      deco.style.display='none';
      groupEl.appendChild(deco);
      wrap.appendChild(groupEl);
    }
    lyricsLayer.appendChild(wrap);
    return wrap;
  }
};
})();
