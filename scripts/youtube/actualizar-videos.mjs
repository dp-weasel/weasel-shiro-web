// Trae los últimos videos del canal de YouTube y los guarda en el repo:
//   src/content/portada/youtube.json   títulos, duraciones y fechas (no editar a mano)
//   src/assets/youtube/<id>.jpg         miniaturas
//
//   npm run videos             solo actualiza los archivos (para mirar con npm run dev)
//   npm run videos:publicar    actualiza, compila, hace commit en chore/videos-youtube,
//                              lo mergea a master y hace push (publica en Cloudflare)
//
// Lee el feed RSS público del canal (sin API key). Saltea los Shorts y los directos
// programados o sin grabación. El ID del canal y cuántos videos mostrar están en
// src/content/portada/videos.yaml.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

const RAIZ = new URL("../../", import.meta.url).pathname;
const CONFIG = join(RAIZ, "src/content/portada/videos.yaml");
const DATOS = join(RAIZ, "src/content/portada/youtube.json");
const MINIATURAS = join(RAIZ, "src/assets/youtube");
const RAMA = "chore/videos-youtube";
const NAVEGADOR = { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64)", "Accept-Language": "es-419,es;q=0.9" };

const publicar = process.argv.includes("--publicar");

const git = (...args) => execFileSync("git", args, { cwd: RAIZ, encoding: "utf8" }).trim();
const run = (cmd, args) => execFileSync(cmd, args, { cwd: RAIZ, stdio: "inherit" });
const salir = (mensaje) => {
  console.error(`✗ ${mensaje}`);
  process.exit(1);
};

/* ------------------------------ Antes de empezar ------------------------------ */

if (publicar) {
  if (git("branch", "--show-current") !== "master") salir("Para publicar, pasate primero a master (git switch master).");
  if (git("status", "--porcelain", "--untracked-files=no")) salir("Hay cambios sin commit. Guardalos o descartalos antes de publicar.");
  console.log("→ Trayendo master de GitHub…");
  git("pull", "--ff-only", "origin", "master");
}

/* --------------------------------- YouTube --------------------------------- */

const { canal_id: canalId, cantidad } = parse(readFileSync(CONFIG, "utf8"));
if (!canalId) salir("Falta canal_id en src/content/portada/videos.yaml.");

const entidades = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
const decodificar = (t) =>
  t.replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e) =>
    e[0] === "#" ? String.fromCodePoint(parseInt(e.slice(1).replace(/^x/i, ""), e[1].toLowerCase() === "x" ? 16 : 10)) : (entidades[e] ?? m),
  );
const etiqueta = (xml, nombre) => xml.match(new RegExp(`<${nombre}>([^<]*)</${nombre}>`))?.[1];

async function pedir(url, opciones) {
  const r = await fetch(url, { headers: NAVEGADOR, ...opciones });
  if (!r.ok && r.status !== 303) throw new Error(`${url} devolvió ${r.status}`);
  return r;
}

/** Duración en "m:ss" o "h:mm:ss". */
function formatear(segundos) {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = String(segundos % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

/** Mira la página del video: si se puede ver y cuánto dura. */
async function detalles(id) {
  const html = await (await pedir(`https://www.youtube.com/watch?v=${id}`)).text();
  const estado = html.match(/"playabilityStatus":\{"status":"([A-Z_]+)"/)?.[1];
  const segundos = Number(html.match(/"lengthSeconds":"(\d+)"/)?.[1] ?? 0);
  return { visible: estado === "OK" && segundos > 0, duracion: segundos ? formatear(segundos) : undefined };
}

/** /shorts/<id> responde 200 si es un Short y redirige a /watch si no lo es. */
const esShort = async (id) => (await pedir(`https://www.youtube.com/shorts/${id}`, { redirect: "manual" })).status === 200;

async function bajarMiniatura(id) {
  // maxresdefault (1280×720) no existe en todos los videos; hqdefault sí.
  for (const calidad of ["maxresdefault", "hqdefault"]) {
    const r = await fetch(`https://i.ytimg.com/vi/${id}/${calidad}.jpg`);
    if (r.ok) return writeFileSync(join(MINIATURAS, `${id}.jpg`), Buffer.from(await r.arrayBuffer()));
  }
  throw new Error(`No se pudo bajar la miniatura de ${id}`);
}

console.log("→ Leyendo el canal de YouTube…");
const feed = await (await pedir(`https://www.youtube.com/feeds/videos.xml?channel_id=${canalId}`)).text();
const entradas = feed.split("<entry>").slice(1).map((e) => ({
  id: etiqueta(e, "yt:videoId"),
  titulo: decodificar(etiqueta(e, "title") ?? "").trim(),
  publicado: etiqueta(e, "published"),
}));
if (!entradas.length) salir("El feed del canal no trajo ningún video.");

const videos = [];
for (const v of entradas) {
  if (videos.length >= cantidad) break;
  if (await esShort(v.id)) {
    console.log(`  · salteo (Short): ${v.titulo}`);
    continue;
  }
  const { visible, duracion } = await detalles(v.id);
  if (!visible) {
    console.log(`  · salteo (directo programado o no disponible): ${v.titulo}`);
    continue;
  }
  videos.push({ ...v, duracion });
  console.log(`  ✓ ${v.titulo} (${duracion})`);
}

/* --------------------------- Guardar en el repo --------------------------- */

mkdirSync(MINIATURAS, { recursive: true });
const ids = new Set(videos.map((v) => v.id));
for (const archivo of readdirSync(MINIATURAS)) {
  if (!ids.has(archivo.replace(/\.jpg$/, ""))) rmSync(join(MINIATURAS, archivo));
}
for (const v of videos) {
  if (!existsSync(join(MINIATURAS, `${v.id}.jpg`))) await bajarMiniatura(v.id);
}
writeFileSync(DATOS, JSON.stringify({ videos }, null, 2) + "\n");

const cambios = git("status", "--porcelain", "--", DATOS, MINIATURAS);
if (!cambios) {
  console.log("✓ No hay videos nuevos: no cambió nada.");
  process.exit(0);
}
console.log("✓ Videos actualizados.");
if (!publicar) {
  console.log("  Mirá cómo queda con npm run dev. Para publicar: npm run videos:publicar");
  process.exit(0);
}

/* -------------------------------- Publicar -------------------------------- */

// La rama se reutiliza en cada actualización: como ya está mergeada, se la pone en master.
const existe = git("branch", "--list", RAMA) !== "";
if (existe) {
  try {
    git("merge-base", "--is-ancestor", RAMA, "master");
  } catch {
    salir(`La rama ${RAMA} tiene commits que no están en master. Revisala a mano.`);
  }
}
git("switch", "-C", RAMA);
git("add", "--", DATOS, MINIATURAS);
git("commit", "-m", `Actualiza los videos de YouTube\n\nÚltimo: ${videos[0]?.titulo ?? "—"}`);

console.log("→ Compilando para verificar…");
try {
  run("npm", ["run", "build"]);
} catch {
  git("switch", "master");
  salir(`La compilación falló. El commit quedó en la rama ${RAMA}, master no se tocó.`);
}

git("switch", "master");
git("merge", "--no-ff", RAMA, "-m", `Merge ${RAMA}`);
console.log("→ Publicando (push a master)…");
run("git", ["push", "origin", "master"]);
console.log("✓ Listo. Cloudflare va a publicar la web en unos minutos.");
