// ===== 日期 =====

export const today = () => new Date().toISOString().split('T')[0];

export function toDateStr(date) {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export function formatDate(dateStr) {
  const [, m, d] = dateStr.split('-');
  return `${parseInt(m)}/${parseInt(d)}`;
}

export function getMonthStr(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date + 'T00:00:00');
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

export function getPrevMonthStr(monthStr) {
  const [y, m] = monthStr.split('-').map(Number);
  return getMonthStr(new Date(y, m - 2, 1));
}

export const DAY_NAMES = ['週一','週二','週三','週四','週五','週六','週日'];

// ===== ISO 8601 週次（週一為第一天）=====

export function dateToISOWeek(date) {
  const d = new Date(date instanceof Date ? date : date + 'T00:00:00');
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const year = d.getFullYear();
  const jan4 = new Date(year, 0, 4);
  const weekNum = 1 + Math.round(
    ((d - jan4) / 86400000 - 3 + ((jan4.getDay() + 6) % 7)) / 7
  );
  return `${year}-W${String(weekNum).padStart(2, '0')}`;
}

export function getCurrentWeekString() {
  return dateToISOWeek(new Date());
}

export function getNextWeekString() {
  const d = new Date();
  const day = d.getDay() || 7;
  const mon = new Date(d);
  mon.setDate(d.getDate() - day + 1 + 7); // 本週一 + 7 天
  mon.setHours(0, 0, 0, 0);
  return dateToISOWeek(mon);
}

// 取得 ISO 週字串對應的週一 Date
export function getWeekMonday(weekStr) {
  const [yearStr, wPart] = weekStr.split('-W');
  const year = parseInt(yearStr);
  const week = parseInt(wPart);
  const jan4 = new Date(year, 0, 4);
  const firstMonday = new Date(jan4);
  firstMonday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
  const start = new Date(firstMonday);
  start.setDate(firstMonday.getDate() + (week - 1) * 7);
  return start;
}

// 回傳該週 7 天的 YYYY-MM-DD 陣列（週一→週日）
export function getWeekDates(weekStr) {
  const monday = getWeekMonday(weekStr);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toDateStr(d);
  });
}

// 取得某月涵蓋的所有週次字串
export function getMonthWeekStrings(year, month) {
  const result = new Set();
  const days = new Date(year, month, 0).getDate();
  for (let d = 1; d <= days; d++) {
    result.add(dateToISOWeek(new Date(year, month - 1, d)));
  }
  return [...result];
}

// 週次是否已過封盤時間（前一週五 00:00）
export function isWeekLocked(weekStr) {
  const monday = getWeekMonday(weekStr);
  const lockdown = new Date(monday);
  lockdown.setDate(monday.getDate() - 3);
  lockdown.setHours(0, 0, 0, 0);
  return new Date() >= lockdown;
}

// 下週是否已自動發布（週五 18:00 起）
export function isAutoPublished(weekStr) {
  const thisWeek = getCurrentWeekString();
  if (weekStr <= thisWeek) return true;
  const monday = getWeekMonday(weekStr);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() - 3);
  friday.setHours(18, 0, 0, 0);
  return new Date() >= friday;
}

// ===== 問候語 =====

export function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return { text: '早安！美好的一天從現在開始 ☀️', icon: '🌅' };
  if (h >= 12 && h < 18) return { text: '午安！記得好好休息 🌿',         icon: '☀️' };
  if (h >= 18 && h < 22) return { text: '晚安！辛苦了一天！',             icon: '🌆' };
  return { text: '還在工作中？注意身體喔 🌙',                              icon: '🌙' };
}

// ===== UI 工具 =====

export function showLoading(text = '載入中...') {
  const el = document.getElementById('loadingText');
  if (el) el.textContent = text;
  document.getElementById('loadingOverlay')?.classList.remove('hidden');
}

export function hideLoading() {
  document.getElementById('loadingOverlay')?.classList.add('hidden');
}

let _toastTimer;
export function showToast(msg, duration = 2500) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), duration);
}

export function openModal(id) {
  document.getElementById(id)?.classList.add('active');
}

export function closeModal(id) {
  document.getElementById(id)?.classList.remove('active');
}

// ===== 標籤對應 =====
export const PERM_LABELS = { admin:'管理員', owner:'加盟主', manager:'店長', employee:'員工' };
export const ROLE_LABELS  = { 店長:'店長', 副店:'副店長', 工讀:'工讀生', 全職:'全職' };
export const PERM_COLORS  = { admin:'#d93025', owner:'#9334e6', manager:'#1a73e8', employee:'#34a853' };
