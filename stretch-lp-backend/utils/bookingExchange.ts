import { BackendBooking, CalendarEvent } from "@/app/types";// 適切なパスに修正してください

// ヘルパー関数: イベントの色を設定
const getColor = (status: string): string => {
    switch (status) {
        case 'CONFIRMED':
            return '#22c55e';
        case 'PENDING':
            return '#f59e0b';
        case 'CANCELLED':
            return '#ef4444';
        default:
            return '#3b82f6';
    }
};

// ヘルパー関数: Dateオブジェクトを 'YYYY-MM-DDTHH:mm:ss' 形式の文字列に変換
const toISOStringWithoutZ = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};


/**
 * バックエンドの予約データのリストをカレンダーイベントのリストに変換します。
 * @param bookingList - バックエンドから返された BackendBooking オブジェクトの配列
 * @returns 変換された CalendarEvent オブジェクトの配列
 */
export const convertToCalendarEvents = (bookingList: BackendBooking[]): CalendarEvent[] => {
    
    return bookingList.map(booking => {
        
        // 予約の開始時刻を firstChoiceDate から取得
        const startTime = booking.firstChoiceDateTime;
        const stretchMinutes = booking.choiseStretch || 60;
        
        // 終了時刻は開始時刻の1時間後と仮定して計算
        const startDateTime = new Date(startTime);
        const endDateTime = new Date(startDateTime);

        const newEndTime = endDateTime.getTime() + (stretchMinutes * 60000); // 1分 = 60000ミリ秒
        endDateTime.setTime(newEndTime);

        // 変換後のイベントオブジェクト
        const event: CalendarEvent = {
            // id: number から string へ変換
            id: `b${booking.id}`, 
            // title: 顧客名 + ' 様'
            title: `${booking.customers.customerName} 様`,
            // start: そのまま使用
            start: startTime,
            // end: 1時間後の時刻を整形
            end: toISOStringWithoutZ(endDateTime), 
            // color: ステータスに応じた色
            color: getColor(booking.status), 
        };

        return event;
    });
};