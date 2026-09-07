import {
  ref,
  get,
  set,
  remove,
  onValue
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import { database, auth } from "./firebase-config.js";

const $ = (id) => document.getElementById(id);

let currentUser = null;
let currentBeer = null;
let beers = {};

const loginSection = $("loginSection");
const adminSection = $("adminSection");

const loginForm = $("loginForm");
const emailInput = $("email");
const passwordInput = $("password");
const loginError = $("loginError");

const beerGrid = $("beerGrid");

const editor = $("editor");
const editorForm = $("editorForm");

const beerImage = $("beerImage");
const imageInput = $("imageInput");
const beerName = $("beerName");

const formTitle = $("formTitle");
const metaNumber = $("metaNumber");
const metaCategory = $("metaCategory");

const saveButton = $("saveButton");
const cancelButton = $("cancelButton");

const createBeersButton = $("createBeersButton");
const clearVotesButton = $("clearVotesButton");

const logoutButton = $("logoutButton");


// --------------------------------------------------
// ADMIN CHECK
// --------------------------------------------------

async function isAdmin(uid) {
  const snapshot = await get(ref(database, `users/${uid}/role`));
  return snapshot.exists() && snapshot.val() === "admin";
}


// --------------------------------------------------
// IMAGE COMPRESSION
// --------------------------------------------------

function compressImage(file) {
  return new Promise((resolve, reject) => {

    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("Valittu tiedosto ei ole kuva."));
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {

      const img = new Image();

      img.onload = () => {

        const MAX_SIZE = 1200;

        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round(height * MAX_SIZE / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round(width * MAX_SIZE / height);
            height = MAX_SIZE;
          }
        }

        const canvas = document.createElement("canvas");

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");

        ctx.drawImage(img, 0, 0, width, height);

        // JPEG quality
        const compressed = canvas.toDataURL("image/jpeg", 0.75);

        resolve(compressed);
      };

      img.onerror = () => {
        reject(new Error("Kuvan käsittely epäonnistui."));
      };

      img.src = event.target.result;
    };

    reader.onerror = () => {
      reject(new Error("Kuvan lukeminen epäonnistui."));
    };

    reader.readAsDataURL(file);
  });
}


// --------------------------------------------------
// LOGIN
// --------------------------------------------------

loginForm?.addEventListener("submit", async (event) => {

  event.preventDefault();

  loginError.textContent = "";

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  try {

    const credential =
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

    const admin = await isAdmin(credential.user.uid);

    if (!admin) {

      await signOut(auth);

      loginError.textContent =
        "Tällä käyttäjällä ei ole admin-oikeuksia.";

      return;
    }

    showAdmin();

  } catch (error) {

    console.error(error);

    loginError.textContent =
      "Kirjautuminen epäonnistui: " + error.message;
  }
});


// --------------------------------------------------
// AUTH STATE
// --------------------------------------------------

onAuthStateChanged(auth, async (user) => {

  if (!user) {

    currentUser = null;

    if (loginSection) loginSection.hidden = false;
    if (adminSection) adminSection.hidden = true;

    return;
  }

  try {

    const admin = await isAdmin(user.uid);

    if (!admin) {

      await signOut(auth);

      return;
    }

    currentUser = user;

    showAdmin();

  } catch (error) {

    console.error(error);
  }
});


// --------------------------------------------------
// SHOW ADMIN
// --------------------------------------------------

function showAdmin() {

  if (loginSection) loginSection.hidden = true;
  if (adminSection) adminSection.hidden = false;

  loadBeers();
}


// --------------------------------------------------
// LOAD BEERS
// --------------------------------------------------

function loadBeers() {

  onValue(
    ref(database, "beers"),
    (snapshot) => {

      beers = snapshot.val() || {};

      renderBeers();
    }
  );
}


// --------------------------------------------------
// RENDER BEER CARDS
// --------------------------------------------------

function renderBeers() {

  if (!beerGrid) return;

  beerGrid.innerHTML = "";

  const beerList = Object.entries(beers)
    .sort((a, b) => {

      const A = a[1];
      const B = b[1];

      if (A.category !== B.category) {
        return A.category === "box" ? -1 : 1;
      }

      return Number(A.order || 0) - Number(B.order || 0);
    });

  beerList.forEach(([id, beer]) => {

    const card = document.createElement("div");

    card.className =
      beer.category === "tap"
        ? "admin-beer-card tap"
        : "admin-beer-card";

    const image = beer.image
      ? `<img src="${beer.image}" alt="">`
      : `<div class="no-image">📷</div>`;

    const number =
      beer.category === "tap"
        ? `Hana ${beer.number}`
        : `Olut ${beer.number}`;

    card.innerHTML = `
      <div class="admin-beer-image">
        ${image}
      </div>

      <div class="admin-beer-info">

        <div class="admin-beer-number">
          ${number}
        </div>

        <div class="admin-beer-name">
          ${escapeHtml(beer.name || "Nimeämätön olut")}
        </div>

        <button
          type="button"
          class="edit-beer-button"
          data-id="${id}">
          Muokkaa
        </button>

      </div>
    `;

    card
      .querySelector(".edit-beer-button")
      .addEventListener("click", () => {

        openEditor(id);
      });

    beerGrid.appendChild(card);
  });
}


// --------------------------------------------------
// OPEN EDITOR
// --------------------------------------------------

function openEditor(id) {

  const beer = beers[id];

  if (!beer) return;

  currentBeer = id;

  beerName.value = beer.name || "";

  if (beer.image) {

    beerImage.src = beer.image;
    beerImage.hidden = false;

  } else {

    beerImage.src = "";
    beerImage.hidden = true;
  }

  formTitle.textContent =
    beer.name ||
    (
      beer.category === "tap"
        ? `Hana ${beer.number}`
        : `Olut ${beer.number}`
    );

  metaNumber.textContent =
    beer.number || id;

  metaCategory.textContent =
    beer.category === "tap"
      ? "HANAN OLUT"
      : "LAATIKKO-OLUT";

  editor.hidden = false;

  editor.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}


// --------------------------------------------------
// IMAGE SELECTION
// --------------------------------------------------

imageInput?.addEventListener("change", async () => {

  const file = imageInput.files?.[0];

  if (!file) return;

  try {

    saveButton.disabled = true;

    saveButton.textContent = "Käsitellään kuvaa...";

    const imageData =
      await compressImage(file);

    beerImage.src = imageData;
    beerImage.hidden = false;

    // Store temporarily in the editor
    beerImage.dataset.pendingImage = imageData;

    saveButton.textContent = "Tallenna";
    saveButton.disabled = false;

  } catch (error) {

    console.error(error);

    alert(
      "Kuvan käsittely epäonnistui: " +
      error.message
    );

    saveButton.textContent = "Tallenna";
    saveButton.disabled = false;
  }
});


// --------------------------------------------------
// SAVE BEER
// --------------------------------------------------

editorForm?.addEventListener("submit", async (event) => {

  event.preventDefault();

  if (!currentBeer) return;

  const beer = beers[currentBeer];

  if (!beer) return;

  const name =
    beerName.value.trim();

  if (!name) {

    alert("Anna oluelle nimi.");

    return;
  }

  try {

    saveButton.disabled = true;
    saveButton.textContent = "Tallennetaan...";

    const data = {
      ...beer,
      name: name
    };

    // If a new image was selected,
    // save it directly into Realtime Database.
    if (beerImage.dataset.pendingImage) {

      data.image =
        beerImage.dataset.pendingImage;

      delete beerImage.dataset.pendingImage;
    }

    await set(
      ref(database, `beers/${currentBeer}`),
      data
    );

    alert("Olut tallennettu!");

    editor.hidden = true;

  } catch (error) {

    console.error(error);

    alert(
      "Tallennus epäonnistui: " +
      error.message
    );

  } finally {

    saveButton.disabled = false;
    saveButton.textContent = "Tallenna";
  }
});


// --------------------------------------------------
// CANCEL
// --------------------------------------------------

cancelButton?.addEventListener("click", () => {

  editor.hidden = true;

  currentBeer = null;
});


// --------------------------------------------------
// CREATE 24 + 4 BEERS
// --------------------------------------------------

createBeersButton?.addEventListener(
  "click",
  async () => {

    if (!confirm(
      "Luodaanko 24 laatikko-olutta ja 4 hanaolutta?"
    )) {
      return;
    }

    try {

      const updates = {};

      // 24 boxed beers

      for (let i = 1; i <= 24; i++) {

        const id =
          `BOX-${String(i).padStart(2, "0")}`;

        if (!beers[id]) {

          updates[`beers/${id}`] = {

            name: `Olut ${String(i).padStart(2, "0")}`,

            category: "box",

            number:
              String(i).padStart(2, "0"),

            order: i,

            image: ""
          };
        }
      }

      // 4 tap beers

      for (let i = 1; i <= 4; i++) {

        const id =
          `TAP-${String(i).padStart(2, "0")}`;

        if (!beers[id]) {

          updates[`beers/${id}`] = {

            name: `Hana ${String(i).padStart(2, "0")}`,

            category: "tap",

            number:
              String(i).padStart(2, "0"),

            order: i,

            image: ""
          };
        }
      }

      // Multi-path update
      // avoids overwriting existing beers.

      import {
        ref,
        get,
        set,
        update,
        remove,
        onValue
      } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";

      await update(
        ref(database),
        updates
      );
      alert(
        "24 laatikko-olutta ja 4 hanaolutta luotu!"
      );

    } catch (error) {

      console.error(error);

      alert(
        "Olutpaikkojen luonti epäonnistui: " +
        error.message
      );
    }
  }
);


// --------------------------------------------------
// CLEAR VOTES
// --------------------------------------------------

clearVotesButton?.addEventListener(
  "click",
  async () => {

    if (!confirm(
      "Poistetaanko KAIKKI äänet?"
    )) {
      return;
    }

    if (!confirm(
      "Tätä ei voi perua. Poistetaanko kaikki äänet?"
    )) {
      return;
    }

    try {

      await remove(
        ref(database, "votes")
      );

      alert("Kaikki äänet poistettu.");

    } catch (error) {

      console.error(error);

      alert(
        "Äänien poistaminen epäonnistui: " +
        error.message
      );
    }
  }
);


// --------------------------------------------------
// LOGOUT
// --------------------------------------------------

logoutButton?.addEventListener(
  "click",
  async () => {

    await signOut(auth);
  }
);


// --------------------------------------------------
// ESCAPE HTML
// --------------------------------------------------

function escapeHtml(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


// --------------------------------------------------
// EXISTING ROOT DATA
// --------------------------------------------------
//
// This function is used when creating the initial
// beer slots.
//
// NOTE:
// We don't want to overwrite existing votes/users.
//
// --------------------------------------------------
