'use client'

import Sidebar from "@/component/Sidebar";
import { apiClient } from "@/utils/apiClient";
import { useMemo, useState, useRef, useEffect } from "react";
import { BackendBooking, CalendarEvent } from "../types";
import { convertToCalendarEvents } from "@/utils/bookingExchange";

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
    const [didDrag, setDidDrag] = useState(false);
    const [clientData, setClientData] = useState<CalendarEvent[]>([]);
    
    const scheduleRef = useRef<HTMLDivElement>(null);

    const startHour = 9;
    const endHour = 22;
    const timeSlots = useMemo(() => generateTimeSlots(startHour, endHour), [startHour, endHour]);
    const totalRows = useMemo(() => (endHour - startHour) * 2 + 1, [startHour, endHour]);

    const defaultBookings: Booking[] = useMemo(() => {
        return [
            { id: 'b1', title: '山田 太郎 様', start: `2025-11-16T09:00:00`, end: `2025-11-16T10:00:00`, color: '#22c55e' },
            { id: 'b2', title: '佐藤 花子 様', start: `2025-11-16T09:00:00`, end: `2025-11-16T11:00:00`, color: '#3b82f6' },
            { id: 'b3', title: '鈴木 次郎 様', start: `2025-11-17T11:00:00`, end: `2025-11-17T12:00:00`, color: '#f59e0b' },
            { id: 'b4', title: 'テスト 予約', start: `2025-11-18T17:00:00`, end: `2025-11-18T18:30:00`, color: '#ef4444' },
        ];
    }, [currentDate]);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const response = await apiClient("/bookings");
                if (response.ok) {
                    let responseData = await response.json();
                    const bookingList: BackendBooking[] = responseData.bookingList;
                    const calendarEvents = convertToCalendarEvents(bookingList);
                    console.log(calendarEvents);
                    setClientData(calendarEvents);                 
                } else {
                    if (response.status === 401) {
                        const errorData = await response.json();
                        alert(errorData.failLogin || "ユーザー名またはパスワードが正しくありません。");
                    } else {
    
                    }
                }
            } catch (e) {
                console.error("エラー" + e)
            }
        }

        fetchBookings();
        
    }, [currentDate]);

    const bookings = bookingsState.length > 0 ? bookingsState : clientData;

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

        // マウスが動いたら動いたことを記憶
        setDidDrag(true);
        
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
        if (!isDragging || !draggedBooking) {
            setIsDragging(false);
            setDraggedBooking(null);
            setHoveredSlot(null);
            return;
        }

        if (didDrag) {
            if (hoveredSlot === null) {

            } else {
                 // 1. 必要な計算を "setBookingsState" の「外」で先に行う
                const newStartMinutes = hoveredSlot * 30 + (startHour * 60);
                const newStartHour = Math.floor(newStartMinutes / 60);
                const newStartMin = newStartMinutes % 60;
                setBookingsState(prev => {
                    const current = prev.length > 0 ? prev : clientData;

                    return current.map(booking => {
                        if (booking.id === draggedBooking.id) {
                            const originalStart = new Date(booking.start);
                            const originalEnd = new Date(booking.end);
                            const durationMs = originalEnd.getTime() - originalStart.getTime();

                            const day = formatYMD(currentDate);
                            // 1. 新しい開始時刻の「ローカル文字列」を作成
                            const newStartStr = `${day}T${String(newStartHour).padStart(2, '0')}:${String(newStartMin).padStart(2, '0')}:00`;

                            // 2. Dateオブジェクトを作成して終了時刻を計算
                            const newStart = new Date(newStartStr);
                            const newEnd = new Date(newStart.getTime() + durationMs);

                            // 3. newEnd も「ローカル文字列」としてフォーマットする
                            //    (日付をまたぐ可能性を考慮して newEnd から年月日を取得)
                            const newEndDay = formatYMD(newEnd); // 日付が変わる場合に対応
                            const newEndHour = String(newEnd.getHours()).padStart(2, '0');
                            const newEndMin = String(newEnd.getMinutes()).padStart(2, '0');
                            const newEndStr = `${newEndDay}T${newEndHour}:${newEndMin}:00`;


                            return {
                                ...booking,
                                start: newStartStr,
                                end: newEndStr,
                            };
                        }
                        return booking;
                    });
                })
            }
        } else {
            setSelectedBooking(draggedBooking); // 表示する予約データをセット
        }
    
        // 4. ドラッグ状態をリセット
        setIsDragging(false);
        setDraggedBooking(null);
        setHoveredSlot(null);
    };

    const statusOptions = [
        { label: "完了", color: "#22c55e" },
        { label: "予約確定", color: "#3b82f6" },
        { label: "仮予約", color: "#f59e0b" },
        { label: "キャンセル", color: "#ef4444" },
    ];
    
    const getSortedStatusOptions = (color : string) => {
        return statusOptions.slice().sort((a,b) => {
            if (a.color === color) return -1; 
            if (b.color === color) return 1;
            return 0;
        });
    };

    const generateTimeOptions = () => {
        const times: string[] = [];
        for (let h = 0; h < 24; h++) {
          for (let m = 0; m < 60; m++) {
            const hh = h.toString().padStart(2, '0');
            const mm = m.toString().padStart(2, '0');
            times.push(`${hh}:${mm}`);
          }
        }
        return times;
      };
    
    const timeOptions = generateTimeOptions();

      // selectが変わった時のハンドラ
    const handleStartChange = (e: React.ChangeEvent<HTMLSelectElement>,booking : Booking) => {
        const [hours, minutes] = e.target.value.split(':').map(Number);
        const newStart = new Date(booking.start);
        newStart.setHours(hours, minutes);
        if (!selectedBooking) return;
        setSelectedBooking({ ...selectedBooking, start: newStart.toISOString() });
    };

    const handleEndChange = (e: React.ChangeEvent<HTMLSelectElement>,booking : Booking) => {
        const [hours, minutes] = e.target.value.split(':').map(Number);
        const newEnd = new Date(booking.end);
        newEnd.setHours(hours, minutes);
        if (!selectedBooking) return;
        setSelectedBooking({ ...selectedBooking, end: newEnd.toISOString() });
    };

    // 顧客詳細情報変更ボタン

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
                    <Sidebar onClose={() => setSidebarOpen(false)}/>
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
                                                if (processed.has(booking.id) || booking.start.split('T')[0] !== formatYMD(currentDate)) return;

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
                                                                        onMouseDown={(e) => {
                                                                            setDidDrag(false);
                                                                            handleMouseDown(e, p.booking)
                                                                        }}
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
                {isDragging && draggedBooking && didDrag && (
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
                {selectedBooking && (
                    <div
                    // 1. オーバーレイ (背景)
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                    // オーバーレイクリックで閉じる
                    onClick={() => {
                        // setIsDetailModalOpen(false);
                        setSelectedBooking(null);
                    }}
                >
                    {/* 2. モーダルパネル (コンテンツ本体) */}
                    <div
                        // モーダル内部のクリックが、背景のonClickに伝播(バブリング)するのを防ぐ
                        onClick={(e) => e.stopPropagation()} 
                        // モーダルのスタイル (白背景、角丸、影、サイズ)
                        className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 text-gray-900"
                    >
                        {/* --- ヘッダー --- */}
                        <div className="flex justify-between items-center p-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold">
                                予約詳細
                            </h3>
                            <button
                                onClick={() => {
                                    // setIsDetailModalOpen(false);
                                    setSelectedBooking(null);
                                }}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-full"
                            >
                                {/* Xボタン (Heroiconsより) */}
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
            
                        {/* --- ボディ --- */}
                        <div className="p-6 space-y-4">
                            {/* 予約タイトル */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-500">タイトル</h4>
                                <p className="text-lg">{selectedBooking.title || '（タイトルなし）'}</p>
                            </div>
                            
                            {/* 日時 */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-500">日時</h4>
                                <p className="text-lg">
                                    {/* 日付のフォーマット (例) */}
                                    {new Date(selectedBooking.start).toLocaleDateString('ja-JP', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        weekday: 'short',
                                    })}
                                </p>
                                <p className="text-lg font-mono">
                                    {/* 時間のフォーマット */}
                                    <select value={new Date(selectedBooking.start).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} onChange={(e) => handleStartChange(e,selectedBooking)}>
                                        {timeOptions.map((time) => (
                                        <option key={time} value={time}>
                                            {time}
                                        </option>
                                        ))}
                                    </select>
                                    {' - '}
                                    <select value={new Date(selectedBooking.end).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} onChange={(e) => handleEndChange(e,selectedBooking)}>
                                        {timeOptions.map((time) => (
                                        <option key={time} value={time}>
                                            {time}
                                        </option>
                                        ))}
                                    </select>
                                </p>
                            </div>
                            
                            {/* ここに他の情報を追加できます (例: 担当者、メモなど) */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-500">ステータス</h4>
                                <select className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition duration-150">
                                    {getSortedStatusOptions(selectedBooking.color!).map(opt => (
                                        <option key={opt.color} value={opt.color}>
                                            {opt.label}
                                        </option>
                                    ))}      
                                </select>
                            </div>
                           
                        </div>
            
                        {/* --- フッター --- */}
                        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                            {/* 削除ボタン (左寄せ) */}
                            <button
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-gray-300 rounded-lg hover:bg-red-700"
                                onClick={() => {
                                    alert(`ID: ${selectedBooking.id} を削除します`);
                                    setSelectedBooking(null);
                                }}
                            >
                                削除
                            </button>
                            
                            {/* 閉じる・編集ボタン (右寄せ) */}
                            <div className="space-x-3">
                                <button
                                    className="px-4 py-2 text-sm font-medium text-white bg-green-500 border border-gray-300 rounded-lg hover:bg-gray-100"
                                    onClick={() => {
                                        alert('編集モードを開始します');
                                    }}
                                >
                                    変更
                                </button>
                                <button
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                                    onClick={() => {
                                        setSelectedBooking(null);
                                    }}
                                >
                                    閉じる
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                )}    
            </div>
        </div>
    );
}