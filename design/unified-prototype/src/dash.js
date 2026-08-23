/* IMY dashboard · hydrated from the account's real memorials.
   Free accounts keep one memorial; Plus opens the household. */
(function(){
'use strict';
function $(s,r){return (r||document).querySelector(s)}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}
var MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
var MON3=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
function PA(p){return p==='she'?'her':p==='he'?'his':'their'}
function money(n){return '$'+(n%1?n.toFixed(2):n)}

var booted=false;
function boot(ctx){
  if(booted)return; booted=true;
  var acct=ctx.account||{}, mems=ctx.memorials||[], act=null;
  mems.forEach(function(m){ if(m.id===ctx.activeId)act=m; });
  if(!act)act=mems[mems.length-1]||null;
  var d=act?act.data:null, pa=d?PA(d.pron):'their', first=d?String(d.name||'').trim().split(/\s+/)[0]:'';

  /* ── sidebar identity ── */
  var idb=$('.identity-block');
  if(idb){
    var img=$('.arch-portrait img',idb);
    if(img&&d&&d.portrait)img.src=d.portrait;
    else if(img&&(!d||!d.portrait))img.src='data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="150"><rect width="120" height="150" fill="%23EDE3D2"/><text x="60" y="92" font-family="Georgia" font-size="44" fill="%23A87C5F" text-anchor="middle">✿</text></svg>';
    var nm=$('.name',idb); if(nm)nm.textContent=d?(d.name||'A page, waiting'):'No memorial yet';
    var dt=$('.dates',idb);
    if(dt)dt.textContent=d?dashDates(d):'';
    var link=$('.see-page-link');
    if(link){
      if(act){ link.textContent='See '+pa+' page →'; link.setAttribute('href','/sites/'+act.slug); }
      else { link.style.display='none'; }
    }
    if(act){
      var eb=document.createElement('button');
      eb.type='button'; eb.className='btn primary small'; eb.style.cssText='margin-top:10px;width:100%';
      eb.textContent='Edit '+pa+' page';
      eb.onclick=function(){IMY.send('nav',{go:'studio',m:act.id})};
      idb.appendChild(eb);
    }
  }
  function dashDates(d){
    function f(m,day,y){ if(!y)return ''; return (m?MON3[m-1]+' ':'')+(day?day+', ':'')+y; }
    var a=f(+d.bm,d.bd,d.by),b=f(+d.dm,d.dd,d.dy);
    return (a&&b)?(a+' – '+b).toUpperCase():(b?('– '+b):'').toUpperCase();
  }

  /* ── greeting + heading ── */
  var g=$('#greeting');
  if(g&&g.parentNode){
    var afn=acct.name?String(acct.name).trim().split(/\s+/)[0]:'';
    var nodes=g.parentNode.childNodes;
    for(var i=0;i<nodes.length;i++){ if(nodes[i].nodeType===3&&/,/.test(nodes[i].textContent)){ nodes[i].textContent=afn?', '+afn:''; break; } }
  }
  var t=$('.panel-title .uline');
  if(t)t.textContent=act?('Everything about '+(d.name||'the page')):'Let’s begin a page';
  var sub=$('.panel-sub');
  if(sub)sub.textContent=act?'What\u2019s waiting, what\u2019s been shared, and what needs a decision.':'A tribute page takes about ten minutes. Everything you write is saved as you go.';

  /* ── plan strip ── */
  var ps=$('.plan-strip');
  if(ps){
    if(!act)ps.innerHTML='Signed in · ready when you are';
    else if(act.plan==='plus')ps.innerHTML='Plus · everything kept, <b>for life</b>';
    else ps.innerHTML='Free plan · '+pa+' page stays online, <b>always</b>';
  }
  var vt=$('.var-tag');
  if(vt)vt.textContent='I MISS YOU MEMORIAL · '+(acct.email||'')+' · prototype';

  /* ── the cards ── */
  var grid=$('.card-grid');
  if(!grid)return;
  var cards=[];
  function card(cls,html,foot){ cards.push('<div class="s-card liftable stagger'+(cls?' '+cls:'')+'"><p class="sentence">'+html+'</p>'+(foot?'<div class="card-foot">'+foot+'</div>':'')+'</div>'); }
  function btn(label,attr,primary){ return '<a href="#" class="btn '+(primary?'primary':'quiet')+'" data-act="'+attr+'">'+label+'</a>'; }

  if(!act){
    card('full','<b>Begin '+(mems.length?'another':'the first')+' memorial.</b> A few questions in the studio, and the page takes shape beside your words.',btn('Open the studio','new',true));
  }else{
    var memsCount=(d.mem&&(d.mem.story||d.mem.title))?1:0;
    var phCount=(d.photos||[]).length;
    var chCount=(d.chapters||[]).filter(function(c){return (c.ms||[]).length}).length;
    var famCount=(d.family||[]).length+(d.rel?1:0)+1;
    var fl=(act.counts||{}).flowers||0, ca=(act.counts||{}).candles||0;

    card('full','<b>The page is the editor.</b> Open '+esc(first||'their page')+'’s page in the studio and tap anything on it to change that part: the name, a chapter, a photograph.',
      btn('Edit the page','edit',true)+btn('See '+pa+' page','view'));

    card('','<b>Nothing waits for review.</b> Every memory a visitor leaves comes to you first, before it appears on '+pa+' wall.',
      btn('Share '+pa+' page','view')+btn('Print the flyer','flyer'));

    card('',(memsCount? '<b>'+memsCount+(memsCount===1?' memory rests':' memories rest')+'</b> on '+pa+' wall so far.':'The wall is ready. <b>Your first memory</b> opens it and invites everyone else’s.'),
      btn(memsCount?'See what people remember':'Leave the first memory',memsCount?'view':'edit'));

    card('',(phCount? esc(first||'The page')+'’s album holds <b>'+phCount+' photograph'+(phCount===1?'':'s')+'</b>'+(act.plan!=='plus'&&phCount>12?'. 12 show now, the rest are saved':'')+'.'+(act.plan==='plus'?' Damaged ones can be marked for <b>AI restoration</b> in the studio.':''):'The album is empty. <b>Photographs</b> make the page feel like '+(first?esc(first):'them')+'.'),
      btn(phCount?'Open the pictures':'Add photographs','edit'));

    card('',(chCount? esc(pa.charAt(0).toUpperCase()+pa.slice(1))+' story is written in <b>'+chCount+' chapter'+(chCount===1?'':'s')+'</b>.':'<b>'+esc(pa.charAt(0).toUpperCase()+pa.slice(1))+' story</b> is unwritten. The chapters are in the studio.'),
      btn(chCount?'Visit '+pa+' story':'Write the chapters',chCount?'view':'edit'));

    card('','<b>'+famCount+(famCount===1?' person stands':' people stand')+'</b> on the family tree. Anyone in the family can add to it from the page.',
      btn('See the tree','view'));

    var ann=anniversary(d);
    if(ann)card('',ann.line,btn('Plan for that day','view'));

    card('full vigil-card',(fl||ca? '<b>'+fl+' flower'+(fl===1?'':'s')+(ca?' · '+ca+' candle'+(ca===1?'':'s'):'')+'</b> for '+esc(d.name||'them')+' so far.':'<b>No flowers laid yet.</b> Share '+pa+' page so visitors can lay the first.'),
      btn('See how '+pa+' page is tended','view'));

    if(act.plan!=='plus'){
      card('full','This page is free, forever. <b>Plus keeps more</b>: '+pa+' voice, living pictures, every photograph, a chosen address, AI photo restoration.',
        btn('Keep everything · '+money(ctx.price&&priceForActive()||197)+' lifetime','upgrade',true));
    }else{
      card('full','<b>Plus is yours, for life.</b> Every photograph, '+pa+' voice, the chosen address. No limits, and the credit line is gone.','');
    }
  }

  /* memorials of the household */
  var rows=mems.map(function(m){
    var md=m.data||{}, name=md.name||'A page, unnamed';
    return '<div class="mem-row'+(act&&m.id===act.id?' now':'')+'">'+
      '<div class="mr-main"><b>'+esc(name)+'</b><span class="mr-url">imissyoumemorial.com/'+esc(m.slug)+'</span></div>'+
      '<span class="mr-plan '+(m.plan==='plus'?'plus':'free')+'">'+(m.plan==='plus'?'Plus':'Free')+'</span>'+
      '<span class="mr-acts">'+
        '<a href="#" class="btn quiet small" data-act="open:'+m.id+'">Open</a>'+
        '<a href="#" class="btn quiet small" data-act="editm:'+m.id+'">Edit</a>'+
        (act&&m.id===act.id?'':'<a href="#" class="btn quiet small" data-act="focus:'+m.id+'">Make current</a>')+
      '</span></div>';
  }).join('');
  var createBlock;
  if(ctx.canCreate&&mems.length){
    var pr=ctx.price||{amount:197,discount:0};
    createBlock='<div class="mem-new">Begin another memorial under this account.'+
      '<span class="mr-acts"><a href="#" class="btn quiet small" data-act="newfree">A free page</a>'+
      '<a href="#" class="btn primary small" data-act="newplus">A Plus page · '+money(pr.amount)+(pr.discount?' <i class="mr-off">20% off</i>':'')+'</a></span></div>';
  }else if(!ctx.canCreate){
    createBlock='<div class="mem-new locked">A free account keeps <b>one</b> memorial. Plus unlocks more. Every Plus memorial after your first is <b>20% off</b>.'+
      '<span class="mr-acts"><a href="#" class="btn primary small" data-act="upgrade">Unlock with Plus · $197</a></span></div>';
  }else{ createBlock=''; }
  if(mems.length||createBlock){
    cards.push('<div class="s-card full stagger"><p class="sentence"><b>The memorials this account keeps.</b></p><div class="mem-list">'+rows+createBlock+'</div></div>');
  }

  /* account */
  cards.push('<div class="s-card stagger" id="acctCard"><p class="sentence">Signed in as <b>'+esc(acct.name||'')+'</b> · '+esc(acct.email||'')+(acct.method==='google'?' · Google':'')+'.</p><div class="card-foot"><a href="#" class="btn quiet" data-act="signout">Sign out</a></div></div>');

  grid.innerHTML=cards.join('');

  function priceForActive(){ return ctx.price?ctx.price.amount:197 }
  function anniversary(d){
    if(!d.dy||!d.dm)return null;
    var now=new Date(), y=now.getFullYear();
    var next=new Date(y,+d.dm-1,+d.dd||1);
    if(next<now)next=new Date(y+1,+d.dm-1,+d.dd||1);
    var years=next.getFullYear()-(+d.dy);
    var days=Math.round((next-now)/86400000);
    return {line:MONTHS[+d.dm-1]+' '+(+d.dd||1)+' will be <b>'+years+' year'+(years===1?'':'s')+'</b> · '+days+' day'+(days===1?'':'s')+' from today.'};
  }

  /* ── actions ── */
  document.addEventListener('click',function(e){
    var a=e.target.closest?e.target.closest('[data-act]'):null;
    if(!a)return;
    e.preventDefault();
    var v=a.getAttribute('data-act');
    if(v==='edit'&&act){IMY.send('nav',{go:'studio',m:act.id});return}
    if(v==='view'&&act){IMY.send('nav',{go:'site',slug:act.slug});return}
    if(v==='flyer'&&act){IMY.send('nav',{go:'site',slug:act.slug,flyer:1});return}
    if(v==='new'){IMY.send('createNew',{plan:''});return}
    if(v==='newfree'){IMY.send('createNew',{plan:''});return}
    if(v==='newplus'){IMY.send('createNew',{plan:'plus'});return}
    if(v==='upgrade'&&act){IMY.send('nav',{go:'checkout',m:act.id});return}
    if(v==='signout'){IMY.send('signout',{});return}
    var p=v.split(':');
    if(p[0]==='open'){var m1=mems.filter(function(x){return x.id===p[1]})[0];if(m1)IMY.send('nav',{go:'site',slug:m1.slug});return}
    if(p[0]==='editm'){IMY.send('nav',{go:'studio',m:p[1]});return}
    if(p[0]==='focus'){IMY.send('setActive',{m:p[1]});return}
  },true);

  /* sidebar nav → the cards */
  $$('.nav-item').forEach(function(n){
    var label=($('.label',n)||{}).textContent||'';
    if(/sign out/i.test(label)){ n.addEventListener('click',function(e){e.preventDefault();IMY.send('signout',{})}); return; }
    n.addEventListener('click',function(e){
      if(n.tagName==='A')e.preventDefault();
      var target=null;
      if(/waiting/i.test(label))target=$$('.s-card')[1];
      else if(/pictures/i.test(label))target=$$('.s-card')[3];
      else if(/billing/i.test(label))target=$('.vigil-card')?$$('.s-card').filter(function(c){return /Plus/.test(c.textContent)})[0]:null;
      else if(/account/i.test(label))target=$('#acctCard');
      if(target)target.scrollIntoView({behavior:'smooth',block:'center'});
      else window.scrollTo({top:0,behavior:'smooth'});
      $$('.nav-item').forEach(function(x){x.classList.remove('active')});
      n.classList.add('active');
      var sb=document.getElementById('study-sidebar'),sc=document.getElementById('study-scrim');
      if(sb)sb.classList.remove('open'); if(sc)sc.classList.remove('open');
    });
  });
  /* waiting count chip in the nav — honest zero */
  $$('.nav-item .count').forEach(function(c){c.textContent='0';c.style.opacity='.55'});
}

window.addEventListener('imy-init',function(e){ boot(e.detail||{}) });
IMY.send('ready',{});
})();
