// 心象模式 - 爱心曲线排布, 碰撞回避, 英雄词
(function(){
'use strict';
var U=window.ModeUtils;

function heartX(t){return 16*Math.pow(Math.sin(t),3)}
function heartY(t){return 13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t)}
function chooseFontPx(width,text){
  var gc=(text||'').length||1;
  var widthBase=Math.max(34,Math.min(94,width*0.086));
  var lengthPenalty=gc>12?Math.min((gc-12)*1.8,34):0;
  return Math.max(28,Math.min(104,widthBase-lengthPenalty));
}
function pickHeroWord(allChars,lineText){
  if(!allChars.length)return-1;
  var mid=(allChars.length-1)/2;
  var bestIdx=0,bestScore=-1;
  for(var i=0;i<allChars.length;i++){
    var ch=allChars[i].text;
    var isCjk=U.isCJK(ch);
    var semanticWeight=isCjk?0.18:Math.min(ch.length*0.08,0.36);
    var centerBias=1-Math.abs(i-mid)/Math.max(allChars.length,1);
    var score=semanticWeight+centerBias*0.18;
    if(score>bestScore){bestScore=score;bestIdx=i}
  }
  return bestIdx;
}
function createCollisionSystem(lineHeight){
  var bandSize=Math.max(24,Math.round(lineHeight*0.9));
  var rects=[];var bands={};var stamp=0;var marks=[];
  return{
    pushRect:function(cx,cy,w,h,pad){
      var rect={left:cx-pad,top:cy-h-pad,right:cx+w+pad,bottom:cy+pad};
      var idx=rects.length;rects.push(rect);
      var s=Math.floor(rect.top/bandSize),e=Math.floor(rect.bottom/bandSize);
      for(var b=s;b<=e;b++){if(!bands[b])bands[b]=[];bands[b].push(idx)}
    },
    query:function(left,top,right,bottom){
      stamp++;var hit=false,area=0;
      var s=Math.floor(top/bandSize),e=Math.floor(bottom/bandSize);
      for(var b=s;b<=e;b++){
        var buck=bands[b];if(!buck)continue;
        for(var i=0;i<buck.length;i++){
          var ri=buck[i];if(marks[ri]===stamp)continue;marks[ri]=stamp;
          var r=rects[ri];
          var ow=Math.max(0,Math.min(right,r.right)-Math.max(left,r.left));
          var oh=Math.max(0,Math.min(bottom,r.bottom)-Math.max(top,r.top));
          if(ow>0&&oh>0){hit=true;area+=ow*oh}
        }
      }
      return{intersects:hit,overlapArea:area};
    }
  };
}
function ellipticalSearch(px,py,cw,ch,pad,bounds,cs,emphasis,fontPx,lineHeight){
  var step=Math.max(10,Math.round(fontPx*0.14));
  var maxR=emphasis>1?Math.max(20,lineHeight*0.5):Math.max(lineHeight*2.2,cw*0.75,56);
  var eY=emphasis>1?0.8:0.92;
  var best={x:px,y:py,score:Infinity};
  for(var r=0;r<=maxR;r+=step){
    var n=r===0?1:emphasis>1?8:Math.max(12,Math.round(Math.PI*2*r/Math.max(step*1.1,10)));
    for(var i=0;i<n;i++){
      var angle=(i/n)*Math.PI*2;
      var dx=r===0?0:Math.cos(angle)*r;
      var dy=r===0?0:Math.sin(angle)*r*eY;
      var lx=px+dx-pad,ly=py+dy-ch-pad;
      var rx=lx+cw+pad*2,by=ly+ch+pad*2;
      if(lx<bounds.minX||rx>bounds.maxX||ly<bounds.minY||by>bounds.maxY)continue;
      var col=cs.query(lx,ly,rx,by);
      var travel=Math.hypot(dx,dy);
      var score=col.overlapArea*2.2+travel;
      if(score<best.score)best={x:px+dx,y:py+dy,score:score};
      if(!col.intersects)return{found:true,x:px+dx,y:py+dy};
    }
  }
  return{found:false,x:best.x,y:best.y};
}
function repelFromHero(px,py,wordW,hero,pad){
  var dx=px-hero.centerX;
  var dy=py-hero.centerY;
  var dist=Math.hypot(dx,dy);
  var minSep=hero.width*0.34+wordW*0.52+pad*2;
  if(dist<minSep&&dist>0){
    var ux=dx/dist,uy=dy/dist;
    var push=minSep-dist;
    return{x:px+ux*push,y:py+uy*push*0.92};
  }
  return{x:px,y:py};
}

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
    var xinxiangFontPx=chooseFontPx(vw,fullText)*1.12;
    var heroIdx=pickHeroWord(allChars,fullText);
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

    var cs=createCollisionSystem(lineHeight);
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
        var rep=repelFromHero(px,py,cw,heroMetrics,pad);
        px=rep.x;py=rep.y;
      }

      var res=ellipticalSearch(px,py,cw,ch,pad,bounds,cs,emphasis,xinxiangFontPx,lineHeight);
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
          var charEl=U.createCharEl(ch);
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
