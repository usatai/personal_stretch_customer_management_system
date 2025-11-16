'use client'

import Sidebar from "@/component/Sidebar";
import { useMemo, useState } from "react";

type Customer = {
    id: string;
    name: string;
    nameKana: string;
    email: string;
    phone: string;
    lastVisitDate: string; // YYYY-MM-DD
    visitCount: number;
    totalSpent: number;
    status: 'active' | 'inactive' | 'vip';
    notes?: string;
}

export default function Customers () {
    const [sidebarOpen,setSidebarOpen] = useState<boolean>(false);
    const [searchQuery,setSearchQuery] = useState<string>("");
    const [filterPeriod,setFilterPeriod] = useState<string>("all");
    const [filterVisitCount, setFilterVisitCount] = useState<string>('all'); 
    const [sortBy, setSortBy] = useState<string>('lastVisit'); 
    const [customerId,setCustomerId] = useState<string | null>("");

    const demoCustomers: Customer[] = useMemo(() => [
        {
            id: '1',
            name: '山田 太郎',
            nameKana: 'ヤマダ タロウ',
            email: 'yamada@example.com',
            phone: '090-1234-5678',
            lastVisitDate: '2024-01-15',
            visitCount: 12,
            totalSpent: 120000,
            status: 'vip',
            notes: '腰痛改善希望'
        },
        {
            id: '2',
            name: '佐藤 花子',
            nameKana: 'サトウ ハナコ',
            email: 'sato@example.com',
            phone: '080-2345-6789',
            lastVisitDate: '2024-01-10',
            visitCount: 8,
            totalSpent: 80000,
            status: 'active',
            notes: '柔軟性向上が目標'
        },
        {
            id: '3',
            name: '鈴木 次郎',
            nameKana: 'スズキ ジロウ',
            email: 'suzuki@example.com',
            phone: '070-3456-7890',
            lastVisitDate: '2023-12-20',
            visitCount: 3,
            totalSpent: 30000,
            status: 'active'
        },
        {
            id: '4',
            name: '田中 美咲',
            nameKana: 'タナカ ミサキ',
            email: 'tanaka@example.com',
            phone: '090-4567-8901',
            lastVisitDate: '2024-01-12',
            visitCount: 15,
            totalSpent: 150000,
            status: 'vip',
            notes: 'パーソナルトレーニング継続中'
        },
        {
            id: '5',
            name: '伊藤 健太',
            nameKana: 'イトウ ケンタ',
            email: 'ito@example.com',
            phone: '080-5678-9012',
            lastVisitDate: '2023-11-15',
            visitCount: 2,
            totalSpent: 20000,
            status: 'inactive'
        },
        {
            id: '6',
            name: '渡辺 さくら',
            nameKana: 'ワタナベ サクラ',
            email: 'watanabe@example.com',
            phone: '070-6789-0123',
            lastVisitDate: '2024-01-14',
            visitCount: 6,
            totalSpent: 60000,
            status: 'active',
            notes: 'ストレッチ習慣化中'
        },
        {
            id: '7',
            name: '中村 大輔',
            nameKana: 'ナカムラ ダイスケ',
            email: 'nakamura@example.com',
            phone: '090-7890-1234',
            lastVisitDate: '2024-01-08',
            visitCount: 20,
            totalSpent: 200000,
            status: 'vip',
            notes: 'リピーター、紹介顧客多数'
        },
        {
            id: '8',
            name: '小林 あゆみ',
            nameKana: 'コバヤシ アユミ',
            email: 'kobayashi@example.com',
            phone: '080-8901-2345',
            lastVisitDate: '2023-10-30',
            visitCount: 1,
            totalSpent: 10000,
            status: 'inactive'
        }
    ], []);

    const filteredAndSortedCustomers = useMemo(() => {
        let filtered = [...demoCustomers];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(customer => 
                customer.name.toLowerCase().includes(query) ||
                customer.nameKana.toLowerCase().includes(query) ||
                customer.email.toLowerCase().includes(query) ||
                customer.phone.includes(query)
            );
        }
        // 期間フィルター
        if (filterPeriod !== 'all') {
            const now = new Date();
            const cutoffDate = new Date();
            switch (filterPeriod) {
                case 'week':
                    cutoffDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    cutoffDate.setMonth(now.getMonth() - 1);
                    break;
                case '3months':
                    cutoffDate.setMonth(now.getMonth() - 3);
                    break;
                case 'year':
                    cutoffDate.setFullYear(now.getFullYear() - 1);
                    break;
            }
            filtered = filtered.filter(customer => {
                const lastVisit = new Date(customer.lastVisitDate);
                return lastVisit >= cutoffDate;
            });
        }

        // 来店回数フィルター
        if (filterVisitCount !== 'all') {
            switch (filterVisitCount) {
                case '1-3':
                    filtered = filtered.filter(c => c.visitCount >= 1 && c.visitCount <= 3);
                    break;
                case '4-10':
                    filtered = filtered.filter(c => c.visitCount >= 4 && c.visitCount <= 10);
                    break;
                case '11+':
                    filtered = filtered.filter(c => c.visitCount >= 11);
                    break;
            }
        }

        // ソート
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'lastVisit':
                    return new Date(b.lastVisitDate).getTime() - new Date(a.lastVisitDate).getTime();
                case 'visitCount':
                    return b.visitCount - a.visitCount;
                case 'name':
                    return a.name.localeCompare(b.name, 'ja');
                default:
                    return 0;
            }
        });
        return filtered;
    },[demoCustomers, searchQuery, filterPeriod, filterVisitCount, sortBy])

    const formatDate = (dateString : string) => {
        const date = new Date(dateString);
        return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;

    }

    const selectedCustomer = customerId 
        ? demoCustomers.filter(customer => customer.id === customerId)
        : null;

    const updateNotes = (notes : string) => {

    }

    return (
        <>
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
                    {/* メインエリア */}
                    <div className="px-4 pt-8 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-7xl">
                            <div className="mb-6 space-y-4">
                                <h1 className="text-3xl font-bold text-gray-900 text-center md:text-left">顧客管理</h1>
                                <p className="mt-1 text-sm text-gray-600 text-center md:text-left">過去来店されたお客様情報が確認できます</p>
                            </div>

                            <div className="relative mb-6">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="名前、ふりがな、メール、電話番号で検索..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-12 pr-4 py-3 bg-white border border-cyan-200 text-sm rounded-xl w-full focus:ring-4 focus:ring-cyan-300/50 focus:border-cyan-400 outline-none transition-all text-gray-900 placeholder:text-gray-400" 
                                >
                                </input>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">最終来店:</label>
                                    <select
                                        value={filterPeriod}
                                        onChange={(e) => setFilterPeriod(e.target.value)}
                                        className="border-cyan-200 border-2 px-3 py-2 rounded-lg focus:ring-2 focus:ring-cyan-300/50 focus:border-cyan-400 outline-none text-sm text-gray-900"
                                    >
                                        <option value="all">すべて</option>
                                        <option value="week">過去1週間</option>
                                        <option value="month">過去1ヶ月</option>
                                        <option value="3months">過去3ヶ月</option>
                                        <option value="year">過去1年</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">来店数:</label>
                                    <select
                                        value={filterVisitCount}
                                        onChange={(e) => setFilterVisitCount(e.target.value)}
                                        className="border-cyan-200 border-2 px-3 py-2 rounded-lg focus:ring-2 focus:ring-cyan-300/50 focus:border-cyan-400 outline-none text-sm text-gray-900"
                                    >
                                        <option value="all">すべて</option>
                                        <option value="1-3">1〜3回</option>
                                        <option value="4-10">4〜10回</option>
                                        <option value="11+">11回以上</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">並び替え:</label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="border-cyan-200 border-2 px-3 py-2 rounded-lg focus:ring-2 focus:ring-cyan-300/50 focus:border-cyan-400 outline-none text-sm text-gray-900"
                                    >
                                        <option value="lastVisit">最終来店日</option>
                                        <option value="visitCount">来店回数</option>
                                        <option value="name">名前順</option>
                                    </select>
                                </div>
                            </div>
                            {/* 結果数表示 */}
                            <div className="text-sm text-gray-600 mt-3">
                                {filteredAndSortedCustomers.length}件の顧客が見つかりました
                            </div>
                        </div>

                        {/* 顧客カードグリッド */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
                            {filteredAndSortedCustomers.map(customer => (
                                <div
                                    key={customer.id}
                                    className="bg-white rounded-2xl shadow-lg border-2 border-cyan-200/50 hover:border-cyan-400 hover:shadow-xl transition-all duration-200 overflow-hidden group"
                                >
                                        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-4 text-white">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-xl font-bold backdrop-blur-sm">
                                                        {customer.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg">{customer.name}</h3>
                                                        <p className="text-xs text-white/80">{customer.nameKana}</p>
                                                    </div>
                                                </div>
                                                {/* {getStatusBadge(customer.status)} */}
                                            </div>
                                        </div>

                                        {/* カードボディ */}
                                        <div className="p-4 space-y-3">
                                            {/* 来店情報 */}
                                            <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-lg">
                                                <div>
                                                    <p className="text-xs text-gray-600">最終来店日</p>
                                                    <p className="font-semibold text-gray-900">{formatDate(customer.lastVisitDate)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-600">来店回数</p>
                                                    <p className="font-bold text-cyan-600 text-lg">{customer.visitCount}回</p>
                                                </div>
                                            </div>

                                            {/* 連絡先情報 */}
                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center gap-2 text-gray-700">
                                                    <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                    <span className="truncate">{customer.email}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-700">
                                                    <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                    <span>{customer.phone}</span>
                                                </div>
                                            </div>

                                            {/* 備考 */}
                                            {customer.notes && (
                                                <div className="p-2 bg-gray-50 rounded-lg">
                                                    <p className="text-xs text-gray-600 mb-1">備考</p>
                                                    <p className="text-sm text-gray-800">{customer.notes}</p>
                                                </div>
                                            )}

                                            {/* アクションボタン */}
                                            <div className="flex gap-2 pt-2">
                                                <button 
                                                    onClick={() => setCustomerId(customer.id)}
                                                    className="flex-1 px-3 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold rounded-lg transition-colors"
                                                >
                                                    詳細
                                                </button>
                                                <button className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors">
                                                    予約
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                        </div>
                    </div>
                </div>
                
                {selectedCustomer && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
                        onClick={() => setCustomerId(null)}
                    >
                            {/* 顧客カード詳細 */}
                            {selectedCustomer.map(customer => (
                                <div
                                    key={customer.id}
                                    onClick={(e) => e.stopPropagation()} 
                                    className="bg-white rounded-2xl shadow-lg border-2 border-cyan-200/50 hover:border-cyan-400 hover:shadow-xl transition-all duration-200 overflow-hidden group"
                                >
                                        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-4 pr-50 text-white">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-xl font-bold backdrop-blur-sm">
                                                        {customer.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg">{customer.name}</h3>
                                                        <p className="text-xs text-white/80">{customer.nameKana}</p>
                                                    </div>
                                                </div>
                                                {/* {getStatusBadge(customer.status)} */}
                                            </div>
                                        </div>

                                        {/* カードボディ */}
                                        <div className="p-4 space-y-3">
                                            {/* 来店情報 */}
                                            <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-lg">
                                                <div>
                                                    <p className="text-xs text-gray-600">最終来店日</p>
                                                    <p className="font-semibold text-gray-900">{formatDate(customer.lastVisitDate)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-600">来店回数</p>
                                                    <p className="font-bold text-cyan-600 text-lg">{customer.visitCount}回</p>
                                                </div>
                                            </div>

                                            {/* 連絡先情報 */}
                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center gap-2 text-gray-700">
                                                    <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                    <span className="truncate">{customer.email}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-700">
                                                    <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                    <span>{customer.phone}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-700">
                                                    <span>前回担当トレーナー：</span>
                                                    <span>田島</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-700">
                                                    <span>次回予約：</span>
                                                    <span>なし</span>
                                                </div>
                                            </div>

                                            {/* 備考 */}
                                            <div className="p-2 bg-gray-50 rounded-lg">
                                                <p className="text-xs text-gray-600 mb-1">備考</p>
                                                <input
                                                    type="text"
                                                    value={customer.notes}
                                                    onChange={(e) => updateNotes(e.target.value)}
                                                    className="pl-3 pr-4 py-3 bg-white border border-cyan-200 text-sm rounded-xl w-full focus:ring-4 focus:ring-cyan-300/50 focus:border-cyan-400 outline-none transition-all text-gray-900 placeholder:text-gray-400" 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                )}

            </>
    )
    
}