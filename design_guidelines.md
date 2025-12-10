# UniPool Design Guidelines

## Design Approach
**Reference-Based Design** inspired by Uber, InDrive, and Yango's ridesharing interfaces, optimized for university carpooling with emphasis on trust, safety, and real-time coordination.

### Key References
- **Uber**: Clean card-based layouts, prominent CTAs, real-time map integration
- **InDrive**: Cost transparency, driver-passenger matching interface, negotiation flows
- **Yango**: Streamlined booking flow, minimalist ride cards, status indicators

## Core Design Principles
1. **Map-First Experience**: Interactive maps as central navigation elements
2. **Status Clarity**: Real-time ride/booking status with clear visual indicators
3. **Trust Signals**: Verification badges, university domain validation, CNIC status display
4. **Quick Actions**: Prominent CTAs for primary tasks (Search Rides, Post Ride, Book Now)

## Typography
- **Primary Font**: Inter (Google Fonts) - clean, modern sans-serif
- **Secondary Font**: Manrope (Google Fonts) - friendly, rounded for headings
- **Hierarchy**:
  - Hero Headlines: text-5xl/text-6xl, font-bold
  - Section Headers: text-3xl/text-4xl, font-semibold
  - Card Titles: text-xl, font-semibold
  - Body Text: text-base/text-lg, font-normal
  - Captions/Meta: text-sm/text-xs, font-medium

## Layout System
**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16 (p-4, gap-8, space-y-6, etc.)

### Grid Patterns
- Ride Cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Dashboard Panels: 70/30 split (map + sidebar) on desktop, stacked on mobile
- Statistics Cards: grid-cols-2 md:grid-cols-4

## Component Library

### Navigation
- **Header**: Sticky top navigation with logo, role switcher (for "both" users), profile dropdown
- **Sidebar** (Dashboards): Collapsible on mobile, persistent on desktop, icon+label navigation items

### Cards
- **Ride Cards**: Elevated cards (shadow-md) with driver avatar, vehicle info, route summary, cost per seat, available seats count, departure time, quick "Request Seat" button
- **Booking Cards**: Status badge (pending/accepted/rejected), passenger/driver info, action buttons (Accept/Reject for drivers, Cancel for passengers)
- **Vehicle Cards**: Photo, model/plate/color display, edit/delete actions

### Map Components
- **Full-Screen Map** (Landing): Hero section with animated route polylines, location markers
- **Dashboard Map**: 60-70% viewport height, embedded in layout, shows multiple rides as clustered markers
- **Route Visualization**: Colored polylines (source to destination), pickup/dropoff markers with labels

### Forms
- **Ride Posting Form**: Multi-step wizard (Location → Time/Seats → Cost → Review), map picker for source/destination
- **Search Filters**: Compact sidebar with date picker, radius slider, seat count selector, cost range
- **CNIC Upload**: Drag-drop zone with preview, status indicator (pending/verified/rejected badges)

### Status Indicators
- **Verification Badges**: University email (green checkmark), CNIC verified (shield icon)
- **Ride Status**: Active (green pulse), Completed (gray), Cancelled (red)
- **Booking Status**: Pending (yellow), Accepted (green), Rejected (red)

### Buttons & CTAs
- **Primary Actions**: Large, full-width buttons (h-12 to h-14), sharp contrast
- **Buttons on Images**: backdrop-blur-md background with semi-transparent overlay, no hover states
- **Secondary Actions**: Outlined buttons or ghost variants
- **Icon Buttons**: Circular (rounded-full) for quick actions, fixed size (w-10 h-10)

### Data Display
- **Earnings Dashboard** (Driver): Bar chart showing daily/weekly earnings, total rides count, average rating
- **Statistics Tiles**: Large number display (text-3xl) with descriptive label below
- **User Profile**: Avatar (large, rounded-full), name, email, role badge, verification status

## Landing Page Structure

### Hero Section (80vh)
- **Background**: Large hero image showing university campus/carpooling scene with gradient overlay (dark to transparent)
- **Content**: Centered headline "Share Rides, Split Costs, Build Community", subheading about university-only carpooling, dual CTA buttons ("Find a Ride" + "Offer a Ride") with blurred backgrounds
- **Map Preview**: Subtle animated map in background showing sample routes

### Trust Section
Three-column grid: University Email Only (lock icon) | CNIC Verification (shield icon) | Safe Community (users icon)

### How It Works
Timeline layout: Sign Up → Choose Role → Post/Search Rides → Connect & Travel (illustrated with icons)

### Features Grid
Two-column layout (lg:grid-cols-2): Real-time Maps, Cost Splitting, Route Tracking, Booking Management (each with icon, title, description)

### CTA Section
Full-width with gradient background, centered "Ready to Start Carpooling?" heading, signup button

### Footer
Multi-column: Logo/description | Quick Links | University Info | Social links

## Dashboard Layouts

### Passenger Dashboard
- **Primary Layout**: 70% map (left) + 30% ride list (right) on desktop
- **Search Bar**: Prominent top position with location inputs, date/time picker
- **Ride Cards**: Scrollable list in sidebar, click to highlight route on map
- **Active Bookings**: Separate tab showing pending/accepted rides with status

### Driver Dashboard
- **Top Stats Bar**: Earnings This Month | Active Rides | Total Bookings (grid-cols-3)
- **Quick Action**: "Post New Ride" prominent button (top-right)
- **Ride Management**: Table/card view toggle, each ride with booking count, manage bookings button
- **Booking Requests**: Modal/panel showing passenger details, accept/reject actions

### Dual-Mode Dashboard
- **Role Toggle**: Prominent switch at top (Passenger ⟷ Driver)
- **Dynamic Content**: Smoothly transitions between passenger/driver views
- **Unified Notifications**: Shows both ride requests (driver) and booking updates (passenger)

## Images

### Hero Image
**Placement**: Landing page hero section (full-width, 80vh)
**Description**: Bright, welcoming photo of university students in a car together, smiling and conversing, shot from slightly outside the vehicle. Modern campus buildings visible in background. Warm, natural lighting suggesting morning/daytime ride.

### Dashboard Backgrounds
**Placement**: Empty states for "No Rides Found" and "No Bookings Yet"
**Description**: Subtle illustrations of maps with route lines, cars, and location pins in muted tones

### Profile Placeholders
**Default Avatars**: Use Heroicons user-circle for users without uploaded photos

## Icon Library
**Font Awesome 6** (CDN) for comprehensive icon coverage:
- Navigation: fas fa-map, fa-user, fa-car, fa-history
- Actions: fa-plus, fa-search, fa-filter
- Status: fa-check-circle, fa-clock, fa-times-circle
- Verification: fa-shield-check, fa-envelope-circle-check

## Accessibility
- ARIA labels on all interactive map elements
- Keyboard navigation for ride card selection
- High contrast for status indicators (WCAG AA)
- Form validation with clear error messages
- Screen reader announcements for booking status changes