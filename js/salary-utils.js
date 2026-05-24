// 薪資計算工具（salary.html、export.html 共用）
import { getShiftHours, isLeaveShift, calcMonthStats } from './schedule-utils.js';

// 勞基法加班費率
const OT_RATE_1 = 1.34; // 前 2 小時
const OT_RATE_2 = 1.67; // 第 3 小時起

/**
 * 計算月薪
 * @param {Object} user      - 使用者資料 { isHourly, wage, baseSalary, ... }
 * @param {Array}  weekEntries - 當月所有週次的 scheduleEntry（含 days）
 * @param {string} targetMonth - "YYYY-MM"
 * @param {Object} shiftHours  - 班別工時設定
 * @returns {{ base, hours, overtimeHours, overtimePay, total, note }}
 */
export function calcMonthlySalary(user, weekEntries, targetMonth, shiftHours = {}) {
  const stats = calcMonthStats(weekEntries, targetMonth, shiftHours);

  if (user.isHourly) {
    const wage = parseFloat(user.wage) || 0;
    const rawHours = calcRawHours(weekEntries, targetMonth, shiftHours);
    const base = Math.round(rawHours * wage);
    return { base, hours: rawHours, overtimeHours: 0, overtimePay: 0, total: base, note: '' };
  }

  // 月薪制
  const base = parseFloat(user.baseSalary) || 0;
  const ot = stats.overtimeHours;
  // 前兩小時 × 1.34，超過 × 1.67（每日計算，此處月加總簡化）
  const hourlyBase = base / 240; // 月薪換時薪（依勞基法 30 天 × 8 小時）
  const ot1 = Math.min(ot, 2 * workDaysInMonth(weekEntries, targetMonth, shiftHours));
  const ot2 = Math.max(0, ot - ot1);
  const overtimePay = Math.round((ot1 * hourlyBase * OT_RATE_1 + ot2 * hourlyBase * OT_RATE_2) * 10) / 10;

  return {
    base,
    hours: stats.workHours,
    overtimeHours: ot,
    overtimePay,
    total: Math.round(base + overtimePay),
    note: '',
  };
}

// 時薪制：計算所有實際出勤時數（含加班）
function calcRawHours(weekEntries, targetMonth, shiftHours) {
  let total = 0;
  weekEntries.forEach(entry => {
    if (!entry?.days) return;
    Object.entries(entry.days).forEach(([dateStr, day]) => {
      if (!day?.shift || isLeaveShift(day.shift)) return;
      if (!dateStr.startsWith(targetMonth)) return;
      total += day.hours ?? getShiftHours(day.shift, shiftHours);
    });
  });
  return total;
}

// 月薪制加班費計算用：該月出勤天數
function workDaysInMonth(weekEntries, targetMonth, shiftHours) {
  const days = new Set();
  weekEntries.forEach(entry => {
    if (!entry?.days) return;
    Object.entries(entry.days).forEach(([dateStr, day]) => {
      if (!day?.shift || isLeaveShift(day.shift)) return;
      if (dateStr.startsWith(targetMonth)) days.add(dateStr);
    });
  });
  return days.size || 1;
}
