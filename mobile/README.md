# Halo Salon Mobile

## Test on an iPhone with Expo Go

1. Install Expo Go on the iPhone.
2. Find the computer's Wi-Fi IP with `ipconfig getifaddr en0`.
3. Copy `.env.example` to `.env` and replace the sample IP with your computer IP.
4. Make sure the backend is running on port `3000`.
5. Run `npm run start:lan` and scan the QR code in Expo Go.

If the Wi-Fi blocks device discovery, run `npm run start:tunnel` instead.

The mobile app loads the complete existing web experience inside a native Expo shell, so all current web screens and flows are available on iOS and Android. Set `EXPO_PUBLIC_WEB_APP_URL` to the LAN URL for local testing or the deployed frontend URL for production.
