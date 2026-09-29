export const THEMES = [
  "light", "dark", "cupcake", "bumblebee", "emerald", "corporate", "synthwave",
  "retro", "cyberpunk", "valentine", "halloween", "garden", "forest", "aqua",
  "lofi", "pastel", "fantasy", "wireframe", "black", "luxury", "dracula", "cmyk",
  "autumn", "business", "acid", "lemonade", "night", "coffee", "winter", "dim",
  "nord", "sunset", "caramellatte", "abyss", "silk",
] as const;

export type ThemeName = (typeof THEMES)[number];

export function isTheme(value: string): value is ThemeName {
  return (THEMES as readonly string[]).includes(value);
}
