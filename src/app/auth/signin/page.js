'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SignIn() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const result = await signIn('credentials', {
            password,
            redirect: false,
            callbackUrl,
        });

        if (result?.error) {
            setError('Invalid technician password.');
            setIsLoading(false);
        } else {
            router.push(callbackUrl);
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
            <div className="w-full max-w-md">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center font-black text-3xl shadow-[0_0_30px_rgba(99,102,241,0.5)] mb-6 text-white rotate-3 group-hover:rotate-0 transition-transform">
                        S
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tighter mb-2">
                        SmashOps<span className="text-indigo-500">.pro</span>
                    </h1>
                    <p className="text-slate-400 font-medium">Technician Authentication Required</p>
                </div>

                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 pl-1">
                                Technician Password
                            </label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                            />
                        </div>

                        {error && (
                            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-bold p-4 rounded-xl flex items-center gap-3">
                                <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px]">!</span>
                                {error}
                            </div>
                        )}

                        <button
                            disabled={isLoading}
                            className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-wait text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    VERIFYING...
                                </>
                            ) : (
                                'ACCESS DASHBOARD'
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center mt-8 text-slate-600 text-xs font-medium tracking-wide">
                    &copy; 2026 SmashOps.pro &bull; Secure Repair Infrastructure
                </p>
            </div>
        </div>
    );
}
