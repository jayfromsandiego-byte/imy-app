/* IMY tribute hydrator · applies IMY_OVERRIDE to the page's static text,
   keeps counts honest, gates by plan, and — in edit mode — turns the page
   into a click-to-edit surface. Runs after the page's own script. */
(function(){
  var OV=window.IMY_OVERRIDE;
  function $(s,r){return (r||document).querySelector(s)}
  function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
  function txt(el,v){ if(el)el.textContent=v; }

  /* ── pronoun pack ── */
  function pack(p){
    if(p==='she')return {s:'she',o:'her',pa:'her',C:'Her',poss:'hers'};
    if(p==='he') return {s:'he',o:'him',pa:'his',C:'His',poss:'his'};
    return {s:'they',o:'them',pa:'their',C:'Their',poss:'theirs'};
  }

  function avatarFromName(name){
    var p=String(name||'').trim().split(/\s+/);
    var ini=((p[0]||'')[0]||'✿').toUpperCase()+((p.length>1?p[p.length-1][0]:'')||'').toUpperCase();
    return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="160" height="160" fill="%23EDE3D2"/><text x="80" y="97" font-family="Georgia,serif" font-size="52" fill="%23A87C5F" text-anchor="middle">'+encodeURIComponent(ini)+'</text></svg>';
  }
  function splitName(n){
    var parts=String(n||'').trim().split(/\s+/);
    if(parts.length<2)return esc(n);
    var last=parts.pop();
    return esc(parts.join(' '))+' <em>'+esc(last)+'</em>';
  }
  function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;')}
  function plural(n,one,many){ return n===1?one:many }

  function applyPerson(ov){
    var pe=ov.person||{}, P=pack(pe.pron);
    document.title=pe.name+' · I Miss You Memorial';
    var h1=$('.cstack h1'); if(h1)h1.innerHTML=splitName(pe.name);
    txt($('.cstack .dates'),pe.datesLine||'');
    var qt=$('.cstack .qt');
    if(qt){ if(pe.quote){qt.style.display='';qt.textContent='“'+pe.quote.replace(/^[“"]|[”"]$/g,'')+'”';} else qt.style.display='none'; }
    var face=$('.cface img'); if(face)face.src=pe.portrait||avatarFromName(pe.name);
    var cbg=$('.cover .cbg'); if(cbg&&pe.coverbg)cbg.src=pe.coverbg;
    var flyFace=$('#flyer .arch img'); if(flyFace)flyFace.src=pe.portrait||avatarFromName(pe.name);

    /* tabs + room labels */
    $$('.tab').forEach(function(t){
      if(t.dataset.room==='life')t.textContent=P.C+' life';
    });
    var ribbon=$('.ribbon'); if(ribbon)ribbon.setAttribute('aria-label',P.C+' page');
    /* kickers + headings, room by room */
    var mem=$('#room-mem'); if(mem){ txt($('.rh',mem),'Moments of '+P.poss); var k2=$$('.kick',mem)[1]; if(k2)txt(k2,P.C+' wall'); txt($('.rh2',mem),'From the people who knew '+P.o); }
    var pho=$('#room-pho'); if(pho){ txt($('.kick',pho),P.C+' album'); }
    var life=$('#room-life'); if(life){ txt($('.kick',life),P.C+' life'); }
    var tree=$('#room-tree'); if(tree){ txt($('.rh',tree),P.C+' family tree'); }
    var tw=$('#treeWrap'); if(tw)tw.setAttribute('aria-label',P.C+' family tree. Drag to move.');
    var tHome=$('#tHome'); if(tHome){ txt($('.lg',tHome),'Back to '+pe.first); txt($('.sm',tHome),'↺ '+pe.first); }
    /* leave-a-memory letter */
    var lmH=$('#lm h3'); if(lmH)lmH.textContent='Leave a memory of '+pe.first;
    var lmName=$('#lmForm label small'); if(lmName)lmName.textContent='· and how you knew '+P.o;
    var lmRel=$('#lmRel'); if(lmRel){ lmRel.setAttribute('aria-label','How you knew '+P.o); $$('option',lmRel).forEach(function(o){ if(/student/i.test(o.textContent))o.textContent=P.C+' student'; }); }
    var lmClose=$('#lmClose'); if(lmClose)lmClose.textContent='Back to '+P.pa+' page';
    /* visits */
    function visitsLine(el,n){
      if(!el)return;
      var b=el.querySelector('b'); if(b)b.textContent=(n||0).toLocaleString();
      var t=el.querySelector('.vt');
      var line=(n===1?'person has':'people have')+' visited '+P.pa+' page';
      if(t)t.textContent=line;
      else{ /* .mvisits: text node after <b> */
        var nodes=el.childNodes;
        for(var i=nodes.length-1;i>=0;i--){ if(nodes[i].nodeType===3&&nodes[i].textContent.trim()){ nodes[i].textContent=' '+line; break; } }
      }
    }
    visitsLine($('.mvisits'),ov.counts&&ov.counts.visits||1);
    visitsLine($('.ribbon .visits'),ov.counts&&ov.counts.visits||1);
    /* share sheet + bars */
    var shk=$('.shk'); if(shk&&shk.firstChild&&shk.firstChild.nodeType===3)shk.firstChild.textContent='Share '+P.pa+' page';
    var eShare=$('#eShare'); if(eShare)eShare.textContent='Share '+P.pa+' page ↗';
    var shNote=$('.shnote'); if(shNote)shNote.innerHTML='send '+P.pa+' page to the family &amp; friends who should have it<br/>every memory they leave joins '+P.pa+' wall';
    var qcall=$('.qcall'); if(qcall)qcall.setAttribute('aria-label','Words left for '+P.o);
    /* flyer */
    var flyH=$('#flyer h5'); if(flyH)flyH.textContent=pe.name;
    var flyD=$('#flyer .fd'); if(flyD)flyD.textContent=(ov.personYears||flyD.textContent);
    if(flyD){ var yb=(pe.datesLine.match(/\b(19|20)\d\d\b/g)||[]); if(yb.length>=2)flyD.textContent=yb[0]+' · '+yb[yb.length-1]; else flyD.textContent=''; }
    var join=$('#flyer .join'), when=$('#flyer .when'), where=$('#flyer .where'), fnote=$('#flyer .fnote');
    if(ov.svc){
      if(when)when.textContent=ov.svc.when;
      if(where)where.innerHTML='<b>'+esc(ov.svc.whereName)+'</b>'+(ov.svc.whereAddr?'<br/>'+esc(ov.svc.whereAddr):'');
      if(fnote){ if(ov.svc.note)fnote.textContent=ov.svc.note; else fnote.style.display='none'; }
    }else{
      [join,when,where,fnote].forEach(function(el){ if(el)el.style.display='none'; });
    }
    var qr=$('#flyer .qrrow img'); if(qr&&ov.SHURL)qr.src='https://api.qrserver.com/v1/create-qr-code/?size=120x120&data='+encodeURIComponent(ov.SHURL);
    /* tape shelf empty + counts stay handled by page script */
  }

  /* ghost skeletons · in the editor an empty room still shows its shape */
  function ghost(host,html){
    var g=document.createElement('div');
    g.className='imy-ghost';
    g.innerHTML=html;
    host.appendChild(g);
  }
  var GHOST_CSS='.imy-ghost{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin:16px auto;max-width:640px}'+
    '.imy-ghost .gc{border:1.5px dashed rgba(168,124,95,.45);border-radius:14px;background:rgba(243,236,221,.4);display:flex;align-items:center;justify-content:center;color:rgba(138,90,60,.75);font:600 10px/1.4 "Work Sans",sans-serif;letter-spacing:.12em;text-transform:uppercase;text-align:center;padding:10px}';

  function emptyStates(ov){
    /* memories stage · hide when no photographed moments */
    if(!(ov.TODAY&&ov.TODAY.length)){
      ['stageWings','mDots'].forEach(function(id){var el=document.getElementById(id);if(el)el.style.display='none'});
      var qc=$('.qcall'); if(qc)qc.style.display='none';
      if(ov.mode==='edit'){
        var sw=document.getElementById('stageWings');
        if(sw)ghost(sw.parentNode,'<span class="gc" style="width:150px;height:150px">a moment</span><span class="gc" style="width:220px;height:190px">the first photograph lands here</span><span class="gc" style="width:150px;height:150px">a moment</span>');
      }
    }
    var P=pack(ov.person.pron), first=ov.person.first;
    /* wall gate note (free · more waiting) */
    var mem=$('#room-mem');
    if(ov.gates&&ov.gates.memsTotal>ov.MEMS.length&&mem){
      note(mem,(ov.gates.memsTotal-ov.MEMS.length)+' more '+plural(ov.gates.memsTotal-ov.MEMS.length,'memory waits','memories wait')+', safe · Plus opens the whole wall');
    }
    if(ov.MEMS.length===0&&mem){
      ['memPager','chips'].forEach(function(id){var el=document.getElementById(id);if(el)el.style.display='none'});
      if(ov.mode==='edit'){
        var stream=document.getElementById('stream');
        if(stream)ghost(stream.parentNode,'<span class="gc" style="width:250px;height:120px">a memory card</span><span class="gc" style="width:250px;height:120px">a memory card</span>');
      }else note(mem,'No memories yet · share '+P.pa+' page and the wall will begin to fill');
    }
    /* photos */
    var pho=$('#room-pho');
    if(pho&&ov.PHOTOS.length===0){
      var grid=$('#phGrid'); if(grid)grid.style.display='none';
      var door=$('#allPhDoor'); if(door)door.style.display='none';
      if(ov.mode==='edit')ghost(pho,'<span class="gc" style="width:170px;height:130px">a photograph</span><span class="gc" style="width:220px;height:130px">a photograph</span><span class="gc" style="width:150px;height:130px">a photograph</span>');
      else note(pho,'Photographs of '+first+' will fill this album');
    }else if(pho&&ov.gates&&ov.gates.photosTotal>ov.PHOTOS.length){
      note(pho,(ov.gates.photosTotal-ov.PHOTOS.length)+' more '+plural(ov.gates.photosTotal-ov.PHOTOS.length,'photograph waits','photographs wait')+', safe · Plus keeps them all');
    }
    /* chapters */
    var life=$('#room-life');
    if(life&&ov.CH.length===0){
      ['chRail'].forEach(function(id){var el=document.getElementById(id);if(el)el.style.display='none'});
      var book=$('.book',life); if(book)book.style.display='none';
      var nav=$('.chnav',life); if(nav)nav.style.display='none';
      if(ov.mode==='edit')ghost(life,'<span class="gc" style="width:190px;height:110px">a chapter · its years</span><span class="gc" style="width:190px;height:110px">a chapter · its years</span>');
      else note(life,first+'’s chapters will rest here');
    }
    /* tapes */
    var tape=$('#room-tape');
    if(tape&&ov.TAPES.length===0){
      var sh=$('#tapeShelf'); if(sh)sh.style.display='none';
      var d2=$('#allTpDoor'); if(d2)d2.style.display='none';
      if(ov.mode==='edit')ghost(tape,'<span class="gc" style="width:230px;height:120px">a film · its still</span>');
      else note(tape,'Videos and voice · the tape shelf fills with Plus');
    }
    function note(room,text){
      var n=document.createElement('p');
      n.style.cssText='margin:18px auto 0;max-width:520px;text-align:center;font-style:italic;color:rgba(44,37,32,.55);font-size:14.5px;line-height:1.6';
      n.textContent=text;
      room.appendChild(n);
    }
  }

  function planGate(ov){
    if(ov.plan==='plus'){
      /* the quiet credit rests on Plus pages */
      $$('.foot .bar span').forEach(function(s){ if(/made with love/i.test(s.textContent))s.style.display='none'; });
    }
  }

  /* ── edit mode ── */
  function editMode(ov){
    /* the editor shows the page, not its chrome — one brand, no guest bars */
    ['topbar','mBar','fab'].forEach(function(id){var el=document.getElementById(id);if(el)el.style.display='none'});
    $$('.endacts').forEach(function(el){el.style.display='none'});
    document.body.style.paddingTop='0';
    var css=document.createElement('style');
    css.textContent=GHOST_CSS+'[data-imy-edit]{cursor:pointer!important;position:relative}'+
      '[data-imy-edit]:hover{outline:2px dashed rgba(168,124,95,.85);outline-offset:3px;border-radius:4px}'+
      '.imy-editbadge{position:fixed;pointer-events:none;z-index:9999;background:#2C2520;color:#FAF5EC;font:600 11px/1 "Work Sans",sans-serif;letter-spacing:.08em;text-transform:uppercase;padding:6px 9px;border-radius:7px;opacity:0;transition:opacity .18s}'+
      '.imy-editbadge.on{opacity:.96}';
    document.head.appendChild(css);
    var badge=document.createElement('div'); badge.className='imy-editbadge'; document.body.appendChild(badge);

    var map=[
      ['.cstack h1','name','the name'],
      ['.cstack .dates','dates','the dates'],
      ['.cstack .qt','quote','their words'],
      ['.cface','portrait','the portrait'],
      ['.cover .cbg','cover','the backdrop'],
      ['#room-mem .stagewings','memory','the first memory'],
      ['#room-mem .qcall','memory','the first memory'],
      ['#chRail','chapters','the chapters'],
      ['#room-life .book','chapters','the chapters'],
      ['#phGrid','photos','the album'],
      ['#allPhDoor','photos','the album'],
      ['#tapeShelf','tapes','the tapes'],
      ['#room-tape .door','tapes','the tapes'],
      ['#treeWrap','tree','the family'],
      ['#flyer','service','the service']
    ];
    map.forEach(function(mp){ $$(mp[0]).forEach(function(el){ el.setAttribute('data-imy-edit',mp[1]); el.setAttribute('data-imy-label','edit '+mp[2]); }); });

    document.addEventListener('mousemove',function(e){
      var t=e.target.closest?e.target.closest('[data-imy-edit]'):null;
      if(t){ badge.textContent='✎ '+t.getAttribute('data-imy-label'); badge.style.left=Math.min(window.innerWidth-150,e.clientX+14)+'px'; badge.style.top=(e.clientY+16)+'px'; badge.classList.add('on'); }
      else badge.classList.remove('on');
    },true);

    document.addEventListener('click',function(e){
      /* memory wall cards → memory step */
      var mc=e.target.closest?e.target.closest('.memcard'):null;
      if(mc){ e.preventDefault(); e.stopPropagation(); send('memory'); return; }
      var t=e.target.closest?e.target.closest('[data-imy-edit]'):null;
      if(t){
        /* let the tree's own pan/click still work? in edit mode, a plain click edits */
        e.preventDefault(); e.stopPropagation();
        send(t.getAttribute('data-imy-edit'));
        return;
      }
      /* leave-a-memory buttons route into the studio's memory step */
      var lmb=e.target.closest?e.target.closest('#fab,#eLeave,#mLeave'):null;
      if(lmb){ e.preventDefault(); e.stopPropagation(); send('memory'); return; }
      var tab=e.target.closest?e.target.closest('.tab'):null;
      if(tab){ try{parent.postMessage({type:'imy',action:'room',data:{room:tab.dataset.room}},'*');}catch(err){} }
    },true);

    function send(kind){ try{parent.postMessage({type:'imy',action:'edit',data:{kind:kind}},'*');}catch(err){} }
  }

  /* ── commands from the studio ── */
  window.addEventListener('message',function(e){
    var m=e.data; if(!m||m.type!=='imy-cmd')return;
    if(m.action==='person'&&window.IMY_OVERRIDE){ window.IMY_OVERRIDE.person=m.data.person; window.IMY_OVERRIDE.svc=m.data.svc; window.IMY_OVERRIDE.counts=m.data.counts||window.IMY_OVERRIDE.counts; applyPerson(window.IMY_OVERRIDE); }
    if(m.action==='room'){ var t=$$('.tab').filter(function(x){return x.dataset.room===m.data.room})[0]; if(t)t.click(); var rb=$('.ribbon'); if(rb)rb.scrollIntoView({behavior:'smooth',block:'start'}); }
    if(m.action==='scrolltop'){ try{window.scrollTo({top:0,behavior:'smooth'})}catch(err){window.scrollTo(0,0)} }
    if(m.action==='flyer'){ if(m.data.open&&window.shOpen)window.shOpen(); else if(!m.data.open&&window.shShut)window.shShut(); }
    /* live text · the page keeps pace with typing, no reloads */
    if(m.action==='memtext'){
      var d=m.data||{};
      var card=$('#stream .memcard');
      if(card){
        var tt=$('.tt',card)||card.querySelector('b'); if(tt)tt.textContent=d.title||('A memory');
        var body=card.querySelector('.mb, .body, p'); if(body)body.textContent=d.story?('“'+d.story.replace(/^["“]|["”]$/g,'')+'”'):'';
      }
      var sct=document.getElementById('sCt'); if(sct&&d.title)sct.textContent=d.title;
      var scs=document.getElementById('sCs'); if(scs)scs.textContent=d.story||'';
      var qt=document.getElementById('qcText'); if(qt&&d.story)qt.textContent='“'+d.story.replace(/^["“]|["”]$/g,'')+'”';
    }
    if(m.action==='chaptext'){
      var chs=(m.data||{}).chapters||[];
      $$('#chRail .chc').forEach(function(btn,i){
        var c=chs[i]; if(!c)return;
        var cy=$('.cy',btn); if(cy)cy.textContent=c.era;
        var bb=btn.querySelector('.card b'); if(bb)bb.textContent=c.t;
      });
      /* the open chapter's year rail keeps pace too */
      var onIdx=0; $$('#chRail .chc').forEach(function(b,i){ if(b.classList.contains('on'))onIdx=i; });
      var oc=chs[onIdx];
      if(oc)$$('#yRail .yrow').forEach(function(r,j){
        var mm=oc.ms[j]; if(!mm)return;
        var yy=$('.yy',r); if(yy)yy.textContent=mm.y;
        var yl=$('.yl',r); if(yl)yl.textContent=mm.l;
      });
    }
  });

  /* ── who may enter · password and unlisted, honored ── */
  function privacyGate(ov){
    if(ov.mode!=='view'||ov.privacy!=='password'||!ov.password)return;
    var okKey='imy_gate_'+(ov.slugUrl||'');
    try{ if(sessionStorage.getItem(okKey)==='1')return; }catch(e){}
    var veil=document.createElement('div');
    veil.style.cssText='position:fixed;inset:0;background:#FDFBF7;z-index:9999;display:flex;align-items:center;justify-content:center;padding:24px';
    veil.innerHTML='<div style="max-width:380px;width:100%;text-align:center;font-family:\'Besley\',Georgia,serif;color:#2C2520">'+
      '<div style="font-size:26px;font-weight:600;margin-bottom:8px">This page is kept close.</div>'+
      '<div style="font-size:14px;color:#5c5249;margin-bottom:18px">Enter the password the family shared with you.</div>'+
      '<input id="imyGateIn" type="password" style="width:100%;box-sizing:border-box;font-family:inherit;font-size:16px;padding:12px 13px;border:1px solid rgba(44,37,32,.25);border-radius:10px;background:#fff;outline:none;text-align:center"/>'+
      '<button id="imyGateGo" style="margin-top:12px;width:100%;background:#A87C5F;color:#fff;border:0;border-radius:12px;padding:13px;font-family:inherit;font-size:15.5px;font-weight:600;cursor:pointer">Enter</button>'+
      '<div id="imyGateErr" style="display:none;margin-top:10px;font-size:12.5px;color:#8a3c2c">That isn’t it — check with the family.</div></div>';
    document.body.appendChild(veil);
    function tryGo(){
      var v=document.getElementById('imyGateIn').value;
      if(v===ov.password){ try{sessionStorage.setItem(okKey,'1')}catch(e){} document.body.removeChild(veil); }
      else document.getElementById('imyGateErr').style.display='block';
    }
    document.getElementById('imyGateGo').addEventListener('click',tryGo);
    document.getElementById('imyGateIn').addEventListener('keydown',function(e){if(e.key==='Enter')tryGo()});
    setTimeout(function(){document.getElementById('imyGateIn').focus()},80);
  }

  /* ── tapes that really play ── */
  function tapePlayback(ov){
    if(!(ov.TAPES||[]).some(function(t){return t.url}))return;
    document.addEventListener('click',function(e){
      var b=e.target.closest&&e.target.closest('.tape');
      if(!b)return;
      var t=(ov.TAPES||[])[+b.dataset.ti];
      if(!t||!t.url)return;
      e.preventDefault(); e.stopImmediatePropagation();
      var wrap=document.createElement('div');
      wrap.style.cssText='position:fixed;inset:0;background:rgba(20,15,10,.94);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
      wrap.innerHTML='<video src="'+t.url+'" controls autoplay playsinline style="max-width:100%;max-height:86vh;border-radius:12px;background:#000"></video>'+
        '<button aria-label="Close" style="position:absolute;top:14px;right:16px;background:none;border:1px solid rgba(250,245,236,.4);color:#FAF5EC;border-radius:8px;width:36px;height:36px;font-size:16px;cursor:pointer">✕</button>';
      wrap.querySelector('button').addEventListener('click',function(){try{wrap.querySelector('video').pause()}catch(x){}document.body.removeChild(wrap)});
      document.body.appendChild(wrap);
    },true);
  }

  /* the owner's doors · their desk and the live editor, right on the page */
  function ownerDoors(ov){
    var tacts=$('#topbar .tacts');
    if(!tacts)return;
    tacts.innerHTML='<a class="login" href="#" id="imyDeskDoor">Dashboard</a><a class="start" href="#" id="imyLiveDoor">Edit Page</a>';
    $('#imyDeskDoor').addEventListener('click',function(e){e.preventDefault();e.stopPropagation();try{parent.postMessage({type:'imy',action:'nav',data:{go:'dashboard'}},'*')}catch(err){}});
    $('#imyLiveDoor').addEventListener('click',function(e){e.preventDefault();e.stopPropagation();try{parent.postMessage({type:'imy',action:'nav',data:{go:'studio',m:ov.ownerEdit.m}},'*')}catch(err){}});
  }

  if(OV){
    applyPerson(OV);
    emptyStates(OV);
    planGate(OV);
    privacyGate(OV);
    tapePlayback(OV);
    if(OV.mode==='edit')editMode(OV);
    if(OV.mode==='view'&&OV.ownerEdit)ownerDoors(OV);
    try{parent.postMessage({type:'imy',action:'tribute-ready',data:{}},'*');}catch(e){}
  }
})();
