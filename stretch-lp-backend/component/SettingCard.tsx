import React, { ReactNode } from 'react';

// Propsの型定義
interface SettingCardProps {
  /** カードのタイトル */
  title: string;
  /** カードの説明文 */
  description: string;
  /** 子要素（設定項目、ボタンなど） */
  children: ReactNode;
}

// React.FC（Functional Component）を使用して型付け
const SettingCard: React.FC<SettingCardProps> = ({ title, description, children }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 transition-shadow duration-300 hover:shadow-xl">
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        {description}
      </p>
      {/* ここに設定項目（ボタン、トグル、フォームなど）が入る */}
      <div className="mt-4">
        {children}
      </div>
    </div>
  );
};

export default SettingCard;