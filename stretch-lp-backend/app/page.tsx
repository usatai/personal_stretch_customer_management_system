'use client';

import { useRouter } from "next/navigation";
import { useState } from "react";


export default function TrainerLogin() {
    const [form,setForm] = useState({ userId:'', password:'' });
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({...form,[e.target.name]: e.target.value});
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // TODO: ログイン処理を実装
        const response = await fetch("http://localhost:8080/api/v1/login",{
            method: 'POST',
            credentials : 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                adminName: form.userId,
                adminPassword: form.password
            })
        });
        if (response.ok) {
            alert("成功です");
            router.push('/bookings');
        } else {
            alert("エラーです");
        }
    };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-100 via-sky-100 to-blue-100">
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-10 w-full max-w-md border border-cyan-200/50">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl mb-6 shadow-lg">
            <svg 
              className="w-10 h-10 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-3">
            顧客管理画面
          </h1>
          <p className="text-cyan-700/80 text-sm font-medium">トレーナー専用ログイン</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label 
              htmlFor="userId" 
              className="block text-sm font-semibold text-cyan-800 mb-2"
            >
              ユーザーID
            </label>
            <input
              id="userId"
              type="text"
              name="userId"
              onChange={handleChange}
              value={form.userId}
              className="w-full px-5 py-4 border-2 border-cyan-200 rounded-xl focus:ring-4 focus:ring-cyan-300/50 focus:border-cyan-400 outline-none transition-all bg-cyan-50/50 text-cyan-900 placeholder:text-cyan-400"
              placeholder="ユーザーIDを入力"
            />
          </div>

          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-semibold text-cyan-800 mb-2"
            >
              パスワード
            </label>
            <input
              id="password"
              type="password"
              name="password"
              onChange={handleChange}
              value={form.password}
              className="w-full px-5 py-4 border-2 border-cyan-200 rounded-xl focus:ring-4 focus:ring-cyan-300/50 focus:border-cyan-400 outline-none transition-all bg-cyan-50/50 text-cyan-900 placeholder:text-cyan-400"
              placeholder="パスワードを入力"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            ログイン
          </button>
        </form>
      </div>
    </div>
  );
}
