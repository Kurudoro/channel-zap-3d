# CHANNEL ZAP 3D

A mobile-friendly browser-based 3D channel-zapping prototype with a Node.js dialogue backend.

## Deploy on Render

The Render Blueprint uses a Node web service to serve the game and the private AI API endpoint.

## Enable generated AI dialogue

1. In the Render dashboard, open the `channel-zap-3d` web service.
2. Open **Environment** and add `OPENAI_API_KEY` with an OpenAI API key.
3. Save changes and redeploy, then reload the game page.

Optional: set `OPENAI_MODEL` to change the model (default: `gpt-4.1-mini`).

**Security:** Keep the API key only in Render's server-side Environment settings. Never put it in `index.html`, a public GitHub file, or a message. API usage may incur separate charges; account setup and billing should be handled by a parent or guardian.

Without the key, the game continues using its built-in prototype dialogue.
