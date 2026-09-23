import fs from "fs";
import path from "path";
import { google, type Auth } from "googleapis";
import { getCredentialsPath, loadOAuthKeys } from "./config";

export interface StoredCredentials {
  access_token?: string;
  refresh_token: string;
  scope?: string;
  token_type?: string;
  expiry_date?: number;
  [key: string]: unknown;
}

const EXPIRY_BUFFER_MS = 5 * 60 * 1000; // 5 minutes buffer

export function loadStoredCredentials(): StoredCredentials | null {
  const credPath = getCredentialsPath();
  if (!fs.existsSync(credPath)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(credPath, "utf-8");
    return JSON.parse(raw) as StoredCredentials;
  } catch (err) {
    console.error(`Warning: Failed to parse credentials at ${credPath}: ${(err as Error).message}`);
    return null;
  }
}

export function saveCredentials(credentials: StoredCredentials): void {
  const credPath = getCredentialsPath();
  const dir = path.dirname(credPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(credPath, JSON.stringify(credentials, null, 2), "utf-8");
}

export function createOAuth2Client(): Auth.OAuth2Client {
  const keys = loadOAuthKeys();
  const redirectUri = keys.redirect_uris[0] || "http://localhost:3000/oauth2callback";
  return new google.auth.OAuth2(keys.client_id, keys.client_secret, redirectUri);
}

export async function getAuthenticatedClient(): Promise<Auth.OAuth2Client> {
  const oauth2Client = createOAuth2Client();
  const credentials = loadStoredCredentials();

  if (!credentials || !credentials.refresh_token) {
    throw new Error(
      `No valid Google credentials found at "${getCredentialsPath()}". Please run "npm run auth" to authenticate.`
    );
  }

  const now = Date.now();
  const expiry = credentials.expiry_date ?? 0;
  let activeCredentials = credentials;

  // Refresh if token is expired or close to expiring
  if (!credentials.access_token || expiry < now + EXPIRY_BUFFER_MS) {
    oauth2Client.setCredentials({ refresh_token: credentials.refresh_token });
    const refreshResponse = await oauth2Client.refreshAccessToken();
    const newCreds = refreshResponse.credentials;

    activeCredentials = {
      ...credentials,
      access_token: newCreds.access_token || credentials.access_token,
      refresh_token: newCreds.refresh_token || credentials.refresh_token,
      expiry_date: newCreds.expiry_date || undefined,
      token_type: newCreds.token_type || credentials.token_type,
    };

    saveCredentials(activeCredentials);
  }

  oauth2Client.setCredentials({
    access_token: activeCredentials.access_token,
    refresh_token: activeCredentials.refresh_token,
    expiry_date: activeCredentials.expiry_date,
  });

  return oauth2Client;
}

export async function getGmailClient() {
  const auth = await getAuthenticatedClient();
  return google.gmail({ version: "v1", auth });
}
