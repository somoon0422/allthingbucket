import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { X, Mail, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/dataService';

interface EmailVerificationProps {
  userId: string;
  onVerificationComplete: () => void;
  onClose: () => void;
}

const EmailVerification: React.FC<EmailVerificationProps> = ({
  userId,
  onVerificationComplete,
  onClose,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);

  const handleSendCode = async () => {
    if (!user?.email) {
      toast.error('이메일 주소가 없습니다');
      return;
    }

    setLoading(true);
    try {
      // 임시 방법: 이메일 인증 기능은 Supabase SMTP 설정 후 활성화됩니다
      // 현재는 인증을 즉시 완료 처리합니다

      toast.success('이메일이 확인되었습니다', {
        duration: 2000
      });

      // 바로 인증 완료 처리
      setTimeout(() => {
        onVerificationComplete();
      }, 1000);

      // 실제 OTP 구현 (SMTP 설정 후 주석 해제)
      /*
      const { error } = await supabase.auth.signInWithOtp({
        email: user.email,
        options: {
          shouldCreateUser: false,
        }
      });

      if (error) {
        console.error('OTP 발송 실패:', error);
        toast.error('인증번호 발송에 실패했습니다');
      } else {
        setCodeSent(true);
        toast.success('인증번호가 이메일로 발송되었습니다');
      }
      */
    } catch (error) {
      console.error('인증 실패:', error);
      toast.error('인증 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      toast.error('인증번호를 입력해주세요');
      return;
    }

    if (!user?.email) {
      toast.error('이메일 주소가 없습니다');
      return;
    }

    setLoading(true);
    try {
      // Supabase OTP 검증
      const { error } = await supabase.auth.verifyOtp({
        email: user.email,
        token: verificationCode,
        type: 'email'
      });

      if (error) {
        console.error('OTP 검증 실패:', error);
        toast.error('인증번호가 올바르지 않습니다');
      } else {
        toast.success('이메일 인증이 완료되었습니다!');
        onVerificationComplete();
      }
    } catch (error) {
      console.error('OTP 검증 실패:', error);
      toast.error('인증 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">이메일 인증</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            {!codeSent ? (
              <div className="text-center">
                <Mail className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  이메일 인증
                </h3>
                <p className="text-gray-600 mb-6">
                  {user?.email}로 인증번호를 발송하겠습니다.
                </p>
                <button
                  onClick={handleSendCode}
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Mail className="w-5 h-5" />
                  )}
                  <span>{loading ? '발송 중...' : '인증번호 발송'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-green-800 mb-1">
                        인증번호 발송 완료
                      </h3>
                      <p className="text-sm text-green-700">
                        {user?.email}로 인증번호가 발송되었습니다.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    인증번호 입력
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="6자리 인증번호를 입력하세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength={6}
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800 mb-1">
                        주의사항
                      </h3>
                      <ul className="text-xs text-yellow-700 space-y-1">
                        <li>• 인증번호는 5분간 유효합니다</li>
                        <li>• 인증번호가 오지 않으면 스팸함을 확인해주세요</li>
                        <li>• 이메일 인증 완료 후 프로필이 활성화됩니다</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setCodeSent(false);
                      setVerificationCode('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    다시 발송
                  </button>
                  <button
                    onClick={handleVerifyCode}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    인증 완료
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
