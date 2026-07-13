import 'package:flutter/material.dart';

/// Localized strings for NexaROS
class AppLocalizations {
  final Locale locale;

  AppLocalizations(this.locale);

  static const List<String> supportedLanguages = ['en', 'hi', 'kn', 'te'];

  static const Map<String, Map<String, String>> _localizedStrings = {
    'en': {
      'appName': 'NexaROS',
      'dashboard': 'Dashboard',
      'orders': 'Orders',
      'menu': 'Menu',
      'tables': 'Tables',
      'pos': 'POS',
      'kitchen': 'Kitchen',
      'staff': 'Staff',
      'reports': 'Reports',
      'inventory': 'Inventory',
      'settings': 'Settings',
      'more': 'More',
      'login': 'Login',
      'logout': 'Logout',
      'register': 'Register',
      'email': 'Email',
      'password': 'Password',
      'totalRevenue': 'Total Revenue',
      'todayOrders': "Today's Orders",
      'activeTables': 'Active Tables',
      'pendingOrders': 'Pending Orders',
      'search': 'Search',
      'cancel': 'Cancel',
      'save': 'Save',
      'delete': 'Delete',
      'edit': 'Edit',
      'create': 'Create',
      'confirm': 'Confirm',
      'loading': 'Loading...',
      'error': 'An error occurred',
      'retry': 'Retry',
      'noData': 'No data available',
      'online': 'Online',
      'offline': 'Offline',
      'syncing': 'Syncing...',
      'synced': 'Synced',
    },
    'hi': {
      'appName': 'नेक्सारोस',
      'dashboard': 'डैशबोर्ड',
      'orders': 'ऑर्डर',
      'menu': 'मेनू',
      'tables': 'टेबल',
      'pos': 'पीओएस',
      'kitchen': 'रसोई',
      'staff': 'कर्मचारी',
      'reports': 'रिपोर्ट',
      'inventory': 'इन्वेंटरी',
      'settings': 'सेटिंग्स',
      'more': 'और',
      'login': 'लॉग इन',
      'logout': 'लॉग आउट',
      'register': 'पंजीकरण',
      'email': 'ईमेल',
      'password': 'पासवर्ड',
      'totalRevenue': 'कुल राजस्व',
      'todayOrders': 'आज के ऑर्डर',
      'activeTables': 'सक्रिय टेबल',
      'pendingOrders': 'लंबित ऑर्डर',
      'search': 'खोजें',
      'cancel': 'रद्द करें',
      'save': 'सहेजें',
      'delete': 'हटाएं',
      'edit': 'संपादित करें',
      'create': 'बनाएं',
      'confirm': 'पुष्टि करें',
      'loading': 'लोड हो रहा है...',
      'error': 'एक त्रुटि हुई',
      'retry': 'पुनः प्रयास करें',
      'noData': 'कोई डेटा उपलब्ध नहीं',
      'online': 'ऑनलाइन',
      'offline': 'ऑफलाइन',
      'syncing': 'सिंक हो रहा है...',
      'synced': 'सिंक हो गया',
    },
    'kn': {
      'appName': 'ನೆಕ್ಸಾರೋಸ್',
      'dashboard': 'ಡ್ಯಾಶ್ಬೋರ್ಡ್',
      'orders': 'ಆರ್ಡರ್‌ಗಳು',
      'menu': 'ಮೆನು',
      'tables': 'ಟೇಬಲ್‌ಗಳು',
      'pos': 'ಪಿಓಎಸ್',
      'kitchen': 'ಅಡುಗೆಮನೆ',
      'staff': 'ಸಿಬ್ಬಂದಿ',
      'reports': 'ವರದಿಗಳು',
      'inventory': 'ದಾಸ್ತಾನು',
      'settings': 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
      'more': 'ಇನ್ನಷ್ಟು',
      'login': 'ಲಾಗಿನ್',
      'logout': 'ಲಾಗೌಟ್',
      'register': 'ನೋಂದಣಿ',
      'email': 'ಇಮೇಲ್',
      'password': 'ಪಾಸ್ವರ್ಡ್',
      'totalRevenue': 'ಒಟ್ಟು ಆದಾಯ',
      'todayOrders': 'ಇಂದಿನ ಆರ್ಡರ್‌ಗಳು',
      'activeTables': 'ಸಕ್ರಿಯ ಟೇಬಲ್‌ಗಳು',
      'pendingOrders': 'ಬಾಕಿ ಆರ್ಡರ್‌ಗಳು',
      'search': 'ಹುಡುಕು',
      'cancel': 'ರದ್ದುಮಾಡಿ',
      'save': 'ಉಳಿಸಿ',
      'delete': 'ಅಳಿಸಿ',
      'edit': 'ಸಂಪಾದಿಸಿ',
      'create': 'ರಚಿಸಿ',
      'confirm': 'ದೃಢೀಕರಿಸಿ',
      'loading': 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
      'error': 'ದೋಷ ಸಂಭವಿಸಿದೆ',
      'retry': 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ',
      'noData': 'ಡೇಟಾ ಲಭ್ಯವಿಲ್ಲ',
      'online': 'ಆನ್‌ಲೈನ್',
      'offline': 'ಆಫ್‌ಲೈನ್',
      'syncing': 'ಸಿಂಕ್ ಆಗುತ್ತಿದೆ...',
      'synced': 'ಸಿಂಕ್ ಆಗಿದೆ',
    },
    'te': {
      'appName': 'నెక్సారోస్',
      'dashboard': 'డాష్‌బోర్డ్',
      'orders': 'ఆర్డర్‌లు',
      'menu': 'మెను',
      'tables': 'టేబుళ్ళు',
      'pos': 'పీఓఎస్',
      'kitchen': 'వంటగది',
      'staff': 'సిబ్బంది',
      'reports': 'నివేదికలు',
      'inventory': 'జాబితా',
      'settings': 'సెట్టింగ్‌లు',
      'more': 'మరిన్ని',
      'login': 'లాగిన్',
      'logout': 'లాగ్ అవుట్',
      'register': 'నమోదు',
      'email': 'ఇమెయిల్',
      'password': 'పాస్‌వర్డ్',
      'totalRevenue': 'మొత్తం ఆదాయం',
      'todayOrders': 'నేటి ఆర్డర్‌లు',
      'activeTables': 'యాక్టివ్ టేబుళ్ళు',
      'pendingOrders': 'పెండింగ్ ఆర్డర్‌లు',
      'search': 'వెతకండి',
      'cancel': 'రద్దు చేయండి',
      'save': 'సేవ్ చేయండి',
      'delete': 'తొలగించండి',
      'edit': 'సవరించండి',
      'create': 'సృష్టించండి',
      'confirm': 'నిర్ధారించండి',
      'loading': 'లోడ్ అవుతోంది...',
      'error': 'లోపం సంభవించింది',
      'retry': 'మళ్లీ ప్రయత్నించండి',
      'noData': 'డేటా అందుబాటులో లేదు',
      'online': 'ఆన్‌లైన్',
      'offline': 'ఆఫ్‌లైన్',
      'syncing': 'సింక్ అవుతోంది...',
      'synced': 'సింక్ అయింది',
    },
  };

  static AppLocalizations of(BuildContext context) {
    return AppLocalizations(Localizations.localeOf(context));
  }

  String translate(String key) {
    return _localizedStrings[locale.languageCode]?[key] ?? _localizedStrings['en']?[key] ?? key;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate = _AppLocalizationsDelegate();
}

class _AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) => AppLocalizations.supportedLanguages.contains(locale.languageCode);

  @override
  Future<AppLocalizations> load(Locale locale) async => AppLocalizations(locale);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}
