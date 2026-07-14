# Component Library

## Shared Components

### Button

| Prop | Type | Description |
|------|------|-------------|
| text | String | Button text |
| onPressed | VoidCallback | Tap handler |
| type | ButtonType | primary, secondary, danger, ghost |
| size | ButtonSize | small, medium, large |
| isLoading | bool | Loading state |
| icon | IconData | Optional icon |

### Card

| Prop | Type | Description |
|------|------|-------------|
| child | Widget | Card content |
| onTap | VoidCallback? | Tap handler |
| padding | EdgeInsets? | Custom padding |
| elevation | double? | Shadow depth |

### Input

| Prop | Type | Description |
|------|------|-------------|
| label | String | Field label |
| controller | TextEditingController | Value controller |
| error | String? | Error message |
| obscureText | bool | Password field |
| keyboardType | TextInputType | Input type |
| prefixIcon | IconData? | Leading icon |
| suffixIcon | IconData? | Trailing icon |

### Badge

| Prop | Type | Description |
|------|------|-------------|
| text | String | Badge text |
| color | Color | Background color |
| textColor | Color | Text color |

### Modal

| Prop | Type | Description |
|------|------|-------------|
| title | String | Modal title |
| content | Widget | Modal body |
| actions | List<Widget>? | Action buttons |

### Accordion

| Prop | Type | Description |
|------|------|-------------|
| title | String | Header text |
| content | Widget | Body content |
| initiallyExpanded | bool | Default state |

### Tabs

| Prop | Type | Description |
|------|------|-------------|
| tabs | List<Tab> | Tab definitions |
| children | List<Widget> | Tab content |

### Toast

| Prop | Type | Description |
|------|------|-------------|
| message | String | Toast text |
| type | ToastType | success, error, info |
| duration | Duration | Display time |

## Restaurant-Specific Components

### OrderCard

| Prop | Type | Description |
|------|------|-------------|
| order | Order | Order data |
| onTap | VoidCallback | Tap handler |
| onStatusChange | VoidCallback? | Status update |

### TableCard

| Prop | Type | Description |
|------|------|-------------|
| table | RestaurantTable | Table data |
| onTap | VoidCallback | Tap handler |

### MenuItemCard

| Prop | Type | Description |
|------|------|-------------|
| item | MenuItem | Item data |
| onAdd | VoidCallback | Add to cart |
| onEdit | VoidCallback? | Edit item |

### KitchenOrderCard

| Prop | Type | Description |
|------|------|-------------|
| order | Order | Order data |
| onStatusChange | VoidCallback | Update status |

### BranchSwitcher

| Prop | Type | Description |
|------|------|-------------|
| branches | List<Branch> | Available branches |
| selectedBranch | Branch? | Current branch |
| onBranchChanged | ValueChanged<Branch> | Selection handler |

### SubscriptionStatusBar

| Prop | Type | Description |
|------|------|-------------|
| subscription | SubscriptionInfo | Subscription data |

### GracePeriodBanner

| Prop | Type | Description |
|------|------|-------------|
| daysRemaining | int | Days left |
| onRenew | VoidCallback | Renewal handler |

### FeatureLockedOverlay

| Prop | Type | Description |
|------|------|-------------|
| feature | String | Feature key |
| child | Widget | Wrapped content |

## Related Documents

- [Design System](16_DESIGN_SYSTEM.md)
- [Theme System](18_THEME_SYSTEM.md)
