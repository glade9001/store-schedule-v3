import { auth, db } from './firebase-config.js';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword as _fbUpdatePassword,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// 員工工號 → Firebase Auth email 格式
const toEmail = id => `${id.toLowerCase()}@lixue.internal`;

// 目前登入的使用者（各頁面 import 後直接讀取）
export let currentUser = null;

async function loadProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { uid, ...snap.data() } : null;
}

// ===== 登入 =====
export async function login(empId, password) {
  const cred = await signInWithEmailAndPassword(auth, toEmail(empId), password);
  currentUser = await loadProfile(cred.user.uid);
  return currentUser;
}

// ===== 登出 =====
export async function logout() {
  await signOut(auth);
  currentUser = null;
}

// ===== 修改密碼（需重新驗證）=====
export async function changePassword(currentPassword, newPassword) {
  const fbUser = auth.currentUser;
  const cred = EmailAuthProvider.credential(fbUser.email, currentPassword);
  await reauthenticateWithCredential(fbUser, cred);
  await _fbUpdatePassword(fbUser, newPassword);
}

// ===== 建立新帳號（員工管理用）=====
// 注意：建立後 Firebase Auth 會自動切換到新帳號，需要重新登入管理者
export async function createAuthUser(empId, initialPassword) {
  const cred = await createUserWithEmailAndPassword(auth, toEmail(empId), initialPassword);
  return cred.user.uid;
}

// ===== 重設他人密碼（Firebase Admin SDK 才能做，此處保留介面）=====
// 實務上需要後端 Cloud Function，目前用「管理者修改 Firestore 密碼欄位」替代

// ===== 每頁進入點：確認登入狀態 =====
// 用法：const user = await requireAuth();
// 未登入 → 跳轉 login.html，Promise 永遠不 resolve
export function requireAuth(loginUrl = 'login.html') {
  return new Promise(resolve => {
    const unsub = onAuthStateChanged(auth, async fbUser => {
      unsub();
      if (!fbUser) {
        window.location.replace(loginUrl);
        return;
      }
      const profile = await loadProfile(fbUser.uid);
      if (!profile) {
        // Firestore 找不到使用者資料 → 視為未完成設定，登出
        await signOut(auth);
        window.location.replace(loginUrl);
        return;
      }
      if (profile.status === '離職') {
        await signOut(auth);
        window.location.replace(loginUrl + '?reason=resigned');
        return;
      }
      currentUser = profile;
      resolve(profile);
    });
  });
}

// ===== 權限判斷 =====
export const canSchedule      = u => ['manager','owner','admin'].includes(u?.permission);
export const canManageEmployee = u => ['manager','owner','admin'].includes(u?.permission);
export const canViewAllSalary  = u => ['owner','admin'].includes(u?.permission);
export const canViewSalary     = u => ['manager','owner','admin'].includes(u?.permission);
export const canSysConfig      = u => u?.permission === 'admin';
export const canApprove        = u => ['manager','owner','admin'].includes(u?.permission);
export const isMultiStore      = u => ['owner','admin'].includes(u?.permission);
