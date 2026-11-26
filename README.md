# CHANNEL ZAP 3D

A mobile-friendly 3D channel-zapping game with a separate Node.js AI dialogue service.

## Render services

- `channel-zap-3d`: static game website.
- `channel-zap-3d-api`: Node.js dialogue API.

The game calls the API at `https://channel-zap-3d-api.onrender.com`.

## Enable generated AI dialogue

1. Open the **channel-zap-3d-api** service in the Render dashboard.
2. Open **Environment** and add `OPENAI_API_KEY`.
3. Save and redeploy the API service, then reload the game website.

Optional: set `OPENAI_MODEL` to change the model (default: `gpt-4.1-mini`).

**Security:** Keep the API key only in Render's server-side Environment settings. Never put it in `index.html`, a public GitHub file, or a chat message. API usage may incur separate charges; a parent or guardian must handle any account setup and billing.

Without the key, the game continues using its built-in prototype dialogue.
