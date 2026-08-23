/* ═══ IMY Studio · the letter writes the real page ═══
   The preview beside the letter IS the tribute page (edit mode).
   Every answer maps to something the page renders — nothing else is asked. */
(function(){
'use strict';

/* ── draft ── */
var A={name:'',rel:'',pron:'they',bm:'',bd:'',by:'',dm:'',dd:'',dy:'',home:'',quote:'',story:'',
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

/* ── select builders · dates are chosen, never typed ── */
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

/* ── image intake · gently resized so the page stays light ── */
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
window.addEventListener('message',function(e){
  var m=e.data;
  /* from the shell */
  if(m&&m.type==='imy-cmd'&&m.action==='preview'){
    pvReady=false;
    pv.addEventListener('load',function onl(){
      pv.removeEventListener('load',onl);
      pvVeil.classList.add('off');
      setTimeout(function(){ if(pvRoom)pvCmd('room',{room:pvRoom}); else pvCmd('scrolltop'); },420);
    });
    pv.srcdoc=m.data.src;
    return;
  }
  if(m&&m.type==='imy-init'&&!booted){ boot(m.data||{}); return; }
  /* from the page in the preview */
  if(pv&&e.source===pv.contentWindow&&m&&m.type==='imy'){
    if(m.action==='edit'){ var i=KIND2STEP[m.data.kind]; if(i!=null)goto(i); }
    if(m.action==='room'){ var j=ROOM2STEP[m.data.room]; if(j!=null&&stepRoom(cur)!==m.data.room)goto(j); }
    if(m.action==='tribute-ready'){ pvReady=true; }
    /* nav intents inside the preview stay inside the studio */
  }
});

/* ── autosave ── */
var draftT=null,saveT=null;
function persist(){ clearTimeout(draftT); draftT=setTimeout(function(){ A._i=cur; IMY.send('draft',{draft:A}); },700); }
function markSaved(){var c=document.getElementById('savedChip');c.classList.add('show');clearTimeout(saveT);saveT=setTimeout(function(){c.classList.remove('show')},1800)}
function changed(kind){ markSaved(); persist(); refreshCont(); if(kind==='fast')fastPerson(); else requestCompose(); }
function bind(id,fn,kind){var el=document.getElementById(id);if(!el)return;el.addEventListener(el.tagName==='SELECT'?'change':'input',function(){fn(el.value);changed(kind||'fast')})}

/* the story drafted from the chapters */
/* 8b helpers · the story drafted from the chapters */
function draftStory(){
  var f=firstName()||'They', Pp=P();
  var bits=[];
  var born=A.by?(f+' was born'+(A.bm?' in '+MONTHS[+A.bm-1]:'')+' '+A.by+((A.home||'').trim()?' in '+A.home.trim():'')+'.'):((A.home||'').trim()?f+' called '+A.home.trim()+' home.':'');
  if(born)bits.push(born);
  var chs=A.chapters.filter(function(c){return (c.t||'').trim()});
  if(chs.length)bits.push('Life came in chapters: '+chs.map(function(c){return c.t.trim().toLowerCase()}).join(', ')+'.');
  var fam=A.family.filter(function(x){return x.rel==='child'}).length;
  if(fam)bits.push(Pp.C+' family grew around '+Pp.o+': '+fam+(fam===1?' child':' children')+', and everyone they brought home.');
  if((A.quote||'').trim())bits.push('If you knew '+Pp.o+', you heard it: \u201c'+A.quote.trim().replace(/^[\u201c"]|[\u201d"]$/g,'')+'\u201d');
  return bits.join(' ');
}

/* ═══ the steps · each one maps to the page ═══ */
var STEPS=[

/* 0 · name */
{id:'name',ch:'who they were',room:'',tag:'',
 q:function(){return 'What was their <em>name?</em>'},
 sub:'As it will stand at the top of the page.',
 render:function(el){
   el.innerHTML='<div class="fields"><div class="fld"><label>Their full name</label><input type="text" id="inName" autocomplete="off" placeholder="Eleanor Margaret Hayes" value="'+esc(A.name)+'"/></div></div>';
   bind('inName',function(v){A.name=v});
 },
 valid:function(){return A.name.trim().length>1}},

/* 1 · relation */
{id:'rel',ch:'who they were',room:'',tag:'',
 q:function(){return 'Who '+(A.name?'was '+esc(F()):'were they')+' <em>to you?</em>'},
 sub:'This also places you on the family tree.',
 render:function(el){
   var rels=['My mother','My father','My grandmother','My grandfather','My wife','My husband','My partner','My sister','My brother','My daughter','My son','My friend'];
   el.innerHTML='<div class="chiprow">'+rels.map(function(r){return '<button type="button" class="chip'+(A.rel===r?' on':'')+'" data-v="'+r+'">'+r+'</button>'}).join('')+'</div>';
   el.querySelectorAll('.chip').forEach(function(c){c.onclick=function(){
     el.querySelectorAll('.chip').forEach(function(x){x.classList.remove('on')});
     c.classList.add('on');A.rel=c.dataset.v;
     var g={mother:'she',grandmother:'she',wife:'she',sister:'she',daughter:'she',father:'he',grandfather:'he',husband:'he',brother:'he',son:'he'};
     var k=c.dataset.v.replace('My ','');if(g[k])A.pron=g[k];
     changed('full');
   }});
 },
 valid:function(){return !!A.rel}},

/* 2 · pronouns */
{id:'pron',ch:'who they were',room:'',tag:'',
 q:function(){return 'How should '+(A.name?esc(F())+'’s':'the')+' page <em>speak of them?</em>'},
 sub:'The page speaks these words everywhere. Watch the tabs change.',
 render:function(el){
   var opts=[{v:'she',t:'Her life',s:'she · her'},{v:'he',t:'His life',s:'he · him'},{v:'they',t:'Their life',s:'they · them'}];
   el.innerHTML='<div class="bigopts">'+opts.map(function(o){return '<button type="button" class="bigopt'+(A.pron===o.v?' on':'')+'" data-v="'+o.v+'"><span class="ring"></span><span><span class="bo1">'+o.t+'</span><span class="bo2">'+o.s+'</span></span></button>'}).join('')+'</div>';
   el.querySelectorAll('.bigopt').forEach(function(b){b.onclick=function(){
     el.querySelectorAll('.bigopt').forEach(function(x){x.classList.remove('on')});
     b.classList.add('on');A.pron=b.dataset.v;changed('full');
   }});
 },
 skip:'their story is right · continue',
 valid:function(){return true}},

/* 3 · dates · chosen, never typed */
{id:'dates',ch:'who they were',room:'',tag:'',
 q:function(){return 'The dates that <em>held '+(A.name?esc(F())+'’s':'their')+' life.</em>'},
 sub:'Years are enough. Add month and day if you know them.',
 render:function(el){
   el.innerHTML='<div class="fields">'+
   '<div class="fld"><label>Born</label><div class="d3">'+selMonth('inBm',A.bm)+selDay('inBd',A.bd)+selYear('inBy',A.by,1890,THIS_YEAR)+'</div></div>'+
   '<div class="fld"><label>Passed</label><div class="d3">'+selMonth('inDm',A.dm)+selDay('inDd',A.dd)+selYear('inDy',A.dy,1890,THIS_YEAR)+'</div></div></div>';
   [['inBm','bm'],['inBd','bd'],['inBy','by'],['inDm','dm'],['inDd','dd'],['inDy','dy']].forEach(function(pr){
     bind(pr[0],function(v){A[pr[1]]=v});
   });
 },
 valid:function(){return /^\d{4}$/.test(A.by)&&/^\d{4}$/.test(A.dy)}},

/* 4 · home */
{id:'home',ch:'who they were',room:'',tag:'',
 q:function(){return 'Where did '+(A.name?esc(F()):'they')+' call <em>home?</em>'},
 sub:'Shown beside the dates at the top of the page.',
 render:function(el){
   el.innerHTML='<div class="fields"><div class="fld"><label>City, state</label><input type="text" id="inHome" placeholder="Half Moon Bay, CA" value="'+esc(A.home)+'"/></div></div>';
   bind('inHome',function(v){A.home=v});
 },
 skip:'skip this',valid:function(){return true}},

/* 5 · their words */
{id:'quote',ch:'who they were',room:'',tag:'',
 q:function(){return 'Something '+(A.name?esc(F()):'they')+' <em>always said.</em>'},
 sub:'Shown in quotation marks beneath their name.',
 render:function(el){
   el.innerHTML='<div class="fields"><div class="fld"><label>In their words</label><input type="text" id="inQuote" placeholder="Put the kettle on, sit in the garden, and everything will look better." value="'+esc(A.quote)+'"/></div></div>';
   bind('inQuote',function(v){A.quote=v});
 },
 skip:'nothing comes to mind · skip',valid:function(){return true}},

/* 6 · photographs of them */
{id:'portrait',ch:'their portrait',room:'',tag:'',
 q:function(){return (A.name?esc(F())+'’s':'Their')+' <em>photograph.</em>'},
 sub:'The portrait sits in the cover frame. A wide photo behind it becomes the backdrop.',
 render:function(el){
   el.innerHTML='<div class="fields">'+
   '<div class="drop2" id="dPort"><input type="file" id="fPort" accept="image/*" style="display:none"/>'+(A.portrait?'<div class="thumbrow"><span class="th cover"><img src="'+A.portrait+'" alt=""/></span></div><div class="dsm">the portrait · tap to change</div>':'<div class="dbig">Choose the portrait</div><div class="dsm">a face you love · it fills the arch</div>')+'</div>'+
   '<div class="drop2" id="dBg"><input type="file" id="fBg" accept="image/*" style="display:none"/>'+(A.coverbg?'<div class="thumbrow"><span class="th cover"><img src="'+A.coverbg+'" alt=""/></span></div><div class="dsm">the backdrop · tap to change</div>':'<div class="dbig">A backdrop, behind the name</div><div class="dsm">optional · a place they loved works beautifully</div>')+'</div></div>';
   function wire(dropId,fileId,key){
     var d=document.getElementById(dropId),f=document.getElementById(fileId);
     d.onclick=function(){f.click()};
     d.ondragover=function(e){e.preventDefault();d.classList.add('hover')};
     d.ondragleave=function(){d.classList.remove('hover')};
     d.ondrop=function(e){e.preventDefault();d.classList.remove('hover');if(e.dataTransfer.files[0])take(e.dataTransfer.files[0])};
     f.onchange=function(){if(f.files[0])take(f.files[0])};
     function take(file){ingest(file,key==='coverbg'?1800:900,function(url){A[key]=url;changed('fast');cur===6&&STEPS[6].render(el)})}
   }
   wire('dPort','fPort','portrait');
   wire('dBg','fBg','coverbg');
 },
 skip:'add photographs later',valid:function(){return true}},

/* 7 · the first memory */
{id:'memory',ch:'the first memory',room:'mem',tag:'',
 q:function(){return 'Leave the <em>first memory.</em>'},
 sub:function(){return 'The wall opens with yours. Every memory a visitor leaves waits for you before it appears.'},
 render:function(el){
   el.innerHTML='<div class="fields">'+
   '<div class="fld"><label>Give it a title</label><input type="text" id="inMemT" placeholder="Fifty years of Tuesdays" value="'+esc(A.mem.title)+'"/></div>'+
   '<div class="fld"><label>The memory, in your words</label><textarea id="inMemS" placeholder="What do you keep coming back to?">'+esc(A.mem.story)+'</textarea></div>'+
   '<div class="drop2" id="dMem"><input type="file" id="fMem" accept="image/*" style="display:none"/>'+(A.mem.photo?'<div class="thumbrow"><span class="th cover"><img src="'+A.mem.photo+'" alt=""/></span></div><div class="dsm">its photograph · tap to change</div>':'<div class="dbig">A photograph for it</div><div class="dsm">optional · it becomes the first moment on the wall</div>')+'</div>'+
   '<div class="lnote">shown as remembered by '+esc((CTX.account.name||'you').split(/\s+/)[0])+(A.rel?' · '+esc(A.rel.replace('My ','').toLowerCase()==='friend'?P().pa+' friend':P().pa+' '+({'mother':'child','father':'child','grandmother':'grandchild','grandfather':'grandchild','wife':'wife','husband':'husband','partner':'partner','sister':'sister','brother':'brother','daughter':'parent','son':'parent'})[A.rel.replace('My ','').toLowerCase()]):'')+'</div></div>';
   bind('inMemT',function(v){A.mem.title=v},'full');
   bind('inMemS',function(v){A.mem.story=v},'full');
   var d=document.getElementById('dMem'),f=document.getElementById('fMem');
   d.onclick=function(){f.click()};
   f.onchange=function(){if(f.files[0])ingest(f.files[0],1200,function(url){A.mem.photo=url;changed('full');cur===7&&STEPS[7].render(el)})};
 },
 skip:'the wall can wait · skip',valid:function(){return true}},

/* 8 · chapters */
{id:'chapters',ch:'their life, in chapters',room:'life',tag:'',
 q:function(){return (A.name?esc(F())+'’s':'Their')+' life, <em>in chapters.</em>'},
 sub:'Name a chapter, then add its moments: a year, what happened, a photograph.',
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
     '<button type="button" class="mphotobtn">'+(m.img?'✓ its photograph · tap to change':'+ a photograph for this moment')+'</button>'+
     '<input type="file" class="m-file" accept="image/*" style="display:none"/>'+
     (m.img?'<div class="thumbrow"><span class="th cover"><img src="'+m.img+'" alt=""/></span></div>':'')+
     '</div>';
   }
   function redraw(){
     ed.innerHTML=A.chapters.map(function(c,ci){
       return '<div class="chapcard" data-c="'+ci+'">'+
       '<button type="button" class="chx" data-c="'+ci+'" aria-label="Remove this chapter">✕</button>'+
       '<div><span class="mlbl">A chapter of '+esc(P().pa)+' life</span>'+
       '<input type="text" class="chnamein" placeholder="The teacher · the garden · the kitchen table years" value="'+esc(c.t)+'"/></div>'+
       '<div class="mgrid" style="margin-top:8px"><div><span class="mlbl">From</span>'+selYear('cF'+ci,c.from,1890,THIS_YEAR)+'</div><div><span class="mlbl">To</span>'+selYear('cT'+ci,c.to,1890,THIS_YEAR)+'</div></div>'+
       c.ms.map(function(m,mi){return momBlock(ci,mi,m)}).join('')+
       '<button type="button" class="addmoment" data-c="'+ci+'">+ add a moment to this chapter</button>'+
       '</div>';
     }).join('')+'<button type="button" class="addchapter" id="addChap">+ another chapter of '+esc(P().pa)+' life</button>'+
     '<div class="chapcard" id="storyCard"><div><span class="mlbl">'+esc(P().C)+' story · opens the chapter room</span>'+
     '<textarea id="inStory" class="storyta" placeholder="A few lines about who '+esc(P().s)+' really '+(A.pron==='they'?'were':'was')+'.">'+esc(A.story||'')+'</textarea></div>'+
     '<button type="button" class="addmoment" id="draftStory">Draft it from what you\u2019ve written · yours to edit</button></div>';
     wire();
   }
   function wire(){
     ed.querySelectorAll('.chapcard').forEach(function(card){
       var ci=+card.dataset.c,c=A.chapters[ci];
       card.querySelector('.chnamein').addEventListener('input',function(){c.t=this.value;changed('full')});
       card.querySelector('#cF'+ci).addEventListener('change',function(){c.from=this.value;changed('full')});
       card.querySelector('#cT'+ci).addEventListener('change',function(){c.to=this.value;changed('full')});
       card.querySelector('.chx').onclick=function(){A.chapters.splice(ci,1);redraw();changed('full')};
     });
     ed.querySelectorAll('.momblock').forEach(function(blk){
       var ci=+blk.dataset.c,mi=+blk.dataset.m,m=A.chapters[ci].ms[mi];
       blk.querySelector('select').addEventListener('change',function(){m.y=this.value;changed('full')});
       blk.querySelector('.m-tt').addEventListener('input',function(){m.l=this.value;changed('full')});
       var fp=blk.querySelector('.m-file');
       blk.querySelector('.mphotobtn').onclick=function(){fp.click()};
       fp.onchange=function(){ if(fp.files[0])ingest(fp.files[0],1200,function(url){m.img=url;redraw();changed('full')}) };
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
     var st=document.getElementById('inStory');
     if(st)st.addEventListener('input',function(){A.story=st.value;changed('full')});
     var ds=document.getElementById('draftStory');
     if(ds)ds.onclick=function(){A.story=draftStory();document.getElementById('inStory').value=A.story;changed('full')};
   }
   redraw();
 },
 skip:'write the chapters later',valid:function(){return true}},

/* 9 · the album */
{id:'photos',ch:'their album',room:'pho',tag:'',
 q:function(){return 'Photographs, so the page <em>feels like '+(A.name?esc(F()):'them')+'.</em>'},
 sub:'Captions and years appear under each photograph in the album.',
 render:function(el){
   var over=A.photos.length>12&&previewPlan()!=='plus';
   el.innerHTML='<div class="drop2" id="gdrop"><input type="file" id="inGal" accept="image/*" multiple style="display:none"/>'+
   '<div class="dbig">'+(A.photos.length?A.photos.length+' photograph'+(A.photos.length>1?'s':'')+' in the album':'Choose photographs')+'</div>'+
   '<div class="dsm">tap here · choose as many as you like</div></div>'+
   '<div class="addlist" id="phList"></div>'+
   (over?'<div class="planline">The first 12 show now. The rest are saved. <b>Plus shows every photograph.</b></div>':'');
   var list=document.getElementById('phList');
   function paint(){
     list.innerHTML=A.photos.map(function(p,i){
       return '<div class="addedrow phrow"><span class="th mini"><img src="'+p.src+'" alt=""/></span>'+
       '<input type="text" class="inp-cap" data-i="'+i+'" placeholder="a line for it · “Dahlias, given away over the fence”" value="'+esc(p.cap)+'"/>'+
       selYear('phY'+i,p.wy,1890,THIS_YEAR,'Year, if known')+
       '<button type="button" class="restoreb'+(p.restore?' on':'')+'" data-i="'+i+'" title="Mark for AI restoration · part of Plus · runs in the live app">✦</button>'+
       '<button type="button" class="rm" data-i="'+i+'" aria-label="Remove">✕</button></div>';
     }).join('');
     list.querySelectorAll('.inp-cap').forEach(function(inp){inp.addEventListener('input',function(){A.photos[+inp.dataset.i].cap=inp.value;changed('full')})});
     A.photos.forEach(function(p,i){var s=document.getElementById('phY'+i);if(s)s.addEventListener('change',function(){p.wy=s.value;changed('full')})});
     list.querySelectorAll('.rm').forEach(function(b){b.onclick=function(){A.photos.splice(+b.dataset.i,1);STEPS[9].render(el);changed('full')}});
     list.querySelectorAll('.restoreb').forEach(function(b){b.onclick=function(){
       var ph=A.photos[+b.dataset.i];ph.restore=!ph.restore;b.classList.toggle('on',!!ph.restore);
       var n=document.getElementById('restNote');
       if(ph.restore&&!n){n=document.createElement('div');n.id='restNote';n.className='planline';n.innerHTML='Marked for <b>AI restoration</b>. Part of Plus. It runs when the live app arrives.';list.parentNode.appendChild(n);}
       markSaved();persist();
     }});
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
 skip:'I’ll add them later',valid:function(){return true}},

/* 10 · tapes */
{id:'tapes',ch:'their tapes',room:'tape',tag:'',
 q:function(){return 'Videos, so <em>'+(A.name?esc(F()):'they')+'</em> can still move and laugh.'},
 sub:'Home videos, toasts, voicemails. Part of Plus. Saved either way.',
 render:function(el){
   if(!A.tapes.length)A.tapes.push({t:'',wm:'',wy:'',dur:'',cover:'',kind:'video'});
   el.innerHTML='<div class="fields" id="tpEd"></div>';
   var ed=document.getElementById('tpEd');
   function redraw(){
     ed.innerHTML=A.tapes.map(function(t,i){
       return '<div class="chapcard" data-i="'+i+'">'+
       '<button type="button" class="chx" data-i="'+i+'" aria-label="Remove this tape">✕</button>'+
       '<div class="chiprow" style="margin:0 0 8px"><button type="button" class="chip tkind'+((t.kind||'video')==='video'?' on':'')+'" data-k="video">Video</button><button type="button" class="chip tkind'+(t.kind==='voice'?' on':'')+'" data-k="voice">\u266a Voice</button></div>'+
       '<div><span class="mlbl">What it holds</span><input type="text" class="tp-t" placeholder="'+(t.kind==='voice'?'The voicemail from her birthday':'Her seventieth · the toast')+'" value="'+esc(t.t)+'"/></div>'+
       '<div class="mgrid" style="margin-top:8px"><div><span class="mlbl">When — if known</span>'+selYear('tpY'+i,t.wy,1890,THIS_YEAR)+'</div>'+
       '<div><span class="mlbl">A still, for its cover</span><button type="button" class="mphotobtn" style="margin-top:0">'+(t.cover?'✓ tap to change':'+ choose a photograph')+'</button><input type="file" class="m-file" accept="image/*" style="display:none"/></div></div>'+
       '</div>';
     }).join('')+'<button type="button" class="addchapter" id="addTape">+ another tape</button>';
     ed.querySelectorAll('.chapcard').forEach(function(card){
       var i=+card.dataset.i,t=A.tapes[i];
       card.querySelector('.tp-t').addEventListener('input',function(){t.t=this.value;changed('full')});
       card.querySelectorAll('.tkind').forEach(function(kb){kb.onclick=function(){t.kind=kb.dataset.k;redraw();changed('full')}});
       card.querySelector('#tpY'+i).addEventListener('change',function(){t.wy=this.value;changed('full')});
       var fp=card.querySelector('.m-file');
       card.querySelector('.mphotobtn').onclick=function(){fp.click()};
       fp.onchange=function(){if(fp.files[0])ingest(fp.files[0],900,function(url){t.cover=url;redraw();changed('full')})};
       card.querySelector('.chx').onclick=function(){A.tapes.splice(i,1);redraw();changed('full')};
     });
     document.getElementById('addTape').onclick=function(){A.tapes.push({t:'',wm:'',wy:'',dur:'',cover:'',kind:'video'});redraw();};
   }
   redraw();
 },
 skip:'not right now · skip',valid:function(){return true}},

/* 11 · their people */
{id:'family',ch:'their people',room:'tree',tag:'',
 q:function(){return (A.name?esc(F())+'’s':'Their')+' <em>people.</em>'},
 sub:'Say how each one is related and the tree places them itself. Anyone in the family can add to it later.',
 render:function(el){
   var RELS=[['mother','Their mother'],['father','Their father'],['partner','Their partner'],['sibling','A sibling'],['child','A child'],['grandchild','A grandchild'],['chosen','Chosen family · a friend']];
   var kids=A.family.filter(function(f){return f.rel==='child'&&(f.name||'').trim()});
   el.innerHTML='<div class="addlist" id="famList"></div>'+
   '<div class="chapcard" id="famForm">'+
   '<div><span class="mlbl">Their name</span><input type="text" id="famName" placeholder="Thomas Hayes"/></div>'+
   '<div style="margin-top:8px"><span class="mlbl">How they are related to '+esc(F())+'</span><select id="famRel" class="dsel"><option value="">Choose how they\u2019re related\u2026</option>'+RELS.map(function(r){return '<option value="'+r[0]+'">'+r[1]+'</option>'}).join('')+'</select></div>'+
   '<div id="famVia" style="display:none;margin-top:8px"><span class="mlbl">Through which child?</span><select id="famViaSel" class="dsel"><option value="">Just place them</option>'+kids.map(function(k){return '<option>'+esc(k.name)+'</option>'}).join('')+'</select></div>'+
   '<div class="mgrid" style="margin-top:8px"><div><span class="mlbl">Born — if known</span>'+selYear('famBy','',1890,THIS_YEAR)+'</div><div><span class="mlbl">Passed — blank if still with us</span>'+selYear('famDy','',1890,THIS_YEAR)+'</div></div>'+
   '<button type="button" class="addmoment" id="famAdd" style="margin-top:10px">＋ Add to the tree</button>'+
   '</div>';
   var list=document.getElementById('famList');
   function relLabel(rel){var m={mother:'mother',father:'father',partner:'partner',sibling:'sibling',child:'child',grandchild:'grandchild',chosen:'chosen family'};return m[rel]||rel}
   function paint(){
     list.innerHTML=A.family.map(function(f,i){
       return '<div class="addedrow"><span style="color:var(--terra)">✿</span> <b>'+esc(f.name)+'</b>&nbsp;· '+relLabel(f.rel)+(f.by||f.dy?' · '+(f.by&&f.dy?f.by+'–'+f.dy:(f.by?'b. '+f.by:'d. '+f.dy)):'')+' <button type="button" class="rm" data-i="'+i+'" aria-label="Remove">✕</button></div>';
     }).join('')||'<div class="lnote">you are already on the tree'+(A.rel?' — '+esc(A.rel.toLowerCase()).replace('my ','as '+P().pa+' ')+'':'')+'</div>';
     list.querySelectorAll('.rm').forEach(function(b){b.onclick=function(){A.family.splice(+b.dataset.i,1);STEPS[11].render(el);changed('full')}});
   }
   paint();
   var relSel=document.getElementById('famRel');
   relSel.addEventListener('change',function(){
     document.getElementById('famVia').style.display=(relSel.value==='grandchild'&&kids.length)?'block':'none';
   });
   function famReady(){
     var ok=document.getElementById('famName').value.trim().length>1&&relSel.value;
     document.getElementById('famAdd').style.opacity=ok?'1':'.45';
     return ok;
   }
   document.getElementById('famName').addEventListener('input',famReady);
   relSel.addEventListener('change',famReady);
   setTimeout(famReady,0);
   document.getElementById('famAdd').onclick=function(){
     if(!famReady())return;
     var nm=document.getElementById('famName').value.trim();
     A.family.push({name:nm,rel:relSel.value,by:document.getElementById('famBy').value,dy:document.getElementById('famDy').value,via:document.getElementById('famViaSel')?document.getElementById('famViaSel').value:''});
     STEPS[11].render(el);changed('full');
     setTimeout(function(){var f2=document.getElementById('famName');if(f2)f2.focus()},60);
   };
 },
 skip:'the tree can grow later',valid:function(){return true}},

/* 12 · the service */
{id:'service',ch:'the service',room:'',tag:'',
 q:function(){return 'Is there a <em>service planned?</em>'},
 sub:'Added to the shareable flyer. Skip it if plans are still forming.',
 render:function(el){
   var s=A.svc;
   el.innerHTML='<div class="fields">'+
   '<div class="fld"><label>When</label><div class="d3">'+selMonth('svM',s.m)+selDay('svD',s.d)+selYear('svY',s.y,THIS_YEAR-1,THIS_YEAR+2)+'</div></div>'+
   '<div class="fld"><label>What time</label>'+selTime('svT',s.time)+'</div>'+
   '<div class="fld"><label>Where</label><input type="text" id="svW" placeholder="Linden Community Chapel" value="'+esc(s.where)+'"/></div>'+
   '<div class="fld"><label>The address</label><input type="text" id="svA" placeholder="142 Seaside Avenue, Half Moon Bay, CA" value="'+esc(s.addr)+'"/></div>'+
   '<div class="fld"><label>Anything guests should know (optional)</label><input type="text" id="svN" placeholder="Parking behind the chapel · the family greets at 5:30" value="'+esc(s.note)+'"/></div></div>';
   [['svM','m'],['svD','d'],['svY','y'],['svT','time'],['svW','where'],['svA','addr'],['svN','note']].forEach(function(pr){
     bind(pr[0],function(v){A.svc[pr[1]]=v});
   });
 },
 skip:'not yet · skip',valid:function(){return true}},

/* 13 · address + plan */
{id:'address',ch:'their address',room:'',tag:'',
 q:function(){return CTX.published?'Everything is <em>kept.</em>':'Everything is <em>ready.</em>'},
 sub:function(){return CTX.published?'Changes save as you make them. The page keeps its address.':'Review the page beside you, then choose how it lives.'},
 render:function(el){
   var pr=CTX.price||{amount:197,discount:0};
   var priceLine=pr.discount?('$'+pr.amount.toFixed(2)+' <s style="opacity:.55">$'+pr.base+'</s>'):'$'+pr.base+' · lifetime';
   var priceSub=pr.discount?('Lifetime · '+pr.discount+'% family discount applied'):'Once. No renewals, ever.';
   var addrLine=CTX.published?('imissyoumemorial.com/'+esc(CTX.slug)):'imissyoumemorial.com/··········';
   var addrNote=CTX.published
     ?(CTX.plan==='plus'?'chosen, and '+P().poss+' for good':'the page lives at a random address · Plus chooses its name')
     :'a random address is minted when you publish · <b>Plus chooses its name</b>, like imissyoumemorial.com/'+esc((firstName()||'their-name').toLowerCase().replace(/[^a-z]/g,'')||'theirname');
   var html='<div class="sealbox"><div class="k2">where the page lives</div>'+
     '<div class="addr2">'+addrLine+'</div>'+
     '<div class="note">'+addrNote+'</div></div>';
   if(!(CTX.published&&CTX.plan==='plus')){
     html+='<div class="plans">'+
     '<button type="button" class="plancard'+(A._plan!=='plus'?' on':'')+'" data-v="free">'+
       '<span class="prad"></span><span class="pbody"><span class="ptop"><b>Free</b><i>$0</i></span>'+
       '<span class="pli">The page, online forever</span>'+
       '<span class="pli">12 photographs · the wall open to ten memories</span>'+
       '<span class="pli">A random address</span></span></button>'+
     '<button type="button" class="plancard'+(A._plan==='plus'?' on':'')+'" data-v="plus">'+
       '<span class="prad"></span><span class="pbody"><span class="ptop"><b>Plus</b><i>'+priceLine+'</i></span>'+
       '<span class="pli">'+priceSub+'</span>'+
       '<span class="pli">Every photograph and video · '+esc(P().pa)+' voice</span>'+
       '<span class="pli">A chosen address · AI photo restoration</span>'+
       '<span class="pli">The credit line removed</span></span></button>'+
     '</div>'+
     '<div class="note" style="margin-top:12px;font-size:12.5px;opacity:.75">Every tribute stays online. We never charge a family to keep a memory alive.</div>';
   }
   el.innerHTML=html;
   el.querySelectorAll('.plancard').forEach(function(b){b.onclick=function(){
     el.querySelectorAll('.plancard').forEach(function(x){x.classList.remove('on')});
     b.classList.add('on');A._plan=b.dataset.v;changed('full');refreshCont();
   }});
 },
 cont:function(){
   if(CTX.published)return (A._plan==='plus'&&CTX.plan!=='plus')?'Continue to Plus checkout':'Save · back to the dashboard';
   return A._plan==='plus'?'Publish · continue to checkout':'Publish '+(P().pa)+' page';
 },
 valid:function(){return true}}
];

function paintSoFar(){
  var old=document.getElementById('soFar');
  if(old)old.parentNode.removeChild(old);
  if(!CTX.published)return;
  var chs=A.chapters.filter(function(c){return (c.ms||[]).length&&(c.t||'').trim()}).length;
  var rows=[
    [(A.name&&A.by&&A.dy)?'✓':'✿','The cover'+((A.name&&A.by&&A.dy)?', complete':' is missing its dates'),0],
    [(A.mem.story||A.mem.title)?'✓':'✿',(A.mem.story||A.mem.title)?'The first memory is on the wall':'No first memory yet',7],
    [chs?'✓':'✿',chs?(chs+(chs===1?' chapter':' chapters')+' · '+A.photos.length+(A.photos.length===1?' photograph':' photographs')):'The chapters are unwritten',8],
    (function(){var n=A.tapes.filter(function(t){return (t.t||'').trim()}).length;return [n?'✓':'✿',n?('The tape shelf holds '+n+(n===1?' tape':' tapes')):'The tape shelf is empty',10]})(),
    [A.family.length?'✓':'✿',(A.family.length+ (A.rel?2:1))+' people on the tree',11],
    [(A.svc.y&&A.svc.where)?'✓':'✿',(A.svc.y&&A.svc.where)?'Service details are on the flyer':'No service details yet',12]
  ];
  var d=document.createElement('div');d.id='soFar';
  d.innerHTML='<div class="sflab">the page so far</div>'+rows.map(function(r){
    return '<button type="button" class="sfrow" data-i="'+r[2]+'"><span class="'+(r[0]==='✓'?'sfok':'sfno')+'">'+r[0]+'</span>'+r[1]+'</button>';
  }).join('');
  lbody.appendChild(d);
  d.querySelectorAll('.sfrow').forEach(function(b){b.onclick=function(){goto(+b.dataset.i)}});
}
var KIND2STEP={name:0,dates:3,quote:5,portrait:6,cover:6,memory:7,chapters:8,story:8,photos:9,tapes:10,tree:11,service:12,address:13};
var ROOM2STEP={mem:7,life:8,pho:9,tape:10,tree:11};
function stepRoom(i){return STEPS[i]?STEPS[i].room:''}
function chLabel(s){
  var f=firstName();
  if(!f)return s.ch;
  return s.ch.replace(/^their\b/, f+'\u2019s').replace(/^the first memory$/,'the first memory');
}

/* ═══ the walk ═══ */
var cur=0;
var lbody=document.getElementById('lbody');
function buildGarland(){
  var g=document.getElementById('garland');
  if(g)g.style.display='none';
}
function paintGarland(){
  var f=document.getElementById('pFill'),c=document.getElementById('pCnt');
  if(f)f.style.width=Math.round(((cur+1)/STEPS.length)*100)+'%';
  if(c)c.textContent='Step '+(cur+1)+' of '+STEPS.length;
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
  var sub=typeof s.sub==='function'?s.sub():s.sub;
  el.innerHTML='<h1>'+s.q()+'</h1>'+(sub?'<div class="sub">'+sub+'</div>':'')+'<div class="body"></div>';
  lbody.appendChild(el);
  s.render(el.querySelector('.body'));
  document.getElementById('chapterLbl').textContent=chLabel(s);
  document.getElementById('backBtn').style.visibility=cur>0?'visible':'hidden';
  var sk=document.getElementById('skipBtn');
  if(s.skip&&cur<STEPS.length-1){sk.style.visibility='visible';sk.textContent=s.skip}else{sk.style.visibility='hidden'}
  paintGarland();paintJump();paintSoFar();refreshCont();
  /* the page follows the letter */
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
  /* the final step */
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
  /* the small line above the canvas speaks plainly */
  var hint=document.querySelector('.mhint');
  if(hint){
    hint.innerHTML=CTX.published
      ?'saves as you type · <button type="button" id="xDash">✓ done · back to the dashboard</button>'
      :'saves as you write';
    var x=document.getElementById('xDash');
    if(x)x.onclick=function(){IMY.send('draft',{draft:A});IMY.send('nav',{go:'dashboard'})};
  }
  var tag=document.querySelector('.sbar .tag');
  if(tag)tag.textContent=CTX.published?('editing '+(F()==='them'?'their':F()+'\u2019s')+' page'):'building their page';
  if(!CTX.published)document.querySelector('.letter').classList.add('onboard');
  /* comfort corner · text size for the letter */
  (function(){
    var lt=document.querySelector('.letter');
    var w=document.createElement('div');w.className='a11y-letter';w.setAttribute('aria-label','Text size');
    [['A-','0.92'],['A','1'],['A+','1.14']].forEach(function(pr,i){
      var b=document.createElement('button');b.type='button';b.textContent=pr[0];if(i===1)b.className='on';
      b.onclick=function(){lt.style.fontSize=pr[1]+'em';w.querySelectorAll('button').forEach(function(x){x.className=''});b.className='on';};
      w.appendChild(b);
    });
    document.body.appendChild(w);
  })();
  /* jump strip in edit mode */
  if(CTX.published){
    var lh=document.querySelector('.lhead');
    if(lh){
      var j=document.createElement('div');j.id='jumpRow';j.className='chiprow jumprow';
      lh.parentNode.insertBefore(j,lh.nextSibling);
    }
  }
  buildGarland();
  requestCompose();
  var start=(typeof ctx.draft==='object'&&ctx.draft&&typeof ctx.draft._i==='number')?ctx.draft._i:0;
  if(CTX.published)start=0;
  goto(Math.min(start,STEPS.length-1));
}
IMY.send('ready',{});
})();
