# Roll & Go Sushi · Sitio web

Sitio de una sola página: menú con fotos y precios, ficha de cada producto y pedidos por WhatsApp.

El código vive en **GitHub** y se publica en **Vercel**. Cada vez que subes o editas un archivo en la rama `main`, Vercel arma el sitio y lo publica en 1 o 2 minutos. No hace falta instalar nada en tu computador.

## Estructura

```
roll-go-sushi/
├── vercel.json                   ← le dice a Vercel cómo armar el sitio (no tocar)
├── public/img/
│   ├── productos/                ← foto grande de cada producto (la de la ficha)
│   │   └── miniaturas/           ← foto de la tarjeta del menú (opcional)
│   ├── hero/                     ← fotos del inicio
│   └── marca/                    ← logo, favicon, og.jpg, fotos de "Nosotros"
├── src/
│   ├── index.html                ← estructura de la página
│   ├── styles.css                ← diseño
│   ├── app.js                    ← ficha de producto, menú móvil, categorías
│   └── data/
│       ├── productos.json        ← nombres, precios, descripciones, ingredientes
│       ├── categorias.json       ← las 5 categorías y su foto
│       └── negocio.json          ← WhatsApp, Instagram, horario, domicilio, dominio
└── scripts/build.mjs             ← arma el sitio en dist/ (lo ejecuta Vercel)
```

## Primera vez

1. **GitHub:** crea un repositorio nuevo, entra a "uploading an existing file" y arrastra el contenido de la carpeta `roll-go-sushi`. Toca **Commit changes**.
2. **Vercel:** entra a vercel.com → **Add New → Project** → importa el repositorio → **Deploy**. No tienes que cambiar ningún ajuste, porque `vercel.json` ya indica el comando (`npm run build`) y la carpeta de salida (`dist`).
3. Copia la dirección que te da Vercel (por ejemplo `https://roll-go-sushi.vercel.app`) y ponla en `"dominio"` dentro de `src/data/negocio.json`. De ahí salen el canonical, la imagen al compartir el link, el sitemap y los datos para Google.

**Dominio propio (opcional):** en Vercel ve a **Project → Settings → Domains**, agrega tu dominio, sigue los pasos de DNS y actualiza `"dominio"` en `negocio.json`.

## Cambiar una imagen de producto (desde GitHub)

Cada producto tiene un **slug**: su nombre en minúsculas y con guiones, por ejemplo `philadelphia`, `ojo-de-tigre` o `combo-roll-go-x-50`. Todos están en `src/data/productos.json`.

1. Nombra tu foto con el slug del producto: `philadelphia.jpg`.
2. En GitHub entra a `public/img/productos/` (o a `public/img/productos/miniaturas/` si es la foto de la tarjeta).
3. Toca **Add file → Upload files**, arrastra la foto y toca **Commit changes**.
4. Si la foto anterior tenía otro formato (por ejemplo `philadelphia.webp`), bórrala: ábrela, toca **⋯ → Delete file** y luego **Commit changes**. Si quedan dos archivos con el mismo nombre, el sitio usa el `.webp`.
5. Vercel publica el cambio solo en 1 o 2 minutos.

Sirven `.webp`, `.jpg`, `.jpeg`, `.png` o `.avif`.

- Si no hay miniatura, la tarjeta usa la foto grande.
- Si falta una foto grande, el registro del deploy en Vercel dice cuál archivo falta.
- Tamaños recomendados: ficha 1000 × 1000 px (cuadrada) y miniatura 720 × 405 px (horizontal). Intenta que cada imagen pese menos de 200 KB; puedes comprimirlas en squoosh.app antes de subirlas.

### Otras imágenes

| Qué | Archivo |
|---|---|
| Fondo del inicio | `public/img/hero/hero-fondo.webp` (horizontal, ~1400 × 540) |
| Foto destacada del inicio | `public/img/hero/hero-combo.webp`. El nombre, el precio y la frase vienen de `negocio.json` → `hero` |
| Foto de cada categoría | campo `imagen` en `src/data/categorias.json` |
| Logo y favicon | `public/img/marca/logo.webp`, `logo-mark.webp`, `logo-mark.png` |
| Imagen al compartir el link | `public/img/marca/og.jpg` (1200 × 630) |
| Sección "Nosotros" | `public/img/marca/nosotros-1.webp`, `nosotros-2.webp` |

Para usar una foto con otro nombre o en otra carpeta, indícalo en el producto dentro de `productos.json`:

```json
"imagen": "img/fotos-nuevas/philly.jpg",
"miniatura": "img/fotos-nuevas/philly-mini.jpg"
```

## Cambiar precios, textos o productos (desde GitHub)

Abre el archivo `.json`, toca el lápiz ✏️ (**Edit this file**), haz el cambio y toca **Commit changes**.

- **Precios:** van sin puntos (`30000`) y el sitio los muestra como `$30.000`.
- **Agregar un producto:** copia un bloque completo en `productos.json`, ponle un `slug` nuevo y su `categoria` (`rollos`, `pokes`, `entradas`, `postres` o `combos`), y después sube su foto con ese slug.
- **`articulo`:** se usa en el mensaje de WhatsApp: `el`, `la`, `los` o `las` ("Quiero pedir **los** Dedos crocantes").
- **Combos:** usan `piezas` e `incluye` en vez de `ingredientes`. El campo `etiqueta` es opcional (por ejemplo "De temporada").
- **WhatsApp, horario, domicilio e Instagram:** se cambian en `negocio.json` y se actualizan en toda la página.
- **"Una selección para empezar" y las fotos de Instagram:** son listas de slugs en `negocio.json` (`seleccion` e `instagram_fotos`).

Cuida las comas y comillas del JSON. Si algo queda mal escrito, el deploy falla en Vercel y el sitio sigue mostrando la última versión buena hasta que lo corrijas.

Cada producto tiene su propio enlace, que abre su ficha directamente: `tudominio.com/#producto-philadelphia`.
