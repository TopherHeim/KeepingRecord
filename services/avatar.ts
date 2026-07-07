import { createAvatar } from '@dicebear/core';
import * as notionists from '@dicebear/notionists';

// Same generation settings as ProfileIcon so a user's avatar looks identical
// everywhere it appears
export function avatarUri(seed: string): string {
    return createAvatar(notionists, {
        seed,
        backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'],
    }).toDataUri();
}
