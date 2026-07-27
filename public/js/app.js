// -------------------------------------------------------------
// App State Configuration
// -------------------------------------------------------------
const state = {
  records: [],
  nearbyRecords: [],
  searchQuery: '',
  nearbySearchQuery: '',
  transfereeSearchQuery: '',
  transfereeLandTypeFilter: 'all', // 'all' | 'wet' | 'dry' | 'residential' | 'commercial' | 'well'
  activeView: 'myLands', // 'myLands' | 'nearbyLands' | 'transferee'
  pattaFilter: 'all', // 'all' | 'transferred' | 'pending'
  landTypeFilter: 'all', // 'all' | 'wet' | 'dry' | 'residential' | 'commercial'
  filterDeedType: 'all', // 'all' | 'sale_deed' | 'partition_deed' | 'gift_deed' | etc.
  nameFilter: 'all', // 'all' | '[name]'
  sortBy: 'newest', // 'newest' | 'oldest' | 'size-desc' | 'size-asc' | 'survey'
  displayUnit: 'cent', // 'cent' | 'sqft' | 'acre'
  selectedItemCentsMap: {},
  masterSurveys: [],
  masterSurveySearchQuery: '',
  masterSurveyFilterStatus: 'all', // 'all' | 'pending' | 'my_lands' | 'nearby_lands'
  supabaseClient: null,
  currentUser: null,
  isSupabaseConfigured: false
};

function updateSelectionSummary() {
  const bar = document.getElementById('selectionSummaryBar');
  const countBadge = document.getElementById('selectedCountBadge');
  const sumCent = document.getElementById('sumCent');
  const sumSqft = document.getElementById('sumSqft');
  const sumAcre = document.getElementById('sumAcre');
  const sumAre = document.getElementById('sumAre');

  if (!bar) return;

  const keys = Object.keys(state.selectedItemCentsMap);
  if (keys.length === 0) {
    bar.classList.add('hidden');
    return;
  }

  let totalCents = 0;
  keys.forEach(k => {
    totalCents += state.selectedItemCentsMap[k] || 0;
  });

  const conversions = convertUnits(totalCents, 'cent');

  if (countBadge) countBadge.innerText = `${keys.length} Selected`;
  if (sumCent) sumCent.innerText = formatSizeDisplay(conversions.cents, 'cent');
  if (sumSqft) sumSqft.innerText = formatSizeDisplay(conversions.sqft, 'sqft');
  if (sumAcre) sumAcre.innerText = formatSizeDisplay(conversions.acres, 'acre');
  if (sumAre) sumAre.innerText = formatSizeDisplay(conversions.ares, 'are');

  bar.classList.remove('hidden');
}

function handleLandCheckboxChange(cb) {
  const key = cb.dataset.key;
  const cents = parseFloat(cb.dataset.cents) || 0;
  if (!key) return;

  const card = cb.closest('.land-card, .record-card, tr');
  if (cb.checked) {
    state.selectedItemCentsMap[key] = cents;
    if (card) card.classList.add('selected-card');
  } else {
    delete state.selectedItemCentsMap[key];
    if (card) card.classList.remove('selected-card');
  }
  updateSelectionSummary();
}

function clearAllSelections() {
  state.selectedItemCentsMap = {};
  document.querySelectorAll('.land-select-checkbox, .partition-select-checkbox').forEach(cb => {
    cb.checked = false;
    const card = cb.closest('.land-card, .record-card, tr');
    if (card) card.classList.remove('selected-card');
  });
  updateSelectionSummary();
}

function selectAllVisibleItems() {
  document.querySelectorAll('.land-select-checkbox, .partition-select-checkbox').forEach(cb => {
    cb.checked = true;
    const key = cb.dataset.key;
    const cents = parseFloat(cb.dataset.cents) || 0;
    if (key) {
      state.selectedItemCentsMap[key] = cents;
    }
    const card = cb.closest('.land-card, .record-card, tr');
    if (card) card.classList.add('selected-card');
  });
  updateSelectionSummary();
}

document.addEventListener('DOMContentLoaded', () => {
  const clearBtn = document.getElementById('clearSelectionBtn');
  const selectAllBtn = document.getElementById('selectAllBtn');
  if (clearBtn) clearBtn.addEventListener('click', clearAllSelections);
  if (selectAllBtn) selectAllBtn.addEventListener('click', selectAllVisibleItems);
});

function isValidFileUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  return trimmed !== '' && trimmed !== '/' && trimmed !== '#' && trimmed !== 'null' && trimmed !== 'undefined';
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatTransfereeTotalArea(cents) {
  const c = cents.toFixed(2);
  const ac = (cents / 100).toFixed(4);
  const sq = Math.round(cents * 435.6).toLocaleString();
  return `${c} Cents (${ac} Acre | ${sq} Sq Ft)`;
}

// -------------------------------------------------------------
// DOM Elements
// -------------------------------------------------------------
const themeToggle = document.getElementById('themeToggle');
const addRecordBtnTop = document.getElementById('addRecordBtnTop');
const addRecordBtnMobile = document.getElementById('addRecordBtnMobile');
const emptyStateAddBtn = document.getElementById('emptyStateAddBtn');
const drawerOverlay = document.getElementById('drawerOverlay');
const formDrawer = document.getElementById('formDrawer');
const closeDrawerBtn = document.getElementById('closeDrawerBtn');
const cancelFormBtn = document.getElementById('cancelFormBtn');
const deleteRecordBtn = document.getElementById('deleteRecordBtn');
const saveRecordBtn = document.getElementById('saveRecordBtn');
const recordForm = document.getElementById('recordForm');
const purchasedFromContainer = document.getElementById('purchasedFromContainer');
const addPurchasedFromRowBtn = document.getElementById('addPurchasedFromRowBtn');
const docOwnersContainer = document.getElementById('docOwnersContainer');
const addDocOwnerRowBtn = document.getElementById('addDocOwnerRowBtn');
const editRecordBtn = document.getElementById('editRecordBtn');
const pattasContainer = document.getElementById('pattasContainer');
const addPattaBtn = document.getElementById('addPattaBtn');
const notesTextarea = document.getElementById('notes');

const landSizeValue = document.getElementById('landSizeValue');
const unitConversionPreview = document.getElementById('unitConversionPreview');
const convCent = document.getElementById('convCent');
const convSqft = document.getElementById('convSqft');
const convAcre = document.getElementById('convAcre');
const convAre = document.getElementById('convAre');

const isPattaTransferred = document.getElementById('isPattaTransferred');
const pattaStatusDescription = document.getElementById('pattaStatusDescription');

const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const filterPatta = document.getElementById('filterPatta');
const filterType = document.getElementById('filterType');
const filterName = document.getElementById('filterName');
const sortBy = document.getElementById('sortBy');
const viewUnit = document.getElementById('viewUnit');
const landType = document.getElementById('landType');
const district = document.getElementById('district');
const sro = document.getElementById('sro');
const village = document.getElementById('village');

// Auth & Supabase DOM Elements
const openAuthModalBtn = document.getElementById('openAuthModalBtn');
const userBadge = document.getElementById('userBadge');
const userAvatar = document.getElementById('userAvatar');
const userEmailText = document.getElementById('userEmailText');
const logoutBtn = document.getElementById('logoutBtn');

const authModal = document.getElementById('authModal');
const authOverlay = document.getElementById('authOverlay');
const authCloseBtn = document.getElementById('authCloseBtn');
const tabLoginBtn = document.getElementById('tabLoginBtn');
const tabSignupBtn = document.getElementById('tabSignupBtn');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const signupEmail = document.getElementById('signupEmail');
const signupPassword = document.getElementById('signupPassword');

// EC Modal Elements
const ecOverlay = document.getElementById('ecOverlay');
const ecModal = document.getElementById('ecModal');
const ecCloseBtn = document.getElementById('ecCloseBtn');
const ecDistrictVal = document.getElementById('ecDistrictVal');
const ecSroVal = document.getElementById('ecSroVal');
const ecVillageVal = document.getElementById('ecVillageVal');
const ecSurveyVal = document.getElementById('ecSurveyVal');
const ecSubDivVal = document.getElementById('ecSubDivVal');
const ecDateRangeVal = document.getElementById('ecDateRangeVal');

const recordsContainer = document.getElementById('recordsContainer');
const recordsCountTitle = document.getElementById('recordsCountTitle');

const statTotalParcels = document.getElementById('statTotalParcels');
const statTotalSize = document.getElementById('statTotalSize');
const statTotalSizeSub1 = document.getElementById('statTotalSizeSub1');
const statTotalSizeSub2 = document.getElementById('statTotalSizeSub2');
const statPattaTransferred = document.getElementById('statPattaTransferred');
const statPattaPercentage = document.getElementById('statPattaPercentage');

const exportCsvBtn = document.getElementById('exportCsvBtn');
const backupBtn = document.getElementById('backupBtn');
const importBtn = document.getElementById('importBtn');
const importFileSelector = document.getElementById('importFileSelector');

const confirmOverlay = document.getElementById('confirmOverlay');
const confirmModal = document.getElementById('confirmModal');
const confirmCancelBtn = document.getElementById('confirmCancelBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

const toastContainer = document.getElementById('toastContainer');

let activeDeleteId = null;
let tempAttachments = {
  document: null,
  ec: null,
  fmb: null
};

// -------------------------------------------------------------
// Supabase Authentication & Storage Manager
// -------------------------------------------------------------
const DEFAULT_SUPABASE_URL = 'https://qmklpsxnvvwsqhgqareq.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_fxcrFk5jWCf64uoJ212k3A_XneKuPgZ';

function initSupabase() {
  const url = DEFAULT_SUPABASE_URL;
  const key = DEFAULT_SUPABASE_KEY;
  const subtitleEl = document.getElementById('storageModeSubtitle');
  const activeDbModeText = document.getElementById('activeDbModeText');

  if (url && key && window.supabase) {
    try {
      const client = window.supabase.createClient(url, key);
      state.supabaseClient = client;
      state.isSupabaseConfigured = true;

      if (subtitleEl) subtitleEl.innerText = 'Supabase Cloud Database';
      if (activeDbModeText) activeDbModeText.innerText = `Supabase Cloud (${new URL(url).hostname})`;

      // Load saved user session
      const savedUserStr = localStorage.getItem('logged_user');
      if (savedUserStr) {
        try {
          state.currentUser = JSON.parse(savedUserStr);
        } catch (e) {
          state.currentUser = null;
        }
      } else {
        state.currentUser = null;
      }

      updateAuthUI();
      fetchRecords();
      return;
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
    }
  }

  // Fallback mode
  state.supabaseClient = null;
  state.isSupabaseConfigured = false;
  if (subtitleEl) subtitleEl.innerText = 'Supabase Cloud Database';
  if (activeDbModeText) activeDbModeText.innerText = 'Supabase Cloud Database';
  updateAuthUI();
}

function updateAuthUI() {
  if (state.currentUser) {
    if (userBadge) userBadge.classList.remove('hidden');
    if (openAuthModalBtn) openAuthModalBtn.classList.add('hidden');
    if (userAvatar) userAvatar.innerText = (state.currentUser.email || 'U').charAt(0).toUpperCase();
    if (userEmailText) userEmailText.innerText = state.currentUser.email || 'Logged In';
  } else {
    if (userBadge) userBadge.classList.add('hidden');
    if (openAuthModalBtn) openAuthModalBtn.classList.remove('hidden');
  }
}

// Modal Toggle Handlers
function openAuthModal() {
  if (authModal && authOverlay) {
    authModal.classList.add('active');
    authOverlay.classList.add('active');
  }
}

function closeAuthModal() {
  if (authModal && authOverlay) {
    authModal.classList.remove('active');
    authOverlay.classList.remove('active');
  }
}

if (openAuthModalBtn) openAuthModalBtn.addEventListener('click', openAuthModal);
if (authCloseBtn) authCloseBtn.addEventListener('click', closeAuthModal);
if (authOverlay) authOverlay.addEventListener('click', closeAuthModal);

if (tabLoginBtn && tabSignupBtn) {
  tabLoginBtn.addEventListener('click', () => {
    tabLoginBtn.classList.add('active');
    tabSignupBtn.classList.remove('active');
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
  });

  tabSignupBtn.addEventListener('click', () => {
    tabSignupBtn.classList.add('active');
    tabLoginBtn.classList.remove('active');
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.supabaseClient) {
      showToast('Supabase client connection error.', 'error');
      return;
    }

    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();

    try {
      const { data, error } = await state.supabaseClient
        .from('users')
        .select('*')
        .ilike('email', email)
        .eq('password', password);

      if (error) throw error;

      if (!data || data.length === 0) {
        showToast('Invalid email or password. Please check your credentials.', 'error');
        return;
      }

      const matchedUser = data[0];
      state.currentUser = matchedUser;
      localStorage.setItem('logged_user', JSON.stringify(matchedUser));

      updateAuthUI();
      showToast(`Welcome back, ${matchedUser.email}!`, 'success');
      closeAuthModal();
      fetchRecords();
    } catch (err) {
      console.error('Login error:', err);
      showToast(err.message || 'Failed to log in.', 'error');
    }
  });
}

if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.supabaseClient) {
      showToast('Supabase client connection error.', 'error');
      return;
    }

    const email = signupEmail.value.trim();
    const password = signupPassword.value.trim();

    try {
      const newUser = { email, password, name: email.split('@')[0] };
      const { data, error } = await state.supabaseClient
        .from('users')
        .insert([newUser])
        .select();

      if (error) throw error;

      const createdUser = (data && data.length > 0) ? data[0] : newUser;
      state.currentUser = createdUser;
      localStorage.setItem('logged_user', JSON.stringify(createdUser));

      updateAuthUI();
      showToast('Account registered & logged in successfully!', 'success');
      closeAuthModal();
      fetchRecords();
    } catch (err) {
      console.error('Signup error:', err);
      showToast(err.message || 'Failed to create user record.', 'error');
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('logged_user');
    state.currentUser = null;
    updateAuthUI();
    showToast('Signed out.', 'info');
    fetchRecords();
  });
}



// Upload file helper to Supabase Storage
async function uploadFileToSupabase(fileData, pathPrefix) {
  if (!state.supabaseClient || !fileData || !fileData.base64) return null;

  try {
    const matches = fileData.base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches) return null;

    const mimeType = matches[1];
    const base64Data = matches[2];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    const ext = (fileData.name || 'document').split('.').pop() || 'bin';
    const cleanPrefix = (pathPrefix || 'file').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = `${cleanPrefix}_${Date.now()}.${ext}`;

    const { data, error } = await state.supabaseClient.storage
      .from('land_documents')
      .upload(filePath, blob, { contentType: mimeType, upsert: true });

    if (error) {
      console.error('Supabase storage upload error:', error);
      return null;
    }

    const { data: publicUrlData } = state.supabaseClient.storage
      .from('land_documents')
      .getPublicUrl(filePath);

    return {
      fileName: fileData.name,
      fileUrl: publicUrlData.publicUrl,
      uploadedAt: new Date().toISOString()
    };
  } catch (err) {
    console.error('Error uploading file to Supabase:', err);
    return null;
  }
}

// -------------------------------------------------------------
// Document Fallbacks & Computations
// -------------------------------------------------------------
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
          const conv = convertUnits(parcel.landSize.value, parcel.landSize.unit);
          totalCents += conv.cents;
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

// -------------------------------------------------------------
// Unit Conversion Helper Constants
// -------------------------------------------------------------
const SQFT_PER_CENT = 435.6;
const CENTS_PER_ACRE = 100;
const SQFT_PER_ACRE = 43560;
const SQFT_PER_ARE = 1076.391;

// Convert size from a baseline unit to others
function convertUnits(value, fromUnit) {
  let cents = 0;
  let sqft = 0;
  let acres = 0;
  let ares = 0;
  const val = parseFloat(value);

  if (isNaN(val) || val <= 0) {
    return { cents: 0, sqft: 0, acres: 0, ares: 0 };
  }

  switch (fromUnit) {
    case 'cent':
      cents = val;
      sqft = val * SQFT_PER_CENT;
      acres = val / CENTS_PER_ACRE;
      ares = sqft / SQFT_PER_ARE;
      break;
    case 'sqft':
      cents = val / SQFT_PER_CENT;
      sqft = val;
      acres = val / SQFT_PER_ACRE;
      ares = val / SQFT_PER_ARE;
      break;
    case 'acre':
      cents = val * CENTS_PER_ACRE;
      sqft = val * SQFT_PER_ACRE;
      acres = val;
      ares = sqft / SQFT_PER_ARE;
      break;
    case 'are':
      cents = (val * SQFT_PER_ARE) / SQFT_PER_CENT;
      sqft = val * SQFT_PER_ARE;
      acres = (val * SQFT_PER_ARE) / SQFT_PER_ACRE;
      ares = val;
      break;
  }
  return { cents, sqft, acres, ares };
}

// Convert from records storage unit to target display unit
function getDisplayValue(sizeObj, targetUnit) {
  const value = sizeObj.value;
  const sourceUnit = sizeObj.unit;
  const conversions = convertUnits(value, sourceUnit);

  switch (targetUnit) {
    case 'cent':
      return conversions.cents;
    case 'sqft':
      return conversions.sqft;
    case 'acre':
      return conversions.acres;
    case 'are':
      return conversions.ares;
  }
}

// Formats display sizes nicely
function formatSizeDisplay(value, unit) {
  const rounded = unit === 'sqft' ? Math.round(value) : (unit === 'acre' || unit === 'are' ? value.toFixed(4) : value.toFixed(3));
  const formattedVal = Number(rounded).toLocaleString(undefined, {
    minimumFractionDigits: unit === 'sqft' ? 0 : 2,
    maximumFractionDigits: unit === 'sqft' ? 0 : 4
  });

  const labels = {
    cent: 'Cent',
    sqft: 'Sq Ft',
    acre: 'Acre',
    are: 'Are'
  };

  return `${formattedVal} ${labels[unit]}`;
}

// -------------------------------------------------------------
// Theme Management
// -------------------------------------------------------------
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  if (savedTheme === 'light') {
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
  } else {
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');
  }
}

themeToggle.addEventListener('click', () => {
  if (document.body.classList.contains('dark-theme')) {
    document.body.classList.replace('dark-theme', 'light-theme');
    localStorage.setItem('theme', 'light');
    showToast('Switched to Light Theme', 'info');
  } else {
    document.body.classList.replace('light-theme', 'dark-theme');
    localStorage.setItem('theme', 'dark');
    showToast('Switched to Dark Theme', 'info');
  }
});

// -------------------------------------------------------------
// Toast Notifications
// -------------------------------------------------------------
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${message}</span>
    <button class="toast-close">&times;</button>
  `;

  toastContainer.appendChild(toast);

  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    toast.remove();
  });

  // Remove toast automatically
  setTimeout(() => {
    toast.style.animation = 'toastIn 0.3s reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// -------------------------------------------------------------
// Dynamic Names Management
// -------------------------------------------------------------
function addDynamicNameRow(container, inputClass, placeholder, value = '', isRequired = false, minRows = 0, requiredMsg = '') {
  const row = document.createElement('div');
  row.className = 'name-row';
  row.innerHTML = `
    <input type="text" class="${inputClass}" placeholder="${placeholder}" value="${value}">
    <button type="button" class="remove-name-btn" aria-label="Remove Row">&times;</button>
  `;

  container.appendChild(row);

  const removeBtn = row.querySelector('.remove-name-btn');
  removeBtn.addEventListener('click', () => {
    const rows = container.querySelectorAll('.name-row');
    if (rows.length > minRows) {
      row.remove();
    } else if (isRequired) {
      showToast(requiredMsg || 'At least one name is required.', 'error');
    } else {
      row.remove();
    }
  });
}

addDocOwnerRowBtn.addEventListener('click', () => {
  addDynamicNameRow(docOwnersContainer, 'doc-owner-name-input', 'e.g., Manoj Kumar', '', true, 1, 'At least one document owner is required.');
});

addPurchasedFromRowBtn.addEventListener('click', () => {
  addDynamicNameRow(purchasedFromContainer, 'purchased-from-input', 'e.g., L. Ganesan', '', false, 0);
});

// Initialize name row inside drawer
function resetDocumentInputs(docOwners = [], sellers = []) {
  docOwnersContainer.innerHTML = '';
  purchasedFromContainer.innerHTML = '';

  if (docOwners.length === 0) {
    addDynamicNameRow(docOwnersContainer, 'doc-owner-name-input', 'e.g., Manoj Kumar', '', true, 1, 'At least one document owner is required.');
  } else {
    docOwners.forEach(name => {
      addDynamicNameRow(docOwnersContainer, 'doc-owner-name-input', 'e.g., Manoj Kumar', name, true, 1, 'At least one document owner is required.');
    });
  }

  if (sellers.length === 0) {
    addDynamicNameRow(purchasedFromContainer, 'purchased-from-input', 'e.g., L. Ganesan', '', false, 0);
  } else {
    sellers.forEach(name => {
      addDynamicNameRow(purchasedFromContainer, 'purchased-from-input', 'e.g., L. Ganesan', name, false, 0);
    });
  }
}

// -------------------------------------------------------------
// Hierarchical Pattas & Parcels Management
// -------------------------------------------------------------
function addPattaInputBlock(pattaNumber = '', isPattaTransferred = false, pattaNames = [], parcels = [], attachment = null) {
  const block = document.createElement('div');
  block.className = 'patta-block';
  block.innerHTML = `
    <div class="patta-block-header">
      <div class="patta-block-header-inputs">
        <div class="form-group" style="flex-grow: 1; min-width: 150px;">
          <label style="font-size: 0.8rem; text-transform: uppercase;">Patta Number *</label>
          <input type="text" class="patta-number-input" placeholder="e.g., 840" value="${pattaNumber}" required>
        </div>
        <div class="form-group" style="min-width: 250px;">
          <div class="toggle-container" style="margin-top: 20px;">
            <div class="toggle-text">
              <span class="toggle-title" style="font-size: 0.85rem;">Patta Status</span>
              <span class="toggle-desc patta-status-desc-label" style="font-size: 0.75rem; color: ${isPattaTransferred ? 'var(--success)' : 'var(--text-muted)'};">
                ${isPattaTransferred ? 'Transferred (Completed)' : 'Pending Transfer'}
              </span>
            </div>
            <label class="switch">
              <input type="checkbox" class="patta-status-checkbox" ${isPattaTransferred ? 'checked' : ''}>
              <span class="slider round"></span>
            </label>
          </div>
        </div>
      </div>
      <button type="button" class="remove-patta-btn" aria-label="Remove Patta">&times;</button>
    </div>

    <!-- Patta Owners Section -->
    <div class="form-group patta-owners-box">
      <label style="font-size: 0.8rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted);">Patta Names (Owners) *</label>
      <div class="patta-owners-container"></div>
      <button type="button" class="btn btn-outline-dashed btn-sm add-patta-owner-btn" style="width: max-content;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 12px; height: 12px; margin-right: 4px;"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
        Add Owner Name
      </button>
    </div>

    <!-- Patta Parcels Section -->
    <div class="form-group patta-parcels-box">
      <label style="font-size: 0.8rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted);">Land Parcels under this Patta *</label>
      
      <div class="parcels-header hide-on-mobile" style="display: grid; grid-template-columns: 2fr 1.5fr 2fr 1.8fr 2.2fr 36px; gap: 12px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; padding: 0 4px; margin-bottom: 4px; margin-top: 8px;">
        <div>Survey No *</div>
        <div>Subdivision</div>
        <div>Size *</div>
        <div>Unit</div>
        <div>Type</div>
        <div></div>
      </div>

      <div class="patta-parcels-container"></div>
      
      <button type="button" class="btn btn-outline-dashed btn-sm add-patta-parcel-btn" style="width: max-content; margin-top: 8px;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 12px; height: 12px; margin-right: 4px;"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
        Add Land Parcel
      </button>
    </div>

    <!-- Patta Attachment Section -->
    <div class="form-group patta-attachment-box" style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed rgba(255,255,255,0.05);">
      <label style="font-size: 0.8rem; font-weight: 600; text-transform: uppercase; color: var(--text-secondary); letter-spacing: 0.05em; display: block; margin-bottom: 6px;">Patta Copy (Optional)</label>
      <div class="upload-area patta-upload-area" style="min-height: 50px; padding: 10px; display: flex; flex-direction: row; align-items: center; justify-content: center; gap: 8px;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px; color: var(--text-muted);"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <span style="font-size: 0.75rem;">Upload Patta</span>
        <input type="file" class="patta-file-input" accept="application/pdf,image/*" style="display: none;">
      </div>
      <div class="attachment-status patta-attachment-status hidden" style="min-height: 50px; padding: 10px; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
        <span class="attachment-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        </span>
        <span class="attachment-name patta-attachment-name" style="font-size: 0.75rem;"></span>
        <div class="attachment-actions">
          <a href="#" target="_blank" class="btn-view-attachment patta-view-link" title="View Patta" style="width: 20px; height: 20px;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 12px; height: 12px;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
          <button type="button" class="btn-remove-attachment patta-remove-btn" title="Delete Attachment" style="width: 20px; height: 20px; font-size: 1rem;">&times;</button>
        </div>
      </div>
    </div>
  `;

  pattasContainer.appendChild(block);

  const ownersContainer = block.querySelector('.patta-owners-container');
  const parcelsContainer = block.querySelector('.patta-parcels-container');
  const addOwnerBtn = block.querySelector('.add-patta-owner-btn');
  const addParcelBtn = block.querySelector('.add-patta-parcel-btn');
  const removeBlockBtn = block.querySelector('.remove-patta-btn');
  const statusCheckbox = block.querySelector('.patta-status-checkbox');
  const statusDescLabel = block.querySelector('.patta-status-desc-label');

  const uploadArea = block.querySelector('.patta-upload-area');
  const fileInput = block.querySelector('.patta-file-input');
  const statusDiv = block.querySelector('.patta-attachment-status');
  const nameSpan = block.querySelector('.patta-attachment-name');
  const viewLink = block.querySelector('.patta-view-link');
  const removeBtn = block.querySelector('.patta-remove-btn');


  function updatePattaBlockUI(att) {
    const validUrl = att && isValidFileUrl(att.fileUrl) ? att.fileUrl : null;
    if (validUrl) {
      uploadArea.classList.add('hidden');
      statusDiv.classList.remove('hidden');
      nameSpan.innerText = att.fileName || 'Patta File';
      viewLink.href = validUrl;
      viewLink.classList.remove('hidden');
    } else {
      uploadArea.classList.remove('hidden');
      statusDiv.classList.add('hidden');
      nameSpan.innerText = '';
      viewLink.href = '#';
      viewLink.classList.add('hidden');
    }
  }

  uploadArea.addEventListener('click', () => {
    const isEditable = !document.getElementById('documentNumber').disabled;
    if (isEditable) {
      fileInput.click();
    }
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      showToast('File is too large. Maximum size is 15MB.', 'error');
      fileInput.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = function(evt) {
      block.pattaAttachmentData = {
        name: file.name,
        base64: evt.target.result
      };
      updatePattaBlockUI({
        fileName: file.name,
        fileUrl: URL.createObjectURL(file)
      });
    };
    reader.readAsDataURL(file);
  });

  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isEditable = !document.getElementById('documentNumber').disabled;
    if (!isEditable) return;

    block.pattaAttachmentData = { delete: true };
    fileInput.value = '';
    updatePattaBlockUI(null);
  });

  if (attachment) {
    updatePattaBlockUI(attachment);
  }

  // Hook up Status Switch Change Listener
  statusCheckbox.addEventListener('change', () => {
    if (statusCheckbox.checked) {
      statusDescLabel.innerText = 'Transferred (Completed)';
      statusDescLabel.style.color = 'var(--success)';
    } else {
      statusDescLabel.innerText = 'Pending Transfer';
      statusDescLabel.style.color = 'var(--text-muted)';
    }
  });

  // Hook up Add Owner Button
  addOwnerBtn.addEventListener('click', () => {
    addDynamicNameRow(ownersContainer, 'patta-name-input', 'e.g., K. Ramasamy', '', true, 1, 'At least one patta owner is required.');
  });

  // Hook up Add Parcel Button
  addParcelBtn.addEventListener('click', () => {
    addParcelInputRow(parcelsContainer);
  });

  // Hook up Remove Patta Block Button
  removeBlockBtn.addEventListener('click', () => {
    const blocks = pattasContainer.querySelectorAll('.patta-block');
    if (blocks.length > 1) {
      block.remove();
      handleLiveConversion();
    } else {
      showToast('At least one Patta Record is required.', 'error');
    }
  });

  // Populate dynamic owners list
  if (pattaNames.length === 0) {
    addDynamicNameRow(ownersContainer, 'patta-name-input', 'e.g., K. Ramasamy', '', true, 1, 'At least one patta owner is required.');
  } else {
    pattaNames.forEach(name => {
      addDynamicNameRow(ownersContainer, 'patta-name-input', 'e.g., K. Ramasamy', name, true, 1, 'At least one patta owner is required.');
    });
  }

  // Populate dynamic parcels list
  if (parcels.length === 0) {
    addParcelInputRow(parcelsContainer);
  } else {
    parcels.forEach(p => {
      addParcelInputRow(parcelsContainer, p.surveyNumber, p.subDivision, p.landSize.value, p.landSize.unit, p.landType);
    });
  }
}

function addParcelInputRow(container, survey = '', subdiv = '', size = '', unit = 'cent', type = 'dry') {
  const row = document.createElement('div');
  row.className = 'parcel-row';
  row.innerHTML = `
    <div class="form-group">
      <input type="text" class="parcel-survey-input" placeholder="Survey No" value="${survey}" required>
    </div>
    <div class="form-group">
      <input type="text" class="parcel-subdiv-input" placeholder="Subdivision" value="${subdiv}">
    </div>
    <div class="form-group">
      <input type="number" class="parcel-size-input" placeholder="Size" step="any" min="0.0001" value="${size}" required>
    </div>
    <div class="form-group">
      <select class="select-input parcel-unit-input">
        <option value="cent" ${unit === 'cent' ? 'selected' : ''}>Cent</option>
        <option value="sqft" ${unit === 'sqft' ? 'selected' : ''}>Sq Ft</option>
        <option value="acre" ${unit === 'acre' ? 'selected' : ''}>Acre</option>
        <option value="are" ${unit === 'are' ? 'selected' : ''}>Are</option>
      </select>
    </div>
    <div class="form-group">
      <select class="select-input parcel-type-input">
        <option value="wet" ${type === 'wet' ? 'selected' : ''}>Wet (Nanjai)</option>
        <option value="dry" ${type === 'dry' ? 'selected' : ''}>Dry (Punjai)</option>
        <option value="residential" ${type === 'residential' ? 'selected' : ''}>Resi (Manai)</option>
        <option value="commercial" ${type === 'commercial' ? 'selected' : ''}>Commercial</option>
        <option value="well" ${type === 'well' ? 'selected' : ''}>Well (Kenaru)</option>
      </select>
    </div>
    <button type="button" class="remove-parcel-btn" aria-label="Remove Parcel">&times;</button>
  `;

  container.appendChild(row);

  const removeBtn = row.querySelector('.remove-parcel-btn');
  removeBtn.addEventListener('click', () => {
    const rows = container.querySelectorAll('.parcel-row');
    if (rows.length > 1) {
      row.remove();
      handleLiveConversion();
    } else {
      showToast('At least one land parcel is required in this Patta.', 'error');
    }
  });

  // Attach change listeners to size and unit inputs
  row.querySelector('.parcel-size-input').addEventListener('input', handleLiveConversion);
  row.querySelector('.parcel-unit-input').addEventListener('change', handleLiveConversion);
}

addPattaBtn.addEventListener('click', () => addPattaInputBlock());

function resetPattaInputs(pattas = []) {
  pattasContainer.innerHTML = '';
  if (pattas.length === 0) {
    addPattaInputBlock();
  } else {
    pattas.forEach(p => {
      addPattaInputBlock(p.pattaNumber, p.isPattaTransferred, p.pattaNames, p.parcels, p.attachment || null);
    });
  }
}

// -------------------------------------------------------------
// Live Unit Conversions
// -------------------------------------------------------------
function handleLiveConversion() {
  let totalCents = 0;
  const rows = pattasContainer.querySelectorAll('.parcel-row');
  let hasValidSize = false;
  
  rows.forEach(row => {
    const sizeInput = row.querySelector('.parcel-size-input');
    const unitInput = row.querySelector('.parcel-unit-input');
    if (sizeInput && unitInput) {
      const val = parseFloat(sizeInput.value);
      const unit = unitInput.value;
      if (!isNaN(val) && val > 0) {
        hasValidSize = true;
        const conv = convertUnits(val, unit);
        totalCents += conv.cents;
      }
    }
  });

  if (!hasValidSize) {
    unitConversionPreview.classList.add('hidden');
    return;
  }

  unitConversionPreview.classList.remove('hidden');
  const results = convertUnits(totalCents, 'cent');

  convCent.innerText = results.cents.toLocaleString(undefined, { maximumFractionDigits: 2 });
  convSqft.innerText = Math.round(results.sqft).toLocaleString();
  convAcre.innerText = results.acres.toLocaleString(undefined, { maximumFractionDigits: 4 });
  convAre.innerText = results.ares.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

// -------------------------------------------------------------
// Toggle Switch State Watcher
// -------------------------------------------------------------
// -------------------------------------------------------------
// Drawer Controller
// -------------------------------------------------------------
function toggleFormEditable(editable) {
  const inputs = recordForm.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    if (input.type === 'hidden') return;
    input.disabled = !editable;
  });

  // Disable/enable unit selector interactions
  document.querySelectorAll('.unit-selector label').forEach(lbl => {
    lbl.style.pointerEvents = editable ? 'auto' : 'none';
  });

  // Toggle dynamic add buttons
  addDocOwnerRowBtn.style.display = editable ? 'inline-flex' : 'none';
  addPurchasedFromRowBtn.style.display = editable ? 'inline-flex' : 'none';
  addPattaBtn.style.display = editable ? 'inline-flex' : 'none';

  document.querySelectorAll('.add-patta-owner-btn').forEach(btn => {
    btn.style.display = editable ? 'inline-flex' : 'none';
  });
  document.querySelectorAll('.add-patta-parcel-btn').forEach(btn => {
    btn.style.display = editable ? 'inline-flex' : 'none';
  });

  // Toggle remove row buttons
  document.querySelectorAll('.remove-name-btn').forEach(btn => {
    btn.style.display = editable ? 'flex' : 'none';
  });
  document.querySelectorAll('.remove-parcel-btn').forEach(btn => {
    btn.style.display = editable ? 'flex' : 'none';
  });
  document.querySelectorAll('.remove-patta-btn').forEach(btn => {
    btn.style.display = editable ? 'flex' : 'none';
  });

  // Toggle status switch sliders pointerEvents
  document.querySelectorAll('.patta-block .switch').forEach(sw => {
    sw.style.pointerEvents = editable ? 'auto' : 'none';
  });

  // Toggle remove buttons on attachments
  document.querySelectorAll('.btn-remove-attachment').forEach(btn => {
    btn.style.display = editable ? 'inline-flex' : 'none';
  });

  // Handle upload boxes visibility when viewing
  ['document', 'ec', 'fmb'].forEach(type => {
    const box = document.getElementById(`uploadBox${type.charAt(0).toUpperCase() + type.slice(1)}`);
    if (!box) return;
    const hasFile = state.activeRecord && state.activeRecord.attachments && state.activeRecord.attachments[type];
    const tempFile = tempAttachments[type] && !tempAttachments[type].delete;

    if (!editable) {
      // View mode
      if (hasFile || tempFile) {
        box.classList.remove('hidden');
      } else {
        box.classList.add('hidden');
      }
    } else {
      // Edit/Add mode
      box.classList.remove('hidden');
    }
  });

  // Handle patta-level upload boxes visibility & interactions when viewing/editing
  document.querySelectorAll('.patta-block').forEach(block => {
    const uploadArea = block.querySelector('.patta-upload-area');
    const statusDiv = block.querySelector('.patta-attachment-status');
    const removeBtn = block.querySelector('.patta-remove-btn');
    
    if (removeBtn) {
      removeBtn.style.display = editable ? 'inline-flex' : 'none';
    }

    const hasFile = statusDiv && !statusDiv.classList.contains('hidden');

    if (!editable) {
      if (uploadArea && !hasFile) {
        uploadArea.classList.add('hidden');
      }
    } else {
      if (uploadArea && !hasFile) {
        uploadArea.classList.remove('hidden');
      }
    }
  });

  // Toggle action buttons visibility
  if (editable) {
    saveRecordBtn.classList.remove('hidden');
    editRecordBtn.classList.add('hidden');
    const recordIdVal = document.getElementById('recordId').value;
    if (recordIdVal) {
      deleteRecordBtn.classList.remove('hidden');
    } else {
      deleteRecordBtn.classList.add('hidden');
    }
  } else {
    saveRecordBtn.classList.add('hidden');
    deleteRecordBtn.classList.add('hidden');
    editRecordBtn.classList.remove('hidden');
  }
}

function updateAttachmentUI(type, attachmentObj) {
  const name = type.charAt(0).toUpperCase() + type.slice(1);
  const uploadArea = document.getElementById(`area${name}`);
  const statusDiv = document.getElementById(`status${name}`);
  const nameSpan = document.getElementById(`name${name}`);
  const viewLink = document.getElementById(`view${name}`);

  if (!uploadArea || !statusDiv) return;

  const validUrl = attachmentObj && isValidFileUrl(attachmentObj.fileUrl) ? attachmentObj.fileUrl : null;

  if (validUrl) {
    uploadArea.classList.add('hidden');
    statusDiv.classList.remove('hidden');
    nameSpan.innerText = attachmentObj.fileName || `${name} File`;
    viewLink.href = validUrl;
    viewLink.classList.remove('hidden');
  } else {
    uploadArea.classList.remove('hidden');
    statusDiv.classList.add('hidden');
    nameSpan.innerText = '';
    viewLink.href = '#';
    viewLink.classList.add('hidden');
  }
}

// -------------------------------------------------------------
// Drawer Controller
// -------------------------------------------------------------
function openDrawer(record = null) {
  formDrawer.classList.add('active');
  drawerOverlay.classList.add('active');
  document.body.style.overflow = 'hidden'; // Stop background scrolling
  state.activeRecord = record;

  // Reset temp attachment state
  tempAttachments = {
    document: null,
    ec: null,
    fmb: null
  };

  // Reset file inputs
  ['fileDocument', 'fileEc', 'fileFmb'].forEach(id => {
    const inp = document.getElementById(id);
    if (inp) inp.value = '';
  });

  if (record) {
    // View Mode (details view)
    document.getElementById('drawerTitle').innerText = 'Land Record Details';
    document.getElementById('recordId').value = record.id;
    document.getElementById('documentNumber').value = record.documentNumber;
    document.getElementById('deedType').value = record.deedType || 'sale_deed';
    document.getElementById('purchaseDate').value = record.purchaseDate ? record.purchaseDate.split('T')[0] : '';
    
    // Fallback fields for legacy selectors
    document.getElementById('surveyNumber').value = record.surveyNumber || '';
    document.getElementById('subDivision').value = record.subDivision || '';
    document.getElementById('pattaNumber').value = record.pattaNumber || '';
    document.getElementById('landType').value = record.landType || 'dry';
    document.getElementById('isPattaTransferred').value = record.isPattaTransferred ? 'true' : 'false';

    // Location
    district.value = record.district || '';
    sro.value = record.sro || '';
    village.value = record.village || '';
    
    // Notes
    notesTextarea.value = record.notes || '';
    
    // Land Size fallback for compatibility
    document.getElementById('landSizeValue').value = record.landSize ? record.landSize.value : '';

    // Dynamic document owner & seller lists
    resetDocumentInputs(record.documentOwnerName || [], record.purchasedFrom || []);

    // Dynamic pattas list
    resetPattaInputs(record.pattas || []);

    // Populate attachments UI
    const atts = record.attachments || {};
    updateAttachmentUI('document', atts.document);
    updateAttachmentUI('ec', atts.ec);
    updateAttachmentUI('fmb', atts.fmb);

    // Populate drawer metadata dates
    const drawerMetadataEl = document.getElementById('drawerRecordMetadata');
    const metaCreatedEl = document.getElementById('metaCreatedDate');
    const metaUpdatedEl = document.getElementById('metaUpdatedDate');
    if (drawerMetadataEl) {
      drawerMetadataEl.classList.remove('hidden');
      const cDate = record.createdAt ? new Date(record.createdAt) : null;
      const uDate = record.updatedAt ? new Date(record.updatedAt) : (cDate || null);
      
      const cStr = cDate && !isNaN(cDate.getTime()) ? cDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
      const uStr = uDate && !isNaN(uDate.getTime()) ? uDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : cStr;
      
      if (metaCreatedEl) metaCreatedEl.innerText = cStr;
      if (metaUpdatedEl) metaUpdatedEl.innerText = uStr;
    }

    // Disable all inputs for viewing
    toggleFormEditable(false);
  } else {
    const drawerMetadataEl = document.getElementById('drawerRecordMetadata');
    if (drawerMetadataEl) drawerMetadataEl.classList.add('hidden');

    // Add Mode (editable from the start)
    document.getElementById('drawerTitle').innerText = 'Add Land Record';
    document.getElementById('recordId').value = '';
    recordForm.reset();
    district.value = '';
    sro.value = '';
    village.value = '';
    notesTextarea.value = '';
    document.getElementById('surveyNumber').value = '';
    document.getElementById('subDivision').value = '';
    document.getElementById('pattaNumber').value = '';
    document.getElementById('deedType').value = 'sale_deed';
    document.getElementById('landType').value = 'dry';
    document.getElementById('isPattaTransferred').value = 'false';
    resetDocumentInputs();
    resetPattaInputs();
    
    // Reset attachments UI
    updateAttachmentUI('document', null);
    updateAttachmentUI('ec', null);
    updateAttachmentUI('fmb', null);

    // Enable inputs
    toggleFormEditable(true);
  }
  handleLiveConversion();
}

function closeDrawer() {
  formDrawer.classList.remove('active');
  drawerOverlay.classList.remove('active');
  document.body.style.overflow = ''; // Resume scrolling
  state.activeRecord = null;
  
  // Clear any validation errors
  document.querySelectorAll('.form-group.invalid').forEach(el => el.classList.remove('invalid'));
}

[addRecordBtnTop, addRecordBtnMobile, emptyStateAddBtn].forEach(btn => {
  if (btn) btn.addEventListener('click', () => openDrawer());
});

closeDrawerBtn.addEventListener('click', closeDrawer);
drawerOverlay.addEventListener('click', closeDrawer);

cancelFormBtn.addEventListener('click', (e) => {
  e.preventDefault();
  const isEditable = !document.getElementById('surveyNumber').disabled;
  if (state.activeRecord && isEditable) {
    openDrawer(state.activeRecord);
  } else {
    closeDrawer();
  }
});

editRecordBtn.addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('drawerTitle').innerText = 'Edit Land Record';
  toggleFormEditable(true);
});

// -------------------------------------------------------------
// Form Validation & Submission
// -------------------------------------------------------------
function validateForm() {
  let isValid = true;

  // Clear errors
  document.querySelectorAll('.form-group.invalid, .patta-owners-box.invalid, .patta-parcels-box.invalid').forEach(el => el.classList.remove('invalid'));

  // Doc number
  const doc = document.getElementById('documentNumber');
  if (!doc.value.trim()) {
    doc.parentElement.classList.add('invalid');
    isValid = false;
  }

  // Check document owner names
  const docOwnerInputs = docOwnersContainer.querySelectorAll('.doc-owner-name-input');
  let hasDocOwner = false;
  docOwnerInputs.forEach(input => {
    if (input.value.trim()) hasDocOwner = true;
  });

  const docOwnersError = document.getElementById('docOwnersError');
  if (!hasDocOwner) {
    docOwnersError.style.display = 'block';
    isValid = false;
  } else {
    docOwnersError.style.display = 'none';
  }

  // Validate dynamic hierarchical pattas
  const pattaBlocks = pattasContainer.querySelectorAll('.patta-block');
  let hasValidPatta = false;
  
  pattaBlocks.forEach(block => {
    const pattaNumInput = block.querySelector('.patta-number-input');
    const pattaNameInputs = block.querySelectorAll('.patta-name-input');
    const parcelRows = block.querySelectorAll('.parcel-row');
    let pattaValid = true;

    // Check patta number
    if (!pattaNumInput || !pattaNumInput.value.trim()) {
      pattaNumInput.parentElement.classList.add('invalid');
      isValid = false;
      pattaValid = false;
    }

    // Check patta owners
    let hasPattaOwner = false;
    pattaNameInputs.forEach(input => {
      if (input.value.trim()) hasPattaOwner = true;
    });
    if (!hasPattaOwner) {
      block.querySelector('.patta-owners-box').classList.add('invalid');
      isValid = false;
      pattaValid = false;
    }

    // Check parcels inside this patta
    let hasParcel = false;
    parcelRows.forEach(row => {
      const surveyInput = row.querySelector('.parcel-survey-input');
      const sizeInput = row.querySelector('.parcel-size-input');
      let rowValid = true;

      if (!surveyInput || !surveyInput.value.trim()) {
        surveyInput.parentElement.classList.add('invalid');
        isValid = false;
        rowValid = false;
      }

      if (sizeInput) {
        const val = parseFloat(sizeInput.value);
        if (isNaN(val) || val <= 0) {
          sizeInput.parentElement.classList.add('invalid');
          isValid = false;
          rowValid = false;
        }
      }

      if (rowValid) {
        hasParcel = true;
      }
    });

    if (!hasParcel) {
      block.querySelector('.patta-parcels-box').classList.add('invalid');
      isValid = false;
      pattaValid = false;
    }

    if (pattaValid) {
      hasValidPatta = true;
    }
  });

  const pattasError = document.getElementById('pattasError');
  if (!hasValidPatta) {
    pattasError.style.display = 'block';
    isValid = false;
  } else {
    pattasError.style.display = 'none';
  }

  return isValid;
}

// -------------------------------------------------------------
// Partition & Sale Deed Manager
// -------------------------------------------------------------
const partitionOverlay = document.getElementById('partitionOverlay');
const partitionModal = document.getElementById('partitionModal');
const partitionCloseBtn = document.getElementById('partitionCloseBtn');
const partitionCancelBtn = document.getElementById('partitionCancelBtn');
const partitionForm = document.getElementById('partitionForm');
const partitionTargetPatta = document.getElementById('partitionTargetPatta');
const partitionDate = document.getElementById('partitionDate');

let activePartitionRecord = null;

function openPartitionModal(record) {
  if (!record) return;
  activePartitionRecord = record;

  const buyerInput = document.getElementById('partitionBuyerName');
  const sizeInput = document.getElementById('partitionSizeValue');
  const notesInput = document.getElementById('partitionNotes');
  const landTypeInput = document.getElementById('partitionLandTypeInput');

  if (buyerInput) buyerInput.value = '';
  if (sizeInput) sizeInput.value = '';
  if (notesInput) notesInput.value = '';
  if (landTypeInput) landTypeInput.value = record.landType || 'dry';

  // Populate target Patta & Parcel dropdown
  if (partitionTargetPatta) {
    partitionTargetPatta.innerHTML = '';
    if (Array.isArray(record.pattas) && record.pattas.length > 0) {
      record.pattas.forEach((p, pIdx) => {
        if (Array.isArray(p.parcels)) {
          p.parcels.forEach((parcel, parcelIdx) => {
            const opt = document.createElement('option');
            opt.value = `Patta ${p.pattaNumber} | Survey ${parcel.surveyNumber}${parcel.subDivision ? '/' + parcel.subDivision : ''} (${parcel.landSize.value} ${parcel.landSize.unit})`;
            opt.innerText = opt.value;
            partitionTargetPatta.appendChild(opt);
          });
        }
      });
    }
  }

  // Populate buyer name datalist with all previously used transferee names
  const buyerDatalist = document.getElementById('buyerNameSuggestions');
  if (buyerDatalist) {
    const usedNames = new Set();
    state.records.forEach(r => {
      if (Array.isArray(r.partitions)) {
        r.partitions.forEach(p => {
          if (p.buyerName && p.buyerName.trim()) usedNames.add(p.buyerName.trim());
        });
      }
    });
    buyerDatalist.innerHTML = Array.from(usedNames).sort().map(name =>
      `<option value="${escapeHtml(name)}"></option>`
    ).join('');
  }

  // Populate Land Info Banner
  const landInfoBanner = document.getElementById('partitionLandInfoBanner');
  const landTypeEl = document.getElementById('partitionLandType');
  const totalSizeEl = document.getElementById('partitionTotalSize');
  const plannedSizeEl = document.getElementById('partitionPlannedSize');
  const balanceSizeEl = document.getElementById('partitionBalanceSize');

  if (landInfoBanner && record.landSize) {
    const typeLabels = { wet: 'Wet (Nanjai)', dry: 'Dry (Punjai)', residential: 'Residential (Manai)', commercial: 'Commercial', well: 'Well (Kenaru)' };
    const totalCents = convertUnits(record.landSize.value, record.landSize.unit).cents;

    // Sum all existing planned partitions in cents
    let plannedCents = 0;
    if (Array.isArray(record.partitions)) {
      record.partitions.forEach(p => {
        plannedCents += convertUnits(p.size.value, p.size.unit).cents;
      });
    }
    const balanceCents = totalCents - plannedCents;

    if (landTypeEl) landTypeEl.textContent = typeLabels[record.landType || 'dry'] || 'Dry (Punjai)';
    if (totalSizeEl) totalSizeEl.textContent = formatTransfereeTotalArea(totalCents);
    if (plannedSizeEl) plannedSizeEl.textContent = plannedCents > 0 ? formatTransfereeTotalArea(plannedCents) : 'None yet';
    if (balanceSizeEl) {
      balanceSizeEl.textContent = formatTransfereeTotalArea(Math.max(0, balanceCents));
      balanceSizeEl.style.color = balanceCents <= 0 ? 'var(--danger)' : 'var(--success, #10b981)';
    }
    landInfoBanner.style.display = 'block';
  }

  if (partitionModal && partitionOverlay) {
    partitionModal.classList.add('active');
    partitionOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closePartitionModal() {
  if (partitionModal && partitionOverlay) {
    partitionModal.classList.remove('active');
    partitionOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }
  activePartitionRecord = null;
}

if (partitionCloseBtn) partitionCloseBtn.addEventListener('click', closePartitionModal);
if (partitionCancelBtn) partitionCancelBtn.addEventListener('click', closePartitionModal);
if (partitionOverlay) partitionOverlay.addEventListener('click', closePartitionModal);

if (partitionForm) {
  partitionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!activePartitionRecord || !state.supabaseClient || !state.currentUser) return;

    const type = document.getElementById('partitionType').value;
    const buyerName = document.getElementById('partitionBuyerName').value.trim();
    const targetPattaLabel = partitionTargetPatta.value;
    const landTypeInputEl = document.getElementById('partitionLandTypeInput');
    const landType = landTypeInputEl ? landTypeInputEl.value : (record.landType || 'dry');
    const sizeVal = parseFloat(document.getElementById('partitionSizeValue').value);
    const sizeUnit = document.getElementById('partitionSizeUnit').value;
    const notes = document.getElementById('partitionNotes').value.trim();

    if (!buyerName) {
      showToast('Please enter Transferee / Buyer Name.', 'error');
      return;
    }

    if (isNaN(sizeVal) || sizeVal <= 0) {
      showToast('Please enter a valid partition size.', 'error');
      return;
    }

    const record = JSON.parse(JSON.stringify(activePartitionRecord));
    if (!Array.isArray(record.partitions)) {
      record.partitions = [];
    }

    // Validate partition size against remaining balance
    const totalCents = convertUnits(record.landSize.value, record.landSize.unit).cents;
    let plannedCents = 0;
    record.partitions.forEach(p => {
      plannedCents += convertUnits(p.size.value, p.size.unit).cents;
    });
    const entryCents = convertUnits(sizeVal, sizeUnit).cents;
    const balanceCents = totalCents - plannedCents;

    if (entryCents > balanceCents) {
      const excess = formatTransfereeTotalArea(entryCents - balanceCents);
      const available = formatTransfereeTotalArea(Math.max(0, balanceCents));
      const proceed = confirm(
        `⚠️ Excess Partition Size Warning!\n\n` +
        `Entered size exceeds the available balance by ${excess}.\n` +
        `Available Balance: ${available}\n\n` +
        `Click OK to proceed with the entered value anyway, or Cancel to correct it.`
      );
      if (!proceed) return;
    }

    // Partition Plan entry
    const partitionEntry = {
      id: 'part_' + Date.now(),
      type,
      buyerName,
      targetPattaLabel,
      landType: landType,
      size: { value: sizeVal, unit: sizeUnit },
      notes,
      createdAt: new Date().toISOString()
    };

    record.partitions.push(partitionEntry);

    try {
      const { error } = await state.supabaseClient
        .from('land_records')
        .update({
          partitions: record.partitions,
          updated_at: new Date().toISOString()
        })
        .eq('id', record.id);

      if (error) throw error;

      showToast('Partition / Sale Deed Plan saved successfully!', 'success');
      closePartitionModal();
      await fetchRecords();
      if (state.activeView === 'transferee') {
        renderTransfereeView();
      }
    } catch (err) {
      console.error('Error saving partition plan:', err);
      showToast('Failed to save partition plan.', 'error');
    }
  });
}

recordForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    showToast('Please fill all required fields correctly.', 'error');
    return;
  }

  const id = document.getElementById('recordId').value;
  const documentNumber = document.getElementById('documentNumber').value;
  const deedTypeVal = document.getElementById('deedType').value;
  const purchaseDate = document.getElementById('purchaseDate').value;
  const districtVal = district.value;
  const sroVal = sro.value;
  const villageVal = village.value;

  // Gather non-empty doc owner names
  const docOwnersVal = [];
  docOwnersContainer.querySelectorAll('.doc-owner-name-input').forEach(input => {
    if (input.value.trim()) docOwnersVal.push(input.value.trim());
  });

  // Gather non-empty seller names
  const sellersVal = [];
  purchasedFromContainer.querySelectorAll('.purchased-from-input').forEach(input => {
    if (input.value.trim()) sellersVal.push(input.value.trim());
  });

  // Gather dynamic hierarchical pattas
  const pattasVal = [];
  pattasContainer.querySelectorAll('.patta-block').forEach(block => {
    const pattaNumInput = block.querySelector('.patta-number-input');
    const isTransferredCheckbox = block.querySelector('.patta-status-checkbox');
    const pattaNumber = pattaNumInput ? pattaNumInput.value.trim() : '';
    const isPattaTransferred = isTransferredCheckbox ? isTransferredCheckbox.checked : false;

    const pattaNames = [];
    block.querySelectorAll('.patta-name-input').forEach(input => {
      if (input.value.trim()) pattaNames.push(input.value.trim());
    });

    const parcels = [];
    block.querySelectorAll('.parcel-row').forEach(row => {
      const surveyInput = row.querySelector('.parcel-survey-input');
      const subdivInput = row.querySelector('.parcel-subdiv-input');
      const sizeInput = row.querySelector('.parcel-size-input');
      const unitInput = row.querySelector('.parcel-unit-input');
      const typeInput = row.querySelector('.parcel-type-input');

      if (surveyInput && sizeInput) {
        const survey = surveyInput.value.trim();
        const subdiv = subdivInput ? subdivInput.value.trim() : '';
        const size = parseFloat(sizeInput.value);
        const unit = unitInput ? unitInput.value : 'cent';
        const landType = typeInput ? typeInput.value : 'dry';

        if (survey && !isNaN(size) && size > 0) {
          parcels.push({
            surveyNumber: survey,
            subDivision: subdiv,
            landSize: {
              value: size,
              unit: unit
            },
            landType
          });
        }
      }
    });

    let uploadedAttachment = null;
    let attachmentObj = null;

    if (block.pattaAttachmentData) {
      uploadedAttachment = block.pattaAttachmentData;
    } else {
      const viewLink = block.querySelector('.patta-view-link');
      const nameSpan = block.querySelector('.patta-attachment-name');
      const hasFile = viewLink && viewLink.href && viewLink.href !== '#' && !viewLink.classList.contains('hidden');
      
      if (hasFile && !viewLink.href.startsWith('blob:')) {
        try {
          const urlPath = new URL(viewLink.href).pathname;
          attachmentObj = {
            fileName: nameSpan.innerText,
            fileUrl: urlPath
          };
        } catch (e) {
          attachmentObj = {
            fileName: nameSpan.innerText,
            fileUrl: viewLink.getAttribute('href')
          };
        }
      }
    }

    if (pattaNumber && parcels.length > 0) {
      const pattaRecord = {
        pattaNumber,
        isPattaTransferred,
        pattaNames,
        parcels
      };
      if (uploadedAttachment) {
        pattaRecord.uploadedAttachment = uploadedAttachment;
      }
      if (attachmentObj) {
        pattaRecord.attachment = attachmentObj;
      }
      pattasVal.push(pattaRecord);
    }
  });

  const payload = {
    documentNumber,
    deedType: deedTypeVal,
    documentOwnerName: docOwnersVal,
    purchasedFrom: sellersVal,
    purchaseDate: purchaseDate || null,
    pattas: pattasVal,
    district: districtVal,
    sro: sroVal,
    village: villageVal,
    notes: notesTextarea.value.trim(),
    uploadedAttachments: tempAttachments,
    partitions: state.activeRecord ? (state.activeRecord.partitions || []) : []
  };

  // If Supabase Client and User are authenticated, write directly to Supabase DB & Storage
  if (state.supabaseClient && state.currentUser) {
    try {
      const attachments = state.activeRecord ? { ...(state.activeRecord.attachments || {}) } : {};
      
      for (const type of ['document', 'ec', 'fmb']) {
        const fileData = tempAttachments[type];
        if (fileData === null) continue;
        if (fileData && fileData.delete) {
          attachments[type] = null;
        } else if (fileData && fileData.base64) {
          const uploaded = await uploadFileToSupabase(fileData, `${type}_${documentNumber}`);
          if (uploaded) {
            attachments[type] = uploaded;
          }
        }
      }

      for (let idx = 0; idx < pattasVal.length; idx++) {
        const patta = pattasVal[idx];
        if (patta.uploadedAttachment && patta.uploadedAttachment.base64) {
          const uploaded = await uploadFileToSupabase(patta.uploadedAttachment, `patta_${patta.pattaNumber}`);
          if (uploaded) {
            patta.attachment = uploaded;
          }
        }
        delete patta.uploadedAttachment;
      }

      const dbPayload = {
        user_email: state.currentUser ? state.currentUser.email : 'p.manojkumar1101@gmail.com',
        user_id: (state.currentUser && state.currentUser.id) ? state.currentUser.id : null,
        document_number: documentNumber,
        deed_type: deedTypeVal,
        document_owner_name: docOwnersVal,
        purchased_from: sellersVal,
        purchase_date: purchaseDate || null,
        district: districtVal,
        sro: sroVal,
        village: villageVal,
        notes: notesTextarea.value.trim(),
        pattas: pattasVal,
        attachments: attachments,
        partitions: state.activeRecord ? (state.activeRecord.partitions || []) : [],
        updated_at: new Date().toISOString()
      };

      if (!id) {
        dbPayload.created_at = new Date().toISOString();
      }

      if (id) {
        const { error } = await state.supabaseClient
          .from('land_records')
          .update(dbPayload)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await state.supabaseClient
          .from('land_records')
          .insert([dbPayload]);
        if (error) throw error;
      }

      showToast(id ? 'Record updated in Supabase Cloud!' : 'Record saved to Supabase Cloud!', 'success');
      closeDrawer();
      await fetchRecords();
      return;
    } catch (err) {
      console.error('Supabase DB save error:', err);
      showToast(err.message || 'Failed to save to Supabase. Trying local fallback...', 'error');
    }
  }

  // Fallback to Express backend
  const url = id ? `/api/records/${id}` : '/api/records';
  const method = id ? 'PUT' : 'POST';

  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Server responded with an error');
    }

    const savedRecord = await response.json();
    showToast(id ? 'Record updated successfully!' : 'Record added successfully!', 'success');
    closeDrawer();
    await fetchRecords();
  } catch (error) {
    console.error('Error saving record:', error);
    showToast('Failed to save record. Try again.', 'error');
  }
});

// -------------------------------------------------------------
// Deletion Confirm Modal
// -------------------------------------------------------------
function showDeleteConfirm(id) {
  activeDeleteId = id;
  confirmOverlay.classList.add('active');
  confirmModal.classList.add('active');
}

function hideDeleteConfirm() {
  activeDeleteId = null;
  confirmOverlay.classList.remove('active');
  confirmModal.classList.remove('active');
}

deleteRecordBtn.addEventListener('click', () => {
  const id = document.getElementById('recordId').value;
  if (id) {
    showDeleteConfirm(id);
  }
});

confirmCancelBtn.addEventListener('click', hideDeleteConfirm);
confirmOverlay.addEventListener('click', hideDeleteConfirm);

confirmDeleteBtn.addEventListener('click', async () => {
  if (!activeDeleteId) return;

  if (state.supabaseClient && state.currentUser) {
    try {
      const { error } = await state.supabaseClient
        .from('land_records')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', activeDeleteId);

      if (error) throw error;

      showToast('Record moved to trash (soft deleted).', 'success');
      hideDeleteConfirm();
      closeDrawer();
      await fetchRecords();
      return;
    } catch (err) {
      console.error('Error soft-deleting from Supabase:', err);
      showToast('Failed to delete from Supabase.', 'error');
    }
  }

  try {
    const response = await fetch(`/api/records/${activeDeleteId}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Deletion failed.');

    showToast('Record deleted successfully.', 'success');
    hideDeleteConfirm();
    closeDrawer();
    await fetchRecords();
  } catch (error) {
    console.error('Error deleting record:', error);
    showToast('Failed to delete record.', 'error');
    hideDeleteConfirm();
  }
});

// -------------------------------------------------------------
// API Data Sync & Dashboard Calculations
// -------------------------------------------------------------
async function fetchRecords() {
  if (!state.currentUser) {
    state.records = [];
    populateOwnerFilter();
    updateDashboard();
    renderRecordsList();
    return;
  }

  if (state.supabaseClient) {
    try {
      const { data, error } = await state.supabaseClient
        .from('land_records')
        .select('*')
        .eq('user_email', state.currentUser.email)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      state.records = (data || []).map(r => {
        const rec = {
          id: r.id,
          documentNumber: r.document_number,
          deedType: r.deed_type || r.deedType || 'sale_deed',
          documentOwnerName: typeof r.document_owner_name === 'string' ? JSON.parse(r.document_owner_name) : (r.document_owner_name || []),
          purchasedFrom: typeof r.purchased_from === 'string' ? JSON.parse(r.purchased_from) : (r.purchased_from || []),
          purchaseDate: r.purchase_date,
          district: r.district || '',
          sro: r.sro || '',
          village: r.village || '',
          notes: r.notes || '',
          pattas: typeof r.pattas === 'string' ? JSON.parse(r.pattas) : (r.pattas || []),
          attachments: typeof r.attachments === 'string' ? JSON.parse(r.attachments) : (r.attachments || {}),
          partitions: typeof r.partitions === 'string' ? JSON.parse(r.partitions) : (r.partitions || []),
          createdAt: r.created_at,
          updatedAt: r.updated_at
        };
        return resolveDocumentFallbacks(rec);
      });

      populateOwnerFilter();
      updateDashboard();
      renderRecordsList();
      return;
    } catch (err) {
      console.error('Error fetching records from Supabase:', err);
      showToast('Error loading records from Supabase Database.', 'error');
    }
  }
}

function populateOwnerFilter() {
  const selectedValue = filterName.value || 'all';
  
  // Extract all unique present document owner names
  const ownersSet = new Set();
  state.records.forEach(record => {
    if (Array.isArray(record.documentOwnerName)) {
      record.documentOwnerName.forEach(name => {
        if (name && name.trim()) ownersSet.add(name.trim());
      });
    }
  });

  const uniqueOwners = Array.from(ownersSet).sort((a, b) => a.localeCompare(b));

  // Reset dropdown list
  filterName.innerHTML = '<option value="all">All Document Owners</option>';

  // Append new options
  uniqueOwners.forEach(owner => {
    const opt = document.createElement('option');
    opt.value = owner;
    opt.innerText = owner;
    filterName.appendChild(opt);
  });

  // Restore previous selection if it still exists
  if (ownersSet.has(selectedValue)) {
    filterName.value = selectedValue;
    state.nameFilter = selectedValue;
  } else {
    filterName.value = 'all';
    state.nameFilter = 'all';
  }
}

function updateDashboard(recordsList = state.records) {
  const count = recordsList.length;
  statTotalParcels.innerText = count;

  let totalCents = 0;
  let totalSqft = 0;
  let totalAcres = 0;
  let totalAres = 0;
  let transferredCount = 0;

  recordsList.forEach(r => {
    // Patta transfer status counts
    if (r.isPattaTransferred) {
      transferredCount++;
    }

    // Cumulative size conversion (convert everything to cents, sqft, acres, and ares)
    const conv = convertUnits(r.landSize.value, r.landSize.unit);
    totalCents += conv.cents;
    totalSqft += conv.sqft;
    totalAcres += conv.acres;
    totalAres += conv.ares;
  });

  // Render main size display in the user's selected preference
  const viewUnitVal = state.displayUnit;
  if (viewUnitVal === 'cent') {
    statTotalSize.innerText = formatSizeDisplay(totalCents, 'cent');
    statTotalSizeSub1.innerText = formatSizeDisplay(totalAres, 'are') + ' | ' + formatSizeDisplay(totalAcres, 'acre');
    statTotalSizeSub2.innerText = formatSizeDisplay(totalSqft, 'sqft');
  } else if (viewUnitVal === 'sqft') {
    statTotalSize.innerText = formatSizeDisplay(totalSqft, 'sqft');
    statTotalSizeSub1.innerText = formatSizeDisplay(totalCents, 'cent') + ' | ' + formatSizeDisplay(totalAres, 'are');
    statTotalSizeSub2.innerText = formatSizeDisplay(totalAcres, 'acre');
  } else if (viewUnitVal === 'acre') {
    statTotalSize.innerText = formatSizeDisplay(totalAcres, 'acre');
    statTotalSizeSub1.innerText = formatSizeDisplay(totalCents, 'cent') + ' | ' + formatSizeDisplay(totalAres, 'are');
    statTotalSizeSub2.innerText = formatSizeDisplay(totalSqft, 'sqft');
  } else if (viewUnitVal === 'are') {
    statTotalSize.innerText = formatSizeDisplay(totalAres, 'are');
    statTotalSizeSub1.innerText = formatSizeDisplay(totalCents, 'cent') + ' | ' + formatSizeDisplay(totalAcres, 'acre');
    statTotalSizeSub2.innerText = formatSizeDisplay(totalSqft, 'sqft');
  }

  // Patta details
  statPattaTransferred.innerText = `${transferredCount} / ${count}`;
  const pct = count > 0 ? Math.round((transferredCount / count) * 100) : 0;
  statPattaPercentage.innerText = `${pct}% Transferred`;
}

// -------------------------------------------------------------
// Search, Filters, and Sorting
// -------------------------------------------------------------
function getFilteredAndSortedRecords() {
  return state.records
    .filter(record => {
      // 1. Search Query Match
      if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        const matchesDocOwner = Array.isArray(record.documentOwnerName) && record.documentOwnerName.some(name => name.toLowerCase().includes(query));
        const matchesSeller = Array.isArray(record.purchasedFrom) && record.purchasedFrom.some(name => name.toLowerCase().includes(query));
        const matchesDoc = record.documentNumber.toLowerCase().includes(query);
        
        let matchesPatta = false;
        let matchesOwners = matchesDocOwner;
        let matchesSurvey = false;
        
        if (Array.isArray(record.pattas)) {
          record.pattas.forEach(p => {
            if (p.pattaNumber && p.pattaNumber.toLowerCase().includes(query)) {
              matchesPatta = true;
            }
            if (Array.isArray(p.pattaNames)) {
              p.pattaNames.forEach(name => {
                if (name.toLowerCase().includes(query)) matchesOwners = true;
              });
            }
            if (Array.isArray(p.parcels)) {
              p.parcels.forEach(parcel => {
                if (parcel.surveyNumber && parcel.surveyNumber.toLowerCase().includes(query)) {
                  matchesSurvey = true;
                }
                if (parcel.subDivision && parcel.subDivision.toLowerCase().includes(query)) {
                  matchesSurvey = true;
                }
              });
            }
          });
        } else {
          matchesPatta = record.pattaNumber.toLowerCase().includes(query);
          matchesSurvey = record.surveyNumber.toLowerCase().includes(query) || 
                          (record.subDivision && record.subDivision.toLowerCase().includes(query));
          if (Array.isArray(record.pattaNames)) {
            matchesOwners = record.pattaNames.some(name => name.toLowerCase().includes(query)) || matchesDocOwner;
          }
        }

        if (!matchesSurvey && !matchesPatta && !matchesDoc && !matchesSeller && !matchesOwners) {
          return false;
        }
      }

      // 2. Patta Status Filter
      if (state.pattaFilter === 'transferred' && !record.isPattaTransferred) return false;
      if (state.pattaFilter === 'pending' && record.isPattaTransferred) return false;

      // 2b. Land Type Filter
      if (state.landTypeFilter !== 'all') {
        let hasMatchingType = false;
        if (Array.isArray(record.pattas)) {
          record.pattas.forEach(p => {
            if (Array.isArray(p.parcels)) {
              p.parcels.forEach(parcel => {
                if ((parcel.landType || 'dry') === state.landTypeFilter) hasMatchingType = true;
              });
            }
          });
        }
        if (!hasMatchingType) return false;
      }

      // 2c. Owner Name Filter
      if (state.nameFilter !== 'all' && !(Array.isArray(record.documentOwnerName) && record.documentOwnerName.includes(state.nameFilter))) return false;

      return true;
    })
    .sort((a, b) => {
      // 3. Sorting
      if (state.sortBy === 'newest') {
        const dateA = a.purchaseDate ? new Date(a.purchaseDate) : new Date(0);
        const dateB = b.purchaseDate ? new Date(b.purchaseDate) : new Date(0);
        return dateB - dateA || new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (state.sortBy === 'oldest') {
        const dateA = a.purchaseDate ? new Date(a.purchaseDate) : new Date(0);
        const dateB = b.purchaseDate ? new Date(b.purchaseDate) : new Date(0);
        return dateA - dateB || new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (state.sortBy === 'last-updated') {
        const dateA = a.updatedAt ? new Date(a.updatedAt) : (a.createdAt ? new Date(a.createdAt) : new Date(0));
        const dateB = b.updatedAt ? new Date(b.updatedAt) : (b.createdAt ? new Date(b.createdAt) : new Date(0));
        return dateB - dateA;
      }
      if (state.sortBy === 'created-newest') {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
      }
      if (state.sortBy === 'size-desc') {
        const centsA = convertUnits(a.landSize.value, a.landSize.unit).cents;
        const centsB = convertUnits(b.landSize.value, b.landSize.unit).cents;
        return centsB - centsA;
      }
      if (state.sortBy === 'size-asc') {
        const centsA = convertUnits(a.landSize.value, a.landSize.unit).cents;
        const centsB = convertUnits(b.landSize.value, b.landSize.unit).cents;
        return centsA - centsB;
      }
      if (state.sortBy === 'survey') {
        return a.surveyNumber.localeCompare(b.surveyNumber, undefined, { numeric: true, sensitivity: 'base' });
      }
      return 0;
    });
}

function renderRecordsList() {
  if (!state.currentUser) {
    recordsCountTitle.innerText = `Land Records (0)`;
    updateDashboard([]);
    recordsContainer.className = 'records-container empty-state';
    recordsContainer.innerHTML = `
      <div class="empty-state-message">
        <div class="empty-illustration">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
        <h3>Authentication Required</h3>
        <p>Please Sign In with your registered email and password to view and manage your land records in Supabase Database.</p>
        <button type="button" class="btn btn-primary btn-sm" onclick="openAuthModal()" style="margin-top: 12px; height: 36px; padding: 0 16px;">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px; margin-right: 6px;"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
          Sign In Now
        </button>
      </div>
    `;
    return;
  }

  const filtered = getFilteredAndSortedRecords();
  recordsCountTitle.innerText = `Land Records (${filtered.length})`;
  updateDashboard(filtered);

  if (filtered.length === 0) {
    recordsContainer.className = 'records-container empty-state';
    recordsContainer.innerHTML = `
      <div class="empty-state-message">
        <div class="empty-illustration">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </div>
        <h3>No Matching Records</h3>
        <p>Try refining your search text or active filters.</p>
      </div>
    `;
    return;
  }

  recordsContainer.className = 'records-container';
  recordsContainer.innerHTML = '';

  filtered.forEach(record => {
    const card = document.createElement('div');
    card.className = 'land-card';
    card.dataset.id = record.id;

    // Convert and format the land size for display
    const sizeInDisplayUnit = getDisplayValue(record.landSize, state.displayUnit);
    const sizeString = formatSizeDisplay(sizeInDisplayUnit, state.displayUnit);

    // Dynamic lists of chips
    const docOwnersHtml = (Array.isArray(record.documentOwnerName) ? record.documentOwnerName : [record.documentOwnerName]).map(name => `<span class="owner-chip doc-owner-chip">${name}</span>`).join('');
    const sellersHtml = (Array.isArray(record.purchasedFrom) ? record.purchasedFrom : [record.purchasedFrom]).filter(Boolean).map(name => `<span class="owner-chip seller-chip">${name}</span>`).join('');

    // Format purchase date & created/updated dates for card
    const dateFormatted = record.purchaseDate ? new Date(record.purchaseDate).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    }) : 'N/A';

    const cDateObj = record.createdAt ? new Date(record.createdAt) : null;
    const uDateObj = record.updatedAt ? new Date(record.updatedAt) : (cDateObj || null);
    const createdFormatted = cDateObj && !isNaN(cDateObj.getTime()) ? cDateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null;
    const updatedFormatted = uDateObj && !isNaN(uDateObj.getTime()) ? uDateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : (createdFormatted || 'N/A');

    // Survey tag header formatting: merge unique surveys from all pattas
    let surveyHeaderText = '';
    const uniqueSurveys = new Set();
    if (Array.isArray(record.pattas)) {
      record.pattas.forEach(p => {
        if (Array.isArray(p.parcels)) {
          p.parcels.forEach(parcel => {
            const subdivText = parcel.subDivision ? `/${parcel.subDivision}` : '';
            uniqueSurveys.add(`${parcel.surveyNumber}${subdivText}`);
          });
        }
      });
    }
    
    if (uniqueSurveys.size > 0) {
      const surveysArr = Array.from(uniqueSurveys);
      surveyHeaderText = surveysArr[0];
      if (surveysArr.length > 1) {
        surveyHeaderText += ` (+ ${surveysArr.length - 1} more)`;
      }
    } else {
      const subdivText = record.subDivision ? ` / ${record.subDivision}` : '';
      surveyHeaderText = `${record.surveyNumber}${subdivText}`;
    }

    // Dynamic list of nested Pattas & Parcels
    let pattasHtml = '';
    if (Array.isArray(record.pattas) && record.pattas.length > 0) {
      pattasHtml = record.pattas.map(p => {
        const pattaOwnersList = Array.isArray(p.pattaNames) ? p.pattaNames.map(name => `<span class="owner-chip" style="font-size: 0.65rem; padding: 1px 4px; margin-bottom: 2px;">${name}</span>`).join('') : '';
        const pattaStatusText = p.isPattaTransferred ? 'Transferred' : 'Pending';
        const pattaStatusClass = p.isPattaTransferred ? 'transferred' : 'pending';

        const parcelsList = Array.isArray(p.parcels) ? p.parcels.map(parcel => {
          const sizeVal = getDisplayValue(parcel.landSize, state.displayUnit);
          const sizeStr = formatSizeDisplay(sizeVal, state.displayUnit);
          const subdivText = parcel.subDivision ? ` / ${parcel.subDivision}` : '';
          const typeLbl = {
            wet: 'Wet (Nanjai)',
            dry: 'Dry (Punjai)',
            residential: 'Resi (Manai)',
            commercial: 'Comm',
            well: 'Well (Kenaru)'
          }[parcel.landType || 'dry'] || 'Dry';
          const typeClass = parcel.landType || 'dry';
          
          return `<div class="parcel-pill" style="font-size: 0.75rem; color: var(--text-secondary); display: flex; justify-content: space-between; padding: 2px 4px; align-items: center; border-bottom: 1px dashed rgba(255,255,255,0.03);">
            <span>Survey <strong>${parcel.surveyNumber}${subdivText}</strong> <span class="type-tag ${typeClass}" style="font-size: 0.65rem; padding: 1px 4px; border-radius: 2px; margin-left: 4px; display: inline-block;">${typeLbl}</span></span>
            <span style="font-weight: 600; color: var(--primary);">${sizeStr}</span>
          </div>`;
        }).join('') : '';

        const hasPattaFile = p.attachment && isValidFileUrl(p.attachment.fileUrl);
        const pattaAttachmentLink = hasPattaFile ? `
          <a href="${p.attachment.fileUrl}" target="_blank" class="attachment-chip" onclick="event.stopPropagation();" title="${p.attachment.fileName || 'View Patta Copy'}" style="font-size: 0.65rem; padding: 2px 6px; margin-left: 6px; display: inline-flex; align-items: center; gap: 4px; height: 18px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Patta Copy
          </a>
        ` : '';

        return `<div class="patta-summary-block" style="background-color: rgba(255,255,255,0.015); border: 1px solid var(--border-color); border-radius: var(--radius-xs); padding: 8px 12px; display: flex; flex-direction: column; gap: 6px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px;">
            <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; flex-wrap: wrap; gap: 4px;">Patta: <strong>${p.pattaNumber}</strong>${pattaAttachmentLink}</span>
            <span class="patta-status-tag ${pattaStatusClass}" style="font-size: 0.65rem; padding: 2px 6px;">${pattaStatusText}</span>
          </div>
          ${pattaOwnersList ? `<div style="display: flex; align-items: center; gap: 4px; flex-wrap: wrap;"><span style="font-size: 0.65rem; text-transform: uppercase; color: var(--text-muted); font-weight: 500;">Owners:</span> ${pattaOwnersList}</div>` : ''}
          <div style="display: flex; flex-direction: column; gap: 2px; margin-top: 2px;">
            ${parcelsList}
          </div>
        </div>`;
      }).join('');
    } else {
      const subdivText = record.subDivision ? ` / ${record.subDivision}` : '';
      pattasHtml = `<div class="patta-summary-block" style="background-color: rgba(255,255,255,0.015); border: 1px solid var(--border-color); border-radius: var(--radius-xs); padding: 8px 12px; display: flex; flex-direction: column; gap: 4px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-primary);">Patta: <strong>${record.pattaNumber}</strong></span>
        </div>
        <div class="parcel-pill" style="font-size: 0.75rem; color: var(--text-secondary); display: flex; justify-content: space-between; padding: 2px 4px;">
          <span>Survey <strong>${record.surveyNumber}${subdivText}</strong></span>
          <span style="font-weight: 600; color: var(--primary);">${sizeString}</span>
        </div>
      </div>`;
    }

    const typeLabel = {
      wet: 'Wet (Nanjai)',
      dry: 'Dry (Punjai)',
      residential: 'Resi (Manai)',
      commercial: 'Commercial',
      well: 'Well (Kenaru)'
    }[record.landType || 'dry'] || 'Dry (Punjai)';

    const totalRecordCents = convertUnits(record.landSize.value, record.landSize.unit).cents;
    const isSelected = !!state.selectedItemCentsMap['rec_' + record.id];

    const deedTypeLabels = {
      sale_deed: 'Sale Deed',
      partition_deed: 'Partition Deed',
      gift_deed: 'Gift Deed',
      settlement_deed: 'Settlement Deed',
      exchange_deed: 'Exchange Deed',
      release_deed: 'Release Deed',
      inheritance: 'Inheritance',
      will: 'Will / Testament',
      court_decree: 'Court Decree'
    };

    const deedLabel = deedTypeLabels[record.deedType || 'sale_deed'] || 'Sale Deed';

    card.innerHTML = `
      <div class="card-top">
        <div style="display: flex; align-items: center; gap: 10px;">
          <label class="card-select-label" onclick="event.stopPropagation();" title="Select for sum calculation">
            <input type="checkbox" class="land-select-checkbox" data-key="rec_${record.id}" data-cents="${totalRecordCents}" ${isSelected ? 'checked' : ''} onchange="handleLandCheckboxChange(this)">
            <span class="checkbox-custom"></span>
          </label>
          <div class="survey-tag">
            <span class="number">${surveyHeaderText}</span>
            <span class="label">Survey No / Sub-div</span>
          </div>
        </div>
        <div class="card-tags">
          <span class="type-tag ${record.deedType || 'sale_deed'}" style="background: rgba(99, 102, 241, 0.14); color: var(--primary); border: 1px solid rgba(99, 102, 241, 0.3); font-weight: 600; font-size: 0.68rem; padding: 2px 6px;">${deedLabel}</span>
          <span class="type-tag ${record.landType || 'dry'}">${typeLabel}</span>
          <span class="patta-status-tag ${record.isPattaTransferred ? 'transferred' : 'pending'}">
            ${record.isPattaTransferred ? 'Transferred' : 'Pending'}
          </span>
        </div>
      </div>

      <div class="card-body-grid">
        <div class="info-item">
          <span class="lbl">Doc No</span>
          <span class="val">${record.documentNumber}</span>
        </div>
        <div class="info-item">
          <span class="lbl">Total Size</span>
          <span class="val" style="color: var(--primary); font-weight: 700;">${sizeString}</span>
        </div>
        <div class="info-item" style="grid-column: span 2;">
          <span class="lbl">Current Document Owner(s)</span>
          <div class="owners-list">${docOwnersHtml}</div>
        </div>
        ${sellersHtml ? `
        <div class="info-item" style="grid-column: span 2;">
          <span class="lbl">Previous Owner Name(s) (Seller)</span>
          <div class="owners-list">${sellersHtml}</div>
        </div>
        ` : ''}
        <div class="info-item" style="grid-column: span 2;">
          <span class="lbl" style="margin-bottom: 6px;">Pattas & Parcels</span>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${pattasHtml}
          </div>
        </div>
        ${(function() {
          const atts = record.attachments || {};
          const hasDocument = atts.document && isValidFileUrl(atts.document.fileUrl);
          const hasEc = atts.ec && isValidFileUrl(atts.ec.fileUrl);
          const hasFmb = atts.fmb && isValidFileUrl(atts.fmb.fileUrl);

          if (hasDocument || hasEc || hasFmb) {
            const docLink = hasDocument ? `
              <a href="${atts.document.fileUrl}" target="_blank" class="attachment-chip" onclick="event.stopPropagation();" title="${atts.document.fileName || 'View Deed'}">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Deed
              </a>
            ` : '';

            const ecLink = hasEc ? `
              <a href="${atts.ec.fileUrl}" target="_blank" class="attachment-chip" onclick="event.stopPropagation();" title="${atts.ec.fileName || 'View EC'}">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                EC Copy
              </a>
            ` : '';

            const fmbLink = hasFmb ? `
              <a href="${atts.fmb.fileUrl}" target="_blank" class="attachment-chip" onclick="event.stopPropagation();" title="${atts.fmb.fileName || 'View FMB'}">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                FMB Copy
              </a>
            ` : '';

            return `
              <div class="info-item" style="grid-column: span 2;">
                <span class="lbl">Attachments</span>
                <div class="card-attachments">
                  ${docLink}
                  ${ecLink}
                  ${fmbLink}
                </div>
              </div>
            `;
          }
          return '';
        })()}
        ${(function() {
          if (Array.isArray(record.partitions) && record.partitions.length > 0) {
            // Calculate total planned cents and balance
            const totalCents = convertUnits(record.landSize.value, record.landSize.unit).cents;
            let plannedCents = 0;
            record.partitions.forEach(p => {
              plannedCents += convertUnits(p.size.value, p.size.unit).cents;
            });
            const balanceCents = totalCents - plannedCents;
            const balanceDisplay = formatTransfereeTotalArea(Math.max(0, balanceCents));
            const balanceColor = balanceCents <= 0 ? 'var(--danger)' : 'var(--success, #10b981)';

            const typeLabels = { wet: 'Wet (Nanjai)', dry: 'Dry (Punjai)', residential: 'Residential (Manai)', commercial: 'Commercial', well: 'Well (Kenaru)' };
            const items = record.partitions.map(p => {
              const ltLabel = typeLabels[p.landType || record.landType || 'dry'] || 'Dry';
              return `
              <div style="font-size: 0.75rem; color: var(--text-secondary); background: rgba(99, 102, 241, 0.05); border: 1px solid rgba(99, 102, 241, 0.15); padding: 6px 10px; border-radius: var(--radius-xs); display: flex; flex-direction: column; gap: 2px;">
                <div style="display: flex; justify-content: space-between; font-weight: 600;">
                  <span style="color: var(--primary); text-transform: uppercase;">${p.type} DEED: <strong>${p.size.value} ${p.size.unit}</strong></span>
                  <span style="display: flex; gap: 8px; align-items: center;">
                    <span style="background: rgba(99,102,241,0.1); color: var(--primary); border-radius: 4px; padding: 1px 6px; font-size: 0.68rem;">${ltLabel}</span>
                    <span style="color: var(--text-muted); font-size: 0.7rem;">${p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</span>
                  </span>
                </div>
                <div>Transferred to: <strong>${p.buyerName}</strong> ${p.deedNumber ? `(${p.deedNumber})` : ''}</div>
                ${p.notes ? `<div style="font-style: italic; color: var(--text-muted); font-size: 0.7rem;">${p.notes}</div>` : ''}
              </div>`;
            }).join('');

            return `
              <div class="info-item" style="grid-column: span 2;">
                <span class="lbl" style="color: var(--primary);">Partition & Sale Plans</span>
                <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 4px;">
                  ${items}
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; border-radius: var(--radius-xs); border: 1px solid ${balanceCents <= 0 ? 'var(--danger)' : 'var(--border-color)'}; background: ${balanceCents <= 0 ? 'rgba(239,68,68,0.05)' : 'rgba(16,185,129,0.05)'}; margin-top: 2px;">
                    <span style="font-size: 0.72rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted);">Balance Land Remaining</span>
                    <span style="font-weight: 800; font-size: 0.82rem; color: ${balanceColor};">${balanceDisplay}</span>
                  </div>
                </div>
              </div>
            `;
          }
          return '';
        })()}
      </div>

      ${record.notes ? `
      <div style="padding: 0 20px 12px 20px; font-size: 0.8rem; color: var(--text-muted); border-top: 1px dashed rgba(255,255,255,0.03); padding-top: 8px;">
        <span style="font-weight: 600; color: var(--text-secondary); text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.05em; display: block; margin-bottom: 2px;">Notes</span>
        <p style="margin: 0; line-height: 1.4; white-space: pre-wrap;">${record.notes}</p>
      </div>
      ` : ''}

      <div class="card-footer" style="align-items: flex-start;">
        <div class="purchase-details">
          <span>Purchased: <strong>${dateFormatted}</strong></span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <button type="button" class="btn btn-outline btn-sm partition-trigger" data-id="${record.id}" style="padding: 4px 8px; font-size: 0.7rem; border-radius: var(--radius-xs); height: 26px; font-family: var(--font-body); font-weight: 500;">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-9"/><path d="m18 9-6 4-6-4"/></svg>
            Partition / Sale
          </button>
          <button type="button" class="btn btn-outline btn-sm ec-helper-trigger" data-id="${record.id}" style="padding: 4px 8px; font-size: 0.7rem; border-radius: var(--radius-xs); height: 26px; font-family: var(--font-body); font-weight: 500;">
            EC Helper
          </button>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-muted)"><path d="m9 18 6-6-6-6"/></svg>
        </div>
      </div>
      <div class="card-timestamps" style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem; color: var(--text-muted); border-top: 1px dashed rgba(255,255,255,0.05); padding-top: 8px; margin-top: -4px; flex-wrap: wrap; gap: 8px;">
        <span><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; vertical-align: -1px; color: var(--text-muted);"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>Created: <strong style="color: var(--text-secondary); font-weight: 500;">${createdFormatted || 'N/A'}</strong></span>
        <span><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; vertical-align: -1px; color: var(--primary);"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/></svg>Last Changed: <strong style="color: var(--primary); font-weight: 600;">${updatedFormatted}</strong></span>
      </div>
    `;

    // Click on card opens edit mode
    card.addEventListener('click', () => openDrawer(record));

    // Partition Button Click Handler
    const partitionBtn = card.querySelector('.partition-trigger');
    if (partitionBtn) {
      partitionBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openPartitionModal(record);
      });
    }

    // EC Helper Button Click Handler
    const ecBtn = card.querySelector('.ec-helper-trigger');
    ecBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent opening Edit Drawer
      openEcHelper(record);
    });

    recordsContainer.appendChild(card);
  });
}

// -------------------------------------------------------------
// Interactive Controls Event Listeners
// -------------------------------------------------------------
searchInput.addEventListener('input', () => {
  state.searchQuery = searchInput.value;
  if (state.searchQuery) {
    clearSearchBtn.classList.remove('hidden');
  } else {
    clearSearchBtn.classList.add('hidden');
  }
  renderRecordsList();
});

clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  state.searchQuery = '';
  clearSearchBtn.classList.add('hidden');
  renderRecordsList();
});

filterPatta.addEventListener('change', () => {
  state.pattaFilter = filterPatta.value;
  renderRecordsList();
});

filterType.addEventListener('change', () => {
  state.landTypeFilter = filterType.value;
  renderRecordsList();
});

filterName.addEventListener('change', () => {
  state.nameFilter = filterName.value;
  renderRecordsList();
});

const filterDeedType = document.getElementById('filterDeedType');
if (filterDeedType) {
  filterDeedType.addEventListener('change', () => {
    state.filterDeedType = filterDeedType.value;
    renderRecordsList();
  });
}

sortBy.addEventListener('change', () => {
  state.sortBy = sortBy.value;
  renderRecordsList();
});

viewUnit.addEventListener('change', () => {
  state.displayUnit = viewUnit.value;
  updateDashboard();
  renderRecordsList();
});

// -------------------------------------------------------------
// Export / Import Tools
// -------------------------------------------------------------
exportCsvBtn.addEventListener('click', () => {
  const filtered = getFilteredAndSortedRecords();
  if (filtered.length === 0) {
    showToast('No records available with active filters to export.', 'error');
    return;
  }

  const headers = ['ID', 'Survey Number', 'Sub Division', 'Patta Number', 'Document Number', 'Document Owner Name', 'Land Type', 'District', 'SRO', 'Village', 'Patta Transferred', 'Patta Owners', 'Parcels', 'Size Value', 'Size Unit', 'Size in Cent', 'Size in SqFt', 'Size in Acre', 'Size in Are', 'Purchase Date', 'Purchased From', 'Notes', 'Created At', 'Last Updated At'];
  
  const csvRows = [headers.join(',')];

  filtered.forEach(r => {
    const conv = convertUnits(r.landSize.value, r.landSize.unit);
    const docOwnersStr = Array.isArray(r.documentOwnerName) ? r.documentOwnerName.join(', ') : (r.documentOwnerName || '');
    const sellersStr = Array.isArray(r.purchasedFrom) ? r.purchasedFrom.join(', ') : (r.purchasedFrom || '');
    let parcelsSummary = '';
    if (Array.isArray(r.pattas)) {
      parcelsSummary = r.pattas.map(p => {
        const owners = Array.isArray(p.pattaNames) ? p.pattaNames.join(', ') : '';
        const status = p.isPattaTransferred ? 'Transferred' : 'Pending';
        const parcels = Array.isArray(p.parcels) ? p.parcels.map(parcel => `${parcel.surveyNumber}${parcel.subDivision ? '/' + parcel.subDivision : ''} (${parcel.landType || 'dry'}): ${parcel.landSize.value} ${parcel.landSize.unit}`).join('; ') : '';
        return `[Patta ${p.pattaNumber} (${status}) - Owners: ${owners} - Parcels: ${parcels}]`;
      }).join(' | ');
    } else if (Array.isArray(r.parcels)) {
      parcelsSummary = r.parcels.map(p => `${p.surveyNumber}${p.subDivision ? ' / ' + p.subDivision : ''}: ${p.landSize.value} ${p.landSize.unit}`).join(' | ');
    }
    
    const row = [
      r.id,
      `"${r.surveyNumber.replace(/"/g, '""')}"`,
      `"${(r.subDivision || '').replace(/"/g, '""')}"`,
      `"${r.pattaNumber.replace(/"/g, '""')}"`,
      `"${r.documentNumber.replace(/"/g, '""')}"`,
      `"${docOwnersStr.replace(/"/g, '""')}"`,
      `"${(r.landType || 'dry').replace(/"/g, '""')}"`,
      `"${(r.district || '').replace(/"/g, '""')}"`,
      `"${(r.sro || '').replace(/"/g, '""')}"`,
      `"${(r.village || '').replace(/"/g, '""')}"`,
      r.isPattaTransferred ? 'Yes' : 'No',
      `"${r.pattaNames.join(', ').replace(/"/g, '""')}"`,
      `"${parcelsSummary.replace(/"/g, '""')}"`,
      r.landSize.value,
      r.landSize.unit,
      conv.cents.toFixed(4),
      conv.sqft.toFixed(2),
      conv.acres.toFixed(6),
      conv.ares.toFixed(6),
      r.purchaseDate ? r.purchaseDate.split('T')[0] : '',
      `"${sellersStr.replace(/"/g, '""')}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
      r.createdAt || '',
      r.updatedAt || r.createdAt || ''
    ];
    csvRows.push(row.join(','));
  });

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `land_records_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('CSV file downloaded.', 'success');
});

// JSON Backup Download
backupBtn.addEventListener('click', () => {
  if (state.records.length === 0) {
    showToast('No records to backup.', 'error');
    return;
  }
  const blob = new Blob([JSON.stringify(state.records, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `land_records_backup_${new Date().toISOString().split('T')[0]}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('JSON backup downloaded! Active database file: d:\\Manoj_Personal\\Personal\\LandRecord\\data\\land_records.json', 'success');
});

// Trigger file input click for importing
importBtn.addEventListener('click', () => {
  importFileSelector.click();
});

// Import File Handler
importFileSelector.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (evt) => {
    try {
      const records = JSON.parse(evt.target.result);
      if (!Array.isArray(records)) {
        throw new Error('Backup file must contain a JSON array of records.');
      }
      
      // Basic validation of fields in imported data
      for (const r of records) {
        if (!r.surveyNumber || !r.pattaNumber || !r.documentNumber || !r.landSize) {
          throw new Error('One or more imported records is missing required fields.');
        }
      }

      // Send to server to write
      const response = await fetch('/api/records/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records })
      });

      if (!response.ok) {
        throw new Error('Failed to restore backup on the server.');
      }

      showToast(`Imported ${records.length} records successfully!`, 'success');
      importFileSelector.value = ''; // Reset file input
      await fetchRecords();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error processing backup file.', 'error');
      importFileSelector.value = '';
    }
  };
  reader.readAsText(file);
});

// -------------------------------------------------------------
// EC Helper Modal Actions
// -------------------------------------------------------------
function openEcHelper(record) {
  ecOverlay.classList.add('active');
  ecModal.classList.add('active');
  document.body.style.overflow = 'hidden';

  ecDistrictVal.innerText = record.district || 'Not Set';
  ecSroVal.innerText = record.sro || 'Not Set';
  ecVillageVal.innerText = record.village || 'Not Set';
  ecSurveyVal.innerText = record.surveyNumber;
  ecSubDivVal.innerText = record.subDivision || 'Not Set';

  // Dates
  const startDate = record.purchaseDate ? record.purchaseDate.split('T')[0] : '1975-01-01';
  const endDate = new Date().toISOString().split('T')[0];
  ecDateRangeVal.innerText = `${startDate} to ${endDate}`;
}

function closeEcHelper() {
  ecOverlay.classList.remove('active');
  ecModal.classList.remove('active');
  document.body.style.overflow = '';
}

ecCloseBtn.addEventListener('click', closeEcHelper);
ecOverlay.addEventListener('click', closeEcHelper);

// Copy text buttons inside EC modal
ecModal.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const targetId = btn.dataset.target;
    const valText = document.getElementById(targetId).innerText;
    
    if (valText === 'Not Set' || valText === '-') {
      showToast('No value set to copy.', 'error');
      return;
    }

    navigator.clipboard.writeText(valText).then(() => {
      showToast('Copied to clipboard!', 'success');
    }).catch(err => {
      showToast('Failed to copy text.', 'error');
    });
  });
});

// -------------------------------------------------------------
// App Initialization
// -------------------------------------------------------------
function initAttachmentsHandlers() {
  ['Document', 'Ec', 'Fmb'].forEach(name => {
    const area = document.getElementById(`area${name}`);
    const fileInput = document.getElementById(`file${name}`);
    const type = name.toLowerCase();

    if (!area || !fileInput) return;

    area.addEventListener('click', () => {
      const isEditable = !document.getElementById('documentNumber').disabled;
      if (isEditable) {
        fileInput.click();
      }
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (file.size > 15 * 1024 * 1024) {
        showToast('File is too large. Maximum size is 15MB.', 'error');
        fileInput.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = function(evt) {
        tempAttachments[type] = {
          name: file.name,
          base64: evt.target.result
        };
        updateAttachmentUI(type, {
          fileName: file.name,
          fileUrl: URL.createObjectURL(file)
        });
      };
      reader.readAsDataURL(file);
    });
  });

  document.querySelectorAll('.btn-remove-attachment').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isEditable = !document.getElementById('documentNumber').disabled;
      if (!isEditable) return;

      const type = btn.dataset.type;
      const name = type.charAt(0).toUpperCase() + type.slice(1);
      
      tempAttachments[type] = { delete: true };
      const fileInput = document.getElementById(`file${name}`);
      if (fileInput) fileInput.value = '';
      
      updateAttachmentUI(type, null);
    });
  });
}

// -------------------------------------------------------------
// Left Navigation Drawer & View Switching
// -------------------------------------------------------------
const leftMenuBtn = document.getElementById('leftMenuBtn');
const leftNavCloseBtn = document.getElementById('leftNavCloseBtn');
const leftNavOverlay = document.getElementById('leftNavOverlay');
const leftNavDrawer = document.getElementById('leftNavDrawer');
const navMyLandsBtn = document.getElementById('navMyLandsBtn');
const navDashboardBtn = document.getElementById('navDashboardBtn');
const navNearbyLandsBtn = document.getElementById('navNearbyLandsBtn');
const navPendingDealsBtn = document.getElementById('navPendingDealsBtn');

const myLandsView = document.getElementById('myLandsView');
const nearbyLandsSection = document.getElementById('nearbyLandsSection');
const pendingDealsSection = document.getElementById('pendingDealsSection');

function openLeftNav() {
  if (leftNavDrawer && leftNavOverlay) {
    leftNavDrawer.classList.add('active');
    leftNavOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeLeftNav() {
  if (leftNavDrawer && leftNavOverlay) {
    leftNavDrawer.classList.remove('active');
    leftNavOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

if (leftMenuBtn) leftMenuBtn.addEventListener('click', openLeftNav);
if (leftNavCloseBtn) leftNavCloseBtn.addEventListener('click', closeLeftNav);
if (leftNavOverlay) leftNavOverlay.addEventListener('click', closeLeftNav);

const navPlannedPartitionsBtn = document.getElementById('navPlannedPartitionsBtn');
const plannedPartitionsSection = document.getElementById('plannedPartitionsSection');
const transfereeSearchInput = document.getElementById('transfereeSearchInput');
const clearTransfereeSearchBtn = document.getElementById('clearTransfereeSearchBtn');
const transfereeRecordsContainer = document.getElementById('transfereeRecordsContainer');
const transfereeCountTitle = document.getElementById('transfereeCountTitle');

const navMasterSurveysBtn = document.getElementById('navMasterSurveysBtn');
const masterSurveysSection = document.getElementById('masterSurveysSection');
const masterSurveysContainer = document.getElementById('masterSurveysContainer');
const masterSurveysCountTitle = document.getElementById('masterSurveysCountTitle');
const statMasterSurveysCount = document.getElementById('statMasterSurveysCount');
const statMasterSubDivsCount = document.getElementById('statMasterSubDivsCount');
const statPendingHighlightCount = document.getElementById('statPendingHighlightCount');
const addMasterSurveyBtn = document.getElementById('addMasterSurveyBtn');
const masterSurveyModal = document.getElementById('masterSurveyModal');
const masterSurveyOverlay = document.getElementById('masterSurveyOverlay');
const closeMasterSurveyModalBtn = document.getElementById('closeMasterSurveyModalBtn');
const cancelMasterSurveyBtn = document.getElementById('cancelMasterSurveyBtn');
const deleteMasterSurveyBtn = document.getElementById('deleteMasterSurveyBtn');
const saveMasterSurveyBtn = document.getElementById('saveMasterSurveyBtn');
const masterSurveyForm = document.getElementById('masterSurveyForm');
const subDivisionsContainer = document.getElementById('subDivisionsContainer');
const addSubDivisionRowBtn = document.getElementById('addSubDivisionRowBtn');
const masterSurveySearchInput = document.getElementById('masterSurveySearchInput');
const clearMasterSurveySearchBtn = document.getElementById('clearMasterSurveySearchBtn');
const masterSurveyFilterStatus = document.getElementById('masterSurveyFilterStatus');

if (navMyLandsBtn) {
  navMyLandsBtn.addEventListener('click', () => {
    state.activeView = 'myLands';
    if (navMyLandsBtn) navMyLandsBtn.classList.add('active');
    if (navPlannedPartitionsBtn) navPlannedPartitionsBtn.classList.remove('active');
    if (navNearbyLandsBtn) navNearbyLandsBtn.classList.remove('active');
    if (navPendingDealsBtn) navPendingDealsBtn.classList.remove('active');
    if (navMasterSurveysBtn) navMasterSurveysBtn.classList.remove('active');
    if (myLandsView) myLandsView.classList.remove('hidden');
    if (plannedPartitionsSection) plannedPartitionsSection.classList.add('hidden');
    if (nearbyLandsSection) nearbyLandsSection.classList.add('hidden');
    if (pendingDealsSection) pendingDealsSection.classList.add('hidden');
    if (masterSurveysSection) masterSurveysSection.classList.add('hidden');
    closeLeftNav();
    fetchRecords();
  });
}

if (navPlannedPartitionsBtn) {
  navPlannedPartitionsBtn.addEventListener('click', async () => {
    state.activeView = 'transferee';
    if (navPlannedPartitionsBtn) navPlannedPartitionsBtn.classList.add('active');
    if (navMyLandsBtn) navMyLandsBtn.classList.remove('active');
    if (navNearbyLandsBtn) navNearbyLandsBtn.classList.remove('active');
    if (navPendingDealsBtn) navPendingDealsBtn.classList.remove('active');
    if (navMasterSurveysBtn) navMasterSurveysBtn.classList.remove('active');
    if (plannedPartitionsSection) plannedPartitionsSection.classList.remove('hidden');
    if (myLandsView) myLandsView.classList.add('hidden');
    if (nearbyLandsSection) nearbyLandsSection.classList.add('hidden');
    if (pendingDealsSection) pendingDealsSection.classList.add('hidden');
    if (masterSurveysSection) masterSurveysSection.classList.add('hidden');
    closeLeftNav();
    await fetchRecords();
    renderTransfereeView();
  });
}

if (navNearbyLandsBtn) {
  navNearbyLandsBtn.addEventListener('click', () => {
    state.activeView = 'nearbyLands';
    if (navNearbyLandsBtn) navNearbyLandsBtn.classList.add('active');
    if (navMyLandsBtn) navMyLandsBtn.classList.remove('active');
    if (navPlannedPartitionsBtn) navPlannedPartitionsBtn.classList.remove('active');
    if (navPendingDealsBtn) navPendingDealsBtn.classList.remove('active');
    if (navMasterSurveysBtn) navMasterSurveysBtn.classList.remove('active');
    if (nearbyLandsSection) nearbyLandsSection.classList.remove('hidden');
    if (myLandsView) myLandsView.classList.add('hidden');
    if (plannedPartitionsSection) plannedPartitionsSection.classList.add('hidden');
    if (pendingDealsSection) pendingDealsSection.classList.add('hidden');
    if (masterSurveysSection) masterSurveysSection.classList.add('hidden');
    closeLeftNav();
    fetchNearbyRecords();
  });
}

if (navPendingDealsBtn) {
  navPendingDealsBtn.addEventListener('click', async () => {
    state.activeView = 'pendingDeals';
    if (navPendingDealsBtn) navPendingDealsBtn.classList.add('active');
    if (navMyLandsBtn) navMyLandsBtn.classList.remove('active');
    if (navPlannedPartitionsBtn) navPlannedPartitionsBtn.classList.remove('active');
    if (navNearbyLandsBtn) navNearbyLandsBtn.classList.remove('active');
    if (navMasterSurveysBtn) navMasterSurveysBtn.classList.remove('active');
    if (pendingDealsSection) pendingDealsSection.classList.remove('hidden');
    if (myLandsView) myLandsView.classList.add('hidden');
    if (plannedPartitionsSection) plannedPartitionsSection.classList.add('hidden');
    if (nearbyLandsSection) nearbyLandsSection.classList.add('hidden');
    if (masterSurveysSection) masterSurveysSection.classList.add('hidden');
    closeLeftNav();
    await fetchPendingDeals();
  });
}

if (navMasterSurveysBtn) {
  navMasterSurveysBtn.addEventListener('click', async () => {
    state.activeView = 'masterSurveys';
    if (navMasterSurveysBtn) navMasterSurveysBtn.classList.add('active');
    if (navMyLandsBtn) navMyLandsBtn.classList.remove('active');
    if (navPlannedPartitionsBtn) navPlannedPartitionsBtn.classList.remove('active');
    if (navNearbyLandsBtn) navNearbyLandsBtn.classList.remove('active');
    if (navPendingDealsBtn) navPendingDealsBtn.classList.remove('active');
    if (masterSurveysSection) masterSurveysSection.classList.remove('hidden');
    if (myLandsView) myLandsView.classList.add('hidden');
    if (plannedPartitionsSection) plannedPartitionsSection.classList.add('hidden');
    if (nearbyLandsSection) nearbyLandsSection.classList.add('hidden');
    if (pendingDealsSection) pendingDealsSection.classList.add('hidden');
    closeLeftNav();
    await fetchRecords();
    await fetchNearbyRecords();
    await fetchPendingDeals();
    await fetchMasterSurveys();
  });
}

if (transfereeSearchInput) {
  transfereeSearchInput.addEventListener('input', (e) => {
    state.transfereeSearchQuery = e.target.value;
    if (clearTransfereeSearchBtn) {
      if (state.transfereeSearchQuery) {
        clearTransfereeSearchBtn.classList.remove('hidden');
      } else {
        clearTransfereeSearchBtn.classList.add('hidden');
      }
    }
    renderTransfereeView();
  });
}

if (clearTransfereeSearchBtn) {
  clearTransfereeSearchBtn.addEventListener('click', () => {
    state.transfereeSearchQuery = '';
    if (transfereeSearchInput) transfereeSearchInput.value = '';
    clearTransfereeSearchBtn.classList.add('hidden');
    renderTransfereeView();
  });
}

const transfereeViewModeSelect = document.getElementById('transfereeViewMode');
if (transfereeViewModeSelect) {
  transfereeViewModeSelect.addEventListener('change', (e) => {
    state.transfereeViewMode = e.target.value;
    renderTransfereeView();
  });
}

const transfereeFilterTypeSelect = document.getElementById('transfereeFilterType');
if (transfereeFilterTypeSelect) {
  transfereeFilterTypeSelect.addEventListener('change', (e) => {
    state.transfereeLandTypeFilter = e.target.value;
    renderTransfereeView();
  });
}

function renderTransfereeView() {
  if (!transfereeRecordsContainer) return;

  if (!state.currentUser) {
    transfereeCountTitle.innerText = `Planned Partitions & Transferees (0)`;
    transfereeRecordsContainer.className = 'records-container empty-state';
    transfereeRecordsContainer.innerHTML = `
      <div class="empty-state-message">
        <div class="empty-illustration">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
        <h3>Authentication Required</h3>
        <p>Please Sign In to view and manage your proposed land partition and sale plans.</p>
        <button type="button" class="btn btn-primary btn-sm" onclick="openAuthModal()" style="margin-top: 12px; height: 36px; padding: 0 16px;">
          Sign In Now
        </button>
      </div>
    `;
    return;
  }

  // Collect all partition plans across state.records
  let allPlans = [];
  state.records.forEach(record => {
    let parts = record.partitions;
    if (typeof parts === 'string') {
      try { parts = JSON.parse(parts); } catch(e) { parts = []; }
    }
    if (Array.isArray(parts) && parts.length > 0) {
      parts.forEach(p => {
        allPlans.push({
          parentRecordId: record.id,
          parentDocNumber: record.documentNumber,
          parentDocOwners: Array.isArray(record.documentOwnerName) ? record.documentOwnerName.join(', ') : (record.documentOwnerName || ''),
          parentSellers: Array.isArray(record.purchasedFrom) ? record.purchasedFrom.join(', ') : (record.purchasedFrom || ''),
          parentLandSize: record.landSize || { value: 0, unit: 'cent' },
          parentLandType: record.landType || 'dry',
          parentPartitions: Array.isArray(record.partitions) ? record.partitions : [],
          planId: p.id,
          buyerName: p.buyerName,
          type: p.type || 'sale',
          landType: p.landType || record.landType || 'dry',
          targetPattaLabel: p.targetPattaLabel || 'Patta Parcel',
          size: p.size || { value: 0, unit: 'cent' },
          notes: p.notes || '',
          createdAt: p.createdAt
        });
      });
    }
  });

  if (state.transfereeLandTypeFilter && state.transfereeLandTypeFilter !== 'all') {
    allPlans = allPlans.filter(p => (p.landType || 'dry') === state.transfereeLandTypeFilter);
  }

  if (state.transfereeSearchQuery) {
    const q = state.transfereeSearchQuery.toLowerCase();
    allPlans = allPlans.filter(p =>
      p.buyerName.toLowerCase().includes(q) ||
      p.parentDocOwners.toLowerCase().includes(q) ||
      p.parentSellers.toLowerCase().includes(q) ||
      p.parentDocNumber.toLowerCase().includes(q) ||
      p.targetPattaLabel.toLowerCase().includes(q) ||
      p.notes.toLowerCase().includes(q)
    );
  }

  if (allPlans.length === 0) {
    transfereeCountTitle.innerText = `Planned Partitions & Transferees (0)`;
    transfereeRecordsContainer.className = 'records-container empty-state';
    transfereeRecordsContainer.innerHTML = `
      <div class="empty-state-message">
        <div class="empty-illustration">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-9"/><path d="m18 9-6 4-6-4"/></svg>
        </div>
        <h3>No Partition / Sale Plans Found</h3>
        <p>You can create a partition or sale deed plan on any land record using the <strong>"Partition / Sale"</strong> action button.</p>
      </div>
    `;
    return;
  }

  const viewMode = state.transfereeViewMode || 'grouped';
  const typeBadges = {
    sale: '<span class="status-badge status-pending" style="background: rgba(245, 158, 11, 0.15); color: #d97706;">PROPOSED SALE DEED</span>',
    partition: '<span class="status-badge status-transferred" style="background: rgba(59, 130, 246, 0.15); color: #2563eb;">FAMILY PARTITION PLAN</span>',
    gift: '<span class="status-badge status-transferred" style="background: rgba(16, 185, 129, 0.15); color: #059669;">GIFT SETTLEMENT PLAN</span>',
    release: '<span class="status-badge status-transferred" style="background: rgba(139, 92, 246, 0.15); color: #7c3aed;">RELEASE DEED PLAN</span>'
  };

  const typeLabels = {
    wet: 'Wet (Nanjai)',
    dry: 'Dry (Punjai)',
    residential: 'Resi (Manai)',
    commercial: 'Commercial',
    well: 'Well (Kenaru)'
  };

  // Build groupsMap for both grouped and summary views
  const groupsMap = {};
  allPlans.forEach(plan => {
    const key = plan.buyerName.trim();
    if (!groupsMap[key]) groupsMap[key] = [];
    groupsMap[key].push(plan);
  });

  if (viewMode === 'summary') {
    renderSummaryView(groupsMap, typeBadges);
    return;
  }

  if (viewMode === 'grouped') {
    const groupKeys = Object.keys(groupsMap).sort((a, b) => a.localeCompare(b));
    transfereeCountTitle.innerText = `Planned Partitions & Transferees (${groupKeys.length} Transferee Portfolio${groupKeys.length === 1 ? '' : 's'})`;

    transfereeRecordsContainer.className = 'records-container';
    transfereeRecordsContainer.innerHTML = groupKeys.map(buyerName => {
      const plansList = groupsMap[buyerName];
      
      // Calculate total cents across all plans for this transferee
      let totalCents = 0;
      plansList.forEach(p => {
        const conv = convertUnits(p.size.value, p.size.unit);
        totalCents += conv.cents;
      });

      const totalSizeDisplay = formatTransfereeTotalArea(totalCents);

      const itemsHtml = plansList.map(plan => {
        const itemCents = convertUnits(plan.size.value, plan.size.unit).cents;
        const isSelected = !!state.selectedItemCentsMap['part_' + plan.planId];
        const ltLabel = typeLabels[plan.landType || 'dry'] || 'Dry (Punjai)';

        return `
        <div style="background: var(--bg-card); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <label class="card-select-label" onclick="event.stopPropagation();" title="Select for sum calculation">
                <input type="checkbox" class="partition-select-checkbox" data-key="part_${plan.planId}" data-cents="${itemCents}" ${isSelected ? 'checked' : ''} onchange="handleLandCheckboxChange(this)">
                <span class="checkbox-custom"></span>
              </label>
              ${typeBadges[plan.type] || typeBadges.sale}
              <span class="type-tag ${plan.landType || 'dry'}" style="font-size: 0.68rem; padding: 2px 6px;">${ltLabel}</span>
            </div>
            <span style="font-size: 1rem; font-weight: 700; color: var(--primary);">${plan.size.value} ${plan.size.unit}</span>
          </div>

          <div style="font-size: 0.85rem; display: flex; flex-direction: column; gap: 4px;">
            <div><span style="color: var(--text-muted);">Current Owner:</span> <strong>${escapeHtml(plan.parentDocOwners || 'N/A')}</strong></div>
            <div><span style="color: var(--text-muted);">Previous Owner (Seller):</span> <strong>${escapeHtml(plan.parentSellers || 'Primary Owner')}</strong></div>
            <div><span style="color: var(--text-muted);">Parent Doc:</span> <strong>Doc #${escapeHtml(plan.parentDocNumber)}</strong></div>
            <div><span style="color: var(--text-muted);">Target Parcel:</span> <strong>${escapeHtml(plan.targetPattaLabel)}</strong></div>
            ${plan.notes ? `<div style="font-style: italic; color: var(--text-secondary); margin-top: 2px;">"${escapeHtml(plan.notes)}"</div>` : ''}
          </div>

          <div style="display: flex; justify-content: flex-end; margin-top: 4px; border-top: 1px solid var(--border-color); padding-top: 6px;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="removePartitionPlan('${plan.parentRecordId}', '${plan.planId}')" style="color: var(--danger); padding: 2px 8px; font-size: 0.75rem;">
              Remove Plan
            </button>
          </div>
        </div>
      `;
      }).join('');

      return `
        <div class="record-card" style="border-left: 5px solid var(--primary); display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <!-- Single View Header -->
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
              <div>
                <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Transferee / Buyer</div>
                <h3 style="font-size: 1.25rem; font-family: var(--font-heading); color: var(--text-primary); margin: 2px 0 0 0;">${escapeHtml(buyerName)}</h3>
              </div>
              <span class="status-badge" style="background: var(--bg-hover); color: var(--text-primary); border: 1px solid var(--border-color); font-weight: 600;">
                ${plansList.length} Proposed Plan${plansList.length > 1 ? 's' : ''}
              </span>
            </div>

            <!-- List of All Parcels Acquired -->
            <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
              ${itemsHtml}
            </div>
          </div>

          <!-- Total Accumulated Area Summary at the end -->
          <div style="background: var(--primary-bg, rgba(59, 130, 246, 0.08)); border: 1px solid var(--primary); border-radius: var(--radius-sm); padding: 12px 14px; margin-top: 8px;">
            <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600; letter-spacing: 0.5px;">Total Acquired Land Area (End Summary)</div>
            <div style="font-size: 1.15rem; font-weight: 800; color: var(--primary); margin-top: 2px;">
              ${totalSizeDisplay}
            </div>
          </div>
        </div>
      `;
    }).join('');

    return;
  }

  // Individual Mode
  transfereeCountTitle.innerText = `Planned Partitions & Transferees (${allPlans.length})`;
  transfereeRecordsContainer.className = 'records-container';
  transfereeRecordsContainer.innerHTML = allPlans.map(plan => {
    const ltLabel = typeLabels[plan.landType || 'dry'] || 'Dry (Punjai)';
    const itemCents = convertUnits(plan.size.value, plan.size.unit).cents;
    const isSelected = !!state.selectedItemCentsMap['part_' + plan.planId];

    // Calculate balance for this record
    const parentTotalCents = convertUnits(plan.parentLandSize.value, plan.parentLandSize.unit).cents;
    let parentPlannedCents = 0;
    if (Array.isArray(plan.parentPartitions)) {
      plan.parentPartitions.forEach(p => {
        parentPlannedCents += convertUnits(p.size.value, p.size.unit).cents;
      });
    }
    const balanceCents = parentTotalCents - parentPlannedCents;
    const balanceColor = balanceCents <= 0 ? 'var(--danger)' : 'var(--success, #10b981)';
    const balanceDisplay = formatTransfereeTotalArea(Math.max(0, balanceCents));

    return `
      <div class="record-card ${isSelected ? 'selected-card' : ''}" style="border-left: 4px solid var(--primary);">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <label class="card-select-label" onclick="event.stopPropagation();" title="Select for sum calculation">
              <input type="checkbox" class="partition-select-checkbox" data-key="part_${plan.planId}" data-cents="${itemCents}" ${isSelected ? 'checked' : ''} onchange="handleLandCheckboxChange(this)">
              <span class="checkbox-custom"></span>
            </label>
            <div>
              <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Transferee / Buyer</div>
              <h3 style="font-size: 1.2rem; font-family: var(--font-heading); color: var(--text-primary); margin: 2px 0 0 0;">${escapeHtml(plan.buyerName)}</h3>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
            ${typeBadges[plan.type] || typeBadges.sale}
            <span class="type-tag ${plan.landType || 'dry'}" style="font-size: 0.68rem; padding: 2px 8px; font-weight: 600;">${ltLabel}</span>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.88rem; background: var(--bg-card); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); margin-bottom: 12px;">
          <div>
            <span style="color: var(--text-muted);">Current Owner:</span>
            <strong>${escapeHtml(plan.parentDocOwners || 'N/A')}</strong>
          </div>
          <div>
            <span style="color: var(--text-muted);">Previous Owner (Seller):</span>
            <strong>${escapeHtml(plan.parentSellers || 'Primary Owner')}</strong>
          </div>
          <div>
            <span style="color: var(--text-muted);">Parent Document:</span>
            <strong>Doc #${escapeHtml(plan.parentDocNumber)}</strong>
          </div>
          <div>
            <span style="color: var(--text-muted);">Target Parcel:</span>
            <strong>${escapeHtml(plan.targetPattaLabel)}</strong>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 6px; margin-top: 4px;">
            <span style="color: var(--text-muted);">Proposed Area Size:</span>
            <span style="font-size: 1.05rem; font-weight: 700; color: var(--primary);">${plan.size.value} ${plan.size.unit}</span>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; background: ${balanceCents <= 0 ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.06)'}; border: 1px solid ${balanceCents <= 0 ? 'var(--danger)' : 'var(--border-color)'}; border-radius: var(--radius-xs); padding: 5px 8px;">
            <span style="font-size: 0.72rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted);">Balance Land Remaining in Parent Record</span>
            <span style="font-weight: 800; font-size: 0.8rem; color: ${balanceColor};">${balanceDisplay}</span>
          </div>
        </div>

        ${plan.notes ? `
          <div style="font-size: 0.82rem; color: var(--text-secondary); font-style: italic; margin-bottom: 12px; background: rgba(0,0,0,0.1); padding: 8px 10px; border-radius: var(--radius-xs);">
            "${escapeHtml(plan.notes)}"
          </div>
        ` : ''}

        <div class="card-footer" style="display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid var(--border-color); padding-top: 10px;">
          <button type="button" class="btn btn-secondary btn-sm" onclick="removePartitionPlan('${plan.parentRecordId}', '${plan.planId}')" style="color: var(--danger);">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px; margin-right: 4px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            Remove Plan
          </button>
        </div>
      </div>
    `;
  }).join('');
  return;
}

function renderSummaryView(groupsMap, typeBadges) {
  const groupKeys = Object.keys(groupsMap).sort((a, b) => a.localeCompare(b));
  const transfereeCountTitle = document.getElementById('transfereeCountTitle');
  const transfereeRecordsContainer = document.getElementById('transfereeRecordsContainer');

  const typeLabels = {
    wet: 'Wet (Nanjai)',
    dry: 'Dry (Punjai)',
    residential: 'Resi (Manai)',
    commercial: 'Commercial',
    well: 'Well (Kenaru)'
  };

  if (transfereeCountTitle) {
    transfereeCountTitle.innerText = `Planned Partitions & Transferees (${groupKeys.length} Transferee${groupKeys.length === 1 ? '' : 's'})`;
  }

  transfereeRecordsContainer.className = 'records-container';
  transfereeRecordsContainer.style.display = 'block';

  transfereeRecordsContainer.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 10px;">
      ${groupKeys.map((buyerName, idx) => {
        const plansList = groupsMap[buyerName];
        let totalCents = 0;
        plansList.forEach(p => {
          const conv = convertUnits(p.size.value, p.size.unit);
          totalCents += conv.cents;
        });

        const rowsHtml = plansList.map((plan, ri) => {
          const itemCents = convertUnits(plan.size.value, plan.size.unit).cents;
          const isSelected = !!state.selectedItemCentsMap['part_' + plan.planId];
          const ltLabel = typeLabels[plan.landType || 'dry'] || 'Dry';

          return `
          <tr class="${isSelected ? 'selected-card' : ''}">
            <td style="padding: 8px 12px; border-bottom: 1px solid var(--border-color);">
              <label class="card-select-label" onclick="event.stopPropagation();" title="Select for sum calculation">
                <input type="checkbox" class="partition-select-checkbox" data-key="part_${plan.planId}" data-cents="${itemCents}" ${isSelected ? 'checked' : ''} onchange="handleLandCheckboxChange(this)">
                <span class="checkbox-custom"></span>
              </label>
            </td>
            <td style="padding: 8px 12px; border-bottom: 1px solid var(--border-color);">${ri + 1}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid var(--border-color);">
              ${typeBadges[plan.type] || typeBadges.sale}
            </td>
            <td style="padding: 8px 12px; border-bottom: 1px solid var(--border-color);">
              <span class="type-tag ${plan.landType || 'dry'}" style="font-size: 0.7rem; padding: 2px 6px;">${ltLabel}</span>
            </td>
            <td style="padding: 8px 12px; border-bottom: 1px solid var(--border-color);">${escapeHtml(plan.targetPattaLabel)}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid var(--border-color);">Doc #${escapeHtml(plan.parentDocNumber)}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid var(--border-color);">${escapeHtml(plan.parentDocOwners || 'N/A')}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid var(--border-color);">${escapeHtml(plan.parentSellers || 'Primary Owner')}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid var(--border-color); font-weight: 700; color: var(--primary);">${plan.size.value} ${plan.size.unit}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid var(--border-color); color: var(--text-muted); font-size: 0.8rem;">${plan.notes ? escapeHtml(plan.notes) : '—'}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid var(--border-color);">
              <button type="button" class="btn btn-secondary btn-sm" onclick="removePartitionPlan('${plan.parentRecordId}', '${plan.planId}')" style="color: var(--danger); padding: 2px 8px; font-size: 0.72rem;">Remove</button>
            </td>
          </tr>
        `;
        }).join('');

        const totalDisplay = formatTransfereeTotalArea(totalCents);

        return `
          <div class="record-card" style="padding: 0; overflow: hidden; border-left: 4px solid var(--primary);">
            <!-- Name Row with View Button -->
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; gap: 12px; cursor: pointer;" onclick="toggleTransfereeTable('ttable-${idx}', 'ttoggle-${idx}')">
              <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--accent)); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1rem; color: #fff; flex-shrink: 0;">
                  ${escapeHtml(buyerName.trim().charAt(0).toUpperCase())}
                </div>
                <div>
                  <div style="font-weight: 700; font-size: 1rem; color: var(--text-primary);">${escapeHtml(buyerName)}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">${plansList.length} plan${plansList.length > 1 ? 's' : ''} &nbsp;·&nbsp; <span style="color: var(--primary); font-weight: 600;">${totalDisplay}</span></div>
                </div>
              </div>
              <button type="button" id="ttoggle-${idx}" class="btn btn-primary btn-sm" style="flex-shrink: 0; min-width: 90px;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;margin-right:4px;"><path d="M3 3h18v4H3z"/><path d="M3 10h18v4H3z"/><path d="M3 17h18v4H3z"/></svg>
                View Table
              </button>
            </div>

            <!-- Hidden Table Panel -->
            <div id="ttable-${idx}" style="display: none; border-top: 1px solid var(--border-color); overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; font-size: 0.83rem;">
                <thead>
                  <tr style="background: var(--bg-hover);">
                    <th style="padding: 8px 12px; text-align: left; color: var(--text-muted); font-weight: 600; font-size: 0.72rem; text-transform: uppercase;">Select</th>
                    <th style="padding: 8px 12px; text-align: left; color: var(--text-muted); font-weight: 600; font-size: 0.72rem; text-transform: uppercase;">#</th>
                    <th style="padding: 8px 12px; text-align: left; color: var(--text-muted); font-weight: 600; font-size: 0.72rem; text-transform: uppercase;">Type</th>
                    <th style="padding: 8px 12px; text-align: left; color: var(--text-muted); font-weight: 600; font-size: 0.72rem; text-transform: uppercase;">Land Type</th>
                    <th style="padding: 8px 12px; text-align: left; color: var(--text-muted); font-weight: 600; font-size: 0.72rem; text-transform: uppercase;">Target Parcel</th>
                    <th style="padding: 8px 12px; text-align: left; color: var(--text-muted); font-weight: 600; font-size: 0.72rem; text-transform: uppercase;">Parent Doc</th>
                    <th style="padding: 8px 12px; text-align: left; color: var(--text-muted); font-weight: 600; font-size: 0.72rem; text-transform: uppercase;">Current Owner</th>
                    <th style="padding: 8px 12px; text-align: left; color: var(--text-muted); font-weight: 600; font-size: 0.72rem; text-transform: uppercase;">Previous Owner (Seller)</th>
                    <th style="padding: 8px 12px; text-align: left; color: var(--text-muted); font-weight: 600; font-size: 0.72rem; text-transform: uppercase;">Size</th>
                    <th style="padding: 8px 12px; text-align: left; color: var(--text-muted); font-weight: 600; font-size: 0.72rem; text-transform: uppercase;">Notes</th>
                    <th style="padding: 8px 12px; text-align: left; color: var(--text-muted); font-weight: 600; font-size: 0.72rem; text-transform: uppercase;">Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                  <tr style="background: var(--bg-hover);">
                    <td colspan="8" style="padding: 10px 12px; font-weight: 700; text-align: right; color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase;">Total Acquired Area →</td>
                    <td colspan="3" style="padding: 10px 12px; font-weight: 800; color: var(--primary); font-size: 0.95rem;">${totalDisplay}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
      }).join('')}
  `;
}

function toggleTransfereeTable(tableId, btnId) {
  const table = document.getElementById(tableId);
  const btn = document.getElementById(btnId);
  if (!table) return;
  const isOpen = table.style.display !== 'none';
  table.style.display = isOpen ? 'none' : 'block';
  if (btn) {
    btn.innerHTML = isOpen
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;margin-right:4px;"><path d="M3 3h18v4H3z"/><path d="M3 10h18v4H3z"/><path d="M3 17h18v4H3z"/></svg>View Table`
      : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;margin-right:4px;"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>Collapse`;
  }
}

async function removePartitionPlan(parentRecordId, planId) {
  if (!confirm('Are you sure you want to remove this partition plan?')) return;
  const rec = state.records.find(r => r.id === parentRecordId);
  if (!rec || !Array.isArray(rec.partitions)) return;

  const updatedPartitions = rec.partitions.filter(p => p.id !== planId);

  try {
    const { error } = await state.supabaseClient
      .from('land_records')
      .update({
        partitions: updatedPartitions,
        updated_at: new Date().toISOString()
      })
      .eq('id', parentRecordId);

    if (error) throw error;

    showToast('Partition plan removed.', 'success');
    await fetchRecords();
    renderTransfereeView();
  } catch (err) {
    console.error('Error removing partition plan:', err);
    showToast('Failed to remove partition plan.', 'error');
  }
}

// -------------------------------------------------------------
// Nearby Lands & Master FMB Module
// -------------------------------------------------------------
const nearbySearchInput = document.getElementById('nearbySearchInput');
const clearNearbySearchBtn = document.getElementById('clearNearbySearchBtn');
const nearbyRecordsContainer = document.getElementById('nearbyRecordsContainer');
const nearbyCountTitle = document.getElementById('nearbyCountTitle');
const addNearbyLandBtn = document.getElementById('addNearbyLandBtn');

const nearbyOverlay = document.getElementById('nearbyOverlay');
const nearbyLandDrawer = document.getElementById('nearbyLandDrawer');
const nearbyCloseBtn = document.getElementById('nearbyCloseBtn');
const nearbyCancelBtn = document.getElementById('nearbyCancelBtn');
const deleteNearbyBtn = document.getElementById('deleteNearbyBtn');
const nearbyLandForm = document.getElementById('nearbyLandForm');

const nearbyOwnersContainer = document.getElementById('nearbyOwnersContainer');
const addNearbyOwnerBtn = document.getElementById('addNearbyOwnerBtn');

const areaNearbyFmb = document.getElementById('areaNearbyFmb');
const fileNearbyFmb = document.getElementById('fileNearbyFmb');
const statusNearbyFmb = document.getElementById('statusNearbyFmb');
const nameNearbyFmb = document.getElementById('nameNearbyFmb');
const viewNearbyFmb = document.getElementById('viewNearbyFmb');
const deleteNearbyFmbBtn = document.getElementById('deleteNearbyFmbBtn');

const areaMasterFmb = document.getElementById('areaMasterFmb');
const fileMasterFmb = document.getElementById('fileMasterFmb');
const statusMasterFmb = document.getElementById('statusMasterFmb');
const nameMasterFmb = document.getElementById('nameMasterFmb');
const viewMasterFmb = document.getElementById('viewMasterFmb');
const deleteMasterFmbBtn = document.getElementById('deleteMasterFmbBtn');

let tempNearbyFmb = null;
let tempMasterFmb = null;

function addNearbyOwnerInput(initialVal = '') {
  if (!nearbyOwnersContainer) return;
  const div = document.createElement('div');
  div.className = 'purchased-from-row';
  div.style.cssText = 'display: flex; gap: 8px; align-items: center;';
  div.innerHTML = `
    <input type="text" class="nearby-owner-name-input" value="${initialVal}" placeholder="e.g. K. Marimuthu" style="flex: 1; padding: 10px; background-color: var(--input-bg); border: 1px solid var(--border-color); border-radius: var(--radius-sm); color: var(--text-primary); font-size: 0.9rem;">
    <button type="button" class="btn-remove-row" style="background: transparent; border: none; color: var(--danger); font-size: 1.2rem; cursor: pointer; padding: 0 4px;">&times;</button>
  `;
  div.querySelector('.btn-remove-row').addEventListener('click', () => {
    if (nearbyOwnersContainer.children.length > 1) {
      div.remove();
    } else {
      div.querySelector('input').value = '';
    }
  });
  nearbyOwnersContainer.appendChild(div);
}

if (addNearbyOwnerBtn) {
  addNearbyOwnerBtn.addEventListener('click', () => addNearbyOwnerInput(''));
}

function openNearbyDrawer(record = null) {
  if (!nearbyLandDrawer || !nearbyOverlay) return;

  document.getElementById('nearbyRecordId').value = record ? record.id : '';
  document.getElementById('nearbyDrawerTitle').innerText = record ? 'Edit Nearby Land Record' : 'Add Nearby / Adjacent Land Record';
  document.getElementById('nearbySurveyNumber').value = record ? record.surveyNumber : '';
  document.getElementById('nearbySubDivision').value = record ? (record.subDivision || '') : '';
  document.getElementById('nearbyPattaNumber').value = record ? (record.pattaNumber || '') : '';
  document.getElementById('nearbyDirection').value = record ? (record.direction || 'North Boundary') : 'North Boundary';
  document.getElementById('nearbyLandType').value = record ? (record.landType || 'dry') : 'dry';
  document.getElementById('nearbySizeValue').value = record && record.landSize ? record.landSize.value : '';
  document.getElementById('nearbySizeUnit').value = record && record.landSize ? record.landSize.unit : 'cent';
  document.getElementById('nearbyNotes').value = record ? (record.notes || '') : '';

  if (nearbyOwnersContainer) {
    nearbyOwnersContainer.innerHTML = '';
    const owners = record && Array.isArray(record.pattaNames) && record.pattaNames.length > 0 ? record.pattaNames : [''];
    owners.forEach(name => addNearbyOwnerInput(name));
  }

  // Attachments Reset
  tempNearbyFmb = record && record.attachments ? record.attachments.fmb : null;
  tempMasterFmb = record && record.attachments ? record.attachments.masterFmb : null;

  updateNearbyAttachmentUI('fmb', tempNearbyFmb);
  updateNearbyAttachmentUI('masterFmb', tempMasterFmb);

  if (deleteNearbyBtn) {
    if (record) deleteNearbyBtn.classList.remove('hidden');
    else deleteNearbyBtn.classList.add('hidden');
  }

  nearbyLandDrawer.classList.add('active');
  nearbyOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeNearbyDrawer() {
  if (!nearbyLandDrawer || !nearbyOverlay) return;
  nearbyLandDrawer.classList.remove('active');
  nearbyOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

if (addNearbyLandBtn) addNearbyLandBtn.addEventListener('click', () => openNearbyDrawer());
if (nearbyCloseBtn) nearbyCloseBtn.addEventListener('click', closeNearbyDrawer);
if (nearbyCancelBtn) nearbyCancelBtn.addEventListener('click', closeNearbyDrawer);
if (nearbyOverlay) nearbyOverlay.addEventListener('click', closeNearbyDrawer);

function updateNearbyAttachmentUI(type, attObj) {
  const statusEl = type === 'fmb' ? statusNearbyFmb : statusMasterFmb;
  const areaEl = type === 'fmb' ? areaNearbyFmb : areaMasterFmb;
  const nameEl = type === 'fmb' ? nameNearbyFmb : nameMasterFmb;
  const viewEl = type === 'fmb' ? viewNearbyFmb : viewMasterFmb;

  if (attObj && isValidFileUrl(attObj.fileUrl)) {
    if (statusEl) statusEl.classList.remove('hidden');
    if (areaEl) areaEl.classList.add('hidden');
    if (nameEl) nameEl.innerText = attObj.fileName || (type === 'fmb' ? 'Parcel FMB' : 'Master FMB');
    if (viewEl) viewEl.href = attObj.fileUrl;
  } else {
    if (statusEl) statusEl.classList.add('hidden');
    if (areaEl) areaEl.classList.remove('hidden');
    if (nameEl) nameEl.innerText = '';
    if (viewEl) viewEl.href = '#';
  }
}

// Upload file handlers
if (areaNearbyFmb && fileNearbyFmb) {
  areaNearbyFmb.addEventListener('click', () => fileNearbyFmb.click());
  fileNearbyFmb.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      tempNearbyFmb = { fileName: file.name, fileObj: file, fileUrl: URL.createObjectURL(file) };
      updateNearbyAttachmentUI('fmb', tempNearbyFmb);
    }
  });
}

if (areaMasterFmb && fileMasterFmb) {
  areaMasterFmb.addEventListener('click', () => fileMasterFmb.click());
  fileMasterFmb.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      tempMasterFmb = { fileName: file.name, fileObj: file, fileUrl: URL.createObjectURL(file) };
      updateNearbyAttachmentUI('masterFmb', tempMasterFmb);
    }
  });
}

if (deleteNearbyFmbBtn) {
  deleteNearbyFmbBtn.addEventListener('click', () => {
    tempNearbyFmb = null;
    updateNearbyAttachmentUI('fmb', null);
  });
}

if (deleteMasterFmbBtn) {
  deleteMasterFmbBtn.addEventListener('click', () => {
    tempMasterFmb = null;
    updateNearbyAttachmentUI('masterFmb', null);
  });
}

// Fetch Nearby Records from Supabase DB
async function fetchNearbyRecords() {
  if (!state.currentUser) {
    state.nearbyRecords = [];
    renderNearbyRecordsList(false);
    return;
  }

  if (state.supabaseClient) {
    try {
      const { data, error } = await state.supabaseClient
        .from('nearby_land_records')
        .select('*')
        .eq('user_email', state.currentUser.email)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST205' || (error.message && error.message.includes('nearby_land_records'))) {
          console.warn('nearby_land_records table not found on Supabase Cloud DB yet.');
          state.nearbyRecords = [];
          renderNearbyRecordsList(true);
          return;
        }
        throw error;
      }

      state.nearbyRecords = (data || []).map(r => ({
        id: r.id,
        surveyNumber: r.survey_number,
        subDivision: r.sub_division || '',
        pattaNumber: r.patta_number || '',
        pattaNames: typeof r.patta_names === 'string' ? JSON.parse(r.patta_names) : (r.patta_names || []),
        landType: r.land_type || 'dry',
        landSize: typeof r.land_size === 'string' ? JSON.parse(r.land_size) : (r.land_size || { value: 0, unit: 'cent' }),
        direction: r.direction || 'Surrounding Survey',
        notes: r.notes || '',
        attachments: typeof r.attachments === 'string' ? JSON.parse(r.attachments) : (r.attachments || {}),
        createdAt: r.created_at,
        updatedAt: r.updated_at
      }));

      renderNearbyRecordsList(false);
    } catch (err) {
      console.error('Error fetching nearby records from Supabase:', err);
      showToast('Error loading nearby lands from Supabase DB.', 'error');
    }
  }
}

function renderNearbyRecordsList(isTableMissing = false) {
  if (!nearbyRecordsContainer) return;

  if (isTableMissing) {
    nearbyCountTitle.innerText = `Nearby & Surrounding Land Records (0)`;
    nearbyRecordsContainer.className = 'records-container empty-state';
    nearbyRecordsContainer.innerHTML = `
      <div class="empty-state-message">
        <div class="empty-illustration">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
        <h3>Supabase Database Table Setup Required</h3>
        <p>To enable Nearby Lands & Master FMB Cloud Storage, please run the SQL script in <code>data/supabase_setup.sql</code> in your Supabase SQL Editor.</p>
        <button type="button" class="btn btn-primary btn-sm" onclick="openNearbyDrawer()" style="margin-top: 12px;">Add Nearby Land Record</button>
      </div>
    `;
    return;
  }

  if (!state.currentUser) {
    nearbyCountTitle.innerText = `Nearby & Surrounding Land Records (0)`;
    nearbyRecordsContainer.className = 'records-container empty-state';
    nearbyRecordsContainer.innerHTML = `
      <div class="empty-state-message">
        <div class="empty-illustration">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
        <h3>Authentication Required</h3>
        <p>Please Sign In to view and store your nearby land records and master FMB maps in Supabase Cloud DB.</p>
        <button type="button" class="btn btn-primary btn-sm" onclick="openAuthModal()" style="margin-top: 12px; height: 36px; padding: 0 16px;">
          Sign In Now
        </button>
      </div>
    `;
    return;
  }

  let filtered = state.nearbyRecords;
  if (state.nearbySearchQuery) {
    const q = state.nearbySearchQuery.toLowerCase();
    filtered = filtered.filter(r => 
      r.surveyNumber.toLowerCase().includes(q) ||
      r.subDivision.toLowerCase().includes(q) ||
      r.pattaNumber.toLowerCase().includes(q) ||
      r.direction.toLowerCase().includes(q) ||
      r.pattaNames.some(n => n.toLowerCase().includes(q))
    );
  }

  nearbyCountTitle.innerText = `Nearby & Surrounding Land Records (${filtered.length})`;

  if (filtered.length === 0) {
    nearbyRecordsContainer.className = 'records-container empty-state';
    nearbyRecordsContainer.innerHTML = `
      <div class="empty-state-message">
        <div class="empty-illustration">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
        <h3>No Nearby Land Records Found</h3>
        <p>Store details of adjacent survey numbers, patta owners, and Master Survey FMB maps.</p>
        <button type="button" class="btn btn-primary btn-sm" onclick="openNearbyDrawer()" style="margin-top: 12px;">Add Nearby Land Record</button>
      </div>
    `;
    return;
  }

  nearbyRecordsContainer.className = 'records-container';
  nearbyRecordsContainer.innerHTML = '';

  filtered.forEach(r => {
    const card = document.createElement('div');
    card.className = 'land-card';

    const ownerChips = r.pattaNames.map(n => `<span class="badge" style="background: rgba(99, 102, 241, 0.1); color: var(--primary); border: 1px solid rgba(99, 102, 241, 0.2); margin-right: 4px; font-weight: 500;">${n}</span>`).join('');
    
    const hasParcelFmb = r.attachments && r.attachments.fmb && isValidFileUrl(r.attachments.fmb.fileUrl);
    const hasMasterFmb = r.attachments && r.attachments.masterFmb && isValidFileUrl(r.attachments.masterFmb.fileUrl);

    const parcelFmbChip = hasParcelFmb ? `
      <a href="${r.attachments.fmb.fileUrl}" target="_blank" class="attachment-chip" onclick="event.stopPropagation();" style="font-size: 0.7rem; padding: 3px 8px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        Parcel FMB
      </a>
    ` : '';

    const masterFmbChip = hasMasterFmb ? `
      <a href="${r.attachments.masterFmb.fileUrl}" target="_blank" class="attachment-chip" onclick="event.stopPropagation();" style="font-size: 0.7rem; padding: 3px 8px; background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3); color: var(--success);">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        Master Survey FMB (Whole ${r.surveyNumber})
      </a>
    ` : '';

    card.innerHTML = `
      <div class="card-header">
        <div class="survey-title">
          <h3>Survey ${r.surveyNumber}${r.subDivision ? '/' + r.subDivision : ''}</h3>
          <span class="sub-survey">Patta ${r.pattaNumber || 'N/A'}</span>
        </div>
        <span class="badge badge-success" style="text-transform: uppercase; font-size: 0.7rem;">${r.direction}</span>
      </div>

      <div class="card-body">
        <div class="info-item">
          <span class="lbl">Patta Owners / Neighbors</span>
          <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">
            ${ownerChips || '<span style="color: var(--text-muted);">No names listed</span>'}
          </div>
        </div>

        <div class="info-item">
          <span class="lbl">Land Type & Size</span>
          <span class="val">${(r.landType || 'dry').toUpperCase()} — <strong>${r.landSize ? r.landSize.value : 0} ${r.landSize ? r.landSize.unit : 'cent'}</strong></span>
        </div>

        ${(hasParcelFmb || hasMasterFmb) ? `
        <div class="info-item" style="grid-column: span 2;">
          <span class="lbl">FMB Maps & Attachments</span>
          <div class="card-attachments" style="margin-top: 4px; display: flex; gap: 8px; flex-wrap: wrap;">
            ${parcelFmbChip}
            ${masterFmbChip}
          </div>
        </div>
        ` : ''}

        ${r.notes ? `
        <div class="info-item" style="grid-column: span 2;">
          <span class="lbl">Notes / Boundary Remarks</span>
          <p style="margin: 2px 0 0 0; font-size: 0.8rem; color: var(--text-muted); line-height: 1.4;">${r.notes}</p>
        </div>
        ` : ''}
      </div>
    `;

    card.addEventListener('click', () => openNearbyDrawer(r));
    nearbyRecordsContainer.appendChild(card);
  });
}

// Nearby Search input listener
if (nearbySearchInput) {
  nearbySearchInput.addEventListener('input', () => {
    state.nearbySearchQuery = nearbySearchInput.value.trim();
    if (clearNearbySearchBtn) {
      if (state.nearbySearchQuery) clearNearbySearchBtn.classList.remove('hidden');
      else clearNearbySearchBtn.classList.add('hidden');
    }
    renderNearbyRecordsList();
  });
}

if (clearNearbySearchBtn) {
  clearNearbySearchBtn.addEventListener('click', () => {
    nearbySearchInput.value = '';
    state.nearbySearchQuery = '';
    clearNearbySearchBtn.classList.add('hidden');
    renderNearbyRecordsList();
  });
}

// Save Nearby Land Form Submit Handler
if (nearbyLandForm) {
  nearbyLandForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.supabaseClient || !state.currentUser) return;

    const id = document.getElementById('nearbyRecordId').value;
    const surveyNumber = document.getElementById('nearbySurveyNumber').value.trim();
    const subDivision = document.getElementById('nearbySubDivision').value.trim();
    const pattaNumber = document.getElementById('nearbyPattaNumber').value.trim();
    const direction = document.getElementById('nearbyDirection').value;
    const landType = document.getElementById('nearbyLandType').value;
    const sizeVal = parseFloat(document.getElementById('nearbySizeValue').value) || 0;
    const sizeUnit = document.getElementById('nearbySizeUnit').value;
    const notes = document.getElementById('nearbyNotes').value.trim();

    // Gather non-empty patta owner names
    const pattaNames = [];
    nearbyOwnersContainer.querySelectorAll('.nearby-owner-name-input').forEach(input => {
      if (input.value.trim()) pattaNames.push(input.value.trim());
    });

    if (!surveyNumber) {
      showToast('Survey Number is required.', 'error');
      return;
    }

    try {
      // Upload attachments if new file selected
      let fmbAttachment = tempNearbyFmb;
      let masterFmbAttachment = tempMasterFmb;

      if (tempNearbyFmb && tempNearbyFmb.fileObj) {
        const fileExt = tempNearbyFmb.fileObj.name.split('.').pop();
        const filePath = `nearby_${Date.now()}_fmb.${fileExt}`;
        const { error: uploadErr } = await state.supabaseClient.storage
          .from('land_documents')
          .upload(filePath, tempNearbyFmb.fileObj);

        if (uploadErr) console.error('Upload error FMB:', uploadErr);

        const { data: publicUrlData } = state.supabaseClient.storage
          .from('land_documents')
          .getPublicUrl(filePath);

        fmbAttachment = { fileName: tempNearbyFmb.fileName, fileUrl: publicUrlData.publicUrl };
      }

      if (tempMasterFmb && tempMasterFmb.fileObj) {
        const fileExt = tempMasterFmb.fileObj.name.split('.').pop();
        const filePath = `master_${Date.now()}_fmb.${fileExt}`;
        const { error: uploadErr } = await state.supabaseClient.storage
          .from('land_documents')
          .upload(filePath, tempMasterFmb.fileObj);

        if (uploadErr) console.error('Upload error Master FMB:', uploadErr);

        const { data: publicUrlData } = state.supabaseClient.storage
          .from('land_documents')
          .getPublicUrl(filePath);

        masterFmbAttachment = { fileName: tempMasterFmb.fileName, fileUrl: publicUrlData.publicUrl };
      }

      const payload = {
        user_email: state.currentUser.email,
        survey_number: surveyNumber,
        sub_division: subDivision,
        patta_number: pattaNumber,
        patta_names: pattaNames,
        land_type: landType,
        land_size: { value: sizeVal, unit: sizeUnit },
        direction,
        notes,
        attachments: {
          fmb: fmbAttachment,
          masterFmb: masterFmbAttachment
        },
        updated_at: new Date().toISOString()
      };

      if (id) {
        const { error } = await state.supabaseClient
          .from('nearby_land_records')
          .update(payload)
          .eq('id', id);

        if (error) throw error;
        showToast('Nearby Land Record updated successfully!', 'success');
      } else {
        payload.created_at = new Date().toISOString();
        const { error } = await state.supabaseClient
          .from('nearby_land_records')
          .insert([payload]);

        if (error) throw error;
        showToast('Nearby Land Record created successfully!', 'success');
      }

      closeNearbyDrawer();
      await fetchNearbyRecords();
    } catch (err) {
      console.error('Error saving nearby land record:', err);
      showToast(err.message || 'Failed to save nearby land record.', 'error');
    }
  });
}

if (deleteNearbyBtn) {
  deleteNearbyBtn.addEventListener('click', async () => {
    const id = document.getElementById('nearbyRecordId').value;
    if (!id || !state.supabaseClient) return;

    if (confirm('Are you sure you want to delete this nearby land record?')) {
      try {
        const { error } = await state.supabaseClient
          .from('nearby_land_records')
          .delete()
          .eq('id', id);

        if (error) throw error;
        showToast('Nearby Land Record deleted successfully.', 'success');
        closeNearbyDrawer();
        await fetchNearbyRecords();
      } catch (err) {
        console.error('Error deleting nearby record:', err);
        showToast('Failed to delete nearby record.', 'error');
      }
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSupabase();
  fetchRecords();
  initAttachmentsHandlers();
});

// -------------------------------------------------------------
// Unregistered Land Purchases & Deals Pending Registration Module
// -------------------------------------------------------------
const pendingDealsCountTitle = document.getElementById('pendingDealsCountTitle');
const statPendingDealsCount = document.getElementById('statPendingDealsCount');
const statPendingDealsSize = document.getElementById('statPendingDealsSize');
const statPendingDealsAdvance = document.getElementById('statPendingDealsAdvance');

const addPendingDealBtn = document.getElementById('addPendingDealBtn');
const pendingDealSearchInput = document.getElementById('pendingDealSearchInput');
const clearPendingDealSearchBtn = document.getElementById('clearPendingDealSearchBtn');
const pendingDealFilterStatus = document.getElementById('pendingDealFilterStatus');
const pendingDealsContainer = document.getElementById('pendingDealsContainer');

const pendingDealOverlay = document.getElementById('pendingDealOverlay');
const pendingDealDrawer = document.getElementById('pendingDealDrawer');
const pendingDealCloseBtn = document.getElementById('pendingDealCloseBtn');
const pendingDealCancelBtn = document.getElementById('pendingDealCancelBtn');
const deletePendingDealBtn = document.getElementById('deletePendingDealBtn');
const pendingDealForm = document.getElementById('pendingDealForm');
const pendingSellersContainer = document.getElementById('pendingSellersContainer');
const addPendingSellerBtn = document.getElementById('addPendingSellerBtn');
const pendingBuyersContainer = document.getElementById('pendingBuyersContainer');
const addPendingBuyerBtn = document.getElementById('addPendingBuyerBtn');

const areaPendingAgreement = document.getElementById('areaPendingAgreement');
const filePendingAgreement = document.getElementById('filePendingAgreement');
const statusPendingAgreement = document.getElementById('statusPendingAgreement');
const namePendingAgreement = document.getElementById('namePendingAgreement');
const viewPendingAgreement = document.getElementById('viewPendingAgreement');
const deletePendingAgreementBtn = document.getElementById('deletePendingAgreementBtn');

let tempPendingAgreement = null;

function addPendingSellerInput(initialVal = '') {
  if (!pendingSellersContainer) return;
  const div = document.createElement('div');
  div.className = 'name-row';
  div.innerHTML = `
    <input type="text" class="pending-seller-name-input" value="${escapeHtml(initialVal)}" placeholder="e.g. M. Shanmugam" style="flex: 1;">
    <button type="button" class="remove-name-btn" aria-label="Remove">&times;</button>
  `;
  div.querySelector('.remove-name-btn').addEventListener('click', () => {
    if (pendingSellersContainer.children.length > 1) {
      div.remove();
    } else {
      div.querySelector('input').value = '';
    }
  });
  pendingSellersContainer.appendChild(div);
}

function addPendingBuyerInput(initialVal = '') {
  if (!pendingBuyersContainer) return;
  const div = document.createElement('div');
  div.className = 'name-row';
  div.innerHTML = `
    <input type="text" class="pending-buyer-name-input" value="${escapeHtml(initialVal)}" placeholder="e.g. Manoj Kumar" style="flex: 1;">
    <button type="button" class="remove-name-btn" aria-label="Remove">&times;</button>
  `;
  div.querySelector('.remove-name-btn').addEventListener('click', () => {
    if (pendingBuyersContainer.children.length > 1) {
      div.remove();
    } else {
      div.querySelector('input').value = '';
    }
  });
  pendingBuyersContainer.appendChild(div);
}

if (addPendingSellerBtn) addPendingSellerBtn.addEventListener('click', () => addPendingSellerInput(''));
if (addPendingBuyerBtn) addPendingBuyerBtn.addEventListener('click', () => addPendingBuyerInput(''));

function openPendingDealDrawer(deal = null) {
  if (!pendingDealDrawer || !pendingDealOverlay) return;

  document.getElementById('pendingDealId').value = deal ? deal.id : '';
  document.getElementById('pendingDealDrawerTitle').innerText = deal ? 'Edit Unregistered Purchase Deal' : 'Add Unregistered Purchase Deal';

  document.getElementById('dealStatus').value = deal ? (deal.dealStatus || 'agreement_executed') : 'agreement_executed';
  document.getElementById('pendingDealLandType').value = deal ? (deal.landType || 'dry') : 'dry';
  document.getElementById('pendingSurveyNumber').value = deal ? deal.surveyNumber : '';
  document.getElementById('pendingSubDivision').value = deal ? (deal.subDivision || '') : '';
  document.getElementById('pendingPattaNumber').value = deal ? (deal.pattaNumber || '') : '';
  document.getElementById('pendingSizeValue').value = deal && deal.landSize ? deal.landSize.value : '';
  document.getElementById('pendingSizeUnit').value = deal && deal.landSize ? deal.landSize.unit : 'cent';
  document.getElementById('agreementDate').value = deal ? (deal.agreementDate || '') : '';
  document.getElementById('targetRegistrationDate').value = deal ? (deal.targetRegistrationDate || '') : '';
  document.getElementById('totalPrice').value = deal && deal.totalPrice ? deal.totalPrice : '';
  document.getElementById('advancePaid').value = deal && deal.advancePaid ? deal.advancePaid : '';
  document.getElementById('pendingDistrict').value = deal ? (deal.district || '') : '';
  document.getElementById('pendingSro').value = deal ? (deal.sro || '') : '';
  document.getElementById('pendingVillage').value = deal ? (deal.village || '') : '';
  document.getElementById('pendingNotes').value = deal ? (deal.notes || '') : '';

  if (pendingSellersContainer) {
    pendingSellersContainer.innerHTML = '';
    const sellers = deal && Array.isArray(deal.sellerName) && deal.sellerName.length > 0 ? deal.sellerName : [''];
    sellers.forEach(s => addPendingSellerInput(s));
  }

  if (pendingBuyersContainer) {
    pendingBuyersContainer.innerHTML = '';
    const buyers = deal && Array.isArray(deal.buyerName) && deal.buyerName.length > 0 ? deal.buyerName : [state.currentUser ? (state.currentUser.email.split('@')[0]) : ''];
    buyers.forEach(b => addPendingBuyerInput(b));
  }

  tempPendingAgreement = deal && deal.attachments ? deal.attachments.agreement : null;
  updatePendingAgreementUI(tempPendingAgreement);

  if (deletePendingDealBtn) {
    if (deal) deletePendingDealBtn.classList.remove('hidden');
    else deletePendingDealBtn.classList.add('hidden');
  }

  pendingDealDrawer.classList.add('active');
  pendingDealOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closePendingDealDrawer() {
  if (!pendingDealDrawer || !pendingDealOverlay) return;
  pendingDealDrawer.classList.remove('active');
  pendingDealOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

if (addPendingDealBtn) addPendingDealBtn.addEventListener('click', () => openPendingDealDrawer());
if (pendingDealCloseBtn) pendingDealCloseBtn.addEventListener('click', closePendingDealDrawer);
if (pendingDealCancelBtn) pendingDealCancelBtn.addEventListener('click', closePendingDealDrawer);
if (pendingDealOverlay) pendingDealOverlay.addEventListener('click', closePendingDealDrawer);

function updatePendingAgreementUI(attObj) {
  if (attObj && isValidFileUrl(attObj.fileUrl)) {
    if (statusPendingAgreement) statusPendingAgreement.classList.remove('hidden');
    if (areaPendingAgreement) areaPendingAgreement.classList.add('hidden');
    if (namePendingAgreement) namePendingAgreement.innerText = attObj.fileName || 'Agreement Copy';
    if (viewPendingAgreement) viewPendingAgreement.href = attObj.fileUrl;
  } else {
    if (statusPendingAgreement) statusPendingAgreement.classList.add('hidden');
    if (areaPendingAgreement) areaPendingAgreement.classList.remove('hidden');
    if (namePendingAgreement) namePendingAgreement.innerText = '';
    if (viewPendingAgreement) viewPendingAgreement.href = '#';
  }
}

if (areaPendingAgreement && filePendingAgreement) {
  areaPendingAgreement.addEventListener('click', () => filePendingAgreement.click());
  filePendingAgreement.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      tempPendingAgreement = { fileName: file.name, fileObj: file, fileUrl: URL.createObjectURL(file) };
      updatePendingAgreementUI(tempPendingAgreement);
    }
  });
}

if (deletePendingAgreementBtn) {
  deletePendingAgreementBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    tempPendingAgreement = null;
    if (filePendingAgreement) filePendingAgreement.value = '';
    updatePendingAgreementUI(null);
  });
}

if (pendingDealSearchInput) {
  pendingDealSearchInput.addEventListener('input', (e) => {
    state.pendingDealsSearchQuery = e.target.value;
    if (clearPendingDealSearchBtn) {
      if (state.pendingDealsSearchQuery) clearPendingDealSearchBtn.classList.remove('hidden');
      else clearPendingDealSearchBtn.classList.add('hidden');
    }
    renderPendingDealsView();
  });
}

if (clearPendingDealSearchBtn) {
  clearPendingDealSearchBtn.addEventListener('click', () => {
    state.pendingDealsSearchQuery = '';
    if (pendingDealSearchInput) pendingDealSearchInput.value = '';
    clearPendingDealSearchBtn.classList.add('hidden');
    renderPendingDealsView();
  });
}

if (pendingDealFilterStatus) {
  pendingDealFilterStatus.addEventListener('change', (e) => {
    state.pendingDealsStatusFilter = e.target.value;
    renderPendingDealsView();
  });
}

async function fetchPendingDeals() {
  if (!state.currentUser) {
    state.pendingDeals = [];
    renderPendingDealsView();
    return;
  }

  if (state.supabaseClient) {
    try {
      const { data, error } = await state.supabaseClient
        .from('pending_land_deals')
        .select('*')
        .eq('user_email', state.currentUser.email)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      state.pendingDeals = (data || []).map(d => ({
        id: d.id,
        sellerName: typeof d.seller_name === 'string' ? JSON.parse(d.seller_name) : (d.seller_name || []),
        buyerName: typeof d.buyer_name === 'string' ? JSON.parse(d.buyer_name) : (d.buyer_name || []),
        surveyNumber: d.survey_number,
        subDivision: d.sub_division || '',
        pattaNumber: d.patta_number || '',
        landType: d.land_type || 'dry',
        landSize: typeof d.land_size === 'string' ? JSON.parse(d.land_size) : (d.land_size || { value: 0, unit: 'cent' }),
        dealStatus: d.deal_status || 'agreement_executed',
        agreementDate: d.agreement_date,
        targetRegistrationDate: d.target_registration_date,
        totalPrice: parseFloat(d.total_price) || 0,
        advancePaid: parseFloat(d.advance_paid) || 0,
        district: d.district || '',
        sro: d.sro || '',
        village: d.village || '',
        notes: d.notes || '',
        attachments: typeof d.attachments === 'string' ? JSON.parse(d.attachments) : (d.attachments || {}),
        createdAt: d.created_at,
        updatedAt: d.updated_at
      }));

      renderPendingDealsView();
      return;
    } catch (err) {
      console.error('Error fetching pending deals from Supabase:', err);
    }
  }

  // Fallback API
  try {
    const res = await fetch('/api/pending-deals');
    if (res.ok) {
      state.pendingDeals = await res.json();
    }
  } catch (e) {
    state.pendingDeals = [];
  }
  renderPendingDealsView();
}

function convertPendingDealToRecord(deal) {
  if (!deal) return;
  if (!confirm(`Do you want to convert the deal for Survey ${deal.surveyNumber} into an official registered Land Record?`)) return;

  // Open main form drawer with pre-filled details
  openDrawer();

  document.getElementById('surveyNumber').value = deal.surveyNumber || '';
  document.getElementById('subDivision').value = deal.subDivision || '';
  document.getElementById('landType').value = deal.landType || 'dry';
  document.getElementById('district').value = deal.district || '';
  document.getElementById('sro').value = deal.sro || '';
  document.getElementById('village').value = deal.village || '';
  document.getElementById('notes').value = `Converted from Pending Purchase Deal (Total Price: ₹${(deal.totalPrice || 0).toLocaleString()}, Advance Paid: ₹${(deal.advancePaid || 0).toLocaleString()}). ${deal.notes || ''}`;

  // Pre-fill Document Owner Names (buyers) & Sellers
  resetDocumentInputs(
    Array.isArray(deal.buyerName) ? deal.buyerName : [deal.buyerName],
    Array.isArray(deal.sellerName) ? deal.sellerName : [deal.sellerName]
  );

  // Pre-fill Patta block with deal size
  if (pattasContainer) {
    pattasContainer.innerHTML = '';
    addPattaInputBlock(
      deal.pattaNumber || '',
      true, // Patta transferred
      Array.isArray(deal.buyerName) ? deal.buyerName : [],
      [{
        surveyNumber: deal.surveyNumber || '',
        subDivision: deal.subDivision || '',
        landSize: deal.landSize || { value: 0, unit: 'cent' },
        landType: deal.landType || 'dry'
      }]
    );
  }

  showToast('Form pre-filled from Pending Deal! Add document number and date, then click Save.', 'info');
}

function renderPendingDealsView() {
  if (!pendingDealsContainer) return;

  if (!state.currentUser) {
    if (pendingDealsCountTitle) pendingDealsCountTitle.innerText = `Deals Made & Purchases Pending Registration (0)`;
    if (statPendingDealsCount) statPendingDealsCount.innerText = '0';
    if (statPendingDealsSize) statPendingDealsSize.innerText = '0.00 Cent';
    if (statPendingDealsAdvance) statPendingDealsAdvance.innerText = '₹0';
    pendingDealsContainer.className = 'records-container empty-state';
    pendingDealsContainer.innerHTML = `
      <div class="empty-state-message">
        <div class="empty-illustration">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
        <h3>Authentication Required</h3>
        <p>Please Sign In to view and track your unregistered land purchase deals.</p>
        <button type="button" class="btn btn-primary btn-sm" onclick="openAuthModal()" style="margin-top: 12px; height: 36px; padding: 0 16px;">
          Sign In Now
        </button>
      </div>
    `;
    return;
  }

  let filtered = [...state.pendingDeals];

  if (state.pendingDealsStatusFilter && state.pendingDealsStatusFilter !== 'all') {
    filtered = filtered.filter(d => (d.dealStatus || 'agreement_executed') === state.pendingDealsStatusFilter);
  }

  if (state.pendingDealsSearchQuery) {
    const q = state.pendingDealsSearchQuery.toLowerCase();
    filtered = filtered.filter(d => {
      const sellersStr = (Array.isArray(d.sellerName) ? d.sellerName.join(' ') : (d.sellerName || '')).toLowerCase();
      const buyersStr = (Array.isArray(d.buyerName) ? d.buyerName.join(' ') : (d.buyerName || '')).toLowerCase();
      const surveyStr = (d.surveyNumber || '').toLowerCase();
      const villageStr = (d.village || '').toLowerCase();
      const notesStr = (d.notes || '').toLowerCase();
      return sellersStr.includes(q) || buyersStr.includes(q) || surveyStr.includes(q) || villageStr.includes(q) || notesStr.includes(q);
    });
  }

  // Dashboard Stats
  let totalCents = 0;
  let totalAdvance = 0;
  filtered.forEach(d => {
    if (d.landSize && d.landSize.value) {
      totalCents += convertUnits(d.landSize.value, d.landSize.unit).cents;
    }
    totalAdvance += (d.advancePaid || 0);
  });

  if (pendingDealsCountTitle) pendingDealsCountTitle.innerText = `Deals Made & Purchases Pending Registration (${filtered.length})`;
  if (statPendingDealsCount) statPendingDealsCount.innerText = filtered.length;
  if (statPendingDealsSize) statPendingDealsSize.innerText = formatSizeDisplay(totalCents, 'cent');
  if (statPendingDealsAdvance) statPendingDealsAdvance.innerText = `₹${totalAdvance.toLocaleString('en-IN')}`;

  if (filtered.length === 0) {
    pendingDealsContainer.className = 'records-container empty-state';
    pendingDealsContainer.innerHTML = `
      <div class="empty-state-message">
        <div class="empty-illustration">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/></svg>
        </div>
        <h3>No Unregistered Land Deals Found</h3>
        <p>You can add deals made for purchasing land before official deed registration using the <strong>"+ Add Unregistered Purchase Deal"</strong> button.</p>
      </div>
    `;
    return;
  }

  const statusBadges = {
    advance_paid: '<span class="status-badge status-pending" style="background: rgba(245, 158, 11, 0.15); color: #d97706;">ADVANCE TOKEN PAID</span>',
    agreement_executed: '<span class="status-badge status-transferred" style="background: rgba(59, 130, 246, 0.15); color: #2563eb;">SALE AGREEMENT EXECUTED</span>',
    pending_registration: '<span class="status-badge status-transferred" style="background: rgba(139, 92, 246, 0.15); color: #7c3aed;">REGISTRATION PENDING</span>',
    scheduled: '<span class="status-badge status-transferred" style="background: rgba(16, 185, 129, 0.15); color: #059669;">REGISTRATION SCHEDULED</span>'
  };

  const typeLabels = { wet: 'Wet (Nanjai)', dry: 'Dry (Punjai)', residential: 'Resi (Manai)', commercial: 'Commercial', well: 'Well (Kenaru)' };

  pendingDealsContainer.className = 'records-container';
  pendingDealsContainer.innerHTML = filtered.map(deal => {
    const sellersText = Array.isArray(deal.sellerName) ? deal.sellerName.join(', ') : (deal.sellerName || 'N/A');
    const buyersText = Array.isArray(deal.buyerName) ? deal.buyerName.join(', ') : (deal.buyerName || 'N/A');
    const sizeVal = deal.landSize ? deal.landSize.value : 0;
    const sizeUnit = deal.landSize ? deal.landSize.unit : 'cent';
    const sizeCents = convertUnits(sizeVal, sizeUnit).cents;
    const sizeDisplay = formatSizeDisplay(sizeCents, 'cent');
    const ltLabel = typeLabels[deal.landType || 'dry'] || 'Dry';
    const hasAgreement = deal.attachments && deal.attachments.agreement && isValidFileUrl(deal.attachments.agreement.fileUrl);

    return `
      <div class="record-card" style="border-left: 5px solid #d97706;">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
          <div>
            <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Survey No / Subdivision</div>
            <h3 style="font-size: 1.2rem; font-family: var(--font-heading); color: var(--text-primary); margin: 2px 0 0 0;">
              Survey ${escapeHtml(deal.surveyNumber)}${deal.subDivision ? '/' + escapeHtml(deal.subDivision) : ''}
            </h3>
          </div>
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
            ${statusBadges[deal.dealStatus] || statusBadges.agreement_executed}
            <span class="type-tag ${deal.landType || 'dry'}" style="font-size: 0.68rem; padding: 2px 6px;">${ltLabel}</span>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.88rem; background: var(--bg-card); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); margin-bottom: 12px;">
          <div>
            <span style="color: var(--text-muted);">Seller / Vendor:</span>
            <strong>${escapeHtml(sellersText)}</strong>
          </div>
          <div>
            <span style="color: var(--text-muted);">Purchaser / Buyer:</span>
            <strong>${escapeHtml(buyersText)}</strong>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px dashed var(--border-color); padding-top: 6px; margin-top: 2px;">
            <span style="color: var(--text-muted);">Agreed Land Size:</span>
            <strong style="font-size: 1rem; color: var(--primary);">${sizeDisplay}</strong>
          </div>
          ${deal.totalPrice || deal.advancePaid ? `
            <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: var(--radius-xs); padding: 6px 10px; margin-top: 2px;">
              <span style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">PRICE & ADVANCE:</span>
              <span style="font-weight: 800; font-size: 0.88rem; color: #d97706;">
                ₹${(deal.advancePaid || 0).toLocaleString('en-IN')} Paid ${deal.totalPrice ? `/ ₹${deal.totalPrice.toLocaleString('en-IN')} Total` : ''}
              </span>
            </div>
          ` : ''}
          ${deal.agreementDate || deal.targetRegistrationDate ? `
            <div style="font-size: 0.78rem; color: var(--text-muted); display: flex; gap: 12px; flex-wrap: wrap; margin-top: 2px;">
              ${deal.agreementDate ? `<span>Agreement: <strong>${new Date(deal.agreementDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></span>` : ''}
              ${deal.targetRegistrationDate ? `<span>Target Registry: <strong>${new Date(deal.targetRegistrationDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></span>` : ''}
            </div>
          ` : ''}
        </div>

        ${hasAgreement ? `
          <div style="margin-bottom: 12px;">
            <a href="${deal.attachments.agreement.fileUrl}" target="_blank" class="attachment-chip" onclick="event.stopPropagation();" title="${deal.attachments.agreement.fileName || 'View Agreement Copy'}">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Sale Agreement / Token Copy
            </a>
          </div>
        ` : ''}

        ${deal.notes ? `
          <div style="font-size: 0.82rem; color: var(--text-secondary); font-style: italic; margin-bottom: 12px; background: rgba(0,0,0,0.1); padding: 8px 10px; border-radius: var(--radius-xs);">
            "${escapeHtml(deal.notes)}"
          </div>
        ` : ''}

        <div class="card-footer" style="display: flex; justify-content: space-between; align-items: center; gap: 8px; border-top: 1px solid var(--border-color); padding-top: 10px;">
          <button type="button" class="btn btn-outline-dashed btn-sm" onclick='convertPendingDealToRecord(${JSON.stringify(deal).replace(/'/g, "&apos;")})' style="color: var(--primary); font-weight: 600; font-size: 0.75rem;">
            Convert to Registered Record →
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick='openPendingDealDrawer(${JSON.stringify(deal).replace(/'/g, "&apos;")})' style="font-size: 0.75rem;">
            Edit Deal
          </button>
        </div>
      </div>
    `;
  }).join('');
}

if (pendingDealForm) {
  pendingDealForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('pendingDealId').value;
    const dealStatus = document.getElementById('dealStatus').value;
    const landType = document.getElementById('pendingDealLandType').value;
    const surveyNumber = document.getElementById('pendingSurveyNumber').value.trim();
    const subDivision = document.getElementById('pendingSubDivision').value.trim();
    const pattaNumber = document.getElementById('pendingPattaNumber').value.trim();
    const sizeVal = parseFloat(document.getElementById('pendingSizeValue').value);
    const sizeUnit = document.getElementById('pendingSizeUnit').value;
    const agreementDate = document.getElementById('agreementDate').value;
    const targetRegistrationDate = document.getElementById('targetRegistrationDate').value;
    const totalPrice = parseFloat(document.getElementById('totalPrice').value) || 0;
    const advancePaid = parseFloat(document.getElementById('advancePaid').value) || 0;
    const district = document.getElementById('pendingDistrict').value.trim();
    const sro = document.getElementById('pendingSro').value.trim();
    const village = document.getElementById('pendingVillage').value.trim();
    const notes = document.getElementById('pendingNotes').value.trim();

    const sellerName = [];
    pendingSellersContainer.querySelectorAll('.pending-seller-name-input').forEach(i => {
      if (i.value.trim()) sellerName.push(i.value.trim());
    });

    const buyerName = [];
    pendingBuyersContainer.querySelectorAll('.pending-buyer-name-input').forEach(i => {
      if (i.value.trim()) buyerName.push(i.value.trim());
    });

    if (sellerName.length === 0 || buyerName.length === 0 || !surveyNumber || isNaN(sizeVal) || sizeVal <= 0) {
      showToast('Please fill all required fields: Seller, Buyer, Survey Number, and Land Size.', 'error');
      return;
    }

    let agreementAttachment = tempPendingAgreement;
    if (state.supabaseClient && tempPendingAgreement && tempPendingAgreement.fileObj) {
      const uploaded = await uploadFileToSupabase({
        name: tempPendingAgreement.fileName,
        base64: tempPendingAgreement.fileUrl
      }, `agreement_${surveyNumber}`);
      if (uploaded) agreementAttachment = uploaded;
    }

    const payload = {
      seller_name: sellerName,
      buyer_name: buyerName,
      survey_number: surveyNumber,
      sub_division: subDivision,
      patta_number: pattaNumber,
      land_type: landType,
      land_size: { value: sizeVal, unit: sizeUnit },
      deal_status: dealStatus,
      agreement_date: agreementDate || null,
      target_registration_date: targetRegistrationDate || null,
      total_price: totalPrice,
      advance_paid: advancePaid,
      district,
      sro,
      village,
      notes,
      attachments: { agreement: agreementAttachment },
      updated_at: new Date().toISOString()
    };

    if (state.supabaseClient && state.currentUser) {
      try {
        payload.user_email = state.currentUser.email;

        if (id) {
          const { error } = await state.supabaseClient
            .from('pending_land_deals')
            .update(payload)
            .eq('id', id);

          if (error) throw error;
          showToast('Pending land deal updated successfully!', 'success');
        } else {
          payload.created_at = new Date().toISOString();
          const { error } = await state.supabaseClient
            .from('pending_land_deals')
            .insert([payload]);

          if (error) throw error;
          showToast('Unregistered land purchase deal saved to Supabase!', 'success');
        }

        closePendingDealDrawer();
        await fetchPendingDeals();
        return;
      } catch (err) {
        console.error('Error saving pending deal to Supabase:', err);
      }
    }

    // Express API fallback
    try {
      const url = id ? `/api/pending-deals/${id}` : '/api/pending-deals';
      const method = id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerName, buyerName, surveyNumber, subDivision, pattaNumber, landType,
          landSize: { value: sizeVal, unit: sizeUnit }, dealStatus, agreementDate,
          targetRegistrationDate, totalPrice, advancePaid, district, sro, village, notes,
          attachments: { agreement: agreementAttachment }
        })
      });

      if (!res.ok) throw new Error('API save failed');
      showToast(id ? 'Deal updated successfully!' : 'Unregistered deal saved successfully!', 'success');
      closePendingDealDrawer();
      await fetchPendingDeals();
    } catch (e) {
      console.error('Error saving deal via API:', e);
      showToast('Failed to save deal.', 'error');
    }
  });
}

if (deletePendingDealBtn) {
  deletePendingDealBtn.addEventListener('click', async () => {
    const id = document.getElementById('pendingDealId').value;
    if (!id) return;

    if (!confirm('Are you sure you want to delete this unregistered purchase deal?')) return;

    if (state.supabaseClient && state.currentUser) {
      try {
        const { error } = await state.supabaseClient
          .from('pending_land_deals')
          .update({ is_deleted: true, updated_at: new Date().toISOString() })
          .eq('id', id);

        if (error) throw error;
        showToast('Pending deal deleted.', 'success');
        closePendingDealDrawer();
        await fetchPendingDeals();
        return;
      } catch (err) {
        console.error('Error deleting pending deal:', err);
      }
    }

    try {
      await fetch(`/api/pending-deals/${id}`, { method: 'DELETE' });
      showToast('Pending deal deleted.', 'success');
      closePendingDealDrawer();
      await fetchPendingDeals();
    } catch (e) {
      showToast('Failed to delete pending deal.', 'error');
    }
  });
}

// -------------------------------------------------------------
// Whole Survey Numbers & Sub-divisions Registry Manager
// -------------------------------------------------------------
async function fetchMasterSurveys() {
  if (!state.currentUser) {
    state.masterSurveys = [];
    renderMasterSurveysView();
    return;
  }

  if (state.supabaseClient) {
    try {
      const { data, error } = await state.supabaseClient
        .from('master_survey_records')
        .select('*')
        .eq('user_email', state.currentUser.email)
        .order('created_at', { ascending: false });

      if (error) throw error;

      state.masterSurveys = (data || []).map(s => ({
        id: s.id,
        surveyNumber: s.survey_number,
        subDivisions: typeof s.sub_divisions === 'string' ? JSON.parse(s.sub_divisions) : (s.sub_divisions || []),
        village: s.village || '',
        notes: s.notes || '',
        createdAt: s.created_at,
        updatedAt: s.updated_at
      }));

      renderMasterSurveysView();
      return;
    } catch (err) {
      console.error('Error fetching master surveys from Supabase:', err);
    }
  }

  // Local REST API Fallback
  try {
    const res = await fetch('/api/master-surveys');
    if (res.ok) {
      state.masterSurveys = await res.json();
    }
  } catch (e) {
    console.error('Error fetching master surveys local:', e);
  }
  renderMasterSurveysView();
}

function checkSubDivisionStatus(surveyNum, subDivName) {
  const normSurvey = (surveyNum || '').trim().toLowerCase();
  const normSub = (subDivName || '').trim().toLowerCase();

  // 1. Check in My Land Records
  let foundInMyLands = false;
  let matchedMyRecord = null;
  let totalMyCents = 0;
  const ownerNamesSet = new Set();

  for (const r of state.records) {
    if (Array.isArray(r.pattas)) {
      for (const p of r.pattas) {
        if (Array.isArray(p.parcels)) {
          for (const parcel of p.parcels) {
            const pSurvey = (parcel.surveyNumber || '').trim().toLowerCase();
            const pSub = (parcel.subDivision || '').trim().toLowerCase();
            if (pSurvey === normSurvey && (pSub === normSub || (pSurvey + '/' + pSub) === normSurvey + '/' + normSub)) {
              foundInMyLands = true;
              matchedMyRecord = r;
              if (parcel.landSize && parcel.landSize.value) {
                totalMyCents += convertUnits(parcel.landSize.value, parcel.landSize.unit).cents;
              }
              if (Array.isArray(r.documentOwnerName)) {
                r.documentOwnerName.forEach(n => n && ownerNamesSet.add(n.trim()));
              }
              if (Array.isArray(p.pattaNames)) {
                p.pattaNames.forEach(n => n && ownerNamesSet.add(n.trim()));
              }
            }
          }
        }
      }
    } else {
      const rSurvey = (r.surveyNumber || '').trim().toLowerCase();
      const rSub = (r.subDivision || '').trim().toLowerCase();
      if (rSurvey === normSurvey && (rSub === normSub || (rSurvey + '/' + rSub) === normSurvey + '/' + normSub)) {
        foundInMyLands = true;
        matchedMyRecord = r;
        if (r.landSize && r.landSize.value) {
          totalMyCents += convertUnits(r.landSize.value, r.landSize.unit).cents;
        }
        if (Array.isArray(r.documentOwnerName)) {
          r.documentOwnerName.forEach(n => n && ownerNamesSet.add(n.trim()));
        }
      }
    }
  }

  if (foundInMyLands) {
    return {
      status: 'my_lands',
      record: matchedMyRecord,
      recordedCents: totalMyCents,
      ownerNames: Array.from(ownerNamesSet)
    };
  }

  // 2. Check in Deals Made (Pending Registry)
  let foundInDeals = false;
  let matchedDeal = null;
  let totalDealCents = 0;
  const dealPartySet = new Set();

  for (const deal of (state.pendingDeals || [])) {
    const dSurvey = (deal.surveyNumber || '').trim().toLowerCase();
    const dSub = (deal.subDivision || '').trim().toLowerCase();
    if (dSurvey === normSurvey && (dSub === normSub || (dSurvey + '/' + dSub) === normSurvey + '/' + normSub)) {
      foundInDeals = true;
      matchedDeal = deal;
      if (deal.landSize && deal.landSize.value) {
        totalDealCents += convertUnits(deal.landSize.value, deal.landSize.unit).cents;
      }
      if (deal.buyerName) dealPartySet.add(`Buyer: ${deal.buyerName}`);
      if (deal.sellerName) dealPartySet.add(`Seller: ${deal.sellerName}`);
    }
  }

  if (foundInDeals) {
    return {
      status: 'pending_deals',
      record: matchedDeal,
      recordedCents: totalDealCents,
      ownerNames: Array.from(dealPartySet)
    };
  }

  // 3. Check in Nearby Land Records
  let foundInNearby = false;
  let matchedNearbyRecord = null;
  let totalNearbyCents = 0;
  const nearbyOwnersSet = new Set();

  for (const nr of state.nearbyRecords) {
    const nSurvey = (nr.surveyNumber || '').trim().toLowerCase();
    const nSub = (nr.subDivision || '').trim().toLowerCase();
    if (nSurvey === normSurvey && (nSub === normSub || (nSurvey + '/' + nSub) === normSurvey + '/' + normSub)) {
      foundInNearby = true;
      matchedNearbyRecord = nr;
      if (nr.landSize && nr.landSize.value) {
        totalNearbyCents += convertUnits(nr.landSize.value, nr.landSize.unit).cents;
      }
      if (Array.isArray(nr.pattaNames)) {
        nr.pattaNames.forEach(n => n && nearbyOwnersSet.add(n.trim()));
      }
    }
  }

  if (foundInNearby) {
    return {
      status: 'nearby_lands',
      record: matchedNearbyRecord,
      recordedCents: totalNearbyCents,
      ownerNames: Array.from(nearbyOwnersSet)
    };
  }

  return { status: 'pending', recordedCents: 0, ownerNames: [] };
}

function extractSubDivisions(ms) {
  if (!ms) return [];
  const raw = Array.isArray(ms.subDivisions) ? ms.subDivisions : [];
  const result = [];

  raw.forEach(item => {
    if (typeof item === 'string') {
      if (item.includes(',')) {
        const parts = item.split(',').map(s => s.trim()).filter(Boolean);
        parts.forEach(p => {
          if (!result.some(r => r.subDivision === p)) {
            result.push({ subDivision: p, landSize: { value: 0, unit: 'cent' } });
          }
        });
      } else if (item.trim() && !result.some(r => r.subDivision === item.trim())) {
        result.push({ subDivision: item.trim(), landSize: { value: 0, unit: 'cent' } });
      }
    } else if (item && typeof item === 'object') {
      const name = (item.subDivision || item.name || '').trim();
      const val = parseFloat(item.landSize ? item.landSize.value : (item.size || 0)) || 0;
      const unit = (item.landSize ? item.landSize.unit : (item.unit || 'cent')) || 'cent';

      if (name.includes(',')) {
        const parts = name.split(',').map(s => s.trim()).filter(Boolean);
        parts.forEach(p => {
          if (!result.some(r => r.subDivision === p)) {
            result.push({ subDivision: p, landSize: { value: val, unit: unit } });
          }
        });
      } else if (name && !result.some(r => r.subDivision === name)) {
        result.push({ subDivision: name, landSize: { value: val, unit: unit } });
      }
    }
  });

  return result;
}

function renderMasterSurveysView() {
  if (!masterSurveysContainer) return;

  let totalSubDivs = 0;
  let totalPendingSubDivs = 0;

  state.masterSurveys.forEach(ms => {
    const subDivs = extractSubDivisions(ms);
    totalSubDivs += subDivs.length;
    subDivs.forEach(sd => {
      const stat = checkSubDivisionStatus(ms.surveyNumber, sd.subDivision);
      if (stat.status === 'pending') totalPendingSubDivs++;
    });
  });

  if (statMasterSurveysCount) statMasterSurveysCount.innerText = state.masterSurveys.length;
  if (statMasterSubDivsCount) statMasterSubDivsCount.innerText = totalSubDivs;
  if (statPendingHighlightCount) statPendingHighlightCount.innerText = totalPendingSubDivs;

  const q = (state.masterSurveySearchQuery || '').toLowerCase();
  const filter = state.masterSurveyFilterStatus || 'all';

  const filteredSurveys = state.masterSurveys.filter(ms => {
    const sNum = (ms.surveyNumber || '').toLowerCase();
    const village = (ms.village || '').toLowerCase();
    const subDivs = extractSubDivisions(ms);

    const matchesSearch = !q || sNum.includes(q) || village.includes(q) || subDivs.some(sd => {
      return sd.subDivision.toLowerCase().includes(q);
    });

    if (!matchesSearch) return false;

    if (filter === 'pending') {
      return subDivs.some(sd => {
        return checkSubDivisionStatus(ms.surveyNumber, sd.subDivision).status === 'pending';
      });
    } else if (filter === 'my_lands') {
      return subDivs.some(sd => {
        return checkSubDivisionStatus(ms.surveyNumber, sd.subDivision).status === 'my_lands';
      });
    } else if (filter === 'pending_deals') {
      return subDivs.some(sd => {
        return checkSubDivisionStatus(ms.surveyNumber, sd.subDivision).status === 'pending_deals';
      });
    } else if (filter === 'nearby_lands') {
      return subDivs.some(sd => {
        return checkSubDivisionStatus(ms.surveyNumber, sd.subDivision).status === 'nearby_lands';
      });
    }

    return true;
  });

  if (masterSurveysCountTitle) masterSurveysCountTitle.innerText = `Whole Survey Numbers (${filteredSurveys.length})`;

  if (filteredSurveys.length === 0) {
    masterSurveysContainer.className = 'records-container empty-state';
    masterSurveysContainer.innerHTML = `
      <div class="empty-state-message">
        <div class="empty-illustration">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
        </div>
        <h3>No Master Whole Surveys Registered</h3>
        <p>Click 'Add Whole Survey & Sub-divisions' to record master survey numbers and track missing sub-divisions.</p>
      </div>
    `;
    return;
  }

  masterSurveysContainer.className = 'records-container';
  masterSurveysContainer.innerHTML = '';

  filteredSurveys.forEach(ms => {
    const card = document.createElement('div');
    card.className = 'land-card';
    card.style.borderLeft = '4px solid var(--primary)';

    const subDivs = extractSubDivisions(ms);

    let totalMasterCents = 0;
    subDivs.forEach(sd => {
      if (sd.landSize && sd.landSize.value > 0) {
        totalMasterCents += convertUnits(sd.landSize.value, sd.landSize.unit).cents;
      }
    });

    const formatDualSize = (cents) => {
      if (!cents || cents <= 0) return '';
      const primaryStr = formatSizeDisplay(getDisplayValue({ value: cents, unit: 'cent' }, state.displayUnit), state.displayUnit);
      if (state.displayUnit === 'are') return primaryStr;
      const areStr = formatSizeDisplay(getDisplayValue({ value: cents, unit: 'cent' }, 'are'), 'are');
      return `${primaryStr} (${areStr})`;
    };

    const masterTotalStr = totalMasterCents > 0 ? formatDualSize(totalMasterCents) : '';

    let pendingCountInSurvey = 0;
    const subDivsHtml = subDivs.map(sd => {
      const subName = sd.subDivision;
      const masterCents = sd.landSize && sd.landSize.value > 0 ? convertUnits(sd.landSize.value, sd.landSize.unit).cents : 0;
      const masterSizeStr = masterCents > 0 ? formatDualSize(masterCents) : '';

      const matchRes = checkSubDivisionStatus(ms.surveyNumber, subName);

      if (matchRes.status === 'pending') {
        pendingCountInSurvey++;
        return `
          <div class="sub-div-pill pending-highlight" style="background: rgba(245, 158, 11, 0.08); border: 1.5px solid rgba(245, 158, 11, 0.45); box-shadow: 0 0 8px rgba(245, 158, 11, 0.1); padding: 10px 14px; border-radius: var(--radius-sm); display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-weight: 700; font-size: 0.95rem; color: #d97706; font-family: var(--font-heading);">
                  Sub-div <strong>${escapeHtml(subName)}</strong>
                  ${masterSizeStr ? `<span style="font-size: 0.82rem; color: #d97706; font-weight: 700; margin-left: 6px;">(${masterSizeStr})</span>` : ''}
                </span>
                <span class="type-tag" style="background: rgba(245, 158, 11, 0.2); color: #d97706; font-size: 0.7rem; font-weight: 700; padding: 2px 6px;">⚠️ Pending Entry</span>
              </div>
              <div style="display: flex; gap: 6px; align-items: center;">
                <button type="button" class="btn btn-outline btn-sm quick-add-mylands-btn" data-survey="${escapeHtml(ms.surveyNumber)}" data-subdiv="${escapeHtml(subName)}" style="font-size: 0.7rem; padding: 3px 8px; border-color: rgba(245, 158, 11, 0.5); color: #d97706; height: 26px; font-weight: 600;">
                  + Add to My Lands
                </button>
                <button type="button" class="btn btn-outline btn-sm quick-add-nearby-btn" data-survey="${escapeHtml(ms.surveyNumber)}" data-subdiv="${escapeHtml(subName)}" style="font-size: 0.7rem; padding: 3px 8px; height: 26px;">
                  + Add to Nearby
                </button>
              </div>
            </div>
          </div>
        `;
      } else if (matchRes.status === 'my_lands') {
        const docNo = matchRes.record ? matchRes.record.documentNumber : '';
        const recCents = matchRes.recordedCents || 0;
        const recSizeStr = recCents > 0 ? formatDualSize(recCents) : '';
        const ownerNamesStr = matchRes.ownerNames && matchRes.ownerNames.length > 0 ? matchRes.ownerNames.join(', ') : '';
        const balanceCents = masterCents > 0 ? (masterCents - recCents) : 0;
        const hasBalance = masterCents > 0 && balanceCents > 0.01;
        const balanceSizeStr = hasBalance ? formatDualSize(balanceCents) : '';

        return `
          <div class="sub-div-pill recorded-my-lands" style="background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.3); padding: 10px 14px; border-radius: var(--radius-sm); display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
              <span style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">
                Sub-div <strong>${escapeHtml(subName)}</strong>
                ${masterSizeStr ? `<span style="font-size: 0.8rem; color: var(--primary); font-weight: 600; margin-left: 6px;">(${masterSizeStr})</span>` : ''}
              </span>
              <span class="type-tag wet" style="font-size: 0.72rem; padding: 2px 8px;">✓ Recorded in My Lands ${docNo ? `(Doc ${docNo})` : ''}</span>
            </div>
            <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; font-size: 0.78rem; color: var(--text-secondary); gap: 8px; border-top: 1px dashed rgba(255,255,255,0.05); padding-top: 6px;">
              ${ownerNamesStr ? `<span><strong>Owner(s):</strong> <span class="owner-chip doc-owner-chip" style="font-size: 0.7rem;">${escapeHtml(ownerNamesStr)}</span></span>` : ''}
              ${recSizeStr ? `<span><strong>My Land Size:</strong> <span style="color: var(--success); font-weight: 700;">${recSizeStr}</span></span>` : ''}
              ${hasBalance ? `
                <span style="background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); color: #d97706; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 0.72rem;">
                  ⚠️ Balance Remaining: ${balanceSizeStr}
                </span>
              ` : ''}
            </div>
          </div>
        `;
      } else if (matchRes.status === 'pending_deals') {
        const deal = matchRes.record;
        const dealStatusLabel = {
          advance_paid: 'Advance Paid',
          agreement_executed: 'Agreement Executed',
          pending_registration: 'Registration Pending',
          scheduled: 'Registration Scheduled'
        }[deal ? deal.dealStatus : ''] || 'Deal Made';

        const recCents = matchRes.recordedCents || 0;
        const recSizeStr = recCents > 0 ? formatDualSize(recCents) : '';
        const ownerNamesStr = matchRes.ownerNames && matchRes.ownerNames.length > 0 ? matchRes.ownerNames.join(', ') : '';
        const balanceCents = masterCents > 0 ? (masterCents - recCents) : 0;
        const hasBalance = masterCents > 0 && balanceCents > 0.01;
        const balanceSizeStr = hasBalance ? formatDualSize(balanceCents) : '';

        return `
          <div class="sub-div-pill recorded-pending-deal" style="background: rgba(14, 165, 233, 0.06); border: 1px solid rgba(14, 165, 233, 0.35); padding: 10px 14px; border-radius: var(--radius-sm); display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
              <span style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">
                Sub-div <strong>${escapeHtml(subName)}</strong>
                ${masterSizeStr ? `<span style="font-size: 0.8rem; color: var(--primary); font-weight: 600; margin-left: 6px;">(${masterSizeStr})</span>` : ''}
              </span>
              <span class="type-tag" style="background: rgba(14, 165, 233, 0.2); color: #0284c7; font-size: 0.72rem; padding: 2px 8px; font-weight: 700;">📝 Deal Made (${dealStatusLabel})</span>
            </div>
            <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; font-size: 0.78rem; color: var(--text-secondary); gap: 8px; border-top: 1px dashed rgba(255,255,255,0.05); padding-top: 6px;">
              ${ownerNamesStr ? `<span><strong>Parties:</strong> <span class="owner-chip" style="font-size: 0.7rem; background: rgba(14, 165, 233, 0.15); color: #0284c7;">${escapeHtml(ownerNamesStr)}</span></span>` : ''}
              ${recSizeStr ? `<span><strong>Deal Size:</strong> <span style="color: #0284c7; font-weight: 700;">${recSizeStr}</span></span>` : ''}
              ${hasBalance ? `
                <span style="background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); color: #d97706; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 0.72rem;">
                  ⚠️ Balance Remaining: ${balanceSizeStr}
                </span>
              ` : ''}
            </div>
          </div>
        `;
      } else {
        const recCents = matchRes.recordedCents || 0;
        const recSizeStr = recCents > 0 ? formatDualSize(recCents) : '';
        const ownerNamesStr = matchRes.ownerNames && matchRes.ownerNames.length > 0 ? matchRes.ownerNames.join(', ') : '';
        const balanceCents = masterCents > 0 ? (masterCents - recCents) : 0;
        const hasBalance = masterCents > 0 && balanceCents > 0.01;
        const balanceSizeStr = hasBalance ? formatDualSize(balanceCents) : '';

        return `
          <div class="sub-div-pill recorded-nearby-lands" style="background: rgba(99, 102, 241, 0.05); border: 1px solid rgba(99, 102, 241, 0.3); padding: 10px 14px; border-radius: var(--radius-sm); display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
              <span style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">
                Sub-div <strong>${escapeHtml(subName)}</strong>
                ${masterSizeStr ? `<span style="font-size: 0.8rem; color: var(--primary); font-weight: 600; margin-left: 6px;">(${masterSizeStr})</span>` : ''}
              </span>
              <span class="type-tag commercial" style="font-size: 0.72rem; padding: 2px 8px;">✓ Recorded in Nearby Lands</span>
            </div>
            <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; font-size: 0.78rem; color: var(--text-secondary); gap: 8px; border-top: 1px dashed rgba(255,255,255,0.05); padding-top: 6px;">
              ${ownerNamesStr ? `<span><strong>Patta Owner(s):</strong> <span class="owner-chip" style="font-size: 0.7rem;">${escapeHtml(ownerNamesStr)}</span></span>` : ''}
              ${recSizeStr ? `<span><strong>Nearby Size:</strong> <span style="color: var(--primary); font-weight: 700;">${recSizeStr}</span></span>` : ''}
              ${hasBalance ? `
                <span style="background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); color: #d97706; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 0.72rem;">
                  ⚠️ Balance Remaining: ${balanceSizeStr}
                </span>
              ` : ''}
            </div>
          </div>
        `;
      }
    }).join('');

    card.innerHTML = `
      <div class="card-top">
        <div class="survey-tag">
          <span class="number" style="color: var(--primary);">Survey No: ${escapeHtml(ms.surveyNumber)}</span>
          <span class="label">${ms.village ? 'Village: ' + escapeHtml(ms.village) : 'Whole Survey Record'}</span>
        </div>
        <div class="card-tags">
          ${pendingCountInSurvey > 0 ? `
            <span class="type-tag" style="background: rgba(245, 158, 11, 0.2); color: #d97706; font-weight: 700; font-size: 0.72rem; padding: 3px 8px;">
              ⚠️ ${pendingCountInSurvey} Sub-division(s) Unentered
            </span>
          ` : `
            <span class="type-tag wet" style="font-size: 0.72rem; padding: 3px 8px;">
              ✓ All Sub-divisions Recorded
            </span>
          `}
          <button type="button" class="btn btn-outline btn-sm edit-master-survey-trigger" data-id="${ms.id}" style="padding: 2px 8px; font-size: 0.72rem; height: 24px;">
            Edit Master
          </button>
        </div>
      </div>

      <div class="form-group" style="margin-top: 12px;">
        <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em;">
          Sub-divisions (${subDivs.length} total ${masterTotalStr ? `| Total Area: ${masterTotalStr}` : ''})
        </label>
        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 6px;">
          ${subDivsHtml || '<span style="font-size: 0.8rem; color: var(--text-muted); font-style: italic;">No sub-divisions registered.</span>'}
        </div>
      </div>

      ${ms.notes ? `
        <div style="font-size: 0.8rem; color: var(--text-muted); border-top: 1px dashed rgba(255,255,255,0.05); padding-top: 8px; margin-top: 6px;">
          <strong>Notes:</strong> ${escapeHtml(ms.notes)}
        </div>
      ` : ''}
    `;

    const editBtn = card.querySelector('.edit-master-survey-trigger');
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openMasterSurveyModal(ms);
      });
    }

    card.querySelectorAll('.quick-add-mylands-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const survey = btn.dataset.survey;
        const subdiv = btn.dataset.subdiv;
        openDrawer(null);
        setTimeout(() => {
          if (pattasContainer) {
            const pattaBlock = pattasContainer.querySelector('.patta-block');
            if (pattaBlock) {
              const surveyInp = pattaBlock.querySelector('.parcel-survey-input');
              const subInp = pattaBlock.querySelector('.parcel-subdiv-input');
              if (surveyInp) surveyInp.value = survey;
              if (subInp) subInp.value = subdiv;
            }
          }
        }, 120);
      });
    });

    card.querySelectorAll('.quick-add-nearby-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const survey = btn.dataset.survey;
        const subdiv = btn.dataset.subdiv;
        openNearbyDrawer(null);
        setTimeout(() => {
          const sInp = document.getElementById('nearbySurveyNumber');
          const subInp = document.getElementById('nearbySubDivision');
          if (sInp) sInp.value = survey;
          if (subInp) subInp.value = subdiv;
        }, 120);
      });
    });

    masterSurveysContainer.appendChild(card);
  });
}

function openMasterSurveyModal(record = null) {
  if (!masterSurveyModal || !masterSurveyOverlay) return;

  document.getElementById('masterSurveyRecordId').value = record ? record.id : '';
  document.getElementById('masterSurveyModalTitle').innerText = record ? 'Edit Whole Survey Number & Sub-divisions' : 'Add Whole Survey Number & Sub-divisions';
  document.getElementById('masterSurveyNumber').value = record ? record.surveyNumber : '';
  document.getElementById('masterVillage').value = record ? (record.village || '') : '';
  document.getElementById('masterNotes').value = record ? (record.notes || '') : '';

  if (deleteMasterSurveyBtn) {
    if (record) {
      deleteMasterSurveyBtn.classList.remove('hidden');
    } else {
      deleteMasterSurveyBtn.classList.add('hidden');
    }
  }

  if (subDivisionsContainer) {
    subDivisionsContainer.innerHTML = '';
    const subDivs = record ? extractSubDivisions(record) : [{ subDivision: '', landSize: { value: 0, unit: 'cent' } }];
    if (subDivs.length === 0) subDivs.push({ subDivision: '', landSize: { value: 0, unit: 'cent' } });
    subDivs.forEach(sd => {
      addSubDivisionRowInput(sd);
    });
  }

  masterSurveyModal.classList.add('active');
  masterSurveyOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeMasterSurveyModal() {
  if (!masterSurveyModal || !masterSurveyOverlay) return;
  masterSurveyModal.classList.remove('active');
  masterSurveyOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

function addSubDivisionRowInput(sdObj = null) {
  if (!subDivisionsContainer) return;
  const name = typeof sdObj === 'string' ? sdObj : (sdObj ? (sdObj.subDivision || sdObj.name || '') : '');
  const sizeVal = sdObj && sdObj.landSize && sdObj.landSize.value > 0 ? sdObj.landSize.value : '';
  const unit = sdObj && sdObj.landSize && sdObj.landSize.unit ? sdObj.landSize.unit : 'cent';

  const row = document.createElement('div');
  row.className = 'name-row master-subdiv-row';
  row.style.cssText = 'display: flex; gap: 8px; align-items: center; margin-bottom: 8px; flex-wrap: wrap;';
  row.innerHTML = `
    <input type="text" class="sub-division-input" placeholder="Sub-div (e.g. 31 or 1,2,3)" value="${escapeHtml(name)}" style="flex: 2; min-width: 130px;">
    <div style="display: flex; gap: 4px; flex: 1.5; min-width: 140px;">
      <input type="number" step="any" class="sub-division-size-input" placeholder="Size (e.g. 50)" value="${sizeVal}" style="width: 60%; font-size: 0.85rem; padding: 8px; background-color: var(--input-bg); border: 1px solid var(--border-color); border-radius: var(--radius-sm); color: var(--text-primary);">
      <select class="sub-division-unit-select select-input" style="width: 40%; padding: 6px 4px; font-size: 0.8rem;">
        <option value="cent" ${unit === 'cent' ? 'selected' : ''}>Cent</option>
        <option value="sqft" ${unit === 'sqft' ? 'selected' : ''}>Sq Ft</option>
        <option value="acre" ${unit === 'acre' ? 'selected' : ''}>Acre</option>
        <option value="are" ${unit === 'are' ? 'selected' : ''}>Are</option>
      </select>
    </div>
    <button type="button" class="remove-name-btn" aria-label="Remove Row">&times;</button>
  `;
  subDivisionsContainer.appendChild(row);

  const inputEl = row.querySelector('.sub-division-input');
  const removeBtn = row.querySelector('.remove-name-btn');

  const handleCommaSplit = () => {
    const rawVal = inputEl.value;
    if (rawVal.includes(',')) {
      const parts = rawVal.split(',').map(s => s.trim()).filter(Boolean);
      if (parts.length > 0) {
        inputEl.value = parts[0];
        const sVal = row.querySelector('.sub-division-size-input').value;
        const uVal = row.querySelector('.sub-division-unit-select').value;
        for (let i = 1; i < parts.length; i++) {
          addSubDivisionRowInput({ subDivision: parts[i], landSize: { value: parseFloat(sVal) || 0, unit: uVal } });
        }
      }
    }
  };

  inputEl.addEventListener('blur', handleCommaSplit);
  inputEl.addEventListener('paste', () => setTimeout(handleCommaSplit, 10));

  removeBtn.addEventListener('click', () => {
    row.remove();
  });
}

if (addMasterSurveyBtn) {
  addMasterSurveyBtn.addEventListener('click', () => openMasterSurveyModal(null));
}
if (closeMasterSurveyModalBtn) {
  closeMasterSurveyModalBtn.addEventListener('click', closeMasterSurveyModal);
}
if (cancelMasterSurveyBtn) {
  cancelMasterSurveyBtn.addEventListener('click', closeMasterSurveyModal);
}
if (masterSurveyOverlay) {
  masterSurveyOverlay.addEventListener('click', closeMasterSurveyModal);
}
if (addSubDivisionRowBtn) {
  addSubDivisionRowBtn.addEventListener('click', () => addSubDivisionRowInput(''));
}

if (masterSurveySearchInput) {
  masterSurveySearchInput.addEventListener('input', (e) => {
    state.masterSurveySearchQuery = e.target.value;
    if (clearMasterSurveySearchBtn) {
      if (state.masterSurveySearchQuery) {
        clearMasterSurveySearchBtn.classList.remove('hidden');
      } else {
        clearMasterSurveySearchBtn.classList.add('hidden');
      }
    }
    renderMasterSurveysView();
  });
}

if (clearMasterSurveySearchBtn) {
  clearMasterSurveySearchBtn.addEventListener('click', () => {
    state.masterSurveySearchQuery = '';
    masterSurveySearchInput.value = '';
    clearMasterSurveySearchBtn.classList.add('hidden');
    renderMasterSurveysView();
  });
}

if (masterSurveyFilterStatus) {
  masterSurveyFilterStatus.addEventListener('change', (e) => {
    state.masterSurveyFilterStatus = e.target.value;
    renderMasterSurveysView();
  });
}

if (masterSurveyForm) {
  masterSurveyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('masterSurveyRecordId').value;
    const surveyNumber = document.getElementById('masterSurveyNumber').value.trim();
    const village = document.getElementById('masterVillage').value.trim();
    const notes = document.getElementById('masterNotes').value.trim();

    const subDivRows = subDivisionsContainer ? subDivisionsContainer.querySelectorAll('.master-subdiv-row, .name-row') : [];
    const subDivisions = [];
    subDivRows.forEach(row => {
      const nameInp = row.querySelector('.sub-division-input');
      const sizeInp = row.querySelector('.sub-division-size-input');
      const unitSel = row.querySelector('.sub-division-unit-select');

      const nameVal = nameInp ? nameInp.value.trim() : '';
      const sizeVal = sizeInp ? (parseFloat(sizeInp.value) || 0) : 0;
      const unitVal = unitSel ? unitSel.value : 'cent';

      if (nameVal) {
        const parts = nameVal.split(',').map(s => s.trim()).filter(Boolean);
        parts.forEach(p => {
          if (!subDivisions.some(sd => sd.subDivision === p)) {
            subDivisions.push({
              subDivision: p,
              landSize: { value: sizeVal, unit: unitVal }
            });
          }
        });
      }
    });

    if (!surveyNumber) {
      showToast('Whole Survey Number is required.', 'error');
      return;
    }

    if (subDivisions.length === 0) {
      showToast('At least one sub-division is required.', 'error');
      return;
    }

    const payload = {
      user_email: state.currentUser ? state.currentUser.email : 'p.manojkumar1101@gmail.com',
      survey_number: surveyNumber,
      sub_divisions: subDivisions,
      village,
      notes,
      updated_at: new Date().toISOString()
    };

    if (state.supabaseClient && state.currentUser) {
      try {
        if (id) {
          const { error } = await state.supabaseClient
            .from('master_survey_records')
            .update(payload)
            .eq('id', id);
          if (error) throw error;
        } else {
          payload.created_at = new Date().toISOString();
          const { error } = await state.supabaseClient
            .from('master_survey_records')
            .insert([payload]);
          if (error) throw error;
        }

        showToast(id ? 'Master survey updated in Supabase!' : 'Master survey saved to Supabase!', 'success');
        closeMasterSurveyModal();
        await fetchMasterSurveys();
        return;
      } catch (err) {
        console.error('Supabase master survey save error:', err);
      }
    }

    try {
      const url = id ? `/api/master-surveys/${id}` : '/api/master-surveys';
      const method = id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyNumber,
          subDivisions,
          village,
          notes
        })
      });

      if (!res.ok) throw new Error('API save failed');
      showToast(id ? 'Master survey updated successfully!' : 'Master survey saved successfully!', 'success');
      closeMasterSurveyModal();
      await fetchMasterSurveys();
    } catch (e) {
      console.error('Error saving master survey via API:', e);
      showToast('Failed to save master survey.', 'error');
    }
  });
}

if (deleteMasterSurveyBtn) {
  deleteMasterSurveyBtn.addEventListener('click', async () => {
    const id = document.getElementById('masterSurveyRecordId').value;
    if (!id) return;

    if (!confirm('Are you sure you want to delete this master survey entry?')) return;

    if (state.supabaseClient && state.currentUser) {
      try {
        const { error } = await state.supabaseClient
          .from('master_survey_records')
          .delete()
          .eq('id', id);

        if (error) throw error;
        showToast('Master survey entry deleted.', 'success');
        closeMasterSurveyModal();
        await fetchMasterSurveys();
        return;
      } catch (err) {
        console.error('Error deleting master survey:', err);
      }
    }

    try {
      await fetch(`/api/master-surveys/${id}`, { method: 'DELETE' });
      showToast('Master survey entry deleted.', 'success');
      closeMasterSurveyModal();
      await fetchMasterSurveys();
    } catch (e) {
      showToast('Failed to delete master survey.', 'error');
    }
  });
}

