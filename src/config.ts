import fs from "fs";
import path from "path";
import os from "os";

export interface GoogleOAuthKeys {
  client_id: string;
  client_secret: string;
  redirect_uris: string[];
}

function resolveHome(filepath: string): string {
  if (filepath.startsWith("~")) {
    return path.join(os.homedir(), filepath.slice(1));
  }
  return path.resolve(filepath);
}

export function getCredentialsPath(): string {
  const envPath = process.env.GOOGLE_CREDENTIALS_PATH || process.env.GMAIL_CREDENTIALS_PATH;
  if (envPath) {
    return resolveHome(envPath);
  }

  // Check local directory first
  const localPath = path.resolve(process.cwd(), "credentials.json");
  if (fs.existsSync(localPath)) {
    return localPath;
  }

  // Fallback to ~/.gmail-mcp/credentials.json
  return path.join(os.homedir(), ".gmail-mcp", "credentials.json");
}

export function getOAuthKeysPath(): string {
  const envPath = process.env.GOOGLE_OAUTH_KEYS_PATH || process.env.GMAIL_OAUTH_KEYS_PATH;
  if (envPath) {
    return resolveHome(envPath);
  }

  // Check local directory first
  const localPath = path.resolve(process.cwd(), "gcp-oauth.keys.json");
  if (fs.existsSync(localPath)) {
    return localPath;
  }

  // Fallback to ~/.gmail-mcp/gcp-oauth.keys.json
  return path.join(os.homedir(), ".gmail-mcp", "gcp-oauth.keys.json");
}

function parseOAuthKeysContent(content: string): GoogleOAuthKeys {
  const parsed = JSON.parse(content) as Record<string, unknown>;
  const keys = (parsed.web || parsed.installed) as
    | { client_id: string; client_secret: string; redirect_uris?: string[] }
    | undefined;

  if (!keys?.client_id || !keys?.client_secret) {
    throw new Error(
      "Invalid OAuth keys format. Expected 'web' or 'installed' object containing client_id and client_secret."
    );
  }

  return {
    client_id: keys.client_id,
    client_secret: keys.client_secret,
    redirect_uris: keys.redirect_uris || ["http://localhost:3000/oauth2callback"],
  };
}

export function loadOAuthKeys(): GoogleOAuthKeys {
  if (process.env.GOOGLE_OAUTH_KEYS_B64) {
    const decoded = Buffer.from(process.env.GOOGLE_OAUTH_KEYS_B64, "base64").toString("utf-8");
    return parseOAuthKeysContent(decoded);
  }

  if (process.env.GOOGLE_OAUTH_KEYS_JSON) {
    return parseOAuthKeysContent(process.env.GOOGLE_OAUTH_KEYS_JSON);
  }

  const keysPath = getOAuthKeysPath();
  if (!fs.existsSync(keysPath)) {
    throw new Error(
      `Google OAuth keys not found at "${keysPath}". Please set GOOGLE_OAUTH_KEYS_PATH or place gcp-oauth.keys.json in ~/.gmail-mcp/.`
    );
  }

  return parseOAuthKeysContent(fs.readFileSync(keysPath, "utf-8"));
}
