// カレンダーイベントの型（フロントエンドで利用したい形式）
export type CalendarEvent = {
    id: string;
    title: string;
    start: string;
    stretchCourse: number;
    end: string;
    color?: string;
};

// バックエンドから返される顧客オブジェクトの型
export type CustomerData = {
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

export type DetailBackendBooking = {
    id: number;
    customerName: CustomerData;
    startTime: string;
    endTime: string;
    status: string;
    message: string;
    createdAt: string;
    choiseStretch: number;
};

export type Booking = {
    id: string;
    title: string;
    start: string;
    end: string;
    stretchCourse: number;
    color?: string;
};

export type Notification = {
    id: number;
    bookingId: number;
    bookingTitle: string;
    notificationType: string;
    status: string;
    message: string;
    isRead: boolean;
    createdAt: string;
};

//　Long id,
// Long bookingId,
// String bookingTitle,
// NotificationType notificationType, // NEW, CANCEL, REMINDER
// String message,
// boolean isRead,
// LocalDateTime createdAt