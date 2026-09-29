# Collegamento iPad → WCM → DNP

## Configurazione consigliata

```text
Internet dell’evento / router 4G–5G
                │
       collegamento di rete
                │
             WCM Plus ─── USB ─── DNP
                │
          hotspot Wi-Fi WCM
                │
              iPad
       Safari / GIRO FRAME
                │
       Internet attraverso WCM
                │
    GitHub Pages + Google Apps Script
                │
       Drive: JPEG pubblico → QR
```

DNP documenta per **WCM Plus** l’accesso Internet attraverso una rete Wi-Fi a monte e la disponibilità AirPrint. Nel pannello **Network Settings → Wi-Fi Connection** si sceglie la rete e si usa **Join**. Il manuale esclude le reti con pagina di accettazione/captive portal. Prevede anche configurazioni Ethernet. [Manuale ufficiale WCM Plus v5.6, pp. 3 e 12](https://new.dnpphoto.com/Portals/0/Resources/WCM_Plus_User_Guide.pdf).

Procedura per questa postazione:

1. Leggi modello esatto della DNP, modello WCM e versione firmware. Non assumere che un semplice adattatore Wi-Fi equivalga a WCM Plus.
2. Collega DNP al WCM con USB, carica i consumabili e accendi entrambi.
3. Collega l’iPad alla rete indicata dal WCM; apri il suo pannello usando l’indirizzo indicato nella pagina di avvio/manuale del dispositivo.
4. Configura dal WCM una connessione verso un router con Internet. Un router dedicato all’evento rende la rete più controllabile; usa una rete senza pagina di login.
5. Mantenendo l’iPad sul Wi-Fi WCM, apri il sito GIRO FRAME e verifica un caricamento Google effettivo.
6. Verifica che AirPrint mostri la DNP e che una foto venga realmente stampata.
7. Da un telefono in rete cellulare apri il QR: prova così che il link è raggiungibile anche fuori dalla rete di stampa.

Possibile alternativa: iPad e WCM sulla stessa LAN del router con Internet, se supportata dal modello. Evita isolamento dei client e reti ospiti che impediscono la scoperta locale della stampante. Apple richiede che dispositivo e stampante siano sulla stessa rete Wi-Fi per il normale flusso AirPrint. [Istruzioni Apple](https://support.apple.com/it-it/109349).

**WCM1/WCM2/altri modelli:** le funzioni di rete e i menu possono differire. Va verificata la combinazione acquistata; il progetto non presume un indirizzo IP, un’API DNP o un firmware specifico.

## Cosa fa STAMPA FOTO

Il JPEG composto è già pronto in pagina. Il pulsante chiama il comando di stampa del browser; un foglio di stile mostra solo la foto a 4 × 6 pollici, senza pulsanti, cornici dell’interfaccia o QR. Il browser apre il pannello di stampa. [Comportamento `window.print()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/print).

L’hostess sceglie la DNP e conferma. La web app non può scegliere silenziosamente una stampante, leggere l’esito fisico o distinguere con certezza una stampa da un annullamento. Per questo il registro non contiene falsi contatori “stampato”. Il caricamento remoto parte separatamente, al termine della composizione; il pannello iOS può coprire il QR e sospendere temporaneamente la pagina.

Il formato CSS è una richiesta: iOS e il driver possono applicare scala, margini e ritaglio. Controlla nel WCM media 4 × 6, orientamento verticale, una copia, bordi e impostazione fit/fill. Disattiva eventuali cornici automatiche del WCM: sono già incorporate nel JPEG. Solo una prova su carta stabilisce l’allineamento finale.

## Piano B: WCM Print

Il manuale DNP segnala possibili stampe bianche da dispositivi Apple e problemi di bordi con immagini HEIC; suggerisce WCM Print come alternativa. Qui la composizione esporta sempre un JPEG, ma il collaudo resta necessario. DNP offre anche API, la cui documentazione va richiesta al produttore. [Manuale, pp. 29–30](https://new.dnpphoto.com/Portals/0/Resources/WCM_Plus_User_Guide.pdf).

Se AirPrint non funziona con l’hardware acquistato:

1. Premi **Salva copia sull’iPad** e salva il JPEG in File.
2. Apri il portale locale **WCM Print** in un’altra scheda, dall’indirizzo del tuo dispositivo.
3. Seleziona quel JPEG, formato 4 × 6, controlla l’anteprima e stampa.
4. Torna a GIRO FRAME per mostrare il QR.

Il frontend HTTPS non invia richieste dirette a un indirizzo HTTP della LAN: non sono state inventate API WCM e non dipende dall’aggiramento di CORS o delle protezioni per reti private. Per una futura stampa a un solo tocco senza pannello servirebbe una diversa integrazione, per esempio un agente locale o un’app nativa con API ufficiali DNP e gestione autenticata dei lavori.

## Cosa significa “funziona da remoto”

| Situazione | Scatto/composizione | Salvataggio e QR | DNP dell’evento |
|---|---|---|---|
| iPad su rete WCM con Internet | Sì | Sì | Sì, tramite AirPrint e conferma |
| iPad su WCM senza Internet, già avviato e attivato | Sì, con grafica locale | In attesa; nessun nuovo QR pubblico | Possibile stampa locale |
| Prima apertura senza Internet | Non garantita | No | Non risolve la configurazione dell’app |
| iPad lontano dall’evento con Internet | Sì, dopo accesso postazione | Sì | No: la DNP locale non è raggiungibile via AirPrint |
| Telefono ospite con Internet, fuori dalla rete WCM | Non necessario | Apre il link del QR | Non necessario |

Non affidarti automaticamente alla connessione cellulare dell’iPad mentre è su un Wi-Fi senza Internet: instradamento e comportamento dipendono dalla configurazione. L’architettura prevista fornisce Internet dalla rete di stampa stessa. Un QR a un indirizzo privato del WCM non sostituirebbe il download pubblico richiesto.
