import { DEFAULT_SHARE_VIEW, readShareParams, shareParams, shareUrl, type ShareView } from './share-link';

const BASE = 'https://flottastellare.it/acfs-bgs-tool/';

describe('link condivisibili', () => {
  it('la vista con cui si apre la tabella non aggiunge niente al link', () => {
    expect(shareUrl(BASE, DEFAULT_SHARE_VIEW)).toBe(BASE);
    expect(readShareParams(new URLSearchParams(''))).toBeNull();
    expect(readShareParams(new URLSearchParams('utm=x'))).toBeNull();
  });

  it('andata e ritorno: ordinamento, filtri, righe e sistema', () => {
    const view: ShareView = {
      sort: { column: 'margin', direction: 'asc' },
      distanceFrom: 'Wong Sher',
      warElection: true,
      needsRecon: true,
      services: { kinds: ['interstellar-factors'], traders: ['Raw'] },
      architect: { mode: 'name', name: 'WitifulSky' },
      faction: { mode: 'name', name: 'Civitas Dei' },
      pageSize: 50,
      system: 'Crowfor',
    };
    const url = shareUrl(BASE, view);
    expect(url).toContain('sort=margin');
    expect(readShareParams(new URL(url).searchParams)).toEqual(view);
  });

  it('i valori predefiniti dei servizi restano corti nel link', () => {
    const view: ShareView = { ...DEFAULT_SHARE_VIEW, services: { kinds: ['material-trader', 'technology-broker'], traders: ['Raw', 'Manufactured', 'Encoded'] } };
    expect(shareParams(view).toString()).toBe('services=1');
    expect(readShareParams(shareParams(view))).toEqual(view);
  });

  it('ordinamento per distanza e modi senza nome', () => {
    const view: ShareView = { ...DEFAULT_SHARE_VIEW, sort: null, distanceFrom: 'Sol', architect: { mode: 'none' }, faction: { mode: 'controlled' } };
    expect(readShareParams(shareParams(view))).toEqual(view);
  });

  it('valori sconosciuti o rovinati si ignorano', () => {
    const view = readShareParams(new URLSearchParams('sort=pippo&rows=7&architect=boh&faction=%3D&services=xyz&war=si'));
    expect(view).toEqual(DEFAULT_SHARE_VIEW);
    // Per distanza senza sistema di partenza non si può: resta la priorità.
    expect(readShareParams(new URLSearchParams('sort=distance'))?.sort).toEqual({ column: 'priority', direction: 'desc' });
  });

  it('il solo sistema apre la scheda con la tabella come al solito', () => {
    expect(shareUrl(BASE, { ...DEFAULT_SHARE_VIEW, system: 'Col 285 Sector WO-Z c12' })).toBe(`${BASE}?system=Col+285+Sector+WO-Z+c12`);
    expect(readShareParams(new URLSearchParams('system=Crowfor'))).toEqual({ ...DEFAULT_SHARE_VIEW, system: 'Crowfor' });
  });
});
