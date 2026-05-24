import { auth, db } from './firebase-config.js';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword as _fbUpdatePassword,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithPopup,
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

// ===== Google 登入 =====
export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  const profile = await loadProfile(cred.user.uid);
  if (!profile) {
    // Google 帳號尚未綁定任何員工工號，登出並丟錯
    await signOut(auth);
    const err = new Error('此 Google 帳號尚未綁定任何員工工號，請先用工號登入後至「設定」頁綁定');
    err.code = 'not-linked';
    throw err;
  }
  if (profile.status === '離職') {
    await signOut(auth);
    const err = new Error('此帳號已離職，無法登入');
    err.code = 'resigned';
    throw err;
  }
  currentUser = profile;
  return currentUser;
}

// ===== 綁定 Google 帳號（已登入後呼叫）=====
export async function linkGoogle() {
  const provider = new GoogleAuthProvider();
  await linkWithPopup(auth.currentUser, provider);
}

// ===== 取消綁定 Google =====
export const isGoogleLinked = () =>
  auth.currentUser?.providerData?.some(p => p.providerId === 'google.com') ?? false;

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
// 未登入 → 跳轉 login.html；未綁定 Google → 跳轉 link-google.html
// link-google.html 本身傳入 { requireGoogle: false } 避免無限跳轉
export function requireAuth(loginUrl = 'login.html', { requireGoogle = true } = {}) {
  return new Promise(resolve => {
    const unsub = onAuthStateChanged(auth, async fbUser => {
      unsub();
      if (!fbUser) {
        window.location.replace(loginUrl);
        return;
      }
      const profile = await loadProfile(fbUser.uid);
      if (!profile) {
        await signOut(auth);
        window.location.replace(loginUrl);
        return;
      }
      if (profile.status === '離職') {
        await signOut(auth);
        window.location.replace(loginUrl + '?reason=resigned');
        return;
      }
      // 尚未綁定 Google → 強制綁定
      if (requireGoogle) {
        const googleLinked = fbUser.providerData.some(p => p.providerId === 'google.com');
        if (!googleLinked) {
          currentUser = profile;
          window.location.replace('link-google.html');
          return;
        }
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
