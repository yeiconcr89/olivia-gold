// Script para probar la autenticación del frontend
const testAuth = async () => {
  try {
    console.log('🧪 Probando autenticación del frontend...');
    
    // Probar login
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@joyceriaelegante.com',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.error('❌ Error en login:', loginResponse.status, errorText);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login exitoso:', loginData.user.email);
    
    const token = loginData.token;
    
    // Probar API de pedidos con el token
    const ordersResponse = await fetch('http://localhost:3001/api/orders', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!ordersResponse.ok) {
      const errorText = await ordersResponse.text();
      console.error('❌ Error obteniendo pedidos:', ordersResponse.status, errorText);
      return;
    }
    
    const ordersData = await ordersResponse.json();
    console.log('✅ Pedidos obtenidos:', ordersData.orders.length);
    console.log('📋 Primer pedido:', ordersData.orders[0]);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

testAuth();