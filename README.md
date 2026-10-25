# ACFS BGS Tool

Tool BGS (Background Simulation di Elite Dangerous) dello Squadrone **Alto Comando Flotta Stellare** (ACFS), per la PMF **Flotta Stellare**.

Risponde a una domanda: **dove dobbiamo lavorare oggi?** Mostra in una tabella tutti i sistemi in cui Flotta Stellare è presente, con questi dati:

- fazione che controlla il sistema e grafico dell'influenza di tutte le fazioni presenti;
- influenza di Flotta Stellare e **margine**: vantaggio sulla seconda fazione dove controlliamo, distacco da chi controlla altrove;
- **ACFS Colony Plotter** (dalla 1.7.0, per i membri dello Squadrone): i sistemi colonizzabili entro 15 ly dalle stazioni di Flotta Stellare, con le ragioni di interesse corpo per corpo (biologia compresa), i filtri per tipo di corpo, biologia e scopo, e i link a Inara, Raven Colonial, Spansh e Canonn Signals. Li calcola il server con il motore del repo [`acfs-colony-plotter`](https://github.com/ed-acfs/acfs-colony-plotter);
- **storico dell'influenza** (dalla 1.6.0): sotto l'influenza di Flotta Stellare un mini-grafico degli ultimi 30 giorni e la variazione in punti nell'ultima settimana, ordinabile; un clic apre il grafico di tutte le fazioni del sistema, con guerre ed elezioni come bande colorate e lo zoom trascinando. Lo storico è quello del server dello Squadrone e parte dal 18 ottobre 2026;
- stati in corso o in arrivo: guerra, elezione, ritirata; cliccando l'icona si vedono le fazioni coinvolte e la loro influenza. Un preavviso segnala un Retreat probabile al prossimo tick (influenza al 2,5% o meno);
- forbice di influenza: un ⚠️ quando un'altra fazione è a 5 punti o meno dalla nostra, con chi controlla o con le fazioni vicine in classifica, ma non mentre siamo già in guerra o elezione nel sistema (la nostra influenza è bloccata); lo stesso ⚠️ compare nei dettagli del sistema accanto alle fazioni interessate, compresa la nostra;
- nei dettagli del sistema, una "N" accanto alle fazioni native (ricavate dal nome: Spansh non lo dice) e un ⚠️ sulle fazioni non native in Retreat o al 2,5% o meno;
- età del dato, cioè quanto tempo fa il sistema è stato aggiornato;
- priorità di intervento, da P1 (massima) a P5; nei sistemi che controlliamo tiene conto anche dei semafori di influenza e margine;
- architetto e fazione preferita dei sistemi colonizzati, registrabili dagli ufficiali dal pulsante "Assegna" (accesso con Discord; il server dello Squadrone scrive nel foglio con lo script, la password la conosce solo lui);
- distanza da un sistema a scelta: di default Wong Sher, la capitale;
- all'apertura i sistemi sono ordinati per **priorità**, dalla P1; i sistemi della **Watchlist** stanno sempre in cima, con qualunque ordinamento;
- stazioni con **Material Trader** o **Technology Broker**, con il loro tipo, e un filtro per trovarle;
- stazioni con **Interstellar Factors**, fra i servizi del filtro "Servizi": i sistemi compaiono dal più vicino a quello del box "Distanza da", con un link alla stessa ricerca su Inara per tutta la galassia.

Il tool è pubblicato su **https://flottastellare.it/acfs-bgs-tool/** e controlla i dati ogni 30 minuti.

È anche una **PWA**: si può installare come app (dal menu del browser, "Installa" o "Aggiungi a schermata Home") e si apre anche senza connessione, con gli ultimi dati scaricati e la loro età in vista. Vedi [App installabile e offline](#app-installabile-e-offline).

La parte di consultazione (tabella, filtri, Legenda, Guida, dettagli dei sistemi) è in **italiano, tedesco e inglese**: alla prima visita segue la lingua del browser (inglese se non è nessuna delle tre), poi vale la bandierina scelta in alto, salvata nel browser. Gli Ordini Ufficiali e il modulo "Assegna" sono strumenti interni dello Squadrone e restano in italiano.

Il progetto è in sviluppo. Le fasi, le decisioni prese e le domande aperte sono in [ROADMAP.md](ROADMAP.md). Le modifiche fatte finora sono in [CHANGELOG.md](CHANGELOG.md).

## Accedi con Discord

Il tool si consulta senza accesso. Il pulsante **Accedi con Discord** (nella riga con le bandiere delle lingue) serve ad abilitare gli strumenti riservati: il server dello Squadrone ([`acfs-server`](https://github.com/ed-acfs/acfs-server), servizio `auth`) legge i ruoli nel server Discord ACFS e tiene la sessione in un suo cookie. Livelli: **collegato** (chiunque sia nel server Discord), **membro** (Membro Flotta, Cadetto), **ufficiale** (Ammiraglio, Vice Ammiraglio, Contrammiraglio). Nel menu dell'account, solo in italiano, i membri trovano Attività, gli ufficiali anche l'editor degli Ordini (la pagina degli Ordini per i membri è sospesa dalla 1.5.6-beta). Chiunque sia collegato trova nel menu anche **Chiave BGS-Tally** (`src/app/tally-key-dialog/`): si genera, rigenera, rinomina o revoca la chiave per il plugin BGS-Tally (`/auth/tally-key` del server, che ne salva solo l'impronta); il nome della chiave, ricavato dal nome Discord, ne è anche l'inizio. La finestra avverte che serve BGS-Tally 5.6.1 o successiva (con la 5.6 la connessione non si completa) e invita ad attivare in EDMC l'invio a EDDN, che fa arrivare i salti al server anche senza BGS-Tally. Gli ufficiali hanno anche **Chiavi dei piloti** (`src/app/pilot-keys-dialog/`, solo in italiano), con l'elenco di tutte le chiavi e la revoca (`/auth/tally-keys`). Il servizio che chiede chi è collegato è `src/app/auth.service.ts`; il pulsante e il menu sono `src/app/account/`.

## Attività dello Squadrone (beta)

La pagina `/activity` (nel menu dell'account per membri e ufficiali e dal pulsante **Attività (beta)** negli Ordini, solo in italiano) mostra il lavoro BGS per Flotta Stellare che i piloti mandano con BGS-Tally al server dello Squadrone, per tick, sistema e pilota. È riservata ai membri dello Squadrone (dal 20 ottobre 2026; prima solo agli ufficiali): si entra con Discord (ruolo da membro o da ufficiale) e il controllo lo fa il server (`/v1/work` di [`acfs-server`](https://github.com/ed-acfs/acfs-server)).

**Ordini Ufficiali** (`/ordini`, solo in italiano, per gli ufficiali secondo il ruolo Discord): dalla 1.5.6-beta un **editor di testo** (`src/app/orders/orders-text-editor.component.ts`, logica in `src/core/orders-text.ts`), con l'anteprima come su Discord, le emoji vere al posto dei codici (le emoji del server, come `:acfs:`, restano col nome), una barra delle emoji e la ricerca di un sistema che ne scrive il nome. Il testo è libero: nulla viene preso dai dati della tabella. La bozza è condivisa sul server (`/auth/orders/draft`, `src/app/orders/orders.store.ts`): si salva da sola ed è la stessa per tutti gli ufficiali e su ogni computer; se un altro ufficiale l'ha cambiata nel frattempo, la pagina chiede quale versione tenere. Il vecchio editor a moduli resta su `/ordini/moduli`. La pagina di lettura per i membri (`/ordini/pubblicati`, `src/app/orders-reader/`) è **sospesa** mentre si prova il nuovo editor.

## Dati

I dati vengono da [Spansh](https://spansh.co.uk). Spansh non accetta chiamate dirette dal browser, quindi lo script `scripts/fetch-bgs.mjs` scarica tutti i sistemi con Flotta Stellare presente e li salva in `public/data/bgs.json`. L'app legge quel file. Il file non è versionato.

Spansh non riporta il punteggio dei conflitti (giorni vinti). Dalla 1.4.0 lo dà il **server dello Squadrone** ([`ed-acfs/acfs-server`](https://github.com/ed-acfs/acfs-server), privato), che ascolta in tempo reale il flusso [EDDN](https://github.com/EDCD/EDDN) e pubblica un'API su `https://api.flottastellare.it` (indirizzo in `serverApiUrl` di `src/core/config.json`). L'app legge `/v1/systems` all'apertura e, sistema per sistema, usa il dato più recente: fazioni, influenze, stati e fazione di controllo dal server quando l'ha visto dopo Spansh (stazioni, popolazione e servizi restano di Spansh), e il punteggio più recente fra quello del server e quello che lo script chiede a [EliteBGS](https://elitebgs.app) per i sistemi in guerra o in elezione. Un conflitto nostro che il server vede appena concluso compare con una bandierina 🏁 e il punteggio finale. Se il server non risponde entro qualche secondo la tabella si apre lo stesso, con i soli dati del file; se nessuna fonte ha il punteggio, il riquadro dello stato rimanda a Inara. Dalla 1.6.0 l'app legge anche `/v1/history` (l'influenza di Flotta Stellare nel tempo in tutti i sistemi, per i mini-grafici) e, quando si apre il grafico di un sistema, `/v1/systems/<id64>` con lo storico di tutte le fazioni e dei conflitti; se il server non risponde la tabella resta senza storico. Con `serverApiUrl` a `null` l'app torna a non usare il server.

Il tipo di Material Trader (Raw, Manufactured, Encoded) e di Technology Broker (Human, Guardian) non c'è nella ricerca per sistemi: lo script lo chiede alla ricerca per stazioni di Spansh, solo per i sistemi che ne hanno uno, come fa la mappa del sito dello Squadrone. Se Spansh non conosce ancora il tipo, il tool scrive "tipo non noto". Alla stessa ricerca lo script chiede quando Spansh ha aggiornato ogni stazione con un Interstellar Factors, e scarta quelle ferme da più di un anno: confrontato con Inara, Spansh ne aveva in più solo di stazioni non più viste da oltre un anno.

Spansh si aggiorna con i dati che i giocatori inviano mentre volano, quindi è sempre un po' indietro rispetto al gioco. I sistemi visitati di rado possono mostrare dati vecchi di giorni o settimane. La colonna "Aggiornato" indica l'età di ogni dato. Sotto il titolo, un contatore dice quanti sistemi sono stati aggiornati dopo l'ultimo tick, in totale e fra i P1-P2: dopo il tick sale nel giro di ore. L'ora del tick viene dal più recente fra due rilevatori pubblici, EDCD Tick Detector e quello di Infomancer usato da BGS-Tally, perché ognuno dei due può bloccarsi per giorni.

## Uso in locale

Serve Node.js 22 o successivo.

```powershell
npm ci
npm start              # http://localhost:4200
```

Al primo avvio `npm start` scarica i dati da Spansh. Gli avvii successivi riusano il file già scaricato. Per aggiornarlo:

```powershell
npm run fetch-data
```

| Comando | Cosa fa |
|---|---|
| `npm start` | Server di sviluppo su `http://localhost:4200`, si ricarica a ogni modifica |
| `npm run fetch-data` | Scarica di nuovo i dati da Spansh |
| `npm run build` | Build di produzione in `dist/acfs-bgs-tool/browser/` |
| `npm run build:pages` | Lo stesso build, per il sito pubblicato sotto `/acfs-bgs-tool/` |
| `npm test` | Test dell'app ([Vitest](https://vitest.dev/)) |
| `npm run test:scripts` | Test degli script e controllo che `src/core/` non dipenda da Angular (`node --test`) |

## Pubblicazione

Il workflow [.github/workflows/pages.yml](.github/workflows/pages.yml) pubblica il sito su GitHub Pages a ogni push su `main` e a mano dalla scheda **Actions** ("Pubblica su GitHub Pages" → "Run workflow"). Il file dei dati non è nel repo: viene scaricato a ogni pubblicazione.

Ogni 30 minuti (ai minuti 17 e 47) il workflow scarica i dati Spansh e li confronta con quelli del sito (`scripts/data-changed.mjs`): ricompila e pubblica solo se sono cambiati. Per questo l'ora "Dati Spansh aggiornati" sotto il titolo è quella dell'ultimo cambiamento, non dell'ultimo controllo. GitHub può far partire i cron con qualche minuto di ritardo, o saltarne uno nei momenti di carico: il successivo recupera.

GitHub sospende i workflow programmati di un repo pubblico dopo 60 giorni senza commit. Se i dati smettono di aggiornarsi, va riattivato dalla scheda Actions.

## Configurazione

Fazione, capitale e indirizzi di dati, Sheet e Form sono in [src/core/config.json](src/core/config.json). Lo leggono sia l'app sia lo script dei dati.

| Chiave | Significato |
|---|---|
| `faction`, `squadron`, `homeSystem` | Fazione (PMF), Squadrone, capitale |
| `conflictMarginPoints` | Sotto questo vantaggio (in punti) un sistema controllato è a rischio di conflitto: la colonna Margine diventa rossa |
| `unregisteredScope` | Come la priorità tratta i sistemi non registrati: `"in-scope"` (nostri: difesa e conquista) oppure `"assumed"` (solo difesa, come i Canonn) |
| `compareFaction` | Seconda fazione da confrontare, per una versione futura (`null`) |
| `architectsSheetUrl`, `watchlistSheetUrl`, `architectFormAction` | Google Sheet e Form dello Squadrone (`null` finché non esistono) |

## App installabile e offline

Il tool usa il service worker di Angular (`@angular/service-worker`), configurato in [ngsw-config.json](ngsw-config.json); il manifest è [public/manifest.webmanifest](public/manifest.webmanifest), con le icone "Vanguards" del sito dello Squadrone in `public/icons/app/`.

- **Codice e icone** stanno nella cache del browser: l'app si apre anche offline, comprese le pagine come `/ordini`.
- **Dati Spansh** (`data/bgs.json`) e **fogli Google** (Registro Architetti e Watchlist): sempre presi dalla rete; la copia in cache si usa solo se la rete manca o non risponde entro qualche secondo. Offline la tabella mostra quindi l'ultimo dato scaricato, con l'ora "Dati Spansh aggiornati" sotto il titolo.
- La ricerca della distanza (Spansh, via Canonn) e "Assegna" funzionano solo online.
- **Aggiornamenti**: una versione nuova del codice si scarica in background e si vede dal caricamento successivo della pagina. I dati invece sono sempre i più recenti, perché vengono dalla rete.
- Il service worker è attivo solo nel build di produzione: `npm start` non lo usa, così in sviluppo non c'è cache di mezzo. Per provarlo in locale serve servire `dist/acfs-bgs-tool/browser/` sotto `/acfs-bgs-tool/` dopo `npm run build:pages`.
- Il sito dello Squadrone (flottastellare.it) ha un suo service worker con ambito `/`; quello del tool ha ambito `/acfs-bgs-tool/`, più specifico, quindi per le pagine del tool vale il suo e i due non si pestano i piedi. Il tool si installa come app separata ("ACFS BGS Tool"), distinta da quella del sito.

## Struttura

| Cartella | Contenuto |
|---|---|
| `src/core/` | Logica pura: tipi dei dati, priorità, freschezza, stati BGS, registro architetti, export. Niente Angular né API del browser, così la stessa logica può girare anche in Node |
| `src/core/i18n/` | I testi della parte di consultazione in italiano (`it.ts`, il riferimento), tedesco e inglese. Una chiave mancante in una lingua blocca la compilazione |
| `src/app/` | L'app Angular: tabella, dialog, caricamento e cache dei dati |
| `scripts/` | Script Node: scaricamento dei dati da Spansh e informazioni di build |
| `apps-script/` | Script Google collegato al foglio, con cui "Assegna" scrive nel Registro Architetti dietro una password che conosce solo il server dello Squadrone (`ASSIGN_PASSWORD` nel suo `.env`). Si installa a mano nel foglio: istruzioni in `apps-script/README.md` |

## Crediti e licenza

Il codice deriva da [canonn-colony-operations](https://github.com/canonn-science/canonn-colony-operations) del Canonn Research Group, distribuito con licenza MIT. Il procedimento per scaricare i dati da Spansh segue la loro Cloud Function `canonnbgs` ([Canonn-GCloud](https://github.com/canonn-science/Canonn-GCloud)). Il mini-grafico e il grafico dello storico dell'influenza (1.6.0) riprendono idea, disegno e parte del codice dal loro tool (stessa licenza MIT).

Le icone degli stati delle fazioni (Boom, Bust, Expansion, Lockdown, Retreat) in `public/icons/states/` sono quelle del gioco, di proprietà di Frontier Developments, usate come contenuto di fan. Elite Dangerous è un marchio di Frontier Developments plc.

Questo progetto è distribuito con la stessa [licenza MIT](LICENSE), che conserva la nota di copyright originale. La licenza riguarda il codice, non le icone del gioco.
