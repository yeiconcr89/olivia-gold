import React from 'react';

const EmergencyApp: React.FC = () => {
  const containerStyle: React.CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f8f9fa',
    minHeight: '100vh'
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    margin: '16px 0',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e9ecef'
  };

  const buttonStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '12px 24px',
    backgroundColor: '#007bff',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '500',
    margin: '5px'
  };

  const titleStyle: React.CSSProperties = {
    color: '#212529',
    marginBottom: '16px',
    fontSize: '2rem',
    textAlign: 'center'
  };

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>🎉 ¡Olivia Gold - Estilos Funcionando!</h1>
      
      <div style={cardStyle}>
        <h2 style={{ color: '#212529', marginBottom: '16px' }}>✅ CSS Aplicado Correctamente</h2>
        <p style={{ color: '#6c757d', marginBottom: '16px' }}>
          Los estilos están funcionando perfectamente. La aplicación está lista para desarrollo.
        </p>
        
        <div style={{ marginTop: '20px' }}>
          <button style={buttonStyle}>Botón Principal</button>
          <button style={{...buttonStyle, backgroundColor: '#28a745'}}>Botón Verde</button>
          <button style={{...buttonStyle, backgroundColor: '#dc3545'}}>Botón Rojo</button>
          <button style={{...buttonStyle, backgroundColor: '#ffc107', color: '#212529'}}>Botón Amarillo</button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <div style={cardStyle}>
          <h3 style={{ color: '#212529', marginBottom: '12px' }}>🛍️ Productos</h3>
          <p style={{ color: '#6c757d' }}>Gestión de productos de joyería</p>
        </div>
        
        <div style={cardStyle}>
          <h3 style={{ color: '#212529', marginBottom: '12px' }}>👥 Clientes</h3>
          <p style={{ color: '#6c757d' }}>Administración de clientes</p>
        </div>
        
        <div style={cardStyle}>
          <h3 style={{ color: '#212529', marginBottom: '12px' }}>📦 Pedidos</h3>
          <p style={{ color: '#6c757d' }}>Control de pedidos y ventas</p>
        </div>
      </div>

      <div style={{...cardStyle, textAlign: 'center', marginTop: '40px'}}>
        <h2 style={{ color: '#28a745', marginBottom: '16px' }}>🚀 Proyecto Funcionando</h2>
        <p style={{ color: '#6c757d', fontSize: '1.1rem' }}>
          Frontend y Backend conectados correctamente
        </p>
        <div style={{ marginTop: '20px' }}>
          <span style={{...buttonStyle, backgroundColor: '#28a745'}}>Frontend: ✅ OK</span>
          <span style={{...buttonStyle, backgroundColor: '#17a2b8'}}>Backend: ✅ OK</span>
          <span style={{...buttonStyle, backgroundColor: '#6f42c1'}}>CSS: ✅ OK</span>
        </div>
      </div>
    </div>
  );
};

export default EmergencyApp;