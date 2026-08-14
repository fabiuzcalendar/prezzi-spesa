const DB_NAME = "PrezziSpesaDB";
const DB_VERSION = 1;

const ARCHIVI = [
  "puntiVendita",
  "prodotti",
  "rilevazioniPrezzi",
  "listaSpesa"
];

let dbPromise = null;

function openDatabase() {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = event => {
      const db = event.target.result;

      ARCHIVI.forEach(nomeArchivio => {
        if (!db.objectStoreNames.contains(nomeArchivio)) {
          db.createObjectStore(nomeArchivio, {
            keyPath: "id",
            autoIncrement: true
          });
        }
      });
    };

    request.onsuccess = () => {
      const db = request.result;

      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };

      resolve(db);
    };

    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };

    request.onblocked = () => {
      console.warn("Apertura database bloccata da un'altra scheda.");
    };
  });

  return dbPromise;
}

async function eseguiRichiesta(archivio, modalita, operazione) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(archivio, modalita);
    const store = transaction.objectStore(archivio);
    let request;
    let risultato;

    try {
      request = operazione(store);
    } catch (error) {
      reject(error);
      return;
    }

    request.onsuccess = () => {
      risultato = request.result;
    };

    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => resolve(risultato);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error || new Error("Operazione annullata"));
  });
}

function aggiungiDato(archivio, dato) {
  return eseguiRichiesta(
    archivio,
    "readwrite",
    store => store.add(dato)
  );
}

function salvaDato(archivio, dato) {
  return eseguiRichiesta(
    archivio,
    "readwrite",
    store => store.put(dato)
  );
}

function leggiDato(archivio, id) {
  return eseguiRichiesta(
    archivio,
    "readonly",
    store => store.get(id)
  );
}

function leggiTutti(archivio) {
  return eseguiRichiesta(
    archivio,
    "readonly",
    store => store.getAll()
  );
}

function eliminaDato(archivio, id) {
  return eseguiRichiesta(
    archivio,
    "readwrite",
    store => store.delete(id)
  );
}

function svuotaArchivio(archivio) {
  return eseguiRichiesta(
    archivio,
    "readwrite",
    store => store.clear()
  );
}

async function sostituisciArchivi(dati) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(ARCHIVI, "readwrite");

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error || new Error("Ripristino annullato"));

    try {
      ARCHIVI.forEach(nomeArchivio => {
        const store = transaction.objectStore(nomeArchivio);
        store.clear();

        const elementi = Array.isArray(dati[nomeArchivio])
          ? dati[nomeArchivio]
          : [];

        elementi.forEach(elemento => {
          store.put(elemento);
        });
      });
    } catch (error) {
      transaction.abort();
      reject(error);
    }
  });
}

window.PrezziDB = {
  DB_NAME,
  DB_VERSION,
  ARCHIVI: [...ARCHIVI],
  openDatabase,
  aggiungiDato,
  salvaDato,
  leggiDato,
  leggiTutti,
  eliminaDato,
  svuotaArchivio,
  sostituisciArchivi
};
