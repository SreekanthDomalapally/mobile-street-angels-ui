import fs from 'fs';
import path from 'path';

const PLAY_STORE_PACKAGE = 'com.youhooalert.com';

interface GoogleServicesJson {
  client?: Array<{
    client_info?: { android_client_info?: { package_name?: string } };
    oauth_client?: Array<{ client_id?: string; client_type?: number }>;
  }>;
}

/** Web OAuth client (client_type 3) from google-services.json — used at EAS build time. */
export function readGoogleWebClientId(
  servicesPath = './google-services.json'
): string | undefined {
  try {
    const absolutePath = path.resolve(servicesPath);
    const json = JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as GoogleServicesJson;

    for (const client of json.client ?? []) {
      const packageName = client.client_info?.android_client_info?.package_name;
      if (packageName !== PLAY_STORE_PACKAGE) continue;

      const webClient = client.oauth_client?.find((entry) => entry.client_type === 3);
      if (webClient?.client_id) return webClient.client_id;
    }

    for (const client of json.client ?? []) {
      const webClient = client.oauth_client?.find((entry) => entry.client_type === 3);
      if (webClient?.client_id) return webClient.client_id;
    }
  } catch {
    // File may be absent in local dev; EAS builds should include it.
  }

  return undefined;
}
