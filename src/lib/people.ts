// The two people this app is for, and each one's theme color.
// Skyler = purple, Rihana = pink.
export const PEOPLE = ["Skyler", "Rihana"];

const PURPLE = "#a855f7";
const PINK = "#f9a8d4";

export function personColor(name?: string | null): string {
  if (name === "Skyler") return PURPLE;
  if (name === "Rihana") return PINK;
  return PINK;
}

// True when this person's accent is purple (Skyler), false for pink (Rihana).
export function isPurplePerson(name?: string | null): boolean {
  return name === "Skyler";
}
