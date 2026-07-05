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
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);

        if (isSignUp) {
            // Create auth account
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (signUpError) {
                setError(signUpError.message);
                setLoading(false);
                return;
            }

            if (data.user) {
                // Create a matching row in vault_users
                const { error: profileError } = await supabase
                    .from('vault_users')
                    .insert([{ id: data.user.id, username }]);

                if (profileError) {
                    setError(profileError.message);
                    setLoading(false);
                    return;
                }

                onLogin({ id: data.user.id, username });
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
                    username: profile?.username || email,
                    avatar_icon: profile?.avatar_icon
                });
            }
        }

        setLoading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-[#FDF6E3] p-6 rounded-lg shadow-lg w-80 border-2 border-[#5e3f28]">
                <h2 className="text-xl font-bold mb-4 text-[#5e3f28]">
                    {isSignUp ? 'Create Account' : 'Log In'}
                </h2>

                {error && <p className="text-red-600 mb-3 text-sm">{error}</p>}

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
                    className="w-full mb-4 p-2 border rounded border-[#5e3f28] bg-white"
                />

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
                        onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
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