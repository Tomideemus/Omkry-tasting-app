import {
  ref,
  onValue
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";

import {
  database
} from "./firebase-config.js";


const $ =
  id => document.getElementById(id);


let beers = [];
let votes = {};


/* --------------------------------------------------
   HTML ESCAPE
-------------------------------------------------- */

const esc = value =>
  String(value ?? "").replace(
    /[&<>"']/g,
    char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char])
  );


/* --------------------------------------------------
   CALCULATE RESULTS
-------------------------------------------------- */

function calculate() {

  return beers
    .map(beer => {

      const vals =
        Object.values(
          votes[beer.id] || {}
        )
        .map(
          vote =>
            Number(
              vote?.score
            )
        )
        .filter(
          value =>
            value >= 1 &&
            value <= 5
        );


      const total =
        vals.reduce(
          (a, b) => a + b,
          0
        );


      return {
        ...beer,

        count: vals.length,

        average:
          vals.length
            ? total / vals.length
            : 0
      };

    })

    .sort(
      (a, b) =>

        /* 1. Suurempi keskiarvo ensin */
        b.average - a.average ||

        /* 2. Tasatilanteessa enemmän ääniä */
        b.count - a.count ||

        /* 3. Tasatilanteessa pienempi olutnumero */
        (Number(a.order) || 999) -
        (Number(b.order) || 999)
    );

}


/* --------------------------------------------------
   PODIUM
-------------------------------------------------- */

function podiumHTML(items) {

  return items
    .slice(0, 3)
    .map(
      (b, i) => {

        /*
         * VAIN SIJA 1 SAA data-winner-attribuutin.
         *
         * Sijat 2 ja 3 eivät ole klikattavia
         * voittajan avaamista varten.
         */

        const winnerAttribute =
          i === 0 && b.count > 0
            ? `data-winner="${esc(b.id)}"`
            : "";


        const tag =
          i === 0 && b.count > 0
            ? "button"
            : "div";


        const closeTag =
          tag === "button"
            ? "button"
            : "div";


        return `

          <${tag}
            class="podium-item rank-${i + 1} ${
              i === 0 && b.count > 0
                ? "winner-clickable"
                : ""
            }"
            ${winnerAttribute}
            ${
              tag === "button"
                ? 'type="button"'
                : ""
            }
          >

            <div class="rank">
              ${i + 1}
            </div>


            <div class="result-photo">

              ${
                b.image
                  ? `<img
                      src="${esc(b.image)}"
                      alt=""
                    >`
                  : "🍺"
              }

            </div>


            <div class="result-number">
              ${esc(
                b.number || b.id
              )}
            </div>


            <strong>
              ${esc(b.name)}
            </strong>


            <span>
              ${b.average.toFixed(2)} ★
            </span>


            <small>
              ${b.count} ääntä
            </small>

          </${closeTag}>

        `;

      }
    )
    .join("");

}


/* --------------------------------------------------
   RANKING
-------------------------------------------------- */

function rankingHTML(items) {

  return items
    .slice(3)
    .map(
      (b, i) => `

        <div class="rank-row">

          <span class="rank-num">
            ${i + 4}.
          </span>


          <div class="rank-name">

            <strong>
              ${esc(
                b.number || b.id
              )}
            </strong>

            <span>
              ${esc(b.name)}
            </span>

          </div>


          <div class="bar">

            <i
              style="width:${Math.max(
                4,
                b.average / 5 * 100
              )}%"
            ></i>

          </div>


          <strong>
            ${b.average.toFixed(2)} ★
          </strong>


          <small>
            ${b.count}
          </small>

        </div>

      `
    )
    .join("");

}


/* --------------------------------------------------
   RENDER
-------------------------------------------------- */

function render() {

  const all =
    calculate();


  /*
   * Erotellaan laatikko- ja hanaoluet.
   */

  const box =
    all.filter(
      b =>
        b.category === "box"
    );


  const tap =
    all.filter(
      b =>
        b.category === "tap"
    );


  /* ------------------------------------------------
     LAATIKKO-OLUET
  ------------------------------------------------ */

  $("boxPodium").innerHTML =
    box.length
      ? podiumHTML(box)
      : `
          <div class="notice">
            Ei vielä tuloksia.
          </div>
        `;


  $("boxRanking").innerHTML =
    rankingHTML(box);


  $("boxVotes").textContent =
    `${box.reduce(
      (sum, b) =>
        sum + b.count,
      0
    )} ääntä`;


  /* ------------------------------------------------
     HANAAOLUET
  ------------------------------------------------ */

  $("tapPodium").innerHTML =
    tap.length
      ? podiumHTML(tap)
      : `
          <div class="notice">
            Ei vielä tuloksia.
          </div>
        `;


  $("tapRanking").innerHTML =
    rankingHTML(tap);


  $("tapVotes").textContent =
    `${tap.reduce(
      (sum, b) =>
        sum + b.count,
      0
    )} ääntä`;

}


/* --------------------------------------------------
   SHOW WINNER
-------------------------------------------------- */

function showWinner(id) {

  /*
   * Lasketaan tulokset uudelleen.
   */

  const all =
    calculate();


  /*
   * Etsitään klikattu olut.
   */

  const clickedBeer =
    all.find(
      beer =>
        beer.id === id
    );


  if (!clickedBeer) {
    return;
  }


  /*
   * TÄRKEÄ KORJAUS:
   *
   * Tarkistetaan, että klikattu olut on
   * oman kategoriansa oikeasti 1. sijalla.
   */

  const categoryResults =
    all.filter(
      beer =>
        beer.category ===
        clickedBeer.category
    );


  const winner =
    categoryResults[0];


  /*
   * Jos klikattu olut EI ole ykkönen,
   * voittajaikkunaa ei avata.
   */

  if (
    !winner ||
    winner.id !== clickedBeer.id
  ) {
    return;
  }


  /*
   * Lisäksi ykkösellä täytyy olla vähintään
   * yksi oikea ääni.
   */

  if (winner.count < 1) {
    return;
  }


  /* ------------------------------------------------
     VOITTAJAN TIEDOT
  ------------------------------------------------ */

  $("winnerCard").className =
    `winner-card ${
      winner.category === "tap"
        ? "tap-winner"
        : "box-winner"
    }`;


  $("winnerCategory").textContent =
    winner.category === "tap"
      ? "HANAVOITTAJA"
      : "LAATIKKOVOITTAJA";


  $("winnerNumber").textContent =
    winner.number ||
    winner.id;


  $("winnerName").textContent =
    winner.name;


  $("winnerScore").textContent =
    `${winner.average.toFixed(2)} ★`;


  $("winnerVotes").textContent =
    `${winner.count} ääntä`;


  $("winnerImage").innerHTML =
    winner.image
      ? `<img
          src="${esc(winner.image)}"
          alt=""
        >`
      : "🍺";


  /* ------------------------------------------------
     CONFETTI
  ------------------------------------------------ */

  $("winnerConfetti").innerHTML =
    Array.from(
      { length: 28 },
      (_, i) =>
        `<i style="--i:${i}">
          ✦
        </i>`
    )
    .join("");


  /* ------------------------------------------------
     AVAA VOITTAJA-MODAL
  ------------------------------------------------ */

  $("winnerModal")
    .classList
    .remove("hidden");

}


/* --------------------------------------------------
   CLICK HANDLER
-------------------------------------------------- */

document.addEventListener(
  "click",
  event => {

    /*
     * Etsitään elementti, jolla on
     * data-winner.
     *
     * HUOM:
     * Nyt vain 1. sija saa tämän attribuutin.
     */

    const item =
      event.target.closest(
        "[data-winner]"
      );


    if (item) {

      showWinner(
        item.dataset.winner
      );

    }


    /*
     * Sulje voittajaikkuna.
     */

    if (
      event.target.id ===
        "closeWinner" ||

      event.target.classList.contains(
        "modal-backdrop"
      )
    ) {

      $("winnerModal")
        .classList
        .add("hidden");

    }

  }
);


/* --------------------------------------------------
   BEERS
-------------------------------------------------- */

onValue(
  ref(database, "beers"),
  snapshot => {

    const data =
      snapshot.val() || {};


    beers =
      Object.entries(data)
        .map(
          ([id, value]) => ({
            id,
            ...value
          })
        );


    render();

  }
);


/* --------------------------------------------------
   VOTES
-------------------------------------------------- */

onValue(
  ref(database, "votes"),
  snapshot => {

    votes =
      snapshot.val() || {};


    render();

  }
);
