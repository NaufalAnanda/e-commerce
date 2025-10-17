const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
router.post('/', protect, [
  body('shipping.address.firstName').trim().notEmpty().withMessage('Shipping first name is required'),
  body('shipping.address.lastName').trim().notEmpty().withMessage('Shipping last name is required'),
  body('shipping.address.street').trim().notEmpty().withMessage('Shipping street is required'),
  body('shipping.address.city').trim().notEmpty().withMessage('Shipping city is required'),
  body('shipping.address.state').trim().notEmpty().withMessage('Shipping state is required'),
  body('shipping.address.zipCode').trim().notEmpty().withMessage('Shipping zip code is required'),
  body('shipping.method').trim().notEmpty().withMessage('Shipping method is required'),
  body('payment.method').trim().notEmpty().withMessage('Payment method is required'),
  body('billing.address.firstName').trim().notEmpty().withMessage('Billing first name is required'),
  body('billing.address.lastName').trim().notEmpty().withMessage('Billing last name is required'),
  body('billing.address.street').trim().notEmpty().withMessage('Billing street is required'),
  body('billing.address.city').trim().notEmpty().withMessage('Billing city is required'),
  body('billing.address.state').trim().notEmpty().withMessage('Billing state is required'),
  body('billing.address.zipCode').trim().notEmpty().withMessage('Billing zip code is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Get user's cart
    const cart = await Cart.getOrCreateCart(req.user.id).populate('items.product');

    if (cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Validate all items are still available
    for (const cartItem of cart.items) {
      const product = cartItem.product;
      
      if (!product || product.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: `Product ${product?.name || 'Unknown'} is no longer available`
        });
      }

      if (!product.isInStock(cartItem.quantity)) {
        return res.status(400).json({
          success: false,
          message: `Not enough inventory for ${product.name}`
        });
      }
    }

    // Calculate totals
    const subtotal = cart.subtotal;
    const taxAmount = cart.tax.amount;
    const shippingCost = cart.shippingCost;
    
    let discountAmount = 0;
    if (cart.coupon.code) {
      discountAmount = cart.coupon.type === 'percentage' 
        ? (subtotal * cart.coupon.discount) / 100 
        : cart.coupon.discount;
    }

    const total = subtotal + taxAmount + shippingCost - discountAmount;

    // Create order items
    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      variant: item.variant,
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity
    }));

    // Create order
    const orderData = {
      customer: req.user.id,
      items: orderItems,
      subtotal,
      tax: {
        amount: taxAmount,
        rate: cart.tax.rate,
        details: cart.tax.details || []
      },
      shipping: {
        ...req.body.shipping,
        cost: shippingCost
      },
      billing: req.body.billing,
      payment: {
        ...req.body.payment,
        amount: total,
        status: 'pending'
      },
      discount: cart.coupon.code ? {
        code: cart.coupon.code,
        amount: discountAmount,
        type: cart.coupon.type
      } : {},
      total,
      status: 'pending',
      metadata: {
        source: 'website',
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip || req.connection.remoteAddress
      }
    };

    const order = await Order.create(orderData);

    // Update product inventory
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: {
          'inventory.quantity': -item.quantity,
          'sales.totalSold': item.quantity,
          'sales.totalRevenue': item.price * item.quantity
        }
      });
    }

    // Clear cart after successful order
    await cart.clear();

    // Populate order data
    await order.populate([
      { path: 'customer', select: 'firstName lastName email' },
      { path: 'items.product', select: 'name images price' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating order'
    });
  }
});

// @desc    Get user's orders
// @route   GET /api/orders
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ customer: req.user.id })
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments({ customer: req.user.id });

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching orders'
    });
  }
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'firstName lastName email')
      .populate('items.product', 'name images price description');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns this order or is admin
    if (order.customer._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.json({
      success: true,
      data: {
        order
      }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching order'
    });
  }
});

// @desc    Update order status (Admin only)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
router.put('/:id/status', protect, authorize('admin', 'moderator'), [
  body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).withMessage('Invalid status'),
  body('note').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update order status
    order.updateStatus(status, note, req.user.id);
    await order.save();

    // If order is cancelled, restore inventory
    if (status === 'cancelled' && order.status !== 'cancelled') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: {
            'inventory.quantity': item.quantity,
            'sales.totalSold': -item.quantity,
            'sales.totalRevenue': -(item.price * item.quantity)
          }
        });
      }
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        order
      }
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating order status'
    });
  }
});

// @desc    Cancel order (Customer)
// @route   PUT /api/orders/:id/cancel
// @access  Private
router.put('/:id/cancel', protect, [
  body('reason').optional().trim()
], async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns this order
    if (order.customer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Check if order can be cancelled
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }

    // Update order status
    order.updateStatus('cancelled', reason || 'Cancelled by customer', req.user.id);
    await order.save();

    // Restore inventory
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: {
          'inventory.quantity': item.quantity,
          'sales.totalSold': -item.quantity,
          'sales.totalRevenue': -(item.price * item.quantity)
        }
      });
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: {
        order
      }
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error cancelling order'
    });
  }
});

// @desc    Get all orders (Admin)
// @route   GET /api/orders/admin/all
// @access  Private/Admin
router.get('/admin/all', protect, authorize('admin', 'moderator'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.customer) filter.customer = req.query.customer;
    if (req.query.startDate && req.query.endDate) {
      filter.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const orders = await Order.find(filter)
      .populate('customer', 'firstName lastName email')
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching orders'
    });
  }
});

// @desc    Get order statistics (Admin)
// @route   GET /api/orders/admin/stats
// @access  Private/Admin
router.get('/admin/stats', protect, authorize('admin', 'moderator'), async (req, res) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

    const stats = await Order.getStats(startDate, endDate);

    res.json({
      success: true,
      data: {
        stats: stats[0] || {
          totalOrders: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          ordersByStatus: []
        }
      }
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching order statistics'
    });
  }
});

module.exports = router;
