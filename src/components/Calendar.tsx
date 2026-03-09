import { useState } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Visit } from '../types';
import VisitForm from './VisitForm';
import DayDetailsModal from './DayDetailsModal';

interface CalendarProps {
  visits: Visit[];
  onVisitAdded: () => void;
}

export default function Calendar({ visits, onVisitAdded }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const onDateClick = (day: Date) => {
    setSelectedDate(day);
    setIsDayModalOpen(true);
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
          {format(currentDate, 'yyyy년 MM월')}
        </h2>
        <div className="flex space-x-1 sm:space-x-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-full hover:bg-slate-200 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-full hover:bg-slate-200 transition-colors"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return (
      <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-t-lg overflow-hidden">
        {days.map((day, i) => (
          <div
            key={i}
            className="bg-slate-50 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-slate-600"
          >
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = '';

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'd');
        const cloneDay = day;
        
        // Get visits for this day
        const dayVisits = visits.filter(v => v.date === format(cloneDay, 'yyyy-MM-dd'));
        const approvedCount = dayVisits.filter(v => v.status === 'approved').length;
        const pendingCount = dayVisits.filter(v => v.status === 'pending').length;

        days.push(
          <div
            key={day.toString()}
            onClick={() => onDateClick(cloneDay)}
            className={`min-h-[80px] sm:min-h-[120px] bg-white p-1 sm:p-2 border-r border-b border-slate-200 cursor-pointer transition-colors hover:bg-indigo-50/50 group ${
              !isSameMonth(day, monthStart) ? 'text-slate-400 bg-slate-50/50' : 'text-slate-800'
            } ${isSameDay(day, new Date()) ? 'bg-indigo-50/30' : ''}`}
          >
            <div className="flex justify-between items-start">
              <span
                className={`flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-xs sm:text-sm ${
                  isSameDay(day, new Date())
                    ? 'bg-indigo-600 text-white font-semibold'
                    : ''
                }`}
              >
                {formattedDate}
              </span>
              <button className="hidden sm:block p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors opacity-0 group-hover:opacity-100">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <div className="mt-1 sm:mt-2 space-y-1">
              {approvedCount > 0 && (
                <div className="px-1 sm:px-2 py-0.5 sm:py-1 bg-emerald-100 text-emerald-800 text-[10px] sm:text-xs rounded sm:rounded-md font-medium truncate text-center sm:text-left">
                  <span className="hidden sm:inline">승인 </span>{approvedCount}<span className="sm:hidden">건</span>
                </div>
              )}
              {pendingCount > 0 && (
                <div className="px-1 sm:px-2 py-0.5 sm:py-1 bg-amber-100 text-amber-800 text-[10px] sm:text-xs rounded sm:rounded-md font-medium truncate text-center sm:text-left">
                  <span className="hidden sm:inline">대기 </span>{pendingCount}<span className="sm:hidden">건</span>
                </div>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-px" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="bg-slate-200 border-x border-b border-slate-200 rounded-b-lg overflow-hidden">{rows}</div>;
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
      {renderHeader()}
      {renderDays()}
      {renderCells()}

      {isDayModalOpen && selectedDate && (
        <DayDetailsModal
          date={selectedDate}
          visits={visits}
          onClose={() => setIsDayModalOpen(false)}
          onApply={() => {
            setIsDayModalOpen(false);
            setIsFormOpen(true);
          }}
        />
      )}

      {isFormOpen && selectedDate && (
        <VisitForm
          date={selectedDate}
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => {
            setIsFormOpen(false);
            onVisitAdded();
          }}
        />
      )}
    </div>
  );
}
