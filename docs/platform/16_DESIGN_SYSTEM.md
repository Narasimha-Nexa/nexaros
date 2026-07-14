# Design System

## Overview

NexaROS uses a unified design system across all products.

## Tokens

### Colors

```dart
// Flutter
class AppColors {
  static const primary = Color(0xFF6366F1);
  static const secondary = Color(0xFF10B981);
  static const accent = Color(0xFFF59E0B);
  static const error = Color(0xFFEF4444);
  static const background = Color(0xFFF9FAFB);
  static const surface = Color(0xFFFFFFFF);
  static const text = Color(0xFF111827);
  static const textSecondary = Color(0xFF6B7280);
}
```

```css
/* Web */
:root {
  --color-primary: #6366F1;
  --color-secondary: #10B981;
  --color-accent: #F59E0B;
  --color-error: #EF4444;
  --color-background: #F9FAFB;
  --color-surface: #FFFFFF;
  --color-text: #111827;
  --color-text-secondary: #6B7280;
}
```

### Typography

```dart
// Flutter
class AppTypography {
  static const h1 = TextStyle(
    fontSize: 32,
    fontWeight: FontWeight.bold,
    color: AppColors.text,
  );
  
  static const h2 = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.bold,
    color: AppColors.text,
  );
  
  static const body = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.normal,
    color: AppColors.text,
  );
  
  static const caption = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.normal,
    color: AppColors.textSecondary,
  );
}
```

### Spacing

```dart
// Flutter
class AppSpacing {
  static const xs = 4.0;
  static const sm = 8.0;
  static const md = 16.0;
  static const lg = 24.0;
  static const xl = 32.0;
  static const xxl = 48.0;
}
```

### Border Radius

```dart
// Flutter
class AppRadius {
  static const sm = Radius.circular(4);
  static const md = Radius.circular(8);
  static const lg = Radius.circular(12);
  static const xl = Radius.circular(16);
  static const full = Radius.circular(999);
}
```

### Shadows

```dart
// Flutter
class AppShadows {
  static const sm = [
    BoxShadow(
      color: Colors.black12,
      blurRadius: 4,
      offset: Offset(0, 2),
    ),
  ];
  
  static const md = [
    BoxShadow(
      color: Colors.black12,
      blurRadius: 8,
      offset: Offset(0, 4),
    ),
  ];
}
```

## Components

### Buttons

```dart
// Flutter
class AppButton extends StatelessWidget {
  final String text;
  final VoidCallback onPressed;
  final ButtonType type;
  
  const AppButton({
    required this.text,
    required this.onPressed,
    this.type = ButtonType.primary,
  });
  
  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: type == ButtonType.primary
            ? AppColors.primary
            : AppColors.secondary,
        padding: EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: AppRadius.md,
        ),
      ),
      child: Text(text),
    );
  }
}
```

### Cards

```dart
// Flutter
class AppCard extends StatelessWidget {
  final Widget child;
  final VoidCallback? onTap;
  
  const AppCard({
    required this.child,
    this.onTap,
  });
  
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: AppRadius.md,
          boxShadow: AppShadows.sm,
        ),
        padding: EdgeInsets.all(AppSpacing.md),
        child: child,
      ),
    );
  }
}
```

### Input Fields

```dart
// Flutter
class AppInput extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final String? error;
  
  const AppInput({
    required this.label,
    required this.controller,
    this.error,
  });
  
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTypography.caption),
        SizedBox(height: AppSpacing.xs),
        TextField(
          controller: controller,
          decoration: InputDecoration(
            errorText: error,
            border: OutlineInputBorder(
              borderRadius: AppRadius.md,
            ),
          ),
        ),
      ],
    );
  }
}
```

## Related Documents

- [UI/UX Guidelines](15_UI_UX_GUIDELINES.md)
- [Component Library](17_COMPONENT_LIBRARY.md)
- [Theme System](18_THEME_SYSTEM.md)
