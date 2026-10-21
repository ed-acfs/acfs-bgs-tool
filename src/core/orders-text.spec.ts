import { insertAfterOperations, orderLineForName, ordersSkeleton, renderDiscordPreview, setOrdersDate, shortcodesToEmoji } from './orders-text';

const META = { mention: '@Membro Flotta', footerNote: 'Qualunque contributo è ben accetto.', signature: ':acfs:' };

describe('shortcodesToEmoji', () => {
  it('turns standard shortcodes into emoji and leaves server emoji alone', () => {
    expect(shortcodesToEmoji('**Priorità** :one: :green_circle: :arrow_down: :RedAlert: :acfs:')).toBe(
      '**Priorità** 1️⃣ 🟢 ⬇️ :RedAlert: :acfs:',
    );
  });

  it('leaves a time like 21:40:00 untouched', () => {
    expect(shortcodesToEmoji('alle 21:40:00')).toBe('alle 21:40:00');
  });
});

describe('ordersSkeleton and setOrdersDate', () => {
  it('starts with the in-game date and real emoji', () => {
    const text = ordersSkeleton(new Date(2026, 9, 23), META);
    expect(text).toContain('## AGGIORNAMENTO ORDINI DEL 23/10/3312');
    expect(text).toContain('**Priorità** 1️⃣');
    expect(text).toContain('👴 **__CANTIERI APERTI__** 👴');
    expect(text).toContain(':Missions: **__OPERAZIONI__** :Missions:');
  });

  it('moves the date line to another day', () => {
    const text = ordersSkeleton(new Date(2026, 9, 23), META);
    expect(setOrdersDate(text, new Date(2026, 9, 25))).toContain('ORDINI DEL 25/10/3312');
  });
});

/** Part of the orders of 22 October 2026, as the user wrote them by hand. */
const REPORT = [
  '@Membro Flotta',
  '## AGGIORNAMENTO ORDINI DEL 22/10/3312',
  '',
  ':Missions: **__OPERAZIONI__** :Missions:',
  '',
  '**Priorità** 1️⃣',
  '',
  '🗳️ **Crowfor** (Draw; 0-0) 🆕',
  'Election per ACFS > **difesa del sistema** e **conquista** di _Szebehely Port_',
  '------',
  '',
  ':older_man: **__CANTIERI APERTI__** :older_man:',
  '',
  '🏗️ **Col 285 Sector ZZ-Y d43** (26%) 🆕',
  'Completare la costruzione del **Outpost Scientifico** > Ponte verso **Col 285 Sector UT-Z c13**',
  '------',
  '',
  '- **__OPERAZIONI CONCLUSE__**',
  '',
  '📊 **HIP 30129** (61.0%) ✅',
  'Inf per ACFS > 61% :arrow_forward: Stabilità & sicurezza',
  '',
  '🗳️ **LP 254-26** :x:',
  'Election per ACFS > **conquista** di _Schirra Depot_',
  '------',
  '',
  'NOTA',
  'Qualunque contributo è ben accetto e mai obbligatorio.',
].join('\n');

describe('the orders of 22 October 2026', () => {
  it('get real emoji where a standard shortcode was typed, server emoji stay', () => {
    const text = shortcodesToEmoji(REPORT);
    expect(text).toContain('61% ▶️ Stabilità');
    expect(text).toContain('🗳️ **LP 254-26** ❌');
    expect(text).toContain('👴 **__CANTIERI APERTI__** 👴');
    expect(text).toContain(':Missions: **__OPERAZIONI__** :Missions:');
  });

  it('get a new operation at the end of the operations, before the constructions', () => {
    const text = insertAfterOperations(REPORT, '📊 **Wong Sher** (43.6%) 🟡\nInf per ACFS > ');
    expect(text).toContain(
      'di _Szebehely Port_\n------\n\n📊 **Wong Sher** (43.6%) 🟡\nInf per ACFS > \n------\n\n:older_man: **__CANTIERI APERTI__**',
    );
  });
});

describe('insertAfterOperations', () => {
  it('falls back to the closing NOTA, then to the end of the text', () => {
    expect(insertAfterOperations('Inizio\n\nNOTA\nGrazie', 'riga')).toBe('Inizio\n\nriga\n------\n\nNOTA\nGrazie');
    expect(insertAfterOperations('Inizio\n', 'riga')).toBe('Inizio\n\nriga\n');
    expect(insertAfterOperations('', 'riga')).toBe('riga\n');
  });
});

describe('renderDiscordPreview', () => {
  it('renders what the Ordini use and escapes the rest', () => {
    const html = renderDiscordPreview('@Membro Flotta\n## TITOLO\n:Missions: **__OPERAZIONI__**\ndi _Apgar City_ <b>\n- punto');
    expect(html).toContain('<span class="dc-mention">@Membro Flotta</span>');
    expect(html).toContain('<div class="dc-h2">TITOLO</div>');
    expect(html).toContain('<strong><u>OPERAZIONI</u></strong>');
    expect(html).toContain('title=":Missions:">🎯</span>');
    expect(html).toContain('di <em>Apgar City</em> &lt;b&gt;');
    expect(html).toContain('<div class="dc-li">punto</div>');
  });
});
