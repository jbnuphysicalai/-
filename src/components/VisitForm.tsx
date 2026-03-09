import React, { useState } from 'react';
import { format } from 'date-fns';
import { X } from 'lucide-react';

interface VisitFormProps {
  date: Date;
  onClose: () => void;
  onSuccess: () => void;
}

export default function VisitForm({ date, onClose, onSuccess }: VisitFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    time: '10:00',
    end_time: '11:00',
    name: '',
    position: '',
    affiliation: '',
    purpose: '',
    contact: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.time >= formData.end_time) {
      setError('종료 시간은 방문 시간보다 늦어야 합니다.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/visits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: format(date, 'yyyy-MM-dd'),
          ...formData,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit application');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const timeOptions = Array.from({ length: 11 }, (_, i) => {
    const hour = i + 9; // 09:00 to 19:00
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h3 className="text-xl font-semibold text-slate-800">
            방문 신청
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                방문 일자
              </label>
              <input
                type="text"
                value={format(date, 'yyyy년 MM월 dd일')}
                disabled
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 cursor-not-allowed"
              />
            </div>
            <div className="flex-1 flex gap-2 sm:gap-4">
              <div className="flex-1">
                <label htmlFor="time" className="block text-sm font-medium text-slate-700 mb-1">
                  방문 시간 <span className="text-red-500">*</span>
                </label>
                <select
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-white"
                >
                  {timeOptions.slice(0, -1).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label htmlFor="end_time" className="block text-sm font-medium text-slate-700 mb-1">
                  종료 시간 <span className="text-red-500">*</span>
                </label>
                <select
                  id="end_time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-white"
                >
                  {timeOptions.slice(1).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                placeholder="홍길동"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="position" className="block text-sm font-medium text-slate-700 mb-1">
                직급
              </label>
              <input
                type="text"
                id="position"
                name="position"
                value={formData.position}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                placeholder="연구원, 팀장 등"
              />
            </div>
          </div>

          <div>
            <label htmlFor="affiliation" className="block text-sm font-medium text-slate-700 mb-1">
              소속 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="affiliation"
              name="affiliation"
              required
              value={formData.affiliation}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
              placeholder="소속 기관 또는 회사명"
            />
          </div>

          <div>
            <label htmlFor="contact" className="block text-sm font-medium text-slate-700 mb-1">
              연락처 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="contact"
              name="contact"
              required
              value={formData.contact}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
              placeholder="010-0000-0000"
            />
          </div>

          <div>
            <label htmlFor="purpose" className="block text-sm font-medium text-slate-700 mb-1">
              방문 목적 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="purpose"
              name="purpose"
              required
              rows={3}
              value={formData.purpose}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow resize-none"
              placeholder="방문 목적을 상세히 적어주세요."
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '신청 중...' : '신청하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
