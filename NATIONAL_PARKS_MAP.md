# Interactive U.S. National Parks Map

A comprehensive, responsive interactive map showcasing all 63 U.S. National Parks built with React, TypeScript, Tailwind CSS, and Leaflet.js.

## Features

### 🗺️ Interactive Map
- **Full U.S. Coverage**: Includes all 50 states, Alaska, Hawaii, and territories
- **Custom Tree Icons**: Each national park is marked with a distinctive tree icon
- **Responsive Zoom**: Optimized zoom levels for desktop, tablet, and mobile
- **Smooth Navigation**: Click markers to view details, fly-to functionality for seamless exploration

### 📱 Mobile-First Design
- **Responsive Layout**: Fully optimized for desktop, tablet, and mobile devices
- **Touch-Friendly**: Optimized markers and controls for mobile interaction
- **Sliding Sidebar**: Mobile sidebar with smooth animations and backdrop
- **Adaptive UI**: Dynamic text sizes, spacing, and controls based on screen size

### 🔍 Advanced Search & Discovery
- **Real-time Search**: Search parks by name or state with instant filtering
- **Parks Directory**: Comprehensive sidebar listing all parks with quick navigation
- **Detailed Information**: Rich park details including establishment date, annual visitors, and key features

### 💫 User Experience
- **Loading States**: Smooth loading animations
- **Interactive Tooltips**: Hover/click popups with park summaries
- **Detailed Modals**: Full park information with features, visitor statistics, and descriptions
- **Smooth Animations**: Transitions and hover effects throughout

## Technology Stack

- **React 18** with TypeScript for type-safe component development
- **Leaflet.js** with React-Leaflet for interactive mapping
- **Tailwind CSS** for responsive utility-first styling
- **Lucide React** for consistent iconography
- **Custom Hooks** for responsive behavior management

## File Structure

```
src/
├── components/
│   └── NationalParksMap.tsx          # Main map component
├── data/
│   └── nationalParks.json            # Complete park data with coordinates
├── hooks/
│   └── useResponsiveMap.ts           # Responsive behavior hook
├── pages/
│   └── NationalParks.tsx             # Page wrapper component
└── styles/
    └── leaflet-custom.css            # Custom Leaflet styles
```

## Component Architecture

### NationalParksMap.tsx
The main component featuring:
- Interactive Leaflet map with custom markers
- Responsive sidebar with parks directory
- Search functionality and filtering
- Modal system for detailed park information
- Mobile-optimized navigation

### useResponsiveMap.ts
Custom hook providing:
- Screen size detection (mobile, tablet, desktop)
- Dynamic marker sizing
- Responsive popup dimensions
- Adaptive zoom levels

## Data Structure

Each national park entry includes:
```json
{
  "id": "unique-park-id",
  "name": "Park Name",
  "state": "State/Territory",
  "coordinates": [latitude, longitude],
  "established": "Year",
  "description": "Detailed description",
  "visitors": "Annual visitor count",
  "features": ["Key features array"]
}
```

## Installation & Usage

1. **Install Dependencies**:
   ```bash
   npm install leaflet react-leaflet @types/leaflet
   ```

2. **Import Styles**:
   ```typescript
   import 'leaflet/dist/leaflet.css';
   import '../styles/leaflet-custom.css';
   ```

3. **Use Component**:
   ```typescript
   import NationalParksMap from './components/NationalParksMap';
   
   function App() {
     return <NationalParksMap />;
   }
   ```

## Responsive Features

### Desktop (≥1024px)
- Full sidebar visible
- Large markers (32px)
- Zoom controls visible
- Detailed tooltips

### Tablet (640px-1023px)
- Collapsible sidebar
- Medium markers (28px)
- Touch-optimized controls

### Mobile (<640px)
- Sliding sidebar with backdrop
- Small markers (20px)
- Hidden zoom controls (native touch zoom)
- Condensed UI elements

## Customization

### Adding New Parks
Update `nationalParks.json` with new park data:
```json
{
  "id": "new-park",
  "name": "New Park Name",
  "coordinates": [lat, lng],
  // ... other required fields
}
```

### Styling Customization
Modify `leaflet-custom.css` for:
- Custom marker styles
- Popup appearance
- Animation effects
- Dark mode support

### Marker Icons
Customize the `createTreeIcon` function to:
- Change marker appearance
- Add different icon types
- Modify sizes and colors

## Performance Optimizations

- **Lazy Loading**: Components load progressively
- **Responsive Images**: Optimized marker sizes
- **Efficient Filtering**: Real-time search with minimal re-renders
- **Touch Optimization**: Gesture-friendly mobile interactions

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile**: iOS Safari, Chrome Mobile, Samsung Internet
- **Responsive**: Works on all screen sizes from 320px to 4K displays

## Accessibility

- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Semantic HTML and ARIA labels
- **High Contrast**: Accessible color combinations
- **Touch Targets**: Minimum 44px touch targets on mobile

## Future Enhancements

- **Clustering**: Group nearby markers at low zoom levels
- **Offline Support**: Cache map tiles for offline viewing
- **Photo Gallery**: Integrate park photos and virtual tours
- **Trip Planning**: Save favorite parks and create itineraries
- **Data Export**: Export park lists and visited parks

## License

This component is designed for educational and demonstration purposes. National Parks data is sourced from public domain information.