# Collaudo prima dell’evento

Compilare con data, nome operatore, modello iPad/iPadOS/Safari, DNP, WCM, firmware e rete usata. Questa checklist richiede l’hardware effettivo.

## Pubblicazione e permessi

- [ ] Il link Pages si apre da un telefono in rete cellulare.
- [ ] Il backend `/exec` è quello di produzione, eseguito dal proprietario e accessibile anonimamente.
- [ ] Il sito carica configurazione e immagini; non c’è banner DEMO.
- [ ] Password iniziale cambiata; Sheet e cartella Drive non sono pubblici.
- [ ] Accesso con password errata respinto.
- [ ] Attivazione postazione e apertura Impostazioni funzionano in Safari.

## Configurazione

- [ ] Modifica URL cornice/logo dall’app: i valori cambiano nel Sheet.
- [ ] Modifica i valori dal Sheet: il nuovo scatto li usa.
- [ ] Apri Impostazioni, modifica titolo dal Sheet, poi prova a salvare il vecchio modulo: compare il conflitto.
- [ ] Cambia password dall’app e dal Sheet, una volta per canale; verifica che le vecchie sessioni non carichino più e che sia possibile riattivarle.
- [ ] Un URL non valido segnala errore senza produrre una foto senza grafica per errore.

## Foto, QR e rete

- [ ] Fotocamera anteriore/posteriore, RIFAI e CONTINUA funzionano.
- [ ] Scatto nativo alternativo funziona; foto verticale e orizzontale si orientano correttamente sul proprio iPad.
- [ ] Foto finale 1200 × 1800, viso non coperto, cornice trasparente, logo leggibile.
- [ ] QR apre la foto da un telefono senza login Google e senza Wi-Fi WCM.
- [ ] Il comando download permette di salvare il JPEG sul telefono.
- [ ] Interrompi Internet dopo aver caricato grafica e attivato la postazione: crea una foto e verifica che resti nella lista senza QR inventato.
- [ ] Ricarica la pagina offline: verifica interfaccia e recupero locale sul dispositivo reale.
- [ ] Ripristina Internet, apri la foto, riprova upload: una sola riga/file e QR corretto.
- [ ] Chiudi e riapri Safari: la foto in attesa è ancora presente; riattiva la postazione se necessario.
- [ ] Blocca postazione: i successivi upload richiedono nuovamente accesso.

## Stampa e carico

- [ ] L’iPad resta sulla rete di stampa e nello stesso momento un caricamento Drive riesce.
- [ ] Il pulsante apre AirPrint; DNP corretta, una copia, carta 4 × 6.
- [ ] Nessuna pagina extra, testi dell’app o QR sul foglio stampato.
- [ ] Logo non tagliato, bordi e orientamento corretti, colori accettabili.
- [ ] Annulla una stampa: nessuna falsa conferma “stampato” nell’app.
- [ ] Prova e prepara la procedura alternativa WCM Print con JPEG salvato.
- [ ] Esegui almeno 30 cicli consecutivi e misura tempi di scatto, upload e stampa; proietta sul flusso atteso dei 500 invitati.
- [ ] Verifica consumabili, alimentazione continua, spazio iPad e Drive, router di riserva e contatto del referente stampa.
- [ ] Dopo il test verifica tutte le righe `pending` e le esecuzioni fallite in Apps Script.

## Conservazione

- [ ] Trigger `cleanup_` installato e prima esecuzione controllata.
- [ ] Con una foto di prova scaduta, verifica che la pulizia revochi il link e la sposti nel cestino.
- [ ] Pianifica più esecuzioni se oltre 100 foto scadono insieme.
- [ ] Informativa e durata di accesso concordate con il cliente.

## Verifiche effettuate sul pacchetto

I test Node inclusi verificano con servizi Google simulati: configurazione senza credenziali pubbliche, ruoli, rifiuto accessi non autenticati, conflitti dopo modifica Sheet, cambio password e revoca sessioni, limitazione tentativi, idempotenza upload, recupero dopo errore di condivisione, validazione JPEG/consenso/dimensioni, pulizia e setup ripetibile. Verificano inoltre il ritaglio centrale 2:3.

Questi test non sostituiscono la prova di deployment reale Apps Script, autenticazione anonima Google, fotocamera Safari o DNP/AirPrint. Il progetto non è stato pubblicato nei tuoi account e non è stato provato sulla tua stampante.

Esito preparazione del pacchetto (29 settembre 2026): **13 test Node superati**. Verificato nel browser locale in modalità demo: importazione di un’immagine sintetica, anteprima, composizione JPEG 1200 × 1800, assenza di QR pubblico nella demo, riapertura della foto da IndexedDB dopo ricaricamento. La matrice QR è stata decodificata separatamente con jsQR per verificarne il contenuto. Le verifiche della fotocamera reale e del pannello di stampa non sono state eseguite su iPad.
