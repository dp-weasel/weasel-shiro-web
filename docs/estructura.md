# Estructura y cómo agregar cosas

```text
src/
├── content/                  TEXTOS EDITABLES (YAML). Guía: docs/contenido.md
│   ├── sitio/                  perfil.yaml (nombre y redes), menu.yaml
│   ├── portada/                Un archivo por sección de la portada
│   └── gw2/                    Textos de las páginas de GW2, plantillas y frases de EDM
│       └── mensajes/*.yaml       Pestañas y mensajes de GW2 (un archivo por pestaña)
├── content.config.ts         Esquema de cada YAML (se valida al compilar)
├── assets/                   Imágenes que Astro optimiza al compilar
│   ├── brand/                  Logo, Armiño (SVG), poses de EDM, miniaturas de videos
│   └── gw2/profesiones/        Íconos de la tierlist
├── lib/                      Lógica compartida
│   ├── contenido.ts            leer("<archivo>"): lee un YAML de src/content/
│   ├── perfil.ts  redes.ts     Perfil con el ícono de cada red
│   ├── edm.ts  imagenes.ts     Poses de EDM y búsqueda de imágenes por nombre
│   └── gw2/                    Límite del chat, pestañas, profesiones y lógica de la tierlist
├── layouts/BaseLayout.astro  Documento base: <head>, cabecera, pie, tema sin parpadeo
├── components/               Una pieza de la interfaz por archivo, con sus estilos
│   ├── layout/                 Cabecera, pie, redes y botón de tema
│   ├── marca/                  Armiño animado, bocadillos, botones de redes, logo
│   ├── portada/                Secciones de la portada y el globo que las presenta
│   ├── mensajes/               Buscador, pestañas, mensaje copiable y editor
│   ├── tierlist/               La tierlist
│   └── ui/                     Piezas genéricas: avisos (Toast), etiqueta EJEMPLO, Hero
├── scripts/                  Lógica del navegador
│   ├── comun/                  Tema, portapapeles, avisos, normalización de texto
│   ├── mensajes/               Pestañas, búsqueda y edición de mensajes (localStorage)
│   └── tierlist/               Estado, arrastre y exportación de la tierlist
├── styles/                   tokens.css (paleta y temas), global.css, marca.css, mensajes.css
└── pages/                    Una ruta por archivo
    ├── index.astro             Portada
    ├── gw2/mensajes/index.astro  Mensajes de GW2
    ├── gw2/tierlist.astro      Tierlist de GW2
    └── robots.txt.ts           robots.txt con la URL del sitemap
public/                       Archivos servidos tal cual: favicon.ico, favicon-96.png,
                              apple-touch-icon.png y og.png (vista previa al compartir)
scripts/brand/                Generadores de los íconos y de og.png a partir del logo
scripts/gw2/                  Importa los íconos de profesiones desde RecursosCC
scripts/youtube/              Trae los últimos videos del canal (Lo último en YouTube)
```

## Imágenes

- Las imágenes que usa la página van en `src/assets/` y se importan con `<Image>` de
  `astro:assets`: Astro las convierte a WebP en varios tamaños.
- `public/` es solo para archivos que necesitan una URL fija (favicon, `og.png`).
- Si cambia el logo: `npm run brand:icons` regenera los íconos y `npm run brand:og` regenera
  `og.png` desde la plantilla `scripts/brand/og-card.html` (usa el Chrome del sistema).

## Cómo agregar una funcionalidad

1. Crear un componente en la subcarpeta que corresponda de `src/components/` con su HTML y su
   `<style>` (los estilos quedan aislados en el componente).
2. Los textos no van en el componente: van en un YAML de `src/content/`, con su esquema en
   `src/content.config.ts` (`archivo("<carpeta>/<nombre>.yaml", z.object(…))`), y se leen con
   `await leer("<nombre>")`. Sumarlo a la tabla de `docs/contenido.md`.
3. Si necesita interactividad, escribir la lógica en `src/scripts/<funcionalidad>/` e
   importarla desde un `<script>` del componente.
4. Usarlo en una página de `src/pages/`. Para una página nueva, crear el archivo ahí (la ruta
   sale de la ruta del archivo) y, si va en el menú, agregarla a `src/content/sitio/menu.yaml`.
5. Usar siempre las variables de `src/styles/tokens.css` para los colores, así funciona en ambos temas.

