import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// 替換成新 Firebase 專案的設定（正式上線前更新）
export const firebaseConfig = {
  apiKey: "AIzaSyAmVwq-Wny1KMRGNSdOnBEJ_A-3HmTO-hM",
  authDomain: "store-schedule-3b056.firebaseapp.com",
  projectId: "store-schedule-3b056",
  storageBucket: "store-schedule-3b056.firebasestorage.app",
  messagingSenderId: "296522693619",
  appId: "1:296522693619:web:f90ec5d666c7a4a5943086"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
