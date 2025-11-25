
import express, { Response } from 'express';
import { z } from 'zod';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validate, validateParams, validateQuery } from '../middleware/validation';
import { logger } from '../utils/logger';
import * as customerService from '../services/customer.service';

const router = express.Router();

// ============================================================================
// ESQUEMAS DE VALIDACIÓN
// ============================================================================

const createCustomerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'El teléfono debe tener al menos 10 caracteres'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'VIP']).default('ACTIVE'),
  birthDate: z.string().datetime().optional(),
  preferences: z.array(z.string()).default([]),
  notes: z.string().optional(),
  addresses: z.array(z.object({
    street: z.string().min(1, 'La calle es requerida'),
    city: z.string().min(1, 'La ciudad es requerida'),
    state: z.string().min(1, 'El estado es requerido'),
    zipCode: z.string().min(1, 'El código postal es requerido'),
    country: z.string().default('Colombia'),
    isDefault: z.boolean().default(false)
  })).min(1, 'Al menos una dirección es requerida')
});

const updateCustomerSchema = createCustomerSchema.partial();

const customerQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('20'),
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'VIP']).optional(),
  sortBy: z.enum(['name', 'email', 'registrationDate', 'totalSpent']).default('registrationDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// ============================================================================
// RUTAS PRIVADAS (ADMIN)
// ============================================================================

/**
 * @route   GET /api/customers
 * @desc    Obtener lista de clientes con filtros y paginación
 * @access  Private (Admin)
 */
router.get('/', 
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  validateQuery(customerQuerySchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const query = customerQuerySchema.parse(req.query);
      const { customers, pagination } = await customerService.getAllCustomers(query);
      res.json({ customers, pagination });
    } catch (error) {
      logger.error('Error obteniendo clientes:', error);
      throw error; // Re-lanzar el error para que sea capturado por el middleware
    }
  }
);

/**
 * @route   GET /api/customers/:id
 * @desc    Obtener cliente por ID
 * @access  Private (Admin)
 */
router.get('/:id',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  validateParams(z.object({ id: z.string().cuid() })),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const customer = await customerService.getCustomerById(id);
      res.json(customer);
    } catch (error) {
      logger.error('Error obteniendo cliente:', error);
      throw error; // Re-lanzar el error para que sea capturado por el middleware
    }
  }
);

/**
 * @route   POST /api/customers
 * @desc    Crear nuevo cliente
 * @access  Private (Admin)
 */
router.post('/',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  validate(createCustomerSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const customerData = req.body;
      const customer = await customerService.createCustomer(customerData);
      res.status(201).json({
        message: 'Cliente creado exitosamente',
        customer,
      });
    } catch (error) {
      logger.error('Error creando cliente:', error);
      // El middleware de errores global manejará los errores específicos
      // No es necesario devolver un res.status(500) aquí, ya que el middleware lo hará
      throw error; // Re-lanzar el error para que sea capturado por el middleware
    }
  }
);

/**
 * @route   PUT /api/customers/:id
 * @desc    Actualizar cliente
 * @access  Private (Admin)
 */
router.put('/:id',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  validateParams(z.object({ id: z.string().cuid() })),
  validate(updateCustomerSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updatedCustomer = await customerService.updateCustomer(id, updateData);
      res.json({
        message: 'Cliente actualizado exitosamente',
        customer: updatedCustomer,
      });
    } catch (error) {
      logger.error('Error actualizando cliente:', error);
      throw error; // Re-lanzar el error para que sea capturado por el middleware
    }
  }
);

/**
 * @route   DELETE /api/customers/:id
 * @desc    Eliminar cliente
 * @access  Private (Admin)
 */
router.delete('/:id',
  authenticate,
  authorize(['ADMIN']),
  validateParams(z.object({ id: z.string().cuid() })),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      await customerService.deleteCustomer(id);
      res.json({ message: 'Cliente eliminado exitosamente' });
    } catch (error) {
      logger.error('Error eliminando cliente:', error);
      throw error; // Re-lanzar el error para que sea capturado por el middleware
    }
  }
);

/**
 * @route   GET /api/customers/stats/overview
 * @desc    Obtener estadísticas de clientes
 * @access  Private (Admin/Manager)
 */
router.get('/stats/overview', 
  authenticate, 
  authorize(['ADMIN', 'MANAGER']), 
  async (req: AuthRequest, res: Response) => {
    try {
      const stats = await customerService.getCustomerOverviewStats();
      res.json(stats);
    } catch (error) {
      logger.error('Error obteniendo estadísticas de clientes:', error);
      throw error; // Re-lanzar el error para que sea capturado por el middleware
    }
  }
);

export default router;
