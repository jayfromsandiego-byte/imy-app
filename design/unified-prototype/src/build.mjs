#!/usr/bin/env node
/* Assembles the unified IMY prototype:
   patches each page, injects the bridge + per-page scripts,
   embeds everything base64 into the shell. */
import fs from 'fs';
import path from 'path';
import url from 'url';

const ROOT=path.dirname(path.dirname(url.fileURLToPath(import.meta.url)));
const P=(...s)=>path.join(ROOT,...s);
const read=f=>fs.readFileSync(f,'utf8');
const b64=s=>Buffer.from(s,'utf8').toString('base64');

let failures=[];
function mustReplace(html,find,rep,label,all=false){
  const n=html.split(find).length-1;
  if(n===0){ failures.push('MISS: '+label); return html; }
  if(all)return html.split(find).join(rep);
  if(n>1&&!label.endsWith('*'))failures.push('WARN multi('+n+'): '+label);
  const i=html.indexOf(find);
  return html.slice(0,i)+rep+html.slice(i+find.length);
}
const bridge='<script>\n'+read(P('src','bridge.js'))+'\n</script>';

/* ═══ TRIBUTE ═══ */
let trib=read(P('pages','tribute.html'));
const OV='(window.IMY_OVERRIDE||{})';
trib=mustReplace(trib,"var TODAY=[",`var TODAY=${OV}.TODAY||[`,'TODAY');
trib=mustReplace(trib,"var MEMS=[",`var MEMS=${OV}.MEMS||[`,'MEMS');
trib=mustReplace(trib,"var CHIPS=[",`var CHIPS=${OV}.CHIPS||[`,'CHIPS');
trib=mustReplace(trib,"var PHOTOS=[",`var PHOTOS=${OV}.PHOTOS||[`,'PHOTOS');
trib=mustReplace(trib,"var CH=[",`var CH=${OV}.CH||[`,'CH');
trib=mustReplace(trib,"CH.push(",`if(!window.IMY_OVERRIDE)CH.push(`,'CH.push');
trib=mustReplace(trib,"var TAPES=[",`var TAPES=${OV}.TAPES||[`,'TAPES');
trib=mustReplace(trib,"var PEOPLE={",`var PEOPLE=${OV}.PEOPLE||{`,'PEOPLE');
trib=mustReplace(trib,"var ROOT='eleanor',",`var ROOT=${OV}.ROOT||'eleanor',`,'ROOT');
trib=mustReplace(trib,"var SHURL=",`var SHURL=${OV}.SHURL||`,'SHURL');
trib=mustReplace(trib,"var SHTXT=",`var SHTXT=${OV}.SHTXT||`,'SHTXT');
trib=mustReplace(trib,"if(!REDUCE){var vN=",`if(!REDUCE&&!window.IMY_OVERRIDE){var vN=`,'visits-theatre');
/* an empty stage must never stop the page — hide it and carry on */
trib=mustReplace(trib,"function renderMoments(fade){",
  `function renderMoments(fade){if(!TODAY.length){['stageWings','mDots'].forEach(function(id){var el=document.getElementById(id);if(el)el.style.display='none'});var _qc=document.querySelector('.qcall');if(_qc)_qc.style.display='none';return;}`,
  'renderMoments empty guard');
trib=mustReplace(trib,"var m=TODAY[md(ti)];vImg.src=m.img;","var m=TODAY[md(ti)];if(!m)return;vImg.src=m.img;",'stage click guard');
trib=mustReplace(trib,"\nrenderChapter(0);","\nif(CH.length)renderChapter(0);",'chapters empty guard');
/* the photo grid must hold with any number of photographs, not only nine */
trib=mustReplace(trib,
  "var rows=[[0,1,2],[3,4,5],[6,7,8]];\n  pp.innerHTML=rows.map(function(r){return '<div class=\"prow\">'+r.map(function(i){return phButton(PHOTOS[i],i,'100%')}).join('')+'</div>'}).join('');",
  "var rows=[[0,1,2],[3,4,5],[6,7,8]].map(function(r){return r.filter(function(i){return i<PHOTOS.length})}).filter(function(r){return r.length});\n  gridPh=[];rows.forEach(function(r){r.forEach(function(i){gridPh.push(i)})});\n  pp.innerHTML=rows.map(function(r){return '<div class=\"prow\">'+r.map(function(i){return phButton(PHOTOS[i],i,'100%')}).join('')+'</div>'}).join('');",
  'photo grid rows');
trib=mustReplace(trib,"if(!REDUCE){\n  var phov=false,cell=0,nxt=9;","if(!REDUCE&&PHOTOS.length>9){\n  var phov=false,cell=0,nxt=9;",'photo rotation guard');
trib=mustReplace(trib,"function relTo(id){",`function relTo(id){var _f=PEOPLE[id];if(_f&&_f.relLabel)return _f.relLabel;`,'relTo');
trib=mustReplace(trib,"'Viewing <b>Eleanor&rsquo;s</b> family'","'Viewing <b>'+(((PEOPLE[ROOT]||{}).n||'Eleanor').split(' ')[0])+'&rsquo;s</b> family'",'tree crumb');
trib=mustReplace(trib,"navigator.share({title:'Eleanor Margaret Hayes',",`navigator.share({title:(${OV}.person||{}).name||'Eleanor Margaret Hayes',`,'share title');
trib=mustReplace(trib,"'<em>this page is hers</em>'",`'<em>'+(${OV}.treeOwnLabel||'this page is hers')+'</em>'`,'treeOwnLabel');
/* the override slot sits before the page's first script */
{
  const i=trib.indexOf('<script>');
  if(i<0)failures.push('MISS: tribute first <script>');
  else trib=trib.slice(0,i)+'<!--IMY_OVERRIDE_SLOT-->\n'+trib.slice(i);
}
/* the example speaks in dashes · 1948–1966, not 1948 to 1966 */
trib=trib.replace(/era:'(\d{4}) to (\d{4})'/g,"era:'$1\u2013$2'");
/* the flyer photo is a square, never a stone silhouette */
const flyerCss=`<style>
#flyer .arch{border-radius:14px!important}
@media (max-width:900px){
  .mbar{display:none!important}
  #fab{position:fixed!important;right:14px;bottom:14px;left:auto!important;width:56px;height:56px;border-radius:50%!important;padding:0!important;font-size:0!important;display:flex!important;align-items:center;justify-content:center;box-shadow:0 10px 28px rgba(44,37,32,.35)}
  #fab::before{content:'＋';font-size:26px;line-height:1}
  #fab span{display:none!important}
}
</style>`;
trib=mustReplace(trib,'</head>',flyerCss+'\n</head>','tribute flyer/mobile css');
trib=mustReplace(trib,'</body>',bridge+'\n<script>\n'+read(P('src','tribute-hydrate.js'))+'\n</script>\n</body>','tribute tail');

/* ═══ LANDING ═══ */
let land=read(P('pages','landing.html'));
{
  const anchor='AI assisted writing tool';
  const i=land.indexOf(anchor);
  if(i<0)failures.push('MISS: landing AI-writing li');
  else{
    const li=land.indexOf('</li>',i);
    land=land.slice(0,li+5)+'<li><span class="ck">✓</span> AI photo restoration for damaged photographs</li>'+land.slice(li+5);
  }
}
land=mustReplace(land,'href="#memory">Remember</a>','href="#mission">Remember</a>','landing Remember anchor');
land=mustReplace(land,'<li><span class="ck">✓</span> Everything in Free</li>','<li><span class="ck">✓</span> <b>Everything in Free</b></li>','bold everything-in-free (plus)');
land=mustReplace(land,'<li><span class="ck">✦</span> Everything in Free and Plus</li>','<li><span class="ck">✦</span> <b>Everything in Free and Plus</b></li>','bold everything-in-free (concierge)');
land=mustReplace(land,'</body>',bridge+'\n</body>','landing tail');

/* ═══ DASHBOARD · the Sharpened Desk, anchored as given ═══ */
let dash=read(P('pages','desk.html'));
dash=dash.replace(/<div class="proto-strip">[\s\S]*?<\/div>\s*/,'');
/* data flows in from the account's real state */
{
  const i=dash.indexOf('<script>');
  if(i<0)failures.push('MISS: desk first <script>');
  else dash=dash.slice(0,i)+'<!--IMY_DESK_SLOT-->\n'+dash.slice(i);
}
const DK='(window.IMY_DESK||{})';
dash=mustReplace(dash,'var TOTAL=3;',`var TOTAL=${DK}.TOTAL!=null?${DK}.TOTAL:3;`,'desk TOTAL');
dash=mustReplace(dash,'var pending=[',`var pending=${DK}.pending||[`,'desk pending');
dash=mustReplace(dash,'var approved=[',`var approved=${DK}.approved||[`,'desk approved');
dash=mustReplace(dash,'var archive=[',`var archive=${DK}.archive||[`,'desk archive');
dash=mustReplace(dash,'var log=[',`var log=${DK}.log||[`,'desk log');
dash=mustReplace(dash,'var photos=[',`var photos=${DK}.photos||[`,'desk photos');
dash=mustReplace(dash,'if(v!=="autumn@finisomegalandmark.com")',`if(v!==String(${DK}.email||"autumn@finisomegalandmark.com").toLowerCase())`,'desk delete email');
dash=mustReplace(dash,'Begin anotthe page','Begin another page','desk typo');
dash=mustReplace(dash,'<li>AI assisted writing tool · credit removed</li>','<li>AI assisted writing tool · credit removed</li><li>AI photo restoration</li>','desk billing restoration li');
const dashCss=`<style>
.pgrow .initial{display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:18px;color:#A87C5F;background:#EDE3D2;font-family:'Besley',serif}
.archp .initial{display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:15px;color:#A87C5F;background:#EDE3D2;font-family:'Besley',serif}
/* the stone silhouette rests · photographs are squares here */
.archp,.archp img,.idb .archp,.pgrow .archp{border-radius:12px!important;clip-path:none!important}
/* landing type on every title */
.ni .lbl{font-family:'Besley',Georgia,serif;font-weight:600;font-size:15px;letter-spacing:0;text-transform:none}
.kick,#greet{font-family:'Work Sans',sans-serif}
.nm,.tn{font-family:'Besley',Georgia,serif!important;font-weight:600}
/* the mobile menu · three bars, every room */
#imyBurger{display:none;background:none;border:0;width:38px;height:38px;padding:8px;cursor:pointer;flex:none}
#imyBurger span{display:block;height:2px;background:#2C2520;margin:5px 0;border-radius:2px}
#imyMenu{position:fixed;inset:0;background:rgba(28,22,17,.45);z-index:400;display:none}
#imyMenu.open{display:block}
.imy-menu-card{position:absolute;left:0;top:0;bottom:0;width:min(300px,84vw);background:#FDFBF7;box-shadow:12px 0 40px rgba(0,0,0,.25);padding:22px 16px;display:flex;flex-direction:column;gap:4px}
.imy-mi{text-align:left;background:none;border:0;border-radius:10px;padding:13px 12px;font-family:'Besley',Georgia,serif;font-weight:600;font-size:16px;color:#2C2520;cursor:pointer}
.imy-mi:hover{background:rgba(168,124,95,.1)}
.imy-mi-quiet{margin-top:auto;color:#8a5a3c;font-size:13px}
.imy-rmaccess{color:#8a3c2c!important}
@media (max-width:900px){
  #imyBurger{display:block}
  .mtabs{display:none!important}
}
/* brand pass · the landing's type and accents, applied to the desk */
.wordmk em{font-style:italic;color:#A87C5F}
h2.vt{font-family:'Besley',Georgia,serif;font-weight:600;letter-spacing:-.005em}
.kick,.shl,.klabel{letter-spacing:.2em}
.btn.primary,.upbtn{background:#A87C5F;border-color:#A87C5F;color:#fff}
.btn.primary:hover,.upbtn:hover{background:#8a5a3c;border-color:#8a5a3c;color:#fff}
.chaprow .cn{font-family:'Besley',Georgia,serif;font-weight:600}
</style>`;
dash=mustReplace(dash,'</head>',dashCss+'\n</head>','desk css');
dash=mustReplace(dash,'</body>',bridge+'\n<script>\n'+read(P('src','desk-hydrate.js'))+'\n</script>\n</body>','desk tail');

/* ═══ STUDIO (from the builder shell) ═══ */
let stu=read(P('pages','builder-ref.html'));
stu=stu.replace(/<title>[\s\S]*?<\/title>/,'<title>The Studio · I Miss You Memorial</title>');
{
  const ic=stu.indexOf('<div class="canvas" id="canvas">');
  const im=stu.indexOf('<main class="letter"');
  if(ic<0||im<0||im<ic)failures.push('MISS: studio canvas/letter anchors');
  else{
    const newCanvas='<div id="canvas" class="canvas"><iframe id="pvFrame" title="Their page · a live preview"></iframe><div id="pvVeil">the page is warming…</div></div>\n</aside>\n';
    stu=stu.slice(0,ic)+newCanvas+stu.slice(im);
  }
}
const stuCss=`<style>
.canvas{position:relative;overflow:hidden;padding:0}
#pvFrame{position:absolute;left:12px;top:12px;width:calc(100% - 24px);height:calc(100% - 24px);border:0;border-radius:16px;background:#fff;box-shadow:0 14px 44px rgba(44,37,32,.16)}
#pvVeil{position:absolute;left:12px;top:12px;width:calc(100% - 24px);height:calc(100% - 24px);border-radius:16px;display:flex;align-items:center;justify-content:center;background:rgba(253,251,247,.94);font-style:italic;color:var(--ink-soft,#5c5249);transition:opacity .6s;z-index:3}
#pvVeil.off{opacity:0;pointer-events:none}
select.dsel{width:100%;font-family:'Besley',serif;font-size:15.5px;color:var(--ink,#2C2520);background:#fff;border:1px solid var(--line,rgba(44,37,32,.16));border-radius:10px;padding:11px 12px;outline:none}
select.dsel:focus{border-color:var(--terra,#A87C5F)}
.lnote{margin-top:12px;font-style:italic;font-size:12.5px;line-height:1.55;color:var(--ink-soft,#5c5249)}
.planline{margin-top:12px;background:rgba(201,165,114,.15);border:1px solid rgba(201,165,114,.5);border-radius:10px;padding:10px 12px;font-size:13px;line-height:1.55}
.jumprow{display:flex;flex-wrap:wrap;gap:6px;padding:12px 26px 0}
.phrow{display:grid;grid-template-columns:44px 1fr 128px 28px;gap:8px;align-items:center}
.phrow input{font-family:'Besley',serif;font-size:13.5px;border:1px solid var(--line,rgba(44,37,32,.16));border-radius:8px;padding:9px 10px;background:#fff;outline:none;min-width:0}
.phrow select.dsel{padding:9px 8px;font-size:13px}
.th.mini{width:44px;height:44px;border-radius:8px;overflow:hidden;display:inline-flex;flex:none}
.th.mini img{width:100%;height:100%;object-fit:cover}
.mhint button{background:none;border:0;padding:0;font:inherit;color:var(--terra-deep,#8a5a3c);cursor:pointer;text-decoration:underline;text-underline-offset:3px}
.lfoot{pointer-events:none}
.lfoot button{pointer-events:auto}
/* everything reads in ink · nothing defaults to browser blue */
.letter a{color:var(--terra-deep,#8a5a3c)}
.letter select,.letter input,.letter textarea{color:var(--ink,#2C2520)!important;-webkit-text-fill-color:var(--ink,#2C2520)}
.step .body{margin-top:16px}
.lexit{background:none;border:0;padding:4px 8px 4px 0;font-family:'Work Sans',sans-serif;font-weight:600;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--terra-deep,#8a5a3c);cursor:pointer;flex:none}
.ltuck{margin-left:auto;background:none;border:1px solid var(--line,rgba(44,37,32,.18));border-radius:8px;width:30px;height:30px;font-size:15px;line-height:1;color:var(--ink-soft,#5c5249);cursor:pointer;flex:none}
.rmup{background:none;border:0;padding:4px 0;font-family:'Work Sans',sans-serif;font-weight:600;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#8a3c2c;cursor:pointer;display:block}
.tp-head{display:flex;gap:10px;align-items:flex-start}
.tpth{position:relative}
.tpth i{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-style:normal;text-shadow:0 1px 6px rgba(0,0,0,.6)}
#famForm .chnamein,#tpEd .chnamein{font-size:16px;font-style:normal}
/* the letter tucks away · the page gets the room */
body.letter-min .letter .lbody,body.letter-min .letter .lfoot,body.letter-min #jumpRow{display:none!important}
@media (min-width:901px){
  body.letter-min .letter{max-width:240px}
}
@media (max-width:900px){
  body.letter-min .letter{max-height:58px;overflow:hidden}
  body.letter-min .canvas{padding-bottom:0}
  body.letter-min #pvFrame,body.letter-min #pvVeil{height:calc(100% - 74px)}
  .lfoot{position:static;flex:none;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:8px}
  .lfoot .cont{min-height:46px}
  .lfoot .backb,.lfoot .skipb{min-height:46px;display:inline-flex;align-items:center}
}
@media (max-width:900px){
  #pvFrame,#pvVeil{left:8px;top:8px;width:calc(100% - 16px);height:calc(100% - 52dvh - 14px)}
  .jumprow{padding:10px 16px 0}
  .phrow{grid-template-columns:38px 1fr 24px}
  .phrow select.dsel{grid-column:2}
}
</style>`;
stu=mustReplace(stu,'</head>',stuCss+'\n</head>','studio css');
{
  const is=stu.indexOf('<script>');
  const ie=stu.lastIndexOf('</script>');
  if(is<0||ie<0)failures.push('MISS: studio script block');
  else stu=stu.slice(0,is)+bridge+'\n<script>\n'+read(P('src','studio.js'))+'\n</script>'+stu.slice(ie+9);
}

/* ═══ SIGNIN + CHECKOUT ═══ */
let signin=read(P('pages','signin.html'));
signin=mustReplace(signin,'</head>',bridge+'\n</head>','signin bridge');
let checkout=read(P('pages','checkout.html'));
checkout=mustReplace(checkout,'</head>',bridge+'\n</head>','checkout bridge');

/* ═══ SHELL ═══ */
let shell=read(P('src','shell.html'));
shell=shell.replace('{{PG_LANDING}}',b64(land));
shell=shell.replace('{{PG_TRIBUTE}}',b64(trib));
shell=shell.replace('{{PG_STUDIO}}',b64(stu));
shell=shell.replace('{{PG_DASHBOARD}}',b64(dash));
shell=shell.replace('{{PG_SIGNIN}}',b64(signin));
shell=shell.replace('{{PG_CHECKOUT}}',b64(checkout));
if(/\{\{PG_/.test(shell))failures.push('MISS: unfilled shell placeholder');

fs.mkdirSync(P('dist'),{recursive:true});
fs.writeFileSync(P('dist','imy-unified.html'),shell);
console.log('built dist/imy-unified.html ·',(shell.length/1024).toFixed(0)+'KB');
if(failures.length){ console.log('PATCH ISSUES:'); failures.forEach(f=>console.log(' -',f)); process.exit(1); }
console.log('all patches landed clean');
