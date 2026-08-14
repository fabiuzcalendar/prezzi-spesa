const statusText = document.getElementById("status");

const homeSection = document.getElementById("homeSection");
const aggiungiSection = document.getElementById("aggiungiSection");

const tornaHome = document.getElementById("tornaHome");

const puntoVenditaSelect =
  document.getElementById("puntoVenditaSelect");

const negozioSelezionato =
  document.getElementById("negozioSelezionato");

const nomeNegozio =
  document.getElementById("nomeNegozio");

const cittaNegozio =
  document.getElementById("cittaNegozio");

const viaNegozio =
  document.getElementById("viaNegozio");

const notaNegozio =
  document.getElementById("notaNegozio");

const salvaNegozio =
  document.getElementById("salvaNegozio");

const messaggioNegozio =
  document.getElementById("messaggioNegozio");


/* DATABASE */

PrezziDB.openDatabase()
  .then(async () => {

    statusText.textContent = "✓ Archivio locale pronto";

    await caricaPuntiVendita();

  })
  .catch(error => {

    console.error(error);

    statusText.textContent =
      "Errore archivio locale";

  });


/* SERVICE WORKER */

if ("serviceWorker" in navigator) {

  window.addEventListener("load", () => {

    navigator.serviceWorker
      .register("./sw.js")
      .catch(error =>
        console.error(
          "Errore Service Worker:",
          error
        )
      );

  });

}


/* NAVIGAZIONE */

document
  .querySelectorAll(".home-button")
  .forEach(button => {

    button.addEventListener("click", async () => {

      const action = button.dataset.action;

      if (action === "aggiungi") {

        homeSection.classList.add("hidden");

        aggiungiSection.classList.remove("hidden");

        await caricaPuntiVendita();

      }

      if (action === "cerca") {

        statusText.textContent =
          "Cerca prezzi - prossimamente";

      }

      if (action === "lista") {

        statusText.textContent =
          "Lista della spesa - prossimamente";

      }

      if (action === "aggiorna") {

        statusText.textContent =
          "Prezzi da aggiornare - prossimamente";

      }

    });

  });


tornaHome.addEventListener("click", () => {

  aggiungiSection.classList.add("hidden");

  homeSection.classList.remove("hidden");

});


/* CREA NOME VISUALIZZATO */

function creaNomeNegozio(negozio) {

  let nome =
    `${negozio.nome} di ${negozio.citta}`;

  if (negozio.via) {
    nome += ` - ${negozio.via}`;
  }

  return nome;

}


/* CARICA NEGOZI */

async function caricaPuntiVendita() {

  const negozi =
    await PrezziDB.leggiTutti("puntiVendita");

  puntoVenditaSelect.innerHTML =
    `<option value="">
       Seleziona un punto vendita
     </option>`;

  negozi.forEach(negozio => {

    const option =
      document.createElement("option");

    option.value = negozio.id;

    option.textContent =
      creaNomeNegozio(negozio);

    puntoVenditaSelect.appendChild(option);

  });


  const ultimoNegozio =
    localStorage.getItem(
      "ultimoPuntoVendita"
    );

  if (ultimoNegozio) {

    puntoVenditaSelect.value =
      ultimoNegozio;

    mostraNegozioSelezionato();

  }

}


/* SALVA NEGOZIO */

salvaNegozio.addEventListener(
  "click",
  async () => {

    const nome =
      nomeNegozio.value.trim();

    const citta =
      cittaNegozio.value.trim();

    const via =
      viaNegozio.value.trim();

    const nota =
      notaNegozio.value.trim();


    if (!nome || !citta) {

      messaggioNegozio.textContent =
        "Inserisci almeno nome e città.";

      return;

    }


    const nuovoNegozio = {

      nome: nome,

      citta: citta,

      via: via,

      nota: nota,

      dataCreazione:
        new Date().toISOString()

    };


    const id =
      await PrezziDB.aggiungiDato(
        "puntiVendita",
        nuovoNegozio
      );


    localStorage.setItem(
      "ultimoPuntoVendita",
      id
    );


    nomeNegozio.value = "";
    cittaNegozio.value = "";
    viaNegozio.value = "";
    notaNegozio.value = "";


    messaggioNegozio.textContent =
      "✓ Punto vendita salvato";


    await caricaPuntiVendita();

  }
);


/* SELEZIONE NEGOZIO */

puntoVenditaSelect.addEventListener(
  "change",
  () => {

    const id =
      puntoVenditaSelect.value;

    if (id) {

      localStorage.setItem(
        "ultimoPuntoVendita",
        id
      );

    } else {

      localStorage.removeItem(
        "ultimoPuntoVendita"
      );

    }

    mostraNegozioSelezionato();

  }
);


function mostraNegozioSelezionato() {

  const option =
    puntoVenditaSelect.options[
      puntoVenditaSelect.selectedIndex
    ];

  if (
    puntoVenditaSelect.value &&
    option
  ) {

    negozioSelezionato.textContent =
      "✓ Selezionato: " +
      option.textContent;

  } else {

    negozioSelezionato.textContent =
      "Nessun punto vendita selezionato";

  }

}
