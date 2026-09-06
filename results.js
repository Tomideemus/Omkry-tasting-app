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
          (a,b) => a + b,
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
      (a,b) =>
        b.average - a.average ||
        b.count - a.count ||
        (a.order ?? 999) -
        (b.order ?? 999)
    );

}


function podiumHTML(items) {

  return items
    .slice(0,3)
    .map(
      (b,i) => `

        <button
          class="podium-item rank-${i+1}"
          data-winner="${esc(b.id)}"
        >

          <div class="rank">
            ${i+1}
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

        </button>

      `
    )
    .join("");

}


function rankingHTML(items) {

  return items
    .slice(3)
    .map(
      (b,i) => `

        <div class="rank-row">

          <span class="rank-num">
            ${i+4}.
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


function render() {

  const all =
    calculate();


  const box =
    all.filter(
      b => b.category === "box"
    );


  const tap =
    all.filter(
      b => b.category === "tap"
    );


  $("boxPodium").innerHTML =
    box.length
      ? podiumHTML(box)
      : `<div class="notice">
          Ei vielä tuloksia.
        </div>`;


  $("tapPodium").innerHTML =
    tap.length
      ? podiumHTML(tap)
      : `<div class="notice">
          Ei vielä tuloksia.
        </div>`;


  $("boxRanking").innerHTML =
    rankingHTML(box);


  $("tapRanking").innerHTML =
    rankingHTML(tap);


  $("boxVotes").textContent =
    `${box.reduce(
      (sum,b) =>
        sum + b.count,
      0
    )} ääntä`;


  $("tapVotes").textContent =
    `${tap.reduce(
      (sum,b) =>
        sum + b.count,
      0
    )} ääntä`;

}


function showWinner(id) {

  const b =
    calculate()
      .find(
        x => x.id === id
      );


  if (!b) {
    return;
  }


  $("winnerCard").className =
    `winner-card ${
      b.category === "tap"
        ? "tap-winner"
        : "box-winner"
    }`;


  $("winnerCategory").textContent =
    b.category === "tap"
      ? "HANAVOITTAJA"
      : "LAATIKKOVOITTAJA";


  $("winnerNumber").textContent =
    b.number || b.id;


  $("winnerName").textContent =
    b.name;


  $("winnerScore").textContent =
    `${b.average.toFixed(2)} ★`;


  $("winnerVotes").textContent =
    `${b.count} ääntä`;


  $("winnerImage").innerHTML =
    b.image
      ? `<img
          src="${esc(b.image)}"
          alt=""
        >`
      : "🍺";


  $("winnerConfetti").innerHTML =
    Array.from(
      {length:28},
      (_,i) =>
        `<i style="--i:${i}">
          ✦
        </i>`
    ).join("");


  $("winnerModal")
    .classList
    .remove("hidden");

}


document.addEventListener(
  "click",
  event => {

    const item =
      event.target.closest(
        "[data-winner]"
      );


    if (item) {

      showWinner(
        item.dataset.winner
      );

    }


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


onValue(
  ref(database, "beers"),
  snapshot => {

    const data =
      snapshot.val() || {};


    beers =
      Object.entries(data)
        .map(
          ([id,value]) => ({
            id,
            ...value
          })
        );


    render();

  }
);


onValue(
  ref(database, "votes"),
  snapshot => {

    votes =
      snapshot.val() || {};


    render();

  }
);
