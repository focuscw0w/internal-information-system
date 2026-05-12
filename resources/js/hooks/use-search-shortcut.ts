import { useEffect, useState } from 'react';

interface SearchShortcut {
    display: string;
    title: string;
}

function isMacPlatform(): boolean {
    if (typeof navigator === 'undefined') {
        return false;
    }

    const nav = navigator as Navigator & {
        userAgentData?: { platform?: string };
    };
    const platform = nav.userAgentData?.platform ?? navigator.platform ?? '';

    return /mac|iphone|ipad|ipod/i.test(platform);
}

export function useSearchShortcut(): SearchShortcut {
    const [isMac, setIsMac] = useState(false);

    useEffect(() => {
        setIsMac(isMacPlatform());
    }, []);

    const display = isMac ? '⌘ K' : 'Ctrl K';

    return {
        display,
        title: `Hľadať (${display})`,
    };
}
