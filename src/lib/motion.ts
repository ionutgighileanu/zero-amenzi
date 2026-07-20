/**
 * Vocabular de motion pentru product UI (vezi convenții impeccable):
 * 150–250ms, ease-out decisiv, fără bounce/elastic.
 * Ieșirile sunt mai rapide decât intrările (~75%).
 */
export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const DURATION = {
  /** feedback instant: press, hover, culoare */
  instant: 0.1,
  /** schimbări de stare: dropdown, crossfade taburi, rânduri */
  state: 0.15,
  /** intrări: modale, toast, carduri */
  enter: 0.22,
  /** ieșiri: ~75% din intrare */
  exit: 0.16,
} as const;
