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
trib=mustReplace(trib,'</body>',bridge+'\n<script>\n'+read(P('src','tribute-hydrate.js'))+'\n</script>\n</body>','tribute tail');

/* ═══ LANDING ═══ */
let land=read(P('pages','landing.html'));
{
  const anchor='AI assisted writing tool';
  const i=land.indexOf(anchor);
  if(i<0)failures.push('MISS: landing AI-writing li');
  else{
    const li=land.indexOf('</li>',i);
    land=land.slice(0,li+5)+'<li><span class="ck">✓</span>AI photo restoration — damaged photographs, made whole</li>'+land.slice(li+5);
  }
}
land=mustReplace(land,'<li><span class="ck">✓</span> Everything in Free</li>','<li><span class="ck">✓</span> <b>Everything in Free</b></li>','bold everything-in-free (plus)');
land=mustReplace(land,'<li><span class="ck">✦</span> Everything in Free and Plus</li>','<li><span class="ck">✦</span> <b>Everything in Free and Plus</b></li>','bold everything-in-free (concierge)');
land=mustReplace(land,'</body>',bridge+'\n</body>','landing tail');

/* ═══ DASHBOARD ═══ */
let dash=read(P('pages','dashboard.html'));
dash=dash.replace(/<div class="preview-strip">[\s\S]*?<\/div>\s*/,'');
dash=mustReplace(dash,'family=Sometype+Mono:wght@400;500;700&','family=Work+Sans:wght@400;500;600&','dash font url');
dash=dash.replace(/['"]Sometype Mono['"]\s*,\s*monospace/g,"'Work Sans', sans-serif");
if(/Sometype/.test(dash))failures.push('WARN: Sometype remains in dashboard');
const dashCss=`<style>
.mem-list{margin-top:14px;display:flex;flex-direction:column;gap:10px}
.mem-row{display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px solid rgba(44,37,32,.12);border-radius:12px;background:#fff;flex-wrap:wrap}
.mem-row.now{border-color:rgba(168,124,95,.55);box-shadow:0 4px 14px rgba(168,124,95,.13)}
.mr-main{flex:1;min-width:180px;display:flex;flex-direction:column;gap:2px}
.mr-main b{font-size:15px}
.mr-url{font-family:'Work Sans',sans-serif;font-size:11px;letter-spacing:.05em;color:#8a5a3c}
.mr-plan{font-family:'Work Sans',sans-serif;font-size:10px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;padding:4px 10px;border-radius:100px}
.mr-plan.plus{background:#3f2c1a;color:#F4B860}
.mr-plan.free{background:rgba(44,37,32,.08);color:#5c5249}
.mr-acts{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.mem-new{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:13px 14px;border:1px dashed rgba(168,124,95,.5);border-radius:12px;font-size:14px;line-height:1.5}
.mem-new.locked{border-style:solid;background:rgba(201,165,114,.09)}
.mr-off{font-style:normal;font-family:'Work Sans',sans-serif;background:rgba(244,184,96,.35);border-radius:100px;padding:2px 8px;margin-left:6px;font-size:10px;letter-spacing:.06em}
.mr-owner{font-family:'Work Sans',sans-serif;font-size:10.5px;letter-spacing:.05em;color:#8a5a3c;margin-top:2px}
.btn.danger{color:#8a3c2c!important;border-color:rgba(138,60,44,.4)!important}
.btn.dangerfill{background:#8a3c2c!important;color:#FAF5EC!important;border-color:#8a3c2c!important}
.imy-veil{position:fixed;inset:0;background:rgba(28,22,17,.5);display:flex;align-items:center;justify-content:center;z-index:300;padding:20px;backdrop-filter:blur(2px)}
.imy-modal{background:#FDFBF7;border-radius:16px;max-width:460px;width:100%;padding:26px 24px 22px;box-shadow:0 30px 80px rgba(0,0,0,.35);font-family:'Besley',Georgia,serif}
.imy-modal h4{margin:0 0 8px;font-size:21px;font-weight:600;color:#2C2520}
.imy-modal p{margin:0 0 16px;font-size:14px;line-height:1.6;color:#5c5249}
.imy-modal input{width:100%;box-sizing:border-box;font-family:'Besley',serif;font-size:15px;padding:11px 12px;border:1px solid rgba(44,37,32,.22);border-radius:10px;background:#fff;outline:none;margin-bottom:16px}
.imy-modal input:focus{border-color:#A87C5F;box-shadow:0 0 0 3px rgba(168,124,95,.14)}
.imy-modal .rowbtns{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}
.imy-modal .btn[disabled]{opacity:.45;cursor:default;pointer-events:none}
</style>`;
dash=mustReplace(dash,'</head>',dashCss+'\n</head>','dash css');
dash=mustReplace(dash,'</body>',bridge+'\n<script>\n'+read(P('src','dash.js'))+'\n</script>\n</body>','dash tail');

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
