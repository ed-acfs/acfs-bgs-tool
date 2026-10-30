// Pubblica (o aggiorna) i messaggi del canale #strumenti tramite webhook.
//   node scripts/publish-strumenti.mjs --dry-run   mostra i testi, non invia nulla
//   node scripts/publish-strumenti.mjs             pubblica; alla seconda volta modifica i messaggi già inviati
//   node scripts/publish-strumenti.mjs --reset     ricomincia (nuovi messaggi, gli ID salvati si perdono)
//   node scripts/publish-strumenti.mjs --prod      usa il webhook di produzione (senza, usa sempre quello di test)
// Gli URL dei webhook stanno in .env.local (STRUMENTI_WEBHOOK_TEST e STRUMENTI_WEBHOOK_PROD), mai nel repo.
// Per la menzione {ufficiale}: UFFICIALE_ROLE_IDS_TEST / UFFICIALE_ROLE_IDS_PROD in .env.local,
//   ID dei ruoli separati da virgola (senza ID resta **@Ufficiale** in chiaro).
//   La menzione di un ruolo dentro un embed non manda notifiche.
// Gli ID dei messaggi inviati stanno in .strumenti-ids.json (ignorato da git), uno per ogni webhook.

import { readFile, writeFile } from 'node:fs/promises';
import { messaggi } from './strumenti-messaggi.mjs';

const IDS_FILE = new URL('../.strumenti-ids.json', import.meta.url);
const args = new Set(process.argv.slice(2));
const prod = args.has('--prod');

async function leggiEnv(nome) {
  const env = await readFile(new URL('../.env.local', import.meta.url), 'utf8');
  const riga = env.split('\n').find((r) => r.startsWith(`${nome}=`));
  return riga?.slice(nome.length + 1).trim();
}

async function leggiWebhook() {
  const nome = prod ? 'STRUMENTI_WEBHOOK_PROD' : 'STRUMENTI_WEBHOOK_TEST';
  const url = await leggiEnv(nome);
  if (!url) throw new Error(`${nome} mancante in .env.local`);
  return url;
}

async function menzioneUfficiale() {
  const valore = await leggiEnv(prod ? 'UFFICIALE_ROLE_IDS_PROD' : 'UFFICIALE_ROLE_IDS_TEST');
  const ids = (valore ?? '').split(',').map((i) => i.trim()).filter(Boolean);
  return ids.length ? ids.map((i) => `<@&${i}>`).join(' o ') : '**@Ufficiale**';
}

async function leggiIds() {
  try {
    return JSON.parse(await readFile(IDS_FILE, 'utf8'));
  } catch {
    return {};
  }
}

// `file` (opzionale): nome di un'immagine in scripts/strumenti-immagini/, allegata al messaggio
// e mostrata nell'embed come immagine grande (attachment://nome).
async function chiama(metodo, url, corpo, file) {
  let init;
  if (file) {
    const form = new FormData();
    corpo.attachments = [{ id: 0, filename: file }];
    form.append('payload_json', JSON.stringify(corpo));
    const bytes = await readFile(new URL(`./strumenti-immagini/${file}`, import.meta.url));
    form.append('files[0]', new Blob([bytes], { type: 'image/png' }), file);
    init = { method: metodo, body: form };
  } else {
    init = {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...corpo, attachments: [] }),
    };
  }
  const r = await fetch(url, init);
  if (!r.ok) throw new Error(`${metodo} ${r.status}: ${await r.text()}`);
  return r.json();
}

if (args.has('--dry-run')) {
  messaggi.forEach((m, i) => console.log(`--- messaggio ${i + 1} ---\n${m.title}\n\n${m.description}\n`));
  process.exit(0);
}

const webhook = await leggiWebhook();
const tutti = await leggiIds();
const ids = args.has('--reset') ? [] : (tutti[webhook] ?? []);
const ufficiale = await menzioneUfficiale();

const nuovi = [];
for (const [i, embed] of messaggi.entries()) {
  const { immagine, ...resto } = embed;
  const description = embed.description.replaceAll('{ufficiale}', ufficiale);
  const dati = { ...resto, description };
  if (immagine) dati.image = { url: `attachment://${immagine}` };
  const corpo = { embeds: [dati], allowed_mentions: { parse: [] } };
  const esistente = ids[i];
  const msg = esistente
    ? await chiama('PATCH', `${webhook}/messages/${esistente}`, corpo, immagine)
    : await chiama('POST', `${webhook}?wait=true`, corpo, immagine);
  nuovi.push(msg.id);
  console.log(`${esistente ? 'modificato' : 'inviato'} ${i + 1}/${messaggi.length}`);
}

tutti[webhook] = nuovi;
await writeFile(IDS_FILE, JSON.stringify(tutti, null, 2) + '\n');
