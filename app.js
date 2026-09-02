import { database } from "./firebase-config.js";

import {
  ref,
  set,
  get
} from
"https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";



/*
================================
OLUTLISTA
================================
*/


const beers = [

  /*
  LAATIKKO-OLUET
  */

  {
    id: "box01",
    number: 1,
    name: "Olut 1",
    type: "box"
  },

  {
    id: "box02",
    number: 2,
    name: "Olut 2",
    type: "box"
  },

  {
    id: "box03",
    number: 3,
    name: "Olut 3",
    type: "box"
  },

  {
    id: "box04",
    number: 4,
    name: "Olut 4",
    type: "box"
  },

  {
    id: "box05",
    number: 5,
    name: "Olut 5",
    type: "box"
  },

  {
    id: "box06",
    number: 6,
    name: "Olut 6",
    type: "box"
  },

  {
    id: "box07",
    number: 7,
    name: "Olut 7",
    type: "box"
  },

  {
    id: "box08",
    number: 8,
    name: "Olut 8",
    type: "box"
  },

  {
    id: "box09",
    number: 9,
    name: "Olut 9",
    type: "box"
  },

  {
    id: "box10",
    number: 10,
    name: "Olut 10",
    type: "box"
  },

  {
    id: "box11",
    number: 11,
    name: "Olut 11",
    type: "box"
  },

  {
    id: "box12",
    number: 12,
    name: "Olut 12",
    type: "box"
  },

  {
    id: "box13",
    number: 13,
    name: "Olut 13",
    type: "box"
  },

  {
    id: "box14",
    number: 14,
    name: "Olut 14",
    type: "box"
  },

  {
    id: "box15",
    number: 15,
    name: "Olut 15",
    type: "box"
  },

  {
    id: "box16",
    number: 16,
    name: "Olut 16",
    type: "box"
  },

  {
    id: "box17",
    number: 17,
    name: "Olut 17",
    type: "box"
  },

  {
    id: "box18",
    number: 18,
    name: "Olut 18",
    type: "box"
  },

  {
    id: "box19",
    number: 19,
    name: "Olut 19",
    type: "box"
  },

  {
    id: "box20",
    number: 20,
    name: "Olut 20",
    type: "box"
  },

  {
    id: "box21",
    number: 21,
    name: "Olut 21",
    type: "box"
  },

  {
    id: "box22",
    number: 22,
    name: "Olut 22",
    type: "box"
  },

  {
    id: "box23",
    number: 23,
    name: "Olut 23",
    type: "box"
  },

  {
    id: "box24",
    number: 24,
    name: "Olut 24",
    type: "box"
  },


  /*
  HANAOLUET
  */


  {
    id: "tap01",
    number: 1,
    name: "Hanaolut 1",
    type: "tap"
  },

  {
    id: "tap02",
    number: 2,
    name: "Hanaolut 2",
    type: "tap"
  },

  {
    id: "tap03",
    number: 3,
    name: "Hanaolut 3",
    type: "tap"
  },

  {
    id: "tap04",
    number: 4,
    name: "Hanaolut 4",
    type: "tap"
  }

];



/*
================================
LUO OSALLISTUJA ID
================================
*/


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



document
  .getElementById(
    "participantInfo"
  )
  .innerHTML =

  `
  <div class="participant">

    📱 Äänestät omalla laitteellasi

  </div>
  `;




/*
================================
RENDERÖI OLUT
================================
*/


function renderBeer(
  beer
) {


  return `

  <div
    class="beer-card"
  >


    <div
      class="beer-number"
    >

      ${beer.type === "tap"
        ? "🍺 HANA " + beer.number
        : "📦 " + beer.number}

    </div>



    <div
      class="beer-name"
    >

      ${beer.name}

    </div>



    <div
      class="rating"
    >

      ${[1, 2, 3, 4, 5]
        .map(
          score =>

          `

          <button
            class="star"
            data-beer="${beer.id}"
            data-score="${score}"
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



/*
================================
RENDERÖI OLUTLISTAT
================================
*/


function renderBeers() {


  const bottleBeers =
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

    bottleBeers
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



/*
================================
TALLENNA ÄÄNI
================================
*/


async function vote(
  beerId,
  score
) {


  const voteRef =
    ref(
      database,
      `votes/${beerId}/${participantId}`
    );



  await set(
    voteRef,
    {
      score: score,
      updatedAt:
        Date.now()
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



/*
================================
ÄÄNESTYSNAPIT
================================
*/


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




/*
================================
LATAA AIEMMAT ÄÄNET
================================
*/


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



renderBeers();
