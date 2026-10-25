# Changelog

Tutte le modifiche rilevanti di questo progetto sono documentate in questo file.

## [1.6.0-beta] - 2026-10-25 — Storico dell'influenza

Versione di prova (`-beta`): l'editor degli Ordini non è ancora definitivo.

### Storico dell'influenza (fase 12 della roadmap)

- **Sotto l'influenza ACFS** di ogni sistema: un mini-grafico arancione degli ultimi 30 giorni e la variazione in punti nell'ultima settimana (▲ verde se guadagniamo, ▼ rosso se perdiamo, ▶ se è ferma), con i giorni su cui è misurata: se lo storico è più corto di una settimana compaiono i giorni reali (es. "4g").
- **Ordinamento per variazione**: il pulsante ▲▼ accanto ad "ACFS" mette prima i sistemi in cui perdiamo di più.
- **Grafico del sistema**, con un clic sul mini-grafico: l'influenza di tutte le fazioni, con Flotta Stellare in arancione e più spessa; guerre ed elezioni come bande colorate; passando il mouse (o con le frecce) le influenze di quel momento e i conflitti in corso con il punteggio dal nostro punto di vista ("Election contro X: Close Victory; 2-1", oppure "vinto, 4-1" a conflitto concluso); trascinando si ingrandisce un periodo; un clic sulle fazioni della legenda ne nasconde o mostra la linea.
- Lo storico viene dal **server dello Squadrone** (nuovo indirizzo `/v1/history`, e lo storico dei conflitti in `/v1/systems/<id64>`) e parte dal 18 ottobre 2026, quando l'ascoltatore EDDN è partito: per ora copre circa una settimana e cresce da solo. Se il server non risponde la tabella si apre lo stesso, senza storico.
- Idea, disegno e parte del codice dal tool dei Canonn (MIT), adattati a una sola fazione e ai dati del nostro server.
- Legenda e Guida spiegano mini-grafico, variazione, ordinamento e grafico, nelle tre lingue.

## [1.5.7-beta] - 2026-10-24 — Scheda del punteggio con i colori di Inara

Versione di prova (`-beta`): l'editor degli Ordini non è ancora definitivo.

- **Scheda del punteggio dei conflitti** (clic sulle icone dello Stato): come in Inara, lo sfondo di ciascun lato segue l'**esito** e non più il lato. Blu tenue per chi è avanti o ha vinto, rosso tenue per chi è indietro o ha perso, grigio tenue in caso di pari. Prima Flotta Stellare era sempre su blu e l'avversario sempre su rosso, anche quando eravamo noi a perdere.
- La scritta della vittoria ("Close Victory", "Vinto"…) prende il **blu di Inara** (`#6dabea`) al posto del verde. Gli sfondi restano i nostri, più tenui di quelli di Inara: scelta dell'utente, per leggibilità.

## [1.5.6-beta] - 2026-10-22 — Ordini: editor a testo in prova; pagina dei membri sospesa

Versione di prova (`-beta`): l'editor degli Ordini non è ancora definitivo.

### Editor degli Ordini a testo

- **`/ordini` diventa un editor di testo**: il report si scrive come in VS Code, con a destra l'anteprima come apparirà su Discord (titoli, grassetto, sottolineato, corsivo, elenchi, menzione). Richiesta dell'utente: l'editor a moduli aveva troppi campi e si scriveva più in fretta a mano.
- **Emoji vere** nel testo al posto dei codici di Discord: un `:green_circle:` scritto a mano diventa 🟢 appena si chiudono i due punti (anche `:arrow_forward:` ▶️, `:x:` ❌, `:older_man:` 👴, i numeri delle priorità). Le emoji del server Discord (`:acfs:`, `:Missions:`, `:RedAlert:`, `:Expansion:`) restano scritte col nome, anche nell'anteprima: `:acfs:` è il logo dello Squadrone e lo disegna Discord.
- **Barra delle emoji**: stato, tendenza, tipo, priorità, ▶️ e 👉👈 (per un'altra fazione, con il cursore già fra gli asterischi del nome), inseriti dove si trova il cursore.
- **Testo libero dai dati della tabella**: nulla viene preso dai dati, che possono essere indietro di giorni rispetto al gioco (Crowfor, fermo dal 19 ottobre mentre si combatteva l'elezione). "Aggiungi un sistema al testo" e il pulsante 📋 della tabella scrivono solo il nome in grassetto, con l'ortografia esatta; il pulsante lo mette in fondo alle Operazioni, prima dei Cantieri.
- **Data**: scegliendo il giorno cambia anche la riga "AGGIORNAMENTO ORDINI DEL …" nel testo, in data di gioco. **Copia per Discord** copia il testo così com'è. "Riparti da un report vuoto" scrive lo scheletro con tutte le sezioni.
- La bozza resta **condivisa sul server** fra gli ufficiali (il testo si aggiunge a quanto già salvato, senza cambiare il server); la prima volta il testo parte dagli Ordini composti con l'editor a moduli.
- Il **vecchio editor a moduli** resta su `/ordini/moduli` ("Vecchio editor"), per confronto.

### Pagina degli Ordini per i membri sospesa

- `/ordini/pubblicati` mostra un avviso invece degli Ordini, la voce "Ordini" sparisce dal menu dei membri e "Pubblica per i membri" non c'è più: l'impaginazione della pagina si basava sui campi dell'editor a moduli. Scelta dell'utente, per provare il nuovo editor senza dover rifare subito anche quella pagina. Il server non cambia.
- Guida (sezione Ordini, solo in italiano come gli Ordini): riscritta per l'editor a testo.

## [1.5.5] - 2026-10-20 — Ora del tick da due rilevatori; Attività per i membri; avvisi per BGS-Tally ed EDDN

### Attività per i membri dello Squadrone

- **Attività (beta)** non è più solo per gli ufficiali: la vedono anche i membri dello Squadrone (Membro Flotta, Cadetto), nel menu con il nome, sempre solo in italiano. Chi è collegato senza un ruolo dello Squadrone legge che la pagina è riservata ai membri. Il controllo resta sul server (`/v1/work` di `acfs-server`). Editor degli Ordini, "Assegna" e Chiavi dei piloti restano agli ufficiali. Decisione dell'utente; per scelta sua la versione non cambia.
- Guida: nuova scheda "Attività (beta)" (solo in italiano, come la pagina).

### Chiave BGS-Tally e invio a EDDN

- Nella finestra **Chiave BGS-Tally**, in evidenza: serve **BGS-Tally 5.6.1 o successiva**, perché con la 5.6 un difetto dell'interfaccia impedisce di completare la connessione al server (era il motivo per cui la chiave di un pilota risultava "mai" usata). In fondo alla finestra, l'invito a spuntare in EDMC l'invio dei dati di sistema a **EDDN**: ogni salto in un nostro sistema aggiorna il tool in pochi secondi, anche senza BGS-Tally. Il 20 ottobre Inara mostrava una pending election a Crowfor che né Spansh né il server conoscevano: chi era passato inviava i dati solo a Inara.
- Guida, nelle tre lingue: lo stesso invito a EDDN in "In alto", dove si spiega il ritardo di Spansh, e la versione minima di BGS-Tally in "Accesso con Discord". Richiesta dell'utente.

### Correzioni

- **L'ultimo tick sotto il titolo era fermo al 17 ottobre**, anche se i tick del 18 e del 19 c'erano stati: EDCD Tick Detector, l'unica fonte del tool, si era bloccato. Ora il tool legge anche il rilevatore di Infomancer (lo stesso di BGS-Tally) e tiene il tick più recente fra i due e quello dei dati già pubblicati, scartando ore nel futuro. Con il tick giusto torna giusto anche il contatore dei sistemi aggiornati dopo il tick. Segnalato dall'utente.

## [1.5.4] - 2026-10-18 — Punteggio, stati e influenze dal server dello Squadrone; lavoro dello Squadrone; accesso con Discord e chiavi BGS-Tally

Pubblicata in più passi nella stessa giornata: la 1.4.0 (punteggio dei conflitti), la 1.4.1 (difesa nei sistemi con architetto senza fazione preferita, favicon), la 1.5.0 (stati e influenze dal server, conflitti appena conclusi) la 1.5.1 (pagina del lavoro dello Squadrone, in beta), la 1.5.2 (accesso con Discord), la 1.5.3 (chiave BGS-Tally per ogni pilota) e la 1.5.4 (nome Discord nelle Chiavi dei piloti). La pagina è una funzione nuova, ma per scelta dell'utente la versione resta bassa.

### Ordini e "Assegna" secondo il ruolo Discord

- **Ordini Ufficiali senza passphrase**: li scrivono gli ufficiali (ruolo Discord) e li leggono i membri dello Squadrone (Membro Flotta, Cadetto). Il controllo lo fa il server dello Squadrone, non più il browser con un'impronta pubblicata nel repo.
- **Bozza condivisa**: la bozza degli Ordini sta sul server, si salva da sola mentre si scrive ed è la stessa per tutti gli ufficiali e su ogni computer (prima viveva nel browser di chi la scriveva). Se un altro ufficiale la cambia nel frattempo, la pagina lo dice e si sceglie quale versione tenere, invece di sovrascriversi a vicenda. La prima volta, una bozza rimasta nel browser diventa quella condivisa.
- **Pubblica per i membri**: accanto a "Copia", rende la bozza visibile ai membri in una pagina nuova, **Ordini** (`/ordini/pubblicati`, dal menu con il nome): sezioni, priorità e schede con icone vere invece del Markdown di Discord, leggibile anche da telefono, con data in gioco e chi li ha pubblicati. "Vista dei membri" la mostra agli ufficiali.
- **"Assegna" solo per gli ufficiali, senza password**: il pulsante (e la matita, e 📋 "aggiungi agli Ordini") compare solo a chi ha il ruolo da ufficiale; l'assegnazione passa dal server, che la manda al foglio con la password dello script, che ora conosce solo lui. Il nome registrato è quello Discord, non va più scritto a mano.
- **Attività** (lavoro dello Squadrone) senza la password di riserva: si entra solo con il ruolo da ufficiale. La password ricordata sul dispositivo viene cancellata.
- Ordini, campo **A favore di** nelle righe di operazione: vuoto è "per ACFS" come sempre; per l'eccezione di un lavoro per un'altra fazione (es. una spinta di influenza negativa per riportare Crowfor in conflitto) la riga diventa "Inf per 👉 **LP 254-25 Free** 👈 > …", evidenziata anche nella pagina dei membri. Richiesta dell'utente.
- Ordini: la priorità si scrive con le emoji dei numeri ("**Priorità** 1️⃣") invece dei codici di Discord (`:one:`). Richiesta dell'utente.
- Guida aggiornata (Ordini, "Assegnare un architetto").
- La pagina del lavoro si chiama ovunque **Attività** (prima "Lavoro (beta)" nel pulsante degli Ordini e "Lavoro dello Squadrone" nel titolo, "Attività (beta)" nel menu). Segnalato dall'utente.
- **Attività come il riepilogo di BGS-Tally** (indicazione dell'utente, ripreso dal codice del plugin, `formatters/default.py`, e dalla sua traduzione italiana): per sistema e per pilota, nello stesso ordine e con gli stessi colori, valori in verde e numeri abbreviati come nel plugin (13,5M, 850K). **INF**, **INF Elezione** o **INF War** secondo lo stato della fazione, con le missioni per livello (3️⃣ x 1 5️⃣ x 3, ricavate dalle missioni completate, perché il riepilogo del plugin dà solo il totale); BVs, CBs, ComAcq, ComProfit, ComBMProfit, Expl, Exo, Uccisioni, Scenari, Fallite, **CZ Spaziali** e **CZ a terra** per intensità (H x 2), con gli insediamenti delle CZ a terra su righe proprie (⚔️ Gutierrez Engineering Silo x 2) e gli **obiettivi delle CZ spaziali** con le icone del plugin (👑 Cap Ship, 🔠 Spec Ops, 👨‍✈️ Capitano, ✒️ Propagandista: il riepilogo del plugin non li manda, il server li conta dagli eventi sintetici che ora chiede), SAR. Come in Tally, sono verdi solo i numeri. "Nessuna attività registrata al momento" quando non c'è niente.
- Il server dello Squadrone ora riceve davvero il riepilogo del tick di BGS-Tally: il plugin lo manda con PUT e il server accettava solo POST, quindi finora la pagina restava vuota; anche i nomi delle CZ (`czspace`, `czground`) erano sbagliati. Sistemi senza nessun valore diverso da zero non compaiono più.

### Esito dei conflitti conclusi

- Un conflitto **concluso** (finito per la fonte del punteggio, o con 4 giorni vinti da una parte) non mostra più le etichette dello scarto: il tooltip della bandierina 🏁 dice "Conflitto concluso (Election): Vinto, 4-0" (prima "Total Victory 4-0") e la scheda del punteggio "Vinto" / "Perso" / "Pari", in italiano, tedesco e inglese. Le etichette (Draw, Close, Victory/Defeat, Total) descrivono lo scarto a conflitto **in corso** e arrivano a 3 giorni: chi arriva a 4 giorni vinti ha già vinto, quindi un quarto livello non esiste. La regola in `CLAUDE.md` diceva per errore "3 o più".

### Chiave BGS-Tally per ogni pilota

- Nel menu dell'account, per **chiunque sia collegato** con Discord (anche senza ruoli dello Squadrone) e in tutte e tre le lingue, la voce **🔑 Chiave BGS-Tally**: il pilota si genera da solo la chiave con cui il plugin BGS-Tally manda il suo lavoro per Flotta Stellare al server dello Squadrone, senza chiederla a un ufficiale (passo 4 della fase 8b). La finestra mostra **Url Server** e **Chiave API** con il pulsante Copia e i quattro passi da fare in EDMC.
- La chiave si vede **solo appena generata**: il server ne tiene l'impronta, non la chiave. Dopo, la finestra dice quando è stata creata e quando il plugin ha inviato l'ultima volta. **Rigenera** (con conferma: la vecchia smette subito di valere) e **Revoca**.
- Ogni chiave ha un **nome** di lettere minuscole e cifre, ricavato dal nome Discord (es. `wiitifulsky`, con una cifra in fondo se è già preso), che è anche l'**inizio della chiave**: nelle impostazioni di BGS-Tally e nei registri del server si riconosce a chi appartiene. Si cambia con **Rinomina** nella finestra (la chiave prende il nome nuovo alla rigenerazione successiva) ed è il nome del pilota nella pagina del lavoro.
- Una chiave per account Discord. Le chiavi date a mano finora restano valide; quelle di Gabolander e Marziano Inside sono state collegate ai loro account Discord (comando `link` sul server), così le vedono e le gestiscono dal tool.
- **Chiavi dei piloti**, nel menu dell'account solo per gli ufficiali e solo in italiano: l'elenco delle chiavi (nome, nome Discord o "data a mano", creata, ultimo invio, stato) e **Revoca**, con conferma, per chi lascia lo Squadrone. Serve perché il server non sa da solo chi esce dal server Discord. Le chiavi non si vedono, solo il loro nome.
- Chiavi dei piloti: il **nome Discord** ora il server lo salva con la chiave a ogni accesso al tool, invece di cercarlo nelle sessioni, che si cancellano all'uscita e alla scadenza: prima, dopo un logout il pilota compariva come "collegata". Resta "collegata, mai entrato nel tool" solo per una chiave data a mano e collegata a un account Discord che nel tool non è mai entrato (oggi Gabolander). Segnalato dall'utente.
- La **Guida** ha una sezione nuova, "Accesso con Discord", in italiano, tedesco e inglese; la nota sugli Ordini riservati dice che gli ufficiali li trovano nel menu con il loro nome. Ogni sezione della Guida ha ora un'icona davanti al titolo (📊 tabella, 👁️ Watchlist, il logo di Discord per l'accesso, 📜 Ordini…), per trovarla più in fretta. Il pulsante **Accedi con Discord** ha il logo di Discord al posto della freccia.

### Nota in fondo alla pagina

- In fondo a ogni pagina una breve nota, sul modello di Inara: il tool è uno strumento non ufficiale dello Squadrone per Elite Dangerous, non affiliato a Frontier Developments (i due nomi portano ai siti ufficiali), con dati da fonti pubbliche e dai piloti che possono essere in ritardo o non esatti (in italiano, tedesco e inglese); sotto, la nota sui marchi di Frontier, in inglese come testo legale. Nell'app installata (PWA) non compare.

### Accedi con Discord

- Nell'intestazione, nella riga sotto con le bandiere delle lingue, il pulsante **Accedi con Discord**: Discord chiede di autorizzare l'applicazione "ACFS BGS Tool" e il server dello Squadrone legge identità e ruoli nel server Discord ACFS (fase 8b della roadmap). Dopo l'accesso al suo posto c'è l'**avatar con il nome**; il menu dice il livello (Ufficiale, Membro dello Squadrone o Collegato) e ha **Esci**. Al ritorno da Discord un breve messaggio sotto il pulsante ("Accesso eseguito.", "Accesso negato: non risulti nel server Discord ACFS."…), che non sposta l'intestazione.
- Il tool resta **aperto a tutti senza accesso**: il login serve solo ad abilitare gli strumenti riservati. Se il server dello Squadrone non risponde, il pulsante non compare e il resto funziona come sempre.
- **Ordini** esce dalla riga dei pulsanti e va nel **menu dell'account**, insieme ad **Attività (beta)**: solo per chi ha un ruolo da ufficiale (oggi Ammiraglio, Vice Ammiraglio, Contrammiraglio) e solo in italiano. Chi entra senza ruoli dello Squadrone non vede altre sezioni riservate. Finché gli Ordini hanno anche la loro passphrase, `/ordini` resta raggiungibile dall'indirizzo.
- La pagina **Attività** si apre direttamente a un ufficiale collegato, senza password; a chi è collegato senza esserlo dice che è riservata; a chi non è collegato propone "Accedi con Discord" e, finché serve, la password degli ufficiali.
- Testi dell'accesso in italiano, tedesco e inglese.

### Lavoro dello Squadrone (beta, solo ufficiali)

- Nuova pagina **`/activity`**, "Lavoro dello Squadrone", raggiungibile dal pulsante **Lavoro (beta)** nella pagina Ordini: il lavoro BGS per Flotta Stellare che i piloti collegati mandano con **BGS-Tally** al server dello Squadrone, per tick, sistema e pilota, con i totali per sistema nelle sigle del canale ("BVs 8,04 M · CBs 13,08 M · Inf +5 · CZ spaziali M×1 H×3"; omicidi e missioni fallite in fondo, con ⚠️).
- **Riservata agli ufficiali** (decisione dell'utente del 18 ottobre 2026, in beta): la password la controlla il **server** (`/v1/work` di acfs-server), non il browser come per gli Ordini, quindi senza password i dati non arrivano proprio; dopo 10 tentativi sbagliati il server blocca per qualche minuto. Il tool la ricorda sul dispositivo (`acfs-bgs:officers-password`) fino a "Esci".
- Solo in italiano, come gli Ordini. Chi non usa BGS-Tally non compare: i totali non sono il lavoro completo dello Squadrone, e la pagina lo dice.

### Stati e influenze dal server

- Il tool legge dal server dello Squadrone, oltre ai punteggi, **fazioni, influenze, stati e fazione di controllo** (`/v1/systems`, una sola richiesta al posto di `/v1/conflicts`). Per ogni sistema, se il server l'ha visto **dopo** Spansh, valgono i suoi dati; stazioni, popolazione e servizi restano sempre quelli di Spansh. Così la tabella si aggiorna pochi secondi dopo il passaggio di un giocatore con EDMC o EDDiscovery, invece di aspettare Spansh e il ciclo di 30 minuti, e il contatore dei sistemi aggiornati dopo il tick ne tiene conto.
- Nella colonna **Aggiornato** il tooltip dice quando il dato viene dal server ("Dato dal server ACFS (EDDN), più recente di Spansh"); nel riquadro dello stato la riga in fondo diventa "Dato dal server ACFS (EDDN): …".
- **Conflitti appena conclusi**: una guerra o un'elezione di Flotta Stellare che la fonte del punteggio vede già finita, mentre gli stati non ne mostrano più una dello stesso tipo, compare nella colonna Stato con una **bandierina a scacchi 🏁** (tooltip: "Conflitto concluso (Election): Total Victory 4-0"). Il riquadro la segna come "concluso" e mostra la scheda con il punteggio finale. Non conta per la priorità né per l'avviso sulle fazioni vicine, perché il conflitto è finito. Prima un caso come Crowfor (elezione vinta 4-0 il 18 ottobre) spariva dalla colonna appena Spansh smetteva di segnarla.
- La Legenda spiega la bandierina; testi nuovi in italiano, tedesco e inglese.

### Priorità

- Un sistema con **architetto assegnato ma fazione preferita vuota** era escluso del tutto dalla priorità, anche con una guerra, un'elezione o una ritirata che coinvolge Flotta Stellare: finiva in fondo alla lista, sotto i sistemi senza nessun dato nel Registro. Segnalato dall'utente su BD+21 717 (guerra in corso, architetto azghaaar senza preferenza). Ora, su decisione dell'utente, vale **solo la difesa**: un conflitto che ci coinvolge ha la sua priorità come altrove, con la motivazione "Architetto senza fazione preferita: solo difesa nei conflitti"; senza conflitti il sistema resta escluso (niente obiettivi di crescita o di controllo). Una fazione preferita diversa da Flotta Stellare resta invece un accordo da rispettare: nessuna priorità, nemmeno nei conflitti.

### Icone

- Il `favicon.ico` del tool aveva lo sfondo bianco pieno (16×16, nessun pixel trasparente) e si vedeva come un riquadro bianco nei browser che lo usano al posto del PNG. Rigenerato dal logo trasparente, in 16, 32 e 48 px.

### Punteggio dei conflitti

- Il tool legge il **punteggio dei conflitti** (giorni vinti) dal **server dello Squadrone**, `https://api.flottastellare.it`: un server nostro, attivo dal 18 ottobre 2026, che ascolta in tempo reale il flusso EDDN, lo stesso da cui si alimenta Spansh (vedi la fase 10 della roadmap). Il punteggio arriva pochi secondi dopo che un giocatore con EDMC o EDDiscovery passa nel sistema, senza aspettare Spansh né EliteBGS, che da settimane è quasi sempre irraggiungibile.
- Sistema per sistema vale il punteggio **più recente** fra server ed EliteBGS. Se il server non risponde entro 6 secondi, la tabella si apre lo stesso con i dati di sempre.
- Nel riquadro dello stato il punteggio è una **scheda come quella di Inara**: Flotta Stellare a sinistra su fondo blu, l'avversario a destra su fondo rosso, i giorni vinti in grande al centro ("2 vs 0"), sotto ogni fazione la stazione che cede se perde. Sotto il nome di ciascuna fazione, l'esito in corso secondo lo scarto: **Draw** se pari, **Close Victory / Close Defeat** con 1 giorno di scarto, **Victory / Defeat** con 2, **Total Victory / Total Defeat** con 3 o più; in verde chi è avanti, in rosso chi è indietro. Le etichette restano in inglese in tutte le lingue, come gli stati BGS.
- Sotto la scheda si legge da dove viene il punteggio ("dal server ACFS (EDDN)" oppure "EliteBGS") e quanto è vecchio. Se il server vede il conflitto già finito mentre Spansh lo dà ancora in corso, una riga avverte che è il punteggio finale.
- Su desktop il riquadro dello stato è più largo (da 420 a 480 px), così i nomi delle fazioni vanno meno a capo.
- La scheda è un componente a sé (`app-conflict-score-card`), con stili propri: aggiunta agli stili della tabella li avrebbe portati oltre il limite di 16 kB per componente di `angular.json`, rimasto quello originale.
- Testi nuovi in italiano, tedesco e inglese.

### Documentazione

- `CLAUDE.md`: la regola dell'etichetta del punteggio spiegata dall'utente (conta lo scarto; il conflitto si vince a 4 giorni su 7) e corretto l'esempio "Close Defeat; 0-2", che secondo quella regola è "Defeat".
- README: da dove viene il punteggio e come spegnere la lettura dal server (`serverApiUrl` a `null`).

### Test

- Nuovi test per la lettura dal server (più recente fra le due fonti, server che non risponde), per le etichette dell'esito, per la scheda, per la difesa nei sistemi con architetto senza preferenza e per gli stati dal server (dati più recenti di Spansh, conflitto concluso con la bandierina). Passano 279 test dell'app. Verificato con Edge headless sui dati veri: Crowfor mostra la bandierina.

## [1.3.1] - 2026-10-13 — Interstellar Factors

### Tabella

- Il filtro **Servizi**, quando è attivo, apre sotto una riga in cui scegliere i servizi da cercare: **Material Trader, Technology Broker e Interstellar Factors**, ciascuno acceso o spento per conto suo (almeno uno resta acceso). All'inizio sono accesi i primi due, come faceva il filtro finora: l'Interstellar Factors c'è in 312 sistemi su 390 e da solo renderebbe il filtro inutile.
- Con Material Trader acceso, accanto compare la scelta del **tipo di Material Trader** (Raw, Manufactured, Encoded, con le icone della Legenda), con la stessa logica: all'inizio tutti accesi, almeno uno resta. I trader di tipo non noto restano sempre, perché potrebbero essere del tipo cercato.
- Accendendo **Interstellar Factors** la tabella si ordina per distanza dal sistema del box "Distanza da", come la ricerca delle stazioni più vicine su Inara, e la Watchlist non resta in cima, perché conta solo la distanza.
- Accanto al nome del sistema compare l'**icona della bilancia** dove c'è un Interstellar Factors; il tooltip elenca le stazioni, prima quella col pad più grande e poi la più vicina alla stella. Lo stesso ordine vale per Material Trader e Technology Broker, e il tooltip ora dice anche il pad (es. "Shaikh Depot, 5 ls, pad M").
- Il tool conosce solo i sistemi con Flotta Stellare: accanto ai servizi, un link **cerca su Inara** apre la stessa ricerca su tutta la galassia, partendo dal sistema del box.
- Nei dettagli del sistema la colonna Servizi mostra anche Interstellar Factors e il pad più grande della stazione.
- Legenda e Guida spiegano icona e filtro, in italiano, tedesco e inglese.

### Dati

- Lo script segna le stazioni con Interstellar Factors e, per ogni stazione con un servizio, il pad più grande (L, M, S).
- Il dato di Spansh è stato confrontato con Inara il 13 ottobre 2026 (vedi roadmap): coincide, insediamenti compresi, salvo stazioni con dati di oltre un anno fa. Per questo lo script chiede alla ricerca per stazioni di Spansh quando ogni stazione è stata aggiornata e scarta gli Interstellar Factors fermi da più di un anno. Se quella ricerca non risponde, li tiene tutti. Il 13 ottobre restavano 714 stazioni in 292 sistemi, su 1.222 in 312: le scartate sono soprattutto insediamenti, alcuni fermi dal 2021, e cantieri di costruzione. Con sei mesi ne sarebbero rimaste 506 in 239 sistemi, perché negli insediamenti attraccano in pochi e il dato invecchia anche quando è ancora giusto.
- Corretto prima della pubblicazione: la ricerca per stazioni di Spansh scrive i servizi come oggetti (`{ name: … }`) e non come testo, a differenza della ricerca per sistemi.

### Test

- Nuovi test per lo script (pad, Interstellar Factors, scarto dei dati vecchi) e per l'app (ordine delle stazioni, scelta dei servizi e del tipo di Material Trader, ordine per distanza e link a Inara). Passano 267 test dell'app e 22 dello script.

## [1.3.0] - 2026-10-11 — App installabile e consultabile offline

### PWA

- Il tool è una **PWA**: dal browser si può installare come app (su telefono "Aggiungi a schermata Home", su PC l'icona "Installa" nella barra degli indirizzi), con nome "ACFS BGS Tool", icone "Vanguards" del sito dello Squadrone e colori del tool. Si installa come app separata da quella del sito flottastellare.it.
- **Funziona anche offline**: codice, icone e font restano in cache, quindi la pagina si apre senza connessione (anche `/ordini`) e mostra gli ultimi dati Spansh scaricati, con la loro età sotto il titolo come sempre. Anche Registro Architetti e Watchlist restano disponibili: offline la Watchlist resta in cima e gli architetti restano nella tabella.
- Online i dati vengono **sempre dalla rete**: la copia in cache si usa solo se la rete manca o non risponde entro qualche secondo, così il tool non mostra mai dati più vecchi del necessario. Ricerca della distanza e "Assegna" restano solo online.
- Il service worker (`@angular/service-worker`, configurazione in `ngsw-config.json`) ha ambito `/acfs-bgs-tool/`, più specifico di quello del sito (`/`): per le pagine del tool vale il suo. Prima, senza rete, il service worker del sito mostrava al posto del tool la home di flottastellare.it. Attivo solo nel build di produzione, non con `npm start`.
- Una versione nuova del codice si scarica in background e compare dal caricamento successivo della pagina.
- La Guida ha una sezione nuova, **App e offline**: come installare il tool e cosa funziona senza connessione. In italiano, tedesco e inglese.

### Test

- Verificato con Edge headless sul build di produzione: service worker registrato con ambito `/acfs-bgs-tool/`, e a rete staccata la tabella si apre con dati, Watchlist e architetti. Passano 264 test dell'app.

### Repository

- `.gitignore`: escluso `SEO-REPORT.md`, il report locale del SEO Monitor settimanale, rigenerato a ogni run.
- Skill di Claude Code versionate in `.claude/skills/` (installate con `npx autoskills -a claude-code`), così sono disponibili su tutti i PC.

## [1.2.2] - 2026-10-10 — Rifiniture: Guida e Watchlist

### Guida

- Dalla tabella la Guida **non spiega più gli Ordini Ufficiali**: dice solo che la pagina è riservata e di chiedere agli Ufficiali sul Discord dello Squadrone. La spiegazione completa resta nel "Come funziona?" della pagina Ordini, e solo dopo aver inserito la passphrase. Tolto anche il rimando all'icona 📋.
- La Guida copre le novità delle ultime versioni: tutte le colonne (servizi accanto al nome, grafico delle fazioni, Retreat nello Stato, fazione preferita), il filtro Servizi e i filtri per architetto e fazione, il clic sulle icone dello Stato (punteggio e posta in palio) e il tooltip della Priorità.
- La Guida ha una sezione **Watchlist** tutta sua, subito dopo la tabella e con il bordo viola come l'occhio della Watchlist in tabella. Spiega cos'è la Watchlist: una fazione, la posizione minima che deve mantenere nel sistema e il motivo; i sistemi stanno in cima e passano in P1 se la fazione scende sotto quella posizione. Prima la Guida diceva solo che stanno in cima.
- Due sezioni nuove: **In alto** (età dei dati, ultimo tick, quanti sistemi sono aggiornati da allora, titolo che riporta la tabella all'apertura, Esporta, bandierine) e **Dettagli del sistema** (⚠️ di possibile conflitto, icona del Retreat, "N" delle fazioni native, stati in pending in grigio, Expansion letta come stato globale).
- In tedesco la colonna dell'età del dato è chiamata come in tabella ("Stand").

### Tabella e Legenda

- Nei sistemi in **Watchlist** l'icona dei dettagli è un **occhio viola** al posto della ⓘ arancione, che si confondeva con le ⓘ normali (color link, arancio chiaro). Il viola non è usato da nient'altro in tabella (colore scelto dall'utente fra alcune prove). Stessa icona in Legenda, dove la voce ricorda anche che quei sistemi restano sempre in cima alla tabella.

Tutti i testi sono in italiano, tedesco e inglese.

### Test

- Due test nuovi sulla Guida (nota riservata dalla tabella, Ordini completi dalla pagina Ordini). Passano 264 test dell'app.

## [1.2.1] - 2026-10-09 — Tabella per priorità, Watchlist in cima, più dettagli sulle fazioni

Il lavoro di tutta la giornata in una voce sola. In mattinata il sito ha pubblicato due passi intermedi, 1.1.1 (Watchlist in cima) e 1.1.2 (ordine per priorità e titolo cliccabile): il loro contenuto è qui sotto.

### Tabella

- All'apertura la tabella è **ordinata per priorità**, dalla P1 alla P5. Prima l'ordine iniziale era quello di Spansh, dal sistema aggiornato più di recente: con quasi tutti i sistemi aggiornati "oggi" sembrava casuale, e dei P1 come Misir finivano dietro a dei P5. A parità di punteggio vale la regola già usata dall'ordinamento per priorità (prima la popolazione, poi il numero di corpi). L'intestazione Priorità mostra la freccia ▼ fin dall'apertura.
- I sistemi in **Watchlist** restano in cima con **qualunque ordinamento** (colonna o distanza), ordinati fra loro allo stesso modo. Prima ci stavano solo nell'ordine iniziale.
- **Il titolo "ACFS BGS Tool" è cliccabile** ("Torna all'inizio") e riporta la tabella com'è all'apertura: prima pagina, ordinata per priorità, senza filtri, distanze da Wong Sher, Legenda chiusa. Restano il numero di righe e la lingua scelti.

### Dettagli del sistema

- Nella tabella delle fazioni (icona ⓘ) un **⚠️ accanto all'influenza** segna le fazioni con cui è possibile un conflitto: le stesse per cui la tabella mette il ⚠️ sul Margine o sulla colonna ACFS, a 5 punti o meno da Flotta Stellare. Al passaggio del mouse dice di quanto sono sopra o sotto (es. Amait: "4,1 punti sopra Flotta Stellare: possibile conflitto"); accanto a Flotta Stellare dice con chi ("Possibile conflitto con: Earth Defense Fleet"). Niente ⚠️ mentre siamo già in guerra o elezione nel sistema. Tabella e finestra leggono le fazioni dalla stessa regola (`conflictRisks` in `core/close-factions.ts`).
- Una **"N" accanto al nome delle fazioni native** del sistema, come su Inara: non possono andare in Retreat. Spansh non lo dice (né EDSM; EliteBGS lo saprebbe, ma è giù), quindi il tool lo ricava: una fazione NPC è nativa dove il nome del sistema compare nel suo ("Alliance of Lowne 1" in Lowne 1, non in Lowne 10), Flotta Stellare solo a Wong Sher. Una nativa con un nome diverso sfugge, e al massimo riceve un avviso di Retreat in più.
- L'**icona del Retreat** accanto all'influenza delle fazioni non native: piena se sono già in Retreat, tratteggiata se sono al 2,5% o meno (Retreat probabile al prossimo tick). Per le native non compare.
- La colonna "Stati attivi" diventa "Stati" e mostra anche gli **stati in pending**, in grigio con "(in pending)": prima si vedevano solo quelli attivi, e dove Spansh è indietro di qualche giorno (Amait, aggiornato il 7 ottobre) l'Expansion di Flotta Stellare, che è globale, spariva perché per Spansh era ancora in pending. Il 9 ottobre succedeva in 103 dei nostri 390 sistemi.
- L'**Expansion è letta come stato globale**: per ogni fazione vale quella del sistema aggiornato più di recente in cui è presente, in tutti i suoi sistemi, sia in pending, sia attiva, sia finita. Prima ogni sistema mostrava il suo dato, anche vecchio di giorni. Al passaggio del mouse l'Expansion dice da dove viene ("Stato globale della fazione, letto da 14 Geminorum (aggiornato il 9 ott, 18:27 UTC)"), e avvisa se anche quel dato è anteriore all'ultimo tick. Esempio del 9 ottobre: ad Amait, fermo al 7 ottobre, Flotta Stellare passa da "Expansion in pending" ad attiva, e l'Expansion di Earth Defense Fleet, già finita, sparisce. Gli altri stati restano quelli del sistema; l'elenco degli stati globali sta in `core/global-states.ts` (per ora solo Expansion).
- Nella colonna "Stati" l'**icona del gioco** accanto a Boom, Bust, Expansion, Lockdown e Retreat, e la nostra solita 🗳️ (blu, come in tabella) accanto a Election; gli altri stati restano solo testo.

### Icone degli stati

- Il Retreat ha ora l'**icona del gioco** (le due frecce arancioni verso il basso) al posto del ⚠️, ovunque: colonna Stato, Legenda, riquadro degli stati e dettagli del sistema. Il ⚠️ resta solo per la forbice, così le due cose non si confondono. Un Retreat in arrivo (pending) è grigio, uno probabile ha il bordo tratteggiato, come prima.
- Le icone (fornite dall'utente) stanno in `public/icons/states/` e la mappa stato → icona in `core/state-icons.ts`; nel README la nota sulla proprietà di Frontier.
- Tutti i testi nuovi sono in italiano, tedesco e inglese, Guida compresa.

### Test

- I test della tabella partono dai dati completi, come fa ora l'app; tolti quelli sul caricamento a pagine dall'ordine di Spansh, che all'apertura non si usa più. Test nuovi su Watchlist in cima, titolo, forbice, fazioni native, Retreat, icone degli stati e stati globali. Passano 262 test dell'app.

## [1.1.0] - 2026-10-07 — Priorità più leggibile: semafori e meno falsi P1

### Priorità

- **Correzione di coerenza**: nei sistemi che controlliamo la priorità ignorava i semafori di Influenza e Margine, quindi poteva dire P5 ("tranquillo") accanto a due semafori rossi. Esempio: SPOCS 253, 35,7% di influenza e 15,6 punti di vantaggio, era P5 perché nessuna soglia della priorità scattava (il vantaggio era appena sopra i 15 punti).
- Ora i due semafori fanno da pavimento, letti come dice la Legenda: nessun verde e almeno un rosso → **P3**; entrambi gialli, oppure un verde e un rosso → **P4**; almeno un verde e nessun rosso → nessun effetto. Le soglie sono quelle dei semafori in `config.json` (influenza 50/40%, vantaggio 30/18 punti). I motivi più gravi (vantaggio sotto 7 punti, influenza bassa, conflitti) restano sopra.
- Il motivo "Controllo con 7-15 punti di vantaggio" (P4) non c'è più: sotto i 18 punti il semaforo del margine è sempre rosso, quindi lo copre la regola nuova.
- Effetto con i dati del 7 ottobre: 32 sistemi salgono di fascia, nessuno scende. 5 passano da P5 a P3 (fra cui SPOCS 253), 5 da P4 a P3, 22 da P5 a P4.
- **"Ultima su 4 o più fazioni" solo sotto il 5%**: la regola ereditata dai Canonn dava 90 punti (P1) a qualunque sistema in cui Flotta Stellare fosse l'ultima di 4 o più fazioni, anche a un'influenza tranquilla (HR 2251 al 13,9%, lontano dal 2,5% del Retreat). Il 7 ottobre portava in P1 10 sistemi su 16. Ora scatta solo sotto il 5%; sopra resta "Ultima fazione del sistema", pesata sul numero di fazioni e sotto il 10%, che porta in P3-P4.
- **Sopra il 5%, se Flotta Stellare è la fazione preferita registrata** nel Registro Architetti (non quella ricavata dalle stazioni, in grigio), essere ultimi su 4 o più fazioni porta comunque in **P2**: registrare la preferita è il modo con cui lo Squadrone dice "questo sistema ci interessa". Con i dati del 7 ottobre non cambia nessun sistema: i 10 in cui siamo ultimi non sono registrati.
- I conflitti di Flotta Stellare restano sempre P1, anche dove non controlliamo (decisione dell'utente).
- Risultato con i dati del 7 ottobre: 6 P1 (5 conflitti e un sistema della Watchlist), 3 P2, 33 P3, 44 P4, 300 P5.

### Test

- Sei nuovi test sulla priorità: sistemi controllati (SPOCS 253, semafori gialli, misti, verdi), ultima su 4 fazioni a influenza tranquilla (HR 2251) e ultima in un sistema registrato come nostro. Passano 252 test dell'app.

## [1.0.1] - 2026-10-07 — Versione 1.0: in produzione, anche in tedesco e in inglese

### Versione

- Il tool è considerato finito e pronto per la produzione: da qui la **1.0.1** (scelta dall'utente al posto della 1.0.0, per estetica).
- Il numero di versione nel titolo (e nella scheda del browser) non è più scritto a mano ("1.0" fisso): viene da `package.json`, quindi il sito pubblicato dice sempre quale versione sta girando.

### Lingue

- **Nuovo**: la parte di consultazione del tool è anche in **tedesco** e in **inglese**: intestazione, filtri, colonne, tooltip, Legenda, riquadro degli stati, motivazioni della priorità, dettagli del sistema e Guida. Il tool è stato linkato a un giocatore tedesco.
- Alla prima visita la lingua segue quella del browser; se non è italiano né tedesco, inglese. Le bandierine in alto (🇮🇹 🇩🇪 🇬🇧, disegnate in SVG perché Windows mostra le bandiere emoji come lettere) cambiano lingua al volo, e la scelta resta salvata nel browser (`acfs-bgs:lang`).
- Numeri e date seguono la lingua: virgola decimale in italiano e tedesco, punto in inglese.
- Restano in italiano gli **Ordini Ufficiali** (compreso il testo per Discord) e il modulo **Assegna**: sono strumenti interni dello Squadrone. Nelle altre lingue il pulsante Ordini, l'icona 📋 sulle righe e la sua voce in Legenda non compaiono; nella Guida una nota dice che lo Squadrone ha strumenti interni solo in italiano. Restano com'erano anche i nomi degli stati BGS, dei Material Trader e dei Technology Broker, come in gioco, e le motivazioni della Watchlist scritte nel foglio.
- In tedesco alcune intestazioni sono abbreviate perché la tabella stia nello schermo come in italiano (Distanz, Stand, Bevorzugt). La terminologia segue Inara in tedesco; la farà rivedere un giocatore tedesco.

### Tecnica

- Testi in `src/core/i18n/`: un dizionario per lingua, con l'italiano come riferimento. Il tedesco e l'inglese sono tipizzati sulle sue chiavi, quindi una traduzione mancante blocca la compilazione; un test controlla anche che ogni traduzione abbia gli stessi segnaposto.
- Le motivazioni della priorità si traducono dal loro codice; il testo italiano in `priority.ts` resta per il resto del tool.
- I test girano con il browser in italiano (`src/test-setup.ts`).
- Il bundle iniziale cresce di circa 33 kB, i tre dizionari.

### Test

- Undici nuovi test: scelta della lingua iniziale, segnaposto e numeri, motivazioni della priorità tutte tradotte, età del dato in tedesco e in inglese, e in tabella il cambio di lingua dalle bandierine (con gli Ordini che spariscono fuori dall'italiano). Passano 246 test dell'app.

## [0.11.1] - 2026-10-07 — Niente forbice durante un conflitto

### Forbice di influenza

- **Correzione**: il ⚠️ di "possibile conflitto" (colonne Margine e ACFS) compariva anche nei sistemi dove siamo già in guerra o elezione con un'altra fazione: a Crowfor, in conflitto, segnalava una fazione vicina a meno di 5 punti. Durante un conflitto la nostra influenza è bloccata e non può partirne un secondo, quindi ora nessun ⚠️ di forbice in tutto il sistema finché siamo in guerra o elezione (attiva o in pending) o alla pari con una fazione vicina. Prima il ⚠️ spariva solo verso la fazione con cui eravamo in conflitto.

### Test

- Il test dei ⚠️ in tabella include un sistema in guerra con una fazione vicina a meno di 5 punti da un'altra. Passano 235 test dell'app.

## [0.11.0] - 2026-10-06 — Forbice del 5% e preavviso del Retreat

### Forbice di influenza

- **Correzione**: il ⚠️ del Margine ("rischio conflitto") compariva solo nei sistemi che controlliamo, e oggi nessuno è sotto la soglia: la Legenda lo prometteva ma in tabella non si vedeva mai. Ora vale anche dove controlla un'altra fazione e noi siamo a 5 punti o meno da lei (sorpasso possibile, in arancione: oggi Amait e LP 302-22). La soglia è "5 punti o meno", non più "sotto 5".
- **Nuovo**: ⚠️ nella colonna **ACFS** quando la fazione subito sopra o subito sotto di noi in classifica (non quella del Margine) è a 5 punti o meno: due fazioni così vicine possono finire in guerra o elezione anche se nessuna delle due controlla il sistema. Il tooltip dice quali fazioni e di quanto. Oggi 61 sistemi, per esempio Geras (Geras Order 1,1 punti sopra, Labour of Geras 1,3 sotto).
- Nessun ⚠️ verso una fazione con cui il conflitto è già in corso o in pending, o con la nostra stessa influenza (è così che il conflitto parte, anche prima che Spansh lo riporti): a quel punto il preavviso non serve più.

### Retreat

- Nella colonna **Stato**, un ⚠️ tratteggiato quando Flotta Stellare è al **2,5% o meno** (`retreatInfluencePercent` in `config.json`) e Spansh non riporta ancora il Retreat: è probabile che parta al prossimo tick. Mai a Wong Sher, da dove la fazione non può ritirarsi. Non cambia la priorità: una volta attivo ci sono 5 giorni per risalire, e farlo l'ultimo giorno è la mossa migliore. Oggi nessun sistema è sotto la soglia (il più basso è Lalande 15394 al 3,7%).
- La Legenda spiega le nuove icone.

### Test

- Sei nuovi test: fazioni vicine (Geras, 111 Tauri, il limite dei 5 punti), conflitto già in corso, preavviso del Retreat, e in tabella i ⚠️ del Margine, della colonna ACFS e dello Stato. Passano 235 test dell'app e 20 degli script.

## [0.10.1] - 2026-10-06 — Legenda più leggibile

### Interfaccia

- Nella **Legenda** ogni voce ha due colonne, l'esempio a sinistra e la spiegazione a destra, allineate in tutto il gruppo: prima esempi e testi andavano a capo insieme e, nelle voci con più icone (i Material Trader), si spezzavano in pezzi sparsi.
- Il gruppo "Sistema e Architetto", il più lungo e chiuso in una colonna stretta, è diviso in tre: **Sistema**, **Servizi delle stazioni** (un Material Trader per riga) e **Architetto**.
- La spiegazione dei semafori passa sotto il titolo di "Influenza e Margine", e le soglie stanno accanto a "Influenza" e "Margine".
- Il grafico di esempio delle fazioni torna piccolo: la sua larghezza era sovrascritta da quella del grafico della tabella.

## [0.10.0] - 2026-10-06 — Material Trader e Technology Broker

### Tabella

- Accanto al nome del sistema, un'icona blu per ogni servizio presente. Il **Material Trader** ha un'icona per tipo: gemma per Raw, ingranaggio per Manufactured, chip per Encoded, fiaschetta se Spansh non conosce il tipo. Il **Technology Broker** ha una chiave inglese. Il tooltip dice tipo, stazione e distanza dalla stella di arrivo (es. "Material Trader: Encoded", "Vaucanson Hub, 282 ls"); cliccando l'icona si aprono i dettagli del sistema, così si legge anche su telefono.
- Nuovo filtro rapido **Servizi** nel gruppo "Mostra": solo i sistemi con almeno uno dei due servizi. Insieme all'ordinamento per Distanza risponde a "dov'è il trader più vicino?".
- Nei dettagli del sistema, la tabella delle stazioni ha una colonna **Servizi** con tipo e distanza dalla stella.
- La Legenda spiega le due icone.

### Dati

- Lo script dei dati tiene, per le stazioni che ne hanno uno, il Material Trader o il Technology Broker e la distanza dalla stella di arrivo. Il tipo (Raw, Manufactured, Encoded; Human, Guardian) lo chiede alla **ricerca per stazioni** di Spansh, l'unica che lo riporta, solo per i sistemi con un servizio: di solito una richiesta, a gruppi di 40 sistemi come fa la mappa del sito dello Squadrone. Se la richiesta fallisce il download prosegue, con il tipo "non noto".
- Al 6 ottobre 2026: 9 Material Trader e 16 Technology Broker nei sistemi di Flotta Stellare. Per 10 broker, in stazioni di colonie recenti, Spansh sa che il servizio c'è ma non il tipo.

### Test

- Tre nuovi test dello script (servizi delle stazioni, ricerca a gruppi di 40, errore della ricerca) e due dell'app (lettura dei servizi dal file dei dati, icone e filtro nella tabella). Passano 228 test dell'app e 20 degli script.

## [0.9.9] - 2026-10-06 — "Assegna" con password degli ufficiali

### Registro architetti

- Nuovo script Google `apps-script/assegna.gs`, da collegare al foglio: riceve le assegnazioni dal tool, controlla la **password degli ufficiali dal lato di Google** (salvata nelle proprietà dello script, mai nel repo) e solo allora aggiunge una riga al Registro, come farebbe il Google Form. Risponde con l'esito, così il tool sa se il salvataggio è riuscito (col Form non poteva saperlo).
- Protezioni dello script: blocco di 10 minuti dopo 10 password sbagliate; testi che iniziano con `=`, `+`, `-` o `@` salvati come testo, non come formule; colonne abbinate per nome.
- Il dialog **Assegna** chiede la password solo quando lo script è configurato (`assignScriptUrl` in `config.json`). Dopo il primo invio riuscito la ricorda su quel dispositivo; se lo script la rifiuta la dimentica e lo dice. Messaggi distinti per password errata, blocco, script senza password e dati non accettati.
- **Attivo**: lo script è installato nel foglio e il suo URL è in `assignScriptUrl`, quindi da questa versione "Assegna" chiede la password degli ufficiali. Provato dal vero: la password sbagliata è rifiutata senza scrivere nulla, quella giusta scrive la riga nel Registro. Il Google Form resta aperto per l'uso a mano.

### Test

- Nove nuovi test dell'app: corpo della richiesta e lettura della risposta dello script, invio tramite script nel servizio, campo password nel dialog (obbligatorio, ricordato dopo un invio riuscito, dimenticato se rifiutato). Passano 226 test dell'app e 17 degli script. Lo script Google è stato provato anche in locale, con servizi Google simulati.

## [0.9.8] - 2026-10-06 — Punteggio dei conflitti da EliteBGS

### Dati

- Lo script dei dati chiede a **EliteBGS** il punteggio (giorni vinti) dei conflitti, solo per i sistemi in cui Flotta Stellare ha una guerra, guerra civile o elezione in corso: di solito una sola richiesta, perché l'API accetta 10 sistemi alla volta. Il punteggio finisce nel file dei dati (`ebgs_conflicts` per sistema, `conflict_scores_available` in testa).
- EliteBGS è spesso giù (il suo database è fermo da settimane, vedi roadmap): al primo errore lo script rinuncia e prosegue senza punteggio, con un'attesa massima di 20 secondi. Un errore conta anche quando arriva con HTTP 200, come a volte fa EliteBGS.

### Riquadro dello stato

- Con il punteggio: "Punteggio: 1-2" coi **nostri giorni prima**, la posta in gioco (le stazioni che ciascuno rischia) e l'ora del dato EliteBGS.
- Senza punteggio il riquadro dice perché: EliteBGS non era raggiungibile, oppure non ha ancora quel conflitto. In entrambi i casi resta il link a Inara. Un conflitto in pending resta "Draw; 0-0".

### Roadmap

- Annotati lo stato reale di EliteBGS (dal suo repository e dalla issue #378), il formato del dato e l'idea di un'app nostra sul web, da valutare.

### Test

- Cinque nuovi test dello script (sistemi da chiedere, richieste a gruppi di 10, errori con HTTP 200 e 500) e due dell'app (punteggio dal nostro lato, nessun punteggio per conflitti assenti o in pending). Passano 217 test dell'app e 17 degli script.

## [0.9.7] - 2026-10-06 — Dettagli dei conflitti al clic

### Tabella

- Le icone della colonna **Stato** (⚔️ War o Civil War, 🗳️ Election, ⚠️ Retreat) si possono cliccare: si apre un riquadro con, per ogni stato, il nome come in gioco, se è in corso o in pending, le fazioni coinvolte (la nostra per prima, in arancione) con la loro influenza, e l'ora del dato Spansh. Prima queste informazioni c'erano solo nel tooltip, che su telefono non si vede.
- Il **punteggio** del conflitto (giorni vinti) per ora non c'è: Spansh non lo riporta ed EliteBGS, che lo avrebbe, oggi risponde ancora con errore 500. Il riquadro rimanda a Inara; un conflitto in pending mostra "Draw; 0-0". Vedi la roadmap.
- Ogni riga ha ora anche gli stati in forma strutturata (`stateEntries`), da cui legge il riquadro.

### Test

- Due nuovi test: le voci strutturate degli stati (la nostra fazione per prima, l'attivo prevale sul pending) e l'apertura del riquadro. Passano 215 test dell'app.

## [0.9.6] - 2026-10-06 — Filtri per nome più chiari

### Filtri

- I campi Nome di **Architetto** e **Fazione** applicano il filtro anche quando si esce dal campo, non solo con Invio o scegliendo un suggerimento: prima, scritto un nome e cliccato altrove, non succedeva nulla e niente diceva di premere Invio. Il campo Architetto parte col proprio nome già scritto, quindi all'uscita filtra solo se il testo è stato modificato.
- Filtrando per **Flotta Stellare** compare un avviso: la fazione è presente in tutti i sistemi della tabella, quindi il filtro li tiene tutti; per i sistemi che controlliamo c'è "Controllati".

### Test

- Tre nuovi test: filtro applicato all'uscita dal campo, nessun filtro se il campo non è stato modificato, avviso per la nostra fazione. Passano 213 test dell'app.

## [0.9.5] - 2026-10-06 — Tabella leggibile su telefono

### Interfaccia mobile

- Sotto i 720 px di larghezza ogni sistema diventa una **scheda**: nome in alto, poi i valori con la loro etichetta, in quest'ordine: Priorità, Aggiornato, Distanza; ACFS, Margine, Stato; fazione di controllo e grafico delle fazioni; architetto e fazione preferita. Prima la tabella era larga più di 1100 px e su un telefono si vedevano solo Sistema e Distanza, il resto andava scorso in orizzontale.
- Le intestazioni ordinabili diventano una fila di pulsanti **"Ordina per"** sopra le schede, con lo stesso indicatore ▲/▼.
- Sotto i 600 px: titolo e logo affiancati, i pulsanti Guida, Legenda, Ordini ed Esporta in una griglia (2×2 su telefono); nel paginatore la pagina corrente sta sopra e i due pulsanti affiancati sotto.
- **Ordini Ufficiali**: su telefono i campi (intestazione, barra "Aggiungi riga", righe) occupano tutta la larghezza invece di avere larghezze miste; la Firma tiene accanto il pulsante Blocca. L'anteprima Markdown non sborda più a destra (era larga il 100% più il suo margine interno, anche su desktop).
- Su desktop non cambia nulla, a parte l'anteprima Markdown che ora resta dentro la pagina.

## [0.9.4] - 2026-10-06 — Ordinamento per nome

### Tabella

- Anche l'intestazione **Sistema** ordina la tabella: alfabetico per nome del sistema, senza distinguere maiuscole e minuscole; un secondo clic inverte l'ordine. Era l'unica colonna, insieme a Stato, che non si poteva ordinare.

### Test

- Nuovo test: ordinamento per nome dall'intestazione, nei due versi. Passano 210 test dell'app.

## [0.9.3] - 2026-10-06 — Fazione preferita senza architetto

### Registro

- Nel dialog "Assegna" il nome dell'architetto è obbligatorio solo se l'appartenenza dice chi è ("L'architetto è un membro ACFS" o "Non è un membro ACFS"). Con "Non so" si può lasciare vuoto, così si registra la fazione preferita di un sistema di cui nessuno conosce l'architetto. Prima era obbligatorio per tutte le risposte tranne "Nessuno: il sistema non è una colonia", anche se il Google Form non lo richiede.
- Il messaggio di errore suggerisce "Non so" invece di "Nobody", che nel menu non compare.

### Test

- Nuovi test del dialog: invio con la sola fazione preferita, nome obbligatorio con le due risposte sull'appartenenza. Passano 209 test dell'app.

## [0.9.2] - 2026-10-05 — Watchlist in cima

### Tabella

- I sistemi della **Watchlist** sono sempre in cima, poi tutti gli altri nell'ordine di Spansh (dal più aggiornato). Prima l'ordine era solo quello di Spansh, e un sistema della Watchlist poteva finire in fondo. Cliccando un'intestazione si ordina comunque per quella colonna.

## [0.9.1] - 2026-10-05 — Colonna Distanza

### Tabella

- Nuova colonna **Distanza**, in anni luce, dal sistema scritto nel box "Distanza da" (Wong Sher finché non se ne cerca un altro). Cliccando l'intestazione si ordina per distanza, come col pulsante di ricerca. Il sistema di riferimento resta quello cercato anche se poi si ordina per un'altra colonna (prima seguiva la prima riga dell'ordinamento).
- Celle della tabella un po' più strette (10 px ai lati invece di 14), così con la colonna in più la tabella entra ancora senza scorrere in orizzontale.
- L'ordine predefinito resta quello di Spansh: dal sistema aggiornato più di recente.

## [0.9.0] - 2026-10-05 — Semafori, legenda e editor degli ordini

### Interfaccia

- Nella colonna Stato la guerra si indica con ⚔️, la stessa icona degli Ordini Ufficiali, invece che con 🔫.
- **Semafori dello Squadrone** sulle colonne ACFS e Margine, nei sistemi che controlliamo (`core/semaphore.ts`, soglie in `config.json`): influenza 🟢 dal 50%, 🟡 da 40,0 a 49,9%, 🔴 sotto il 40%; Margine 🟢 da 30 punti, 🟡 da 18 a 29,9, 🔴 sotto 18. Almeno un verde: sistema tranquillo; almeno un rosso: da seguire. Il vantaggio sotto i 5 punti (rischio di conflitto per il controllo) resta segnalato a parte, con ⚠️ e in grassetto. Dove non controlliamo l'influenza resta arancione e il Margine grigio.
- Nuovo pulsante **Legenda** nell'intestazione: apre sopra la tabella un pannello che spiega colori e icone (età del dato, stati, priorità, influenza e margine, icone del sistema e dell'architetto). Gli esempi usano gli stessi stili della tabella.

### Ordini Ufficiali

- Il link diretto a https://flottastellare.it/acfs-bgs-tool/ordini dava 404 (si arrivava alla pagina solo dal pulsante della tabella): ora il build per il sito copia `index.html` in `404.html` (`scripts/spa-fallback.mjs`), così GitHub Pages carica l'app e il router apre la pagina giusta.
- Si sceglie la **data degli ordini**: per default è domani (di solito gli ordini si scrivono oggi per domani), con la data di gioco mostrata sotto il campo. Una data scelta resta finché non è passata.
- I pulsanti di stato erano scritti in nero su sfondo scuro e non si leggevano: ora hanno il colore del testo e lo stato attivo è evidenziato.
- Nell'editor stati, tendenze e tipi si vedono come emoji (🆕 🟢 🚨 ✅ ❌, ⬆️ ⬇️ ↔️, 🗳️ ⚔️ 📊 🏗️) invece che come codici Discord. Il testo da copiare usa ancora i codici, che servono per le emoji del server (`:RedAlert:`, `:Expansion:`).
- Nuovi stati 🟡 (`:yellow_circle:`, risultato insoddisfacente: nessun punto segnato ieri, influenza sotto il 49%) e 🔴 (`:red_circle:`, risultato negativo: punto perso, influenza sotto il 39,9%; se è grave si abbina a 🚨).
- Una riga di influenza aggiunta dalla tabella ha già lo stato del semaforo dell'influenza (🟢, 🟡 o 🔴), da correggere a mano se serve.
- Con ✅ o ❌ la riga passa da sola nelle **Operazioni concluse** (e torna indietro se si toglie la spunta). I due stati si escludono a vicenda.
- **Note & informazioni** raccoglie testo libero ("+ Nota libera") e tutto ciò che è in **Pending**: le guerre e le elezioni con punteggio "Draw; 0-0" e 🆕 (togliendo la spunta Pending tornano fra le Operazioni) e le Expansion, con il pulsante **+ Expansion** (riga "Pending Expansion da ? - Sistema di arrivo: ?" da completare). Il pulsante **Precompila con i pending** aggiunge dai dati tutte le guerre e le elezioni in pending, senza doppioni. Le Expansion non si ricavano dai dati: Spansh mostra l'Expansion in pending in quasi tutti i nostri sistemi (189 su 389), quindi "Aggiungi agli ordini" non le considera più e propone una spinta d'influenza.
- Con "Aggiungi riga", un'Expansion con un sistema scelto diventa subito "Pending Expansion da **sistema** - Sistema di arrivo: **?**" 🆕, con la spunta Pending; una Nota libera con un sistema parte dal nome in grassetto. La spunta Pending c'è anche per le Expansion e cambia il testo fra "Pending Expansion" ed "Expansion". Una riga vuota a cui si cambia il tipo in Expansion si precompila allo stesso modo.
- Le righe dei cantieri usano l'emoji 🏗️ direttamente nel testo copiato (prima `:construction_site:`). Scegliendo una sezione in "Aggiungi riga" il tipo si adegua: Cantieri aperti → Cantiere, Note → Nota libera, Operazioni → Elezione.
- Le quattro sezioni dell'editor sono sempre visibili, ciascuna con il suo colore (arancione, azzurro, giallo, verde) e il numero di righe.
- Il punteggio di un conflitto si scrive sempre dal nostro punto di vista, con i nostri giorni prima (es. "Close Defeat; 0-2").

## [0.8.0] - 2026-10-05 — Ordini Ufficiali e titolo 1.0

### Ordini Ufficiali

- Nuova pagina **`/ordini`**, dietro passphrase condivisa (deterrente, non vera protezione, finché non arriva la fase 8): compone il report giornaliero delle operazioni, con le stesse sezioni e la stessa formattazione del messaggio che lo Squadrone già posta su Discord (Operazioni per priorità, Cantieri Aperti, Note & Informazioni, Operazioni Concluse).
- Tipi di attività (Elezione, Guerra, Spinta influenza, Cantiere, Expansion da monitorare, Nota libera) definiti in `core/order-types.json`, non nel codice: per aggiungerne uno nuovo basta modificare il file.
- La data del report è quella di gioco (anno reale + 1286, come fa già lo Squadrone a mano), calcolata da sola.
- Nuovo flag **"Pending"** per un'elezione o una guerra non ancora attiva (dura 1 giorno fino al tick successivo) o un'expansion non ancora conclusa (fino a 3 giorni); nuova freccia di tendenza **stabile** (↔) per un cambiamento di 0-1%.
- Pulsante **"Aggiungi agli ordini"** su ogni riga della tabella: precompila sistema e tipo dallo stato attuale (guerra, elezione, expansion, o l'influenza corrente se nessuno dei tre è in corso).
- Il carrello resta solo nel browser (`localStorage`): non si sincronizza fra i due computer dell'utente (vedi `CLAUDE.md`).
- Nuovo pulsante **Guida** (anche nella pagina Ordini, "Come funziona?"): apre una breve spiegazione del tool e di come comporre gli ordini.

### Titolo

- Il tool si presenta come **"ACFS BGS Tool 1.0"** (titolo della pagina e intestazione), per segnare l'avvicinamento alla produzione.

### Test

- Nuovi test per il modello e il rendering degli ordini (`core/orders.spec.ts`, `core/orders-access.spec.ts`). Passano 175 test dell'app.

## [0.7.0] - 2026-10-05 — Controllo dei dati ogni 30 minuti e contatore del tick

### Aggiornamento dei dati

- Il workflow controlla i dati Spansh **ogni 30 minuti** (ai minuti 17 e 47) invece che ogni ora.
- Nuovo script `scripts/data-changed.mjs`: confronta il download con il `bgs.json` già pubblicato, ignorando l'ora del download e l'ordine dei sistemi. Se non è cambiato niente, l'esecuzione si ferma prima di installare, compilare e pubblicare; se il sito non risponde, pubblica comunque. Push su `main` ed esecuzioni manuali pubblicano sempre.

### Interfaccia

- Sotto il titolo, nuovo contatore dei sistemi **aggiornati dall'ultimo tick**, in totale e fra i P1-P2, ad esempio "68/389 aggiornati dall'ultimo tick · P1-P2: 11/22". La colonna "Aggiornato" resta in giorni.
- "Dati Spansh scaricati il…" diventa "Dati Spansh aggiornati il…": con la pubblicazione solo quando i dati cambiano, è l'ora dell'ultimo cambiamento.

### Roadmap

- Annotata fra le idee future la **Pattuglia** ("Da visitare"): i sistemi P1-P2 ancora fermi a prima del tick, da far visitare ai piloti per aggiornare Spansh.

### Test

- Nuovi test per il contatore e per il confronto dei dati. Passano 150 test dell'app e 12 degli script.

## [0.6.2] - 2026-10-04 — ACFS BGS Tool, nuovo pannello dei filtri

### Nome

- Il tool si chiama **ACFS BGS Tool** (titolo, intestazione, README).
- Il repo si chiama `ed-acfs/acfs-bgs-tool` (prima `acfs-bgs`) e il sito si sposta su **https://flottastellare.it/acfs-bgs-tool/**. Il vecchio indirizzo `/acfs-bgs/` smette di funzionare: GitHub non reindirizza i percorsi delle Pages.
- Progetto Angular e pacchetto npm `acfs-bgs-tool`; build in `dist/acfs-bgs-tool/`. I file esportati si chiamano `acfs-bgs-tool-AAAA-MM-GG`.

### Interfaccia

- Ricerca e filtri in un **unico pannello**, su due righe ordinate: distanza e righe per pagina sopra, filtri sotto. Su schermi stretti i gruppi vanno a capo interi.
- I filtri sono **pulsanti a segmenti** uniti ("Tutti | Nessuno | ACFS") invece di pillole separate, con un'etichetta "Mostra" per Guerre/Elezioni e Da aggiornare; i campi di testo sono alti 36 px invece di 56.
- Tooltip sui filtri, e stato premuto (`aria-pressed`) per i lettori di schermo.

## [0.6.1] - 2026-10-04 — Modifica delle assegnazioni e filtro architetti ACFS

### Interfaccia

- Accanto a un architetto già registrato (o a un sistema segnato "non è una colonia") c'è una matita ✎ che riapre il dialog per **modificare l'assegnazione**. Il dialog si apre con i valori attuali e il titolo "Modifica assegnazione"; l'invio aggiunge una riga al registro, che vale come ultima.
- Nuovo filtro rapido **"ACFS"** nella sezione Architetto: solo i sistemi il cui architetto risulta membro ACFS. L'appartenenza è della persona: conta la sua registrazione più recente con un'appartenenza indicata, in qualunque sistema. Non serve un elenco separato dei membri: lo dice il registro.

### Test

- Nuovi test per l'elenco degli architetti ACFS e per il dialog in modifica. Passano 146 test dell'app e 7 degli script.

## [0.6.0] - 2026-10-04 — Pubblicazione su GitHub Pages

Fase 6 di [ROADMAP.md](ROADMAP.md). Il tool va online su **https://flottastellare.it/acfs-bgs/** e si aggiorna da solo.

### Pubblicazione

- Nuovo workflow `.github/workflows/pages.yml`, al posto di quello ereditato dai Canonn (`main.yml`): installa, esegue i test, scarica i dati da Spansh, fa il build per `/acfs-bgs/` e pubblica su GitHub Pages.
- Parte a ogni push su `main`, **ogni ora** (al minuto 17, senza test) e a mano dalla scheda Actions. Ogni ora perché Spansh si riempie mano a mano che i giocatori passano nei sistemi dopo il tick.
- Nuovo comando `npm run build:pages`. Il progetto Angular si chiama `acfs-bgs` e il build finisce in `dist/acfs-bgs/`.

### Interfaccia

- Sotto il titolo, quando sono stati scaricati i dati da Spansh e quando c'è stato l'ultimo tick, in UTC.
- Una modifica al registro o alla Watchlist compare entro 15 minuti (prima la pagina teneva i fogli in memoria per 2 ore).

### Dati

- `scripts/fetch-bgs.mjs` salva anche l'ora dell'ultimo tick (`tick_at`) letta dall'EDCD Tick Detector. Se il servizio non risponde il valore resta vuoto e lo scaricamento prosegue.

### Registro

- Inseriti nel registro i 6 sistemi che il registro Canonn assegna a Flotta Stellare (Lagoon Sector YZ-Y c6, Col 285 Sector ZV-M d7-91, Lyncis Sector CL-Y d68, Lyncis Sector NY-R b4-2, Col 285 Sector MY-Q c5-21, HIP 1773), con architetti membri ACFS.
- Inseriti anche i 3 sistemi che il registro Canonn assegna a Canonn (Lagoon Sector AQ-X b1-2, YU-X b1-4, ZU-X b1-9), con fazione preferita Canonn: nel nostro tool sono "non intervenire", come i nostri 6 lo sono nel loro. Registrati con Flotta Stellare anche HIP 30129 e Col 285 Sector MY-Q c5-22, che controlliamo e dove il registro Canonn indica solo l'architetto.
- Lyncis Sector CL-Y d68, perso contro Canonn alle elezioni del 4 ottobre 2026, è in Watchlist in prima posizione: resta P1 finché non torniamo primi.

### Test

- Nuovi test per la lettura del tick. Passano 142 test dell'app e 7 degli script.

## [0.5.0] - 2026-10-04 — Registro architetti e Watchlist ACFS

Fase 5 di [ROADMAP.md](ROADMAP.md). Il tool legge e scrive il registro dello Squadrone invece di non averne nessuno.

### Registro

- Collegati il Google Form "ACFS Architect Registry" e il suo foglio di risposte, pubblicato come TSV. Il dialog "Assegna" invia le risposte al Form; la colonna Architetto e la Fazione preferita le leggono dal foglio.
- Risposte di appartenenza ACFS ("The Architect is an ACFS Member", "Not an ACFS Member"…), mostrate in italiano nel dialog ("L'architetto è un membro ACFS", "Non è un membro ACFS", "Nessuno: il sistema non è una colonia", "Non so").
- Flotta Stellare è l'opzione elencata di Fazione preferita; ogni altra fazione passa dall'opzione "Altro" del Form.
- Una fazione preferita registrata vale più di quella ricavata dalle stazioni: un sistema registrato con un'altra fazione diventa "non intervenire" (⛔).

### Watchlist

- Collegata la scheda `Watchlist` dello stesso foglio (`System`, `Faction`, `Position`, `Details`). Per ora è vuota.

### Verifica

- Prova reale: una risposta inviata con gli stessi campi dell'app compare nel foglio pubblicato in circa 15 secondi e viene letta correttamente. La riga di prova ("PROVA - cancellare questa riga") va cancellata dal foglio.
- Nel codice non restano riferimenti ai Canonn, a parte i crediti e l'intermediario del typeahead.
- Passano 142 test dell'app e 5 degli script.

## [0.4.0] - 2026-10-04 — Priorità a fazione singola

Fase 4 di [ROADMAP.md](ROADMAP.md). La colonna Priorità ora lavora per Flotta Stellare: al 4 ottobre 2026 ci sono 17 sistemi in P1, 5 in P2, 16 in P3, 23 in P4 e 328 in P5.

### Priorità

- Logica a una sola fazione: tolti i trigger a coppia Canonn/CDSR (`canonn-cdsr-close`, "Canonn vs Canonn") e il calcolo del margine contro "l'altra nostra fazione".
- **Sistemi non registrati**: sono tutti "nostri" (in scope), quindi oltre alla difesa compare anche "Da conquistare" dove siamo dietro chi controlla. La scelta è configurabile con `unregisteredScope` in `config.json`: `"assumed"` ripristina la politica Canonn (solo difesa finché il sistema non viene registrato). Decisa su una simulazione con i dati reali di tre politiche diverse.
- La regola "Ultima su 4 o più fazioni" (P1) vale nei sistemi "nostri", non solo in quelli con preferenza registrata.
- La regola "Nessun architetto assegnato" resta come nei Canonn: vale solo per i sistemi "assumed", quindi con la politica attuale non scatta.
- Livelli rinumerati sulla scala ACFS: la massima priorità è **P1** (nei Canonn era P0), la minima P5.
- Motivazioni della priorità in italiano ("Guerra in corso", "Da conquistare: 5,0 punti dietro chi controlla", ecc.).

### Dati e stati

- Guerre, elezioni, ritirate ed espansioni sono quelle di Flotta Stellare; il tooltip nomina prima noi e poi l'avversario ("Election: Flotta Stellare vs Canonn").
- Tolte le icone "Canonn vs Canonn" e `public/assets/canonn.svg`. Le icone di guerra ed elezioni hanno un nome accessibile.
- Fazione preferita ricavata: Flotta Stellare nei sistemi dove controlla almeno una stazione (289 su 389), mostrata in grigio.
- Dialog "Assegna": per un membro dello Squadrone la fazione preferita di default è Flotta Stellare, se presente nel sistema.

### Situazione al 4 ottobre 2026

- Due elezioni contro Canonn: Lyncis Sector CL-Y d68 (controllato da noi) e Lyncis Sector NY-R b4-2 (controllato da Canonn), entrambi 50-50. Sono due dei sei sistemi che il registro Canonn assegna a Flotta Stellare.

### Test

- `priority.spec.ts` riscritto per una sola fazione; i test della politica Canonn passano `"assumed"` esplicito. Nuovi test per la politica dello Squadrone. `station-preference.spec.ts` al posto di `canonn-asset-preference.spec.ts`. Passano 142 test dell'app e 5 degli script.

## [0.3.0] - 2026-10-04 — Identità ACFS, italiano, colonne ACFS e Margine

Fase 3 di [ROADMAP.md](ROADMAP.md). È la prima versione che si presenta come tool ACFS e mostra l'influenza di Flotta Stellare.

### Identità

- Logo 2025 "Vanguards" di Alto Comando Flotta Stellare (`ed-acfs.github.io/extras/ACFS_Logo_2025_Vanguards/`, ridotto a 301×340 px) nell'intestazione e nella schermata di caricamento, al posto dell'SVG animato Canonn. Durante il caricamento pulsa leggermente (non se il sistema chiede animazioni ridotte).
- Titolo "ACFS BGS", descrizione in italiano, `lang="it"`, favicon e icona Apple dello Squadrone (dal set `icon-vanguards` del sito).

### Italiano

- Interfaccia in italiano: intestazioni, filtri rapidi, paginazione, tooltip, messaggi di errore, dialog "Assegna" e dialog informazioni sul sistema.
- Numeri in formato italiano tramite `LOCALE_ID` `it-IT` ("42,5%", "1.234").
- Età del dato: "oggi", "5g", "3s", "1a+". Il tooltip mostra data e ora dell'aggiornamento in UTC, cioè l'ora di gioco.

### Colonne

- **ACFS** al posto di CANO: influenza di Flotta Stellare.
- **Margine** al posto di CDSR: nei sistemi controllati, vantaggio sulla seconda fazione; altrove, distacco da chi controlla. Verde sopra la soglia di rischio, rosso sotto (5 punti, `conflictMarginPoints` in `config.json`), grigio per i distacchi. Il tooltip indica la fazione di confronto e la sua influenza. Al 4 ottobre 2026 l'unico sistema controllato sotto soglia è Lyncis Sector CL-Y d68, a 0,0 punti da Canonn.
- Nel grafico Fazioni la barra arancione è quella di Flotta Stellare.
- Il filtro rapido "Canonn" diventa **"Controllati"**: mostra solo i sistemi controllati da Flotta Stellare.

### Export

- JSON e CSV riportano `factionInfluence`, `marginPoints` e `marginVersus` al posto di `canonnInfluence` e `cdsrInfluence`.

### Correzioni

- I colori delle celle di influenza (e ora di margine) non comparivano mai: la regola generica sul colore delle celle li sovrascriveva. Il difetto era già nell'originale Canonn.

### Test

- Nuovo `src/core/margin.spec.ts` per il calcolo del margine. Passano 144 test dell'app e 5 degli script.

### Ancora in inglese

- Le motivazioni della priorità nel tooltip e le icone "Canonn vs Canonn": si rifanno nella fase 4.
- Le opzioni di appartenenza del dialog "Assegna": sono le risposte del Form Canonn e cambiano con il nostro Form, nella fase 5.

## [0.2.0] - 2026-10-04 — Modulo core e configurazione

Fase 2 di [ROADMAP.md](ROADMAP.md). Riorganizzazione interna: per chi usa il tool cambia solo il sistema di riferimento della distanza.

### Struttura

- Nuova cartella `src/core/`, senza Angular né API del browser, così la stessa logica potrà girare anche in Node per il report su Discord. Contiene i moduli che erano in `src/app/data/` (priorità, freschezza, registro architetti, Watchlist, export, distanza) e il nuovo `bgs.ts`, con i tipi dei dati, la conversione da record Spansh a riga della tabella e l'analisi di guerre, elezioni, ritirate ed espansioni.
- Il service (`CanonnBgsService`, ora `BgsService` in `app/bgs.service.ts`) si occupa solo di caricamento e cache: da circa 1.050 a circa 460 righe.
- Le parti legate al browser restano nell'app: lo scaricamento di JSON e CSV (`app/export-download.ts`) e il nome del comandante salvato nel browser (`app/your-name.ts`).
- Il logger non dipende più da Angular: lo attiva `main.ts` in modalità sviluppo.

### Configurazione

- Nuovo `src/core/config.json`, con i tipi in `config.ts`: Squadrone, fazione, capitale, seconda fazione da confrontare (vuota), soglia del margine (5 punti), prefisso delle chiavi nel browser, indirizzi di dati, typeahead, Sheet e Form.
- `scripts/fetch-bgs.mjs` legge il nome della fazione dallo stesso file.
- Le chiavi salvate nel browser usano il prefisso `acfs-bgs:` invece di `canonn-bgs:`. Il nome del comandante salvato con la versione precedente va reinserito.
- Il sistema home usato per sopprimere l'avviso di ritirata è Wong Sher per Flotta Stellare, al posto di Varati e Canonnia.

### Interfaccia

- La distanza si misura di default da Wong Sher, anche nella tabella, e non più dal primo sistema caricato.
- I file esportati si chiamano `acfs-bgs-AAAA-MM-GG.json` e `.csv`.

### Test

- Nuovo `scripts/core-purity.test.mjs`: fallisce se in `src/core/` compaiono import di Angular o dell'app, DOM o `localStorage`.
- Passano 138 test dell'app e 5 degli script.
- Fine riga LF in tutti i sorgenti, compreso `priority.ts` che era l'unico in CRLF.
- Nuovo workflow `.github/workflows/ci.yml`: script, test e build a ogni pull request e a ogni push su `main`. Non pubblica nulla.

## [0.1.0] - 2026-10-04 — Dati Flotta Stellare da Spansh

Prima versione di ACFS BGS, derivata da [canonn-colony-operations](https://github.com/canonn-science/canonn-colony-operations), commit `551a119`. Corrisponde alla fase 1 di [ROADMAP.md](ROADMAP.md): l'app mostra i sistemi di Flotta Stellare invece di quelli dei Canonn. Interfaccia, colonne e calcolo della priorità sono ancora quelli dei Canonn: si adattano nelle fasi 2–4.

### Dati

- Nuovo script `scripts/fetch-bgs.mjs` (`npm run fetch-data`). Scarica da Spansh tutti i sistemi in cui Flotta Stellare è presente e li salva in `public/data/bgs.json`, un file che non viene versionato. Il procedimento è quello della Cloud Function `canonnbgs` dei Canonn: salva la ricerca, la richiama a pagine da 500, poi toglie corpi celesti, ricette e dettagli delle stazioni. Al 4 ottobre 2026 i sistemi sono 389, di cui 249 controllati, e lo scaricamento dura circa 3 secondi.
- `npm start` e `npm run build` scaricano i dati solo se il file manca (`--if-missing`), così Spansh non viene interrogato a ogni avvio.
- L'app legge il file statico con una sola richiesta, al posto del token e delle pagine della Cloud Function Canonn.

### Separazione dai Canonn

- Scollegati il registro architetti e la Watchlist dei Canonn: i loro Google Sheet non vengono più letti.
- Il dialog "Assign" non invia più nulla al Google Form dei Canonn. Finché non c'è il Form ACFS (fase 5), l'invio viene rifiutato con un errore.
- La distanza si misura di default da Wong Sher, non più da Varati.
- Rimosso `public/CNAME` con il dominio `bgs.canonn.tech`.

### Progetto

- `README.md` riscritto per ACFS. Aggiunti `ROADMAP.md`, con piano e decisioni, e questo changelog.
- Nuova nota di copyright ACFS in `LICENSE`, che conserva quella originale del Canonn Research Group.
- `package.json`: nome `acfs-bgs`, versione 0.1.0.
- `src/app/build-info.ts` non è più versionato. Viene generato prima di start, build e test.
- Disattivato il workflow di deploy su GitHub Pages ereditato dai Canonn: falliva a ogni push su `main` perché Pages non è attivo. Torna con la fase 6.

### Test

- Nuovi test per lo script dei dati (`npm run test:scripts`, con `node --test`).
- Riscritti i test del service per il file statico. In tutto passano 138 test dell'app e 4 dello script.

### Ancora da fare

- Le colonne CANO e CDSR sono vuote e la priorità è P4 ovunque, perché il codice cerca ancora l'influenza di "Canonn". La sistemazione è prevista nelle fasi 3 e 4.
- La ricerca per distanza usa ancora l'intermediario pubblico dei Canonn per i nomi dei sistemi.
