import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
  withText?: boolean;
  useImage?: boolean; // Nueva propiedad para controlar si usar imagen o SVG
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  variant = 'dark',
  withText = true,
  useImage = true // Por defecto, usará la imagen
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  const textColorClasses = {
    light: 'text-white',
    dark: 'text-elegant-900'
  };

  const subtitleColorClasses = {
    light: 'text-gold-300',
    dark: 'text-gold-600'
  };

  // Tamaños de imagen basados en la prop size
  const imageSizes = {
    sm: { width: 32, height: 32 },
    md: { width: 48, height: 48 },
    lg: { width: 64, height: 64 }
  };

  return (
    <div className="flex items-center space-x-3">
      {useImage ? (
        // Versión con imagen
        <div className={`relative ${sizeClasses[size]}`}>
          <img 
            src="/olivia_gold_logo.png/olivia_gold_logo.png" 
            alt="Olivia Gold Logo" 
            width={imageSizes[size].width}
            height={imageSizes[size].height}
            className="object-contain"
          />
        </div>
      ) : (
        // Versión original con SVG
        <div className={`relative ${sizeClasses[size]}`}>
          {/* Círculo exterior */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 shadow-gold"></div>
          
          {/* Círculo interior */}
          <div className="absolute inset-[2px] rounded-full bg-white flex items-center justify-center">
            {/* Letra O estilizada */}
            <div className="font-serif font-bold text-gold-600" style={{ 
              fontSize: size === 'sm' ? '1.5rem' : size === 'md' ? '2rem' : '2.5rem',
              lineHeight: 1
            }}>
              O
            </div>
          </div>
          
          {/* Pequeño diamante decorativo */}
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rotate-45 border border-gold-400"></div>
        </div>
      )}
      
      {withText && (
        <div className="hidden sm:block"> {/* Ocultar texto en móviles para mejor responsividad */}
          <h1 className={`font-serif font-bold ${textColorClasses[variant]} ${textSizeClasses[size]} leading-none`}>
            Olivia Gold
          </h1>
          <p className={`text-xs ${subtitleColorClasses[variant]} font-medium leading-none mt-1`}>
            Oro laminado de lujo
          </p>
        </div>
      )}
    </div>
  );
};

export default Logo;