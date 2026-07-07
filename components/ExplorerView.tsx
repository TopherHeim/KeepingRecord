import React from 'react';
import { ChevronRight } from 'lucide-react';
import { User } from '../types';
import ProfileIcon from './ProfileIcon';
import { avatarUri } from '../services/avatar';

interface ExploreViewProps {
    users: User[];
    currentUser: User | null;
    userId?: string;
    onSelectUser: (id: string) => void;
    onUpdateAvatar: () => void; // This just tells App to open the modal
}

const ExploreView: React.FC<ExploreViewProps> = ({
                                                     users,
                                                     currentUser,
                                                     userId,
                                                     onSelectUser,
                                                     onUpdateAvatar,
                                                 }) => {
    const showYourProfileCard = !!userId && !!currentUser;

    return (
        <div className="p-[18px] md:p-6 max-w-2xl mx-auto min-h-screen">
            <h2 className="text-xl font-black tracking-tight text-[#3e2b1c] mb-4">
                Friends' Collections
            </h2>

            <div className="flex flex-col gap-3">

                {/* YOUR PROFILE — back to your own collection */}
                {showYourProfileCard && (
                    <div
                        onClick={() => onSelectUser(userId!)}
                        className="bg-[#e3dcd2] bg-clip-padding border-2 border-[#5e3f28] rounded-xl shadow-[4px_4px_0px_0px_rgba(94,63,40,0.8)] p-3.5 flex items-center gap-3 cursor-pointer hover:-translate-y-[3px] transition-transform duration-150"
                    >
                        <ProfileIcon
                            seed={currentUser.avatar_icon || currentUser.username}
                            isEditable={true}
                            onEdit={onUpdateAvatar}
                        />
                        <div className="flex-1 min-w-0">
                            <p className="font-black text-base text-[#3e2b1c] truncate">Your Collection</p>
                            <p className="text-xs font-mono text-[#8B5E3C] mt-0.5">
                                {currentUser.record_count != null ? `${currentUser.record_count} records` : 'back to your shelf'}
                            </p>
                        </div>
                        <ChevronRight size={18} strokeWidth={2.5} className="text-[#8B5E3C] flex-shrink-0" />
                    </div>
                )}

                {/* OTHER USERS */}
                {users.map((user) => (
                    <div
                        key={user.id}
                        onClick={() => onSelectUser(user.id)}
                        className="bg-[#e3dcd2] bg-clip-padding border-2 border-[#5e3f28] rounded-xl shadow-[4px_4px_0px_0px_rgba(94,63,40,0.8)] p-3.5 flex items-center gap-3 cursor-pointer hover:-translate-y-[3px] transition-transform duration-150"
                    >
                        <div className="w-12 h-12 rounded-full bg-[#d4c5a9] border-2 border-[#5e3f28] overflow-hidden flex-shrink-0">
                            <img
                                src={avatarUri(user.avatar_icon || user.username)}
                                alt={`${user.username}'s avatar`}
                                className="w-full h-full object-cover"
                                draggable={false}
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-black text-base text-[#3e2b1c] truncate">{user.username}</p>
                            <p className="text-xs font-mono text-[#8B5E3C] mt-0.5">
                                {user.record_count != null ? `${user.record_count} records` : 'view collection'}
                            </p>
                        </div>
                        <ChevronRight size={18} strokeWidth={2.5} className="text-[#8B5E3C] flex-shrink-0" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ExploreView;
