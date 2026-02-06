import React, { useState } from 'react';
import { Shield, Mail, KeyRound, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminLogin({ onCancel }: { onCancel: () => void }) {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { signIn, verifyOTP } = useAuth();

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { error } = await signIn(email);

        if (error) {
            setError(error.message || 'Failed to send verification code');
            setLoading(false);
        } else {
            setStep('otp');
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { error } = await verifyOTP(email, otp);

        if (error) {
            setError(error.message || 'Invalid verification code');
            setLoading(false);
        }
        // If successful, AuthContext will handle the redirect
    };

    return (
        <div className="w-full h-full flex items-center justify-center bg-slate-950 text-slate-100 p-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="p-4 bg-amber-500/10 rounded-full border border-amber-500/20">
                            <Shield className="w-12 h-12 text-amber-500" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-amber-500 font-mono">
                        ADMIN ACCESS
                    </h1>
                    <p className="text-slate-400 text-sm">
                        Restricted to authorized @mainichi.digital personnel
                    </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 shadow-2xl">
                    {step === 'email' ? (
                        <form onSubmit={handleSendOTP} className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-300">
                                    <Mail className="w-4 h-4 inline mr-2" />
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="username@mainichi.digital"
                                    required
                                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Only @mainichi.digital emails are authorized
                                </p>
                            </div>

                            {error && (
                                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full px-6 py-3 bg-amber-500 text-slate-950 font-bold rounded hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="w-4 h-4" />
                                        Send Verification Code
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOTP} className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-300">
                                    <KeyRound className="w-4 h-4 inline mr-2" />
                                    Verification Code
                                </label>
                                <p className="text-xs text-slate-500 mb-3">
                                    Check your email ({email}) for the 6-digit code
                                </p>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    required
                                    maxLength={6}
                                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono text-center text-2xl tracking-widest"
                                />
                            </div>

                            {error && (
                                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="space-y-3">
                                <button
                                    type="submit"
                                    disabled={loading || otp.length !== 6}
                                    className="w-full px-6 py-3 bg-amber-500 text-slate-950 font-bold rounded hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            <Shield className="w-4 h-4" />
                                            Verify & Access
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setStep('email')}
                                    className="w-full px-6 py-2 text-slate-400 hover:text-slate-300 text-sm transition-colors"
                                >
                                    Use different email
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                <div className="text-center">
                    <button
                        onClick={onCancel}
                        className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                    >
                        ← Back to Main Menu
                    </button>
                </div>
            </div>
        </div>
    );
}
