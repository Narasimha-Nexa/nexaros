# Validations

## Backend Validation

### DTO Validation

```typescript
// create-item.dto.ts
import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class CreateItemDto {
  @IsString()
  name: string;
  
  @IsString()
  @IsOptional()
  description?: string;
  
  @IsNumber()
  price: number;
  
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;
}
```

### Validation Pipe

```typescript
// main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  })
);
```

### Custom Validators

```typescript
// is-phone-number.validator.ts
import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isPhoneNumber',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: {
        validate(value: any) {
          return /^[6-9]\d{9}$/.test(value);
        },
      },
    });
  };
}
```

## Flutter Validation

### Form Validation

```dart
// login_form.dart
class LoginForm extends StatefulWidget {
  @override
  _LoginFormState createState() => _LoginFormState();
}

class _LoginFormState extends State<LoginForm> {
  final _formKey = GlobalKey<FormState>();
  
  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        children: [
          TextFormField(
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Email is required';
              }
              if (!value.contains('@')) {
                return 'Invalid email';
              }
              return null;
            },
          ),
          TextFormField(
            obscureText: true,
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Password is required';
              }
              if (value.length < 8) {
                return 'Password must be at least 8 characters';
              }
              return null;
            },
          ),
          ElevatedButton(
            onPressed: () {
              if (_formKey.currentState!.validate()) {
                // Submit form
              }
            },
            child: Text('Login'),
          ),
        ],
      ),
    );
  }
}
```

## Validation Rules

### Email

- Required
- Valid email format
- Maximum 255 characters

### Password

- Required
- Minimum 8 characters
- Maximum 128 characters

### Phone

- Required (if applicable)
- 10 digits
- Starts with 6-9

### Name

- Required
- Minimum 2 characters
- Maximum 100 characters

## Related Documents

- [Error Handling](41_ERROR_HANDLING.md)
- [Forms](43_FORMS.md)
