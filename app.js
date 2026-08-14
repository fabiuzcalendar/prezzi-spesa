/* =========================================
   PREZZI SPESA
   APP PRINCIPALE
========================================= */


/* =========================================
   ELEMENTI GENERALI
========================================= */

const statusText =
  document.getElementById("status");

const homeSection =
  document.getElementById("homeSection");

const aggiungiSection =
  document.getElementById("aggiungiSection");

const cercaSection =
  document.getElementById("cercaSection");

const tornaHome =
  document.getElementById("tornaHome");

const tornaHomeCerca =
  document.getElementById("tornaHomeCerca");


/* =========================================
   CERCA PREZZI
========================================= */

const cercaProdotto =
  document.getElementById("cercaProdotto");

const ordinaRisultati =
  document.getElementById("ordinaRisultati");

const conteggioRisultati =
  document.getElementById("conteggioRisultati");

const risultatiPrezzi =
  document.getElementById("risultatiPrezzi");


/* =========================================
   PUNTO VENDITA
========================================= */

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


/* =========================================
   PRODOTTO
========================================= */

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

function mostraSezione(sezione) {
  homeSection.classList.add("hidden");
  aggiungiSection.classList.add("hidden");
  cercaSection.classList.add("hidden");

  sezione.classList.remove("hidden");

  window.scrollTo({
    top: 0,
    behavior: "instant"
  });
}

function mostraHome() {
  aggiungiSection.classList.add("hidden");
  cercaSection.classList.add("hidden");
  homeSection.classList.remove("hidden");

  window.scrollTo({
    top: 0,
    behavior: "instant"
  });
}

document
  .querySelectorAll(".home-button")
  .forEach(button => {
    button.addEventListener(
      "click",
      async () => {
        const action =
          button.dataset.action;

        if (action === "aggiungi") {
          mostraSezione(aggiungiSection);
          await caricaPuntiVendita();
          return;
        }

        if (action === "cerca") {
          mostraSezione(cercaSection);
          cercaProdotto.focus();
          await eseguiRicercaPrezzi();
          return;
        }

        if (action === "lista") {
          statusText.textContent =
            "Lista della spesa - prossimamente";
          return;
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
  mostraHome
);

tornaHomeCerca.addEventListener(
  "click",
  mostraHome
);


/* =========================================
   FUNZIONI UTILI
========================================= */

function normalizzaTesto(testo) {
  return String(testo || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
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

function formattaEuro(valore) {
  const numero =
    Number(valore);

  if (!Number.isFinite(numero)) {
    return "€—";
  }

  const importo = numero.toLocaleString(
    "it-IT",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  );

  return `€${importo}`;
}

function formattaNumero(valore) {
  const numero =
    Number(valore);

  if (!Number.isFinite(numero)) {
    return String(valore || "");
  }

  return numero.toLocaleString(
    "it-IT",
    {
      maximumFractionDigits: 2
    }
  );
}

function formattaUnitaConfezione(unita) {
  if (unita === "l") {
    return "L";
  }

  if (unita === "pezzi") {
    return "pezzi";
  }

  return unita || "";
}

function formattaUnitaPrezzo(unita) {
  if (unita === "l") {
    return "L";
  }

  return unita || "";
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

  negozi
    .sort((a, b) =>
      creaNomeNegozio(a)
        .localeCompare(
          creaNomeNegozio(b),
          "it"
        )
    )
    .forEach(negozio => {
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
        elemento =>
          elemento.nomeNormalizzato ===
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
        elemento =>
          elemento.id ===
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

    messaggioPrezzo.textContent =
      `✓ ${nome} salvato a ${formattaEuro(prezzo)} — ` +
      `${formattaNumero(quantita)} ${formattaUnitaConfezione(unita)} — ` +
      `${formattaEuro(prezzoUnitario.valore)}/${formattaUnitaPrezzo(prezzoUnitario.unita)}`;

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


/* =========================================
   CERCA PREZZI - FUNZIONI
========================================= */

function giorniDallaRilevazione(dataRilevazione) {
  const data =
    new Date(dataRilevazione);

  if (Number.isNaN(data.getTime())) {
    return 9999;
  }

  const adesso =
    new Date();

  const differenza =
    adesso.getTime() - data.getTime();

  return Math.max(
    0,
    Math.floor(
      differenza / 86400000
    )
  );
}

function classeEtaPrezzo(giorni) {
  if (giorni <= 7) {
    return "stato-verde";
  }

  if (giorni <= 14) {
    return "stato-giallo";
  }

  if (giorni <= 29) {
    return "stato-arancione";
  }

  return "stato-rosso";
}

function testoEtaPrezzo(giorni) {
  if (giorni === 0) {
    return "oggi";
  }

  if (giorni === 1) {
    return "1 giorno fa";
  }

  return `${giorni} giorni fa`;
}

function formattaData(dataRilevazione) {
  const data =
    new Date(dataRilevazione);

  if (Number.isNaN(data.getTime())) {
    return "Data non disponibile";
  }

  return data.toLocaleDateString(
    "it-IT",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }
  );
}

function completaPrezzoUnitario(rilevazione) {
  const valoreSalvato =
    Number(rilevazione.prezzoUnitario);

  if (
    Number.isFinite(valoreSalvato) &&
    rilevazione.unitaPrezzoUnitario
  ) {
    return {
      valore: valoreSalvato,
      unita:
        rilevazione.unitaPrezzoUnitario
    };
  }

  return calcolaPrezzoUnitario(
    Number(rilevazione.prezzo),
    Number(rilevazione.quantita),
    rilevazione.unita
  );
}

function tieniSoloUltimaRilevazionePerNegozio(rilevazioni) {
  const mappa =
    new Map();

  rilevazioni.forEach(rilevazione => {
    const chiave =
      `${rilevazione.prodottoId}|${rilevazione.puntoVenditaId}`;

    const esistente =
      mappa.get(chiave);

    if (!esistente) {
      mappa.set(
        chiave,
        rilevazione
      );
      return;
    }

    const dataNuova =
      new Date(
        rilevazione.dataRilevazione
      ).getTime();

    const dataEsistente =
      new Date(
        esistente.dataRilevazione
      ).getTime();

    if (dataNuova > dataEsistente) {
      mappa.set(
        chiave,
        rilevazione
      );
    }
  });

  return Array.from(
    mappa.values()
  );
}

function ordinaRilevazioni(rilevazioni) {
  const criterio =
    ordinaRisultati.value;

  return [...rilevazioni]
    .sort((a, b) => {
      if (criterio === "prezzo") {
        return Number(a.prezzo) -
          Number(b.prezzo);
      }

      if (criterio === "recente") {
        return new Date(
          b.dataRilevazione
        ).getTime() -
          new Date(
            a.dataRilevazione
          ).getTime();
      }

      const unitarioA =
        completaPrezzoUnitario(a);

      const unitarioB =
        completaPrezzoUnitario(b);

      if (
        unitarioA.unita ===
        unitarioB.unita
      ) {
        return unitarioA.valore -
          unitarioB.valore;
      }

      const confrontoProdotto =
        String(a.nomeProdotto || "")
          .localeCompare(
            String(b.nomeProdotto || ""),
            "it"
          );

      if (confrontoProdotto !== 0) {
        return confrontoProdotto;
      }

      return String(unitarioA.unita)
        .localeCompare(
          String(unitarioB.unita),
          "it"
        );
    });
}

function creaRisultatoPrezzo(rilevazione) {
  const giorni =
    giorniDallaRilevazione(
      rilevazione.dataRilevazione
    );

  const classeEta =
    classeEtaPrezzo(giorni);

  const prezzoUnitario =
    completaPrezzoUnitario(
      rilevazione
    );

  const card =
    document.createElement("article");

  card.className =
    `risultato-prezzo ${classeEta}`;

  const intestazione =
    document.createElement("div");

  intestazione.className =
    "risultato-intestazione";

  const nome =
    document.createElement("h2");

  nome.className =
    "risultato-nome";

  nome.textContent =
    rilevazione.nomeProdotto ||
    "Prodotto";

  intestazione.appendChild(nome);

  if (rilevazione.promozione) {
    const promo =
      document.createElement("span");

    promo.className =
      "badge-promo";

    promo.textContent =
      "PROMO";

    intestazione.appendChild(promo);
  }

  card.appendChild(intestazione);

  const negozio =
    document.createElement("p");

  negozio.className =
    "risultato-negozio";

  negozio.textContent =
    rilevazione.nomePuntoVendita ||
    "Punto vendita";

  card.appendChild(negozio);

  const rigaPrezzi =
    document.createElement("div");

  rigaPrezzi.className =
    "risultato-prezzi-riga";

  const bloccoConfezione =
    document.createElement("div");

  const confezioneRiga =
    document.createElement("div");

  confezioneRiga.className =
    "confezione-riga";

  const prezzoConfezione =
    document.createElement("div");

  prezzoConfezione.className =
    "prezzo-confezione";

  prezzoConfezione.textContent =
    formattaEuro(
      rilevazione.prezzo
    );

  const quantita =
    document.createElement("div");

  quantita.className =
    "quantita-confezione";

  quantita.textContent =
    `${formattaNumero(rilevazione.quantita)} ` +
    `${formattaUnitaConfezione(rilevazione.unita)}`;

  confezioneRiga.appendChild(
    prezzoConfezione
  );

  confezioneRiga.appendChild(
    quantita
  );

  bloccoConfezione.appendChild(
    confezioneRiga
  );

  const unitario =
    document.createElement("div");

  unitario.className =
    "prezzo-unitario";

  unitario.textContent =
    `${formattaEuro(prezzoUnitario.valore)}/` +
    `${formattaUnitaPrezzo(prezzoUnitario.unita)}`;

  rigaPrezzi.appendChild(
    bloccoConfezione
  );

  rigaPrezzi.appendChild(
    unitario
  );

  card.appendChild(
    rigaPrezzi
  );

  const data =
    document.createElement("p");

  data.className =
    "risultato-data";

  data.textContent =
    `Rilevato il ${formattaData(rilevazione.dataRilevazione)} · ` +
    `${testoEtaPrezzo(giorni)}`;

  card.appendChild(data);

  if (rilevazione.nota) {
    const nota =
      document.createElement("p");

    nota.className =
      "risultato-nota";

    nota.textContent =
      `Nota: ${rilevazione.nota}`;

    card.appendChild(nota);
  }

  return card;
}

async function eseguiRicercaPrezzi() {
  const testoRicerca =
    normalizzaTesto(
      cercaProdotto.value
    );

  risultatiPrezzi.innerHTML = "";

  if (!testoRicerca) {
    conteggioRisultati.textContent =
      "Scrivi il nome di un prodotto per iniziare.";

    return;
  }

  let rilevazioni;

  try {
    rilevazioni =
      await PrezziDB.leggiTutti(
        "rilevazioniPrezzi"
      );
  } catch (error) {
    console.error(error);

    conteggioRisultati.textContent =
      "Errore durante la lettura dei prezzi.";

    return;
  }

  const filtrate =
    rilevazioni.filter(rilevazione => {
      const nome =
        normalizzaTesto(
          rilevazione.nomeProdotto
        );

      return nome.includes(
        testoRicerca
      );
    });

  const ultime =
    tieniSoloUltimaRilevazionePerNegozio(
      filtrate
    );

  const ordinate =
    ordinaRilevazioni(
      ultime
    );

  if (ordinate.length === 0) {
    conteggioRisultati.textContent =
      "Nessun prezzo trovato.";

    const vuoto =
      document.createElement("div");

    vuoto.className =
      "nessun-risultato";

    vuoto.textContent =
      "Non ci sono ancora prezzi salvati per questa ricerca.";

    risultatiPrezzi.appendChild(
      vuoto
    );

    return;
  }

  conteggioRisultati.textContent =
    ordinate.length === 1
      ? "1 prezzo trovato."
      : `${ordinate.length} prezzi trovati.`;

  ordinate.forEach(rilevazione => {
    risultatiPrezzi.appendChild(
      creaRisultatoPrezzo(
        rilevazione
      )
    );
  });
}

cercaProdotto.addEventListener(
  "input",
  eseguiRicercaPrezzi
);

ordinaRisultati.addEventListener(
  "change",
  eseguiRicercaPrezzi
);

