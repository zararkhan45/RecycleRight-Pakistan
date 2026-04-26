import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";
import { getAuthToken } from "./authStorage";

export function configureApiClient() {
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (baseUrl && baseUrl.trim() !== "") {
    setBaseUrl(baseUrl.trim());
  } else {
    // Leaving baseUrl unset means requests will be relative.
    // In Expo Go on device you should set EXPO_PUBLIC_API_BASE_URL to your LAN IP.
    setBaseUrl(null);
  }

  setAuthTokenGetter(() => getAuthToken());
}

