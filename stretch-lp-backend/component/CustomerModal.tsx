import { useState, useEffect, ChangeEvent } from 'react';

type Users = {
    id: string;
    name: string;
    email: string;
    phone: string;
    lastVisitDate: string; // YYYY-MM-DD
    firstVisitDate?: string; // YYYY-MM-DD 初回来店日
    nextVisitDate?: string;
    visitCount: number;
    memo?: string;
    createdAt: string;
}

// Propsの型定義
interface CustomerModalProps {
    customer: Users;
    onClose: () => void;
    onUpdate: (updatedCustomer: Users) => void;
}

const formatDate = (dateString : string) => {
    if (!dateString) return '-'; 
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

// 平均間隔日数算出
function calculateAverageVisitInterval(user: Users): number {
    const { lastVisitDate, firstVisitDate, visitCount } = user;

    if (!firstVisitDate || visitCount < 2) {
        return 0;
    }

    const last = new Date(lastVisitDate).getTime();
    const first = new Date(firstVisitDate).getTime();

    const diffTime = last - first;

    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    const averageInterval = diffDays / (visitCount - 1);

    return Math.round(averageInterval * 10) / 10;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({ customer, onClose, onUpdate }) => {
    // 編集モードかどうかのフラグ
    const [isEditing, setIsEditing] = useState(false);
    
    // 編集用の一時データ
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        memo: ''
    });

    // モーダルが開かれた時やcustomerが変わった時に初期値をセット
    useEffect(() => {
        if (customer) {
            setFormData({
                name: customer.name || '',
                email: customer.email || '',
                phone: customer.phone || '',
                memo: customer.memo || ''
            });
        }
    }, [customer]);

    if (!customer) return null;

    // 入力変更ハンドラ
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // 保存ハンドラ
    const handleSave = () => {
        // 親コンポーネントの更新関数を呼ぶ（API通信などはここで行う）
        onUpdate({ ...customer, ...formData });
        setIsEditing(false);
    };

    // キャンセルハンドラ
    const handleCancel = () => {
        // 編集内容をリセットして表示モードに戻る
        setFormData({
            name: customer.name || '',
            email: customer.email || '',
            phone: customer.phone || '',
            memo: customer.memo || ''
        });
        setIsEditing(false);
    };

    return (
        <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-xl shadow-xl w-full max-w-lg sm:max-w-xl md:max-w-2xl max-h-[80vh] mx-3 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* --- ヘッダー --- */}
                <div className="px-3 py-2 border-b bg-gradient-to-r from-cyan-500 to-blue-500 rounded-t-xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-lg font-bold backdrop-blur-sm text-white">
                                {formData.name.charAt(0)}
                            </div>
                            <div>
                                {/* 名前も編集時はヘッダーで反映されるようにformDataを参照 */}
                                <h2 className="text-xl font-semibold text-white">{formData.name}</h2>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- ボディ --- */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* 統計情報カード（編集不可エリア） */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-3 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg border border-cyan-200">
                            <p className="text-xs text-gray-600 mb-0.5">来店回数</p>
                            <p className="text-2xl font-bold text-cyan-600">{customer.visitCount}回</p>
                        </div>
                        <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                            <p className="text-xs text-gray-600 mb-0.5">最終来店日</p>
                            <p className="text-base font-semibold text-gray-900">{formatDate(customer.lastVisitDate)}</p>
                        </div>
                        <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                            <p className="text-xs text-gray-600 mb-0.5">初回来店日</p>
                            <p className="text-base font-semibold text-gray-900">
                                {customer.firstVisitDate ? formatDate(customer.firstVisitDate) : '-'}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 基本情報（編集対象エリア） */}
                        <div className="space-y-3">
                            <h3 className="text-base font-semibold text-gray-900 border-b border-gray-200 pb-1.5 flex justify-between items-center">
                                基本情報
                                {isEditing && <span className="text-xs text-blue-600 font-normal">編集中...</span>}
                            </h3>
                            
                            <div className="space-y-2.5">
                                {/* 名前 */}
                                <div>
                                    <p className="text-xs text-gray-600 mb-0.5">名前</p>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full text-sm p-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                                        />
                                    ) : (
                                        <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                                    )}
                                </div>

                                {/* メールアドレス */}
                                <div>
                                    <p className="text-xs text-gray-600 mb-0.5">メールアドレス</p>
                                    <div className="flex items-center gap-1.5">
                                        {!isEditing && (
                                            <svg className="w-3.5 h-3.5 text-cyan-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        )}
                                        {isEditing ? (
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="w-full text-sm p-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                                            />
                                        ) : (
                                            <p className="text-sm text-gray-900 break-all">{customer.email || '-'}</p>
                                        )}
                                    </div>
                                </div>

                                {/* 電話番号 */}
                                <div>
                                    <p className="text-xs text-gray-600 mb-0.5">電話番号</p>
                                    <div className="flex items-center gap-1.5">
                                        {!isEditing && (
                                            <svg className="w-3.5 h-3.5 text-cyan-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                        )}
                                        {isEditing ? (
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                className="w-full text-sm p-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                                            />
                                        ) : (
                                            <p className="text-sm text-gray-900">{customer.phone || '-'}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 来店情報（編集不可） */}
                        <div className="space-y-3">
                            <h3 className="text-base font-semibold text-gray-900 border-b border-gray-200 pb-1.5">来店情報</h3>
                            <div className="space-y-2.5">
                                <div className="p-2.5 bg-cyan-50 rounded-lg">
                                    <p className="text-xs text-gray-600 mb-0.5">最終来店日</p>
                                    <p className="text-sm font-semibold text-gray-900">{formatDate(customer.lastVisitDate)}</p>
                                </div>
                                <div className="p-2.5 bg-blue-50 rounded-lg">
                                    <p className="text-xs text-gray-600 mb-0.5">初回来店日</p>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {customer.firstVisitDate ? formatDate(customer.firstVisitDate) : '-'}
                                    </p>
                                </div>
                                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-xs text-gray-600 mb-1.5">次回予約日</p>
                                    <p className="text-sm text-gray-600 font-semibold">{customer.nextVisitDate ? formatDate(customer.nextVisitDate) : '-'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 備考・メモ（編集対象） */}
                    <div>
                        <h3 className="text-base font-semibold text-gray-900 border-b border-gray-200 pb-1.5 mb-2">備考・メモ</h3>
                        <div className={`p-3 bg-gray-50 rounded-lg border ${isEditing ? 'border-cyan-300 bg-white' : 'border-gray-200'}`}>
                            {isEditing ? (
                                <textarea
                                    name="memo"
                                    value={formData.memo}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full text-sm bg-transparent outline-none resize-none"
                                    placeholder="備考を入力してください"
                                />
                            ) : (
                                <p className="text-sm text-gray-800 whitespace-pre-wrap min-h-[1.5em]">
                                    {customer.memo || <span className="text-gray-400 italic">なし</span>}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* 追加情報セクション（そのまま） */}
                    <div className="border-t border-gray-200 pt-3">
                        <h3 className="text-base font-semibold text-gray-900 mb-2">追加情報</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-600 mb-0.5">顧客登録日</p>
                                <p className="text-xs text-gray-500 italic">{customer.createdAt ? formatDate(customer.createdAt) : '-'}</p>
                            </div>
                            <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-600 mb-0.5">平均来店間隔</p>
                                <p className="text-xs text-gray-500 italic">{calculateAverageVisitInterval(customer)}日</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- フッター: ボタン --- */}
                <div className="flex-shrink-0 px-4 py-3 border-t bg-gray-50 flex justify-end gap-2 rounded-b-xl">
                    {isEditing ? (
                        <>
                             <button
                                onClick={handleCancel}
                                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                            >
                                保存する
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                編集
                            </button>
                            <button
                                onClick={onClose}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                閉じる
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};