import { useState, useRef, useEffect } from 'react';
import { Notification } from '@/component/useNotifications';

type Props = {
    notifications: Notification[];
    unreadCount: number;
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    onSelectBooking: (bookingId: string) => void;
};

// アイコンをコンポーネントとして定義（再利用のため）
const Icons = {
    Bell: ({ className }: { className?: string }) => (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
    ),
    Clock: ({ className }: { className?: string }) => (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
    ),
    Calendar: ({ className }: { className?: string }) => (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
    ),
    Check: ({ className }: { className?: string }) => (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
    ),
    X: ({ className }: { className?: string }) => (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    )
};

export const NotificationCenter = ({ 
    notifications, 
    unreadCount, 
    onMarkAsRead, 
    onMarkAllAsRead,
    onSelectBooking 
}: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // 外側クリックで閉じる処理
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // 通知タイプごとのスタイル定義
    const getTypeStyles = (type: Notification['type']) => {
        const iconClass = "w-5 h-5";
        switch (type) {
            case 'today': 
                return { 
                    bg: 'bg-orange-100', 
                    border: 'border-orange-300', 
                    icon: <Icons.Clock className={`${iconClass} text-orange-600`} /> 
                };
            case 'tomorrow': 
                return { 
                    bg: 'bg-blue-100', 
                    border: 'border-blue-300', 
                    icon: <Icons.Calendar className={`${iconClass} text-blue-600`} /> 
                };
            case 'cancelled': 
                return { 
                    bg: 'bg-red-100', 
                    border: 'border-red-300', 
                    icon: <Icons.X className={`${iconClass} text-red-600`} /> 
                };
            default: // 'new' など
                return { 
                    bg: 'bg-green-100', 
                    border: 'border-green-300', 
                    icon: <Icons.Check className={`${iconClass} text-green-600`} /> 
                };
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            {/* --- 1. ベルアイコンボタン --- */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2 rounded-lg transition-colors border ${
                    isOpen ? 'bg-cyan-100 border-cyan-300' : 'bg-white border-cyan-200 hover:bg-cyan-50'
                }`}
                aria-label="通知"
            >
                <Icons.Bell className="h-6 w-6 text-cyan-700" />

                {/* 未読バッジ */}
                {unreadCount > 0 && (
                     <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                     </span>
                )}
            </button>

            {/* --- 2. ドロップダウンリスト (開いている時だけ表示) --- */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-xl shadow-2xl border border-cyan-200 overflow-hidden w-80 sm:w-96 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                    
                    {/* ヘッダー */}
                    <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-4 flex items-center justify-between shadow-sm">
                        <h3 className="font-bold tracking-wide">お知らせ</h3>
                        {unreadCount > 0 && (
                            <button 
                                onClick={onMarkAllAsRead} 
                                className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
                            >
                                すべて既読
                            </button>
                        )}
                    </div>

                    {/* リスト本体 */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                                {/* 空状態のアイコン（ベルに斜線） */}
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M10.26 3.24c.38-.4.77-.96 1.74-.96 1.15 0 2.05.9 2.05 2v.34a6 6 0 0 1 3.5 10.15"></path>
                                    <path d="M19.07 19.07L4.93 4.93"></path>
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                    <path d="M8.57 18H6c-1.15 0-1.85-1.1-1.35-2.22l.6-1.34c.1-.2.15-.45.15-.7v-3.3c0-.62.08-1.22.24-1.8"></path>
                                </svg>
                                <p className="text-sm">新しい通知はありません</p>
                            </div>
                        ) : (
                            notifications.map((n) => {
                                const style = getTypeStyles(n.type);
                                return (
                                    <div 
                                        key={n.id}
                                        onClick={() => {
                                            onMarkAsRead(n.id);
                                            onSelectBooking(n.bookingId);
                                            setIsOpen(false);
                                        }}
                                        className={`p-4 border-b border-gray-100 cursor-pointer transition-all hover:bg-gray-50 flex gap-3 ${
                                            !n.isRead ? 'bg-cyan-50/60' : ''
                                        }`}
                                    >
                                        {/* アイコン */}
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${style.bg} ${style.border} border`}>
                                            {style.icon}
                                        </div>
                                        
                                        {/* テキスト */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className={`text-sm truncate pr-2 ${!n.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                                                    {n.bookingTitle}
                                                </p>
                                                {/* 未読の青い点 */}
                                                {!n.isRead && <span className="w-2 h-2 bg-cyan-500 rounded-full mt-1.5 flex-shrink-0" />}
                                            </div>
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="text-sm truncate pr-2 font-bold text-gray-900">
                                                    予約時刻:{n.bookingDate}
                                                </p>
                                            </div>
                                            <p className="text-xs text-gray-600 mb-1 line-clamp-2 leading-relaxed">
                                                {n.message}
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-mono">
                                                {n.time}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};