# GIRO FRAME

Web app per una foto singola verticale da iPad, cornice e logo personalizzati, stampa DNP attraverso AirPrint e QR per scaricare la foto.

**Parti da [GUIDA-INSTALLAZIONE.md](guide/GUIDA-INSTALLAZIONE.md).** Non occorre compilare il frontend né installare programmi per pubblicarlo. Il pacchetto è pronto da configurare; account Google/GitHub, pubblicazione e collaudo della stampante restano a carico del gestore.

- `docs/`: sito statico per GitHub Pages, senza password o chiavi incorporate.
- `apps-script/`: backend da incollare in Apps Script collegato a un Google Sheet.
- `guide/`: installazione, configurazione della rete, uso hostess e prove prima dell’evento.
- `tests/`: test automatici del backend con servizi Google simulati e del ritaglio.

La password iniziale **2006** viene creata esclusivamente dal backend. Cambiala prima di usare l’app con ospiti. La stessa password attiva la postazione; Impostazioni richiede un nuovo accesso con autorizzazione amministratore. I token vengono rilasciati dal server a runtime, mai inclusi nei file distribuiti.

**Stampa:** STAMPA FOTO apre il pannello del sistema; l’hostess seleziona la DNP e conferma. Il sito non legge lo stato della stampante e non può dichiarare la stampa completata. Durante il pannello iOS il QR può essere coperto; ricompare chiudendo/confermando il pannello. Per QR immediati l’iPad deve raggiungere anche Internet mentre è collegato alla rete di stampa.

**Demo:** dopo aver servito `docs/` via HTTP locale oppure HTTPS, aggiungi `?demo=1` al link. La demo non invia foto e non genera falsi link pubblici. Non aprire `index.html` con un doppio clic: i moduli JavaScript e la fotocamera richiedono un sito web.

Per sviluppatori: `npm test`; anteprima locale con `npm run serve`, poi `http://localhost:8080/?demo=1`. Node 18+ e Python 3 richiesti solo per questi comandi. Nessuna dipendenza npm richiesta in produzione.

Formato predefinito: **1200 × 1800 px**, verticale 2:3, stampa **4 × 6 pollici** (circa 10 × 15 cm). Grafiche incluse dimostrative; sostituirle con i materiali autorizzati dal cliente. Non è un progetto ufficiale RCS/Giro d’Italia e non contiene marchi ufficiali.
