// Profesiones y especializaciones de élite de Guild Wars 2 para la tierlist.
// Los íconos salen de RecursosCC/GW2/Profesiones (ver scripts/gw2/importar-profesiones.mjs).
// Los nombres son los oficiales del cliente en español (API de GW2 con lang=es).
// El id de cada élite es su nombre en inglés: es el que se guarda en el navegador y en
// los enlaces compartidos, y el nombre de su ícono. No cambiarlo.
import type { ImageMetadata } from "astro";

const iconos = import.meta.glob<{ default: ImageMetadata }>("../../assets/gw2/profesiones/*.png", { eager: true });
const icono = (slug: string) => {
  const img = iconos[`../../assets/gw2/profesiones/${slug}.png`];
  if (!img) throw new Error(`Falta el ícono de ${slug} en src/assets/gw2/profesiones/`);
  return img.default;
};

export type Armadura = "pesada" | "media" | "ligera";

/** Expansión en la que salió cada especialización. "base" es la profesión sin élite. */
export const expansiones = {
  base: { nombre: "Profesiones base (core)", corto: "Core" },
  hot: { nombre: "Heart of Thorns", corto: "HoT" },
  pof: { nombre: "Path of Fire", corto: "PoF" },
  eod: { nombre: "End of Dragons", corto: "EoD" },
  voe: { nombre: "Visions of Eternity", corto: "VoE" },
} as const;
export type Expansion = keyof typeof expansiones;

export interface Especializacion {
  /** Clave estable: se guarda en el navegador y en los enlaces compartidos. */
  id: string;
  nombre: string;
  profesion: string;
  expansion: Expansion;
  img: ImageMetadata;
}

type Elite = [id: string, nombre: string];

export interface Profesion {
  id: string;
  nombre: string;
  armadura: Armadura;
  /** Color oficial de la profesión (el de la wiki y la interfaz del juego). */
  color: string;
  /** [id en inglés, nombre en español] de cada élite, en orden de expansión. */
  elites: [hot: Elite, pof: Elite, eod: Elite, voe: Elite];
}

export const profesiones: Profesion[] = [
  { id: "guardian", nombre: "Guardián", armadura: "pesada", color: "#72c1d9", elites: [["dragonhunter", "Cazadragones"], ["firebrand", "Abrasador"], ["willbender", "Subyugador"], ["luminary", "Luminaria"]] },
  { id: "warrior", nombre: "Guerrero", armadura: "pesada", color: "#ffd166", elites: [["berserker", "Berserker"], ["spellbreaker", "Rompehechizos"], ["bladesworn", "Jurafilos"], ["paragon", "Paragón"]] },
  { id: "revenant", nombre: "Retornado", armadura: "pesada", color: "#d16e5a", elites: [["herald", "Heraldo"], ["renegade", "Renegado"], ["vindicator", "Justiciero"], ["conduit", "Conductor"]] },
  { id: "engineer", nombre: "Ingeniero", armadura: "media", color: "#d09c59", elites: [["scrapper", "Chatarrero"], ["holosmith", "Holoartesano"], ["mechanist", "Mechanista"], ["amalgam", "Amalgama"]] },
  { id: "ranger", nombre: "Guardabosques", armadura: "media", color: "#8cdc82", elites: [["druid", "Druida"], ["soulbeast", "Bestialma"], ["untamed", "Indómito"], ["galeshot", "Vendaval"]] },
  { id: "thief", nombre: "Ladrón", armadura: "media", color: "#c08f95", elites: [["daredevil", "Temerario"], ["deadeye", "Certero"], ["specter", "Espectro"], ["antiquary", "Anticuario"]] },
  { id: "elementalist", nombre: "Elementalista", armadura: "ligera", color: "#f68a87", elites: [["tempest", "Tempestad"], ["weaver", "Tejedor"], ["catalyst", "Catalizador"], ["evoker", "Evocador"]] },
  { id: "mesmer", nombre: "Hipnotizador", armadura: "ligera", color: "#b679d5", elites: [["chronomancer", "Cronomante"], ["mirage", "Quimérico"], ["virtuoso", "Virtuoso"], ["troubadour", "Trovador"]] },
  { id: "necromancer", nombre: "Nigromante", armadura: "ligera", color: "#52a76f", elites: [["reaper", "Segador"], ["scourge", "Azotador"], ["harbinger", "Augurador"], ["ritualist", "Ritualista"]] },
];

const ordenElites: Expansion[] = ["hot", "pof", "eod", "voe"];

/** Las 45 fichas: cada profesión base seguida de sus cuatro élites. */
export const especializaciones: Especializacion[] = profesiones.flatMap((p) => [
  { id: p.id, nombre: p.nombre, profesion: p.id, expansion: "base" as Expansion, img: icono(p.id) },
  ...p.elites.map(([id, nombre], i) => ({
    id,
    nombre,
    profesion: p.id,
    expansion: ordenElites[i],
    img: icono(id),
  })),
]);
