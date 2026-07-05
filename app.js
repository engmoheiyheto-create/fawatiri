const STR = {
  ar: {
    appName: "فواتيري",
    tabScan: "مسح فاتورة",
    tabBills: "الفواتير",
    tabCharts: "المقارنات",
    scanLabel: "صوّر أو ارفع صورة الفاتورة",
    scanHint: "اضغط هنا لالتقاط صورة الفاتورة",
    ocrRunning: "بنقرا الفاتورة...",
    storeLabel: "اسم المحل",
    storePlaceholder: "اختياري",
    dateLabel: "التاريخ",
    catLabel: "التصنيف",
    newCatPlaceholder: "اسم تصنيف جديد",
    addCat: "تصنيف",
    itemsLabel: "المنتجات (راجع وعدّل قبل الحفظ)",
    addItem: "إضافة منتج",
    totalLabel: "الإجمالي",
    saveBillBtn: "احفظ الفاتورة",
    installText: "ثبّت التطبيق على شاشتك الرئيسية",
    installBtnText: "تثبيت",
    all: "الكل",
    emptyBills: "لسه مفيش فواتير محفوظة",
    backToBills: "رجوع للفواتير",
    addManualItem: "إضافة عنصر تاني لنفس الفاتورة",
    itemNamePlaceholder: "اسم المنتج",
    pricePlaceholder: "السعر",
    totalsCompareTitle: "مقارنة إجمالي الفواتير",
    itemCompareTitle: "مقارنة سعر منتج عبر الوقت",
    general: "أخرى",
    itemNamePh: "اسم المنتج",
    pricePh: "السعر",
    del: "حذف",
    noItemChart: "اختر منتج ظهر في أكتر من فاتورة عشان تشوف مقارنة",
    noBillsChart: "لسه مفيش فواتير كفاية للمقارنة",
    selectItem: "اختر منتج",
    vsLast: "مقارنة بالمرة اللي فاتت",
    months: ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"],
    ocrFailed: "معرفناش نقرا الفاتورة تلقائي، ادخل المنتجات يدويًا",
    itemsCount: "منتج"
  },
  en: {
    appName: "My Receipts",
    tabScan: "Scan Receipt",
    tabBills: "Bills",
    tabCharts: "Comparisons",
    scanLabel: "Photograph or upload the receipt",
    scanHint: "Tap here to capture the receipt photo",
    ocrRunning: "Reading the receipt...",
    storeLabel: "Store name",
    storePlaceholder: "Optional",
    dateLabel: "Date",
    catLabel: "Category",
    newCatPlaceholder: "New category name",
    addCat: "Category",
    itemsLabel: "Items (review and edit before saving)",
    addItem: "Add item",
    totalLabel: "Total",
    saveBillBtn: "Save receipt",
    installText: "Install the app on your home screen",
    installBtnText: "Install",
    all: "All",
    emptyBills: "No receipts saved yet",
    backToBills: "Back to bills",
    addManualItem: "Add another item to this bill",
    itemNamePlaceholder: "Item name",
    pricePlaceholder: "Price",
    totalsCompareTitle: "Compare bill totals",
    itemCompareTitle: "Compare an item's price over time",
    general: "Other",
    itemNamePh: "Item name",
    pricePh: "Price",
    del: "Delete",
    noItemChart: "Pick an item that appears in more than one bill to compare",
    noBillsChart: "Not enough bills yet to compare",
    selectItem: "Select an item",
    vsLast: "vs last time",
    months: ["January","February","March","April","May","June","July","August","September","October","November","December"],
    ocrFailed: "Couldn't auto-read the receipt, please enter items manually",
    itemsCount: "items"
  }
};

let lang = localStorage.getItem('rc-lang') || 'ar';
const DEFAULT_CATS = {
  ar: [
    {name:"سوبر ماركت", emoji:"🛒"},
    {name:"صيدلية", emoji:"💊"},
    {name:"ملابس", emoji:"👕"},
    {name:"مطعم", emoji:"🍽️"},
    {name:"أخرى", emoji:"🧾"}
  ],
  en: [
    {name:"Supermarket", emoji:"🛒"},
    {name:"Pharmacy", emoji:"💊"},
    {name:"Clothing", emoji:"👕"},
    {name:"Restaurant", emoji:"🍽️"},
    {name:"Other", emoji:"🧾"}
  ]
};
const CAT_COLORS = ["#4A3F8C","#F2B84B","#E15B5B","#2E9E6B","#3A9BD9","#C0577B","#8E6BC0"];

let categories = [];
let bills = [];
let activeFilter = null;
let currentItems = [];
let currentDetailBillId = null;
let pendingImageData = null;

function t(key){ return STR[lang][key] || key; }

function catInfo(name){
  const found = categories.find(c => c.name === name);
  return found || {name, emoji:"🧾"};
}
function catColor(name){
  const idx = categories.findIndex(c => c.name === name);
  return CAT_COLORS[idx >= 0 ? idx % CAT_COLORS.length : CAT_COLORS.length - 1];
}

function switchView(view){
  document.querySelectorAll('.tab-btn').forEach(b=> b.classList.toggle('active', b.dataset.view===view));
  document.querySelectorAll('#view-panels > div').forEach(p=> p.classList.remove('active'));
  document.getElementById('panel-' + view).classList.add('active');
  if(view === 'bills'){ renderFilters(); renderBillsList(); }
  if(view === 'charts'){ renderCharts(); }
}
document.querySelectorAll('.tab-btn').forEach(b=>{
  b.addEventListener('click', ()=> switchView(b.dataset.view));
});
document.getElementById('backToBills').addEventListener('click', ()=>{
  document.querySelectorAll('.tab-btn').forEach(b=> b.classList.toggle('active', b.dataset.view==='bills'));
  document.querySelectorAll('#view-panels > div').forEach(p=> p.classList.remove('active'));
  document.getElementById('panel-bills').classList.add('active');
  renderFilters(); renderBillsList();
});

function applyLang(){
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.getElementById('langBtn').textContent = lang === 'ar' ? 'EN' : 'AR';
  document.querySelectorAll('[data-i18n]').forEach(el=>{ el.textContent = t(el.getAttribute('data-i18n')); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{ el.placeholder = t(el.getAttribute('data-i18n-placeholder')); });
  activeFilter = t('all');
}

document.getElementById('langBtn').addEventListener('click', ()=>{
  lang = lang === 'ar' ? 'en' : 'ar';
  localStorage.setItem('rc-lang', lang);
  applyLang();
  renderCatSelect();
  renderFilters();
  renderBillsList();
  renderCharts();
});

function loadData(){
  try{
    const c = localStorage.getItem('rc-categories');
    categories = c ? JSON.parse(c) : DEFAULT_CATS[lang].slice();
  }catch(e){ categories = DEFAULT_CATS[lang].slice(); }
  try{
    const b = localStorage.getItem('rc-bills');
    bills = b ? JSON.parse(b) : [];
  }catch(e){ bills = []; }
}
function saveCategories(){ localStorage.setItem('rc-categories', JSON.stringify(categories)); }
function saveBills(){ localStorage.setItem('rc-bills', JSON.stringify(bills)); }

function renderCatSelect(){
  const sel = document.getElementById('billCatSelect');
  sel.innerHTML = categories.map(c=> `<option value="${escapeAttr(c.name)}">${c.emoji} ${escapeHtml(c.name)}</option>`).join('');
}

document.getElementById('addCatBtn').addEventListener('click', ()=>{
  const input = document.getElementById('newCat');
  const val = input.value.trim();
  if(!val) return;
  if(!categories.find(c=>c.name===val)){
    categories.push({name: val, emoji: "🧾"});
    saveCategories();
    renderCatSelect();
  }
  input.value = '';
});

function escapeHtml(s){ return (s||'').toString().replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function escapeAttr(s){ return escapeHtml(s); }

/* ---------- SCAN & OCR ---------- */
document.getElementById('scanZone').addEventListener('click', ()=> document.getElementById('fileInput').click());
document.getElementById('fileInput').addEventListener('change', (e)=>{
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = (ev)=>{
    pendingImageData = ev.target.result;
    const img = document.getElementById('previewImg');
    img.src = pendingImageData;
    img.style.display = 'block';
    runOCR(pendingImageData);
  };
  reader.readAsDataURL(file);
});

function parsePriceFromLine(line){
  const matches = line.match(/(\d+[.,]\d{1,2}|\d{2,6})(?!\d)/g);
  if(!matches || matches.length===0) return null;
  const raw = matches[matches.length-1].replace(',', '.');
  const num = parseFloat(raw);
  if(isNaN(num) || num <= 0) return null;
  return num;
}

function parseReceiptText(text){
  const lines = text.split('\n').map(l=>l.trim()).filter(l=>l.length>1);
  const items = [];
  let guessedTotal = null;
  const totalKeywords = /total|إجمالي|الاجمالي|المجموع|net|صافي/i;

  lines.forEach(line=>{
    const price = parsePriceFromLine(line);
    if(price === null) return;
    if(totalKeywords.test(line)){
      guessedTotal = price;
      return;
    }
    let name = line.replace(/(\d+[.,]\d{1,2}|\d{2,6})(?!\d)/g, '').replace(/[|_\-–—:*]+$/,'').trim();
    if(name.length < 2) name = t('general');
    if(price > 0 && price < 100000){
      items.push({ id: Date.now() + Math.random(), name, price, qty: 1 });
    }
  });

  return { items, total: guessedTotal };
}

async function runOCR(imageData){
  document.getElementById('ocrStatus').style.display = 'flex';
  document.getElementById('reviewCard').style.display = 'none';
  try{
    const result = await Tesseract.recognize(imageData, 'eng+ara', {});
    const { items, total } = parseReceiptText(result.data.text || '');
    currentItems = items.length > 0 ? items : [{ id: Date.now(), name: '', price: 0, qty: 1 }];
    document.getElementById('totalInput').value = total !== null ? total : sumItems(currentItems).toFixed(2);
  }catch(err){
    currentItems = [{ id: Date.now(), name: '', price: 0, qty: 1 }];
    document.getElementById('totalInput').value = '';
    alert(t('ocrFailed'));
  }
  document.getElementById('billDateInput').value = new Date().toISOString().slice(0,10);
  renderCatSelect();
  renderItemsEditor();
  document.getElementById('ocrStatus').style.display = 'none';
  document.getElementById('reviewCard').style.display = 'block';
}

function sumItems(items){ return items.reduce((s,it)=> s + (Number(it.price)||0), 0); }

function renderItemsEditor(){
  const wrap = document.getElementById('itemsEditor');
  wrap.innerHTML = currentItems.map(it=>`
    <div class="item-row" data-id="${it.id}">
      <input type="text" class="name-input" value="${escapeAttr(it.name)}" placeholder="${t('itemNamePh')}" />
      <input type="number" class="price-input" value="${it.price}" step="0.01" placeholder="${t('pricePh')}" />
      <button class="rm-btn" data-rm="${it.id}">✕</button>
    </div>
  `).join('');
  wrap.querySelectorAll('.item-row').forEach(row=>{
    const id = row.dataset.id;
    row.querySelector('.name-input').addEventListener('input', (e)=>{
      const item = currentItems.find(x=>String(x.id)===id);
      if(item) item.name = e.target.value;
    });
    row.querySelector('.price-input').addEventListener('input', (e)=>{
      const item = currentItems.find(x=>String(x.id)===id);
      if(item) item.price = parseFloat(e.target.value) || 0;
      document.getElementById('totalInput').value = sumItems(currentItems).toFixed(2);
    });
  });
  wrap.querySelectorAll('[data-rm]').forEach(b=>{
    b.addEventListener('click', ()=>{
      currentItems = currentItems.filter(x=>String(x.id)!==b.dataset.rm);
      renderItemsEditor();
      document.getElementById('totalInput').value = sumItems(currentItems).toFixed(2);
    });
  });
}

document.getElementById('addItemBtn').addEventListener('click', ()=>{
  currentItems.push({ id: Date.now()+Math.random(), name: '', price: 0, qty: 1 });
  renderItemsEditor();
});

document.getElementById('saveBillBtn').addEventListener('click', ()=>{
  const store = document.getElementById('storeInput').value.trim();
  const date = document.getElementById('billDateInput').value || new Date().toISOString().slice(0,10);
  const cat = document.getElementById('billCatSelect').value || t('general');
  const total = parseFloat(document.getElementById('totalInput').value) || sumItems(currentItems);
  const validItems = currentItems.filter(it => it.name.trim().length > 0);
  if(validItems.length === 0 && total <= 0) return;

  bills.push({
    id: Date.now(),
    store, date, cat, total,
    items: validItems.map(it=>({ id: it.id, name: it.name.trim(), price: Number(it.price)||0 }))
  });
  saveBills();

  document.getElementById('storeInput').value = '';
  document.getElementById('totalInput').value = '';
  document.getElementById('previewImg').style.display = 'none';
  document.getElementById('reviewCard').style.display = 'none';
  document.getElementById('fileInput').value = '';
  currentItems = [];

  switchView('bills');
});

/* ---------- BILLS LIST ---------- */
function renderFilters(){
  const wrap = document.getElementById('catFilters');
  const names = categories.map(c=>c.name);
  const all = [t('all'), ...names];
  if(!all.includes(activeFilter)) activeFilter = t('all');
  wrap.innerHTML = all.map(c=>{
    const active = c === activeFilter;
    return `<button class="chip ${active?'active':''}" data-cat="${escapeAttr(c)}">${escapeHtml(c)}</button>`;
  }).join('');
  wrap.querySelectorAll('.chip').forEach(b=>{
    b.addEventListener('click', ()=>{ activeFilter = b.dataset.cat; renderFilters(); renderBillsList(); });
  });
}

function renderBillsList(){
  const container = document.getElementById('billsList');
  let filtered = bills.slice().sort((a,b)=> new Date(b.date) - new Date(a.date) || b.id - a.id);
  if(activeFilter !== t('all')) filtered = filtered.filter(b=>b.cat===activeFilter);
  if(filtered.length===0){
    container.innerHTML = `<div class="empty"><div class="em-icon">🧾</div><div>${t('emptyBills')}</div></div>`;
    return;
  }
  // build previous-bill-per-category map for diff comparison, sorted chronologically
  const byCat = {};
  bills.slice().sort((a,b)=> new Date(a.date)-new Date(a.date) || a.id-b.id).forEach(b=>{
    byCat[b.cat] = byCat[b.cat] || [];
    byCat[b.cat].push(b);
  });
  Object.keys(byCat).forEach(cat=> byCat[cat].sort((a,b)=> a.id - b.id));

  container.innerHTML = filtered.map(bill=>{
    const info = catInfo(bill.cat);
    const catBills = byCat[bill.cat] || [];
    const idx = catBills.findIndex(b=>b.id===bill.id);
    let diffHtml = '';
    if(idx > 0){
      const prev = catBills[idx-1];
      const diff = bill.total - prev.total;
      if(Math.abs(diff) > 0.009){
        const cls = diff > 0 ? 'diff-up' : 'diff-down';
        const arrow = diff > 0 ? '▲' : '▼';
        diffHtml = `<div class="bill-diff ${cls}">${arrow} ${Math.abs(diff).toFixed(2)}</div>`;
      }
    }
    const dateLabel = new Date(bill.date).toLocaleDateString(lang==='ar'?'ar-EG':'en-US', {day:'numeric', month:'short'});
    return `<div class="bill-item" data-id="${bill.id}">
      <div class="bill-item-top">
        <div class="bill-emoji">${info.emoji}</div>
        <div class="bill-info">
          <div class="bill-store">${escapeHtml(bill.store || bill.cat)}</div>
          <div class="bill-date">${dateLabel} · ${bill.items.length} ${t('itemsCount')}</div>
        </div>
        <div>
          <div class="bill-total">${bill.total.toFixed(2)}</div>
          ${diffHtml}
        </div>
      </div>
    </div>`;
  }).join('');

  container.querySelectorAll('.bill-item').forEach(el=>{
    el.addEventListener('click', ()=>{
      currentDetailBillId = Number(el.dataset.id);
      renderDetail();
      document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('#view-panels > div').forEach(p=>p.classList.remove('active'));
      document.getElementById('panel-detail').classList.add('active');
    });
  });
}

/* ---------- BILL DETAIL ---------- */
function renderDetail(){
  const bill = bills.find(b=>b.id===currentDetailBillId);
  const card = document.getElementById('detailCard');
  if(!bill){ card.innerHTML = ''; return; }
  const info = catInfo(bill.cat);
  const dateLabel = new Date(bill.date).toLocaleDateString(lang==='ar'?'ar-EG':'en-US', {day:'numeric', month:'long', year:'numeric'});
  let html = `<div style="display:flex; align-items:center; gap:10px; margin-bottom:14px;">
    <div class="bill-emoji" style="width:44px;height:44px;font-size:20px;">${info.emoji}</div>
    <div>
      <div style="font-size:16px; font-weight:700;">${escapeHtml(bill.store || bill.cat)}</div>
      <div style="font-size:12px; color:var(--text-muted);">${dateLabel} · ${escapeHtml(bill.cat)}</div>
    </div>
  </div>`;
  html += `<div>`;
  bill.items.forEach(it=>{
    html += `<div class="detail-item">
      <div class="detail-item-name">${escapeHtml(it.name)}</div>
      <div class="detail-item-price">${Number(it.price).toFixed(2)}</div>
      <button class="rm-btn" data-detail-rm="${it.id}">✕</button>
    </div>`;
  });
  html += `</div>`;
  html += `<div style="display:flex; justify-content:space-between; margin-top:12px; padding-top:12px; border-top:2px solid var(--border); font-weight:700; font-size:15px;">
    <span>${t('totalLabel')}</span><span>${bill.total.toFixed(2)}</span>
  </div>`;
  card.innerHTML = html;
  card.querySelectorAll('[data-detail-rm]').forEach(b=>{
    b.addEventListener('click', ()=>{
      const id = b.dataset.detailRm;
      bill.items = bill.items.filter(it=>String(it.id)!==id);
      bill.total = sumItems(bill.items);
      saveBills();
      renderDetail();
    });
  });
}

document.getElementById('addManualItemBtn').addEventListener('click', ()=>{
  const bill = bills.find(b=>b.id===currentDetailBillId);
  if(!bill) return;
  const nameInput = document.getElementById('manualItemName');
  const priceInput = document.getElementById('manualItemPrice');
  const name = nameInput.value.trim();
  const price = parseFloat(priceInput.value) || 0;
  if(!name) return;
  bill.items.push({ id: Date.now()+Math.random(), name, price });
  bill.total = sumItems(bill.items);
  saveBills();
  nameInput.value = '';
  priceInput.value = '';
  renderDetail();
});

/* ---------- CHARTS ---------- */
function renderCharts(){
  renderTotalsChart();
  renderItemPicker();
  renderItemChart();
}

function renderTotalsChart(){
  const box = document.getElementById('totalsChart');
  const sorted = bills.slice().sort((a,b)=> new Date(a.date) - new Date(a.date) || a.id-b.id).sort((a,b)=>a.id-b.id);
  if(sorted.length === 0){
    box.innerHTML = `<div class="empty" style="padding:1.5rem;"><div>${t('noBillsChart')}</div></div>`;
    return;
  }
  const recent = sorted.slice(-10);
  const max = Math.max(...recent.map(b=>b.total), 1);
  const w = 300, h = 130, barGap = 6;
  const barW = (w - barGap*(recent.length-1)) / recent.length;
  let svg = `<svg width="100%" viewBox="0 0 ${w} ${h+24}" style="overflow:visible;">`;
  recent.forEach((b,i)=>{
    const barH = (b.total/max) * h;
    const x = i*(barW+barGap);
    const y = h - barH;
    svg += `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" fill="${catColor(b.cat)}" rx="3"/>`;
    svg += `<text x="${x+barW/2}" y="${h+16}" font-size="8" fill="var(--text-muted)" text-anchor="middle">${new Date(b.date).getDate()}/${new Date(b.date).getMonth()+1}</text>`;
  });
  svg += `</svg>`;
  box.innerHTML = svg;
}

function renderItemPicker(){
  const sel = document.getElementById('itemPickerSelect');
  const namesCount = {};
  bills.forEach(b=> b.items.forEach(it=>{
    const key = it.name.trim().toLowerCase();
    if(!key) return;
    namesCount[key] = (namesCount[key]||0) + 1;
  }));
  const repeatedNames = Object.keys(namesCount).filter(k=>namesCount[k] > 1);
  const prevVal = sel.value;
  if(repeatedNames.length === 0){
    sel.innerHTML = `<option value="">${t('noItemChart')}</option>`;
    return;
  }
  sel.innerHTML = `<option value="">${t('selectItem')}</option>` + repeatedNames.map(n=>{
    const displayName = bills.flatMap(b=>b.items).find(it=>it.name.trim().toLowerCase()===n)?.name || n;
    return `<option value="${escapeAttr(n)}">${escapeHtml(displayName)}</option>`;
  }).join('');
  if(repeatedNames.includes(prevVal)) sel.value = prevVal;
  sel.onchange = renderItemChart;
}

function renderItemChart(){
  const box = document.getElementById('itemChart');
  const sel = document.getElementById('itemPickerSelect');
  const key = sel.value;
  if(!key){ box.innerHTML = ''; return; }
  const points = [];
  bills.slice().sort((a,b)=> a.id-b.id).forEach(b=>{
    const item = b.items.find(it=>it.name.trim().toLowerCase()===key);
    if(item) points.push({ date: b.date, price: Number(item.price) });
  });
  if(points.length < 2){ box.innerHTML = ''; return; }
  const max = Math.max(...points.map(p=>p.price), 1);
  const min = Math.min(...points.map(p=>p.price), 0);
  const w = 300, h = 110, pad = 10;
  const range = (max-min) || 1;
  const stepX = (w - pad*2) / (points.length-1);
  let path = '';
  let circles = '';
  points.forEach((p,i)=>{
    const x = pad + i*stepX;
    const y = pad + (h-pad*2) - ((p.price-min)/range)*(h-pad*2);
    path += (i===0? 'M':'L') + x + ',' + y + ' ';
    circles += `<circle cx="${x}" cy="${y}" r="3.5" fill="var(--primary)"/>`;
    circles += `<text x="${x}" y="${y-8}" font-size="9" fill="var(--primary-dark)" text-anchor="middle" font-weight="700">${p.price.toFixed(0)}</text>`;
  });
  let svg = `<svg width="100%" viewBox="0 0 ${w} ${h}" style="overflow:visible;">
    <path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2.5"/>
    ${circles}
  </svg>`;
  const first = points[0].price, last = points[points.length-1].price;
  const diff = last - first;
  const cls = diff > 0 ? 'diff-up' : diff < 0 ? 'diff-down' : '';
  const arrow = diff > 0 ? '▲' : diff < 0 ? '▼' : '—';
  svg += `<div style="text-align:center; font-size:12px; margin-top:6px;" class="${cls}">${arrow} ${Math.abs(diff).toFixed(2)} (${t('vsLast')})</div>`;
  box.innerHTML = svg;
}

/* ---------- INIT ---------- */
loadData();
applyLang();
renderCatSelect();
renderFilters();

// PWA install prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e)=>{
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById('installBanner').style.display = 'flex';
});
document.getElementById('installBtn').addEventListener('click', async ()=>{
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  document.getElementById('installBanner').style.display = 'none';
});

if('serviceWorker' in navigator){
  navigator.serviceWorker.register('sw.js').catch(()=>{});
}
