# Google MCP Server

A standalone, lightweight **Model Context Protocol (MCP)** server for Google / Gmail. Designed to be completely self-contained and usable across any of your coding projects and AI tools (Cursor, Claude Desktop, Antigravity, Grok CLI).

---

## Features & Tools

| Tool | Description |
|---|---|
| `list_messages` | List recent inbox messages or filter by labels/query with pagination |
| `read_message` | Read full email body (plain text & HTML), headers, and attachment metadata |
| `search_messages` | Search using Gmail search syntax (`from:`, `after:`, `has:attachment`) |
| `send_message` | Send emails with recipient, subject, body, CC, BCC, and thread ID |
| `modify_message` | Modify message labels (mark read/unread, star, archive) |
| `list_labels` | List all system and user labels |
| `create_label` | Create a new user label |
| `create_draft` | Create a draft email |
| `send_draft` | Send an existing draft |
| `download_attachment`| Download an email attachment as base64 |

---

## Authentication & Credentials

By default, `google-mcp` automatically detects and uses your local Google credentials at:
- `~/.gmail-mcp/credentials.json`
- `~/.gmail-mcp/gcp-oauth.keys.json`

It handles **automatic token refreshing** — when your access token expires, it silently refreshes it using the refresh token and writes the updated token back to disk.

### Re-Authenticating (if needed)

If you ever need to generate a new token or re-authorize:
```powershell
npm run auth
```

---

## Installation & Build

```powershell
cd c:\Users\prabu\Desktop\os\google-mcp
npm install
npm run build
```

---

## Tool Configurations

### 1. Cursor (`~/.cursor/mcp.json`)

Add to `mcpServers`:
```json
{
  "mcpServers": {
    "google": {
      "command": "node",
      "args": ["c:/Users/prabu/Desktop/os/google-mcp/dist/index.js"]
    }
  }
}
```

### 2. Claude Desktop (`claude_desktop_config.json`)

Add to `mcpServers`:
```json
{
  "mcpServers": {
    "google": {
      "command": "node",
      "args": ["c:/Users/prabu/Desktop/os/google-mcp/dist/index.js"]
    }
  }
}
```

### 3. Antigravity (`~/.gemini/config/mcp_config.json`)

Add to `mcpServers`:
```json
{
  "mcpServers": {
    "google": {
      "command": "node",
      "args": ["c:/Users/prabu/Desktop/os/google-mcp/dist/index.js"]
    }
  }
}
```

### 4. Grok CLI (`~/.grok/config.toml`)

```toml
[mcp_servers.google]
command = "node"
args = ["c:/Users/prabu/Desktop/os/google-mcp/dist/index.js"]
```

---

## Standalone Verification

You can test the server directly with node:
```powershell
node dist/index.js
```
The server will start and wait for JSON-RPC messages via stdin/stdout.
