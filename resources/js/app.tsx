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
         console.log('Resolving page:', name);
    
    const parts = name.split('/');
    
    if (parts.length >= 2) {
        const [moduleName, ...pageParts] = parts;
        const pageName = pageParts.join('/');
    
        const modPath = Object.keys(modulePages).find((p) => {
            const match = 
                p.includes(`/Modules/${moduleName}/resources/js/pages/${pageName}.jsx`) ||
                p.includes(`/Modules/${moduleName}/resources/js/pages/${pageName}.tsx`);
        
            return match;
        });
        
        if (modPath) {
            return resolvePageComponent(modPath, modulePages);
        }
    }

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
