import { database } from "./firebase-config.js";

import {
  ref,
  onValue
} from
"https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";


// =================================
// OLUTLISTA
// =================================


const beers = [

  // LAATIKKO-OLUET

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


  // HANAOLUET

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
// KUUNTELE ÄÄNIÄ
// =================================


const votesRef =
  ref(
    database,
    "votes"
  );


onValue(
  votesRef,
  snapshot => {


    const votes =
      snapshot.val() || {};


    const results =
      calculateResults(
        votes
      );


    // Erotellaan kategoriat

    const boxResults =
      results
        .filter(
          beer =>
            beer.type === "box"
        )
        .sort(
          sortResults
        );


    const tapResults =
      results
        .filter(
          beer =>
            beer.type === "tap"
        )
        .sort(
          sortResults
        );


    // Renderöi laatikkooluet

    renderCategory(
      boxResults,
      "box"
    );


    // Renderöi hanaoluet

    renderCategory(
      tapResults,
      "tap"
    );


  }
);


// =================================
// LASKE TULOKSET
// =================================


function calculateResults(
  votes
) {


  return beers.map(
    beer => {


      const beerVotes =
        votes[beer.id]
          ? Object.values(
              votes[
                beer.id
              ]
            )
          : [];


      const scores =
        beerVotes
          .map(
            vote =>
              Number(
                vote.score
              )
          )
          .filter(
            score =>
              score >= 1 &&
              score <= 5
          );


      const voteCount =
        scores.length;


      const average =
        voteCount > 0

          ? scores.reduce(
              (
                total,
                score
              ) =>

                total + score,

              0
            )

            / voteCount

          : 0;


      return {

        ...beer,

        voteCount,

        average

      };


    }
  );


}


// =================================
// JÄRJESTÄ TULOKSET
// =================================


function sortResults(
  a,
  b
) {


  // Keskiarvo suurimmasta pienimpään

  if (
    b.average !==
    a.average
  ) {

    return (
      b.average -
      a.average
    );

  }


  // Tasatilanteessa enemmän ääniä voittaa

  return (
    b.voteCount -
    a.voteCount
  );


}


// =================================
// RENDERÖI KATEGORIA
// =================================


function renderCategory(
  results,
  category
) {


  const resultsWithVotes =
    results.filter(
      beer =>
        beer.voteCount > 0
    );


  // Kokonaisäänimäärä

  const totalVotes =
    results.reduce(
      (
        total,
        beer
      ) =>

        total +
        beer.voteCount,

      0
    );


  document
    .getElementById(
      `${category}TotalVotes`
    )
    .innerHTML =

    `
      Yhteensä
      <strong>
        ${totalVotes}
      </strong>
      annettua arviota
    `;


  // TOP 3

  renderPodium(
    resultsWithVotes,
    category
  );


  // Koko lista

  renderResults(
    results,
    category
  );


}


// =================================
// RENDERÖI TOP 3
// =================================


function renderPodium(
  results,
  category
) {


  const podium =
    document.getElementById(
      `${category}Podium`
    );


  const topThree =
    results
      .slice(
        0,
        3
      );


  const medals =
    [
      "🥇",
      "🥈",
      "🥉"
    ];


  podium.innerHTML =
    topThree
      .map(
        (
          beer,
          index
        ) =>

          `

            <div
              class="podium-card"
            >

              <div
                class="medal"
              >

                ${medals[index]}

              </div>


              <h3>

                ${beer.name}

              </h3>


              <div
                class="podium-score"
              >

                ${beer.average.toFixed(2)}
                ⭐

              </div>


              <small>

                ${beer.voteCount}
                ääntä

              </small>


            </div>

          `
      )
      .join("");


}


// =================================
// RENDERÖI KOKO TULOSLISTA
// =================================


function renderResults(
  results,
  category
) {


  const container =
    document.getElementById(
      `${category}Results`
    );


  container.innerHTML =
    results
      .map(
        (
          beer,
          index
        ) => {


          // Pylväs 0–100 %

          const barWidth =
            beer.average *
            20;


          return `

            <div
              class="result-row"
            >


              <div
                class="rank"
              >

                ${index + 1}.

              </div>


              <div
                class="result-name"
              >

                ${beer.type === "box"
                  ? "📦"
                  : "🍺"}

                ${beer.name}

              </div>


              <div
                class="bar-container"
              >

                <div
                  class="bar"
                  style="
                    width:
                    ${barWidth}%
                  "
                ></div>

              </div>


              <div
                class="score"
              >

                ${beer.voteCount > 0

                  ? beer.average.toFixed(2)

                  : "-"
                }

                ${beer.voteCount > 0

                  ? "⭐"

                  : ""
                }

              </div>


              <div
                class="votes"
              >

                ${beer.voteCount}

                ääntä

              </div>


            </div>

          `;


        }
      )
      .join("");


}
