# Pendientes de la portada

La **variante 6 · La mezcla** ya es la portada (`src/pages/index.astro`). Esto es lo que falta definir.
Todo el contenido está en los YAML de `src/content/portada/` (ver `src/content/LEEME.md`). Lo supuesto
lleva una `etiqueta` (EJEMPLO, Idea, Historia supuesta…): al borrarla del YAML, desaparece de la página.

## Imágenes

- [ ] **Logo nuevo del Armiño.** El logo actual (ceño fruncido, sombreado, auriculares realistas) no
      combina con el pngTuber que aparece en el resto de la página. La idea es un Armiño amigable,
      en el estilo plano del pngTuber y con auriculares. `<ArminoVivo auriculares />` muestra un
      prototipo hecho en SVG que puede servir de referencia para quien lo dibuje.
- [ ] Cuando esté el logo nuevo, reemplazarlo en todos lados: el banner, la marca de agua, la cabecera
      (`SiteHeader`), el componente `Logo` y los íconos y la vista previa al compartir
      (`npm run brand:icons` y `npm run brand:og`). Fuera de la web: avatares de Twitch, YouTube y X,
      y las escenas de OBS.
- [ ] **Foto de Weasel** para la tarjeta de "Te presento al equipo" (hoy dice "Tu foto acá").
- [ ] Miniaturas reales de los videos que se muestren (hoy son las plantillas de ObsScenes).

## Textos

- [ ] **"Cómo empezó todo"** (`portada/historia.yaml`): la historia es inventada. Revisar el año de inicio, el
      porqué del nombre (¿Shiro = blanco?) y lo de la música.
- [ ] **Personajes** (`portada/equipo.yaml`): revisar los textos, sobre todo la frase típica de Weasel
      ("Esperá que ya entiendo") y el dato de EDM.
- [ ] **Intro del banner** (`portada/banner.yaml`) y la línea de arriba del nombre
      ("Directos de Guild Wars 2 · y lo que pinte").
- [ ] **Reglas de la casa** (`portada/reglas.yaml`): son una propuesta. Confirmar o ajustar.
- [ ] **Preguntas frecuentes** (`portada/preguntas.yaml`): confirmar las respuestas de "¿Puedo jugar con
      Weasel?" (¿se arman grupos con el chat?) y "¿Qué música suena?".
- [x] La portada vieja (con tú) se reemplazó por los textos en voseo de la variante 6.
- [x] `/gw2/mensajes/` pasó a voseo (subtítulo, editor y aviso de la pestaña Personalizado).

## Datos

- [ ] **Fecha del primer directo** (`inicio_canal` en `portada/franja.yaml`, hoy 28/09/2026): con ella se calcula el
      "Día N de la aventura" de la franja.
- [ ] **Camino a Afiliado** (`portada/metas.yaml`): los requisitos son los reales de Twitch, pero el progreso es
      inventado (31/50 seguidores, 6,5/8 h, 7/7 días, 2,4/3 espectadores). Hay que actualizarlo a mano
      o buscar la forma de traerlo de Twitch.
- [ ] **Premio de la meta** (`premio` en `portada/metas.yaml`): "stream especial de festejo… y emotes de EDM".
- [ ] **Horario** (`portada/horario.yaml`): martes y jueves 21:00, sábado 17:00, todo inventado. Hoy solo se usa para
      "3 directos por semana" en la franja.
- [ ] **Franja debajo del banner** (`portada/franja.yaml`): decidir los cuatro datos. Ideas: cuenta regresiva al
      próximo directo, último logro, jugando ahora, tema del sábado o una cinta que corre.
- [ ] **Videos de YouTube** (`portada/videos.yaml`): títulos y duraciones inventados, y todos enlazan al canal en vez
      de al video. Ya se puede poner la `url` de cada video.

## Stickers de EDM y el chat

- [x] **Nombres de los stickers** (`portada/stickers.yaml`): palabras sueltas sin prefijo (`jaja`, `F`,
      `vamos`…), las mismas del overlay de ObsScenes (`shared/stickers.js`). Si cambian, cambiar los dos.
- [x] **Stickers en pantalla:** escribir la palabra en el chat de Twitch hace aparecer a EDM, con combos.
      Hecho en `ObsScenes/overlays/stickers/`.
- [x] ~~**7TV**~~ (descartado el 2026-11-28): los stickers quedan solo para la escena. Como emotes de
      chat no funcionaban: a 28 px EDM no se distingue y cada pose necesitaba un recorte a mano.
- [x] **Comandos del chat** (`portada/comandos.yaml`): `!redes`, `!lurk`, `!donar` y `!stickers` los
      contesta el Cloudbot de Streamlabs; `!edm`, "armiño", el saludo y los stickers pasan en pantalla.
      `!horario` se descartó y "mate" ya no reacciona (para no gastar el chiste).
- [ ] **`!stickers` en Streamlabs:** configurar el comando con el texto de `ObsScenes/TODOPoses.md`
      (sección "Comando !stickers"). Actualizarlo si cambian las palabras.

## Enlaces

- [x] Cafecito: https://cafecito.app/weasel_shiro
- [ ] ¿Discord u otro espacio de comunidad? Si existe, sumarlo a "¿Querés dar una mano?" y a las redes.

## Antes de publicar

- [x] Reemplazar `src/pages/index.astro` por la variante 6 (sin la barra de variantes ni el `noindex`).
- [ ] Revisar la variante en el tema claro: las capturas se hicieron solo en el oscuro.
- [x] Limpiar las páginas de `/variantes-marca/` y las secciones que no entraron (`Horario`,
      `ProximoDirecto`, `Juegos`, `Rincon`). Siguen en el historial de la rama `feature/home-marca`.
- [ ] Revisar las imágenes sobrantes de `src/assets/brand/` y la dependencia `@fontsource-variable/cinzel`,
      que no se usa.
- [ ] Sacar todas las etiquetas EJEMPLO, IDEA o HISTORIA SUPUESTA que queden.
- [x] `npm run check && npm run build` y merge a `master`.
- [ ] Subir `master` a GitHub y revisar en Cloudflare.

# Tierlist de GW2 (`/gw2/tierlist/`)

Se eligió la versión 4 (la del directo). Rama `feature/gw2-tierlist`.

- [x] Dejarla en `/gw2/tierlist/` sin `noindex` ni pestañas de versiones, y sumarla a la cabecera.
- [x] Sumarla también a "Herramientas" en la portada (`src/content/portada/herramientas.yaml`).
- [x] Nombres de las élites en castellano (los oficiales del cliente; el buscador también encuentra el nombre en inglés).
- [ ] Reacciones de EDM (`src/content/gw2/tierlist-edm.yaml`): revisar frases y poses. Con más o menos
      de cinco filas se reparten con `nivelDeFila` (la primera es S, la última D).
- [ ] Votación del chat (IDEA, oculta con `MOSTRAR_VOTACION` en `TierList.astro`): leer el chat de Twitch y
      mover la ficha a la fila ganadora.
- [ ] Íconos: `npm run gw2:iconos` los vuelve a importar desde `RecursosCC/GW2/Profesiones`.
