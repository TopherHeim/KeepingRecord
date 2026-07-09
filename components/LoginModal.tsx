import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { User } from '../types';

interface LoginModalProps {
    onClose: () => void;
    onLogin: (user: User) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLogin }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        setInfo(null);

        if (isSignUp) {
            const name = username.trim();
            if (!/^[a-zA-Z0-9_]{3,20}$/.test(name)) {
                setError('Username must be 3–20 characters — letters, numbers, and _ only.');
                setLoading(false);
                return;
            }

            // Check availability BEFORE creating the auth account — a failed
            // profile insert afterwards would strand an auth user whose email
            // can never sign up again. (_ is an ilike wildcard, so escape it.)
            const { data: existing } = await supabase
                .from('vault_users')
                .select('id')
                .ilike('username', name.replace(/[_%]/g, '\\$&'))
                .maybeSingle();
            if (existing) {
                setError('That username is taken.');
                setLoading(false);
                return;
            }

            // The username rides along in auth metadata so the profile can
            // still be created on first login when email confirmation is on
            // (there's no session to pass RLS with here in that case)
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { username: name } },
            });

            if (signUpError) {
                setError(signUpError.message);
                setLoading(false);
                return;
            }

            if (!data.session) {
                // Email confirmation is enabled — no session yet, so the
                // profile gets created on first login instead
                setIsSignUp(false);
                setInfo('Account created! Confirm your email, then log in.');
                setLoading(false);
                return;
            }

            if (data.user) {
                const { error: profileError } = await supabase
                    .from('vault_users')
                    .insert([{ id: data.user.id, username: name }]);

                // 23505 = someone grabbed the name between check and insert;
                // App's profile-ensure on login assigns a fallback name
                if (profileError && profileError.code !== '23505') {
                    setError(profileError.message);
                    setLoading(false);
                    return;
                }

                onLogin({ id: data.user.id, username: name });
            }
        } else {
            // Sign in
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                setError(signInError.message);
                setLoading(false);
                return;
            }

            if (data.user) {
                // Fetch their username from vault_users
                const { data: profile } = await supabase
                    .from('vault_users')
                    .select('username, avatar_icon')
                    .eq('id', data.user.id)
                    .single();

                onLogin({
                    id: data.user.id,
                    // Profile may not exist yet on first login after email
                    // confirmation — App creates it from the signup metadata
                    username: profile?.username || data.user.user_metadata?.username || email,
                    avatar_icon: profile?.avatar_icon
                });
            }
        }

        setLoading(false);
        onClose();
    };

    const handleForgotPassword = async () => {
        if (!email) {
            setError('Enter your email above first.');
            return;
        }
        setError(null);
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin,
        });
        if (resetError) {
            setError(resetError.message);
        } else {
            setInfo('Password reset email sent — check your inbox.');
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-[#FDF6E3] bg-clip-padding p-6 rounded-lg shadow-lg w-80 border-2 border-[#5e3f28]">
                <h2 className="text-xl font-bold mb-4 text-[#5e3f28]">
                    {isSignUp ? 'Create Account' : 'Log In'}
                </h2>

                {error && <p className="text-red-600 mb-3 text-sm">{error}</p>}
                {info && <p className="text-green-700 mb-3 text-sm font-semibold">{info}</p>}

                {isSignUp && (
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full mb-3 p-2 border rounded border-[#5e3f28] bg-white"
                    />
                )}

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full mb-3 p-2 border rounded border-[#5e3f28] bg-white"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
                    className="w-full mb-1 p-2 border rounded border-[#5e3f28] bg-white"
                />
                <div className="mb-4 text-right">
                    {!isSignUp && (
                        <button
                            type="button"
                            onClick={handleForgotPassword}
                            className="text-xs text-[#8b5e3c] underline hover:text-[#5e3f28]"
                        >
                            Forgot password?
                        </button>
                    )}
                </div>

                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded border border-[#5e3f28] hover:bg-[#5e3f28]/10"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-4 py-2 bg-[#D2691E] text-white rounded hover:bg-[#A0522D]"
                    >
                        {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Log In'}
                    </button>
                </div>

                <p className="text-center text-sm text-[#8b5e3c] mt-4">
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                    <button
                        onClick={() => { setIsSignUp(!isSignUp); setError(null); setInfo(null); }}
                        className="ml-1 font-bold underline"
                    >
                        {isSignUp ? 'Log In' : 'Sign Up'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default LoginModal;