# NavigationTabs Component Integration Guide

## Overview

The `NavigationTabs` component is a flexible, responsive navigation solution extracted from the legacy Fantasy Football Analyzer. It provides a consistent navigation experience across desktop and mobile devices with multiple styling variants and accessibility features.

## Features

- **Multiple Variants**: Default, Pills, and Underline styles
- **Responsive Design**: Optimized for mobile with touch-friendly targets
- **Accessibility**: Full keyboard navigation and screen reader support
- **Badge Support**: Display notifications and counts on tabs
- **Flexible Configuration**: Easily customizable tab configurations
- **Smooth Animations**: CSS transitions and hover effects
- **Scroll Support**: Horizontal scrolling for mobile overflow

## Basic Usage

```tsx
import NavigationTabs, { TabConfig } from '@/components/ui/NavigationTabs';
import { Users, GitCompare, BarChart3 } from 'lucide-react';

const MyComponent = () => {
  const [currentView, setCurrentView] = useState('draft');
  
  const tabs: TabConfig[] = [
    { id: 'draft', name: 'Draft Board', icon: Users },
    { id: 'compare', name: 'Compare', icon: GitCompare },
    { id: 'rankings', name: 'Rankings', icon: BarChart3 }
  ];

  return (
    <NavigationTabs
      currentView={currentView}
      onViewChange={setCurrentView}
      tabConfig={tabs}
    />
  );
};
```

## Props API

### NavigationTabsProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `currentView` | `string` | Required | Active tab identifier |
| `onViewChange` | `(view: string) => void` | Required | Callback when tab changes |
| `tabConfig` | `TabConfig[]` | `DEFAULT_TAB_CONFIG` | Array of tab configurations |
| `className` | `string` | `''` | Additional CSS classes |
| `variant` | `'default' \| 'pills' \| 'underline'` | `'default'` | Visual style variant |
| `responsive` | `boolean` | `true` | Enable responsive behavior |

### TabConfig

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | `string` | ✓ | Unique tab identifier |
| `name` | `string` | ✓ | Display name |
| `icon` | `LucideIcon` | ✓ | Icon component |
| `badge` | `number \| string` | ✗ | Badge content (notifications) |
| `disabled` | `boolean` | ✗ | Disable tab interaction |

## Styling Variants

### Default
Standard tab appearance with borders and background highlights.
```tsx
<NavigationTabs variant="default" ... />
```

### Pills
Rounded pill-style tabs with background colors.
```tsx
<NavigationTabs variant="pills" ... />
```

### Underline
Minimal design with bottom border indicators.
```tsx
<NavigationTabs variant="underline" ... />
```

## Responsive Behavior

### Desktop (≥640px)
- Full horizontal layout with text labels
- Hover effects and smooth transitions
- All tabs visible simultaneously

### Mobile (<640px)
- Horizontal scrolling when tabs overflow
- Icon-only display to save space
- Touch-optimized 44px minimum height
- Smooth scroll behavior

## Pre-configured Tab Sets

The component includes pre-configured tab sets for common use cases:

### Draft-focused Tabs
```tsx
import { DRAFT_TAB_CONFIG } from '@/components/ui/NavigationTabs';

<NavigationTabs tabConfig={DRAFT_TAB_CONFIG} ... />
```

### Analysis-focused Tabs
```tsx
import { ANALYSIS_TAB_CONFIG } from '@/components/ui/NavigationTabs';

<NavigationTabs tabConfig={ANALYSIS_TAB_CONFIG} ... />
```

## Custom Tab Creation

Use the `createTabConfig` utility for type-safe tab creation:

```tsx
import { createTabConfig } from '@/components/ui/NavigationTabs';
import { Settings } from 'lucide-react';

const customTab = createTabConfig('settings', 'Settings', Settings, {
  badge: 'NEW',
  disabled: false
});
```

## Badge Usage

Badges can display numbers or strings and automatically pulse for attention:

```tsx
const tabsWithBadges: TabConfig[] = [
  { id: 'messages', name: 'Messages', icon: MessageCircle, badge: 5 },
  { id: 'updates', name: 'Updates', icon: Bell, badge: 'NEW' }
];
```

## Accessibility Features

- **Keyboard Navigation**: Tab through navigation with arrow keys
- **Screen Reader Support**: Proper ARIA labels and roles
- **Focus Management**: Visible focus indicators
- **Role Semantics**: Correct tab/tabpanel relationships

## Integration with Legacy Component

To replace the navigation in `LegacyFantasyFootballAnalyzer.tsx`:

```tsx
// Before (in legacy component)
<nav className="flex space-x-8">
  {[
    { id: 'draft', name: 'Draft Board', icon: Users },
    // ... other tabs
  ].map((tab) => (
    <button
      onClick={() => setCurrentView(tab.id)}
      className={/* complex conditional classes */}
    >
      {/* button content */}
    </button>
  ))}
</nav>

// After (using NavigationTabs)
<NavigationTabs
  currentView={currentView}
  onViewChange={setCurrentView}
  tabConfig={legacyTabConfig}
  variant="underline"
  responsive={true}
/>
```

## Performance Considerations

- Component is memoized to prevent unnecessary re-renders
- CSS animations are GPU-accelerated
- Responsive behavior uses CSS media queries
- Minimal JavaScript for scroll management

## Browser Support

- Modern browsers with CSS Grid and Flexbox
- Touch device support for mobile interaction
- Keyboard navigation for accessibility
- Progressive enhancement for older browsers

## Customization

### Custom Styles
Add custom CSS classes via the `className` prop:

```tsx
<NavigationTabs 
  className="my-custom-navigation" 
  ... 
/>
```

### Theme Integration
The component uses Tailwind classes that can be customized via your theme:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        blue: {
          500: '#your-brand-color'
        }
      }
    }
  }
}
```

## Testing

The component includes proper ARIA attributes and semantic HTML for testing:

```tsx
// Test example
import { render, screen, fireEvent } from '@testing-library/react';

test('navigates between tabs', () => {
  const onViewChange = jest.fn();
  render(
    <NavigationTabs 
      currentView="draft"
      onViewChange={onViewChange}
      tabConfig={testTabs}
    />
  );
  
  fireEvent.click(screen.getByRole('tab', { name: /compare/i }));
  expect(onViewChange).toHaveBeenCalledWith('compare');
});
```

## Migration Checklist

1. ✅ Extract navigation array from legacy component
2. ✅ Replace inline navigation with NavigationTabs component
3. ✅ Test responsive behavior on mobile devices
4. ✅ Verify accessibility with screen readers
5. ✅ Ensure proper focus management
6. ✅ Test keyboard navigation
7. ✅ Validate badge functionality if used
8. ✅ Check performance with React DevTools

## File Structure

```
src/components/ui/
├── NavigationTabs.tsx           # Main component
├── NavigationTabs.css           # Styles
├── NavigationTabs.example.tsx   # Usage examples
└── NavigationTabs.integration.md # This guide
```