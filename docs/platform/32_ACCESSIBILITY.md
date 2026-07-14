# Accessibility

## Standards

- WCAG 2.1 AA compliance
- Section 508 compliance
- ADA compliance

## Implementation

### Keyboard Navigation

- All interactive elements focusable
- Logical tab order
- Skip navigation links
- Focus indicators

### Screen Reader Support

- Semantic HTML
- ARIA labels
- Alt text for images
- Form labels

### Color Contrast

- Minimum 4.5:1 for normal text
- Minimum 3:1 for large text
- Don't rely on color alone

### Responsive Design

- Works on all screen sizes
- Touch targets minimum 44x44px
- Text resizable up to 200%

## Flutter Accessibility

```dart
// Semantic labels
Semantics(
  label: 'Add to cart button',
  child: IconButton(
    icon: Icon(Icons.add_shopping_cart),
    onPressed: () => addToCart(),
  ),
);

// Screen reader announcements
SemanticsService.announce(
  'Item added to cart',
  TextDirection.ltr,
);
```

## Web Accessibility

```html
<!-- Alt text -->
<img src="logo.png" alt="NexaROS Logo" />

<!-- Form labels -->
<label for="email">Email</label>
<input type="email" id="email" name="email" />

<!-- ARIA labels -->
<button aria-label="Close dialog">×</button>

<!-- Skip navigation -->
<a href="#main-content" class="skip-link">Skip to main content</a>
```

## Testing

- Automated testing with axe-core
- Manual testing with screen readers
- Keyboard-only testing
- Color contrast checking

## Related Documents

- [UI/UX Guidelines](15_UI_UX_GUIDELINES.md)
- [Design System](16_DESIGN_SYSTEM.md)
