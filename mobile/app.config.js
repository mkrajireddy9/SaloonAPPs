const appJson = require("./app.json");

module.exports = {
  ...appJson.expo,
  plugins: [
    ...appJson.expo.plugins.filter((plugin) => plugin !== "react-native-maps"),
    // Google Maps native plugin retained for a future billing-enabled build:
    // ["react-native-maps", {
    //   androidGoogleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    //   iosGoogleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    // }],
  ],
};
