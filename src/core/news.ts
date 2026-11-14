/**
 * La finestra "Novità": compare all'apertura della home finché il browser non l'ha vista.
 * Per una finestra nuova basta cambiare NEWS_ID e i testi `news.*` nei dizionari (tre lingue):
 * le versioni senza una voce nuova non la fanno ricomparire. Solo le novità importanti, non le
 * correzioni minori (indicazione dell'utente del 14 novembre 2026).
 */
export const NEWS_ID = '1.8.0';

/** Chiave di localStorage con l'identificativo dell'ultima finestra vista (prefisso storico `acfs-bgs:`). */
export const NEWS_SEEN_KEY = 'acfs-bgs:novita-viste';

/** Se la finestra va mostrata: l'ultima vista è un'altra (o nessuna). */
export function shouldShowNews(seen: string | null, current: string = NEWS_ID): boolean {
  return seen !== current;
}
