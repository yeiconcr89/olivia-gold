import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { logger } from '../utils/logger';
import { prisma } from '../utils/prisma';
import { BadRequestError, InternalServerError } from '../utils/errors';

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value;
    const name = profile.displayName;
    const googleId = profile.id;
    
    if (!email) {
      return done(new BadRequestError('No se pudo obtener el email de Google'), false);
    }

    // Buscar usuario existente por email o Google ID
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
      // Si el usuario existe pero no tiene Google ID, actualizarlo
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: googleId },
          include: { profile: true }
        });
      }

      logger.info(`Usuario autenticado con Google: ${email}`);
      return done(null, user);
    }

    // Crear nuevo usuario con Google
    user = await prisma.user.create({
      data: {
        email: email,
        googleId: googleId,
        password: null, // No se necesita password para usuarios de Google
        role: 'CUSTOMER',
        isActive: true, // Google users are auto-verified
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

    // Audit log: registro con Google
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'GOOGLE_REGISTER',
        tableName: 'User',
        recordId: user.id,
        newValues: { email: user.email, provider: 'google' },
      },
    });

    logger.info(`Nuevo usuario registrado con Google: ${email}`);
    return done(null, user);

  } catch (error) {
    logger.error('Error en autenticación Google:', error);
    return done(new InternalServerError('Error en autenticación Google'), false);
  }
}));

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { profile: true }
    });
    done(null, user);
  } catch (error) {
    done(new InternalServerError('Error al deserializar usuario'), null);
  }
});

export default passport;