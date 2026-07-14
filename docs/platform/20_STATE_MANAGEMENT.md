# State Management

## Flutter App State

### AppState (Global)

```dart
class AppState extends ChangeNotifier {
  // User
  User? _user;
  Tenant? _tenant;
  
  // Connectivity
  bool _isOnline = false;
  
  // Socket
  Socket? _socket;
  
  // Getters
  User? get user => _user;
  Tenant? get tenant => _tenant;
  bool get isOnline => _isOnline;
  
  // Methods
  void setUser(User user) {
    _user = user;
    notifyListeners();
  }
  
  void setTenant(Tenant tenant) {
    _tenant = tenant;
    notifyListeners();
  }
  
  void setOnline(bool online) {
    _isOnline = online;
    notifyListeners();
  }
}
```

### SubscriptionProvider

```dart
class SubscriptionProvider extends ChangeNotifier {
  SubscriptionInfo? _subscription;
  Map<String, bool> _entitlements = {};
  
  SubscriptionInfo? get subscription => _subscription;
  Map<String, bool> get entitlements => _entitlements;
  
  bool hasEntitlement(String key) {
    return _entitlements[key] ?? false;
  }
  
  Future<void> loadSubscription(String tenantId) async {
    _subscription = await apiClient.getSubscription(tenantId);
    _entitlements = _subscription?.entitlements ?? {};
    notifyListeners();
  }
}
```

### BranchProvider

```dart
class BranchProvider extends ChangeNotifier {
  List<Branch> _branches = [];
  Branch? _selectedBranch;
  
  List<Branch> get branches => _branches;
  Branch? get selectedBranch => _selectedBranch;
  
  Future<void> loadBranches(String tenantId) async {
    _branches = await apiClient.getBranches(tenantId);
    if (_branches.isNotEmpty) {
      _selectedBranch = _branches.first;
    }
    notifyListeners();
  }
  
  void selectBranch(Branch branch) {
    _selectedBranch = branch;
    notifyListeners();
  }
}
```

## Local State

### Screen State

```dart
class POSScreen extends StatefulWidget {
  @override
  _POSScreenState createState() => _POSScreenState();
}

class _POSScreenState extends State<POSScreen> {
  List<CartItem> _cart = [];
  RestaurantTable? _selectedTable;
  
  void addToCart(MenuItem item) {
    setState(() {
      _cart.add(CartItem(item: item, quantity: 1));
    });
  }
  
  void removeFromCart(int index) {
    setState(() {
      _cart.removeAt(index);
    });
  }
}
```

## State Providers

```dart
// In main.dart
MultiProvider(
  providers: [
    ChangeNotifierProvider(create: (_) => AppState()),
    ChangeNotifierProvider(create: (_) => SubscriptionProvider()),
    ChangeNotifierProvider(create: (_) => BranchProvider()),
  ],
  child: MyApp(),
);
```

## Related Documents

- [System Architecture](05_SYSTEM_ARCHITECTURE.md)
- [Offline-First](28_OFFLINE_FIRST.md)
