import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ClipboardList } from 'lucide-react';
import Calendar from './components/Calendar';
import AdminView from './components/AdminView';
import AdminLogin from './components/AdminLogin';
import { Visit } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'calendar' | 'admin'>('calendar');
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  const fetchVisits = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await fetch(`/api/visits?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setVisits(data);
      }
    } catch (error) {
      console.error('Failed to fetch visits:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits(true);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center h-auto sm:h-16 py-3 sm:py-0 gap-3 sm:gap-0">
            <div className="flex items-center w-full sm:w-auto justify-center sm:justify-start">
              <div className="flex-shrink-0 flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AI</span>
                </div>
                <span className="font-semibold text-lg tracking-tight text-slate-900">
                  피지컬AI 실증랩 방문관리
                </span>
              </div>
            </div>
            <div className="flex space-x-2 w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('calendar')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2.5 sm:py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'calendar'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 bg-slate-50 sm:bg-transparent'
                }`}
              >
                <CalendarIcon className="w-4 h-4" />
                방문신청
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2.5 sm:py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'admin'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 bg-slate-50 sm:bg-transparent'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                관리자 (승인)
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'calendar' ? (
          <Calendar visits={visits} onVisitAdded={() => fetchVisits(false)} />
        ) : isAdminLoggedIn ? (
          <AdminView visits={visits} onVisitUpdated={() => fetchVisits(false)} loading={loading} onLogout={() => setIsAdminLoggedIn(false)} />
        ) : (
          <AdminLogin onLogin={() => setIsAdminLoggedIn(true)} />
        )}
      </main>
    </div>
  );
}
