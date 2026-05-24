/**
 * db.js — Firestore 操作封裝
 * 各頁面透過此模組存取資料庫，不直接寫 Firestore 語法
 * Schema 變動時只需改這裡
 */
import { db } from './firebase-config.js';
import {
  doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc,
  collection, query, where, orderBy, getDocs,
  onSnapshot, deleteField, writeBatch,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

export { deleteField };

// ===== 系統設定 =====
export const getAppConfig = () =>
  getDoc(doc(db, 'settings', 'config')).then(s => s.exists() ? s.data() : {});

export const saveAppConfig = data =>
  setDoc(doc(db, 'settings', 'config'), data, { merge: true });

export const getHolidays = year =>
  getDoc(doc(db, 'settings', 'holidays', String(year))).then(s => s.exists() ? (s.data().dates || []) : []);

export const saveHolidays = (year, dates) =>
  setDoc(doc(db, 'settings', 'holidays', String(year)), { dates });

// ===== 使用者 =====
export const getUserProfile = uid =>
  getDoc(doc(db, 'users', uid)).then(s => s.exists() ? { uid, ...s.data() } : null);

export const saveUserProfile = (uid, data) =>
  setDoc(doc(db, 'users', uid), data, { merge: true });

export const updateUserProfile = (uid, data) =>
  updateDoc(doc(db, 'users', uid), data);

export const getAllUsers = async () => {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
};

export const getStoreUsers = async store => {
  const snap = await getDocs(query(collection(db, 'users'), where('store', '==', store)));
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }))
    .filter(u => u.status !== '離職');
};

export const getActiveUsers = async store => {
  const users = await getStoreUsers(store);
  return users.filter(u => u.status === '在職');
};

// ===== 班表 =====
// 週元資料：發布狀態
export const getWeekMeta = (store, weekStr) =>
  getDoc(doc(db, 'stores', store, 'schedule', weekStr))
    .then(s => s.exists() ? s.data() : null);

export const saveWeekMeta = (store, weekStr, data) =>
  setDoc(doc(db, 'stores', store, 'schedule', weekStr), data, { merge: true });

export const onWeekMetaChange = (store, weekStr, callback) =>
  onSnapshot(
    doc(db, 'stores', store, 'schedule', weekStr),
    snap => callback(snap.exists() ? snap.data() : null),
    () => callback(null)
  );

// 個人班表：每人每週一份文件
export const getUserWeekSchedule = (store, weekStr, uid) =>
  getDoc(doc(db, 'stores', store, 'schedule', weekStr, 'entries', uid))
    .then(s => s.exists() ? s.data() : null);

export const saveUserWeekSchedule = (store, weekStr, uid, data) =>
  setDoc(doc(db, 'stores', store, 'schedule', weekStr, 'entries', uid), data, { merge: true });

// 整週所有人的班表
export const getAllWeekEntries = async (store, weekStr) => {
  const snap = await getDocs(
    collection(db, 'stores', store, 'schedule', weekStr, 'entries')
  );
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
};

// 批次儲存整週班表（排班管理用）
export const saveAllWeekEntries = async (store, weekStr, entriesMap) => {
  const batch = writeBatch(db);
  Object.entries(entriesMap).forEach(([uid, data]) => {
    const ref = doc(db, 'stores', store, 'schedule', weekStr, 'entries', uid);
    batch.set(ref, data, { merge: true });
  });
  await batch.commit();
};

// ===== 門市設定 =====
export const getStoreConfig = (store, key) =>
  getDoc(doc(db, 'stores', store, 'config', key)).then(s => s.exists() ? s.data() : null);

export const saveStoreConfig = (store, key, data) =>
  setDoc(doc(db, 'stores', store, 'config', key), data, { merge: true });

// ===== 薪資 =====
export const getSalaryMeta = (store, monthStr) =>
  getDoc(doc(db, 'stores', store, 'salary', monthStr))
    .then(s => s.exists() ? s.data() : null);

export const saveSalaryMeta = (store, monthStr, data) =>
  setDoc(doc(db, 'stores', store, 'salary', monthStr), data, { merge: true });

export const getUserSalary = (store, monthStr, uid) =>
  getDoc(doc(db, 'stores', store, 'salary', monthStr, 'entries', uid))
    .then(s => s.exists() ? s.data() : null);

export const saveUserSalary = (store, monthStr, uid, data) =>
  setDoc(doc(db, 'stores', store, 'salary', monthStr, 'entries', uid), data);

export const getAllSalaryEntries = async (store, monthStr) => {
  const snap = await getDocs(
    collection(db, 'stores', store, 'salary', monthStr, 'entries')
  );
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
};

// ===== 特補休 =====
export const getLeaveBalance = uid =>
  getDoc(doc(db, 'users', uid, 'leaveBalance', 'current'))
    .then(s => s.exists() ? s.data() : { annualGranted:0, annualUsed:0, compEarned:0, compUsed:0 });

export const saveLeaveBalance = (uid, data) =>
  setDoc(doc(db, 'users', uid, 'leaveBalance', 'current'), data, { merge: true });

export const addLeaveTransaction = (uid, data) =>
  addDoc(collection(db, 'users', uid, 'leaveTransactions'), {
    ...data,
    createdAt: new Date().toISOString(),
  });

export const getLeaveTransactions = async uid => {
  const snap = await getDocs(
    query(collection(db, 'users', uid, 'leaveTransactions'), orderBy('date'))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const deleteLeaveTransaction = (uid, txId) =>
  deleteDoc(doc(db, 'users', uid, 'leaveTransactions', txId));

// ===== 劃休申請 =====
export const addLeaveRequest = (store, data) =>
  addDoc(collection(db, 'stores', store, 'leaveRequests'), {
    ...data,
    status: 'pending',
    submittedAt: new Date().toISOString(),
  });

export const getLeaveRequests = async (store, filters = {}) => {
  let q = collection(db, 'stores', store, 'leaveRequests');
  const constraints = [];
  if (filters.uid) constraints.push(where('uid', '==', filters.uid));
  if (filters.status) constraints.push(where('status', '==', filters.status));
  if (constraints.length) q = query(q, ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const updateLeaveRequest = (store, id, data) =>
  updateDoc(doc(db, 'stores', store, 'leaveRequests', id), data);

// ===== 代辦事項 =====
export const getTodos = async () => {
  const snap = await getDocs(query(collection(db, 'todos'), where('deleted', '==', false)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const addTodo = data =>
  addDoc(collection(db, 'todos'), { ...data, deleted: false, createdAt: new Date().toISOString() });

export const updateTodo = (id, data) => updateDoc(doc(db, 'todos', id), data);
export const softDeleteTodo = id => updateDoc(doc(db, 'todos', id), { deleted: true });

export const getTodoCheck = (todoId, uid) =>
  getDoc(doc(db, 'todoChecks', `${todoId}_${uid}`)).then(s => s.exists() ? s.data() : null);

export const setTodoCheck = (todoId, uid, checked) =>
  setDoc(doc(db, 'todoChecks', `${todoId}_${uid}`), {
    todoId, uid, checked, checkedAt: new Date().toISOString(),
  });
