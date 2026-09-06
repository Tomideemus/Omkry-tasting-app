import {
  ref,
  onValue,
  set,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";

import {
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
  database,
  auth
} from "./firebase-config.js";


const $ = id => document.getElementById(id);

let currentUid = null;
let beers = [];
let myVotes = {};


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


function toast(text) {

  const el = $("toast");

  el.textContent = text;

  el.classList.add("show");

  setTimeout(() => {
    el.classList.remove("show");
  }, 2200);

}


function createCard(beer) {

  const score = myVotes[beer.id] ?? 0;


  const image = beer.image
    ? `<img
        class="beer-image"
        src="${esc(beer.image)}"
        alt=""
        loading="lazy"
      >`
    : `<div class="beer-placeholder">🍺</div>`;


  return `
    <article
      class="beer-card ${beer.category === "tap" ? "tap-card" : ""}"
      data-id="${esc(beer.id)}"
    >

      <div class="beer-number">
        ${esc(beer.number || beer.id)}
      </div>


      <div class="beer-photo">
        ${image}
      </div>


      <div class="beer-info">

        <h3>
          ${esc(beer.name)}
        </h3>


        <div
          class="rating"
          role="group"
          aria-label="Arvostele ${esc(beer.name)}"
        >

          ${[1,2,3,4,5].map(number => `

            <button
              class="star-button ${number <= score ? "selected" : ""}"
              data-score="${number}"
              aria-label="${number} tähteä"
            >
              ${number <= score ? "★" : "☆"}
            </button>

          `).join("")}

        </div>


        <div class="vote-status">

          ${
            score
              ? `✓ Tallennettu · ${score}/5`
              : "Ei vielä arvioitu"
          }

        </div>

      </div>

    </article>
  `;
}


function render() {

  const box = beers
    .filter(b => b.category === "box")
    .sort(
      (a,b) =>
        (a.order ?? 999) -
        (b.order ?? 999)
    );


  const tap = beers
    .filter(b => b.category === "tap")
    .sort(
      (a,b) =>
        (a.order ?? 999) -
        (b.order ?? 999)
    );


  $("loading").classList.add("hidden");


  $("boxSection").classList.toggle(
    "hidden",
    !box.length
  );


  $("tapSection").classList.toggle(
    "hidden",
    !tap.length
  );


  $("emptyState").classList.toggle(
    "hidden",
    beers.length > 0
  );


  $("boxCount").textContent =
    `${box.length} olutta`;


  $("tapCount").textContent =
    `${tap.length} olutta`;


  $("boxBeers").innerHTML =
    box.map(createCard).join("");


  $("tapBeers").innerHTML =
    tap.map(createCard).join("");

}


async function saveVote(beerId, score) {

  if (!currentUid) {
    throw new Error(
      "Käyttäjää ei ole kirjautunut"
    );
  }


  await set(
    ref(
      database,
      `votes/${beerId}/${currentUid}`
    ),
    {
      score: score,
      updatedAt: serverTimestamp()
    }
  );


  myVotes[beerId] = score;

  render();

  toast(
    "Arvio tallennettu ✓"
  );

}


document.addEventListener(
  "click",
  async event => {

    const button =
      event.target.closest(
        ".star-button"
      );


    if (!button) {
      return;
    }


    const card =
      button.closest(
        ".beer-card"
      );


    if (!card) {
      return;
    }


    const beerId =
      card.dataset.id;


    const score =
      Number(
        button.dataset.score
      );


    try {

      button.disabled = true;

      await saveVote(
        beerId,
        score
      );

    } catch (error) {

      console.error(error);

      toast(
        "Tallennus epäonnistui"
      );

    } finally {

      button.disabled = false;

    }

  }
);


onValue(
  ref(database, "beers"),

  snapshot => {

    const data =
      snapshot.val() || {};


    beers =
      Object.entries(data).map(
        ([id,value]) => ({
          id,
          ...value
        })
      );


    render();

  },

  error => {

    $("loading").classList.add(
      "hidden"
    );


    $("error").textContent =
      "Oluiden lataus epäonnistui. Tarkista Firebase-asetukset ja Security Rules.";


    $("error").classList.remove(
      "hidden"
    );


    console.error(error);

  }
);


onAuthStateChanged(
  auth,

  user => {

    if (!user) {
      return;
    }


    currentUid =
      user.uid;


    onValue(
      ref(database, "votes"),

      snapshot => {

        const all =
          snapshot.val() || {};


        myVotes = {};


        for (
          const [beerId,users]
          of Object.entries(all)
        ) {

          if (
            users &&
            users[currentUid]
          ) {

            myVotes[beerId] =
              Number(
                users[currentUid].score || 0
              );

          }

        }


        render();

      }
    );

  }
);


signInAnonymously(auth)
  .catch(error => {

    $("error").textContent =
      "Äänestyskirjautuminen epäonnistui. Ota Firebase Authentication > Anonymous käyttöön.";


    $("error").classList.remove(
      "hidden"
    );


    console.error(error);

  });
