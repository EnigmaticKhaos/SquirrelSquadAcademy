import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';

// Load test environment variables
// Resolve path relative to the backend directory (project root for tests)
const envPath = path.resolve(process.cwd(), '.env.test');
const result = dotenv.config({ path: envPath });

// Log if .env.test was loaded successfully
if (result.error) {
  console.warn(`⚠ Failed to load .env.test: ${result.error.message}`);
  console.warn(`⚠ Looking for .env.test at: ${envPath}`);
} else if (result.parsed) {
  console.log(`✓ Loaded .env.test from: ${envPath}`);
}

// Set test environment
process.env.NODE_ENV = 'test';

// Mock logger to avoid console output during tests
// @ts-ignore - jest globals are available in test environment
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// Global test setup
// @ts-ignore - jest globals are available in test environment
beforeAll(async () => {
  // Connect to test database
  if (process.env.MONGODB_TEST_URI) {
    try {
      // Disconnect if already connected
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      
      await mongoose.connect(process.env.MONGODB_TEST_URI, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 10000,
        connectTimeoutMS: 10000,
      });
      console.log('✓ Test database connected successfully');
    } catch (error: any) {
      // If connection fails, tests that require DB will fail gracefully
      const errorMessage = error?.message || 'Unknown error';
      console.warn(`⚠ Test database connection failed: ${errorMessage}`);
      console.warn('⚠ Some integration tests may be skipped');
      console.warn('⚠ Make sure MongoDB is running or MONGODB_TEST_URI is set correctly');
    }
  } else {
    console.warn('⚠ MONGODB_TEST_URI not set, some integration tests may be skipped');
    console.warn(`⚠ Looking for .env.test at: ${envPath}`);
    console.warn('⚠ Create a .env.test file with MONGODB_TEST_URI=mongodb://localhost:27018/squirrelsquadacademy_test');
    console.warn('⚠ Note: Docker setup uses port 27018, local MongoDB uses 27017');
  }
}, 15000); // 15 second timeout

// Global test teardown
// @ts-ignore - jest globals are available in test environment
afterAll(async () => {
  // Close database connection
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    console.log('✓ Test database connection closed');
  }
});

// Clean up after each test
// @ts-ignore - jest globals are available in test environment
afterEach(async () => {
  // Clear all collections only if connected
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      try {
        await collections[key].deleteMany({});
      } catch (error) {
        // Ignore errors during cleanup
      }
    }
  }
});
