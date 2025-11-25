// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB0buA6cBJauJCGPoJIoQq93QvCNxip5ds",
  authDomain: "prep3-arabic.firebaseapp.com",
  databaseURL: "https://prep3-arabic-default-rtdb.firebaseio.com",
  projectId: "prep3-arabic",
  storageBucket: "prep3-arabic.firebasestorage.app",
  messagingSenderId: "1015444377566",
  appId: "1:1015444377566:web:3ec211c08df32384b5574f",
  measurementId: "G-8W1H5KR6MM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
