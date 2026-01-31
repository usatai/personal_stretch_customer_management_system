import { useState, useCallback } from 'react';
import { startOfDay, addDays, isSameDay } from '@/utils/dateUtils';

export type Notification = {
    id: string;
    type: 'today' | 'tomorrow' | 'new' | 'cancelled';
    message: string;
    bookingId: string;
    bookingTitle: string;
    time: string;
    isRead: boolean;
};

type Booking = {
    id: string;
    title: string;
    start: string;
    end: string;
    stretchCourse: number;
    color?: string;
};

export const useNotifications = (bookings: Booking[]) => {

    const [notifications, setNotifications] = useState<Notification[]>([]);

    // 通知を生成する関数
    const generateNotifications = useCallback((bookings: Booking[]) => {
        const now = new Date();
        const today = startOfDay(now);
        const tomorrow = addDays(today, 1);
        const newNotifications: Notification[] = [];

        bookings.forEach((booking) => {
            const bookingStart = new Date(booking.start);
            const bookingDate = startOfDay(bookingStart);
            const hoursUntilStart = (bookingStart.getTime() - now.getTime()) / (1000 * 60 * 60);

            // 今日の予約（開始時刻が1時間以内）
            if (isSameDay(bookingDate, today) && hoursUntilStart >= 0 && hoursUntilStart <= 1) {
                newNotifications.push({
                    id: `today-${booking.id}`,
                    type: 'today',
                    message: `予約が1時間以内に開始します`,
                    bookingId: booking.id,
                    bookingTitle: booking.title,
                    time: bookingStart.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
                    isRead: false,
                });
            }

            // 明日の予約
            if (isSameDay(bookingDate, tomorrow)) {
                newNotifications.push({
                    id: `tomorrow-${booking.id}`,
                    type: 'tomorrow',
                    message: `明日の予約があります`,
                    bookingId: booking.id,
                    bookingTitle: booking.title,
                    time: bookingStart.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
                    isRead: false,
                });
            }

            // キャンセルされた予約
            if (booking.color === '#ef4444') {
                newNotifications.push({
                    id: `cancelled-${booking.id}`,
                    type: 'cancelled',
                    message: `予約がキャンセルされました`,
                    bookingId: booking.id,
                    bookingTitle: booking.title,
                    time: bookingStart.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
                    isRead: false,
                });
            }
        });

        // 既存の通知とマージ（重複を避ける）
        setNotifications(prev => {
            const existingIds = new Set(prev.map(n => n.id));
            const newOnes = newNotifications.filter(n => !existingIds.has(n.id));
            return [...prev, ...newOnes].sort((a, b) => {
                const aBooking = bookings.find(booking => booking.id === a.bookingId);
                const bBooking = bookings.find(booking => booking.id === b.bookingId);
                const aTime = new Date(aBooking?.start || 0).getTime();
                const bTime = new Date(bBooking?.start || 0).getTime();
                return bTime - aTime;
            });
        });
    }, []);

    // 通知を既読にする
    const markAsRead = (notificationId: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
    };

    // すべての通知を既読にする
    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

     const unreadCount = notifications.filter(n => !n.isRead).length;

    // フックとして返すもの
    return {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead
    };


}