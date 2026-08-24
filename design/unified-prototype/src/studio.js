/* ═══ IMY Studio · the live editor ═══
   One question at a time on the right; the real page on the left,
   updating as you type. Nothing decorative — question, answer, page. */
(function(){
'use strict';

/* ── draft ── */
var A={name:'',pron:'they',bm:'',bd:'',by:'',dm:'',dd:'',dy:'',home:'',quote:'',
  portrait:'',coverbg:'',mem:{title:'',story:'',photo:''},chapters:[],photos:[],tapes:[],
  family:[],svc:{m:'',d:'',y:'',time:'',where:'',addr:'',note:''},_plan:'free',_i:0};
var CTX={mode:'new',account:{name:'',email:''},price:{amount:197,discount:0},published:false,slug:'',m:'new'};
var booted=false;

var MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
var PRON={she:{s:'she',o:'her',pa:'her',C:'Her',poss:'hers'},he:{s:'he',o:'him',pa:'his',C:'His',poss:'his'},they:{s:'they',o:'them',pa:'their',C:'Their',poss:'theirs'}};
function P(){return PRON[A.pron]||PRON.they}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}
function firstName(){return (A.name||'').trim().split(/\s+/)[0]||''}
function F(){return firstName()||'them'}
function fmtDate(m,d,y){ if(!y)return '····'; if(m)return (MONTHS[m-1]+(d?' '+d:'')+', '+y).toUpperCase(); return String(y); }

/* ── selects · dates are chosen, never typed ── */
function selMonth(id,val,blank){return '<select id="'+id+'" class="dsel"><option value="">'+(blank||'Month')+'</option>'+MONTHS.map(function(m,i){return '<option value="'+(i+1)+'"'+(String(i+1)===String(val)?' selected':'')+'>'+m+'</option>'}).join('')+'</select>'}
function selDay(id,val){var o='<select id="'+id+'" class="dsel"><option value="">Day</option>';for(var d=1;d<=31;d++)o+='<option'+(String(d)===String(val)?' selected':'')+'>'+d+'</option>';return o+'</select>'}
function selYear(id,val,from,to,blank){var o='<select id="'+id+'" class="dsel"><option value="">'+(blank||'Year')+'</option>';for(var y=to;y>=from;y--)o+='<option'+(String(y)===String(val)?' selected':'')+'>'+y+'</option>';return o+'</select>'}
var THIS_YEAR=new Date().getFullYear();
function selTime(id,val){
  var o='<select id="'+id+'" class="dsel"><option value="">Time</option>';
  for(var h=7;h<=20;h++)['00','30'].forEach(function(mm){
    var hr12=((h+11)%12)+1, ap=h<12?'AM':'PM', v=hr12+':'+mm+' '+ap;
    o+='<option'+(v===val?' selected':'')+'>'+v+'</option>';
  });
  return o+'</select>';
}

/* ── image intake ── */
function ingest(file,max,cb){
  var r=new FileReader();
  r.onload=function(){
    var img=new Image();
    img.onload=function(){
      var w=img.width,h=img.height,scale=Math.min(1,(max||1400)/Math.max(w,h));
      if(scale===1&&file.size<400000)return cb(r.result);
      var c=document.createElement('canvas');c.width=Math.round(w*scale);c.height=Math.round(h*scale);
      c.getContext('2d').drawImage(img,0,0,c.width,c.height);
      cb(c.toDataURL('image/jpeg',.82));
    };
    img.onerror=function(){cb(r.result)};
    img.src=r.result;
  };
  r.readAsDataURL(file);
}
/* video intake · a real file becomes a playable url + a still for its cover */
function ingestVideo(file,cb){
  var url=URL.createObjectURL(file);
  var v=document.createElement('video');
  v.preload='metadata'; v.muted=true; v.playsInline=true; v.src=url;
  var done=false;
  function finish(cover,dur){ if(done)return; done=true; cb({url:url,cover:cover||'',dur:dur||''}); }
  v.addEventListener('loadeddata',function(){
    try{ v.currentTime=Math.min(1,(v.duration||2)/2); }catch(e){}
  });
  v.addEventListener('seeked',function(){
    try{
      var c=document.createElement('canvas');
      var scale=Math.min(1,900/Math.max(v.videoWidth||900,v.videoHeight||600));
      c.width=Math.round((v.videoWidth||900)*scale); c.height=Math.round((v.videoHeight||600)*scale);
      c.getContext('2d').drawImage(v,0,0,c.width,c.height);
      var d=v.duration||0, mm=Math.floor(d/60), ss=Math.round(d%60);
      finish(c.toDataURL('image/jpeg',.8), d?(mm+':'+(ss<10?'0':'')+ss):'');
    }catch(e){ finish('',''); }
  });
  v.addEventListener('error',function(){ finish('',''); });
  setTimeout(function(){ finish('',''); },6000);
}
/* a thumb with its own quiet remove */
function thumb(src,rmId){
  return '<div class="thumbrow"><span class="th cover"><img src="'+src+'" alt=""/></span><button type="button" class="rmup" id="'+rmId+'" aria-label="Remove this photo">✕ remove</button></div>';
}

/* ── preview · the real page, kept in step ── */
var pv=document.getElementById('pvFrame'), pvVeil=document.getElementById('pvVeil');
var composeT=null, pvRoom='', pvReady=false;
function counts(){return CTX.counts||{visits:1,flowers:0,candles:0}}
function requestCompose(){
  clearTimeout(composeT);
  composeT=setTimeout(function(){
    IMY.send('compose',{draft:A,plan:previewPlan(),slug:CTX.slug,counts:counts()});
  },380);
}
function previewPlan(){ if(CTX.published&&CTX.plan==='plus')return 'plus'; return A._plan==='plus'?'plus':'free'; }
function pvCmd(action,data){ try{pv.contentWindow.postMessage({type:'imy-cmd',action:action,data:data||{}},'*')}catch(e){} }
function fastPerson(){
  var datesLine=fmtDate(+A.bm,A.bd,A.by)+' — '+fmtDate(+A.dm,A.dd,A.dy);
  if((A.home||'').trim())datesLine+=' · '+A.home.trim().toUpperCase();
  var svc=null;
  if(A.svc.y&&(A.svc.where||'').trim())svc={when:(A.svc.m?MONTHS[A.svc.m-1]+' ':'')+(A.svc.d?A.svc.d+', ':'')+A.svc.y+(A.svc.time?' · '+A.svc.time:''),whereName:A.svc.where,whereAddr:A.svc.addr||'',note:A.svc.note||''};
  pvCmd('person',{person:{name:(A.name||'').trim()||'A life remembered',first:F(),pron:A.pron,
    datesLine:datesLine,quote:(A.quote||'').trim(),portrait:A.portrait||'',coverbg:A.coverbg||''},svc:svc,counts:counts()});
}
function fastMemory(){
  pvCmd('memtext',{title:(A.mem.title||'').trim(),story:(A.mem.story||'').trim(),
    author:(CTX.account.name||'you').split(/\s+/)[0]});
}
function fastChapters(){
  pvCmd('chaptext',{chapters:A.chapters.filter(function(c){return (c.ms||[]).length}).map(function(c){
    return {era:(c.from&&c.to)?(c.from+'–'+c.to):(c.from||c.to||''),t:c.t||'A chapter',
      ms:(c.ms||[]).map(function(m){return {y:String(m.y||''),l:m.l||''}})};
  })});
}
window.addEventListener('message',function(e){
  var m=e.data;
  if(m&&m.type==='imy-cmd'&&m.action==='preview'){
    pvReady=false;
    pv.addEventListener('load',function onl(){
      pv.removeEventListener('load',onl);
      pvVeil.classList.add('off');
      setTimeout(function(){ if(pvRoom)pvCmd('room',{room:pvRoom}); },380);
    });
    pv.srcdoc=m.data.src;
    return;
  }
  if(m&&m.type==='imy-init'&&!booted){ boot(m.data||{}); return; }
  if(pv&&e.source===pv.contentWindow&&m&&m.type==='imy'){
    if(m.action==='edit'){ var i=KIND2STEP[m.data.kind]; if(i!=null)goto(i); }
    if(m.action==='room'){ var j=ROOM2STEP[m.data.room]; if(j!=null&&stepRoom(cur)!==m.data.room)goto(j); }
    if(m.action==='tribute-ready'){ pvReady=true; }
  }
});

/* ── autosave ── */
var draftT=null,saveT=null;
function persist(){ clearTimeout(draftT); draftT=setTimeout(function(){ A._i=cur; IMY.send('draft',{draft:A}); },700); }
function markSaved(){var c=document.getElementById('savedChip');c.classList.add('show');clearTimeout(saveT);saveT=setTimeout(function(){c.classList.remove('show')},1800)}
function changed(kind){
  markSaved(); persist(); refreshCont();
  if(kind==='mem')fastMemory();
  else if(kind==='chap')fastChapters();
  else if(kind==='full')requestCompose();
  else fastPerson();
}
function bind(id,fn,kind){var el=document.getElementById(id);if(!el)return;el.addEventListener(el.tagName==='SELECT'?'change':'input',function(){fn(el.value);changed(kind||'fast')})}

/* ═══ the steps · a question and its answer, nothing else ═══ */
var STEPS=[

/* 0 · name */
{id:'name',ch:'who they were',room:'',
 q:function(){return 'What was their <em>name?</em>'},
 render:function(el){
   el.innerHTML='<div class="fields"><div class="fld"><label>Their full name</label><input type="text" id="inName" autocomplete="off" placeholder="Eleanor Margaret Hayes" value="'+esc(A.name)+'"/></div></div>';
   bind('inName',function(v){A.name=v});
 },
 valid:function(){return A.name.trim().length>1}},

/* 1 · portrait */
{id:'portrait',ch:'their photograph',room:'',
 q:function(){return (A.name?esc(F())+'’s':'Their')+' <em>photograph.</em>'},
 render:function(el){
   el.innerHTML='<div class="fields"><div class="fld"><label>The portrait · on the cover</label>'+
   '<div class="drop2" id="dPort"><input type="file" id="fPort" accept="image/*" style="display:none"/>'+
   (A.portrait?thumb(A.portrait,'rmPort'):'<div class="dbig">Choose the portrait</div><div class="dsm">a face you love</div>')+
   '</div></div></div>';
   var d=document.getElementById('dPort'),f=document.getElementById('fPort');
   d.onclick=function(e){ if(e.target&&e.target.id==='rmPort'){A.portrait='';changed('fast');STEPS[1].render(el);return;} f.click(); };
   d.ondragover=function(e){e.preventDefault();d.classList.add('hover')};
   d.ondragleave=function(){d.classList.remove('hover')};
   d.ondrop=function(e){e.preventDefault();d.classList.remove('hover');if(e.dataTransfer.files[0])ingest(e.dataTransfer.files[0],900,function(url){A.portrait=url;changed('fast');STEPS[1].render(el)})};
   f.onchange=function(){if(f.files[0])ingest(f.files[0],900,function(url){A.portrait=url;changed('fast');STEPS[1].render(el)})};
 },
 skip:'add it later',valid:function(){return true}},

/* 2 · background */
{id:'background',ch:'their photograph',room:'',
 q:function(){return 'A photograph <em>behind '+(A.name?esc(F())+'’s':'their')+' name.</em>'},
 render:function(el){
   el.innerHTML='<div class="fields"><div class="fld"><label>The background · across the cover</label>'+
   '<div class="drop2" id="dBg"><input type="file" id="fBg" accept="image/*" style="display:none"/>'+
   (A.coverbg?thumb(A.coverbg,'rmBg'):'<div class="dbig">Choose the background</div><div class="dsm">a place they loved</div>')+
   '</div></div></div>';
   var d=document.getElementById('dBg'),f=document.getElementById('fBg');
   d.onclick=function(e){ if(e.target&&e.target.id==='rmBg'){A.coverbg='';changed('fast');STEPS[2].render(el);return;} f.click(); };
   d.ondragover=function(e){e.preventDefault();d.classList.add('hover')};
   d.ondragleave=function(){d.classList.remove('hover')};
   d.ondrop=function(e){e.preventDefault();d.classList.remove('hover');if(e.dataTransfer.files[0])ingest(e.dataTransfer.files[0],1800,function(url){A.coverbg=url;changed('fast');STEPS[2].render(el)})};
   f.onchange=function(){if(f.files[0])ingest(f.files[0],1800,function(url){A.coverbg=url;changed('fast');STEPS[2].render(el)})};
 },
 skip:'add it later',valid:function(){return true}},

/* 3 · pronouns */
{id:'pron',ch:'who they were',room:'',
 q:function(){return 'How should '+(A.name?esc(F())+'’s':'the')+' page <em>speak of them?</em>'},
 render:function(el){
   var opts=[{v:'she',t:'Her life'},{v:'he',t:'His life'},{v:'they',t:'Their life'}];
   el.innerHTML='<div class="bigopts">'+opts.map(function(o){return '<button type="button" class="bigopt'+(A.pron===o.v?' on':'')+'" data-v="'+o.v+'"><span class="ring"></span><span><span class="bo1">'+o.t+'</span></span></button>'}).join('')+'</div>';
   el.querySelectorAll('.bigopt').forEach(function(b){b.onclick=function(){
     el.querySelectorAll('.bigopt').forEach(function(x){x.classList.remove('on')});
     b.classList.add('on');A.pron=b.dataset.v;changed('full');
   }});
 },
 valid:function(){return true}},

/* 4 · dates */
{id:'dates',ch:'who they were',room:'',
 q:function(){return 'The dates that <em>held '+(A.name?esc(F())+'’s':'their')+' life.</em>'},
 render:function(el){
   el.innerHTML='<div class="fields">'+
   '<div class="fld"><label>Born</label><div class="d3">'+selMonth('inBm',A.bm)+selDay('inBd',A.bd)+selYear('inBy',A.by,1890,THIS_YEAR)+'</div></div>'+
   '<div class="fld"><label>Passed</label><div class="d3">'+selMonth('inDm',A.dm)+selDay('inDd',A.dd)+selYear('inDy',A.dy,1890,THIS_YEAR)+'</div></div></div>';
   [['inBm','bm'],['inBd','bd'],['inBy','by'],['inDm','dm'],['inDd','dd'],['inDy','dy']].forEach(function(pr){
     bind(pr[0],function(v){A[pr[1]]=v});
   });
 },
 valid:function(){return /^\d{4}$/.test(A.by)&&/^\d{4}$/.test(A.dy)}},

/* 5 · home */
{id:'home',ch:'who they were',room:'',
 q:function(){return 'Where did '+(A.name?esc(F()):'they')+' call <em>home?</em>'},
 render:function(el){
   el.innerHTML='<div class="fields"><div class="fld"><label>City, state</label><input type="text" id="inHome" placeholder="Half Moon Bay, CA" value="'+esc(A.home)+'"/></div></div>';
   bind('inHome',function(v){A.home=v});
 },
 skip:'skip this',valid:function(){return true}},

/* 6 · their words */
{id:'quote',ch:'who they were',room:'',
 q:function(){return 'Something '+(A.name?esc(F()):'they')+' <em>always said.</em>'},
 render:function(el){
   el.innerHTML='<div class="fields"><div class="fld"><label>In their words</label><input type="text" id="inQuote" placeholder="Put the kettle on, and everything will look better." value="'+esc(A.quote)+'"/></div></div>';
   bind('inQuote',function(v){A.quote=v});
 },
 skip:'nothing comes to mind',valid:function(){return true}},

/* 7 · the first memory */
{id:'memory',ch:'the first memory',room:'mem',
 q:function(){return 'Leave the <em>first memory.</em>'},
 render:function(el){
   el.innerHTML='<div class="fields">'+
   '<div class="fld"><label>Give it a title</label><input type="text" id="inMemT" placeholder="Fifty years of Tuesdays" value="'+esc(A.mem.title)+'"/></div>'+
   '<div class="fld"><label>The memory, in your words</label><textarea id="inMemS" placeholder="What do you keep coming back to?">'+esc(A.mem.story)+'</textarea></div>'+
   '<div class="fld"><label>A photograph for it</label><div class="drop2" id="dMem"><input type="file" id="fMem" accept="image/*" style="display:none"/>'+
   (A.mem.photo?thumb(A.mem.photo,'rmMem'):'<div class="dbig">Choose a photograph</div><div class="dsm">it becomes the first moment on the wall</div>')+
   '</div></div></div>';
   bind('inMemT',function(v){A.mem.title=v},'mem');
   bind('inMemS',function(v){A.mem.story=v},'mem');
   var d=document.getElementById('dMem'),f=document.getElementById('fMem');
   d.onclick=function(e){ if(e.target&&e.target.id==='rmMem'){A.mem.photo='';changed('full');STEPS[7].render(el);return;} f.click(); };
   f.onchange=function(){if(f.files[0])ingest(f.files[0],1200,function(url){A.mem.photo=url;changed('full');STEPS[7].render(el)})};
 },
 skip:'the wall can wait',valid:function(){return true}},

/* 8 · chapters */
{id:'chapters',ch:'their life, in chapters',room:'life',
 q:function(){return (A.name?esc(F())+'’s':'Their')+' life, <em>in chapters.</em>'},
 render:function(el){
   if(!A.chapters.length)A.chapters.push({t:'',from:'',to:'',ms:[{y:'',l:'',img:''}]});
   el.innerHTML='<div class="fields" id="chapEd"></div>';
   var ed=document.getElementById('chapEd');
   function momBlock(ci,mi,m){
     return '<div class="momblock" data-c="'+ci+'" data-m="'+mi+'">'+
     '<button type="button" class="mx" data-c="'+ci+'" data-m="'+mi+'" aria-label="Remove this moment">✕</button>'+
     '<div class="mgrid">'+
     '<div><span class="mlbl">Year</span>'+selYear('mY'+ci+'_'+mi,m.y,1890,THIS_YEAR)+'</div>'+
     '<div><span class="mlbl">What happened</span><input type="text" class="m-tt" placeholder="Married the love of her life" value="'+esc(m.l)+'"/></div>'+
     '</div>'+
     (m.img?'<div class="thumbrow"><span class="th mini"><img src="'+m.img+'" alt=""/></span><button type="button" class="rmup m-rmimg" aria-label="Remove this photo">✕ remove</button></div>'
           :'<button type="button" class="mphotobtn m-addimg">a photograph for this moment</button><input type="file" class="m-file" accept="image/*" style="display:none"/>')+
     '</div>';
   }
   function redraw(){
     ed.innerHTML=A.chapters.map(function(c,ci){
       return '<div class="chapcard" data-c="'+ci+'">'+
       '<button type="button" class="chx" data-c="'+ci+'" aria-label="Remove this chapter">✕</button>'+
       '<div><span class="mlbl">A chapter of '+esc(P().pa)+' life</span>'+
       '<input type="text" class="chnamein" placeholder="The teacher · the garden years" value="'+esc(c.t)+'"/></div>'+
       '<div class="mgrid" style="margin-top:8px"><div><span class="mlbl">From</span>'+selYear('cF'+ci,c.from,1890,THIS_YEAR)+'</div><div><span class="mlbl">To</span>'+selYear('cT'+ci,c.to,1890,THIS_YEAR)+'</div></div>'+
       c.ms.map(function(m,mi){return momBlock(ci,mi,m)}).join('')+
       '<button type="button" class="addmoment" data-c="'+ci+'">add a moment to this chapter</button>'+
       '</div>';
     }).join('')+'<button type="button" class="addchapter" id="addChap">another chapter of '+esc(P().pa)+' life</button>';
     wire();
   }
   function wire(){
     ed.querySelectorAll('.chapcard').forEach(function(card){
       var ci=+card.dataset.c,c=A.chapters[ci];
       card.querySelector('.chnamein').addEventListener('input',function(){c.t=this.value;changed('chap')});
       card.querySelector('#cF'+ci).addEventListener('change',function(){c.from=this.value;changed('chap')});
       card.querySelector('#cT'+ci).addEventListener('change',function(){c.to=this.value;changed('chap')});
       card.querySelector('.chx').onclick=function(){A.chapters.splice(ci,1);redraw();changed('full')};
     });
     ed.querySelectorAll('.momblock').forEach(function(blk){
       var ci=+blk.dataset.c,mi=+blk.dataset.m,m=A.chapters[ci].ms[mi];
       blk.querySelector('select').addEventListener('change',function(){m.y=this.value;changed('chap')});
       blk.querySelector('.m-tt').addEventListener('input',function(){m.l=this.value;changed('chap')});
       var addBtn=blk.querySelector('.m-addimg'), fp=blk.querySelector('.m-file');
       if(addBtn)addBtn.onclick=function(){fp.click()};
       if(fp)fp.onchange=function(){ if(fp.files[0])ingest(fp.files[0],1200,function(url){m.img=url;redraw();changed('full')}) };
       var rmImg=blk.querySelector('.m-rmimg');
       if(rmImg)rmImg.onclick=function(){m.img='';redraw();changed('full')};
       blk.querySelector('.mx').onclick=function(){
         A.chapters[ci].ms.splice(mi,1);
         if(!A.chapters[ci].ms.length)A.chapters[ci].ms.push({y:'',l:'',img:''});
         redraw();changed('full');
       };
     });
     ed.querySelectorAll('.addmoment').forEach(function(b){b.onclick=function(){
       A.chapters[+b.dataset.c].ms.push({y:'',l:'',img:''});redraw();
     }});
     var ac=document.getElementById('addChap');
     if(ac)ac.onclick=function(){A.chapters.push({t:'',from:'',to:'',ms:[{y:'',l:'',img:''}]});redraw();};
   }
   redraw();
 },
 skip:'write them later',valid:function(){return true}},

/* 9 · the album */
{id:'photos',ch:'their album',room:'pho',
 q:function(){return 'Photographs, so the page <em>feels like '+(A.name?esc(F()):'them')+'.</em>'},
 render:function(el){
   var over=A.photos.length>12&&previewPlan()!=='plus';
   el.innerHTML='<div class="drop2" id="gdrop"><input type="file" id="inGal" accept="image/*" multiple style="display:none"/>'+
   '<div class="dbig">'+(A.photos.length?A.photos.length+' photograph'+(A.photos.length>1?'s':'')+' in the album':'Choose photographs')+'</div>'+
   '<div class="dsm">tap here · choose as many as you like</div></div>'+
   '<div class="addlist" id="phList"></div>'+
   (over?'<div class="planline">The first 12 shine now — the rest wait, safe. <b>Plus keeps every photograph.</b></div>':'');
   var list=document.getElementById('phList');
   function paint(){
     list.innerHTML=A.photos.map(function(p,i){
       return '<div class="addedrow phrow"><span class="th mini"><img src="'+p.src+'" alt=""/></span>'+
       '<input type="text" class="inp-cap" data-i="'+i+'" placeholder="a line for it" value="'+esc(p.cap)+'"/>'+
       selYear('phY'+i,p.wy,1890,THIS_YEAR,'Year')+
       '<button type="button" class="rm" data-i="'+i+'" aria-label="Remove">✕</button></div>';
     }).join('');
     /* captions commit when you leave the field · the page never flickers mid-word */
     list.querySelectorAll('.inp-cap').forEach(function(inp){inp.addEventListener('change',function(){A.photos[+inp.dataset.i].cap=inp.value;changed('full')})});
     A.photos.forEach(function(p,i){var s=document.getElementById('phY'+i);if(s)s.addEventListener('change',function(){p.wy=s.value;changed('full')})});
     list.querySelectorAll('.rm').forEach(function(b){b.onclick=function(){A.photos.splice(+b.dataset.i,1);STEPS[9].render(el);changed('full')}});
   }
   paint();
   var d=document.getElementById('gdrop'),f=document.getElementById('inGal');
   d.onclick=function(){f.click()};
   d.ondragover=function(e){e.preventDefault();d.classList.add('hover')};
   d.ondragleave=function(){d.classList.remove('hover')};
   d.ondrop=function(e){e.preventDefault();d.classList.remove('hover');handle(e.dataTransfer.files)};
   f.onchange=function(){handle(f.files)};
   function handle(files){
     var arr=Array.prototype.slice.call(files,0,20),left=arr.length;
     if(!left)return;
     arr.forEach(function(file){ingest(file,1400,function(url){A.photos.push({src:url,cap:'',wm:'',wy:''});left--;if(!left){STEPS[9].render(el);changed('full')}})});
   }
 },
 skip:'add them later',valid:function(){return true}},

/* 10 · tapes */
{id:'tapes',ch:'their tapes',room:'tape',
 q:function(){return 'Videos, so <em>'+(A.name?esc(F()):'they')+'</em> can still move and laugh.'},
 render:function(el){
   el.innerHTML='<div class="drop2" id="vdrop"><input type="file" id="inVid" accept="video/*" multiple style="display:none"/>'+
   '<div class="dbig">'+(A.tapes.length?A.tapes.length+' film'+(A.tapes.length>1?'s':'')+' on the shelf':'Choose videos')+'</div>'+
   '<div class="dsm">phone videos are perfect · part of Plus, kept safe either way</div></div>'+
   '<div class="fields" id="tpEd"></div>';
   var ed=document.getElementById('tpEd');
   function redraw(){
     ed.innerHTML=A.tapes.map(function(t,i){
       return '<div class="chapcard" data-i="'+i+'">'+
       '<button type="button" class="chx" data-i="'+i+'" aria-label="Remove this film">✕</button>'+
       '<div class="tp-head">'+(t.cover?'<span class="th mini tpth"><img src="'+t.cover+'" alt=""/><i>▸</i></span>':'')+
       '<div style="flex:1;min-width:0"><span class="mlbl">What it holds</span>'+
       '<input type="text" class="chnamein tp-t" placeholder="Her seventieth · the toast" value="'+esc(t.t)+'"/></div></div>'+
       '<div class="mgrid" style="margin-top:8px"><div><span class="mlbl">When · if known</span>'+selYear('tpY'+i,t.wy,1890,THIS_YEAR)+'</div>'+
       '<div><span class="mlbl">Its cover</span><button type="button" class="mphotobtn tp-cover">'+(t.cover?'change the still':'choose a still')+'</button><input type="file" class="tp-cfile" accept="image/*" style="display:none"/></div></div>'+
       (t.dur?'<div class="mlbl" style="margin-top:6px">'+esc(t.dur)+(t.url?' · plays on this device':'')+'</div>':'')+
       '</div>';
     }).join('');
     ed.querySelectorAll('.chapcard').forEach(function(card){
       var i=+card.dataset.i,t=A.tapes[i];
       card.querySelector('.tp-t').addEventListener('input',function(){t.t=this.value;changed('chap')});
       card.querySelector('#tpY'+i).addEventListener('change',function(){t.wy=this.value;changed('full')});
       var cf=card.querySelector('.tp-cfile');
       card.querySelector('.tp-cover').onclick=function(){cf.click()};
       cf.onchange=function(){if(cf.files[0])ingest(cf.files[0],900,function(url){t.cover=url;redraw();changed('full')})};
       card.querySelector('.chx').onclick=function(){A.tapes.splice(i,1);redraw();changed('full')};
     });
   }
   redraw();
   var d=document.getElementById('vdrop'),f=document.getElementById('inVid');
   d.onclick=function(){f.click()};
   f.onchange=function(){
     var arr=Array.prototype.slice.call(f.files,0,6),left=arr.length;
     if(!left)return;
     arr.forEach(function(file){
       ingestVideo(file,function(res){
         A.tapes.push({t:file.name.replace(/\.[^.]+$/,'').replace(/[-_]/g,' '),wm:'',wy:'',dur:res.dur,cover:res.cover,url:res.url});
         left--; if(!left){redraw();changed('full');}
       });
     });
   };
 },
 skip:'not right now',valid:function(){return true}},

/* 11 · their people */
{id:'family',ch:'their people',room:'tree',
 q:function(){return (A.name?esc(F())+'’s':'Their')+' <em>people.</em>'},
 render:function(el){
   var RELS=[['mother','Their mother'],['father','Their father'],['grandmother','Their grandmother'],['grandfather','Their grandfather'],
     ['partner','Their partner'],['sibling','A sibling'],['child','A child'],['grandchild','A grandchild'],
     ['niece','A niece or nephew'],['aunt','An aunt or uncle'],['cousin','A cousin'],['chosen','Chosen family · a friend']];
   var kids=A.family.filter(function(f){return f.rel==='child'&&(f.name||'').trim()});
   var sibs=A.family.filter(function(f){return f.rel==='sibling'&&(f.name||'').trim()});
   var pars=A.family.filter(function(f){return (f.rel==='mother'||f.rel==='father')&&(f.name||'').trim()});
   el.innerHTML='<div class="addlist" id="famList"></div>'+
   '<div class="chapcard" id="famForm">'+
   '<div><span class="mlbl">Their name</span><input type="text" id="famName" class="chnamein" placeholder="Thomas Hayes"/></div>'+
   '<div style="margin-top:8px"><span class="mlbl">How they are related to '+esc(F())+'</span><select id="famRel" class="dsel">'+RELS.map(function(r){return '<option value="'+r[0]+'">'+r[1]+'</option>'}).join('')+'</select></div>'+
   '<div id="famVia" style="display:none;margin-top:8px"><span class="mlbl" id="famViaLbl">Through whom?</span><select id="famViaSel" class="dsel"><option value="">Just place them</option></select></div>'+
   '<div class="mgrid" style="margin-top:8px"><div><span class="mlbl">Born · if known</span>'+selYear('famBy','',1890,THIS_YEAR)+'</div><div><span class="mlbl">Passed · blank if still with us</span>'+selYear('famDy','',1890,THIS_YEAR)+'</div></div>'+
   '<div style="margin-top:8px"><span class="mlbl">Their face · for their card on the tree</span><button type="button" class="mphotobtn" id="famPhotoBtn" style="margin-top:0">'+(this._pendPhoto?'✓ chosen · tap to change':'a photograph, if you have one')+'</button><input type="file" id="famPhoto" accept="image/*" style="display:none"/>'+(this._pendPhoto?'<div class="thumbrow"><span class="th mini"><img src="'+this._pendPhoto+'" alt=""/></span><button type="button" class="rmup" id="famPhotoRm">✕ remove</button></div>':'')+'</div>'+
   '<button type="button" class="addmoment" id="famAdd" style="margin-top:10px">Add to the tree</button>'+
   '</div>';
   var list=document.getElementById('famList');
   function relLabel(rel){var m={mother:'mother',father:'father',grandmother:'grandmother',grandfather:'grandfather',partner:'partner',sibling:'sibling',child:'child',grandchild:'grandchild',niece:'niece · nephew',aunt:'aunt · uncle',cousin:'cousin',chosen:'chosen family'};return m[rel]||rel}
   var self=this;
   function paint(){
     list.innerHTML=A.family.map(function(f,i){
       return '<div class="addedrow">'+(f.photo?'<span class="th mini" style="width:28px;height:28px"><img src="'+f.photo+'" alt=""/></span>':'<span style="color:var(--terra)">✿</span>')+' <b>'+esc(f.name)+'</b>&nbsp;· '+relLabel(f.rel)+(f.by||f.dy?' · '+(f.by&&f.dy?f.by+'–'+f.dy:(f.by?'b. '+f.by:'d. '+f.dy)):'')+' <button type="button" class="rm" data-i="'+i+'" aria-label="Remove">✕</button></div>';
     }).join('');
     list.querySelectorAll('.rm').forEach(function(b){b.onclick=function(){A.family.splice(+b.dataset.i,1);self._pendPhoto='';STEPS[11].render(el);changed('full')}});
   }
   paint();
   var relSel=document.getElementById('famRel');
   function viaFor(rel){
     if(rel==='grandchild')return {label:'Through which child?',opts:kids};
     if(rel==='niece')return {label:'Through which sibling?',opts:sibs};
     if(rel==='grandmother'||rel==='grandfather'||rel==='aunt')return {label:'On whose side?',opts:pars};
     return null;
   }
   relSel.addEventListener('change',function(){
     var v=viaFor(relSel.value);
     var box=document.getElementById('famVia');
     if(v&&v.opts.length){
       document.getElementById('famViaLbl').textContent=v.label;
       document.getElementById('famViaSel').innerHTML='<option value="">Just place them</option>'+v.opts.map(function(k){return '<option>'+esc(k.name)+'</option>'}).join('');
       box.style.display='block';
     }else box.style.display='none';
   });
   var fpIn=document.getElementById('famPhoto');
   if(fpIn)fpIn.onchange=function(){
     if(!fpIn.files[0])return;
     ingest(fpIn.files[0],600,function(url){ self._pendPhoto=url; STEPS[11].render(el); });
   };
   if(!window.__famWire){
     window.__famWire=true;
     document.addEventListener('click',function(e){
       var t=e.target.closest?e.target.closest('#famPhotoBtn,#famAdd,#famPhotoRm'):null;
       if(!t)return;
       e.preventDefault();
       var st=STEPS[11];
       if(t.id==='famPhotoBtn'){ var fi=document.getElementById('famPhoto'); if(fi)fi.click(); return; }
       if(t.id==='famPhotoRm'){ st._pendPhoto=''; var body=document.querySelector('#famForm')&&document.querySelector('#famForm').closest('.body'); if(body)st.render(body); return; }
       var nmEl=document.getElementById('famName');
       var nm=nmEl?nmEl.value.trim():'';
       if(!nm)return;
       var relEl=document.getElementById('famRel');
       var viaEl=document.getElementById('famViaSel');
       A.family.push({name:nm,rel:relEl?relEl.value:'chosen',by:(document.getElementById('famBy')||{}).value||'',dy:(document.getElementById('famDy')||{}).value||'',
         via:viaEl&&viaEl.closest('#famVia').style.display!=='none'?viaEl.value:'',photo:st._pendPhoto||''});
       st._pendPhoto='';
       var body2=nmEl.closest('.body');
       if(body2)st.render(body2);
       changed('full');
       setTimeout(function(){var f2=document.getElementById('famName');if(f2)f2.focus()},60);
     },true);
   }
 },
 skip:'the tree can grow later',valid:function(){return true}},

/* 12 · the service */
{id:'service',ch:'the service',room:'',
 q:function(){return 'Is there a <em>service planned?</em>'},
 render:function(el){
   var s=A.svc;
   el.innerHTML='<div class="fields">'+
   '<div class="fld"><label>When</label><div class="d3">'+selMonth('svM',s.m)+selDay('svD',s.d)+selYear('svY',s.y,THIS_YEAR-1,THIS_YEAR+2)+'</div></div>'+
   '<div class="fld"><label>What time</label>'+selTime('svT',s.time)+'</div>'+
   '<div class="fld"><label>Where</label><input type="text" id="svW" placeholder="Linden Community Chapel" value="'+esc(s.where)+'"/></div>'+
   '<div class="fld"><label>The address</label><input type="text" id="svA" placeholder="142 Seaside Avenue, Half Moon Bay, CA" value="'+esc(s.addr)+'"/></div>'+
   '<div class="fld"><label>Anything guests should know</label><input type="text" id="svN" placeholder="Parking behind the chapel" value="'+esc(s.note)+'"/></div></div>';
   [['svM','m'],['svD','d'],['svY','y'],['svT','time'],['svW','where'],['svA','addr'],['svN','note']].forEach(function(pr){
     bind(pr[0],function(v){A.svc[pr[1]]=v});
   });
 },
 skip:'not yet',valid:function(){return true}},

/* 13 · address + plan */
{id:'address',ch:'their address',room:'',
 q:function(){return CTX.published?'Everything is <em>kept.</em>':'Everything is <em>ready.</em>'},
 render:function(el){
   var addrLine=CTX.published?('imissyoumemorial.com/'+esc(CTX.slug)):'imissyoumemorial.com/··········';
   var addrNote=CTX.published
     ?(CTX.plan==='plus'?'chosen, and '+P().poss+' for good':'a random address · Plus chooses its name')
     :'a random address is minted when you publish · <b>Plus chooses its name</b>';
   var html='<div class="sealbox"><div class="k2">where the page lives</div>'+
     '<div class="addr2">'+addrLine+'</div>'+
     '<div class="note">'+addrNote+'</div></div>';
   if(!(CTX.published&&CTX.plan==='plus')){
     html+='<div class="bigopts" style="margin-top:14px">'+
     '<button type="button" class="bigopt'+(A._plan!=='plus'?' on':'')+'" data-v="free"><span class="ring"></span><span><span class="bo1">Free · $0</span><span class="bo2">the page, online forever · 12 photographs · the wall open to ten memories</span></span></button>'+
     '<button type="button" class="bigopt'+(A._plan==='plus'?' on':'')+'" data-v="plus"><span class="ring"></span><span><span class="bo1">Plus · $197 lifetime</span><span class="bo2">every photograph and video · '+esc(P().pa)+' voice · a chosen address · AI photo restoration</span></span></button>'+
     '</div>';
   }
   el.innerHTML=html;
   el.querySelectorAll('.bigopt').forEach(function(b){b.onclick=function(){
     el.querySelectorAll('.bigopt').forEach(function(x){x.classList.remove('on')});
     b.classList.add('on');A._plan=b.dataset.v;changed('full');refreshCont();
   }});
 },
 cont:function(){
   if(CTX.published)return (A._plan==='plus'&&CTX.plan!=='plus')?'Continue to secure checkout':'Save · back to the dashboard';
   return 'Publish '+(P().pa)+' page';
 },
 valid:function(){return true}}
];

var KIND2STEP={name:0,cover:0,portrait:1,background:2,pron:3,dates:4,home:5,quote:6,memory:7,chapters:8,photos:9,tapes:10,tree:11,family:11,service:12,address:13};
var ROOM2STEP={mem:7,life:8,pho:9,tape:10,tree:11};
function stepRoom(i){return STEPS[i]?STEPS[i].room:''}

/* ═══ the walk ═══ */
var cur=0;
var lbody=document.getElementById('lbody');
function buildGarland(){
  var g=document.getElementById('garland');
  if(g)g.innerHTML=STEPS.map(function(_,i){return '<span class="gd" data-i="'+i+'"></span>'}).join('');
}
function paintGarland(){
  document.querySelectorAll('.gd').forEach(function(d,i){
    d.classList.toggle('done',i<cur);d.classList.toggle('now',i===cur);
    d.onclick=function(){goto(i)};
  });
  var f=document.getElementById('pFill'),c=document.getElementById('pCnt');
  if(f)f.style.width=Math.round(((cur+1)/STEPS.length)*100)+'%';
  if(c)c.textContent=(cur+1)+' of '+STEPS.length;
}
function paintJump(){
  var j=document.getElementById('jumpRow');
  if(!j)return;
  var groups=[['the cover',0],['memories',7],['chapters',8],['photos',9],['tapes',10],['family',11],['service',12],['the address',13]];
  j.innerHTML=groups.map(function(g){
    var on=(cur===g[1])||(g[1]===0&&cur<7);
    return '<button type="button" class="chip'+(on?' on':'')+'" data-i="'+g[1]+'">'+g[0]+'</button>';
  }).join('');
  j.querySelectorAll('.chip').forEach(function(c){c.onclick=function(){goto(+c.dataset.i)}});
}
function refreshCont(){
  var s=STEPS[cur];
  var b=document.getElementById('contBtn');
  b.disabled=!s.valid();
  b.textContent=typeof s.cont==='function'?s.cont():(s.cont||(cur===STEPS.length-1?'Publish':'Continue'));
}
function goto(i){
  if(i<0)i=0;if(i>=STEPS.length)i=STEPS.length-1;
  cur=i;var s=STEPS[cur];
  lbody.innerHTML='';
  var el=document.createElement('div');el.className='step on';
  el.innerHTML='<h1>'+s.q()+'</h1><div class="body"></div>';
  lbody.appendChild(el);
  s.render(el.querySelector('.body'));
  document.getElementById('chapterLbl').textContent=s.ch;
  document.getElementById('backBtn').style.visibility=cur>0?'visible':'hidden';
  var sk=document.getElementById('skipBtn');
  if(s.skip&&cur<STEPS.length-1){sk.style.visibility='visible';sk.textContent=s.skip}else{sk.style.visibility='hidden'}
  paintGarland();paintJump();refreshCont();
  pvRoom=s.room||'';
  if(s.room)pvCmd('room',{room:s.room});
  else pvCmd('scrolltop');
  if(s.id==='service')pvCmd('flyer',{open:true}); else pvCmd('flyer',{open:false});
  var f=el.querySelector('input[type=text],textarea');
  if(f&&window.innerWidth>900)setTimeout(function(){f.focus()},350);
  if(window.innerWidth<=900)lbody.scrollTop=0;
  A._i=cur;persist();
}
document.getElementById('contBtn').onclick=function(){
  if(cur<STEPS.length-1){goto(cur+1);return;}
  A._i=cur;
  IMY.send('draft',{draft:A});
  if(CTX.published){
    if(A._plan==='plus'&&CTX.plan!=='plus'){ IMY.send('publish',{draft:A,plan:'plus'}); return; }
    IMY.send('publish',{draft:A,plan:CTX.plan}); return;
  }
  IMY.send('publish',{draft:A,plan:A._plan});
};
document.getElementById('backBtn').onclick=function(){goto(cur-1)};
document.getElementById('skipBtn').onclick=function(){if(cur<STEPS.length-1)goto(cur+1)};
document.addEventListener('keydown',function(e){
  if(e.key==='Enter'&&e.target.tagName!=='TEXTAREA'&&e.target.tagName!=='BUTTON'&&e.target.tagName!=='SELECT'){
    var b=document.getElementById('contBtn');
    var cl=e.target.classList||{contains:function(){return false}};
    if(cl.contains('m-tt')||cl.contains('chnamein')||cl.contains('inp-cap')||e.target.id==='famName')return;
    if(!b.disabled&&!e.defaultPrevented){e.preventDefault();b.click()}
  }
});

/* ═══ boot ═══ */
function boot(ctx){
  booted=true;
  CTX.mode=ctx.mode||'new';
  CTX.account=ctx.account||{};
  CTX.price=ctx.price||CTX.price;
  CTX.published=!!ctx.published;
  CTX.slug=ctx.slug||'';
  CTX.plan=ctx.plan==='plus'?'plus':(ctx.plan||'free');
  CTX.m=ctx.m||'new';
  CTX.counts=ctx.counts||null;
  if(ctx.draft){ try{ Object.keys(A).forEach(function(k){ if(ctx.draft[k]!=null)A[k]=ctx.draft[k]; }); }catch(e){} }
  if(ctx.plan==='plus-intent')A._plan='plus';
  if(CTX.published&&CTX.plan==='plus')A._plan='plus';
  /* no hints, no whispers — the door out and the room to breathe */
  var hint=document.querySelector('.mhint'); if(hint)hint.style.display='none';
  var lh=document.querySelector('.lhead');
  if(lh){
    var exit=document.createElement('button');
    exit.type='button'; exit.id='exitBtn'; exit.className='lexit';
    exit.textContent=CTX.published?'← dashboard':'← leave';
    exit.addEventListener('click',function(){
      IMY.send('draft',{draft:A});
      IMY.send('nav',CTX.published?{go:'dashboard'}:{go:'landing'});
    });
    lh.insertBefore(exit,lh.firstChild);
    var tuck=document.createElement('button');
    tuck.type='button'; tuck.id='tuckBtn'; tuck.className='ltuck'; tuck.setAttribute('aria-label','Tuck the questions away to see the page');
    tuck.innerHTML='⌄';
    lh.appendChild(tuck);
    tuck.addEventListener('click',function(){
      var min=document.body.classList.toggle('letter-min');
      tuck.innerHTML=min?'⌃':'⌄';
    });
  }
  if(CTX.published){
    var j=document.createElement('div');j.id='jumpRow';j.className='chiprow jumprow';
    lh.parentNode.insertBefore(j,lh.nextSibling);
  }
  buildGarland();
  requestCompose();
  var start=(typeof ctx.draft==='object'&&ctx.draft&&typeof ctx.draft._i==='number')?ctx.draft._i:0;
  if(CTX.published)start=0;
  if(ctx.step&&KIND2STEP[ctx.step]!=null)start=KIND2STEP[ctx.step];
  goto(Math.min(start,STEPS.length-1));
}
IMY.send('ready',{});
})();
