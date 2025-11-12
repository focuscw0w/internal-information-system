import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

const appPages = import.meta.glob('./pages/**/*.{jsx,tsx}')
const modulePages = import.meta.glob('/Modules/*/resources/js/pages/**/*.{jsx,tsx}')


createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) => {
        // app pages (lowercase)
        const modPath = Object.keys(modulePages).find(
            (p) =>
                p.endsWith(`/resources/js/pages/${name}.jsx`) ||
                p.endsWith(`/resources/js/pages/${name}.tsx`),
        );
        if (modPath) return resolvePageComponent(modPath, modulePages);

        // 2) fallback do resources/js/Pages
        return resolvePageComponent(`./pages/${name}.tsx`, appPages);
    },
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
