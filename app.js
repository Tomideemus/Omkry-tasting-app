import {
  database
} from "./firebase-config.js";


import {

  ref,

  set,

  get

} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";




// =====================================
// OLUTLISTA
// =====================================


const beers = [


  // 24 LAATIKKO-OLUTTA

  ...Array.from(

    {
      length: 24
    },

    (_, index) => ({

      id:
        `box${String(
          index + 1
        ).padStart(
          2,
          "0"
        )}`,

      number:
        index + 1,

      name:
        `OLUT ${index + 1}`,

      type:
        "box"

    })

  ),



  // 4 HANAOLUTTA

  ...Array.from(

    {
      length: 4
    },

    (_, index) => ({

      id:
        `tap${String(
          index + 1
        ).padStart(
          2,
          "0"
        )}`,

      number:
        index + 1,

      name:
        `HANA ${index + 1}`,

      type:
        "tap"

    })

  )


];




// =====================================
// LUO LAITEKOHTAINEN OSALLISTUJA-ID
// =====================================


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




// =====================================
// TÄHTIEN LUONTI
// =====================================
//
// ALUKSI KAIKKI TÄHDET OVAT
// HARMAITA JA TYHJIÄ ☆
// =====================================


function createStars(beer) {


  return [1, 2, 3, 4, 5]

    .map(score => `

      <button

        class="star-button"

        data-beer="${beer.id}"

        data-score="${score}"

        aria-label="${score} pistettä"

      >

        ☆

      </button>

    `)

    .join("");


}




// =====================================
// OLUTKORTTI
// =====================================


function createBeerCard(beer) {


  const icon =

    beer.type === "box"

      ? "📦"

      : "🍺";



  return `


    <article

      class="beer-card ${beer.type}-beer-card"

    >


      <div class="beer-card-title">


        <span class="beer-small-icon">

          ${icon}

        </span>


        <span>

          ${beer.name}

        </span>


      </div>



      <div

        class="rating"

        id="rating-${beer.id}"

      >


        ${createStars(beer)}


      </div>



      <div class="score-numbers">


        <span>1</span>

        <span>2</span>

        <span>3</span>

        <span>4</span>

        <span>5</span>


      </div>



      <div

        class="save-status"

        id="status-${beer.id}"

      >

        Ei vielä arvosteltu

      </div>


    </article>


  `;


}




// =====================================
// RENDERÖI OLUET
// =====================================


function renderBeers() {


  const boxBeers =

    beers.filter(

      beer => beer.type === "box"

    );



  const tapBeers =

    beers.filter(

      beer => beer.type === "tap"

    );



  document
    .getElementById("boxBeers")
    .innerHTML =

    boxBeers

      .map(createBeerCard)

      .join("");



  document
    .getElementById("tapBeers")
    .innerHTML =

    tapBeers

      .map(createBeerCard)

      .join("");



  loadSavedRatings();


}




// =====================================
// PÄIVITÄ TÄHTIEN ULKOASU
// =====================================
//
// VAIN ANNETUT PISTEET
// MUUTTUVAT KELTAISIKSI ★
// =====================================


function updateStars(

  beerId,

  score

) {


  const buttons =

    document.querySelectorAll(

      `[data-beer="${beerId}"]`

    );



  buttons.forEach(button => {


    const buttonScore =

      Number(

        button.dataset.score

      );



    // VALITTU TÄHTI


    if (buttonScore <= score) {


      button.classList.add(
        "selected"
      );


      // Täytetty tähti

      button.textContent =
        "★";


    }


    // EI VALITTU TÄHTI


    else {


      button.classList.remove(
        "selected"
      );


      // Tyhjä tähti

      button.textContent =
        "☆";


    }


  });


}




// =====================================
// TALLENNA ÄÄNI FIREBASEEN
// =====================================


async function saveVote(

  beerId,

  score

) {


  const status =

    document.getElementById(

      `status-${beerId}`

    );



  status.textContent =

    "Tallennetaan...";



  try {


    const voteReference =

      ref(

        database,

        `votes/${beerId}/${participantId}`

      );



    await set(

      voteReference,

      {

        score:
          score,


        updatedAt:
          Date.now()

      }

    );



    // PÄIVITÄ TÄHDET VASTA,
    // KUN ÄÄNI ON TALLENNETTU


    updateStars(

      beerId,

      score

    );



    status.innerHTML =

      `

        <span class="saved-check">

          ✓

        </span>

        Tallennettu

        ·

        ${score}/5

      `;


  }


  catch (error) {


    console.error(error);


    status.textContent =

      "Tallennus epäonnistui";


  }


}




// =====================================
// TÄHDEN KLIKKAUS
// =====================================


document.addEventListener(

  "click",

  event => {


    const button =

      event.target.closest(

        ".star-button"

      );



    if (!button) {


      return;


    }



    const beerId =

      button.dataset.beer;



    const score =

      Number(

        button.dataset.score

      );



    saveVote(

      beerId,

      score

    );


  }

);




// =====================================
// LATAA AIEMMIN TALLENNETUT ARVIOT
// =====================================


async function loadSavedRatings() {


  for (const beer of beers) {


    try {


      const voteReference =

        ref(

          database,

          `votes/${beer.id}/${participantId}`

        );



      const snapshot =

        await get(

          voteReference

        );



      if (snapshot.exists()) {


        const vote =

          snapshot.val();



        // NÄYTÄ AIEMMIN ANNETUT
        // KELTAISET TÄHDET


        updateStars(

          beer.id,

          vote.score

        );



        const status =

          document.getElementById(

            `status-${beer.id}`

          );



        status.innerHTML =

          `

            <span class="saved-check">

              ✓

            </span>

            Tallennettu

            ·

            ${vote.score}/5

          `;


      }


    }


    catch (error) {


      console.error(error);


    }


  }


}




// =====================================
// KÄYNNISTYS
// =====================================


renderBeers();
