// -------------------------------------------------------------
// App State Configuration
// -------------------------------------------------------------
const state = {
  records: [],
  searchQuery: '',
  pattaFilter: 'all', // 'all' | 'transferred' | 'pending'
  landTypeFilter: 'all', // 'all' | 'wet' | 'dry' | 'residential' | 'commercial'
  nameFilter: 'all', // 'all' | '[name]'
  sortBy: 'newest', // 'newest' | 'oldest' | 'size-desc' | 'size-asc' | 'survey'
  displayUnit: 'cent' // 'cent' | 'sqft' | 'acre'
};

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
const pattaNamesContainer = document.getElementById('pattaNamesContainer');
const addNameRowBtn = document.getElementById('addNameRowBtn');

const landSizeValue = document.getElementById('landSizeValue');
const unitConversionPreview = document.getElementById('unitConversionPreview');
const convCent = document.getElementById('convCent');
const convSqft = document.getElementById('convSqft');
const convAcre = document.getElementById('convAcre');

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

// -------------------------------------------------------------
// Unit Conversion Helper Constants
// -------------------------------------------------------------
const SQFT_PER_CENT = 435.6;
const CENTS_PER_ACRE = 100;
const SQFT_PER_ACRE = 43560;

// Convert size from a baseline unit to others
function convertUnits(value, fromUnit) {
  let cents = 0;
  let sqft = 0;
  let acres = 0;
  const val = parseFloat(value);

  if (isNaN(val) || val <= 0) {
    return { cents: 0, sqft: 0, acres: 0 };
  }

  switch (fromUnit) {
    case 'cent':
      cents = val;
      sqft = val * SQFT_PER_CENT;
      acres = val / CENTS_PER_ACRE;
      break;
    case 'sqft':
      cents = val / SQFT_PER_CENT;
      sqft = val;
      acres = val / SQFT_PER_ACRE;
      break;
    case 'acre':
      cents = val * CENTS_PER_ACRE;
      sqft = val * SQFT_PER_ACRE;
      acres = val;
      break;
  }
  return { cents, sqft, acres };
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
  }
}

// Formats display sizes nicely
function formatSizeDisplay(value, unit) {
  const rounded = unit === 'sqft' ? Math.round(value) : value.toFixed(3);
  const formattedVal = Number(rounded).toLocaleString(undefined, {
    minimumFractionDigits: unit === 'sqft' ? 0 : 2,
    maximumFractionDigits: unit === 'sqft' ? 0 : 4
  });

  const labels = {
    cent: 'Cent',
    sqft: 'Sq Ft',
    acre: 'Acre'
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
// Dynamic Patta Names Management
// -------------------------------------------------------------
function addNameInputRow(value = '') {
  const row = document.createElement('div');
  row.className = 'name-row';
  row.innerHTML = `
    <input type="text" class="patta-name-input" placeholder="e.g., S. Vignesh" value="${value}">
    <button type="button" class="remove-name-btn" aria-label="Remove Owner">&times;</button>
  `;

  pattaNamesContainer.appendChild(row);

  const removeBtn = row.querySelector('.remove-name-btn');
  removeBtn.addEventListener('click', () => {
    const rows = pattaNamesContainer.querySelectorAll('.name-row');
    if (rows.length > 1) {
      row.remove();
    } else {
      showToast('At least one owner is required.', 'error');
    }
  });
}

addNameRowBtn.addEventListener('click', () => addNameInputRow());

// Initialize name row inside drawer
function resetNameInputs(names = []) {
  pattaNamesContainer.innerHTML = '';
  if (names.length === 0) {
    addNameInputRow();
  } else {
    names.forEach(name => addNameInputRow(name));
  }
}

// -------------------------------------------------------------
// Live Unit Conversions
// -------------------------------------------------------------
function handleLiveConversion() {
  const val = parseFloat(landSizeValue.value);
  const selectedUnit = document.querySelector('input[name="landSizeUnit"]:checked').value;

  if (isNaN(val) || val <= 0) {
    unitConversionPreview.classList.add('hidden');
    return;
  }

  unitConversionPreview.classList.remove('hidden');
  const results = convertUnits(val, selectedUnit);

  convCent.innerText = results.cents.toLocaleString(undefined, { maximumFractionDigits: 2 });
  convSqft.innerText = Math.round(results.sqft).toLocaleString();
  convAcre.innerText = results.acres.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

landSizeValue.addEventListener('input', handleLiveConversion);
document.querySelectorAll('input[name="landSizeUnit"]').forEach(radio => {
  radio.addEventListener('change', handleLiveConversion);
});

// -------------------------------------------------------------
// Toggle Switch State Watcher
// -------------------------------------------------------------
isPattaTransferred.addEventListener('change', () => {
  if (isPattaTransferred.checked) {
    pattaStatusDescription.innerText = 'Patta is fully transferred (Completed)';
    pattaStatusDescription.style.color = 'var(--success)';
  } else {
    pattaStatusDescription.innerText = 'Patta is not yet transferred (Pending)';
    pattaStatusDescription.style.color = 'var(--text-muted)';
  }
});

// -------------------------------------------------------------
// Drawer Controller
// -------------------------------------------------------------
function openDrawer(record = null) {
  formDrawer.classList.add('active');
  drawerOverlay.classList.add('active');
  document.body.style.overflow = 'hidden'; // Stop background scrolling

  if (record) {
    // Edit Mode
    document.getElementById('drawerTitle').innerText = 'Edit Land Record';
    document.getElementById('recordId').value = record.id;
    document.getElementById('surveyNumber').value = record.surveyNumber;
    document.getElementById('subDivision').value = record.subDivision;
    document.getElementById('pattaNumber').value = record.pattaNumber;
    document.getElementById('documentNumber').value = record.documentNumber;
    document.getElementById('purchaseDate').value = record.purchaseDate ? record.purchaseDate.split('T')[0] : '';
    document.getElementById('purchasedFrom').value = record.purchasedFrom || '';
    
    // Land Type
    landType.value = record.landType || 'dry';

    // Location
    district.value = record.district || '';
    sro.value = record.sro || '';
    village.value = record.village || '';
    
    // Land Size & Unit
    document.getElementById('landSizeValue').value = record.landSize.value;
    document.querySelector(`input[name="landSizeUnit"][value="${record.landSize.unit}"]`).checked = true;
    
    // Patta Transferred
    isPattaTransferred.checked = record.isPattaTransferred;
    isPattaTransferred.dispatchEvent(new Event('change'));

    // Dynamic names
    resetNameInputs(record.pattaNames);

    // Show delete button
    deleteRecordBtn.classList.remove('hidden');
  } else {
    // Add Mode
    document.getElementById('drawerTitle').innerText = 'Add Land Record';
    document.getElementById('recordId').value = '';
    recordForm.reset();
    landType.value = 'dry';
    district.value = '';
    sro.value = '';
    village.value = '';
    isPattaTransferred.checked = false;
    isPattaTransferred.dispatchEvent(new Event('change'));
    resetNameInputs();
    deleteRecordBtn.classList.add('hidden');
  }
  handleLiveConversion();
}

function closeDrawer() {
  formDrawer.classList.remove('active');
  drawerOverlay.classList.remove('active');
  document.body.style.overflow = ''; // Resume scrolling
  
  // Clear any validation errors
  document.querySelectorAll('.form-group.invalid').forEach(el => el.classList.remove('invalid'));
}

[addRecordBtnTop, addRecordBtnMobile, emptyStateAddBtn].forEach(btn => {
  if (btn) btn.addEventListener('click', () => openDrawer());
});

[closeDrawerBtn, cancelFormBtn, drawerOverlay].forEach(btn => {
  if (btn) btn.addEventListener('click', closeDrawer);
});

// -------------------------------------------------------------
// Form Validation & Submission
// -------------------------------------------------------------
function validateForm() {
  let isValid = true;

  // Clear errors
  document.querySelectorAll('.form-group.invalid').forEach(el => el.classList.remove('invalid'));

  // Survey number
  const survey = document.getElementById('surveyNumber');
  if (!survey.value.trim()) {
    survey.parentElement.classList.add('invalid');
    isValid = false;
  }

  // Patta number
  const patta = document.getElementById('pattaNumber');
  if (!patta.value.trim()) {
    patta.parentElement.classList.add('invalid');
    isValid = false;
  }

  // Doc number
  const doc = document.getElementById('documentNumber');
  if (!doc.value.trim()) {
    doc.parentElement.classList.add('invalid');
    isValid = false;
  }

  // Size value
  const size = document.getElementById('landSizeValue');
  const parsedSize = parseFloat(size.value);
  if (isNaN(parsedSize) || parsedSize <= 0) {
    size.parentElement.parentElement.classList.add('invalid');
    isValid = false;
  }

  // Check co-owner names
  const nameInputs = pattaNamesContainer.querySelectorAll('.patta-name-input');
  let hasName = false;
  nameInputs.forEach(input => {
    if (input.value.trim()) hasName = true;
  });

  const namesError = document.getElementById('pattaNamesError');
  if (!hasName) {
    namesError.style.display = 'block';
    isValid = false;
  } else {
    namesError.style.display = 'none';
  }

  return isValid;
}

recordForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    showToast('Please fill all required fields correctly.', 'error');
    return;
  }

  const id = document.getElementById('recordId').value;
  const surveyNumber = document.getElementById('surveyNumber').value;
  const subDivision = document.getElementById('subDivision').value;
  const pattaNumber = document.getElementById('pattaNumber').value;
  const documentNumber = document.getElementById('documentNumber').value;
  const purchaseDate = document.getElementById('purchaseDate').value;
  const purchasedFrom = document.getElementById('purchasedFrom').value;
  const landSizeValue = parseFloat(document.getElementById('landSizeValue').value);
  const landSizeUnit = document.querySelector('input[name="landSizeUnit"]:checked').value;
  const selectedLandType = landType.value;
  const districtVal = district.value;
  const sroVal = sro.value;
  const villageVal = village.value;
  
  // Gather non-empty names
  const names = [];
  pattaNamesContainer.querySelectorAll('.patta-name-input').forEach(input => {
    if (input.value.trim()) names.push(input.value.trim());
  });

  const payload = {
    surveyNumber,
    subDivision,
    pattaNumber,
    documentNumber,
    isPattaTransferred: isPattaTransferred.checked,
    pattaNames: names,
    landSize: {
      value: landSizeValue,
      unit: landSizeUnit
    },
    landType: selectedLandType,
    purchaseDate: purchaseDate || null,
    purchasedFrom,
    district: districtVal,
    sro: sroVal,
    village: villageVal
  };

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
  try {
    const response = await fetch('/api/records');
    if (!response.ok) throw new Error('Error loading records.');
    state.records = await response.json();
    populateOwnerFilter();
    updateDashboard();
    renderRecordsList();
  } catch (error) {
    console.error('Error getting records:', error);
    showToast('Could not load records from server.', 'error');
  }
}

function populateOwnerFilter() {
  const selectedValue = filterName.value || 'all';
  
  // Extract all unique present names on the patta
  const ownersSet = new Set();
  state.records.forEach(record => {
    if (Array.isArray(record.pattaNames)) {
      record.pattaNames.forEach(name => {
        if (name && name.trim()) ownersSet.add(name.trim());
      });
    }
  });

  const uniqueOwners = Array.from(ownersSet).sort((a, b) => a.localeCompare(b));

  // Reset dropdown list
  filterName.innerHTML = '<option value="all">All Owners</option>';

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
  let transferredCount = 0;

  recordsList.forEach(r => {
    // Patta transfer status counts
    if (r.isPattaTransferred) {
      transferredCount++;
    }

    // Cumulative size conversion (convert everything to cents, sqft, and acres)
    const conv = convertUnits(r.landSize.value, r.landSize.unit);
    totalCents += conv.cents;
    totalSqft += conv.sqft;
    totalAcres += conv.acres;
  });

  // Render main size display in the user's selected preference
  const viewUnitVal = state.displayUnit;
  if (viewUnitVal === 'cent') {
    statTotalSize.innerText = formatSizeDisplay(totalCents, 'cent');
    statTotalSizeSub1.innerText = formatSizeDisplay(totalAcres, 'acre');
    statTotalSizeSub2.innerText = formatSizeDisplay(totalSqft, 'sqft');
  } else if (viewUnitVal === 'sqft') {
    statTotalSize.innerText = formatSizeDisplay(totalSqft, 'sqft');
    statTotalSizeSub1.innerText = formatSizeDisplay(totalCents, 'cent');
    statTotalSizeSub2.innerText = formatSizeDisplay(totalAcres, 'acre');
  } else {
    statTotalSize.innerText = formatSizeDisplay(totalAcres, 'acre');
    statTotalSizeSub1.innerText = formatSizeDisplay(totalCents, 'cent');
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
        const matchesSurvey = record.surveyNumber.toLowerCase().includes(query) || 
                              (record.subDivision && record.subDivision.toLowerCase().includes(query));
        const matchesPatta = record.pattaNumber.toLowerCase().includes(query);
        const matchesDoc = record.documentNumber.toLowerCase().includes(query);
        const matchesSeller = record.purchasedFrom && record.purchasedFrom.toLowerCase().includes(query);
        const matchesOwners = record.pattaNames.some(name => name.toLowerCase().includes(query));

        if (!matchesSurvey && !matchesPatta && !matchesDoc && !matchesSeller && !matchesOwners) {
          return false;
        }
      }

      // 2. Patta Status Filter
      if (state.pattaFilter === 'transferred' && !record.isPattaTransferred) return false;
      if (state.pattaFilter === 'pending' && record.isPattaTransferred) return false;

      // 2b. Land Type Filter
      if (state.landTypeFilter !== 'all' && record.landType !== state.landTypeFilter) return false;

      // 2c. Owner Name Filter
      if (state.nameFilter !== 'all' && !record.pattaNames.includes(state.nameFilter)) return false;

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
  const filtered = getFilteredAndSortedRecords();
  recordsCountTitle.innerText = `Land Parcels (${filtered.length})`;
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

    // Dynamic co-owners chip list
    const ownersHtml = record.pattaNames.map(name => `<span class="owner-chip">${name}</span>`).join('');

    // Format purchase date for card
    const dateFormatted = record.purchaseDate ? new Date(record.purchaseDate).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    }) : 'N/A';

    const subdivisionText = record.subDivision ? ` / ${record.subDivision}` : '';

    const typeLabel = {
      wet: 'Wet (Nanjai)',
      dry: 'Dry (Punjai)',
      residential: 'Resi (Manai)',
      commercial: 'Commercial'
    }[record.landType || 'dry'] || 'Dry (Punjai)';

    card.innerHTML = `
      <div class="card-top">
        <div class="survey-tag">
          <span class="number">${record.surveyNumber}${subdivisionText}</span>
          <span class="label">Survey No / Sub-div</span>
        </div>
        <div class="card-tags">
          <span class="type-tag ${record.landType || 'dry'}">${typeLabel}</span>
          <span class="patta-status-tag ${record.isPattaTransferred ? 'transferred' : 'pending'}">
            ${record.isPattaTransferred ? 'Transferred' : 'Pending'}
          </span>
        </div>
      </div>

      <div class="card-body-grid">
        <div class="info-item">
          <span class="lbl">Patta No</span>
          <span class="val">${record.pattaNumber}</span>
        </div>
        <div class="info-item">
          <span class="lbl">Land Size</span>
          <span class="val" style="color: var(--primary); font-weight: 700;">${sizeString}</span>
        </div>
        <div class="info-item">
          <span class="lbl">Doc No</span>
          <span class="val">${record.documentNumber}</span>
        </div>
        <div class="info-item">
          <span class="lbl">Owner(s) in Patta</span>
          <div class="owners-list">${ownersHtml}</div>
        </div>
      </div>

      <div class="card-footer">
        <div class="purchase-details">
          <span>Purchased: <strong>${dateFormatted}</strong></span>
          ${record.purchasedFrom ? `<span>From: <strong class="seller-name">${record.purchasedFrom}</strong></span>` : ''}
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button type="button" class="btn btn-outline btn-sm ec-helper-trigger" data-id="${record.id}" style="padding: 4px 8px; font-size: 0.7rem; border-radius: var(--radius-xs); height: 26px; font-family: var(--font-body); font-weight: 500;">
            EC Helper
          </button>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-muted)"><path d="m9 18 6-6-6-6"/></svg>
        </div>
      </div>
    `;

    // Click on card opens edit mode
    card.addEventListener('click', () => openDrawer(record));

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

  const headers = ['ID', 'Survey Number', 'Sub Division', 'Patta Number', 'Document Number', 'Land Type', 'District', 'SRO', 'Village', 'Patta Transferred', 'Patta Owners', 'Size Value', 'Size Unit', 'Size in Cent', 'Size in SqFt', 'Size in Acre', 'Purchase Date', 'Purchased From', 'Created At'];
  
  const csvRows = [headers.join(',')];

  filtered.forEach(r => {
    const conv = convertUnits(r.landSize.value, r.landSize.unit);
    const row = [
      r.id,
      `"${r.surveyNumber.replace(/"/g, '""')}"`,
      `"${(r.subDivision || '').replace(/"/g, '""')}"`,
      `"${r.pattaNumber.replace(/"/g, '""')}"`,
      `"${r.documentNumber.replace(/"/g, '""')}"`,
      `"${(r.landType || 'dry').replace(/"/g, '""')}"`,
      `"${(r.district || '').replace(/"/g, '""')}"`,
      `"${(r.sro || '').replace(/"/g, '""')}"`,
      `"${(r.village || '').replace(/"/g, '""')}"`,
      r.isPattaTransferred ? 'Yes' : 'No',
      `"${r.pattaNames.join(', ').replace(/"/g, '""')}"`,
      r.landSize.value,
      r.landSize.unit,
      conv.cents.toFixed(4),
      conv.sqft.toFixed(2),
      conv.acres.toFixed(6),
      r.purchaseDate ? r.purchaseDate.split('T')[0] : '',
      `"${(r.purchasedFrom || '').replace(/"/g, '""')}"`,
      r.createdAt
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
window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  fetchRecords();
});
