
// Firebase v10 CDN modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
// import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app-check.js";
import { getFirestore, collection, addDoc, serverTimestamp, onSnapshot, getDocs, updateDoc  } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// 1) Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBXifH24fZNfURFMy-uHYS7RddqwtKDlZ0",
  authDomain: "simlog-12729.firebaseapp.com",
  projectId: "simlog-12729",
  storageBucket: "simlog-12729.firebasestorage.app",
  messagingSenderId: "44605944069",
  appId: "1:44605944069:web:9046e060ce3bfba1e4476c",
  measurementId: "G-B57905172V"
};

// 2) Init
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export {db, collection, addDoc, serverTimestamp, onSnapshot, getDocs, updateDoc };

