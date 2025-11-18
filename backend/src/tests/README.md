# Testing Guide

This directory contains all tests for the SquirrelSquad Academy backend.

## Test Structure

```
tests/
├── setup.ts              # Global test setup
├── helpers/
│   └── testHelpers.ts    # Test utility functions
├── unit/                 # Unit tests
│   └── utils/
└── integration/          # Integration tests
    ├── auth.test.ts
    ├── achievements.test.ts
    ├── badges.test.ts
    ├── messaging.test.ts
    └── grading.test.ts
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

## Test Environment

Tests use a separate test database. Set `MONGODB_TEST_URI` in your `.env.test` file:

```env
MONGODB_TEST_URI=mongodb://localhost:27017/squirrelsquadacademy_test
NODE_ENV=test
```

## Writing Tests

### Unit Tests

Test individual functions and utilities in isolation:

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

### Integration Tests

Test API endpoints and database interactions:

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

Use test helpers for common operations:

- `createTestUser()` - Create a test user
- `createTestAdmin()` - Create a test admin
- `createTestCourse()` - Create a test course
- `createTestAchievement()` - Create a test achievement
- `createTestBadge()` - Create a test badge
- `getAuthToken()` - Get JWT token for a user
- `getAuthHeaders()` - Get authenticated request headers
- `cleanDatabase()` - Clean all collections

## Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Critical paths covered
- **Security Tests**: All security features tested

## Test Categories

### Achievement/Badge Tests
- Unlock validation
- Progress tracking
- Duplicate prevention

### Grading Tests
- Rubric consistency
- Coding vs non-coding assignments
- AI grading accuracy

### Messaging Tests
- Message encryption/decryption
- Real-time delivery
- Privacy controls

### Security Tests
- Input validation
- XSS prevention
- Rate limiting
- Authentication/Authorization

### Performance Tests
- Database query optimization
- API response times
- Load testing

## Continuous Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Before deployment

## Debugging Tests

```bash
# Run specific test file
npm test -- achievements.test.ts

# Run with verbose output
npm test -- --verbose

# Run with debugging
node --inspect-brk node_modules/.bin/jest --runInBand
```

