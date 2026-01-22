'use client'

import Sidebar from "@/component/Sidebar";
import { apiClient } from "@/utils/apiClient";
import { useEffect, useMemo, useState } from "react";

type Trainer = {
    id: string;
    adminName: string;
    adminPassword?: string; // 表示時は非表示
    role?: string;
    createdAt: string;
}

export default function UserSetting() {
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [trainers, setTrainers] = useState<Trainer[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [newTrainer, setNewTrainer] = useState({
        adminName: "",
        adminPassword: "",
        email: ""
    });
    const [editTrainer, setEditTrainer] = useState({
        adminName: "",
        adminPassword: "",
        email: ""
    });

    // トレーナー一覧取得
    const getTrainers = async () => {
        try {
            // エンドポイントは実際のバックエンドに合わせて調整してください
            const response = await apiClient("/adminUsers");
            if (response.ok) {
                const responseData = await response.json();
                console.log(responseData);

                // レスポンスの構造に応じて調整が必要かもしれません
                const trainersData: Trainer[] = responseData.trainers || responseData || [];
                setTrainers(trainersData);
            } else {
                console.error("トレーナーデータ取得失敗");
                alert("データの取得に失敗しました。");
            }
        } catch (e) {
            console.error("トレーナーデータ取得失敗" + e);
        }
    }

    useEffect(() => {
        getTrainers();
    }, []);

    // フィルタリング
    const filteredTrainers = useMemo(() => {
        let filtered = [...trainers];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(trainer => 
                trainer.adminName.toLowerCase().includes(query) ||
                (trainer.role && trainer.role.toLowerCase().includes(query))
            );
        }

        // 作成日順でソート
        filtered.sort((a, b) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        return filtered;
    }, [trainers, searchQuery]);

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    }

    // 新規トレーナー作成
    const createTrainer = async () => {
        if (!newTrainer.adminName || !newTrainer.adminPassword) {
            alert("ユーザー名とパスワードは必須です。");
            return;
        }

        try {
            const response = await apiClient("/createAdminUser", {
                method: "POST",
                body: JSON.stringify({
                    adminName: newTrainer.adminName,
                    adminPassword: newTrainer.adminPassword,
                    email: newTrainer.email || undefined
                }),
            });

            if (!response.ok) {
                console.error("トレーナーの作成に失敗しました");
                const errorData = await response.json().catch(() => ({}));
                alert(errorData.message || "トレーナーの作成に失敗しました。");
                return;
            }

            const data = await response.json();
            await getTrainers();

            setNewTrainer({
                adminName: "",
                adminPassword: "",
                email: ""
            });
            setIsCreateModalOpen(false);

            setSuccessMessage(data.success || "トレーナーを作成しました");
            setTimeout(() => {
                setSuccessMessage(null);
            }, 3000);
        } catch (e) {
            console.error("トレーナー作成エラー:", e);
            alert("トレーナーの作成に失敗しました。");
        }
    }

    // トレーナー編集
    const updateTrainer = async () => {
        if (!selectedTrainer || !editTrainer.adminName) {
            alert("ユーザー名は必須です。");
            return;
        }

        try {
            const updateData: any = {
                id: selectedTrainer.id,
                adminName: editTrainer.adminName,
            };

            // パスワードが入力されている場合のみ更新
            if (editTrainer.adminPassword) {
                updateData.adminPassword = editTrainer.adminPassword;
            }

            if (editTrainer.email !== undefined) {
                updateData.email = editTrainer.email;
            }

            const response = await apiClient("/updateAdminUser", {
                method: "POST",
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                console.error("トレーナーの更新に失敗しました");
                const errorData = await response.json().catch(() => ({}));
                alert(errorData.message || "トレーナーの更新に失敗しました。");
                return;
            }

            const data = await response.json();
            await getTrainers();

            setIsEditModalOpen(false);
            setSelectedTrainer(null);

            setSuccessMessage(data.success || "トレーナーを更新しました");
            setTimeout(() => {
                setSuccessMessage(null);
            }, 3000);
        } catch (e) {
            console.error("トレーナー更新エラー:", e);
            alert("トレーナーの更新に失敗しました。");
        }
    }

    // トレーナー削除
    const deleteTrainer = async (trainerId: string) => {
        if (!confirm("このトレーナーを削除してもよろしいですか？")) {
            return;
        }

        try {
            const response = await apiClient("/deleteAdminUser", {
                method: "DELETE",
                body: JSON.stringify({ id: trainerId }),
            });

            if (!response.ok) {
                console.error("トレーナーの削除に失敗しました");
                alert("トレーナーの削除に失敗しました。");
                return;
            }

            await getTrainers();

            setSuccessMessage("トレーナーを削除しました");
            setTimeout(() => {
                setSuccessMessage(null);
            }, 3000);
        } catch (e) {
            console.error("トレーナー削除エラー:", e);
            alert("トレーナーの削除に失敗しました。");
        }
    }

    // 編集モーダルを開く
    const handleEditClick = (trainer: Trainer) => {
        setSelectedTrainer(trainer);
        setEditTrainer({
            adminName: trainer.adminName,
            adminPassword: "",
            email: trainer.role || ""
        });
        setIsEditModalOpen(true);
    }

    return (
        <>
            <div
                className={`fixed left-0 top-0 z-50 flex w-full items-center justify-center bg-green-500 py-3 text-white shadow-md transition-transform duration-500 ease-in-out ${
                    successMessage ? 'translate-y-0' : '-translate-y-full'
                }`}
            >
                <span className="font-bold">✅ {successMessage}</span>
            </div>
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
                    className={`fixed inset-y-0 left-0 z-40 w-54 transform bg-white shadow-md transition-transform duration-200 ease-out md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:static md:z-auto`}
                >
                    <div className="relative h-full">
                        <Sidebar onClose={() => setSidebarOpen(false)} />
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
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                    {/* メインエリア */}
                    <div className="px-4 pt-8 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-7xl">
                            <div className="mb-6 space-y-4">
                                <h1 className="text-3xl font-bold text-gray-900 text-center md:text-left">トレーナー管理</h1>
                                <p className="mt-1 text-sm text-gray-600 text-center md:text-left">管理側のユーザー（トレーナー）を作成・管理できます</p>
                                <div className="flex">
                                    <button
                                        onClick={() => setIsCreateModalOpen(true)}
                                        className="px-4 py-2 bg-cyan-600 text-white font-semibold rounded-lg shadow hover:bg-cyan-700 transition"
                                    >
                                        ＋ 新規トレーナー登録
                                    </button>
                                </div>
                            </div>

                            <div className="relative mb-6">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="ユーザー名、メールアドレスで検索..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-12 pr-4 py-3 bg-white border border-cyan-200 text-sm rounded-xl w-full focus:ring-4 focus:ring-cyan-300/50 focus:border-cyan-400 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                                />
                            </div>

                            {/* 結果数表示 */}
                            <div className="text-sm text-gray-600 mb-3">
                                {filteredTrainers.length}件のトレーナーが見つかりました
                            </div>

                            {/* トレーナーカードグリッド */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
                                {filteredTrainers.map(trainer => (
                                    <div
                                        key={trainer.id}
                                        className="bg-white rounded-2xl shadow-lg border-2 border-cyan-200/50 hover:border-cyan-400 hover:shadow-xl transition-all duration-200 overflow-hidden group"
                                    >
                                        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-4 text-white">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-xl font-bold backdrop-blur-sm">
                                                        {trainer.adminName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg">{trainer.adminName}</h3>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* カードボディ */}
                                        <div className="p-4 space-y-3">
                                            {/* 基本情報 */}
                                            <div className="space-y-2 text-sm">
                                                {trainer.role && (
                                                    <div className="flex items-center gap-2 text-gray-700">
                                                        <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                        </svg>
                                                        <span className="truncate">{trainer.role}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 text-gray-700">
                                                    <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <span className="text-xs text-gray-600">登録日: {formatDate(trainer.createdAt)}</span>
                                                </div>
                                            </div>

                                            {/* アクションボタン */}
                                            <div className="flex gap-2 pt-2">
                                                <button
                                                    onClick={() => handleEditClick(trainer)}
                                                    className="flex-1 px-3 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold rounded-lg transition-colors"
                                                >
                                                    編集
                                                </button>
                                                <button
                                                    onClick={() => deleteTrainer(trainer.id)}
                                                    className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors"
                                                >
                                                    削除
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 新規トレーナー作成モーダル */}
                {isCreateModalOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
                        onClick={() => {
                            setIsCreateModalOpen(false);
                        }}
                    >
                        <div
                            className="bg-white rounded-xl shadow-xl w-full max-w-sm md:max-w-lg"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* ヘッダー */}
                            <div className="px-3 py-2 border-b bg-gradient-to-r from-cyan-500 to-blue-500 rounded-t-xl">
                                <h2 className="text-xl font-semibold text-white">新規トレーナー登録</h2>
                                <p className="text-sm text-white mt-1">トレーナー情報を入力してください</p>
                            </div>

                            {/* ボディ */}
                            <div className="p-6 space-y-6">
                                {/* ユーザー名 */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">ユーザー名（必須）</h4>
                                    <input
                                        type="text"
                                        placeholder="例: trainer01"
                                        value={newTrainer.adminName}
                                        onChange={(e) =>
                                            setNewTrainer({ ...newTrainer, adminName: e.target.value })
                                        }
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition duration-150"
                                    />
                                </div>

                                {/* パスワード */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">パスワード（必須）</h4>
                                    <input
                                        type="password"
                                        placeholder="パスワードを入力"
                                        value={newTrainer.adminPassword}
                                        onChange={(e) =>
                                            setNewTrainer({ ...newTrainer, adminPassword: e.target.value })
                                        }
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition duration-150"
                                    />
                                </div>

                                {/* メール */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">メール（任意）</h4>
                                    <input
                                        type="email"
                                        placeholder="例: trainer@example.com"
                                        value={newTrainer.email}
                                        onChange={(e) =>
                                            setNewTrainer({ ...newTrainer, email: e.target.value })
                                        }
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition duration-150"
                                    />
                                </div>
                            </div>

                            {/* フッター */}
                            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                                <button
                                    onClick={createTrainer}
                                    className="px-9 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                                >
                                    登録
                                </button>
                                <button
                                    className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700"
                                    onClick={() => setIsCreateModalOpen(false)}
                                >
                                    キャンセル
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* トレーナー編集モーダル */}
                {isEditModalOpen && selectedTrainer && (
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
                        onClick={() => {
                            setIsEditModalOpen(false);
                            setSelectedTrainer(null);
                        }}
                    >
                        <div
                            className="bg-white rounded-xl shadow-xl w-full max-w-sm md:max-w-lg"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* ヘッダー */}
                            <div className="px-3 py-2 border-b bg-gradient-to-r from-cyan-500 to-blue-500 rounded-t-xl">
                                <h2 className="text-xl font-semibold text-white">トレーナー情報編集</h2>
                                <p className="text-sm text-white mt-1">トレーナー情報を編集してください</p>
                            </div>

                            {/* ボディ */}
                            <div className="p-6 space-y-6">
                                {/* ユーザー名 */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">ユーザー名（必須）</h4>
                                    <input
                                        type="text"
                                        value={editTrainer.adminName}
                                        onChange={(e) =>
                                            setEditTrainer({ ...editTrainer, adminName: e.target.value })
                                        }
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition duration-150"
                                    />
                                </div>

                                {/* パスワード */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">パスワード（変更する場合のみ入力）</h4>
                                    <input
                                        type="password"
                                        placeholder="変更する場合のみ入力"
                                        value={editTrainer.adminPassword}
                                        onChange={(e) =>
                                            setEditTrainer({ ...editTrainer, adminPassword: e.target.value })
                                        }
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition duration-150"
                                    />
                                </div>

                            </div>

                            {/* フッター */}
                            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                                <button
                                    onClick={updateTrainer}
                                    className="px-9 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                                >
                                    更新
                                </button>
                                <button
                                    className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700"
                                    onClick={() => {
                                        setIsEditModalOpen(false);
                                        setSelectedTrainer(null);
                                    }}
                                >
                                    キャンセル
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
