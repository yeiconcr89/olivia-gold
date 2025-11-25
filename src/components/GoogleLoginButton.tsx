import React, { useEffect } from 'react';

interface GoogleUserInfo {
  token: string;
  email: string;
  name: string;
  googleId: string;
  picture: string;
}

interface GoogleLoginButtonProps {
  onSuccess: (response: GoogleUserInfo) => void;
  onError: (error: string | Error) => void;
}

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleAccounts {
  id: {
    initialize: (config: {
      client_id: string;
      callback: (response: GoogleCredentialResponse) => void;
      auto_select: boolean;
      cancel_on_tap_outside: boolean;
      use_fedcm_for_prompt: boolean;
    }) => void;
    renderButton: (element: HTMLElement | null, config: {
      theme: string;
      size: string;
      text: string;
      shape: string;
      width: number;
    }) => void;
  };
}

declare global {
  interface Window {
    google: { accounts: GoogleAccounts };
    googleLoginCallback?: (response: GoogleCredentialResponse) => void;
  }
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ 
  onSuccess, 
  onError
}) => {
  useEffect(() => {
    // Cargar el script de Google
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (window.google) {
        // Callback global para Google
        window.googleLoginCallback = (response: GoogleCredentialResponse) => {
          if (response.credential) {
            // Decodificar el JWT token de Google
            try {
              const payload = JSON.parse(atob(response.credential.split('.')[1]));
              onSuccess({
                token: response.credential,
                email: payload.email,
                name: payload.name,
                googleId: payload.sub,
                picture: payload.picture
              });
            } catch (error) {
              onError(error);
            }
          } else {
            onError('No se recibió credencial de Google');
          }
        };

        // Verificar si tenemos Client ID configurado
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId) {
          console.warn('VITE_GOOGLE_CLIENT_ID no está configurado');
          onError('Google OAuth no está configurado correctamente');
          return;
        }

        // Inicializar Google Sign-In
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: window.googleLoginCallback,
            auto_select: false,
            cancel_on_tap_outside: true,
            use_fedcm_for_prompt: false
          });
        } catch (error) {
          console.error('Error inicializando Google Sign-In:', error);
          onError('Error configurando Google Sign-In');
          return;
        }

        // Renderizar el botón
        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            width: 300
          }
        );
      }
    };

    return () => {
      // Cleanup
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
      if (window.googleLoginCallback) {
        delete window.googleLoginCallback;
      }
    };
  }, [onSuccess, onError]);

  return (
    <div className="w-full">
      <div id="google-signin-button" className="w-full flex justify-center"></div>
      <noscript>
        <div className="text-center text-gray-500 text-sm mt-2">
          JavaScript es requerido para el login con Google
        </div>
      </noscript>
    </div>
  );
};

export default GoogleLoginButton;