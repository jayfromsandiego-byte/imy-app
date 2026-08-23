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

  function avatarFromName(name,pron,edit){
    var pa=pron==='she'?'her':pron==='he'?'his':'their';
    var line=edit?('add '+pa+' portrait'):(pa+' portrait rests here');
    return 'data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320"><rect width="320" height="320" fill="#EDE3D2"/><text x="160" y="150" font-family="Georgia,serif" font-size="64" fill="#A87C5F" text-anchor="middle">✿</text><text x="160" y="196" font-family="Verdana,sans-serif" font-size="13" letter-spacing="2.5" fill="#8a5a3c" text-anchor="middle">'+line.toUpperCase()+'</text></svg>');
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
    var face=$('.cface img'); if(face)face.src=pe.portrait||avatarFromName(pe.name,pe.pron,ov.mode==='edit');
    var cbg=$('.cover .cbg'); if(cbg&&pe.coverbg)cbg.src=pe.coverbg;

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

  function applyStory(ov){
    var old=document.getElementById('imyStory');
    if(old)old.parentNode.removeChild(old);
    if(!(ov.story||'').trim())return;
    var life=$('#room-life'); if(!life)return;
    var el=document.createElement('p');
    el.id='imyStory';
    el.style.cssText='max-width:640px;margin:6px auto 30px;text-align:center;font-size:17.5px;line-height:1.75;color:rgba(44,37,32,.82)';
    el.textContent=ov.story.trim();
    if(ov.mode==='edit'){el.setAttribute('data-imy-edit','story');el.setAttribute('data-imy-label','edit the story');}
    var head=$('.lifehead',life);
    if(head&&head.nextSibling)life.insertBefore(el,head.nextSibling);else life.appendChild(el);
  }

  function emptyStates(ov){
    /* memories stage · hide when no photographed moments */
    if(!(ov.TODAY&&ov.TODAY.length)){
      ['stageWings','mDots'].forEach(function(id){var el=document.getElementById(id);if(el)el.style.display='none'});
      var qc=$('.qcall'); if(qc)qc.style.display='none';
    }
    var P=pack(ov.person.pron), first=ov.person.first;
    /* wall gate note (free · more waiting) */
    var mem=$('#room-mem');
    if(ov.gates&&ov.gates.memsTotal>ov.MEMS.length&&mem){
      note(mem,(ov.gates.memsTotal-ov.MEMS.length)+' more '+plural(ov.gates.memsTotal-ov.MEMS.length,'memory waits','memories wait')+', safe · Plus opens the whole wall');
    }
    if(ov.MEMS.length===0&&mem){
      ['memPager','chips'].forEach(function(id){var el=document.getElementById(id);if(el)el.style.display='none'});
      note(mem,'No memories yet · share '+P.pa+' page and the wall will begin to fill');
    }
    /* photos */
    var pho=$('#room-pho');
    if(pho&&ov.PHOTOS.length===0){
      var grid=$('#phGrid'); if(grid)grid.style.display='none';
      var door=$('#allPhDoor'); if(door)door.style.display='none';
      note(pho,'Photographs of '+first+' are added in the studio');
    }else if(pho&&ov.gates&&ov.gates.photosTotal>ov.PHOTOS.length){
      note(pho,(ov.gates.photosTotal-ov.PHOTOS.length)+' more '+plural(ov.gates.photosTotal-ov.PHOTOS.length,'photograph waits','photographs wait')+', safe · Plus keeps them all');
    }
    /* chapters */
    var life=$('#room-life');
    if(life&&ov.CH.length===0){
      ['chRail'].forEach(function(id){var el=document.getElementById(id);if(el)el.style.display='none'});
      var book=$('.book',life); if(book)book.style.display='none';
      var nav=$('.chnav',life); if(nav)nav.style.display='none';
      note(life,first+'’s chapters are written in the studio');
    }
    /* tapes */
    var tape=$('#room-tape');
    if(tape&&ov.TAPES.length===0){
      var sh=$('#tapeShelf'); if(sh)sh.style.display='none';
      var d2=$('#allTpDoor'); if(d2)d2.style.display='none';
      note(tape,'Videos and voice · the tape shelf fills with Plus');
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
    var P=pack(ov.person.pron);
    var css=document.createElement('style');
    css.textContent='#topbar,#fab,#mBar,.endacts{display:none!important}'+
      'body{padding-top:0!important}'+
      '.imy-band{position:sticky;top:0;z-index:60;display:flex;justify-content:space-between;align-items:center;gap:12px;background:#F3ECDD;border-bottom:1px solid rgba(44,37,32,.14);padding:8px 16px;font-family:\'Work Sans\',sans-serif;font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#8a5a3c}'+
      '.imy-band span:last-child{color:#5c5249;font-weight:600}'+
      '[data-imy-edit]{cursor:pointer!important;position:relative}'+
      '[data-imy-edit]:hover{outline:2px dashed rgba(168,124,95,.85);outline-offset:3px;border-radius:4px}'+
      '.imy-editbadge{position:fixed;pointer-events:none;z-index:9999;background:#2C2520;color:#FAF5EC;font:600 11px/1 "Work Sans",sans-serif;letter-spacing:.08em;text-transform:uppercase;padding:6px 9px;border-radius:7px;opacity:0;transition:opacity .18s}'+
      '.imy-editbadge.on{opacity:.96}';
    document.head.appendChild(css);
    var badge=document.createElement('div'); badge.className='imy-editbadge'; document.body.appendChild(badge);
    var band=document.createElement('div');
    band.className='imy-band';
    band.innerHTML='<span>'+(P.pa)+' page · live preview</span><span>tap anything to edit</span>';
    document.body.insertBefore(band,document.body.firstChild);

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
  });

  if(OV){
    applyPerson(OV);
    applyStory(OV);
    emptyStates(OV);
    planGate(OV);
    if(OV.mode==='edit')editMode(OV);
    if(OV.openFlyer)setTimeout(function(){ if(window.shOpen)window.shOpen(); },700);
    try{parent.postMessage({type:'imy',action:'tribute-ready',data:{}},'*');}catch(e){}
  }
})();
