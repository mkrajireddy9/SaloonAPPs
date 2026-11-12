# Halo Salon Mobile

The mobile app is a user-only Expo client for iOS and Android. It shares the Halo API with the web app and does not expose Admin navigation or Admin workflows.

## Run on an iPhone with Expo Go

1. Install Expo Go on the iPhone.
2. Find the computer's Wi-Fi IP with `ipconfig getifaddr en0`.
3. Copy `.env.example` to `.env` and replace the sample IP with your computer IP.
4. Make sure the backend is running on port `3000`.
5. Run `npm run start:lan` and scan the QR code in Expo Go. The app always uses real authentication and the configured API.

If the Wi-Fi blocks device discovery, run `npm run start:tunnel` instead.

For a production build, set the API URL to the deployed backend and use `eas build --platform ios`, `eas build --platform android`, or `eas build --platform all` from this directory. The app configuration already contains the iOS bundle identifier, Android package, icons, and secure storage plugins.
