// Genera dist/ a partir de src/ (HTML, CSS, JS, datos) y public/ (imágenes).
// Uso: npm run build   (sin dependencias, solo Node 18+)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");
const PUBLIC = path.join(ROOT, "public");
const DIST = path.join(ROOT, "dist");
const EXTS = ["webp", "jpg", "jpeg", "png", "avif"];

// Verifica que estén los archivos necesarios antes de empezar
const REQUIRED = ["src/index.html", "src/styles.css", "src/app.js", "src/data/negocio.json", "src/data/categorias.json", "src/data/productos.json", "public/img"];
const missing = REQUIRED.filter((f) => !fs.existsSync(path.join(ROOT, f)));
if (missing.length) {
  console.error("\n✖ Faltan archivos en el repositorio:\n" + missing.map((f) => "  - " + f).join("\n") +
    "\n\nSúbelos a GitHub en esa misma ruta (respeta mayúsculas y minúsculas) y vuelve a publicar.\n");
  process.exit(1);
}

const read = (f) => fs.readFileSync(path.join(SRC, f), "utf8");
const json = (f) => JSON.parse(read(f));
const NEG = json("data/negocio.json");
const CATS = json("data/categorias.json");
const PRODUCTS = json("data/productos.json");
const BY = Object.fromEntries(PRODUCTS.map((p) => [p.slug, p]));
const CATNAME = Object.fromEntries(CATS.map((c) => [c.id, c.nombre]));
const warnings = [];

// ---------- helpers ----------
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const price = (v) => "$" + Number(v).toLocaleString("en-US").replace(/,/g, ".");
const wa = (msg = NEG.mensaje_general) => `https://wa.me/${NEG.whatsapp}?text=${encodeURIComponent(msg)}`;
const pmsg = (p) => `Hola ${NEG.nombre} 👋 Quiero pedir ${p.articulo || "el"} ${p.nombre}.`;

/** Busca public/<carpeta>/<slug>.(webp|jpg|jpeg|png|avif) y devuelve la ruta pública. */
function findImg(folder, slug) {
  for (const ext of EXTS) {
    const rel = `img/${folder}/${slug}.${ext}`;
    if (fs.existsSync(path.join(PUBLIC, rel))) return rel;
  }
  return null;
}
function fotoGrande(p) {
  if (p.imagen) return p.imagen;
  const f = findImg("productos", p.slug);
  if (!f) warnings.push(`Falta la imagen de "${p.nombre}": agrega public/img/productos/${p.slug}.webp (o .jpg/.png)`);
  return f || "img/marca/logo.webp";
}
function fotoTarjeta(p) {
  if (p.miniatura) return p.miniatura;
  return findImg("productos/miniaturas", p.slug) || fotoGrande(p);
}
function checkPublic(rel, where) {
  if (!fs.existsSync(path.join(PUBLIC, rel))) warnings.push(`No existe public/${rel} (usado en ${where})`);
}

// ---------- icons ----------
const ICON_WA = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.23 8.23 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.24-.64.8-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48a.92.92 0 0 0-.67.31c-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29Z"/></svg>';
const ICON_IG = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M7.5 2.75h9a4.75 4.75 0 0 1 4.75 4.75v9a4.75 4.75 0 0 1-4.75 4.75h-9A4.75 4.75 0 0 1 2.75 16.5v-9A4.75 4.75 0 0 1 7.5 2.75Z"/><circle cx="12" cy="12" r="4.1" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.4" cy="6.6" r="1.15" fill="currentColor"/></svg>';
const ICON_ARROW = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M5 12h13M13 6l6 6-6 6"/></svg>';

const btnWa = (label = "Pedir por WhatsApp", msg = NEG.mensaje_general, cls = "btn btn-wa") =>
  `<a class="${cls}" href="${esc(wa(msg))}" target="_blank" rel="noopener">${ICON_WA}<span>${label}</span></a>`;

// ---------- piezas de HTML ----------
function card(p, lazy = true, variant = "") {
  const alt = `${p.nombre} de ${NEG.nombre}: ${p.descripcion.charAt(0).toLowerCase()}${p.descripcion.slice(1)}`;
  return `<a class="card ${variant}" href="#producto-${p.slug}" data-slug="${p.slug}">
  <span class="card-img"><img src="${fotoTarjeta(p)}" alt="${esc(alt)}" width="720" height="405" ${lazy ? 'loading="lazy"' : ""} decoding="async"></span>
  <span class="card-body">
    <h4 class="card-name">${esc(p.nombre)}</h4>
    <span class="card-desc">${esc(p.frase)}</span>
    <span class="card-foot"><span class="price">${price(p.precio)}</span><span class="card-cta">Ver producto</span></span>
  </span>
</a>`;
}

function comboCard(p) {
  const inc = p.incluye || [];
  const names = inc.map((i) => i.rollo);
  const tops = names.slice(0, 4).join(" · ") + (names.length > 4 ? ` y ${names.length - 4} más` : "");
  const badge = p.etiqueta ? `<span class="badge">${esc(p.etiqueta)}</span>` : "";
  const alt = `${p.nombre} de ${NEG.nombre}, ${p.piezas} piezas: ${inc.map((i) => `${i.rollo} x${i.cantidad}`).join(", ")}`;
  return `<a class="combo" href="#producto-${p.slug}" data-slug="${p.slug}">
  <span class="combo-img"><img src="${fotoGrande(p)}" alt="${esc(alt)}" width="960" height="960" loading="lazy" decoding="async">${badge}</span>
  <span class="combo-body">
    <span class="pieces"><b>${p.piezas}</b><small>piezas</small></span>
    <span class="combo-main">
      <h3 class="combo-name">${esc(p.nombre)}</h3>
      <span class="combo-mix">${inc.length} ${inc.length === 1 ? "variedad" : "variedades"} · ${esc(tops)}</span>
      <span class="card-foot"><span class="price">${price(p.precio)}</span><span class="card-cta">Ver producto</span></span>
    </span>
  </span>
</a>`;
}

const target = (c) => (c.id === "combos" ? "combos" : "cat-" + c.id);

const catNav = CATS.map((c) => {
  checkPublic(c.imagen, `categoría ${c.nombre}`);
  return `<a class="cat" href="#${target(c)}">
  <img src="${c.imagen}" alt="${esc(c.nombre)} ${esc(NEG.nombre)}" loading="lazy" decoding="async">
  <span class="cat-n">${c.numero}</span><span class="cat-name">${esc(c.nombre)}</span>
</a>`;
}).join("\n");

const chips = CATS.map((c) => `<a class="chip" href="#${target(c)}" data-target="${target(c)}">${esc(c.corto)}</a>`).join("\n");

const blocks = CATS.filter((c) => c.id !== "combos").map((c) => {
  const items = PRODUCTS.filter((p) => p.categoria === c.id);
  return `<section class="catblock" id="cat-${c.id}" aria-labelledby="h-${c.id}">
  <header class="catblock-head">
    <span class="catblock-n">${c.numero}</span>
    <div><h3 id="h-${c.id}">${esc(c.nombre)}</h3><p>${esc(c.descripcion)}</p></div>
    <span class="catblock-count">${items.length} opciones</span>
  </header>
  <div class="grid">${items.map((p) => card(p)).join("")}</div>
</section>`;
}).join("\n");

const featured = NEG.seleccion.filter((s) => BY[s] || warnings.push(`"seleccion" tiene un slug que no existe: ${s}`))
  .map((s) => card(BY[s], false, "card-feat")).join("");
const combos = PRODUCTS.filter((p) => p.categoria === "combos").map(comboCard).join("");
const comboDesc = (CATS.find((c) => c.id === "combos") || {}).descripcion || "";
const igTiles = NEG.instagram_fotos.filter((s) => BY[s])
  .map((s) => `<a class="ig-tile" href="${NEG.instagram}" target="_blank" rel="noopener"><img src="${fotoTarjeta(BY[s])}" alt="${esc(BY[s].nombre)} de ${esc(NEG.nombre)}" loading="lazy" decoding="async"></a>`).join("");

const STEPS = [
  ["Explora el menú.", "Rollos, pokes, entradas, postres y combos con foto y precio.", '<path d="M4 5h16M4 12h16M4 19h10" />'],
  ["Elige tus favoritos.", "Toca «Ver producto» para conocer ingredientes y detalles.", '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />'],
  ["Continúa en WhatsApp.", "Te abrimos el chat con tu mensaje listo para enviar.", '<path d="M5 18.5 6 15a7 7 0 1 1 3 3l-4 .5Z" /><path d="M9.5 11.5h5" />'],
  ["Arma tu carrito y envía tu pedido.", "En nuestro catálogo de WhatsApp agregas productos al carrito y nos lo envías.", '<path d="M5 8h14l-1.2 11H6.2L5 8Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" />'],
];
const steps = STEPS.map(([t, d, svg], i) => `<li class="step"><span class="step-ic"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${svg}</svg></span>
<span class="step-n">Paso ${i + 1}</span><h3>${t}</h3><p>${d}</p></li>`).join("");

// datos para la ficha (modal)
const pdata = PRODUCTS.map((p) => {
  const d = { slug: p.slug, name: p.nombre, price: p.precio, desc: p.descripcion, ing: p.ingredientes || [], tag: p.frase,
    cat: p.categoria, catName: CATNAME[p.categoria] || "", msg: pmsg(p), img: fotoGrande(p) };
  if (p.categoria === "combos") { d.inc = (p.incluye || []).map((i) => [i.rollo, i.cantidad]); d.pieces = p.piezas; }
  return d;
});

const hero = BY[NEG.hero.producto];
if (!hero) warnings.push(`hero.producto no existe: ${NEG.hero.producto}`);

let body = read("index.html");
const rep = {
  CAT_NAV: catNav, CHIPS: chips, BLOCKS: blocks, FEATURED: featured, COMBOS: combos, COMBO_DESC: esc(comboDesc),
  IG_TILES: igTiles, STEPS: steps, WA_GENERAL: esc(wa()), WA_HUMAN: esc(NEG.whatsapp_visible), IG: NEG.instagram,
  WA_BASE: `https://wa.me/${NEG.whatsapp}?text=`,
  ICON_WA, ICON_IG, ICON_ARROW,
  PDATA: JSON.stringify(pdata).replace(/<\//g, "<\\/"),
  BTN_WA_HERO: btnWa("Pedir por WhatsApp", NEG.mensaje_general, "btn btn-wa btn-lg"),
  BTN_WA: btnWa(),
  BTN_WA_ROLL: btnWa("Quiero mi roll", NEG.mensaje_general, "btn btn-wa btn-lg"),
  BTN_WA_COMBO: btnWa("Pedir un combo por WhatsApp", NEG.mensaje_combo),
  HERO_ALT: esc(hero ? `${hero.nombre} de ${NEG.nombre}` : NEG.nombre),
  HERO_FRASE: esc(NEG.hero.frase), HERO_NOMBRE: esc(hero ? hero.nombre : ""), HERO_PRECIO: hero ? price(hero.precio) : "",
  DOMICILIO: price(NEG.domicilio), ZONA: esc(NEG.zona), DIAS: esc(NEG.dias), HORARIO: esc(NEG.horario),
};
body = body.replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => {
  if (!(k in rep)) throw new Error(`Marcador sin valor en src/index.html: ${m}`);
  return rep[k];
});

// ---------- SEO / datos estructurados (sin dirección física) ----------
const abs = (rel) => `${NEG.dominio.replace(/\/$/, "")}/${rel}`;
const ld = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": abs("#org"), name: NEG.nombre, url: abs(""),
      description: "Sushi a domicilio en Bogotá. Rollos, pokes, entradas, postres y combos. Pedidos por WhatsApp.",
      logo: abs("img/marca/logo-mark.png"), sameAs: [NEG.instagram],
      areaServed: { "@type": "City", name: "Bogotá" },
      contactPoint: { "@type": "ContactPoint", telephone: "+" + NEG.whatsapp, contactType: "Pedidos por WhatsApp",
        areaServed: "CO", availableLanguage: "es",
        hoursAvailable: { "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          opens: NEG.hora_apertura, closes: NEG.hora_cierre } } },
    { "@type": "Menu", name: `Menú ${NEG.nombre}`, inLanguage: "es-CO", provider: { "@id": abs("#org") },
      hasMenuSection: CATS.map((c) => ({ "@type": "MenuSection", name: c.nombre, description: c.descripcion,
        hasMenuItem: PRODUCTS.filter((p) => p.categoria === c.id).map((p) => ({ "@type": "MenuItem", name: p.nombre,
          description: p.descripcion, image: abs(fotoGrande(p)),
          offers: { "@type": "Offer", price: String(p.precio), priceCurrency: "COP" } })) })) },
  ],
};

const TITLE = `${esc(NEG.nombre)} | Sushi a domicilio en Bogotá · Pide por WhatsApp`;
const DESC = `Sushi a domicilio en Bogotá: rollos de sushi, pokes, entradas, postres y combos para compartir. Mira el menú con precios y pide por WhatsApp. ${NEG.dias} de ${NEG.horario.replace(" — ", " a ")}. Domicilio ${price(NEG.domicilio)}.`;
const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800;900&family=Figtree:wght@400;500;600;700&family=Kaushan+Script&display=swap">';

const html = `<!doctype html>
<html lang="es-CO">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${TITLE}</title>
<meta name="description" content="${esc(DESC)}">
<meta name="keywords" content="sushi Bogotá, sushi a domicilio Bogotá, sushi domicilio Bogotá, rollos de sushi Bogotá, pokes Bogotá, combos de sushi, comida japonesa Bogotá">
<meta name="theme-color" content="#0f0c0a">
<link rel="canonical" href="${abs("")}">
<link rel="icon" href="img/marca/logo-mark.png">
<link rel="preload" href="fonts/oriental-chicken.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/montserrat.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="styles.css">
<meta property="og:type" content="website">
<meta property="og:locale" content="es_CO">
<meta property="og:url" content="${abs("")}">
<meta property="og:site_name" content="${esc(NEG.nombre)}">
<meta property="og:title" content="${esc(NEG.nombre)} · Sushi a domicilio en Bogotá">
<meta property="og:description" content="Elige tu próximo antojo. Rollos, pokes, entradas, postres y combos. Pide por WhatsApp.">
<meta property="og:image" content="${abs("img/marca/og.jpg")}">
<meta name="twitter:card" content="summary_large_image">
${FONTS}
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
${body}
<script src="app.js" defer></script>
</body>
</html>
`;

// ---------- escribir dist/ ----------
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
fs.cpSync(PUBLIC, DIST, { recursive: true });
fs.writeFileSync(path.join(DIST, "index.html"), html);
fs.copyFileSync(path.join(SRC, "styles.css"), path.join(DIST, "styles.css"));
fs.copyFileSync(path.join(SRC, "app.js"), path.join(DIST, "app.js"));
fs.writeFileSync(path.join(DIST, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${abs("sitemap.xml")}\n`);
fs.writeFileSync(path.join(DIST, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${abs("")}</loc></url></urlset>\n`);

console.log(`✔ Sitio generado en dist/ (${PRODUCTS.length} productos, ${CATS.length} categorías)`);
if (warnings.length) { console.log("\n⚠ Revisa:"); warnings.forEach((w) => console.log("  - " + w)); }
