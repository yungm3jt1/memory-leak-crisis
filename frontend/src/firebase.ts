import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBedxHV-3hn-kYrTaB5zFFTYCTmEYhw6Uk",
  authDomain: "dihh-9fbd3.firebaseapp.com",
  databaseURL: "https://dihh-9fbd3-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "dihh-9fbd3",
  storageBucket: "dihh-9fbd3.firebasestorage.app",
  messagingSenderId: "62288382247",
  appId: "1:62288382247:web:7e8219aba86f3d27268102",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { app, db };
