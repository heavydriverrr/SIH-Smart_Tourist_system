# Mapbox Integration Setup

## Getting a Mapbox Access Token

The TrustTour app uses Mapbox for interactive maps with geofencing and location tracking. To enable full map functionality, you need to obtain a Mapbox access token.

### Step 1: Create a Mapbox Account

1. Go to [mapbox.com](https://mapbox.com)
2. Click "Sign up" to create a free account
3. Verify your email address

### Step 2: Get Your Access Token

1. After logging in, go to your [Account page](https://account.mapbox.com/)
2. In the "Access tokens" section, you'll see your default public token
3. Copy the token that starts with `pk.`

### Step 3: Add Token to Your Project

#### For Development:
Add your token to `.env.local`:
```bash
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
```

#### For Production:
Add your token to `.env.production`:
```bash
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
```

### Step 4: Restart the Development Server

```bash
npm run dev
```

## Fallback Map

If no valid Mapbox token is found, the app will display a fallback map with static content showing:
- Current location (Guwahati, Assam)
- GPS status
- Safety features overview
- Risk zones and safe areas (static display)

## Map Features

Once a valid token is configured, the app provides:

- **Interactive Satellite Map**: High-resolution satellite imagery
- **Real-time GPS Tracking**: Live location updates
- **Geofencing**: High-risk zones with visual boundaries
- **Safe Zones**: Tourist attractions and safe areas
- **Navigation Controls**: Zoom, rotate, and pan controls
- **Location Markers**: Current position and points of interest
- **Risk Alerts**: Visual warnings for dangerous areas

## Troubleshooting

### "API access token is required" Error
- Check that your token starts with `pk.`
- Ensure the token is added to the correct `.env` file
- Restart the development server after adding the token
- Verify the token is valid on your Mapbox account page

### Map Not Loading
- Check browser console for errors
- Verify internet connection
- Ensure the token has the correct permissions in your Mapbox account

### Development vs Production
- Use different tokens for development and production if needed
- Production tokens should have restricted domains for security
- Development tokens can be less restrictive for testing

## Security Notes

- Never commit actual Mapbox tokens to version control
- Use environment variables for all tokens
- Restrict token permissions in production
- Monitor token usage in your Mapbox dashboard