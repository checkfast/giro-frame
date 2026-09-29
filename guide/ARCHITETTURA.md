# Note tecniche e personalizzazione

## Componenti

Il frontend HTML/CSS/JavaScript vive in `docs/`, pubblicabile da GitHub Pages. Nessun servizio AI, nessuna elaborazione remota del volto. La cattura avviene con `getUserMedia` o file input `capture=environment`; canvas ritaglia centralmente a 2:3, sovrappone cornice e logo e produce JPEG 1200 × 1800.

`core.js` contiene dimensioni, ritaglio, composizione e QR; `app.js` gestisce il flusso e l’accesso; `storage.js` gestisce IndexedDB; `bridge.js` gestisce il canale Google; `sw.js` conserva solo l’interfaccia. Il QR è generato localmente con `vendor/qrcode.js` (MIT): nessun servizio esterno riceve il link per trasformarlo in QR.

L’immagine finale è identica per anteprima, stampa e upload. La stampa è indipendente dal caricamento, evitando che Internet blocchi una stampante raggiungibile localmente. Le foto originali non vengono inviate: solo il JPEG composto e metadati minimi. Il consenso in attesa è confermato nel flusso e inviato al caricamento; il timestamp nel Sheet è quello del server, non una prova dell’ora esatta dello scatto.

## Collegamento GitHub Pages / Apps Script

Si usa un iframe HTML Service, non un `fetch` con `no-cors` di cui non si possa leggere la risposta. Il backend inserisce in `Bridge.html` l’origine autorizzata e un identificativo casuale di canale. Il bridge comunica con la pagina principale tramite `postMessage`, controllando origine, finestra sorgente, tipo, ID e canale. La pagina principale accetta il handshake dal dominio Googleusercontent e poi fissa la finestra e l’origine del mittente per le risposte. L’HTML Service esegue `google.script.run.api(...)` e ritorna risultati o errori.

Il canale è monouso per l’istanza di collegamento, non è una credenziale. Le funzioni sensibili finiscono con `_` e non sono esposte a `google.script.run`; `api` applica autorizzazioni lato server a ogni operazione. `doGet` e `onOpen` sono i punti di ingresso di Google. L’allowlist di origine riduce comunicazioni errate, ma non sostituisce autenticazione: un client arbitrario non è considerato fidato solo perché conosce l’URL.

È necessario verificare il bridge nel deployment reale anonimo, con Safari e con le policy del proprio account Google. Un test con i servizi Google simulati non dimostra che le policy di embedding del proprio account siano compatibili.

## Configurazione e autenticazione

Config è la sorgente persistente; non c’è una seconda copia autorevole nelle proprietà script. Il frontend conserva un’ultima configurazione solo per emergenza offline. Il versionamento deriva dal contenuto e dal verificatore della password, rilevando anche modifiche manuali nel Sheet senza affidarsi a un trigger onEdit. I salvataggi hanno confronto di versione e ScriptLock. L’editor umano di Sheets non acquisisce quel lock: evitare modifiche contemporanee nel breve intervallo di scrittura.

La password è verificata mediante HMAC-SHA256 con sale casuale e un `PEPPER` privato nelle Script Properties. Il Sheet conserva il verificatore. Questo schema non è una password KDF per un servizio ad alta sicurezza; è accompagnato da limitazione server dei tentativi e richiede una password forte al posto del default noto. Dieci tentativi errati bloccano gli accessi per 15 minuti; il limite è globale perché Apps Script non espone un IP client fidato. Ciò può provocare indisponibilità intenzionale degli accessi: non è una piattaforma resistente a grandi attacchi pubblici.

Le sessioni sono casuali, memorizzate in ScriptCache sotto la loro impronta, valide al massimo sei ore e revocate implicitamente dal cambio password. La sessione postazione sta in `sessionStorage`; quella amministrativa solo in memoria e viene eliminata chiudendo il menu. Non ci sono password nei sorgenti frontend o nei link. La password iniziale richiesta è impostata solo durante il setup del backend; va cambiata prima dell’esercizio.

Il menu Impostazioni aggiorna titolo, sottotitolo, URL cornice/logo e password. Solo il gestore del Sheet può cambiare conservazione e proprietà server. Le grafiche sono scaricate dal browser con CORS, non da un proxy server arbitrario.

## Salvataggio e retry

Prima di mostrare il risultato si scrive il JPEG in IndexedDB. Ogni foto ha un UUID che resta uguale attraverso timeout e tentativi ripetuti. L’API serializza gli upload, valida dimensioni, firma JPEG, consenso, dimensione massima e versione della grafica; crea un file e una riga `pending`, poi abilita la condivisione e passa a `ready`. Una seconda richiesta con stesso ID e contenuto restituisce lo stesso risultato. Stesso ID con altro contenuto viene respinto.

L’operazione Drive + Sheet non è una transazione distribuita: un arresto forzato nel brevissimo intervallo fra creazione file e riga può lasciare un file orfano nella cartella. Gli errori normali di scrittura causano la messa nel cestino del file appena creato. Controllare periodicamente la cartella confrontandola con il registro se si interrompono esecuzioni server. Non dichiarare semantica “exactly once” in qualsiasi scenario di crash.

Il link QR apre la pagina Drive della singola foto, includendo l’eventuale resource key. Il registro conserva anche il link di download. Drive può mostrare un’anteprima o una conferma di download, applicare limiti o essere soggetto alle policy aziendali: la scansione del QR non implica salvataggio automatico nel rullino.

Il service worker non intercetta Google né memorizza le foto. La coda locale è letta con cursore, evitando di caricare in memoria l’intero evento. Non c’è background sync garantito su iPad: retry espliciti dalla lista. Nessun nuovo QR prima della conferma del backend.

## Personalizzazioni frequenti

- Colori e spaziatura: variabili in `docs/style.css`.
- Logo della testata: markup in `docs/index.html`; il logo configurato dal Sheet appartiene alla foto finale.
- Formato stampa diverso: aggiornare insieme `WIDTH`, `HEIGHT`, `FOOTER` in `core.js`, rapporti CSS, `@page`, `#print-sheet`, `#print-image`, validazione dimensioni in `Code.gs`, grafiche e test. Non basta cambiare la carta nel WCM.
- Crop: attualmente centrale e senza specchio; non ci sono trascinamento o zoom. La hostess compone prima dello scatto e può rifarlo.
- Asset aggiornati: usare nome/versione URL nuovi. Dopo modifiche al codice aumentare il nome cache in `sw.js` e riaprire Safari a connessione disponibile. Per un aggiornamento importante attendere di aver caricato tutte le foto locali.

## Limiti operativi

Un account Apps Script/Drive ha quote e limiti di esecuzione. Gli upload sono serializzati per affidabilità su una singola postazione, non progettati per molte decine di iPad concorrenti. Nessun controllo remoto della coda DNP, nessuna conferma di consegna stampa, nessun SLA o recupero garantito se iPadOS cancella i dati del sito. Per 500 ospiti collaudare banda, capienza Drive, tempi reali e consumabili, oltre al solo funzionamento del codice.
