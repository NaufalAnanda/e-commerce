const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true,
    maxlength: [100, 'Category name cannot be more than 100 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  image: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  level: {
    type: Number,
    default: 0,
    min: 0,
    max: 3
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  seo: {
    title: String,
    description: String,
    keywords: [String]
  },
  filters: [{
    name: String,
    type: {
      type: String,
      enum: ['text', 'number', 'select', 'multiselect', 'range', 'boolean'],
      default: 'text'
    },
    options: [String],
    isRequired: {
      type: Boolean,
      default: false
    }
  }],
  productCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1, isActive: 1 });
categorySchema.index({ level: 1, sortOrder: 1 });

// Virtual for children categories
categorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent'
});

// Virtual for full path
categorySchema.virtual('fullPath').get(function() {
  return this.slug;
});

// Method to generate slug from name
categorySchema.methods.generateSlug = function() {
  return this.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// Pre-save middleware to generate slug
categorySchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.generateSlug();
  }
  next();
});

// Static method to get category tree
categorySchema.statics.getTree = function() {
  return this.find({ isActive: true })
    .sort({ level: 1, sortOrder: 1 })
    .populate('children');
};

// Static method to get breadcrumb
categorySchema.statics.getBreadcrumb = async function(categoryId) {
  const breadcrumb = [];
  let current = await this.findById(categoryId);
  
  while (current) {
    breadcrumb.unshift({
      id: current._id,
      name: current.name,
      slug: current.slug
    });
    current = await this.findById(current.parent);
  }
  
  return breadcrumb;
};

module.exports = mongoose.model('Category', categorySchema);
