import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config/config';
import { validate } from '../middleware/validation';
import { authenticate, AuthRequest } from '../middleware/auth';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiting';
import { logger } from '../utils/logger';
import { prisma } from '../utils/prisma';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import passport from '../config/passport';
import SecurityLogger from '../middleware/securityLogger';

const router = express.Router();

// ============================================================================
// ESQUEMAS DE VALIDACIÓN
// ============================================================================

const registerSchema = z.object({
  email: z.string().email('Debe ser un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email('Debe ser un email válido'),
  password: z.string().min(1, 'La contraseña es requerida')
});

// ============================================================================
// UTILIDADES
// ============================================================================

const generateToken = (userId: string) => {
  return jwt.sign(
    { userId },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

// ============================================================================
// RUTAS
// ============================================================================

/**
 * @route   POST /api/auth/register
 * @desc    Registrar nuevo usuario
 * @access  Public
 */
router.post('/register', authLimiter, async (req, res) => {
  try {
    const userData = registerSchema.parse(req.body);

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'Ya existe un usuario con este email'
      });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Crear usuario con perfil (inactivo hasta verificar email)
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        role: 'CUSTOMER',
        isActive: false,
        profile: {
          create: {
            name: userData.name,
            phone: userData.phone
          }
        }
      },
      include: {
        profile: true
      }
    });

    // Audit log: registro de usuario
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'REGISTER',
        tableName: 'User',
        recordId: user.id,
        newValues: user,
      },
    });

    // Generar token de verificación
    const emailToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 horas
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token: emailToken,
        expiresAt: expires,
      },
    });

    // Enviar email de verificación (omitir en entorno de pruebas)
    if (!config.isTest) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${emailToken}`;
      await transporter.sendMail({
        from: 'Olivia Gold <no-reply@oliviagold.com>',
        to: userData.email,
        subject: 'Verifica tu cuenta',
        html: `<p>Gracias por registrarte. Haz clic en el siguiente enlace para verificar tu cuenta:</p>
               <a href="${verifyUrl}">${verifyUrl}</a>
               <p>Este enlace expirará en 24 horas.</p>`,
      });
    } else {
      logger.info(`(TEST) Envío de email omitido para ${userData.email}`);
    }

    logger.info(`Nuevo usuario registrado (pendiente verificación): ${userData.email}`);

    res.status(201).json({
      message: 'Usuario registrado exitosamente. Revisa tu correo para verificar tu cuenta.',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Datos inválidos', 
        details: error.errors 
      });
    }
    logger.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * @route   GET /api/auth/validate
 * @desc    Validar token y devolver datos de usuario
 * @access  Private
 */
router.get('/validate', authenticate, async (req: AuthRequest, res) => {
  try {
    // El middleware `authenticate` ya ha validado el token y adjuntado el usuario a `req.user`
    if (!req.user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Obtener datos completos del usuario incluyendo el profile
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        profile: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Usuario no válido o inactivo'
      });
    }

    res.status(200).json({
      message: 'Token válido',
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error) {
    logger.error('Error en validación de token:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión
 * @access  Public
 */
router.post('/login', authLimiter, async (req, res) => {
  try {
    const loginData = loginSchema.parse(req.body);

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email: loginData.email },
      include: {
        profile: true
      }
    });

    if (!user) {
      // Log intento de login con email inexistente
      await SecurityLogger.logLoginFailed(req, loginData.email, 'User not found');
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(loginData.password, user.password);

    if (!isValidPassword) {
      // Log intento de login con contraseña incorrecta
      await SecurityLogger.logLoginFailed(req, loginData.email, 'Invalid password');
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }

    // Verificar que el usuario esté activo
    if (!user.isActive) {
      // Log intento de login con cuenta inactiva
      await SecurityLogger.logLoginFailed(req, loginData.email, 'Account disabled');
      return res.status(401).json({
        error: 'Cuenta desactivada'
      });
    }

    // Generar token
    const token = generateToken(user.id);

    // Log login exitoso
    await SecurityLogger.logLoginSuccess(req, user.id, loginData.email);
    logger.info(`Usuario autenticado: ${loginData.email}`);

    // Audit log: login
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        tableName: 'User',
        recordId: user.id,
        newValues: { email: user.email },
      },
    });

    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Datos inválidos', 
        details: error.errors 
      });
    }
    logger.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Obtener información del usuario actual
 * @access  Private
 */
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token de acceso requerido'
      });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as any;
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          profile: true
        }
      });

      if (!user || !user.isActive) {
        return res.status(401).json({
          error: 'Usuario no válido o inactivo'
        });
      }

      res.json({ user });
    } catch (jwtError) {
      return res.status(401).json({
        error: 'Token inválido'
      });
    }
  } catch (error) {
    logger.error('Error obteniendo perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


/**
 * @route   POST /api/auth/logout
 * @desc    Cerrar sesión (invalidar token)
 * @access  Private
 */
router.post('/logout', authenticate, async (req: AuthRequest, res) => {
  try {
    // Audit log: logout
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'LOGOUT',
        tableName: 'User',
        recordId: req.user!.id,
        newValues: { email: req.user!.email },
      },
    });

    logger.info(`Usuario cerró sesión: ${req.user!.email}`);

    res.json({ 
      message: 'Sesión cerrada correctamente'
    });
  } catch (error) {
    logger.error('Error en logout:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Renovar token
 * @access  Private
 */
router.post('/refresh', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token de acceso requerido'
      });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as any;
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          isActive: true
        }
      });

      if (!user || !user.isActive) {
        return res.status(401).json({
          error: 'Usuario no válido o inactivo'
        });
      }

      const newToken = generateToken(user.id);

      res.json({
        message: 'Token renovado exitosamente',
        token: newToken
      });
    } catch (jwtError) {
      return res.status(401).json({
        error: 'Token inválido'
      });
    }
  } catch (error) {
    logger.error('Error renovando token:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * @route   GET /api/auth/verify-email
 * @desc    Verificar email de usuario
 * @access  Public
 */
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Token de verificación requerido' });
  }

  const emailToken = await prisma.emailVerificationToken.findUnique({ where: { token } });
  if (!emailToken || emailToken.expiresAt < new Date()) {
    return res.status(400).json({ error: 'Token inválido o expirado' });
  }

  // Activar usuario
  await prisma.user.update({
    where: { id: emailToken.userId },
    data: { isActive: true },
  });

  // Audit log: verificación de email
  await prisma.auditLog.create({
    data: {
      userId: emailToken.userId,
      action: 'VERIFY_EMAIL',
      tableName: 'User',
      recordId: emailToken.userId,
      newValues: { isActive: true },
    },
  });

  // Eliminar token usado
  await prisma.emailVerificationToken.delete({ where: { token } });

  res.json({ message: 'Cuenta verificada exitosamente. Ya puedes iniciar sesión.' });
});

// Solicitar recuperación de contraseña
router.post('/forgot-password', passwordResetLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requerido' });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(200).json({ message: 'Si el email existe, se enviará un enlace de recuperación.' });

  // Generar token seguro
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 minutos

  // Guardar token en la base de datos
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: expires,
    },
  });

  // Configura tu transportador de nodemailer
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: 'Olivia Gold <no-reply@oliviagold.com>',
    to: email,
    subject: 'Recupera tu contraseña',
    html: `<p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
           <a href="${resetUrl}">${resetUrl}</a>
           <p>Este enlace expirará en 30 minutos.</p>`,
  });

  res.json({ message: 'Si el email existe, se enviará un enlace de recuperación.' });
});

// Restablecer contraseña
router.post('/reset-password', passwordResetLimiter, async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token y nueva contraseña requeridos' });

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!resetToken || resetToken.expiresAt < new Date()) {
    return res.status(400).json({ error: 'Token inválido o expirado' });
  }

  // Hashea la nueva contraseña
  const hashedPassword = await bcrypt.hash(password, 12);

  // Actualiza la contraseña del usuario
  await prisma.user.update({
    where: { id: resetToken.userId },
    data: { password: hashedPassword },
  });

  // Audit log: recuperación de contraseña
  await prisma.auditLog.create({
    data: {
      userId: resetToken.userId,
      action: 'RESET_PASSWORD',
      tableName: 'User',
      recordId: resetToken.userId,
      newValues: {},
    },
  });

  // Elimina el token usado
  await prisma.passwordResetToken.delete({ where: { token } });

  res.json({ message: 'Contraseña restablecida exitosamente' });
});

/**
 * @route   POST /api/auth/change-password
 * @desc    Cambiar contraseña desde el perfil (requiere autenticación)
 * @access  Private
 */
router.post('/change-password', authenticate, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Debes ingresar la contraseña actual y la nueva contraseña.' });
    }

    // Buscar usuario autenticado
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    // Verificar contraseña actual
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta.' });
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Audit log: cambio de contraseña
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CHANGE_PASSWORD',
        tableName: 'User',
        recordId: user.id,
        newValues: {},
      },
    });

    logger.info(`Contraseña cambiada para usuario ${user.email}`);
    res.json({ message: 'Contraseña actualizada exitosamente.' });
  } catch (error) {
    logger.error('Error cambiando contraseña:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * @route   GET /api/auth/google
 * @desc    Iniciar autenticación con Google
 * @access  Public
 */
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

/**
 * @route   GET /api/auth/google/callback
 * @desc    Callback de Google OAuth
 * @access  Public
 */
router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      const user = req.user as any;
      
      if (!user) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_auth_failed`);
      }

      // Generar JWT token
      const token = generateToken(user.id);

      // Audit log: login con Google
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'GOOGLE_LOGIN',
          tableName: 'User',
          recordId: user.id,
          newValues: { email: user.email, provider: 'google' },
        },
      });

      logger.info(`Usuario autenticado con Google: ${user.email}`);

      // Redirigir al frontend con el token
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile
      }))}`);

    } catch (error) {
      logger.error('Error en callback de Google:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=server_error`);
    }
  }
);

/**
 * @route   POST /api/auth/google/verify
 * @desc    Verificar token de Google desde el frontend
 * @access  Public
 */
router.post('/google/verify', async (req, res) => {
  // Asegurar headers JSON
  res.setHeader('Content-Type', 'application/json');
  
  try {
    logger.info('Iniciando verificación de Google', { body: req.body });
    
    const { token, email, name, googleId } = req.body;

    if (!token || !email || !googleId) {
      logger.error('Faltan datos requeridos para Google verification', { token: !!token, email: !!email, googleId: !!googleId });
      return res.status(400).json({
        error: 'Token, email y Google ID son requeridos'
      });
    }

    // Verificar con Google (esto lo harías normalmente, aquí simplificamos)
    // En producción deberías verificar el token con Google

    // Buscar o crear usuario
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { googleId: googleId }
        ]
      },
      include: {
        profile: true
      }
    });

    if (user) {
      // Actualizar Google ID si no existe
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: googleId },
          include: { profile: true }
        });
      }
    } else {
      // Crear nuevo usuario
      user = await prisma.user.create({
        data: {
          email: email,
          googleId: googleId,
          password: '',
          role: 'CUSTOMER',
          isActive: true,
          profile: {
            create: {
              name: name || 'Usuario Google',
              phone: null
            }
          }
        },
        include: {
          profile: true
        }
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'GOOGLE_REGISTER',
          tableName: 'User',
          recordId: user.id,
          newValues: { email: user.email, provider: 'google' },
        },
      });
    }

    // Generar JWT
    const jwtToken = generateToken(user.id);

    logger.info(`Usuario autenticado con Google (frontend): ${email}`);

    res.status(200).json({
      message: 'Autenticación con Google exitosa',
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile
      }
    });

  } catch (error) {
    logger.error('Error en verificación de Google:', error);
    
    // Asegurar que el error también tenga headers JSON
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

export default router;