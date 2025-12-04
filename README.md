# Swipp Reseller Portal

WeWeb custom component for reseller event and booking management.

## Features

- **Event Settings**: Configure availability (days, hours, address, capacity)
- **Location Selection**: Choose which locations to serve
- **Exceptions**: Add vacation, sick leave, or capacity changes
- **Open Events**: View and manage future events without bookings
- **Bookings**: View all bookings with customer details and status management

## Installation

```bash
cd swipp-reseller-portal
npm install
```

## Development

```bash
npm run serve
```

This starts a local WeWeb development server.

## Build

```bash
npm run build
```

## WeWeb Integration

1. Push to GitHub
2. In WeWeb Editor, add the component via GitHub URL
3. Configure Supabase URL and Anon Key in component settings

## Configuration

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| supabaseUrl | String | Swipp URL | Supabase project URL |
| supabaseAnonKey | String | Swipp Key | Supabase anon key |
| loginRedirectUrl | String | /login?redirect=/forhandler | Redirect for unauthenticated users |
| pageSize | Number | 25 | Items per page in tables |

## Database Requirements

Required tables (all with RLS):
- `resellers`
- `booking_availability`
- `booking_availability_exceptions`
- `availability_locations`
- `events`
- `bookings`
- `customers`
- `locations`

## Version History

- **1.0.0** (2025-12-04): Initial release

## License

MIT
