// 莫奈模式 - 歌词扫过动画
(function(){
'use strict';

var active=false;
var state={artist:'',title:'',album:'',coverUrl:'',lines:[],currentIndex:-1,currentTimeMs:0,isPlaying:false};
var container,rail,artistEl,titleEl,albumEl,coverImg,audioCanvas;

function ensureDOM(){
  container=document.getElementById('monet-container');
  rail=document.getElementById('monet-rail');
  artistEl=document.getElementById('monet-artist');
  titleEl=document.getElementById('monet-title');
  albumEl=document.getElementById('monet-album');
  coverImg=document.getElementById('monet-cover-img');
  audioCanvas=document.getElementById('monet-audio-canvas');
}

function buildBackground(url){
  if(!url)return;
  var bg=document.getElementById('monet-bg');
  if(bg){bg.style.backgroundImage='url('+url+')';bg.classList.add('active');}
}

function updateSongInfo(){
  if(artistEl)artistEl.textContent=state.artist||'';
  if(titleEl)titleEl.textContent=state.title||'';
  if(albumEl)albumEl.textContent=state.album||'';
  if(coverImg&&state.coverUrl){coverImg.src=state.coverUrl;coverImg.style.opacity='1';}
  buildBackground(state.coverUrl);
}

// 渲染歌词
function renderLyrics(){
  if(!rail)return;
  var lines=state.lines;
  if(!lines.length){rail.innerHTML='';return;}

  var t=state.currentTimeMs;
  var idx=state.currentIndex;
  if(idx<0||idx>=lines.length){
    for(var i=lines.length-1;i>=0;i--){if(t>=lines[i].time_ms){idx=i;break;}}
    if(idx<0)idx=0;
    state.currentIndex=idx;
  }

  rail.innerHTML='';
  var start=Math.max(0,idx-2);
  var end=Math.min(lines.length-1,idx+2);

  for(var i=start;i<=end;i++){
    var line=lines[i];
    var isAct=i===idx;
    var dist=Math.abs(i-idx);

    var wrap=document.createElement('div');
    var fontSize=isAct?42:33;
    var opacity=isAct?1:Math.max(0.25,0.6-dist*0.15);
    var blur=isAct?0:0.5+dist*0.6;
    var fontWeight=isAct?'600':'400';

    // 行容器 - 不使用 translateX，保持左对齐
    wrap.style.cssText='margin:6px 0;padding:4px 0;'
      +'transition:opacity 0.5s ease,filter 0.5s ease;'
      +'font-size:'+fontSize+'px;font-weight:'+fontWeight+';'
      +'opacity:'+opacity+';'
      +'filter:blur('+blur+'px);'
      +'text-align:left;';

    // 主文本 - 逐字扫过
    var textStr=line.text||'';
    var lineStart=line.time_ms||0;
    var lineDur=line.duration_ms||4000;
    var totalChars=textStr.length;

    for(var c=0;c<totalChars;c++){
      var chSpan=document.createElement('span');
      chSpan.textContent=textStr[c];
      chSpan.style.cssText='display:inline;transition:color 0.2s ease,text-shadow 0.2s ease;';

      if(isAct){
        var charStart=lineStart+(c/totalChars)*lineDur;
        var charEnd=lineStart+((c+1)/totalChars)*lineDur;

        if(t>=charEnd){
          chSpan.style.color='rgba(255,255,255,0.95)';
        }else if(t>=charStart){
          var p=(t-charStart)/(charEnd-charStart);
          var ep=1-Math.pow(1-p,3);
          chSpan.style.color='rgba(255,255,255,'+(0.35+ep*0.6)+')';
          chSpan.style.textShadow='0 0 '+(8+ep*12)+'px rgba(255,255,255,'+(ep*0.6)+')';
        }else{
          chSpan.style.color='rgba(255,255,255,0.35)';
        }
      }else{
        chSpan.style.color='rgba(255,255,255,0.35)';
      }
      wrap.appendChild(chSpan);
    }

    // 副歌词
    if(isAct&&line.secondary){
      var sec=document.createElement('div');
      sec.style.cssText='font-size:clamp(0.85rem,1.1vw,1.05rem);color:rgba(255,255,255,0.5);font-weight:500;margin-top:4px;'
        +'animation:monet-slideUp 0.28s ease 0.1s forwards;opacity:0;transform:translateY(8px);';
      sec.textContent=line.secondary;
      wrap.appendChild(sec);
    }

    rail.appendChild(wrap);
  }
}

function drawSpectrum(){
  if(!audioCanvas)return;
  var ctx=audioCanvas.getContext('2d');
  if(!ctx)return;
  audioCanvas.width=audioCanvas.clientWidth*2;
  audioCanvas.height=audioCanvas.clientHeight*2;
  ctx.scale(2,2);
  var cw=audioCanvas.clientWidth,ch=audioCanvas.clientHeight;
  ctx.clearRect(0,0,cw,ch);
  var bs=window._monetBridgeState||{};
  var rms=bs.rms||0,bass=bs.bass||0,mid=bs.mid||0,treble=bs.treble||0;
  var energy=Math.min(1,Math.max(0.08,rms/200));
  var cnt=72,gap=cw/cnt;
  ctx.fillStyle='rgba(234,179,8,0.9)';
  for(var i=0;i<cnt;i++){
    var si=i/(cnt-1);
    var bv=si<0.33?bass/200:si<0.66?mid/200:treble/200;
    var pulse=Math.sin(i*0.45+performance.now()*0.006)*0.5+0.5;
    var env=Math.sin(si*Math.PI);
    var bh=ch*(0.02+(energy*0.04+bv*0.82+pulse*0.02)*env);
    ctx.fillRect(i*gap+gap*0.14,ch-bh,Math.max(1.35,gap*0.34),bh);
  }
}

function tick(){
  if(!active)return;
  renderLyrics();
  drawSpectrum();
  requestAnimationFrame(tick);
}

window.ModeMonet={
  activate:function(){
    ensureDOM();
    if(!container)return;
    active=true;
    container.style.display='';
    var gl=document.getElementById('geo-layer');if(gl)gl.style.display='none';
    var cg=document.querySelector('.center-glow');if(cg)cg.style.display='none';
    var bs=window._monetBridgeState||{};
    if(bs.artist!=null)state.artist=bs.artist;
    if(bs.title!=null)state.title=bs.title;
    if(bs.album!=null)state.album=bs.album;
    if(bs.coverUrl!=null)state.coverUrl=bs.coverUrl;
    updateSongInfo();
    requestAnimationFrame(tick);
  },
  deactivate:function(){
    active=false;
    if(container)container.style.display='none';
    var gl=document.getElementById('geo-layer');if(gl)gl.style.display='';
    var cg=document.querySelector('.center-glow');if(cg)cg.style.display='';
  },
  update:function(timeMs){
    if(!active)return;
    state.currentTimeMs=timeMs;
    var lines=state.lines;
    if(!lines.length)return;
    var newIdx=-1;
    for(var i=lines.length-1;i>=0;i--){if(timeMs>=lines[i].time_ms){newIdx=i;break;}}
    if(newIdx<0)newIdx=0;
    state.currentIndex=newIdx;
  },
  syncState:function(s){
    if(s.lines!=null)state.lines=s.lines;
    if(s.currentIndex!=null)state.currentIndex=s.currentIndex;
    if(s.artist!=null)state.artist=s.artist;
    if(s.title!=null)state.title=s.title;
    if(s.album!=null)state.album=s.album;
    if(s.coverUrl!=null)state.coverUrl=s.coverUrl;
    if(s.isPlaying!=null)state.isPlaying=s.isPlaying;
    if(s.currentTimeMs!=null)state.currentTimeMs=s.currentTimeMs;
    updateSongInfo();
    if(s.lines&&s.lines.length>0){
      if(state.currentIndex<0)state.currentIndex=0;
      renderLyrics();
    }
  }
};
})();
