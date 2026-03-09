import React from 'react';
import { format } from 'date-fns';
import { X, User, Building, FileText, Plus } from 'lucide-react';
import { Visit } from '../types';

interface DayDetailsModalProps {
  date: Date;
  visits: Visit[];
  onClose: () => void;
  onApply: () => void;
}

export default function DayDetailsModal({ date, visits, onClose, onApply }: DayDetailsModalProps) {
  const approvedVisits = visits.filter(
    v => v.date === format(date, 'yyyy-MM-dd') && v.status === 'approved'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-xl font-semibold text-slate-800">
              {format(date, 'yyyy년 MM월 dd일')}
            </h3>
            <p className="text-sm text-slate-500 mt-1">승인된 방문 일정</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
          {approvedVisits.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              이 날짜에 승인된 방문 일정이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {approvedVisits.map((visit) => (
                <div key={visit.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-indigo-500" />
                    <span className="font-medium text-slate-800">
                      {visit.name} {visit.position && <span className="text-slate-500 text-sm font-normal">({visit.position})</span>}
                    </span>
                    <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md ml-2">
                      {visit.time} {visit.end_time ? `~ ${visit.end_time}` : ''}
                    </span>
                    <span className="text-xs text-slate-400 ml-auto">
                      {/* Masking part of the contact for privacy in public view */}
                      {visit.contact.replace(/(\d{3})-\d{4}-(\d{4})/, '$1-****-$2')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2 text-sm text-slate-600">
                    <Building className="w-4 h-4 text-slate-400" />
                    <span>{visit.affiliation}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{visit.purpose}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-white shrink-0">
          <button
            onClick={onApply}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            새 방문 신청하기
          </button>
        </div>
      </div>
    </div>
  );
}
