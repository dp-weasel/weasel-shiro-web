// Exportar e importar los mensajes de /gw2/mensajes/ como texto YAML.
// Lógica pura (sin DOM): armar el YAML, validarlo y calcular cómo quedan los
// cambios de la persona (Overrides) al importar. La interfaz está en transferencia-ui.ts.
//
// Formato (el mismo al exportar y al importar):
//
//   version: 1
//   pestanas:
//     fractales:                 ← id de la pestaña (nombre del archivo en src/content/gw2/mensajes/)
//       nombre: "Fractales"      ← opcional al importar
//       mensajes:
//         lfg-t4: "LFG T4 …"     ← clave: texto
//     personalizado:
//       nombre: "Personalizado"
//       mensajes:
//         a1b2c3d4: "Mi mensaje"
import { CUSTOM_TAB, GW2_CHAT_LIMIT } from "../../lib/gw2/chat";
import type { CustomMessage, Overrides } from "./messages-store";

export const VERSION = 1;
/** Tamaño máximo del texto a importar. */
export const MAX_BYTES = 512 * 1024;
const MAX_MENSAJES = 2000;
const MAX_ERRORES = 12;
const CLAVE = /^[a-z0-9][a-z0-9-]*$/;

/** Mensajes publicados: pestaña → (clave completa "pestaña/clave" → texto). */
export type Base = Map<string, Map<string, string>>;

export interface PestanaExportada {
  id: string;
  nombre: string;
  mensajes: { clave: string; texto: string }[];
}

/** Lo importado, ya validado: pestaña → nombre (si vino) y clave → texto. */
export type Importados = Map<string, { nombre?: string; mensajes: Map<string, string> }>;

export type Validacion =
  | { ok: true; importados: Importados; total: number; avisos: string[] }
  | { ok: false; errores: string[] };

export type Modo = "combinar" | "reemplazar";

export interface Resultado {
  next: Overrides;
  /** Mensajes que quedaron visibles gracias al archivo (nuevos o recuperados). */
  agregados: number;
  /** Mensajes publicados cuyo texto cambió por el del archivo. */
  cambiados: number;
  /** Mensajes del archivo que no se agregaron porque ese texto ya estaba en su pestaña. */
  repetidos: number;
}

/* --------------------------------- Exportar --------------------------------- */

/** Un texto entre comillas dobles. JSON.stringify produce un escalar YAML válido. */
const comillas = (s: string) => JSON.stringify(s);

export function aYaml(pestanas: PestanaExportada[], encabezado: string[]): string {
  const lineas = [...encabezado.map((l) => `# ${l}`), "", `version: ${VERSION}`, "pestanas:"];
  for (const p of pestanas) {
    if (p.mensajes.length === 0) continue;
    lineas.push(`  ${p.id}:`, `    nombre: ${comillas(p.nombre)}`, "    mensajes:");
    for (const m of p.mensajes) lineas.push(`      ${m.clave}: ${comillas(m.texto)}`);
  }
  return lineas.join("\n") + "\n";
}

/* --------------------------------- Validar ---------------------------------- */

const esObjeto = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

/** Igual que el editor: el chat de GW2 es de una sola línea. */
const limpiar = (s: string) => s.replace(/\s*\n+\s*/g, " ").trim();

/**
 * Revisa el texto antes de importarlo. `parse` es el de la librería `yaml`
 * (se recibe como parámetro para cargarla solo cuando hace falta).
 */
export function validar(texto: string, parse: (s: string) => unknown, conocidas: Set<string>): Validacion {
  const errores: string[] = [];
  const error = (e: string) => errores.length < MAX_ERRORES && errores.push(e);

  if (!texto.trim()) return { ok: false, errores: ["El texto está vacío."] };
  if (new Blob([texto]).size > MAX_BYTES) return { ok: false, errores: ["El archivo es demasiado grande (máximo 512 KB)."] };

  let datos: unknown;
  try {
    datos = parse(texto);
  } catch (e) {
    const linea = (e as { linePos?: { line: number }[] }).linePos?.[0]?.line;
    const original = e instanceof Error ? e.message.split("\n")[0].replace(/ at line \d+, column \d+:?$/, "") : String(e);
    const detalle = /keys must be unique/i.test(original) ? "hay una clave repetida" : original;
    return { ok: false, errores: [`No es un YAML válido${linea ? ` (línea ${linea})` : ""}: ${detalle}`] };
  }

  if (!esObjeto(datos) || !esObjeto(datos.pestanas)) {
    return { ok: false, errores: ["Falta la sección «pestanas:». El formato es el mismo que el de un archivo exportado desde esta página."] };
  }
  if (datos.version !== undefined && datos.version !== VERSION) {
    error(`La versión del archivo es ${String(datos.version)} y esta página entiende la ${VERSION}.`);
  }

  const importados: Importados = new Map();
  const avisos: string[] = [];
  let total = 0;

  for (const [tab, valor] of Object.entries(datos.pestanas)) {
    if (!CLAVE.test(tab)) {
      error(`La pestaña «${tab}» no es válida: el id va en minúsculas, sin espacios ni tildes (p. ej. mundo-abierto).`);
      continue;
    }
    if (!esObjeto(valor) || !esObjeto(valor.mensajes)) {
      error(`${tab}: falta «mensajes:» con los mensajes de la pestaña.`);
      continue;
    }
    if (valor.nombre !== undefined && (typeof valor.nombre !== "string" || !valor.nombre.trim())) {
      error(`${tab}: «nombre» tiene que ser un texto.`);
    }

    const mensajes = new Map<string, string>();
    for (const [clave, crudo] of Object.entries(valor.mensajes)) {
      const donde = `${tab} › ${clave}`;
      if (!CLAVE.test(clave)) {
        error(`${donde}: la clave va en minúsculas, sin espacios ni tildes (p. ej. tren-frostgorge).`);
        continue;
      }
      if (typeof crudo !== "string") {
        error(`${donde}: el mensaje tiene que ser un texto entre comillas.`);
        continue;
      }
      const texto = limpiar(crudo);
      if (!texto) error(`${donde}: el mensaje está vacío.`);
      else if (texto.length > GW2_CHAT_LIMIT) {
        error(`${donde}: tiene ${texto.length} caracteres y el chat de GW2 admite hasta ${GW2_CHAT_LIMIT}.`);
      } else mensajes.set(clave, texto);
    }
    total += mensajes.size;
    if (mensajes.size === 0) continue;

    importados.set(tab, { nombre: typeof valor.nombre === "string" ? valor.nombre.trim() : undefined, mensajes });
    if (!conocidas.has(tab) && tab !== CUSTOM_TAB.id) {
      avisos.push(`La pestaña «${valor.nombre ?? tab}» no existe en esta página: sus mensajes van a ${CUSTOM_TAB.name}.`);
    }
  }

  if (total > MAX_MENSAJES) error(`Son ${total} mensajes; el máximo es ${MAX_MENSAJES}.`);
  if (errores.length === 0 && total === 0) error("El archivo no tiene ningún mensaje.");
  if (errores.length) {
    if (errores.length === MAX_ERRORES) errores.push("…y puede haber más errores.");
    return { ok: false, errores };
  }
  return { ok: true, importados, total, avisos };
}

/* --------------------------------- Importar --------------------------------- */

/** Lo que la persona ve en una pestaña: publicados (con sus cambios) y propios. */
export function visibles(base: Base, state: Overrides, tab: string): { clave: string; texto: string; propio: boolean }[] {
  const borrados = new Set(state.deleted);
  const lista = [];
  for (const [key, texto] of base.get(tab) ?? []) {
    if (borrados.has(key)) continue;
    lista.push({ clave: key.slice(tab.length + 1), texto: state.edited[key] ?? texto, propio: false });
  }
  for (const c of state.added[tab] ?? []) lista.push({ clave: c.id, texto: c.text, propio: true });
  return lista;
}

/** Pestaña donde termina cada pestaña importada: las que no existen van a Personalizado. */
const destino = (base: Base, tab: string) => (base.has(tab) ? tab : CUSTOM_TAB.id);

/** Id libre para un mensaje propio: la clave importada si se puede, si no una nueva. */
function idLibre(preferido: string, tab: string, base: Base, usados: Set<string>, newId: () => string): string {
  let id = preferido;
  while (usados.has(id) || base.get(tab)?.has(`${tab}/${id}`)) id = newId();
  usados.add(id);
  return id;
}

/**
 * Calcula los cambios de la persona después de importar.
 *   combinar:   se conserva todo lo que hay y se suma lo importado (sin repetir textos).
 *   reemplazar: en cada pestaña queda exactamente lo importado; lo publicado que no
 *               vino en el archivo queda eliminado (se puede restaurar como siempre).
 */
export function aplicar(base: Base, state: Overrides, importados: Importados, modo: Modo, newId: () => string): Resultado {
  const next: Overrides =
    modo === "combinar"
      ? structuredClone(state)
      : { edited: {}, deleted: [...base.values()].flatMap((m) => [...m.keys()]), added: {} };
  let agregados = 0;
  let cambiados = 0;
  let repetidos = 0;

  // Textos que ya se ven en cada pestaña, para no repetirlos; e ids propios ya usados.
  const textos = new Map<string, Set<string>>();
  const ids = new Map<string, Set<string>>();
  const pestanas = new Set([...base.keys(), CUSTOM_TAB.id]);
  for (const tab of pestanas) {
    const vis = visibles(base, next, tab);
    textos.set(tab, new Set(vis.map((v) => v.texto)));
    ids.set(tab, new Set((next.added[tab] ?? []).map((c) => c.id)));
  }

  for (const [origen, { mensajes }] of importados) {
    const tab = destino(base, origen);
    const vistos = textos.get(tab)!;
    for (const [clave, texto] of mensajes) {
      if (vistos.has(texto)) {
        repetidos++;
        continue;
      }
      vistos.add(texto);

      const key = `${tab}/${clave}`;
      const publicado = tab === origen ? base.get(tab)?.get(key) : undefined;
      const borrado = next.deleted.includes(key);

      if (publicado !== undefined && borrado) {
        // Un mensaje publicado que no se veía: vuelve, con el texto del archivo.
        next.deleted = next.deleted.filter((k) => k !== key);
        if (texto === publicado) delete next.edited[key];
        else {
          next.edited[key] = texto;
          if (modo === "combinar") cambiados++;
        }
        agregados++;
      } else {
        // Clave nueva (o una publicada que ya se ve con otro texto): mensaje propio.
        const preferido = tab === origen ? clave : `${origen}-${clave}`;
        const id = idLibre(preferido, tab, base, ids.get(tab)!, newId);
        ((next.added[tab] ??= []) as CustomMessage[]).push({ id, text: texto });
        agregados++;
      }
    }
  }

  if (modo === "reemplazar") {
    // En este modo, «cambiados» son los publicados que vuelven con otro texto.
    cambiados = Object.keys(next.edited).length;
  }
  return { next, agregados, cambiados, repetidos };
}
