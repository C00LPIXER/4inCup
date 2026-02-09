import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

// Custom plugin to handle local file persistence
const localPersistence = () => ({
  name: 'configure-server',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const dbPath = path.resolve(__dirname, 'tournament-data.json');

      if (req.url === '/api/tournament' && req.method === 'GET') {
        if (fs.existsSync(dbPath)) {
          const data = fs.readFileSync(dbPath, 'utf-8');
          res.setHeader('Content-Type', 'application/json');
          res.end(data);
        } else {
          // Default empty state
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ teams: [], matches: [], isGenerated: false }));
        }
        return;
      }

      if (req.url === '/api/tournament' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', () => {
          fs.writeFileSync(dbPath, body);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true }));
        });
        return;
      }

      next();
    });
  },
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), localPersistence()],
})
