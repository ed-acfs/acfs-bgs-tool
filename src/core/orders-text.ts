/**
 * The Ordini as one text, written like the squadron writes them by hand (in VS Code, until
 * October 2026), with the tool helping where a plain editor can't: real emoji instead of
 * Discord shortcodes, system names spelt right, a preview that looks like Discord. The text is
 * free: nothing in it is taken from or tied to the table's data (the user's choice of 22 October
 * 2026). Pure, so it's tested without a browser; the page is `app/orders/orders-text-editor.component.ts`.
 */
import { ORDER_STATUSES, ORDER_TRENDS, ORDER_TYPES } from './order-types';
import { formatOrdersDate } from './orders';

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

/**
 * A system for the text: its name in bold, spelt as the galaxy search spells it. Nothing else
 * comes from the data — icon, numbers and outcome are written by hand, because the data can be
 * days behind the game (Crowfor, 22 October 2026: an election underway, the data two days old).
 */
export function orderLineForName(name: string): string {
  return `**${name}** `;
}

/**
 * Where the operations end: the first heading after them (Cantieri, Note, Operazioni concluse)
 * or the closing "NOTA", whichever comes first.
 */
const AFTER_OPERATIONS = /\n(?=(?:👴|:older_man:) \*\*__CANTIERI|\*\*__NOTE|- \*\*__OPERAZIONI CONCLUSE|NOTA\n)/u;

/**
 * Puts a block (a system's name) at the end of the operations, closed by "------" like the
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

/** Bold, underline and italic inside one line, after escaping. */
function renderInline(line: string): string {
  return escapeHtml(line)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<u>$1</u>')
    .replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/(^|[^_\w])_([^_\s][^_]*?)_(?!_)/g, '$1<em>$2</em>');
}

/**
 * The text as Discord would show it, as HTML for the preview: headings (`#`, `##`, `###`),
 * bullet lines (`- `), bold, underline, italic, a line starting with a mention highlighted. Server
 * emoji stay as their shortcode (`:acfs:` is the squadron's logo: no stand-in, Discord renders it).
 * Not a full Markdown parser: only what the Ordini use. Everything is escaped first, so the text
 * can't inject markup.
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
