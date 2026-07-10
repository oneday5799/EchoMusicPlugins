// 模式共享工具函数
(function(){
'use strict';

window.ModeUtils={
  NON_ENG_REGEX:/[^a-zA-Z0-9\s]/,
  ENG_WORD_REGEX:/^[a-zA-Z0-9']+$/,
  isNonEng:function(text){return this.NON_ENG_REGEX.test(text)},
  isEngWord:function(text){return this.ENG_WORD_REGEX.test(text.trim())},
  seededRandom:function(seed){var x=Math.sin(seed)*10000;return x-Math.floor(x)},
  isCJK:function(ch){var c=ch.charCodeAt(0);return(c>=0x4E00&&c<=0x9FFF)||(c>=0x3400&&c<=0x4DBF)||(c>=0x20000&&c<=0x2A6DF)||(c>=0xF900&&c<=0xFAFF)||(c>=0x2F800&&c<=0x2FA1F)},

  // 构建字符数组
  buildAllChars:function(line){
    var allChars=[];
    if(line.characters&&line.characters.length){
      for(var c=0;c<line.characters.length;c++) allChars.push(line.characters[c]);
    }else{
      var txt=line.text||'';
      var dur=line.duration_ms||2000;
      var charDur=dur/txt.length;
      for(var c=0;c<txt.length;c++){
        allChars.push({text:txt[c],startTime:line.time_ms+c*charDur,endTime:line.time_ms+(c+1)*charDur});
      }
    }
    var minCharDur=800;
    for(var c=0;c<allChars.length;c++){
      var ch=allChars[c];
      var chStart=Number(ch.startTime)||0;
      var chEnd=Number(ch.endTime)||chStart+minCharDur;
      if(chEnd-chStart<minCharDur) ch.endTime=chStart+minCharDur;
    }
    return allChars;
  },

  // 按随机权重分组
  groupChars:function(allChars,seed){
    var groups=[];var gi=0;
    while(gi<allChars.length){
      var r=this.seededRandom(seed+gi*100);
      var groupSize=r<0.3?1:r<0.8?2:3;
      groupSize=Math.min(groupSize,allChars.length-gi);
      var groupChars=[];
      for(var gc=0;gc<groupSize;gc++) groupChars.push(allChars[gi+gc]);
      groups.push(groupChars);
      gi+=groupSize;
    }
    return groups;
  },

  // 创建字符DOM元素
  createCharEl:function(ch){
    var charEl=document.createElement('span');
    charEl.className='word-char';
    charEl.dataset.charStart=ch.startTime;
    charEl.dataset.charEnd=ch.endTime;
    charEl.style.opacity='0';
    var glow=document.createElement('span');
    glow.className='word-glow';
    glow.textContent=ch.text;
    var body=document.createElement('span');
    body.className='word-body';
    body.textContent=ch.text;
    charEl.appendChild(glow);
    charEl.appendChild(body);
    charEl._body=body;
    charEl._glow=glow;
    return charEl;
  },

  // 创建英文单词包裹
  createEngEl:function(ch){
    var engEl=document.createElement('span');
    engEl.className='word-eng';
    engEl.dataset.wordStart=ch.startTime;
    engEl.dataset.wordEnd=ch.endTime;
    var wCharEl=this.createCharEl(ch);
    engEl.appendChild(wCharEl);
    return engEl;
  },

  // 标记旋转字符
  markSpinChars:function(wrap){
    var allEls=wrap.querySelectorAll('.word-char');
    var spinCount=Math.max(1,Math.round(allEls.length*0.3));
    var spinIndices=[];
    while(spinIndices.length<spinCount&&spinIndices.length<allEls.length){
      var ri=Math.floor(Math.random()*allEls.length);
      if(spinIndices.indexOf(ri)===-1)spinIndices.push(ri);
    }
    for(var si=0;si<spinIndices.length;si++){
      var spinEl=allEls[spinIndices[si]];
      var spinDir=Math.random()>0.5?1:-1;
      var spinDur=(120+Math.random()*8).toFixed(1);
      spinEl._body.dataset.spinDur=spinDur;
      spinEl._body.dataset.spinDir=spinDir<0?'reverse':'normal';
      spinEl._body.style.transformOrigin='center center';
      spinEl._body.style.display='inline-block';
    }
  },

  // 创建带光圈的字符DOM元素
  createRingCharEl:function(ch){
    var charEl=this.createCharEl(ch);
    if(this.isNonEng(ch.text)){
      var ring=document.createElement('span');
      ring.className='word-ring';
      charEl.appendChild(ring);
      charEl._ring=ring;
    }
    return charEl;
  },

  // 去掉 "歌手 - 歌名" 中的歌手前缀
  stripArtistPrefix:function(title,artist){
    if(artist&&title.indexOf(artist)===0)
      return title.substring(artist.length).replace(/^\s*[-–—]\s*/,'');
    return title;
  },

  // 散落布局工厂函数 (yunjie/liuguang 共享)
  createScatteredLine:function(line,lyricsLayer,config){
    var seed=line.time_ms/1000;
    var allChars=this.buildAllChars(line);
    var groups=this.groupChars(allChars,seed);

    var wrap=document.createElement('div');
    wrap.className='lyric-line-wrap'+(config.wrapClass?' '+config.wrapClass:'');
    wrap.dataset.duration=line.duration_ms||2000;
    wrap.dataset.endtime=String(line.time_ms+(line.duration_ms||2000));

    for(var g=0;g<groups.length;g++){
      var group=groups[g];
      var gSeed=seed+g*10;
      var r1=this.seededRandom(gSeed+1);
      var r2=this.seededRandom(gSeed+2);
      var r3=this.seededRandom(gSeed+3);
      var r4=this.seededRandom(gSeed+4);
      var xOff=(r1-0.5)*config.xRange;
      var yOff=(r2-0.5)*config.yRange;
      var rotate=(r3-0.5)*config.rotateRange;
      var scale=config.scaleMin+r4*config.scaleRange;

      var groupEl=document.createElement('div');
      groupEl.className='word-group'+(config.groupClass?' '+config.groupClass:'');
      groupEl.style.opacity='0';
      groupEl.dataset.x=xOff;
      groupEl.dataset.y=yOff;
      groupEl.dataset.rotate=rotate;
      groupEl.dataset.scale=scale;

      for(var ci=0;ci<group.length;ci++){
        var ch=group[ci];
        if(this.isEngWord(ch.text)){
          groupEl.appendChild(this.createEngEl(ch));
        }else{
          var charEl=this.createRingCharEl(ch);
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
    this.markSpinChars(wrap);
    return wrap;
  },

  // 心象模式：基于视口和文本长度计算字号
  chooseFontPx:function(width,text){
    var graphemeCount=(text||'').length||1;
    var widthBase=Math.max(34,Math.min(94,width*0.086));
    var lengthPenalty=graphemeCount>12?Math.min((graphemeCount-12)*1.8,34):0;
    return Math.max(28,Math.min(104,widthBase-lengthPenalty));
  },

  // 心象模式：选英雄词（语义权重+居中偏好）
  pickHeroWord:function(allChars,lineText){
    if(!allChars.length)return-1;
    var mid=(allChars.length-1)/2;
    var bestIdx=0,bestScore=-1;
    for(var i=0;i<allChars.length;i++){
      var ch=allChars[i].text;
      var isCjk=this.isCJK(ch);
      var semanticWeight=isCjk?0.18:Math.min(ch.length*0.08,0.36);
      var centerBias=1-Math.abs(i-mid)/Math.max(allChars.length,1);
      var score=semanticWeight+centerBias*0.18;
      if(score>bestScore){bestScore=score;bestIdx=i}
    }
    return bestIdx;
  },

  // 碰撞回避系统
  createCollisionSystem:function(lineHeight){
    var bandSize=Math.max(24,Math.round(lineHeight*0.9));
    var rects=[];var bands={};var stamp=0;var marks=[];
    return{
      bandSize:bandSize,
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
  },

  // 椭圆搜索：找无碰撞位置
  ellipticalSearch:function(px,py,cw,ch,pad,bounds,cs,emphasis,fontPx,lineHeight){
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
  },

  // 英雄词排斥
  repelFromHero:function(px,py,wordW,hero,pad){
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
};
})();
