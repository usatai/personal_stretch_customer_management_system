/**
 * 日付操作系のユーティリティ関数群
 */

const statusOptions = [
    { label: "仮予約", color: "#f59e0b" },
    { label: "予約確定", color: "#3b82f6" },
    { label: "完了", color: "#22c55e" },
    { label: "キャンセル", color: "#ef4444" },
];

export function startOfDay(date: Date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

export function addDays(date: Date, days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

export function isSameDay(date1: Date, date2: Date) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

// 他にも formatYMD などがあればここに追加して export する
export function formatYMD(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export const generateTimeOptions = () => {
    const times: string[] = [];
    for (let h = 9; h < 21; h++) {
      for (let m = 0; m < 60; m+=30) {
        const hh = h.toString().padStart(2, '0');
        const mm = m.toString().padStart(2, '0');
        times.push(`${hh}:${mm}`);
      }
    }
    return times;
};

export const getSortedStatusOptions = (color : string) => {
    return statusOptions.slice().sort((a,b) => {
        if (a.color === color) return -1; 
        if (b.color === color) return 1;
        return 0;
    });
};

export function generateTimeSlots(startHour: number, endHour: number) {
    const slots: { label: string; minutes: number }[] = [];
    for (let h = startHour; h <= endHour; h++) {
        for (let m of [0, 30]) {
            if (h === endHour && m > 0) break;
            slots.push({
                label: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
                minutes: (h * 60) + m
            });
        }
    }
    return slots;
}

export function getDaysInMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function getFirstDayOfMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
}

export function formatMonthYear(date: Date) {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    return `${y}年${m}月`;
}

export function isToday(date: Date) {
    const today = startOfDay(new Date());
    return isSameDay(date, today);
}