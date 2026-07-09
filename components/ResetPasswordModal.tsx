import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

interface ResetPasswordModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

// Sets a new password for the current session. Reached two ways: from
// Settings → Change password, and from the email recovery link (Supabase
// signs the user in with a recovery session, then App opens this modal
// on the PASSWORD_RECOVERY auth event).
const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ onClose, onSuccess }) => {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setError(null);
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (password !== confirm) {
            setError("Passwords don't match.");
            return;
        }
        setLoading(true);
        const { error: updateError } = await supabase.auth.updateUser({ password });
        setLoading(false);
        if (updateError) {
            setError(updateError.message);
        } else {
            onSuccess();
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[80] animate-fade-in-fast">
            <div className="bg-[#FDF6E3] bg-clip-padding p-6 rounded-lg shadow-lg w-80 border-2 border-[#5e3f28]">
                <h2 className="text-xl font-bold mb-1 text-[#5e3f28]">Set a new password</h2>
                <p className="text-xs text-[#8B5E3C] mb-4">You'll use this the next time you log in.</p>

                {error && <p className="text-red-600 mb-3 text-sm">{error}</p>}

                <input
                    type="password"
                    placeholder="New password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoFocus
                    className="w-full mb-3 p-2 border rounded border-[#5e3f28] bg-white"
                />
                <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
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
                        className="px-4 py-2 bg-[#D2691E] text-white rounded hover:bg-[#A0522D] disabled:opacity-50"
                    >
                        {loading ? 'Saving…' : 'Save password'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordModal;
