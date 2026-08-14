const statusText = document.getElementById("status");

document.querySelectorAll(".home-button").forEach(button => {

  button.addEventListener("click", () => {

    const action = button.dataset.action;

    if (action === "cerca") {
      statusText.textContent = "Sezione Cerca prezzi - prossimamente";
    }

    if (action === "aggiungi") {
      statusText.textContent = "Sezione Aggiungi prezzo - prossimamente";
    }

    if (action === "lista") {
      statusText.textContent = "Sezione Lista della spesa - prossimamente";
    }

    if (action === "aggiorna") {
      statusText.textContent = "Sezione Prezzi da aggiornare - prossimamente";
    }

  });

});
