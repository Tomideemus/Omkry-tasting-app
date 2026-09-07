import {
  ref,
  get,
  update,
  remove,
  onValue
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import { database, auth } from "./firebase-config.js";


// --------------------------------------------------
// ELEMENTIT
// --------------------------------------------------

const $ = (id) => document.getElementById(id);

const loginBox = $("loginBox");
const adminPanel = $("adminPanel");

const email = $("email");
const password = $("password");
const loginButton = $("login");
const loginError = $("loginError");

const logoutButton = $("logout");
const seedButton = $("seed");
const clearVotesButton = $("clearVotes");

const adminNotice = $("adminNotice");

const boxAdminGrid = $("boxAdminGrid");
const tapAdminGrid = $("tapAdminGrid");

const beerModal = $("beerModal");
const beerForm = $("beerForm");
const closeBeer = $("closeBeer");

const beerId = $("beerId");
const beerName = $("beerName");
const beerCategory = $("beerCategory");
const beerNumber = $("beerNumber");
const beerOrder = $("beerOrder");

const formTitle = $("formTitle");
const metaNumber = $("metaNumber");
const metaCategory = $("metaCategory");

const preview = $("preview");
const beerImageFile = $("beerImageFile");


// --------------------------------------------------
// MUUTTUJAT
// --------------------------------------------------

let beers = {};
let currentBeerId = null;
let pendingImage = null;


// --------------------------------------------------
// ADMIN-TARKISTUS
// --------------------------------------------------

async function isAdmin(uid) {

  const snapshot = await get(
    ref(database, `users/${uid}/role`)
  );

  return (
    snapshot.exists() &&
    snapshot.val() === "admin"
  );
}


// --------------------------------------------------
// ILMOITUS
// --------------------------------------------------

function showNotice(message, type = "") {

  adminNotice.textContent = message;

  adminNotice.classList.remove("hidden", "error");

  if (type === "error") {
    adminNotice.classList.add("error");
  }
}


// --------------------------------------------------
// LOGIN
// --------------------------------------------------

loginButton.addEventListener("click", async () => {

  loginError.textContent = "";
  loginError.classList.add("hidden");

  const userEmail = email.value.trim();
  const userPassword = password.value;

  if (!userEmail || !userPassword) {

    loginError.textContent =
      "Anna sähköpostiosoite ja salasana.";

    loginError.classList.remove("hidden");

    return;
  }

  loginButton.disabled = true;
  loginButton.textContent = "Kirjaudutaan...";

  try {

    const credential =
      await signInWithEmailAndPassword(
        auth,
        userEmail,
        userPassword
      );

    const admin =
      await isAdmin(credential.user.uid);

    if (!admin) {

      await signOut(auth);

      throw new Error(
        "Tällä käyttäjällä ei ole admin-oikeuksia."
      );
    }

  } catch (error) {

    console.error(error);

    loginError.textContent =
      "Kirjautuminen epäonnistui: " +
      error.message;

    loginError.classList.remove("hidden");

  } finally {

    loginButton.disabled = false;
    loginButton.textContent = "Kirjaudu";
  }
});


// --------------------------------------------------
// AUTH STATE
// --------------------------------------------------

onAuthStateChanged(auth, async (user) => {

  if (!user) {

    loginBox.classList.remove("hidden");
    adminPanel.classList.add("hidden");

    return;
  }

  try {

    const admin =
      await isAdmin(user.uid);

    if (!admin) {

      await signOut(auth);

      return;
    }

    loginBox.classList.add("hidden");
    adminPanel.classList.remove("hidden");

    loadBeers();

  } catch (error) {

    console.error(error);
  }
});


// --------------------------------------------------
// LOGOUT
// --------------------------------------------------

logoutButton.addEventListener("click", async () => {

  await signOut(auth);
});


// --------------------------------------------------
// LUE OLUT
// --------------------------------------------------

function loadBeers() {

  onValue(
    ref(database, "beers"),
    (snapshot) => {

      beers = snapshot.val() || {};

      renderBeerGrids();
    }
  );
}


// --------------------------------------------------
// RENDERÖI OLUT
// --------------------------------------------------

function renderBeerGrids() {

  boxAdminGrid.innerHTML = "";
  tapAdminGrid.innerHTML = "";

  const beerList =
    Object.entries(beers)
      .sort((a, b) => {

        return (
          Number(a[1].order || 0) -
          Number(b[1].order || 0)
        );
      });


  beerList.forEach(([id, beer]) => {

    const card =
      createBeerCard(id, beer);

    if (beer.category === "tap") {

      tapAdminGrid.appendChild(card);

    } else {

      boxAdminGrid.appendChild(card);
    }
  });
}


// --------------------------------------------------
// OLUTKORTTI
// --------------------------------------------------

function createBeerCard(id, beer) {

  const card =
    document.createElement("div");

  card.className =
    beer.category === "tap"
      ? "admin-beer-card tap"
      : "admin-beer-card";


  const imageHTML =
    beer.image
      ? `
        <img
          src="${beer.image}"
          alt="${escapeHtml(beer.name || "")}"
        >
      `
      : `
        <div class="no-image">
          📷
        </div>
      `;


  card.innerHTML = `

    <div class="admin-beer-image">

      ${imageHTML}

    </div>


    <div class="admin-beer-info">

      <div class="admin-beer-number">

        ${
          beer.category === "tap"
            ? "Hana"
            : "Olut"
        }
        ${beer.number}

      </div>


      <div class="admin-beer-name">

        ${escapeHtml(
          beer.name ||
          (
            beer.category === "tap"
              ? `Hana ${beer.number}`
              : `Olut ${beer.number}`
          )
        )}

      </div>


      <button
        type="button"
        class="edit-beer-button"
      >
        Muokkaa
      </button>

    </div>

  `;


  card
    .querySelector(".edit-beer-button")
    .addEventListener(
      "click",
      () => openEditor(id)
    );


  return card;
}


// --------------------------------------------------
// AVAA MUOKKAUS
// --------------------------------------------------

function openEditor(id) {

  const beer = beers[id];

  if (!beer) return;

  currentBeerId = id;

  pendingImage = null;

  beerId.value = id;

  beerName.value =
    beer.name || "";

  beerCategory.value =
    beer.category || "box";

  beerNumber.value =
    beer.number || "";

  beerOrder.value =
    beer.order || "";


  formTitle.textContent =
    beer.name ||
    (
      beer.category === "tap"
        ? `Hana ${beer.number}`
        : `Olut ${beer.number}`
    );


  metaNumber.textContent =
    beer.number || "";


  metaCategory.textContent =
    beer.category === "tap"
      ? "HANAN OLUT"
      : "LAATIKKO-OLUT";


  if (beer.image) {

    preview.innerHTML = `
      <img
        src="${beer.image}"
        alt="Olutkuva"
      >
    `;

  } else {

    preview.innerHTML = `
      <span>
        📷 Lisää olutkuva
      </span>
    `;
  }


  beerModal.classList.remove("hidden");
}


// --------------------------------------------------
// SULJE MUOKKAUS
// --------------------------------------------------

function closeEditor() {

  beerModal.classList.add("hidden");

  currentBeerId = null;
  pendingImage = null;

  beerForm.reset();

  preview.innerHTML = `
    <span>
      📷 Lisää olutkuva
    </span>
  `;
}


closeBeer.addEventListener(
  "click",
  closeEditor
);


// Sulje myös taustaa painamalla
beerModal
  .querySelector(".modal-backdrop")
  ?.addEventListener(
    "click",
    closeEditor
  );


// --------------------------------------------------
// KUVA
// --------------------------------------------------

beerImageFile.addEventListener(
  "change",
  async () => {

    const file =
      beerImageFile.files?.[0];

    if (!file) return;

    try {

      preview.innerHTML = `
        <span>
          Käsitellään kuvaa...
        </span>
      `;


      pendingImage =
        await compressImage(file);


      preview.innerHTML = `
        <img
          src="${pendingImage}"
          alt="Uusi olutkuva"
        >
      `;


    } catch (error) {

      console.error(error);

      pendingImage = null;

      preview.innerHTML = `
        <span>
          ❌ Kuvan käsittely epäonnistui
        </span>
      `;

      alert(
        "Kuvan käsittely epäonnistui."
      );
    }
  }
);


// --------------------------------------------------
// KUVAN PAKKAUS
// --------------------------------------------------

function compressImage(file) {

  return new Promise(
    (resolve, reject) => {

      if (
        !file.type.startsWith("image/")
      ) {

        reject(
          new Error(
            "Tiedosto ei ole kuva."
          )
        );

        return;
      }


      const reader =
        new FileReader();


      reader.onload = (event) => {

        const img =
          new Image();


        img.onload = () => {

          const MAX_SIZE = 1200;

          let width = img.width;
          let height = img.height;


          if (
            width > MAX_SIZE ||
            height > MAX_SIZE
          ) {

            if (width > height) {

              height =
                Math.round(
                  height *
                  MAX_SIZE /
                  width
                );

              width = MAX_SIZE;

            } else {

              width =
                Math.round(
                  width *
                  MAX_SIZE /
                  height
                );

              height = MAX_SIZE;
            }
          }


          const canvas =
            document.createElement(
              "canvas"
            );


          canvas.width = width;
          canvas.height = height;


          const context =
            canvas.getContext("2d");


          context.drawImage(
            img,
            0,
            0,
            width,
            height
          );


          const imageData =
            canvas.toDataURL(
              "image/jpeg",
              0.65
            );


          resolve(imageData);
        };


        img.onerror = () => {

          reject(
            new Error(
              "Kuvan lataaminen epäonnistui."
            )
          );
        };


        img.src =
          event.target.result;
      };


      reader.onerror = () => {

        reject(
          new Error(
            "Kuvan lukeminen epäonnistui."
          )
        );
      };


      reader.readAsDataURL(file);
    }
  );
}


// --------------------------------------------------
// TALLENNA OLUT
// --------------------------------------------------

beerForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    if (!currentBeerId) return;


    const beer =
      beers[currentBeerId];

    if (!beer) return;


    const name =
      beerName.value.trim();


    if (!name) {

      alert(
        "Kirjoita oluen nimi."
      );

      return;
    }


    const saveButton =
      beerForm.querySelector(
        'button[type="submit"]'
      );


    saveButton.disabled = true;

    saveButton.textContent =
      "Tallennetaan...";


    try {

      const updates = {};


      updates[
        `beers/${currentBeerId}/name`
      ] = name;


      // Jos uusi kuva valittiin,
      // tallennetaan se Databaseen.

      if (pendingImage) {

        updates[
          `beers/${currentBeerId}/image`
        ] = pendingImage;
      }


      await update(
        ref(database),
        updates
      );


      showNotice(
        `${name} tallennettu.`
      );


      closeEditor();


    } catch (error) {

      console.error(error);

      alert(
        "Tallennus epäonnistui: " +
        error.message
      );

    } finally {

      saveButton.disabled = false;

      saveButton.textContent =
        "✓ Tallenna";
    }
  }
);


// --------------------------------------------------
// LUO 24 + 4 OLUTPAIKKAA
// --------------------------------------------------

seedButton.addEventListener(
  "click",
  async () => {

    if (
      !confirm(
        "Luodaanko 24 laatikko-olutta ja 4 hanaolutta?"
      )
    ) {

      return;
    }


    const updates = {};


    // BOX-01 ... BOX-24

    for (
      let i = 1;
      i <= 24;
      i++
    ) {

      const number =
        String(i).padStart(2, "0");

      const id =
        `BOX-${number}`;


      if (!beers[id]) {

        updates[`beers/${id}`] = {

          name:
            `Olut ${number}`,

          category:
            "box",

          number:
            number,

          order:
            i,

          image:
            ""
        };
      }
    }


    // TAP-01 ... TAP-04

    for (
      let i = 1;
      i <= 4;
      i++
    ) {

      const number =
        String(i).padStart(2, "0");

      const id =
        `TAP-${number}`;


      if (!beers[id]) {

        updates[`beers/${id}`] = {

          name:
            `Hana ${number}`,

          category:
            "tap",

          number:
            number,

          order:
            i,

          image:
            ""
        };
      }
    }


    try {

      await update(
        ref(database),
        updates
      );


      showNotice(
        "24 laatikko-olutta ja 4 hanaolutta luotu."
      );


    } catch (error) {

      console.error(error);

      showNotice(
        "Olutpaikkojen luonti epäonnistui: " +
        error.message,
        "error"
      );
    }
  }
);


// --------------------------------------------------
// POISTA KAIKKI ÄÄNET
// --------------------------------------------------

clearVotesButton.addEventListener(
  "click",
  async () => {

    if (
      !confirm(
        "Poistetaanko KAIKKI äänet?"
      )
    ) {

      return;
    }


    if (
      !confirm(
        "Tätä ei voi perua. Oletko aivan varma?"
      )
    ) {

      return;
    }


    try {

      await remove(
        ref(database, "votes")
      );


      showNotice(
        "Kaikki äänet poistettu."
      );


    } catch (error) {

      console.error(error);

      showNotice(
        "Äänien poistaminen epäonnistui: " +
        error.message,
        "error"
      );
    }
  }
);


// --------------------------------------------------
// HTML-SUOJAUS
// --------------------------------------------------

function escapeHtml(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
