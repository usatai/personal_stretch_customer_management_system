"use client";

import { useEffect, useState } from "react";
import { setAccessToken } from "@/utils/apiClient";
import { useRouter, usePathname } from "next/navigation";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // 認証が不要なパス（ログイン画面など）
  const publicPaths = ["/", "/lp"]; 

  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. リフレッシュAPIを叩く (Cookieは自動送信)
        // NOTE: ここは apiClient ではなく生の fetch でも良いが、
        // apiClientのエラーハンドリングに任せても良い
        const res = await fetch("http://localhost:8080/api/v1/refresh", {
          method: "POST",
          credentials: "include", // 必須
        });

        if (res.ok) {
          const data = await res.json();
          // 2. 新しいATをメモリにセット
          setAccessToken(data.accessToken); 
        } else {
          // リフレッシュ失敗 ＝ ログイン切れ
          throw new Error("Refresh failed");
        }
      } catch (error) {
        // 認証失敗時、公開ページ以外ならログインへ飛ばす
        if (!publicPaths.includes(pathname)) {
            router.push("/");
        }
      } finally {
        // 3. ロード完了（画面を表示）
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // ロード中は真っ白にするか、スピナーを出す
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}