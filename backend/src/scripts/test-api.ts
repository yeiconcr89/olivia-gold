import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function testOrdersAPI() {
  try {
    console.log('🧪 Probando API de pedidos...');
    
    // Obtener usuario admin
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      include: { profile: true }
    });
    
    if (!adminUser) {
      console.error('❌ No se encontró usuario admin');
      return;
    }
    
    console.log('✅ Usuario admin encontrado:', adminUser.email);
    
    // Crear token JWT
    const token = jwt.sign(
      { 
        userId: adminUser.id, 
        email: adminUser.email, 
        role: adminUser.role 
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
    
    console.log('✅ Token JWT creado');
    
    // Probar API de pedidos
    const response = await fetch('http://localhost:3001/api/orders', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error en API:', response.status, errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Respuesta de API de pedidos:', JSON.stringify(data, null, 2));
    
    // Probar API de estadísticas
    const statsResponse = await fetch('http://localhost:3001/api/orders/stats/overview', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log('✅ Estadísticas de pedidos:', JSON.stringify(statsData, null, 2));
    } else {
      console.error('❌ Error obteniendo estadísticas:', statsResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Error probando API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testOrdersAPI();