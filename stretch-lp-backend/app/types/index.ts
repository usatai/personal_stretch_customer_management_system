// カレンダーイベントの型（フロントエンドで利用したい形式）
export type CalendarEvent = {
    id: string;
    title: string;
    start: string;
    end: string;
    color?: string;
};

// バックエンドから返される顧客オブジェクトの型
type CustomerData = {
    id: number;
    customerName: string;
    customerEmail: string;
    customerPhoneNumber: string;
    createdAt: string;
};

// バックエンドから返される予約オブジェクトの型（forEachで処理される単一の要素）
export type BackendBooking = {
    id: number;
    customers: CustomerData;
    firstChoiceDateTime: string;
    secondChoiceDateTime: string;
    status: string;
    message: string;
    createdAt: string;
    choiseStretch: number;
};