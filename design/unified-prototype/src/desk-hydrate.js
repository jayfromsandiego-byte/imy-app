/* IMY desk hydrator · the Sharpened Desk, fed by the account's real state.
   window.IMY_DESK is injected before the desk's own script (data overrides);
   this runs after it (identity, wiring into the app). */
(function(){
  var D=window.IMY_DESK;
  if(!D)return;
  function $(s,c){return (c||document).querySelector(s)}
  function $$(s,c){return [].slice.call((c||document).querySelectorAll(s))}
  function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}
  function money(n){return '$'+(n%1?n.toFixed(2):n)}

  /* ── identity ── */
  $$('.nm-txt').forEach(function(el){el.textContent=D.name});
  $$('.dt-txt').forEach(function(el){el.textContent=D.datesShort});
  $$('.archp').forEach(function(el){
    if(D.portrait){ el.innerHTML='<img src="'+D.portrait+'" alt=""/>'; }
    else el.innerHTML='<span class="initial">'+esc(D.initial)+'</span>';
  });
  var g=$('#greet');
  if(g&&g.parentNode){
    var ns=g.parentNode.childNodes;
    for(var i=0;i<ns.length;i++){ if(ns[i].nodeType===3&&/,/.test(ns[i].textContent)){ ns[i].textContent=D.accountFirst?', '+D.accountFirst:''; break; } }
  }
  var vt=$('.vartag'); if(vt)vt.textContent='I MISS YOU MEMORIAL · '+(D.email||'')+' · PROTOTYPE';
  var ps=$('.plan-strip');
  if(ps)ps.innerHTML=D.plan==='plus'?'Plus · everything kept, <b>for life</b>':'Free plan · the page stays online, <b>always</b>';
  var sl=$('#sharelink'); if(sl)sl.textContent='imissyoumemorial.com/'+D.slug;
  /* every door to the page itself */
  $$('a[href*="/sites/"]').forEach(function(a){ a.setAttribute('href','/sites/'+D.slug); });
  var dl=$('#delmodal .fld label'); if(dl)dl.innerHTML='Type your full email address to confirm — <b>'+esc(D.email)+'</b>';

  /* ── overview ── */
  var ss=$('.statstrip');
  if(ss)ss.innerHTML='So far · <b>'+(D.counts.visits||0)+' visit'+(D.counts.visits===1?'':'s')+'</b> · <b>'+(D.counts.flowers||0)+' flower'+(D.counts.flowers===1?'':'s')+'</b> · <b>'+D.memsCount+' memor'+(D.memsCount===1?'y':'ies')+'</b>';
  var mv=$('.meter .mv');
  if(mv){
    var marks=[['THE WALL',D.memsCount>0],['THE PICTURES',D.photosCount>0],['THE STORY',D.chapters.length>0],['THE TREE',D.treeCount>1],['THE SERVICE',!!D.hasSvc]];
    mv.textContent=marks.map(function(m){return m[0]+' '+(m[1]?'✓':'·')}).join(' · ');
    var done=marks.filter(function(m){return m[1]}).length;
    var bar=$('.meter .bar i'); if(bar)bar.style.width=Math.round(done/marks.length*100)+'%';
  }
  var mh=$('.meter .mh');
  if(mh){
    if(D.tapesCount>0)mh.innerHTML='The tape shelf holds '+D.tapesCount+' film'+(D.tapesCount===1?'':'s')+(D.plan==='plus'?' — playing in full.':' · full videos play with <a href="#" data-upgrade>Plus</a>.');
    else mh.innerHTML='No voice recordings on the page yet — they come with <a href="#" data-upgrade>Plus</a>.';
  }
  var minis=$$('.shelf2 .mini');
  function mini(i,v,s){ if(minis[i]){ var mvl=$('.mvl',minis[i]); var ms=$('.ms',minis[i]); if(mvl&&v!=null)mvl.textContent=v; if(ms&&s!=null)ms.textContent=s; } }
  mini(0,D.photosCount+' photo'+(D.photosCount===1?'':'s'),null);
  mini(1,D.tapesCount+' film'+(D.tapesCount===1?'':'s'),'on the tape shelf');
  mini(2,D.chapters.length+' chapter'+(D.chapters.length===1?'':'s'),'edit what the page says');
  mini(3,D.ann?D.ann.short:'—',D.ann?'choose what the page does':'add the dates in the studio');
  mini(4,'the link','send the page anywhere');
  var vg=$('.vigil span');
  if(vg){
    var fl=D.counts.flowers||0, ca=D.counts.candles||0;
    vg.innerHTML=fl||ca?('<b>'+fl+' flower'+(fl===1?'':'s')+'</b>'+(ca?' and '+ca+' candle'+(ca===1?'':'s'):'')+' have been laid on the page.')
      :'<b>The first flower waits to be laid.</b> Share the page with the family & friends who should have it.';
  }

  /* ── the studio is the editor · a quiet door on the overview ── */
  var conveyor=$('#conveyor');
  if(conveyor){
    var studioCard=document.createElement('div');
    studioCard.className='qcard';
    studioCard.style.marginTop='14px';
    studioCard.innerHTML='<p class="sen"><b>The page is the editor.</b> Open it in the studio and tap anything on it — the name, a chapter, a photograph — to change that part.</p>'+
      '<div class="foot"><button class="btn small primary" id="imyEdit">Edit the page</button><button class="btn small" id="imyView">See the page</button></div>';
    conveyor.parentNode.insertBefore(studioCard,conveyor.nextSibling);
    $('#imyEdit').addEventListener('click',function(){IMY.send('nav',{go:'studio',m:D.activeId})});
    $('#imyView').addEventListener('click',function(){IMY.send('nav',{go:'site',slug:D.slug})});
  }

  /* ── pictures ── */
  var pc=$('#photocount'); if(pc)pc.textContent=D.photosCount;

  /* ── the story · timeline from the real chapters ── */
  var sb=$('#storybody');
  if(sb)sb.innerHTML=D.chapters.length
    ?'<p>'+esc(D.first)+'’s story is told in '+D.chapters.length+' chapter'+(D.chapters.length===1?'':'s')+' — written in the studio, kept on the page.</p>'
    :'<p>The chapters of '+esc(D.first)+'’s life are still unwritten. The studio walks you through them, a year at a time.</p>';
  var sug=$('#tl-sug'); if(sug)sug.remove();
  var chapWrap=$$('.chaprow');
  if(chapWrap.length){
    var host=chapWrap[0].parentNode;
    host.innerHTML=D.chapters.map(function(c){
      return '<div class="chaprow"><div><div class="cn">'+esc(c.t)+'</div><div class="cm">'+esc(c.era)+' · '+c.n+' moment'+(c.n===1?'':'s')+'</div></div><button class="btn small" data-imy-studio>Edit in the studio</button></div>';
    }).join('')||'<div class="chaprow"><div><div class="cn">No chapters yet</div><div class="cm">the studio is ready when you are</div></div><button class="btn small" data-imy-studio>Open the studio</button></div>';
  }

  /* ── the anniversary ── */
  if(D.ann){
    var tdKick=$('#v-thatday h2.vt'); if(tdKick)tdKick.textContent=D.ann.short;
    var tdSen=$('#v-thatday .qcard p.sen'); if(tdSen)tdSen.textContent=D.ann.line;
  }

  /* ── billing ── */
  var freeCard=$$('.plancard').filter(function(c){return !c.classList.contains('plus')})[0];
  var plusCard=$('.plancard.plus');
  var up=$('.upbtn');
  if(D.plan==='plus'){
    if(freeCard){var cc=$('.curchip',freeCard); if(cc)cc.remove();}
    if(plusCard){var pt=$('.plustag',plusCard); if(pt)pt.outerHTML='<span class="curchip">Current plan</span>';}
    if(up){up.textContent='Plus is yours, for life'; up.disabled=true; up.style.opacity=.55; up.style.cursor='default';}
  }else if(up){
    up.textContent='Upgrade to Plus · '+money(D.price.amount)+(D.price.discount?' · 20% off':'');
    up.addEventListener('click',function(){IMY.send('nav',{go:'checkout',m:D.activeId})});
  }
  document.addEventListener('click',function(e){
    if(e.target.closest&&e.target.closest('[data-upgrade]')){e.preventDefault();IMY.send('nav',{go:'checkout',m:D.activeId});}
    if(e.target.closest&&e.target.closest('[data-imy-studio]')){e.preventDefault();IMY.send('nav',{go:'studio',m:D.activeId});}
  },true);

  /* ── your pages · the household ── */
  function rebuildPages(){
    var modal=$('#pagesmodal .mpanel'); if(!modal)return;
    var rows=$$('#pagesmodal .pgrow'); rows.forEach(function(r){r.remove()});
    var foot=$('#pagesmodal .mfoot');
    var anchorEl=foot;
    D.memorials.slice().reverse().forEach(function(m){
      var el=document.createElement(m.active?'div':'button');
      el.className='pgrow'+(m.active?' active':'');
      el.innerHTML='<span class="archp">'+(m.portrait?'<img src="'+m.portrait+'" alt=""/>':'<span class="initial">'+esc(m.initial)+'</span>')+'</span>'+
        '<div><div class="pgn">'+esc(m.name)+'</div><div class="pgm">'+esc(m.dates)+' · '+(m.plan==='plus'?'PLUS':'FREE PLAN')+'</div></div>'+
        (m.active?'<span class="rolechip">This desk</span>':'');
      if(!m.active)el.addEventListener('click',function(){IMY.send('setActive',{m:m.id})});
      modal.insertBefore(el,anchorEl); anchorEl=el;
    });
    if(foot){
      if(D.canCreate){
        foot.innerHTML='<button class="btn small primary" id="pgNew">Begin another page</button>'+
          (D.plusUnlocked?'<button class="btn small" id="pgNewPlus">A Plus page · '+money(D.price.discount?D.price.amount:197)+(D.price.discount?' · 20% off':'')+'</button>':'')+
          '<button class="btn small" id="pg-editdetails2">Edit details</button>';
        $('#pgNew').addEventListener('click',function(){IMY.send('createNew',{plan:''})});
        var pnp=$('#pgNewPlus'); if(pnp)pnp.addEventListener('click',function(){IMY.send('createNew',{plan:'plus'})});
      }else{
        foot.innerHTML='<span style="flex:1;font-size:12.5px;line-height:1.5">A free account keeps <b>one</b> page. Plus unlocks more — every new Plus page after your first is <b>20% off</b>.</span>'+
          '<button class="btn small primary" id="pgUnlock">Unlock with Plus · $197</button>'+
          '<button class="btn small" id="pg-editdetails2">Edit details</button>';
        $('#pgUnlock').addEventListener('click',function(){IMY.send('nav',{go:'checkout',m:D.activeId})});
      }
      var ed2=$('#pg-editdetails2'); if(ed2)ed2.addEventListener('click',function(){ $('#pagesmodal').classList.remove('open'); if(window.openPerson)window.openPerson(); });
    }
  }
  rebuildPages();

  /* ── edit details · saves into the studio's draft ── */
  var epPortrait='';
  function iso(y,m,d){ if(!y)return ''; function p(n){n=String(n||'');return n.length===1?'0'+n:n} return y+'-'+p(m||1)+'-'+p(d||1); }
  var epn=$('#ep-name'), epb=$('#ep-born'), epd=$('#ep-died'), epp=$('#ep-pn');
  if(epn)epn.value=D.name;
  if(epb)epb.value=iso(D.dates.by,D.dates.bm,D.dates.bd);
  if(epd)epd.value=iso(D.dates.dy,D.dates.dm,D.dates.dd);
  if(epp)epp.selectedIndex=D.pron==='she'?0:D.pron==='he'?1:2;
  var epBtn=$$('#personmodal .btn').filter(function(b){return /change the photo/i.test(b.textContent)})[0];
  if(epBtn){
    var f=document.createElement('input');f.type='file';f.accept='image/*';f.style.display='none';
    document.body.appendChild(f);
    epBtn.addEventListener('click',function(){f.click()});
    f.addEventListener('change',function(){
      var file=f.files[0]; if(!file)return;
      var r=new FileReader();
      r.onload=function(){
        var img=new Image();
        img.onload=function(){
          var scale=Math.min(1,900/Math.max(img.width,img.height));
          var c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);
          c.getContext('2d').drawImage(img,0,0,c.width,c.height);
          epPortrait=c.toDataURL('image/jpeg',.82);
          epBtn.textContent='✓ photo chosen · save to apply';
        };
        img.src=r.result;
      };
      r.readAsDataURL(file);
    });
  }
  var epSave=$('#ep-save');
  if(epSave)epSave.addEventListener('click',function(){
    IMY.send('updatePerson',{m:D.activeId,name:epn?epn.value.trim():'',born:epb?epb.value:'',died:epd?epd.value:'',
      pron:epp?(['she','he','they'][epp.selectedIndex]||'they'):'they',portrait:epPortrait||''});
  });

  /* ── the two-door verifications flow into the account ── */
  var delGo=$('#del-go');
  if(delGo)delGo.addEventListener('click',function(){
    var v=$('#del-input').value.trim().toLowerCase();
    if(v===String(D.email||'').toLowerCase())IMY.send('deleteAccount',{});
  });
  if(window.makeOwner){
    var _mk=window.makeOwner;
    window.makeOwner=function(row,who){
      _mk(row,who);
      try{ IMY.send('transferOwner',{m:D.activeId,email:window.tfEmail||''}); }catch(e){}
    };
  }
  /* the "you" row speaks with the real account */
  var youRow=$$('#peoplerows .prow')[0];
  if(youRow){
    var pn2=$('.pn2',youRow), pe2=$('.pe2',youRow), ti=$('.tinit',youRow);
    if(pn2)pn2.textContent=(D.accountName||'You')+' (you)';
    if(pe2)pe2.textContent=D.email||'';
    if(ti)ti.textContent=(D.accountName||'Y')[0].toUpperCase();
  }
  /* sign out */
  $$('#v-account .btn').forEach(function(b){
    if(/^sign out$/i.test(b.textContent.trim()))b.addEventListener('click',function(){IMY.send('signout',{})});
  });
  /* a chosen address already? then the account door says so */
  if(D.plan==='plus'){
    document.addEventListener('click',function(e){
      var el=e.target.closest&&e.target.closest('#chgaddr');
      if(el){e.stopImmediatePropagation();e.preventDefault();if(window.whisper)window.whisper('The address is chosen — imissyoumemorial.com/'+D.slug+' · yours for good',false);}
    },true);
  }
})();
