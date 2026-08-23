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
  mini(3,D.ann?D.ann.short:'—',D.ann?'choose what the page does':'set the dates in the live editor');
  mini(4,'the link','send the page anywhere');
  /* the films mini opens the pictures panel, where the shelf now lives */
  if(minis[1]){ minis[1].removeAttribute('data-whisper'); minis[1].setAttribute('data-nav','pictures'); }
  var vg=$('.vigil span');
  if(vg){
    var fl=D.counts.flowers||0, ca=D.counts.candles||0;
    vg.innerHTML=fl||ca?('<b>'+fl+' flower'+(fl===1?'':'s')+'</b>'+(ca?' and '+ca+' candle'+(ca===1?'':'s'):'')+' have been laid on the page.')
      :'<b>The first flower waits to be laid.</b> Share the page with the family & friends who should have it.';
  }

  /* ── the live editor · the page itself is where editing happens ── */
  function editLive(step){ IMY.send('nav',{go:'studio',m:D.activeId,step:step||''}); }
  var conveyor=$('#conveyor');
  if(conveyor){
    var studioCard=document.createElement('div');
    studioCard.className='qcard';
    studioCard.style.marginTop='14px';
    studioCard.innerHTML='<p class="sen"><b>The live editor.</b> The page is the editor — open it and tap anything on it. The name, a chapter, a photograph: each opens its own question, and the page updates as you type.</p>'+
      '<div class="foot"><button class="btn small primary" id="imyEdit">Open the live editor</button><button class="btn small" id="imyView">See the page</button></div>';
    conveyor.parentNode.insertBefore(studioCard,conveyor.nextSibling);
    $('#imyEdit').addEventListener('click',function(){editLive('')});
    $('#imyView').addEventListener('click',function(){IMY.send('nav',{go:'site',slug:D.slug})});
  }

  /* ── pictures · photographs and the tape shelf together ── */
  var pc=$('#photocount'); if(pc)pc.textContent=D.photosCount;
  var gal=$('#gal');
  if(gal){
    var films=document.createElement('div');
    films.innerHTML='<h2 class="vt" style="margin-top:26px">The tape shelf</h2>'+
      '<p class="subline">'+(D.tapesCount?('Films on the page. Full videos play with Plus.'):'Home videos, a toast, a voicemail with a face — they live here.')+'</p>'+
      '<div class="qcard">'+
      (D.tapes.length?D.tapes.map(function(t){
        return '<div class="chaprow">'+(t.cover?'<span style="width:52px;height:38px;border-radius:6px;overflow:hidden;flex:none;margin-right:4px"><img src="'+t.cover+'" alt="" style="width:100%;height:100%;object-fit:cover"/></span>':'')+
          '<div style="flex:1"><div class="cn">'+esc(t.t)+'</div><div class="cm">'+(t.when?esc(t.when)+' · ':'')+(D.plan==='plus'?'plays in full':'plays in full with Plus')+'</div></div>'+
          '<button class="btn small" data-imy-live="tapes">Edit live</button></div>';
      }).join(''):'<div class="chaprow"><div><div class="cn">No films yet</div><div class="cm">add the first from the live editor</div></div><button class="btn small" data-imy-live="tapes">Add a film</button></div>')+
      '</div>';
    gal.parentNode.appendChild(films);
  }

  /* ── the story · every part of the page, editable live ── */
  var storyView=$('#v-story');
  if(storyView){
    var vt=$('#v-story h2.vt'); if(vt)vt.textContent='The page, part by part';
    var sl=$('#v-story .subline'); if(sl)sl.textContent='Everything the page shows, in one place. Edit any part and the page updates as you type.';
    /* the obituary editor and demo timeline step aside — the live editor holds those doors now */
    var sb0=$('#storybody'); if(sb0)sb0.remove();
    var ar0=$('#v-story .addroom'); if(ar0)ar0.remove();
    var sug0=$('#tl-sug'); if(sug0)sug0.remove();
    $$('#v-story .vt').forEach(function(h,i){ if(i>0)h.remove(); });
    $$('#v-story .subline').forEach(function(h,i){ if(i>0)h.remove(); });
    $$('#v-story .qcard').forEach(function(q){ q.remove(); });
    var mark=function(ok){return ok?'✓':'·'};
    var rows=[
      {t:'The cover',m:(D.portraitSet?'portrait ✓':'portrait ·')+' · '+(D.bgSet?'background ✓':'background ·')+' · '+(D.hasQuote?'their words ✓':'their words ·'),step:'cover'},
      {t:'The first memory',m:D.memsCount?'on the wall':'the wall opens with yours',step:'memory'},
      {t:'Chapters',m:D.chapters.length?D.chapters.map(function(c){return c.t}).join(' · '):'still unwritten — a year at a time',step:'chapters'},
      {t:'The family tree',m:D.treeCount+' '+(D.treeCount===1?'person stands':'people stand')+' on it · anyone in the family can add',step:'tree'},
      {t:'Photographs',m:D.photosCount+' in the album',step:'photos'},
      {t:'The tape shelf',m:D.tapesCount+' film'+(D.tapesCount===1?'':'s')+(D.plan==='plus'?'':' · plays in full with Plus'),step:'tapes'},
      {t:'The service',m:D.hasSvc?'on the flyer, with the map of the day':'not set — it can be added anytime',step:'service'},
      {t:'The address',m:'imissyoumemorial.com/'+D.slug,step:'address'}
    ];
    var card=document.createElement('div');
    card.className='qcard';
    card.innerHTML=rows.map(function(r){
      return '<div class="chaprow"><div style="flex:1;min-width:0"><div class="cn">'+esc(r.t)+'</div><div class="cm">'+esc(r.m)+'</div></div><button class="btn small" data-imy-live="'+r.step+'">Edit live</button></div>';
    }).join('');
    storyView.appendChild(card);
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
    if(e.target.closest&&e.target.closest('[data-upgrade]')){e.preventDefault();IMY.send('nav',{go:'checkout',m:D.activeId});return;}
    if(e.target.closest&&e.target.closest('[data-imy-studio]')){e.preventDefault();editLive('');return;}
    var lv=e.target.closest&&e.target.closest('[data-imy-live]');
    if(lv){e.preventDefault();editLive(lv.getAttribute('data-imy-live'));return;}
    /* choosing the address: Plus chooses it at checkout */
    var ca=e.target.closest&&e.target.closest('#chgaddr');
    if(ca&&D.plan!=='plus'){e.stopImmediatePropagation();e.preventDefault();IMY.send('nav',{go:'checkout',m:D.activeId});return;}
  },true);
  /* the wordmark walks home */
  var wm=$('.sidebar .wordmk');
  if(wm){
    wm.style.cursor='pointer';
    wm.insertAdjacentHTML('afterbegin','<img src="https://imissyoumemorial.com/brand/imy-mark.svg" alt="" style="width:19px;height:19px;vertical-align:-3.5px;margin-right:7px"/>');
    wm.addEventListener('click',function(){IMY.send('nav',{go:'landing'})});
  }

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

  /* ── edit details · saves straight onto the page ── */
  var epPortrait='', epBackground='';
  function iso(y,m,d){ if(!y)return ''; function p(n){n=String(n||'');return n.length===1?'0'+n:n} return y+'-'+p(m||1)+'-'+p(d||1); }
  function pickImage(max,done){
    var f=document.createElement('input');f.type='file';f.accept='image/*';f.style.display='none';
    document.body.appendChild(f);
    f.addEventListener('change',function(){
      var file=f.files[0]; if(!file)return;
      var r=new FileReader();
      r.onload=function(){
        var img=new Image();
        img.onload=function(){
          var scale=Math.min(1,max/Math.max(img.width,img.height));
          var c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);
          c.getContext('2d').drawImage(img,0,0,c.width,c.height);
          done(c.toDataURL('image/jpeg',.82));
        };
        img.src=r.result;
      };
      r.readAsDataURL(file);
    });
    f.click();
  }
  var epn=$('#ep-name'), epb=$('#ep-born'), epd=$('#ep-died'), epp=$('#ep-pn');
  if(epn)epn.value=D.name;
  if(epb)epb.value=iso(D.dates.by,D.dates.bm,D.dates.bd);
  if(epd)epd.value=iso(D.dates.dy,D.dates.dm,D.dates.dd);
  if(epp)epp.selectedIndex=D.pron==='she'?0:D.pron==='he'?1:2;
  var epBtn=$$('#personmodal .btn').filter(function(b){return /change the photo/i.test(b.textContent)})[0];
  if(epBtn){
    epBtn.addEventListener('click',function(){ pickImage(900,function(url){ epPortrait=url; epBtn.textContent='✓ photo chosen · save to apply'; }); });
    /* the background joins the details · behind their name on the page */
    var pfld=epBtn.closest('.fld');
    if(pfld){
      var bfld=document.createElement('div');
      bfld.className='fld';
      bfld.innerHTML='<label>Background photo · behind their name on the page</label><button class="btn small" type="button" id="ep-bg">'+(D.bgSet?'Change the background':'Choose a background')+'</button>';
      pfld.parentNode.insertBefore(bfld,pfld.nextSibling);
      $('#ep-bg').addEventListener('click',function(){ pickImage(1800,function(url){ epBackground=url; $('#ep-bg').textContent='✓ background chosen · save to apply'; }); });
    }
    /* the rest of the page edits live, on the page */
    var mfoot=$('#personmodal .mfoot');
    if(mfoot){
      var liveBtn=document.createElement('button');
      liveBtn.className='btn small'; liveBtn.type='button';
      liveBtn.textContent='Everything else · edit live on the page';
      liveBtn.addEventListener('click',function(){ $('#personmodal').classList.remove('open'); editLive(''); });
      mfoot.appendChild(liveBtn);
    }
  }
  var epSave=$('#ep-save');
  if(epSave)epSave.addEventListener('click',function(){
    IMY.send('updatePerson',{m:D.activeId,name:epn?epn.value.trim():'',born:epb?epb.value:'',died:epd?epd.value:'',
      pron:epp?(['she','he','they'][epp.selectedIndex]||'they'):'they',portrait:epPortrait||'',background:epBackground||''});
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
