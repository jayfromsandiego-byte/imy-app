/* IMY bridge · runs inside every embedded page.
   Turns the page's links into router intents and relays state messages. */
(function(){
  if(window.__imyBridge)return; window.__imyBridge=true;
  var IMY={
    ctx:null,
    send:function(action,data){ try{ parent.postMessage({type:'imy',action:action,data:data||{}},'*'); }catch(e){} },
    on:function(fn){ window.addEventListener('message',function(e){ var m=e.data; if(m&&m.type==='imy-cmd')fn(m.action,m.data||{}); }); }
  };
  window.IMY=IMY;
  function anchor(id){
    if(!id)return;
    var el=document.getElementById(id);
    if(el)try{ el.scrollIntoView({behavior:'smooth',block:'start'}); }catch(e){ el.scrollIntoView(); }
  }
  window.addEventListener('message',function(e){
    var m=e.data;
    if(m&&m.type==='imy-init'){
      IMY.ctx=m.data||{};
      if(IMY.ctx.anchor)setTimeout(function(){anchor(IMY.ctx.anchor)},350);
      try{ window.dispatchEvent(new CustomEvent('imy-init',{detail:IMY.ctx})); }catch(err){}
    }
    if(m&&m.type==='imy-cmd'&&m.action==='anchor')anchor((m.data||{}).anchor);
  });

  /* Map a URL to a router intent. Returns null when the link should stay untouched. */
  function intent(href){
    if(!href)return null;
    var u; try{ u=new URL(href, 'https://imissyoumemorial.com/'); }catch(e){ return null; }
    var ours = /(^|\.)imissyoumemorial\.com$/.test(u.hostname);
    if(!ours) return null;
    var p=u.pathname.replace(/\/+$/,'')||'/';
    if(p==='/')                    return {go:'landing'};
    if(p==='/onboarding')          return {go:'start', plan:(u.searchParams.get('plan')||'')};
    if(p==='/signin'||p==='/login')return {go:'signin'};
    if(p==='/dashboard')           return {go:'dashboard'};
    if(p==='/pricing')             return {go:'landing', anchor:'pricing'};
    if(p.indexOf('/sites/')===0)   return {go:'site', slug:p.slice(7)};
    /* concierge, contact, privacy, terms, brand assets… → the real site, a new tab */
    return {external:true, url:u.href};
  }

  document.addEventListener('click',function(e){
    var a=e.target&&e.target.closest?e.target.closest('a[href]'):null;
    if(!a)return;
    var href=a.getAttribute('href')||'';
    if(href.charAt(0)==='#')return;                     /* in-page anchors stay native */
    var it=intent(href);
    if(!it)return;
    e.preventDefault();
    if(it.external){ try{ window.open(it.url,'_blank','noopener'); }catch(err){} return; }
    IMY.send('nav',it);
  },true);
})();
