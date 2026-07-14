# Error Handling

## Backend Error Handling

### Exception Filter

```typescript
// all-exceptions.filter.ts
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    
    const message = exception instanceof HttpException
      ? exception.getResponse()
      : 'Internal server error';
    
    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

### Custom Exceptions

```typescript
// not-found.exception.ts
export class NotFoundException extends HttpException {
  constructor(resource: string) {
    super(`${resource} not found`, HttpStatus.NOT_FOUND);
  }
}

// unauthorized.exception.ts
export class UnauthorizedException extends HttpException {
  constructor(message = 'Unauthorized') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

// forbidden.exception.ts
export class ForbiddenException extends HttpException {
  constructor(message = 'Forbidden') {
    super(message, HttpStatus.FORBIDDEN);
  }
}
```

## Flutter Error Handling

### Global Error Handler

```dart
// main.dart
void main() {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Set up error handler
  FlutterError.onError = (FlutterErrorDetails details) {
    FlutterError.presentError(details);
    
    // Log error
    LoggerService.error(
      details.exceptionAsString(),
      details.stack,
    );
  };
  
  // Set up zone error handler
  runZonedGuarded(() {
    runApp(MyApp());
  }, (error, stackTrace) {
    LoggerService.error(
      error.toString(),
      stackTrace,
    );
  });
}
```

### API Error Handling

```dart
// api_client.dart
class ApiClient {
  Future<T> request<T>(String method, String url, {dynamic body}) async {
    try {
      final response = await http.get(
        Uri.parse(url),
        headers: {'Authorization': 'Bearer $token'},
      );
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw ApiException(
          statusCode: response.statusCode,
          message: response.body,
        );
      }
    } catch (e) {
      if (e is ApiException) {
        rethrow;
      }
      throw ApiException(
        statusCode: 0,
        message: 'Network error',
      );
    }
  }
}
```

### UI Error Display

```dart
// error_widget.dart
class ErrorWidget extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  
  const ErrorWidget({
    required this.message,
    required this.onRetry,
  });
  
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 64, color: Colors.red),
          SizedBox(height: 16),
          Text(message),
          SizedBox(height: 16),
          ElevatedButton(
            onPressed: onRetry,
            child: Text('Retry'),
          ),
        ],
      ),
    );
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Unprocessable Entity |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

## Related Documents

- [Monitoring](39_MONITORING.md)
- [Logging](40_LOGGING.md)
