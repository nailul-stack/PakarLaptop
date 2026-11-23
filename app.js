/**
 * app.js
 * Modul Aplikasi & Manipulasi DOM untuk PakarLaptop
 * - Parsing & Penanganan Data Laptop (CSV & LocalStorage)
 * - Rendering UI Form Kebutuhan, Tipe Laptop, dan Hasil Rekomendasi
 * - Rendering Daftar Laptop, Filter, Pencarian, & Panel Admin
 * - Routing Halaman Sederhana (Hash-based)
 */

// Helper selector DOM
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

// Helper format angka & sanitasi string
const rp$ = n => Number(n || 0).toLocaleString('id-ID');
const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const stor = n => !+n ? '—' : (+n >= 1024 ? (+n / 1024) + ' TB' : (+n) + ' GB');

/* ===== CSV sebagai basis data ===== */
const KAT_FROM_CSV = {
  'laptop dasar': 'dasar',
  'laptop produktivitas': 'produk',
  'laptop performa tinggi': 'tinggi',
  'laptop kreatif/grafis': 'kreatif',
  'laptop kreatif': 'kreatif',
  'laptop entertainment': 'game',
  'laptop entertainment (gaming)': 'game',
  'laptop entertainment/gaming': 'game',
  'laptop entertainment (untuk gamers)': 'game',
  'laptop gaming': 'game'
};

const KAT_NAME = {
  dasar: 'Laptop Dasar',
  produk: 'Laptop Produktivitas',
  tinggi: 'Laptop Performa Tinggi',
  kreatif: 'Laptop Kreatif/Grafis',
  game: 'Laptop Entertainment (Gaming)'
};

function parseCSV(text) {
  text = String(text || '').replace(/^\uFEFF/, '');
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else q = false;
      } else cell += c;
    } else if (c === '"') {
      q = true;
    } else if (c === ',') {
      row.push(cell); cell = '';
    } else if (c === '\n') {
      row.push(cell); rows.push(row); row = []; cell = '';
    } else if (c !== '\r') {
      cell += c;
    }
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(x => String(x).trim() !== ''));
}

const LAPTOP_IMAGES = {
  "1":"001_Advan_WorkMate_14.webp","2":"002_Zyrex_Kintamani.webp","3":"003_Axioo_MyBook_Hype_1.webp",
  "4":"004_Advan_TBook_14.webp","5":"005_Zyrex_Ultra_N100.webp","6":"006_Axioo_Hype_3.webp",
  "7":"007_Zyrex_D-TECH_14.webp","8":"008_Lenovo_IdeaPad_1_14IGL7.webp","9":"009_ASUS_Vivobook_Go_14_E410KA.webp",
  "10":"010_Acer_Aspire_3_Slim_A314-35.webp","11":"011_HP_14s-dq0508TU.webp","12":"012_Infinix_INBook_Y1_Plus.webp",
  "13":"013_Xiaomi_RedmiBook_15.webp","14":"014_Lenovo_IdeaPad_Slim_1_14AMN7.webp","15":"015_ASUS_Vivobook_Go_14_E1404GA.webp",
  "16":"016_Acer_Aspire_Lite_AL14-31P.webp","17":"017_Axioo_Hype_5.webp","18":"018_HP_14s-dq3111TU.webp",
  "19":"019_Dell_Inspiron_3525.webp","20":"020_Infinix_INBook_Y2_Plus.webp","21":"021_Acer_Aspire_Go_14_AG14-31P.webp",
  "22":"022_Lenovo_IdeaPad_Slim_3_14IAU7.webp","23":"023_ASUS_Vivobook_14_A1404ZA.webp","24":"024_HP_14s-fq0562AU.webp",
  "25":"025_Acer_Aspire_3_A314-23M.webp","26":"026_ASUS_Vivobook_Go_14_E1404FA.webp","27":"027_Lenovo_IdeaPad_1_14AMN7-Ryzen3.webp",
  "28":"028_MSI_Modern_14_C11M.webp","29":"029_Dell_Inspiron_14_3420.webp","30":"030_HP_14s-dq2614TU.webp",
  "31":"031_Axioo_Hype_7_AMD.webp","32":"032_ASUS_Vivobook_Go_15_OLED_E1504FA.webp","33":"033_Lenovo_IdeaPad_Slim_3_14IRH8.webp",
  "34":"034_MSI_Modern_14_C12MO.webp","35":"035_Advan_Workplus_14.webp","36":"036_Acer_Aspire_Lite_AL14-51M.webp",
  "37":"037_ASUS_Vivobook_14_A1405ZA.webp","38":"038_HP_14s-em0014AU.webp","39":"039_Lenovo_IdeaPad_Slim_3_14ABR8.webp",
  "40":"040_ASUS_Vivobook_Go_14_E1404FA-16GB.webp","41":"041_Acer_Aspire_5_Slim_A514-55.webp","42":"042_HP_14s-fq1036AU.webp",
  "43":"043_Infinix_INBook_X2_Pro.webp","44":"044_Lenovo_IdeaPad_Slim_3i_14IAU7.webp","45":"045_MSI_Modern_14_C12M-i5.webp",
  "46":"046_Dell_Vostro_3430.webp","47":"047_ASUS_Vivobook_15_A1504ZA.webp","48":"048_HP_Pavilion_14-dv2053TU.webp",
  "49":"049_Lenovo_ThinkBook_14_G4_IAP.webp","50":"050_Acer_Aspire_5_Spin_14_A5SP14.webp","51":"051_HP_14s-fq2002AU.webp",
  "52":"052_Lenovo_IdeaPad_Slim_5_14IAH8.webp","53":"053_ASUS_Vivobook_14X_M1403QA.webp","54":"054_Acer_Swift_3_Infinity_4_SF314-511.webp",
  "55":"055_Lenovo_ThinkPad_E14_Gen_4.webp","56":"056_Dell_Inspiron_14_5430.webp","57":"057_HP_Pavilion_Aero_13-be2001AU.webp",
  "58":"058_Apple_MacBook_Air_M1_2020.webp","59":"059_ASUS_Vivobook_16X_K3605ZF.webp","60":"060_Acer_Aspire_7_Gaming_A715-76G.webp",
  "61":"061_MSI_Thin_GF63_12UCX.webp","62":"062_Axioo_Pongo_725.webp","63":"063_Lenovo_IdeaPad_Gaming_3_15ACH6.webp",
  "64":"064_HP_Victus_15-fb0009AX.webp","65":"065_Lenovo_LOQ_15IAX9-RTX2050.webp","66":"066_ASUS_TUF_Gaming_A15_FA506NF.webp",
  "67":"067_Acer_Nitro_V_15_ANV15-51-RTX2050.webp","68":"068_MSI_Bravo_15_C7UDX.webp","69":"069_ASUS_TUF_Gaming_F15_FX506HF.webp",
  "70":"070_HP_Victus_15-fa1167TX.webp","71":"071_Lenovo_LOQ_15IAX9-RTX3050.webp","72":"072_Acer_Nitro_V_15_ANV15-51-RTX3050.webp",
  "73":"073_Apple_MacBook_Air_M1_512GB.webp","74":"074_Acer_Swift_Go_14_SFG14-71.webp","75":"075_ASUS_Zenbook_14_OLED_UX3402VA.webp",
  "76":"076_Acer_Swift_Go_14_AI_SFG14-72.webp","77":"077_Lenovo_Yoga_Slim_6_14IRH8.webp","78":"078_HP_Pavilion_Plus_14-ey0013AU.webp",
  "79":"079_Axioo_Pongo_760_V2.webp","80":"080_MSI_Cyborg_15_A12VE.webp","81":"081_ASUS_TUF_Gaming_A15_FA507NU.webp",
  "82":"082_Acer_Nitro_V_15_ANV15-51-RTX4050.webp","83":"083_Apple_MacBook_Air_M2_2022.webp","84":"084_ASUS_Vivobook_S_14_OLED_S5406MA.webp",
  "85":"085_Lenovo_LOQ_15IRX9-RTX4050.webp","86":"086_HP_Victus_16-r0088TX.webp","87":"087_MSI_Katana_15_B13VEK.webp",
  "88":"088_ASUS_TUF_Gaming_F15_FX507VU.webp","89":"089_ASUS_Vivobook_S_15_Copilot+_S5507QA.webp","90":"090_Lenovo_ThinkPad_L14_Gen_4.webp",
  "91":"091_Dell_G15_5530.webp","92":"092_Acer_Predator_Helios_Neo_16_PHN16-71.webp","93":"093_Lenovo_LOQ_15AHP9-RTX4060.webp",
  "94":"094_Apple_MacBook_Air_M2_512GB.webp","95":"095_ASUS_Vivobook_S_14_OLED_M5406WA.webp","96":"096_ASUS_ROG_Strix_G16_G614JU.webp",
  "97":"097_HP_Omen_16-xf0033AX.webp","98":"098_Lenovo_Legion_Slim_5_16APH8.webp","99":"099_Acer_Nitro_16_AN16-41.webp",
  "100":"100_MSI_Sword_16_HX_B14VFKG.webp","101":"101_Acer_Swift_X_14_SFX14-71G.webp","102":"102_ASUS_Vivobook_Pro_15_OLED_K6502VU.webp",
  "103":"103_Lenovo_Legion_5_16IRX9.webp","104":"104_HP_Victus_16-r1004TX.webp","105":"105_ASUS_TUF_Gaming_A16_FA617XT.webp",
  "106":"106_MSI_Stealth_14_Studio_A13VE.webp","107":"107_Acer_Predator_Helios_Neo_16_PHN16-72.webp","108":"108_Lenovo_Legion_Pro_5_16ARX8.webp",
  "109":"109_ASUS_ROG_Strix_G16_G614JVR.webp","110":"110_HP_Envy_x360_16-fe0005TX.webp","111":"111_MSI_Katana_17_B13VGK.webp",
  "112":"112_ASUS_Zenbook_Pro_14_OLED_UX6404VV.webp","113":"113_Acer_Swift_X_14_OLED_SFX14-72G.webp","114":"114_Apple_MacBook_Pro_14_M3_512GB.webp",
  "115":"115_Dell_XPS_13_Plus_9320.webp","116":"116_Lenovo_Yoga_Pro_7_14IRH8.webp","117":"117_ASUS_ROG_Zephyrus_G16_GU603VV.webp",
  "118":"118_HP_Omen_Transcend_16-u0045TX.webp","119":"119_ASUS_Vivobook_Pro_15_OLED_N6506MV.webp","120":"120_MSI_Prestige_16_AI_Studio_B1VFG.webp",
  "121":"121_Lenovo_Legion_Pro_5_16IRX9.webp","122":"122_Acer_Predator_Helios_16_PH16-71.webp","123":"123_ASUS_ROG_Zephyrus_G14_GA402XV.webp",
  "124":"124_Dell_G16_7630.webp","125":"125_Apple_MacBook_Pro_14_M3_Pro_512GB.webp","126":"126_ASUS_ProArt_Studiobook_16_H5600QM.webp",
  "127":"127_MSI_Creator_Z16_HX_Studio_A13VF.webp","128":"128_Lenovo_Legion_7i_16IRX9.webp","129":"129_ASUS_ROG_Strix_SCAR_16_G634JZ.webp",
  "130":"130_HP_Omen_17-ck2011TX.webp","131":"131_Acer_Predator_Helios_18_PH18-72.webp","132":"132_Apple_MacBook_Pro_16_M3_Pro_512GB.webp",
  "133":"133_Dell_XPS_14_9440.webp","134":"134_ASUS_ROG_Zephyrus_G16_GU605MI_OLED.webp","135":"135_MSI_Raider_GE68_HX_14VGG.webp",
  "136":"136_Lenovo_ThinkPad_P1_Gen_6.webp","137":"137_Apple_MacBook_Pro_14_M3_Pro_1TB.webp","138":"138_ASUS_ROG_Zephyrus_M16_GU604VI.webp",
  "139":"139_Dell_Alienware_m16_R2.webp","140":"140_Lenovo_Legion_Pro_7_16IRX9H.webp","141":"141_MSI_Creator_16_AI_Studio_A1VGG.webp",
  "142":"142_ASUS_ROG_Zephyrus_G14_GA403UI_OLED.webp","143":"143_Dell_XPS_16_9640_OLED.webp","144":"144_Apple_MacBook_Pro_16_M3_Max_36GB.webp",
  "145":"145_ASUS_Zenbook_S_14_OLED_UX5406SA.webp","146":"146_ASUS_ROG_Zephyrus_G16_GA605WI_OLED.webp","147":"147_ASUS_ProArt_P16_H7606WI_4K_OLED.webp",
  "148":"148_MSI_Titan_18_HX_A14VIG.webp","149":"149_Apple_MacBook_Pro_16_M3_Max_48GB.webp","150":"150_ASUS_ROG_Strix_SCAR_18_G834JY.webp"
};

const LAPTOP_SVG = `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="7" y="10" width="34" height="22" rx="3"/><path d="M3 38h42l-3-4H9z"/></svg>`;
const LAPTOP_SVG_SM = `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;color:var(--muted)" aria-hidden="true"><rect x="7" y="10" width="34" height="22" rx="3"/><path d="M3 38h42l-3-4H9z"/></svg>`;

function laptopImg(l) {
  if (!l) return '';
  if (l.gambar) {
    return l.gambar.startsWith('http') || l.gambar.startsWith('data:') || l.gambar.startsWith('gambar_laptop/') ? l.gambar : 'gambar_laptop/' + l.gambar;
  }
  if (l.no && LAPTOP_IMAGES[l.no]) return 'gambar_laptop/' + LAPTOP_IMAGES[l.no];
  return '';
}

function toLaptops(text) {
  const rows = parseCSV(text);
  if (rows.length < 2) return [];
  const head = rows[0].map(h => String(h).trim().toLowerCase());
  const ix = n => head.indexOf(n);
  const iNo = ix('no'), iM = ix('merk'), iN = ix('model/seri'), iC = ix('prosesor'), iR = ix('ram (gb)'), iS = ix('storage (gb)'), iG = ix('kartu grafis'), iK = ix('kategori kebutuhan'), iH = ix('harga (rp)');
  const iImg = head.findIndex(h => /file_name|gambar|image|foto/.test(h));
  const dig = v => String(v ?? '').replace(/[^\d]/g, '');
  const int = v => { const n = parseInt(dig(v), 10); return isNaN(n) ? 0 : n; };

  return rows.slice(1).map((r, i) => {
    const no = dig(r[iNo]) || String(i + 1);
    return {
      id: 'l' + no.padStart(3, '0'),
      no: +no || i + 1,
      merek: String(r[iM] ?? '').trim(),
      nama: String(r[iN] ?? '').trim(),
      cpu: String(r[iC] ?? '').trim(),
      ram: int(r[iR]),
      ssd: int(r[iS]),
      gpu: String(r[iG] ?? '').trim(),
      kat: KAT_FROM_CSV[String(r[iK] ?? '').trim().toLowerCase()] || 'dasar',
      harga: int(r[iH]),
      gambar: iImg >= 0 ? String(r[iImg] ?? '').trim() : ''
    };
  }).filter(x => x.nama && x.merek);
}

// Data dasar dari CSV tertanam
const CSV_EMBED = ($('#csv-data') || {}).textContent || '';
let DATA = toLaptops(CSV_EMBED);
let dataSource = 'CSV tertanam';

// Perubahan lokal (LocalStorage)
const LSKEY = 'pakarlaptop:lokal:v1';
let LOCAL = [];
try {
  const s = JSON.parse(localStorage.getItem(LSKEY) || '[]');
  if (Array.isArray(s)) LOCAL = s;
} catch (e) {
  LOCAL = [];
}

function merged() {
  const m = new Map(DATA.map(x => [x.id, x]));
  LOCAL.forEach(r => {
    if (!r || !r.id) return;
    if (r.hapus) m.delete(r.id);
    else m.set(r.id, { ...(m.get(r.id) || {}), ...r });
  });
  return [...m.values()];
}

function saveLocal() {
  try {
    localStorage.setItem(LSKEY, JSON.stringify(LOCAL));
  } catch (e) {}
}

function recCard(l, i, rp) {
  const inBudget = l.harga <= rp, diff = Math.abs(l.harga - rp);
  const badge = i === 0 ? 'Paling sesuai' : 'Alternatif ' + (i + 1);
  const imgUrl = laptopImg(l);
  return `<article class="rec${i === 0 ? ' top' : ''}">
  <div class="rec-wrap">
   <div class="rthumb">${imgUrl ? `<img src="${esc(imgUrl)}" alt="${esc(l.merek)} ${esc(l.nama)}" loading="lazy" onerror="this.onerror=null;this.parentElement.innerHTML=LAPTOP_SVG">` : LAPTOP_SVG}</div>
   <div class="rec-main">
    <div class="rh"><div><span class="tag">${badge}</span><h5>${esc(l.merek)} ${esc(l.nama)}</h5></div><span class="rprice">Rp ${rp$(l.harga)}</span></div>
    <div class="tags"><span class="tag alt">${esc(KAT_NAME[l.kat] || l.kat)}</span><span class="tag alt">${l.ram || '?'} GB RAM</span><span class="tag alt">${stor(l.ssd)}</span></div>
    <p class="meta">${esc(l.cpu)} · ${esc(l.gpu)}</p>
    ${l.alasan ? `<div class="rec-why"><strong>Alasan:</strong> ${esc(l.alasan)}</div>` : ''}
    <div class="sc"><span class="${inBudget ? 'b-in' : 'b-out'}">${inBudget ? (diff > 0 ? 'Rp ' + rp$(diff) + ' di bawah anggaran' : 'pas dengan anggaran') : 'Rp ' + rp$(diff) + ' di atas anggaran'}</span></div>
   </div>
  </div>
 </article>`;
}

/* ===== Inisialisasi Tampilan Form & Hasil ===== */
if ($('#fields')) {
  $('#fields').innerHTML = FIELDS.map(f => `<fieldset id="f-${f.k}"><legend>${f.label}</legend>${f.hint ? `<p class="hint">${f.hint}</p>` : ''}<div class="opts">${f.opts.map(([v, l]) => `<label><input type="radio" name="${f.k}" value="${v}"><span>${l}</span></label>`).join('')}</div><p class="err" id="err-${f.k}" role="alert"></p></fieldset>`).join('');
}

if ($('#types')) {
  $('#types').innerHTML = Object.values(CAT).map(c => `<article class="card type"><h3>${c.name}</h3><p>${c.d}</p><dl class="spec">${c.spec.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl></article>`).join('');
}

if ($('#viz')) {
  $('#viz').innerHTML = `<div class="stack">${Object.values(CAT).map((c, i) => `<a class="card mini" href="#tipe"><span class="eyebrow">0${i + 1}</span><strong>${c.name}</strong><span>${c.d}</span></a>`).join('')}</div>`;
}

const read = () => {
  const o = { rp: $('#rp').value };
  FIELDS.forEach(f => o[f.k] = ($(`input[name=${f.k}]:checked`) || {}).value || '');
  return o;
};

function setForm(o) {
  $('#rp').value = /^\d+$/.test(String(o.rp)) ? rp$(+o.rp) : o.rp;
  FIELDS.forEach(f => $$(`input[name=${f.k}]`).forEach(i => i.checked = i.value === o[f.k]));
  lvl();
}

function lvl() {
  const s = $('#rp').value.replace(/[.\s]/g, ''), n = +s;
  $('#lvl').textContent = /^\d+$/.test(s) && n >= 1e6 && n <= 1e8 ? `Termasuk anggaran ${n < 6e6 ? 'rendah' : n <= 12e6 ? 'sedang' : 'tinggi'}` : '';
}

let live = false;
function go(mode) {
  live = true;
  const o = infer(read());
  ['b', ...FIELDS.map(f => f.k)].forEach(k => {
    const m = o.err && o.err[k];
    $('#err-' + k).textContent = m || '';
    $('#f-' + k).classList.toggle('bad', !!m);
  });
  const box = $('#out');
  let h = '';
  if (o.err) {
    const n = Object.keys(o.err).length;
    h = `<p class="eyebrow">Masukan belum valid</p><h3>Lengkapi jawabanmu</h3><p>${n} isian perlu diperbaiki. Pesan merah ada di bawah pertanyaan yang bersangkutan.</p>`;
  } else {
    const facts = Object.entries(o.facts).map(([f, v]) => `<li><b>${NAME[f]}</b> ${val(f, v)}${f === 'b' ? ` (Rp ${rp$(o.rp)})` : ''}</li>`).join('');
    if (!o.fired.length) {
      h = `<p class="eyebrow">Belum ada hasil</p><h3>Belum ada tipe yang cocok</h3><p>Kombinasi jawabanmu belum bisa dipetakan ke satu tipe laptop. Coba ubah anggaran, kebutuhan utama, atau tingkat performa.</p><h4>Ringkasan kebutuhanmu</h4><ul class="chips">${facts}</ul>`;
    } else {
      const cats = o.rank.map(x => x[0]);
      const w = CAT[cats[0]], oth = o.rank.slice(1);
      const picks = pickLaptops(o.facts, o.rp, cats);
      const list = picks.length ? picks.map((l, i) => recCard(l, i, o.rp)).join('') : '<p class="empty">Belum ada laptop pada data CSV.</p>';
      h = `<p class="eyebrow">Rekomendasi untukmu</p><h3>${w.name}</h3><p>${w.d}</p>
   <h4 class="h4-tight">Laptop yang cocok <span class="hint" style="font-weight:400">(dari CSV)</span></h4>
   <div class="recs">${list}</div>
   <p class="hint" style="margin-top:8px">${picks.note || ''} Harga dan spesifikasi diambil dari dataset CSV.</p>
   <details><summary>Spesifikasi acuan tipe ini</summary><dl class="spec">${w.spec.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl></details>
   ${oth.length ? `<h4>Bisa juga dipertimbangkan</h4><p>${oth.map(([c]) => CAT[c].name).join(' atau ')}</p>` : ''}
   <h4>Ringkasan kebutuhanmu</h4><ul class="chips">${facts}</ul>
   <p class="hint" style="margin-top:14px">Harga mengikuti dataset CSV. Cocokkan lagi dengan produk terbaru sebelum membeli.</p>`;
    }
  }
  box.innerHTML = h;
  if (mode !== 'quiet' && innerWidth <= 860) box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function refresh() {
  const o = infer(read());
  if (!o.err || live) go('quiet');
}

if ($('#go')) $('#go').onclick = () => { go(); };
if ($('#rp')) {
  $('#rp').addEventListener('input', () => { lvl(); refresh(); });
  $('#rp').addEventListener('blur', e => {
    const s = e.target.value.replace(/[.\s]/g, '');
    if (/^\d+$/.test(s)) e.target.value = rp$(+s);
  });
}
if ($('#fields')) $('#fields').addEventListener('change', refresh);

/* ===== Daftar Laptop & Admin ===== */
let CF = 'all', editId = null, delId = null, SHOW = 12;
const AF = [['merek', 'Merek'], ['nama', 'Model/seri'], ['kat', 'Tipe'], ['harga', 'Harga (Rp)'], ['cpu', 'Prosesor'], ['gpu', 'Kartu grafis'], ['ram', 'RAM (GB)'], ['ssd', 'Storage (GB)']];

if ($('#fg')) {
  $('#fg').innerHTML = AF.map(([k, l]) => `<div class="fld"><label for="a-${k}">${l}</label>${k === 'kat' ? `<select id="a-kat"><option value="">Pilih tipe</option>${Object.entries(CAT).map(([v, c]) => `<option value="${v}">${c.name}</option>`).join('')}</select>` : `<input id="a-${k}" type="text" autocomplete="off">`}</div>`).join('');
}

if ($('#catf')) {
  $('#catf').innerHTML = [['all', 'Semua'], ...Object.entries(CAT).map(([k, c]) => [k, c.name])].map(([v, l]) => `<label><input type="radio" name="cf" value="${v}"${v === 'all' ? ' checked' : ''}><span>${l}</span></label>`).join('');
}

const card = l => {
  const sp = [['Prosesor', l.cpu], ['Grafis', l.gpu], ['RAM', l.ram ? l.ram + ' GB' : ''], ['Penyimpanan', l.ssd ? stor(l.ssd) : '']].filter(x => x[1]);
  const imgUrl = laptopImg(l);
  return `<article class="card lcard">
  <div class="lthumb">${imgUrl ? `<img src="${esc(imgUrl)}" alt="${esc(l.merek)} ${esc(l.nama)}" loading="lazy" onerror="this.onerror=null;this.parentElement.innerHTML=LAPTOP_SVG">` : LAPTOP_SVG}</div>
  <div class="tags"><span class="tag">${esc((CAT[l.kat] || {}).name)}</span></div>
  <h3>${esc(l.nama)}</h3>
  <p class="hint">${esc(l.merek)}</p>
  <p class="price">Rp ${rp$(+l.harga || 0)}</p>
  <dl class="ls">${sp.map(([a, b]) => `<div><dt>${a}</dt><dd>${esc(b)}</dd></div>`).join('')}</dl>
 </article>`;
};

function fillBrands() {
  const cur = $('#brand').value || 'all', b = [...new Set(merged().map(x => x.merek))].sort();
  $('#brand').innerHTML = '<option value="all">Semua merek</option>' + b.map(x => `<option>${esc(x)}</option>`).join('');
  $('#brand').value = b.includes(cur) ? cur : 'all';
}

function renderList(more) {
  if (!more) SHOW = 12;
  const q = $('#q').value.toLowerCase().trim(), d = $('#sort').value === 'asc' ? 1 : -1, br = $('#brand').value;
  const a = merged().filter(l => (CF === 'all' || l.kat === CF) && (br === 'all' || l.merek === br) && (!q || (l.nama + ' ' + l.merek + ' ' + l.cpu).toLowerCase().includes(q))).sort((x, y) => d * (x.harga - y.harga));
  $('#lgrid').innerHTML = a.slice(0, SHOW).map(card).join('') || '<p class="empty">Belum ada laptop yang cocok dengan filter ini.</p>';
  $('#cnt').textContent = a.length ? `Menampilkan ${Math.min(SHOW, a.length)} dari ${a.length} laptop` : '';
  $('#more').hidden = SHOW >= a.length;
  $('#srcinfo').textContent = `Sumber data: ${dataSource}. Total ${merged().length} laptop.`;
}

function renderAdmin() {
  const q = $('#aq').value.toLowerCase().trim(), f = merged().filter(r => !q || (r.merek + ' ' + r.nama).toLowerCase().includes(q)).sort((x, y) => (x.merek + x.nama).localeCompare(y.merek + y.nama));
  $('#at').innerHTML = f.slice(0, 25).map(r => {
    const u = laptopImg(r);
    return `<tr><td><div style="display:flex;align-items:center;gap:10px"><div style="width:42px;height:32px;background:#fff;border:1px solid var(--line);border-radius:6px;overflow:hidden;display:grid;place-items:center;flex:none">${u ? `<img src="${esc(u)}" style="width:100%;height:100%;object-fit:contain;padding:2px" loading="lazy" onerror="this.onerror=null;this.parentElement.innerHTML=LAPTOP_SVG_SM">` : LAPTOP_SVG_SM}</div><div><strong>${esc(r.nama)}</strong><br><span class="hint">${esc(r.merek)}</span></div></div></td><td>${esc((CAT[r.kat] || {}).name)}</td><td>Rp ${rp$(+r.harga || 0)}</td><td><div class="row"><button class="btn ghost sm" type="button" data-edit="${esc(r.id)}">Ubah</button><button class="btn ghost sm" type="button" data-del="${esc(r.id)}">${delId === r.id ? 'Yakin hapus?' : 'Hapus'}</button></div></td></tr>`;
  }).join('') || '<tr><td colspan="4" class="empty">Tidak ada data yang cocok.</td></tr>';
  $('#amore').textContent = f.length > 25 ? `Menampilkan 25 dari ${f.length} laptop. Persempit pencarian untuk melihat yang lain.` : '';
}

const renderAll = () => { fillBrands(); renderList(); renderAdmin(); };

if ($('#srcmode')) {
  $('#srcmode').textContent = /^https?:$/.test(location.protocol)
    ? 'Data dibaca langsung dari data-laptop.csv. Ganti berkas itu untuk memperbarui dataset.'
    : 'Halaman dibuka sebagai berkas, jadi data dibaca dari CSV yang tertanam di dalam halaman. Jalankan folder ini lewat server lokal agar data-laptop.csv terbaru dipakai.';
}

function resetForm() {
  AF.forEach(([k]) => $('#a-' + k).value = '');
  editId = null;
  $('#ft').textContent = 'Tambah laptop';
}

if ($('#q')) $('#q').oninput = () => renderList();
if ($('#sort')) $('#sort').onchange = () => renderList();
if ($('#brand')) $('#brand').onchange = () => renderList();
if ($('#aq')) $('#aq').oninput = renderAdmin;
if ($('#more')) $('#more').onclick = () => { SHOW += 12; renderList(true); };
if ($('#catf')) $('#catf').addEventListener('change', e => { CF = e.target.value; renderList(); });

document.addEventListener('click', e => {
  const a = e.target.closest('[data-cat]');
  if (!a) return;
  CF = a.dataset.cat;
  $$('input[name=cf]').forEach(i => i.checked = i.value === CF);
  renderList();
});

if ($('#reset')) $('#reset').onclick = () => { resetForm(); $('#aerr').textContent = ''; $('#aok').textContent = ''; };
if ($('#save')) $('#save').onclick = () => {
  const v = k => $('#a-' + k).value.trim(), er = $('#aerr');
  er.textContent = ''; $('#aok').textContent = '';
  const harga = +v('harga').replace(/[.\s]/g, ''), num = k => { const n = parseFloat(v(k).replace(',', '.')); return isNaN(n) ? null : n; };
  if (!v('nama') || !v('merek')) { er.textContent = 'Merek dan model wajib diisi.'; return; }
  if (!CAT[v('kat')]) { er.textContent = 'Pilih tipe laptop.'; return; }
  if (!Number.isInteger(harga) || harga < 1e6 || harga > 1e8) { er.textContent = 'Harga harus berupa angka antara Rp 1.000.000 dan Rp 100.000.000.'; return; }
  const id = editId || ('x' + Date.now().toString(36));
  const d = { id, merek: v('merek'), nama: v('nama'), kat: v('kat'), harga, cpu: v('cpu'), gpu: v('gpu'), ram: num('ram'), ssd: num('ssd') };
  LOCAL = LOCAL.filter(r => r.id !== id).concat(d);
  saveLocal();
  resetForm();
  $('#aok').textContent = 'Tersimpan di peramban ini. Unduh CSV untuk menyimpan permanen.';
  renderAll();
  if (live) refresh();
};

if ($('#at')) $('#at').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.edit) {
    const r = merged().find(x => x.id === b.dataset.edit);
    if (!r) return;
    AF.forEach(([k]) => {
      const x = r[k];
      $('#a-' + k).value = x == null ? '' : (k === 'harga' ? rp$(+x) : x);
    });
    editId = r.id;
    $('#ft').textContent = 'Ubah laptop';
    $('#fg').scrollIntoView({ block: 'center' });
  } else if (b.dataset.del) {
    if (delId !== b.dataset.del) {
      delId = b.dataset.del;
      renderAdmin();
      return;
    }
    LOCAL = LOCAL.filter(r => r.id !== delId).concat({ id: delId, hapus: true });
    saveLocal();
    delId = null;
    renderAdmin();
    renderAll();
    if (live) refresh();
  }
});

function csvCell(x) {
  const s = String(x ?? '');
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

if ($('#export')) $('#export').onclick = () => {
  const rows = merged().sort((a, b) => a.harga - b.harga);
  const lines = [['No', 'Merk', 'Model/Seri', 'Prosesor', 'RAM (GB)', 'Storage (GB)', 'Kartu Grafis', 'Kategori Kebutuhan', 'Harga (Rp)'].join(',')];
  rows.forEach((r, i) => lines.push([i + 1, r.merek, r.nama, r.cpu, r.ram, r.ssd, r.gpu, KAT_NAME[r.kat] || 'Laptop Dasar', 'Rp' + rp$(r.harga)].map(csvCell).join(',')));
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'dataset-laptop-mahasiswa.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  $('#aok').textContent = 'CSV diunduh. Ganti berkas data-laptop.csv dengan berkas ini agar data ikut tersimpan.';
};

if ($('#wipe')) $('#wipe').onclick = () => {
  if (!confirm('Hapus semua perubahan lokal dan kembali ke data CSV awal?')) return;
  LOCAL = [];
  saveLocal();
  renderAll();
  resetForm();
  $('#aerr').textContent = '';
  $('#aok').textContent = 'Data lokal dihapus. Tampilan kembali ke isi CSV.';
};

/* Ambil data dari CSV eksternal bila disajikan lewat HTTP/HTTPS */
(async () => {
  if (!/^https?:$/.test(location.protocol)) return;
  try {
    const rImg = await fetch('gambar_laptop/daftar_gambar.csv', { cache: 'no-store' });
    if (rImg.ok) {
      const tImg = await rImg.text();
      const rowsImg = parseCSV(tImg);
      for (let i = 1; i < rowsImg.length; i++) {
        const no = parseInt(rowsImg[i][0], 10), f = rowsImg[i][3];
        if (no && f) LAPTOP_IMAGES[no] = f;
      }
      renderAll();
      if (live) refresh();
    }
  } catch (e) {}
  try {
    const r = await fetch('data-laptop.csv', { cache: 'no-store' });
    if (!r.ok) return;
    const t = await r.text();
    if (!/merk/i.test(t)) return;
    const d = toLaptops(t);
    if (d.length < 10) return;
    DATA = d;
    dataSource = 'data-laptop.csv';
    renderAll();
    if (live) refresh();
  } catch (e) {}
})();

renderAll();

/* Routing Hash */
const VIEWS = ['beranda', 'laptop', 'tentang', 'admin'];
function route() {
  let h = location.hash.slice(1);
  const sec = ['cek', 'tipe'].includes(h) ? h : null;
  if (sec) h = 'beranda';
  if (!VIEWS.includes(h)) h = 'beranda';
  $$('.view').forEach(v => v.classList.toggle('on', v.id === 'v-' + h));
  $$('nav a').forEach(a => a.getAttribute('href') === '#' + h ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
  sec ? $('#' + sec).scrollIntoView() : scrollTo(0, 0);
}

addEventListener('hashchange', route);
route();
renderList();
