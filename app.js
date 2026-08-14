/* =========================================
   PREZZI SPESA
   APP PRINCIPALE
========================================= */


/* ELEMENTI GENERALI */

const statusText =
  document.getElementById("status");

const homeSection =
  document.getElementById("homeSection");

const aggiungiSection =
  document.getElementById("aggiungiSection");

const tornaHome =
  document.getElementById("tornaHome");


/* PUNTO VENDITA */

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


/* PRODOTTO */

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


/* =========================================
   DATABASE
========================================= */

PrezziDB.openDatabase()
  .then(async () => {

    statusText.textContent =
      "✓ Archivio locale pronto";

    await caricaPuntiVendita();

  })
  .catch(error => {

    console.error(error);

    statusText.textContent =
      "Errore archivio locale";

  });


/* =========================================
   FUNZIONAMENTO OFFLINE
========================================= */

if ("serviceWorker" in navigator) {

  window.addEventListener("load", () => {

    navigator.serviceWorker
      .register("./sw.js")
      .then(() => {
        console.log("Modalità offline attiva");
      })
      .catch(error => {
        console.error(
          "Errore Service Worker:",
          error
        );
      });

  });

}


/* =========================================
   NAVIGAZIONE
========================================= */

document
  .querySelectorAll(".home-button")
  .forEach(button => {

    button.addEventListener(
      "click",
      async () => {

        const action =
          button.dataset.action;


        if (action === "aggiungi") {

          homeSection.classList.add(
            "hidden"
          );

          aggiungiSection.classList.remove(
            "hidden"
          );

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

      }
    );

  });


tornaHome.addEventListener(
  "click",
  () => {

    aggiungiSection.classList.add(
      "hidden"
    );

    homeSection.classList.remove(
      "hidden"
    );

  }
);


/* =========================================
   FUNZIONI UTILI
========================================= */

function normalizzaTesto(testo) {

  return testo
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

}


function convertiNumero(valore) {

  if (!valore) {
    return NaN;
  }

  return Number(
    String(valore)
      .replace(",", ".")
      .trim()
  );

}


function creaNomeNegozio(negozio) {

  let nome =
    `${negozio.nome} di ${negozio.citta}`;

  if (negozio.via) {

    nome +=
      ` - ${negozio.via}`;

  }

  return nome;

}


/* =========================================
   CARICAMENTO PUNTI VENDITA
========================================= */

async function caricaPuntiVendita() {

  const negozi =
    await PrezziDB.leggiTutti(
      "puntiVendita"
    );


  puntoVenditaSelect.innerHTML =
    `
      <option value="">
        Seleziona un punto vendita
      </option>
    `;


  negozi.forEach(negozio => {

    const option =
      document.createElement("option");

    option.value =
      negozio.id;

    option.textContent =
      creaNomeNegozio(negozio);

    puntoVenditaSelect.appendChild(
      option
    );

  });


  const ultimoNegozio =
    localStorage.getItem(
      "ultimoPuntoVendita"
    );


  if (ultimoNegozio) {

    puntoVenditaSelect.value =
      ultimoNegozio;

  }


  mostraNegozioSelezionato();

}


/* =========================================
   SALVA PUNTO VENDITA
========================================= */

salvaNegozio.addEventListener(
  "click",
  async () => {

    messaggioNegozio.className = "";

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

      messaggioNegozio.className =
        "error-message";

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
      String(id)
    );


    nomeNegozio.value = "";
    cittaNegozio.value = "";
    viaNegozio.value = "";
    notaNegozio.value = "";


    messaggioNegozio.textContent =
      "✓ Punto vendita salvato";

    messaggioNegozio.className =
      "success-message";


    await caricaPuntiVendita();

  }
);


/* =========================================
   SELEZIONE PUNTO VENDITA
========================================= */

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


/* =========================================
   PREZZO UNITARIO
========================================= */

function calcolaPrezzoUnitario(
  prezzo,
  quantita,
  unita
) {

  if (unita === "g") {

    return {
      valore:
        prezzo * 1000 / quantita,
      unita: "kg"
    };

  }


  if (unita === "kg") {

    return {
      valore:
        prezzo / quantita,
      unita: "kg"
    };

  }


  if (unita === "ml") {

    return {
      valore:
        prezzo * 1000 / quantita,
      unita: "l"
    };

  }


  if (unita === "l") {

    return {
      valore:
        prezzo / quantita,
      unita: "l"
    };

  }


  if (unita === "pezzi") {

    return {
      valore:
        prezzo / quantita,
      unita: "pezzo"
    };

  }


  return {
    valore: prezzo,
    unita: ""
  };

}


/* =========================================
   SALVA PREZZO
========================================= */

salvaPrezzo.addEventListener(
  "click",
  async () => {

    messaggioPrezzo.className = "";


    const nome =
      nomeProdotto.value.trim();

    const prezzo =
      convertiNumero(
        prezzoProdotto.value
      );

    const quantita =
      convertiNumero(
        quantitaProdotto.value
      );

    const unita =
      unitaProdotto.value;

    const puntoVenditaId =
      Number(
        puntoVenditaSelect.value
      );


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


    if (
      Number.isNaN(prezzo) ||
      prezzo <= 0
    ) {

      messaggioPrezzo.textContent =
        "Inserisci un prezzo valido.";

      messaggioPrezzo.className =
        "error-message";

      return;

    }


    if (
      Number.isNaN(quantita) ||
      quantita <= 0
    ) {

      messaggioPrezzo.textContent =
        "Inserisci una quantità valida.";

      messaggioPrezzo.className =
        "error-message";

      return;

    }


    /* CERCA PRODOTTO ESISTENTE */

    const prodotti =
      await PrezziDB.leggiTutti(
        "prodotti"
      );


    const nomeNormalizzato =
      normalizzaTesto(nome);


    let prodotto =
      prodotti.find(
        prodotto =>
          prodotto.nomeNormalizzato ===
          nomeNormalizzato
      );


    /* CREA PRODOTTO SE NON ESISTE */

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


    /* RECUPERA NEGOZIO */

    const negozi =
      await PrezziDB.leggiTutti(
        "puntiVendita"
      );


    const negozio =
      negozi.find(
        negozio =>
          negozio.id ===
          puntoVenditaId
      );


    if (!negozio) {

      messaggioPrezzo.textContent =
        "Punto vendita non trovato.";

      messaggioPrezzo.className =
        "error-message";

      return;

    }


    /* CALCOLA €/KG, €/L O €/PEZZO */

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

    const prezzoItaliano =
      prezzo.toFixed(2)
        .replace(".", ",");

    const prezzoUnitarioItaliano =
      prezzoUnitario.valore
        .toFixed(2)
        .replace(".", ",");


    messaggioPrezzo.textContent =
      `✓ ${nome} salvato a €${prezzoItaliano} — ` +
      `${quantita} ${unita} — ` +
      `€${prezzoUnitarioItaliano}/${prezzoUnitario.unita}`;


    messaggioPrezzo.className =
      "success-message";


    /* PULISCE SOLO I DATI PRODOTTO */

    nomeProdotto.value = "";

    prezzoProdotto.value = "";

    quantitaProdotto.value = "";

    notaPrezzo.value = "";

    promozionePrezzo.checked = false;


    nomeProdotto.focus();

  }
);
