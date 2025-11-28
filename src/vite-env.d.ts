/// <reference types="vite/client" />

interface Window {
    google?: {
        accounts: {
            id: {
                initialize: (config: any) => void;
                renderButton: (parent: HTMLElement | null, config: any) => void;
                prompt: (momentListener?: (notification: any) => void) => void;
                disableAutoSelect: () => void;
                cancel: () => void;
            };
        };
    };
}
