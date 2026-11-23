/**
 * expert-system.js
 * Modul Sistem Pakar Rekomendasi Laptop
 * - Basis Pengetahuan (Knowledge Base): Pertanyaan, Kategori, Rules
 * - Mesin Inferensi (Inference Engine): Forward Chaining & Scoring
 */

// Mapping nama dan label atribut/kebutuhan
const NAME = {
  b: 'anggaran',
  k: 'kebutuhan utama',
  p: 'performa',
  t: 'portabilitas',
  e: 'daya tahan baterai',
  g: 'kebutuhan grafis'
};

const KV = {
  umum: 'tugas kuliah umum',
  program: 'pemrograman',
  desain: 'desain/editing',
  multimedia: 'multimedia',
  data: 'pengolahan data',
  game: 'entertainment'
};

const val = (f, v) => f === 'k' ? KV[v] : (f === 't' || f === 'e') && v === 'sangat' ? 'sangat penting' : v;

const lv = [['rendah', 'Rendah'], ['sedang', 'Sedang'], ['tinggi', 'Tinggi']];
const pen = [['biasa', 'Biasa saja'], ['cukup', 'Cukup penting'], ['sangat', 'Sangat penting']];

const FIELDS = [
  { k: 'k', label: 'Kebutuhan utama', opts: [['umum', 'Tugas kuliah umum'], ['program', 'Pemrograman'], ['desain', 'Desain/editing'], ['multimedia', 'Multimedia'], ['data', 'Pengolahan data'], ['game', 'Entertainment']] },
  { k: 'p', label: 'Tingkat kebutuhan performa', opts: lv },
  { k: 't', label: 'Portabilitas', hint: 'Seberapa penting laptop ringan dan mudah dibawa ke kampus.', opts: pen },
  { k: 'e', label: 'Daya tahan baterai', hint: 'Seberapa penting memakai laptop lama tanpa sering mengisi daya.', opts: pen },
  { k: 'g', label: 'Kebutuhan grafis', hint: 'Desain, multimedia, atau aplikasi yang memakai GPU.', opts: lv }
];

// Definisi Kategori Solusi & Spesifikasi Acuan
const CAT = {
  dasar: {
    name: 'Laptop Dasar',
    d: 'Cukup untuk tugas kuliah umum: dokumen, presentasi, riset, dan kelas daring.',
    spec: [
      ['Prosesor', 'Core i3 / Ryzen 3 atau setara'],
      ['RAM', '8 GB'],
      ['Penyimpanan', 'SSD 256 sampai 512 GB'],
      ['Grafis', 'Bawaan prosesor']
    ]
  },
  produk: {
    name: 'Laptop Produktivitas',
    d: 'Seimbang antara performa, bobot, dan baterai untuk kuliah harian dan pemrograman ringan.',
    spec: [
      ['Prosesor', 'Core i5 / Ryzen 5 atau setara'],
      ['RAM', '8 sampai 16 GB'],
      ['Penyimpanan', 'SSD 512 GB'],
      ['Layar dan baterai', '13 sampai 14 inci, baterai besar']
    ]
  },
  tinggi: {
    name: 'Laptop Performa Tinggi',
    d: 'Untuk kompilasi besar, virtualisasi, dan pengolahan data.',
    spec: [
      ['Prosesor', 'Core i7 / Ryzen 7 atau setara'],
      ['RAM', '16 sampai 32 GB'],
      ['Penyimpanan', 'SSD 512 GB sampai 1 TB'],
      ['Pendinginan', 'Ventilasi dan kipas yang baik']
    ]
  },
  kreatif: {
    name: 'Laptop Kreatif/Grafis',
    d: 'Untuk desain, editing foto dan video, dan pekerjaan multimedia.',
    spec: [
      ['Prosesor', 'Core i5 H / Ryzen 5 H ke atas'],
      ['RAM', '16 GB atau lebih'],
      ['Grafis', 'GPU terpisah'],
      ['Layar', 'Warna akurat, sRGB penuh']
    ]
  },
  game: {
    name: 'Laptop Entertainment (Gaming)',
    d: 'Dirancang untuk bermain game, streaming hiburan, dan beban grafis/performa tinggi dengan GPU terpisah dan sistem pendingin khusus.',
    spec: [
      ['Prosesor', 'Core i5/i7 seri H atau Ryzen 5/7 seri H ke atas'],
      ['RAM', '16 GB atau lebih'],
      ['Grafis', 'NVIDIA GeForce RTX / AMD Radeon RX terpisah'],
      ['Layar dan pendingin', 'Refresh rate tinggi (144Hz+), pendingin ganda']
    ]
  }
};

// Basis Aturan (Rule Base) IF-THEN
const R = [
  ['R1',  { b: 'rendah', k: 'umum', p: 'rendah' }, 'dasar'],
  ['R2',  { b: 'sedang', k: 'umum', p: 'sedang' }, 'produk'],
  ['R3',  { b: 'sedang', k: 'program', p: 'sedang' }, 'produk'],
  ['R4',  { b: 'tinggi', k: 'program', p: 'tinggi' }, 'tinggi'],
  ['R5',  { k: 'desain', g: 'tinggi' }, 'kreatif'],
  ['R6',  { k: 'multimedia', g: 'sedang', p: 'sedang' }, 'kreatif'],
  ['R7',  { t: 'sangat', p: 'rendah' }, 'dasar'],
  ['R8',  { t: 'sangat', p: 'sedang', b: 'sedang' }, 'produk'],
  ['R9',  { e: 'sangat', k: 'umum' }, 'produk'],
  ['R10', { p: 'tinggi', k: 'data' }, 'tinggi'],
  ['R11', { p: 'tinggi', k: 'program', b: 'tinggi' }, 'tinggi'],
  ['R12', { g: 'tinggi', b: 'tinggi', k: 'desain' }, 'kreatif'],
  ['R13', { k: 'multimedia', g: 'tinggi' }, 'kreatif'],
  ['R14', { k: 'desain' }, 'kreatif'],
  ['R15', { k: 'multimedia' }, 'kreatif'],
  ['R16', { p: 'tinggi' }, 'tinggi'],
  ['R17', { k: 'program' }, 'produk'],
  ['R18', { k: 'data' }, 'produk'],
  ['R19', { k: 'game', g: 'tinggi', p: 'tinggi' }, 'game'],
  ['R20', { k: 'game', g: 'tinggi' }, 'game'],
  ['R21', { k: 'game', p: 'tinggi' }, 'game'],
  ['R22', { k: 'game', b: 'tinggi' }, 'game'],
  ['R23', { k: 'game', b: 'sedang' }, 'game'],
  ['R24', { k: 'game' }, 'game']
];

const cond = c => Object.entries(c).map(([f, v]) => `${NAME[f]} ${val(f, v)}`);

/**
 * Mesin Inferensi: Forward Chaining
 * Memeriksa masukan fakta terhadap basis aturan R1-R18
 */
function infer(raw) {
  const err = {}, s = String(raw.rp ?? '').replace(/[.\s]/g, '');
  let rp = NaN;

  if (!s) err.b = 'Isi anggaran.';
  else if (!/^-?\d+$/.test(s)) err.b = 'Anggaran harus berupa angka.';
  else {
    rp = +s;
    if (rp < 1e6 || rp > 1e8) err.b = 'Anggaran di luar rentang Rp 1.000.000 sampai Rp 100.000.000.';
  }

  FIELDS.forEach(f => {
    const v = raw[f.k];
    if (!v) err[f.k] = 'Pilih salah satu.';
    else if (!f.opts.some(o => o[0] === v)) err[f.k] = 'Pilihan tidak valid.';
  });

  if (Object.keys(err).length) return { err };

  // Pembentukan Fakta (Facts)
  const facts = { b: rp < 6e6 ? 'rendah' : rp <= 12e6 ? 'sedang' : 'tinggi' };
  FIELDS.forEach(f => facts[f.k] = raw[f.k]);

  // Forward Chaining: Cari rule yang semua kondisinya terpenuhi
  const fired = R.filter(r => Object.entries(r[1]).every(([f, v]) => facts[f] === v));
  const map = {};

  fired.forEach(r => {
    const m = map[r[2]] || (map[r[2]] = { s: 0, ids: [] });
    m.s += Object.keys(r[1]).length;
    m.ids.push(r[0]);
  });

  const rank = Object.entries(map).sort((a, b) => b[1].s - a[1].s);
  const near = R.filter(r => !fired.includes(r))
    .map(r => ({ id: r[0], miss: Object.entries(r[1]).filter(([f, v]) => facts[f] !== v) }))
    .sort((a, b) => a.miss.length - b.miss.length)
    .slice(0, 2);

  return { facts, rp, fired, rank, near };
}

/**
 * Pemeringkatan Tier CPU & GPU
 */
function cpuTier(c) {
  c = String(c || '').toLowerCase();
  if (/i9|ryzen 9|ryzen ai 9|ultra 9|m3 max|m2 max|m1 max/.test(c)) return 4;
  if (/i7|ryzen 7|ultra 7|m3 pro|m2 pro|m4|m3|m2|m1/.test(c)) return 3;
  if (/i5|ryzen 5|ultra 5/.test(c)) return 2;
  return 1;
}

function gpuTier(g) {
  g = String(g || '').toLowerCase();
  if (/rtx\s*4090|rtx\s*4080|rtx\s*a1000/.test(g)) return 3;
  if (/rtx\s*40|rtx\s*30|rtx\s*20|radeon rx/.test(g)) return 2;
  const m = g.match(/apple\s+(\d+)-core/);
  if (m) return +m[1] >= 10 ? 2 : 1;
  if (/arc|iris xe|radeon 6[68]0m|radeon 7[78]0m|radeon 8[08]0m|radeon 890m/.test(g)) return 1;
  return 0;
}

/**
 * Penilaian / Scoring kesesuaian laptop terhadap kebutuhan & anggaran
 */
function scoreLaptops(facts, rp, cats) {
  const want16 = facts.p === 'tinggi' || ['desain', 'multimedia', 'data', 'game'].includes(facts.k);
  const wantGpu = facts.g !== 'rendah' || ['desain', 'multimedia', 'game'].includes(facts.k);
  const creative = facts.k === 'desain' || facts.k === 'multimedia';
  const gaming = facts.k === 'game';

  return merged().map(l => {
    let s = 0;
    const ci = cats.indexOf(l.kat);
    if (ci === 0) s += 48;
    else if (ci > 0) s += 18;

    const ratio = l.harga / rp;
    if (ratio <= 1) s += 20 + Math.max(0, (1 - ratio)) * 14;
    else if (ratio <= 1.08) s += 6;
    else s -= 400 * (ratio - 1);

    const ct = cpuTier(l.cpu), gt = gpuTier(l.gpu);
    if (facts.p === 'tinggi') s += ct >= 3 ? 12 : ct === 2 ? 4 : -8;
    else if (facts.p === 'sedang') s += ct >= 2 ? 8 : 0;
    else s += ct <= 2 ? 4 : -2;

    if (want16) s += l.ram >= 16 ? 14 : l.ram >= 12 ? 5 : -10;
    else s += l.ram >= 8 ? 8 : -5;

    s += wantGpu ? gt * 6 : (gt >= 2 ? -6 : gt === 1 ? 2 : 0);
    s += creative ? (l.ssd >= 1024 ? 8 : l.ssd >= 512 ? 4 : 0) : (l.ssd >= 512 ? 4 : 0);
    if (gaming) {
      s += gt >= 3 ? 32 : gt >= 2 ? 18 : gt === 1 ? 4 : -20;
      s += ct >= 4 ? 14 : ct >= 3 ? 8 : ct >= 2 ? 4 : 0;
      if (facts.b === 'tinggi') s += ratio * 18;
    }
    if (facts.t === 'sangat') s += (l.kat === 'dasar' || l.kat === 'produk') ? 6 : -4;
    if (facts.e === 'sangat') s += (l.kat === 'dasar' || l.kat === 'produk') ? 4 : -2;
    if (facts.k === 'program') s += ct >= 2 ? 6 : 0;
    if (facts.k === 'data') s += l.ram >= 16 ? 8 : 0;

    return { ...l, s };
  });
}

/**
 * Menghasilkan alasan / penjelasan mengapa laptop direkomendasikan
 * berdasarkan kesesuaian spesifikasi dengan kebutuhan pengguna
 */
function getRecommendationReason(l, facts, rp) {
  const reasons = [];

  // 1. Alasan Anggaran
  const diff = rp - l.harga;
  if (diff >= 1000000) {
    reasons.push(`Harga hemat (sisa anggaran sekitar Rp ${Math.round(diff / 100000).toLocaleString('id-ID')}00 ribu)`);
  } else if (diff >= 0) {
    reasons.push('Harga sangat pas dalam batas anggaranmu');
  } else {
    reasons.push('Spesifikasi unggul mendekati plafon anggaranmu');
  }

  // 2. Alasan Kebutuhan Utama & Hardware
  const ct = cpuTier(l.cpu);
  const gt = gpuTier(l.gpu);

  if (facts.k === 'game') {
    if (gt >= 2) reasons.push(`GPU terpisah (${l.gpu.split(' ')[0]} ${l.gpu.split(' ')[1] || ''}) sangat siap untuk gaming berat & FPS mulus`);
    else if (gt === 1) reasons.push('Grafis memadai untuk game kasual, eSports, dan hiburan');
    if (ct >= 3) reasons.push(`Prosesor bertenaga (${l.cpu}) menjamin performa gaming responsif tanpa lag`);
    if (l.ram >= 16) reasons.push(`RAM ${l.ram} GB ideal untuk game modern dan streaming lancar`);
  } else if (facts.k === 'desain' || facts.k === 'multimedia') {
    if (gt >= 2) reasons.push(`GPU terpisah (${l.gpu.split(' ')[0]} ${l.gpu.split(' ')[1] || ''}) sangat mumpuni untuk render & editing video`);
    else if (gt === 1) reasons.push('Grafis terintegrasi generasi modern untuk olah grafis dasar/menengah');
    if (l.ram >= 16) reasons.push(`RAM besar ${l.ram} GB lancar untuk multitasking software kreatif`);
  } else if (facts.k === 'program') {
    if (ct >= 3) reasons.push(`Prosesor bertenaga (${l.cpu}) cepat untuk proses kompilasi kode & emulator`);
    else if (ct === 2) reasons.push(`Prosesor serbaguna (${l.cpu}) memadai untuk coding dan praktikum`);
    if (l.ram >= 16) reasons.push(`RAM ${l.ram} GB siap untuk virtualisasi & container`);
  } else if (facts.k === 'data') {
    if (l.ram >= 16) reasons.push(`RAM ${l.ram} GB optimal mengolah dataset besar tanpa lag`);
    if (ct >= 3) reasons.push(`Kekuatan komputasi CPU (${l.cpu}) tinggi untuk pemrosesan data`);
  } else {
    // Kuliah umum
    if (l.ssd >= 512) reasons.push(`Penyimpanan luas SSD ${stor(l.ssd)} untuk dokumen perkuliahan`);
    else reasons.push('Cepat dan efisien untuk kebutuhan tugas perkuliahan harian');
  }

  // 3. Alasan Portabilitas / Baterai
  if (facts.t === 'sangat' && (l.kat === 'dasar' || l.kat === 'produk')) {
    reasons.push('Desain ramping & portabel, nyaman dibawa kuliah');
  }
  if (facts.e === 'sangat' && (l.kat === 'dasar' || l.kat === 'produk')) {
    reasons.push('Konsumsi daya efisien untuk pemakaian kuliah seharian');
  }

  // Ambil maksimal 2 poin penjelasan yang paling relevan
  const topReasons = reasons.slice(0, 2);
  return topReasons.join(' · ');
}

/**
 * Memilih top-3 rekomendasi laptop terbaik
 */
function pickLaptops(facts, rp, cats) {
  const scored = scoreLaptops(facts, rp, cats).sort((a, b) => b.s - a.s);
  let pool = scored.filter(l => l.harga <= rp * 1.08);
  if (pool.length < 3) pool = scored.filter(l => l.harga <= rp * 1.25);
  if (pool.length < 3) pool = scored;

  const top = [];
  for (const l of pool) {
    if (top.length >= 3) break;
    const dup = top.some(t => t.cpu === l.cpu && t.ram === l.ram && t.ssd === l.ssd && Math.abs(t.harga - l.harga) < 400000);
    if (!dup) top.push(l);
  }
  for (const l of pool) {
    if (top.length >= 3) break;
    if (!top.includes(l)) top.push(l);
  }

  // Sematkan alasan rekomendasi pada masing-masing item
  top.forEach(item => {
    item.alasan = getRecommendationReason(item, facts, rp);
  });

  const over = top.filter(l => l.harga > rp).length;
  const sameType = top.some(l => l.kat === cats[0]);

  top.note = !top.length ? 'Belum ada laptop pada data CSV.' :
    !sameType ? `Belum ada ${CAT[cats[0]].name} yang masuk anggaranmu, jadi berikut alternatif terdekat dari tipe lain.` :
    over === top.length ? 'Semua pilihan masih di atas anggaranmu, ini yang paling mendekati.' :
    over ? `${over} dari ${top.length} pilihan sedikit di atas anggaran.` :
    'Semua pilihan masih masuk anggaranmu.';

  return top;
}
