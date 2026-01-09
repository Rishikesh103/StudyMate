import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeStore {
    theme: 'light' | 'dark' | 'system';
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    toggleTheme: () => void;
}

export const useTheme = create<ThemeStore>()(
    persist(
        (set, get) => ({
            theme: 'system',
            setTheme: (theme) => {
                set({ theme });
                applyTheme(theme);
            },
            toggleTheme: () => {
                const { theme } = get();
                const newTheme = theme === 'dark' ? 'light' : 'dark';
                set({ theme: newTheme });
                applyTheme(newTheme);
            },
        }),
        {
            name: 'theme-storage',
        }
    )
);

function applyTheme(theme: 'light' | 'dark' | 'system') {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.add(systemTheme);
    } else {
        root.classList.add(theme);
    }
}

// Initialize theme on app load
if (typeof window !== 'undefined') {
    const storedTheme = localStorage.getItem('theme-storage');
    if (storedTheme) {
        try {
            const { state } = JSON.parse(storedTheme);
            applyTheme(state.theme || 'system');
        } catch {
            applyTheme('system');
        }
    } else {
        applyTheme('system');
    }
}
