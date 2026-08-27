# MakeAdish

MakeAdish uses the OpenAI Responses API to analyze a pantry photo, estimate visible ingredients, and recommend a dish.

## Set up ChatGPT photo analysis

1. Create an API key in the [OpenAI dashboard](https://platform.openai.com/api-keys).
2. In the existing `.env` file, add these lines (keep any existing entries):

   ```env
   OPENAI_API_KEY=your_api_key_here
   OPENAI_MODEL=gpt-5.4-mini
   ```

3. Start the app:

   ```bash
   cd /Users/drrlnlin/STLC
   npm start
   ```

4. Open `http://localhost:4173` on your Mac. To use the camera on your phone, open `http://YOUR_MAC_IP:4173` while both devices are on the same Wi-Fi network.

The OpenAI key is only read by `server.mjs`; it is never sent to the browser.
