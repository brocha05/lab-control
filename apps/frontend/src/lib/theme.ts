/** Light by default (the design's), soft dark when the user picks it. Kept per browser. */
export const THEME_STORAGE_KEY = 'theme';

/** Runs before first paint (in <head>) so a dark choice never flashes light. */
export const THEME_INIT_SCRIPT = `try{if(localStorage.getItem('${THEME_STORAGE_KEY}')==='dark')document.documentElement.classList.add('dark')}catch(e){}`;

export function toggleTheme(): void {
  const dark = document.documentElement.classList.toggle('dark');
  try {
    localStorage.setItem(THEME_STORAGE_KEY, dark ? 'dark' : 'light');
  } catch {
    // Storage blocked: the choice lasts until the page reloads.
  }
}
