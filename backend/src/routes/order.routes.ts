import { Router } from 'express';
import { OrderService } from '../services/order.service';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = Router();

// Listar pedidos (solo admin)
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { page = '1', limit = '10', status, startDate, endDate, search } = req.query;
    
    const result = await OrderService.listOrders({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      status: status as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      searchTerm: search as string
    });

    res.json(result);
  } catch (error) {
    console.error('Error listing orders:', error);
    res.status(500).json({ error: 'Error al listar los pedidos' });
  }
});

// Crear nuevo pedido
router.post('/', async (req, res) => {
  try {
    const order = await OrderService.createOrder(req.body);
    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Datos de pedido inválidos', details: error.errors });
    } else {
      res.status(500).json({ error: 'Error al crear el pedido' });
    }
  }
});

// Obtener pedido por número
router.get('/:orderNumber', authenticateToken, async (req, res) => {
  try {
    const order = await OrderService.getOrderByNumber(req.params.orderNumber);
    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    
    // Solo permitir ver el pedido al admin o al cliente que lo hizo
    if (!req.user.isAdmin && order.customerEmail !== req.user.email) {
      return res.status(403).json({ error: 'No tienes permiso para ver este pedido' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Error al obtener el pedido' });
  }
});

// Actualizar estado del pedido (solo admin)
router.patch('/:orderNumber/status', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await OrderService.updateOrderStatus(req.params.orderNumber, status);
    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Error al actualizar el estado del pedido' });
  }
});

export default router;