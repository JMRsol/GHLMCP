# GHL MCP Server

A full read/write GoHighLevel MCP server for Claude. Gives Claude direct access to contacts, opportunities, pipelines, conversations, calendars, and workflows.

## Tools Included

| Tool | Action |
|------|--------|
| `ghl_search_contacts` | Search contacts by name/email/phone |
| `ghl_get_contact` | Get full contact details |
| `ghl_create_contact` | Create a new contact |
| `ghl_update_contact` | Update contact fields |
| `ghl_add_tags` | Add tags to a contact |
| `ghl_remove_tags` | Remove tags from a contact |
| `ghl_add_note` | Add a note to a contact |
| `ghl_list_pipelines` | List all pipelines and stages |
| `ghl_list_opportunities` | List opportunities with filters |
| `ghl_create_opportunity` | Create a new opportunity |
| `ghl_update_opportunity` | Update / move stage / change status |
| `ghl_delete_opportunity` | Delete an opportunity |
| `ghl_list_conversations` | List inbox conversations |
| `ghl_get_conversation_messages` | Get message history |
| `ghl_send_message` | Send SMS, Email, or WhatsApp |
| `ghl_list_calendars` | List calendars |
| `ghl_list_appointments` | List appointments |
| `ghl_create_appointment` | Book an appointment |
| `ghl_list_workflows` | List automation workflows |
| `ghl_trigger_workflow` | Enroll a contact into a workflow |

## Setup

### 1. Environment Variables

Create a `.env` file (or set these on your host):

```bash
GHL_API_KEY=pit-18956d02-xxxx-xxxx-xxxx-xxxxxxxxxxxx   # Your private integration key
GHL_LOCATION_ID=BkFF4Sce7joDt7lSt8W0                   # Your GHL sub-account location ID
GHL_USER_ID=                                            # Optional — your GHL user ID for note attribution
PORT=3000
TRANSPORT=http
```

### 2. Install & Build

```bash
npm install
npm run build
```

### 3. Run Locally

```bash
node dist/index.js
```

Server will start at `http://localhost:3000/mcp`

---

## Deployment Options

### Option A — Railway (Recommended, free tier available)

1. Push this folder to a GitHub repo
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Set all environment variables in Railway's Variables tab
4. Railway will auto-detect Node and deploy — you'll get a public URL like `https://ghl-mcp-server-production.up.railway.app`
5. Your MCP URL = `https://your-app.up.railway.app/mcp`

### Option B — Render

1. Push to GitHub
2. New Web Service on [render.com](https://render.com)
3. Build command: `npm install && npm run build`
4. Start command: `node dist/index.js`
5. Add environment variables in Render dashboard

### Option C — VPS / Existing Server

```bash
npm install
npm run build
# Use PM2 to keep it alive:
npm install -g pm2
pm2 start dist/index.js --name ghl-mcp
pm2 save
```

---

## Connecting to Claude

Once deployed and your server is live at `https://your-url.com/mcp`:

1. Go to [claude.ai](https://claude.ai) → Settings → Connectors
2. Click **Add Custom MCP**
3. Enter your server URL: `https://your-url.com/mcp`
4. Name it "GoHighLevel"
5. Save — Claude will now have full GHL access

---

## Security Notes

- Never commit your `.env` file or expose your `GHL_API_KEY` publicly
- This key grants full sub-account access — treat it like a password
- For production, consider adding an `Authorization` header check to the `/mcp` endpoint
