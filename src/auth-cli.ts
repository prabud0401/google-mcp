import readline from "readline";
import { createOAuth2Client, loadStoredCredentials, saveCredentials, StoredCredentials } from "./auth";
import { getCredentialsPath } from "./config";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.labels",
];

async function main(): Promise<void> {
  console.log("=== Google MCP Authenticator ===");

  const existing = loadStoredCredentials();
  if (existing?.refresh_token) {
    console.log(`Existing credentials found at: ${getCredentialsPath()}`);
    console.log(`Expiry: ${existing.expiry_date ? new Date(existing.expiry_date).toISOString() : "Unknown"}`);
  }

  const oauth2Client = createOAuth2Client();

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });

  console.log("\n1. Open this URL in your browser:\n");
  console.log(authUrl);
  console.log("\n2. Authorize the application and copy the code provided by Google.");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("\nPaste the authorization code here: ", async (code) => {
    rl.close();
    try {
      const cleanCode = code.trim();
      const { tokens } = await oauth2Client.getToken(cleanCode);

      if (!tokens.refresh_token && !existing?.refresh_token) {
        console.warn("\nWarning: No refresh token returned. Ensure prompt='consent' was used.");
      }

      const credsToSave: StoredCredentials = {
        access_token: tokens.access_token || existing?.access_token,
        refresh_token: tokens.refresh_token || existing?.refresh_token || "",
        scope: tokens.scope || existing?.scope,
        token_type: tokens.token_type || existing?.token_type,
        expiry_date: tokens.expiry_date || existing?.expiry_date,
      };

      saveCredentials(credsToSave);
      console.log(`\nSuccessfully saved credentials to ${getCredentialsPath()}!`);
    } catch (err) {
      console.error(`\nFailed to exchange code: ${(err as Error).message}`);
      process.exit(1);
    }
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
