'use client';

import SettingCard from "@/component/SettingCard";
import Sidebar from "@/component/Sidebar";
import { useState } from "react";


export default function Settings() {
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
    
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
                    <Sidebar />
                </div>
            </div>

            {/* メインコンテンツ */}
            <div className="flex-1 w-full md:pl-0 pt-5 bg-gradient-to-br from-cyan-50/95 via-sky-50/95 to-blue-50/95">
                {/* トップバー（モバイル） */}
                <div className="sticky top-0 z-20 flex items-center gap-3 bg-gray-50/80 px-4 py-3 backdrop-blur md:hidden">
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
                    <div className="text-base font-semibold text-gray-800">設定</div>
                </div>

                {/* ページヘッダー */}
                <div className="px-2 pt-8 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-7xl">
                        <h1 className="text-2xl font-bold text-gray-900">管理アカウント設定</h1>
                        <p className="mt-1 text-sm text-gray-600">顧客管理システムのユーザー管理ができます</p>
                    </div>
                </div>

                {/* グリッド */}
                <div className="px-4 pb-12 pt-4 sm:px-6 lg:px-8 pt-8">
                    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <SettingCard 
                            title="ユーザー管理" 
                            description="ログインできるユーザーの情報を管理"
                        >
                        <button className="w-full rounded-lg bg-blue-600 py-2 text-white transition duration-150 hover:bg-blue-700">
                            ユーザー管理へ
                        </button>
                        </SettingCard>

                        <SettingCard 
                        title="通知設定" 
                        description="メールやプッシュ通知の受信設定を管理します。"
                        >
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">メール通知</span>
                            <span className="font-bold text-green-500">ON</span>
                        </div>
                        </SettingCard>

                        <SettingCard 
                            title="プライバシー" 
                            description="データの公開設定やセキュリティオプションを設定します。"
                        >
                        <a href="#" className="text-sm text-blue-600 hover:text-blue-800">
                            詳細なプライバシー設定へ
                        </a>
                        </SettingCard>

                        <SettingCard 
                            title="支払い情報" 
                            description="登録済みのクレジットカード情報を管理します。"
                        >
                        <button className="w-full rounded-lg bg-indigo-500 py-2 text-white transition duration-150 hover:bg-indigo-600">
                            支払い方法を追加
                        </button>
                        </SettingCard>
                    </div>
                </div>
            </div>
        </div>
    </>
  );
}
