const express = require('express');
const shortid = require('shortid');
const validUrl = require('valid-url');
const sqlite3 = require('sqlite3').verbose();
const dbPath = __dirname + '/../../database/database.db'; // Adjust path as needed

const app = express();
app.use(express.json());

const getDb = () => new sqlite3.Database(dbPath);

app.post('/api/shorten', async (req, res) => {
  const { originalUrl } = req.body;
  const baseUrl = req.headers.host; // Vercel provides the host

  if (!validUrl.isWebUri(originalUrl)) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  const db = getDb();

  try {
    const existingUrl = await new Promise((resolve, reject) => {
      db.get("SELECT shortCode FROM urls WHERE originalUrl = ?", [originalUrl], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      });
    });

    if (existingUrl) {
      db.close();
      return res.json({ shortUrl: `https://${baseUrl}/${existingUrl.shortCode}` });
    }

    const shortCode = shortid.generate();
    await new Promise((resolve, reject) => {
      db.run("INSERT INTO urls (originalUrl, shortCode) VALUES (?, ?)", [originalUrl, shortCode], (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });

    db.close();
    return res.status(201).json({ shortUrl: `https://${baseUrl}/${shortCode}` });
  } catch (err) {
    console.error(err);
    db.close();
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = app;