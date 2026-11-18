// Botones «Exportar» e «Importar» de /gw2/mensajes/ y su diálogo
// (src/components/mensajes/Transferencia.astro). La lógica está en transferencia.ts.
import { showToast } from "../comun/toast";
import { newId, type Overrides } from "./messages-store";
import { aplicar, aYaml, MAX_BYTES, validar, visibles, type Base, type Importados, type Modo } from "./transferencia";

export interface EditorApi {
  base: Base;
  estado: () => Overrides;
  /** Nombre visible de cada pestaña, en orden (incluida Personalizado). */
  pestanas: () => { id: string; nombre: string }[];
  /** Guarda los cambios y vuelve a pintar todas las pestañas. */
  guardarTodo: (next: Overrides) => void;
}

const fecha = () => new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
const fechaArchivo = () => new Date().toLocaleDateString("sv-SE"); // AAAA-MM-DD
const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

export function initTransferencia(api: EditorApi): void {
  const exportar = document.querySelector<HTMLButtonElement>("[data-exportar]");
  const importar = document.querySelector<HTMLButtonElement>("[data-importar]");
  const dialogo = document.querySelector<HTMLDialogElement>("[data-importar-dialogo]");
  if (!exportar || !importar || !dialogo) return;

  /* --------------------------------- Exportar -------------------------------- */

  exportar.addEventListener("click", () => {
    const estado = api.estado();
    const pestanas = api.pestanas().map((p) => ({
      ...p,
      mensajes: visibles(api.base, estado, p.id).map((v) => ({ clave: v.clave, texto: v.texto })),
    }));
    const total = pestanas.reduce((n, p) => n + p.mensajes.length, 0);
    if (total === 0) {
      showToast("No hay mensajes para exportar");
      return;
    }
    const yaml = aYaml(pestanas, [
      `Mensajes de GW2 · exportados el ${fecha()} desde ${location.host}${location.pathname}`,
      "Para cargarlos: botón «Importar» en esa misma página.",
    ]);
    const url = URL.createObjectURL(new Blob([yaml], { type: "text/yaml;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `mensajes-gw2-${fechaArchivo()}.yaml` });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast(`${plural(total, "mensaje exportado", "mensajes exportados")}`);
  });

  /* --------------------------------- Importar -------------------------------- */

  const $ = <T extends HTMLElement>(sel: string) => dialogo.querySelector<T>(sel)!;
  const texto = $<HTMLTextAreaElement>("[data-importar-texto]");
  const archivo = $<HTMLInputElement>("[data-importar-archivo]");
  const nombreArchivo = $<HTMLElement>("[data-importar-nombre]");
  const resultado = $<HTMLElement>("[data-importar-resultado]");
  const acciones = $<HTMLElement>("[data-importar-acciones]");
  const modos = $<HTMLElement>("[data-importar-modos]");
  let validos: Importados | null = null;

  const mostrarModos = (si: boolean) => {
    modos.hidden = !si;
    acciones.hidden = si;
  };

  const reiniciar = () => {
    texto.value = "";
    archivo.value = "";
    nombreArchivo.textContent = "";
    resultado.replaceChildren();
    resultado.className = "resultado";
    validos = null;
    mostrarModos(false);
  };

  const lista = (items: string[], clase?: string) => {
    const ul = document.createElement("ul");
    for (const t of items) {
      const li = document.createElement("li");
      li.textContent = t;
      if (clase) li.className = clase;
      ul.append(li);
    }
    return ul;
  };

  const parrafo = (t: string) => Object.assign(document.createElement("p"), { textContent: t });

  const revisar = async () => {
    validos = null;
    mostrarModos(false);
    resultado.className = "resultado";
    resultado.replaceChildren(parrafo("Revisando…"));
    let parse: (s: string) => unknown;
    try {
      ({ parse } = await import("yaml")); // se carga solo al importar
    } catch {
      resultado.replaceChildren(parrafo("No se pudo cargar el lector de YAML. Revisá la conexión y probá de nuevo."));
      resultado.classList.add("error");
      return;
    }
    const conocidas = new Set(api.base.keys());
    const v = validar(texto.value, parse, conocidas);
    if (!v.ok) {
      resultado.classList.add("error");
      resultado.replaceChildren(parrafo("No se puede importar. Corregí esto y volvé a revisar:"), lista(v.errores));
      return;
    }

    validos = v.importados;
    const nombres = new Map(api.pestanas().map((p) => [p.id, p.nombre]));
    const detalle = [...v.importados].map(([id, p]) => `${nombres.get(id) ?? p.nombre ?? id}: ${p.mensajes.size}`);
    resultado.classList.add("valido");
    resultado.replaceChildren(
      parrafo(`✔ Todo en orden: ${plural(v.total, "mensaje", "mensajes")} en ${plural(v.importados.size, "pestaña", "pestañas")} (${detalle.join(" · ")}). ¿Cómo los cargo?`),
      ...(v.avisos.length ? [lista(v.avisos, "aviso")] : []),
    );
    mostrarModos(true);
    modos.querySelector<HTMLElement>('[data-importar-modo="combinar"]')!.focus();
  };

  const cargar = (modo: Modo) => {
    if (!validos) return;
    const antes = structuredClone(api.estado());
    const r = aplicar(api.base, antes, validos, modo, newId);
    api.guardarTodo(r.next);
    dialogo.close();

    const yaEstaban = r.repetidos ? `${r.repetidos} ya ${r.repetidos === 1 ? "estaba" : "estaban"}` : "";
    const mensaje =
      r.agregados === 0
        ? `No había nada nuevo: ${r.repetidos === 1 ? "el mensaje ya estaba" : `los ${r.repetidos} mensajes ya estaban`}`
        : [plural(r.agregados, "mensaje importado", "mensajes importados"), yaEstaban].filter(Boolean).join(" · ");
    showToast(mensaje, { ms: 6000, action: { label: "Deshacer", run: () => api.guardarTodo(antes) } });
  };

  importar.addEventListener("click", () => {
    reiniciar();
    dialogo.showModal();
    texto.focus();
  });
  $<HTMLButtonElement>("[data-importar-elegir]").addEventListener("click", () => archivo.click());
  archivo.addEventListener("change", async () => {
    const f = archivo.files?.[0];
    if (!f) return;
    nombreArchivo.textContent = f.name;
    if (f.size > MAX_BYTES) {
      texto.value = "";
      resultado.className = "resultado error";
      resultado.replaceChildren(parrafo("El archivo es demasiado grande (máximo 512 KB)."));
      mostrarModos(false);
      return;
    }
    texto.value = await f.text();
    await revisar();
  });
  // Si cambia el texto, hay que volver a revisarlo antes de cargarlo.
  texto.addEventListener("input", () => {
    if (validos || resultado.childElementCount) {
      validos = null;
      resultado.replaceChildren();
      resultado.className = "resultado";
      mostrarModos(false);
    }
  });
  $<HTMLButtonElement>("[data-importar-revisar]").addEventListener("click", revisar);
  dialogo.querySelectorAll<HTMLButtonElement>("[data-importar-cancelar]").forEach((b) => b.addEventListener("click", () => dialogo.close()));
  dialogo.querySelectorAll<HTMLButtonElement>("[data-importar-modo]").forEach((b) =>
    b.addEventListener("click", () => cargar(b.dataset.importarModo as Modo)),
  );
  // Clic fuera de la caja: cerrar.
  dialogo.addEventListener("click", (e) => {
    if (e.target === dialogo) dialogo.close();
  });
}
