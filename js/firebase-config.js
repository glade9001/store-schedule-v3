import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// 替換成新 Firebase 專案的設定（正式上線前更新）
export const firebaseConfig = {
  apiKey: "AIzaSyDmhjjYlls1Wd7d5YOVg7dVqkKcrxxJ1Tg",
  authDomain: "store-schedule-v3.firebaseapp.com",
  projectId: "store-schedule-v3",
  storageBucket: "store-schedule-v3.firebasestorage.app",
  messagingSenderId: "187494256104",
  appId: "1:187494256104:web:3de5dc21d4bb26ed9ae85d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
