const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Path to records storage
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'land_records.json');

// Ensure data directory and file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf8');
}

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Cloud Persistence Configurations
const KV_REST_API_URL = process.env.KV_REST_API_URL;
const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || 'Manoj-P01/LandRecord';
const GITHUB_PATH = 'data/land_records.json';

// Helper to read records (Async to handle external cloud DBs)
async function readRecords() {
  // 1. Try Vercel KV (Redis) if configured
  if (KV_REST_API_URL && KV_REST_API_TOKEN) {
    try {
      const res = await fetch(KV_REST_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${KV_REST_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(['GET', 'land_records'])
      });
      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          return JSON.parse(data.result);
        }
      }
    } catch (error) {
      console.error('Error reading from Vercel KV:', error);
    }
  }

  // 2. Try GitHub API if configured (direct repo commit storage)
  if (GITHUB_TOKEN) {
    try {
      const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_PATH}`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Land-Record-Manager'
        }
      });
      if (res.ok) {
        const data = await res.json();
        const content = Buffer.from(data.content, 'base64').toString('utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.error('Error reading from GitHub API:', error);
    }
  }

  // 3. Fallback to Local Filesystem
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading local records file:', error);
  }
  return [];
}

// Helper to write records (Async to handle external cloud DBs)
async function writeRecords(records) {
  let success = false;

  // 1. Try Vercel KV (Redis) if configured
  if (KV_REST_API_URL && KV_REST_API_TOKEN) {
    try {
      const res = await fetch(KV_REST_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${KV_REST_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(['SET', 'land_records', JSON.stringify(records)])
      });
      if (res.ok) {
        const data = await res.json();
        if (data.result === 'OK') {
          success = true;
        }
      }
    } catch (error) {
      console.error('Error writing to Vercel KV:', error);
    }
  }

  // 2. Try GitHub API if configured
  if (GITHUB_TOKEN) {
    try {
      const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_PATH}`;
      let sha;
      const getRes = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Land-Record-Manager'
        }
      });
      if (getRes.ok) {
        const data = await getRes.json();
        sha = data.sha;
      }

      const content = Buffer.from(JSON.stringify(records, null, 2)).toString('base64');
      const body = {
        message: 'update land records [skip ci] [vercel skip]',
        content: content
      };
      if (sha) body.sha = sha;

      const putRes = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Land-Record-Manager'
        },
        body: JSON.stringify(body)
      });
      if (putRes.ok) {
        success = true;
      }
    } catch (error) {
      console.error('Error writing to GitHub API:', error);
    }
  }

  // 3. Fallback to Local Filesystem if not in serverless env
  if (!process.env.VERCEL) {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf8');
      success = true;
    } catch (error) {
      console.error('Error writing local records file:', error);
    }
  } else if (!success) {
    // If on Vercel but neither KV nor GitHub is configured, local file is read-only.
    console.error('Attempted to write in production (Vercel) without KV or GitHub API configured.');
  }

  return success;
}

// REST APIs
// 1. Get all records
app.get('/api/records', async (req, res) => {
  const records = await readRecords();
  res.json(records);
});

// 2. Add a record
app.post('/api/records', async (req, res) => {
  const {
    surveyNumber,
    subDivision,
    pattaNumber,
    documentNumber,
    isPattaTransferred,
    pattaNames, // Array of strings
    landSize,    // { value: number, unit: 'cent' | 'sqft' | 'acre' }
    landType,    // 'wet' | 'dry' | 'residential' | 'commercial'
    purchaseDate,
    purchasedFrom,
    district,
    sro,
    village
  } = req.body;

  // Basic validation
  if (!surveyNumber || !pattaNumber || !documentNumber || !landSize || !landSize.value) {
    return res.status(400).json({ error: 'Missing required fields: survey number, patta number, document number, and land size.' });
  }

  const records = await readRecords();
  const newRecord = {
    id: Date.now().toString(),
    surveyNumber: surveyNumber.trim(),
    subDivision: (subDivision || '').trim(),
    pattaNumber: pattaNumber.trim(),
    documentNumber: documentNumber.trim(),
    isPattaTransferred: !!isPattaTransferred,
    pattaNames: Array.isArray(pattaNames) ? pattaNames.map(name => name.trim()).filter(Boolean) : [],
    landSize: {
      value: parseFloat(landSize.value),
      unit: landSize.unit || 'cent'
    },
    landType: (landType || 'dry').trim().toLowerCase(),
    purchaseDate: purchaseDate || null,
    purchasedFrom: (purchasedFrom || '').trim(),
    district: (district || '').trim(),
    sro: (sro || '').trim(),
    village: (village || '').trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  records.push(newRecord);
  if (await writeRecords(records)) {
    res.status(201).json(newRecord);
  } else {
    res.status(500).json({ error: 'Failed to write record.' });
  }
});

// 3. Update a record
app.put('/api/records/:id', async (req, res) => {
  const { id } = req.params;
  const {
    surveyNumber,
    subDivision,
    pattaNumber,
    documentNumber,
    isPattaTransferred,
    pattaNames,
    landSize,
    landType,
    purchaseDate,
    purchasedFrom,
    district,
    sro,
    village
  } = req.body;

  const records = await readRecords();
  const index = records.findIndex(r => r.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Record not found.' });
  }

  // Update properties if provided
  const record = records[index];
  if (surveyNumber !== undefined) record.surveyNumber = surveyNumber.trim();
  if (subDivision !== undefined) record.subDivision = (subDivision || '').trim();
  if (pattaNumber !== undefined) record.pattaNumber = pattaNumber.trim();
  if (documentNumber !== undefined) record.documentNumber = documentNumber.trim();
  if (isPattaTransferred !== undefined) record.isPattaTransferred = !!isPattaTransferred;
  if (pattaNames !== undefined) {
    record.pattaNames = Array.isArray(pattaNames) ? pattaNames.map(name => name.trim()).filter(Boolean) : [];
  }
  if (landSize !== undefined) {
    record.landSize = {
      value: parseFloat(landSize.value),
      unit: landSize.unit || 'cent'
    };
  }
  if (landType !== undefined) record.landType = landType.trim().toLowerCase();
  if (purchaseDate !== undefined) record.purchaseDate = purchaseDate || null;
  if (purchasedFrom !== undefined) record.purchasedFrom = (purchasedFrom || '').trim();
  if (district !== undefined) record.district = (district || '').trim();
  if (sro !== undefined) record.sro = (sro || '').trim();
  if (village !== undefined) record.village = (village || '').trim();
  record.updatedAt = new Date().toISOString();

  if (await writeRecords(records)) {
    res.json(record);
  } else {
    res.status(500).json({ error: 'Failed to update record.' });
  }
});

// 4. Delete a record
app.delete('/api/records/:id', async (req, res) => {
  const { id } = req.params;
  const records = await readRecords();
  const index = records.findIndex(r => r.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Record not found.' });
  }

  records.splice(index, 1);
  if (await writeRecords(records)) {
    res.json({ message: 'Record deleted successfully.', id });
  } else {
    res.status(500).json({ error: 'Failed to write updates.' });
  }
});

// 5. Bulk Import Records (Overwrites existing data)
app.post('/api/records/import', async (req, res) => {
  const { records } = req.body;
  if (!Array.isArray(records)) {
    return res.status(400).json({ error: 'Invalid input. Expected a records array.' });
  }

  // Format records to ensure uniform structure
  const formattedRecords = records.map((r, index) => ({
    id: r.id || (Date.now() + index).toString(),
    surveyNumber: (r.surveyNumber || '').trim(),
    subDivision: (r.subDivision || '').trim(),
    pattaNumber: (r.pattaNumber || '').trim(),
    documentNumber: (r.documentNumber || '').trim(),
    isPattaTransferred: !!r.isPattaTransferred,
    pattaNames: Array.isArray(r.pattaNames) ? r.pattaNames.map(name => name.trim()).filter(Boolean) : [],
    landSize: {
      value: parseFloat(r.landSize ? r.landSize.value : 0),
      unit: (r.landSize ? r.landSize.unit : 'cent') || 'cent'
    },
    landType: (r.landType || 'dry').trim().toLowerCase(),
    purchaseDate: r.purchaseDate || null,
    purchasedFrom: (r.purchasedFrom || '').trim(),
    district: (r.district || '').trim(),
    sro: (r.sro || '').trim(),
    village: (r.village || '').trim(),
    createdAt: r.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));

  if (await writeRecords(formattedRecords)) {
    res.json({ message: 'Backup restored successfully.', count: formattedRecords.length });
  } else {
    res.status(500).json({ error: 'Failed to write import.' });
  }
});

// Export app for Vercel serverless integration
module.exports = app;

// Listen only when run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`  Land Record Manager is running on port ${PORT}`);
    console.log(`  Access it at: http://localhost:${PORT}`);
    console.log(`==================================================`);
  });
}

