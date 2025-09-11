'use client';

import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useI18n } from '@/lib/i18n';

interface CustomDatePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  placeholderText?: string;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  disabled?: boolean;
}

export default function CustomDatePicker({
  selected,
  onChange,
  placeholderText,
  minDate,
  maxDate,
  className = '',
  disabled = false,
}: CustomDatePickerProps) {
  const { locale } = useI18n();

  return (
    <div className="relative">
      <DatePicker
        selected={selected}
        onChange={onChange}
        placeholderText={placeholderText}
        minDate={minDate}
        maxDate={maxDate}
        disabled={disabled}
        dateFormat="dd/MM/yyyy"
        className={`w-full px-4 py-3 border border-warm-300 rounded-lg 
                   focus:outline-none focus:ring-2 focus:ring-warm-500 focus:border-warm-500
                   transition-all duration-300 hover:border-warm-400 bg-white text-gray-900 ${className}`}
        calendarClassName="custom-datepicker"
        dayClassName={(date) => 'hover:bg-warm-100 cursor-pointer rounded'}
        weekDayClassName={() => 'text-warm-600 font-medium'}
        monthClassName={() => 'hover:bg-warm-100 cursor-pointer rounded'}
        timeClassName={() => 'hover:bg-warm-100 cursor-pointer'}
      />
      
      <style jsx global>{`
        .custom-datepicker {
          border: 1px solid #d1d5db;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          font-family: 'Roboto', sans-serif;
        }
        
        .custom-datepicker .react-datepicker__header {
          background-color: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .custom-datepicker .react-datepicker__day--selected {
          background-color: #997146 !important;
          color: white !important;
        }
        
        .custom-datepicker .react-datepicker__day--keyboard-selected {
          background-color: #8C8179 !important;
          color: white !important;
        }
        
        .custom-datepicker .react-datepicker__day:hover {
          background-color: #CCC8BE !important;
        }
        
        .custom-datepicker .react-datepicker__day--today {
          font-weight: bold;
          color: #997146;
        }
      `}</style>
    </div>
  );
}