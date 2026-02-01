import { useState } from "react";
import { Booking } from "@/app/types";
import { calculateNewDateString } from "@/utils/bookingDateUtils";
import { generateTimeOptions, getSortedStatusOptions } from "@/utils/dateUtils";

type Props = {
    booking: Booking; // nullは来ない前提（親が出し分けしてるから）
    onClose: () => void;
    onSave: (updatedBooking: Booking) => void;
    onDelete: (id: string) => void;
};

const statusCourse = [
    { course: "40分", value: 40 },
    { course: "60分", value: 60 },
    { course: "80分", value: 80 },
];

export const BookingDetailModal = ({ booking, onClose, onSave, onDelete } : Props) => {

    const [editingBooking, setEditingBooking] = useState<Booking>(booking);

    const timeOptions = generateTimeOptions();

    const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>, booking: Booking,part: string) => {
        const newStart = calculateNewDateString(editingBooking.start, part, e.target.value);
        setEditingBooking({ ...editingBooking, start: newStart });
    };

    const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>, booking: Booking) => {
        setEditingBooking({ ...editingBooking, stretchCourse: Number(e.target.value) });
    };

    const handleColorStatusChange = (e: React.ChangeEvent<HTMLSelectElement>, booking: Booking) => {
        if (!editingBooking) return;
        setEditingBooking({ ...editingBooking, color: e.target.value });
    };
    

    return(
        <div
            // 1. オーバーレイ (背景)
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            // オーバーレイクリックで閉じる
            onClick={(e) => {
                e.stopPropagation();
                onClose();
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
                <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-cyan-500 to-blue-500">
                    <h3 className="text-lg font-semibold text-white">
                        予約詳細
                    </h3>
                    <button
                       onClick={(e) => e.stopPropagation()}
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
                        <p className="text-lg">{editingBooking.title || '（タイトルなし）'}</p>
                    </div>
                    
                    {/* 日時 */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-500">日時</h4>
                        <p className="text-lg">
                            <select 
                                className="px-1 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition duration-150"
                                value={new Date(editingBooking.start).getFullYear()} onChange={(e) => handleDateChange(e,editingBooking,'year')}>
                                <option value="2024">2024</option>
                                <option value="2025">2025</option>
                                <option value="2026">2026</option>
                            </select>
                            {' 年 '}
                            <select
                                className="px-1 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition duration-150" 
                                value={new Date(editingBooking.start).getMonth() + 1} onChange={(e) => handleDateChange(e,editingBooking,'month')}>
                                {[...Array(12)].map((_, i) => (
                                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                                ))}
                            </select>
                            {' 月 '}

                            <select
                                className="px-1 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition duration-150" 
                                value={new Date(editingBooking.start).getDate()} onChange={(e) => handleDateChange(e,editingBooking,'day')}>
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
                                value={new Date(editingBooking.start).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} onChange={(e) => handleDateChange(e,editingBooking,'time')}>
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
                                value={editingBooking.stretchCourse} onChange={(e) => handleCourseChange(e,editingBooking)}>
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
                            value={editingBooking.color}
                            onChange={(e) => {
                                handleColorStatusChange(e,editingBooking)
                            }}
                            className="w-75 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition duration-150">
                            {getSortedStatusOptions(editingBooking.color!).map(opt => (
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
                        onClick={(e) => {
                            alert(`ID: ${editingBooking.id} を削除します`);
                            e.stopPropagation()
                        }}
                    >
                        削除
                    </button>
                    
                    {/* 閉じる・編集ボタン (右寄せ) */}
                    <div className="space-x-3">
                        <button
                            className="px-4 py-2 text-sm font-medium text-white bg-green-500 border border-gray-300 rounded-lg hover:bg-green-700"
                            onClick={() => onSave(editingBooking)}
                        >
                            変更
                        </button>
                        <button
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose();
                            }}
                        >
                            閉じる
                        </button>
                    </div>
                </div>
            </div>
        </div>

    )
    

}