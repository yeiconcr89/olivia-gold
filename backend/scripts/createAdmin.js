import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🌱 Creando usuario administrador...');
    
    // Verificar si ya existe un usuario admin
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (existingAdmin) {
      console.log(`⚠️  Ya existe un usuario administrador: ${existingAdmin.email}`);
      console.log('Puedes usar este usuario para acceder al panel de administración.');
      return;
    }

    // Crear usuario administrador
    const adminEmail = 'admin@oliviagold.com';
    const adminPassword = 'Admin123!';
    
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        profile: {
          create: {
            name: 'Administrador Olivia Gold',
            phone: '+1234567890'
          }
        }
      },
      include: {
        profile: true
      }
    });

    console.log(`✅ Usuario administrador creado exitosamente!`);
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Contraseña: ${adminPassword}`);
    console.log(`🆔 ID: ${adminUser.id}`);
    console.log(`\n📝 Puedes usar estas credenciales para acceder al panel de administración.`);
    
  } catch (error) {
    console.error('❌ Error creando usuario administrador:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función
createAdminUser();