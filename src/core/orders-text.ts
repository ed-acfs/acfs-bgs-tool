/**
 * The Ordini as one text, written like the squadron writes them by hand (in VS Code, until
 * October 2026), with the tool helping where a plain editor can't: real emoji instead of
 * Discord shortcodes, a ready line for a system, the numbers refreshed from the data, a preview
 * that looks like Discord. Pure, so it's tested without a browser; the page is
 * `app/orders/orders-text-editor.component.ts`.
 */
import { BgsRow, conflictIsOver, conflictOutcome, conflictResult, StateEntry } from './bgs';
import { ORDER_STATUSES, ORDER_TRENDS, ORDER_TYPES } from './order-types';
import { draftItemFromRow, formatOrdersDate, renderOrderItem } from './orders';

/**
 * Standard Discord shortcodes and their emoji. Discord shows a pasted emoji exactly like the one
 * it would have made from the shortcode, and a human reads 🟢 at a glance where `:green_circle:`
 * has to be read: the user's request of 21 October 2026. Server emoji (`:RedAlert:`,
 * `:Expansion:`, `:Missions:`, `:acfs:`) have no Unicode version and stay as they are.
 */
const STANDARD_EMOJI: Readonly<Record<string, string>> = {
  zero: '0️⃣', one: '1️⃣', two: '2️⃣', three: '3️⃣', four: '4️⃣', five: '5️⃣',
  six: '6️⃣', seven: '7️⃣', eight: '8️⃣', nine: '9️⃣', keycap_ten: '🔟',
  new: '🆕', green_circle: '🟢', yellow_circle: '🟡', red_circle: '🔴', orange_circle: '🟠',
  white_check_mark: '✅', x: '❌', warning: '⚠️', rotating_light: '🚨', exclamation: '❗',
  arrow_up: '⬆️', arrow_down: '⬇️', left_right_arrow: '↔️', arrow_right: '➡️', arrow_left: '⬅️',
  arrow_upper_right: '↗️', arrow_lower_right: '↘️', arrow_forward: '▶️',
  ballot_box: '🗳️', crossed_swords: '⚔️', bar_chart: '📊', construction: '🏗️', building_construction: '🏗️',
  older_man: '👴', point_right: '👉', point_left: '👈', star: '⭐', fire: '🔥', shield: '🛡️',
  dart: '🎯', globe_with_meridians: '🌐', pushpin: '📌', calendar: '📅', clipboard: '📋', rocket: '🚀',
};

/** Server emoji, shown in the preview as their closest Unicode lookalike (the text keeps the shortcode). */
const SERVER_EMOJI_PREVIEW: Readonly<Record<string, string>> = {
  RedAlert: '🚨',
  Expansion: '🌐',
  Missions: '🎯',
  acfs: '⭐',
};

/** `:green_circle:` → 🟢 for every standard shortcode; server emoji and unknown names are left alone. */
export function shortcodesToEmoji(text: string): string {
  return text.replace(/:([a-z0-9_]+):/g, (match, name: string) => STANDARD_EMOJI[name] ?? match);
}

/** One button of the editor's emoji bar: what it inserts, what it shows, what it means. */
export interface EmojiButton {
  insert: string;
  display: string;
  label: string;
}

export interface EmojiGroup {
  label: string;
  buttons: EmojiButton[];
}

const toButton = (shortcode: string, display: string, label: string): EmojiButton => ({
  insert: shortcodesToEmoji(shortcode),
  display,
  label,
});

/** The emoji bar, from the same vocabulary the structured editor used (`order-types.json`). */
export const EMOJI_GROUPS: readonly EmojiGroup[] = [
  { label: 'Stato', buttons: ORDER_STATUSES.map(status => toButton(status.emoji, status.display, status.label)) },
  { label: 'Tendenza', buttons: ORDER_TRENDS.map(trend => toButton(trend.emoji, trend.display, trend.label)) },
  {
    label: 'Tipo',
    buttons: ORDER_TYPES.filter(type => type.icon).map(type => toButton(type.icon, type.display, type.label)),
  },
  {
    label: 'Priorità',
    buttons: ['one', 'two', 'three', 'four', 'five'].map((name, index) => ({
      insert: `**Priorità** ${STANDARD_EMOJI[name]}`,
      display: STANDARD_EMOJI[name],
      label: `Priorità ${index + 1}`,
    })),
  },
  {
    label: 'Altro',
    buttons: [
      toButton(':arrow_forward:', '▶️', 'Obiettivo (es. "61% ▶️ Stabilità & sicurezza")'),
      { insert: '👉 **** 👈', display: '👉👈', label: 'Per un\'altra fazione (es. "Inf per 👉 LP 254-25 Free 👈")' },
    ],
  },
];

/** What goes around the report: who is pinged, the closing note, the signature. */
export interface OrdersTextMeta {
  mention: string;
  footerNote: string;
  signature: string;
}

const DATE_LINE = /(AGGIORNAMENTO ORDINI DEL )\d{2}\/\d{2}\/\d{4}/;

/** An empty report for the day, with the section titles already in place. */
export function ordersSkeleton(date: Date, meta: OrdersTextMeta): string {
  return shortcodesToEmoji(
    [
      `${meta.mention}\n## AGGIORNAMENTO ORDINI DEL ${formatOrdersDate(date)}`,
      ':Missions: **__OPERAZIONI__** :Missions:',
      '**Priorità** :one:\n\n\n------',
      ':older_man: **__CANTIERI APERTI__** :older_man:\n\n\n------',
      '**__NOTE & INFORMAZIONI__**\n\n\n------',
      '- **__OPERAZIONI CONCLUSE__**\n\n\n------',
      `NOTA\n${meta.footerNote}\n\nBuon gioco! \n${meta.signature}`,
    ].join('\n\n'),
  );
}

/** Sets the day in the "AGGIORNAMENTO ORDINI DEL …" line; the text is unchanged if it has none. */
export function setOrdersDate(text: string, date: Date): string {
  return text.replace(DATE_LINE, `$1${formatOrdersDate(date)}`);
}

type LineRow = Pick<BgsRow, 'systemName' | 'factionInfluence' | 'warState' | 'electionState' | 'stateEntries'>;

/** "Close Victory; 2-1" for a conflict in progress, "vinto, 4-1" once it's over (see CLAUDE.md). */
export function conflictScoreText(score: { ours: number; theirs: number; ended?: boolean }): string {
  if (conflictIsOver(score)) {
    const result = { won: 'vinto', lost: 'perso', drawn: 'pari' }[conflictResult(score.ours, score.theirs)];
    return `${result}, ${score.ours}-${score.theirs}`;
  }
  return `${conflictOutcome(score.ours, score.theirs)}; ${score.ours}-${score.theirs}`;
}

function scoredEntry(row: Pick<LineRow, 'stateEntries'>, kind?: StateEntry['kind']): StateEntry | undefined {
  return row.stateEntries.find(entry => entry.score && (kind === undefined || entry.kind === kind));
}

/**
 * The line(s) for a system, ready to drop into the text: the same as the structured editor's
 * "Aggiungi agli ordini" (type from the row's war or election, influence and traffic light
 * otherwise), with the conflict's score when the data has one. The outcome after "per ACFS >"
 * is left to write.
 */
export function orderLineForRow(row: LineRow): string {
  const item = draftItemFromRow(row);
  const kind = item.typeKey === 'war' ? 'war' : item.typeKey === 'election' ? 'election' : null;
  const entry = kind ? scoredEntry(row, kind) : undefined;
  const score = entry?.score && !item.pending ? conflictScoreText(entry.score) : item.score;
  return shortcodesToEmoji(renderOrderItem({ ...item, score }));
}

/** A line for a system the data doesn't follow: just the bold name, the rest to write. */
export function orderLineForName(name: string): string {
  return `**${name}** `;
}

/** The squadron's trend arrows, by how the influence moved: 0-1 points is "stable" (as the legend says). */
function trendFor(before: number, after: number): string {
  const delta = after - before;
  const key = Math.abs(delta) <= 1 ? 'stable' : delta > 0 ? 'up' : 'down';
  return shortcodesToEmoji(ORDER_TRENDS.find(trend => trend.key === key)!.emoji);
}

const ICON_KIND: ReadonlyArray<[string, StateEntry['kind']]> = [
  ['🗳️', 'election'],
  ['⚔️', 'war'],
];

/** Lines "Aggiorna i numeri" leaves alone: concluded operations and constructions. */
const SKIP_REFRESH: readonly string[] = ['✅', '❌', ':white_check_mark:', ':x:', '🏗️'];

/** One change made by {@link refreshOrderNumbers}, to show the officer what moved. */
export interface NumberChange {
  system: string;
  before: string;
  after: string;
}

/**
 * Refreshes the numbers in parentheses after a bold system name, where the data has newer ones:
 * the influence ("43.6%", with the trend arrow recomputed from the old value) and a conflict's
 * days won ("Close Victory; 2-1"). Lines for systems the data doesn't know, and everything
 * else in the text, stay exactly as written. So do concluded lines (✅ ❌: their numbers are the
 * final ones) and constructions (🏗️: the percentage is the build's progress, not influence).
 */
export function refreshOrderNumbers(text: string, rows: readonly LineRow[]): { text: string; changes: NumberChange[] } {
  const bySystem = new Map(rows.map(row => [row.systemName.toLowerCase(), row]));
  const changes: NumberChange[] = [];
  const lines = text.split('\n').map(line => {
    const match = /^(.*?\*\*)([^*]+)(\*\*\s*\()([^)]*)(\))(\s*)(⬆️|⬇️|↔️)?/u.exec(line);
    if (!match || SKIP_REFRESH.some(mark => line.includes(mark))) {
      return line;
    }
    const [whole, head, name, open, inside, close, space, trend] = match;
    const row = bySystem.get(name.trim().toLowerCase());
    if (!row) {
      return line;
    }
    const percent = /^(\d+(?:[.,]\d+)?)\s*%$/.exec(inside.trim());
    let next = inside;
    let nextTrend = trend;
    if (percent && row.factionInfluence !== null) {
      next = `${row.factionInfluence.toFixed(1)}%`;
      if (trend) {
        nextTrend = trendFor(Number(percent[1].replace(',', '.')), row.factionInfluence);
      }
    } else if (/\d+\s*-\s*\d+/.test(inside)) {
      const kind = ICON_KIND.find(([icon]) => head.includes(icon))?.[1];
      const entry = scoredEntry(row, kind);
      if (entry?.score) {
        next = conflictScoreText(entry.score);
      }
    }
    if (next === inside && nextTrend === trend) {
      return line;
    }
    changes.push({ system: name.trim(), before: inside, after: next });
    return `${head}${name}${open}${next}${close}${space}${nextTrend ?? ''}${line.slice(whole.length)}`;
  });
  return { text: lines.join('\n'), changes };
}

/**
 * Where the operations end: the first heading after them (Cantieri, Note, Operazioni concluse)
 * or the closing "NOTA", whichever comes first.
 */
const AFTER_OPERATIONS = /\n(?=(?:👴|:older_man:) \*\*__CANTIERI|\*\*__NOTE|- \*\*__OPERAZIONI CONCLUSE|NOTA\n)/u;

/**
 * Puts a block (a system's lines) at the end of the operations, closed by "------" like the
 * other groups; at the end of the text when there are no sections. Used by the table's
 * "Aggiungi agli ordini".
 */
export function insertAfterOperations(text: string, block: string): string {
  const at = AFTER_OPERATIONS.exec(text);
  if (!at) {
    return text.trimEnd() ? `${text.trimEnd()}\n\n${block}\n` : `${block}\n`;
  }
  const before = text.slice(0, at.index).trimEnd();
  return `${before}\n\n${block}\n------\n\n${text.slice(at.index + 1)}`;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Bold, underline, italic and server emoji inside one line, after escaping. */
function renderInline(line: string): string {
  return escapeHtml(line)
    .replace(/:([A-Za-z0-9_]+):/g, (match, name: string) =>
      SERVER_EMOJI_PREVIEW[name] ? `<span class="dc-emoji" title=":${name}:">${SERVER_EMOJI_PREVIEW[name]}</span>` : match,
    )
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<u>$1</u>')
    .replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/(^|[^_\w])_([^_\s][^_]*?)_(?!_)/g, '$1<em>$2</em>');
}

/**
 * The text as Discord would show it, as HTML for the preview: headings (`#`, `##`, `###`),
 * bullet lines (`- `), bold, underline, italic, a line starting with a mention highlighted and server emoji as
 * their lookalike. Not a full Markdown parser: only what the Ordini use. Everything is escaped
 * first, so the text can't inject markup.
 */
export function renderDiscordPreview(text: string): string {
  return text
    .split('\n')
    .map(line => {
      const heading = /^(#{1,3}) (.*)$/.exec(line);
      if (heading) {
        const level = heading[1].length;
        return `<div class="dc-h${level}">${renderInline(heading[2])}</div>`;
      }
      const bullet = /^- (.*)$/.exec(line);
      if (bullet) {
        return `<div class="dc-li">${renderInline(bullet[1])}</div>`;
      }
      if (line.startsWith('@')) {
        return `<div><span class="dc-mention">${renderInline(line)}</span></div>`;
      }
      return line.trim() === '' ? '<div class="dc-blank"></div>' : `<div>${renderInline(line)}</div>`;
    })
    .join('');
}
