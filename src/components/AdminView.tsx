import React, { useState } from 'react';
import { Check, X, Clock, Trash2, Download, LogOut, Settings, AlertTriangle } from 'lucide-react';
import { Visit } from '../types';
import AdminSettingsModal from './AdminSettingsModal';

interface AdminViewProps {
  visits: Visit[];
  onVisitUpdated: () => void;
  loading: boolean;
  onLogout?: () => void;
}

export default function AdminView({ visits, onVisitUpdated, loading, onLogout }: AdminViewProps) {
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<number | 'bulk' | null>(null);

  const handleStatusUpdate = async (id: number, status: 'approved' | 'rejected', reason?: string) => {
    try {
      setUpdatingId(id);
      const res = await fetch(`/api/visits/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, reject_reason: reason }),
      });

      if (res.ok) {
        onVisitUpdated();
        if (status === 'rejected') {
          setRejectingId(null);
          setRejectReason('');
        }
      } else {
        console.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const executeDelete = async (id: number) => {
    try {
      setUpdatingId(id);
      const res = await fetch(`/api/visits/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setSelectedIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
        onVisitUpdated();
      } else {
        console.error('Failed to delete visit');
      }
    } catch (error) {
      console.error('Error deleting visit:', error);
    } finally {
      setUpdatingId(null);
      setDeleteConfirmTarget(null);
    }
  };

  const executeBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    try {
      setUpdatingId(-1); // -1 indicates bulk operation
      const res = await fetch('/api/visits/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (res.ok) {
        setSelectedIds(new Set());
        onVisitUpdated();
      } else {
        console.error('Failed to delete visits');
      }
    } catch (error) {
      console.error('Error deleting visits:', error);
    } finally {
      setUpdatingId(null);
      setDeleteConfirmTarget(null);
    }
  };

  const confirmDelete = () => {
    if (deleteConfirmTarget === 'bulk') {
      executeBulkDelete();
    } else if (deleteConfirmTarget !== null) {
      executeDelete(deleteConfirmTarget);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(visits.map(v => v.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const StatusBadge = ({ status }: { status: Visit['status'] }) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            <Check className="w-3.5 h-3.5" />
            승인됨
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <X className="w-3.5 h-3.5" />
            거절됨
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <Clock className="w-3.5 h-3.5" />
            대기중
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const exportCSV = () => {
    const approvedVisits = visits.filter(v => v.status === 'approved');
    if (approvedVisits.length === 0) {
      alert('승인된 방문 내역이 없습니다.');
      return;
    }

    const headers = ['방문일', '방문시간', '종료시간', '이름', '직급', '소속', '연락처', '방문 목적', '신청일'];
    const csvData = approvedVisits.map(v => [
      v.date,
      v.time,
      v.end_time || '',
      v.name,
      v.position || '',
      v.affiliation,
      v.contact,
      `"${v.purpose.replace(/"/g, '""')}"`,
      new Date(v.created_at).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `방문승인내역_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800">방문 신청 관리</h2>
          <p className="text-sm text-slate-500 mt-1">모든 방문 신청 내역을 확인하고 승인/거절할 수 있습니다.</p>
        </div>
        <div className="flex gap-2 flex-wrap w-full sm:w-auto justify-start sm:justify-end">
          {selectedIds.size > 0 && (
            <button
              onClick={() => setDeleteConfirmTarget('bulk')}
              disabled={updatingId === -1}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">선택 삭제</span> ({selectedIds.size})
            </button>
          )}
          <button
            onClick={exportCSV}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors font-medium text-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">통계 다운로드</span><span className="sm:hidden">CSV</span>
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm"
            title="계정 설정"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">계정 설정</span>
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm"
              title="로그아웃"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">로그아웃</span>
            </button>
          )}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 w-12">
                <input
                  type="checkbox"
                  checked={visits.length > 0 && selectedIds.size === visits.length}
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">방문일시</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">신청자 정보</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">방문 목적</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">상태</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visits.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  신청된 방문 내역이 없습니다.
                </td>
              </tr>
            ) : (
              visits.map((visit) => (
                <tr key={visit.id} className={`hover:bg-slate-50/50 transition-colors ${selectedIds.has(visit.id) ? 'bg-indigo-50/30' : ''}`}>
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(visit.id)}
                      onChange={(e) => handleSelectOne(visit.id, e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">{visit.date}</div>
                    <div className="text-sm font-medium text-indigo-600 mt-0.5">
                      {visit.time} {visit.end_time ? `~ ${visit.end_time}` : ''}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      신청일: {new Date(visit.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-900">
                      {visit.name} {visit.position && <span className="text-slate-500 text-xs font-normal">({visit.position})</span>}
                    </div>
                    <div className="text-sm text-slate-500">{visit.affiliation}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{visit.contact}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-700 max-w-xs break-words">
                      {visit.purpose}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={visit.status} />
                    {visit.status === 'rejected' && visit.reject_reason && (
                      <div className="text-xs text-red-600 mt-1 max-w-[150px] truncate" title={visit.reject_reason}>
                        사유: {visit.reject_reason}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      {visit.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(visit.id, 'approved')}
                            disabled={updatingId === visit.id}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors disabled:opacity-50"
                            title="승인"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setRejectingId(visit.id)}
                            disabled={updatingId === visit.id}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                            title="거절"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setDeleteConfirmTarget(visit.id)}
                        disabled={updatingId === visit.id}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors ml-2 disabled:opacity-50"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-slate-100">
        {visits.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            신청된 방문 내역이 없습니다.
          </div>
        ) : (
          visits.map((visit) => (
            <div key={visit.id} className={`p-4 ${selectedIds.has(visit.id) ? 'bg-indigo-50/30' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(visit.id)}
                    onChange={(e) => handleSelectOne(visit.id, e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-5 h-5"
                  />
                  <div className="font-medium text-slate-900">
                    {visit.date} <span className="text-indigo-600 ml-1 text-sm">{visit.time} {visit.end_time ? `~ ${visit.end_time}` : ''}</span>
                  </div>
                </div>
                <div>
                  <StatusBadge status={visit.status} />
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-3 mb-3">
                <div className="flex justify-between items-start mb-1">
                  <div className="font-medium text-slate-900">
                    {visit.name} {visit.position && <span className="text-slate-500 text-xs font-normal">({visit.position})</span>}
                  </div>
                  <div className="text-xs text-slate-500">{visit.contact}</div>
                </div>
                <div className="text-sm text-slate-600 mb-2">{visit.affiliation}</div>
                <div className="text-sm text-slate-700 bg-white p-2 rounded border border-slate-200">
                  {visit.purpose}
                </div>
                {visit.status === 'rejected' && visit.reject_reason && (
                  <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100">
                    <span className="font-medium">거절 사유:</span> {visit.reject_reason}
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end">
                {visit.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(visit.id, 'approved')}
                      disabled={updatingId === visit.id}
                      className="flex-1 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors font-medium text-sm flex items-center justify-center gap-1"
                    >
                      <Check className="w-4 h-4" /> 승인
                    </button>
                    <button
                      onClick={() => setRejectingId(visit.id)}
                      disabled={updatingId === visit.id}
                      className="flex-1 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm flex items-center justify-center gap-1"
                    >
                      <X className="w-4 h-4" /> 거절
                    </button>
                  </>
                )}
                <button
                  onClick={() => setDeleteConfirmTarget(visit.id)}
                  disabled={updatingId === visit.id}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-slate-200"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">거절 사유 입력</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none mb-4"
              rows={3}
              placeholder="거절 사유를 입력해주세요 (선택사항)"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setRejectingId(null);
                  setRejectReason('');
                }}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                취소
              </button>
              <button
                onClick={() => handleStatusUpdate(rejectingId, 'rejected', rejectReason)}
                disabled={updatingId === rejectingId}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                거절 처리
              </button>
            </div>
          </div>
        </div>
      )}

      {isSettingsOpen && (
        <AdminSettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}

      {deleteConfirmTarget !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">방문 신청 삭제</h3>
            <p className="text-slate-500 mb-6 text-sm">
              {deleteConfirmTarget === 'bulk' 
                ? `선택한 ${selectedIds.size}개의 방문 신청을 정말로 삭제하시겠습니까?`
                : '정말로 이 방문 신청을 삭제하시겠습니까?'}
              <br />이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmTarget(null)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                취소
              </button>
              <button
                onClick={confirmDelete}
                disabled={updatingId !== null}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
