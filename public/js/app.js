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
  ec: null
};

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
    if (att && att.fileUrl) {
      uploadArea.classList.add('hidden');
      statusDiv.classList.remove('hidden');
      nameSpan.innerText = att.fileName || 'Patta File';
      viewLink.href = att.fileUrl;
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
  ['document', 'ec'].forEach(type => {
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

  if (attachmentObj && attachmentObj.fileUrl) {
    uploadArea.classList.add('hidden');
    statusDiv.classList.remove('hidden');
    nameSpan.innerText = attachmentObj.fileName || `${name} File`;
    viewLink.href = attachmentObj.fileUrl;
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
    ec: null
  };

  // Reset file inputs
  ['fileDocument', 'fileEc'].forEach(id => {
    const inp = document.getElementById(id);
    if (inp) inp.value = '';
  });

  if (record) {
    // View Mode (details view)
    document.getElementById('drawerTitle').innerText = 'Land Record Details';
    document.getElementById('recordId').value = record.id;
    document.getElementById('documentNumber').value = record.documentNumber;
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

    // Disable all inputs for viewing
    toggleFormEditable(false);
  } else {
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
    document.getElementById('landType').value = 'dry';
    document.getElementById('isPattaTransferred').value = 'false';
    resetDocumentInputs();
    resetPattaInputs();
    
    // Reset attachments UI
    updateAttachmentUI('document', null);
    updateAttachmentUI('ec', null);

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

recordForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    showToast('Please fill all required fields correctly.', 'error');
    return;
  }

  const id = document.getElementById('recordId').value;
  const documentNumber = document.getElementById('documentNumber').value;
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
    documentOwnerName: docOwnersVal,
    purchasedFrom: sellersVal,
    purchaseDate: purchaseDate || null,
    pattas: pattasVal,
    district: districtVal,
    sro: sroVal,
    village: villageVal,
    notes: notesTextarea.value.trim(),
    uploadedAttachments: tempAttachments
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
                if (parcel.landType === state.landTypeFilter) {
                  hasMatchingType = true;
                }
              });
            }
          });
        } else {
          hasMatchingType = (record.landType === state.landTypeFilter);
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

    // Dynamic lists of chips
    const docOwnersHtml = (Array.isArray(record.documentOwnerName) ? record.documentOwnerName : [record.documentOwnerName]).map(name => `<span class="owner-chip doc-owner-chip">${name}</span>`).join('');
    const sellersHtml = (Array.isArray(record.purchasedFrom) ? record.purchasedFrom : [record.purchasedFrom]).filter(Boolean).map(name => `<span class="owner-chip seller-chip">${name}</span>`).join('');

    // Format purchase date for card
    const dateFormatted = record.purchaseDate ? new Date(record.purchaseDate).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    }) : 'N/A';

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

        const pattaAttachmentLink = (p.attachment && p.attachment.fileUrl) ? `
          <a href="${p.attachment.fileUrl}" target="_blank" class="attachment-chip" onclick="event.stopPropagation();" title="${p.attachment.fileName}" style="font-size: 0.65rem; padding: 2px 6px; margin-left: 6px; display: inline-flex; align-items: center; gap: 4px; height: 18px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            File
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

    const sellersText = sellersHtml ? `<div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 4px;"><span class="lbl" style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; font-family: var(--font-heading); font-weight: 500;">From:</span> <div class="owners-list">${sellersHtml}</div></div>` : '';

    card.innerHTML = `
      <div class="card-top">
        <div class="survey-tag">
          <span class="number">${surveyHeaderText}</span>
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
          <span class="lbl">Doc No</span>
          <span class="val">${record.documentNumber}</span>
        </div>
        <div class="info-item">
          <span class="lbl">Total Size</span>
          <span class="val" style="color: var(--primary); font-weight: 700;">${sizeString}</span>
        </div>
        <div class="info-item" style="grid-column: span 2;">
          <span class="lbl">Document Owner(s)</span>
          <div class="owners-list">${docOwnersHtml}</div>
        </div>
        <div class="info-item" style="grid-column: span 2;">
          <span class="lbl" style="margin-bottom: 6px;">Pattas & Parcels</span>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${pattasHtml}
          </div>
        </div>
        ${(function() {
          const atts = record.attachments || {};
          const hasDocument = atts.document && atts.document.fileUrl;
          const hasEc = atts.ec && atts.ec.fileUrl;

          if (hasDocument || hasEc) {
            const docLink = hasDocument ? `
              <a href="${atts.document.fileUrl}" target="_blank" class="attachment-chip" onclick="event.stopPropagation();" title="${atts.document.fileName}">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Deed
              </a>
            ` : '';

            const ecLink = hasEc ? `
              <a href="${atts.ec.fileUrl}" target="_blank" class="attachment-chip" onclick="event.stopPropagation();" title="${atts.ec.fileName}">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                EC Copy
              </a>
            ` : '';

            return `
              <div class="info-item" style="grid-column: span 2;">
                <span class="lbl">Attachments</span>
                <div class="card-attachments">
                  ${docLink}
                  ${ecLink}
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
          ${sellersText}
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

  const headers = ['ID', 'Survey Number', 'Sub Division', 'Patta Number', 'Document Number', 'Document Owner Name', 'Land Type', 'District', 'SRO', 'Village', 'Patta Transferred', 'Patta Owners', 'Parcels', 'Size Value', 'Size Unit', 'Size in Cent', 'Size in SqFt', 'Size in Acre', 'Size in Are', 'Purchase Date', 'Purchased From', 'Notes', 'Created At'];
  
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
function initAttachmentsHandlers() {
  ['Document', 'Ec'].forEach(name => {
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

window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  fetchRecords();
  initAttachmentsHandlers();
});
