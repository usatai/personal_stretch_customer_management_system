'use client'

import Sidebar from "@/component/Sidebar";
import { useMemo, useState, useRef } from "react";

type Booking = {
    id: string;
    title: string;
    start: string;
    end: string;
    color?: string;
};

function generateTimeSlots(startHour: number, endHour: number) {
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

function startOfDay(date: Date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
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

export default function BookingsWithDragDrop() {
    const [currentDate, setCurrentDate] = useState<Date>(startOfDay(new Date()));
    const [bookingsState, setBookingsState] = useState<Booking[]>([]);
    const [draggedBooking, setDraggedBooking] = useState<Booking | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);
    const [sidebarOpen,setSidebarOpen] = useState<boolean>(false);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    
    const scheduleRef = useRef<HTMLDivElement>(null);

    const startHour = 9;
    const endHour = 22;
    const timeSlots = useMemo(() => generateTimeSlots(startHour, endHour), [startHour, endHour]);
    const totalRows = useMemo(() => (endHour - startHour) * 2 + 1, [startHour, endHour]);

    const defaultBookings: Booking[] = useMemo(() => {
        const day = formatYMD(currentDate);
        return [
            { id: 'b1', title: '山田 太郎 様', start: `${day}T09:00:00`, end: `${day}T10:00:00`, color: '#22c55e' },
            { id: 'b2', title: '佐藤 花子 様', start: `${day}T09:00:00`, end: `${day}T11:00:00`, color: '#3b82f6' },
            { id: 'b3', title: '鈴木 次郎 様', start: `${day}T11:00:00`, end: `${day}T12:00:00`, color: '#f59e0b' },
            { id: 'b4', title: 'テスト 予約', start: `${day}T17:00:00`, end: `${day}T18:30:00`, color: '#ef4444' },
        ];
    }, [currentDate]);

    const bookings = bookingsState.length > 0 ? bookingsState : defaultBookings;

    const getBookingGridPlacement = (booking: Booking) => {
        const start = new Date(booking.start);
        const end = new Date(booking.end);

        const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
        const minutesFromDayStart = (d: Date) => (d.getHours() * 60 + d.getMinutes()) - (startHour * 60);

        const startOffsetMin = clamp(minutesFromDayStart(start), 0, (endHour - startHour) * 60);
        const endOffsetMin = clamp(minutesFromDayStart(end), 0, (endHour - startHour) * 60);

        const startRow = Math.floor(startOffsetMin / 30) + 1;
        const spanRows = Math.max(1, Math.ceil((endOffsetMin - startOffsetMin) / 30));

        return { startRow, spanRows };
    };

    const isOverlapping = (a: Booking, b: Booking): boolean => {
        const aStart = new Date(a.start).getTime();
        const aEnd = new Date(a.end).getTime();
        const bStart = new Date(b.start).getTime();
        const bEnd = new Date(b.end).getTime();
        return !(aEnd <= bStart || bEnd <= aStart);
    };

    const handleMouseDown = (e: React.MouseEvent, booking: Booking) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        setDraggedBooking(booking);
        setIsDragging(true);
        setMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !draggedBooking || !scheduleRef.current) return;
        
        setMousePos({ x: e.clientX, y: e.clientY });

        // スケジュールエリアの位置を取得
        const scheduleRect = scheduleRef.current.getBoundingClientRect();
        const relativeY = e.clientY - scheduleRect.top;
        
        // どのタイムスロットにホバーしているかを計算
        const slotHeight = 58;
        const slotIndex = Math.floor(relativeY / slotHeight);
        
        if (slotIndex >= 0 && slotIndex < totalRows) {
            setHoveredSlot(slotIndex);
        }
    };

    const handleMouseUp = () => {
        if (!isDragging || !draggedBooking || hoveredSlot === null) {
            setIsDragging(false);
            setDraggedBooking(null);
            setHoveredSlot(null);
            return;
        }
    
        // 1. 必要な計算を "setBookingsState" の「外」で先に行う
        const newStartMinutes = hoveredSlot * 30 + (startHour * 60);
        const newStartHour = Math.floor(newStartMinutes / 60);
        const newStartMin = newStartMinutes % 60;
    
        // draggedBooking を使って元の情報を取得
        const originalStart = new Date(draggedBooking.start);
        const originalEnd = new Date(draggedBooking.end);
        const durationMs = originalEnd.getTime() - originalStart.getTime();
    
        const day = formatYMD(currentDate);
        const newStartStr = `${day}T${String(newStartHour).padStart(2, '0')}:${String(newStartMin).padStart(2, '0')}:00`;
    
        const newStart = new Date(newStartStr);
        const newEnd = new Date(newStart.getTime() + durationMs);
    
        const newEndDay = formatYMD(newEnd);
        const newEndHour = String(newEnd.getHours()).padStart(2, '0');
        const newEndMin = String(newEnd.getMinutes()).padStart(2, '0');
        const newEndStr = `${newEndDay}T${newEndHour}:${newEndMin}:00`;
    
        // 2. 更新後の予約オブジェクトを「先」に作成する
        const updatedBookingData = {
            ...draggedBooking,
            start: newStartStr,
            end: newEndStr,
        };
    
        // 3. State を更新 (コールバック内では、外で作成したデータを返すだけ)
        setBookingsState(prev => {
            const current = prev.length > 0 ? prev : defaultBookings;
            return current.map(booking => {
                if (booking.id === draggedBooking.id) {
                    // ★ ここで変数に代入するのではなく、作成済みのデータを返す
                    return updatedBookingData;
                }
                return booking;
            });
        });
    
        // 4. ドラッグ状態をリセット
        setIsDragging(false);
        setDraggedBooking(null);
        setHoveredSlot(null);
    
        // 5. モーダルを開く
        // (updatedBookingData はこのスコープで確実に利用可能)
        if (updatedBookingData) {
            setSelectedBooking(updatedBookingData); // 表示する予約データをセット
            setIsDetailModalOpen(true);        // モーダルを開く
        }
    };

    return (
        <div className="relative min-h-screen bg-gray-50 md:flex">
            {/* オーバーレイ（モバイル時サイドバー開時のみ） */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[1px] md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            {/* サイドバー */}
            <div
                className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-white shadow-md transition-transform duration-200 ease-out md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:static md:z-auto`}
            >
                <div className="relative h-full">
                    <Sidebar />
                </div>
            </div>
            {/* ヘッダー */}
            <div className="flex-1 w-full md:pl-0 bg-gradient-to-br from-cyan-50/95 via-sky-50/95 to-blue-50/95">
                <div className="top-0 z-20 flex items-center gap-3 bg-gray-100 px-4 py-3 backdrop-blur md:hidden">
                    <button
                            type="button"
                            aria-label="メニューを開閉"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm active:scale-[0.98]"
                            onClick={() => setSidebarOpen((v) => !v)}
                    >
                        {/* ハンバーガーアイコン */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>
            <div
                className="w-full bg-gradient-to-br from-cyan-50 via-sky-50 to-blue-50 p-4 sm:p-6"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
            >
                <div className="mx-auto max-w-5xl">
                    {/* ヘッダー */}
                    <div className="sticky top-0 z-10 px-4 sm:px-0 py-3 mb-3 sm:mb-4 bg-gradient-to-br from-cyan-50/95 via-sky-50/95 to-blue-50/95 backdrop-blur">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <button
                                className="px-3 py-2 rounded-lg border border-cyan-200 bg-white hover:bg-cyan-50 text-cyan-700 text-sm"
                                onClick={() => setCurrentDate(addDays(currentDate, -1))}
                            >
                                前日
                            </button>
                            <button
                                className="px-3 py-2 rounded-lg border border-cyan-200 bg-white hover:bg-cyan-50 text-cyan-700 text-sm"
                                onClick={() => setCurrentDate(startOfDay(new Date()))}
                            >
                                今日
                            </button>
                            <button
                                className="px-3 py-2 rounded-lg border border-cyan-200 bg-white hover:bg-cyan-50 text-cyan-700 text-sm"
                                onClick={() => setCurrentDate(addDays(currentDate, 1))}
                            >
                                翌日
                            </button>
                        </div>
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-xl sm:text-2xl font-bold text-cyan-900">
                                {formatYMD(currentDate)}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-cyan-700">
                                <div className="flex items-center gap-2">
                                    <span className="inline-block w-3 h-3 rounded-sm bg-[#22c55e]" /> 完了
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="inline-block w-3 h-3 rounded-sm bg-[#3b82f6]" /> 確定
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="inline-block w-3 h-3 rounded-sm bg-[#f59e0b]" /> 仮予約
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="inline-block w-3 h-3 rounded-sm bg-[#ef4444]" /> キャンセル待ち
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* タイムテーブル */}
                    <div className="bg-white rounded-2xl shadow border border-cyan-200 overflow-hidden">
                        <div className="grid" style={{ gridTemplateColumns: '64px 1fr' }}>
                            {/* 時間ラベル列 */}
                            <div className="border-r border-cyan-200 bg-cyan-50/50">
                                <div className="grid" style={{ gridTemplateRows: `repeat(${totalRows}, 58px)` }}>
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

                            {/* スケジュール列 */}
                            <div className="relative" ref={scheduleRef}>
                                {/* 背景のタイムスロット */}
                                <div>
                                    {timeSlots.map((slot, idx) => (
                                        <div
                                            key={`slot-${idx}`}
                                            className={`border-b transition-colors ${
                                                hoveredSlot === idx ? 'bg-cyan-100/50' : 'border-cyan-100'
                                            }`}
                                            style={{ height: '58px' }}
                                        />
                                    ))}
                                </div>

                                {/* 予約ブロック */}
                                <div className="absolute inset-0 p-1">
                                    <div className="grid h-full" style={{ gridTemplateRows: `repeat(${totalRows}, 58px)` }}>
                                        {(() => {
                                            const groups: Booking[][] = [];
                                            const processed = new Set<string>();

                                            bookings.forEach(booking => {
                                                if (processed.has(booking.id)) return;

                                                const overlapping = bookings.filter(b =>
                                                    b.id !== booking.id &&
                                                    !processed.has(b.id) &&
                                                    isOverlapping(booking, b)
                                                );

                                                if (overlapping.length > 0) {
                                                    const group = [booking, ...overlapping];
                                                    group.forEach(b => processed.add(b.id));
                                                    groups.push(group);
                                                } else {
                                                    processed.add(booking.id);
                                                    groups.push([booking]);
                                                }
                                            });

                                            return groups.map((groupBookings, groupIndex) => {
                                                const placements = groupBookings.map(b => {
                                                    const { startRow, spanRows } = getBookingGridPlacement(b);
                                                    return { booking: b, startRow, spanRows, endRow: startRow + spanRows };
                                                });
                                                const minStartRow = Math.min(...placements.map(p => p.startRow));
                                                const maxEndRow = Math.max(...placements.map(p => p.endRow));
                                                const groupSpan = Math.max(1, maxEndRow - minStartRow);
                                                const columnCount = placements.length;

                                                return (
                                                    <div
                                                        key={`group-${groupIndex}`}
                                                        style={{ gridRow: `${minStartRow} / span ${groupSpan}` }}
                                                        className="grid gap-1"
                                                    >
                                                        <div
                                                            className="grid"
                                                            style={{
                                                                gridTemplateRows: `repeat(${groupSpan}, 54px)`,
                                                                gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
                                                                gap: '4px',
                                                            }}
                                                        >
                                                            {placements.map((p, colIndex) => {
                                                                const relativeStart = (p.startRow - minStartRow) + 1;
                                                                const isBeingDragged = draggedBooking?.id === p.booking.id;
                                                                
                                                                return (
                                                                    <div
                                                                        key={p.booking.id}
                                                                        className={`rounded-xl shadow-md text-white text-[11px] sm:text-sm p-2 sm:p-3 overflow-hidden cursor-grab active:cursor-grabbing select-none transition-opacity ${
                                                                            isBeingDragged ? 'opacity-30' : 'opacity-95'
                                                                        }`}
                                                                        style={{
                                                                            gridRow: `${relativeStart} / span ${p.spanRows}`,
                                                                            gridColumn: `${colIndex + 1} / span 1`,
                                                                            backgroundColor: p.booking.color || '#06b6d4',
                                                                        }}
                                                                        onMouseDown={(e) => handleMouseDown(e, p.booking)}
                                                                    >
                                                                        <div className="font-semibold truncate">{p.booking.title}</div>
                                                                        <div className="text-white/90 text-[10px] sm:text-xs">
                                                                            {new Date(p.booking.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                            {' - '}
                                                                            {new Date(p.booking.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
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

                {/* ドラッグ中のプレビュー */}
                {isDragging && draggedBooking && (
                    <div
                        className="fixed pointer-events-none z-50 rounded-xl shadow-2xl text-white text-sm p-3 opacity-80"
                        style={{
                            left: mousePos.x - dragOffset.x,
                            top: mousePos.y - dragOffset.y,
                            backgroundColor: draggedBooking.color || '#06b6d4',
                            width: '200px',
                        }}
                    >
                        <div className="font-semibold truncate">{draggedBooking.title}</div>
                        <div className="text-white/90 text-xs">
                            {new Date(draggedBooking.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {' - '}
                            {new Date(draggedBooking.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                )}


                {/* 予約詳細画面作成 */}
                {isDetailModalOpen && selectedBooking && (
                    <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
                    // onClick={() => setCustomerId(null)}
                    >
                        <div
                            key={selectedBooking.id}
                            className={`rounded-xl shadow-md text-white text-[11px] sm:text-sm p-2 sm:p-3 overflow-hidden cursor-grab active:cursor-grabbing select-none transition-opacity`}
                        >
                            <div className="font-semibold truncate">{selectedBooking.title}</div>
                            <div className="text-white/90 text-[10px] sm:text-xs">
                                {new Date(selectedBooking.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {' - '}
                                {new Date(selectedBooking.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                )}    
            </div>
        </div>
    );
}