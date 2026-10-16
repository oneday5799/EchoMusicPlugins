/*!9c81c304fdb4cdf7*/

const __b927766acc=(18458474);
const __f74c3e92b2=(__b927766acc^26093)>>>0;
const __e6b8556a12=(__f74c3e92b2^65211)>>>0;
const __3d67672fa4=(__e6b8556a12^55157)>>>0;
if(__3d67672fa4===-1)globalThis["__2a5fe586"]=1;
var Ee=`
.local-music-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

/*
 * \u539F\u751F\u80F6\u56CA Tab \u7684\u5BBD\u5EA6\u5FC5\u987B\u6536\u7A84\u3002
 * \u5BBF\u4E3B CustomTabBar \u9ED8\u8BA4 width:100%\uFF0C\u4E24\u4E2A tab \u4F1A\u88AB\u62C9\u6210\u5404\u5360\u534A\u884C\u3001
 * \u767D\u8272\u836F\u4E38\u5DE8\u5927\u4E14\u6587\u5B57\u5C45\u4E2D\u504F\u79FB\uFF1B\u539F\u751F\u9875\u9762\uFF08\u63D2\u4EF6\u7BA1\u7406 / Home / \u641C\u7D22\u9875\u7B49\uFF09\u90FD\u662F\u7ED9\u4E00\u4E2A
 * \u56FA\u5B9A\u5BBD\u5EA6\u8BA9\u836F\u4E38\u8D34\u5408\u5185\u5BB9\uFF0C\u4E24\u4E2A tab \u65F6\u53D6 280px\uFF08\u4E0E\u300C\u5DF2\u5B89\u88C5 / \u5728\u7EBF\u63D2\u4EF6\u300D\u4E00\u81F4\uFF09\u3002
 */
.local-music-tabbar {
  --custom-tab-width: 280px;
  max-width: 100%;
}

/* Tab \u6587\u5B57\uFF1A\u8FC7\u957F\u65F6\u7701\u7565\uFF0C\u907F\u514D\u6491\u7834\u56FA\u5B9A\u5BBD\u5EA6\uFF08\u5BF9\u9F50\u539F\u751F plugin-view-tab-label\uFF09 */
.local-music-tab-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.local-music-hint {
  padding: 60px 24px;
  text-align: center;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.local-music-hint-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-main);
  margin: 0 0 6px;
}

.local-music-hint-desc {
  margin: 0;
  line-height: 1.6;
}

.local-music-folders {
  display: grid;
  gap: 6px;
  padding: 16px 0;
}

.local-music-folder {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 10px;
  background: var(--bg-info-card, transparent);
  border: 1px solid var(--border-subtle);
}

.local-music-folder-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-main);
}

.local-music-folder-path {
  font-size: 12px;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* \u5934\u90E8\u8BE6\u60C5\u91CC\u7684\u300C\u8BBE\u7F6E\u300D\u5165\u53E3\uFF1A\u4E0E\u4E3B\u5E94\u7528\u8BE6\u60C5\u9875\u7684\u6587\u5B57\u94FE\u98CE\u683C\u4E00\u81F4 */
.local-music-text-btn {
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  color: var(--color-primary-text);
  cursor: pointer;
  transition: opacity var(--motion-duration-fast, 150ms) ease;
}

.local-music-text-btn:hover {
  opacity: 0.78;
}

/* \u76EE\u5F55\u9009\u62E9\u63A7\u4EF6\uFF1A\u4E0E\u641C\u7D22\u6846\u540C\u9AD8\uFF0C\u5BBD\u5EA6\u6309\u5185\u5BB9\u81EA\u9002\u5E94 */
.local-music-directory-select {
  width: 132px;
  flex-shrink: 0;
}

/* \u2500\u2500\u2500 \u4E13\u8F91\u5361\u7247 \u2500\u2500\u2500 */
.local-music-albums {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 18px;
  padding: 16px 0;
}

.local-music-album-card {
  display: grid;
  gap: 8px;
  padding: 0;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  min-width: 0;
}

.local-music-album-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: var(--radius-media, 8px);
  overflow: hidden;
  background: var(--control-muted-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  box-shadow: var(--shadow-cover);
  transition: transform var(--motion-duration-fast, 150ms) ease;
}

.local-music-album-card:hover .local-music-album-cover {
  transform: translateY(-2px);
}

.local-music-album-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.local-music-album-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.local-music-album-count {
  font-size: 11px;
  color: var(--color-text-secondary);
}
`,ke=`
.song-context-menu .song-context-item.local-music-hidden {
  display: none !important;
}

.song-context-menu .song-context-separator:has(+ .local-music-hidden) {
  display: none !important;
}
`;var x=[],W=!1,de=()=>{W=!0};var B=[],X=e=>{B=e},J=[],fe=e=>{J=e},Z="__all__",pe=e=>{Z=String(e||"__all__")},ee=new Map,De=e=>ee.get(String(e))||"",me=(e,t)=>{ee.set(String(e),t)},Fe=()=>ee.clear(),K=0,te=()=>(K+=1,K),_=()=>K,Ct=new Set;/*93f10ac0*/var v={loading:!1,count:0,message:"",progress:null},Pe=e=>(v=e.reactive({loading:!1,count:0,message:"",progress:null}),v),_t=null;var Me=()=>{K+=1,x=[],W=!1,B=[],J=[],Z="__all__",_t=null,v.loading=!1,v.count=0,v.message="",v.progress=null,Ct.clear(),ee.clear()};var Lt=2e4,ge=e=>{let t=e.lastIndexOf(".");return t>0?e.slice(0,t):e},Tt=e=>{let t=ge(e).replace(/^\d+\s*[.\-]\s*/,"").trim(),n=t.indexOf(" - ");return n>0&&n<t.length-3?{title:t.slice(n+3).trim(),artist:t.slice(0,n).trim()}:{title:t,artist:""}},Ut=e=>{let t=new Map;for(let n of e){if(n.kind!=="lyric")continue;let r=ge(n.name).toLowerCase();(!t.get(r)||n.name.toLowerCase().endsWith(".lrc"))&&t.set(r,n)}return t},It=e=>{let t=5381;for(let n=0;n<e.length;n+=1)t=(t<<5)-t+e.charCodeAt(n)|0;return`local_${Math.abs(t).toString(36)}`},At=e=>{let t=2166136261,n=3421674724;for(let r=0;r<e.length;r+=1){let o=e.charCodeAt(r);t=Math.imul(t^o,16777619)>>>0,n=Math.imul(n^o+r,2246822507)>>>0}return`lmlocal${t.toString(16).padStart(8,"0")}${n.toString(16).padStart(8,"0")}`},Et=(e,t,n)=>{let{title:r,artist:o}=Tt(e.name),a=It(e.path),i=t.get(ge(e.name).toLowerCase());return{id:a,title:r,name:r,artist:o,artists:o?[{name:o}]:[],album:n,duration:0,coverUrl:"",audioUrl:e.url,hash:At(e.path),mixSongId:a,source:"local-music",_path:e.path,_lyricPath:i?i.path:"",_noEmbedded:!1}},kt=e=>{let t=new Set;for(let n of e){let r=String(n.relativePath||"").split("/");r.pop();let o="";for(let a of r)o=o?`${o}/${a}`:a,t.add(o)}return[...t].sort((n,r)=>n.localeCompare(r,"zh-Hans-CN"))},Dt=async(e,t)=>{let n=await e.fs.listFiles(t.path,{recursive:!0,kinds:["audio","lyric"],limit:Lt});if(!n?.ok)throw new Error(n?.error||"\u6587\u4EF6\u5939\u8BFB\u53D6\u5931\u8D25");let r=Ut(n.files);return{songs:n.files.filter(a=>a.kind==="audio").map(a=>Et(a,r,t.name)),directories:kt(n.files),limitReached:!!n.limitReached}},Re=async(e,t,n)=>{let r=_(),o=[],a=new Set,i=!1;for(let l=0;l<t.length;l+=1){if(_()!==r)return null;let s=t[l];try{let f=await Dt(e,s);o.push(...f.songs);for(let c of f.directories)a.add(`${s.name}/${c}`);f.limitReached&&(i=!0)}catch(f){console.warn("[local-music] \u626B\u63CF\u6587\u4EF6\u5939\u5931\u8D25\uFF1A",s.path,f?.message||f)}n?.(l+1,t.length)}return _()!==r?null:{songs:o,directories:[...a].sort((l,s)=>l.localeCompare(s,"zh-Hans-CN")),limitReached:i}};var Be=(e,t)=>t===0?new TextDecoder("latin1").decode(e):t===3?new TextDecoder("utf-8").decode(e):t===1?e.length>=2&&e[0]===255&&e[1]===254?new TextDecoder("utf-16le").decode(e.subarray(2)):e.length>=2&&e[0]===254&&e[1]===255?new TextDecoder("utf-16be").decode(e.subarray(2)):new TextDecoder("utf-16le").decode(e):new TextDecoder("utf-16be").decode(e),ve=(e,t,n)=>{if(n===1||n===2){for(let a=t;a+1<e.length;a+=2)if(e[a]===0&&e[a+1]===0)return[a,a+2];return[e.length,e.length]}let o=e.indexOf(0,t);return o<0?[e.length,e.length]:[o,o+1]},he=(e,t)=>(e[t]&127)<<21|(e[t+1]&127)<<14|(e[t+2]&127)<<7|e[t+3]&127,Ft=(e,t)=>(e[t]<<24|e[t+1]<<16|e[t+2]<<8|e[t+3])>>>0,Pt=e=>{if(e.length<10||e[0]!==73||e[1]!==68||e[2]!==51)return null;let t=e[3];if(t<2||t>4)return null;let n={title:"",artist:"",album:"",lyric:"",cover:null},r=10;t>=3&&(e[5]&64)===64&&(r+=4+he(e,r));let o=Math.min(r+he(e,6),e.length);for(;r+6<=o;){let a,i;if(t===2?(a=String.fromCharCode(e[r],e[r+1],e[r+2]),i=e[r+3]<<16|e[r+4]<<8|e[r+5],r+=6):(a=String.fromCharCode(e[r],e[r+1],e[r+2],e[r+3]),i=t===4?he(e,r+4):Ft(e,r+4),r+=10),i<=0||r+i>o)break;let l=e.subarray(r,r+i),s=t===2&&{TT2:"TIT2",TP1:"TPE1",TAL:"TALB",ULT:"USLT",PIC:"APIC"}[a]||a;if(s==="TIT2"||s==="TPE1"||s==="TALB"){let f=l[0],c=Be(l.subarray(1),f).replace(/\0/g,"").trim();c&&!n[s==="TIT2"?"title":s==="TPE1"?"artist":"album"]&&(s==="TIT2"?n.title=c:s==="TPE1"?n.artist=c:n.album=c)}else if(s==="USLT"&&!n.lyric){let f=l[0],[,c]=ve(l,4,f);c<l.length&&(n.lyric=Be(l.subarray(c),f).replace(/\0/g,"").trim())}else if(s==="APIC"&&!n.cover){let f=Mt(l,t===2);f&&(n.cover=f)}r+=i}return n},Mt=(e,t)=>{let n=e[0],r=1,o="";if(t)o=`image/${String.fromCharCode(e[1],e[2],e[3]).toLowerCase()}`,r=4;else{let[l,s]=ve(e,r,0);o=new TextDecoder("latin1").decode(e.subarray(r,l)),r=s}r+=1;let[,a]=ve(e,r,n);if(a>=e.length)return null;let i=e.subarray(a);return i.length===0?null:{data:i,mime:o.startsWith("image/")?o:"image/jpeg"}},Rt=e=>{if(e.length<8||e[0]!==102||e[1]!==76||e[2]!==97||e[3]!==67)return null;let t={title:"",artist:"",album:"",lyric:"",cover:null},n=new DataView(e.buffer,e.byteOffset,e.byteLength),r=4,o=0;for(;r+4<=e.length&&o<4096;){o+=1;let a=e[r],i=(a&128)!==0,l=a&127,s=e[r+1]<<16|e[r+2]<<8|e[r+3];if(r+=4,s<=0||r+s>e.length||(l===4&&s>8?Bt(n,e,r,s,t):l===6&&s>32&&!t.cover&&(t.cover=Nt(n,e,r,s)),r+=s,i))break}return t},Bt=(e,t,n,r,o)=>{try{let a=0,i=e.getUint32(n+a,!0);a+=4+i;let l=e.getUint32(n+a,!0);a+=4;for(let s=0;s<l&&!(a+4>r);s+=1){let f=e.getUint32(n+a,!0);if(a+=4,a+f>r)break;let c=new TextDecoder("utf-8").decode(t.subarray(n+a,n+a+f)).replace(/\0/g,"");a+=f;let d=c.indexOf("=");if(d<=0)continue;let u=c.slice(0,d).toUpperCase(),p=c.slice(d+1).trim();p&&(u==="TITLE"&&!o.title?o.title=p:u==="ARTIST"&&!o.artist?o.artist=p:u==="ALBUM"&&!o.album?o.album=p:!o.lyric&&(u==="LYRICS"||u==="UNSYNCEDLYRICS"||u==="UNSYNCED LYRICS")&&(o.lyric=p))}}catch{}},Nt=(e,t,n,r)=>{try{let o=0;o+=4;let a=e.getUint32(n+o,!1);o+=4;let i=new TextDecoder("latin1").decode(t.subarray(n+o,n+o+a));o+=a;let l=e.getUint32(n+o,!1);o+=4+l+16;let s=e.getUint32(n+o,!1);if(o+=4,s>0&&o+s<=r&&i.startsWith("image/"))return{data:t.subarray(n+o,n+o+s),mime:i}}catch{}return null},re=async(e,t)=>{let n={title:"",artist:"",album:"",lyric:"",cover:null};try{let r=await e.fs.readFileBytes(t,{maxBytes:524288});if(!r?.ok||!r.data)return n;let o=new Uint8Array(r.data),a=Pt(o);if(a)return a;let i=Rt(o);return i||n}catch{return n}};var N=e=>{let t=String(e??"").toLowerCase();return t?t.replace(/[（(].*?[）)]/g,"").replace(/[【[].*?[】\]]/g,"").replace(/[^\p{L}\p{N}]/gu,"").trim():""},zt=(e,t)=>{let n=N(e),r=N(t);if(!n||!r)return 0;if(n===r)return 1;if(n.includes(r)||r.includes(n))return .85;let o=new Set(n),a=new Set(r),i=0;for(let s of o)a.has(s)&&(i+=1);let l=o.size+a.size-i;return l>0?i/l:0},Ht=(e,t)=>{let n=N(e),r=N(t);if(!n)return .5;if(!r)return 0;if(n===r)return 1;let o=String(e??"").split(/[/、&,]/).map(N).filter(Boolean),a=String(t??"").split(/[/、&,]/).map(N).filter(Boolean);for(let i of o)for(let l of a)if(i===l||i.includes(l)||l.includes(i))return .9;return 0},$t=(e,t)=>{if(!e||!t)return .5;let n=Math.abs(Number(e)-Number(t));return n<=5?1:n<=15?.5:0},Ot=e=>String(e?.Image??e?.image??e?.coverUrl??e?.cover??"").trim()||"",jt=e=>{let t=String(e?.FileHash??e?.filehash??e?.hash??"").trim();if(t)return t;for(let r of["HQ","SQ","Res"]){let o=String(e?.[r]?.Hash??"").trim();if(o)return o}let n=Array.isArray(e?.relateGoods)?e.relateGoods:[];for(let r of n){let o=String(r?.hash||"").trim();if(o)return o}return""},Vt=e=>{let t=e&&typeof e=="object"?e:{},n=t.data&&typeof t.data=="object"?t.data:t,r=n?.candidates?.[0]??n?.info?.[0]??t?.candidates?.[0]??t?.info?.[0];if(!r)return null;let o=r.id??r.lyric_id??r.id_lrc,a=r.accesskey??r.accessKey;return!o||!a?null:{id:String(o),accesskey:String(a)}},qt=e=>{let t=e&&typeof e=="object"?e:{},n=t.data&&typeof t.data=="object"?t.data:t,r=n?.decodeContent??n?.lyric??n?.content??t?.decodeContent??t?.lyric;return String(r??"").replace(/^\uFEFF/,"").trim()},ye=async(e,t,n={})=>{let r={},o=String(t?.name||t?.title||"").trim();if(!o)return r;let a=e?.kugou;if(!a?.search?.search)return r;try{let i=String(t?.artist||"").trim(),l=[o,i].filter(Boolean).join(" "),s=await a.search.search(l,"song",1,10),f=s&&typeof s=="object"?s:{},c=f?.data?.lists??f?.data?.info??f?.lists??f?.info??[],d=Array.isArray(c)?c:[],u=null;for(let p of d){let g=String(p?.SongName||p?.songname||p?.FileName||""),S=String(p?.SingerName||p?.singername||(Array.isArray(p?.Singers)?p.Singers.map(A=>A?.name).join(", "):"")),C=Number(p?.Duration??p?.duration??0),b=.55*zt(o,g)+.3*Ht(i,S)+.15*$t(t?.duration,C);(!u||b>u.score)&&(u={score:b,item:p})}if(!u||u.score<.62)return r;if(r.matched=u.item,n.needCover){let p=Ot(u.item);p&&(r.coverUrl=p)}if(n.needLyric){let p=jt(u.item);if(p&&a.music){let g=await a.music.searchLyric(p,{duration:t?.duration?t.duration*1e3:void 0}),S=Vt(g);if(S&&typeof a.music.getLyric=="function"){let C=await a.music.getLyric(S.id,S.accesskey),b=qt(C);b&&(r.lyric=b)}}}}catch(i){console.warn("[local-music] \u5728\u7EBF\u8865\u5168\u5931\u8D25\uFF1A",i?.message||i)}return r};var j=6,M=new Map,oe=new Map,z=e=>M.get(String(e))||"",H=()=>{M.clear(),oe.clear(),Fe(),Kt()},ze=async(e,t)=>{try{let n=await e.fs.readTextFile(t,{encoding:"utf8",maxBytes:4194304});return n?.ok?String(n.content||"").replace(/^\uFEFF/,"").trim():""}catch{return""}},He=async(e,t)=>{if(!t?._path)return"";let n=String(t.id),r=M.get(n);if(r)return r;let o=oe.get(n);if(o)return o;let a=(async()=>{let i="";return t._lyricPath&&(i=await ze(e,t._lyricPath)),i||(i=(await re(e,t._path)).lyric),i&&M.set(n,i),i})().finally(()=>{oe.delete(n)});return oe.set(n,a),a},Gt=(e,t,n)=>{t.title&&t.title!==e.name&&(n.title=t.title,n.name=t.title),t.artist&&t.artist!==e.artist&&(n.artist=t.artist,n.artists=[{name:t.artist}]),t.album&&t.album!==e.album&&(n.album=t.album),Number(t.duration)>0&&Math.round(t.duration)!==e.duration&&(n.duration=Math.round(t.duration))},Qt=async e=>{let t=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(e));return Array.from(new Uint8Array(t)).map(n=>n.toString(16).padStart(2,"0")).join("").slice(0,16)},Yt=8*1024*1024,ae="covers",ne=null,ie=async e=>{if(ne)return ne;try{if(typeof e?.fs?.getPrivateDirectory!="function")return null;let t=await e.fs.getPrivateDirectory({kind:"cache"});return ne=t?.id?t:null,ne}catch{return null}},$e=async(e,t,n)=>{if(!n?.data?.length||n.data.length>Yt)return"";try{let o=`${await Qt(`${t._path}:${n.data.length}`)}.img`,a=await ie(e);if(a){let l={kind:"directory-file",directoryId:a.id,relativePath:`${ae}/${o}`},s=await e.fs.writeFile(l,n.data,{overwrite:!0,createDirectories:!0});if(!s?.ok)return"";I.add(o);let f=String(s.path||"");if(f)return Ne(f);let c=String(a.displayPath||"").replace(/[\\/]+$/,"");return c?Ne(`${c}/${ae}/${o}`):""}let i=await e.fs.writeFile(`${ae}/${o}`,n.data,{overwrite:!0,createDirectories:!0});return i?.ok?(I.add(o),String(i.url||"")):""}catch{return""}},Ne=e=>{let t=String(e).replace(/\\/g,"/"),n=t.startsWith("/")?t:`/${t}`;return`file://${encodeURI(n)}`},Oe=async(e,t,n,r,o={})=>{let a=_(),i=t.length,l=o.onlineFetch===!0;for(let s=0;s<t.length;/*b58933ea*/s+=j){if(_()!==a)return;r?.(Math.min(s+j,i),i);let f=t.slice(s,s+j),c=await Promise.all(f.map(async d=>{let u={},p=!1;try{let S=await e.fs.readAudioMetadata(d._path);if(_()!==a)return null;S?.ok&&(p=!0,Gt(d,S,u))}catch{}if(d._lyricPath&&!z(d.id)){let S=await ze(e,d._lyricPath);S&&M.set(String(d.id),S)}let g=await re(e,d._path);if(_()!==a)return null;if(g.lyric&&!z(d.id)&&M.set(String(d.id),g.lyric),p||(g.title&&g.title!==d.name&&(u.title=g.title,u.name=g.title),g.artist&&g.artist!==d.artist&&(u.artist=g.artist,u.artists=[{name:g.artist}]),g.album&&g.album!==d.album&&(u.album=g.album)),g.cover&&!De(d.id)){let S=await $e(e,d,g.cover);S&&(me(d.id,S),u.coverUrl=S,u.cover=S)}if(l&&_()===a){let S=!u.coverUrl&&!d.coverUrl,C=!z(d.id);if(S||C){let b=await ye(e,{...d,...u},{needCover:S,needLyric:C});if(_()!==a)return null;b.coverUrl&&!u.coverUrl&&(u.coverUrl=b.coverUrl,u.cover=b.coverUrl),b.lyric&&!z(d.id)&&M.set(String(d.id),b.lyric)}}return Object.keys(u).length===0?null:{song:d,patch:u}}));if(_()!==a)return;for(let d of c){if(!d)continue;let u=t.indexOf(d.song);u<0||(t[u]={...d.song,...d.patch},n?.(u))}}},I=new Set,je="covers.json",Se=(e,t)=>({kind:"directory-file",directoryId:e.id,relativePath:`${ae}/${t}`}),Ve=async e=>{try{let t=await ie(e);if(!t)return null;let n=await e.fs.readTextFile(Se(t,je),{encoding:"utf8",maxBytes:2*1024*1024});if(!n?.ok)return null;let r=JSON.parse(String(n.content||""));if(!Array.isArray(r))return null;I.clear();for(let o of r){let a=String(o||"").trim();a&&I.add(a)}return new Set(I)}catch{return null}},V=async e=>{try{let t=await ie(e);return t?!!(await e.fs.writeFile(Se(t,je),JSON.stringify([...I]),{overwrite:!0,createDirectories:!0}))?.ok:!1}catch{return!1}},Kt=()=>{I.clear()},qe=async(e,t)=>{if(!t)return!1;try{let n=await ie(e);return n?!!(await e.fs.readFileBytes(Se(n,t),{maxBytes:1}))?.ok:!1}catch{return!1}},q=e=>{let t=String(e||"").match(/[\\/]?covers[\\/]([^\\/]+)$/i);return t?t[1]:""},Ge=e=>{let t=0;for(let n of e){let r=q(n?.coverUrl);r&&(I.add(r),t+=1)}return t},Qe=(e,t)=>{let n=0;for(let r of e){if(!r?.coverUrl)continue;let o=q(r.coverUrl);o&&(t&&t.has(o)||(r.coverUrl="",r.cover="",n+=1))}return n},xe=async(e,t,n,r={})=>{let o=_(),a=r.onlineFetch===!0,i=[];for(let s=0;s<t.length;s+=1){let f=t[s];f?._path&&!f.coverUrl&&i.push(s)}if(i.length===0)return!1;let l=0;for(let s=0;s<i.length;s+=j){if(_()!==o)return l>0;let f=i.slice(s,s+j),c=await Promise.all(f.map(async d=>{let u=t[d];try{let p=await re(e,u._path);if(_()!==o)return null;if(p.cover){let g=await $e(e,u,p.cover);return g?(me(u.id,g),{index:d,song:u,patch:{coverUrl:g,cover:g}}):null}if(a){let g=await ye(e,u,{needCover:!0,needLyric:!1});if(_()!==o)return null;if(g.coverUrl)return{index:d,song:u,patch:{coverUrl:g.coverUrl,cover:g.coverUrl}}}return null}catch{return null}}));for(let d of c){if(!d)continue;let u=t[d.index];u&&(t[d.index]={...u,...d.patch},n?.(d.index),l+=1)}}return l>0};var Wt="local-music",we=(e,t)=>{try{let n=e.playlist?.store;if(!n||typeof n!="object")return;let r=new Map;for(let i of t)i?.coverUrl&&r.set(String(i.id),i);if(r.size===0)return;let o=i=>{if(!Array.isArray(i))return!1;let l=!1,s=i.map(f=>{if(f?.source!==Wt||f.coverUrl)return f;let c=r.get(String(f.id));return c?(l=!0,c):f});return l&&i!==s&&(i.length=0,i.push(...s)),l},a=[];for(let i of n.playbackQueues??[])o(i?.songs)&&a.push(i);Array.isArray(n.defaultList)&&o(n.defaultList);for(let i of a)try{typeof n.persistQueueToStorage=="function"&&n.persistQueueToStorage(i)}catch{}}catch(n){console.warn("[local-music] \u961F\u5217\u5C01\u9762\u540C\u6B65\u5931\u8D25\uFF1A",n?.message||n)}};var Ye="library.json",Xt=e=>({id:e.id,title:e.title,name:e.name,artist:e.artist,artists:e.artists,album:e.album,duration:e.duration,coverUrl:e.coverUrl,cover:e.cover,audioUrl:e.audioUrl,hash:e.hash,mixSongId:e.mixSongId,source:e.source,_path:e._path,_lyricPath:e._lyricPath}),Jt=async e=>{try{if(typeof e.fs?.getPrivateDirectory!="function")return null;let t=await e.fs.getPrivateDirectory({kind:"data"});return t?.id?t:null}catch{return null}},Zt=(e,t)=>({kind:"directory-file",directoryId:e.id,relativePath:t}),Ke=async e=>{let t=await Jt(e);return t?Zt(t,Ye):Ye},be=async(e,t)=>{try{let n=await Ke(e),r={version:1,savedAt:Date.now(),folders:t.folders,directories:t.directories??[],songs:t.songs.map(Xt)};return!!(await e.fs.writeFile(n,JSON.stringify(r),{overwrite:!0,createDirectories:!0}))?.ok}catch(n){return console.warn("[local-music] \u66F2\u5E93\u4FDD\u5B58\u5931\u8D25\uFF1A",n?.message||n),!1}},We=async(e,t)=>{try{let n=await Ke(e),r=await e.fs.readTextFile(n,{encoding:"utf8",maxBytes:8*1024*1024});if(!r?.ok)return null;let o=JSON.parse(r.content);return Array.isArray(o.folders)&&o.folders.length===t.length&&o.folders.every((l,s)=>l.path===t[s]?.path)?{songs:Array.isArray(o.songs)?o.songs:[],directories:Array.isArray(o.directories)?o.directories:[]}:null}catch{return null}};var Xe="settings",er={folders:[],onlineFetch:!1},tr=e=>{if(!e||typeof e!="object")return null;let t=String(e.path||"").trim();if(!t)return null;let n=t.split(/[\\/]/).filter(Boolean).pop()||t;return{path:t,name:String(e.name||"").trim()||n}},Je=e=>{let t=e&&typeof e=="object"?e:{},n=Array.isArray(t.folders)?t.folders.map(tr).filter(Boolean):[],r=new Set,o=n.filter(a=>r.has(a.path)?!1:(r.add(a.path),!0));return{...er,folders:o,onlineFetch:t.onlineFetch===!0}},$=async e=>Je(await e.storage.get(Xe)),Ze=async(e,t)=>{let n=Je(t);return await e.storage.set(Xe,n),n};var G=null,O=new Set,et=(e,t,n,r,o={})=>{let{shouldSupplement:a=!0,onUpdated:i,onlineFetch:l=!1}=o;return x.length=0,x.push(...t),fe(n),X(r),de(),v.count=x.length,a?Oe(e,x,()=>{i?.(),v.count=x.length},(s,f)=>{v.progress={done:s,total:f}},{onlineFetch:l}).then(async()=>{we(e,x),await V(e)}).finally(()=>{v.progress=null}):Promise.resolve()},rr=(e,t,n,r)=>{let o=r.catch(()=>{}).then(()=>be(e,{songs:x,folders:t,directories:n})).catch(a=>{console.warn("[local-music] \u66F2\u5E93\u4FDD\u5B58\u5931\u8D25\uFF1A",a?.message||a)});return O.add(o),o.finally(()=>O.delete(o)),o},Ce=async(e,t={})=>{let{force:n=!1,onUpdated:r}=t,o=await $(e),a=o.folders,i=o.onlineFetch===!0;if(a.length===0)return te(),H(),x.length=0,X([]),fe([]),v.loading=!1,v.count=0,v.message="\u672A\u914D\u7F6E\u6587\u4EF6\u5939",de(),r?.(),{songs:[],directories:[]};let l=Array.isArray(B)&&B.length===a.length&&B.every((f,c)=>f?.path===a[c]?.path);if(W&&!n&&x.length>0&&l)return X(a),v.count=x.length,{songs:x.slice(),directories:J};if(!n){let f=await We(e,a);if(f){H(),te(),et(e,f.songs,f.directories,a,{shouldSupplement:!1,onUpdated:r,onlineFetch:i}),v.loading=!1,v.count=f.songs.length,v.message="\u5DF2\u4ECE\u7F13\u5B58\u8F7D\u5165";let c=(async()=>{let d=await Ve(e);if(d){if(Qe(x,d)===0)return{rebuilt:0,savedIndex:!1};r?.();let b=await xe(e,x,r,{onlineFetch:i});return await V(e),{rebuilt:b?1:0,savedIndex:!0}}let u=x.find(C=>q(C.coverUrl))?.coverUrl||"",p=q(u);if(p?await qe(e,p):!1){let C=Ge(x);return await V(e),{rebuilt:0,savedIndex:C>0}}for(let C of x)C.coverUrl="",C.cover="";r?.();let S=await xe(e,x,r,{onlineFetch:i});return await V(e),{rebuilt:S?1:0,savedIndex:!0}})().then(d=>d.rebuilt?(we(e,x),be(e,{songs:x,folders:a,directories:f.directories})):null).catch(d=>{console.warn("[local-music] \u5C01\u9762\u7F13\u5B58\u6821\u9A8C\u5931\u8D25\uFF1A",d?.message||d)});return O.add(c),c.finally(()=>O.delete(c)),r?.(),{songs:x.slice(),directories:f.directories}}}if(G)return G;let s=(async()=>{let f=te();H(),v.loading=!0,v.message="\u6B63\u5728\u626B\u63CF\u2026",v.count=0,v.progress=null;try{let c=await Re(e,a,(u,p)=>{v.progress={done:u,total:p}});if(!c||_()!==f)return{songs:[],directories:[]};let d=et(e,c.songs,c.directories,a,{shouldSupplement:!0,onUpdated:r,onlineFetch:i});return v.loading=!1,v.count=c.songs.length,v.message=c.limitReached?"\u6587\u4EF6\u8FC7\u591A\uFF0C\u4EC5\u8F7D\u5165\u90E8\u5206":"",c.limitReached&&e.toast.warning("\u6587\u4EF6\u8FC7\u591A\uFF0C\u4EC5\u8F7D\u5165\u90E8\u5206\u6B4C\u66F2"),await rr(e,a,c.directories,d),r?.(),{songs:x.slice(),directories:c.directories}}catch(c){return v.loading=!1,v.count=0,v.message="\u626B\u63CF\u5931\u8D25",v.progress=null,e.toast.danger(`\u626B\u63CF\u5931\u8D25\uFF1A${c?.message||c}`),{songs:[],directories:[]}}finally{G=null}})();return G=s,s},tt=async()=>{G=null,await Promise.allSettled([...O]),O.clear()};var rt=e=>{let{defineAsyncComponent:t,defineComponent:n,h:r}=e.vue;return n({name:"LocalMusicDirectorySelect",props:{modelValue:{type:String,default:"__all__"},options:{type:Array,default:()=>[]}},emits:["update:modelValue"],setup(o,{emit:a}){let i=t(e.ui.components.Select);return()=>o.options.length<=1?null:r(i,{modelValue:o.modelValue,options:o.options,class:"local-music-directory-select",clearable:!1,"onUpdate:modelValue":l=>a("update:modelValue",String(l??"__all__"))})}})};var nr="queue:local-music",nt="\u672C\u5730\u97F3\u4E50",or=176,ot=56,ar=e=>`${String(e.name||e.title||"")} ${String(e.artist||"")}`.trim(),at=e=>{let{defineAsyncComponent:t,defineComponent:n,h:r,ref:o,computed:a}=e.vue;return n({name:"LocalMusicPage",setup(){let i=e.vue.resolveComponent("Icon"),l=t(e.ui.components.Button),s=t(e.ui.components.SongList),f=t(e.ui.components.SongListHeader),c=t(e.ui.components.SongSearchInput),d=t(e.ui.components.PageScrollContainer),u=t(e.ui.components.PageStickyHeader),p=t(e.ui.components.DetailPageSliverHeader),g=t(e.ui.components.Badge),S=t(e.ui.components.CustomTabBar),C=rt(e),b=o(!1),A=o(""),E=o(0),k=o([]),D=o("songs"),h=o(""),L=o(null),U=o(null),F=o(Z),gt=a(()=>L.value?.currentHeight??ot),R=a(()=>(E.value,x.slice())),_e=a(()=>e.stores.player.currentTrackId),P=a(()=>{let m=R.value;if(F.value!=="__all__"){let w=k.value.find(T=>T.name===F.value);if(w){let T=w.path.replace(/[\\/]+$/,"");m=m.filter(ue=>String(ue._path||"").startsWith(T))}}let y=A.value.trim().toLowerCase();return y?m.filter(w=>ar(w).toLowerCase().includes(y)):m}),ht=a(()=>R.value.find(m=>m.coverUrl)?.coverUrl||""),le=a(()=>{let m=new Map;for(let y of P.value){let w=String(y.album||"").trim()||"\u672A\u77E5\u4E13\u8F91";m.has(w)||m.set(w,[]),m.get(w).push(y)}return[...m.entries()].map(([y,w])=>({name:y,songs:w,coverUrl:w.find(T=>T.coverUrl)?.coverUrl||""})).sort((y,w)=>y.name.localeCompare(w.name,"zh-Hans-CN"))}),vt=a(()=>h.value?le.value.find(m=>m.name===h.value)?.songs??[]:[]);(async(m=!1)=>{let y=await $(e);if(k.value=y.folders,F.value!=="__all__"&&!k.value.some(w=>w.name===F.value)&&(F.value="__all__",pe("__all__")),!m&&x.length>0){E.value+=1;return}b.value=!0;try{await Ce(e,{force:m,onUpdated:()=>{E.value+=1}})}finally{b.value=!1}})(!1);let Q={queueId:nr,title:nt,subtitle:"",type:"playlist"},Le=async()=>{if(P.value.length===0){e.toast.info("\u6682\u65E0\u53EF\u64AD\u653E\u7684\u6B4C\u66F2");return}try{await e.player.replaceQueueAndPlay(P.value,Q)}catch{e.toast.danger("\u64AD\u653E\u5931\u8D25")}},Te=async m=>{if(m)try{await e.player.replaceQueueAndPlay(P.value,{...Q,requestedSong:m})}catch{e.toast.danger("\u64AD\u653E\u5931\u8D25")}},yt=()=>{let m=e.stores.player.currentTrackId;if(!m){e.toast.info("\u5F53\u524D\u6CA1\u6709\u6B63\u5728\u64AD\u653E\u7684\u6B4C\u66F2");return}let y=U.value;if(!y?.scrollToActive){e.toast.info("\u5217\u8868\u5C1A\u672A\u5C31\u7EEA");return}if(!R.value.some(w=>String(w.id)===String(m))){e.toast.info("\u5F53\u524D\u6B4C\u66F2\u4E0D\u5728\u672C\u5730\u97F3\u4E50\u4E2D");return}y.scrollToActive()},gr=()=>{try{e.router.push("/main/settings/plugins")}catch{e.toast.info("\u8BF7\u5728\u63D2\u4EF6\u7BA1\u7406\u4E2D\u6253\u5F00\u8BBE\u7F6E")}},St=async()=>{if(!b.value){b.value=!0;try{await Ce(e,{force:!0,onUpdated:()=>{E.value+=1}})}catch{e.toast.danger("\u5237\u65B0\u5931\u8D25")}finally{b.value=!1}}},Y=m=>r("div",{class:"local-music-hint"},[r("p",{class:"local-music-hint-title"},m?"\u672A\u914D\u7F6E\u97F3\u4E50\u6587\u4EF6\u5939":"\u672A\u627E\u5230\u97F3\u4E50\u6587\u4EF6"),r("p",{class:"local-music-hint-desc"},m?"\u8BF7\u5728\u63D2\u4EF6\u8BBE\u7F6E\u4E2D\u6DFB\u52A0\u6587\u4EF6\u5939\u3002":"\u6CA1\u6709\u53EF\u64AD\u653E\u7684\u97F3\u9891\u6587\u4EF6\u3002")]),xt=a(()=>[{label:"\u5168\u90E8\u76EE\u5F55",value:"__all__"},...k.value.map(m=>({label:m.name,value:m.name}))]),ce=[{value:"songs",label:"\u6B4C\u66F2",count:()=>P.value.length},{value:"albums",label:"\u4E13\u8F91",count:()=>le.value.length}],Ue=ce.map(m=>m.value),wt=ce.map(m=>m.label),Ie=a({get:()=>Math.max(0,Ue.indexOf(D.value)),set:m=>{let y=Ue[m];y&&(D.value=y,h.value="")}}),bt=()=>{if(b.value&&R.value.length===0)return r("div",{class:"local-music-hint"},"\u6B63\u5728\u52A0\u8F7D\u2026");if(D.value==="albums"){if(h.value){let y=vt.value;return y.length===0?Y(!1):r(s,{songs:y,contextSongs:y,active:!0,showCover:!0,showAlbum:!1,showDuration:!0,rowPaddingClass:"px-0",disableInternalFilter:!0,activeId:_e.value,queueOptions:{...Q,title:h.value},onSongDoubleTapPlay:w=>Te(w)})}let m=le.value;return m.length===0?Y(!1):r("div",{class:"local-music-albums"},m.map(y=>r("button",{key:y.name,type:"button",class:"local-music-album-card",onClick:()=>{h.value=y.name}},[r("div",{class:"local-music-album-cover"},[y.coverUrl?r("img",{src:y.coverUrl,alt:y.name,loading:"lazy"}):r(i,{icon:e.icons.iconMusic,width:28,height:28})]),r("div",{class:"local-music-album-name"},y.name),r("div",{class:"local-music-album-count"},`${y.songs.length} \u9996`)])))}return P.value.length===0?Y(!1):r(s,{ref:U,songs:P.value,contextSongs:R.value,loading:b.value,active:!0,showCover:!0,showAlbum:!0,showDuration:!0,rowPaddingClass:"px-0",disableInternalFilter:!0,activeId:_e.value,queueOptions:Q,onSongDoubleTapPlay:m=>Te(m)})};return()=>{let m=k.value.length===0,y=R.value.length;return r("div",{class:"local-music-page"},[r(d,{class:"flex-1 min-h-0"},{default:()=>[m?r("div",{class:"px-6 pt-4"},[Y(!0)]):r(p,{ref:L,typeLabel:"LOCAL",title:nt,coverUrl:ht.value,hasDetails:!0,distributeDetails:!0,expandedHeight:or,collapsedHeight:ot},{details:()=>r("div",{class:"contents"},[r("div",{class:"text-[13px] font-semibold text-text-secondary"},"\u64AD\u653E\u672C\u5730\u6587\u4EF6\u5939\u4E2D\u7684\u97F3\u4E50\u3002"),r("div",{class:"flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-semibold text-text-secondary"},[v.progress?r("span",{},`${v.progress.done}/${v.progress.total}`):r("span",{},`${y} \u9996\u6B4C\u66F2`)])]),actions:()=>r(l,{variant:"soft-primary",size:"default",class:"flex items-center gap-2 rounded-lg text-[12px] font-semibold transition-all active:scale-95 select-none",disabled:y===0,onClick:Le},{default:()=>[r(i,{icon:e.icons.iconPlay,width:16,height:16}),r("span",{},"\u64AD\u653E")]}),"collapsed-actions":()=>r(l,{variant:"unstyled",size:"icon",class:"action-icon hover:bg-[var(--control-hover-bg)] text-primary-text",tooltip:"\u64AD\u653E\u5168\u90E8",onClick:Le},{default:()=>r(i,{icon:e.icons.iconPlay,width:20,height:20})})}),m?null:r(u,{class:"song-list-sticky sticky z-110 bg-bg-main",stickyTop:gt.value},{default:()=>[r("div",{class:"px-6"},[r("div",{class:"flex items-center justify-between h-14 border-b border-[var(--border-subtle)]"},[r(S,{class:"local-music-tabbar",modelValue:Ie.value,tabs:wt,ariaLabel:"\u672C\u5730\u97F3\u4E50\u89C6\u56FE","onUpdate:modelValue":w=>{Ie.value=w}},{tab:({label:w,index:T,selected:ue})=>{let Ae=ce[T]?.count?.()??0;return[r("span",{class:"local-music-tab-label"},w),Ae>0?r(g,{count:Ae,tone:ue?"accent":"neutral"}):null]}}),r("div",{class:"flex items-center gap-2"},[D.value==="albums"&&h.value?r(l,{variant:"unstyled",size:"icon",class:"action-icon",tooltip:"\u8FD4\u56DE\u4E13\u8F91\u5217\u8868",onClick:()=>{h.value=""}},{default:()=>r(i,{icon:e.icons.iconArrowLeft,width:18,height:18})}):null,D.value==="songs"?r(C,{modelValue:F.value,options:xt.value,"onUpdate:modelValue":w=>{let T=String(w??"__all__");F.value=T,pe(T)}}):null,r(c,{modelValue:A.value,"onUpdate:modelValue":w=>{A.value=String(w??"")},ariaLabel:"\u641C\u7D22\u672C\u5730\u6B4C\u66F2"}),r(l,{variant:"unstyled",size:"icon",class:"action-icon song-locate-btn",tooltip:"\u5B9A\u4F4D\u5F53\u524D\u64AD\u653E",onClick:yt},{default:()=>r(i,{icon:e.icons.iconCurrentLocation,width:18,height:18})}),r(l,{variant:"unstyled",size:"icon",class:"action-icon song-locate-btn",tooltip:"\u5237\u65B0\u66F2\u5E93",onClick:()=>void St()},{default:()=>r(i,{icon:e.icons.iconRefreshCw,width:18,height:18})})])])]),r(f,{showCover:!0,paddingClass:"px-6"})]}),r("div",{class:"px-6 pb-12"},[m?null:bt()])]})])}}})};var ir="local-music",sr="library",lr=new Set(["\u6392\u961F\u5019\u64AD","\u6DFB\u52A0\u5230","\u5206\u4EAB"]),st="local-music-hidden",it=e=>{e?.classList?.contains("song-context-separator")&&e.classList.add(st)},cr=e=>{try{let t=e.router?.currentRoute?.value;return t?String(t.params?.pluginId??"")===ir&&String(t.params?.pageId??"")===sr:!1}catch{return!1}},ur=e=>{if(!e||typeof e.querySelectorAll!="function")return;let t=()=>{for(let n of e.querySelectorAll(".song-context-item")){let r=(n.textContent||"").trim();lr.has(r)&&(n.classList.add(st),it(n.previousElementSibling),it(n.nextElementSibling))}};typeof requestAnimationFrame=="function"?requestAnimationFrame(t):t()},lt=e=>e.dom.observe(".song-context-menu",t=>{cr(e)&&ur(t)});var ct=e=>String(e||"").split(/[\\/]/).filter(Boolean).pop()||e,ut=e=>{let{defineAsyncComponent:t,defineComponent:n,h:r,ref:o,computed:a}=e.vue;return n({name:"LocalMusicSettings",setup(){let i=e.vue.resolveComponent("Icon"),l=t(e.ui.components.Button),s=t(e.ui.components.Input),f=t(e.ui.components.Switch),c=o([]),d=o(!1),u=o(""),p=o(""),g=o(!1),S=async()=>{await Ze(e,{folders:c.value,onlineFetch:g.value})};$(e).then(h=>{c.value=h.folders.map(L=>({...L})),g.value=h.onlineFetch===!0,d.value=!0});let C=async()=>{let h=await e.dialog.selectDirectory({title:"\u9009\u62E9\u672C\u5730\u97F3\u4E50\u6587\u4EF6\u5939"});if(h?.canceled||!h?.paths?.[0])return;let L=h.paths[0];if(c.value.some(U=>U.path===L)){e.toast.info("\u8BE5\u6587\u4EF6\u5939\u5DF2\u6DFB\u52A0");return}c.value=[...c.value,{path:L,name:ct(L)}/*a0795b78*/],await S()},b=async h=>{c.value=c.value.filter(L=>L.path!==h),await S()},A=h=>{u.value=h.path,p.value=h.name},E=async()=>{let h=u.value;if(!h)return;let L=p.value.trim()||ct(h);c.value=c.value.map(U=>U.path===h?{...U,name:L}:U),u.value="",p.value="",await S()},k=h=>u.value===h.path?r("div",{class:"lm-set-folder",key:h.path},[r(s,{modelValue:p.value,placeholder:"\u663E\u793A\u540D\u79F0","onUpdate:modelValue":L=>{p.value=String(L??"")},onKeydown:L=>{L.key==="Enter"&&E(),L.key==="Escape"&&(u.value="",p.value="")}}),r(l,{size:"xs",onClick:()=>void E()},{default:()=>"\u786E\u5B9A"}),r(l,{size:"xs",variant:"outline",onClick:()=>{u.value="",p.value=""}},{default:()=>"\u53D6\u6D88"})]):r("div",{class:"lm-set-folder",key:h.path},[r(i,{icon:e.icons.iconFolderOpen,width:18,height:18}),r("div",{style:"flex:1;min-width:0;"},[r("div",{class:"lm-set-folder-name"},h.name),r("div",{class:"lm-set-folder-path"},h.path)]),r(l,{size:"xs",variant:"outline",onClick:()=>A(h)},{default:()=>"\u91CD\u547D\u540D"}),r(l,{size:"xs",variant:"outline",onClick:()=>void b(h.path)},{default:()=>"\u79FB\u9664"})]),D=a(()=>c.value.length);return()=>d.value?r("div",{class:"lm-set"},[r("div",{class:"lm-set-row"},[r("div",{class:"lm-set-copy"},[r("span",{class:"lm-set-label"},"\u97F3\u4E50\u6587\u4EF6\u5939"),r("small",{class:"lm-set-hint"},"\u652F\u6301\u6DFB\u52A0\u591A\u4E2A\u76EE\u5F55\u3002")]),r(l,{size:"xs",onClick:()=>void C()},{default:()=>"\u6DFB\u52A0\u6587\u4EF6\u5939"})]),D.value===0?r("p",{class:"lm-set-empty"},"\u5C1A\u672A\u6DFB\u52A0\u6587\u4EF6\u5939\u3002"):r("div",{class:"lm-set-list"},c.value.map(h=>k(h))),r("div",{class:"lm-set-row lm-set-row-bordered"},[r("div",{class:"lm-set-copy"},[r("span",{class:"lm-set-label"},"\u5728\u7EBF\u8865\u5168"),r("small",{class:"lm-set-hint"},"\u6587\u4EF6\u7F3A\u5C11\u5185\u5D4C\u5C01\u9762\u6216\u6B4C\u8BCD\u65F6\uFF0C\u4ECE\u5728\u7EBF\u66F2\u5E93\u68C0\u7D22\u8865\u5168\u3002")]),r(f,{modelValue:g.value,"onUpdate:modelValue":h=>{g.value=!!h,S()}})])]):r("div",{class:"lm-set-loading"},"\u52A0\u8F7D\u4E2D\u2026")}})},dt=`
.lm-set {
  display: grid;
  gap: 14px;
}

.lm-set-loading {
  padding: 24px;
  text-align: center;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.lm-set-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.lm-set-copy {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.lm-set-label {
  font-size: 13px;
  font-weight: 650;
  color: var(--color-text-main);
}

.lm-set-hint {
  font-size: 12px;
  line-height: 1.45;
  color: var(--color-text-secondary);
}

.lm-set-empty {
  margin: 0;
  padding: 16px;
  text-align: center;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.lm-set-list {
  display: grid;
  gap: 8px;
}

.lm-set-folder {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-info-card, transparent);
}

.lm-set-folder-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lm-set-folder-path {
  font-size: 11px;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
`;var ft="local-music",se=e=>e?.source===ft,pt=e=>{e.player.audioSource.register({id:ft,position:"before-catalog",match:({track:t})=>se(t),resolve:({track:t})=>String(t?.audioUrl||"").trim()||null})};var dr=1800,fr=e=>new Promise(t=>setTimeout(t,Math.max(0,e))),pr=e=>{let t=String(e);return x.find(n=>String(n.id)===t)||null},mt=e=>{e.lyrics.registerResolver({id:"local-file",order:-100,match:({track:t})=>se(t),resolve:async({track:t,hash:n})=>{let r=(t&&se(t)?t:null)||pr(n);if(!r)return null;let o=z(r.id);if(o)return{decodeContent:o,source:"\u672C\u5730\u6587\u4EF6"};if(!r._path)return null;let a=await Promise.race([He(e,r),fr(dr)]);return a?{decodeContent:a,source:"\u672C\u5730\u6587\u4EF6"}:null}})};async function sn(e){Pe(e.vue);let t=at(e);e.ui.addPage({id:"library",title:"\u672C\u5730\u97F3\u4E50",icon:e.icons.iconMusic,component:t,sidebar:{section:"library",sectionTitle:"\u672C\u5730\u97F3\u4E50",order:20}}),e.ui.settings.define({title:"\u672C\u5730\u97F3\u4E50",description:"\u7BA1\u7406\u672C\u5730\u97F3\u4E50\u6587\u4EF6\u5939\u3002",component:ut(e)}),e.css.inject(Ee,{id:"local-music-page"}),e.css.inject(ke,{id:"local-music-context-menu"}),e.css.inject(dt,{id:"local-music-settings"}),pt(e),mt(e),lt(e),e.dispose(()=>{H(),tt().finally(()=>{Me()})})}function ln(){}export{sn as activate,ln as deactivate};


/*d34550c537725ccd3527*/