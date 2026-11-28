# Weasel Shiro

Página personal de Weasel Shiro como creador de contenido, hecha con [Astro](https://astro.build).
Se publica en Cloudflare: cada push a `master` (rama de producción) compila y publica.

| Ruta              | Página                                                         |
| :---------------- | :------------------------------------------------------------- |
| `/`               | Portada: presentación, redes, cómo es el canal, herramientas y preguntas frecuentes |
| `/gw2/mensajes/`  | Mensajes de Guild Wars 2 que se copian con un clic             |
| `/gw2/tierlist/`  | Tierlist de profesiones de GW2, con EDM opinando              |

Todos los textos están en archivos YAML dentro de [`src/content/`](src/content/), y cada uno se
valida al compilar contra su esquema (`src/content.config.ts`).

## Documentación

| Tema | Página |
|---|---|
| Qué archivo cambia qué texto y cómo escribirlos | [docs/contenido.md](docs/contenido.md) |
| Mensajes de GW2: pestañas, cambios en el navegador, exportar e importar | [docs/mensajes-gw2.md](docs/mensajes-gw2.md) |
| Estructura del código, imágenes y cómo agregar una funcionalidad | [docs/estructura.md](docs/estructura.md) |
| "Lo último en YouTube": publicar los videos nuevos | [docs/youtube.md](docs/youtube.md) |

Lo pendiente está en los [Issues](https://github.com/dp-weasel/weasel-shiro-web/issues).

## Comandos

| Comando           | Acción                                                  |
| :---------------- | :------------------------------------------------------ |
| `npm install`     | Instala las dependencias                                |
| `npm run dev`     | Servidor de desarrollo en `http://localhost:4321`       |
| `npm run check`   | Verifica tipos y plantillas                             |
| `npm run build`   | Compila el sitio en `dist/`                             |
| `npm run preview` | Sirve `dist/` para revisarlo antes de publicar          |
| `npm run brand:icons` | Regenera los íconos de `public/` desde el logo      |
| `npm run brand:og` | Regenera `public/og.png` (vista previa al compartir)   |
| `npm run videos`  | Trae los últimos videos de YouTube (sin commit ni push) |
| `npm run videos:publicar` | Trae los videos, compila, mergea a `master` y hace push |

## Variables de build

- `SITE_URL`: hay que definirla en Cloudflare con la URL pública (p. ej. `https://tu-dominio`). Sin
  ella no se generan el sitemap ni las URLs absolutas de la vista previa al compartir. En local no
  hace falta.
- `BASE_PATH` (opcional): compila el sitio en una subcarpeta, p. ej.
  `BASE_PATH=/weasel-shiro-web/ npm run build` para el servidor local
  (`http://fedora.lan/weasel-shiro-web/`). Sin ella, el sitio va en la raíz. Por eso los enlaces
  internos usan `ruta()` de `src/lib/rutas.ts`.
