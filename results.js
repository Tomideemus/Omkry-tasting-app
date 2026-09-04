import {
  database
} from "./firebase-config.js";


import {

  ref,

  onValue

} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";




// =====================================
// OLUTLISTA
// =====================================


const beers = [


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

      name:
        `OLUT ${index + 1}`,

      type:
        "box"

    })

  ),



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

      name:
        `HANA ${index + 1}`,

      type:
        "tap"

    })

  )


];



let currentBoxResults = [];

let currentTapResults = [];

let winnerSequence = [];




// =====================================
// FIREBASE LIVE-KUUNTELU
// =====================================


const votesReference =

  ref(

    database,

    "votes"

  );



onValue(

  votesReference,

  snapshot => {


    const votes =

      snapshot.val()

      ||

      {};



    const results =

      calculateResults(votes);



    currentBoxResults =

      results

        .filter(

          beer =>

            beer.type === "box"

        )

        .sort(sortResults);



    currentTapResults =

      results

        .filter(

          beer =>

            beer.type === "tap"

        )

        .sort(sortResults);



    renderCategory(

      currentBoxResults,

      "box"

    );



    renderCategory(

      currentTapResults,

      "tap"

    );


  }

);




// =====================================
// LASKE TULOKSET
// =====================================


function calculateResults(votes) {


  return beers.map(beer => {


    const beerVotes =

      votes[beer.id]

        ?

        Object.values(

          votes[beer.id]

        )

        :

        [];



    const scores =

      beerVotes

        .map(

          vote =>

            Number(vote.score)

        )

        .filter(

          score =>

            score >= 1

            &&

            score <= 5

        );



    const voteCount =

      scores.length;



    const average =

      voteCount > 0

        ?

        scores.reduce(

          (total, score) =>

            total + score,

          0

        )

        /

        voteCount

        :

        0;



    return {

      ...beer,

      average,

      voteCount

    };


  });


}




// =====================================
// JÄRJESTÄ TULOKSET
// =====================================


function sortResults(a, b) {


  if (

    b.average !== a.average

  ) {


    return (

      b.average -

      a.average

    );


  }



  return (

    b.voteCount -

    a.voteCount

  );


}




// =====================================
// RENDERÖI KATEGORIA
// =====================================


function renderCategory(

  results,

  category

) {


  const votedBeers =

    results.filter(

      beer =>

        beer.voteCount > 0

    );



  const totalVotes =

    results.reduce(

      (total, beer) =>

        total + beer.voteCount,

      0

    );



  document

    .getElementById(

      `${category}VoteCount`

    )

    .textContent =

      `Yhteensä ääniä: ${totalVotes}`;



  renderPodium(

    votedBeers,

    category

  );



  renderRanking(

    votedBeers,

    category

  );


}




// =====================================
// TOP 3 PODIUM
// =====================================


function renderPodium(

  results,

  category

) {


  const podium =

    document.getElementById(

      `${category}Podium`

    );



  if (

    results.length === 0

  ) {


    podium.innerHTML =

      `

        <div class="no-results">

          Ei vielä ääniä

        </div>

      `;


    return;


  }



  const topThree =

    results.slice(

      0,

      3

    );



  const podiumOrder =

    [

      1,

      0,

      2

    ];



  const medals =

    [

      "🥇",

      "🥈",

      "🥉"

    ];



  podium.innerHTML =

    podiumOrder

      .map(resultIndex => {


        const beer =

          topThree[resultIndex];



        if (!beer) {


          return `

            <div class="podium-place empty">

            </div>

          `;


        }



        const place =

          resultIndex + 1;



        return `


          <div

            class="podium-place place-${place}"

          >


            <div class="podium-medal">

              ${medals[resultIndex]}

            </div>



            <div class="podium-icon">

              ${category === "box"

                ? "📦"

                : "🍺"

              }

            </div>



            <div class="podium-beer-name">

              ${beer.name}

            </div>



            <div class="podium-average">

              ${beer.average.toFixed(2)}

              ★

            </div>



            <div class="podium-votes">

              ${beer.voteCount}

              ääntä

            </div>


          </div>


        `;


      })

      .join("");


}




// =====================================
// RANKING-LISTA
// =====================================


function renderRanking(

  results,

  category

) {


  const ranking =

    document.getElementById(

      `${category}Ranking`

    );



  const displayResults =

    results.slice(

      3,

      10

    );



  if (

    displayResults.length === 0

  ) {


    ranking.innerHTML =

      `

        <div class="no-results-small">

          Odotetaan lisää arvioita...

        </div>

      `;


    return;


  }



  ranking.innerHTML =

    displayResults

      .map(

        (beer, index) => {


          const rank =

            index + 4;



          const width =

            beer.average * 20;



          return `


            <div class="ranking-row">


              <div class="ranking-position">

                ${rank}.

              </div>



              <div class="ranking-name">

                ${beer.name}

              </div>



              <div class="ranking-bar-background">


                <div

                  class="ranking-bar ${category}-bar"

                  style="width: ${width}%"

                ></div>


              </div>



              <div class="ranking-score">

                ${beer.average.toFixed(2)}

              </div>



              <div class="ranking-votes">

                ${beer.voteCount}

              </div>


            </div>


          `;


        }

      )

      .join("");


}




// =====================================
// VOITTAJA-ANIMAATIO
// =====================================


const modal =

  document.getElementById(

    "winnerModal"

  );


const winnerCategory =

  document.getElementById(

    "winnerCategory"

  );


const winnerIcon =

  document.getElementById(

    "winnerIcon"

  );


const winnerName =

  document.getElementById(

    "winnerName"

  );


const winnerScore =

  document.getElementById(

    "winnerScore"

  );


const winnerVotes =

  document.getElementById(

    "winnerVotes"

  );


const winnerNextButton =

  document.getElementById(

    "winnerNextButton"

  );


const winnerContent =

  document.getElementById(

    "winnerContent"

  );




function showWinner(

  beer,

  category,

  hasNext = false

) {


  if (!beer) {


    alert(

      "Tässä kategoriassa ei ole vielä ääniä."

    );


    return;


  }



  modal.classList.add(

    "active"

  );



  winnerContent.classList.remove(

    "box-winner",

    "tap-winner",

    "winner-enter"

  );



  void winnerContent.offsetWidth;



  winnerContent.classList.add(

    category === "box"

      ?

      "box-winner"

      :

      "tap-winner"

  );



  winnerContent.classList.add(

    "winner-enter"

  );



  winnerCategory.textContent =

    category === "box"

      ?

      "📦 LAATIKKOOLUET"

      :

      "🍺 HANAOLUET";



  winnerIcon.textContent =

    category === "box"

      ?

      "📦"

      :

      "🍺";



  winnerName.textContent =

    beer.name;



  winnerScore.innerHTML =

    `${beer.average.toFixed(2)} ★`;



  winnerVotes.textContent =

    `${beer.voteCount} ääntä`;



  winnerNextButton.textContent =

    hasNext

      ?

      "SEURAAVA VOITTAJA →"

      :

      "SULJE";



  createConfetti(category);


}




// =====================================
// KONFETTI
// =====================================


function createConfetti(category) {


  const container =

    document.getElementById(

      "confetti"

    );



  container.innerHTML =

    "";



  for (

    let i = 0;

    i < 70;

    i++

  ) {


    const piece =

      document.createElement(

        "div"

      );



    piece.className =

      `confetti-piece ${category}-confetti`;



    piece.style.left =

      `${Math.random() * 100}%`;



    piece.style.animationDelay =

      `${Math.random() * 1.5}s`;



    piece.style.animationDuration =

      `${2 + Math.random() * 2}s`;



    container.appendChild(piece);


  }


}




// =====================================
// SULJE VOITTAJA
// =====================================


function closeWinner() {


  modal.classList.remove(

    "active"

  );


  winnerSequence = [];


}




document

  .getElementById(

    "closeWinner"

  )

  .addEventListener(

    "click",

    closeWinner

  );




// =====================================
// LAATIKKOVOITTAJA
// =====================================


document

  .getElementById(

    "showBoxWinner"

  )

  .addEventListener(

    "click",

    () => {


      const winner =

        currentBoxResults.find(

          beer =>

            beer.voteCount > 0

        );



      showWinner(

        winner,

        "box"

      );


    }

  );




// =====================================
// HANAVOITTAJA
// =====================================


document

  .getElementById(

    "showTapWinner"

  )

  .addEventListener(

    "click",

    () => {


      const winner =

        currentTapResults.find(

          beer =>

            beer.voteCount > 0

        );



      showWinner(

        winner,

        "tap"

      );


    }

  );




// =====================================
// MOLEMMAT VOITTAJAT
// =====================================


document

  .getElementById(

    "showBothWinners"

  )

  .addEventListener(

    "click",

    () => {


      const boxWinner =

        currentBoxResults.find(

          beer =>

            beer.voteCount > 0

        );



      const tapWinner =

        currentTapResults.find(

          beer =>

            beer.voteCount > 0

        );



      if (

        !boxWinner

        ||

        !tapWinner

      ) {


        alert(

          "Molemmissa kategorioissa täytyy olla vähintään yksi arvio."

        );


        return;


      }



      winnerSequence = [

        {

          beer:
            boxWinner,

          category:
            "box"

        },

        {

          beer:
            tapWinner,

          category:
            "tap"

        }

      ];



      const first =

        winnerSequence.shift();



      showWinner(

        first.beer,

        first.category,

        true

      );


    }

  );




// =====================================
// SEURAAVA VOITTAJA
// =====================================


winnerNextButton

  .addEventListener(

    "click",

    () => {


      if (

        winnerSequence.length > 0

      ) {


        const nextWinner =

          winnerSequence.shift();



        showWinner(

          nextWinner.beer,

          nextWinner.category,

          false

        );


      }


      else {


        closeWinner();


      }


    }

  );




// =====================================
// ESC
// =====================================


document.addEventListener(

  "keydown",

  event => {


    if (

      event.key === "Escape"

    ) {


      closeWinner();


    }


  }

);
