// 倾诉模式 - 移植自 D:\Code\folia Tilt visualizer
// 参照原版 SentenceLayout 算法实现分行、tilt选择、入场动画
(function(){
'use strict';
var U=window.ModeUtils;
var REM_PX=16;

// 原版 seededRandom: 接受 seed 和 offset 两个参数
// shared.js 的版本只接受一个参数,offset 被忽略,导致所有行 tilt 概率相同
function seededRandom(seed,offset){
  var x=Math.sin(seed*1000+offset)*10000;
  return x-Math.floor(x);
}

// ===== 分行算法: 移植自 SentenceLayout.splitIntoSentences =====
function determineLineCount(charCount,seed,splitProb){
  var LOG_OFFSET=4,CHAR_REF=20;
  var normalized=Math.log(charCount+LOG_OFFSET)/Math.log(CHAR_REF+LOG_OFFSET);
  var jitter=seededRandom(seed,1)*0.6+0.7;
  var score=normalized*jitter*splitProb;
  if(score<0.45)return 1;
  if(score<1.05)return 2;
  if(score<1.7)return 3;
  return 4;
}

// 按标点切分 (level 1)
function splitByPunctuation(text){
  var regex=/[，。；！？、…·\.\,\;\!\?]+/g;
  var matches=[];var m;
  while((m=regex.exec(text))!==null)matches.push({start:m.index,end:m.index+m[0].length,str:m[0]});
  if(matches.length===0)return[text];
  var result=[],lastIdx=0;
  for(var i=0;i<matches.length;i++){
    var mt=matches[i];
    var after=text.slice(mt.end);
    var spMatch=after.match(/^\s+/);
    var trailing=spMatch?spMatch[0]:'';
    var before=text.slice(lastIdx,mt.start);
    var punctWith=mt.str+trailing;
    if(before.length>0){result.push(before+punctWith)}
    else if(result.length>0){result[result.length-1]+=punctWith}
    else{result.push(punctWith)}
    lastIdx=mt.end+trailing.length;
  }
  if(lastIdx<text.length)result.push(text.slice(lastIdx));
  return result.filter(function(r){return r.length>0});
}

// 按括号引号切分 (level 2)
function splitByBrackets(text){
  var pairs=[
    [/「/,/」/],[/『/,/』/],[/《/,/》/],[/【/,/】/],
    [/（/,/）/],[/\(/,/\)/],[/\[/,/\]/],
    [/｛/,/｝/],[/［/,/］/]
  ];
  // 加字符串版本
  var strPairs=[['"','"'],["'","'"]];

  function findOutermost(t){
    var best=null;
    for(var p=0;p<pairs.length;p++){
      var oi=t.indexOf(pairs[p][0].source.length===1?pairs[p][0].source:'');
      // 简化: 用 indexOf
      var openStr=pairs[p][0].source;
      var closeStr=pairs[p][1].source;
      var oIdx=t.indexOf(openStr);
      if(oIdx<0)continue;
      var cIdx=t.indexOf(closeStr,oIdx+1);
      if(cIdx<0)continue;
      if(!best||oIdx<best.oStart||(oIdx===best.oStart&&cIdx+1>best.cEnd)){
        best={oStart:oIdx,oEnd:oIdx+openStr.length,cStart:cIdx,cEnd:cIdx+closeStr.length};
      }
    }
    for(var sp=0;sp<strPairs.length;sp++){
      var oIdx=t.indexOf(strPairs[sp][0]);
      if(oIdx<0)continue;
      var cIdx=t.indexOf(strPairs[sp][1],oIdx+1);
      if(cIdx<0)continue;
      if(!best||oIdx<best.oStart||(oIdx===best.oStart&&cIdx+1>best.cEnd)){
        best={oStart:oIdx,oEnd:oIdx+strPairs[sp][0].length,cStart:cIdx,cEnd:cIdx+strPairs[sp][1].length};
      }
    }
    return best;
  }

  function extract(t){
    var best=findOutermost(t);
    if(!best)return[t];
    var before=t.slice(0,best.oStart);
    var paired=t.slice(best.oStart,best.cEnd);
    var after=t.slice(best.cEnd);
    var r=[];
    if(before.length>0)r.push.apply(r,extract(before));
    r.push(paired);
    if(after.length>0)r.push.apply(r,extract(after));
    return r.filter(function(x){return x.length>0});
  }

  var result=extract(text);
  return result.length>1?result:[text];
}

// 按西文词组切分 (level 3)
function splitByWesternWords(text){
  if(!/[\u4e00-\u9fa5]/.test(text))return[text];
  var regex=/[a-zA-Z0-9]+(?:[a-zA-Z0-9'\-]*[a-zA-Z0-9]+)?(?:\s+[a-zA-Z0-9]+(?:[a-zA-Z0-9'\-]*[a-zA-Z0-9]+)?)+[.,;:!?。，；：！？]?\s*/g;
  var hasMulti=false;var m;
  while((m=regex.exec(text))!==null){
    var wc=(m[0].match(/[a-zA-Z0-9]+/g)||[]).length;
    if(wc>1){hasMulti=true;break}
  }
  if(!hasMulti)return[text];
  regex.lastIndex=0;
  var parts=[],lastIdx=0;
  while((m=regex.exec(text))!==null){
    var bStart=m.index,bEnd=bStart+m[0].length;
    var before=text.slice(lastIdx,bStart);
    if(before.length>0)parts.push(before);
    parts.push(m[0]);
    lastIdx=bEnd;
  }
  if(lastIdx<text.length)parts.push(text.slice(lastIdx));
  return parts.length>1?parts:[text];
}

// 按CJK空格切分 (level 4)
function splitCJKBySpace(text){
  if(!/[\u4e00-\u9fa5]/.test(text))return[text];
  var segs=[],cur='',inCjk=false;
  for(var i=0;i<text.length;i++){
    var ch=text[i];
    var isCjk=/[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/.test(ch);
    var isSpace=/\s/.test(ch);
    if(isCjk){cur+=ch;inCjk=true}
    else if(isSpace){
      var isFull=ch==='\u3000';
      if(isFull&&cur.length>0){cur+=ch;segs.push(cur);cur='';inCjk=false}
      else if(inCjk&&cur.length>0){cur+=ch;segs.push(cur);cur='';inCjk=false}
      else if(cur.length===0&&segs.length>0){segs[segs.length-1]+=ch}
      else{cur+=ch}
    }else{
      if(cur.length===0&&segs.length>0)segs[segs.length-1]+=ch;
      else cur+=ch;
    }
  }
  if(cur){if(segs.length>0&&/^\s+$/.test(cur))segs[segs.length-1]+=cur;else segs.push(cur)}
  return segs.length>1?segs:[text];
}

// 按特殊字符切分 (level 5)
function splitBySpecialChars(text){
  var parts=text.split(/[：:\/／\\|｜~～]+/);
  if(parts.filter(function(p){return p.length>0}).length<=1)return[text];
  var result=[],lastIdx=0;
  for(var i=0;i<parts.length;i++){
    var idx=text.indexOf(parts[i],lastIdx);
    if(idx>lastIdx){
      var sp=text.slice(lastIdx,idx);
      if(result.length>0)result[result.length-1]+=sp;else result.push(sp);
    }
    if(parts[i]){result.push(parts[i]);lastIdx=idx+parts[i].length}
    else if(idx!==-1){lastIdx=idx}
  }
  if(lastIdx<text.length){var tail=text.slice(lastIdx);if(tail&&result.length>0)result[result.length-1]+=tail;else if(tail)result.push(tail)}
  return result.filter(function(r){return r.length>0});
}

function splitByLevel(text,level){
  switch(level){
    case 1:return splitByPunctuation(text);
    case 2:return splitByBrackets(text);
    case 3:return splitByWesternWords(text);
    case 4:return splitCJKBySpace(text);
    case 5:return splitBySpecialChars(text);
    default:return[text];
  }
}

// 二次切分: 用 Intl.Segmenter 找词边界,或从中点切
function secondarySplit(sentences,targetCount,timeSeed){
  var segmenter=null;
  try{segmenter=new Intl.Segmenter(undefined,{granularity:'word'})}catch(e){}
  while(sentences.length<targetCount){
    var candidates=sentences.filter(function(s){return s.length>2});
    if(candidates.length===0)break;
    if(segmenter){
      var bestCandidate=null;var bestScore=-1;
      for(var ci=0;ci<candidates.length;ci++){
        var s=candidates[ci];
        try{
          var segs=Array.from(segmenter.segment(s));
          var wordPos=[];
          var offset=0;
          for(var si=0;si<segs.length;si++){
            if(segs[si].isWordLike)wordPos.push({start:offset,end:offset+segs[si].segment.length});
            offset+=segs[si].segment.length;
          }
          if(wordPos.length>=2){
            var midChar=s.length/2;var bestGap=1;var bestDist=Infinity;
            for(var g=1;g<wordPos.length;g++){
              var dist=Math.abs(wordPos[g].start-midChar);
              if(dist<bestDist){bestDist=dist;bestGap=g}
            }
            var splitPos=wordPos[bestGap].start;
            var balScore=1-Math.abs(splitPos-midChar)/midChar;
            var score=balScore*10+wordPos.length;
            if(score>bestScore){bestScore=score;bestCandidate={text:s,index:sentences.indexOf(s),splitPos:splitPos}}
          }
        }catch(e){}
      }
      if(bestCandidate){
        var first=bestCandidate.text.slice(0,bestCandidate.splitPos);
        var second=bestCandidate.text.slice(bestCandidate.splitPos);
        sentences.splice(bestCandidate.index,1,first,second);
        continue;
      }
    }
    // fallback: 从中点切
    var textHash=sentences.reduce(function(a,s){return a+s.split('').reduce(function(s2,c){return s2+c.charCodeAt(0)},0)},0);
    var seed2=textHash+sentences.length+(timeSeed||0);
    var rnd=Math.sin(seed2)*10000;rnd=rnd-Math.floor(rnd);
    var ri=Math.floor(rnd*candidates.length);
    var sel=candidates[ri];
    var mid=Math.floor(sel.length/2);
    sentences.splice(sentences.indexOf(sel),1,sel.slice(0,mid),sel.slice(mid));
  }
  return sentences;
}

// 合并过短的行
function mergeSentences(sentences,targetCount){
  while(sentences.length>targetCount){
    var bestIdx=0;var bestLen=Infinity;
    for(var i=0;i<sentences.length-1;i++){
      var cl=sentences[i].length+sentences[i+1].length;
      if(cl<bestLen){bestLen=cl;bestIdx=i}
    }
    sentences[bestIdx]=sentences[bestIdx]+sentences[bestIdx+1];
    sentences.splice(bestIdx+1,1);
  }
  return sentences;
}

function splitIntoSentences(text,targetCount,timeSeed){
  if(targetCount<=1&&targetCount>=0)return[text];
  var maxLevel=Math.min(5,Math.abs(targetCount)>0?Math.abs(targetCount):5);
  var sentences=[text];
  for(var level=1;level<=maxLevel;level++){
    if(sentences.length>=Math.abs(targetCount)&&targetCount>0)break;
    var newSents=[];
    for(var si=0;si<sentences.length;si++){
      var split=splitByLevel(sentences[si],level);
      newSents.push.apply(newSents,split);
    }
    sentences=newSents;
  }
  if(targetCount>0&&sentences.length<targetCount){
    sentences=secondarySplit(sentences,targetCount,timeSeed);
  }
  if(sentences.length>1&&sentences.length>targetCount&&targetCount>0){
    sentences=mergeSentences(sentences,targetCount);
  }
  return sentences;
}

// ===== 测量 =====
var _canvas=null;
function measureTextWidth(text,fontPx,fw,fs){
  if(!_canvas)_canvas=document.createElement('canvas');
  var c=_canvas.getContext('2d');
  if(!c)return text.length*fontPx*0.6;
  c.font=(fw||400)+' '+(fs||'normal')+' '+fontPx+'px "Inter","PingFang SC","Microsoft YaHei","Noto Sans CJK SC",system-ui,sans-serif';
  return c.measureText(text).width;
}

window.ModeQingsu={
  createLine:function(line,lyricsLayer){
    var text=line.text||'';
    var lineStart=line.time_ms||0;
    var lineEnd=line.time_ms+(line.duration_ms||4000);
    var seed=line.time_ms/1000;

    // 分行: 参照原版 SentenceLayout
    var segments=[text];
    var isEllipsis=/^[\s.…·。]+$/.test(text.trim());
    if(!isEllipsis&&text.length>1){
      var numLines=determineLineCount(text.trim().length,seed,0.75);
      segments=splitIntoSentences(text,numLines,seed);
    }

    // tilt选择: 参照原版 - 每行独立概率,可出现在任意行
    var tiltIdx=-1;
    var candidates=[];
    for(var i=0;i<segments.length;i++){
      var lineRoll=seededRandom(seed,100+i);
      if(lineRoll<0.35)candidates.push(i);
    }
    if(candidates.length>0){
      tiltIdx=candidates[Math.floor(seededRandom(seed,200)*candidates.length)];
    }

    var vw=Math.max(320,window.innerWidth),maxW=0;
    for(var i=0;i<segments.length;i++)
      maxW=Math.max(maxW,measureTextWidth(segments[i],vw*0.06875,i===tiltIdx?300:400,i===tiltIdx?'italic':'normal'));
    var sm=maxW>vw*0.85?Math.max(0.5,vw*0.85/maxW):1;
    var nfs='clamp('+(3.125*sm).toFixed(3)+'rem,'+(6.875*sm).toFixed(3)+'vw,'+(5.625*sm).toFixed(3)+'rem)';
    var tfpx=Math.min(vw*0.06875*sm,5.625*REM_PX*sm);
    var yOff=tfpx/6;

    var wrap=document.createElement('div');
    wrap.className='lyric-line-wrap';
    wrap.style.cssText='width:100%;max-width:80vw;min-height:300px;display:flex;align-items:center;justify-content:center;pointer-events:none;';
    wrap.dataset.duration=line.duration_ms||4000;
    wrap.dataset.endtime=String(lineEnd);
    wrap.dataset.lineStart=String(lineStart);

    var col=document.createElement('div');
    col.className='tilt-col';
    col.style.cssText='display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0.75rem;';

    var fullLen=text.length,charOff=0;
    for(var si=0;si<segments.length;si++){
      var seg=segments[si],isTilt=(si===tiltIdx);
      var td=lineEnd-lineStart;
      var ss=lineStart+(charOff/fullLen)*td;
      var se=lineStart+((charOff+seg.length)/fullLen)*td;
      var segDur=se-ss;

      var lineEl=document.createElement('div');
      lineEl.className='tilt-line';
      lineEl.dataset.isTilt=isTilt?'1':'0';
      lineEl.dataset.segIndex=String(si);
      lineEl.dataset.segStart=String(ss);
      lineEl.dataset.segEnd=String(se);
      lineEl.dataset.visible='0';
      // 参照原版: tilt行有 scale(0.92)→scale(1) 的入场动画
      lineEl.style.cssText=isTilt?
        'whitespace-nowrap;opacity:0;transform:translateY(24px) scale(0.92);transition:opacity 0.6s cubic-bezier(0.25,0.46,0.45,0.94),transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94);font-size:'+nfs+';color:#FFB432;font-style:italic;font-weight:300;letter-spacing:0.15em;line-height:1.25;':
        'whitespace-nowrap;opacity:0;transform:translateY(20px);transition:opacity 0.55s cubic-bezier(0.25,0.46,0.45,0.94),transform 0.55s cubic-bezier(0.25,0.46,0.45,0.94);font-size:'+nfs+';color:rgba(255,255,255,0.9);font-weight:400;letter-spacing:0.08em;line-height:1.35;';

      var nsc=0;
      for(var ci=0;ci<seg.length;ci++)if(!/^\s+$/.test(seg[ci]))nsc++;
      var nsIdx=0,vi=0;
      for(var ci=0;ci<seg.length;ci++){
        var ch=seg[ci],isSp=/^\s+$/.test(ch);
        var cel=document.createElement('span');
        cel.style.display='inline-block';
        if(isSp){cel.style.minWidth=isTilt?'0.35em':'0.25em';cel.textContent='\u00A0'}
        else{
          cel.textContent=ch;
          cel.style.opacity='0';
          // tilt行子元素: 参照原版交错偏移到 2*yOffset 然后回到 yOffset
          if(isTilt){
            var even=vi%2===0,st=even?-1:1;
            cel.dataset.sy=String(st*yOff);
            cel.style.transform='translateY('+st*yOff*2+'px)';
          }
          cel.dataset.delay=String(vi*(isTilt?0.05:0.04));
          cel.dataset.revealed='0';
          cel.dataset.charIdx=String(nsIdx);
          cel.dataset.totalChars=String(nsc);
          // 脉冲时序按段时长分配
          var pulseDur=Math.max(300,segDur*0.6/nsc);
          var pulseGap=segDur/nsc;
          cel.dataset.pulseDelay=String(nsIdx*pulseGap);
          cel.dataset.pulseDur=String(pulseDur);
          cel.dataset.pulseScale=isTilt?'1.35':'1.25';
          nsIdx++;vi++;
        }
        lineEl.appendChild(cel);
      }
      col.appendChild(lineEl);
      charOff+=seg.length;
    }
    wrap.appendChild(col);
    lyricsLayer.appendChild(wrap);
    wrap.dataset.showTime=String(performance.now());
    return wrap;
  },

  updateStates:function(wrap,currentTime){
    if(!wrap)return;
    var col=wrap.querySelector('.tilt-col');
    if(!col)return;
    var lines=col.querySelectorAll('.tilt-line');
    if(!lines.length)return;

    var lineStart=parseFloat(wrap.dataset.lineStart)||0;
    var lineEnd=parseFloat(wrap.dataset.endtime);
    var now=performance.now();
    var showTime=parseFloat(wrap.dataset.showTime)||now;

    var visIdx=-1;
    for(var li=0;li<lines.length;li++){
      if(currentTime>=parseFloat(lines[li].dataset.segStart)-0.25)visIdx=li;
    }
    if(currentTime<lineStart-0.1||currentTime>lineEnd+200)visIdx=-1;

    for(var li=0;li<lines.length;li++){
      var le=lines[li],isTilt=le.dataset.isTilt==='1';
      var show=(li<=visIdx);

      if(show&&le.dataset.visible==='0'){
        le.dataset.visible='1';
        le.style.opacity='1';
        // 参照原版: tilt行 animate 到 translateY(0) scale(1), 普通行到 translateY(0)
        le.style.transform=isTilt?'translateY(0) scale(1)':'translateY(0)';
        // 触发逐字符脉冲
        var pChars=le.querySelectorAll('span[data-pulse-delay]');
        for(var pi=0;pi<pChars.length;pi++){
          var pc=pChars[pi];
          var pd=parseFloat(pc.dataset.pulseDelay)||0;
          var pDur=parseFloat(pc.dataset.pulseDur)||500;
          var pScale=pc.dataset.pulseScale||'1.25';
          pc.animate([
            {scale:'1'},
            {scale:pScale},
            {scale:'1'}
          ],{duration:pDur,delay:pd,easing:'ease-in-out',fill:'forwards'});
        }
      }else if(!show&&le.dataset.visible==='1'){
        le.dataset.visible='0';
        le.style.opacity='0';
        // 参照原版: tilt行 exit 到 translateY(-16px) scale(0.95), 普通行到 translateY(-12px)
        le.style.transform=isTilt?'translateY(-16px) scale(0.95)':'translateY(-12px)';
        continue;
      }
      if(!show)continue;

      // 入场: 参照原版 stagger delay
      var chars=le.querySelectorAll('span[data-delay]');
      for(var ci=0;ci<chars.length;ci++){
        var ch=chars[ci];
        if(ch.dataset.revealed==='0'){
          var delay=parseFloat(ch.dataset.delay)||0;
          if((now-showTime)/1000>=delay){
            ch.dataset.revealed='1';
            ch.style.opacity='1';
            if(isTilt){
              ch.style.transform='translateY('+ch.dataset.sy+'px)';
            }
          }
        }
      }
    }
  }
};
})();
