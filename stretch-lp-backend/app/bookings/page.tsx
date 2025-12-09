'use client'

import Sidebar from "@/component/Sidebar";
import { apiClient } from "@/utils/apiClient";
import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { BackendBooking, CalendarEvent } from "../types";
import { convertToCalendarEvents } from "@/utils/bookingExchange";

type Booking = {
    id: string;
    title: string;
    start: string;
    end: string;
    stretchCourse: number;
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

function getDaysInMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function getFirstDayOfMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
}

function formatMonthYear(date: Date) {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    return `${y}年${m}月`;
}

function isSameDay(date1: Date, date2: Date) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

function isToday(date: Date) {
    const today = startOfDay(new Date());
    return isSameDay(date, today);
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
    const [bookingRegister, setBookingRegister] = useState<boolean>(false);
    const scheduleRef = useRef<HTMLDivElement>(null);
    const suppressRegisterRef = useRef(false);
    const dateInputRef = useRef<HTMLInputElement>(null);
    const calendarButtonRef = useRef<HTMLButtonElement>(null);
    const calendarRef = useRef<HTMLDivElement>(null);
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState<Date>(startOfDay(new Date()));

    const startHour = 9;
    const endHour = 22;
    const timeSlots = useMemo(() => generateTimeSlots(startHour, endHour), [startHour, endHour]);
    const totalRows = useMemo(() => (endHour - startHour) * 2 + 1, [startHour, endHour]);

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

    useEffect(() => {

        fetchBookings();

    }, [currentDate]);

    // カレンダー外クリックで閉じる
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (calendarOpen && 
                calendarButtonRef.current && 
                calendarRef.current &&
                !calendarButtonRef.current.contains(event.target as Node) &&
                !calendarRef.current.contains(event.target as Node)) {
                setCalendarOpen(false);
            }
        };

        if (calendarOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [calendarOpen]);

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
        console.log(booking);
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

    const handleMouseUp = async () => {
        if (!isDragging || !draggedBooking) {
            setIsDragging(false);
            setDraggedBooking(null);
            setHoveredSlot(null);
            setDidDrag(false);
            return;
        }

        if (didDrag) {
            suppressRegisterRef.current = true;
            window.setTimeout(() => {
                suppressRegisterRef.current = false;
            }, 0);
            if (hoveredSlot === null) {

            } else {
                // 1. 必要な計算
                const newStartMinutes = hoveredSlot * 30 + (startHour * 60);
                const newStartHour = Math.floor(newStartMinutes / 60);
                const newStartMin = newStartMinutes % 60;
    
                // 2. draggedBookingから直接updatedBookingを作成
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
    
                // 3. 更新後の予約データを先に作成
                const updatedBooking: Booking = {
                    ...draggedBooking,
                    start: newStartStr,
                    end: newEndStr,
                };
    
                // 4. stateを更新
                setBookingsState(prev => {
                    const current = prev.length > 0 ? prev : clientData;
                    return current.map(booking => 
                        booking.id === draggedBooking.id ? updatedBooking : booking
                    );
                });
    
                // 5. バックエンドに送信
                try {
                    await changeBooking(updatedBooking);
                } catch (error) {
                    console.error("予約更新エラー:", error);
                    // エラー時は元の状態に戻す
                    setBookingsState(prev => {
                        return prev.map(booking => 
                            booking.id === draggedBooking.id ? draggedBooking : booking
                        );
                    });
                }
                setBookingRegister(false);
            }
        } else {
            setBookingRegister(false);
            setSelectedBooking(draggedBooking); // 表示する予約データをセット
        }
    
        // 4. ドラッグ状態をリセット
        setIsDragging(false);
        setDraggedBooking(null);
        setHoveredSlot(null);
        setDidDrag(false);
    };

    const statusOptions = [
        { label: "完了", color: "#22c55e" },
        { label: "予約確定", color: "#3b82f6" },
        { label: "仮予約", color: "#f59e0b" },
        { label: "キャンセル", color: "#ef4444" },
    ];

    const statusCourse = [
        { course: "40分", value: 40 },
        { course: "60分", value: 60 },
        { course: "80分", value: 80 },
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
        for (let h = 9; h < 21; h++) {
          for (let m = 0; m < 60; m+=30) {
            const hh = h.toString().padStart(2, '0');
            const mm = m.toString().padStart(2, '0');
            times.push(`${hh}:${mm}`);
          }
        }
        return times;
      };
    
    const timeOptions = generateTimeOptions();

    // selectが変わった時のハンドラ
    // BookingsWithDragDrop コンポーネント内

    const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>, booking: Booking, part: string) => {
        if (!selectedBooking) return;
        
        // 現在の開始日時をDateオブジェクトとして取得
        const currentStart = new Date(selectedBooking.start);
        let newStart = new Date(currentStart);
        
        const newValue = Number(e.target.value);

        // 1. Dateオブジェクト内の日時を設定
        if (part === 'year') {
            newStart.setFullYear(newValue);
        } else if (part === 'month') {
            newStart.setMonth(newValue - 1);
        } else if (part === 'day') {
            newStart.setDate(newValue);
        } else if (part === 'time') {
            const [hours, minutes] = e.target.value.split(':').map(Number);
            // 時と分をローカル時刻として設定
            newStart.setHours(hours, minutes, 0, 0); 
        }
        // 2. ローカル時刻を保ったまま、ZなしのISO形式の文字列に変換

        // Dateオブジェクトから各要素を取得し、2桁にパディング
        const year = newStart.getFullYear();
        const month = String(newStart.getMonth() + 1).padStart(2, '0');
        const day = String(newStart.getDate()).padStart(2, '0');
        const hour = String(newStart.getHours()).padStart(2, '0');
        const minute = String(newStart.getMinutes()).padStart(2, '0');
        const second = '00'; // 秒は固定で00
        
        // YYYY-MM-DDTHH:MM:SS 形式の文字列を作成
        const localIsoString = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
        
        // 3. selectedBooking State を更新
        setSelectedBooking({ 
            ...selectedBooking, 
            start: localIsoString
        });
    };

    const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>, booking: Booking) => {
        if (!selectedBooking) return;
        setSelectedBooking({ ...selectedBooking, stretchCourse: Number(e.target.value) });
    };

    const handleColorStatusChange = (e: React.ChangeEvent<HTMLSelectElement>, booking: Booking) => {
        if (!selectedBooking) return;
        setSelectedBooking({ ...selectedBooking, color: e.target.value });
    };

    // 顧客詳細情報変更
    const changeBooking = async (draggedBooking?: Booking) => {
        const bookingToUpdate = draggedBooking || selectedBooking;

        console.log(bookingToUpdate);
        const numericId = Number(bookingToUpdate?.id.replace('b', ''));
        // IDが変換できない（数値以外が含まれるなど）場合はエラーチェックを入れるとより安全です。
        if (isNaN(numericId)) {
            throw new Error("予約IDの形式が不正です。");
        }

        const response = await apiClient("/detailBooking",{
            method: "PUT",
            body: JSON.stringify({
                id: numericId,
                start: bookingToUpdate?.start,
                stretchCourse: bookingToUpdate?.stretchCourse,
                color: bookingToUpdate?.color
            })
        });

        if (response.ok) {
            console.log("更新成功");
            await fetchBookings();
        } else {
            console.error("更新失敗");
        }

        setSelectedBooking(null);
    }

    const handleBookingRegister = (e: React.MouseEvent<HTMLDivElement>) => {
        if (suppressRegisterRef.current || isDragging) {
            suppressRegisterRef.current = false;
            return;
        }
        setBookingRegister(true);
    }

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
                className={`fixed inset-y-0 left-0 z-40 w-54 transform bg-white shadow-md transition-transform duration-200 ease-out md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:static md:z-auto`}
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
           
                <div
                    className="w-full bg-gradient-to-br from-cyan-50 via-sky-50 to-blue-50 p-4 sm:p-6"
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                >
                    <div className="mx-auto max-w-5xl">
                        {/* ヘッダー */}
                        <div className="sticky top-0 z-10 px-4 sm:px-0 py-3 bg-gradient-to-br from-cyan-50/95 via-sky-50/95 to-blue-50/95 backdrop-blur">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                                {/* 左矢印ボタン */}
                                <button
                                    className="px-3 py-2 rounded-lg border border-cyan-200 bg-white hover:bg-cyan-50 text-cyan-700 transition-colors"
                                    onClick={() => setCurrentDate(addDays(currentDate, -1))}
                                    aria-label="前日"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M15 18l-6-6 6-6"/>
                                    </svg>
                                </button>
                                
                                {/* 日付表示 */}
                                <div className="text-xl sm:text-2xl font-bold text-cyan-900 min-w-[140px] text-center">
                                    {formatYMD(currentDate)}
                                </div>
                                
                                {/* 右矢印ボタン */}
                                <button
                                    className="px-3 py-2 rounded-lg border border-cyan-200 bg-white hover:bg-cyan-50 text-cyan-700 transition-colors"
                                    onClick={() => setCurrentDate(addDays(currentDate, 1))}
                                    aria-label="翌日"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 18l6-6-6-6"/>
                                    </svg>
                                </button>
                                
                                {/* カレンダーボタン */}
                                <div className="relative">
                                    <button
                                        ref={calendarButtonRef}
                                        className="px-3 py-2 rounded-lg border border-cyan-200 bg-white hover:bg-cyan-50 text-cyan-700 transition-colors"
                                        onClick={() => {
                                            setCalendarOpen(!calendarOpen);
                                            setCalendarMonth(new Date(currentDate));
                                        }}
                                        aria-label="カレンダーを開く"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                            <line x1="16" y1="2" x2="16" y2="6"/>
                                            <line x1="8" y1="2" x2="8" y2="6"/>
                                            <line x1="3" y1="10" x2="21" y2="10"/>
                                        </svg>
                                    </button>
                                    
                                    {/* カスタムカレンダー */}
                                    {calendarOpen && (
                                        <div ref={calendarRef} className="absolute md:left-0 right-0 top-full mt-2 z-50 bg-white rounded-xl shadow-2xl border border-cyan-200 overflow-hidden w-80">
                                            {/* カレンダーヘッダー */}
                                            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <button
                                                        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                                                        onClick={() => {
                                                            const prevMonth = new Date(calendarMonth);
                                                            prevMonth.setMonth(prevMonth.getMonth() - 1);
                                                            setCalendarMonth(prevMonth);
                                                        }}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M15 18l-6-6 6-6"/>
                                                        </svg>
                                                    </button>
                                                    <div className="text-lg font-semibold">
                                                        {formatMonthYear(calendarMonth)}
                                                    </div>
                                                    <button
                                                        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                                                        onClick={() => {
                                                            const nextMonth = new Date(calendarMonth);
                                                            nextMonth.setMonth(nextMonth.getMonth() + 1);
                                                            setCalendarMonth(nextMonth);
                                                        }}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M9 18l6-6-6-6"/>
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            {/* 曜日ヘッダー */}
                                            <div className="grid grid-cols-7 bg-cyan-50/50 border-b border-cyan-100">
                                                {['日', '月', '火', '水', '木', '金', '土'].map((day, idx) => (
                                                    <div
                                                        key={day}
                                                        className={`p-2 text-center text-xs font-semibold ${
                                                            idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-cyan-700'
                                                        }`}
                                                    >
                                                        {day}
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            {/* カレンダーグリッド */}
                                            <div className="p-3">
                                                <div className="grid grid-cols-7 gap-1">
                                                    {(() => {
                                                        const daysInMonth = getDaysInMonth(calendarMonth);
                                                        const firstDay = getFirstDayOfMonth(calendarMonth);
                                                        const days: (Date | null)[] = [];
                                                        
                                                        // 前月の空白日
                                                        for (let i = 0; i < firstDay; i++) {
                                                            days.push(null);
                                                        }
                                                        
                                                        // 今月の日付
                                                        for (let day = 1; day <= daysInMonth; day++) {
                                                            const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
                                                            days.push(date);
                                                        }
                                                        
                                                        return days.map((date, idx) => {
                                                            if (!date) {
                                                                return <div key={idx} className="aspect-square" />;
                                                            }
                                                            
                                                            const isSelected = isSameDay(date, currentDate);
                                                            const isTodayDate = isToday(date);
                                                            
                                                            return (
                                                                <button
                                                                    key={idx}
                                                                    className={`aspect-square rounded-lg text-sm font-medium transition-all ${
                                                                        isSelected
                                                                            ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-lg scale-105'
                                                                            : isTodayDate
                                                                            ? 'bg-cyan-100 text-cyan-700 font-bold border-2 border-cyan-400'
                                                                            : 'hover:bg-cyan-50 text-gray-700 hover:scale-105'
                                                                    }`}
                                                                    onClick={() => {
                                                                        setCurrentDate(startOfDay(date));
                                                                        setCalendarOpen(false);
                                                                    }}
                                                                >
                                                                    {date.getDate()}
                                                                </button>
                                                            );
                                                        });
                                                    })()}
                                                </div>
                                            </div>
                                            
                                            {/* フッター */}
                                            <div className="border-t border-cyan-100 p-3 bg-cyan-50/30">
                                                <button
                                                    className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all font-medium text-sm"
                                                    onClick={() => {
                                                        setCurrentDate(startOfDay(new Date()));
                                                        setCalendarOpen(false);
                                                    }}
                                                >
                                                    今日に戻る
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center justify-end">
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
                                        <span className="inline-block w-3 h-3 rounded-sm bg-[#ef4444]" /> キャンセル
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
                                <div className="relative" ref={scheduleRef} onClick={handleBookingRegister}>
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
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
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
                                        <h4 className="text-sm font-medium text-gray-500">名前</h4>
                                        <p className="text-lg">{selectedBooking.title || '（タイトルなし）'}</p>
                                    </div>
                                    
                                    {/* 日時 */}
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500">日時</h4>
                                        <p className="text-lg">
                                            <select 
                                                className="px-1 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition duration-150"
                                                value={new Date(selectedBooking.start).getFullYear()} onChange={(e) => handleDateChange(e,selectedBooking,'year')}>
                                                <option value="2024">2024</option>
                                                <option value="2025">2025</option>
                                                <option value="2026">2026</option>
                                            </select>
                                            {' 年 '}
                                            <select
                                                className="px-1 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition duration-150" 
                                                value={new Date(selectedBooking.start).getMonth() + 1} onChange={(e) => handleDateChange(e,selectedBooking,'month')}>
                                                {[...Array(12)].map((_, i) => (
                                                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                                                ))}
                                            </select>
                                            {' 月 '}

                                            <select
                                                className="px-1 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition duration-150" 
                                                value={new Date(selectedBooking.start).getDate()} onChange={(e) => handleDateChange(e,selectedBooking,'day')}>
                                                {[...Array(31)].map((_, i) => (
                                                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                                                ))}
                                            </select>
                                            {' 日 '}
                                        </p>
                                        <h4 className="text-sm font-medium text-gray-500 mt-3">ストレッチ開始時刻</h4>
                                        <p className="text-lg font-mono">
                                            {/* 時間のフォーマット */}
                                            <select
                                                className="w-75 px-1 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition duration-150" 
                                                value={new Date(selectedBooking.start).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} onChange={(e) => handleDateChange(e,selectedBooking,'time')}>
                                                {timeOptions.map((time) => (
                                                <option key={time} value={time}>
                                                    {time}
                                                </option>
                                                ))}
                                            </select>
                                        </p>
                                        <h4 className="text-sm font-medium text-gray-500 mt-3">コース</h4>
                                        <p className="text-lg font-mono">
                                            {/* 時間のフォーマット */}
                                            <select
                                                className="w-75 px-1 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition duration-150" 
                                                value={selectedBooking.stretchCourse} onChange={(e) => handleCourseChange(e,selectedBooking)}>
                                                {statusCourse.map((data) => (
                                                <option key={data.course} value={data.value}>
                                                    {data.course}
                                                </option>
                                                ))}
                                            </select>
                                        </p>
                                    </div>
                                    
                                    {/* ここに他の情報を追加できます (例: 担当者、メモなど) */}
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500">ステータス</h4>
                                        <select 
                                            value={selectedBooking.color}
                                            onChange={(e) => {
                                                handleColorStatusChange(e,selectedBooking)
                                            }}
                                            className="w-75 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition duration-150">
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
                                            className="px-4 py-2 text-sm font-medium text-white bg-green-500 border border-gray-300 rounded-lg hover:bg-green-700"
                                            onClick={() => changeBooking()}
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

                    {bookingRegister && (
                        <div 
                            // 1. オーバーレイ (背景)
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                            // オーバーレイクリックで閉じる
                            onClick={() => {
                                // setIsDetailModalOpen(false);
                                setBookingRegister(false);
                            }}
                        >
                             <div
                                // モーダル内部のクリックが、背景のonClickに伝播(バブリング)するのを防ぐ
                                onClick={(e) => e.stopPropagation()} 
                                // モーダルのスタイル (白背景、角丸、影、サイズ)
                                className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 text-gray-900"
                            >
                                {/* --- ヘッダー --- */}
                                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                                    <h3 className="text-lg font-semibold">
                                        予約登録
                                    </h3>
                                    <button
                                        onClick={() => {
                                            // setIsDetailModalOpen(false);
                                            setBookingRegister(false);
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
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500">名前</h4>
                                        <input
                                            type="text"
                                            className="pl-3 pr-4 py-3 bg-white border border-gray-300 text-medium rounded-xl w-75 focus:ring-4 focus:ring-cyan-300/50 focus:border-cyan-400 outline-none transition-all text-gray-900 placeholder:text-gray-400" 
                                        >
                                        </input>
                                    </div>
                                     {/* 日時 */}
                                     <div>
                                        <h4 className="text-sm font-medium text-gray-500">日時</h4>
                                        <p className="text-lg">
                                            <select className="px-1 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium focus:ring-4 focus:ring-cyan-300/50 focus:border-cyan-400 outline-none transition-all duration-150">
                                                <option value="2024">2024</option>
                                                <option value="2025">2025</option>
                                                <option value="2026">2026</option>
                                            </select>
                                            {' 年 '}
                                            <select className="px-1 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium focus:ring-4 focus:ring-cyan-300/50 focus:border-cyan-400 outline-none transition-all duration-150">
                                                {[...Array(12)].map((_, i) => (
                                                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                                                ))}
                                            </select>
                                            {' 月 '}

                                            <select className="px-1 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium focus:ring-4 focus:ring-cyan-300/50 focus:border-cyan-400 outline-none transition-all duration-150">
                                                {[...Array(31)].map((_, i) => (
                                                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                                                ))}
                                            </select>
                                            {' 日 '}
                                        </p>
                                        <h4 className="text-sm font-medium text-gray-500 mt-3">ストレッチ開始時刻</h4>
                                        <p className="text-lg font-mono">
                                           {/* 時間のフォーマット */}
                                           <select className="px-1 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium focus:ring-4 focus:ring-cyan-300/50 focus:border-cyan-400 outline-none transition-allduration-150">
                                                {timeOptions.map((time) => (
                                                <option key={time} value={time}>
                                                    {time}
                                                </option>
                                                ))}
                                            </select>
                                            
                                        </p>
                                        <h4 className="text-sm font-medium text-gray-500 mt-3">コース</h4>
                                        <p className="text-lg font-mono">
                                            <select className="w-75 px-1 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium focus:ring-4 focus:ring-cyan-300/50 focus:border-cyan-400 outline-none transition-all duration-150">
                                                {statusCourse.map((data) => (
                                                <option key={data.course} value={data.value}>
                                                    {data.course}
                                                </option>
                                                ))}
                                            </select>
                                        </p>
                                    </div>
                                    
                                    {/* ここに他の情報を追加できます (例: 担当者、メモなど) */}
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500">ステータス</h4>
                                        <select 
                                            className="w-75 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium focus:ring-4 focus:ring-cyan-300/50 focus:border-cyan-400 outline-none transition-all duration-150">
                                           {statusOptions.map((data) => (
                                                <option key={data.color}>{data.label}</option>
                                           ))}
                                        </select>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500">メモ</h4>
                                        <textarea className="w-full px-1 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium focus:ring-4 focus:ring-cyan-300/50 focus:border-cyan-400 outline-none transition-all duration-150"></textarea>
                                        
                                    </div>
                                
                                </div>
                                {/* --- フッター --- */}
                                <div className="flex items-center justify-end p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">         
                                    <button
                                        className="px-4 py-2 mr-3 text-sm font-medium text-white bg-green-500 border border-gray-300 rounded-lg hover:bg-green-700"
                                        onClick={() => changeBooking()}
                                    >
                                        登録
                                    </button>
                                    <button
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                                        onClick={() => {
                                            setBookingRegister(false);
                                        }}
                                    >
                                        閉じる
                                    </button>
                                </div>
                            </div>
                        </div>
                             
                    )}
                </div>
            </div>
        </div>
    );
}