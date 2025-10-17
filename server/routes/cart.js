const express = require('express');
const { body, validationResult } = require('express-validator');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const cart = await Cart.getOrCreateCart(req.user.id);
    
    res.json({
      success: true,
      data: {
        cart
      }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching cart'
    });
  }
});

// @desc    Add item to cart
// @route   POST /api/cart/items
// @access  Private
router.post('/items', protect, [
  body('productId').isMongoId().withMessage('Valid product ID is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('variant').optional().isObject().withMessage('Variant must be an object')
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

    const { productId, quantity, variant } = req.body;

    // Check if product exists and is available
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Product is not available'
      });
    }

    // Check inventory
    if (!product.isInStock(quantity)) {
      return res.status(400).json({
        success: false,
        message: 'Product is out of stock'
      });
    }

    // Get or create cart
    const cart = await Cart.getOrCreateCart(req.user.id);

    // Add item to cart
    await cart.addItem(productId, variant, quantity, product.price);

    // Populate the updated cart
    await cart.populate('items.product');

    res.json({
      success: true,
      message: 'Item added to cart successfully',
      data: {
        cart
      }
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding item to cart'
    });
  }
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/items/:itemId
// @access  Private
router.put('/items/:itemId', protect, [
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be non-negative')
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

    const { quantity } = req.body;
    const cart = await Cart.getOrCreateCart(req.user.id);

    // Find the item in cart
    const item = cart.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    // Check product availability for new quantity
    if (quantity > 0) {
      const product = await Product.findById(item.product);
      if (!product.isInStock(quantity)) {
        return res.status(400).json({
          success: false,
          message: 'Not enough inventory available'
        });
      }
    }

    // Update quantity
    await cart.updateItemQuantity(item.product, item.variant, quantity);

    // Populate the updated cart
    await cart.populate('items.product');

    res.json({
      success: true,
      message: 'Cart item updated successfully',
      data: {
        cart
      }
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating cart item'
    });
  }
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/items/:itemId
// @access  Private
router.delete('/items/:itemId', protect, async (req, res) => {
  try {
    const cart = await Cart.getOrCreateCart(req.user.id);

    // Find the item in cart
    const item = cart.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    // Remove item
    await cart.removeItem(item.product, item.variant);

    // Populate the updated cart
    await cart.populate('items.product');

    res.json({
      success: true,
      message: 'Item removed from cart successfully',
      data: {
        cart
      }
    });
  } catch (error) {
    console.error('Remove cart item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error removing cart item'
    });
  }
});

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
router.delete('/', protect, async (req, res) => {
  try {
    const cart = await Cart.getOrCreateCart(req.user.id);
    await cart.clear();

    res.json({
      success: true,
      message: 'Cart cleared successfully',
      data: {
        cart
      }
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error clearing cart'
    });
  }
});

// @desc    Apply coupon to cart
// @route   POST /api/cart/coupon
// @access  Private
router.post('/coupon', protect, [
  body('code').trim().notEmpty().withMessage('Coupon code is required')
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

    const { code } = req.body;

    // In a real application, you would validate the coupon against a database
    // For now, we'll implement a simple validation
    const validCoupons = {
      'WELCOME10': { discount: 10, type: 'percentage' },
      'SAVE20': { discount: 20, type: 'fixed' },
      'FREESHIP': { discount: 0, type: 'fixed' }
    };

    const coupon = validCoupons[code.toUpperCase()];
    if (!coupon) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coupon code'
      });
    }

    const cart = await Cart.getOrCreateCart(req.user.id);
    
    // Check if cart has items
    if (cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Apply coupon
    await cart.applyCoupon(
      code.toUpperCase(),
      coupon.discount,
      coupon.type,
      new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    );

    // Populate the updated cart
    await cart.populate('items.product');

    res.json({
      success: true,
      message: 'Coupon applied successfully',
      data: {
        cart
      }
    });
  } catch (error) {
    console.error('Apply coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error applying coupon'
    });
  }
});

// @desc    Remove coupon from cart
// @route   DELETE /api/cart/coupon
// @access  Private
router.delete('/coupon', protect, async (req, res) => {
  try {
    const cart = await Cart.getOrCreateCart(req.user.id);
    await cart.removeCoupon();

    // Populate the updated cart
    await cart.populate('items.product');

    res.json({
      success: true,
      message: 'Coupon removed successfully',
      data: {
        cart
      }
    });
  } catch (error) {
    console.error('Remove coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error removing coupon'
    });
  }
});

module.exports = router;
