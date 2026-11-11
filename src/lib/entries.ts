export type EntryKind = "device" | "board" | "component" | "repair";
export const kinds: EntryKind[] = ["device", "board", "component", "repair"];
export const kindNames: Record<EntryKind,string> = {device:"Gerät / Maschine",board:"Platine",component:"Bauteil",repair:"Reparaturfall"};
export const prefixes: Record<EntryKind,string> = {device:"DEV",board:"BRD",component:"CMP",repair:"REP"};
export function slugify(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,75) || "eintrag";
}
export function entryHref(kind: EntryKind, id: string | number, title: string) {
  return `/entry/${kind}/${id}/${slugify(title)}`;
}
export function publicId(kind: EntryKind, id: string | number) {
  return `${prefixes[kind]}-${String(id).padStart(6,"0")}`;
}
