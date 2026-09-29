# GIRO FRAME — installazione passo per passo

## 1. Cosa ti serve

- Account Google con accesso a Fogli, Drive e Apps Script. Il proprietario deve poter pubblicare una web app per “Chiunque” e condividere singoli file con “Chiunque abbia il link”. Se l’account aziendale impedisce queste opzioni, serve l’intervento dell’amministratore.
- Account GitHub e un repository dedicato, chiamato ad esempio `giro-frame`.
- iPad con Safari aggiornato, DNP con carta e ribbon corretti, modello WCM compatibile e connessione Internet nella postazione.
- Cornice PNG trasparente e logo PNG trasparente del cliente. I file dimostrativi inclusi permettono le prime prove.

Il codice è completo ma il link pubblico effettivo nascerà dopo la pubblicazione nei tuoi account. Nessun account, repository o deployment viene creato automaticamente da questo archivio.

## 2. Crea il Google Sheet e il backend

1. Apri [Google Sheets](https://sheets.google.com) e crea un foglio vuoto chiamato **GIRO FRAME – Configurazione**. Tienilo privato, condiviso solo con chi gestisce l’evento.
2. Nel foglio scegli **Estensioni → Apps Script**. Si apre il progetto collegato al foglio.
3. Rinomina il progetto **GIRO FRAME Backend**.
4. Apri `apps-script/Code.gs` di questo pacchetto in un editor di testo. Copia tutto il contenuto e sostituisci quello del file `Code.gs` del progetto Google.
5. Nel progetto premi **+ → HTML**, chiamalo esattamente **Bridge**. Sostituisci il contenuto con `apps-script/Bridge.html`. Google aggiunge `.html` automaticamente.
6. Apri **Impostazioni progetto** (ingranaggio) e abilita la visualizzazione del file manifest `appsscript.json` nell’editor.
7. Torna nell’editor e sostituisci il contenuto di `appsscript.json` con quello incluso in `apps-script/appsscript.json`.
8. Salva. Nella selezione delle funzioni scegli **setup_** e premi **Esegui**. Autorizza l’accesso richiesto per il progetto che stai creando. Se Google o la tua organizzazione blocca l’autorizzazione, risolvi con l’amministratore prima di procedere.
9. Attendi il completamento, quindi torna al foglio e ricaricalo. Troverai le schede **Config**, **Photos** e il menu **GIRO FRAME**. Il foglio iniziale vuoto può restare.
10. In Google Drive troverai la cartella privata **GIRO FRAME — Foto**. Non renderla pubblica: il backend condividerà soltanto i singoli JPEG.

`setup_` si può eseguire nuovamente: conserva fogli e password già presenti. Non cancellare le proprietà del progetto né cambiare `PEPPER`: serve a verificare le password già memorizzate.

## 3. Imposta l’origine del sito

Prima scegli il nome dell’account e del repository GitHub. Esempio illustrativo:

- account: `mioaccount`
- repository: `giro-frame`
- futuro link app: `https://mioaccount.github.io/giro-frame/`
- origine da autorizzare: `https://mioaccount.github.io`

In Apps Script apri **Impostazioni progetto → Proprietà script → Aggiungi proprietà script**:

| Proprietà | Valore |
|---|---|
| `APP_ORIGIN` | `https://mioaccount.github.io`, sostituendo l’account reale; senza slash finale e senza `/giro-frame` |

Le proprietà `SPREADSHEET_ID`, `PHOTO_FOLDER_ID`, `PEPPER` e `MAX_PHOTOS` sono già state create da `setup_`. Non copiarle nel frontend. `MAX_PHOTOS` vale inizialmente 2000 e conta anche le righe scadute del registro; si può aumentare consapevolmente dal backend.

Per un dominio personalizzato, usa la sua origine HTTPS esatta. Dedica l’origine a contenuti fidati: tutte le pagine dello stesso dominio condividono il confine di sicurezza del browser.

## 4. Pubblica Apps Script

1. In alto a destra scegli **Esegui deployment → Nuovo deployment**.
2. Seleziona il tipo **App web**.
3. Descrizione: `GIRO FRAME v1`.
4. **Esegui come:** te stesso, proprietario del progetto.
5. **Chi ha accesso:** **Chiunque**, compresi gli utenti non autenticati. Non scegliere “Solo io” o “Chiunque con un account Google”.
6. Pubblica e copia l’**URL dell’app web**, che termina con `/exec`.
7. Non usare il link `/dev`: è destinato alle prove degli editor del progetto.

L’accesso pubblico al deployment consente il collegamento del sito. Le operazioni di caricamento e modifica restano protette dalla password verificata dal server. I visitatori senza password non possono caricare foto.

Aprendo direttamente il link `/exec` è normale leggere “apri l’app dal link GitHub Pages”: questo deployment fa da collegamento al sito, non è l’interfaccia per la hostess.

Se successivamente cambi `Code.gs` o `Bridge.html`, salva e vai su **Gestisci deployment → Modifica → Nuova versione → Esegui deployment**. Aggiorna il deployment esistente per conservare lo stesso URL. Le modifiche ai valori del Sheet non richiedono una nuova versione.

## 5. Collega il frontend

Apri `docs/config.js`. Sostituisci soltanto il testo `INCOLLA_QUI_URL_APPS_SCRIPT_EXEC`, mantenendo le virgolette, con il link `/exec` ottenuto prima. Lascia `demo: false`.

Esempio di struttura, da completare con il tuo deployment:

```js
window.GIRO_BOOT = Object.freeze({
  backendUrl: 'https://script.google.com/macros/s/IL_TUO_DEPLOYMENT/exec',
  demo: false
});
```

L’URL del deployment è pubblico e può stare nel codice. Password, token Google, proprietà script e contenuto privato dello Sheet non devono essere caricati su GitHub. Per accedere alla postazione si inserisce la password nell’app: non si modifica il codice per aggiungerla.

## 6. Pubblica su GitHub Pages, senza comandi

1. Apri [GitHub](https://github.com), accedi e crea un repository **Public** chiamato `giro-frame`. Con GitHub Free la pubblicazione Pages richiede normalmente un repository pubblico.
2. Se richiesto, aggiungi un README iniziale.
3. Nel repository scegli **Add file → Upload files**.
4. Trascina il **contenuto** della cartella `giro-frame` del pacchetto: `docs`, `apps-script`, `guide`, `tests`, `README.md` e `package.json`. Non caricare solo il file ZIP e non aggiungere un livello di cartella esterno.
5. Conferma con **Commit changes**.
6. Controlla che nella pagina del repository si veda la cartella `docs` e che dentro ci sia `index.html`.
7. Vai in **Settings → Pages**.
8. In **Build and deployment**, scegli **Deploy from a branch**.
9. Branch **main**, cartella **/docs**, poi **Save**.
10. Attendi la pubblicazione e usa il link mostrato da GitHub, normalmente `https://ACCOUNT.github.io/giro-frame/`.

Se il file nascosto `.nojekyll` non è stato trascinato, aggiungilo direttamente su GitHub con **Add file → Create new file**, nome `docs/.nojekyll`, contenuto vuoto. Il sito non richiede Jekyll o un processo di compilazione.

GitHub documenta la pubblicazione da `/docs` e indica che gli aggiornamenti possono richiedere alcuni minuti. [Guida ufficiale GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site).

## 7. Prima apertura e password

1. Apri il link pubblico in Safari sull’iPad, inizialmente con Internet funzionante.
2. Verifica che non compaia il banner DEMO. Se c’è, rimuovi `?demo=1` dal link e controlla `demo: false` in `config.js`.
3. Tocca **Impostazioni** e inserisci la password iniziale **2006**.
4. Inserisci subito una nuova password di almeno 8 caratteri e premi **SALVA IMPOSTAZIONI**. La password iniziale è conosciuta e non va usata per un evento pubblico.
5. Tocca **Attiva postazione** e inserisci la nuova password. La sessione di caricamento dura fino a 6 ore; Google può eliminare prima una sessione dalla cache. In tal caso basta accedere di nuovo.
6. L’accesso a Impostazioni richiede sempre la password; il semplice token della postazione non consente di modificare la configurazione.

L’app ricontrolla il foglio prima di iniziare ogni nuovo scatto online e quando apri Impostazioni. Durante uno scatto conserva la grafica selezionata all’inizio, evitando cambi a metà del flusso.

## 8. Cornice e logo del cliente

Prepara:

- **Cornice:** PNG RGBA trasparente, **1200 × 1800 pixel**, verticale. L’area del volto deve essere trasparente; un rettangolo bianco non è trasparenza.
- **Logo:** PNG trasparente. Viene ridimensionato mantenendo le proporzioni in uno spazio massimo di **960 × 140 pixel**.
- La fascia inferiore della composizione è bianca, da `y=1600` a `y=1800`. La cornice si sovrappone alla foto e alla fascia, poi viene applicato il logo centrato. Per una fascia trasparente o dimensioni diverse occorre modificare il layout in `docs/core.js`.
- Tieni testi e loghi importanti lontano dal bordo: margine consigliato almeno 60 pixel, da verificare sul ritaglio reale della DNP.

Percorso più semplice:

1. Carica `cornice-cliente.png` e `logo-cliente.png` nella cartella **docs/assets** del repository.
2. Attendi l’aggiornamento di Pages.
3. Apri i link diretti in una nuova scheda: `https://ACCOUNT.github.io/giro-frame/assets/cornice-cliente.png` e `…/logo-cliente.png`.
4. Copia questi URL in **Impostazioni → URL cornice / URL logo**, poi salva.
5. Fai una foto di prova. Se lasci un URL vuoto, l’app usa la grafica dimostrativa inclusa.

I link devono restituire direttamente un’immagine pubblica in HTTPS, con CORS che ne consenta l’uso nel canvas. I link “Condividi” di Google Drive e le pagine GitHub `/blob/…` non sono URL immagine adatti. Le immagini sullo stesso sito Pages evitano il problema CORS.

Per sostituire un’immagine, usa un nome nuovo o aggiungi `?v=2` all’URL. L’app conserva una copia locale per funzionare durante un’interruzione della rete; non ricarica continuamente un’immagine con lo stesso URL.

## 9. Modifiche dal Google Sheet

Nel foglio **Config** cambia solo la colonna **value** delle righe consentite. Non rinominare le chiavi.

| key | Cosa modificare |
|---|---|
| `title` | Titolo dell’app, massimo 80 caratteri |
| `subtitle` | Sottotitolo, massimo 200 caratteri |
| `frameUrl` | Link diretto HTTPS della cornice; vuoto usa demo |
| `logoUrl` | Link diretto HTTPS del logo; vuoto usa demo |
| `password_new` | Scrivi qui la nuova password, da 8 a 128 caratteri |
| `password_hash` | Campo gestito dal server, non modificare |
| `retentionDays` | Conservazione online in giorni, da 1 a 365; default 7 |

Per cambiare password dal foglio: inseriscila in `password_new`, poi scegli **GIRO FRAME → Applica modifiche / nuova password**. Il campo viene svuotato e viene salvato il verificatore crittografico in `password_hash`. Anche la prima richiesta successiva all’API applica una password in attesa. La modifica invalida tutte le sessioni già attive.

La password digitata nel foglio può rimanere nella cronologia versioni di Google: consenti accesso al Sheet solo a gestori fidati. Per evitare questo passaggio, usa il menu Impostazioni nell’app.

Le impostazioni salvate dall’app scrivono nello stesso foglio. Se qualcuno ha cambiato i valori dopo l’apertura del menu, il server rifiuta il salvataggio vecchio: chiudi e riapri Impostazioni. Evita comunque modifiche simultanee dal foglio durante un salvataggio dell’app: l’interfaccia di Sheets non partecipa al blocco transazionale di Apps Script.

## 10. Registro foto e conservazione

Il foglio **Photos** si compila automaticamente:

| Colonna | Significato |
|---|---|
| `id` | Identificativo casuale della foto; riutilizzato per i retry |
| `createdAt` | Data e ora UTC del primo salvataggio |
| `fileId` | Identificativo Drive |
| `url` | Link pubblico alla pagina della singola foto |
| `downloadUrl` | Link diretto al download, soggetto alle regole di Drive |
| `configVersion` | Impronta della configurazione usata per la foto |
| `status` | `pending`, `ready` oppure `deleted` |
| `sha256` | Impronta del JPEG per impedire un riuso incoerente dell’ID |
| `consentAt` | Ora della conferma hostess registrata dal server |

Non eliminare o riordinare manualmente le righe mentre l’app è in uso. I retry con lo stesso ID riprendono il file esistente; non creano una nuova copia a ogni tentativo. Se la condivisione di Drive fallisce, il file rimane `pending` e l’app non mostra un QR falso.

**Attiva la pulizia:** dal menu del foglio scegli **GIRO FRAME → Installa pulizia giornaliera** e autorizza se richiesto. Controlla in Apps Script → Trigger che esista `cleanup_`. La pulizia revoca l’accesso pubblico e sposta i file scaduti nel cestino; non svuota il cestino. Elabora al massimo 100 file al giorno: per 500 foto scadute occorrono fino a 5 esecuzioni. Se vuoi applicare la scadenza a tutti subito, esegui più volte **Esegui pulizia foto scadute** fino al completamento. Il foglio mantiene il registro tecnico.

Dopo la scadenza il QR non dà più accesso. Puoi anche revocare subito un singolo link da Drive → Condividi → Accesso limitato e spostare il file nel cestino; segna `deleted` nella riga corrispondente per impedire che un retry lo ripubblichi.

I link sono accessibili a chi li possiede e possono essere inoltrati. Non esiste una galleria pubblica nell’app, ma un QR non è un controllo d’identità. Prima dell’evento prepara l’informativa del cliente e concorda durata e modalità di condivisione. La casella nell’app registra l’operazione hostess, non sostituisce la documentazione dell’evento.

## 11. Uso quotidiano per la hostess

1. Apri il link in **Safari**, attiva la postazione e verifica che Internet e stampa siano disponibili.
2. Informa l’ospite e spunta la conferma prevista dal cliente.
3. Tocca **SCATTA LA TUA FOTO**. Consenti la fotocamera se Safari lo chiede.
4. Usa **Cambia fotocamera** se necessario. Inquadra al centro, lasciando spazio per cornice e fascia inferiore.
5. Tocca **SCATTA FOTO**. Se il browser non può aprire la fotocamera, usa **Usa fotocamera di iPad** e scegli lo scatto nativo.
6. Mostra l’anteprima all’ospite: **RIFAI** riparte, **CONTINUA** crea la foto con grafica.
7. La foto viene prima conservata sull’iPad, poi caricata su Drive. Puoi premere **STAMPA FOTO** senza attendere il QR.
8. Nel pannello AirPrint seleziona la DNP, formato 4 × 6, una copia, e conferma. La disponibilità delle opzioni dipende dal WCM.
9. Mostra il QR quando appare. L’ospite apre la foto sul suo telefono e usa il comando download di Drive. Su iPhone può essere necessario aprire il file scaricato e scegliere Condividi → Salva immagine.
10. Premi **NUOVO OSPITE**.

Il pulsante “Salva copia sull’iPad” è anche il piano B per WCM Print. Il salvataggio in File/Foto può richiedere un’ulteriore conferma di Safari.

## 12. Se Internet si interrompe

La stampa locale e la composizione possono continuare con grafica già caricata. La foto finale viene conservata in IndexedDB sull’iPad. Il QR compare solo dopo un salvataggio remoto riuscito: senza Internet non si può promettere il download sul telefono dell’ospite.

L’interfaccia è memorizzata da un service worker dopo la prima apertura riuscita. Il primo accesso, l’attivazione di una nuova postazione e il caricamento di nuove grafiche richiedono Internet. Il badge “Rete disponibile” indica lo stato del browser, non garantisce che Google sia raggiungibile. Il collegamento può impiegare fino a circa 25 secondi e una richiesta fino a 90 secondi prima di segnalare l’assenza di risposta.

In **Foto da recuperare** trovi le prime 24 foto in attesa, dalle più vecchie, e fino a 12 copie già online. Apri una foto e premi **Riprova salvataggio**; dopo il caricamento torna al pannello per le altre. Non c’è caricamento garantito in background: Safari può sospendere la pagina quando spegni lo schermo o cambi app.

Le copie già online vengono rimosse localmente dopo 24 ore o quando superano il limite di 12, alla successiva lettura della lista. Le foto ancora da caricare non vengono cancellate automaticamente. Per eliminarle serve **Rimuovi** e una conferma esplicita.

Non usare navigazione privata, non cancellare dati del sito e non cambiare dominio mentre ci sono foto in attesa. iPadOS può comunque liberare memoria del browser: la coda è una protezione di emergenza, non un backup permanente. Salva copie importanti anche in File. Non garantire 500 foto offline senza verificare spazio e stabilità sul tuo iPad.

## 13. Quando qualcosa non funziona

| Problema | Controllo / soluzione |
|---|---|
| Configurazione iniziale necessaria | Sostituisci il segnaposto in `docs/config.js` e attendi Pages |
| Backend non raggiungibile | `/exec` corretto, deployment “Chiunque”, `APP_ORIGIN` esatto, Internet; controlla anche le Esecuzioni in Apps Script |
| Accesso Google richiesto continuamente | Controlla che il deployment sia anonimo ed eseguito come proprietario; prova Safari senza sessioni Google multiple; non disattivare globalmente protezioni del browser per aggirare un deployment errato |
| Sessione scaduta | Attiva nuovamente la postazione; le foto in attesa restano locali |
| Troppi tentativi | Attendi 15 minuti; il gestore può eliminare solo la proprietà `LOGIN_RATE` da Apps Script se sta risolvendo un errore legittimo |
| Cornice non caricabile | URL diretto HTTPS, file trasparente corretto, CORS e dimensioni; usa Pages |
| Foto salvata ma nessun QR | Internet, permessi di condivisione Drive, quota/spazio; premi Riprova |
| QR chiede accesso | Prova il link da un telefono non autenticato; verifica condivisione file e policy dell’account |
| Memoria locale piena | Scarica copie, carica le foto in attesa, rimuovi soltanto le copie recuperate; non cancellare tutti i dati del browser |
| Pulsante stampa non apre il pannello | Usa Safari completo; in alternativa scarica il JPEG e usa il portale WCM Print |
| Impostazioni modificate nel frattempo | Chiudi e riapri il menu; confronta il foglio prima di risalvare |
| Nuova grafica non compare | Cambia nome file o aggiungi `?v=2`; avvia un nuovo scatto |

Per la rete della stampante leggi [RETE-E-STAMPA.md](RETE-E-STAMPA.md). Prima degli ospiti completa [COLLAUDO.md](COLLAUDO.md).

Documentazione di riferimento: [deployment web app Google](https://developers.google.com/apps-script/guides/web), [comunicazione HTML Service](https://developers.google.com/apps-script/guides/html/communication), [quote Apps Script](https://developers.google.com/apps-script/guides/services/quotas). I servizi hanno limiti e disponibilità dipendenti dall’account: per 500 ospiti fai una prova di carico reale sul deployment e controlla spazio Drive, tempi di upload e numero di stampe richieste.
