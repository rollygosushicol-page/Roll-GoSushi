(function(){
  var WA = document.getElementById("pdata").dataset.wa;
  var data = JSON.parse(document.getElementById("pdata").textContent);
  var bySlug = {}; data.forEach(function(p){ bySlug[p.slug] = p; });
  var fmt = function(v){ return "$" + v.toLocaleString("es-CO").replace(/,/g,"."); };
  var $ = function(id){ return document.getElementById(id); };

  // ---- mobile nav
  var burger = $("burger"), mnav = $("mnav");
  burger.addEventListener("click", function(){
    var open = burger.getAttribute("aria-expanded") === "true";
    burger.setAttribute("aria-expanded", String(!open));
    burger.setAttribute("aria-label", open ? "Abrir menú" : "Cerrar menú");
    mnav.hidden = open;
  });
  mnav.addEventListener("click", function(e){
    if (e.target.closest("a")) { burger.setAttribute("aria-expanded","false"); mnav.hidden = true; }
  });

  // ---- product dialog
  var dlg = $("pd"), current = null, lastFocus = null, lastSection = "#menu";
  function siblings(p){ return data.filter(function(x){ return x.cat === p.cat; }); }

  function fill(p){
    current = p;
    var img = $("pd-img");
    img.src = p.img;
    img.alt = p.name + " de Roll & Go Sushi — " + p.desc;
    $("pd-cat").textContent = p.catName;
    $("pd-name").textContent = p.name;
    $("pd-price").textContent = fmt(p.price);
    $("pd-desc").textContent = p.desc;
    $("pd-tag").textContent = p.tag;
    var ul = $("pd-ing"); ul.innerHTML = "";
    if (p.inc) {
      $("pd-ing-h").textContent = "Incluye · " + p.pieces + " piezas";
      p.inc.forEach(function(it){
        var li = document.createElement("li");
        li.textContent = it[0];
        var b = document.createElement("b"); b.textContent = "×" + it[1];
        li.appendChild(b); ul.appendChild(li);
      });
    } else {
      $("pd-ing-h").textContent = "Ingredientes";
      p.ing.forEach(function(t){ var li = document.createElement("li"); li.textContent = t; ul.appendChild(li); });
    }
    $("pd-cta").href = WA + encodeURIComponent(p.msg);
    var sib = siblings(p), i = sib.indexOf(p);
    $("pd-prev").hidden = i <= 0;
    $("pd-next").hidden = i >= sib.length - 1;
    var inner = dlg.querySelector(".pd-in"); inner.scrollTop = 0;
    var info = dlg.querySelector(".pd-info"); info.scrollTop = 0;
  }

  function openProduct(slug){
    var p = bySlug[slug]; if (!p) return;
    fill(p);
    if (!dlg.open) {
      lastFocus = document.activeElement;
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open","");
      document.body.classList.add("locked");
    }
  }
  function closeProduct(){
    if (dlg.open) { dlg.close ? dlg.close() : dlg.removeAttribute("open"); }
  }
  dlg.addEventListener("close", function(){
    document.body.classList.remove("locked");
    if (/^#producto-/.test(location.hash)) {
      try { history.replaceState(null, "", lastSection); } catch(e){}
    }
    if (lastFocus && lastFocus.focus) lastFocus.focus({preventScroll:true});
  });
  $("pd-x").addEventListener("click", closeProduct);
  dlg.addEventListener("click", function(e){ if (e.target === dlg) closeProduct(); });
  function step(d){
    var sib = siblings(current), i = sib.indexOf(current) + d;
    if (sib[i]) { setHash("producto-" + sib[i].slug); fill(sib[i]); }
  }
  $("pd-prev").addEventListener("click", function(){ step(-1); });
  $("pd-next").addEventListener("click", function(){ step(1); });

  function setHash(h){ try { history.replaceState(null, "", "#" + h); } catch(e){} }

  document.addEventListener("click", function(e){
    var a = e.target.closest("a[data-slug]");
    if (!a) return;
    e.preventDefault();
    var sec = a.closest("section[id]"); lastSection = sec ? "#" + sec.id : "#menu";
    try { history.pushState(null, "", "#producto-" + a.dataset.slug); } catch(err){}
    openProduct(a.dataset.slug);
  });
  window.addEventListener("hashchange", route);
  window.addEventListener("popstate", route);
  function route(){
    var m = location.hash.match(/^#producto-([a-z0-9-]+)$/);
    if (m) openProduct(m[1]); else closeProduct();
  }
  route();

  // ---- active category chip
  var chips = Array.prototype.slice.call(document.querySelectorAll(".chip"));
  var targets = chips.map(function(c){ return document.getElementById(c.dataset.target); }).filter(Boolean);
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (!en.isIntersecting) return;
        chips.forEach(function(c){
          var on = c.dataset.target === en.target.id;
          c.classList.toggle("on", on);
          if (on && c.parentNode.scrollTo) {
            c.parentNode.scrollTo({left: c.offsetLeft - 16, behavior: "smooth"});
          }
        });
      });
    }, {rootMargin: "-35% 0px -60% 0px"});
    targets.forEach(function(t){ io.observe(t); });
  }

  // ---- copy number
  document.querySelectorAll(".copy").forEach(function(b){
    b.addEventListener("click", function(){
      var txt = b.dataset.copy;
      var done = function(){ b.textContent = "Copiado"; setTimeout(function(){ b.textContent = "Copiar"; }, 1800); };
      try {
        navigator.clipboard.writeText(txt).then(done, function(){ selectNum(b); });
      } catch(e){ selectNum(b); }
    });
  });
  function selectNum(b){
    var s = b.parentNode.querySelector(".sel-text"); if (!s) return;
    var r = document.createRange(); r.selectNodeContents(s);
    var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
  }
})();
