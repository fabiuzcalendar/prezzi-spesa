const statusText = document.getElementById("status");

// Avvia il database locale
PrezziDB.openDatabase()
  .then(() => {
    statusText.textContent = "✓ Archivio locale pronto";
  })
  .catch(error => {
    console.error(error);
    statusText.textContent = "Errore archivio locale";
  });

// Attiva il funzionamento offline
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then(() => {
        console.log("Modalità offline attiva");
      })
      .catch(error => {
        console.error("Errore Service Worker:", error);
      });
  });
}

document.querySelectorAll(".home-button").forEach(button => {

  button.addEventListener("click", () => {

    const action = button.dataset.action;

    if (action === "cerca") {
      statusText.textContent = "Cerca prezzi - prossima funzione";
    }

    if (action === "aggiungi") {
      statusText.textContent = "Aggiungi prezzo - prossima funzione";
    }

    if (action === "lista") {
      statusText.textContent = "Lista della spesa - prossima funzione";
    }

    if (action === "aggiorna") {
      statusText.textContent = "Prezzi da aggiornare - prossima funzione";
    }

  });

});
