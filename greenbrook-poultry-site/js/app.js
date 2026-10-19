/* Greenbrook Poultry - views and routing (hash based, no server needed) */
(function () {
  const { CATEGORIES, PURPOSES, LOOKS, Store, esc, money, catFor, catById, ageLabel, statusOf, chickenSVG } = window.Poultry;
  const app = document.getElementById("app");
  const nav = document.getElementById("nav");
  const toastEl = document.getElementById("toast");
  const modalEl = document.getElementById("modal");

  let authed = false;
  try { authed = sessionStorage.getItem("gb.admin") === "1"; } catch (e) {}
  const shopState = { cat: "all", q: "", sort: "featured", onlyAvail: false };
  const adminState = { q: "", cat: "all", confirmDelete: null, loginError: "" };

  /* ---------- helpers ---------- */
  function toast(msg) {
    toastEl.textContent = msg; toastEl.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(() => { toastEl.hidden = true; }, 2400);
  }
  function persistNote(ok) { if (!ok) toast("Saved for this visit only. Browser storage is blocked."); }
  function pic(c) { return c.image ? `<img src="${esc(c.image)}" alt="${esc(c.name)}" loading="lazy">` : chickenSVG(c.look, c.sex); }
  function statusPill(c) { const s = statusOf(c); return `<span class="pill pill-${s.key}">${esc(s.label)}</span>`; }

  function card(c) {
    const s = statusOf(c);
    return `<a class="card" href="#chicken-${esc(c.id)}">
      <div class="card-img tile-${esc(c.category)}">${pic(c)}${statusPill(c)}<span class="pill pill-age">${c.ageMonths} mo</span></div>
      <div class="card-body">
        <h3>${esc(c.name)}</h3>
        <p class="sub">${esc(c.breed)} · ${esc(c.sex)} · ${esc(c.purpose)}</p>
        <p class="sub">${esc(c.description.length > 92 ? c.description.slice(0, 92).trim() + "…" : c.description)}</p>
        <div class="card-foot"><span class="price">${money(c.price)}</span><span class="stock">${s.key === "out" ? "Not in stock" : c.stock + " in stock"}</span></div>
      </div></a>`;
  }

  /* ---------- routing ---------- */
  function route() {
    const h = (location.hash || "#home").slice(1);
    closeModal();
    nav.classList.remove("open");
    let key = "home";
    if (h === "home" || h === "") { renderHome(); }
    else if (h === "shop" || h.startsWith("shop-")) { key = h; renderShop(h === "shop" ? "all" : h.slice(5)); }
    else if (h.startsWith("chicken-")) { key = "shop"; renderDetail(h.slice(8)); }
    else if (h === "admin") { key = "admin"; renderAdmin(); }
    else { renderHome(); }
    nav.querySelectorAll("a").forEach(a => {
      const t = a.getAttribute("href").slice(1);
      if (t === key) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    window.scrollTo(0, 0);
    document.title = "Greenbrook Poultry";
  }

  /* ---------- Home ---------- */
  function renderHome() {
    const S = Store.settings();
    const pub = Store.published();
    let featured = pub.filter(c => c.featured).slice(0, 4);
    if (!featured.length) featured = pub.slice(0, 4);
    const hero = featured[0];
    const counts = CATEGORIES.map(cat => pub.filter(c => c.category === cat.id && c.stock > 0).length);
    app.innerHTML = `
    <section class="hero"><div class="wrap section hero-grid">
      <div>
        <h1>Farm-raised chickens, sorted by age.</h1>
        <p class="lead">${esc(S.farmName)} raises healthy birds on open ground. Pick a bird at 4 months, 5 months, or 6 months and older, and see exactly what you are getting before you visit.</p>
        <div class="hero-actions"><a class="btn" href="#shop">Browse all chickens</a><a class="btn btn-ghost" href="#featured">See featured birds</a></div>
      </div>
      ${hero ? `<div class="hero-art">${pic(hero)}<a class="hero-tag" href="#chicken-${esc(hero.id)}">${esc(hero.name)}<small>${money(hero.price)} · ${hero.ageMonths} months old</small></a></div>` : ""}
    </div></section>

    <section class="section wrap">
      <div class="section-head"><div><h2>Choose by age</h2><p>Birds grow fast between four and six months. The three groups below show how big each one is when you pick it up.</p></div></div>
      <div class="ruler">
        ${CATEGORIES.map((cat, i) => `<a href="#shop-${cat.id}">
          <div class="ruler-stage">${chickenSVG(["rir", "orpington", "barred"][i], i === 2 ? "Rooster" : "Hen")}</div>
          <div><h3>${esc(cat.label)}</h3><p>${esc(cat.blurb)}</p><p class="count">${counts[i]} ${counts[i] === 1 ? "listing" : "listings"} in stock</p></div></a>`).join("")}
      </div>
    </section>

    <section class="section wrap" id="featured" style="padding-top:0">
      <div class="section-head"><div><h2>Featured chickens</h2><p>Hand-picked birds from this week's batches.</p></div><a class="btn btn-ghost btn-sm" href="#shop">View all</a></div>
      ${featured.length ? `<div class="grid">${featured.map(card).join("")}</div>` : `<div class="empty"><h3>No chickens listed yet</h3><p class="muted">New listings appear here as soon as the farm publishes them.</p></div>`}
    </section>

    <section class="section wrap" style="padding-top:0">
      <div class="trio">
        <div><h3>Raised outdoors</h3><p>Every bird spends its days on open ground with shade, clean water and room to scratch.</p></div>
        <div><h3>Checked before sale</h3><p>We check eyes, feet, feathers and weight on every bird. Vaccination status is listed on each page.</p></div>
        <div><h3>Honest listings</h3><p>Age, weight and stock are updated by the farm as birds are reserved, so what you see is what is in the pen.</p></div>
      </div>
    </section>

    <section class="visit"><div class="wrap section visit-grid">
      <div><h2>Visit the farm</h2><p class="muted" style="margin-top:.5rem;max-width:30rem">Online orders are not available. Message or call us to reserve a bird, then pick it up at the farm.</p></div>
      <dl><div><dt>Phone</dt><dd>${esc(S.phone)}</dd></div><div><dt>Location</dt><dd>${esc(S.location)}</dd></div><div><dt>Hours</dt><dd>${esc(S.hours)}</dd></div></dl>
    </div></section>`;
    if (location.hash === "#featured") document.getElementById("featured").scrollIntoView();
  }

  /* ---------- Shop ---------- */
  function renderShop(cat) {
    shopState.cat = cat === "all" || CATEGORIES.some(c => c.id === cat) ? cat : "all";
    const info = shopState.cat === "all" ? null : catById(shopState.cat);
    app.innerHTML = `
    <section class="page-head"><div class="wrap">
      <h1 style="font-size:clamp(1.8rem,4vw,2.6rem)">${info ? esc(info.label) : "All chickens"}</h1>
      <p>${info ? esc(info.blurb) : "Every bird currently listed by the farm. Filter by age, search by breed, or show only what is in stock."}</p>
      <div class="tabs" role="tablist" aria-label="Age category">
        <a class="tab" href="#shop" aria-current="${shopState.cat === "all"}">All ages</a>
        ${CATEGORIES.map(c => `<a class="tab" href="#shop-${c.id}" aria-current="${shopState.cat === c.id}">${esc(c.short)}</a>`).join("")}
      </div>
    </div></section>
    <section class="wrap section" style="padding-top:1.6rem">
      <div class="controls">
        <div class="field grow"><label for="q">Search</label><input id="q" type="search" placeholder="Breed, name or purpose" value="${esc(shopState.q)}"></div>
        <div class="field"><label for="sort">Sort by</label><select id="sort">
          <option value="featured">Featured first</option><option value="price-asc">Price, low to high</option><option value="price-desc">Price, high to low</option><option value="age-asc">Youngest first</option><option value="age-desc">Oldest first</option></select></div>
        <label class="check"><input id="avail" type="checkbox" ${shopState.onlyAvail ? "checked" : ""}> In stock only</label>
      </div>
      <p class="muted" id="count" style="margin-bottom:1rem" aria-live="polite"></p>
      <div id="results"></div>
    </section>`;
    const sort = document.getElementById("sort"); sort.value = shopState.sort;
    const draw = () => {
      shopState.q = document.getElementById("q").value.trim();
      shopState.sort = sort.value; shopState.onlyAvail = document.getElementById("avail").checked;
      const q = shopState.q.toLowerCase();
      let list = Store.published().filter(c => shopState.cat === "all" || c.category === shopState.cat);
      if (q) list = list.filter(c => [c.name, c.breed, c.purpose, c.color, c.sex].join(" ").toLowerCase().includes(q));
      if (shopState.onlyAvail) list = list.filter(c => c.stock > 0);
      const s = shopState.sort;
      list = list.slice().sort((a, b) => s === "price-asc" ? a.price - b.price : s === "price-desc" ? b.price - a.price : s === "age-asc" ? a.ageMonths - b.ageMonths : s === "age-desc" ? b.ageMonths - a.ageMonths : (b.featured - a.featured));
      document.getElementById("count").textContent = list.length + (list.length === 1 ? " chicken" : " chickens");
      document.getElementById("results").innerHTML = list.length
        ? `<div class="grid">${list.map(card).join("")}</div>`
        : `<div class="empty"><h3>No chickens match</h3><p class="muted">Clear the search or turn off "In stock only" to see more birds.</p></div>`;
    };
    ["q", "sort", "avail"].forEach(id => document.getElementById(id).addEventListener(id === "q" ? "input" : "change", draw));
    draw();
  }

  /* ---------- Detail ---------- */
  function renderDetail(id) {
    const c = Store.get(id);
    if (!c || !c.published) {
      app.innerHTML = `<div class="wrap section"><div class="empty"><h3>That chicken is no longer listed</h3><p class="muted" style="margin-bottom:1rem">It may have been sold or removed by the farm.</p><a class="btn" href="#shop">See all chickens</a></div></div>`;
      return;
    }
    const S = Store.settings(), cat = catById(c.category), s = statusOf(c);
    const related = Store.published().filter(x => x.category === c.category && x.id !== c.id).slice(0, 3);
    app.innerHTML = `
    <div class="wrap">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="#home">Home</a> / <a href="#shop">Chickens</a> / <a href="#shop-${cat.id}">${esc(cat.short)}</a> / <span>${esc(c.name)}</span></nav>
      <div class="detail">
        <div class="detail-img tile-${esc(c.category)}">${pic(c)}</div>
        <div class="detail-info">
          <div class="badges">${statusPill(c)}<span class="pill pill-age">${esc(ageLabel(c.ageMonths))}</span></div>
          <h1 style="font-size:clamp(1.8rem,4vw,2.6rem)">${esc(c.name)}</h1>
          <div><span class="price">${money(c.price)}</span> <span class="muted">per bird</span></div>
          <p>${esc(c.description)}</p>
          <dl class="specs">
            <div><dt>Breed</dt><dd>${esc(c.breed)}</dd></div>
            <div><dt>Age</dt><dd>${esc(ageLabel(c.ageMonths))}</dd></div>
            <div><dt>Sex</dt><dd>${esc(c.sex)}</dd></div>
            <div><dt>Weight</dt><dd>${c.weightKg ? esc(c.weightKg) + " kg" : "Not recorded"}</dd></div>
            <div><dt>Color</dt><dd>${esc(c.color || "Not recorded")}</dd></div>
            <div><dt>Best for</dt><dd>${esc(c.purpose)}</dd></div>
            <div><dt>Temperament</dt><dd>${esc(c.temperament || "Not recorded")}</dd></div>
            <div><dt>Vaccinated</dt><dd>${c.vaccinated ? "Yes" : "No"}</dd></div>
            <div><dt>Age group</dt><dd>${esc(cat.label)}</dd></div>
            <div><dt>Availability</dt><dd>${s.key === "out" ? "Sold out" : c.stock + " in stock"}</dd></div>
          </dl>
          <div class="contact-box">
            <strong>${s.key === "out" ? "Ask about the next batch" : "Want to reserve this chicken?"}</strong>
            <span class="num">${esc(S.phone)}</span>
            <small>${esc(S.location)} · ${esc(S.hours)}. We do not take online orders or payments. Contact the farm and mention "${esc(c.name)}".</small>
          </div>
        </div>
      </div>
      ${related.length ? `<section style="padding-bottom:3.5rem"><div class="section-head"><h2>More in ${esc(cat.short)}</h2></div><div class="grid">${related.map(card).join("")}</div></section>` : ""}
    </div>`;
    document.title = c.name + " | Greenbrook Poultry";
  }

  /* ---------- Admin ---------- */
  function renderAdmin() {
    if (!authed) {
      app.innerHTML = `<div class="wrap"><form class="login" id="login">
        <h2>Admin sign in</h2>
        <div class="field"><label for="pw">Password</label><input id="pw" type="password" autocomplete="current-password" required></div>
        ${adminState.loginError ? `<p class="error" role="alert">${esc(adminState.loginError)}</p>` : ""}
        <button class="btn" type="submit">Sign in</button>
        <p class="hint">Starter password: admin123. Change it under Farm details after you sign in.</p></form></div>`;
      document.getElementById("login").addEventListener("submit", e => {
        e.preventDefault();
        if (document.getElementById("pw").value === Store.settings().password) {
          authed = true; adminState.loginError = "";
          try { sessionStorage.setItem("gb.admin", "1"); } catch (err) {}
          renderAdmin();
        } else { adminState.loginError = "That password is not correct. Check it and try again."; renderAdmin(); }
      });
      return;
    }
    const S = Store.settings();
    app.innerHTML = `<div class="wrap section">
      <div class="section-head"><div><h1 style="font-size:clamp(1.8rem,4vw,2.5rem)">Admin dashboard</h1><p>Add, edit, categorize and remove listings. Changes show on the public pages straight away.</p></div>
        <div class="row-actions"><button class="btn" data-act="add">Add chicken</button><button class="btn btn-ghost" data-act="logout">Sign out</button></div></div>
      <div class="tiles" id="tiles"></div>
      <div class="toolbar">
        <div class="field grow"><label for="aq">Search listings</label><input id="aq" type="search" placeholder="Name or breed" value="${esc(adminState.q)}"></div>
        <div class="field"><label for="acat">Age group</label><select id="acat"><option value="all">All groups</option>${CATEGORIES.map(c => `<option value="${c.id}">${esc(c.short)}</option>`).join("")}</select></div>
      </div>
      <div class="table-scroll"><table><thead><tr><th>Chicken</th><th>Age group</th><th>Age (months)</th><th>Price (${window.Poultry.CURRENCY})</th><th>Stock</th><th>Visible</th><th>Actions</th></tr></thead><tbody id="rows"></tbody></table></div>
      <section class="settings"><h2 style="font-size:1.3rem">Farm details</h2><p class="hint">Shown on the home page and on every chicken page.</p>
        <form id="settings"><div class="form-grid">
          <div class="field"><label for="s-name">Farm name</label><input id="s-name" type="text" value="${esc(S.farmName)}"></div>
          <div class="field"><label for="s-phone">Phone</label><input id="s-phone" type="text" value="${esc(S.phone)}"></div>
          <div class="field"><label for="s-loc">Location</label><input id="s-loc" type="text" value="${esc(S.location)}"></div>
          <div class="field"><label for="s-hours">Hours</label><input id="s-hours" type="text" value="${esc(S.hours)}"></div>
          <div class="field"><label for="s-pw">Admin password</label><input id="s-pw" type="text" value="${esc(S.password)}"></div></div>
          <div class="row-actions"><button class="btn" type="submit">Save farm details</button><button class="btn btn-danger" type="button" data-act="reset" id="reset-btn">Restore sample listings</button></div></form></section></div>`;
    document.getElementById("acat").value = adminState.cat;
    document.getElementById("aq").addEventListener("input", e => { adminState.q = e.target.value; drawRows(); });
    document.getElementById("acat").addEventListener("change", e => { adminState.cat = e.target.value; drawRows(); });
    document.getElementById("settings").addEventListener("submit", e => {
      e.preventDefault();
      const pw = document.getElementById("s-pw").value.trim();
      if (!pw) { toast("Password cannot be empty."); return; }
      persistNote(Store.saveSettings({ farmName: val("s-name") || "Greenbrook Poultry Farm", phone: val("s-phone"), location: val("s-loc"), hours: val("s-hours"), password: pw }));
      document.getElementById("brand-name").textContent = Store.settings().farmName;
      toast("Farm details saved");
    });
    drawRows();
  }
  const val = id => document.getElementById(id).value.trim();

  function drawRows() {
    const all = Store.all();
    const tiles = document.getElementById("tiles");
    if (!tiles) return;
    tiles.innerHTML = `<div class="tile"><b>${all.length}</b><span>Listings</span></div>
      <div class="tile"><b>${all.reduce((n, c) => n + Math.max(0, c.stock), 0)}</b><span>Birds in stock</span></div>
      <div class="tile"><b>${all.filter(c => c.published && c.stock > 0).length}</b><span>Available to visitors</span></div>
      <div class="tile"><b>${all.filter(c => c.stock <= 0).length}</b><span>Sold out</span></div>
      <div class="tile"><b>${all.filter(c => !c.published).length}</b><span>Hidden</span></div>`;
    const q = adminState.q.toLowerCase();
    const list = all.filter(c => (adminState.cat === "all" || c.category === adminState.cat) && (!q || (c.name + " " + c.breed).toLowerCase().includes(q)));
    const tbody = document.getElementById("rows");
    if (!list.length) { tbody.innerHTML = `<tr><td colspan="7"><div class="empty" style="border:0">No listings match. Use "Add chicken" to create one.</div></td></tr>`; return; }
    tbody.innerHTML = list.map(c => `<tr data-id="${esc(c.id)}">
      <td><div class="row-name"><div class="thumb tile-${esc(c.category)}">${pic(c)}</div><div><b>${esc(c.name)}</b><small>${esc(c.breed)} · ${esc(c.sex)} ${c.featured ? "· Featured" : ""}</small></div></div></td>
      <td><select data-f="category" aria-label="Age group for ${esc(c.name)}">${CATEGORIES.map(k => `<option value="${k.id}" ${k.id === c.category ? "selected" : ""}>${esc(k.short)}</option>`).join("")}</select></td>
      <td class="num-cell">${c.ageMonths}</td>
      <td><input class="price-in" type="number" min="0" step="10" value="${c.price}" data-f="price" aria-label="Price for ${esc(c.name)}"></td>
      <td><div class="stepper"><button type="button" data-act="stock-" aria-label="Decrease stock">−</button><output>${c.stock}</output><button type="button" data-act="stock+" aria-label="Increase stock">+</button></div> ${statusPill(c)}</td>
      <td><label class="check"><input type="checkbox" data-f="published" ${c.published ? "checked" : ""}><span class="sr-only">Visible to visitors</span>${c.published ? "Shown" : "Hidden"}</label></td>
      <td>${adminState.confirmDelete === c.id
        ? `<div class="row-actions"><button class="btn btn-danger btn-sm" data-act="del-yes">Delete listing</button><button class="btn btn-ghost btn-sm" data-act="del-no">Keep</button></div>`
        : `<div class="row-actions"><button class="btn btn-ghost btn-sm" data-act="edit">Edit</button><button class="btn btn-danger btn-sm" data-act="del">Delete</button></div>`}</td></tr>`).join("");
  }

  /* inline edits in the table */
  app.addEventListener("change", e => {
    const row = e.target.closest("tr[data-id]"); if (!row || !e.target.dataset.f) return;
    const id = row.dataset.id, f = e.target.dataset.f;
    if (f === "price") {
      const v = Math.max(0, Math.round(Number(e.target.value) || 0));
      persistNote(Store.patch(id, { price: v })); toast("Price updated");
    } else if (f === "category") { persistNote(Store.patch(id, { category: e.target.value })); toast("Moved to " + catById(e.target.value).short); }
    else if (f === "published") { persistNote(Store.patch(id, { published: e.target.checked })); toast(e.target.checked ? "Listing is visible" : "Listing hidden"); }
    drawRows();
  });

  app.addEventListener("click", e => {
    const btn = e.target.closest("[data-act]"); if (!btn) return;
    const act = btn.dataset.act, row = btn.closest("tr[data-id]"), id = row && row.dataset.id;
    if (act === "add") openEditor(null);
    else if (act === "edit") openEditor(id);
    else if (act === "logout") { authed = false; try { sessionStorage.removeItem("gb.admin"); } catch (er) {} renderAdmin(); }
    else if (act === "stock+" || act === "stock-") {
      const c = Store.get(id); persistNote(Store.patch(id, { stock: Math.max(0, c.stock + (act === "stock+" ? 1 : -1)) })); drawRows();
    } else if (act === "del") { adminState.confirmDelete = id; drawRows(); }
    else if (act === "del-no") { adminState.confirmDelete = null; drawRows(); }
    else if (act === "del-yes") { persistNote(Store.remove(id)); adminState.confirmDelete = null; drawRows(); toast("Listing deleted"); }
    else if (act === "reset") {
      if (btn.dataset.armed) { Store.reset(); adminState.confirmDelete = null; renderAdmin(); toast("Sample listings restored"); }
      else { btn.dataset.armed = "1"; btn.textContent = "Click again to replace all listings"; setTimeout(() => { btn.dataset.armed = ""; btn.textContent = "Restore sample listings"; }, 4000); }
    }
  });

  /* ---------- Editor modal ---------- */
  function closeModal() { modalEl.hidden = true; modalEl.innerHTML = ""; }
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !modalEl.hidden) closeModal(); });

  function openEditor(id) {
    const base = { id: Store.newId(), name: "", breed: "", look: "rir", sex: "Hen", ageMonths: 4, category: "4", price: 500, stock: 1, weightKg: "", color: "", purpose: "Eggs", temperament: "", vaccinated: true, featured: false, published: true, description: "", image: null };
    const c = id ? Object.assign({}, Store.get(id)) : base;
    let image = c.image || null, catTouched = !!id;
    const opt = (list, cur) => list.map(v => `<option ${v === cur ? "selected" : ""}>${esc(v)}</option>`).join("");
    modalEl.hidden = false;
    modalEl.innerHTML = `<div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="m-title"><form id="editor">
      <h2 id="m-title">${id ? "Edit chicken" : "Add chicken"}</h2><p class="hint">Fields marked with * are required.</p>
      <div class="form-grid">
        <div class="field full"><label for="e-name">Listing name *</label><input id="e-name" type="text" value="${esc(c.name)}" placeholder="Rhode Island Red Pullet" required></div>
        <div class="field"><label for="e-breed">Breed *</label><input id="e-breed" type="text" value="${esc(c.breed)}" required></div>
        <div class="field"><label for="e-sex">Sex</label><select id="e-sex">${opt(["Hen", "Rooster"], c.sex)}</select></div>
        <div class="field"><label for="e-age">Age in months *</label><input id="e-age" type="number" min="1" max="60" value="${c.ageMonths}" required></div>
        <div class="field"><label for="e-cat">Age group</label><select id="e-cat">${CATEGORIES.map(k => `<option value="${k.id}" ${k.id === c.category ? "selected" : ""}>${esc(k.label)}</option>`).join("")}</select></div>
        <div class="field"><label for="e-price">Price (${window.Poultry.CURRENCY}) *</label><input id="e-price" type="number" min="0" step="10" value="${c.price}" required></div>
        <div class="field"><label for="e-stock">Stock (birds) *</label><input id="e-stock" type="number" min="0" step="1" value="${c.stock}" required></div>
        <div class="field"><label for="e-weight">Weight (kg)</label><input id="e-weight" type="number" min="0" step="0.1" value="${esc(c.weightKg)}"></div>
        <div class="field"><label for="e-purpose">Best for</label><select id="e-purpose">${opt(PURPOSES, c.purpose)}</select></div>
        <div class="field"><label for="e-color">Color and markings</label><input id="e-color" type="text" value="${esc(c.color)}"></div>
        <div class="field"><label for="e-temp">Temperament</label><input id="e-temp" type="text" value="${esc(c.temperament)}"></div>
        <div class="field full"><label for="e-desc">Description</label><textarea id="e-desc">${esc(c.description)}</textarea></div>
        <div class="field full"><span>Photo</span>
          <div class="photo-row"><div class="thumb tile-4" id="e-prev"></div>
            <div style="display:grid;gap:.5rem"><label class="btn btn-ghost btn-sm" for="e-file">Upload photo</label><input id="e-file" type="file" accept="image/*" class="sr-only"><button type="button" class="btn btn-ghost btn-sm" id="e-rm">Use illustration instead</button></div>
            <div class="field" style="flex:1 1 200px"><label for="e-look">Illustration style</label><select id="e-look">${Object.keys(LOOKS).map(k => `<option value="${k}" ${k === c.look ? "selected" : ""}>${esc(LOOKS[k].label)}</option>`).join("")}</select></div></div></div>
        <label class="check"><input id="e-vax" type="checkbox" ${c.vaccinated ? "checked" : ""}> Vaccinated</label>
        <label class="check"><input id="e-feat" type="checkbox" ${c.featured ? "checked" : ""}> Featured on home page</label>
        <label class="check"><input id="e-pub" type="checkbox" ${c.published ? "checked" : ""}> Visible to visitors</label>
      </div>
      <p class="error" id="e-err" role="alert" hidden></p>
      <div class="modal-actions"><button type="button" class="btn btn-ghost" id="e-cancel">Cancel</button><button type="submit" class="btn">${id ? "Save changes" : "Add listing"}</button></div></form></div>`;
    const $ = i => document.getElementById(i);
    const preview = () => { $("e-prev").innerHTML = image ? `<img src="${esc(image)}" alt="Preview">` : chickenSVG($("e-look").value, $("e-sex").value); $("e-rm").hidden = !image; };
    preview();
    $("e-look").addEventListener("change", preview); $("e-sex").addEventListener("change", preview);
    $("e-rm").addEventListener("click", () => { image = null; $("e-file").value = ""; preview(); });
    $("e-cancel").addEventListener("click", closeModal);
    modalEl.addEventListener("click", ev => { if (ev.target === modalEl) closeModal(); }, { once: true });
    $("e-cat").addEventListener("change", () => { catTouched = true; });
    $("e-age").addEventListener("input", () => { const m = parseInt($("e-age").value, 10); if (!catTouched && m > 0) $("e-cat").value = catFor(m); });
    $("e-file").addEventListener("change", ev => {
      const f = ev.target.files[0]; if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const max = 900, k = Math.min(1, max / Math.max(img.width, img.height));
          const cv = document.createElement("canvas"); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
          cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
          image = cv.toDataURL("image/jpeg", 0.8); preview();
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(f);
    });
    $("editor").addEventListener("submit", ev => {
      ev.preventDefault();
      const err = $("e-err");
      const name = $("e-name").value.trim(), breed = $("e-breed").value.trim();
      const age = parseInt($("e-age").value, 10), price = Number($("e-price").value), stock = parseInt($("e-stock").value, 10);
      if (!name || !breed) { err.textContent = "Enter a listing name and a breed."; err.hidden = false; return; }
      if (!(age >= 1) || !(price >= 0) || !(stock >= 0)) { err.textContent = "Age must be at least 1 month. Price and stock cannot be negative."; err.hidden = false; return; }
      const saved = Object.assign(c, { name, breed, sex: $("e-sex").value, ageMonths: age, category: $("e-cat").value, price: Math.round(price), stock,
        weightKg: $("e-weight").value, color: $("e-color").value.trim(), purpose: $("e-purpose").value, temperament: $("e-temp").value.trim(),
        description: $("e-desc").value.trim(), look: $("e-look").value, image, vaccinated: $("e-vax").checked, featured: $("e-feat").checked, published: $("e-pub").checked });
      persistNote(Store.upsert(saved)); closeModal(); drawRows(); toast(id ? "Listing saved" : "Listing added");
    });
    $("e-name").focus();
  }

  /* ---------- boot ---------- */
  document.getElementById("menu-btn").addEventListener("click", () => nav.classList.toggle("open"));
  document.getElementById("brand-name").textContent = Store.settings().farmName;
  document.getElementById("year").textContent = new Date().getFullYear();
  window.addEventListener("hashchange", route);
  route();
})();
