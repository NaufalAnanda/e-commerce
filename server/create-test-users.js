const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// User schema (simplified version)
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'user' },
  isActive: { type: Boolean, default: true }
});

const User = mongoose.model('User', userSchema);

async function createTestUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');
    console.log('Connected to MongoDB');

    // Create test users
    const users = [
      {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: await bcrypt.hash('password123', 12),
        role: 'admin'
      },
      {
        firstName: 'Test',
        lastName: 'User',
        email: 'user@example.com',
        password: await bcrypt.hash('password123', 12),
        role: 'user'
      }
    ];

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Insert test users
    const createdUsers = await User.insertMany(users);
    console.log('Created test users:');
    createdUsers.forEach(user => {
      console.log(`- ${user.email} (${user.role})`);
    });

    console.log('\nTest credentials:');
    console.log('Admin: admin@example.com / password123');
    console.log('User: user@example.com / password123');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestUsers();
