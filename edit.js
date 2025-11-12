
import { db, collection, addDoc, serverTimestamp, onSnapshot, getDocs, updateDoc  } from './index.js';


function esc(s){
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
document.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('entryDate');
  const segmentSelect = document.getElementById('segment');
  const dynamicFieldsSection = document.getElementById('dynamic-fields');
  // Hide section initially
  dynamicFieldsSection.classList.add('hidden');
  segmentSelect.addEventListener('change', (e) => {
    // Validate date before allowing segment change
    if (!validateFields(dateInput)) {
        dateInput.blur(); // remove focus (prevents date picker from opening)
        dateInput.setAttribute('placeholder', 'Select a date');
        segmentSelect.value = ''; // reset segment selection
        return;
    }
    // Toggle visibility of the dynamic fields
    if (e.target.value === 'equipment') {
        dynamicFieldsSection.classList.remove('hidden');
        dateInput.disabled = true;
        check();
    } else if(e.target.value === 'uniforms') {
        dynamicFieldsSection.classList.add('hidden');
        dateInput.disabled = true;
    } else {
      dynamicFieldsSection.classList.add('hidden');
      dateInput.disabled = false;
    }
  });
});
function validateFields(dateInput) {
  const input = dateInput.value.trim();
  if (!input) {
    alert('Please enter a date before continuing.');
    dateInput.focus(); // move focus back to the missing field
    return false;
  }
  return true;
}





function renderEquipment(containerId, fieldNames) {
  const el = document.getElementById(containerId);
  if (!el) return;
  // Simple responsive grid layout
  el.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4";
  el.innerHTML = "";

  fieldNames.forEach(({ key, label, quantity = 0 }) => {
    const qtyNum = Number(quantity) || 0;
    const stockText = qtyNum > 0 ? `Available: ${qtyNum}` : "Out of stock";
    const stockClass = qtyNum > 0 ? "text-slate-500" : "text-red-600 font-medium";
    el.insertAdjacentHTML("beforeend", `
      <div class="equipment-list rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <label for="${esc(key)}" class="block text-sm font-medium text-slate-700 mb-2">
          ${esc(label)} <span class="text-red-600" aria-hidden="true">*</span>
        </label>

        <input
          id="${esc(key)}"
          name="${esc(key)}"
          type="number"
          min="0"
          value=""
          autocomplete="off"
          placeholder="Enter amount"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
          ${qtyNum === 0 }
        />

        <p class="mt-2 text-sm ${stockClass}">${stockText}</p>
      </div>
    `);
  });
}

async function check() {
    try {
        const dv = collection(db, 'faINV_A9K3D2');
        const st = await getDocs(dv);
        console.log("Document data:", st);
        const l = Object.entries(st.docs[0].data());
        const fieldNames = l.map(([key, value]) => {
            if(value && typeof value === 'object') {
                return {
                    label: value.label || 'unknown',
                    quantity: value.q || 0
                }
            }
            return {
                label: 'empty',
                quantity: 0
            }
        }).sort((a, b) => a.label.localeCompare(b.label));
        renderEquipment("equipment-container", fieldNames);
    } catch(e) {
        console.error("Error adding document: ", e);
    }
}

async function addEntry() {
  try {
    const truckColl = collection(
      db,
      'truck_id',                       // <— your top-level collection name
      'IxpUGRi1RCfvdQ94Usqy',        // <— parent doc id
      'Truck_number',                // <— subcollection
    );
    const snap = await getDocs(truckColl);
    const data = snap.docs.map(doc => doc.data());

    
    console.log('Subcollection documents:', data);
    
  } catch (e) {
    console.error('Error getting documents:', e);
  }
}
addEntry();




