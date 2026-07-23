// 浮名模式 - 独立渲染器
// 基于 D:\Code\folia 的 fume visualizer 移植
// 核心: 纸张布局 + 相机跟随 + 三级透明度 + 字符逐个打印 + 光晕
// 效果: 专属背景(随镜头) + 弹簧相机 + 颜色拖尾 + 打印戳记 + 总览 + 浮动

(function(){
'use strict';

var CFG={
  heroWeight:780,bodyWeight:640,
  heroFontMin:24,heroFontMax:54,
  bodyFontMin:14,bodyFontMax:28,
  heroWaitAlpha:0.06,bodyWaitAlpha:0.035,
  heroActiveAlpha:0.985,bodyActiveAlpha:0.92,
  heroPassedAlpha:0.74,bodyPassedAlpha:0.58,
  columnGap:40,
  glowIntensity:1,colorTrailDuration:0.35,
  accentColor:'#FFB432',primaryColor:'#FFFFFF',secondaryColor:'#71717A',
  showPrintStamp:true,printStampDuration:0.4,
  overviewThreshold:0.5,overviewScale:0.42,
  bgParallaxX:0.9,bgParallaxY:0.74,bgScaleFactor:0.94,
  floatingDistance:18,floatingPeriod:7,floatingScaleAmp:0.011,
};

var canvas=null,ctx=null,containerEl=null;
var lines=[],currentTimeMs=0,isPlaying=false;
var camX=0,camY=0,camFocusX=0,camFocusY=0;
var camScale=1.18,camFocusScale=1.18;
var blocks=[],blockByLineIndex={},dpr=1,W=0,H=0;
var animFrame=null,lastFrameTime=0;
var bgShapes=[],bgSparkShapes=[];
var isOverviewMode=false,overviewProgress=0;
var lastActiveBlockIdx=-2,retargetStartMs=0;

// 工具
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function lerp(a,b,t){return a+(b-a)*t}
function easeOutCubic(v){return 1-Math.pow(1-clamp(v,0,1),3)}
function easeInOutCubic(v){v=clamp(v,0,1);return v<0.5?4*v*v*v:1-Math.pow(-2*v+2,3)/2}
function seededRandom(s){var x=Math.sin(s)*10000;return x-Math.floor(x)}
function hashStr(s){var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function seeded(s){return(hashStr(s)%10000)/10000}
function isCJK(ch){var c=ch.charCodeAt(0);return(c>=0x4E00&&c<=0x9FFF)||(c>=0x3400&&c<=0x4DBF)||(c>=0x20000&&c<=0x2A6DF)||(c>=0xF900&&c<=0xFAFF)}
function countGraphemes(t){return(t||'').length}
function lerpColor(h1,h2,t){
  var r1=parseInt(h1.slice(1,3),16),g1=parseInt(h1.slice(3,5),16),b1=parseInt(h1.slice(5,7),16);
  var r2=parseInt(h2.slice(1,3),16),g2=parseInt(h2.slice(3,5),16),b2=parseInt(h2.slice(5,7),16);
  var r=Math.round(lerp(r1,r2,t)),g=Math.round(lerp(g1,g2,t)),b=Math.round(lerp(b1,b2,t));
  return'#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
}
function colorWithAlpha(hex,a){
  var r=parseInt(hex.slice(1,3),16)||0,g=parseInt(hex.slice(3,5),16)||0,b=parseInt(hex.slice(5,7),16)||0;
  return'rgba('+r+','+g+','+b+','+clamp(a,0,1)+')';
}
function delayedGlowEnvelope(p,pk){
  pk=pk||0.8;var n=clamp(p,0,1);var k=clamp(pk,0.05,0.95);
  if(n<=k)return easeOutCubic(n/k);
  return 1-Math.pow(clamp((n-k)/(1-k),0,1),3);
}

// ===== 背景 =====
function buildBgScene(){
  bgShapes=[];bgSparkShapes=[];
  var vw=W/dpr,vh=H/dpr;
  var hM=Math.max(vw*0.86,280);
  var paperW=clamp(Math.max(vw*1.95,vw+520),920,2400);
  var worldW=paperW+hM*2;
  var worldH=Math.max(vh*2.5,vh+600);
  var baseUnit=clamp(Math.min(vw,vh)*0.72,320,760);
  // 纸张边界
  var pL=hM,pR=hM+paperW,pT=worldH*0.15,pB=worldH*0.85;

  // 基础形状: 纸张光晕分布 (22%纸内, 78%四边)
  var kinds=['ring','square','cross','ring','square','cross','ring','square','cross','ring','square','cross'];
  var shapeCount=12;
  for(var i=0;i<shapeCount;i++){
    var s='fbg:'+worldW+':'+worldH+':'+i;
    var kind=kinds[i];
    var size=baseUnit*lerp(0.82,1.36,seeded(s+':s'));
    // 纸张光晕锚点
    var insideChance=seeded(s+':ic');
    var bx,by;
    if(insideChance<0.22){
      // 22% 在纸内
      bx=lerp(pL+size*0.12,pR-size*0.12,seeded(s+':ix'));
      by=lerp(pT+size*0.12,pB-size*0.12,seeded(s+':iy'));
    }else{
      // 78% 在四边之一
      var side=Math.floor(seeded(s+':side')*4)%4;
      var overflowX=size*lerp(0.16,0.24,seeded(s+':ox'));
      var overflowY=size*lerp(0.16,0.24,seeded(s+':oy'));
      var spanJX=size*lerp(-0.18,0.18,seeded(s+':jx'));
      var spanJY=size*lerp(-0.18,0.18,seeded(s+':jy'));
      if(side===0){bx=pL-overflowX;by=lerp(pT-size*0.12,pB+size*0.12,seeded(s+':sy'))+spanJY}
      else if(side===1){bx=pR+overflowX;by=lerp(pT-size*0.12,pB+size*0.12,seeded(s+':sy'))+spanJY}
      else if(side===2){bx=lerp(pL-size*0.12,pR+size*0.12,seeded(s+':sx'))+spanJX;by=pT-overflowY}
      else{bx=lerp(pL-size*0.12,pR+size*0.12,seeded(s+':sx'))+spanJX;by=pB+overflowY}
    }
    bgShapes.push({kind:kind,x:clamp(bx,0,worldW),y:clamp(by,0,worldH),
      width:size,height:size,
      rotation:lerp(-0.6,0.6,seeded(s+':r')),rotSpeed:lerp(-0.045,0.045,seeded(s+':rs')),
      strokeWidth:lerp(0.25,2.1,seeded(s+':w')),opacity:lerp(0.01,0.16,seeded(s+':o')),
      color:seeded(s+':c')>0.5?'accent':'secondary',depth:seeded(s+':p'),
      ringGapStart:kind==='ring'?lerp(-Math.PI,Math.PI,seeded(s+':gs')):0,
      ringGapSize:kind==='ring'?lerp(Math.PI*0.12,Math.PI*0.24,seeded(s+':gz')):0});
  }
  // 火花: 均匀网格分布覆盖整个纸张
  var sparkCount=20;
  var sL=hM*0.5,sR=hM+paperW+hM*0.5,sT=worldH*0.08,sB=worldH*0.92;
  var sW=sR-sL,sH=sB-sT;
  var sCols=Math.ceil(Math.sqrt(sparkCount*(worldW/Math.max(worldH,1))));
  var sRows=Math.ceil(sparkCount/sCols);
  var cW=sW/sCols,cH=sH/sRows;
  for(var i=0;i<sparkCount;i++){
    var s='fsp:'+worldW+':'+worldH+':'+i;
    var size=baseUnit*lerp(0.1,0.24,seeded(s+':s'));
    var col=i%sCols,row=Math.floor(i/sCols);
    bgSparkShapes.push({
      x:clamp(sL+(col+0.5)*cW+lerp(-0.32,0.32,seeded(s+':jx'))*cW,sL,sR),
      y:clamp(sT+(row+0.5)*cH+lerp(-0.32,0.32,seeded(s+':jy'))*cH,sT,sB),
      width:size,height:size,
      rotation:lerp(-Math.PI,Math.PI,seeded(s+':r')),rotSpeed:lerp(-0.18,0.18,seeded(s+':rs')),
      strokeWidth:lerp(0.75,1.7,seeded(s+':w')),opacity:lerp(0.08,0.22,seeded(s+':o')),
      color:seeded(s+':c')>0.5?'accent':'secondary',depth:seeded(s+':p'),
      audioBand:['treble','vocal','mid','treble','lowMid'][i%5]});
  }
  bgShapes.sort(function(a,b){return a.depth-b.depth});
  bgSparkShapes.sort(function(a,b){return a.depth-b.depth});
}

function buildShapePath(c,s){
  c.beginPath();
  if(s.kind==='ring'){
    var gs=s.ringGapStart||-Math.PI*0.18,gz=clamp(s.ringGapSize||Math.PI*0.2,0.18,Math.PI*0.6);
    c.lineCap='round';c.ellipse(0,0,s.width*0.5,s.width*0.5,0,gs+gz,gs+Math.PI*2);
  }else if(s.kind==='square'){c.rect(-s.width*0.5,-s.width*0.5,s.width,s.width);
  }else if(s.kind==='cross'){
    var sz=s.width,a=sz*0.3;
    c.moveTo(-a,-sz*0.5);c.lineTo(a,-sz*0.5);c.lineTo(a,-a);c.lineTo(sz*0.5,-a);
    c.lineTo(sz*0.5,a);c.lineTo(a,a);c.lineTo(a,sz*0.5);c.lineTo(-a,sz*0.5);
    c.lineTo(-a,a);c.lineTo(-sz*0.5,a);c.lineTo(-sz*0.5,-a);c.lineTo(-a,-a);c.closePath();
  }else{
    var o=s.width*0.5,inn=s.width*0.13;
    c.moveTo(0,-o);c.lineTo(inn,-inn);c.lineTo(o,0);c.lineTo(inn,inn);
    c.lineTo(0,o);c.lineTo(-inn,inn);c.lineTo(-o,0);c.lineTo(-inn,-inn);c.closePath();
  }
}

function drawBgShape(c,s,opacity,time,av){
  var bv=av||0;
  var aS=bv>0?lerp(0.88,1.7,clamp((bv-10)/190,0,1)):1;
  var aO=bv>0?lerp(0.85,1.55,clamp((bv-10)/190,0,1)):1;
  var fo=clamp(s.opacity*aO*opacity,0,0.42);
  c.save();
  var sc=s.color==='accent'?CFG.accentColor:CFG.secondaryColor;
  c.translate(s.x,s.y);c.rotate(s.rotation+time*s.rotSpeed);c.scale(aS,aS);
  if(s.kind==='spark'){
    c.strokeStyle=colorWithAlpha(sc,fo);c.lineWidth=s.strokeWidth;
    c.shadowBlur=10*aS;c.shadowColor=colorWithAlpha(sc,fo*0.75);
    buildShapePath(c,s);c.stroke();
  }else{
    var sc2=CFG.secondaryColor;
    buildShapePath(c,s);c.strokeStyle=colorWithAlpha(lerpColor(sc2,sc,0.24),fo*0.56);
    c.lineWidth=Math.max(s.strokeWidth*0.28,0.14);c.shadowBlur=0;c.shadowColor='transparent';c.stroke();
    buildShapePath(c,s);c.strokeStyle=colorWithAlpha(lerpColor(sc2,sc,0.62),fo);
    c.lineWidth=Math.max(s.strokeWidth*0.92,0.78);c.stroke();
  }
  c.restore();
}

function drawBg(time){
  if(!ctx)return;
  var vw=W/dpr,vh=H/dpr,cx=vw*0.5,cy=vh*0.5;
  var bgCamX=lerp(cx*0.5,camX*camScale,CFG.bgParallaxX);
  var bgCamY=lerp(cy*0.5,camY*camScale,CFG.bgParallaxY);
  var bgS=clamp(camScale*CFG.bgScaleFactor,0.22,2.24);
  ctx.save();ctx.scale(dpr,dpr);
  ctx.translate(cx,cy);ctx.scale(bgS,bgS);ctx.translate(-bgCamX,-bgCamY);
  var gs=1/Math.max(bgS,0.01);
  var grad=ctx.createRadialGradient(bgCamX,bgCamY,0,bgCamX,bgCamY,vw*0.7*gs);
  grad.addColorStop(0,'rgba(180,130,50,0.14)');grad.addColorStop(0.35,'rgba(140,100,30,0.08)');
  grad.addColorStop(0.7,'rgba(80,60,20,0.03)');grad.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=grad;ctx.fillRect(bgCamX-vw*0.5*gs,bgCamY-vh*0.5*gs,vw*gs,vh*gs);
  var pxC=camX*camScale-bgCamX,pyC=camY*camScale-bgCamY;
  for(var i=0;i<bgShapes.length;i++){
    var sh=bgShapes[i],lr=lerp(0.58,1.16,sh.depth);
    drawBgShape(ctx,{kind:sh.kind,x:sh.x+pxC*(1-lr),y:sh.y+pyC*(1-lr),
      width:sh.width,height:sh.height,rotation:sh.rotation,rotSpeed:sh.rotSpeed,
      strokeWidth:sh.strokeWidth,opacity:sh.opacity,color:sh.color,
      ringGapStart:sh.ringGapStart,ringGapSize:sh.ringGapSize},1,time,0);
  }
  for(var i=0;i<bgSparkShapes.length;i++){
    var sp=bgSparkShapes[i],lr=lerp(0.58,1.16,sp.depth);
    var av=0;
    if(sp.audioBand==='treble')av=window._fumeAudioTreble||0;
    else if(sp.audioBand==='mid'||sp.audioBand==='vocal')av=window._fumeAudioMid||0;
    else if(sp.audioBand==='lowMid')av=window._fumeAudioBass||0;
    drawBgShape(ctx,{kind:'spark',x:sp.x+pxC*(1-lr),y:sp.y+pyC*(1-lr),
      width:sp.width,height:sp.height,rotation:sp.rotation,rotSpeed:sp.rotSpeed,
      strokeWidth:sp.strokeWidth,opacity:sp.opacity,color:sp.color},1,time,av);
  }
  ctx.restore();
}

// ===== 布局: 源项目方式 =====
function buildLayout(){
  if(!lines.length)return;
  blocks=[];
  var vw=W/dpr,vh=H/dpr;
  var paperW=clamp(Math.max(vw*1.95,vw+520),920,2400);
  var columns=paperW>=1120?4:paperW>=760?3:paperW>=500?2:1;
  var gap=clamp(Math.round(paperW*(columns>=4?0.0065:columns===3?0.0085:0.0115)),6,14);
  var colW=(paperW-gap*(columns-1))/columns;
  var hM=Math.max(vw*0.86,280);
  var vM=Math.max(vh*0.82,220);
  var colH=[];for(var i=0;i<columns;i++)colH.push(vM);

  // 打乱
  var entries=[];
  for(var li=0;li<lines.length;li++){
    var t=lines[li].text||'';if(!countGraphemes(t))continue;
    entries.push({line:lines[li],index:li});
  }
  var sk=paperW+':'+vh;
  entries.sort(function(a,b){
    return seeded(sk+':'+a.index+':'+(a.line.text||''))-seeded(sk+':'+b.index+':'+(b.line.text||''));
  });

  // 强制hero
  var forcedHero=-1,hasNatural=false;
  for(var ei=0;ei<entries.length;ei++){
    if(naturalVariant(entries[ei].line,ei,entries.length)==='hero'){hasNatural=true;break}
  }
  if(!hasNatural&&entries.length>0){
    var best=-1;
    for(var ei=0;ei<entries.length;ei++){
      var gc=countGraphemes(entries[ei].line.text||'');
      if(gc<4||gc>36)continue;
      var ctr=1-Math.abs(ei-entries.length/2)/Math.max(entries.length,1);
      var sc2=ctr*0.62+((gc>=6&&gc<=22)?1:(gc<=28?0.72:0.36))*0.34+(entries[ei].line.isChorus?0.28:0);
      if(sc2>best){best=sc2;forcedHero=ei}
    }
  }

  var bodyTie=0,heroTie=0;
  for(var ei=0;ei<entries.length;ei++){
    var e=entries[ei],line=e.line,text=line.text||'',gc=countGraphemes(text);
    var variant=forcedHero===ei?'hero':naturalVariant(line,ei,entries.length);
    var density=gc+((line.words?line.words.length:1)*1.4);
    var base=variant==='hero'?paperW/Math.max(Math.sqrt(density)*1.5,4.5):paperW/Math.max(Math.sqrt(density)*2.25,7);
    var fontPx=variant==='hero'?clamp(base,CFG.heroFontMin,CFG.heroFontMax):clamp(base,CFG.bodyFontMin,CFG.bodyFontMax);
    var lh=Math.round(fontPx*(variant==='hero'?1.02:1.06));
    var fw=variant==='hero'?CFG.heroWeight:CFG.bodyWeight;

    // hero跨列, body占一列
    var hs=variant==='hero'?Math.min(columns,columns<=1?1:2):1;
    var bw;
    if(variant==='hero'){
      bw=hs===1?paperW:(columns===2?colW*1.5+gap*0.5:hs*colW+(hs-1)*gap);
    }else{
      bw=colW;
    }

    // 放置: body最短列优先, hero找最矮跨列区间
    var tc=0,mh=colH[0];
    if(variant==='hero'&&hs>1){
      var bestH=Infinity,bestC=0;
      for(var sc=0;sc<=columns-hs;sc++){
        var maxH2=0;
        for(var ci=sc;ci<sc+hs;ci++)maxH2=Math.max(maxH2,colH[ci]);
        if(maxH2<bestH){bestH=maxH2;bestC=sc}
      }
      tc=bestC;
    }else{
      for(var ci=1;ci<columns;ci++){if(colH[ci]<mh){mh=colH[ci];tc=ci}}
    }

    var x=hM+tc*(colW+gap),y=colH[tc];
    var bg=variant==='hero'?Math.max(Math.round(lh*0.2),6):Math.max(Math.round(lh*0.08),2);

    blocks.push({lineIndex:e.index,text:text,variant:variant,x:x,y:y,
      width:bw,height:lh+16,fontPx:fontPx,fontWeight:fw,lineHeight:lh,
      startTime:Number(line.time_ms||line.time||0),
      endTime:Number(line.time_ms||line.time||0)+Number(line.duration_ms||line.duration||4000),
      graphemes:text.split(''),charTimings:buildCharTimings(text,line)});

    // 更新列高
    for(var ci=tc;ci<tc+hs;ci++)colH[ci]=y+lh+16+bg;
  }
  // 居中
  var maxH=0;for(var i=0;i<colH.length;i++)if(colH[i]>maxH)maxH=colH[i];
  var off=(maxH+vM-vh)/2;
  for(var i=0;i<blocks.length;i++)blocks[i].y-=off;

  // 建立时间索引→块的映射
  blockByLineIndex={};
  for(var i=0;i<blocks.length;i++)blockByLineIndex[blocks[i].lineIndex]=blocks[i];
}

function naturalVariant(line,index,total){
  var gc=countGraphemes(line.text||'');if(gc===0)return'body';
  if(line.isChorus&&gc<=22)return'hero';
  var se=gc>=4&&gc<=28,ct=Math.abs(index-total/2)/Math.max(total,1);
  var r=seeded((line.text||'')+':'+index);
  return(se&&ct<0.72&&((index+1)%6===0||r>0.965))?'hero':'body';
}

function buildCharTimings(text,line){
  var st=Number(line.time_ms||line.time||0),dur=Number(line.duration_ms||line.duration||4000);
  var ch=text.split(''),n=ch.length;if(!n)return[];
  var u=dur/n,r=[];
  for(var i=0;i<n;i++)r.push({char:ch[i],startTime:st+u*i,endTime:st+u*(i+1)});
  return r;
}

// ===== 相机 =====
function updateCamera(dt){
  if(!blocks.length)return;
  var vw=W/dpr,vh=H/dpr;

  var activeIdx=-1;
  for(var i=0;i<lines.length;i++){
    var lt=lines[i];
    var startMs=Math.max(0,Math.round(Number(lt.time_ms||0)));
    var endMs=i+1<lines.length?Math.max(0,Math.round(Number(lines[i+1].time_ms||0))):startMs+4800;
    if(currentTimeMs>=startMs&&currentTimeMs<endMs){activeIdx=i;break}
  }
  var activeBlock=activeIdx>=0?blockByLineIndex[activeIdx]:null;
  if(!activeBlock){
    for(var i=lines.length-1;i>=0;i--){
      var lt=lines[i];
      var startMs=Math.max(0,Math.round(Number(lt.time_ms||0)));
      if(currentTimeMs>=startMs){activeBlock=blockByLineIndex[i];break}
    }
  }

  // 总览
  var lastBlock=null;
  var lastEndTime=-1;
  for(var i=0;i<blocks.length;i++){
    if(blocks[i].endTime>lastEndTime){lastEndTime=blocks[i].endTime;lastBlock=blocks[i]}
  }
  if(activeBlock&&lastBlock&&activeBlock===lastBlock){
    var p=(currentTimeMs-activeBlock.startTime)/Math.max(activeBlock.endTime-activeBlock.startTime,1);
    isOverviewMode=p>CFG.overviewThreshold;
    overviewProgress=isOverviewMode?clamp((p-CFG.overviewThreshold)/(1-CFG.overviewThreshold),0,1):0;
  }else{isOverviewMode=false;overviewProgress=0}

  // 重定向
  var didRetarget=false;
  var activeLineIdx=activeBlock?activeBlock.lineIndex:-1;
  if(activeLineIdx!==lastActiveBlockIdx){lastActiveBlockIdx=activeLineIdx;retargetStartMs=performance.now();didRetarget=true}
  var retElapsed=Math.max(performance.now()-retargetStartMs,0);
  var retPhase=clamp(retElapsed/200,0,1);
  var retBoost=1-easeOutCubic(retPhase);

  var tgtX=camFocusX,tgtY=camFocusY,tgtS=camFocusScale;

  if(isOverviewMode){
    var minY=Infinity,maxY=-Infinity,minX=Infinity,maxX=-Infinity;
    for(var i=0;i<blocks.length;i++){
      var b=blocks[i];if(b.y<minY)minY=b.y;if(b.y+b.height>maxY)maxY=b.y+b.height;
      if(b.x<minX)minX=b.x;if(b.x+b.width>maxX)maxX=b.x+b.width;
    }
    tgtX=(minX+maxX)/2;tgtY=(minY+maxY)/2;
    tgtS=clamp(Math.min(vw/(maxX-minX+200),vh/(maxY-minY+200))*0.85,CFG.overviewScale,0.72);
  }else if(activeBlock){
    var ab=activeBlock;
    var px=ab.x;
    var lp=clamp((currentTimeMs-ab.startTime)/Math.max(ab.endTime-ab.startTime,1),0,1);
    var fi=lp*ab.charTimings.length;
    var bi=clamp(Math.floor(fi),0,ab.charTimings.length-1);
    var fc=fi-bi;
    ctx.save();
    ctx.font=ab.fontWeight+' '+ab.fontPx+'px '+(window.foliaGetLyricFontFamily?window.foliaGetLyricFontFamily():'"Inter","PingFang SC","Microsoft YaHei","Noto Sans CJK SC",system-ui,sans-serif');
    for(var pi=0;pi<bi;pi++)px+=ctx.measureText(ab.charTimings[pi].char).width;
    if(bi<ab.charTimings.length-1&&fc>0){
      px+=ctx.measureText(ab.charTimings[bi].char).width+ctx.measureText(ab.charTimings[bi+1].char).width*fc;
    }else if(bi<ab.charTimings.length){
      px+=ctx.measureText(ab.charTimings[bi].char).width*0.5;
    }
    ctx.restore();
    tgtX=px;tgtY=ab.y+ab.height/2;
    var minSide=Math.max(Math.min(vw,vh),1);
    var tgtLH=clamp(minSide*0.115,64,124);
    tgtS=clamp(tgtLH/Math.max(ab.lineHeight,1),0.88,2.2);
  }

  // 入场偏置
  if(retBoost>0.01&&activeBlock){
    var eb=Math.pow(retBoost,0.58)*0.6;
    tgtX=lerp(tgtX,activeBlock.x,eb);
  }

  // 浮动
  var now=performance.now()/1000;
  var oa=isOverviewMode?0.36:1;
  var fx=Math.sin(now/CFG.floatingPeriod*Math.PI*2*0.74+0.8)*CFG.floatingDistance*0.34;
  var fy=(Math.sin(now/CFG.floatingPeriod*Math.PI*2)*CFG.floatingDistance+Math.sin(now/(CFG.floatingPeriod*1.3)*Math.PI*2+1.1)*CFG.floatingDistance*0.22)*oa;
  tgtX-=fx/Math.max(tgtS,0.001);tgtY-=fy/Math.max(tgtS,0.001);
  tgtS=clamp(tgtS*(1+Math.sin(now+0.9)*CFG.floatingScaleAmp*oa),0.22,2.24);

  // 弹簧
  var k=isOverviewMode?0.03:0.045;
  k+=retBoost*0.08;
  camFocusX+=(tgtX-camFocusX)*(1-Math.exp(-dt*mix2(11.2,18,retBoost)));
  camFocusY+=(tgtY-camFocusY)*(1-Math.exp(-dt*mix2(11.2,18,retBoost)));
  camFocusScale+=(tgtS-camFocusScale)*(1-Math.exp(-dt*mix2(5.4,10,retBoost)));
  camX=lerp(camX,camFocusX,k);camY=lerp(camY,camFocusY,k);camScale=lerp(camScale,camFocusScale,k*0.8);
}
function mix2(a,b,t){return a+(b-a)*t}

// ===== 渲染 =====
function render(){
  if(!ctx||!blocks.length)return;
  var vw=W/dpr,vh=H/dpr;
  ctx.save();ctx.scale(dpr,dpr);
  var cx=vw/2-camX*camScale,cy=vh/2-camY*camScale;
  ctx.translate(cx,cy);ctx.scale(camScale,camScale);

  for(var i=0;i<blocks.length;i++){
    var b=blocks[i];
    var sx=b.x*camScale+cx,sy=b.y*camScale+cy;
    if(sx+b.width*camScale<-200||sx>vw+200||sy+b.height*camScale<-200||sy>vh+200)continue;

    var state='waiting',sp=0;
    if(currentTimeMs>=b.startTime&&currentTimeMs<=b.endTime){state='active';sp=(currentTimeMs-b.startTime)/Math.max(b.endTime-b.startTime,1)}
    else if(currentTimeMs>b.endTime){state='passed';sp=Math.min(1,(currentTimeMs-b.endTime)/2000)}

    var alpha;
    if(state==='waiting')alpha=b.variant==='hero'?CFG.heroWaitAlpha:CFG.bodyWaitAlpha;
    else if(state==='active'){var ta=b.variant==='hero'?CFG.heroActiveAlpha:CFG.bodyActiveAlpha;alpha=lerp(b.variant==='hero'?CFG.heroWaitAlpha:CFG.bodyWaitAlpha,ta,clamp(sp*3,0,1))}
    else{var ta2=b.variant==='hero'?CFG.heroPassedAlpha:CFG.bodyPassedAlpha;alpha=lerp(b.variant==='hero'?CFG.heroActiveAlpha:CFG.bodyActiveAlpha,ta2,sp)}

    var color;
    if(state==='active')color=lerpColor(CFG.accentColor,CFG.primaryColor,clamp(sp*2,0,1)*0.3);
    else if(state==='passed')color=lerpColor(CFG.accentColor,CFG.primaryColor,clamp(0.3+sp*0.7,0,1));
    else color=CFG.primaryColor;

    var gA=0,gS=0;
    if(state==='active'){
      var ge=delayedGlowEnvelope(sp,0.8);
      gA=(b.variant==='hero'?0.16:0.12)+ge*(b.variant==='hero'?0.26:0.2)*CFG.glowIntensity;
      gS=(b.variant==='hero'?12:8)+ge*b.fontPx*(b.variant==='hero'?0.7:0.52)*CFG.glowIntensity;
    }

    ctx.font=b.fontWeight+' '+b.fontPx+'px '+(window.foliaGetLyricFontFamily?window.foliaGetLyricFontFamily():'"Inter","PingFang SC","Microsoft YaHei","Noto Sans CJK SC",system-ui,sans-serif');
    ctx.textBaseline='top';ctx.textAlign='left';
    var charX=b.x,charY=b.y;
    for(var ci=0;ci<b.charTimings.length;ci++){
      var ch=b.charTimings[ci],cA=alpha,cC=color;
      if(state==='active'){
        var cp=clamp((currentTimeMs-ch.startTime)/Math.max(ch.endTime-ch.startTime,1),0,1);
        var printed=currentTimeMs>=ch.endTime;var frontier=currentTimeMs>=ch.startTime&&!printed;
        if(printed){var tp=clamp((currentTimeMs-ch.endTime)/(CFG.colorTrailDuration*1000),0,1);cC=lerpColor(CFG.accentColor,CFG.primaryColor,tp*0.3)}
        else if(frontier){cA=lerp(CFG.bodyWaitAlpha,alpha,cp);cC=lerpColor(CFG.primaryColor,CFG.accentColor,cp*0.8)}
        else cA=b.variant==='hero'?CFG.heroWaitAlpha:CFG.bodyWaitAlpha;
      }
      if(gA>0.01&&cA>0.05){ctx.shadowColor='rgba(255,180,50,'+(gA*cA)+')';ctx.shadowBlur=gS}
      else{ctx.shadowColor='transparent';ctx.shadowBlur=0}
      var r=parseInt(cC.slice(1,3),16)||255,g=parseInt(cC.slice(3,5),16)||255,bl=parseInt(cC.slice(5,7),16)||255;
      ctx.fillStyle='rgba('+r+','+g+','+bl+','+cA+')';
      ctx.fillText(ch.char,charX,charY);
      // 打印戳记
      if(CFG.showPrintStamp&&state==='active'&&cA>0.1){
        var fr2=currentTimeMs>=ch.startTime&&currentTimeMs<ch.endTime;
        if(fr2){
          var age=(currentTimeMs-ch.startTime)/1000;
          var sa=clamp(1-age/CFG.printStampDuration,0,1);
          if(sa>0.01){
            var cw=ctx.measureText(ch.char).width;
            var sw=cw+b.fontPx*0.12,sh2=b.fontPx*0.62;
            var dd=b.lineHeight*(b.variant==='hero'?0.24:0.2);
            var dp=easeOutCubic(clamp(age/0.08,0,1));
            var pulse=lerp(0.18,1,Math.pow(dp,0.78));
            var fade=Math.pow(1-easeInOutCubic(clamp(age/CFG.printStampDuration,0,1)),1.2);
            var ba=pulse*fade*(b.variant==='hero'?0.82:0.72);
            var bb=(8+b.fontPx*0.24)*pulse*CFG.glowIntensity;
            var stx=charX+cw*0.5-sw*0.5;
            var sty=charY-b.fontPx*0.38-lerp(dd,0,dp);
            ctx.save();ctx.shadowBlur=bb;ctx.shadowColor='rgba(255,180,50,'+(0.56*pulse)+')';
            ctx.fillStyle='rgba(255,180,50,'+(ba*cA)+')';
            ctx.fillRect(stx,sty-sh2*0.5,sw,sh2);ctx.restore();
          }
        }
      }
      charX+=ctx.measureText(ch.char).width;
    }
    ctx.shadowColor='transparent';ctx.shadowBlur=0;
  }
  ctx.restore();
}

function tick(now){
  var dt=(now-lastFrameTime)/1000;lastFrameTime=now;
  if(dt>0.1)dt=0.016;
  updateCamera(dt);
  if(!ctx){animFrame=requestAnimationFrame(tick);return}
  ctx.clearRect(0,0,W,H);
  drawBg(now*0.001);
  render();
  animFrame=requestAnimationFrame(tick);
}

function init(container){
  containerEl=container;container.innerHTML='';
  canvas=document.createElement('canvas');
  canvas.style.cssText='width:100%;height:100%;display:block;';
  container.appendChild(canvas);ctx=canvas.getContext('2d');
  resize();buildBgScene();
  window.addEventListener('resize',function(){resize();buildBgScene()});
  lastFrameTime=performance.now();animFrame=requestAnimationFrame(tick);
}
function resize(){
  if(!canvas)return;
  dpr=window.devicePixelRatio||1;W=canvas.clientWidth*dpr;H=canvas.clientHeight*dpr;
  canvas.width=W;canvas.height=H;
  if(blocks.length)buildLayout();
}
function setLyrics(ll){
  lines=ll||[];buildLayout();
  if(blocks.length){
    camX=blocks[0].x+blocks[0].width/2;camY=blocks[0].y+blocks[0].height/2;
    camFocusX=camX;camFocusY=camY;camScale=1.18;camFocusScale=1.18;
    lastActiveBlockIdx=-2;retargetStartMs=performance.now();
  }
}
function update(t,p){currentTimeMs=t||0;isPlaying=p}
function setAudio(r,b,m,t){window._fumeAudioBass=b||0;window._fumeAudioMid=m||0;window._fumeAudioTreble=t||0}
function destroy(){
  if(animFrame){cancelAnimationFrame(animFrame);animFrame=null}
  window.removeEventListener('resize',resize);
  if(containerEl)containerEl.innerHTML='';
  canvas=null;ctx=null;containerEl=null;blocks=[];lines=[];bgShapes=[];bgSparkShapes=[];
  camX=0;camY=0;camScale=1.18;isOverviewMode=false;overviewProgress=0;lastActiveBlockIdx=-2;
}

window.FumeMode={init:init,setLyrics:setLyrics,update:update,destroy:destroy,resize:resize,setAudio:setAudio};
})();