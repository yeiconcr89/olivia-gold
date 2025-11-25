/**
 * Pact Contract Tests - Authentication API
 * Consumer: Frontend React App
 * Provider: Backend API
 */

import { PactV3, MatchersV3, SpecificationVersion } from '@pact-foundation/pact';
import { describe, beforeEach, afterEach, test, expect } from 'vitest';
import axios from 'axios';

const { like, term, regex } = MatchersV3;

const provider = new PactV3({
  consumer: 'olivia-gold-frontend',
  provider: 'olivia-gold-auth-api',
  port: 1235, // Different port for auth API
  dir: './pacts',
  spec: SpecificationVersion.SPECIFICATION_VERSION_V3,
  logLevel: 'info'
});

describe('Authentication API Contract Tests', () => {
  
  beforeEach(() => {
    provider.setup();
  });

  afterEach(async () => {
    await provider.finalize();
  });

  describe('POST /api/auth/login', () => {
    test('should authenticate user with valid credentials', async () => {
      const loginCredentials = {
        email: 'customer@oliviagold.com',
        password: 'SecurePassword123!'
      };

      provider
        .given('user exists with valid credentials')
        .uponReceiving('a login request with valid credentials')
        .withRequest({
          method: 'POST',
          path: '/api/auth/login',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: loginCredentials
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            token: regex({
              matcher: '^[A-Za-z0-9\\-\\._~\\+\\/]+=*$',
              generate: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMifQ.hash'
            }),
            user: {
              id: like('user-123'),
              email: like(loginCredentials.email),
              name: like('Customer User'),
              role: term({
                matcher: 'ADMIN|CUSTOMER',
                generate: 'CUSTOMER'
              }),
              profile: {
                firstName: like('Customer'),
                lastName: like('User'),
                phone: regex({
                  matcher: '^\\+57[0-9]{10}$',
                  generate: '+573001234567'
                }),
                avatar: like(null)
              }
            },
            expiresIn: like('24h'),
            refreshToken: like('refresh-token-123')
          }
        });

      await provider.executeTest(async (mockServer) => {
        const response = await axios.post(`${mockServer.url}/api/auth/login`, loginCredentials, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('token');
        expect(response.data).toHaveProperty('user');
        expect(response.data.user.email).toBe(loginCredentials.email);
        expect(response.data.user.role).toBe('CUSTOMER');
        expect(typeof response.data.token).toBe('string');
        expect(response.data.token.length).toBeGreaterThan(0);
      });
    });

    test('should reject login with invalid credentials', async () => {
      const invalidCredentials = {
        email: 'wrong@email.com',
        password: 'wrongpassword'
      };

      provider
        .given('user does not exist or credentials are invalid')
        .uponReceiving('a login request with invalid credentials')
        .withRequest({
          method: 'POST',
          path: '/api/auth/login',
          headers: { 'Content-Type': 'application/json' },
          body: invalidCredentials
        })
        .willRespondWith({
          status: 401,
          headers: { 'Content-Type': 'application/json' },
          body: {
            error: like('Unauthorized'),
            message: like('Invalid email or password'),
            code: like('INVALID_CREDENTIALS')
          }
        });

      await provider.executeTest(async (mockServer) => {
        try {
          await axios.post(`${mockServer.url}/api/auth/login`, invalidCredentials, {
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error: any) {
          expect(error.response.status).toBe(401);
          expect(error.response.data.error).toBe('Unauthorized');
          expect(error.response.data.code).toBe('INVALID_CREDENTIALS');
        }
      });
    });

    test('should validate email format', async () => {
      const invalidEmailCredentials = {
        email: 'invalid-email-format',
        password: 'ValidPassword123!'
      };

      provider
        .given('invalid email format provided')
        .uponReceiving('a login request with invalid email format')
        .withRequest({
          method: 'POST',
          path: '/api/auth/login',
          headers: { 'Content-Type': 'application/json' },
          body: invalidEmailCredentials
        })
        .willRespondWith({
          status: 400,
          headers: { 'Content-Type': 'application/json' },
          body: {
            error: like('Validation Error'),
            message: like('Invalid email format'),
            details: {
              email: like('Please provide a valid email address')
            }
          }
        });

      await provider.executeTest(async (mockServer) => {
        try {
          await axios.post(`${mockServer.url}/api/auth/login`, invalidEmailCredentials);
        } catch (error: any) {
          expect(error.response.status).toBe(400);
          expect(error.response.data.error).toBe('Validation Error');
          expect(error.response.data.details).toHaveProperty('email');
        }
      });
    });
  });

  describe('POST /api/auth/register', () => {
    test('should register new customer with valid data', async () => {
      const registrationData = {
        email: 'newcustomer@example.com',
        password: 'SecurePassword123!',
        name: 'New Customer',
        role: 'CUSTOMER'
      };

      provider
        .given('email is not already registered')
        .uponReceiving('a registration request with valid data')
        .withRequest({
          method: 'POST',
          path: '/api/auth/register',
          headers: { 'Content-Type': 'application/json' },
          body: registrationData
        })
        .willRespondWith({
          status: 201,
          headers: { 'Content-Type': 'application/json' },
          body: {
            token: like('jwt-token-for-new-user'),
            user: {
              id: like('user-456'),
              email: like(registrationData.email),
              name: like(registrationData.name),
              role: like('CUSTOMER'),
              profile: {
                firstName: like('New'),
                lastName: like('Customer'),
                phone: like(null),
                avatar: like(null)
              },
              createdAt: regex({
                matcher: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}',
                generate: '2024-01-01T10:00:00Z'
              })
            },
            message: like('Registration successful')
          }
        });

      await provider.executeTest(async (mockServer) => {
        const response = await axios.post(`${mockServer.url}/api/auth/register`, registrationData);

        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('token');
        expect(response.data).toHaveProperty('user');
        expect(response.data.user.email).toBe(registrationData.email);
        expect(response.data.user.role).toBe('CUSTOMER');
        expect(response.data).toHaveProperty('message');
      });
    });

    test('should reject registration with existing email', async () => {
      const existingEmailData = {
        email: 'existing@oliviagold.com',
        password: 'AnotherPassword123!',
        name: 'Another User',
        role: 'CUSTOMER'
      };

      provider
        .given('email is already registered')
        .uponReceiving('a registration request with existing email')
        .withRequest({
          method: 'POST',
          path: '/api/auth/register',
          headers: { 'Content-Type': 'application/json' },
          body: existingEmailData
        })
        .willRespondWith({
          status: 409,
          headers: { 'Content-Type': 'application/json' },
          body: {
            error: like('Conflict'),
            message: like('Email already registered'),
            code: like('EMAIL_ALREADY_EXISTS')
          }
        });

      await provider.executeTest(async (mockServer) => {
        try {
          await axios.post(`${mockServer.url}/api/auth/register`, existingEmailData);
        } catch (error: any) {
          expect(error.response.status).toBe(409);
          expect(error.response.data.error).toBe('Conflict');
          expect(error.response.data.code).toBe('EMAIL_ALREADY_EXISTS');
        }
      });
    });

    test('should validate password strength', async () => {
      const weakPasswordData = {
        email: 'test@example.com',
        password: '123',  // Weak password
        name: 'Test User',
        role: 'CUSTOMER'
      };

      provider
        .given('weak password provided')
        .uponReceiving('a registration request with weak password')
        .withRequest({
          method: 'POST',
          path: '/api/auth/register',
          headers: { 'Content-Type': 'application/json' },
          body: weakPasswordData
        })
        .willRespondWith({
          status: 400,
          headers: { 'Content-Type': 'application/json' },
          body: {
            error: like('Validation Error'),
            message: like('Password does not meet requirements'),
            details: {
              password: [
                like('Password must be at least 8 characters long'),
                like('Password must contain at least one uppercase letter'),
                like('Password must contain at least one special character')
              ]
            }
          }
        });

      await provider.executeTest(async (mockServer) => {
        try {
          await axios.post(`${mockServer.url}/api/auth/register`, weakPasswordData);
        } catch (error: any) {
          expect(error.response.status).toBe(400);
          expect(error.response.data.error).toBe('Validation Error');
          expect(error.response.data.details.password).toBeInstanceOf(Array);
          expect(error.response.data.details.password.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('POST /api/auth/refresh', () => {
    test('should refresh token with valid refresh token', async () => {
      const refreshRequest = {
        refreshToken: 'valid-refresh-token-123'
      };

      provider
        .given('valid refresh token exists')
        .uponReceiving('a token refresh request')
        .withRequest({
          method: 'POST',
          path: '/api/auth/refresh',
          headers: { 'Content-Type': 'application/json' },
          body: refreshRequest
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            token: like('new-jwt-token'),
            refreshToken: like('new-refresh-token'),
            expiresIn: like('24h')
          }
        });

      await provider.executeTest(async (mockServer) => {
        const response = await axios.post(`${mockServer.url}/api/auth/refresh`, refreshRequest);

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('token');
        expect(response.data).toHaveProperty('refreshToken');
        expect(response.data).toHaveProperty('expiresIn');
      });
    });

    test('should reject invalid refresh token', async () => {
      const invalidRefreshRequest = {
        refreshToken: 'invalid-or-expired-token'
      };

      provider
        .given('refresh token is invalid or expired')
        .uponReceiving('a token refresh request with invalid token')
        .withRequest({
          method: 'POST',
          path: '/api/auth/refresh',
          headers: { 'Content-Type': 'application/json' },
          body: invalidRefreshRequest
        })
        .willRespondWith({
          status: 401,
          headers: { 'Content-Type': 'application/json' },
          body: {
            error: like('Unauthorized'),
            message: like('Invalid or expired refresh token'),
            code: like('INVALID_REFRESH_TOKEN')
          }
        });

      await provider.executeTest(async (mockServer) => {
        try {
          await axios.post(`${mockServer.url}/api/auth/refresh`, invalidRefreshRequest);
        } catch (error: any) {
          expect(error.response.status).toBe(401);
          expect(error.response.data.code).toBe('INVALID_REFRESH_TOKEN');
        }
      });
    });
  });

  describe('POST /api/auth/logout', () => {
    test('should logout user with valid token', async () => {
      provider
        .given('user is authenticated')
        .uponReceiving('a logout request with valid token')
        .withRequest({
          method: 'POST',
          path: '/api/auth/logout',
          headers: {
            'Authorization': regex({
              matcher: '^Bearer [A-Za-z0-9\\-\\._~\\+\\/]+=*$',
              generate: 'Bearer valid-jwt-token'
            }),
            'Content-Type': 'application/json'
          }
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            message: like('Logout successful'),
            loggedOut: like(true)
          }
        });

      await provider.executeTest(async (mockServer) => {
        const response = await axios.post(`${mockServer.url}/api/auth/logout`, {}, {
          headers: {
            'Authorization': 'Bearer valid-jwt-token',
            'Content-Type': 'application/json'
          }
        });

        expect(response.status).toBe(200);
        expect(response.data.message).toBe('Logout successful');
        expect(response.data.loggedOut).toBe(true);
      });
    });
  });

  describe('GET /api/auth/me', () => {
    test('should return current user info with valid token', async () => {
      provider
        .given('user is authenticated')
        .uponReceiving('a request for current user info')
        .withRequest({
          method: 'GET',
          path: '/api/auth/me',
          headers: {
            'Authorization': like('Bearer valid-jwt-token'),
            'Accept': 'application/json'
          }
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            user: {
              id: like('user-123'),
              email: like('user@oliviagold.com'),
              name: like('Authenticated User'),
              role: term({
                matcher: 'ADMIN|CUSTOMER',
                generate: 'CUSTOMER'
              }),
              profile: {
                firstName: like('Authenticated'),
                lastName: like('User'),
                phone: like('+573001234567'),
                avatar: like('https://example.com/avatar.jpg')
              },
              lastLogin: like('2024-01-01T09:00:00Z'),
              createdAt: like('2023-12-01T10:00:00Z')
            }
          }
        });

      await provider.executeTest(async (mockServer) => {
        const response = await axios.get(`${mockServer.url}/api/auth/me`, {
          headers: {
            'Authorization': 'Bearer valid-jwt-token',
            'Accept': 'application/json'
          }
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('user');
        expect(response.data.user).toHaveProperty('id');
        expect(response.data.user).toHaveProperty('email');
        expect(response.data.user).toHaveProperty('role');
        expect(['ADMIN', 'CUSTOMER']).toContain(response.data.user.role);
      });
    });

    test('should reject request without valid token', async () => {
      provider
        .given('user is not authenticated')
        .uponReceiving('a request for current user info without token')
        .withRequest({
          method: 'GET',
          path: '/api/auth/me'
        })
        .willRespondWith({
          status: 401,
          headers: { 'Content-Type': 'application/json' },
          body: {
            error: like('Unauthorized'),
            message: like('Authentication token required')
          }
        });

      await provider.executeTest(async (mockServer) => {
        try {
          await axios.get(`${mockServer.url}/api/auth/me`);
        } catch (error: any) {
          expect(error.response.status).toBe(401);
          expect(error.response.data.error).toBe('Unauthorized');
        }
      });
    });
  });
});