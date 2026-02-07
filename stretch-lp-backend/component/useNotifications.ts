import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/utils/apiClient';

export type Notification = {
    id: string;
    type: 'today' | 'tomorrow' | 'new' | 'cancelled';
    bookingId: string;
    bookingTitle: string;
    bookingDate: string;
    message: string;
    time: string;
    isRead: boolean;
};

// APIから返ってくる生のデータ型（JavaのDTOと一致させる）
type BackendNotificationDto = {
    id: number;
    bookingId: number;
    bookingTitle: string;
    notificationType: 'NEW' | 'CANCEL' | 'TODAY' | 'TOMORROW'; // JavaのEnum文字列
    isRead: boolean;
    message: string;
    bookingDate: string;
    createdAt: string;
};

type NotificationApiResponse = {
    notifications: BackendNotificationDto[];
};

export const useNotifications = () => {

    const [notifications, setNotifications] = useState<Notification[]>([]);

        // 1. APIから通知を取得する関数
        const fetchNotifications = useCallback(async () => {
            try {
                const response = await apiClient("/notification"); // "/api/notifications" かもしれません

                if (response.ok) {
                    const responseData = await response.json() as NotificationApiResponse;

                    console.log("APIから来たデータ:", responseData);

                    const list = responseData.notifications || [];
                    
                    // バックエンドのデータをフロント用に変換
                    const formatted: Notification[] = list.map(n => ({
                        id: String(n.id),
                        bookingId: String(n.bookingId), // IDの型変換
                        bookingTitle: n.bookingTitle,
                        type: convertType(n.notificationType), // 下で定義する変換関数を使う
                        time: new Date(n.createdAt).toLocaleTimeString('ja-JP', { hour: '2-digit',minute: '2-digit' }),
                        bookingDate: new Date(n.bookingDate).toLocaleTimeString('ja-JP', { hour: '2-digit',minute: '2-digit' }),
                        message: n.message,
                        isRead: n.isRead,
                        createdAt: n.createdAt
                    }));

                    setNotifications(formatted);
                }
            } catch (error) {
                console.error("通知取得エラー", error);
            }
    }, []);

    useEffect(() => {
        fetchNotifications();
    },[])

   // 3. 既読にする（API連携）
   const markAsRead = async (notificationId: string) => {
        // 先に見た目だけ更新（UX向上: Optimistic UI）
        setNotifications(prev =>
            prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );

        // 裏でAPIを叩く
        try {
            await apiClient(`/notification/${notificationId}/read`, { method: "PUT" });
        } catch (error) {
            console.error("既読更新エラー", error);
            // エラー時は元に戻す処理を入れても良い
        }
    };

    // 4. 全て既読にする（API連携）
    const markAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

        try {
            await apiClient(`/notification/read-all`, { method: "PUT" });
        } catch (error) {
            console.error("全既読エラー", error);
        }
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

// ヘルパー関数: JavaのEnumをフロントのtypeに変換
const convertType = (backendType: BackendNotificationDto['notificationType']): Notification['type'] => {
    switch (backendType) {
        case 'NEW': return 'new';
        case 'CANCEL': return 'cancelled';
        case 'TODAY': return 'today';
        case 'TOMORROW': return 'tomorrow';
        default: return 'new'; // デフォルト
    }
};