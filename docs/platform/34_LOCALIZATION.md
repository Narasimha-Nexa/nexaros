# Localization

## Supported Languages

| Language | Code | Status |
|----------|------|--------|
| English | en | ✅ |
| Hindi | hi | 🔄 |
| Kannada | kn | 🔄 |
| Telugu | te | 🔄 |
| Tamil | ta | 🔄 |
| Malayalam | ml | 🔄 |

## Implementation

### Flutter

```dart
// pubspec.yaml
dependencies:
  flutter_localizations:
    sdk: flutter
  intl: ^0.18.0

// l10n.yaml
arb-dir: lib/l10n
template-arb-file: app_en.arb
output-localization-file: app_localizations.dart
```

### ARB Files

```json
// lib/l10n/app_en.arb
{
  "@@locale": "en",
  "appTitle": "NexaROS",
  "login": "Login",
  "logout": "Logout",
  "pos": "Point of Sale",
  "orders": "Orders",
  "kitchen": "Kitchen",
  "tables": "Tables"
}
```

```json
// lib/l10n/app_hi.arb
{
  "@@locale": "hi",
  "appTitle": "NexaROS",
  "login": "लॉग इन",
  "logout": "लॉग आउट",
  "pos": "पॉइंट ऑफ सेल",
  "orders": "ऑर्डर",
  "kitchen": "रसोई",
  "tables": "मेज"
}
```

### Usage

```dart
// In widgets
Text(AppLocalizations.of(context)!.login);

// With parameters
Text(AppLocalizations.of(context)!.welcomeMessage(userName));
```

## Number Formatting

```dart
// Indian number system
NumberFormat.currency(
  locale: 'en_IN',
  symbol: '₹',
  decimalDigits: 2,
).format(1234567.89); // ₹12,34,567.89
```

## Date Formatting

```dart
// Indian date format
DateFormat('dd/MM/yyyy').format(DateTime.now()); // 15/01/2024
```

## Related Documents

- [Flutter App](32_FLUTTER_APP.md)
- [UI/UX Guidelines](15_UI_UX_GUIDELINES.md)
