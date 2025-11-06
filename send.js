
// Firebase v10 CDN modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
// import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app-check.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// 1) Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBXifH24fZNfURFMy-uHYS7RddqwtKDlZ0",
  authDomain: "simlog-12729.firebaseapp.com",
  projectId: "simlog-12729",
  storageBucket: "simlog-12729.firebasestorage.app",
  messagingSenderId: "44605944069",
  appId: "1:44605944069:web:9046e060ce3bfba1e4476c",
  measurementId: "G-B57905172V"
};

// 2) Init
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helpers
const $ = (sel) => document.querySelector(sel);

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', () => {
  // mark core fields required (defensive)
  $('#entryDate')?.setAttribute('required', '');
  $('#truckNumber')?.setAttribute('required', '');
  $('#businessName')?.setAttribute('required', '');
  $('#segment')?.setAttribute('required', '');

  // show/hide by segment
  const seg = $('#segment');
  seg?.addEventListener('change', () => {
    if (!isMainValid(true)) {
      seg.value = '';
      adjustVisibility();
      return;
    }
    adjustVisibility();
    updateNextButton();
    applySegmentRequired(seg.value);
  });

  // initial state
  adjustVisibility();
  updateNextButton();
  applySegmentRequired(seg?.value || '');

  // Operations: show Order # only for Partial Delivery or Overflow
  wireOperationsConditional();
});

// ===== VISIBILITY =====
function adjustVisibility() {
  const value = ($('#segment')?.value || '').trim();
  document.querySelectorAll('[data-segment]').forEach(sec => {
    sec.classList.toggle('hidden', sec.dataset.segment !== value);
  });
}

// ===== MAIN VALIDATION (gate segment reveal) =====
const segSelect = document.getElementById('segment');
const nextBtn   = document.getElementById('btnNextSegment'); // may be null if not on page

function isMainValid(showMessage = true) {
  const dateEl  = document.getElementById('entryDate');
  const truckEl = document.getElementById('truckNumber');
  const bizEl   = document.getElementById('businessName');
  const checks = [dateEl, truckEl, bizEl];
  for (const el of checks) {
    if (!el) continue;
    if (!el.value || (el.checkValidity && !el.checkValidity())) {
      if (showMessage) {
        el.reportValidity?.();
        el.focus?.();
      }
      return false;
    }
  }
  return true;
}

// ===== SEGMENT-SPECIFIC REQUIRED FLAGS =====
function applySegmentRequired(value) {
  // clear all first
  [
    '#equipmentType', '#equipQty',
    '#fuelType', '#fuelAmount', '#fuelCost',
    '#uniformType', '#uniformQty'
  ].forEach(sel => {
    const el = document.querySelector(sel);
    if (el) el.required = false;
  });

  switch (value) {
    case 'equipment':
      $('#equipmentType')?.setAttribute('required', '');
      $('#equipQty')?.setAttribute('required', '');
      break;
    case 'fuel':
      $('#fuelType')?.setAttribute('required', '');
      $('#fuelAmount')?.setAttribute('required', '');
      $('#fuelCost')?.setAttribute('required', '');
      break;
    case 'uniforms':
      $('#uniformType')?.setAttribute('required', '');
      $('#uniformQty')?.setAttribute('required', '');
      break;
    default:
      // none
      break;
  }
}

// ===== OPERATIONS: conditional Order # =====
function wireOperationsConditional() {
  const opType = document.getElementById('opType');
  const orderField = document.getElementById('orderNumberField');
  const orderInput = document.getElementById('orderNumber');
  if (!opType || !orderField || !orderInput) return;

  opType.addEventListener('change', () => {
    const value = opType.value;
    const needsOrder = value === 'partial_delivery' || value === 'overflow';
    orderField.classList.toggle('hidden', !needsOrder);
    orderInput.required = needsOrder;
    if (!needsOrder) orderInput.value = '';
  });
}

// ===== WIZARD STATE =====
const selectedSegments = [];
const footer      = document.getElementById('footerActions');
const modal       = document.getElementById('addMoreModal');
const modalYesBtn = document.getElementById('modalYes');
const modalNoBtn  = document.getElementById('modalNo');

function updateNextButton() {
  const v = (segSelect?.value || '').trim();
  if (nextBtn) nextBtn.disabled = !v;
}

function openModal()  { modal?.classList.remove('hidden'); }
function closeModal() { modal?.classList.add('hidden'); }

function clearHiddenSegmentInputs() {
  document.querySelectorAll('[data-segment].hidden input, [data-segment].hidden select, [data-segment].hidden textarea')
    .forEach(el => { if (el.type === 'checkbox' || el.type === 'radio') el.checked = false; else el.value = ''; });
}

// ===== READ SEGMENT DATA (MERGED operations case) =====
function readSegmentData(segment) {
  const data = {};
  switch (segment) {
    case 'fuel':
      data.type   = $('#fuelType')?.value || null;
      data.amount = parseFloat($('#fuelAmount')?.value || 0) || 0;
      data.cost   = parseFloat($('#fuelCost')?.value || 0) || 0;
      break;
    case 'equipment':
      data.type = $('#equipmentType')?.value || null;
      data.qty  = parseInt($('#equipQty')?.value || 0, 10) || 0;
      break;
    case 'uniforms':
      data.type = $('#uniformType')?.value || null;
      data.qty  = parseInt($('#uniformQty')?.value || 0, 10) || 0;
      break;
    case 'truck_maint':
      data.asset  = $('#assetN')?.value || null;
      data.amount = parseFloat($('#assetAmt')?.value || 0) || 0;
      data.desc   = $('#assetDesc')?.value?.trim() || null;
      break;
    case 'operations': {
      const type = $('#opType')?.value || null;
      data.type = type;
      data.cost = parseFloat($('#opCost')?.value || 0) || 0;
      const orderNum = $('#orderNumber')?.value?.trim() || null;
      if (['partial_delivery', 'overflow'].includes(type) && orderNum) {
        data.orderNumber = orderNum;
      }
      break;
    }
  }
  return data;
}

// simple per-segment check hook
function validateSegment(segment) {
  if (!segment) return false;
  if (segment === 'operations') {
    const opType = $('#opType')?.value || '';
    if (!opType) {
      $('#opType')?.reportValidity?.();
      alert('Please select an Operation Type.');
      return false;
    }
    if (['partial_delivery', 'overflow'].includes(opType)) {
      const orderInput = $('#orderNumber');
      if (!orderInput?.value?.trim()) {
        orderInput?.setAttribute('required','');
        orderInput?.reportValidity?.();
        
        return false;
      }
    }
  }
  // you can add more per-segment validation here if needed
  return true;
}
// Helper to require fields; shows native tooltip & focuses first missing
function requireFields(e, selectors) {
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (!el) continue;
    const val = (el.value ?? '').trim();
    const isEmpty = el.type === 'number' ? val === '' : !val;
    if (isEmpty) {
      e.preventDefault();
      el.setAttribute('required', '');
      el.reportValidity?.();
      el.focus?.();
      return false;
    }
  }
  return true;
}
// Optional: enforce qty > 0 for number fields
function requirePositiveNumber(e, selector) {
  const el = document.querySelector(selector);
  if (!el) return true;
  const num = Number(el.value);
  if (Number.isNaN(num) || num <= 0) {
    e.preventDefault();
    el.setAttribute('min', '1');
    el.setAttribute('required', '');
    // Give a friendly message if you want:
    // el.setCustomValidity('Please enter a quantity greater than 0');
    el.reportValidity?.();
    el.focus?.();
    // el.setCustomValidity(''); // clear after showing if you set one
    return false;
  }
  return true;
}
// Also guard Next by main validity
nextBtn?.addEventListener('click', (e) => {
  if (!isMainValid(true)) {
    e.preventDefault();
    return;
  }

  const segment = (segSelect?.value || '').trim();
  if (!segment) {e.preventDefault(); return;};
  if(segment === 'uniforms') {
    if(!requireFields(e, ['#uniformType', '#uniformQty'])) return;
    if(!requirePositiveNumber(e, '#uniformQty')) return;
  }
  if(segment === 'equipment') {
    if(!requireFields(e, ['#equipmentType', '#equipQty'])) return;
    if(!requirePositiveNumber(e, '#equipQty')) return;
  }

  if (!validateSegment(segment)) return;
  // store / replace segment snapshot
  const data = readSegmentData(segment);
  const idx = selectedSegments.findIndex(s => s.segment === segment);
  if (idx >= 0) selectedSegments[idx] = { segment, data };
  else selectedSegments.push({ segment, data });

  // open the add-more modal
  openModal();
});
//lock/unlock main fields 
function setMainLocked(locked) {
  const els = [
    document.getElementById('entryDate'),
    document.getElementById('truckNumber'),
    document.getElementById('businessName'),
  ];
  els.forEach(el => {
    if (!el) return;
    if (locked) {
      el.setAttribute('disabled', '');          // fully prevents edits & focus
      el.setAttribute('aria-disabled', 'true');
      el.classList.add('bg-slate-100','text-slate-400','cursor-not-allowed');
    } else {
      el.removeAttribute('disabled');
      el.removeAttribute('aria-disabled');
      el.classList.remove('bg-slate-100','text-slate-400','cursor-not-allowed');
    }
  });
}
// Modal YES → add another
modalYesBtn?.addEventListener('click', () => {
  closeModal();
  footer?.classList.add('hidden'); // keep footer hidden while adding
    setMainLocked(true);

  if (segSelect) {
    segSelect.value = '';
    adjustVisibility();
    applySegmentRequired('');
    updateNextButton();
  }
  clearHiddenSegmentInputs();
});

// Modal NO → done adding
modalNoBtn?.addEventListener('click', () => {
  closeModal();
  footer?.classList.remove('hidden'); // show Save/Cancel
    setMainLocked(false);
});

// ===== SUBMIT (to Firestore) =====
const form = document.querySelector('main form');

// pre-submit guard for HTML5 validity
form?.addEventListener('submit', (e) => {
  if (!form.checkValidity?.() || !$('#entryDate')?.value) {
    e.preventDefault();
    form.reportValidity?.();
    return;
  }
}, true);

form?.addEventListener('reset', () => {
    setTimeout(() => setMainLocked(false), 0);
})

form?.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!form.checkValidity?.()) {
    form.reportValidity?.();
    return;
  }

  const currentSeg = (segSelect?.value || '').trim();

  // base fields
  const base = {
    date: $('#entryDate')?.value || null,
    truckNumber: $('#truckNumber')?.value?.trim() || null,
    businessName: $('#businessName')?.value?.trim() || null,
    notes: $('#notes')?.value?.trim() || null,
    createdAt: serverTimestamp()
  };

  // de-duplicate segments (wizard + currently visible)
  const byKey = {};
  (selectedSegments || []).forEach(s => { if (s?.segment) byKey[s.segment] = s; });
  if (currentSeg) {
    byKey[currentSeg] = { segment: currentSeg, data: readSegmentData(currentSeg) };
  }
  const segments = Object.values(byKey);
  const segmentIndex = segments.map(s => s.segment);

  // roll-up cost
  let totalCost = 0;
  segments.forEach(s => {
    const d = s?.data || {};
    if (s.segment === 'fuel')       totalCost += Number(d.cost)   || 0;
    if (s.segment === 'operations') totalCost += Number(d.cost)   || 0;
    if (s.segment === 'truck_maint')totalCost += Number(d.amount) || 0;
  });

  const payload = { ...base, segments, segmentIndex, totalCost };

  const submitBtn = form.querySelector('[type="submit"]');
  submitBtn && (submitBtn.disabled = true);

  try {
    const colRef = collection(db, 'public_ops');
    const docRef = await addDoc(colRef, payload);
    console.log('Saved doc id:', docRef.id);
    alert('Saved!');
    // reset
    form.reset();
    if (segSelect) segSelect.value = '';
    adjustVisibility();
    applySegmentRequired('');
    if (Array.isArray(selectedSegments)) selectedSegments.length = 0;
    setMainLocked(false);
  } catch (err) {
    console.error('Firestore write failed:', err);
    alert('Save failed — get with Admin');
  } finally {
    submitBtn && (submitBtn.disabled = false);
  }
});



