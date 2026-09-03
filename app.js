import { database } from "./firebase-config.js";

import {
  ref,
  set,
  get
} from
"https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";


// =================================
// OLUTLISTA
// =================================


const beers = [

  // =============================
  // 24 LAATIKKO-OLUTTA
  // =============================

  ...Array.from(
    { length: 24 },
    (_, index) => ({

      id:
        `box${String(index + 1).padStart(2, "0")}`,

      number:
        index + 1,

      name:
        `Olut ${index + 1}`,

      type:
        "box"

    })
  ),


  // =============================
  // 4 HANAOLUTTA
  // =============================

  ...Array.from(
    { length: 4 },
    (_, index) => ({

      id:
        `tap${String(index + 1).padStart(2, "0")}`,

      number:
        index + 1,

      name:
        `Hana ${index + 1}`,

      type:
        "tap"

    })
  )

];


// =================================
// OSALLISTUJA ID
// =================================


let participantId =
  localStorage.getItem(
    "omkryParticipantId"
  );


if (!participantId) {

  participantId =
    crypto.randomUUID();


  localStorage.setItem(
    "omkryParticipantId",
    participantId
  );

}


// =================================
// OLUTKORTTI
// =================================


function renderBeer(beer) {

  return `

    <div class="beer-card">

      <div class="beer-number">

        ${beer.type === "box"
          ? "📦 Olut"
          : "🍺 Hana"}

        ${beer.number}

      </div>


      <div class="beer-name">

        ${beer.name}

      </div>


      <div class="rating">

        ${[1, 2, 3, 4, 5]
          .map(
            score => `

              <button
                class="star"
                data-beer="${beer.id}"
                data-score="${score}"
                aria-label="Anna ${score} pistettä"
              >
                ⭐
              </button>

            `
          )
          .join("")
        }

      </div>


      <div
        class="rating-text"
        id="rating-${beer.id}"
      >

        Ei vielä arvosteltu

      </div>

    </div>

  `;

}


// =================================
// RENDERÖI OLUTLISTAT
// =================================


function renderBeers() {


  const boxBeers =
    beers.filter(
      beer =>
        beer.type === "box"
    );


  const tapBeers =
    beers.filter(
      beer =>
        beer.type === "tap"
    );


  document
    .getElementById(
      "bottleBeers"
    )
    .innerHTML =

    boxBeers
      .map(renderBeer)
      .join("");


  document
    .getElementById(
      "tapBeers"
    )
    .innerHTML =

    tapBeers
      .map(renderBeer)
      .join("");


  loadUserRatings();

}


// =================================
// TALLENNA ÄÄNI
// =================================


async function vote(
  beerId,
  score
) {


  try {

    const voteRef =
      ref(
        database,
        `votes/${beerId}/${participantId}`
      );


    await set(
      voteRef,
      {
        score: score,
        updatedAt: Date.now()
      }
    );


    document
      .getElementById(
        `rating-${beerId}`
      )
      .innerHTML =

      `
        Oma arviosi:

        <strong>
          ${score} / 5 ⭐
        </strong>
      `;


  }

  catch (error) {

    console.error(error);


    alert(
      "Äänen tallentaminen epäonnistui. Tarkista internet-yhteys."
    );

  }


}


// =================================
// ÄÄNESTYSNAPIT
// =================================


document.addEventListener(
  "click",
  event => {


    if (
      event.target.classList.contains(
        "star"
      )
    ) {


      const beerId =
        event.target.dataset.beer;


      const score =
        Number(
          event.target.dataset.score
        );


      vote(
        beerId,
        score
      );


    }


  }
);


// =================================
// LATAA AIEMMAT ÄÄNET
// =================================


async function loadUserRatings() {


  for (
    const beer of beers
  ) {


    const voteRef =
      ref(
        database,
        `votes/${beer.id}/${participantId}`
      );


    const snapshot =
      await get(
        voteRef
      );


    if (
      snapshot.exists()
    ) {


      const data =
        snapshot.val();


      document
        .getElementById(
          `rating-${beer.id}`
        )
        .innerHTML =

        `
          Oma arviosi:

          <strong>
            ${data.score} / 5 ⭐
          </strong>
        `;


    }


  }


}


// =================================
// KÄYNNISTÄ SOVELLUS
// =================================


renderBeers();
