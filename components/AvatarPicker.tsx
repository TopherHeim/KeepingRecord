import React, { useState, useMemo } from 'react';
import { Dices, Check, X, Info } from 'lucide-react';
import { createAvatar } from '@dicebear/core';
import * as notionists from '@dicebear/notionists';

interface AvatarPickerProps {
    currentSeed: string;
    onSave: (newSeed: string) => void;
    onClose: () => void;
}

const AvatarPicker: React.FC<AvatarPickerProps> = ({ currentSeed, onSave, onClose }) => {
    const [tempSeed, setTempSeed] = useState(currentSeed || 'vinyl-lover');

    // Generate the preview URI locally
    const previewUri = useMemo(() => {
        return createAvatar(notionists, {
            seed: tempSeed,
            backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'],
        }).toDataUri();
    }, [tempSeed]);

    const handleShuffle = () => {
        const randomString = Math.random().toString(36).substring(2, 10);
        setTempSeed(randomString);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[90] p-4 backdrop-blur-sm">
            <div className="bg-[#fdf6e3] bg-clip-padding border-2 border-[#5e3f28] rounded-2xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center">

                <h3 className="text-2xl font-bold text-[#5e3f28] mb-2 text-center">Character Creator</h3>
                <p className="text-[#8b5e3c] text-sm mb-6 text-center">Type or roll the dice to change your look.</p>

                {/* LARGE PREVIEW */}
                <div className="w-32 h-32 rounded-full bg-[#d4c5a9] border-4 border-[#5e3f28] overflow-hidden mb-6 shadow-inner ring-8 ring-[#5e3f28]/10">
                    <img
                        src={previewUri}
                        alt="Preview"
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* SEED INPUT BOX */}
                <div className="relative w-full mb-8">
                    <input
                        type="text"
                        value={tempSeed}
                        onChange={(e) => setTempSeed(e.target.value)}
                        placeholder="Type anything..."
                        className="w-full bg-[#f4ece1] border-2 border-[#5e3f28] rounded-lg py-3 px-4 pr-12 text-[#5e3f28] font-medium focus:outline-none focus:ring-2 focus:ring-[#8b5e3c] transition-all"
                    />
                    <button
                        onClick={handleShuffle}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#5e3f28] hover:text-[#8b5e3c] transition-colors"
                    >
                        <Dices size={24} />
                    </button>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex w-full gap-3">
                    <button onClick={onClose} className="flex-1 px-4 py-3 border-2 border-[#5e3f28] rounded-lg text-[#5e3f28] font-bold hover:bg-black/5 flex items-center justify-center gap-2">
                        <X size={18} /> Cancel
                    </button>
                    <button onClick={() => onSave(tempSeed)} className="flex-1 px-4 py-3 bg-[#5e3f28] border-2 border-[#5e3f28] rounded-lg text-[#fdf6e3] font-bold hover:bg-[#4a3220] transition-colors shadow-md flex items-center justify-center gap-2">
                        <Check size={18} /> Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AvatarPicker;