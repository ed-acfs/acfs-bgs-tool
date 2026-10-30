// Testi del canale #strumenti (italiano). Un elemento = un messaggio con un embed.
// {ufficiale} diventa la menzione del ruolo (ID in .env.local, vedi lo script); senza ID resta @Ufficiale in chiaro.
// Pubblicazione: node scripts/publish-strumenti.mjs (vedi lo script per le opzioni).

const TOOL_URL = 'https://flottastellare.it/acfs-bgs-tool/';
const EDMC_URL = 'https://github.com/EDCD/EDMarketConnector';
const VIDEO_URL = 'https://flottastellare.it/video/guide-e-tutorial/';
const TALLY_URL = 'https://github.com/aussig/BGS-Tally';

const LOGO_URL = 'https://flottastellare.it/acfs-bgs-tool/apple-touch-icon.png';
const AUTORE = { name: 'ACFS · Strumenti', icon_url: LOGO_URL };
const PIEDE = { text: 'ACFS BGS Tool · flottastellare.it/acfs-bgs-tool', icon_url: LOGO_URL };

// Striscia verticale dell'embed: arancione di Elite per presentazione e passi, grigio-azzurro per le note.
const ARANCIONE = 0xff7100;
const GRIGIO = 0x6b7a90;

export const messaggi = [
  {
    color: ARANCIONE,
    author: AUTORE,
    footer: PIEDE,
    title: 'Gli strumenti dello Squadrone',
    thumbnail: { url: LOGO_URL },
    immagine: 'tabella.png',
    description: [
      `**ACFS BGS Tool** mostra in una tabella tutti i sistemi in cui la Flotta è presente.`,
      '',
      `👉 **${TOOL_URL}**`,
      '',
      '### Accesso libero',
      'L’accesso è libero e a disposizione di tutti: anche se siete solo di passaggio, amici o (speriamo di no) nemici, sentitevi liberi di usarlo a vostro piacimento.',
      '',
      'Se invece volete dare una mano allo Squadrone, qui sotto trovate i tre passi per collegare BGS-Tally.',
    ].join('\n'),
  },
  {
    color: ARANCIONE,
    author: AUTORE,
    footer: PIEDE,
    title: '1️⃣ Installa EDMC e BGS-Tally',
    description: [
      '### EDMC',
      `Se non lo usi ancora, installa [EDMC](${EDMC_URL}) (Elite Dangerous Market Connector): è il programma che legge il diario di gioco e ospita i plugin.`,
      '',
      '### BGS-Tally',
      `[BGS-Tally](${TALLY_URL}) è il plugin di EDMC che tiene il conto del tuo lavoro per il BGS: combattimenti, missioni, taglie, commercio.`,
      '',
      '• Serve la versione **5.6.1 o successiva**: con la 5.6 un difetto dell’interfaccia impedisce di completare la connessione al server.',
      '• Controlla la versione in EDMC → File → Impostazioni → BGS-Tally.',
      '',
      '### Preferisci i video?',
      `🎬 Sul nostro sito trovi **Tutorial di installazione EDMC** e **Tutorial di installazione - BGS Tally**: [Guide e Tutorial](${VIDEO_URL}).`,
    ].join('\n'),
  },
  {
    color: ARANCIONE,
    author: AUTORE,
    footer: PIEDE,
    title: '2️⃣ Genera la tua chiave e collegala',
    description: [
      '### Sul sito',
      `1. Apri **${TOOL_URL}** e clicca **Accedi con Discord**. Il tool non vede la tua password: Discord gli dice solo chi sei e quali ruoli hai nel server.`,
      '2. Dal menu con il tuo nome scegli **Chiave BGS-Tally** e clicca **Genera la chiave**. La chiave si vede una volta sola: copiala subito (se la perdi, la rigeneri).',
      '',
      '### In EDMC',
      '3. Apri **BGS-Tally → Impostazioni API**.',
      '4. Incolla **Url Server** e **Chiave API** (li trovi nella finestra del tool), senza spazi prima o dopo.',
      '5. Lascia spuntate **/activities** e **/events**.',
      '6. Clicca **Stabilisci connessione**, poi **Approvo**.',
    ].join('\n'),
  },
  {
    color: ARANCIONE,
    author: AUTORE,
    footer: PIEDE,
    title: '3️⃣ Attiva l’invio a EDDN (vale anche senza BGS-Tally)',
    description: [
      '### Cosa fare',
      'In EDMC → File → Impostazioni → EDDN spunta l’invio dei dati di sistema:',
      '`Send system and scan data to the Elite Dangerous Data Network`',
      '',
      '### Perché',
      'Così ogni tuo salto aggiorna il tool in pochi secondi e arriva anche a Spansh e agli altri strumenti che leggono EDDN. Chi invia i dati solo a Inara li fa vedere a Inara, non a noi.',
    ].join('\n'),
  },
  {
    color: GRIGIO,
    author: AUTORE,
    footer: PIEDE,
    title: 'La tua Privacy',
    description: [
      '### Cosa salviamo',
      'Solo ciò che serve al BGS di **Flotta Stellare**: il tuo lavoro per la Flotta e i dati dei sistemi in cui è presente. Niente altro viene chiesto né conservato. Puoi rigenerare o revocare la chiave quando vuoi, dalla stessa finestra.',
      '',
      '### Cosa ottieni in cambio',
      'Una tabella che riflette dove lavoriamo davvero, e per i membri dello Squadrone la pagina **Attività** con il lavoro per tick, sistema e pilota.',
      '',
      '### Domande o problemi?',
      'Chiedi a un {ufficiale}.',
    ].join('\n'),
  },
];
