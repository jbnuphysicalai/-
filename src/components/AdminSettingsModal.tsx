import React, { useState } from 'react';
import { X } from 'lucide-react';

interface AdminSettingsModalProps {
  onClose: () => void;
}

export default function AdminSettingsModal({ onClose }: AdminSettingsModalProps) {
  const [currentUsername, setCurrentUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentUsername,
          currentPassword,
          newUsername,
          newPassword,
        }),
      });

      if (res.ok) {
        setSuccess('관리자 계정 정보가 성공적으로 변경되었습니다.');
        setCurrentUsername('');
        setCurrentPassword('');
        setNewUsername('');
        setNewPassword('');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        const text = await res.text();
        let errorMessage = '계정 정보 변경에 실패했습니다.';
        if (text) {
          try {
            const data = JSON.parse(text);
            errorMessage = data.error || errorMessage;
          } catch (e) {
            // Not JSON, ignore and use default error message
          }
        }
        setError(errorMessage);
      }
    } catch (err) {
      setError('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h3 className="text-xl font-semibold text-slate-800">
            관리자 계정 설정
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
          {success && (
            <div className="p-3 bg-emerald-50 text-emerald-700 text-sm rounded-lg">
              {success}
            </div>
          )}

          <div className="space-y-4 pb-4 border-b border-slate-100">
            <h4 className="text-sm font-medium text-slate-500">현재 계정 정보 확인</h4>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">현재 아이디</label>
              <input
                type="text"
                required
                value={currentUsername}
                onChange={(e) => setCurrentUsername(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">현재 비밀번호</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
              />
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-medium text-slate-500">새로운 계정 정보</h4>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">새 아이디</label>
              <input
                type="text"
                required
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">새 비밀번호</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
              />
            </div>
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
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? '변경 중...' : '변경하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
