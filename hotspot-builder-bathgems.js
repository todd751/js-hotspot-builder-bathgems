
/* ═══════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════ */
let hotspots = [];
let selectedId = null;
let mode = 'place';
let previewMode = false; // V7: inline preview state

/* ═══════════════════════════════════════════════
   V2 SITE CONFIG — swap this block for BathGems build
═══════════════════════════════════════════════ */
const SITE = {
  key: 'bathgems',
  name: 'BathGems',
  domain: 'bathgems.com',
  vocab: {
    room: ['primary-bath','powder-room','guest-bath','small-bathroom'],
    aesthetic: ['modern','mid-century-modern','transitional','farmhouse','rustic','shaker','traditional','antique-vintage','organic-modern','art-deco'],
    mood: ['spa-like','light-bright','clean','warm','moody','dramatic','luxe','airy','natural'],
    palette: ['white','gray','black','navy','green','pink','natural-wood','white-oak','walnut','marble','brass','champagne-bronze','matte-black','brushed-nickel','chrome'],
    product_type: ['bathroom-vanity','vanity-cabinet','linen-tower','medicine-cabinet','wall-cabinet','bathroom-mirror','led-mirror','vessel-sink','vanity-top'],
    size: ['18-inch','20-inch','24-inch','28-inch','30-inch','36-inch','40-inch','42-inch','48-inch','54-inch','60-inch','72-inch','84-inch','96-inch'],
    sink_count: ['single-sink','double-sink','no-sink'],
    mount: ['floating','freestanding','wall-mounted','other']
  },
  extraDims: ['size','sink_count','mount'],
  productTypeKeywords: {
    'bathroom-vanity':['bathroom vanity','vanity set','vanity ',' vanities'],
    'vanity-cabinet':['vanity cabinet','cabinet only','base cabinet'],
    'linen-tower':['linen tower','linen cabinet','linen storage'],
    'medicine-cabinet':['medicine cabinet','recessed cabinet'],
    'wall-cabinet':['wall cabinet','wall-mounted cabinet','wall storage'],
    'bathroom-mirror':['mirror'],
    'led-mirror':['led mirror','lighted mirror','backlit mirror','illuminated mirror'],
    'vessel-sink':['vessel sink','vessel bowl','sink bowl','basin sink','above counter sink'],
    'vanity-top':['vanity top','countertop','stone top','marble top','quartz top','carrara top']
  },
  productTypeToRoom: {
    'bathroom-vanity':'primary-bath','vanity-cabinet':'primary-bath','linen-tower':'primary-bath',
    'medicine-cabinet':'primary-bath','wall-cabinet':'primary-bath','bathroom-mirror':'primary-bath',
    'led-mirror':'primary-bath','vessel-sink':'primary-bath','vanity-top':'primary-bath'
  }
};
let handleEdited = false;

// Defaults — loaded from localStorage if saved
const PRESET_COLORS = ['#bf5a28','#1c1c1c','#c09836','#5c7a52','#4a7fb5','#8b3a6b','#efefef','#d2c9c3','#bc9879'];

/* ─────────────────────────────────────────────────────────────────────
   V12: Embed credit ("Powered by ...") — change here to update everywhere.
   The link text is FIXED and must not be edited. Only the URL is meant to
   be swappable later. Output as dofollow (no rel="nofollow"), new tab, secured.
───────────────────────────────────────────────────────────────────── */
const CREDIT_URL  = 'https://bathgems.com/pages/hotspot-tool';
const CREDIT_TEXT = 'BathGems Hotspot Builder';

const FONT_OPTIONS = ['Garamond','Roboto','Arial','Helvetica','Georgia','Times New Roman','Verdana','Tahoma','Trebuchet MS','Courier New','Cormorant Garamond','Inter','Lato','Open Sans','Montserrat'];
const MAX_TITLE_CHARS = 72;
let defaults = {
  color: localStorage.getItem('hs_color') || '#bc9879',
  size:  parseInt(localStorage.getItem('hs_size')  || '16'),
  popup: localStorage.getItem('hs_popup') || 'minimal',
  // V7: separate fonts for Title and Price (falls back to old hs_popFont for upgraders)
  popTitleFont: localStorage.getItem('hs_popTitleFont') || localStorage.getItem('hs_popFont') || 'Roboto',
  popPriceFont: localStorage.getItem('hs_popPriceFont') || localStorage.getItem('hs_popFont') || 'Roboto',
  popTitleSize: parseInt(localStorage.getItem('hs_popTitleSize') || '12'),
  popPriceSize: parseInt(localStorage.getItem('hs_popPriceSize') || '11'),
  popTitleBold:      localStorage.getItem('hs_popTitleBold')      !== 'false', // default true
  popTitleItalic:    localStorage.getItem('hs_popTitleItalic')    === 'true',
  popTitleUnderline: localStorage.getItem('hs_popTitleUnderline') === 'true',
  popPriceBold:      localStorage.getItem('hs_popPriceBold')      === 'true',
  popPriceItalic:    localStorage.getItem('hs_popPriceItalic')    !== 'false', // default true
  popPriceUnderline: localStorage.getItem('hs_popPriceUnderline') === 'true',
  showPlus:          localStorage.getItem('hs_showPlus')          === 'true',  // V8: default false
  imageAlt:          localStorage.getItem('hs_imageAlt')          || 'Shop this look', // V8
  imageTitle:        '' // V2: metaobject title (not persisted — should be per-image)
};

// V5: image overlay (logo or text) state
let overlay = {
  enabled:       localStorage.getItem('ovr_enabled')       === 'true',
  mode:          localStorage.getItem('ovr_mode')          || 'text',     // 'text' | 'logo'
  position:      localStorage.getItem('ovr_position')      || 'br',       // tl,tc,tr,bl,bc,br
  text:          localStorage.getItem('ovr_text')          || '',
  textFont:      localStorage.getItem('ovr_textFont')      || 'Arial',
  textSize:      parseInt(localStorage.getItem('ovr_textSize') || '18'),
  textBold:      localStorage.getItem('ovr_textBold')      === 'true',
  textItalic:    localStorage.getItem('ovr_textItalic')    === 'true',
  textUnderline: localStorage.getItem('ovr_textUnderline') === 'true',
  textStyle:     localStorage.getItem('ovr_textStyle')     || 'overlay',  // overlay,light,dark,pill
  logoSrc:       localStorage.getItem('ovr_logoSrc')       || '',
  hyperlink:     localStorage.getItem('ovr_hyperlink')     || ''
};
const OVERLAY_MAX_CHARS = 35;

// HTML escape helpers
function escHTML(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// Position CSS for overlay (corners + center top/bottom)
function overlayPosCSS(pos) {
  switch (pos) {
    case 'tl': return 'top:3%;left:3%;';
    case 'tc': return 'top:3%;left:50%;transform:translateX(-50%);';
    case 'tr': return 'top:3%;right:3%;';
    case 'bl': return 'bottom:3%;left:3%;';
    case 'bc': return 'bottom:3%;left:50%;transform:translateX(-50%);';
    case 'br': default: return 'bottom:3%;right:3%;';
  }
}
// Text-style background CSS
function overlayTextStyleCSS(style) {
  switch (style) {
    case 'light': return 'background:rgba(255,255,255,0.88);color:#1c1c1c;padding:6px 14px;border-radius:3px;box-shadow:0 2px 12px rgba(0,0,0,0.15);';
    case 'dark':  return 'background:rgba(10,8,6,0.7);color:#ffffff;padding:6px 14px;border-radius:3px;box-shadow:0 4px 18px rgba(0,0,0,0.45);';
    case 'pill':  return 'background:rgba(255,255,255,0.18);-webkit-backdrop-filter:blur(10px) saturate(140%);backdrop-filter:blur(10px) saturate(140%);color:#ffffff;padding:5px 18px;border-radius:999px;border:1px solid rgba(255,255,255,0.28);';
    case 'overlay': default: return 'color:#ffffff;text-shadow:0 2px 6px rgba(0,0,0,0.75),0 0 18px rgba(0,0,0,0.45);padding:4px 8px;';
  }
}
// Inline CSS for overlay text (B/I/U + size)
function overlayTextInlineCSS(o) {
  return 'font-weight:' + (o.textBold ? '700' : '400') +
         ';font-style:' + (o.textItalic ? 'italic' : 'normal') +
         ';text-decoration:' + (o.textUnderline ? 'underline' : 'none') +
         ';font-size:' + o.textSize + 'px;line-height:1.2;letter-spacing:0.02em;';
}
// Build the overlay HTML string (used by builder, preview, output)
function buildOverlayHTML(o) {
  if (!o || !o.enabled) return '';
  // Logo src + hyperlink go through the same cleanup as product URLs (auto-adds https://)
  const logoSrcClean = normalizeURLAllowBlank(o.logoSrc);
  const linkClean    = normalizeURLAllowBlank(o.hyperlink);
  if (o.mode === 'text' && !(o.text || '').trim()) return '';
  if (o.mode === 'logo' && !logoSrcClean) return '';
  const pos = overlayPosCSS(o.position);
  let css = 'position:absolute;z-index:4;pointer-events:auto;line-height:1;' + pos;
  let inner;
  if (o.mode === 'logo') {
    css += 'max-width:18%;max-height:14%;';
    inner = '<img src="' + escHTML(logoSrcClean) + '" alt="" style="display:block;width:auto;height:auto;max-width:100%;max-height:100%;object-fit:contain;">';
  } else {
    css += overlayTextStyleCSS(o.textStyle) + 'font-family:' + fontStack(o.textFont) + ';' + overlayTextInlineCSS(o);
    inner = escHTML(o.text);
  }
  if (linkClean) {
    return '<a href="' + escHTML(linkClean) + '" target="_blank" rel="noopener" class="si-img-overlay" style="text-decoration:inherit;color:inherit;display:inline-block;' + css + '">' + inner + '</a>';
  }
  return '<div class="si-img-overlay" style="' + css + '">' + inner + '</div>';
}

// Map font name → CSS font-family stack with generic fallback
// Uses SINGLE quotes so it can be safely embedded in HTML style="..." attributes
function fontStack(name) {
  const serifFonts = ['Garamond','Cormorant Garamond','Georgia','Times New Roman'];
  const monoFonts  = ['Courier New'];
  const generic = serifFonts.indexOf(name) > -1 ? 'serif' : monoFonts.indexOf(name) > -1 ? 'monospace' : 'sans-serif';
  return "'" + name + "'," + generic;
}
// Build inline CSS for title/price block — V7: per-block font-family included
function popInlineCSS(prefix) {
  const font      = defaults['pop'+prefix+'Font']      || 'Roboto';
  const bold      = defaults['pop'+prefix+'Bold'];
  const italic    = defaults['pop'+prefix+'Italic'];
  const underline = defaults['pop'+prefix+'Underline'];
  const size      = defaults['pop'+prefix+'Size'];
  return 'font-family:'+fontStack(font)+';font-weight:'+(bold?'700':'400')+';font-style:'+(italic?'italic':'normal')+';text-decoration:'+(underline?'underline':'none')+';font-size:'+size+'px;';
}

/* ═══════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════ */
function init() {
  buildDefaultSwatches();
  buildFontDropdownFor('Title');
  buildFontDropdownFor('Price');
  buildOverlayFontDropdown();
  syncDefaultUI();
  syncPopStyleToggles();
  syncOverlayUI();
  buildEditSwatches();
  buildEditRingSwatches();
}

// V7: parameterized font dropdown for Title or Price
function buildFontDropdownFor(prefix) {
  const sel = document.getElementById('pop-' + prefix.toLowerCase() + '-font');
  if (!sel) return;
  sel.innerHTML = '';
  const current = defaults['pop' + prefix + 'Font'];
  FONT_OPTIONS.forEach(f => {
    const o = document.createElement('option');
    o.value = f; o.textContent = f;
    o.style.fontFamily = f;
    if (f === current) o.selected = true;
    sel.appendChild(o);
  });
}
function updatePopFontFor(prefix, v) {
  defaults['pop' + prefix + 'Font'] = v;
  if (previewMode) renderHotspots(); // live update in preview mode
}
function updatePopTitleSize(v) {
  defaults.popTitleSize = parseInt(v);
  document.getElementById('pop-title-size-val').textContent = v + 'px';
}
function updatePopPriceSize(v) {
  defaults.popPriceSize = parseInt(v);
  document.getElementById('pop-price-size-val').textContent = v + 'px';
}
function togglePopStyle(key, btn) {
  const k = 'pop' + key;
  defaults[k] = !defaults[k];
  btn.classList.toggle('active', defaults[k]);
}
function syncPopStyleToggles() {
  const m = {
    'pop-title-b': defaults.popTitleBold,
    'pop-title-i': defaults.popTitleItalic,
    'pop-title-u': defaults.popTitleUnderline,
    'pop-price-b': defaults.popPriceBold,
    'pop-price-i': defaults.popPriceItalic,
    'pop-price-u': defaults.popPriceUnderline
  };
  Object.keys(m).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('active', m[id]);
  });
}
function updateNameCounter() {
  const el = document.getElementById('e-name');
  const w  = document.getElementById('e-name-warn');
  if (!el || !w) return;
  const len = el.value.length;
  w.textContent = len + ' / ' + MAX_TITLE_CHARS + ' characters' + (len >= MAX_TITLE_CHARS ? ' — text will be cut off!' : '');
  w.classList.toggle('over', len >= MAX_TITLE_CHARS);
}

function updateShowPlus(v) {
  defaults.showPlus = !!v;
  renderHotspots();
}

/* ─────────────────────────────────────────────────────────────────────
   V10: Auto-fill Title + Price from Shopify product URLs
   Shopify exposes /products/{handle}.js with CORS:* — no proxy needed.
   Triggered on blur of the Product URL field. Silent on failure.
   Only fills empty fields — never overwrites the user's typing.
───────────────────────────────────────────────────────────────────── */
async function autoFillFromShopify(rawURL) {
  const url = (rawURL || '').trim();
  if (!url) return;
  // Normalize to a real URL — protocol optional
  let full = url;
  if (!/^https?:\/\//i.test(full)) full = (full.startsWith('//') ? 'https:' : 'https://') + full.replace(/^\/+/, '');
  let parsed;
  try { parsed = new URL(full); } catch (e) { return; }

  // Match /products/{handle} (Shopify handles are lowercase alphanumeric + dashes)
  const m = parsed.pathname.match(/\/products\/([a-z0-9][a-z0-9-]*)/i);
  if (!m) return;
  const handle  = m[1];
  const jsonURL = parsed.origin + '/products/' + handle + '.js';

  let product;
  try {
    const res = await fetch(jsonURL, { method: 'GET', credentials: 'omit' });
    if (!res.ok) return;
    product = await res.json();
  } catch (e) { return; } // CORS blocked, network error, or non-Shopify host → silent

  if (!product || !product.title) return;

  const h = getSelected();
  if (!h) return;

  // V2: store Shopify tags + product_type on the hotspot for auto-inference
  h.shopifyTags = Array.isArray(product.tags) ? product.tags.map(t => String(t).toLowerCase()) : [];
  h.shopifyProductType = String(product.product_type || '').toLowerCase();

  const nameEl  = document.getElementById('e-name');
  const priceEl = document.getElementById('e-price');
  let filledSomething = false;

  // Fill Title only if currently empty
  if (!h.name && nameEl && !nameEl.value.trim()) {
    let title = String(product.title).slice(0, MAX_TITLE_CHARS); // respect 72-char cap
    h.name = title;
    nameEl.value = title;
    filledSomething = true;
  }

  // Fill Price only if currently empty. Shopify .js price is integer cents.
  if (!h.price && priceEl && !priceEl.value.trim() && typeof product.price === 'number') {
    const priceStr = '$' + (product.price / 100).toFixed(2).replace(/\.00$/, '');
    h.price = priceStr;
    priceEl.value = priceStr;
    filledSomething = true;
  }

  if (filledSomething) {
    updateNameCounter();
    renderHotspots(); renderList();
    showAutoFillBadge();
  }
}

function showAutoFillBadge() {
  let badge = document.getElementById('autofill-badge');
  if (!badge) {
    const urlInput = document.getElementById('e-url');
    if (!urlInput) return;
    badge = document.createElement('div');
    badge.id = 'autofill-badge';
    badge.style.cssText = 'font-size:10px;color:var(--sage);margin-top:4px;letter-spacing:0.05em;font-family:DM Mono,monospace;opacity:0;transition:opacity 0.25s;';
    badge.textContent = '✓ Auto-filled Title & Price from Shopify';
    urlInput.parentNode.appendChild(badge);
  }
  badge.style.opacity = '1';
  clearTimeout(badge._timer);
  badge._timer = setTimeout(() => { badge.style.opacity = '0'; }, 3000);
}

// V8: image alt text (controls the <img alt="…"> in the generated HTML)
function updateImageAlt(v) {
  defaults.imageAlt = (v || '').trim() || 'Shop this look';
}

// V2: image title (required for metaobject)
function updateImageTitle(v) {
  defaults.imageTitle = (v || '').trim();
  if (document.getElementById('output-bar').style.display === 'block') generateJSON();
}


/* ── IMAGE OVERLAY HANDLERS (V5) ── */
function updateOverlay(key, value) {
  // bool coercion for checkbox
  if (key === 'enabled') value = !!value;
  if (key === 'textSize') value = parseInt(value);
  overlay[key] = value;

  if (key === 'enabled') {
    document.getElementById('ovr-controls').style.display = value ? '' : 'none';
    document.getElementById('ovr-status').textContent     = value ? 'enabled' : 'disabled';
  }
  if (key === 'mode') {
    document.getElementById('ovr-text-controls').style.display = value === 'text' ? '' : 'none';
    document.getElementById('ovr-logo-controls').style.display = value === 'logo' ? '' : 'none';
    document.querySelectorAll('#ovr-controls [data-mode]').forEach(b => b.classList.toggle('active', b.dataset.mode === value));
  }
  if (key === 'position') {
    document.querySelectorAll('#ovr-pos-grid .pos-btn').forEach(b => b.classList.toggle('active', b.dataset.pos === value));
  }
  if (key === 'textSize') {
    document.getElementById('ovr-text-size-val').textContent = value + 'px';
  }
  if (key === 'text') {
    updateOverlayCounter();
  }
  if (key === 'logoSrc') {
    const prev = document.getElementById('ovr-logo-preview');
    if (prev) prev.innerHTML = value ? '<img src="'+escHTML(value)+'" style="max-width:100%;max-height:60px;border:1px solid var(--border);padding:4px;background:#fff">' : '';
  }
  renderOverlay();
}

function toggleOverlayStyle(key, btn) {
  overlay[key] = !overlay[key];
  btn.classList.toggle('active', overlay[key]);
  renderOverlay();
}

function updateOverlayCounter() {
  const w = document.getElementById('ovr-text-warn');
  if (!w) return;
  const len = (overlay.text || '').length;
  w.textContent = len + ' / ' + OVERLAY_MAX_CHARS + ' characters' + (len >= OVERLAY_MAX_CHARS ? ' — max reached' : '');
  w.classList.toggle('over', len >= OVERLAY_MAX_CHARS);
}

// Normalize a URL allowing blank (used for overlay logo + hyperlink fields).
// Same logic as product URL normalization, but leaves empty strings empty (no default).
function normalizeURLAllowBlank(url) {
  if (!url || !url.trim()) return '';
  url = url.trim();
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('//')) return 'https:' + url;
  return 'https://' + url;
}

// On-blur cleanup for overlay URL/hyperlink fields. Mirrors the product URL behavior.
function normalizeOverlayURL(key, input) {
  const cleaned = normalizeURLAllowBlank(input.value);
  input.value = cleaned;
  overlay[key] = cleaned;
  if (key === 'logoSrc') {
    const prev = document.getElementById('ovr-logo-preview');
    if (prev) prev.innerHTML = cleaned
      ? '<img src="'+escHTML(cleaned)+'" style="max-width:100%;max-height:60px;border:1px solid var(--border);padding:4px;background:#fff" onerror="this.parentNode.innerHTML=\'<span style=&quot;color:var(--danger);font-size:11px&quot;>Image failed to load — check the URL</span>\'">'
      : '';
  }
  renderOverlay();
}

function buildOverlayFontDropdown() {
  const sel = document.getElementById('ovr-text-font');
  if (!sel) return;
  sel.innerHTML = '';
  FONT_OPTIONS.forEach(f => {
    const o = document.createElement('option');
    o.value = f; o.textContent = f; o.style.fontFamily = f;
    if (f === overlay.textFont) o.selected = true;
    sel.appendChild(o);
  });
}

function syncOverlayUI() {
  document.getElementById('ovr-enabled').checked = overlay.enabled;
  document.getElementById('ovr-controls').style.display = overlay.enabled ? '' : 'none';
  document.getElementById('ovr-status').textContent     = overlay.enabled ? 'enabled' : 'disabled';
  document.querySelectorAll('#ovr-controls [data-mode]').forEach(b => b.classList.toggle('active', b.dataset.mode === overlay.mode));
  document.getElementById('ovr-text-controls').style.display = overlay.mode === 'text' ? '' : 'none';
  document.getElementById('ovr-logo-controls').style.display = overlay.mode === 'logo' ? '' : 'none';
  document.querySelectorAll('#ovr-pos-grid .pos-btn').forEach(b => b.classList.toggle('active', b.dataset.pos === overlay.position));
  document.getElementById('ovr-text').value         = overlay.text;
  document.getElementById('ovr-text-style').value   = overlay.textStyle;
  document.getElementById('ovr-text-size').value    = overlay.textSize;
  document.getElementById('ovr-text-size-val').textContent = overlay.textSize + 'px';
  document.getElementById('ovr-logo-url').value     = overlay.logoSrc && !overlay.logoSrc.startsWith('data:') ? overlay.logoSrc : '';
  document.getElementById('ovr-link').value         = overlay.hyperlink;
  document.getElementById('ovr-text-b').classList.toggle('active', overlay.textBold);
  document.getElementById('ovr-text-i').classList.toggle('active', overlay.textItalic);
  document.getElementById('ovr-text-u').classList.toggle('active', overlay.textUnderline);
  const prev = document.getElementById('ovr-logo-preview');
  if (prev) prev.innerHTML = overlay.logoSrc ? '<img src="'+escHTML(overlay.logoSrc)+'" style="max-width:100%;max-height:60px;border:1px solid var(--border);padding:4px;background:#fff">' : '';
  updateOverlayCounter();
}

function renderOverlay() {
  const wrap = document.getElementById('img-wrap');
  if (!wrap) return;
  const existing = wrap.querySelector('.si-img-overlay');
  if (existing) existing.remove();
  const html = buildOverlayHTML(overlay);
  if (html) wrap.insertAdjacentHTML('beforeend', html);
}

function buildDefaultSwatches() {
  const wrap = document.getElementById('default-swatches');
  wrap.innerHTML = '';
  PRESET_COLORS.forEach(c => {
    const s = document.createElement('div');
    s.className = 'cswatch' + (c === defaults.color ? ' active' : '');
    s.style.background = c;
    if (c === '#ffffff' || c === '#efefef' || c === '#d2c9c3') s.style.border = '2px solid #ccc';
    s.title = c;
    s.onclick = () => { defaults.color = c; syncDefaultSwatches(); syncDefaultUI(); };
    wrap.appendChild(s);
  });
}

function syncDefaultSwatches() {
  document.querySelectorAll('#default-swatches .cswatch').forEach((s,i) => {
    s.classList.toggle('active', PRESET_COLORS[i] === defaults.color);
  });
}

function syncDefaultUI() {
  document.getElementById('d-color-picker').value = defaults.color.length === 7 ? defaults.color : '#bf5a28';
  document.getElementById('d-color-hex').value = defaults.color;
  document.getElementById('d-size').value = defaults.size;
  document.getElementById('d-size-val').textContent = defaults.size + 'px';
  document.getElementById('popup-style').value = defaults.popup;
  const tf = document.getElementById('pop-title-font');          if (tf) tf.value = defaults.popTitleFont;
  const pf = document.getElementById('pop-price-font');          if (pf) pf.value = defaults.popPriceFont;
  const ts = document.getElementById('pop-title-size');          if (ts) ts.value = defaults.popTitleSize;
  const tv = document.getElementById('pop-title-size-val');      if (tv) tv.textContent = defaults.popTitleSize + 'px';
  const ps = document.getElementById('pop-price-size');          if (ps) ps.value = defaults.popPriceSize;
  const pv = document.getElementById('pop-price-size-val');      if (pv) pv.textContent = defaults.popPriceSize + 'px';
  const sp = document.getElementById('show-plus');               if (sp) sp.checked = defaults.showPlus;
  const ia = document.getElementById('d-image-alt');             if (ia) ia.value = defaults.imageAlt;
}

function buildEditSwatches() {
  const wrap = document.getElementById('edit-swatches');
  wrap.innerHTML = '';
  PRESET_COLORS.forEach(c => {
    const s = document.createElement('div');
    s.className = 'cswatch';
    s.style.background = c;
    if (c === '#ffffff' || c === '#efefef' || c === '#d2c9c3') s.style.border = '2px solid #ccc';
    s.title = c;
    s.onclick = () => editColorFromSwatch(c);
    wrap.appendChild(s);
  });
}

function syncEditSwatches(color) {
  document.querySelectorAll('#edit-swatches .cswatch').forEach((s,i) => {
    s.classList.toggle('active', PRESET_COLORS[i] === color);
  });
}

/* ═══════════════════════════════════════════════
   DEFAULT COLOR / SIZE CONTROLS
═══════════════════════════════════════════════ */
function defaultColorFromPicker(val) {
  defaults.color = val;
  document.getElementById('d-color-hex').value = val;
  syncDefaultSwatches();
}
function defaultColorFromHex(val) {
  if (/^#[0-9a-fA-F]{6}$/.test(val)) {
    defaults.color = val;
    document.getElementById('d-color-picker').value = val;
    syncDefaultSwatches();
  }
}
function defaultSize(val) {
  defaults.size = parseInt(val);
  document.getElementById('d-size-val').textContent = val + 'px';
}
function saveDefaults() {
  defaults.popup = document.getElementById('popup-style').value;
  localStorage.setItem('hs_color', defaults.color);
  localStorage.setItem('hs_size',  defaults.size);
  localStorage.setItem('hs_popup', defaults.popup);
  localStorage.setItem('hs_popTitleFont',      defaults.popTitleFont);
  localStorage.setItem('hs_popPriceFont',      defaults.popPriceFont);
  localStorage.setItem('hs_popTitleSize',      defaults.popTitleSize);
  localStorage.setItem('hs_popPriceSize',      defaults.popPriceSize);
  localStorage.setItem('hs_popTitleBold',      defaults.popTitleBold);
  localStorage.setItem('hs_popTitleItalic',    defaults.popTitleItalic);
  localStorage.setItem('hs_popTitleUnderline', defaults.popTitleUnderline);
  localStorage.setItem('hs_popPriceBold',      defaults.popPriceBold);
  localStorage.setItem('hs_popPriceItalic',    defaults.popPriceItalic);
  localStorage.setItem('hs_popPriceUnderline', defaults.popPriceUnderline);
  localStorage.setItem('hs_showPlus',          defaults.showPlus);
  localStorage.setItem('hs_imageAlt',          defaults.imageAlt);
  // Persist all overlay settings too
  Object.keys(overlay).forEach(k => localStorage.setItem('ovr_' + k, overlay[k]));
  const btn = document.getElementById('save-default-btn');
  btn.classList.add('saved');
  btn.textContent = '✓ Saved!';
  document.getElementById('saved-notice').style.display = 'block';
  setTimeout(() => {
    btn.classList.remove('saved');
    btn.textContent = 'Save as Default';
  }, 2000);
}

/* ═══════════════════════════════════════════════
   EDIT PANEL COLOR / SIZE
═══════════════════════════════════════════════ */
function editColorFromSwatch(color) {
  const h = getSelected(); if (!h) return;
  h.color = color;
  document.getElementById('e-color-picker').value = color.length === 7 ? color : '#bf5a28';
  document.getElementById('e-color-hex').value = color;
  syncEditSwatches(color);
  renderHotspots(); renderList();
}
function editColorFromPicker(val) {
  const h = getSelected(); if (!h) return;
  h.color = val;
  document.getElementById('e-color-hex').value = val;
  syncEditSwatches(val);
  renderHotspots(); renderList();
}
function editColorFromHex(val) {
  if (/^#[0-9a-fA-F]{6}$/.test(val)) {
    const h = getSelected(); if (!h) return;
    h.color = val;
    document.getElementById('e-color-picker').value = val;
    syncEditSwatches(val);
    renderHotspots(); renderList();
  }
}
function editSize(val) {
  const h = getSelected(); if (!h) return;
  h.size = parseInt(val);
  document.getElementById('e-size-val').textContent = val + 'px';
  renderHotspots();
}

function editPos(val, btn) {
  const h = getSelected(); if (!h) return;
  h.angle = val; // 'center' or a number 0-359
  document.querySelectorAll('#e-pos-grid .pos-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderHotspots();
}

function editStyle(style, el) {
  const h = getSelected(); if (!h) return;
  h.style = style;
  document.querySelectorAll('#e-style-picker .style-card').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  renderHotspots();
}

function editRingColorFromPicker(val) {
  const h = getSelected(); if (!h) return;
  h.ringColor = val;
  document.getElementById('e-ring-hex').value = val;
  syncEditRingSwatches(val);
  renderHotspots();
}
function editRingColorFromHex(val) {
  if (!/^#[0-9a-fA-F]{6}$/.test(val)) return;
  const h = getSelected(); if (!h) return;
  h.ringColor = val;
  document.getElementById('e-ring-picker').value = val;
  syncEditRingSwatches(val);
  renderHotspots();
}
function matchRingToDot() {
  const h = getSelected(); if (!h) return;
  h.ringColor = h.color;
  document.getElementById('e-ring-picker').value = h.color.length === 7 ? h.color : '#ffffff';
  document.getElementById('e-ring-hex').value = h.color;
  syncEditRingSwatches(h.color);
  renderHotspots();
}

/* V7: ring-color preset swatches (mirror dot-color swatches) */
function buildEditRingSwatches() {
  const wrap = document.getElementById('edit-ring-swatches');
  if (!wrap) return;
  wrap.innerHTML = '';
  PRESET_COLORS.forEach(c => {
    const s = document.createElement('div');
    s.className = 'cswatch';
    s.style.background = c;
    if (c === '#ffffff' || c === '#efefef' || c === '#d2c9c3') s.style.border = '2px solid #ccc';
    s.title = c;
    s.onclick = () => editRingColorFromSwatch(c);
    wrap.appendChild(s);
  });
}
function syncEditRingSwatches(color) {
  document.querySelectorAll('#edit-ring-swatches .cswatch').forEach((s,i) => {
    s.classList.toggle('active', PRESET_COLORS[i] === color);
  });
}
function editRingColorFromSwatch(color) {
  const h = getSelected(); if (!h) return;
  h.ringColor = color;
  document.getElementById('e-ring-picker').value = color.length === 7 ? color : '#ffffff';
  document.getElementById('e-ring-hex').value = color;
  syncEditRingSwatches(color);
  renderHotspots();
}

/* ═══════════════════════════════════════════════
   IMAGE LOADING — URL only (V11: file upload removed)
═══════════════════════════════════════════════ */

// ── Load from URL (primary path) ──
function loadFromURL() {
  const input = document.getElementById('url-input');
  const errEl = document.getElementById('url-error');
  let url = input.value.trim();
  if (!url) { showURLError('Please enter an image URL.'); return; }
  // Auto-add https if missing
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  errEl.style.display = 'none';
  showLoadingState(true);
  revealImage(url, url, () => {
    showLoadingState(false);
  }, () => {
    showLoadingState(false);
    showURLError('Could not load that image. Make sure the URL ends in .jpg / .png / .webp and is publicly accessible.');
  });
}

function showURLError(msg) {
  const el = document.getElementById('url-error');
  el.textContent = msg; el.style.display = 'block';
}

function showLoadingState(on) {
  const btn = document.querySelector('#upload-zone .btn.primary');
  if (btn) { btn.textContent = on ? 'Loading…' : 'Load Image'; btn.disabled = on; }
}

// ── Core: set the image and show canvas ──
// srcForDisplay = what goes in the <img> tag for the builder
// srcForOutput  = what goes in the generated HTML (null = use srcForDisplay)
function revealImage(srcForDisplay, srcForOutput, onSuccess, onError) {
  const img = document.getElementById('preview-img');

  // Store the output src (the original URL) on the element for generateHTML
  img.dataset.outputSrc = srcForOutput || srcForDisplay;

  img.onload = () => {
    document.getElementById('img-dims').textContent =
      img.naturalWidth + ' × ' + img.naturalHeight + 'px';
    document.getElementById('upload-zone').style.display = 'none';
    document.getElementById('canvas-area').style.display = 'flex';
    // Rebuild dot positions when image dimensions change
    if (!img._sizeWatcher) {
      img._sizeWatcher = true;
      window.addEventListener('resize', () => requestAnimationFrame(renderHotspots));
      if (window.ResizeObserver) {
        new ResizeObserver(() => requestAnimationFrame(renderHotspots)).observe(img);
      }
    }
    requestAnimationFrame(() => requestAnimationFrame(() => { renderHotspots(); renderOverlay(); }));
    if (onSuccess) onSuccess();
  };
  img.onerror = () => {
    if (onError) onError();
    else showURLError('Image failed to load.');
  };
  img.src = srcForDisplay;
}

// V11: full reload — guarantees every bit of state, every DOM event listener,
// every cached observer is gone. Saved defaults in localStorage still apply.
function changeImage() {
  if (hotspots.length > 0 && !confirm('Start a new image? Any unsaved hotspots will be cleared.')) return;
  window.location.reload();
}

/* ═══════════════════════════════════════════════
   PREVIEW — opens a clean popup window
═══════════════════════════════════════════════ */
// Shared helper — popup background CSS for a given style
function getPopupCSS() {
  return {
    dark:    'background:#1c1c1c;color:#efefef;box-shadow:0 4px 18px rgba(0,0,0,0.35);',
    light:   'background:#ffffff;color:#1c1c1c;border:1px solid #ddd;box-shadow:0 4px 18px rgba(0,0,0,0.12);',
    minimal: 'background:rgba(10,8,6,0.52);color:#ffffff;backdrop-filter:blur(12px) saturate(140%);-webkit-backdrop-filter:blur(12px) saturate(140%);box-shadow:0 4px 24px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.1);'
  }[defaults.popup] || '';
}

// V7: inline preview — toggles a live preview state ON the current canvas.
// In preview mode: hovering a dot shows its popup; clicking the image does NOT
// place new hotspots; all other controls (sidebar settings, edit panel) still
// work and update live.
function openPreview() {
  if (hotspots.length === 0) {
    alert('Place at least one hotspot before previewing.');
    return;
  }
  previewMode = !previewMode;
  const btn      = document.getElementById('btn-preview');
  const placeBtn = document.getElementById('btn-place');
  const imgWrap  = document.getElementById('img-wrap');
  const hint     = document.getElementById('mode-hint');
  if (previewMode) {
    mode = 'preview';
    btn.classList.add('active');
    btn.innerHTML = '✕ Exit Preview';
    placeBtn.classList.remove('active');
    imgWrap.classList.add('view-mode');
    hint.textContent = 'Live Preview — hover dots (click ＋ Place Hotspot to exit)';
  } else {
    mode = 'place';
    btn.classList.remove('active');
    btn.innerHTML = '⧉ Preview';
    placeBtn.classList.add('active');
    imgWrap.classList.remove('view-mode');
    hint.textContent = 'Click image to place';
  }
  renderHotspots();
}

// Old new-window preview — superseded by the inline V7 preview above.
// Kept here so we don't lose the code path until we're sure inline preview is solid.
function _openPreviewWindow_DEPRECATED() {
  const img = document.getElementById('preview-img');
  const imgSrc = img.dataset.outputSrc || img.src;
  const popupStyle = document.getElementById('popup-style').value;

  const popupCSS = {
    dark:    'background:#1c1a17;color:#f4efe5;box-shadow:0 4px 18px rgba(0,0,0,0.35);',
    light:   'background:#ffffff;color:#1c1a17;border:1px solid #ddd;box-shadow:0 4px 18px rgba(0,0,0,0.12);',
    minimal: 'background:rgba(10,8,6,0.52);color:#ffffff;backdrop-filter:blur(12px) saturate(140%);-webkit-backdrop-filter:blur(12px) saturate(140%);box-shadow:0 4px 24px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.1);'
  }[popupStyle];

  const data = JSON.stringify(hotspots.map(h => ({
    x: parseFloat(h.x.toFixed(4)),
    y: parseFloat(h.y.toFixed(4)),
    name: h.name || '',
    url: normalizeURL(h.url),
    price: h.price || '',
    color: h.color,
    size: h.size,
    angle: h.angle || 0,
    style: h.style || 'pulse',
    ringColor: h.ringColor || '#ffffff',
    altText: h.name || 'View product'
  })));

  // Build preview HTML without any <script> tags inside the template literal
  // (a <script> tag inside a template literal inside a <script> block breaks HTML parsing)
  const previewHTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Hotspot Preview \u2014 BathGems</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { background:#111; display:flex; flex-direction:column; align-items:center; min-height:100vh; font-family:sans-serif; padding:32px 20px; gap:20px; }
.label { font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#666; }
#si-wrap { position:relative; display:block; width:100%; max-width:900px; line-height:0; border-radius:4px; overflow:visible; box-shadow:0 12px 48px rgba(0,0,0,0.5); }
#si-wrap img { display:block; width:100%; height:auto; border-radius:4px; }
.note { font-size:12px; color:#555; letter-spacing:0.04em; }
@keyframes si-pulse-body { 0%,100%{transform:scale(1)} 40%{transform:scale(1.22)} 70%{transform:scale(0.92)} }
@keyframes si-pulse  { 0%{transform:scale(1);opacity:0.7} 100%{transform:scale(2.6);opacity:0} }
@keyframes si-spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes si-ripple { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(3);opacity:0} }
@keyframes si-beacon-breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.28)} }
@keyframes si-glow   { 0%,100%{box-shadow:0 0 0 0 rgba(255,255,255,0)} 50%{box-shadow:0 0 14px 8px var(--si-gc, rgba(255,255,255,0.5))} }
</style>
</head>
<body>
<span class="label">Preview \u2014 hover dots to see popups \u00b7 click to test links</span>
<div id="si-wrap"><img src="${imgSrc}" alt="Preview">${buildOverlayHTML(overlay)}</div>
<span class="note">Close this window to return to the builder</span>
</body>
</html>`;

  const pw = window.open('', '_blank', 'width=960,height=800,resizable=yes,scrollbars=yes');
  if (!pw) {
    alert('Pop-up blocked. Please allow pop-ups for this page and try again.');
    return;
  }
  pw.document.write(previewHTML);
  pw.document.close();

  // Inject the hotspot JS after the document is written, avoiding any script tags in the template literal
  const scriptFn = function(D, popCSS, TYPO) {
    var W = document.getElementById('si-wrap');
    var I = W.querySelector('img');
    function build() {
      W.querySelectorAll('.si-dot').forEach(function(d){d.remove();});
      if(!I.offsetWidth||!I.offsetHeight)return;
      var ov = W; // V3: dots attach directly to si-wrap, no overlay
      D.forEach(function(h) {
    var sz = h.size || 16;
        var hs = h.style || 'pulse';
        var rc = h.ringColor || '#ffffff';
        var half = sz / 2;
        var d = document.createElement('div');
        d.className = 'si-dot';
        // Accessibility: alt text falls back to product name
        var altT = h.altText || h.name || 'View product';
        d.title = altT;
        d.setAttribute('aria-label', altT);
        d.setAttribute('role', 'link');
        d.setAttribute('tabindex', '0');
        // Use negative margins instead of transform: translate(-50%,-50%) for centering.
        d.style.cssText = 'position:absolute;left:'+h.x+'%;top:'+h.y+'%;margin-left:-'+half+'px;margin-top:-'+half+'px;width:'+sz+'px;height:'+sz+'px;cursor:pointer;z-index:10;line-height:1;pointer-events:auto;';
        var ring = document.createElement('div');
        // Base ring styles
        var baseRing = 'width:'+sz+'px;height:'+sz+'px;border-radius:50%;border:2.5px solid '+rc+';box-shadow:0 2px 10px rgba(0,0,0,0.32);position:relative;display:flex;align-items:center;justify-content:center;transition:transform 0.18s;overflow:hidden;';
        // Style-specific overrides
        if (hs==='ring') {
          ring.style.cssText = baseRing + 'background:transparent;border:2.5px solid '+h.color+';box-shadow:0 2px 8px rgba(0,0,0,0.3);overflow:visible;';
          var spin=document.createElement('div');
          spin.style.cssText='position:absolute;inset:-3px;border-radius:50%;border:2px dashed '+h.color+';animation:si-spin 3s linear infinite;pointer-events:none;';
          ring.appendChild(spin);
        } else if (hs==='ripple') {
          ring.style.cssText = baseRing + 'background:'+h.color+';';
          for(var r=0;r<3;r++){var rip=document.createElement('div');rip.style.cssText='position:absolute;width:100%;height:100%;border-radius:50%;background:'+h.color+';animation:si-ripple 2s ease-out infinite;animation-delay:'+(r*0.6)+'s;pointer-events:none;';ring.appendChild(rip);}
        } else if (hs==='beacon') {
          ring.style.cssText = baseRing + 'background:'+h.color+';animation:si-beacon-breathe 1.4s ease-in-out infinite;';
        } else if (hs==='glow') {
          ring.style.cssText = baseRing + 'background:'+h.color+';animation:si-glow 2s ease-in-out infinite;--si-gc:'+h.color+'aa;';
        } else {
          ring.style.cssText = baseRing + 'background:'+h.color+';animation:si-pulse-body 1.8s ease-in-out infinite;';
          var pulse=document.createElement('div');
          pulse.style.cssText='position:absolute;width:100%;height:100%;border-radius:50%;background:'+h.color+';opacity:0.55;animation:si-pulse 1.8s ease-out infinite;pointer-events:none;';
          ring.appendChild(pulse);
        }
        // Plus sign (hidden for ring style, or globally disabled)
        if (hs!=='ring' && TYPO.showPlus) {
          var plus=document.createElement('span');
          plus.style.cssText='color:white;font-size:'+(sz*0.52)+'px;font-weight:300;position:relative;z-index:2;display:flex;align-items:center;justify-content:center;padding-bottom:1px;line-height:1';
          plus.textContent='+';
          ring.appendChild(plus);
        }
        var pop = document.createElement('div');
        var isCenter = h.angle === 'center';
        var ang = isCenter ? 0 : ((h.angle || 0) * Math.PI / 180);
        var gap = isCenter ? 0 : (sz / 2 + 12);
        var ox = isCenter ? 0 : Math.round(Math.cos(ang) * gap);
        var oy = isCenter ? 0 : Math.round(Math.sin(ang) * gap);
        var tx = isCenter ? '-50%' : (ox >= 0 ? '0%' : '-100%');
        var ty = isCenter ? '-50%' : (oy >= 0 ? '0%' : '-100%');
        pop.style.cssText = 'position:absolute;left:calc(50% + '+ox+'px);top:calc(50% + '+oy+'px);transform:translate('+tx+','+ty+');'+popCSS+'padding:8px 12px;border-radius:4px;min-width:140px;max-width:240px;opacity:0;transition:opacity 0.18s;z-index:20;white-space:normal;overflow-wrap:break-word;word-break:break-word;line-height:1.25;cursor:pointer;';
        pop.innerHTML = '<div style="'+TYPO.tt+'">'+h.name+'</div>'+(h.price?'<div style="'+TYPO.pt+';opacity:0.85">'+h.price+'</div>':'');
        d.appendChild(ring); d.appendChild(pop);
        // Keep popup visible when mouse moves from dot to popup
        d.addEventListener('mouseenter', function(){ ring.style.transform='scale(1.18)'; pop.style.opacity='1'; });
        pop.addEventListener('mouseenter', function(){ pop.style.opacity='1'; });
        d.addEventListener('mouseleave',  function(e){ if(!pop.contains(e.relatedTarget)){ ring.style.transform=''; pop.style.opacity='0'; } });
        pop.addEventListener('mouseleave', function(e){ if(!d.contains(e.relatedTarget)){ ring.style.transform=''; pop.style.opacity='0'; } });
        d.addEventListener('touchstart', function(e){ e.preventDefault(); pop.style.opacity = pop.style.opacity==='1'?'0':'1'; }, {passive:false});
        d.addEventListener('click', function(){ if(h.url) window.open(h.url,'_blank'); });
        ov.appendChild(d);
      });
    }
    function safeBuild(){ requestAnimationFrame(function(){ requestAnimationFrame(build); }); }
    I.complete ? safeBuild() : I.addEventListener('load', safeBuild);
    window.addEventListener('resize', safeBuild);
    window.addEventListener('load', safeBuild);
    if(window.ResizeObserver){var ro=new ResizeObserver(safeBuild);ro.observe(I);ro.observe(W);}
    if(window.MutationObserver){var mo=new MutationObserver(function(){if(I.complete&&I.naturalWidth)safeBuild();});mo.observe(I,{attributes:true,attributeFilter:['src','srcset']});}
  };

  // Serialize the hotspot data and popup CSS into the popup window's scope
  // V7: font baked into tt and pt
  const TYPO = { tt: popInlineCSS('Title'), pt: popInlineCSS('Price'), showPlus: defaults.showPlus };
  const initCode = '(' + scriptFn.toString() + ')(' + data + ',' + JSON.stringify(popupCSS) + ',' + JSON.stringify(TYPO) + ');';
  const s = pw.document.createElement('script');
  s.textContent = initCode;
  pw.document.body.appendChild(s);
}

/* ═══════════════════════════════════════════════
   MODE (kept minimal — only 'place' used now)
═══════════════════════════════════════════════ */
function setMode(m) {
  // V11: clicking "Place Hotspot" while in Preview should exit Preview too
  if (m === 'place' && previewMode) {
    openPreview(); // toggles preview off (which also sets mode = 'place')
    return;
  }
  mode = m;
  document.getElementById('btn-place').classList.toggle('active', m === 'place');
  document.getElementById('mode-hint').textContent = 'Click image to place';
  document.getElementById('mode-hint').style.display = 'flex';
}

/* ═══════════════════════════════════════════════
   PLACE HOTSPOT ON CLICK
═══════════════════════════════════════════════ */
document.getElementById('img-wrap').addEventListener('click', function(e) {
  if (mode !== 'place') return;
  if (e.target.closest('.hs')) return;
  // Measure from the img element itself — this is the same reference
  // used by renderHotspots and the output build() function
  const img = document.getElementById('preview-img');
  const rect = img.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width)  * 100;
  const y = ((e.clientY - rect.top)  / rect.height) * 100;
  const id = Date.now();
  hotspots.push({ id, x, y, name: '', url: '', price: '', color: defaults.color, size: defaults.size, angle: 0, style: defaults.style || 'pulsering', ringColor: '#ffffff' });
  selectedId = id;
  renderHotspots(); renderList();
  openEditPanel(id);
  document.getElementById('gen-btn').style.display = 'inline-block';
  document.getElementById('e-url').focus();
});

/* ═══════════════════════════════════════════════
   RENDER HOTSPOTS
═══════════════════════════════════════════════ */
function renderHotspots() {
  document.querySelectorAll('.hs, .hs-overlay').forEach(el => el.remove());
  const wrap = document.getElementById('img-wrap');
  const img  = document.getElementById('preview-img');
  const IR = img.getBoundingClientRect();
  if (!IR.width || !IR.height) return;

  // Static overlay covers the wrapper 100% — the image fills the wrapper exactly
  // (width:100%;height:auto + matching aspect-ratio), so % positions are identical
  // to the old getBoundingClientRect approach but immune to browser/theme layout shifts.
  const overlay = document.createElement('div');
  overlay.className = 'hs-overlay';
  overlay.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:5;';
  wrap.appendChild(overlay);

  hotspots.forEach((h, i) => {
    const dot = document.createElement('div');
    dot.className = 'hs' + (h.id === selectedId ? ' selected' : '');
    const sz = h.size || 16;
    const half = sz / 2;
    // Simple % positioning + negative margin centering — bulletproof, no transform needed
    dot.style.left = h.x + '%';
    dot.style.top  = h.y + '%';
    dot.style.marginLeft = -half + 'px';
    dot.style.marginTop  = -half + 'px';
    dot.style.width  = sz + 'px';
    dot.style.height = sz + 'px';
    dot.style.pointerEvents = 'auto';

    const body = document.createElement('div');
    body.className = 'hs-body';
    body.style.width  = sz + 'px';
    body.style.height = sz + 'px';
    // V8: migrate legacy 'pulse' style to 'pulsering'
    if (h.style === 'pulse') h.style = 'pulsering';
    const hStyle = h.style || 'pulsering';
    const ringCol = h.ringColor || '#ffffff';

    if (hStyle === 'ring') {
      body.style.background = 'transparent';
      body.style.border = '2.5px solid ' + h.color;
      body.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      const spin = document.createElement('div');
      spin.className = 'hs-fx-ring';
      spin.style.borderColor = h.color;
      body.appendChild(spin);
    } else if (hStyle === 'ripple') {
      body.style.background = h.color;
      for (let r = 0; r < 3; r++) {
        const rip = document.createElement('div');
        rip.className = 'hs-fx-ripple';
        rip.style.background = h.color;
        rip.style.animationDelay = (r * 0.6) + 's';
        body.appendChild(rip);
      }
    } else if (hStyle === 'beacon') {
      body.style.background = h.color;
      body.classList.add('style-beacon');
    } else if (hStyle === 'glow') {
      body.style.background = h.color;
      body.classList.add('style-glow');
      // Pass the dot color as a CSS variable for the glow color
      body.style.setProperty('--hs-glow-color', h.color + 'aa');
    } else {
      // V8 Default: Pulse Ring — hollow ring (colored border) + expanding pulse outward
      body.style.background = 'transparent';
      body.style.border = '2.5px solid ' + h.color;
      body.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      body.style.overflow = 'visible';
      body.classList.add('style-pulsering');
      const pulse = document.createElement('div');
      pulse.className = 'hs-fx-pulsering';
      pulse.style.borderColor = h.color;
      body.appendChild(pulse);
    }

    const plus = document.createElement('div');
    plus.className = 'hs-plus';
    plus.style.fontSize = Math.round(sz * 0.52) + 'px';
    plus.textContent = '+';
    // Hide + for ring/pulsering styles (hollow looks cleaner without it) — or if user toggled it off
    if (hStyle === 'ring' || hStyle === 'pulsering' || !defaults.showPlus) plus.style.display = 'none';
    // Apply ring color to border (ring + pulsering use dot color for their border; others use ringCol)
    if (hStyle !== 'ring' && hStyle !== 'pulsering') body.style.border = '2.5px solid ' + ringCol;

    const num = document.createElement('div');
    num.className = 'hs-num';
    num.textContent = i + 1;
    num.style.display = document.getElementById('show-numbers').checked ? 'flex' : 'none';

    body.appendChild(plus);
    body.appendChild(num);
    dot.appendChild(body);

    // V7/V9: in preview mode, attach a hover popup mirroring the generated output.
    // V9: only render the popup when there's a Title — otherwise the dot is just a clickable link.
    if (previewMode && (h.name || '').trim()) {
      const popCSS = getPopupCSS();
      const isCenter = h.angle === 'center';
      const ang = isCenter ? 0 : ((h.angle || 0) * Math.PI / 180);
      const gap = isCenter ? 0 : (sz / 2 + 12);
      const ox  = isCenter ? 0 : Math.round(Math.cos(ang) * gap);
      const oy  = isCenter ? 0 : Math.round(Math.sin(ang) * gap);
      const tx  = isCenter ? '-50%' : (ox >= 0 ? '0%' : '-100%');
      const ty  = isCenter ? '-50%' : (oy >= 0 ? '0%' : '-100%');
      const tt  = popInlineCSS('Title');
      const pt  = popInlineCSS('Price');
      const pop = document.createElement('div');
      pop.className = 'hs-pop';
      pop.style.cssText = 'position:absolute;left:calc(50% + '+ox+'px);top:calc(50% + '+oy+'px);transform:translate('+tx+','+ty+');'+popCSS+'padding:8px 12px;border-radius:4px;min-width:140px;max-width:240px;opacity:0;transition:opacity 0.18s;z-index:20;white-space:normal;overflow-wrap:break-word;word-break:break-word;line-height:1.25;cursor:pointer;pointer-events:none;';
      pop.innerHTML = '<div style="'+tt+'">'+h.name+'</div>'+(h.price ? '<div style="'+pt+';opacity:0.85">'+h.price+'</div>' : '');
      dot.appendChild(pop);
      dot.addEventListener('mouseenter', () => { pop.style.opacity = '1'; pop.style.pointerEvents = 'auto'; });
      dot.addEventListener('mouseleave', e => { if (!pop.contains(e.relatedTarget)) { pop.style.opacity = '0'; pop.style.pointerEvents = 'none'; } });
      pop.addEventListener('mouseleave', e => { if (!dot.contains(e.relatedTarget)) { pop.style.opacity = '0'; pop.style.pointerEvents = 'none'; } });
    }

    dot.addEventListener('click', e => {
      e.stopPropagation();
      if (mode === 'preview') {
        if (h.url) window.open(normalizeURL(h.url), '_blank');
      } else {
        selectedId = h.id;
        openEditPanel(h.id);
        renderHotspots(); renderList();
      }
    });

    overlay.appendChild(dot);
  });
}

/* ═══════════════════════════════════════════════
   EDIT PANEL
═══════════════════════════════════════════════ */
function openEditPanel(id) {
  const h = hotspots.find(h => h.id === id);
  if (!h) return;
  const idx = hotspots.indexOf(h);

  selectedId = id; // ← always sync selectedId so pushEdit/editSize/editColor all work

  document.getElementById('edit-panel').style.display = 'block';
  document.getElementById('edit-panel-num').textContent = '#' + (idx + 1);
  document.getElementById('e-name').value  = h.name;
  document.getElementById('e-url').value   = h.url;
  document.getElementById('e-price').value = h.price || '';
  updateNameCounter();
  document.getElementById('e-color-picker').value = h.color.length === 7 ? h.color : '#bf5a28';
  document.getElementById('e-color-hex').value = h.color;
  document.getElementById('e-size').value = h.size;
  document.getElementById('e-size-val').textContent = h.size + 'px';
  const rc = h.ringColor || '#ffffff';
  document.getElementById('e-ring-picker').value = rc;
  document.getElementById('e-ring-hex').value = rc;
  syncEditRingSwatches(rc);
  // Sync popup position grid
  const ang = h.angle !== undefined ? h.angle : 0;
  document.querySelectorAll('#e-pos-grid .pos-btn').forEach(b => {
    const ba = b.dataset.angle;
    b.classList.toggle('active', String(ba) === String(ang));
  });
  // Sync style picker (V8: legacy 'pulse' maps to 'pulsering')
  let hs = h.style || 'pulsering';
  if (hs === 'pulse') { hs = 'pulsering'; h.style = 'pulsering'; }
  document.querySelectorAll('#e-style-picker .style-card').forEach(b => {
    b.classList.toggle('active', b.dataset.style === hs);
  });
  syncEditSwatches(h.color);
}

function pushEdit() {
  const h = getSelected(); if (!h) return;
  h.name  = document.getElementById('e-name').value;
  h.url   = document.getElementById('e-url').value;
  h.price = document.getElementById('e-price').value;
  updateNameCounter();
  renderHotspots(); renderList();
}

function getSelected() {
  return hotspots.find(h => h.id === selectedId) || null;
}

function deleteSelected() {
  const idx = hotspots.findIndex(h => h.id === selectedId);
  if (idx !== -1) hotspots.splice(idx, 1);
  selectedId = null;
  document.getElementById('edit-panel').style.display = 'none';
  renderHotspots(); renderList();
  if (hotspots.length === 0) {
    document.getElementById('gen-btn').style.display = 'none';
    document.getElementById('output-bar').style.display = 'none';
  }
}

/* ═══════════════════════════════════════════════
   LIST
═══════════════════════════════════════════════ */
function renderList() {
  document.getElementById('hs-count').textContent = hotspots.length + ' placed';
  const list = document.getElementById('hs-list');
  if (hotspots.length === 0) {
    list.innerHTML = '<div class="empty-state">No hotspots yet.<br>Upload an image and click<br>to start placing dots.</div>';
    return;
  }
  list.innerHTML = '';
  const ul = document.createElement('div');
  ul.className = 'hs-list';
  hotspots.forEach((h, i) => {
    const item = document.createElement('div');
    item.className = 'hs-item' + (h.id === selectedId ? ' selected' : '');

    const dot = document.createElement('div');
    dot.className = 'dot';
    dot.style.background = h.color;
    dot.textContent = i + 1;

    const name = document.createElement('div');
    name.className = 'name' + (h.name ? '' : ' empty');
    name.textContent = h.name || 'unnamed';

    const del = document.createElement('button');
    del.className = 'del-btn';
    del.textContent = '×';
    del.onclick = e => { e.stopPropagation(); removeHotspot(h.id); };

    item.appendChild(dot); item.appendChild(name); item.appendChild(del);
    item.onclick = () => {
      selectedId = h.id;
      openEditPanel(h.id);
      renderHotspots(); renderList();
    };
    ul.appendChild(item);
  });
  list.appendChild(ul);
}

function removeHotspot(id) {
  const idx = hotspots.findIndex(h => h.id === id);
  if (idx !== -1) hotspots.splice(idx, 1);
  if (selectedId === id) {
    selectedId = null;
    document.getElementById('edit-panel').style.display = 'none';
  }
  renderHotspots(); renderList();
  if (hotspots.length === 0) {
    document.getElementById('gen-btn').style.display = 'none';
    document.getElementById('output-bar').style.display = 'none';
  }
}

function normalizeURL(url) {
  if (!url || !url.trim()) return 'https://bathgems.com';
  url = url.trim();
  // Already has a valid protocol
  if (/^https?:\/\//i.test(url)) return url;
  // Has protocol-relative //
  if (url.startsWith('//')) return 'https:' + url;
  // Looks like a domain/path — prepend https://
  return 'https://' + url;
}

/* ═══════════════════════════════════════════════
   GENERATE HTML
═══════════════════════════════════════════════ */
function generateHTML() {
  const img = document.getElementById('preview-img');
  // Use the original URL if loaded from URL; fall back to src (base64 for file uploads)
  const imgSrc = img.dataset.outputSrc || img.src;
  const isBase64 = imgSrc.startsWith('data:');
  const popupStyle = document.getElementById('popup-style').value;
  // Capture natural dimensions to lock aspect ratio in output HTML
  const natW = img.naturalWidth || 0;
  const natH = img.naturalHeight || 0;

  const popupCSS = {
    dark:    'background:#1c1a17;color:#f4efe5;box-shadow:0 4px 18px rgba(0,0,0,0.35);',
    light:   'background:#ffffff;color:#1c1a17;border:1px solid #ddd;box-shadow:0 4px 18px rgba(0,0,0,0.12);',
    minimal: 'background:rgba(10,8,6,0.52);color:#ffffff;backdrop-filter:blur(12px) saturate(140%);-webkit-backdrop-filter:blur(12px) saturate(140%);box-shadow:0 4px 24px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.1);'
  }[popupStyle];

  const data = JSON.stringify(hotspots.map(h => ({
    x: parseFloat(h.x.toFixed(4)),
    y: parseFloat(h.y.toFixed(4)),
    name: h.name || '',
    url: normalizeURL(h.url),
    price: h.price || '',
    color: h.color,
    size: h.size,
    angle: h.angle || 0,
    style: h.style || 'pulse',
    ringColor: h.ringColor || '#ffffff',
    altText: h.name || 'View product'
  })));

  // Clean, self-contained output — no base64 image, uses the image src as-is
  const dimAttr = (natW && natH) ? ` width="${natW}" height="${natH}"` : '';
  const aspectCSS = (natW && natH) ? `aspect-ratio:${natW}/${natH};` : '';
  // V4/V5/V7: typography (font baked into TT/PT) + overlay
  const titleCSS = popInlineCSS('Title');
  const priceCSS = popInlineCSS('Price');
  const overlayHTML = buildOverlayHTML(overlay);

  const output = `<!-- Shoppable Image | Built with Hotspot Builder | VERSION: V15 -->
<div class="si-wrap" style="position:relative;display:block;width:100%;max-width:100%;font-family:sans-serif;line-height:0;font-size:0;">
<img src="${isBase64 ? '[REPLACE_WITH_YOUR_IMAGE_URL]' : imgSrc}" alt="${escHTML(defaults.imageAlt || 'Shop this look')}"${dimAttr} style="display:block;width:100%;height:auto;border-radius:3px;${aspectCSS}">
${overlayHTML}
<script>(function(){
var D=${data};
// V14: each embed self-locates via document.currentScript so multiple embeds on the
// same page don't collide. Previously both used id="si-wrap" which only matches one.
var W=document.currentScript.parentNode;
var I=W.querySelector('img');
var popCSS=${JSON.stringify(popupCSS)};
var TT=${JSON.stringify(titleCSS)};
var PT=${JSON.stringify(priceCSS)};
var SHOW_PLUS=${defaults.showPlus ? 'true' : 'false'};
function build(){
W.querySelectorAll('.si-dot').forEach(function(d){d.remove()});
// V3: NO overlay. Dots are appended DIRECTLY to si-wrap with % coords.
// si-wrap's height == image's height because img is its only child (block, width:100%, height:auto, margin:0).
// % within si-wrap therefore equals % within the image. Immune to all theme spacing bugs.
if(!I.offsetWidth||!I.offsetHeight)return;
var ov=W;
D.forEach(function(h,i){
var sz=h.size||16;
var hs=h.style||'pulsering';
if(hs==='pulse')hs='pulsering'; // V8 migration
var rc=h.ringColor||'#ffffff';
var half=sz/2;
var d=document.createElement('div');
d.className='si-dot';
// Accessibility: alt text falls back to product name (V6)
var altT=h.altText||h.name||'View product';
d.title=altT;d.setAttribute('aria-label',altT);d.setAttribute('role','link');d.setAttribute('tabindex','0');
// Use negative margins instead of transform: translate(-50%,-50%) for centering.
// This is bulletproof — works even if a theme's CSS overrides transform.
d.style.cssText='position:absolute;left:'+h.x+'%;top:'+h.y+'%;margin-left:-'+half+'px;margin-top:-'+half+'px;width:'+sz+'px;height:'+sz+'px;cursor:pointer;z-index:10;line-height:1;pointer-events:auto;';
var ring=document.createElement('div');
var base='width:'+sz+'px;height:'+sz+'px;border-radius:50%;border:2.5px solid '+rc+';box-shadow:0 2px 10px rgba(0,0,0,0.32);position:relative;display:flex;align-items:center;justify-content:center;transition:transform 0.18s;overflow:hidden;';
if(hs==='ring'){
  ring.style.cssText=base+'background:transparent;border:2.5px solid '+h.color+';box-shadow:0 2px 8px rgba(0,0,0,0.3);overflow:visible;';
  var spin=document.createElement('div');
  spin.style.cssText='position:absolute;inset:-3px;border-radius:50%;border:2px dashed '+h.color+';animation:si-spin 3s linear infinite;pointer-events:none;';
  ring.appendChild(spin);
}else if(hs==='ripple'){
  ring.style.cssText=base+'background:'+h.color+';';
  for(var r=0;r<3;r++){var rip=document.createElement('div');rip.style.cssText='position:absolute;width:100%;height:100%;border-radius:50%;background:'+h.color+';animation:si-ripple 2s ease-out infinite;animation-delay:'+(r*0.6)+'s;pointer-events:none;';ring.appendChild(rip);}
}else if(hs==='beacon'){
  ring.style.cssText=base+'background:'+h.color+';animation:si-beacon-breathe 1.4s ease-in-out infinite;';
}else if(hs==='glow'){
  ring.style.cssText=base+'background:'+h.color+';animation:si-glow 2s ease-in-out infinite;';
  ring.style.setProperty('--si-gc',h.color+'aa');
}else{
  // V8 default: Pulse Ring — hollow ring + outward expanding pulse
  ring.style.cssText=base+'background:transparent;border:2.5px solid '+h.color+';box-shadow:0 2px 8px rgba(0,0,0,0.3);overflow:visible;';
  var pulse=document.createElement('div');
  pulse.style.cssText='position:absolute;inset:-3px;border-radius:50%;border:2px solid '+h.color+';animation:si-pulse 1.8s ease-out infinite;pointer-events:none;';
  ring.appendChild(pulse);
}
if(hs!=='ring'&&hs!=='pulsering'&&SHOW_PLUS){var plus=document.createElement('span');plus.style.cssText='color:white;font-size:'+(sz*0.52)+'px;font-weight:300;position:relative;z-index:2;display:flex;align-items:center;justify-content:center;padding-bottom:1px;line-height:1';plus.textContent='+';ring.appendChild(plus);}
var num=document.createElement('div');num.style.cssText='display:none';num.textContent=i+1;ring.appendChild(num);
d.appendChild(ring);
// V9: only render the popup when there's a Title. Empty-title dots = pure click-through to URL.
if(h.name){
  var pop=document.createElement('div');
  var isCenter=h.angle==='center';
  var ang=isCenter?0:((h.angle||0)*Math.PI/180);
  var gap=isCenter?0:(sz/2+12);
  var ox=isCenter?0:Math.round(Math.cos(ang)*gap);
  var oy=isCenter?0:Math.round(Math.sin(ang)*gap);
  var tx=isCenter?'-50%':(ox>=0?'0%':'-100%');
  var ty=isCenter?'-50%':(oy>=0?'0%':'-100%');
  pop.style.cssText='position:absolute;left:calc(50% + '+ox+'px);top:calc(50% + '+oy+'px);transform:translate('+tx+','+ty+');'+popCSS+'padding:8px 12px;border-radius:4px;min-width:140px;max-width:240px;opacity:0;transition:opacity 0.18s;z-index:20;white-space:normal;overflow-wrap:break-word;word-break:break-word;line-height:1.25;cursor:pointer;';
  pop.innerHTML='<div style="'+TT+'">'+h.name+'</div>'+(h.price?'<div style="'+PT+';opacity:0.85">'+h.price+'</div>':'');
  d.appendChild(pop);
  d.addEventListener('mouseenter',function(){ring.style.transform='scale(1.18)';pop.style.opacity='1'});
  pop.addEventListener('mouseenter',function(){pop.style.opacity='1'});
  d.addEventListener('mouseleave',function(e){if(!pop.contains(e.relatedTarget)){ring.style.transform='';pop.style.opacity='0'}});
  pop.addEventListener('mouseleave',function(e){if(!d.contains(e.relatedTarget)){ring.style.transform='';pop.style.opacity='0'}});
  // V15: mobile — first tap shows the popup, second tap on the same dot lets the click through to open the URL
  d.addEventListener('touchstart',function(e){if(pop.style.opacity==='1')return;e.preventDefault();pop.style.opacity='1'},{passive:false});
}else{
  // No title — just hover-scale feedback, no popup
  d.addEventListener('mouseenter',function(){ring.style.transform='scale(1.18)'});
  d.addEventListener('mouseleave',function(){ring.style.transform=''});
}
d.addEventListener('click',function(){if(h.url)window.open(h.url,'_blank')});
ov.appendChild(d);
});
}
// Defer first build to ensure browser layout is complete before measuring rects
function safeBuild(){requestAnimationFrame(function(){requestAnimationFrame(build);});}
I.complete?safeBuild():I.addEventListener('load',safeBuild);
window.addEventListener('resize',safeBuild);
window.addEventListener('load',safeBuild);
// Rebuild aggressively for first 1s to catch late layout shifts from theme CSS, fonts, etc.
var rebuildCount=0;var rebuildTimer=setInterval(function(){build();rebuildCount++;if(rebuildCount>=10)clearInterval(rebuildTimer);},100);
// ResizeObserver catches any layout reflow that changes the image size
if(window.ResizeObserver){var ro=new ResizeObserver(safeBuild);ro.observe(I);ro.observe(W);}
// Handle lazy loaders that swap src without firing load event
if(window.MutationObserver){var mo=new MutationObserver(function(){if(I.complete&&I.naturalWidth)safeBuild();});mo.observe(I,{attributes:true,attributeFilter:['src','srcset']});}
if(!document.getElementById('si-css')){var s=document.createElement('style');s.id='si-css';s.textContent='.si-wrap{padding:0!important;border:0!important;margin-left:auto!important;margin-right:auto!important;}.si-wrap>img{display:block!important;width:100%!important;height:auto!important;max-height:none!important;margin:0!important;padding:0!important;object-fit:fill!important;vertical-align:top!important;float:none!important;}@keyframes si-pulse-body{0%,100%{transform:scale(1)}40%{transform:scale(1.22)}70%{transform:scale(0.92)}}@keyframes si-pulse{0%{transform:scale(1);opacity:0.7}100%{transform:scale(2.6);opacity:0}}@keyframes si-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes si-ripple{0%{transform:scale(1);opacity:0.6}100%{transform:scale(3);opacity:0}}@keyframes si-beacon-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.28)}}@keyframes si-glow{0%,100%{box-shadow:0 0 0 0 rgba(255,255,255,0)}50%{box-shadow:0 0 14px 8px var(--si-gc,rgba(255,255,255,0.5))}}';document.head.appendChild(s);}
})();${'<'}/script>
</div>
<p class="si-credit" style="font-size:11px;color:#9a9a9a;font-weight:400;font-family:Arial,sans-serif;letter-spacing:0.02em;line-height:1.5;margin:8px 0 0;padding:0;text-align:right;">Powered by <a href="${escHTML(CREDIT_URL)}" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline;font-weight:inherit;">${escHTML(CREDIT_TEXT)}</a></p>`;

  document.getElementById('output-code').value = output;
  document.getElementById('output-bar').style.display = 'block';
  document.getElementById('output-bar').scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // Note if image is base64 (uploaded from computer)
  if (isBase64) {
    document.getElementById('output-code').value = output +
      '\n\n<!-- ⚠️ Replace [REPLACE_WITH_YOUR_IMAGE_URL] with your Shopify CDN image URL -->';
  }
}

function copyHTML() {
  const ta = document.getElementById('output-code');
  ta.select(); ta.setSelectionRange(0, 99999);
  try {
    document.execCommand('copy');
  } catch(e) {
    navigator.clipboard.writeText(ta.value);
  }
  const btn = document.getElementById('copy-btn');
  btn.textContent = '✓ Copied!';
  btn.classList.add('copied');
  setTimeout(() => { btn.innerHTML = '📄 Copy for NEW Image<br><span style="font-size:9px;opacity:.8;font-weight:400">(full metaobject)</span>'; btn.classList.remove('copied'); }, 2200);
}

/* ═══════════════════════════════════════════════
   V2: AUTO-INFERENCE — tags derived from Shopify product data
═══════════════════════════════════════════════ */
function normalizeTag(s) { return String(s || '').toLowerCase().trim().replace(/\s+/g,'-'); }

function allSignals() {
  const bag = new Set();
  hotspots.forEach(h => {
    (h.shopifyTags || []).forEach(t => bag.add(normalizeTag(t)));
    if (h.shopifyProductType) bag.add(normalizeTag(h.shopifyProductType));
    (h.name || '').toLowerCase().split(/[^a-z0-9]+/).forEach(w => { if (w.length > 2) bag.add(w); });
  });
  return bag;
}

function inferMulti(dim) {
  const bag = allSignals();
  return SITE.vocab[dim].filter(v => {
    if (bag.has(v)) return true;
    const spaced = v.replace(/-/g, ' ');
    for (const t of bag) if (t === spaced || t.includes(v) || t.includes(spaced)) return true;
    return false;
  });
}

function inferProductTypes() {
  const found = new Set();
  hotspots.forEach(h => {
    const text = ((h.name || '') + ' ' + (h.shopifyProductType || '')).toLowerCase();
    (h.shopifyTags || []).forEach(t => { const nt = normalizeTag(t); if (SITE.vocab.product_type.includes(nt)) found.add(nt); });
    Object.keys(SITE.productTypeKeywords || {}).forEach(tag => {
      if (SITE.productTypeKeywords[tag].some(kw => text.includes(kw))) found.add(tag);
    });
  });
  return Array.from(found);
}

function inferRoom() {
  const pts = inferProductTypes();
  const votes = {};
  pts.forEach(pt => { const room = (SITE.productTypeToRoom || {})[pt]; if (room) votes[room] = (votes[room] || 0) + 1; });
  const bag = allSignals();
  SITE.vocab.room.forEach(r => { if (bag.has(r)) votes[r] = (votes[r] || 0) + 10; });
  const winner = Object.keys(votes).sort((a,b) => votes[b] - votes[a])[0];
  return winner || '';
}

function inferSize() {
  if (!SITE.vocab.size) return [];
  const found = new Set();
  hotspots.forEach(h => {
    const text = ((h.name || '') + ' ' + (h.shopifyTags || []).join(' ')).toLowerCase();
    const matches = text.match(/(\d{2,3})\s*(?:"|-inch|\s*inch\b|in\.)/g) || [];
    matches.forEach(m => {
      const num = m.match(/\d+/)[0]; const tag = num + '-inch';
      if (SITE.vocab.size.includes(tag)) found.add(tag);
    });
  });
  return Array.from(found).sort((a,b) => parseInt(a) - parseInt(b));
}
function inferSinkCount() {
  if (!SITE.vocab.sink_count) return '';
  let hasDouble = false, hasSingle = false, hasVanity = false;
  hotspots.forEach(h => {
    const text = ((h.name || '') + ' ' + (h.shopifyTags || []).join(' ')).toLowerCase();
    if (/\b(double|dual)[\s-]*sink/.test(text)) hasDouble = true;
    if (/\b(single)[\s-]*sink/.test(text)) hasSingle = true;
    if (text.includes('vanity')) hasVanity = true;
  });
  if (hasDouble) return 'double-sink';
  if (hasSingle) return 'single-sink';
  return hasVanity ? 'single-sink' : 'no-sink';
}
function inferMount() {
  if (!SITE.vocab.mount) return '';
  let found = '';
  hotspots.forEach(h => {
    const text = ((h.name || '') + ' ' + (h.shopifyTags || []).join(' ')).toLowerCase();
    if (!found && text.includes('floating')) found = 'floating';
    else if (!found && (text.includes('freestanding') || text.includes('free-standing'))) found = 'freestanding';
    else if (!found && (text.includes('wall-mount') || text.includes('wall mount'))) found = 'wall-mounted';
  });
  return found;
}

function inferAllTags() {
  const out = {
    room: inferRoom(),
    aesthetic: inferMulti('aesthetic'),
    mood: inferMulti('mood'),
    palette: inferMulti('palette'),
    product_type: inferProductTypes()
  };
  if (SITE.vocab.size) out.size = inferSize();
  if (SITE.vocab.sink_count) out.sink_count = inferSinkCount();
  if (SITE.vocab.mount) out.mount = inferMount();
  return out;
}

function autoHandle(title) {
  return (title || '').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60);
}

/* ═══════════════════════════════════════════════
   V2: GENERATE JSON for Shopify metaobject
═══════════════════════════════════════════════ */
function generateJSON() {
  const img = document.getElementById('preview-img');
  const imgSrc = img.dataset.outputSrc || img.src;
  const title = (defaults.imageTitle || '').trim();
  const handle = autoHandle(title);
  const tags = inferAllTags();

  const obj = {
    handle: handle,
    title: title,
    image_url: imgSrc,
    alt_text: (defaults.imageAlt || 'Shop this look').trim(),
    popup_style: defaults.popup,
    site: SITE.key,
    created_date: new Date().toISOString().slice(0,10)
  };
  Object.assign(obj, tags);
  obj.hotspots_json = JSON.stringify(hotspots.map(h => ({
    x: parseFloat(h.x.toFixed(4)),
    y: parseFloat(h.y.toFixed(4)),
    name: h.name || '',
    url: normalizeURL(h.url),
    price: h.price || '',
    color: h.color,
    size: h.size,
    angle: h.angle || 0,
    style: h.style || 'pulsering',
    ringColor: h.ringColor || '#ffffff',
    altText: h.name || 'View product'
  })));

  // Completeness check
  const missing = [];
  if (!obj.title) missing.push('Image Title (in Default Settings)');
  if (!obj.handle) missing.push('Handle (auto from title)');
  if (!obj.image_url) missing.push('Image URL');
  if (!hotspots.length) missing.push('At least one hotspot');
  if (hotspots.some(h => !h.name || !h.url)) missing.push('Every hotspot needs a Name + URL');
  if (!obj.room) missing.push('Room could not be auto-detected — add more product hotspots');

  const check = document.getElementById('completeness-check');
  check.style.display = 'block';
  if (missing.length) {
    check.style.borderLeftColor = 'var(--danger)';
    check.style.color = '#ffb0b0';
    check.innerHTML = '<strong>⚠ Not ready to save:</strong> ' + missing.join(' · ');
  } else {
    check.style.borderLeftColor = 'var(--sage)';
    check.style.color = '#b0b0b0';
    let tagSummary = 'room: <strong style="color:#c09836">' + (obj.room || '(none)') + '</strong>';
    ['aesthetic','mood','palette','product_type','size','sink_count','mount'].forEach(d => {
      if (!(d in obj)) return;
      const v = obj[d];
      const vs = Array.isArray(v) ? v : (v ? [v] : []);
      if (vs.length) tagSummary += ' · ' + d + ': <span style="color:#c09836">' + vs.join(', ') + '</span>';
    });
    check.innerHTML = '<strong>✓ Ready.</strong> Auto-detected → ' + tagSummary;
  }

  document.getElementById('output-code').value = JSON.stringify(obj, null, 2);
  document.getElementById('output-bar').style.display = 'block';
  document.getElementById('output-bar').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function copyJSON() { copyHTML(); }  // same textarea

function copyHotspotsOnly() {
  const img = document.getElementById('preview-img');
  const hs = JSON.stringify(hotspots.map(h => ({
    x: parseFloat(h.x.toFixed(4)), y: parseFloat(h.y.toFixed(4)),
    name: h.name || '', url: normalizeURL(h.url), price: h.price || '',
    color: h.color, size: h.size, angle: h.angle || 0,
    style: h.style || 'pulsering', ringColor: h.ringColor || '#ffffff',
    altText: h.name || 'View product'
  })));
  navigator.clipboard.writeText(hs).then(() => alert('hotspots_json copied — paste into that single field on the metaobject.'));
}

/* ═══════════════════════════════════════════════
   V2: ONE-CLICK SAVE TO SHOPIFY via Cloudflare Worker
═══════════════════════════════════════════════ */
const WORKER_URL = 'https://hotspot-metaobject-proxy.lakebluemedia.workers.dev';

// Hotspot key: required by the Worker as X-Hotspot-Key. Kept only in this browser's localStorage.
const HOTSPOT_KEY_STORAGE = 'auraHotspotKey';
function getHotspotKey() {
  let k = localStorage.getItem(HOTSPOT_KEY_STORAGE);
  if (!k) {
    k = (prompt('Enter the hotspot key to save to Shopify (asked once, stored in this browser):') || '').trim();
    if (k) localStorage.setItem(HOTSPOT_KEY_STORAGE, k);
  }
  return k;
}

async function saveToShopify() {
  generateJSON();
  const jsonText = document.getElementById('output-code').value;
  let payload;
  try { payload = JSON.parse(jsonText); }
  catch(e) { showSaveError('Could not parse the JSON output. Try clicking Regenerate first.'); return; }

  const required = ['title','image_url','alt_text','room','hotspots_json'];
  const missing = required.filter(k => !payload[k] || (Array.isArray(payload[k]) && !payload[k].length));
  if (missing.length) {
    showSaveError('Cannot save — missing required fields: ' + missing.join(', ') + '.\n\nFill them in and try again. Check the red "Not ready to save" line above.');
    return;
  }

  const hotspotKey = getHotspotKey();
  if (!hotspotKey) {
    showSaveError('Save cancelled — no hotspot key was entered. The key is required to save to Shopify.');
    return;
  }

  const btn = event && event.target ? event.target.closest('button') : null;
  const originalHTML = btn ? btn.innerHTML : '';
  if (btn) { btn.disabled = true; btn.innerHTML = '⏳ Saving…'; btn.style.opacity = '.7'; }

  try {
    const res = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Hotspot-Key': hotspotKey },
      body: JSON.stringify({ site: SITE.key, metaobject: payload })
    });
    if (res.status === 401) {
      localStorage.removeItem(HOTSPOT_KEY_STORAGE);
      alert('Hotspot key rejected - reload and re-enter it');
    }
    const data = await res.json();

    if (btn) { btn.disabled = false; btn.innerHTML = originalHTML; btn.style.opacity = '1'; }

    if (data.success) {
      showSaveSuccess(data.handle, data.embed);
    } else {
      const detail = data.details ? '\n\nDetails: ' + JSON.stringify(data.details, null, 2) : '';
      showSaveError((data.error || 'Unknown error') + (data.message ? ': ' + data.message : '') + detail);
    }
  } catch(e) {
    if (btn) { btn.disabled = false; btn.innerHTML = originalHTML; btn.style.opacity = '1'; }
    showSaveError('Network error contacting the Worker: ' + e.message);
  }
}

function showSaveSuccess(handle, _ignoredEmbedFromWorker) {
  // Construct both formats from the handle — do NOT trust the Worker's `embed` field,
  // which may return either format depending on Worker version.
  const shortcode = '[shoppable:' + handle + ']';
  const liquidTag = "{% render 'shoppable-image', handle: '" + handle + "' %}";
  const check = document.getElementById('completeness-check');
  check.style.display = 'block';
  check.style.borderLeftColor = 'var(--sage)';
  check.style.color = '#d0d0d0';
  check.innerHTML =
    '<div style="font-size:13px;margin-bottom:6px"><strong style="color:#c09836">✓ Saved to Shopify!</strong></div>' +
    '<div style="font-size:11px;margin-bottom:8px">Handle: <code style="background:#0a0a0a;padding:2px 6px;border-radius:2px;color:#c09836">' + handle + '</code></div>' +
    '<div style="font-size:11px;margin-bottom:4px"><strong>For blog posts &amp; pages</strong> — paste this shortcode in the HTML:</div>' +
    '<div style="display:flex;gap:6px;align-items:stretch;margin-bottom:10px">' +
      '<code id="embed-snippet" style="flex:1;background:#0a0a0a;padding:8px 10px;border-radius:2px;color:#efefef;font-size:12px;overflow-x:auto;white-space:nowrap">' + shortcode + '</code>' +
      '<button onclick="copyEmbedSnippet()" style="font-family:DM Mono,monospace;font-size:10px;padding:6px 10px;background:var(--sage);color:#fff;border:none;border-radius:2px;cursor:pointer;text-transform:uppercase;letter-spacing:.06em;white-space:nowrap">Copy</button>' +
    '</div>' +
    '<div style="font-size:10px;color:#9a9a9a;line-height:1.5">For direct use inside a theme template (.liquid) file:<br><code style="background:#0a0a0a;padding:2px 5px;border-radius:2px;color:#9a9a9a;font-size:10px">' + liquidTag + '</code></div>';
  check.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showSaveError(msg) {
  const check = document.getElementById('completeness-check');
  check.style.display = 'block';
  check.style.borderLeftColor = 'var(--danger)';
  check.style.color = '#ffb0b0';
  check.innerHTML = '<strong>⚠ Save failed:</strong><pre style="white-space:pre-wrap;font-family:DM Mono,monospace;font-size:10px;margin-top:6px">' + msg + '</pre>';
  check.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function copyEmbedSnippet() {
  const el = document.getElementById('embed-snippet');
  if (!el) return;
  navigator.clipboard.writeText(el.textContent).then(() => {
    const btn = event.target;
    const orig = btn.textContent;
    btn.textContent = '✓ Copied!';
    setTimeout(() => { btn.textContent = orig; }, 1800);
  });
}

/* ═══════════════════════════════════════════════
   BOOT
═══════════════════════════════════════════════ */
init();
