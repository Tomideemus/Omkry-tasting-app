import { database } from "./firebase-config.js";

import {
  ref,
  onValue
} from
"https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";



const beers = [

  ...Array.from(
    { length: 24 },
    (_, index) => ({

      id:
        `box${String(
          index + 1
        ).padStart(
          2,
          "0"
        )}`,

      name:
        `Olut ${index + 1}`,

      type:
        "box"

    })
  ),


  ...Array.from(
    { length: 4 },
    (_, index) => ({

      id:
        `tap${String(
          index + 1
        ).padStart(
          2,
          "0"
        )}`,

      name:
        `Hanaolut ${index + 1}`,

      type:
        "tap"

    })
  )

];



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
      beers.map(
        beer => {


          const beerVotes =
            votes[
              beer.id
            ]
            ? Object.values(
                votes[
                  beer.id
                ]
              )
            : [];


          const scores =
            beerVotes.map(
              vote =>
                vote.score
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



    results.sort(
      (
        a,
        b
      ) => {


        if (
          b.average ===
          a.average
        ) {

          return (
            b.voteCount -
            a.voteCount
          );

        }


        return (
          b.average -
          a.average
        );


      }
    );



    renderResults(
      results
    );


  }
);




function renderResults(
  results
) {


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
      "totalVotes"
    )
    .innerHTML =

    `
    Yhteensä

    <strong>

      ${totalVotes}

    </strong>

    annettua arviota
    `;



  renderPodium(
    results
  );



  const container =
    document.getElementById(
      "results"
    );



  container.innerHTML =
    "";



  results.forEach(
    (
      beer,
      index
    ) => {


      const maxWidth =
        beer.average *
        20;



      const element =
        document.createElement(
          "div"
        );


      element.className =
        "result-row";



      element.innerHTML =

        `

        <div
          class="rank"
        >

          ${index + 1}.

        </div>



        <div
          class="result-name"
        >

          ${beer.type === "tap"

            ? "🍺"

            : "📦"

          }

          ${beer.name}

        </div>



        <div
          class="bar-container"
        >

          <div
            class="bar"
            style="
              width:
              ${maxWidth}%
            "
          >

          </div>

        </div>



        <div
          class="score"
        >

          ${beer.average.toFixed(
            2
          )}

          ⭐

        </div>



        <div
          class="votes"
        >

          ${beer.voteCount}

          ääntä

        </div>


        `;



      container.appendChild(
        element
      );


    }
  );


}




function renderPodium(
  results
) {


  const podium =
    document.getElementById(
      "podium"
    );



  const topThree =
    results
      .filter(
        beer =>
          beer.voteCount > 0
      )
      .slice(
        0,
        3
      );



  podium.innerHTML =
    topThree
      .map(
        (
          beer,
          index
        ) => {


          const medals =
            [

              "🥇",

              "🥈",

              "🥉"

            ];



          return `

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

              ${beer.average.toFixed(
                2
              )}

              ⭐

            </div>



            <small>

              ${beer.voteCount}

              ääntä

            </small>


          </div>

          `;


        }
      )
      .join("");


}
