const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  });
}

loadEnvFile();

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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(process.cwd(), 'public')));

app.get('/api/auth-config', (req, res) => {
  res.json({
    email: process.env.LANDREGISTRY_DEFAULT_EMAIL || '',
    password: process.env.LANDREGISTRY_DEFAULT_PASSWORD || ''
  });
});

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

function safeUnlinkLocalAttachment(fileUrl) {
  if (typeof fileUrl === 'string' && fileUrl.startsWith('/attachments/')) {
    const oldFilePath = path.join(process.cwd(), 'public', fileUrl);
    try {
      if (fs.existsSync(oldFilePath) && fs.statSync(oldFilePath).isFile()) {
        fs.unlinkSync(oldFilePath);
      }
    } catch (e) {}
  }
}

function saveAttachments(recordId, uploadedAttachments, currentAttachments = {}, pattas = []) {
  const attachments = { ...currentAttachments };
  const recordDir = path.join(process.cwd(), 'public', 'attachments', recordId);

  // Determine if we need to create the record attachments folder
  const hasRecordUploads = uploadedAttachments && Object.values(uploadedAttachments).some(f => f && f.base64);
  const hasPattaUploads = Array.isArray(pattas) && pattas.some(p => p.uploadedAttachment && p.uploadedAttachment.base64);
  
  if ((hasRecordUploads || hasPattaUploads) && !fs.existsSync(recordDir)) {
    fs.mkdirSync(recordDir, { recursive: true });
  }

  // 1. Process record-level attachments (document, ec, fmb)
  if (uploadedAttachments) {
    const types = ['document', 'ec', 'fmb'];
    for (const type of types) {
      const fileData = uploadedAttachments[type];
      if (fileData === null) continue;

      if (fileData && fileData.delete) {
        if (attachments[type] && attachments[type].fileUrl) {
          safeUnlinkLocalAttachment(attachments[type].fileUrl);
          attachments[type] = null;
        }
      } else if (fileData && fileData.base64) {
        if (attachments[type] && attachments[type].fileUrl) {
          safeUnlinkLocalAttachment(attachments[type].fileUrl);
        }

        const matches = fileData.base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches) {
          const buffer = Buffer.from(matches[2], 'base64');
          const ext = path.extname(fileData.name) || '.bin';
          const fileName = `${type}${ext}`;
          const filePath = path.join(recordDir, fileName);
          fs.writeFileSync(filePath, buffer);
          attachments[type] = {
            fileName: fileData.name,
            fileUrl: `/attachments/${recordId}/${fileName}`,
            uploadedAt: new Date().toISOString()
          };
        }
      }
    }
  }

  // 2. Process Patta-level attachments
  if (Array.isArray(pattas)) {
    pattas.forEach((patta, idx) => {
      const fileData = patta.uploadedAttachment;
      
      if (fileData && fileData.delete) {
        if (patta.attachment && patta.attachment.fileUrl) {
          safeUnlinkLocalAttachment(patta.attachment.fileUrl);
        }
        patta.attachment = null;
      } else if (fileData && fileData.base64) {
        if (patta.attachment && patta.attachment.fileUrl) {
          safeUnlinkLocalAttachment(patta.attachment.fileUrl);
        }

        const matches = fileData.base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches) {
          const buffer = Buffer.from(matches[2], 'base64');
          const ext = path.extname(fileData.name) || '.bin';
          const fileName = `patta_${idx}${ext}`;
          const filePath = path.join(recordDir, fileName);
          fs.writeFileSync(filePath, buffer);
          patta.attachment = {
            fileName: fileData.name,
            fileUrl: `/attachments/${recordId}/${fileName}`,
            uploadedAt: new Date().toISOString()
          };
        }
      } else if (patta.attachment && typeof patta.attachment.fileUrl === 'string') {
        const currentUrl = patta.attachment.fileUrl;
        
        // Only rename local relative attachment files
        if (currentUrl.startsWith('/attachments/')) {
          const currentExt = path.extname(currentUrl);
          const expectedFileName = `patta_${idx}${currentExt}`;
          const expectedUrl = `/attachments/${recordId}/${expectedFileName}`;
          
          if (currentUrl !== expectedUrl) {
            const currentFilePath = path.join(process.cwd(), 'public', currentUrl);
            const expectedFilePath = path.join(recordDir, expectedFileName);
            try {
              if (fs.existsSync(currentFilePath) && fs.statSync(currentFilePath).isFile()) {
                fs.renameSync(currentFilePath, expectedFilePath);
                patta.attachment.fileUrl = expectedUrl;
              }
            } catch (e) {
              console.error(`Failed to rename patta file from ${currentFilePath} to ${expectedFilePath}`, e);
            }
          }
        }
      }

      delete patta.uploadedAttachment;
    });

    // Clean up orphaned patta files
    if (fs.existsSync(recordDir)) {
      try {
        const files = fs.readdirSync(recordDir);
        files.forEach(file => {
          if (file.startsWith('patta_')) {
            const match = file.match(/^patta_(\d+)/);
            if (match) {
              const fileIdx = parseInt(match[1], 10);
              if (fileIdx >= pattas.length) {
                const filePath = path.join(recordDir, file);
                fs.unlinkSync(filePath);
              }
            }
          }
        });
      } catch (e) {
        console.error(`Failed to clean up orphaned patta files in ${recordDir}`, e);
      }
    }
  }

  // Clean up empty directories
  try {
    if (fs.existsSync(recordDir) && fs.readdirSync(recordDir).length === 0) {
      fs.rmdirSync(recordDir);
    }
  } catch (e) {}

  return attachments;
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
        parcels,
        uploadedAttachment: p.uploadedAttachment || null,
        attachment: p.attachment || null
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
    deedType: (req.body.deedType || 'sale_deed').trim().toLowerCase(),
    documentOwnerName: docOwners,
    purchasedFrom: sellers,
    purchaseDate: purchaseDate || null,
    pattas: formattedPattas,
    district: (district || '').trim(),
    sro: (sro || '').trim(),
    village: (village || '').trim(),
    notes: (notes || '').trim(),
    partitions: Array.isArray(req.body.partitions) ? req.body.partitions : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  resolveDocumentFallbacks(newRecord);
  newRecord.attachments = saveAttachments(newRecord.id, req.body.uploadedAttachments, {}, newRecord.pattas);

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
    deedType,
    documentOwnerName,
    purchaseDate,
    purchasedFrom,
    district,
    sro,
    village,
    pattas,
    notes,
    partitions
  } = req.body;

  const records = await readRecords();
  const index = records.findIndex(r => r.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Record not found.' });
  }

  // Update properties if provided
  const record = records[index];

  if (documentNumber !== undefined) record.documentNumber = documentNumber.trim();
  if (deedType !== undefined) record.deedType = (deedType || 'sale_deed').trim().toLowerCase();
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
  if (partitions !== undefined && Array.isArray(partitions)) record.partitions = partitions;

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
        parcels,
        uploadedAttachment: p.uploadedAttachment || null,
        attachment: p.attachment || null
      };
    }).filter(p => p.pattaNumber && p.parcels.length > 0);

    record.pattas = formattedPattas;
  }

  if (req.body.uploadedAttachments !== undefined || record.pattas !== undefined) {
    record.attachments = saveAttachments(record.id, req.body.uploadedAttachments, record.attachments || {}, record.pattas || []);
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

  // Clean up attachments folder
  const recordDir = path.join(process.cwd(), 'public', 'attachments', id);
  if (fs.existsSync(recordDir)) {
    try {
      fs.rmSync(recordDir, { recursive: true, force: true });
    } catch (e) {
      console.error(`Failed to clean up attachments for record ${id}:`, e);
    }
  }

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
      attachments: r.attachments || {},
      pattas: r.pattas || [],
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

// -------------------------------------------------------------
// Pending Land Deals REST APIs
// -------------------------------------------------------------
const PENDING_DEALS_FILE = path.join(DATA_DIR, 'pending_land_deals.json');
if (!process.env.VERCEL && !fs.existsSync(PENDING_DEALS_FILE)) {
  try {
    fs.writeFileSync(PENDING_DEALS_FILE, JSON.stringify([], null, 2), 'utf8');
  } catch(e) {}
}

function readPendingDealsLocal() {
  try {
    if (fs.existsSync(PENDING_DEALS_FILE)) {
      return JSON.parse(fs.readFileSync(PENDING_DEALS_FILE, 'utf8'));
    }
  } catch (e) {}
  return [];
}

function writePendingDealsLocal(deals) {
  if (!process.env.VERCEL) {
    try {
      fs.writeFileSync(PENDING_DEALS_FILE, JSON.stringify(deals, null, 2), 'utf8');
      return true;
    } catch (e) {}
  }
  return false;
}

app.get('/api/pending-deals', (req, res) => {
  const deals = readPendingDealsLocal();
  res.json(deals);
});

app.post('/api/pending-deals', (req, res) => {
  const deals = readPendingDealsLocal();
  
  let formattedPattas = [];
  if (Array.isArray(req.body.pattas) && req.body.pattas.length > 0) {
    formattedPattas = req.body.pattas.map(p => {
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
        parcels
      };
    }).filter(p => p.parcels.length > 0);
  }

  const rawParcels = Array.isArray(req.body.parcels) ? req.body.parcels : [];
  let parcels = rawParcels.map(p => ({
    surveyNumber: (p.surveyNumber || '').trim(),
    subDivision: (p.subDivision || '').trim(),
    landSize: {
      value: parseFloat(p.landSize ? p.landSize.value : 0),
      unit: (p.landSize ? p.landSize.unit : 'cent') || 'cent'
    },
    landType: (p.landType || 'dry').trim().toLowerCase()
  })).filter(p => p.surveyNumber && p.landSize.value > 0);

  if (formattedPattas.length > 0 && parcels.length === 0) {
    formattedPattas.forEach(p => {
      p.parcels.forEach(pr => parcels.push(pr));
    });
  }

  const newDeal = {
    id: Date.now().toString(),
    sellerName: Array.isArray(req.body.sellerName) ? req.body.sellerName : [req.body.sellerName || ''],
    buyerName: Array.isArray(req.body.buyerName) ? req.body.buyerName : [req.body.buyerName || ''],
    surveyNumber: (req.body.surveyNumber || (parcels.length > 0 ? parcels[0].surveyNumber : '')).trim(),
    subDivision: (req.body.subDivision || (parcels.length > 0 ? parcels[0].subDivision : '')).trim(),
    pattaNumber: (req.body.pattaNumber || (formattedPattas.length > 0 ? formattedPattas.map(p => p.pattaNumber).filter(Boolean).join(', ') : '')).trim(),
    landType: (req.body.landType || (parcels.length > 0 ? parcels[0].landType : 'dry')).trim().toLowerCase(),
    landSize: req.body.landSize || { value: 0, unit: 'cent' },
    parcels: parcels,
    pattas: formattedPattas.length > 0 ? formattedPattas : [{ pattaNumber: (req.body.pattaNumber || '').trim(), parcels }],
    dealStatus: req.body.dealStatus || 'agreement_executed',
    agreementDate: req.body.agreementDate || null,
    targetRegistrationDate: req.body.targetRegistrationDate || null,
    totalPrice: parseFloat(req.body.totalPrice) || 0,
    advancePaid: parseFloat(req.body.advancePaid) || 0,
    district: (req.body.district || '').trim(),
    sro: (req.body.sro || '').trim(),
    village: (req.body.village || '').trim(),
    notes: (req.body.notes || '').trim(),
    attachments: req.body.attachments || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  deals.push(newDeal);
  writePendingDealsLocal(deals);
  res.status(201).json(newDeal);
});

app.put('/api/pending-deals/:id', (req, res) => {
  const { id } = req.params;
  const deals = readPendingDealsLocal();
  const index = deals.findIndex(d => d.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Deal not found.' });
  }

  const deal = deals[index];
  if (req.body.sellerName !== undefined) deal.sellerName = Array.isArray(req.body.sellerName) ? req.body.sellerName : [req.body.sellerName];
  if (req.body.buyerName !== undefined) deal.buyerName = Array.isArray(req.body.buyerName) ? req.body.buyerName : [req.body.buyerName];
  if (req.body.surveyNumber !== undefined) deal.surveyNumber = req.body.surveyNumber.trim();
  if (req.body.subDivision !== undefined) deal.subDivision = req.body.subDivision.trim();
  if (req.body.pattaNumber !== undefined) deal.pattaNumber = req.body.pattaNumber.trim();
  if (req.body.landType !== undefined) deal.landType = req.body.landType.trim().toLowerCase();
  if (req.body.landSize !== undefined) deal.landSize = req.body.landSize;

  if (req.body.pattas !== undefined && Array.isArray(req.body.pattas)) {
    deal.pattas = req.body.pattas.map(p => ({
      pattaNumber: (p.pattaNumber || '').trim(),
      parcels: Array.isArray(p.parcels) ? p.parcels.map(pr => ({
        surveyNumber: (pr.surveyNumber || '').trim(),
        subDivision: (pr.subDivision || '').trim(),
        landSize: {
          value: parseFloat(pr.landSize ? pr.landSize.value : 0),
          unit: (pr.landSize ? pr.landSize.unit : 'cent') || 'cent'
        },
        landType: (pr.landType || 'dry').trim().toLowerCase()
      })).filter(pr => pr.surveyNumber && pr.landSize.value > 0) : []
    })).filter(p => p.parcels.length > 0);
  }

  if (req.body.parcels !== undefined && Array.isArray(req.body.parcels)) {
    deal.parcels = req.body.parcels.map(p => ({
      surveyNumber: (p.surveyNumber || '').trim(),
      subDivision: (p.subDivision || '').trim(),
      landSize: {
        value: parseFloat(p.landSize ? p.landSize.value : 0),
        unit: (p.landSize ? p.landSize.unit : 'cent') || 'cent'
      },
      landType: (p.landType || 'dry').trim().toLowerCase()
    })).filter(p => p.surveyNumber && p.landSize.value > 0);
  }

  if (req.body.dealStatus !== undefined) deal.dealStatus = req.body.dealStatus;
  if (req.body.agreementDate !== undefined) deal.agreementDate = req.body.agreementDate;
  if (req.body.targetRegistrationDate !== undefined) deal.targetRegistrationDate = req.body.targetRegistrationDate;
  if (req.body.totalPrice !== undefined) deal.totalPrice = parseFloat(req.body.totalPrice) || 0;
  if (req.body.advancePaid !== undefined) deal.advancePaid = parseFloat(req.body.advancePaid) || 0;
  if (req.body.district !== undefined) deal.district = req.body.district.trim();
  if (req.body.sro !== undefined) deal.sro = req.body.sro.trim();
  if (req.body.village !== undefined) deal.village = req.body.village.trim();
  if (req.body.notes !== undefined) deal.notes = req.body.notes.trim();
  if (req.body.attachments !== undefined) deal.attachments = req.body.attachments;

  deal.updatedAt = new Date().toISOString();
  writePendingDealsLocal(deals);
  res.json(deal);
});

app.delete('/api/pending-deals/:id', (req, res) => {
  const { id } = req.params;
  let deals = readPendingDealsLocal();
  deals = deals.filter(d => d.id !== id);
  writePendingDealsLocal(deals);
  res.json({ message: 'Deal deleted successfully.', id });
});

// -------------------------------------------------------------
// Master Whole Survey & Sub-divisions REST APIs
// -------------------------------------------------------------
const MASTER_SURVEYS_FILE = path.join(DATA_DIR, 'master_surveys.json');
if (!process.env.VERCEL && !fs.existsSync(MASTER_SURVEYS_FILE)) {
  try {
    fs.writeFileSync(MASTER_SURVEYS_FILE, JSON.stringify([], null, 2), 'utf8');
  } catch(e) {}
}

function readMasterSurveysLocal() {
  try {
    if (fs.existsSync(MASTER_SURVEYS_FILE)) {
      return JSON.parse(fs.readFileSync(MASTER_SURVEYS_FILE, 'utf8'));
    }
  } catch (e) {}
  return [];
}

function writeMasterSurveysLocal(surveys) {
  if (!process.env.VERCEL) {
    try {
      fs.writeFileSync(MASTER_SURVEYS_FILE, JSON.stringify(surveys, null, 2), 'utf8');
      return true;
    } catch (e) {}
  }
  return false;
}

app.get('/api/master-surveys', (req, res) => {
  const surveys = readMasterSurveysLocal();
  res.json(surveys);
});

app.post('/api/master-surveys', (req, res) => {
  const surveys = readMasterSurveysLocal();
  const subDivs = Array.isArray(req.body.subDivisions) ? req.body.subDivisions : [];
  const newSurvey = {
    id: Date.now().toString(),
    surveyNumber: (req.body.surveyNumber || '').trim(),
    subDivisions: subDivs,
    village: (req.body.village || '').trim(),
    notes: (req.body.notes || '').trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  surveys.push(newSurvey);
  writeMasterSurveysLocal(surveys);
  res.status(201).json(newSurvey);
});

app.put('/api/master-surveys/:id', (req, res) => {
  const { id } = req.params;
  const surveys = readMasterSurveysLocal();
  const index = surveys.findIndex(s => s.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Master survey record not found.' });
  }

  const survey = surveys[index];
  if (req.body.surveyNumber !== undefined) survey.surveyNumber = req.body.surveyNumber.trim();
  if (req.body.subDivisions !== undefined) survey.subDivisions = Array.isArray(req.body.subDivisions) ? req.body.subDivisions : [];
  if (req.body.village !== undefined) survey.village = (req.body.village || '').trim();
  if (req.body.notes !== undefined) survey.notes = (req.body.notes || '').trim();

  survey.updatedAt = new Date().toISOString();
  writeMasterSurveysLocal(surveys);
  res.json(survey);
});

app.delete('/api/master-surveys/:id', (req, res) => {
  const { id } = req.params;
  let surveys = readMasterSurveysLocal();
  surveys = surveys.filter(s => s.id !== id);
  writeMasterSurveysLocal(surveys);
  res.json({ message: 'Master survey record deleted successfully.', id });
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
