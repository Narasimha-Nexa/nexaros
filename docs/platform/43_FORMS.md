# Forms

## Registration Form

### Fields

| Field | Type | Validation | Required |
|-------|------|------------|----------|
| Business Type | Select | 10 options | Yes |
| Restaurant Name | Text | 2-100 chars | Yes |
| Email | Email | Valid email | Yes |
| Phone | Phone | 10 digits | Yes |
| Address | Text | 5-200 chars | Yes |
| City | Text | 2-50 chars | Yes |
| State | Select | Indian states | Yes |
| Password | Password | 8+ chars | Yes |
| Confirm Password | Password | Must match | Yes |

### Flow

```
1. Fill form
2. Validate fields
3. Submit
4. Create account
5. Create trial subscription
6. Redirect to dashboard
```

## Login Form

### Fields

| Field | Type | Validation | Required |
|-------|------|------------|----------|
| Email | Email | Valid email | Yes |
| Password | Password | 8+ chars | Yes |

### Flow

```
1. Fill form
2. Validate fields
3. Submit
4. Authenticate
5. Return JWT
6. Redirect to dashboard
```

## Order Form

### Fields

| Field | Type | Validation | Required |
|-------|------|------------|----------|
| Table | Select | Available tables | Yes |
| Items | List | At least 1 item | Yes |
| Notes | Text | Optional | No |

### Flow

```
1. Select table
2. Add items
3. Add notes (optional)
4. Review order
5. Confirm
6. Print KOT
7. Send to kitchen
```

## Payment Form

### Fields

| Field | Type | Validation | Required |
|-------|------|------------|----------|
| Method | Select | Payment methods | Yes |
| Amount | Number | Must match total | Yes |

### Flow

```
1. Select method
2. Enter amount
3. Process payment
4. Record payment
5. Generate invoice
6. Print receipt
```

## Related Documents

- [Validations](42_VALIDATIONS.md)
- [Error Handling](41_ERROR_HANDLING.md)
