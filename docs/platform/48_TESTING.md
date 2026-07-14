# Testing

## Overview

NexaROS uses Jest for backend testing and Flutter test for Flutter testing.

## Backend Testing

### Test Structure

```
src/
├── modules/
│   └── auth/
│       ├── auth.service.ts
│       ├── auth.service.spec.ts
│       ├── auth.controller.ts
│       └── auth.controller.spec.ts
```

### Test Types

| Type | Description | Tool |
|------|-------------|------|
| Unit | Service methods | Jest |
| Integration | API endpoints | Supertest |
| E2E | Full flows | Supertest |

### Example Test

```typescript
// auth.service.spec.ts
describe('AuthService', () => {
  let service: AuthService;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AuthService, PrismaService],
    }).compile();
    
    service = module.get<AuthService>(AuthService);
  });
  
  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });
      
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
    
    it('should throw for invalid credentials', async () => {
      await expect(
        service.login({
          email: 'wrong@example.com',
          password: 'wrong',
        })
      ).rejects.toThrow();
    });
  });
});
```

## Flutter Testing

### Test Structure

```
test/
├── unit/
│   └── auth_test.dart
├── widget/
│   └── login_test.dart
└── integration/
    └── login_flow_test.dart
```

### Example Test

```dart
// auth_test.dart
void main() {
  group('AuthService', () {
    test('should return tokens for valid credentials', () async {
      final service = AuthService();
      final result = await service.login(
        email: 'test@example.com',
        password: 'password123',
      );
      
      expect(result.accessToken, isNotEmpty);
      expect(result.refreshToken, isNotEmpty);
    });
    
    test('should throw for invalid credentials', () async {
      final service = AuthService();
      
      expect(
        () => service.login(
          email: 'wrong@example.com',
          password: 'wrong',
        ),
        throwsException,
      );
    });
  });
}
```

## Test Coverage

| Module | Tests | Coverage |
|--------|-------|----------|
| Auth | 15 | 85% |
| Menu | 12 | 80% |
| Orders | 18 | 90% |
| Payments | 10 | 75% |
| Total | 302 | 82% |

## Commands

### Backend

```bash
# Run all tests
npm test

# Run with coverage
npm run test:cov

# Run specific test
npm test -- auth.service.spec.ts
```

### Flutter

```bash
# Run all tests
flutter test

# Run with coverage
flutter test --coverage

# Run specific test
flutter test test/unit/auth_test.dart
```

## Related Documents

- [QA Checklist](49_QA_CHECKLIST.md)
- [Modules](08_MODULES.md)
