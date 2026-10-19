/* Greenbrook Poultry - data layer
   Stores listings in the browser (localStorage). No server needed.
   To change the currency or farm name, edit the constants below. */
(function () {
  const CURRENCY = "₱";
  const STORAGE_KEY = "greenbrook.chickens.v1";
  const SETTINGS_KEY = "greenbrook.settings.v1";

  const CATEGORIES = [
    { id: "4", label: "4-month-old chickens", short: "4 months", blurb: "Young birds that are fully feathered and settling into their first laying or growing season." },
    { id: "5", label: "5-month-old chickens", short: "5 months", blurb: "Near point-of-lay hens and well-grown cockerels, strong and used to free range." },
    { id: "6", label: "6-month-old chickens and older", short: "6 months +", blurb: "Mature layers, breeding stock and roosters, ready to work from day one." }
  ];

  const PURPOSES = ["Eggs", "Meat", "Dual purpose", "Breeding", "Ornamental"];

  /* Colors used to draw the illustration when a listing has no photo. */
  const LOOKS = {
    rir:        { label: "Rhode Island Red", body: "#A5421F", wing: "#7E2D12", tail: "#2B1A12", comb: "#D8343A", pattern: "solid" },
    barred:     { label: "Barred Rock",      body: "#9AA0A8", wing: "#6D737B", tail: "#3A3F45", comb: "#D8343A", pattern: "barred" },
    sussex:     { label: "Light Sussex",     body: "#F7F3E7", wing: "#E8E0C8", tail: "#2A2A2A", comb: "#D8343A", pattern: "solid" },
    australorp: { label: "Black Australorp", body: "#2F3B3B", wing: "#202B2B", tail: "#162020", comb: "#C92F3B", pattern: "solid" },
    orpington:  { label: "Buff Orpington",   body: "#E5AC4D", wing: "#C98A2E", tail: "#8A5A1E", comb: "#D8343A", pattern: "fluffy" },
    brahma:     { label: "Light Brahma",     body: "#DEDACB", wing: "#BDB8A4", tail: "#2F2F2F", comb: "#C9363F", pattern: "fluffy" },
  };

  const SEED = [
    { id: "c1", name: "Rhode Island Red Pullet", breed: "Rhode Island Red", look: "rir", image:"CHuken pic/Rhode Island Red Pullet.jpg", sex: "Hen", ageMonths: 6, category: "6", price: 720, stock: 8, weightKg: 1.6, color: "Deep mahogany red", purpose: "Eggs", temperament: "Active, hardy", vaccinated: true, featured: true, published: true,
      description: "A sturdy young pullet from a proven laying line. Raised on open ground, fully feathered and eating layer-grower feed. Expect first eggs in about six to eight weeks." },
    { id: "c2", name: "Barred Rock Pullet", breed: "Plymouth Barred Rock", look: "barred", image:"CHuken pic/Barred Rock Pullet.png", sex: "Hen", ageMonths: 6, category: "6", price: 760, stock: 5, weightKg: 1.7, color: "Black and white barring", purpose: "Dual purpose", temperament: "Calm, friendly", vaccinated: true, featured: false, published: true,
      description: "Good-natured and easy to handle. Barred Rocks lay large brown eggs through most of the year and grow into a solid table bird." },
    { id: "c3", name: "Light Sussex Pullet", breed: "Light Sussex", look: "sussex", image:"CHuken pic/Light Sussex Pullet.jpg", sex: "Hen", ageMonths: 4, category: "4", price: 600, stock: 2, weightKg: 1.8, color: "White body, black hackle", purpose: "Dual purpose", temperament: "Curious, gentle", vaccinated: true, featured: false, published: true,
      description: "A classic dual-purpose breed with a deep body and a calm nature. Only two left from this batch." },
    { id: "c4", name: "Black Australorp Pullet", breed: "Australorp", look: "australorp", image:"CHuken pic/Black Australorp Pullet.jpg", sex: "Hen", ageMonths: 4, category: "4", price: 580, stock: 6, weightKg: 1.7, color: "Glossy black with green sheen", purpose: "Eggs", temperament: "Quiet, docile", vaccinated: true, featured: false, published: true,
      description: "Known for steady egg production and a quiet temperament. Handles heat well and does fine in a small run." },
    { id: "c5", name: "Buff Orpington Hen", breed: "Buff Orpington", look: "orpington", image:"CHuken pic/Buff Orpington Hen.jpg", sex: "Hen", ageMonths: 5, category: "5", price: 720, stock: 4, weightKg: 2.3, color: "Golden buff", purpose: "Dual purpose", temperament: "Very gentle", vaccinated: true, featured: true, published: true,
      description: "Fluffy, golden and friendly. A good first chicken for families, and a reliable layer of medium brown eggs." },
    { id: "c6", name: "Light Brahma Hen", breed: "Light Brahma", look: "brahma", image:"CHuken pic/Light Brahma Hen.jpg", sex: "Hen", ageMonths: 5, category: "5", price: 850, stock: 3, weightKg: 2.8, color: "White with black pencilled neck", purpose: "Meat", temperament: "Calm, large", vaccinated: true, featured: false, published: true,
      description: "One of the largest breeds we raise. Slow and steady grower with feathered legs and a very relaxed temperament." },

  ];

  const DEFAULT_SETTINGS = {
    farmName: "Greenbrook Poultry Farm",
    phone: "+63 900 000 0000",
    location: "Ecoland Drive, Matina, Davao City",
    hours: "Mon to Sat, 7:00 AM to 5:00 PM",
    password: "admin123"
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* storage blocked */ }
    return fallback;
  }
  let memory = { chickens: null, settings: null };
  function write(key, value, slot) {
    memory[slot] = value;
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }

  const Store = {
    all() {
      if (!memory.chickens) memory.chickens = read(STORAGE_KEY, null) || JSON.parse(JSON.stringify(SEED));
      return memory.chickens;
    },
    published() { return Store.all().filter(c => c.published); },
    get(id) { return Store.all().find(c => c.id === id); },
    save(list) { return write(STORAGE_KEY, list, "chickens"); },
    upsert(item) {
      const list = Store.all();
      const i = list.findIndex(c => c.id === item.id);
      if (i >= 0) list[i] = item; else list.unshift(item);
      return Store.save(list);
    },
    remove(id) { return Store.save(Store.all().filter(c => c.id !== id)); },
    patch(id, fields) {
      const c = Store.get(id);
      if (!c) return false;
      Object.assign(c, fields);
      return Store.save(Store.all());
    },
    reset() { memory.chickens = null; try { localStorage.removeItem(STORAGE_KEY); } catch (e) {} },
    newId() { return "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); },
    settings() {
      if (!memory.settings) memory.settings = Object.assign({}, DEFAULT_SETTINGS, read(SETTINGS_KEY, {}));
      return memory.settings;
    },
    saveSettings(s) { return write(SETTINGS_KEY, s, "settings"); }
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  }
  function money(n) { return CURRENCY + Number(n || 0).toLocaleString("en-US"); }
  function catFor(months) { return months >= 6 ? "6" : months <= 4 ? "4" : "5"; }
  function catById(id) { return CATEGORIES.find(c => c.id === id) || CATEGORIES[0]; }
  function ageLabel(m) { return m + (m === 1 ? " month" : " months") + " old"; }
  function statusOf(c) {
    if (c.stock <= 0) return { key: "out", label: "Sold out" };
    if (c.stock <= 2) return { key: "low", label: "Only " + c.stock + " left" };
    return { key: "ok", label: "Available" };
  }

  /* Illustration, drawn facing left. */
  let uid = 0;
  function chickenSVG(lookKey, sex) {
    const L = LOOKS[lookKey] || LOOKS.rir;
    const id = "cp" + (++uid);
    const rooster = sex === "Rooster";
    const fluffy = L.pattern === "fluffy";
    const bodyRx = fluffy ? 104 : 96, bodyRy = fluffy ? 80 : 72;
    let pattern = "";
    if (L.pattern === "barred") {
      for (let x = 90; x < 330; x += 22) pattern += `<line x1="${x}" y1="90" x2="${x + 40}" y2="260" stroke="${L.tail}" stroke-opacity=".38" stroke-width="9"/>`;
    } else if (L.pattern === "spots") {
      [[160,150],[200,130],[240,165],[190,200],[255,205],[150,190],[225,235],[285,150]].forEach(p => pattern += `<circle cx="${p[0]}" cy="${p[1]}" r="7" fill="${L.tail}" fill-opacity=".45"/>`);
    }
    const tail = rooster
      ? `<path d="M290 150 C350 110 372 40 330 20 C340 70 310 100 285 120Z" fill="${L.tail}"/><path d="M292 160 C360 140 392 90 372 60 C368 105 330 135 290 140Z" fill="${L.wing}"/><path d="M290 170 C340 175 378 150 386 118 C360 150 330 160 288 156Z" fill="${L.tail}"/>`
      : `<path d="M292 150 C340 120 360 85 350 55 C335 90 315 108 285 122Z" fill="${L.tail}"/><path d="M292 165 C350 150 376 120 372 92 C355 125 325 140 288 146Z" fill="${L.wing}"/>`;
    const comb = rooster
      ? `<path d="M96 66 q4-30 18-14 q6-26 20-6 q14-20 18 8 q12 0 8 18z" fill="${L.comb}"/>`
      : `<circle cx="108" cy="70" r="11" fill="${L.comb}"/><circle cx="124" cy="63" r="12" fill="${L.comb}"/><circle cx="141" cy="70" r="10" fill="${L.comb}"/>`;
    const legFluff = fluffy ? `<ellipse cx="188" cy="252" rx="17" ry="14" fill="${L.wing}"/><ellipse cx="232" cy="252" rx="17" ry="14" fill="${L.wing}"/>` : "";
    return `<svg viewBox="0 0 420 310" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(L.label)} illustration" class="chicken-svg">
<defs><clipPath id="${id}"><ellipse cx="208" cy="175" rx="${bodyRx}" ry="${bodyRy}"/></clipPath></defs>
<ellipse cx="210" cy="288" rx="120" ry="9" fill="#000" fill-opacity=".12"/>
${tail}
<g stroke="#D9A441" stroke-width="7" stroke-linecap="round" fill="none"><path d="M190 238 V280 M190 280 l-14 4 M190 280 l14 4"/><path d="M232 238 V280 M232 280 l-14 4 M232 280 l14 4"/></g>
${legFluff}
<ellipse cx="136" cy="135" rx="30" ry="46" transform="rotate(-18 136 135)" fill="${L.body}"/>
<ellipse cx="208" cy="175" rx="${bodyRx}" ry="${bodyRy}" fill="${L.body}"/>
<g clip-path="url(#${id})">${pattern}</g>
<path d="M170 168 C200 130 280 140 292 176 C282 216 220 226 176 204Z" fill="${L.wing}"/>
<path d="M190 176 q40-18 80 0 M196 192 q36-12 66 0" stroke="${L.body}" stroke-opacity=".5" stroke-width="3" fill="none" stroke-linecap="round"/>
<circle cx="118" cy="98" r="30" fill="${L.body}"/>
${comb}
<path d="M92 94 L62 106 L92 116Z" fill="#E8B84A"/>
<ellipse cx="102" cy="128" rx="8" ry="15" fill="${L.comb}"/>
<circle cx="110" cy="92" r="4.5" fill="#1C1C1C"/><circle cx="111.5" cy="90.5" r="1.4" fill="#fff"/>
</svg>`;
  }

  window.Poultry = { CURRENCY, CATEGORIES, PURPOSES, LOOKS, Store, esc, money, catFor, catById, ageLabel, statusOf, chickenSVG };
})();
