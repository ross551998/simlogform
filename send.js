
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

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


const $ = (sel) => document.querySelector(sel);


document.addEventListener('DOMContentLoaded', () => {
  
  $('#entryDate')?.setAttribute('required', '');
  $('#truckNumber')?.setAttribute('required', '');
  $('#businessName')?.setAttribute('required', '');
  $('#segment')?.setAttribute('required', '');

  
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

  
  adjustVisibility();
  updateNextButton();
  applySegmentRequired(seg?.value || '');

  
  wireOperationsConditional();
});


function adjustVisibility() {
  const value = ($('#segment')?.value || '').trim();
  document.querySelectorAll('[data-segment]').forEach(sec => {
    sec.classList.toggle('hidden', sec.dataset.segment !== value);
  });
}


const segSelect = document.getElementById('segment');
const nextBtn   = document.getElementById('btnNextSegment');

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


function applySegmentRequired(value) {
  
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
 
  return true;
}

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

function requirePositiveNumber(e, selector) {
  const el = document.querySelector(selector);
  if (!el) return true;
  const num = Number(el.value);
  if (Number.isNaN(num) || num <= 0) {
    e.preventDefault();
    el.setAttribute('min', '1');
    el.setAttribute('required', '');
    
    el.reportValidity?.();
    el.focus?.();
    
    return false;
  }
  return true;
}

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
  
  const data = readSegmentData(segment);
  const idx = selectedSegments.findIndex(s => s.segment === segment);
  if (idx >= 0) selectedSegments[idx] = { segment, data };
  else selectedSegments.push({ segment, data });

  
  openModal();
});

function setMainLocked(locked) {
  const els = [
    document.getElementById('entryDate'),
    document.getElementById('truckNumber'),
    document.getElementById('businessName'),
  ];
  els.forEach(el => {
    if (!el) return;
    if (locked) {
      el.setAttribute('disabled', '');          
      el.setAttribute('aria-disabled', 'true');
      el.classList.add('bg-slate-100','text-slate-400','cursor-not-allowed');
    } else {
      el.removeAttribute('disabled');
      el.removeAttribute('aria-disabled');
      el.classList.remove('bg-slate-100','text-slate-400','cursor-not-allowed');
    }
  });
}

modalYesBtn?.addEventListener('click', () => {
  closeModal();
  footer?.classList.add('hidden'); 
    setMainLocked(true);

  if (segSelect) {
    segSelect.value = '';
    adjustVisibility();
    applySegmentRequired('');
    updateNextButton();
  }
  clearHiddenSegmentInputs();
});


modalNoBtn?.addEventListener('click', () => {
  closeModal();
  footer?.classList.remove('hidden'); 
    setMainLocked(false);
});


const form = document.querySelector('main form');


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


  const base = {
    date: $('#entryDate')?.value || null,
    truckNumber: $('#truckNumber')?.value?.trim() || null,
    businessName: $('#businessName')?.value?.trim() || null,
    notes: $('#notes')?.value?.trim() || null,
    createdAt: serverTimestamp()
  };


  const byKey = {};
  (selectedSegments || []).forEach(s => { if (s?.segment) byKey[s.segment] = s; });
  if (currentSeg) {
    byKey[currentSeg] = { segment: currentSeg, data: readSegmentData(currentSeg) };
  }
  const segments = Object.values(byKey);
  const segmentIndex = segments.map(s => s.segment);

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




