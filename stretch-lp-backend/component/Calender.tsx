'use client';

import { useState } from 'react';
import DatePicker from 'react-datepicker';
import { ja } from "date-fns/locale";
import 'react-datepicker/dist/react-datepicker.css';

export default function Calendar({ onSelectDate }: { onSelectDate?: (date: Date) => void }) {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
    return (
      <div className="flex flex-col items-center gap-3 mt-0">
        <DatePicker
          selected={selectedDate}
          onChange={(date) => {
            setSelectedDate(date);
            if (date) onSelectDate?.(date); // 選択時に親へ通知
          }}
          dateFormat="yyyy/MM/dd"
          locale={ja}
          inline
        />
      </div>
    );
  }
