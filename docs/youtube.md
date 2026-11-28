# Videos de YouTube


"Lo último en YouTube" no se escribe a mano. **Después de subir un video**, desde `master` y
sin cambios pendientes:

```sh
npm run videos:publicar
```

El script lee el feed RSS público del canal (sin API key), saltea los Shorts y los directos
programados o sin grabación, y guarda los más recientes en `src/content/portada/youtube.json`,
con sus miniaturas en `src/assets/youtube/`. Así el build no depende de YouTube. Después compila
para verificar, hace commit en `chore/videos-youtube`, lo mergea a `master`, borra la rama y hace push, y
con eso Cloudflare publica. Si no hay videos nuevos, no hace nada (y avisa si `master` tiene
commits sin subir).

Para ver cómo queda sin publicar: `npm run videos` y después `npm run dev`. Cuántos videos se
muestran y el ID del canal están en `src/content/portada/videos.yaml`.

