const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Path to records storage (using process.cwd() for Vercel Serverless environment compatibility)
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'land_records.json');

// Ensure data directory and file exist (only when running locally; Vercel is read-only)
if (!process.env.VERCEL) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf8');
  }
}

// Middleware
app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));

// Cloud Persistence Configurations
const KV_REST_API_URL = process.env.KV_REST_API_URL;
const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || 'Manoj-P01/LandRecord';
const GITHUB_PATH = 'data/land_records.json';

function convertToCents(value, unit) {
  const val = parseFloat(value);
  if (isNaN(val) || val <= 0) return 0;
  
  const SQFT_PER_CENT = 435.6;
  const CENTS_PER_ACRE = 100;
  const SQFT_PER_ARE = 1076.391;
  
  switch (unit) {
    case 'cent':
      return val;
    case 'sqft':
      return val / SQFT_PER_CENT;
    case 'acre':
      return val * CENTS_PER_ACRE;
    case 'are':
      return (val * SQFT_PER_ARE) / SQFT_PER_CENT;
    default:
      return val;
  }
}

function resolveDocumentFallbacks(record) {
  if (!Array.isArray(record.pattas) || record.pattas.length === 0) {
    if (!record.pattas) record.pattas = [];
    return record;
  }

  // Comma-joined list of patta numbers
  const pattaNumbers = record.pattas
    .map(p => (p.pattaNumber || '').trim())
    .filter(Boolean);
  record.pattaNumber = pattaNumbers.join(', ');

  // Union of all patta names
  const allPattaNames = new Set();
  record.pattas.forEach(p => {
    if (Array.isArray(p.pattaNames)) {
      p.pattaNames.forEach(name => {
        if (name && name.trim()) allPattaNames.add(name.trim());
      });
    }
  });
  record.pattaNames = Array.from(allPattaNames);

  // isPattaTransferred: true if all pattas are transferred; false otherwise
  record.isPattaTransferred = record.pattas.every(p => !!p.isPattaTransferred);

  // Accumulate sizes and find first survey/subdivision/landType
  let totalCents = 0;
  let firstSurvey = '';
  let firstSubdiv = '';
  let firstType = 'dry';

  record.pattas.forEach((p, pIndex) => {
    if (Array.isArray(p.parcels)) {
      p.parcels.forEach((parcel, parcelIndex) => {
        if (pIndex === 0 && parcelIndex === 0) {
          firstSurvey = (parcel.surveyNumber || '').trim();
          firstSubdiv = (parcel.subDivision || '').trim();
          firstType = (parcel.landType || 'dry').trim().toLowerCase();
        }
        if (parcel.landSize && parcel.landSize.value) {
          totalCents += convertToCents(parcel.landSize.value, parcel.landSize.unit);
        }
      });
    }
  });

  record.surveyNumber = firstSurvey;
  record.subDivision = firstSubdiv;
  record.landType = firstType;
  record.landSize = {
    value: parseFloat(totalCents.toFixed(4)),
    unit: 'cent'
  };

  return record;
}

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
    documentNumber,
    documentOwnerName,
    purchaseDate,
    purchasedFrom,
    district,
    sro,
    village,
    pattas,
    notes
  } = req.body;

  const docOwners = Array.isArray(documentOwnerName) ? documentOwnerName.map(name => name.trim()).filter(Boolean) : (typeof documentOwnerName === 'string' && documentOwnerName.trim() ? [documentOwnerName.trim()] : []);
  const sellers = Array.isArray(purchasedFrom) ? purchasedFrom.map(name => name.trim()).filter(Boolean) : (typeof purchasedFrom === 'string' && purchasedFrom.trim() ? [purchasedFrom.trim()] : []);

  // Parse and build hierarchical pattas list
  let formattedPattas = [];
  if (Array.isArray(pattas) && pattas.length > 0) {
    formattedPattas = pattas.map(p => {
      const pattaNames = Array.isArray(p.pattaNames) ? p.pattaNames.map(name => name.trim()).filter(Boolean) : [];
      const parcels = Array.isArray(p.parcels) ? p.parcels.map(parcel => ({
        surveyNumber: (parcel.surveyNumber || '').trim(),
        subDivision: (parcel.subDivision || '').trim(),
        landSize: {
          value: parseFloat(parcel.landSize ? parcel.landSize.value : 0),
          unit: (parcel.landSize ? parcel.landSize.unit : 'cent') || 'cent'
        },
        landType: (parcel.landType || 'dry').trim().toLowerCase()
      })).filter(parcel => parcel.surveyNumber && parcel.landSize.value > 0) : [];

      return {
        pattaNumber: (p.pattaNumber || '').trim(),
        isPattaTransferred: !!p.isPattaTransferred,
        pattaNames,
        parcels
      };
    }).filter(p => p.pattaNumber && p.parcels.length > 0);
  }

  // Fallback for older client format
  if (formattedPattas.length === 0) {
    let legacyParcels = [];
    if (Array.isArray(req.body.parcels) && req.body.parcels.length > 0) {
      legacyParcels = req.body.parcels.map(p => ({
        surveyNumber: (p.surveyNumber || '').trim(),
        subDivision: (p.subDivision || '').trim(),
        landSize: {
          value: parseFloat(p.landSize ? p.landSize.value : 0),
          unit: (p.landSize ? p.landSize.unit : 'cent') || 'cent'
        },
        landType: (p.landType || req.body.landType || 'dry').trim().toLowerCase()
      })).filter(p => p.surveyNumber && p.landSize.value > 0);
    } else if (req.body.surveyNumber && req.body.landSize && req.body.landSize.value) {
      legacyParcels = [{
        surveyNumber: req.body.surveyNumber.trim(),
        subDivision: (req.body.subDivision || '').trim(),
        landSize: {
          value: parseFloat(req.body.landSize.value),
          unit: req.body.landSize.unit || 'cent'
        },
        landType: (req.body.landType || 'dry').trim().toLowerCase()
      }];
    }

    formattedPattas = [{
      pattaNumber: (req.body.pattaNumber || '').trim(),
      isPattaTransferred: !!req.body.isPattaTransferred,
      pattaNames: Array.isArray(req.body.pattaNames) ? req.body.pattaNames.map(name => name.trim()).filter(Boolean) : [],
      parcels: legacyParcels
    }].filter(p => p.pattaNumber && p.parcels.length > 0);
  }

  // Basic validation
  if (!documentNumber || docOwners.length === 0 || formattedPattas.length === 0) {
    return res.status(400).json({ error: 'Missing required fields: document number, document owner name, and at least one valid Patta block.' });
  }

  const records = await readRecords();
  const newRecord = {
    id: Date.now().toString(),
    documentNumber: documentNumber.trim(),
    documentOwnerName: docOwners,
    purchasedFrom: sellers,
    purchaseDate: purchaseDate || null,
    pattas: formattedPattas,
    district: (district || '').trim(),
    sro: (sro || '').trim(),
    village: (village || '').trim(),
    notes: (notes || '').trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  resolveDocumentFallbacks(newRecord);

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
    documentNumber,
    documentOwnerName,
    purchaseDate,
    purchasedFrom,
    district,
    sro,
    village,
    pattas,
    notes
  } = req.body;

  const records = await readRecords();
  const index = records.findIndex(r => r.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Record not found.' });
  }

  // Update properties if provided
  const record = records[index];

  if (documentNumber !== undefined) record.documentNumber = documentNumber.trim();
  if (documentOwnerName !== undefined) {
    record.documentOwnerName = Array.isArray(documentOwnerName) ? documentOwnerName.map(name => name.trim()).filter(Boolean) : (typeof documentOwnerName === 'string' && documentOwnerName.trim() ? [documentOwnerName.trim()] : []);
  }
  if (purchaseDate !== undefined) record.purchaseDate = purchaseDate || null;
  if (purchasedFrom !== undefined) {
    record.purchasedFrom = Array.isArray(purchasedFrom) ? purchasedFrom.map(name => name.trim()).filter(Boolean) : (typeof purchasedFrom === 'string' && purchasedFrom.trim() ? [purchasedFrom.trim()] : []);
  }
  if (district !== undefined) record.district = (district || '').trim();
  if (sro !== undefined) record.sro = (sro || '').trim();
  if (village !== undefined) record.village = (village || '').trim();
  if (notes !== undefined) record.notes = (notes || '').trim();

  if (pattas !== undefined && Array.isArray(pattas)) {
    const formattedPattas = pattas.map(p => {
      const pattaNames = Array.isArray(p.pattaNames) ? p.pattaNames.map(name => name.trim()).filter(Boolean) : [];
      const parcels = Array.isArray(p.parcels) ? p.parcels.map(parcel => ({
        surveyNumber: (parcel.surveyNumber || '').trim(),
        subDivision: (parcel.subDivision || '').trim(),
        landSize: {
          value: parseFloat(parcel.landSize ? parcel.landSize.value : 0),
          unit: (parcel.landSize ? parcel.landSize.unit : 'cent') || 'cent'
        },
        landType: (parcel.landType || 'dry').trim().toLowerCase()
      })).filter(parcel => parcel.surveyNumber && parcel.landSize.value > 0) : [];

      return {
        pattaNumber: (p.pattaNumber || '').trim(),
        isPattaTransferred: !!p.isPattaTransferred,
        pattaNames,
        parcels
      };
    }).filter(p => p.pattaNumber && p.parcels.length > 0);

    record.pattas = formattedPattas;
  }

  resolveDocumentFallbacks(record);
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
  const formattedRecords = records.map((r, index) => {
    let recordParcels = [];
    if (Array.isArray(r.parcels) && r.parcels.length > 0) {
      recordParcels = r.parcels.map(p => ({
        surveyNumber: (p.surveyNumber || '').trim(),
        subDivision: (p.subDivision || '').trim(),
        landSize: {
          value: parseFloat(p.landSize ? p.landSize.value : 0),
          unit: (p.landSize ? p.landSize.unit : 'cent') || 'cent'
        }
      })).filter(p => p.surveyNumber && p.landSize.value > 0);
    }

    // Legacy fallback
    if (recordParcels.length === 0) {
      recordParcels = [{
        surveyNumber: (r.surveyNumber || '').trim(),
        subDivision: (r.subDivision || '').trim(),
        landSize: {
          value: parseFloat(r.landSize ? r.landSize.value : 0),
          unit: (r.landSize ? r.landSize.unit : 'cent') || 'cent'
        }
      }].filter(p => p.surveyNumber);
    }

    // Cumulative size calculation
    let totalCents = 0;
    recordParcels.forEach(p => {
      totalCents += convertToCents(p.landSize.value, p.landSize.unit);
    });

    const finalLandSize = totalCents > 0 ? {
      value: parseFloat(totalCents.toFixed(4)),
      unit: 'cent'
    } : {
      value: parseFloat(r.landSize ? r.landSize.value : 0),
      unit: (r.landSize ? r.landSize.unit : 'cent') || 'cent'
    };

    return {
      id: r.id || (Date.now() + index).toString(),
      surveyNumber: recordParcels.length > 0 ? recordParcels[0].surveyNumber : (r.surveyNumber || '').trim(),
      subDivision: recordParcels.length > 0 ? recordParcels[0].subDivision : (r.subDivision || '').trim(),
      pattaNumber: (r.pattaNumber || '').trim(),
      documentNumber: (r.documentNumber || '').trim(),
      isPattaTransferred: !!r.isPattaTransferred,
      documentOwnerName: Array.isArray(r.documentOwnerName) ? r.documentOwnerName.map(name => name.trim()).filter(Boolean) : (typeof r.documentOwnerName === 'string' && r.documentOwnerName.trim() ? [r.documentOwnerName.trim()] : []),
      pattaNames: Array.isArray(r.pattaNames) ? r.pattaNames.map(name => name.trim()).filter(Boolean) : [],
      landSize: finalLandSize,
      parcels: recordParcels,
      landType: (r.landType || 'dry').trim().toLowerCase(),
      purchaseDate: r.purchaseDate || null,
      purchasedFrom: Array.isArray(r.purchasedFrom) ? r.purchasedFrom.map(name => name.trim()).filter(Boolean) : (typeof r.purchasedFrom === 'string' && r.purchasedFrom.trim() ? [r.purchasedFrom.trim()] : []),
      district: (r.district || '').trim(),
      sro: (r.sro || '').trim(),
      village: (r.village || '').trim(),
      notes: (r.notes || '').trim(),
      createdAt: r.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });

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
