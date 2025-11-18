const BASE_URL = 'http://localhost:8080/api/v1';// 🚨 バックエンドのAPIドメイン

let accessToken = '';

// アクセストークンをセットする関数
export const setAccessToken = (token: string) => {
    accessToken = token;
};

// 汎用APIクライアント
export async function apiClient(endpoint: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };
  
    // 1. Bearerトークンをヘッダーにセット
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
  
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
        // 2. Cookieの送受信を必須にする（リフレッシュトークン用）
        credentials: 'include', 
      });
  
      // 3. 401 Unauthorized エラーの処理
      if (res.status === 401) {
        console.warn('Access Token expired. Attempting refresh...');
        
        // 4. トークンリフレッシュAPIを叩く
        const refreshRes = await fetch(`${BASE_URL}/refresh`, {
          method: 'POST',
          credentials: 'include', // HttpOnly Cookie (RT) を自動送信
        });
  
        if (refreshRes.ok) {
          // 新しいアクセストークンを取得し、メモリにセット
          const data = await refreshRes.json();
          setAccessToken(data.accessToken);
  
          // 5. 元のAPIを再試行
          headers['Authorization'] = `Bearer ${data.accessToken}`;
          const retryRes = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers,
            credentials: 'include',
          });
          
          // 再試行の結果を返す
          if (retryRes.ok) {
            return retryRes;
          }
        }
        
        // リフレッシュ失敗 or 再試行失敗の場合、ログイン画面へ強制リダイレクト
        window.location.href = '/'; 
        return res; // エラーレスポンスを返す（処理を中断）
  
      }
  
      return res;
    } catch (error) {
      console.error('API client error:', error);
      throw error;
    }
}