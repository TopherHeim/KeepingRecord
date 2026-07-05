import React, { useMemo } from 'react';
import { createAvatar } from '@dicebear/core';
import * as notionists from '@dicebear/notionists';
import { Pencil } from 'lucide-react';

interface ProfileIconProps {
    seed: string;
    isEditable: boolean;
    onEdit: () => void;
}

const ProfileIcon: React.FC<ProfileIconProps> = ({ seed, isEditable, onEdit }) => {
    // This generates the SVG string locally and converts it to a browser-ready URI
    const avatarUri = useMemo(() => {
        return createAvatar(notionists, {
            seed: seed,
            backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'],
        }).toDataUri();
    }, [seed]);

    return (
        <div className="relative w-14 h-14 group">
            <div className="w-14 h-14 rounded-full bg-[#d4c5a9] border-2 border-[#5e3f28] overflow-hidden shadow flex items-center justify-center">
                <img
                    src={avatarUri}
                    alt="Profile Avatar"
                    className="w-full h-full object-cover"
                    draggable={false}
                />
            </div>

            {isEditable && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                    }}
                    className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
                    title="Edit profile icon"
                >
                    <Pencil size={16} className="text-white" />
                </button>
            )}
        </div>
    );
};

export default ProfileIcon;