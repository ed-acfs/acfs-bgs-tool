# Script del Registro Architetti

`assegna.gs` è lo script Google (Apps Script) con cui il pulsante **Assegna** del tool scrive nel Registro Architetti, protetto da una password (roadmap, fase 8a). **Dal 18 ottobre 2026 la password la conosce solo il server dello Squadrone** (`ASSIGN_PASSWORD` nel `.env` di `acfs-server`, uguale alla proprietà dello script): il tool manda l'assegnazione al server con la sessione Discord di un ufficiale, e il server la passa allo script (fase 8b, passo 5). Nessun ufficiale deve più conoscerla.

- La password si controlla nello script, dal lato di Google: chi salta il tool non può scrivere senza conoscerla. Sta nelle proprietà dello script, mai nel repo.
- Ogni assegnazione aggiunge una riga alla scheda "Risposte del modulo 1", come una risposta del Google Form. Il tool legge l'ultima riga di ogni sistema; le righe vecchie restano come storia.
- Dopo 10 password sbagliate le scritture si bloccano per 10 minuti, per tutti.
- Finché `assignScriptUrl` in `src/core/config.json` è `null`, il tool continua a usare il Google Form come prima.

## Installazione (una volta sola)

Si fa dall'account Google proprietario del foglio. I connettori di Claude leggono e scrivono celle, ma non possono installare uno script.

1. Apri il foglio **ACFS BGS Tool — Registro Architetti e Watchlist**, poi **Estensioni → Apps Script**.
2. Nel file `Codice.gs` cancella tutto e incolla il contenuto di `assegna.gs`. Salva (icona del dischetto). Il nome del progetto, in alto, puoi cambiarlo in "ACFS – Registro Architetti".
3. Imposta la password: **Impostazioni progetto** (rotellina a sinistra) → in fondo **Proprietà script** → **Aggiungi proprietà script**:
   - Proprietà: `ASSIGN_PASSWORD`
   - Valore: la password degli ufficiali

   Salva le proprietà.
4. Pubblica: **Esegui il deployment → Nuovo deployment** → rotellina accanto a "Seleziona tipo" → **App web**:
   - Descrizione: `Registro architetti`
   - Esegui come: **Me**
   - Chi ha accesso: **Chiunque**

   Il controllo della password lo fa lo script: "Chiunque" serve solo a far arrivare le richieste del tool.
5. **Esegui il deployment.** Google chiede di autorizzare lo script a modificare i tuoi fogli: scegli il tuo account. Se compare "Google non ha verificato questa app", fai **Avanzate → Vai a … (non sicuro)**: è normale per uno script personale non pubblicato sul Marketplace.
6. Copia l'**URL dell'app web** (finisce con `/exec`). Aprendolo nel browser deve comparire `{"ok":true,"service":"acfs-bgs-tool-assign"}`.
7. L'URL va al server (`ASSIGN_SCRIPT_URL` nel `.env` di `acfs-server`, se cambia rispetto a quello scritto nel suo codice) e la password in `ASSIGN_PASSWORD`, nello stesso `.env`.

## Manutenzione

- **Cambiare la password**: Impostazioni progetto → Proprietà script → modifica `ASSIGN_PASSWORD`, poi lo stesso valore in `ASSIGN_PASSWORD` nel `.env` del server e `docker compose up -d auth`. Vale subito, senza ripubblicare lo script. Conviene una password lunga e casuale: nessuno deve ricordarla.
- **Aggiornare lo script** dopo una modifica a `assegna.gs`: incolla il nuovo codice, poi **Esegui il deployment → Gestisci deployment** → matita → Versione: **Nuova versione** → Esegui il deployment. L'URL resta lo stesso. (Un "Nuovo deployment" invece crea un URL nuovo, da mettere in `ASSIGN_SCRIPT_URL` nel `.env` del server.)
- **Vedere gli errori**: nell'editor di Apps Script, **Esecuzioni** (icona a sinistra) elenca ogni chiamata con l'esito.
