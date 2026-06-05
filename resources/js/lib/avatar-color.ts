/**
 * Jedna kanonická paleta farieb avatarov pre celý systém.
 * Každá farba je navrhnutá s bielym textom.
 */
export const AVATAR_COLORS = [
    'bg-red-600',
    'bg-orange-600',
    'bg-amber-700',
    'bg-lime-600',
    'bg-emerald-600',
    'bg-teal-600',
    'bg-cyan-700',
    'bg-sky-600',
    'bg-blue-600',
    'bg-indigo-600',
    'bg-violet-600',
    'bg-pink-600',
] as const;

/**
 * Vráti stabilnú triedu pozadia + textu pre avatar daného používateľa.
 * Farba sa odvodí z hashu mena, takže ten istý používateľ má vždy rovnakú
 * farbu naprieč všetkými tabuľkami a komponentmi.
 */
export function getAvatarColor(name?: string | null): string {
    const value = (name ?? '').trim();

    let hash = 5381;
    for (let i = 0; i < value.length; i++) {
        // djb2
        hash = (hash * 33 + value.charCodeAt(i)) >>> 0;
    }

    const color = AVATAR_COLORS[hash % AVATAR_COLORS.length];

    return `${color} text-white`;
}
