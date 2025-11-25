// Script para obtener token de admin y configurar localStorage
const getAdminToken = async () => {
  try {
    console.log('🔑 Obteniendo token de administrador...');
    
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@joyceriaelegante.com',
        password: 'admin123'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('✅ Login exitoso');
    console.log('👤 Usuario:', data.user.email, '(' + data.user.role + ')');
    console.log('🔑 Token:', data.token);
    
    console.log('\n📋 Para usar en el navegador, ejecuta estos comandos en la consola:');
    console.log(`localStorage.setItem('token', '${data.token}');`);
    console.log(`localStorage.setItem('user', '${JSON.stringify(data.user)}');`);
    console.log(`localStorage.setItem('authMethod', 'email');`);
    console.log('location.reload();');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

getAdminToken();