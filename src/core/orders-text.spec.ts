import { ConflictScore, StateEntry } from './bgs';
import {
  conflictScoreText,
  insertBeforeFooter,
  orderLineForRow,
  ordersSkeleton,
  refreshOrderNumbers,
  renderDiscordPreview,
  setOrdersDate,
  shortcodesToEmoji,
} from './orders-text';

const META = { mention: '@Membro Flotta', footerNote: 'Qualunque contributo è ben accetto.', signature: ':acfs:' };

function score(ours: number, theirs: number, ended = false): ConflictScore {
  return { ours, theirs, opponent: 'Altri', ourStake: null, theirStake: null, updatedAt: null, source: 'server', ended };
}

function entry(kind: StateEntry['kind'], status: StateEntry['status'], s: ConflictScore | null): StateEntry {
  return { kind, state: kind === 'war' ? 'War' : 'Election', status, factions: [], score: s };
}

function row(systemName: string, extra: Partial<Parameters<typeof orderLineForRow>[0]> = {}) {
  return { systemName, factionInfluence: null, warState: null, electionState: null, stateEntries: [], ...extra };
}

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

describe('conflictScoreText', () => {
  it('names who is ahead while the conflict runs, and only the result once it is over', () => {
    expect(conflictScoreText(score(2, 1))).toBe('Close Victory; 2-1');
    expect(conflictScoreText(score(0, 3))).toBe('Total Defeat; 0-3');
    expect(conflictScoreText(score(4, 0))).toBe('vinto, 4-0');
    expect(conflictScoreText(score(1, 1, true))).toBe('pari, 1-1');
  });
});

describe('orderLineForRow', () => {
  it('writes an influence line with its traffic light', () => {
    expect(orderLineForRow(row('Wong Sher', { factionInfluence: 43.62 }))).toBe('📊 **Wong Sher** (43.6%) 🟡\nInf per ACFS > ');
  });

  it('writes an active election with its score', () => {
    const line = orderLineForRow(
      row('Crowfor', { electionState: 'active', stateEntries: [entry('election', 'active', score(1, 2))] }),
    );
    expect(line).toBe('🗳️ **Crowfor** (Close Defeat; 1-2)\nElection per ACFS > ');
  });

  it('announces a pending war as a draw with 🆕', () => {
    expect(orderLineForRow(row('LP 254-26', { warState: 'pending' }))).toBe('⚔️ **LP 254-26** (Draw; 0-0) 🆕\nPending War per ACFS > ');
  });
});

describe('refreshOrderNumbers', () => {
  it('updates influence and its trend, and a conflict score, leaving everything else as written', () => {
    const text = [
      '📊 **Wong Sher** (43.6%) ⬇️ 🟡',
      'Inf per ACFS > **tenere**',
      '🗳️ **Crowfor** (Draw; 0-0) 🆕',
      '**Sconosciuto** (12.0%) ⬆️',
    ].join('\n');
    const rows = [
      row('Wong Sher', { factionInfluence: 46.04 }),
      row('Crowfor', { electionState: 'active', stateEntries: [entry('election', 'active', score(1, 0))] }),
    ];
    const result = refreshOrderNumbers(text, rows);
    expect(result.text).toBe(
      ['📊 **Wong Sher** (46.0%) ⬆️ 🟡', 'Inf per ACFS > **tenere**', '🗳️ **Crowfor** (Close Victory; 1-0) 🆕', '**Sconosciuto** (12.0%) ⬆️'].join(
        '\n',
      ),
    );
    expect(result.changes).toEqual([
      { system: 'Wong Sher', before: '43.6%', after: '46.0%' },
      { system: 'Crowfor', before: 'Draw; 0-0', after: 'Close Victory; 1-0' },
    ]);
  });

  it('calls a move of a point or less stable', () => {
    const result = refreshOrderNumbers('📊 **Wong Sher** (43.6%) ⬇️', [row('Wong Sher', { factionInfluence: 44.1 })]);
    expect(result.text).toBe('📊 **Wong Sher** (44.1%) ↔️');
  });

  it('reports no change when the numbers are already current', () => {
    expect(refreshOrderNumbers('📊 **Wong Sher** (43.6%)', [row('Wong Sher', { factionInfluence: 43.6 })]).changes).toEqual([]);
  });
});

describe('insertBeforeFooter', () => {
  it('puts the block before the closing NOTA', () => {
    const text = 'Inizio\n\n------\n\nNOTA\nGrazie';
    expect(insertBeforeFooter(text, '📊 **X** (1.0%)')).toBe('Inizio\n\n------\n\n📊 **X** (1.0%)\n\nNOTA\nGrazie');
  });

  it('appends when there is no NOTA', () => {
    expect(insertBeforeFooter('Inizio\n', 'riga')).toBe('Inizio\n\nriga\n');
    expect(insertBeforeFooter('', 'riga')).toBe('riga\n');
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
