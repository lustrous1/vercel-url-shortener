const sqlite3 = require('sqlite3').verbose();
const dbPath = __dirname + '/../../database/database.db'; // Adjust path as needed

module.exports = async (req, res) => {
  const { shortCode } = req.query;
  const db = new sqlite3.Database(dbPath);

  try {
    const urlData = await new Promise((resolve, reject) => {
      db.get("SELECT originalUrl FROM urls WHERE shortCode = ?", [shortCode], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      });
    });

    db.close();

    if (urlData) {
      res.writeHead(302, { Location: urlData.originalUrl });
      res.end();
    } else {
      res.status(404).send('URL not found');
    }
  } catch (err) {
    console.error(err);
    db.close();
    res.status(500).send('Server error');
  }
};