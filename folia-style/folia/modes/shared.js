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
  }
};
})();
