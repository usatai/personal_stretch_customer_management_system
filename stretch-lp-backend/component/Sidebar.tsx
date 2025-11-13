const menuItems = [
    { label: '予約一覧', href: '/bookings' },
    { label: '顧客管理', href: '/customers' },
    // { label: 'スケジュール', href: '/schedule' },
    { label: '設定', href: '/settings' },
];

export default function Sidebar() {
    return (
        <aside className="h-full w-full bg-slate-600 text-white px-5 py-8 flex flex-col">
            <div className="mb-8">
                <span className="text-xs uppercase tracking-widest text-slate-400">Stretch Trainer</span>
                <h2 className="mt-2 text-xl font-bold">管理メニュー</h2>
            </div>

            <nav className="flex-1 space-y-1">
                {menuItems.map(item => (
                    <a
                        key={item.href}
                        href={item.href}
                        className="block rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-200"
                    >
                        {item.label}
                    </a>
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