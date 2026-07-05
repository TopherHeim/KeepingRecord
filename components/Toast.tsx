import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastProps {
    toasts: ToastMessage[];
    onRemove: (id: string) => void;
}

const icons = {
    success: <CheckCircle size={18} />,
    error: <XCircle size={18} />,
    info: <AlertCircle size={18} />,
};

const styles = {
    success: 'bg-[#3a5a2e] border-[#2a4a1e] text-[#d4f0c4]',
    error: 'bg-[#5a2e2e] border-[#4a1e1e] text-[#f0c4c4]',
    info: 'bg-[#5e3f28] border-[#3e2b1c] text-[#fdf6e3]',
};

const Toast: React.FC<ToastProps> = ({ toasts, onRemove }) => {
    return (
        <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>
    );
};

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
    useEffect(() => {
        const timer = setTimeout(() => onRemove(toast.id), 3500);
        return () => clearTimeout(timer);
    }, [toast.id, onRemove]);

    return (
        <div
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] font-bold text-sm max-w-sm animate-in slide-in-from-right-4 duration-200 ${styles[toast.type]}`}
        >
            <span className="shrink-0">{icons[toast.type]}</span>
            <span className="flex-1">{toast.message}</span>
            <button
                onClick={() => onRemove(toast.id)}
                className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
            >
                <X size={16} />
            </button>
        </div>
    );
};

export default Toast;