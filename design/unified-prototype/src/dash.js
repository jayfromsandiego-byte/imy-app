/* IMY dashboard · Willie's skeleton, hydrated in place.
   The original cards, sentences, and layout stay; only the data breathes.
   New household features (memorials, billing, account: verification,
   archive, delete) join below the leaf divider in the same card language. */
(function(){
'use strict';
function $(s,r){return (r||document).querySelector(s)}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}
var MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
var MON3=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
function PA(p){return p==='she'?'her':p==='he'?'his':'their'}
function money(n){return '$'+(n%1?n.toFixed(2):n)}
var CTX=null, act=null, queueIdx=0;

var booted=false;
function boot(ctx){
  if(booted)return; booted=true;
  CTX=ctx;
  var acct=ctx.account||{}, mems=ctx.memorials||[];
  act=null;
  mems.forEach(function(m){ if(m.id===ctx.activeId)act=m; });
  if(!act)act=mems[mems.length-1]||null;
  var d=act?act.data:null, pa=d?PA(d.pron):'their', paC=pa.charAt(0).toUpperCase()+pa.slice(1);
  var name=d?(d.name||'the page'):'', first=name.split(/\s+/)[0]||'';
  var queue=(act&&act.queue)||[];

  /* ── sidebar · identity ── */
  var idb=$('.identity-block');
  if(idb){
    var img=$('.arch-portrait img',idb);
    if(img)img.src=(d&&d.portrait)||'data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="300"><rect width="240" height="300" fill="#EDE3D2"/><text x="120" y="150" font-family="Georgia,serif" font-size="46" fill="#A87C5F" text-anchor="middle">✿</text><text x="120" y="185" font-family="Verdana,sans-serif" font-size="11" letter-spacing="2" fill="#8a5a3c" text-anchor="middle">'+(d?(pa.toUpperCase()+' PORTRAIT'):'NO PAGE YET')+'</text></svg>');
    var nm=$('.name',idb); if(nm)nm.textContent=d?name:'No memorial yet';
    var dt=$('.dates',idb); if(dt)dt.textContent=d?dashDates(d):'';
    if(act){
      var eb=document.createElement('button');
      eb.type='button'; eb.className='btn primary small'; eb.style.cssText='margin-top:10px;width:100%';
      eb.textContent='Edit '+pa+' page';
      eb.onclick=function(){IMY.send('nav',{go:'studio',m:act.id})};
      idb.appendChild(eb);
    }
  }
  var link=$('.see-page-link');
  if(link){
    if(act){ link.textContent='See '+pa+' page →'; link.setAttribute('href','/sites/'+act.slug); link.removeAttribute('target'); }
    else link.style.display='none';
  }
  function dashDates(d){
    function f(m,day,y){ if(!y)return ''; return (m?MON3[m-1]+' ':'')+(day?day+', ':'')+y; }
    var a=f(+d.bm,d.bd,d.by),b=f(+d.dm,d.dd,d.dy);
    return (a&&b)?(a+' – '+b).toUpperCase():(b?('– '+b):'').toUpperCase();
  }

  /* ── head · their sentences, our values ── */
  var g=$('#greeting');
  if(g&&g.parentNode){
    var afn=acct.name?String(acct.name).trim().split(/\s+/)[0]:'';
    var nodes=g.parentNode.childNodes;
    for(var i=0;i<nodes.length;i++){ if(nodes[i].nodeType===3&&/,/.test(nodes[i].textContent)){ nodes[i].textContent=afn?', '+afn:''; break; } }
  }
  var t=$('.panel-title .uline');
  if(t)t.textContent=act?('Everything about '+name+'’s page, in one room.'):'Let’s begin a page.';
  var sub=$('.panel-sub');
  if(sub)sub.textContent=act?'What’s waiting, what’s been shared, and what still needs a decision.':'A tribute page takes about ten minutes. Everything you write is saved as you go.';

  /* ── plan strip ── */
  var ps=$('.plan-strip');
  if(ps){
    if(!act)ps.innerHTML='Signed in · ready when you are';
    else if(act.plan==='plus')ps.innerHTML='Plus · everything kept, <b>for life</b>';
    else ps.innerHTML='Free plan · '+pa+' page stays online, <b>always</b>';
  }
  var vt=$('.var-tag');
  if(vt)vt.textContent='I MISS YOU MEMORIAL · '+(acct.email||'')+' · prototype';

  /* ── the eight cards · hydrated in place, order and markup untouched ── */
  var cards=$$('.card-grid .s-card');
  if(!act){
    /* no memorial yet · keep the first card as the single door in */
    cards.forEach(function(c,i){ if(i>0)c.style.display='none'; });
    if(cards[0]){
      var s0=$('.sentence',cards[0]);
      if(s0)s0.innerHTML='<b>Begin the first memorial.</b> A few questions in the studio, and the page takes shape beside your words.';
      var idc=$('.inline-decide',cards[0]); if(idc)idc.style.display='none';
      var f0=$('.card-foot',cards[0]);
      if(f0)f0.innerHTML='<a href="#" class="btn primary" data-act="new">Open the studio</a>';
    }
  }else{
    var memsShared=((d.mem&&(d.mem.story||d.mem.title))?1:0)+((d.guest||[]).length);
    var phCount=(d.photos||[]).length;
    var chCount=(d.chapters||[]).filter(function(c){return (c.ms||[]).length}).length;
    var fl=(act.counts||{}).flowers||0, ca=(act.counts||{}).candles||0;

    /* 1 · waiting · the queue is real */
    var wc=cards[0];
    if(wc){
      var ws=$('.sentence',wc), wd=$('.inline-decide',wc), wf=$('.card-foot',wc);
      if(queue.length){
        if(ws)ws.innerHTML='<b>'+queue.length+(queue.length===1?' thing is':' things are')+' waiting for you</b> · '+queue.length+(queue.length===1?' memory':' memories')+' left for '+esc(name)+' this week.';
        paintQueueItem();
      }else{
        if(ws)ws.innerHTML='<b>Nothing is waiting for you.</b> Every memory a visitor leaves comes here first, before it appears on '+pa+' wall.';
        if(wd)wd.style.display='none';
        if(wf)wf.innerHTML='<a href="#" class="btn quiet" data-act="view">Share '+pa+' page</a>';
      }
    }

    /* 2 · what people remember */
    hyd(cards[1],'People have been writing to '+esc(name)+'’s page. <b>'+memsShared+(memsShared===1?' memory has':' memories have')+'</b> been shared so far.','See what people remember','view');

    /* 3 · pictures */
    hyd(cards[2],esc(name)+'’s page holds <b>'+phCount+(phCount===1?' picture':' pictures')+'</b> kept so far.'+(act.plan==='plus'?' Damaged ones can be marked for AI restoration in the studio.':''),'Open the pictures','edit');

    /* 4 · story (their sprig card) */
    hyd(cards[3],(d.story||'').trim()?(esc(name)+'’s story is written, and ready for you to add to, quietly, whenever you like.'):(esc(name)+'’s story is unwritten. The chapters are waiting in the studio.'),(d.story||'').trim()?'Visit '+pa+' story':'Write '+pa+' story',(d.story||'').trim()?'view':'edit');

    /* 5 · trusted people */
    hyd(cards[4],'Family and friends can be invited to help tend '+esc(name)+'’s page. <b>Trusted people</b> can share memories without waiting on you.','See who’s caretaking','editfam');

    /* 6 · anniversary */
    var ann=anniversary(d);
    if(ann)hyd(cards[5],ann,'Think about that day','view');
    else if(cards[5])cards[5].style.display='none';

    /* 7 · vigil band */
    if(cards[6]){
      var vs=$('.sentence',cards[6]);
      if(vs)vs.innerHTML=(fl||ca)?('<b>'+fl+(fl===1?' flower has':' flowers have')+' been laid</b> · '+ca+(ca===1?' candle':' candles')+' lit for '+esc(name)+'.'):('<b>No flowers laid yet.</b> Share '+pa+' page so visitors can lay the first.');
      var vf=$('.card-foot',cards[6]);
      if(vf)vf.innerHTML='<a href="#" class="btn quiet" data-act="view">See how '+pa+' page is tended</a><a href="#" class="btn quiet" data-act="flyer">Print the flyer</a>';
    }

    /* 8 · plus, quietly */
    if(cards[7]){
      var qs=$('.sentence',cards[7]), qf=$('.card-foot',cards[7]);
      if(act.plan==='plus'){
        if(qs)qs.innerHTML='<b>Plus is yours, for life.</b> '+paC+' voice, living pictures, every photograph, the whole wall, the chosen address. The credit line is gone.';
        if(qf)qf.innerHTML='';
      }else{
        if(qs)qs.innerHTML='This page is free, forever. That promise holds. <b>Plus keeps more</b>: '+pa+' voice, living pictures, every photograph, the whole wall, an exact-name address, AI photo restoration. '+money(CTX.price?CTX.price.amount:197)+', once.';
        if(qf)qf.innerHTML='<a href="#" class="btn quiet" data-act="upgrade">Keep everything</a>';
      }
    }
  }
  function hyd(card,sentence,btnLabel,actName){
    if(!card)return;
    var s=$('.sentence',card); if(s)s.innerHTML=sentence;
    var f=$('.card-foot',card); if(f)f.innerHTML='<a href="#" class="btn quiet" data-act="'+actName+'">'+btnLabel+'</a>';
  }
  function anniversary(d){
    if(!d.dy||!d.dm)return null;
    var now=new Date(), y=now.getFullYear();
    var next=new Date(y,+d.dm-1,+d.dd||1);
    if(next<now)next=new Date(y+1,+d.dm-1,+d.dd||1);
    var years=next.getFullYear()-(+d.dy);
    return MONTHS[+d.dm-1]+' '+(+d.dd||1)+' will be <b>'+years+(years===1?' year':' years')+'</b> from today. There is time to decide whether '+esc(name)+'’s page should mark it.';
  }

  /* ── the moderation queue · their inline-decide, working ── */
  function paintQueueItem(){
    var wc=cards[0]; if(!wc)return;
    var wd=$('.inline-decide',wc); if(!wd)return;
    var q=queue[queueIdx];
    if(!q){ wd.style.display='none'; return; }
    wd.style.display='';
    var who=$('.id-who',wd); if(who)who.textContent='Memory · '+q.n+' · '+q.relLabel;
    var idq=$('.idq',wd); if(idq)idq.textContent='"'+q.b+'"';
    var acts=$('.id-actions',wd);
    if(acts)acts.innerHTML='<button type="button" class="btn primary small" data-act="approve">Share on '+pa+' page</button>'+
      '<button type="button" class="btn quiet small" data-act="keep">Keep for family</button>';
    var rest=$('.id-rest',wd);
    if(rest)rest.innerHTML=queue.length>1?('or <a href="#" data-act="nextq">read the next, one at a time</a> · '+(queue.length-1)+' more'):'';
    var wf=$('.card-foot',wc);
    if(wf)wf.innerHTML='<a href="#" class="btn quiet" data-act="view">Open '+pa+' page</a>';
  }
  function decide(share){
    var q=queue[queueIdx]; if(!q)return;
    IMY.send('moderate',{m:act.id,qid:q.id,decision:share?'share':'keep'});
    queue.splice(queueIdx,1);
    if(queueIdx>=queue.length)queueIdx=0;
    var ws=$('.sentence',cards[0]);
    if(queue.length){
      if(ws)ws.innerHTML='<b>'+queue.length+(queue.length===1?' thing is':' things are')+' waiting for you</b> · '+queue.length+(queue.length===1?' memory':' memories')+' left for '+esc(name)+' this week.';
      paintQueueItem();
    }else{
      if(ws)ws.innerHTML=share?('<b>Shared on '+pa+' wall.</b> Nothing else is waiting.'):('<b>Kept for the family.</b> Nothing else is waiting.');
      var wd=$('.inline-decide',cards[0]); if(wd)wd.style.display='none';
    }
    paintNavCount();
  }

  /* ── the household · memorials, billing, account ── */
  var mainEl=$('main section.panel-head')||$('main');
  var hh=document.createElement('div');
  hh.innerHTML='<div class="panel-kicker mono" style="margin-top:8px">The household</div>'+
  '<div class="card-grid" style="margin-top:14px">'+

  '<div class="s-card full stagger"><p class="sentence"><b>The memorials this account keeps.</b></p><div class="mem-list">'+
    (CTX.memorials||[]).map(function(m){
      var md=m.data||{}, nm2=md.name||'A page, unnamed';
      return '<div class="mem-row'+(act&&m.id===act.id?' now':'')+'">'+
        '<div class="mr-main"><b>'+esc(nm2)+(m.archived?' <span class="mr-rest">resting</span>':'')+'</b><span class="mr-url">imissyoumemorial.com/'+esc(m.slug)+'</span></div>'+
        '<span class="mr-plan '+(m.plan==='plus'?'plus':'free')+'">'+(m.plan==='plus'?'Plus':'Free')+'</span>'+
        '<span class="mr-acts"><a href="#" class="btn quiet small" data-act="open:'+m.id+'">Open</a>'+
        '<a href="#" class="btn quiet small" data-act="editm:'+m.id+'">Edit</a>'+
        (act&&m.id===act.id?'':'<a href="#" class="btn quiet small" data-act="focus:'+m.id+'">Make current</a>')+'</span></div>';
    }).join('')+
    (CTX.canCreate&&(CTX.memorials||[]).length?('<div class="mem-new">Begin another memorial under this account.<span class="mr-acts"><a href="#" class="btn quiet small" data-act="newfree">A free page</a><a href="#" class="btn primary small" data-act="newplus">A Plus page · '+money(CTX.price.amount)+(CTX.price.discount?' <i class="mr-off">20% off</i>':'')+'</a></span></div>'):'')+
    (!CTX.canCreate?('<div class="mem-new locked">A free account keeps <b>one</b> memorial. Plus unlocks more. Every Plus memorial after your first is <b>20% off</b>.<span class="mr-acts"><a href="#" class="btn primary small" data-act="upgrade">Unlock with Plus · $197</a></span></div>'):'')+
  '</div></div>'+

  '<div class="s-card stagger" id="billingCard"><p class="sentence"><b>Billing.</b> '+
    (act?(act.plan==='plus'?('Plus for '+esc(name)+' · '+money(197)+', paid once. No renewals, ever.'):('The free plan. Nothing is owed, ever. Plus is '+money(CTX.price?CTX.price.amount:197)+', once.')):'No charges. The free plan costs nothing, ever.')+
    '</p><div class="card-foot">'+(act&&act.plan!=='plus'?'<a href="#" class="btn quiet" data-act="upgrade">See what Plus keeps</a>':'')+'</div></div>'+

  '<div class="s-card stagger" id="acctCard"><p class="sentence"><b>Account.</b> '+esc(acct.name||'')+' · '+esc(acct.email||'')+' <span class="mr-verified">✓ verified'+(acct.method==='google'?' · Google':'')+'</span></p>'+
    '<div class="card-foot" style="flex-wrap:wrap;gap:8px">'+
      (act?('<a href="#" class="btn quiet" data-act="archive">'+(act.archived?'Wake the page':'Let the page rest')+'</a>'):'')+
      '<a href="#" class="btn quiet" data-act="signout">Sign out</a>'+
      '<a href="#" class="btn quiet danger" data-act="delacct">Delete my account</a>'+
    '</div>'+
    '<p class="acct-note">Resting pages stay online at their address, unlisted. Deleting your account removes your sign-in. The pages themselves are never deleted without the family’s written request.</p>'+
    '<div class="acct-confirm" id="delConfirm" style="display:none">Delete this account and its sign-in? <a href="#" class="btn danger small" data-act="delacct2">Yes, delete it</a> <a href="#" class="btn quiet small" data-act="delcancel">Keep it</a></div>'+
  '</div>'+
  '</div>';
  var leaf=$('.leaf-divider');
  if(leaf&&leaf.parentNode)leaf.parentNode.insertBefore(hh,leaf);
  else if(mainEl)mainEl.appendChild(hh);

  /* ── actions ── */
  document.addEventListener('click',function(e){
    var a=e.target.closest?e.target.closest('[data-act]'):null;
    if(!a)return;
    e.preventDefault();
    var v=a.getAttribute('data-act');
    if(v==='edit'&&act)return IMY.send('nav',{go:'studio',m:act.id});
    if(v==='editfam'&&act)return IMY.send('nav',{go:'studio',m:act.id});
    if(v==='view'&&act)return IMY.send('nav',{go:'site',slug:act.slug});
    if(v==='flyer'&&act)return IMY.send('nav',{go:'site',slug:act.slug,flyer:1});
    if(v==='new'||v==='newfree')return IMY.send('createNew',{plan:''});
    if(v==='newplus')return IMY.send('createNew',{plan:'plus'});
    if(v==='upgrade'&&act)return IMY.send('nav',{go:'checkout',m:act.id});
    if(v==='signout')return IMY.send('signout',{});
    if(v==='approve')return decide(true);
    if(v==='keep')return decide(false);
    if(v==='nextq'){queueIdx=(queueIdx+1)%queue.length;paintQueueItem();return}
    if(v==='archive'&&act){IMY.send('archiveMem',{m:act.id,on:!act.archived});return}
    if(v==='delacct'){var c=$('#delConfirm');if(c)c.style.display='';return}
    if(v==='delcancel'){var c2=$('#delConfirm');if(c2)c2.style.display='none';return}
    if(v==='delacct2')return IMY.send('deleteAccount',{});
    var p=v.split(':');
    if(p[0]==='open'){var m1=(CTX.memorials||[]).filter(function(x){return x.id===p[1]})[0];if(m1)IMY.send('nav',{go:'site',slug:m1.slug});return}
    if(p[0]==='editm')return IMY.send('nav',{go:'studio',m:p[1]});
    if(p[0]==='focus')return IMY.send('setActive',{m:p[1]});
  },true);

  /* ── sidebar nav · their buttons, wired ── */
  function paintNavCount(){
    $$('.nav-item .count').forEach(function(c){c.textContent=String(queue.length);c.style.opacity=queue.length?'1':'.55'});
  }
  paintNavCount();
  $$('.nav-item').forEach(function(n){
    var label=($('.label',n)||{}).textContent||'';
    if(/sign out/i.test(label)){ n.addEventListener('click',function(e){e.preventDefault();IMY.send('signout',{})}); return; }
    n.addEventListener('click',function(e){
      if(n.tagName==='A')e.preventDefault();
      var target=null;
      if(/waiting/i.test(label))target=cards[0];
      else if(/pictures/i.test(label))target=cards[2];
      else if(/billing/i.test(label))target=$('#billingCard');
      else if(/account/i.test(label))target=$('#acctCard');
      if(target&&target.style.display!=='none')target.scrollIntoView({behavior:'smooth',block:'center'});
      else window.scrollTo({top:0,behavior:'smooth'});
      $$('.nav-item').forEach(function(x){x.classList.remove('active')});
      n.classList.add('active');
      var sb=document.getElementById('study-sidebar'),sc=document.getElementById('study-scrim');
      if(sb)sb.classList.remove('open'); if(sc)sc.classList.remove('open');
    });
  });
}

window.addEventListener('imy-init',function(e){ boot(e.detail||{}) });
IMY.send('ready',{});
})();
