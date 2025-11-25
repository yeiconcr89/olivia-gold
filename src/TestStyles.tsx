import React from 'react';

const TestStyles: React.FC = () => {
  return (
    <div className="container">
      <h1>🎨 Test de Estilos - Olivia Gold</h1>
      
      <div className="card">
        <h2>Verificación de CSS</h2>
        <p>Si puedes ver este texto con estilos, el CSS está funcionando correctamente.</p>
        
        <div className="mt-4">
          <button className="btn">Botón Normal</button>
          <button className="btn test-red">Botón Rojo</button>
          <button className="btn test-blue">Botón Azul</button>
          <button className="btn test-green">Botón Verde</button>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h3>Card 1</h3>
          <p>Esta es una tarjeta de prueba para verificar el grid layout.</p>
        </div>
        
        <div className="card">
          <h3>Card 2</h3>
          <p>Esta es otra tarjeta de prueba con estilos aplicados.</p>
        </div>
        
        <div className="card">
          <h3>Card 3</h3>
          <p>Tercera tarjeta para completar el test del grid.</p>
        </div>
      </div>

      <div className="text-center mt-4">
        <h2>✅ Si ves colores y estilos, todo funciona!</h2>
        <p>El CSS básico está cargando correctamente.</p>
      </div>
    </div>
  );
};

export default TestStyles;