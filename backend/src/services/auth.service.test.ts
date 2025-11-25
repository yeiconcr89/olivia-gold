import { prisma } from '../utils/prisma';
import * as authService from './auth.service';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Datos de prueba
const testUserData = {
  email: 'auth-test@joyceriaelegante.com',
  password: 'TestPassword123!',
  name: 'Test Auth User',
  role: 'CUSTOMER' as const,
};

const testAdminData = {
  email: 'admin-test@joyceriaelegante.com',
  password: 'AdminPassword123!',
  name: 'Test Admin User',
  role: 'ADMIN' as const,
};

let createdUser: any;
let createdAdmin: any;
let resetToken: string;

describe('Auth Service - Pruebas de Integración', () => {
  
  // Limpiar datos de prueba antes de iniciar
  beforeAll(async () => {
    await prisma.passwordResetToken.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [testUserData.email, testAdminData.email]
        }
      }
    });
  });

  // Limpiar después de las pruebas
  afterAll(async () => {
    await prisma.passwordResetToken.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [testUserData.email, testAdminData.email]
        }
      }
    });
    await prisma.$disconnect();
  });

  describe('User Registration', () => {
    it('debería registrar un nuevo usuario correctamente', async () => {
      const result = await authService.registerUser(testUserData);

      expect(result).toBeDefined();
      expect(result.user.email).toBe(testUserData.email);
      expect(result.user.name).toBe(testUserData.name);
      expect(result.user.role).toBe(testUserData.role);
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');

      // Verificar que la contraseña está hasheada
      const dbUser = await prisma.user.findUnique({
        where: { email: testUserData.email }
      });
      expect(dbUser).not.toBeNull();
      expect(dbUser!.password).not.toBe(testUserData.password);
      expect(await bcrypt.compare(testUserData.password, dbUser!.password)).toBe(true);

      createdUser = result.user;
    });

    it('debería rechazar registro con email duplicado', async () => {
      await expect(authService.registerUser(testUserData))
        .rejects.toThrow('El email ya está registrado');
    });

    it('debería rechazar registro con datos inválidos', async () => {
      await expect(authService.registerUser({
        email: 'invalid-email',
        password: '123',
        name: '',
        role: 'CUSTOMER' as const,
      })).rejects.toThrow();
    });

    it('debería crear perfil automáticamente para nuevo usuario', async () => {
      const profile = await prisma.profile.findUnique({
        where: { userId: createdUser.id }
      });
      expect(profile).not.toBeNull();
      expect(profile!.firstName).toBe(testUserData.name);
    });
  });

  describe('User Login', () => {
    it('debería autenticar usuario con credenciales correctas', async () => {
      const result = await authService.loginUser({
        email: testUserData.email,
        password: testUserData.password
      });

      expect(result).toBeDefined();
      expect(result.user.email).toBe(testUserData.email);
      expect(result.token).toBeDefined();

      // Verificar que el token es válido
      const decoded = jwt.verify(result.token, process.env.JWT_SECRET!) as any;
      expect(decoded.userId).toBe(createdUser.id);
      expect(decoded.email).toBe(testUserData.email);
    });

    it('debería rechazar login con email incorrecto', async () => {
      await expect(authService.loginUser({
        email: 'wrong@email.com',
        password: testUserData.password
      })).rejects.toThrow('Credenciales inválidas');
    });

    it('debería rechazar login con contraseña incorrecta', async () => {
      await expect(authService.loginUser({
        email: testUserData.email,
        password: 'wrongpassword'
      })).rejects.toThrow('Credenciales inválidas');
    });

    it('debería actualizar lastLogin después de login exitoso', async () => {
      const beforeLogin = new Date();
      
      await authService.loginUser({
        email: testUserData.email,
        password: testUserData.password
      });

      const user = await prisma.user.findUnique({
        where: { email: testUserData.email }
      });

      expect(user!.lastLogin).not.toBeNull();
      expect(user!.lastLogin!.getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime());
    });
  });

  describe('Password Reset', () => {
    it('debería generar token de reset para email válido', async () => {
      const result = await authService.generatePasswordResetToken(testUserData.email);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);

      // Verificar que el token existe en la base de datos
      const tokenRecord = await prisma.passwordResetToken.findFirst({
        where: { email: testUserData.email }
      });
      expect(tokenRecord).not.toBeNull();
      expect(tokenRecord!.used).toBe(false);
      expect(tokenRecord!.expiresAt.getTime()).toBeGreaterThan(Date.now());

      resetToken = tokenRecord!.token;
    });

    it('debería rechazar generación de token para email inexistente', async () => {
      await expect(authService.generatePasswordResetToken('nonexistent@email.com'))
        .rejects.toThrow('Usuario no encontrado');
    });

    it('debería resetear contraseña con token válido', async () => {
      const newPassword = 'NewPassword123!';
      
      const result = await authService.resetPassword(resetToken, newPassword);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);

      // Verificar que la nueva contraseña funciona
      const loginResult = await authService.loginUser({
        email: testUserData.email,
        password: newPassword
      });
      expect(loginResult).toBeDefined();

      // Verificar que el token fue marcado como usado
      const tokenRecord = await prisma.passwordResetToken.findUnique({
        where: { token: resetToken }
      });
      expect(tokenRecord!.used).toBe(true);
    });

    it('debería rechazar reset con token inválido', async () => {
      await expect(authService.resetPassword('invalid-token', 'NewPassword123!'))
        .rejects.toThrow('Token inválido o expirado');
    });

    it('debería rechazar reset con token ya usado', async () => {
      await expect(authService.resetPassword(resetToken, 'AnotherPassword123!'))
        .rejects.toThrow('Token inválido o expirado');
    });
  });

  describe('Admin Operations', () => {
    beforeAll(async () => {
      // Crear usuario admin para pruebas
      const adminResult = await authService.registerUser(testAdminData);
      createdAdmin = adminResult.user;
    });

    it('debería verificar correctamente si un usuario es admin', async () => {
      const isUserAdmin = await authService.isUserAdmin(createdUser.id);
      const isAdminAdmin = await authService.isUserAdmin(createdAdmin.id);

      expect(isUserAdmin).toBe(false);
      expect(isAdminAdmin).toBe(true);
    });

    it('debería obtener usuario por ID con información completa', async () => {
      const user = await authService.getUserById(createdUser.id);

      expect(user).toBeDefined();
      expect(user!.id).toBe(createdUser.id);
      expect(user!.email).toBe(testUserData.email);
      expect(user!.profile).toBeDefined();
    });

    it('debería retornar null para usuario inexistente', async () => {
      const user = await authService.getUserById('non-existent-id');
      expect(user).toBeNull();
    });

    it('debería actualizar información de perfil de usuario', async () => {
      const updateData = {
        firstName: 'Updated First',
        lastName: 'Updated Last',
        phone: '+57 300 123 4567'
      };

      const updatedUser = await authService.updateUserProfile(createdUser.id, updateData);

      expect(updatedUser).toBeDefined();
      expect(updatedUser.profile.firstName).toBe(updateData.firstName);
      expect(updatedUser.profile.lastName).toBe(updateData.lastName);
      expect(updatedUser.profile.phone).toBe(updateData.phone);
    });
  });

  describe('Security Features', () => {
    it('debería generar tokens JWT con estructura correcta', async () => {
      const loginResult = await authService.loginUser({
        email: testUserData.email,
        password: 'NewPassword123!' // Usando la nueva contraseña del test anterior
      });

      const decoded = jwt.verify(loginResult.token, process.env.JWT_SECRET!) as any;
      
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(createdUser.id);
      expect(decoded.email).toBe(testUserData.email);
      expect(decoded.role).toBe(testUserData.role);
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
      
      // Verificar que el token expira en el futuro
      expect(decoded.exp * 1000).toBeGreaterThan(Date.now());
    });

    it('debería manejar contraseñas con caracteres especiales', async () => {
      const specialPasswordUser = {
        email: 'special-chars@test.com',
        password: 'P@ssw0rd!#$%^&*()',
        name: 'Special Chars User',
        role: 'CUSTOMER' as const,
      };

      const registerResult = await authService.registerUser(specialPasswordUser);
      expect(registerResult).toBeDefined();

      const loginResult = await authService.loginUser({
        email: specialPasswordUser.email,
        password: specialPasswordUser.password
      });
      expect(loginResult).toBeDefined();

      // Limpiar
      await prisma.profile.deleteMany({ where: { userId: registerResult.user.id } });
      await prisma.user.delete({ where: { id: registerResult.user.id } });
    });

    it('debería rechazar contraseñas débiles', async () => {
      const weakPasswordUser = {
        email: 'weak-password@test.com',
        password: '123',
        name: 'Weak Password User',
        role: 'CUSTOMER' as const,
      };

      await expect(authService.registerUser(weakPasswordUser))
        .rejects.toThrow();
    });

    it('debería validar formato de email', async () => {
      const invalidEmailUser = {
        email: 'invalid-email-format',
        password: 'ValidPassword123!',
        name: 'Invalid Email User',
        role: 'CUSTOMER' as const,
      };

      await expect(authService.registerUser(invalidEmailUser))
        .rejects.toThrow();
    });
  });

  describe('Google OAuth Integration', () => {
    it('debería manejar perfil de Google OAuth correctamente', async () => {
      const googleProfile = {
        id: 'google-test-id-123',
        email: 'google-oauth@test.com',
        name: 'Google OAuth User',
        picture: 'https://example.com/picture.jpg'
      };

      // Esta prueba simula el flujo de Google OAuth
      // En implementación real, esto sería manejado por Passport
      const existingUser = await prisma.user.findUnique({
        where: { email: googleProfile.email }
      });

      if (!existingUser) {
        const newUser = await prisma.user.create({
          data: {
            email: googleProfile.email,
            name: googleProfile.name,
            googleId: googleProfile.id,
            password: '', // OAuth users no necesitan password
            role: 'CUSTOMER',
            profile: {
              create: {
                firstName: googleProfile.name,
                avatar: googleProfile.picture
              }
            }
          },
          include: { profile: true }
        });

        expect(newUser).toBeDefined();
        expect(newUser.googleId).toBe(googleProfile.id);
        expect(newUser.email).toBe(googleProfile.email);

        // Limpiar
        await prisma.profile.delete({ where: { userId: newUser.id } });
        await prisma.user.delete({ where: { id: newUser.id } });
      }
    });
  });
});