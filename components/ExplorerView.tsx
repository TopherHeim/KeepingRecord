import React from 'react';
import { Music } from 'lucide-react';
import { User } from '../types';
import ProfileIcon from './ProfileIcon';

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
        <div className="p-6 max-w-7xl mx-auto min-h-screen">
            <h2 className="text-2xl font-bold text-[#5e3f28] mb-6 border-b-2 border-[#5e3f28]/10 pb-4">
                Explore Other Collections
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">

                {/* YOUR PROFILE — Uses the prop from App.tsx */}
                {showYourProfileCard && (
                    <div
                        onClick={() => onSelectUser(userId!)}
                        className="group relative bg-[#e3dcd2] bg-clip-padding rounded-lg shadow-[4px_4px_0px_0px_rgba(94,63,40,0.8)]
                       border-2 border-[#5e3f28] p-4 hover:-translate-y-1 transition-transform cursor-pointer"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <ProfileIcon
                                seed={currentUser.avatar_icon || currentUser.username}
                                isEditable={true}
                                onEdit={onUpdateAvatar}
                            />
                            <h3 className="font-bold text-lg text-[#3e2b1c]">Your Collection</h3>
                        </div>
                        <p className="text-sm text-[#8B5E3C]/70 flex items-center gap-1">
                            <Music size={14} /> Go back to your collection
                        </p>
                    </div>
                )}

                {/* OTHER USERS */}
                {users.map((user) => (
                    <div
                        key={user.id}
                        onClick={() => onSelectUser(user.id)}
                        className="group relative bg-[#e3dcd2] bg-clip-padding rounded-lg shadow-[4px_4px_0px_0px_rgba(94,63,40,0.8)]
                       border-2 border-[#5e3f28] p-4 hover:-translate-y-1 transition-transform cursor-pointer"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <ProfileIcon
                                seed={user.avatar_icon || user.username}
                                isEditable={user.id === userId}
                                onEdit={onUpdateAvatar}
                            />
                            <h3 className="font-bold text-lg text-[#3e2b1c]">{user.username}</h3>
                        </div>
                        <p className="text-sm text-[#8B5E3C]/70 flex items-center gap-1">
                            <Music size={14} /> View collection
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ExploreView;