import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAsblldqFHAU53hfzJK1__8APDCTNgizZw",
  authDomain: "baust-tea-bar.firebaseapp.com",
  projectId: "baust-tea-bar",
  storageBucket: "baust-tea-bar.firebasestorage.app",
  messagingSenderId: "456456190666",
  appId: "1:456456190666:web:fa8bcfa693e0370b20d233",
  measurementId: "G-S1GJHNWQ1W"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
