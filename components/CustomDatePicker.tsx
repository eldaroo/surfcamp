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
    <div className="relative z-10">
      <DatePicker
        selected={selected}
        onChange={onChange}
        placeholderText={placeholderText}
        minDate={minDate}
        maxDate={maxDate}
        disabled={disabled}
        dateFormat="dd/MM/yyyy"
        readOnly
        autoComplete="off"
        className={`w-full px-4 py-3 border border-white/40 rounded-xl
                   bg-white/50 backdrop-blur-sm
                   focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50
                   transition-all duration-300 hover:bg-white/70 hover:border-amber-400/30
                   text-black placeholder:text-black/50 font-medium ${className}`}
        calendarClassName="custom-datepicker"
        dayClassName={(date) => 'hover:bg-amber-100 cursor-pointer rounded'}
        weekDayClassName={() => 'text-amber-600 font-semibold'}
        monthClassName={() => 'hover:bg-amber-100 cursor-pointer rounded'}
        timeClassName={() => 'hover:bg-amber-100 cursor-pointer'}
        popperClassName="z-50"
        popperPlacement="bottom-start"
      />

      <style jsx global>{`
        .react-datepicker-popper {
          z-index: 9999 !important;
        }

        .custom-datepicker {
          border: 2px solid rgba(251, 191, 36, 0.3);
          border-radius: 1rem;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          font-family: inherit;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          z-index: 9999;
        }

        .custom-datepicker .react-datepicker__header {
          background: linear-gradient(to right, rgba(252, 211, 77, 0.1), rgba(251, 191, 36, 0.1));
          border-bottom: 1px solid rgba(251, 191, 36, 0.2);
          border-radius: 1rem 1rem 0 0;
          padding-top: 1rem;
        }

        .custom-datepicker .react-datepicker__day--selected {
          background-color: rgb(251, 191, 36) !important;
          color: black !important;
          font-weight: 700;
        }

        .custom-datepicker .react-datepicker__day--keyboard-selected {
          background-color: rgb(252, 211, 77) !important;
          color: black !important;
          font-weight: 700;
        }

        .custom-datepicker .react-datepicker__day:hover {
          background-color: rgb(254, 243, 199) !important;
          border-radius: 0.5rem;
        }

        .custom-datepicker .react-datepicker__day--today {
          font-weight: bold;
          color: rgb(217, 119, 6);
          background-color: rgba(251, 191, 36, 0.1);
          border-radius: 0.5rem;
        }

        .custom-datepicker .react-datepicker__current-month {
          color: rgb(217, 119, 6);
          font-weight: 700;
        }

        .custom-datepicker .react-datepicker__navigation-icon::before {
          border-color: rgb(217, 119, 6);
        }
      `}</style>
    </div>
  );
}