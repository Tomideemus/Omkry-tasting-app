import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
  getDatabase
} from
  "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";


const firebaseConfig = {
  apiKey: "AIzaSyBB9isCK0gH8ZiFAYNAudlEzSUSfzx4MHI",
  authDomain: "omkry-tasting-app.firebaseapp.com",
  databaseURL: "https://omkry-tasting-app-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "omkry-tasting-app",
  storageBucket: "omkry-tasting-app.firebasestorage.app",
  messagingSenderId: "948515311102",
  appId: "1:948515311102:web:86bd14ceb0a139a95684af"
};


const app = initializeApp(firebaseConfig);

export const database = getDatabase(app);
