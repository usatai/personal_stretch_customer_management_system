'use client'

import Calendar from "@/component/Calender";
import Sidebar from "@/component/Sidebar";
import { useMemo, useState } from "react";

type Booking = {
    id: string;
    title: string;
    start: string; // ISO string
    end: string;   // ISO string
    color?: string;
};

// 30分刻みのラベル生成
function generateTimeSlots(startHour: number, endHour: number) {
    const slots: { label: string; minutes: number }[] = [];
    for (let h = startHour; h <= endHour; h++) {
        for (let m of [0, 30]) {
            if (h === endHour && m > 0) break;
            slots.push({ label: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` , minutes: (h * 60) + m });
        }
    }
    return slots;
}

function startOfDay(date: Date) {
    const d = new Date(date);
    d.setHours(0,0,0,0);
    return d;
}

function addDays(date: Date, days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}


function formatYMD(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}


export default function Bookings () {
    const [currentDate, setCurrentDate] = useState<Date>(startOfDay(new Date()));
    const [showCalendar, setShowCalendar] = useState<boolean>(false);
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

    // 表示時間帯（必要なら調整）
    const startHour = 9;
    const endHour = 22;
    const timeSlots = useMemo(() => generateTimeSlots(startHour, endHour), [startHour, endHour]);

    const totalRows = useMemo(() => (endHour - startHour) * 2 + 1, [startHour, endHour]);

    // TODO: API連携。現状はダミーデータ
    const bookings: Booking[] = useMemo(() => {
        const day = formatYMD(currentDate);
        return [
            { id: 'b1', title: '山田 太郎 様', start: `${day}T10:00:00`, end: `${day}T11:00:00`, color: '#22c55e' },
            { id: 'b2', title: '佐藤 花子 様', start: `${day}T09:00:00`, end: `${day}T10:00:00`, color: '#3b82f6' },
            { id: 'b3', title: '鈴木 次郎 様', start: `${day}T11:00:00`, end: `${day}T12:00:00`, color: '#f59e0b' },
            { id: 'b4', title: 'テスト 予約', start: `${day}T17:00:00`, end: `${day}T18:30:00`, color: '#ef4444' },
        ];
    }, [currentDate]);

    // 予約の行位置と高さ（gridRow として指定）
    const getBookingGridPlacement = (booking: Booking) => {
        const start = new Date(booking.start);
        const end = new Date(booking.end);
        const dayStart = new Date(currentDate);
        dayStart.setHours(startHour, 0, 0, 0);

        const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

        const minutesFromDayStart = (d: Date) => (d.getHours() * 60 + d.getMinutes()) - (startHour * 60);

        const startOffsetMin = clamp(minutesFromDayStart(start), 0, (endHour - startHour) * 60);
        const endOffsetMin = clamp(minutesFromDayStart(end), 0, (endHour - startHour) * 60);

        const startRow = Math.floor(startOffsetMin / 30) + 1; // grid row start (1-based)
        const spanRows = Math.max(1, Math.ceil((endOffsetMin - startOffsetMin) / 30));

        return { startRow, spanRows };
    };

    const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

    // 予約が時間的に重なっているかを判定
    const isOverlapping = (a: Booking, b: Booking): boolean => {
        const aStart = new Date(a.start).getTime();
        const aEnd = new Date(a.end).getTime();
        const bStart = new Date(b.start).getTime();
        const bEnd = new Date(b.end).getTime();
        
        return !(aEnd <= bStart || bEnd <= aStart);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-sky-50 to-blue-50">
            {/* モバイル: サイドバーオーバーレイ */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <div className="relative flex min-h-screen">
                {/* サイドバー */}
                <div
                    className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-transparent transition-transform duration-200 ease-out md:static md:z-0 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
                >
                    <div className="relative h-full">
                        <Sidebar />
                        <button
                            type="button"
                            className="absolute right-3 top-3 inline-flex items-center justify-center rounded-md bg-white/10 px-2 py-1 text-xs text-white backdrop-blur md:hidden"
                            onClick={() => setSidebarOpen(false)}
                        >
                            閉じる
                        </button>
                    </div>
                </div>

                {/* メインエリア */}
                <main className="flex-1 w-full md:pl-12">
                    <div className="min-h-screen p-4 sm:p-6">
                        <div className="mx-auto max-w-5xl">
                            {/* ヘッダー：日付と操作 */}
                            <div className="sticky top-0 z-10 -mx-4 sm:mx-0 px-4 sm:px-0 py-3 mb-3 sm:mb-4 bg-gradient-to-br from-cyan-50/95 via-sky-50/95 to-blue-50/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                    <button
                                        className="md:hidden mr-2 inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm hover:bg-slate-50"
                                        onClick={() => setSidebarOpen(true)}
                                        type="button"
                                    >
                                        メニュー
                                    </button>
                                    <button
                                        className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-cyan-200 bg-white hover:bg-cyan-50 text-cyan-700 text-sm"
                                        onClick={() => setCurrentDate(addDays(currentDate, -1))}
                                        type="button"
                                    >
                                        前日
                                    </button>
                                    <button
                                        className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-cyan-200 bg-white hover:bg-cyan-50 text-cyan-700 text-sm"
                                        onClick={() => setCurrentDate(startOfDay(new Date()))}
                                        type="button"
                                    >
                                        今日
                                    </button>
                                    <button
                                        className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-cyan-200 bg-white hover:bg-cyan-50 text-cyan-700 text-sm"
                                        onClick={() => setCurrentDate(addDays(currentDate, 1))}
                                        type="button"
                                    >
                                        翌日
                                    </button>
                                    <button
                                        className="ml-auto inline-flex items-center gap-1 rounded-lg border border-cyan-200 bg-white px-3 py-1.5 text-sm text-cyan-700 hover:bg-cyan-50"
                                        onClick={() => setShowCalendar(v => !v)}
                                        type="button"
                                    >
                                        カレンダーで日時指定
                                    </button>
                                </div>
                                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="text-right sm:text-left">
                                        <div className="text-xl sm:text-2xl font-bold text-cyan-900">
                                            {formatYMD(currentDate)}
                                        </div>
                                    </div>
                                    {/* 凡例 */}
                                    <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-cyan-700">
                                        <div className="flex items-center gap-2">
                                            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#22c55e' }} /> 完了
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#3b82f6' }} /> 確定
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#f59e0b' }} /> 仮予約
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#ef4444' }} /> キャンセル待ち
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* カレンダー */}
                            {showCalendar && (
                                <div
                                    className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 backdrop-blur-sm"
                                    onClick={() => setShowCalendar(false)} // 背景クリックで閉じる
                                >
                                    <div
                                    className="mt-20"
                                    onClick={(e) => e.stopPropagation()} // カレンダークリックでは閉じない
                                    >
                                    <Calendar
                                        onSelectDate={(date) => {
                                            setCurrentDate(date);
                                            setShowCalendar(false); // 日付選択で閉じる
                                        }}
                                    />
                                    </div>
                                </div>
                            )}

                            {/* タイムテーブル */}
                            <div className="bg-white rounded-2xl shadow border border-cyan-200 overflow-hidden">
                                <div className="grid" style={{ gridTemplateColumns: '64px 1fr' }}>
                                    {/* 左：時間ラベル列 */}
                                    <div className="border-r border-cyan-200 bg-cyan-50/50">
                                        <div className="grid" style={{ gridTemplateRows: `repeat(${totalRows}, 55px)` }}>
                                            {timeSlots.map((slot, idx) => (
                                                <div
                                                    key={slot.label}
                                                    className={`px-2 sm:px-3 flex items-start ${idx % 2 === 0 ? 'border-b border-cyan-100' : ''}`}
                                                >
                                                    <span className="text-[10px] sm:text-xs text-cyan-700 pt-2">{slot.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 右：スケジュール列 */}
                                    <div className="relative">
                                        {/* 背景のグリッド線 */}
                                        <div className="grid" style={{ gridTemplateRows: `repeat(${totalRows}, 55px)` }}>
                                            {Array.from({ length: totalRows }).map((_, i) => (
                                                <div key={i} className={`border-b ${i % 2 === 0 ? 'border-cyan-100' : 'border-cyan-50'}`} />
                                            ))}
                                        </div>

                                        {/* 予約ブロック */}
                                        <div className="absolute inset-0 p-2">
                                            <div className="grid h-full" style={{ gridTemplateRows: `repeat(${totalRows}, 55px)` }}>
                                                {(() => {
                                                    const filtered = bookings.filter(b => isSameDay(new Date(b.start), new Date()));

                                                    // 時間的に重なっている予約をグループ化
                                                    const groups: Booking[][] = [];
                                                    const processed = new Set<string>();

                                                    filtered.forEach(booking => {
                                                        if (processed.has(booking.id)) return;

                                                        // この予約と重複している予約をすべて探す
                                                        const overlapping = filtered.filter(b =>
                                                            b.id !== booking.id &&
                                                            !processed.has(b.id) &&
                                                            isOverlapping(booking, b)
                                                        );

                                                        if (overlapping.length > 0) {
                                                            // 重複グループを作成
                                                            const group = [booking, ...overlapping];
                                                            group.forEach(b => processed.add(b.id));
                                                            groups.push(group);
                                                        } else {
                                                            // 重複がない場合は単独で追加
                                                            processed.add(booking.id);
                                                            groups.push([booking]);
                                                        }
                                                    });

                                                    return groups.map((groupBookings, groupIndex) => {
                                                        const firstBooking = groupBookings[0];
                                                        const { startRow, spanRows } = getBookingGridPlacement(firstBooking);

                                                        return (
                                                            <div
                                                                key={`group-${groupIndex}-${firstBooking.id}`}
                                                                className="flex gap-1"
                                                                style={{
                                                                    gridRow: `${startRow} / span ${spanRows}`,
                                                                }}
                                                            >
                                                                {groupBookings.map(booking => (
                                                                    <div
                                                                        key={booking.id}
                                                                        className="rounded-xl shadow-md text-white text-[11px] sm:text-sm p-2 sm:p-3 overflow-hidden flex-1 min-w-0"
                                                                        style={{
                                                                            backgroundColor: booking.color || '#06b6d4',
                                                                            opacity: 0.95,
                                                                        }}
                                                                    >
                                                                        <div className="font-semibold truncate">{booking.title}</div>
                                                                        <div className="text-white/90 text-[10px] sm:text-xs">
                                                                            {new Date(booking.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                            {' - '}
                                                                            {new Date(booking.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    });
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );

}