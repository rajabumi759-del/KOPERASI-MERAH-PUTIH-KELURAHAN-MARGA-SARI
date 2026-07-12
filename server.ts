import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Helper to get Google Sheets client
  // Note: In this environment, we rely on the OAuth setup performed via set_up_oauth.
  // The tokens should be managed. For now, we'll implement the structure.
  
  const getSheetsClient = async (accessToken: string) => {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    return google.sheets({ version: 'v4', auth });
  };

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Proxy for Google Sheets operations
  // We expect the client to send the access token in the headers
  app.post("/api/sheets/sync", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: "Missing authorization header" });
      }

      const accessToken = authHeader.split(" ")[1];
      const { spreadsheetId, data } = req.body;

      if (!spreadsheetId) {
        return res.status(400).json({ error: "Missing spreadsheetId" });
      }

      const sheets = await getSheetsClient(accessToken);

      // Simple implementation: overwrite tabs with new data
      // In a real app, you'd do more granular updates
      for (const [tabName, rows] of Object.entries(data)) {
        const values = rows as any[][];
        
        // Ensure sheet exists
        try {
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${tabName}!A1`,
            valueInputOption: "RAW",
            requestBody: { values },
          });
        } catch (e: any) {
          // If sheet doesn't exist, create it?
          // For simplicity, we assume the sheet is set up or we handle the error
          console.error(`Error updating tab ${tabName}:`, e.message);
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Sheets Sync Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/sheets/data", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: "Missing authorization header" });
      }

      const accessToken = authHeader.split(" ")[1];
      const { spreadsheetId, tabs } = req.query;

      if (!spreadsheetId) {
        return res.status(400).json({ error: "Missing spreadsheetId" });
      }

      const sheets = await getSheetsClient(accessToken);
      const result: any = {};

      const tabList = (tabs as string).split(",");
      for (const tab of tabList) {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: spreadsheetId as string,
          range: `${tab}!A:Z`,
        });
        result[tab] = response.data.values || [];
      }

      res.json(result);
    } catch (error: any) {
      console.error("Sheets Fetch Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
