/**
 * The published Ordini as the members read them in the tool: the same content as the Discord
 * report (`renderOrdersMarkdown`), laid out as sections and cards instead of Discord Markdown,
 * with real emoji instead of Discord shortcodes. Pure, so it's tested without a browser.
 */
import { ORDER_STATUSES, ORDER_TRENDS, findOrderType } from './order-types';
import { OrderItem, OrderSection, formatOrdersDate, parseIsoDay } from './orders';
import { SQUADRON_TAG } from './config';

export interface OrdersViewItem {
  id: string;
  /** The type's emoji (🗳️, ⚔️, 🏗️…), empty for a free note. */
  icon: string;
  /** Bold system name; empty for notes. */
  system: string;
  score: string;
  trend: string;
  /** Status emoji (🆕, 🟢, ✅…) with their meaning, for the hover text. */
  statuses: { emoji: string; label: string }[];
  /** "Election per ACFS", "Pending War per ACFS": what's asked; null for constructions and notes. */
  action: string | null;
  /** Set when the work is for another faction (rare): shown highlighted, "Inf per 👉 X 👈". */
  beneficiary: string | null;
  detail: string;
}

export interface OrdersViewGroup {
  /** "Priorità 1" within Operazioni; null elsewhere. */
  title: string | null;
  /** The priority number within Operazioni (1 = highest), for the P1…P5 pill; null elsewhere. */
  priority: number | null;
  items: OrdersViewItem[];
}

export interface OrdersViewSection {
  key: OrderSection;
  title: string;
  groups: OrdersViewGroup[];
}

export interface OrdersView {
  /** In-game date, "19/10/3312". */
  date: string;
  sections: OrdersViewSection[];
  footerNote: string;
}

const SECTION_TITLES: Record<OrderSection, string> = {
  operazioni: '🎯 Operazioni',
  cantieri: '🏗️ Cantieri aperti',
  note: '📌 Note & informazioni',
  concluse: '🏁 Operazioni concluse',
};

function viewItem(item: OrderItem): OrdersViewItem {
  const type = findOrderType(item.typeKey);
  const style = type?.style ?? 'note';
  return {
    id: item.id,
    icon: type?.display ?? '',
    system: style === 'note' ? '' : item.system,
    score: style === 'note' ? '' : item.score,
    trend: (item.trend && ORDER_TRENDS.find(t => t.key === item.trend)?.display) || '',
    statuses: item.statusKeys
      .map(key => ORDER_STATUSES.find(s => s.key === key))
      .filter(s => s !== undefined)
      .map(s => ({ emoji: s.display, label: s.label })),
    action: style === 'operation' && type?.verb ? `${item.pending ? 'Pending ' : ''}${type.verb} per${item.beneficiary?.trim() ? '' : ` ${SQUADRON_TAG}`}` : null,
    beneficiary: style === 'operation' && item.beneficiary?.trim() ? item.beneficiary.trim() : null,
    detail: item.detail,
  };
}

export function ordersView(data: { items: readonly OrderItem[]; meta?: { footerNote?: string }; day?: string }): OrdersView {
  const date = parseIsoDay(data.day ?? '');
  const sections: OrdersViewSection[] = [];
  for (const key of ['operazioni', 'cantieri', 'note', 'concluse'] as const) {
    const items = data.items.filter(item => item.section === key);
    if (items.length === 0) {
      continue;
    }
    if (key === 'operazioni') {
      const priorities = [...new Set(items.map(item => item.priority ?? 0))].sort((a, b) => a - b);
      sections.push({
        key,
        title: SECTION_TITLES[key],
        groups: priorities.map(p => ({
          title: `Priorità ${p}`,
          priority: p,
          items: items.filter(item => (item.priority ?? 0) === p).map(viewItem),
        })),
      });
    } else {
      sections.push({ key, title: SECTION_TITLES[key], groups: [{ title: null, priority: null, items: items.map(viewItem) }] });
    }
  }
  return { date: date ? formatOrdersDate(date) : '', sections, footerNote: data.meta?.footerNote ?? '' };
}

/**
 * The little Discord Markdown the officers write in a detail line, as HTML: bold, underline,
 * italic, strike-through and line breaks. Everything else is escaped first, so the text can't
 * inject markup (Angular sanitises `[innerHTML]` too).
 */
export function discordInlineToHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<u>$1</u>')
    .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, '$1<em>$2</em>')
    .replace(/(^|\W)_(?!\s)(.+?)_(?=\W|$)/g, '$1<em>$2</em>')
    .replace(/~~(.+?)~~/g, '<s>$1</s>')
    .replace(/\n/g, '<br />');
}
