const DB_NAME = "PrezziSpesaDB";
const DB_VERSION = 1;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = function (event) {
      const db = event.target.result;

      if (!db.objectStoreNames.contains("puntiVendita")) {
        db.createObjectStore("puntiVendita", {
          keyPath: "id",
          autoIncrement: true
        });
      }

      if (!db.objectStoreNames.contains("prodotti")) {
        db.createObjectStore("prodotti", {
          keyPath: "id",
          autoIncrement: true
        });
      }

      if (!db.objectStoreNames.contains("rilevazioniPrezzi")) {
        db.createObjectStore("rilevazioniPrezzi", {
          keyPath: "id",
          autoIncrement: true
        });
      }

      if (!db.objectStoreNames.contains("listaSpesa")) {
        db.createObjectStore("listaSpesa", {
          keyPath: "id",
          autoIncrement: true
        });
      }
    };

    request.onsuccess = function () {
      resolve(request.result);
    };

    request.onerror = function () {
      reject(request.error);
    };
  });
}

async function aggiungiDato(archivio, dato) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(archivio, "readwrite");
    const store = transaction.objectStore(archivio);
    const request = store.add(dato);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function leggiTutti(archivio) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(archivio, "readonly");
    const store = transaction.objectStore(archivio);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

window.PrezziDB = {
  openDatabase,
  aggiungiDato,
  leggiTutti
};
