'use client';

import { useRouter } from 'next/navigation';
import { apiClient } from '../utils/apiClient';
import Link from 'next/link';

const menuItems = [
    { label: '予約一覧', href: '/bookings' },
    { label: '顧客管理', href: '/customers' },
    { label: '設定', href: '/settings' },
    { label: 'ログアウト', href: '/logout' },
];

type SidebarProps = {
    onClose?: () => void; // なくてもOKな引数
};

export default function Sidebar({ onClose }: SidebarProps) {
    const router = useRouter();

    // ログアウト処理
    const handleLogout = async (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();

        try {
            const response = await apiClient('/logout', {
                method: 'POST',
            });

            if (response.ok) {
                router.push('/');
            }
        } catch (e) {
            console.error('ログアウトエラー:', e);
        }
    };
    return (
        <aside className="h-full w-full bg-slate-600 text-white px-5 py-8 flex flex-col">

            <button 
                className="ml-auto md:hidden"
                onClick={() => onClose?.()}
            >
                {/* Xボタン (Heroiconsより) */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <div className="mb-8">
                <span className="text-xs uppercase tracking-widest text-slate-400">Stretch Trainer</span>
                <h2 className="mt-2 text-xl font-bold">管理メニュー</h2>
            </div>


            <nav className="flex-1 space-y-1">
                {menuItems.map(item => (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={(e) => {
                            if (item.href == '/logout') {
                                handleLogout(e);
                            } else {
                                if(onClose) onClose();
                            }
                        }}
                        className="block rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-200"
                    >
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div className="mt-8 space-y-2 text-xs text-slate-400">
                <p className="font-semibold uppercase tracking-wide text-slate-500">サポート</p>
                <p>support@example.com</p>
                <p>受付時間: 10:00 - 18:00</p>
            </div>
        </aside>
    );
}