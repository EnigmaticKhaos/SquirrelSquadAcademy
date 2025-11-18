# Testing Guide

This document provides comprehensive information about testing in SquirrelSquad Academy.

## Test Structure

```
backend/src/tests/
├── setup.ts                    # Global test setup
├── helpers/
│   └── testHelpers.ts          # Test utility functions
├── unit/                       # Unit tests
│   └── utils/
│       └── validation.test.ts
└── integration/                # Integration tests
    ├── auth.test.ts
    ├── achievements.test.ts
    ├── badges.test.ts
    ├── messaging.test.ts
    ├── grading.test.ts
    ├── rateLimiting.test.ts
    └── security.test.ts
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run specific test file
npm test -- achievements.test.ts
```

## Test Environment Setup

### Option 1: Using Docker (Recommended)

1. Start MongoDB test container:
```bash
docker-compose -f docker-compose.test.yml up -d
```

2. Create `.env.test` file in `backend/` directory:
```env
NODE_ENV=test
MONGODB_TEST_URI=mongodb://localhost:27018/squirrelsquadacademy_test
JWT_SECRET=test_jwt_secret
ENCRYPTION_KEY=test_encryption_key_64_characters_long_hex_string_here
```

3. Run tests:
```bash
cd backend
npm test
```

4. Stop MongoDB test container when done:
```bash
docker-compose -f docker-compose.test.yml down
```

**Note**: The Docker setup uses port `27018` to avoid conflicts with a local MongoDB instance on the default port `27017`.

### Option 2: Local MongoDB Instance

1. Ensure MongoDB is running locally on port 27017

2. Create `.env.test` file in `backend/` directory:
```env
NODE_ENV=test
MONGODB_TEST_URI=mongodb://localhost:27017/squirrelsquadacademy_test
JWT_SECRET=test_jwt_secret
ENCRYPTION_KEY=test_encryption_key_64_characters_long_hex_string_here
```

3. Run tests:
```bash
cd backend
npm test
```

### Option 3: Remote MongoDB Atlas (Test Cluster)

1. Create `.env.test` file in `backend/` directory:
```env
NODE_ENV=test
MONGODB_TEST_URI=mongodb+srv://username:password@cluster.mongodb.net/squirrelsquadacademy_test
JWT_SECRET=test_jwt_secret
ENCRYPTION_KEY=test_encryption_key_64_characters_long_hex_string_here
```

2. Run tests:
```bash
cd backend
npm test
```

## Test Categories

### Unit Tests

Test individual functions and utilities in isolation:

- **Validation Tests**: Input sanitization, email validation, password strength
- **Utility Tests**: Helper functions, formatters, calculators
- **Service Tests**: Business logic without database/API calls

### Integration Tests

Test API endpoints and database interactions:

- **Authentication Tests**: Registration, login, password reset
- **Achievement Tests**: Unlock validation, progress tracking
- **Badge Tests**: Badge unlocking, profile card selection
- **Messaging Tests**: Message encryption/decryption, real-time delivery
- **Grading Tests**: AI grading consistency, rubric application
- **Security Tests**: XSS protection, NoSQL injection prevention, rate limiting

## Writing Tests

### Example: Unit Test

```typescript
import { sanitizeString } from '../../utils/validation';

describe('sanitizeString', () => {
  it('should sanitize XSS attempts', () => {
    const malicious = '<script>alert("xss")</script>';
    const sanitized = sanitizeString(malicious);
    expect(sanitized).not.toContain('<script>');
  });
});
```

### Example: Integration Test

```typescript
import request from 'supertest';
import app from '../../server';
import { createTestUser, getAuthHeaders } from '../helpers/testHelpers';

describe('GET /api/users/:id', () => {
  it('should get user profile', async () => {
    const user = await createTestUser();
    const headers = getAuthHeaders(user._id.toString());

    const response = await request(app)
      .get(`/api/users/${user._id}`)
      .set(headers)
      .expect(200);

    expect(response.body.user._id).toBe(user._id.toString());
  });
});
```

## Test Helpers

### Available Helpers

- `createTestUser(overrides?)` - Create a test user
- `createTestAdmin(overrides?)` - Create a test admin user
- `createTestCourse(overrides?)` - Create a test course
- `createTestAchievement(overrides?)` - Create a test achievement
- `createTestBadge(overrides?)` - Create a test badge
- `getAuthToken(userId)` - Get JWT token for a user
- `getAuthHeaders(userId)` - Get authenticated request headers
- `cleanDatabase()` - Clean all collections
- `wait(ms)` - Wait for async operations

### Usage Example

```typescript
import { createTestUser, getAuthHeaders, cleanDatabase } from '../helpers/testHelpers';

describe('My Feature', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it('should work', async () => {
    const user = await createTestUser({ username: 'testuser' });
    const headers = getAuthHeaders(user._id.toString());
    // ... test code
  });
});
```

## Test Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: All critical paths covered
- **Security Tests**: All security features tested
- **Performance Tests**: Critical operations benchmarked

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Clean database before/after tests
3. **Descriptive Names**: Use clear test descriptions
4. **Arrange-Act-Assert**: Follow AAA pattern
5. **Mock External Services**: Mock API calls, email sending, etc.
6. **Test Edge Cases**: Test error conditions, boundary values
7. **Fast Tests**: Keep tests fast (< 1 second each)

## Continuous Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Before deployment

## Debugging Tests

```bash
# Run with verbose output
npm test -- --verbose

# Run specific test
npm test -- --testNamePattern="should unlock achievement"

# Run with debugging
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Performance Testing

Performance tests measure:
- API response times
- Database query performance
- Memory usage
- Concurrent request handling

## Security Testing

Security tests verify:
- Input validation
- XSS prevention
- NoSQL injection prevention
- Rate limiting
- Authentication/Authorization
- Message encryption

## Load Testing

Use tools like:
- **Artillery**: Load testing framework
- **k6**: Modern load testing tool
- **Apache Bench**: Simple HTTP benchmarking

Example load test:
```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery quick --count 100 --num 10 http://localhost:5000/api/health
```

## Test Data Management

- Use factories for test data creation
- Clean up test data after tests
- Use separate test database
- Never use production data in tests

## Troubleshooting

### Tests failing with database connection errors
- Ensure MongoDB is running
- Check `MONGODB_TEST_URI` in `.env.test`
- Verify database permissions

### Tests timing out
- Increase test timeout in `jest.config.js`
- Check for hanging async operations
- Verify database cleanup

### Coverage not generating
- Run `npm run test:coverage`
- Check `jest.config.js` coverage settings
- Ensure tests are in correct directories

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)


