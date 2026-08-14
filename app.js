"use strict";

/* =========================================================
   PREZZI SPESA - VERSIONE FINALE 1.0
   Dati principali: IndexedDB PrezziSpesaDB
   Lista rapida: localStorage, compatibile con la v9
========================================================= */

const APP_VERSION = "1.0";
const LISTA_SPESA_KEY = "prezziSpesaListaRapidaV1";
const RICERCHE_RECENTI_KEY = "ricercheRecentiPrezzi";
const ULTIMO_NEGOZIO_KEY = "ultimoPuntoVendita";
const ULTIMO_BACKUP_KEY = "prezziSpesaUltimoBackup";

const $ = id => document.getElementById(id);

const sezioni = {
  home: $("homeSection"),
  cerca: $("cercaSection"),
  aggiungi: $("aggiungiSection"),
  lista: $("listaSection"),
  aggiorna: $("aggiornaSection"),
  dati: $("datiSection")
};

const statusText = $("status");
const homeRiepilogo = $("homeRiepilogo");
const badgeListaHome = $("badgeListaHome");
const badgeAggiornamentiHome = $("badgeAggiornamentiHome");

const cercaProdotto = $("cercaProdotto");
const suggerimentiProdotti = $("suggerimentiProdotti");
const filtroPuntoVendita = $("filtroPuntoVendita");
const filtroPromozioni = $("filtroPromozioni");
const filtroRecenti = $("filtroRecenti");
const ordinaRisultati = $("ordinaRisultati");
const conteggioRisultati = $("conteggioRisultati");
const riepilogoRicerca = $("riepilogoRicerca");
const risultatiPrezzi = $("risultatiPrezzi");
const ricercheRecenti = $("ricercheRecenti");
const ricercheRecentiLista = $("ricercheRecentiLista");

const puntoVenditaSelect = $("puntoVenditaSelect");
const negozioSelezionato = $("negozioSelezionato");
const nomeNegozio = $("nomeNegozio");
const cittaNegozio = $("cittaNegozio");
const viaNegozio = $("viaNegozio");
const notaNegozio = $("notaNegozio");
const salvaNegozio = $("salvaNegozio");
const messaggioNegozio = $("messaggioNegozio");
const nomeProdotto = $("nomeProdotto");
const prezzoProdotto = $("prezzoProdotto");
const quantitaProdotto = $("quantitaProdotto");
const unitaProdotto = $("unitaProdotto");
const notaPrezzo = $("notaPrezzo");
const promozionePrezzo = $("promozionePrezzo");
const salvaPrezzo = $("salvaPrezzo");
const messaggioPrezzo = $("messaggioPrezzo");

const listaRapidaInput = $("listaRapidaInput");
const aggiungiAllaLista = $("aggiungiAllaLista");
const messaggioLista = $("messaggioLista");
const listaProdottoArchivio = $("listaProdottoArchivio");
const listaQuantitaConfezioni = $("listaQuantitaConfezioni");
const aggiungiArchivioLista = $("aggiungiArchivioLista");
const messaggioListaArchivio = $("messaggioListaArchivio");
const riepilogoListaCard = $("riepilogoListaCard");
const stimaTotaleLista = $("stimaTotaleLista");
const stimaCoperturaLista = $("stimaCoperturaLista");
const conteggioLista = $("conteggioLista");
const listaSpesaElementi = $("listaSpesaElementi");
const listaVuota = $("listaVuota");
const eliminaSpuntati = $("eliminaSpuntati");
const svuotaLista = $("svuotaLista");

const sogliaAggiornamenti = $("sogliaAggiornamenti");
const filtroAggiornamentiNegozio = $("filtroAggiornamentiNegozio");
const conteggioAggiornamenti = $("conteggioAggiornamenti");
const listaAggiornamenti = $("listaAggiornamenti");

const statisticheArchivio = $("statisticheArchivio");
const esportaBackup = $("esportaBackup");
const importaBackupFile = $("importaBackupFile");
const importaBackup = $("importaBackup");
const messaggioBackup = $("messaggioBackup");
const messaggioImport = $("messaggioImport");

let mostraTuttiAttivo = false;
let ricercaTimer = null;

/* =========================================================
   AVVIO
========================================================= */

inizializza();

async function inizializza() {
  registraEventi();
  registraServiceWorker();

  try {
    await PrezziDB.openDatabase();
    statusText.textContent = "✓ Archivio locale pronto";
    await Promise.all([
      caricaPuntiVendita(),
      caricaFiltriPuntiVendita(),
      caricaSuggerimentiProdotti()
    ]);
    mostraRicercheRecenti();
    await aggiornaHome();
  } catch (error) {
    console.error("Errore inizializzazione:", error);
    statusText.textContent = "Errore nell'archivio locale";
    homeRiepilogo.textContent = "Controlla lo spazio del browser e ricarica l'app.";
  }
}

function registraServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(error => {
      console.error("Errore Service Worker:", error);
    });
  });
}

function registraEventi() {
  document.querySelectorAll(".home-button").forEach(button => {
    button.addEventListener("click", () => apriDaHome(button.dataset.action));
  });

  document.querySelectorAll(".torna-home").forEach(button => {
    button.addEventListener("click", mostraHome);
  });

  $("mostraTuttiPrezzi").addEventListener("click", () => {
    cercaProdotto.value = "";
    mostraTuttiAttivo = true;
    eseguiRicercaPrezzi();
  });

  $("pulisciRicercaPrezzi").addEventListener("click", () => {
    cercaProdotto.value = "";
    mostraTuttiAttivo = false;
    risultatiPrezzi.innerHTML = "";
    conteggioRisultati.textContent = "Scrivi il nome di un prodotto per iniziare.";
    nascondiRiepilogoRicerca();
    cercaProdotto.focus();
  });

  cercaProdotto.addEventListener("input", () => {
    mostraTuttiAttivo = false;
    clearTimeout(ricercaTimer);
    ricercaTimer = setTimeout(eseguiRicercaPrezzi, 140);
  });

  [filtroPuntoVendita, filtroPromozioni, filtroRecenti, ordinaRisultati].forEach(elemento => {
    elemento.addEventListener("change", eseguiRicercaPrezzi);
  });

  $("azzeraFiltriCerca").addEventListener("click", () => {
    filtroPuntoVendita.value = "";
    filtroPromozioni.checked = false;
    filtroRecenti.checked = false;
    ordinaRisultati.value = "unitario";
    eseguiRicercaPrezzi();
  });

  salvaNegozio.addEventListener("click", salvaNuovoPuntoVendita);
  puntoVenditaSelect.addEventListener("change", selezionaPuntoVendita);
  salvaPrezzo.addEventListener("click", salvaNuovoPrezzo);

  aggiungiAllaLista.addEventListener("click", aggiungiProdottiListaRapida);
  listaRapidaInput.addEventListener("keydown", event => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      aggiungiProdottiListaRapida();
    }
  });
  aggiungiArchivioLista.addEventListener("click", aggiungiProdottoArchivioAllaLista);
  eliminaSpuntati.addEventListener("click", eliminaElementiSpuntati);
  svuotaLista.addEventListener("click", svuotaTuttaLista);

  sogliaAggiornamenti.addEventListener("change", caricaPrezziDaAggiornare);
  filtroAggiornamentiNegozio.addEventListener("change", caricaPrezziDaAggiornare);

  esportaBackup.addEventListener("click", esportaBackupCompleto);
  importaBackup.addEventListener("click", importaBackupCompleto);
}

/* =========================================================
   NAVIGAZIONE
========================================================= */

function mostraSezione(nomeSezione) {
  Object.values(sezioni).forEach(sezione => sezione.classList.add("hidden"));
  sezioni[nomeSezione].classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "auto" });
}

async function mostraHome() {
  mostraSezione("home");
  await aggiornaHome();
}

async function apriDaHome(azione) {
  if (azione === "cerca") {
    mostraSezione("cerca");
    await Promise.all([caricaFiltriPuntiVendita(), caricaSuggerimentiProdotti()]);
    mostraRicercheRecenti();
    if (cercaProdotto.value.trim() || mostraTuttiAttivo) {
      await eseguiRicercaPrezzi();
    }
    cercaProdotto.focus();
    return;
  }

  if (azione === "aggiungi") {
    mostraSezione("aggiungi");
    await Promise.all([caricaPuntiVendita(), caricaSuggerimentiProdotti()]);
    return;
  }

  if (azione === "lista") {
    mostraSezione("lista");
    await renderizzaListaSpesa();
    listaRapidaInput.focus();
    return;
  }

  if (azione === "aggiorna") {
    mostraSezione("aggiorna");
    await caricaFiltriPuntiVendita();
    await caricaPrezziDaAggiornare();
    return;
  }

  if (azione === "dati") {
    mostraSezione("dati");
    await aggiornaStatisticheArchivio();
  }
}

/* =========================================================
   FUNZIONI COMUNI
========================================================= */

function normalizzaTesto(testo) {
  return String(testo || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function corrispondeRicercaProdotto(nome, ricerca) {
  const nomeNormalizzato = normalizzaTesto(nome);
  const parole = normalizzaTesto(ricerca).split(" ").filter(Boolean);
  return parole.every(parola => nomeNormalizzato.includes(parola));
}

function convertiNumero(valore) {
  if (valore === null || valore === undefined || String(valore).trim() === "") {
    return NaN;
  }

  return Number(String(valore).trim().replace(/\s/g, "").replace(",", "."));
}

function formattaEuro(valore) {
  const numero = Number(valore);
  if (!Number.isFinite(numero)) {
    return "€—";
  }

  return `€${numero.toLocaleString("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function formattaNumero(valore) {
  const numero = Number(valore);
  if (!Number.isFinite(numero)) {
    return String(valore ?? "");
  }

  return numero.toLocaleString("it-IT", { maximumFractionDigits: 2 });
}

function formattaUnitaConfezione(unita) {
  if (unita === "l") return "L";
  if (unita === "pezzi") return "pezzi";
  return unita || "";
}

function formattaUnitaPrezzo(unita) {
  if (unita === "l") return "L";
  return unita || "";
}

function creaNomeNegozio(negozio) {
  if (!negozio) return "Punto vendita";
  let nome = String(negozio.nome || "Punto vendita").trim();
  if (negozio.citta) nome += ` di ${negozio.citta}`;
  if (negozio.via) nome += ` - ${negozio.via}`;
  return nome;
}

function formattaData(dataISO) {
  const data = new Date(dataISO);
  if (Number.isNaN(data.getTime())) return "Data non disponibile";
  return data.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function giorniDallaRilevazione(dataISO) {
  const data = new Date(dataISO);
  if (Number.isNaN(data.getTime())) return 9999;
  return Math.max(0, Math.floor((Date.now() - data.getTime()) / 86400000));
}

function testoEtaPrezzo(giorni) {
  if (giorni === 0) return "oggi";
  if (giorni === 1) return "1 giorno fa";
  return `${giorni} giorni fa`;
}

function classeEtaPrezzo(giorni) {
  if (giorni <= 7) return "stato-verde";
  if (giorni <= 14) return "stato-giallo";
  if (giorni <= 29) return "stato-arancione";
  return "stato-rosso";
}

function calcolaPrezzoUnitario(prezzo, quantita, unita) {
  const p = Number(prezzo);
  const q = Number(quantita);

  if (!Number.isFinite(p) || !Number.isFinite(q) || q <= 0) {
    return { valore: NaN, unita: "" };
  }

  if (unita === "g") return { valore: p * 1000 / q, unita: "kg" };
  if (unita === "kg") return { valore: p / q, unita: "kg" };
  if (unita === "ml") return { valore: p * 1000 / q, unita: "l" };
  if (unita === "l") return { valore: p / q, unita: "l" };
  if (unita === "pezzi") return { valore: p / q, unita: "pezzo" };
  return { valore: p, unita: "" };
}

function completaPrezzoUnitario(rilevazione) {
  const salvato = Number(rilevazione.prezzoUnitario);
  if (Number.isFinite(salvato) && rilevazione.unitaPrezzoUnitario) {
    return { valore: salvato, unita: rilevazione.unitaPrezzoUnitario };
  }

  return calcolaPrezzoUnitario(
    rilevazione.prezzo,
    rilevazione.quantita,
    rilevazione.unita
  );
}

function impostaMessaggio(elemento, testo, tipo = "") {
  elemento.textContent = testo;
  elemento.className = "message";
  if (tipo) elemento.classList.add(`${tipo}-message`);
}

function creaIdLista() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function chiaveProdottoNegozio(rilevazione) {
  const prodotto = rilevazione.prodottoId ?? normalizzaTesto(rilevazione.nomeProdotto);
  const negozio = rilevazione.puntoVenditaId ?? normalizzaTesto(rilevazione.nomePuntoVendita);
  return `${prodotto}|${negozio}`;
}

function tieniSoloUltimaRilevazionePerNegozio(rilevazioni) {
  const mappa = new Map();

  rilevazioni.forEach(rilevazione => {
    const chiave = chiaveProdottoNegozio(rilevazione);
    const esistente = mappa.get(chiave);

    if (!esistente) {
      mappa.set(chiave, rilevazione);
      return;
    }

    const dataNuova = new Date(rilevazione.dataRilevazione || 0).getTime();
    const dataVecchia = new Date(esistente.dataRilevazione || 0).getTime();
    if (dataNuova > dataVecchia) mappa.set(chiave, rilevazione);
  });

  return [...mappa.values()];
}

/* =========================================================
   HOME
========================================================= */

async function aggiornaHome() {
  try {
    const [negozi, prodotti, rilevazioni] = await Promise.all([
      PrezziDB.leggiTutti("puntiVendita"),
      PrezziDB.leggiTutti("prodotti"),
      PrezziDB.leggiTutti("rilevazioniPrezzi")
    ]);

    const lista = leggiListaSpesa();
    const daComprare = lista.filter(item => !item.completato).length;
    const ultime = tieniSoloUltimaRilevazionePerNegozio(rilevazioni);
    const daAggiornare = ultime.filter(r => giorniDallaRilevazione(r.dataRilevazione) > 14).length;

    homeRiepilogo.textContent = `${prodotti.length} prodotti · ${negozi.length} punti vendita · ${rilevazioni.length} rilevazioni`;

    aggiornaBadge(badgeListaHome, daComprare);
    aggiornaBadge(badgeAggiornamentiHome, daAggiornare);
  } catch (error) {
    console.error("Errore riepilogo Home:", error);
  }
}

function aggiornaBadge(elemento, numero) {
  if (numero > 0) {
    elemento.textContent = numero > 99 ? "99+" : String(numero);
    elemento.classList.remove("hidden");
  } else {
    elemento.textContent = "";
    elemento.classList.add("hidden");
  }
}

/* =========================================================
   PUNTI VENDITA
========================================================= */

async function caricaPuntiVendita() {
  const negozi = await PrezziDB.leggiTutti("puntiVendita");
  const valoreAttuale = puntoVenditaSelect.value || localStorage.getItem(ULTIMO_NEGOZIO_KEY) || "";

  puntoVenditaSelect.innerHTML = '<option value="">Seleziona un punto vendita</option>';
  negozi
    .sort((a, b) => creaNomeNegozio(a).localeCompare(creaNomeNegozio(b), "it"))
    .forEach(negozio => {
      const option = document.createElement("option");
      option.value = String(negozio.id);
      option.textContent = creaNomeNegozio(negozio);
      puntoVenditaSelect.appendChild(option);
    });

  if ([...puntoVenditaSelect.options].some(o => o.value === String(valoreAttuale))) {
    puntoVenditaSelect.value = String(valoreAttuale);
  }

  mostraNegozioSelezionato();
}

async function caricaFiltriPuntiVendita() {
  const negozi = await PrezziDB.leggiTutti("puntiVendita");
  const ordinati = [...negozi].sort((a, b) => creaNomeNegozio(a).localeCompare(creaNomeNegozio(b), "it"));

  [filtroPuntoVendita, filtroAggiornamentiNegozio].forEach(select => {
    const attuale = select.value;
    select.innerHTML = '<option value="">Tutti i punti vendita</option>';

    ordinati.forEach(negozio => {
      const option = document.createElement("option");
      option.value = String(negozio.id);
      option.textContent = creaNomeNegozio(negozio);
      select.appendChild(option);
    });

    if ([...select.options].some(o => o.value === attuale)) {
      select.value = attuale;
    }
  });
}

function selezionaPuntoVendita() {
  if (puntoVenditaSelect.value) {
    localStorage.setItem(ULTIMO_NEGOZIO_KEY, puntoVenditaSelect.value);
  } else {
    localStorage.removeItem(ULTIMO_NEGOZIO_KEY);
  }
  mostraNegozioSelezionato();
}

function mostraNegozioSelezionato() {
  const option = puntoVenditaSelect.options[puntoVenditaSelect.selectedIndex];
  negozioSelezionato.textContent = puntoVenditaSelect.value && option
    ? `✓ Selezionato: ${option.textContent}`
    : "Nessun punto vendita selezionato";
}

async function salvaNuovoPuntoVendita() {
  impostaMessaggio(messaggioNegozio, "");

  const nome = nomeNegozio.value.trim();
  const citta = cittaNegozio.value.trim();
  const via = viaNegozio.value.trim();
  const nota = notaNegozio.value.trim();

  if (!nome || !citta) {
    impostaMessaggio(messaggioNegozio, "Inserisci almeno nome e città.", "error");
    return;
  }

  try {
    const negozi = await PrezziDB.leggiTutti("puntiVendita");
    const esistente = negozi.find(negozio =>
      normalizzaTesto(negozio.nome) === normalizzaTesto(nome) &&
      normalizzaTesto(negozio.citta) === normalizzaTesto(citta) &&
      normalizzaTesto(negozio.via) === normalizzaTesto(via)
    );

    if (esistente) {
      localStorage.setItem(ULTIMO_NEGOZIO_KEY, String(esistente.id));
      await caricaPuntiVendita();
      puntoVenditaSelect.value = String(esistente.id);
      mostraNegozioSelezionato();
      impostaMessaggio(messaggioNegozio, "Questo punto vendita era già presente: l'ho selezionato.", "warning");
      return;
    }

    const id = await PrezziDB.aggiungiDato("puntiVendita", {
      nome,
      citta,
      via,
      nota,
      dataCreazione: new Date().toISOString()
    });

    localStorage.setItem(ULTIMO_NEGOZIO_KEY, String(id));
    nomeNegozio.value = "";
    cittaNegozio.value = "";
    viaNegozio.value = "";
    notaNegozio.value = "";

    await Promise.all([caricaPuntiVendita(), caricaFiltriPuntiVendita(), aggiornaHome()]);
    puntoVenditaSelect.value = String(id);
    mostraNegozioSelezionato();
    impostaMessaggio(messaggioNegozio, "✓ Punto vendita salvato e selezionato.", "success");
  } catch (error) {
    console.error(error);
    impostaMessaggio(messaggioNegozio, "Errore durante il salvataggio del punto vendita.", "error");
  }
}

/* =========================================================
   PRODOTTI E SALVATAGGIO PREZZO
========================================================= */

async function caricaSuggerimentiProdotti() {
  const prodotti = await PrezziDB.leggiTutti("prodotti");
  const nomi = [...new Map(
    prodotti
      .filter(p => p.nome)
      .map(p => [normalizzaTesto(p.nome), p.nome])
  ).values()].sort((a, b) => a.localeCompare(b, "it"));

  suggerimentiProdotti.innerHTML = "";
  nomi.forEach(nome => {
    const option = document.createElement("option");
    option.value = nome;
    suggerimentiProdotti.appendChild(option);
  });
}

async function salvaNuovoPrezzo() {
  impostaMessaggio(messaggioPrezzo, "");

  const puntoVenditaId = Number(puntoVenditaSelect.value);
  const nome = nomeProdotto.value.trim();
  const prezzo = convertiNumero(prezzoProdotto.value);
  const quantita = convertiNumero(quantitaProdotto.value);
  const unita = unitaProdotto.value;

  if (!puntoVenditaId) {
    impostaMessaggio(messaggioPrezzo, "Seleziona prima un punto vendita.", "error");
    return;
  }
  if (!nome) {
    impostaMessaggio(messaggioPrezzo, "Inserisci il nome del prodotto.", "error");
    return;
  }
  if (!Number.isFinite(prezzo) || prezzo <= 0) {
    impostaMessaggio(messaggioPrezzo, "Inserisci un prezzo valido.", "error");
    return;
  }
  if (!Number.isFinite(quantita) || quantita <= 0) {
    impostaMessaggio(messaggioPrezzo, "Inserisci una quantità valida.", "error");
    return;
  }

  try {
    const [prodotti, negozi] = await Promise.all([
      PrezziDB.leggiTutti("prodotti"),
      PrezziDB.leggiTutti("puntiVendita")
    ]);

    const nomeNormalizzato = normalizzaTesto(nome);
    let prodotto = prodotti.find(p =>
      (p.nomeNormalizzato || normalizzaTesto(p.nome)) === nomeNormalizzato
    );

    if (!prodotto) {
      const nuovo = {
        nome,
        nomeNormalizzato,
        dataCreazione: new Date().toISOString()
      };
      const id = await PrezziDB.aggiungiDato("prodotti", nuovo);
      prodotto = { ...nuovo, id };
    }

    const negozio = negozi.find(n => Number(n.id) === puntoVenditaId);
    if (!negozio) {
      impostaMessaggio(messaggioPrezzo, "Punto vendita non trovato.", "error");
      return;
    }

    const unitario = calcolaPrezzoUnitario(prezzo, quantita, unita);
    const rilevazione = {
      prodottoId: prodotto.id,
      nomeProdotto: prodotto.nome,
      puntoVenditaId: negozio.id,
      nomePuntoVendita: creaNomeNegozio(negozio),
      prezzo,
      quantita,
      unita,
      prezzoUnitario: Number(unitario.valore.toFixed(2)),
      unitaPrezzoUnitario: unitario.unita,
      nota: notaPrezzo.value.trim(),
      promozione: promozionePrezzo.checked,
      dataRilevazione: new Date().toISOString()
    };

    await PrezziDB.aggiungiDato("rilevazioniPrezzi", rilevazione);

    impostaMessaggio(
      messaggioPrezzo,
      `✓ ${prodotto.nome} salvato a ${formattaEuro(prezzo)} · ${formattaNumero(quantita)} ${formattaUnitaConfezione(unita)} · ${formattaEuro(unitario.valore)}/${formattaUnitaPrezzo(unitario.unita)}`,
      "success"
    );

    nomeProdotto.value = "";
    prezzoProdotto.value = "";
    quantitaProdotto.value = "";
    notaPrezzo.value = "";
    promozionePrezzo.checked = false;

    await Promise.all([caricaSuggerimentiProdotti(), aggiornaHome()]);
    nomeProdotto.focus();
  } catch (error) {
    console.error(error);
    impostaMessaggio(messaggioPrezzo, "Errore durante il salvataggio del prezzo.", "error");
  }
}

/* =========================================================
   CERCA PREZZI
========================================================= */

function leggiRicercheRecenti() {
  try {
    const dati = JSON.parse(localStorage.getItem(RICERCHE_RECENTI_KEY) || "[]");
    return Array.isArray(dati) ? dati.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function salvaRicercaRecente(testo) {
  const pulito = String(testo || "").trim();
  if (pulito.length < 2) return;

  const recenti = leggiRicercheRecenti().filter(item =>
    normalizzaTesto(item) !== normalizzaTesto(pulito)
  );
  recenti.unshift(pulito);
  localStorage.setItem(RICERCHE_RECENTI_KEY, JSON.stringify(recenti.slice(0, 5)));
  mostraRicercheRecenti();
}

function mostraRicercheRecenti() {
  const recenti = leggiRicercheRecenti();
  ricercheRecentiLista.innerHTML = "";

  if (!recenti.length) {
    ricercheRecenti.classList.add("hidden");
    return;
  }

  ricercheRecenti.classList.remove("hidden");
  recenti.forEach(testo => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip-button";
    button.textContent = testo;
    button.addEventListener("click", () => {
      mostraTuttiAttivo = false;
      cercaProdotto.value = testo;
      eseguiRicercaPrezzi();
    });
    ricercheRecentiLista.appendChild(button);
  });
}

function nascondiRiepilogoRicerca() {
  riepilogoRicerca.textContent = "";
  riepilogoRicerca.classList.add("hidden");
}

function aggiornaRiepilogoRicerca(rilevazioni) {
  if (!rilevazioni.length) {
    nascondiRiepilogoRicerca();
    return;
  }

  const prodotti = new Set(rilevazioni.map(r => normalizzaTesto(r.nomeProdotto)));
  const negozi = new Set(rilevazioni.map(r => String(r.puntoVenditaId ?? r.nomePuntoVendita ?? "")));
  riepilogoRicerca.textContent = `${prodotti.size} ${prodotti.size === 1 ? "prodotto" : "prodotti"} · ${negozi.size} ${negozi.size === 1 ? "punto vendita" : "punti vendita"}`;
  riepilogoRicerca.classList.remove("hidden");
}

function trovaMiglioriPrezzi(rilevazioni) {
  const mappa = new Map();
  rilevazioni.forEach(r => {
    const unitario = completaPrezzoUnitario(r);
    if (!Number.isFinite(unitario.valore) || !unitario.unita) return;
    const corrente = mappa.get(unitario.unita);
    if (corrente === undefined || unitario.valore < corrente) {
      mappa.set(unitario.unita, unitario.valore);
    }
  });
  return mappa;
}

function calcolaDifferenzaDalMigliore(rilevazione, migliori) {
  const unitario = completaPrezzoUnitario(rilevazione);
  const migliore = migliori.get(unitario.unita);
  if (!Number.isFinite(migliore) || !Number.isFinite(unitario.valore) || migliore <= 0) return null;

  const differenza = unitario.valore - migliore;
  return {
    migliore: Math.abs(differenza) < 0.001,
    differenza: Math.max(0, differenza),
    percentuale: Math.max(0, differenza / migliore * 100),
    unita: unitario.unita
  };
}

function ordinaRilevazioni(rilevazioni) {
  const criterio = ordinaRisultati.value;
  return [...rilevazioni].sort((a, b) => {
    if (criterio === "prezzo") return Number(a.prezzo) - Number(b.prezzo);
    if (criterio === "recente") {
      return new Date(b.dataRilevazione || 0).getTime() - new Date(a.dataRilevazione || 0).getTime();
    }

    const ua = completaPrezzoUnitario(a);
    const ub = completaPrezzoUnitario(b);
    if (ua.unita === ub.unita) return ua.valore - ub.valore;

    const nome = String(a.nomeProdotto || "").localeCompare(String(b.nomeProdotto || ""), "it");
    return nome || String(ua.unita).localeCompare(String(ub.unita), "it");
  });
}

async function eseguiRicercaPrezzi() {
  const testoRicerca = normalizzaTesto(cercaProdotto.value);
  risultatiPrezzi.innerHTML = "";
  nascondiRiepilogoRicerca();

  if (!testoRicerca && !mostraTuttiAttivo) {
    conteggioRisultati.textContent = "Scrivi il nome di un prodotto per iniziare.";
    return;
  }

  try {
    const rilevazioni = await PrezziDB.leggiTutti("rilevazioniPrezzi");
    const perNome = mostraTuttiAttivo && !testoRicerca
      ? rilevazioni
      : rilevazioni.filter(r => corrispondeRicercaProdotto(r.nomeProdotto, testoRicerca));

    const ultime = tieniSoloUltimaRilevazionePerNegozio(perNome);
    const negozioId = Number(filtroPuntoVendita.value);

    const filtrate = ultime.filter(r => {
      if (negozioId && Number(r.puntoVenditaId) !== negozioId) return false;
      if (filtroPromozioni.checked && !r.promozione) return false;
      if (filtroRecenti.checked && giorniDallaRilevazione(r.dataRilevazione) > 14) return false;
      return true;
    });

    const ordinate = ordinaRilevazioni(filtrate);
    if (!ordinate.length) {
      conteggioRisultati.textContent = "Nessun prezzo trovato.";
      const vuoto = document.createElement("div");
      vuoto.className = "empty-box";
      vuoto.textContent = perNome.length
        ? "Ci sono prezzi per questa ricerca, ma nessuno corrisponde ai filtri selezionati."
        : "Non ci sono ancora prezzi salvati per questa ricerca.";
      risultatiPrezzi.appendChild(vuoto);
      return;
    }

    conteggioRisultati.textContent = ordinate.length === 1 ? "1 prezzo trovato." : `${ordinate.length} prezzi trovati.`;
    aggiornaRiepilogoRicerca(ordinate);

    if (!mostraTuttiAttivo && testoRicerca && ordinate.some(r => normalizzaTesto(r.nomeProdotto) === testoRicerca)) {
      salvaRicercaRecente(cercaProdotto.value);
    }

    const migliori = trovaMiglioriPrezzi(ordinate);
    ordinate.forEach(r => risultatiPrezzi.appendChild(creaCardPrezzo(r, migliori)));
  } catch (error) {
    console.error(error);
    conteggioRisultati.textContent = "Errore durante la lettura dei prezzi.";
  }
}

function creaCardPrezzo(rilevazione, migliori) {
  const giorni = giorniDallaRilevazione(rilevazione.dataRilevazione);
  const unitario = completaPrezzoUnitario(rilevazione);
  const differenza = calcolaDifferenzaDalMigliore(rilevazione, migliori);

  const card = document.createElement("article");
  card.className = `risultato-prezzo ${classeEtaPrezzo(giorni)}`;

  const intestazione = document.createElement("div");
  intestazione.className = "risultato-intestazione";
  const titolo = document.createElement("h2");
  titolo.className = "risultato-nome";
  titolo.textContent = rilevazione.nomeProdotto || "Prodotto";
  intestazione.appendChild(titolo);

  if (rilevazione.promozione) intestazione.appendChild(creaBadge("PROMO", "badge-promo"));
  if (differenza?.migliore) intestazione.appendChild(creaBadge("PIÙ CONVENIENTE", "badge-migliore"));
  card.appendChild(intestazione);

  const negozio = document.createElement("p");
  negozio.className = "risultato-negozio";
  negozio.textContent = rilevazione.nomePuntoVendita || "Punto vendita";
  card.appendChild(negozio);

  const rigaPrezzi = document.createElement("div");
  rigaPrezzi.className = "risultato-prezzi-riga";

  const confezione = document.createElement("div");
  confezione.className = "confezione-riga";
  const prezzo = document.createElement("div");
  prezzo.className = "prezzo-confezione";
  prezzo.textContent = formattaEuro(rilevazione.prezzo);
  const qta = document.createElement("div");
  qta.className = "quantita-confezione";
  qta.textContent = `${formattaNumero(rilevazione.quantita)} ${formattaUnitaConfezione(rilevazione.unita)}`;
  confezione.append(prezzo, qta);

  const bloccoUnitario = document.createElement("div");
  bloccoUnitario.className = "blocco-unitario";
  const unitarioEl = document.createElement("div");
  unitarioEl.className = "prezzo-unitario";
  unitarioEl.textContent = `${formattaEuro(unitario.valore)}/${formattaUnitaPrezzo(unitario.unita)}`;
  bloccoUnitario.appendChild(unitarioEl);

  if (differenza && !differenza.migliore) {
    const diff = document.createElement("div");
    diff.className = "differenza-migliore";
    diff.textContent = `+${formattaEuro(differenza.differenza)}/${formattaUnitaPrezzo(differenza.unita)} (+${differenza.percentuale.toLocaleString("it-IT", { maximumFractionDigits: 1 })}%)`;
    bloccoUnitario.appendChild(diff);
  }

  rigaPrezzi.append(confezione, bloccoUnitario);
  card.appendChild(rigaPrezzi);

  const data = document.createElement("p");
  data.className = "risultato-data";
  data.textContent = `Rilevato il ${formattaData(rilevazione.dataRilevazione)} · ${testoEtaPrezzo(giorni)}`;
  card.appendChild(data);

  if (rilevazione.nota) {
    const nota = document.createElement("p");
    nota.className = "risultato-nota";
    nota.textContent = `Nota: ${rilevazione.nota}`;
    card.appendChild(nota);
  }

  const azioni = document.createElement("div");
  azioni.className = "risultato-azioni";

  const storicoButton = creaBottone("Storico prezzi", "secondary-button");
  const listaButton = creaBottone("Alla lista", "secondary-button");
  const aggiornaButton = creaBottone("Aggiorna prezzo", "primary-small-button");
  azioni.append(storicoButton, listaButton, aggiornaButton);
  card.appendChild(azioni);

  const storico = document.createElement("div");
  storico.className = "storico-prezzi hidden";
  card.appendChild(storico);

  storicoButton.addEventListener("click", () => mostraNascondiStorico(rilevazione, storico, storicoButton));
  listaButton.addEventListener("click", async () => {
    await aggiungiElementoListaDaProdotto(rilevazione.prodottoId, rilevazione.nomeProdotto, 1);
    listaButton.textContent = "✓ Aggiunto";
    setTimeout(() => { listaButton.textContent = "Alla lista"; }, 1200);
    await aggiornaHome();
  });
  aggiornaButton.addEventListener("click", () => preparaAggiornamentoPrezzo(rilevazione));

  return card;
}

function creaBadge(testo, classe) {
  const badge = document.createElement("span");
  badge.className = classe;
  badge.textContent = testo;
  return badge;
}

function creaBottone(testo, classe) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = classe;
  button.textContent = testo;
  return button;
}

async function mostraNascondiStorico(rilevazione, contenitore, pulsante) {
  if (!contenitore.classList.contains("hidden")) {
    contenitore.classList.add("hidden");
    pulsante.textContent = "Storico prezzi";
    return;
  }

  contenitore.classList.remove("hidden");
  pulsante.textContent = "Nascondi storico";
  contenitore.textContent = "Caricamento storico...";

  try {
    const tutte = await PrezziDB.leggiTutti("rilevazioniPrezzi");
    const storico = tutte
      .filter(r => Number(r.prodottoId) === Number(rilevazione.prodottoId) && Number(r.puntoVenditaId) === Number(rilevazione.puntoVenditaId))
      .sort((a, b) => new Date(b.dataRilevazione || 0).getTime() - new Date(a.dataRilevazione || 0).getTime());

    contenitore.innerHTML = "";
    const titolo = document.createElement("p");
    titolo.className = "mini-title";
    titolo.textContent = `${storico.length} ${storico.length === 1 ? "rilevazione salvata" : "rilevazioni salvate"}`;
    contenitore.appendChild(titolo);

    storico.forEach(elemento => {
      const riga = document.createElement("div");
      riga.className = "storico-riga";

      const info = document.createElement("div");
      const data = document.createElement("div");
      data.className = "storico-data";
      data.textContent = formattaData(elemento.dataRilevazione);
      const qta = document.createElement("div");
      qta.className = "storico-quantita";
      qta.textContent = `${formattaNumero(elemento.quantita)} ${formattaUnitaConfezione(elemento.unita)} · ${testoEtaPrezzo(giorniDallaRilevazione(elemento.dataRilevazione))}`;
      const unitario = completaPrezzoUnitario(elemento);
      const pu = document.createElement("div");
      pu.className = "storico-unitario";
      pu.textContent = `${formattaEuro(unitario.valore)}/${formattaUnitaPrezzo(unitario.unita)}${elemento.promozione ? " · PROMO" : ""}`;
      info.append(data, qta, pu);

      const prezzo = document.createElement("div");
      prezzo.className = "storico-prezzo";
      prezzo.textContent = formattaEuro(elemento.prezzo);

      const elimina = document.createElement("button");
      elimina.type = "button";
      elimina.className = "storico-delete";
      elimina.textContent = "✕";
      elimina.title = "Elimina questa rilevazione";
      elimina.setAttribute("aria-label", `Elimina rilevazione del ${formattaData(elemento.dataRilevazione)}`);
      elimina.addEventListener("click", async () => {
        const conferma = window.confirm(`Eliminare la rilevazione di ${elemento.nomeProdotto} del ${formattaData(elemento.dataRilevazione)}?`);
        if (!conferma) return;
        await PrezziDB.eliminaDato("rilevazioniPrezzi", elemento.id);
        await pulisciProdottoOrfano(elemento.prodottoId);
        await Promise.all([caricaSuggerimentiProdotti(), aggiornaHome()]);
        await eseguiRicercaPrezzi();
      });

      riga.append(info, prezzo, elimina);
      contenitore.appendChild(riga);
    });
  } catch (error) {
    console.error(error);
    contenitore.textContent = "Errore durante il caricamento dello storico.";
  }
}

async function pulisciProdottoOrfano(prodottoId) {
  if (!prodottoId) return;
  const rilevazioni = await PrezziDB.leggiTutti("rilevazioniPrezzi");
  if (!rilevazioni.some(r => Number(r.prodottoId) === Number(prodottoId))) {
    await PrezziDB.eliminaDato("prodotti", prodottoId);
  }
}

async function preparaAggiornamentoPrezzo(rilevazione) {
  mostraSezione("aggiungi");
  await caricaPuntiVendita();

  puntoVenditaSelect.value = String(rilevazione.puntoVenditaId || "");
  if (puntoVenditaSelect.value) {
    localStorage.setItem(ULTIMO_NEGOZIO_KEY, puntoVenditaSelect.value);
  }
  mostraNegozioSelezionato();

  nomeProdotto.value = rilevazione.nomeProdotto || "";
  prezzoProdotto.value = "";
  quantitaProdotto.value = rilevazione.quantita ?? "";
  unitaProdotto.value = rilevazione.unita || "g";
  notaPrezzo.value = "";
  promozionePrezzo.checked = false;
  impostaMessaggio(messaggioPrezzo, "");
  prezzoProdotto.focus();
}

/* =========================================================
   LISTA DELLA SPESA
========================================================= */

function leggiListaSpesa() {
  try {
    const salvata = JSON.parse(localStorage.getItem(LISTA_SPESA_KEY) || "[]");
    if (!Array.isArray(salvata)) return [];

    return salvata
      .filter(item => item && item.testo)
      .map(item => ({
        ...item,
        id: item.id || creaIdLista(),
        testo: String(item.testo).trim(),
        completato: Boolean(item.completato),
        prodottoId: item.prodottoId ?? null,
        quantitaConfezioni: Math.max(1, Math.min(99, Number(item.quantitaConfezioni) || 1)),
        dataCreazione: item.dataCreazione || new Date().toISOString()
      }));
  } catch (error) {
    console.error("Errore lettura lista spesa:", error);
    return [];
  }
}

function salvaListaSpesa(lista) {
  localStorage.setItem(LISTA_SPESA_KEY, JSON.stringify(lista));
}

async function aggiungiProdottiListaRapida() {
  impostaMessaggio(messaggioLista, "");
  const righe = listaRapidaInput.value.split(/\r?\n/).map(r => r.trim()).filter(Boolean);

  if (!righe.length) {
    impostaMessaggio(messaggioLista, "Scrivi almeno un prodotto.", "error");
    return;
  }

  const lista = leggiListaSpesa();
  righe.forEach(testo => {
    lista.push({
      id: creaIdLista(),
      testo,
      completato: false,
      prodottoId: null,
      quantitaConfezioni: 1,
      dataCreazione: new Date().toISOString()
    });
  });

  salvaListaSpesa(lista);
  listaRapidaInput.value = "";
  impostaMessaggio(messaggioLista, righe.length === 1 ? `✓ ${righe[0]} aggiunto alla lista.` : `✓ ${righe.length} prodotti aggiunti alla lista.`, "success");
  await renderizzaListaSpesa();
  await aggiornaHome();
  listaRapidaInput.focus();
}

async function aggiungiProdottoArchivioAllaLista() {
  impostaMessaggio(messaggioListaArchivio, "");
  const testo = listaProdottoArchivio.value.trim();
  const quantita = Math.max(1, Math.min(99, Math.floor(Number(listaQuantitaConfezioni.value) || 1)));

  if (!testo) {
    impostaMessaggio(messaggioListaArchivio, "Scegli o scrivi un prodotto salvato.", "error");
    return;
  }

  const prodotti = await PrezziDB.leggiTutti("prodotti");
  const prodotto = prodotti.find(p => normalizzaTesto(p.nome) === normalizzaTesto(testo));

  if (!prodotto) {
    impostaMessaggio(messaggioListaArchivio, "Prodotto non trovato nell'archivio. Sceglilo dai suggerimenti oppure aggiungilo come lista rapida.", "error");
    return;
  }

  await aggiungiElementoListaDaProdotto(prodotto.id, prodotto.nome, quantita);
  listaProdottoArchivio.value = "";
  listaQuantitaConfezioni.value = "1";
  impostaMessaggio(messaggioListaArchivio, `✓ ${prodotto.nome} aggiunto alla lista.`, "success");
  await renderizzaListaSpesa();
  await aggiornaHome();
}

async function aggiungiElementoListaDaProdotto(prodottoId, nome, quantita = 1) {
  const lista = leggiListaSpesa();
  const esistente = lista.find(item => !item.completato && Number(item.prodottoId) === Number(prodottoId));

  if (esistente) {
    esistente.quantitaConfezioni = Math.min(99, (Number(esistente.quantitaConfezioni) || 1) + quantita);
  } else {
    lista.push({
      id: creaIdLista(),
      testo: nome || "Prodotto",
      completato: false,
      prodottoId: prodottoId ?? null,
      quantitaConfezioni: Math.max(1, quantita),
      dataCreazione: new Date().toISOString()
    });
  }

  salvaListaSpesa(lista);
}

function trovaCollegamentoAutomatico(elemento, prodotti) {
  if (elemento.prodottoId) {
    const diretto = prodotti.find(p => Number(p.id) === Number(elemento.prodottoId));
    if (diretto) return { prodotto: diretto, automatico: false };
  }

  const testo = normalizzaTesto(elemento.testo);
  if (!testo) return null;

  const esatto = prodotti.find(p => normalizzaTesto(p.nome) === testo);
  if (esatto) return { prodotto: esatto, automatico: true };

  const parole = testo.split(" ").filter(parola => parola.length >= 3);
  if (!parole.length) return null;

  const candidati = prodotti.filter(p => {
    const nome = normalizzaTesto(p.nome);
    return parole.every(parola => nome.includes(parola));
  });

  return candidati.length === 1 ? { prodotto: candidati[0], automatico: true } : null;
}

function trovaMiglioreConfezione(prodottoId, rilevazioni) {
  const delProdotto = rilevazioni.filter(r => Number(r.prodottoId) === Number(prodottoId));
  const ultime = tieniSoloUltimaRilevazionePerNegozio(delProdotto)
    .filter(r => Number.isFinite(Number(r.prezzo)) && Number(r.prezzo) > 0)
    .sort((a, b) => Number(a.prezzo) - Number(b.prezzo));
  return ultime[0] || null;
}

async function renderizzaListaSpesa() {
  const lista = leggiListaSpesa();
  listaSpesaElementi.innerHTML = "";

  const totale = lista.length;
  const spuntati = lista.filter(item => item.completato).length;
  const daComprare = totale - spuntati;
  conteggioLista.textContent = totale ? `${daComprare} da comprare · ${spuntati} spuntati` : "Lista vuota";

  listaVuota.classList.toggle("hidden", totale > 0);
  svuotaLista.classList.toggle("hidden", totale === 0);
  eliminaSpuntati.disabled = spuntati === 0;

  if (!totale) {
    riepilogoListaCard.classList.add("hidden");
    return;
  }

  let prodotti = [];
  let rilevazioni = [];
  try {
    [prodotti, rilevazioni] = await Promise.all([
      PrezziDB.leggiTutti("prodotti"),
      PrezziDB.leggiTutti("rilevazioniPrezzi")
    ]);
  } catch (error) {
    console.error(error);
  }

  let stima = 0;
  let collegatiDaComprare = 0;

  lista.forEach(elemento => {
    const collegamento = trovaCollegamentoAutomatico(elemento, prodotti);
    const migliore = collegamento ? trovaMiglioreConfezione(collegamento.prodotto.id, rilevazioni) : null;
    const qtaConfezioni = Math.max(1, Number(elemento.quantitaConfezioni) || 1);

    if (!elemento.completato && migliore) {
      stima += Number(migliore.prezzo) * qtaConfezioni;
      collegatiDaComprare += 1;
    }

    listaSpesaElementi.appendChild(creaRigaLista(elemento, collegamento, migliore));
  });

  riepilogoListaCard.classList.remove("hidden");
  stimaTotaleLista.textContent = formattaEuro(stima);
  stimaCoperturaLista.textContent = daComprare === 0
    ? "Tutti gli elementi sono spuntati."
    : `${collegatiDaComprare} di ${daComprare} prodotti da comprare hanno una stima di prezzo.`;
}

function creaRigaLista(elemento, collegamento, migliore) {
  const riga = document.createElement("div");
  riga.className = `lista-spesa-riga${elemento.completato ? " completato" : ""}`;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "lista-check";
  checkbox.checked = elemento.completato;
  checkbox.setAttribute("aria-label", `Spunta ${elemento.testo}`);
  checkbox.addEventListener("change", async () => {
    modificaElementoLista(elemento.id, item => ({ ...item, completato: checkbox.checked }));
    await renderizzaListaSpesa();
    await aggiornaHome();
  });

  const main = document.createElement("div");
  main.className = "lista-main";
  const titleRow = document.createElement("div");
  titleRow.className = "lista-title-row";
  const testo = document.createElement("span");
  testo.className = "lista-testo";
  testo.textContent = elemento.testo;
  titleRow.appendChild(testo);
  if (collegamento?.automatico) titleRow.appendChild(creaBadge("COLLEGATO", "badge-auto"));
  main.appendChild(titleRow);

  const meta = document.createElement("div");
  meta.className = "lista-meta";
  if (migliore) {
    const costo = Number(migliore.prezzo) * Math.max(1, Number(elemento.quantitaConfezioni) || 1);
    meta.textContent = `${formattaEuro(costo)} stimati · ${migliore.nomePuntoVendita} · ${formattaNumero(migliore.quantita)} ${formattaUnitaConfezione(migliore.unita)} · ${testoEtaPrezzo(giorniDallaRilevazione(migliore.dataRilevazione))}`;
  } else if (collegamento) {
    meta.textContent = "Prodotto collegato, ma non ci sono prezzi disponibili.";
  } else {
    meta.textContent = "Nessun prezzo collegato automaticamente.";
  }
  main.appendChild(meta);

  if (collegamento) {
    main.style.cursor = "pointer";
    main.title = "Apri Cerca prezzi";
    main.addEventListener("click", () => {
      cercaProdotto.value = collegamento.prodotto.nome;
      mostraTuttiAttivo = false;
      mostraSezione("cerca");
      eseguiRicercaPrezzi();
    });
  }

  const actions = document.createElement("div");
  actions.className = "lista-actions";

  if (collegamento) {
    const meno = creaMiniBottone("−", "Riduci confezioni");
    const qty = document.createElement("span");
    qty.className = "lista-qty";
    qty.textContent = `×${Math.max(1, Number(elemento.quantitaConfezioni) || 1)}`;
    const piu = creaMiniBottone("+", "Aumenta confezioni");

    meno.addEventListener("click", async () => {
      modificaElementoLista(elemento.id, item => ({
        ...item,
        quantitaConfezioni: Math.max(1, (Number(item.quantitaConfezioni) || 1) - 1)
      }));
      await renderizzaListaSpesa();
    });

    piu.addEventListener("click", async () => {
      modificaElementoLista(elemento.id, item => ({
        ...item,
        quantitaConfezioni: Math.min(99, (Number(item.quantitaConfezioni) || 1) + 1)
      }));
      await renderizzaListaSpesa();
    });

    actions.append(meno, qty, piu);
  }

  const elimina = creaMiniBottone("✕", "Elimina dalla lista");
  elimina.classList.add("lista-delete-button");
  elimina.addEventListener("click", async () => {
    salvaListaSpesa(leggiListaSpesa().filter(item => item.id !== elemento.id));
    await renderizzaListaSpesa();
    await aggiornaHome();
  });
  actions.appendChild(elimina);

  riga.append(checkbox, main, actions);
  return riga;
}

function creaMiniBottone(testo, ariaLabel) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "lista-mini-button";
  button.textContent = testo;
  button.setAttribute("aria-label", ariaLabel);
  return button;
}

function modificaElementoLista(id, trasforma) {
  const lista = leggiListaSpesa().map(item => item.id === id ? trasforma(item) : item);
  salvaListaSpesa(lista);
}

async function eliminaElementiSpuntati() {
  salvaListaSpesa(leggiListaSpesa().filter(item => !item.completato));
  await renderizzaListaSpesa();
  await aggiornaHome();
}

async function svuotaTuttaLista() {
  if (!window.confirm("Vuoi davvero svuotare tutta la lista della spesa?")) return;
  salvaListaSpesa([]);
  await renderizzaListaSpesa();
  await aggiornaHome();
  impostaMessaggio(messaggioLista, "Lista svuotata.", "success");
}

/* =========================================================
   PREZZI DA AGGIORNARE
========================================================= */

async function caricaPrezziDaAggiornare() {
  listaAggiornamenti.innerHTML = "";
  conteggioAggiornamenti.textContent = "Caricamento...";

  try {
    const rilevazioni = await PrezziDB.leggiTutti("rilevazioniPrezzi");
    const soglia = Number(sogliaAggiornamenti.value) || 14;
    const negozioId = Number(filtroAggiornamentiNegozio.value);

    const vecchie = tieniSoloUltimaRilevazionePerNegozio(rilevazioni)
      .filter(r => giorniDallaRilevazione(r.dataRilevazione) > soglia)
      .filter(r => !negozioId || Number(r.puntoVenditaId) === negozioId)
      .sort((a, b) => giorniDallaRilevazione(b.dataRilevazione) - giorniDallaRilevazione(a.dataRilevazione));

    conteggioAggiornamenti.textContent = vecchie.length === 0
      ? "Nessun prezzo da aggiornare con questi filtri."
      : vecchie.length === 1
        ? "1 prezzo da aggiornare."
        : `${vecchie.length} prezzi da aggiornare.`;

    if (!vecchie.length) {
      const vuoto = document.createElement("div");
      vuoto.className = "empty-box";
      vuoto.textContent = "Ottimo: non ci sono rilevazioni più vecchie della soglia scelta.";
      listaAggiornamenti.appendChild(vuoto);
      return;
    }

    vecchie.forEach(r => listaAggiornamenti.appendChild(creaCardAggiornamento(r)));
  } catch (error) {
    console.error(error);
    conteggioAggiornamenti.textContent = "Errore durante il caricamento.";
  }
}

function creaCardAggiornamento(rilevazione) {
  const giorni = giorniDallaRilevazione(rilevazione.dataRilevazione);
  const unitario = completaPrezzoUnitario(rilevazione);
  const card = document.createElement("article");
  card.className = `aggiornamento-card ${classeEtaPrezzo(giorni)}`;

  const titolo = document.createElement("h2");
  titolo.className = "risultato-nome";
  titolo.textContent = rilevazione.nomeProdotto || "Prodotto";
  card.appendChild(titolo);

  const negozio = document.createElement("p");
  negozio.className = "risultato-negozio";
  negozio.textContent = rilevazione.nomePuntoVendita || "Punto vendita";
  card.appendChild(negozio);

  const prezzo = document.createElement("div");
  prezzo.className = "confezione-riga";
  const p = document.createElement("span");
  p.className = "prezzo-confezione";
  p.textContent = formattaEuro(rilevazione.prezzo);
  const q = document.createElement("span");
  q.className = "quantita-confezione";
  q.textContent = `${formattaNumero(rilevazione.quantita)} ${formattaUnitaConfezione(rilevazione.unita)} · ${formattaEuro(unitario.valore)}/${formattaUnitaPrezzo(unitario.unita)}`;
  prezzo.append(p, q);
  card.appendChild(prezzo);

  const data = document.createElement("p");
  data.className = "risultato-data";
  data.textContent = `Ultima rilevazione: ${formattaData(rilevazione.dataRilevazione)} · ${giorni} giorni fa`;
  card.appendChild(data);

  const azioni = document.createElement("div");
  azioni.className = "risultato-azioni";
  const button = creaBottone("Aggiorna adesso", "primary-small-button");
  button.addEventListener("click", () => preparaAggiornamentoPrezzo(rilevazione));
  azioni.appendChild(button);
  card.appendChild(azioni);
  return card;
}

/* =========================================================
   BACKUP E RIPRISTINO
========================================================= */

async function aggiornaStatisticheArchivio() {
  try {
    const [negozi, prodotti, rilevazioni, listaStore] = await Promise.all([
      PrezziDB.leggiTutti("puntiVendita"),
      PrezziDB.leggiTutti("prodotti"),
      PrezziDB.leggiTutti("rilevazioniPrezzi"),
      PrezziDB.leggiTutti("listaSpesa")
    ]);
    const lista = leggiListaSpesa();
    const ultimoBackup = localStorage.getItem(ULTIMO_BACKUP_KEY);

    statisticheArchivio.innerHTML = "";
    [
      [negozi.length, "Punti vendita"],
      [prodotti.length, "Prodotti"],
      [rilevazioni.length, "Rilevazioni prezzi"],
      [lista.length, "Voci lista spesa"]
    ].forEach(([valore, etichetta]) => statisticheArchivio.appendChild(creaStatBox(valore, etichetta)));

    if (listaStore.length) {
      statisticheArchivio.appendChild(creaStatBox(listaStore.length, "Voci lista DB legacy"));
    }
    statisticheArchivio.appendChild(creaStatBox(
      ultimoBackup ? formattaData(ultimoBackup) : "Mai",
      "Ultimo backup esportato"
    ));
  } catch (error) {
    console.error(error);
    statisticheArchivio.textContent = "Errore durante la lettura delle statistiche.";
  }
}

function creaStatBox(valore, etichetta) {
  const box = document.createElement("div");
  box.className = "stat-box";
  const value = document.createElement("span");
  value.className = "stat-value";
  value.textContent = String(valore);
  const label = document.createElement("span");
  label.className = "stat-label";
  label.textContent = etichetta;
  box.append(value, label);
  return box;
}

async function creaOggettoBackup() {
  const dati = {};
  for (const archivio of PrezziDB.ARCHIVI) {
    dati[archivio] = await PrezziDB.leggiTutti(archivio);
  }

  return {
    tipo: "PrezziSpesaBackup",
    schemaBackup: 1,
    versioneApp: APP_VERSION,
    esportatoIl: new Date().toISOString(),
    database: {
      nome: PrezziDB.DB_NAME,
      versione: PrezziDB.DB_VERSION,
      dati
    },
    preferenze: {
      listaSpesa: leggiListaSpesa(),
      ricercheRecenti: leggiRicercheRecenti(),
      ultimoPuntoVendita: localStorage.getItem(ULTIMO_NEGOZIO_KEY)
    }
  };
}

async function esportaBackupCompleto() {
  impostaMessaggio(messaggioBackup, "Preparazione backup...");
  try {
    const backup = await creaOggettoBackup();
    const testo = JSON.stringify(backup, null, 2);
    const blob = new Blob([testo], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const data = new Date();
    const y = data.getFullYear();
    const m = String(data.getMonth() + 1).padStart(2, "0");
    const d = String(data.getDate()).padStart(2, "0");
    link.href = url;
    link.download = `prezzi-spesa-backup-${y}-${m}-${d}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    localStorage.setItem(ULTIMO_BACKUP_KEY, backup.esportatoIl);
    impostaMessaggio(messaggioBackup, "✓ Backup completo creato. Conserva il file in un posto sicuro.", "success");
    await aggiornaStatisticheArchivio();
  } catch (error) {
    console.error(error);
    impostaMessaggio(messaggioBackup, "Errore durante la creazione del backup.", "error");
  }
}

async function importaBackupCompleto() {
  impostaMessaggio(messaggioImport, "");
  const file = importaBackupFile.files?.[0];
  if (!file) {
    impostaMessaggio(messaggioImport, "Seleziona prima un file di backup JSON.", "error");
    return;
  }

  try {
    const testo = await file.text();
    const backup = JSON.parse(testo);
    validaBackup(backup);

    const conferma = window.confirm(
      "Il ripristino sostituirà i dati attuali con quelli del backup selezionato. Continuare?"
    );
    if (!conferma) return;

    await PrezziDB.sostituisciArchivi(backup.database.dati);

    const preferenze = backup.preferenze || {};
    salvaListaSpesa(Array.isArray(preferenze.listaSpesa) ? preferenze.listaSpesa : []);
    localStorage.setItem(RICERCHE_RECENTI_KEY, JSON.stringify(Array.isArray(preferenze.ricercheRecenti) ? preferenze.ricercheRecenti : []));

    if (preferenze.ultimoPuntoVendita) {
      localStorage.setItem(ULTIMO_NEGOZIO_KEY, String(preferenze.ultimoPuntoVendita));
    } else {
      localStorage.removeItem(ULTIMO_NEGOZIO_KEY);
    }

    impostaMessaggio(messaggioImport, "✓ Ripristino completato. L'app verrà ricaricata.", "success");
    window.alert("Ripristino completato correttamente. Ora l'app verrà ricaricata.");
    window.location.reload();
  } catch (error) {
    console.error(error);
    impostaMessaggio(messaggioImport, `Backup non valido o non leggibile: ${error.message || "errore sconosciuto"}.`, "error");
  }
}

function validaBackup(backup) {
  if (!backup || backup.tipo !== "PrezziSpesaBackup") {
    throw new Error("il file non è un backup di Prezzi Spesa");
  }
  if (Number(backup.schemaBackup) !== 1) {
    throw new Error("versione del backup non supportata");
  }
  if (!backup.database || !backup.database.dati) {
    throw new Error("dati del database mancanti");
  }

  PrezziDB.ARCHIVI.forEach(archivio => {
    if (!Array.isArray(backup.database.dati[archivio])) {
      throw new Error(`archivio ${archivio} mancante`);
    }
  });
}
