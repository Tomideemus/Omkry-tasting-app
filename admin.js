import {
  ref,
  onValue,
  set,
  update,
  remove
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-storage.js";

import {
  database,
  auth,
  storage
} from "./firebase-config.js";


const $ =
  id => document.getElementById(id);


let user = null;
let beers = {};


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


function notice(
  text,
  error = false
) {

  const n =
    $("adminNotice");


  n.textContent =
    text;


  n.className =
    `notice ${error ? "error" : ""}`;


  n.classList.remove(
    "hidden"
  );


  setTimeout(
    () =>
      n.classList.add(
        "hidden"
      ),
    3500
  );

}


function modal(open) {

  $("beerModal")
    .classList
    .toggle(
      "hidden",
      !open
    );

}


async function isAdmin(uid) {

  const snap =
    await new Promise(
      resolve =>
        onValue(
          ref(
            database,
            `users/${uid}/role`
          ),
          snapshot =>
            resolve(snapshot),
          {
            onlyOnce: true
          }
        )
    );


  return (
    snap.val() ===
    "admin"
  );

}


onAuthStateChanged(
  auth,
  async u => {

    user = u;


    if (
      !u ||
      u.isAnonymous
    ) {

      $("loginBox")
        .classList
        .remove("hidden");


      $("adminPanel")
        .classList
        .add("hidden");


      return;

    }


    try {

      if (
        await isAdmin(
          u.uid
        )
      ) {

        $("loginBox")
          .classList
          .add("hidden");


        $("adminPanel")
          .classList
          .remove("hidden");


        render();

      } else {

        await signOut(
          auth
        );


        $("loginError")
          .textContent =
          "Tällä tunnuksella ei ole admin-oikeutta.";


        $("loginError")
          .classList
          .remove("hidden");

      }

    } catch (error) {

      console.error(error);

    }

  }
);


$("login").onclick =
  async () => {

    try {

      await signInWithEmailAndPassword(
        auth,
        $("email").value,
        $("password").value
      );

    } catch (error) {

      $("loginError")
        .textContent =
        "Kirjautuminen epäonnistui.";


      $("loginError")
        .classList
        .remove("hidden");

    }

  };


$("logout").onclick =
  () =>
    signOut(auth);


onValue(
  ref(database, "beers"),
  snapshot => {

    beers =
      snapshot.val() || {};


    render();

  }
);


function card(
  id,
  b,
  category,
  index
) {

  const number =
    category === "box"
      ? String(index).padStart(
          2,
          "0"
        )
      : `TAP ${String(index).padStart(
          2,
          "0"
        )}`;


  return `

    <article class="admin-beer-card">

      <div class="admin-card-number">
        ${number}
      </div>


      <div class="admin-card-photo">

        ${
          b?.image
            ? `<img
                src="${esc(b.image)}"
                alt=""
              >`
            : `
              <span>📷</span>
              <small>Ei kuvaa</small>
            `
        }

      </div>


      <div class="admin-card-info">

        <strong>
          ${esc(
            b?.name ||
            "Nimeämätön olut"
          )}
        </strong>

        <small>
          ${
            b?.name
              ? "Kuva ja nimi tallennettu"
              : "Lisää kuva ja nimi"
          }
        </small>

      </div>


      <button
        class="primary-btn edit-beer"
        data-edit="${id}"
      >
        ✎ Muokkaa
      </button>

    </article>

  `;

}


function render() {

  const boxes = [];
  const taps = [];


  for (
    let i = 1;
    i <= 24;
    i++
  ) {

    const id =
      `BOX-${String(i).padStart(
        2,
        "0"
      )}`;


    boxes.push(
      card(
        id,
        beers[id],
        "box",
        i
      )
    );

  }


  for (
    let i = 1;
    i <= 4;
    i++
  ) {

    const id =
      `TAP-${String(i).padStart(
        2,
        "0"
      )}`;


    taps.push(
      card(
        id,
        beers[id],
        "tap",
        i
      )
    );

  }


  if (
    $("boxAdminGrid")
  ) {

    $("boxAdminGrid")
      .innerHTML =
      boxes.join("");

  }


  if (
    $("tapAdminGrid")
  ) {

    $("tapAdminGrid")
      .innerHTML =
      taps.join("");

  }

}


$("seed").onclick =
  async () => {

    if (
      !user ||
      !confirm(
        "Luodaanko puuttuvat 24 laatikko-olutta ja 4 hanaolutta?"
      )
    ) {
      return;
    }


    const updates = {};


    for (
      let i = 1;
      i <= 24;
      i++
    ) {

      const id =
        `BOX-${String(i).padStart(
          2,
          "0"
        )}`;


      if (!beers[id]) {

        updates[
          `beers/${id}`
        ] = {

          name:
            `Olut ${String(i).padStart(
              2,
              "0"
            )}`,

          category:
            "box",

          number:
            String(i).padStart(
              2,
              "0"
            ),

          order:
            i,

          image:
            ""

        };

      }

    }


    for (
      let i = 1;
      i <= 4;
      i++
    ) {

      const id =
        `TAP-${String(i).padStart(
          2,
          "0"
        )}`;


      if (!beers[id]) {

        updates[
          `beers/${id}`
        ] = {

          name:
            `Hana ${String(i).padStart(
              2,
              "0"
            )}`,

          category:
            "tap",

          number:
            `TAP ${String(i).padStart(
              2,
              "0"
            )}`,

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


      notice(
        "Olutpaikat luotu ✓"
      );

    } catch (error) {

      console.error(error);

      notice(
        "Olutpaikkojen luonti epäonnistui.",
        true
      );

    }

  };


function openEditor(id) {

  const b =
    beers[id] || {};


  $("beerId").value =
    id;


  $("beerName").value =
    b.name || "";


  $("beerCategory").value =
    b.category || "box";


  $("beerNumber").value =
    b.number || id;


  $("beerOrder").value =
    b.order || 1;


  $("preview").innerHTML =
    b.image
      ? `<img
          src="${esc(b.image)}"
          alt=""
        >`
      : `
        <div class="preview-empty">
          📷 Ota kuva
        </div>
      `;


  $("beerImageFile").value =
    "";


  modal(true);

}


document.addEventListener(
  "click",
  event => {

    const edit =
      event.target.closest(
        "[data-edit]"
      );


    if (edit) {

      openEditor(
        edit.dataset.edit
      );

    }


    if (
      event.target.id ===
        "closeBeer" ||
      event.target.classList.contains(
        "modal-backdrop"
      )
    ) {

      modal(false);

    }

  }
);


async function resizeImage(file) {

  const bitmap =
    await createImageBitmap(
      file
    );


  const max = 1200;


  const scale =
    Math.min(
      1,
      max / bitmap.width,
      max / bitmap.height
    );


  const canvas =
    document.createElement(
      "canvas"
    );


  canvas.width =
    Math.round(
      bitmap.width * scale
    );


  canvas.height =
    Math.round(
      bitmap.height * scale
    );


  const ctx =
    canvas.getContext(
      "2d"
    );


  ctx.drawImage(
    bitmap,
    0,
    0,
    canvas.width,
    canvas.height
  );


  return new Promise(
    resolve =>
      canvas.toBlob(
        resolve,
        "image/jpeg",
        0.82
      )
  );

}


$("beerImageFile").onchange =
  async () => {

    const file =
      $("beerImageFile")
        .files[0];


    if (!file) {
      return;
    }


    try {

      const blob =
        await resizeImage(
          file
        );


      $("preview").innerHTML =
        `<img
          src="${URL.createObjectURL(
            blob
          )}"
          alt="Esikatselu"
        >`;

    } catch (error) {

      notice(
        "Kuvan käsittely epäonnistui.",
        true
      );

    }

  };


$("beerForm").onsubmit =
  async event => {

    event.preventDefault();


    if (!user) {
      return;
    }


    const id =
      $("beerId").value;


    if (!id) {
      return;
    }


    const old =
      beers[id] || {};


    let image =
      old.image || "";


    const file =
      $("beerImageFile")
        .files[0];


    const name =
      $("beerName")
        .value
        .trim();


    if (!name) {

      notice(
        "Kirjoita oluen nimi.",
        true
      );

      return;

    }


    try {

      if (file) {

        const blob =
          await resizeImage(
            file
          );


        const path =
          storageRef(
            storage,
            `beer-images/${id}.jpg`
          );


        await uploadBytes(
          path,
          blob,
          {
            contentType:
              "image/jpeg"
          }
        );


        image =
          await getDownloadURL(
            path
          );

      }


      await set(
        ref(
          database,
          `beers/${id}`
        ),
        {

          name,

          category:
            $("beerCategory")
              .value,

          number:
            $("beerNumber")
              .value
              .trim(),

          order:
            Number(
              $("beerOrder")
                .value
            ) || 1,

          image

        }
      );


      modal(false);


      notice(
        `${$("beerNumber").value} · ${name} tallennettu ✓`
      );


    } catch (error) {

      console.error(error);

      notice(
        "Tallennus epäonnistui. Tarkista Firebase Storage ja Security Rules.",
        true
      );

    }

  };


$("clearVotes").onclick =
  async () => {

    if (
      !confirm(
        "Poistetaanko KAIKKI äänet? Tätä ei voi perua."
      )
    ) {
      return;
    }


    if (
      !confirm(
        "Varmista vielä: kaikki laatikko- ja hanaoluiden äänet poistetaan."
      )
    ) {
      return;
    }


    try {

      await remove(
        ref(
          database,
          "votes"
        )
      );


      notice(
        "Kaikki äänet poistettu ✓"
      );

    } catch (error) {

      notice(
        "Äänien poisto epäonnistui.",
        true
      );

    }

  };
