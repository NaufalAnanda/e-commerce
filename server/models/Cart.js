const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  variant: {
    name: String,
    options: [{
      name: String,
      value: String
    }]
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    max: [100, 'Maximum quantity per item is 100']
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  coupon: {
    code: String,
    discount: {
      type: Number,
      default: 0
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'fixed'
    },
    appliedAt: Date,
    expiresAt: Date
  },
  shippingMethod: {
    type: String,
    default: 'standard'
  },
  shippingCost: {
    type: Number,
    default: 0
  },
  tax: {
    amount: {
      type: Number,
      default: 0
    },
    rate: {
      type: Number,
      default: 0
    }
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    }
  }
}, {
  timestamps: true
});

// Indexes
cartSchema.index({ user: 1 });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for cart totals
cartSchema.virtual('subtotal').get(function() {
  return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
});

cartSchema.virtual('total').get(function() {
  const subtotal = this.subtotal;
  const discount = this.coupon.discount || 0;
  const discountAmount = this.coupon.type === 'percentage' 
    ? (subtotal * discount) / 100 
    : discount;
  return subtotal + this.shippingCost + this.tax.amount - discountAmount;
});

cartSchema.virtual('itemCount').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Method to add item to cart
cartSchema.methods.addItem = function(productId, variant, quantity = 1, price) {
  const existingItemIndex = this.items.findIndex(item => 
    item.product.toString() === productId.toString() && 
    JSON.stringify(item.variant) === JSON.stringify(variant)
  );
  
  if (existingItemIndex >= 0) {
    this.items[existingItemIndex].quantity += quantity;
    this.items[existingItemIndex].addedAt = new Date();
  } else {
    this.items.push({
      product: productId,
      variant: variant,
      quantity: quantity,
      price: price,
      addedAt: new Date()
    });
  }
  
  return this.save();
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = function(productId, variant, quantity) {
  const item = this.items.find(item => 
    item.product.toString() === productId.toString() && 
    JSON.stringify(item.variant) === JSON.stringify(variant)
  );
  
  if (item) {
    if (quantity <= 0) {
      this.items = this.items.filter(item => 
        !(item.product.toString() === productId.toString() && 
          JSON.stringify(item.variant) === JSON.stringify(variant))
      );
    } else {
      item.quantity = quantity;
    }
  }
  
  return this.save();
};

// Method to remove item from cart
cartSchema.methods.removeItem = function(productId, variant) {
  this.items = this.items.filter(item => 
    !(item.product.toString() === productId.toString() && 
      JSON.stringify(item.variant) === JSON.stringify(variant))
  );
  
  return this.save();
};

// Method to clear cart
cartSchema.methods.clear = function() {
  this.items = [];
  this.coupon = {};
  return this.save();
};

// Method to apply coupon
cartSchema.methods.applyCoupon = function(couponCode, discount, type, expiresAt) {
  this.coupon = {
    code: couponCode,
    discount: discount,
    type: type,
    appliedAt: new Date(),
    expiresAt: expiresAt
  };
  
  return this.save();
};

// Method to remove coupon
cartSchema.methods.removeCoupon = function() {
  this.coupon = {};
  return this.save();
};

// Static method to get or create cart for user
cartSchema.statics.getOrCreateCart = async function(userId) {
  let cart = await this.findOne({ user: userId }).populate('items.product');
  
  if (!cart) {
    cart = new this({ user: userId });
    await cart.save();
  }
  
  return cart;
};

// Static method to clean expired carts
cartSchema.statics.cleanExpiredCarts = async function() {
  return await this.deleteMany({ expiresAt: { $lt: new Date() } });
};

module.exports = mongoose.model('Cart', cartSchema);
