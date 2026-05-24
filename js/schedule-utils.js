// 班表相關計算工具（schedule.html、schedule-admin.html、home.html 共用）

export const LEAVE_SHIFTS = ['排休', '指休', '特休', '補休'];

export const isLeaveShift = shift => LEAVE_SHIFTS.includes(shift);

// 從班別名稱解析工時（如 "7-15" → 8）
function parseHoursFromName(shift) {
  const m = shift.match(/^(\d{1,2})-(\d{1,2})$/);
  if (!m) return 8;
  let start = parseInt(m[1]), end = parseInt(m[2]);
  if (end <= start) end += 24;
  return end - start;
}

// 取得班別工時（優先用設定檔，其次解析名稱）
export function getShiftHours(shift, shiftHours = {}) {
  if (!shift || isLeaveShift(shift)) return 0;
  return shiftHours[shift] ?? parseHoursFromName(shift);
}

// 班別 CSS class
export function shiftClass(shift) {
  if (!shift) return '';
  if (shift === '特休') return 'shift-annual';
  if (shift === '補休') return 'shift-comp';
  if (isLeaveShift(shift)) return 'shift-off';
  if (shift.includes('23') || shift.includes('夜')) return 'shift-night';
  return 'shift-work';
}

// 計算一個人的週工時與休假天數
export function calcWeekStats(scheduleEntry, shiftHours = {}) {
  if (!scheduleEntry?.days) return { workHours: 0, offDays: 0, overtimeHours: 0 };
  let workHours = 0, offDays = 0, overtimeHours = 0;
  Object.values(scheduleEntry.days).forEach(day => {
    if (!day?.shift) return;
    if (isLeaveShift(day.shift)) { offDays++; return; }
    const h = day.hours ?? getShiftHours(day.shift, shiftHours);
    workHours += Math.min(h, 8);
    if (day.isOT || h > 8) overtimeHours += Math.max(0, h - 8);
  });
  return { workHours, offDays, overtimeHours };
}

// 計算一個人的月工時（傳入多週 scheduleEntry 陣列）
export function calcMonthStats(weekEntries, targetMonth, shiftHours = {}) {
  let workHours = 0, offDays = 0, overtimeHours = 0;
  weekEntries.forEach(entry => {
    if (!entry?.days) return;
    Object.entries(entry.days).forEach(([dateStr, day]) => {
      if (!day?.shift) return;
      if (!dateStr.startsWith(targetMonth)) return; // 只算指定月份的天數
      if (isLeaveShift(day.shift)) { offDays++; return; }
      const h = day.hours ?? getShiftHours(day.shift, shiftHours);
      workHours += Math.min(h, 8);
      if (day.isOT || h > 8) overtimeHours += Math.max(0, h - 8);
    });
  });
  return { workHours, offDays, overtimeHours };
}
