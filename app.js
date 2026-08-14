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
/* ========================================
   PRODOTTI E RILEVAZIONI PREZZI
======================================== */

const nomeProdotto =
  document.getElementById("nomeProdotto");

const prezzoProdotto =
  document.getElementById("prezzoProdotto");

const quantitaProdotto =
  document.getElementById("quantitaProdotto");

const unitaProdotto =
  document.getElementById("unitaProdotto");

const notaPrezzo =
  document.getElementById("notaPrezzo");

const promozionePrezzo =
  document.getElementById("promozionePrezzo");

const salvaPrezzo =
  document.getElementById("salvaPrezzo");

const messaggioPrezzo =
  document.getElementById("messaggioPrezzo");


function normalizzaTesto(testo) {

  return testo
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

}


function calcolaPrezzoUnitario(
  prezzo,
  quantita,
  unita
) {

  if (unita === "g") {

    return {
      valore: prezzo * 1000 / quantita,
      unita: "kg"
    };

  }

  if (unita === "kg") {

    return {
      valore: prezzo / quantita,
      unita: "kg"
    };

  }

  if (unita === "ml") {

    return {
      valore: prezzo * 1000 / quantita,
      unita: "l"
    };

  }

  if (unita === "l") {

    return {
      valore: prezzo / quantita,
      unita: "l"
    };

  }

  if (unita === "pezzi") {

    return {
      valore: prezzo / quantita,
      unita: "pezzo"
    };

  }

}


/* SALVA PREZZO */

salvaPrezzo.addEventListener(
  "click",
  async () => {

    messaggioPrezzo.className = "";

    const nome =
      nomeProdotto.value.trim();

    const prezzo =
      Number(prezzoProdotto.value);

    const quantita =
      Number(quantitaProdotto.value);

    const unita =
      unitaProdotto.value;

    const puntoVenditaId =
      Number(puntoVenditaSelect.value);


    /* CONTROLLI */

    if (!puntoVenditaId) {

      messaggioPrezzo.textContent =
        "Seleziona prima un punto vendita.";

      messaggioPrezzo.className =
        "error-message";

      return;

    }


    if (!nome) {

      messaggioPrezzo.textContent =
        "Inserisci il nome del prodotto.";

      messaggioPrezzo.className =
        "error-message";

      return;

    }


    if (!prezzo || prezzo <= 0) {

      messaggioPrezzo.textContent =
        "Inserisci un prezzo valido.";

      messaggioPrezzo.className =
        "error-message";

      return;

    }


    if (!quantita || quantita <= 0) {

      messaggioPrezzo.textContent =
        "Inserisci una quantità valida.";

      messaggioPrezzo.className =
        "error-message";

      return;

    }


    /* CERCA SE IL PRODOTTO ESISTE */

    const prodotti =
      await PrezziDB.leggiTutti(
        "prodotti"
      );

    const nomeNormalizzato =
      normalizzaTesto(nome);

    let prodotto =
      prodotti.find(
        p =>
          p.nomeNormalizzato ===
          nomeNormalizzato
      );


    /* SE NON ESISTE, CREALO */

    if (!prodotto) {

      const nuovoProdotto = {

        nome: nome,

        nomeNormalizzato:
          nomeNormalizzato,

        dataCreazione:
          new Date().toISOString()

      };


      const prodottoId =
        await PrezziDB.aggiungiDato(
          "prodotti",
          nuovoProdotto
        );


      prodotto = {
        ...nuovoProdotto,
        id: prodottoId
      };

    }


    /* TROVA IL NEGOZIO */

    const negozi =
      await PrezziDB.leggiTutti(
        "puntiVendita"
      );

    const negozio =
      negozi.find(
        n => n.id === puntoVenditaId
      );


    if (!negozio) {

      messaggioPrezzo.textContent =
        "Punto vendita non trovato.";

      messaggioPrezzo.className =
        "error-message";

      return;

    }


    /* CALCOLO PREZZO KG / LITRO / PEZZO */

    const prezzoUnitario =
      calcolaPrezzoUnitario(
        prezzo,
        quantita,
        unita
      );


    /* CREA RILEVAZIONE */

    const rilevazione = {

      prodottoId:
        prodotto.id,

      nomeProdotto:
        prodotto.nome,

      puntoVenditaId:
        negozio.id,

      nomePuntoVendita:
        creaNomeNegozio(negozio),

      prezzo:
        prezzo,

      quantita:
        quantita,

      unita:
        unita,

      prezzoUnitario:
        Number(
          prezzoUnitario.valore.toFixed(2)
        ),

      unitaPrezzoUnitario:
        prezzoUnitario.unita,

      nota:
        notaPrezzo.value.trim(),

      promozione:
        promozionePrezzo.checked,

      dataRilevazione:
        new Date().toISOString()

    };


    await PrezziDB.aggiungiDato(
      "rilevazioniPrezzi",
      rilevazione
    );


    /* CONFERMA */

    let messaggio =
      `✓ ${nome} salvato a €${prezzo.toFixed(2)}`;

    messaggio +=
      ` — ${quantita} ${unita}`;

    messaggio +=
      ` — €${prezzoUnitario.valore.toFixed(2)}/${prezzoUnitario.unita}`;


    messaggioPrezzo.textContent =
      messaggio;

    messaggioPrezzo.className =
      "success-message";


    /* PULISCE IL PRODOTTO,
       MA NON IL SUPERMERCATO */

    nomeProdotto.value = "";

    prezzoProdotto.value = "";

    quantitaProdotto.value = "";

    notaPrezzo.value = "";

    promozionePrezzo.checked = false;

    nomeProdotto.focus();

  }
);
