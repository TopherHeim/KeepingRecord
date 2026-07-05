import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    danger?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
                                                       isOpen,
                                                       title,
                                                       message,
                                                       confirmLabel = 'Confirm',
                                                       cancelLabel = 'Cancel',
                                                       onConfirm,
                                                       onCancel,
                                                       danger = false,
                                                   }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-xl overflow-hidden border-4 border-[#5e3f28]">

                {/* Header */}
                <div className="bg-[#5e3f28] px-5 py-4 flex items-center gap-3">
                    <AlertTriangle size={20} className={danger ? 'text-red-400' : 'text-[#D2691E]'} />
                    <h3 className="text-[#fdf6e3] font-bold text-lg">{title}</h3>
                </div>

                {/* Body */}
                <div className="bg-[#fdf6e3] px-5 py-5">
                    <p className="text-[#5e3f28] text-sm leading-relaxed">{message}</p>
                </div>

                {/* Actions */}
                <div className="bg-[#fdf6e3] px-5 pb-5 flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-5 py-2 rounded-lg border-2 border-[#5e3f28] text-[#5e3f28] font-bold hover:bg-[#e3dcd2] transition-colors"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-5 py-2 rounded-lg border-2 font-bold transition-all hover:opacity-90 active:scale-95
                            ${danger
                            ? 'bg-red-700 border-red-900 text-white'
                            : 'bg-[#D2691E] border-[#A0522D] text-white'
                        }`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;