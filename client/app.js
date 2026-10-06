/* =========================================================
   SpeedMaxx client portal — demo front end
   All data below is generated sample data. Wire the DATA layer
   to your billing / ACS / RADIUS API to make it real.
   ========================================================= */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasG = typeof gsap !== 'undefined';
  const anim = hasG && !reduce;
  const hasChart = typeof Chart !== 'undefined';
  if (!anim) root.classList.remove('anim');
  const ico = n => `<svg class="i"><use href="#i-${n}"/></svg>`;
  const css = v => getComputedStyle(root).getPropertyValue(v).trim();
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
  const f1 = n => (Math.round(n * 10) / 10).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hexA = (hex, a) => { const h = hex.replace('#', ''); const n = parseInt(h.length === 3 ? h.replace(/./g, '$&$&') : h, 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  const vibrate = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const DAY = 864e5;
  const fmtDate = (d, o = { day: 'numeric', month: 'short', year: 'numeric' }) => d.toLocaleDateString('en-IN', o);
  const tween = (dur, fn) => new Promise(res => {
    const t0 = performance.now();
    const f = t => { const p = Math.min(1, (t - t0) / dur); fn(1 - Math.pow(1 - p, 3), p); p < 1 ? requestAnimationFrame(f) : res(); };
    requestAnimationFrame(f);
  });
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /* ================= THEME (shared with the marketing site) ================= */
  const charts = [];
  function setTheme(t, persist) {
    root.setAttribute('data-theme', t);
    if (persist) { try { localStorage.setItem('smx-theme', t); } catch (e) {} }
    const m = $('meta[name="theme-color"]'); if (m) m.setAttribute('content', t === 'dark' ? '#070b14' : '#f1f4f9');
    charts.forEach(c => c.restyle && c.restyle());
    drawLoginNet();
  }
  document.addEventListener('click', e => {
    if (!e.target.closest('[data-theme-toggle]')) return;
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    if (document.startViewTransition && !reduce) document.startViewTransition(() => setTheme(next, true)); else setTheme(next, true);
  });

  /* ================= DEMO DATA ================= */
  const USER = { id: 'SMX100245', name: 'Demo Customer', mobile: '98XXXXXX45', email: 'demo.customer@example.com', address: 'Flat 12, Shivaji Nagar, Shirdi, Maharashtra 423109', since: new Date(Date.now() - 436 * DAY), region: 'Shirdi · Shrirampur', type: 'FTTH fiber' };
  const PLAN = { name: '300 Mbps Unlimited', speed: 300, term: 12, price: 7188, start: new Date(Date.now() - 160 * DAY), perks: ['Free OTT', 'GST included'] };
  PLAN.end = new Date(PLAN.start.getTime() + 365 * DAY);
  PLAN.daysLeft = Math.max(0, Math.ceil((PLAN.end - Date.now()) / DAY));

  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const R = rng(26101);
  const midnight = new Date(); midnight.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 90 }, (_, i) => {
    const date = new Date(midnight.getTime() - (89 - i) * DAY);
    const wk = [0, 6].includes(date.getDay());
    let down = 11 + (wk ? 7 : 0) + R() * 8 + (R() < .07 ? 16 + R() * 14 : 0);
    return { date, down: +down.toFixed(1), up: +(down * (.08 + R() * .07)).toFixed(1) };
  });
  const HOURLY = [.2, .12, .08, .06, .06, .1, .3, .6, .7, .6, .55, .6, .8, .75, .65, .7, .9, 1.2, 1.7, 2.2, 2.4, 2.0, 1.2, .6];
  const nowH = new Date().getHours();
  const hours = HOURLY.map((v, h) => { const d = v * (.85 + R() * .35); return { h, down: +d.toFixed(2), up: +(d * (.1 + R() * .06)).toFixed(2) }; });
  const todayGB = hours.slice(0, nowH + 1).reduce((s, x) => s + x.down + x.up, 0);
  const CATS = [['Streaming', 'tv', 41], ['Browsing & social', 'globe', 23], ['Gaming', 'game', 13], ['Downloads & updates', 'download', 12], ['Video calls', 'cam', 8], ['Other', 'sliders', 3]];

  const sum = (a, k) => a.reduce((s, x) => s + x[k], 0);
  const last30 = days.slice(-30), prev30 = days.slice(-60, -30);
  const tot30 = sum(last30, 'down') + sum(last30, 'up'), totPrev = sum(prev30, 'down') + sum(prev30, 'up');

  const DEVICES = [
    { id: 'd1', name: 'Living Room TV', type: 'tv', ip: '192.168.1.12', mac: 'A4:77:33:1C:9E:02', band: '5 GHz', rssi: -52, gb: 118, on: true },
    { id: 'd2', name: 'Work Laptop', type: 'laptop', ip: '192.168.1.21', mac: '3C:22:FB:7A:10:5D', band: '5 GHz', rssi: -47, gb: 96, on: true },
    { id: 'd3', name: 'Gaming PC', type: 'game', ip: '192.168.1.30', mac: 'D8:BB:C1:4F:6A:91', band: 'LAN', rssi: -40, gb: 74, on: true },
    { id: 'd4', name: 'Mobile — Priya', type: 'phone', ip: '192.168.1.44', mac: 'F0:18:98:B2:CA:37', band: '5 GHz', rssi: -58, gb: 52, on: true },
    { id: 'd5', name: 'Tablet', type: 'tablet', ip: '192.168.1.47', mac: '60:AB:67:0D:E3:18', band: '2.4 GHz', rssi: -66, gb: 31, on: true },
    { id: 'd6', name: 'CCTV Camera', type: 'cam', ip: '192.168.1.60', mac: '9C:8E:CD:11:22:F4', band: '2.4 GHz', rssi: -71, gb: 22, on: true },
    { id: 'd7', name: 'Smart Speaker', type: 'speaker', ip: '192.168.1.63', mac: 'B8:27:EB:90:3A:6C', band: '2.4 GHz', rssi: -63, gb: 6, on: true },
    { id: 'd8', name: 'Guest Phone', type: 'phone', ip: '192.168.1.88', mac: '44:07:0B:5E:D1:A0', band: '5 GHz', rssi: -75, gb: 3, on: false }
  ];
  const BILLS = [
    { id: 'INV-26-0418', title: '300 Mbps Unlimited · 12 months', date: PLAN.start, amt: 7188, via: 'UPI' },
    { id: 'INV-25-0722', title: '200 Mbps Unlimited · 6 months', date: new Date(Date.now() - 531 * DAY), amt: 3450, via: 'Card' },
    { id: 'INV-25-0109', title: '200 Mbps Unlimited · 3 months', date: new Date(Date.now() - 713 * DAY), amt: 1875, via: 'UPI' },
    { id: 'INV-24-1011', title: 'New connection · 1 month', date: new Date(Date.now() - 800 * DAY), amt: 675, via: 'Cash' }
  ];
  const TICKETS0 = [
    { id: 'TKT-2041', cat: 'Slow speed', text: 'Speed dropped in the evening on 5 GHz.', st: 'Resolved', date: new Date(Date.now() - 41 * DAY) },
    { id: 'TKT-1987', cat: 'Billing', text: 'Invoice copy needed for office records.', st: 'Resolved', date: new Date(Date.now() - 118 * DAY) }
  ];
  const NOTIFS = [
    { ic: 'check', cls: 'good', t: 'Payment received', s: `${inr(PLAN.price)} for ${PLAN.name} — thank you`, when: fmtDate(PLAN.start, { day: 'numeric', month: 'short' }) },
    { ic: 'shield', cls: 'accent', t: 'Security update installed', s: 'Router firmware updated to v2.4.1', when: '3 days ago' },
    { ic: 'info', cls: '', t: 'Planned maintenance', s: 'Brief fiber maintenance in Shirdi, 2:00–3:00 AM Sunday', when: '5 days ago' }
  ];
  const state = store.get('smx-demo-state', null) || {
    wifi: {
      '2g': { on: true, ssid: 'SpeedMaxx_Home', pass: 'Sm@rt2026', channel: 'Auto', sec: 'WPA2/WPA3', hidden: false },
      '5g': { on: true, ssid: 'SpeedMaxx_Home_5G', pass: 'Sm@rt2026', channel: 'Auto', sec: 'WPA2/WPA3', hidden: false }
    },
    guest: { on: false, ssid: 'SpeedMaxx_Guest', pass: 'Welcome123' },
    adv: { dns: 'Automatic (ISP)', parental: false, qos: true, wps: false },
    blocked: [], autoRenew: true, notif: { usage: true, bills: true, outage: true }
  };
  state.tickets = (state.tickets || []).map(t => ({ ...t, date: new Date(t.date) }));
  const saveState = () => store.set('smx-demo-state', { ...state, tickets: state.tickets });
  const router = { online: true, booting: false, bootAt: Date.now() - (12 * 24 + 4) * 3600e3 };
  const allTickets = () => [...state.tickets, ...TICKETS0].sort((a, b) => b.date - a.date);

  /* ================= TOASTS ================= */
  function toast(msg, type = 'ok') {
    const el = document.createElement('div');
    el.className = 'toast ' + (type === 'ok' ? '' : type);
    el.innerHTML = ico(type === 'err' ? 'alert' : type === 'info' ? 'info' : 'check') + `<span>${esc(msg)}</span>`;
    $('#toasts').appendChild(el);
    const kill = () => { if (anim) gsap.to(el, { y: 14, opacity: 0, duration: .3, onComplete: () => el.remove() }); else el.remove(); };
    if (anim) gsap.from(el, { y: 24, opacity: 0, scale: .94, duration: .45, ease: 'back.out(1.8)' });
    setTimeout(kill, 3200);
  }

  /* ================= SHEETS ================= */
  const sheetRoot = $('#sheet-root'), sheet = $('.sheet', sheetRoot), sheetBody = $('#sheet-body');
  let sheetOnClose = null, lastFocus = null;
  const isDesktop = () => matchMedia('(min-width: 901px)').matches;
  function openSheet(title, html, mount, onClose) {
    lastFocus = document.activeElement;
    $('#sheet-title').textContent = title;
    sheetBody.innerHTML = html;
    sheetOnClose = onClose || null;
    sheetRoot.hidden = false;
    document.body.style.overflow = 'hidden';
    if (anim) {
      gsap.fromTo($('.backdrop', sheetRoot), { opacity: 0 }, { opacity: 1, duration: .3 });
      gsap.fromTo(sheet, isDesktop() ? { y: 30, opacity: 0, scale: .96 } : { yPercent: 100 }, isDesktop() ? { y: 0, opacity: 1, scale: 1, duration: .45, ease: 'power3.out' } : { yPercent: 0, duration: .5, ease: 'power4.out' });
    }
    mount && mount(sheetBody);
    sheet.focus({ preventScroll: true });
  }
  function closeSheet(instant) {
    if (sheetRoot.hidden) return;
    const done = () => { sheetRoot.hidden = true; document.body.style.overflow = ''; sheetBody.innerHTML = ''; hasG && gsap.set(sheet, { clearProps: 'all' }); if (sheetOnClose) sheetOnClose(); sheetOnClose = null; lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true }); };
    if (anim && !instant) {
      gsap.to($('.backdrop', sheetRoot), { opacity: 0, duration: .25 });
      gsap.to(sheet, isDesktop() ? { y: 20, opacity: 0, duration: .25, onComplete: done } : { yPercent: 100, duration: .35, ease: 'power3.in', onComplete: done });
    } else done();
  }
  sheetRoot.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeSheet(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });
  // swipe-down to dismiss (mobile)
  (() => {
    let y0 = null, dy = 0;
    const g = $('.grab', sheet);
    g.addEventListener('pointerdown', e => { y0 = e.clientY; dy = 0; g.setPointerCapture(e.pointerId); });
    g.addEventListener('pointermove', e => { if (y0 == null) return; dy = Math.max(0, e.clientY - y0); sheet.style.transform = `translateY(${dy}px)`; });
    const end = () => { if (y0 == null) return; y0 = null; if (dy > 110) { closeSheet(); vibrate(8); } else if (anim) gsap.to(sheet, { y: 0, duration: .35, ease: 'back.out(2)', clearProps: 'transform' }); else sheet.style.transform = ''; };
    g.addEventListener('pointerup', end); g.addEventListener('pointercancel', end);
  })();

  /* ================= LOGIN NETWORK BG ================= */
  const lcv = $('#login-net'), lctx = lcv.getContext('2d');
  let lw, lh, lnodes = [], lrunning = false, lrgb = '130,150,190', lacc = '255,106,19';
  function drawLoginNet(step) {
    lrgb = css('--faint') ? '130,150,190' : lrgb;
    lacc = css('--accent-rgb') || lacc;
    if (!lw) return;
    lctx.clearRect(0, 0, lw, lh);
    const lightMode = root.getAttribute('data-theme') === 'light';
    const base = lightMode ? '71,85,125' : '130,150,190';
    for (let i = 0; i < lnodes.length; i++) {
      const a = lnodes[i];
      if (step) { a.x += a.vx; a.y += a.vy; if (a.x < -20) a.x = lw + 20; if (a.x > lw + 20) a.x = -20; if (a.y < -20) a.y = lh + 20; if (a.y > lh + 20) a.y = -20; }
      for (let j = i + 1; j < lnodes.length; j++) {
        const b = lnodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 150) { lctx.strokeStyle = `rgba(${base},${(1 - d / 150) * .3})`; lctx.beginPath(); lctx.moveTo(a.x, a.y); lctx.lineTo(b.x, b.y); lctx.stroke(); }
      }
      lctx.fillStyle = `rgba(${i % 9 === 0 ? lacc : base},${i % 9 === 0 ? .9 : .6})`;
      lctx.beginPath(); lctx.arc(a.x, a.y, i % 9 === 0 ? 2.4 : 1.4, 0, 6.283); lctx.fill();
    }
  }
  function loginNetInit() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    lw = innerWidth; lh = innerHeight; lcv.width = lw * dpr; lcv.height = lh * dpr; lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = clamp(Math.round(lw * lh / 20000), 20, 70);
    lnodes = Array.from({ length: n }, () => ({ x: Math.random() * lw, y: Math.random() * lh, vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3 }));
  }
  function loginNetLoop() { if (!lrunning) return; drawLoginNet(true); requestAnimationFrame(loginNetLoop); }
  loginNetInit();
  if (reduce) drawLoginNet(false); else { lrunning = true; loginNetLoop(); }
  addEventListener('resize', () => { loginNetInit(); if (!lrunning) drawLoginNet(false); });
  document.addEventListener('visibilitychange', () => { if (reduce || $('#login').hidden) return; if (document.hidden) lrunning = false; else if (!lrunning) { lrunning = true; loginNetLoop(); } });

  /* ================= AUTH ================= */
  const SKEY = 'smx-session';
  const getSession = () => { try { return JSON.parse(localStorage.getItem(SKEY) || sessionStorage.getItem(SKEY) || 'null'); } catch (e) { return null; } };
  const setSession = (remember) => { try { (remember ? localStorage : sessionStorage).setItem(SKEY, JSON.stringify({ id: USER.id, t: Date.now() })); } catch (e) {} };
  const clearSession = () => { try { localStorage.removeItem(SKEY); sessionStorage.removeItem(SKEY); } catch (e) {} };

  const loginCard = $('#login-card'), errEl = $('#lg-err');
  const showErr = (m, ok) => { errEl.textContent = m; errEl.classList.toggle('ok', !!ok); };
  const shake = () => { loginCard.classList.remove('shake'); void loginCard.offsetWidth; loginCard.classList.add('shake'); vibrate([20, 30, 20]); };

  function segInd(seg) { const on = $('button.on', seg), ind = $('.ind', seg); if (on && ind) ind.style.cssText = `left:${on.offsetLeft}px;top:${on.offsetTop}px;width:${on.offsetWidth}px;height:${on.offsetHeight}px`; }
  const lseg = $('#login-seg');
  lseg.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $$('button', lseg).forEach(x => x.classList.toggle('on', x === b)); segInd(lseg);
    const otp = b.dataset.m === 'otp';
    $('#form-pw').hidden = otp; $('#form-otp').hidden = !otp; showErr('');
    const f = otp ? $('#form-otp') : $('#form-pw');
    if (anim) gsap.from(f, { opacity: 0, y: 10, duration: .35 });
  });
  addEventListener('resize', () => segInd(lseg));

  $('#lg-eye').addEventListener('click', () => {
    const i = $('#lg-pw'), show = i.type === 'password'; i.type = show ? 'text' : 'password';
    $('#lg-eye').innerHTML = ico(show ? 'eye-off' : 'eye'); $('#lg-eye').setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  });
  $('#forgot').addEventListener('click', e => { e.preventDefault(); showErr('Password reset is disabled in this demo. Use the demo account below.', true); });
  $('#use-demo').addEventListener('click', () => {
    if (!$('#form-otp').hidden) $('button[data-m="pw"]', lseg).click();
    $('#lg-id').value = USER.id; $('#lg-pw').value = 'demo123'; showErr('');
    submitPw();
  });

  function setLoading(btn, on) { btn.classList.toggle('loading', on); btn.disabled = on; }
  async function finishLogin(btn, remember) {
    await sleep(900);
    setLoading(btn, false);
    btn.querySelector('.bl').innerHTML = ico('check') + ' Signed in'; btn.classList.remove('loading');
    setSession(remember); vibrate(15);
    await sleep(450);
    enterApp(true);
  }
  function submitPw() {
    const id = $('#lg-id').value.trim().toUpperCase(), pw = $('#lg-pw').value, btn = $('#lg-btn');
    $$('.field', $('#form-pw')).forEach(f => f.classList.remove('err'));
    if (!id || !pw) { showErr('Enter your customer ID (or mobile) and password.'); $$('.field', $('#form-pw')).forEach((f, i) => { if (!(i ? pw : id)) f.classList.add('err'); }); shake(); return; }
    showErr(''); setLoading(btn, true);
    sleep(1000).then(() => {
      const ok = (id === USER.id || id === '8109092323') && pw === 'demo123';
      if (!ok) { setLoading(btn, false); showErr('Incorrect ID or password. Try the demo account below.'); shake(); return; }
      finishLogin(btn, $('#lg-rem').checked);
    });
  }
  $('#form-pw').addEventListener('submit', e => { e.preventDefault(); submitPw(); });

  // OTP flow
  const otpBoxes = $$('#otp-boxes input'); let otpSent = false, otpTimer = null;
  otpBoxes.forEach((b, i) => {
    b.addEventListener('input', () => { b.value = b.value.replace(/\D/g, '').slice(0, 1); if (b.value && otpBoxes[i + 1]) otpBoxes[i + 1].focus(); });
    b.addEventListener('keydown', e => { if (e.key === 'Backspace' && !b.value && otpBoxes[i - 1]) otpBoxes[i - 1].focus(); });
    b.addEventListener('paste', e => { const t = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6); if (!t) return; e.preventDefault(); otpBoxes.forEach((x, k) => x.value = t[k] || ''); otpBoxes[Math.min(t.length, 5)].focus(); });
  });
  $('#form-otp').addEventListener('submit', e => {
    e.preventDefault();
    const mob = $('#otp-mobile').value.replace(/\D/g, ''), btn = $('#otp-btn');
    if (!otpSent) {
      if (!/^[6-9]\d{9}$/.test(mob)) { showErr('Enter a valid 10-digit mobile number.'); shake(); return; }
      showErr(''); setLoading(btn, true);
      sleep(900).then(() => {
        setLoading(btn, false); otpSent = true; $('#otp-step2').hidden = false; btn.querySelector('.bl').textContent = 'Verify & sign in';
        if (anim) gsap.from('#otp-step2', { opacity: 0, y: 12, duration: .4 });
        otpBoxes[0].focus(); let s = 30; const hint = $('#otp-hint'); clearInterval(otpTimer);
        const tick = () => { hint.textContent = `Demo OTP is 123456 · resend in ${s}s`; if (s-- <= 0) { clearInterval(otpTimer); hint.textContent = 'Demo OTP is 123456'; } }; tick(); otpTimer = setInterval(tick, 1000);
      });
      return;
    }
    const code = otpBoxes.map(b => b.value).join('');
    if (code.length < 6) { showErr('Enter all 6 digits.'); shake(); return; }
    showErr(''); setLoading(btn, true);
    sleep(900).then(() => { if (code !== '123456') { setLoading(btn, false); showErr('Incorrect code. The demo OTP is 123456.'); shake(); otpBoxes.forEach(b => b.value = ''); otpBoxes[0].focus(); return; } finishLogin(btn, true); });
  });

  /* ================= TEMPLATES ================= */
  const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
  const spark = arr => {
    const w = 100, h = 30, mn = Math.min(...arr), mx = Math.max(...arr), rg = (mx - mn) || 1;
    const pts = arr.map((v, i) => [i * w / (arr.length - 1), h - 4 - ((v - mn) / rg) * (h - 8)]);
    const l = pts[pts.length - 1];
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><path d="M${pts.map(p => p.map(n => n.toFixed(1)).join(',')).join(' L')}"/></svg>`;
  };
  const kpi = (icon, label, val, unit, delta, sp) => `<article class="card kpi"><div class="top-row"><span>${label}</span>${ico(icon)}</div><b>${val}<small>${unit}</small></b><span class="delta">${delta}</span>${sp ? spark(sp) : ''}</article>`;
  const pct = (a, b) => b ? Math.round((a - b) / b * 100) : 0;
  const deltaTxt = (a, b, what) => { const p = pct(a, b); return `${ico(p >= 0 ? 'trend-up' : 'trend-down')}${p >= 0 ? '+' : ''}${p}% ${what}`; };
  const devOnline = () => DEVICES.filter(d => d.on && !state.blocked.includes(d.id)).length;
  const sigCls = r => r > -55 ? 4 : r > -65 ? 3 : r > -72 ? 2 : 1;
  const sigHTML = r => { const n = sigCls(r); return `<span class="bars-sig ${n === 2 ? 'mid' : n === 1 ? 'low' : ''}" title="Signal ${r} dBm" aria-label="Signal ${n} of 4">${[1, 2, 3, 4].map(k => `<i class="${k <= n ? 'on' : ''}"></i>`).join('')}</span>`; };
  const uptimeTxt = () => { const s = Math.floor((Date.now() - router.bootAt) / 1000), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60); return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`; };

  function homeHTML() {
    const ringC = 2 * Math.PI * 44, frac = clamp(PLAN.daysLeft / 365, 0, 1);
    const dTot = sum(last30, 'down'), uTot = sum(last30, 'up');
    const last12 = days.slice(-12);
    return `
    <div class="greet"><div><p class="muted">${greeting()},</p><h2>${esc(USER.name.split(' ')[0])}</h2></div><span class="chip good" id="home-status"><i></i>Online</span></div>

    <div class="g g2">
      <article class="card plan-card">
        <div class="plan-top">
          <div>
            <span class="mono muted">Current plan</span>
            <div class="plan-name">${PLAN.speed}<small>Mbps unlimited</small></div>
            <div class="tags"><span class="chip">${PLAN.term}-month</span><span class="chip">${esc(USER.region)}</span><span class="chip">${PLAN.perks[0]}</span></div>
          </div>
          <div class="ring" role="img" aria-label="${PLAN.daysLeft} days left">
            <svg viewBox="0 0 100 100"><defs><linearGradient id="ringg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#ff6a13"/><stop offset="1" stop-color="#2dd4ff"/></linearGradient></defs>
              <circle class="bg" cx="50" cy="50" r="44"/><circle class="fg" id="ring-fg" cx="50" cy="50" r="44" stroke-dasharray="${ringC}" stroke-dashoffset="${ringC}" data-to="${ringC * (1 - frac)}"/></svg>
            <div class="ring-c"><b data-count="${PLAN.daysLeft}">0</b><span>days left</span></div>
          </div>
        </div>
        <div class="plan-foot">
          <span class="muted" style="font-size:.88rem">Valid till <b style="color:#fff">${fmtDate(PLAN.end)}</b></span>
          <div class="btn-row"><button class="btn btn-primary btn-sm" data-go="bills">Renew / upgrade</button><button class="btn btn-ghost btn-sm" data-act="speedtest">${ico('gauge')}Speed test</button></div>
        </div>
      </article>

      <article class="card hero-card">
        <div><span class="lbl">Data used · last 30 days</span>
          <div class="hero-fig"><b data-count="${Math.round(tot30)}">0</b><small>GB</small></div>
          <span class="delta">${deltaTxt(tot30, totPrev, 'vs previous 30 days')}</span></div>
        <div><div class="meter" role="img" aria-label="Download ${f1(dTot)} GB, upload ${f1(uTot)} GB"><i data-w="${dTot / (dTot + uTot) * 100}"></i><i></i></div>
          <div class="legend" style="margin-top:12px"><span><i class="key"></i>Download <b>${f1(dTot)} GB</b></span><span><i class="key s2"></i>Upload <b>${f1(uTot)} GB</b></span></div></div>
        <span class="lbl">Your ${PLAN.speed} Mbps plan has unlimited data — usage is shown for your information.</span>
      </article>
    </div>

    <div class="kpis">
      ${kpi('clock', 'Today so far', f1(todayGB), 'GB', deltaTxt(todayGB, days[88].down + days[88].up, 'vs yesterday'), days.slice(-12).map(d => d.down + d.up))}
      ${kpi('activity', 'Daily average', f1(tot30 / 30), 'GB', deltaTxt(tot30, totPrev, 'vs prev. 30d'), last12.map(d => d.down))}
      ${kpi('bolt', 'Latency', '4', 'ms', `<span style="color:var(--good)">${ico('check')}Excellent</span>`, [5, 4, 4, 6, 4, 4, 3, 5, 4, 4, 3, 4])}
      ${kpi('users', 'Devices online', `<span id="kpi-dev">${devOnline()}</span>`, `of ${DEVICES.length}`, `${ico('wifi')}2 Wi-Fi bands active`, null)}
    </div>

    <div class="g g2">
      <article class="card">
        <div class="card-h"><div><h3>Live throughput</h3><span class="sub">Your connection right now · simulated</span></div><span class="chip good"><i></i>Live</span></div>
        <div class="now-vals"><div><b id="live-d">0.0</b><small><i class="key line"></i>Download Mbps</small></div><div><b id="live-u">0.0</b><small><i class="key line s2"></i>Upload Mbps</small></div></div>
        <div class="chart-box sm"><canvas id="ch-live" aria-label="Live download and upload throughput chart" role="img"></canvas></div>
      </article>
      <article class="card">
        <div class="card-h"><h3>Connection</h3><span class="chip good" id="conn-chip">${ico('check')}Healthy</span></div>
        <div class="kv" id="conn-kv">
          <div><span>Public IP</span><b class="mono-v">103.57.84.112</b></div>
          <div><span>Connection type</span><b>${USER.type}</b></div>
          <div><span>Router uptime</span><b id="kv-up">${uptimeTxt()}</b></div>
          <div><span>Optical signal (ONT)</span><b style="color:var(--good)">−19.4 dBm · Good</b></div>
          <div><span>Wi-Fi bands</span><b>2.4 GHz · 5 GHz</b></div>
        </div>
      </article>
    </div>

    <h3 class="sec">Quick actions</h3>
    <div class="qa">
      <button data-act="speedtest">${ico('gauge')}Speed test</button>
      <button data-go="bills">${ico('card')}Pay / Renew</button>
      <button data-act="reboot">${ico('power')}Reboot</button>
      <button data-act="ticket">${ico('headset')}Support</button>
    </div>

    <h3 class="sec">Recent activity</h3>
    <article class="card list">${NOTIFS.map(n => `<div class="li"><span class="ico ${n.cls}">${ico(n.ic)}</span><div class="grow"><b>${esc(n.t)}</b><small>${esc(n.s)}</small></div><div class="end">${esc(n.when)}</div></div>`).join('')}</article>`;
  }

  function usageHTML() {
    return `
    <div class="filter-row">
      <div class="seg" id="range-seg" role="tablist" aria-label="Date range"><span class="ind"></span><button class="on" data-r="7">7 days</button><button data-r="30">30 days</button><button data-r="90">90 days</button></div>
      <span class="spacer"></span>
      <div class="seg" id="mode-seg" aria-label="View"><span class="ind"></span><button class="on" data-m="chart">Chart</button><button data-m="table">Table</button></div>
    </div>
    <div class="kpis" id="usage-kpis"></div>
    <article class="card" style="margin-bottom:16px">
      <div class="card-h"><div><h3>Daily data usage</h3><span class="sub" id="usage-sub"></span></div>
        <div class="legend"><span><i class="key"></i>Download</span><span><i class="key s2"></i>Upload</span></div></div>
      <div id="usage-chart"><div class="chart-box"><canvas id="ch-usage" aria-label="Stacked column chart of daily download and upload in GB" role="img"></canvas></div></div>
      <div id="usage-table" hidden><div class="tbl-wrap tbl-scroll"><table class="tbl"><thead><tr><th>Date</th><th class="n">Download</th><th class="n">Upload</th><th class="n">Total</th></tr></thead><tbody></tbody></table></div></div>
    </article>
    <div class="g g-eq">
      <article class="card">
        <div class="card-h"><div><h3>Today by hour</h3><span class="sub">GB per hour · ${fmtDate(new Date(), { weekday: 'long', day: 'numeric', month: 'short' })}</span></div>
          <div class="legend"><span><i class="key line"></i>Down</span><span><i class="key line s2"></i>Up</span></div></div>
        <div class="chart-box sm"><canvas id="ch-hour" aria-label="Line chart of today's usage per hour" role="img"></canvas></div>
      </article>
      <article class="card">
        <div class="card-h"><div><h3>Where your data goes</h3><span class="sub">Share of last 30 days · estimated</span></div></div>
        <div class="chart-box sm"><canvas id="ch-cat" aria-label="Bar chart of data usage share by category" role="img"></canvas></div>
      </article>
    </div>
    <article class="card" style="margin-top:16px">
      <div class="card-h"><div><h3>Top devices</h3><span class="sub">Data used in last 30 days</span></div></div>
      <div class="bars">${[...DEVICES].sort((a, b) => b.gb - a.gb).slice(0, 6).map(d => `<div class="bar-row"><div class="meta"><span>${ico(d.type)}${esc(d.name)}</span><b>${d.gb} GB</b></div><div class="track" role="img" aria-label="${esc(d.name)} ${d.gb} GB"><i data-w="${d.gb / DEVICES[0].gb * 100}"></i></div></div>`).join('')}</div>
    </article>`;
  }

  const bandForm = (k, label, sub, chans) => {
    const w = state.wifi[k];
    return `<article class="card" data-band="${k}">
      <div class="band-h"><span class="ico">${ico('wifi')}</span><div class="grow"><b>${label}</b><small>${sub}</small></div><label class="sw"><input type="checkbox" data-f="on" ${w.on ? 'checked' : ''} aria-label="Enable ${label}"><span></span></label></div>
      <div class="form-grid">
        <div><label class="lab" for="${k}-ssid">Network name (SSID)</label><div class="field"><input id="${k}-ssid" data-f="ssid" value="${esc(w.ssid)}" maxlength="32"></div></div>
        <div><label class="lab" for="${k}-pass">Wi-Fi password</label><div class="field"><input id="${k}-pass" data-f="pass" type="password" value="${esc(w.pass)}" minlength="8" maxlength="63"><button type="button" class="eye" data-eye aria-label="Show password">${ico('eye')}</button><button type="button" class="eye" data-copy aria-label="Copy password">${ico('copy')}</button></div></div>
        <div><label class="lab" for="${k}-ch">Channel</label><div class="field"><select id="${k}-ch" data-f="channel">${chans.map(c => `<option ${c === w.channel ? 'selected' : ''}>${c}</option>`).join('')}</select></div></div>
        <div><label class="lab" for="${k}-sec">Security</label><div class="field"><select id="${k}-sec" data-f="sec">${['WPA2/WPA3', 'WPA2', 'WPA3'].map(c => `<option ${c === w.sec ? 'selected' : ''}>${c}</option>`).join('')}</select></div></div>
      </div>
      <div class="toggle-row"><div><b>Hide network name</b><small>Devices must type the SSID manually</small></div><label class="sw"><input type="checkbox" data-f="hidden" ${w.hidden ? 'checked' : ''}><span></span></label></div>
      <div class="btn-row" style="margin-top:14px"><button class="btn btn-primary btn-sm" data-save="${k}" disabled><span class="bl">Save changes</span><span class="spin"></span></button></div>
    </article>`;
  };
  function routerHTML() {
    const a = state.adv, g = state.guest;
    return `
    <article class="card" style="margin-bottom:16px">
      <div class="router-hero">
        <div class="router-art" id="router-art">${ico('router')}</div>
        <div class="router-info"><h3>SpeedMaxx Wi-Fi 6 Router</h3><p class="muted" style="font-size:.88rem">Dual-band AX · Model SMX-AX1800 (demo)</p>
          <div style="margin-top:10px" class="row"><span class="chip good" id="r-chip"><i></i>Online</span><span class="chip">Firmware v2.4.1</span></div></div>
        <div class="btn-row"><button class="btn btn-ghost btn-sm" data-act="refresh">${ico('refresh')}Refresh</button><button class="btn btn-danger btn-sm" data-act="reboot">${ico('power')}Reboot</button></div>
      </div>
      <div class="progress" id="r-prog" hidden><i></i></div><p class="muted" id="r-step" style="font-size:.84rem;margin-top:8px" hidden></p>
      <div class="kv kv-2" style="margin-top:14px" id="r-kv">
        <div><span>LAN IP</span><b class="mono-v">192.168.1.1</b></div><div><span>Public IP</span><b class="mono-v">103.57.84.112</b></div>
        <div><span>Uptime</span><b id="r-up">${uptimeTxt()}</b></div><div><span>MAC address</span><b class="mono-v">A4:77:33:1C:90:00</b></div>
      </div>
    </article>

    <div class="g g-eq">${bandForm('2g', 'Wi-Fi 2.4 GHz', 'Longer range · smart-home friendly', ['Auto', '1', '6', '11'])}${bandForm('5g', 'Wi-Fi 5 GHz', 'Faster speeds · best for streaming', ['Auto', '36', '40', '44', '48', '149', '153', '157', '161'])}</div>

    <div class="g g-eq">
      <article class="card" data-guest>
        <div class="band-h"><span class="ico">${ico('users')}</span><div class="grow"><b>Guest network</b><small>Separate Wi-Fi for visitors — no access to your devices</small></div><label class="sw"><input type="checkbox" id="guest-on" ${g.on ? 'checked' : ''} aria-label="Enable guest network"><span></span></label></div>
        <div id="guest-body" ${g.on ? '' : 'hidden'}><div class="kv"><div><span>Network name</span><b>${esc(g.ssid)}</b></div><div><span>Password</span><b class="mono-v">${esc(g.pass)}</b></div></div></div>
        <p class="muted" id="guest-off" style="font-size:.88rem" ${g.on ? 'hidden' : ''}>Turn on to create a separate network for guests.</p>
      </article>
      <article class="card">
        <div class="card-h"><h3>Network settings</h3></div>
        <label class="lab" for="adv-dns">DNS server</label><div class="field"><select id="adv-dns" data-adv="dns">${['Automatic (ISP)', 'Google (8.8.8.8)', 'Cloudflare (1.1.1.1)'].map(c => `<option ${c === a.dns ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
        <div class="toggle-row"><div><b>Parental controls</b><small>Block adult content network-wide</small></div><label class="sw"><input type="checkbox" data-adv="parental" ${a.parental ? 'checked' : ''}><span></span></label></div>
        <div class="toggle-row"><div><b>Smart QoS</b><small>Prioritise video calls &amp; gaming</small></div><label class="sw"><input type="checkbox" data-adv="qos" ${a.qos ? 'checked' : ''}><span></span></label></div>
        <div class="toggle-row"><div><b>WPS</b><small>One-button device pairing</small></div><label class="sw"><input type="checkbox" data-adv="wps" ${a.wps ? 'checked' : ''}><span></span></label></div>
        <div class="btn-row" style="margin-top:6px"><button class="btn btn-ghost btn-sm" data-act="adminpw">${ico('lock')}Change admin password</button></div>
      </article>
    </div>

    <article class="card" style="margin-top:0">
      <div class="card-h"><div><h3>Connected devices</h3><span class="sub" id="dev-sub"></span></div></div>
      <div class="chip-row" id="dev-filter"><button class="chip-btn on" data-f="all">All</button><button class="chip-btn" data-f="on">Online</button><button class="chip-btn" data-f="blocked">Blocked</button></div>
      <div class="list" id="dev-list" style="padding:0"></div>
    </article>`;
  }
  function devListHTML(filter) {
    const rows = DEVICES.filter(d => { const bl = state.blocked.includes(d.id); return filter === 'all' || (filter === 'on' ? d.on && !bl : bl); });
    if (!rows.length) return `<p class="muted" style="padding:20px 8px;text-align:center">No devices here.</p>`;
    return rows.map(d => { const bl = state.blocked.includes(d.id); return `<div class="li dev ${bl ? 'blocked' : ''}" data-dev="${d.id}">
      <span class="ico">${ico(bl ? 'block' : d.type)}</span>
      <div class="grow"><b>${esc(d.name)}</b><small>${d.ip} · ${d.band}${d.on && !bl ? '' : ' · offline'}</small></div>
      ${d.on && !bl ? sigHTML(d.rssi) : ''}
      <div class="end"><b>${d.gb} GB</b><label class="sw" style="margin-top:4px" title="${bl ? 'Unblock' : 'Block'} device"><input type="checkbox" data-block="${d.id}" ${bl ? '' : 'checked'} aria-label="Allow ${esc(d.name)} on network"><span></span></label></div></div>`; }).join('');
  }

  function billsHTML() {
    return `
    <article class="card" style="margin-bottom:16px">
      <div class="card-h"><div><h3>Current plan</h3><span class="sub">${esc(USER.region)} · ${USER.type}</span></div><span class="chip good"><i></i>Active</span></div>
      <div class="g g-eq kvs" style="margin:0">
        <div class="kv">
          <div><span>Plan</span><b>${PLAN.name}</b></div><div><span>Term</span><b>${PLAN.term} months</b></div><div><span>Amount paid</span><b>${inr(PLAN.price)} <small style="color:var(--muted);font-weight:500">(GST incl.)</small></b></div>
        </div>
        <div class="kv">
          <div><span>Started</span><b>${fmtDate(PLAN.start)}</b></div><div><span>Expires</span><b>${fmtDate(PLAN.end)} · ${PLAN.daysLeft} days</b></div>
          <div><span>Auto-renew</span><label class="sw"><input type="checkbox" id="auto-renew" ${state.autoRenew ? 'checked' : ''} aria-label="Auto-renew"><span></span></label></div>
        </div>
      </div>
      <div class="btn-row" style="margin-top:16px"><button class="btn btn-primary" data-pay="renew">${ico('card')}Renew now</button></div>
    </article>

    <div class="card-h" style="margin-top:22px"><h3 style="font-size:1.05rem">Switch plan</h3><span class="muted" style="font-size:.82rem">12-month prices · Shirdi region</span></div>
    <div class="plan-opts" style="margin-bottom:16px">${[[200, 6900], [300, 7188], [500, 11988]].map(([s, p]) => `<button class="opt ${s === PLAN.speed ? 'cur' : ''}" data-plan="${s}" data-price="${p}" ${s === PLAN.speed ? 'aria-current="true"' : ''}>${s === PLAN.speed ? '<span class="chip good">Current</span>' : s === 500 ? '<span class="chip warn">Fastest</span>' : ''}<b>${s}<small>Mbps</small></b><span class="p"><strong>${inr(p / 12)}</strong>/month · ${inr(p)} billed yearly</span><span class="muted" style="font-size:.8rem">Unlimited data</span></button>`).join('')}</div>

    <article class="card">
      <div class="card-h"><div><h3>Payment history</h3><span class="sub">Download invoices for your records</span></div></div>
      <div class="list" style="padding:0">${BILLS.map(b => `<div class="li"><span class="ico good">${ico('receipt')}</span><div class="grow"><b>${esc(b.title)}</b><small>${fmtDate(b.date)} · ${b.id} · ${b.via}</small></div><div class="end"><b>${inr(b.amt)}</b><span class="chip good" style="padding:2px 8px;font-size:.68rem">Paid</span></div><button class="icon-btn sm" data-inv="${b.id}" aria-label="Download invoice ${b.id}">${ico('download')}</button></div>`).join('')}</div>
    </article>`;
  }

  function ticketRows() {
    return allTickets().map(t => `<div class="li"><span class="ico ${t.st === 'Resolved' ? 'good' : 'accent'}">${ico('ticket')}</span><div class="grow"><b>${esc(t.cat)}</b><small>${esc(t.text)}</small></div><div class="end"><span class="chip ${t.st === 'Resolved' ? 'good' : 'warn'} ticket-st">${t.st}</span><small style="display:block;margin-top:3px">${fmtDate(t.date, { day: 'numeric', month: 'short' })}</small></div></div>`).join('');
  }
  function accountHTML() {
    const initials = USER.name.split(' ').map(w => w[0]).join('').slice(0, 2);
    return `
    <article class="card" style="margin-bottom:16px">
      <div class="profile"><span class="avatar">${initials}</span><div class="grow"><h3>${esc(USER.name)}</h3><p class="muted" style="font-size:.9rem">Customer ID <b class="mono-v" style="color:var(--text)">${USER.id}</b></p></div><span class="chip good"><i></i>Active</span></div>
      <div class="g g-eq kvs" style="margin:18px 0 0">
        <div class="kv"><div><span>Mobile</span><b>${USER.mobile}</b></div><div><span>Email</span><b>${esc(USER.email)}</b></div><div><span>Connection</span><b>${USER.type}</b></div></div>
        <div class="kv"><div><span>Installed</span><b>${fmtDate(USER.since)}</b></div><div><span>Region</span><b>${esc(USER.region)}</b></div><div><span>Address</span><b style="max-width:220px">${esc(USER.address)}</b></div></div>
      </div>
    </article>

    <div class="g g2">
      <article class="card">
        <div class="card-h"><div><h3>Support tickets</h3><span class="sub">We usually respond within a few hours</span></div><button class="btn btn-primary btn-sm" data-act="ticket">${ico('plus')}New ticket</button></div>
        <div class="list" id="ticket-list" style="padding:0">${ticketRows()}</div>
      </article>
      <div style="display:grid;gap:16px;align-content:start">
        <article class="card">
          <div class="card-h"><h3>Contact SpeedMaxx</h3><span class="chip good"><i></i>24/7</span></div>
          <div class="btn-row"><a class="btn btn-ghost btn-sm" href="tel:+918109092323">${ico('call')}Call</a><a class="btn btn-ghost btn-sm" href="mailto:support@speemaxx.in">${ico('mail')}Email</a></div>
          <p class="muted" style="font-size:.84rem;margin-top:12px">${ico('pin')} Kankuri Road, Shivaji Nagar, Shirdi</p>
        </article>
        <article class="card">
          <div class="card-h"><h3>Preferences</h3></div>
          <div class="toggle-row" style="border-top:0;padding-top:0"><div><b>Dark mode</b><small>Matches the website theme</small></div><label class="sw"><input type="checkbox" id="pref-theme" ${root.getAttribute('data-theme') === 'dark' ? 'checked' : ''}><span></span></label></div>
          <div class="toggle-row"><div><b>Usage alerts</b><small>Notify me about unusual usage</small></div><label class="sw"><input type="checkbox" data-n="usage" ${state.notif.usage ? 'checked' : ''}><span></span></label></div>
          <div class="toggle-row"><div><b>Bill reminders</b><small>Before my plan expires</small></div><label class="sw"><input type="checkbox" data-n="bills" ${state.notif.bills ? 'checked' : ''}><span></span></label></div>
          <div class="toggle-row"><div><b>Outage alerts</b><small>Maintenance &amp; outages in my area</small></div><label class="sw"><input type="checkbox" data-n="outage" ${state.notif.outage ? 'checked' : ''}><span></span></label></div>
        </article>
        <button class="btn btn-danger btn-block" data-logout>${ico('logout')}Sign out</button>
      </div>
    </div>`;
  }

  /* ================= CHARTS ================= */
  const chartInst = {};
  function palette() { return { s1: css('--s1'), s2: css('--s2'), grid: css('--grid'), gridS: css('--grid-strong'), muted: css('--muted'), faint: css('--faint'), text: css('--text'), card: css('--card'), card2: css('--card-2'), border: css('--border-2') }; }
  const crosshair = { id: 'crosshair', afterDatasetsDraw(c) { const o = c.options.plugins.crosshair; if (!o || !o.on || !c.tooltip || !c.tooltip._active || !c.tooltip._active.length) return; const x = c.tooltip._active[0].element.x, a = c.chartArea, p = palette(); const x2 = c.ctx; x2.save(); x2.strokeStyle = p.gridS; x2.lineWidth = 1; x2.beginPath(); x2.moveTo(x, a.top); x2.lineTo(x, a.bottom); x2.stroke(); x2.restore(); } };
  const tipLabels = { id: 'tipLabels', afterDatasetsDraw(c) { const o = c.options.plugins.tipLabels; if (!o || o.on !== true) return; const p = palette(), x = c.ctx, m = c.getDatasetMeta(0); x.save(); x.fillStyle = p.text; x.font = '600 12px Inter, sans-serif'; x.textBaseline = 'middle'; m.data.forEach((b, i) => { x.fillText(c.data.datasets[0].data[i] + '%', b.x + 8, b.y); }); x.restore(); } };
  if (hasChart) {
    Chart.register(crosshair, tipLabels);
    Chart.defaults.font.family = 'Inter, system-ui, sans-serif'; Chart.defaults.font.size = 12;
    Chart.defaults.animation.duration = reduce ? 0 : 900; Chart.defaults.animation.easing = 'easeOutQuart';
  }
  function baseOpts(unit, extra = {}) {
    const p = palette();
    return {
      responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, layout: { padding: { right: 8, top: 6 } },
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: p.card2, titleColor: p.muted, bodyColor: p.text, footerColor: p.muted, borderColor: p.border, borderWidth: 1, padding: 12, cornerRadius: 12, boxPadding: 6, usePointStyle: true, titleFont: { weight: '500' }, bodyFont: { weight: '600' }, callbacks: { labelPointStyle: () => ({ pointStyle: 'rectRounded', rotation: 0 }), label: c => ` ${f1(c.parsed.y ?? c.parsed.x)} ${unit}  ${c.dataset.label}` } }
      },
      scales: {
        x: { grid: { display: false }, border: { display: false }, ticks: { color: p.muted, maxRotation: 0, autoSkipPadding: 14 } },
        y: { beginAtZero: true, border: { display: false }, grid: { color: p.grid, lineWidth: 1 }, ticks: { color: p.muted, maxTicksLimit: 5, callback: v => v.toLocaleString('en-IN') } }
      }, ...extra
    };
  }
  function register(c, key, restyle) { charts.push(c); chartInst[key] = c; c.restyle = (full) => { const p = palette(); restyle(c, p); const o = c.options; o.plugins.tooltip.backgroundColor = p.card2; o.plugins.tooltip.titleColor = p.muted; o.plugins.tooltip.bodyColor = p.text; o.plugins.tooltip.borderColor = p.border; o.plugins.tooltip.footerColor = p.muted; Object.values(o.scales).forEach(s => { if (s.ticks) s.ticks.color = p.muted; if (s.grid && s.grid.display !== false) s.grid.color = p.grid; }); c.update(full ? undefined : 'none'); }; return c; }
  const lineStyle = (c, p) => { c.options.plugins.tooltip.callbacks.labelPointStyle = () => ({ pointStyle: 'line', rotation: 0 }); c.data.datasets.forEach(d => { const col = d.key === 's1' ? p.s1 : p.s2; d.borderColor = col; d.backgroundColor = hexA(col, .1); d.pointHoverBackgroundColor = col; d.pointHoverBorderColor = p.card; }); };
  const lineDS = (key, label, data) => ({ key, label, data, borderWidth: 2, tension: .38, fill: true, pointRadius: 0, pointHoverRadius: 5, pointHoverBorderWidth: 2, spanGaps: false });

  function rangeData(n) {
    if (n === 90) { // aggregate weekly
      const out = []; for (let i = 0; i < 90; i += 7) { const w = days.slice(i, i + 7); out.push({ label: 'Wk ' + fmtDate(w[0].date, { day: 'numeric', month: 'short' }), down: +sum(w, 'down').toFixed(1), up: +sum(w, 'up').toFixed(1) }); } return out;
    }
    return days.slice(-n).map(d => ({ label: fmtDate(d.date, n === 7 ? { weekday: 'short', day: 'numeric' } : { day: 'numeric', month: 'short' }), down: d.down, up: d.up }));
  }
  let usageRange = 7;
  function usageFill() {
    const rows = rangeData(usageRange), dT = sum(rows, 'down'), uT = sum(rows, 'up'), n = usageRange === 90 ? 90 : usageRange;
    const peak = rows.reduce((a, b) => (b.down + b.up > a.down + a.up ? b : a));
    $('#usage-kpis').innerHTML = [
      kpi('activity', 'Total used', f1(dT + uT), 'GB', `Last ${usageRange} days`, null),
      kpi('download', 'Downloaded', f1(dT), 'GB', `${Math.round(dT / (dT + uT) * 100)}% of total`, null),
      kpi('upload', 'Uploaded', f1(uT), 'GB', `${Math.round(uT / (dT + uT) * 100)}% of total`, null),
      kpi('clock', usageRange === 90 ? 'Weekly average' : 'Daily average', f1((dT + uT) / rows.length), 'GB', `Peak: ${peak.label} · ${f1(peak.down + peak.up)} GB`, null)
    ].join('');
    $('#usage-sub').textContent = usageRange === 90 ? 'Weekly totals · GB' : 'GB per day';
    const c = chartInst.usage;
    if (c) { c.data.labels = rows.map(r => r.label); c.data.datasets[0].data = rows.map(r => r.down); c.data.datasets[1].data = rows.map(r => r.up); c.update(); }
    $('#usage-table tbody').innerHTML = [...rows].reverse().map(r => `<tr><td>${esc(r.label)}</td><td class="n">${f1(r.down)} GB</td><td class="n">${f1(r.up)} GB</td><td class="n"><b>${f1(r.down + r.up)} GB</b></td></tr>`).join('');
    if (anim) gsap.from('#usage-kpis .kpi', { y: 14, opacity: 0, duration: .45, stagger: .06, ease: 'power3.out', clearProps: 'all' });
  }
  const built = {};
  function buildCharts(view) {
    if (!hasChart || built[view]) return; built[view] = true;
    if (view === 'home') {
      const N = 48, d = Array.from({ length: N }, (_, i) => 40 + Math.sin(i / 4) * 18 + R() * 25), u = d.map(v => v * .12 + R() * 3);
      const c = new Chart($('#ch-live'), { type: 'line', data: { labels: d.map(() => ''), datasets: [lineDS('s1', 'Download', d), lineDS('s2', 'Upload', u)] },
        options: { ...baseOpts('Mbps'), animation: false, plugins: { ...baseOpts('Mbps').plugins, crosshair: { on: true } }, scales: { x: { display: false }, y: { ...baseOpts('Mbps').scales.y, suggestedMax: 120 } } } });
      register(c, 'live', lineStyle).restyle(true);
      const dv = $('#live-d'), uv = $('#live-u');
      const upd = () => { dv.textContent = f1(c.data.datasets[0].data.at(-1)); uv.textContent = f1(c.data.datasets[1].data.at(-1)); }; upd();
      const iv = setInterval(() => {
        if (!$('#ch-live') || document.hidden || !$('#v-home').classList.contains('active') || router.booting) return;
        const dd = c.data.datasets[0].data, uu = c.data.datasets[1].data;
        dd.shift(); dd.push(clamp(dd.at(-1) + (R() - .5) * 34, 6, 190)); uu.shift(); uu.push(clamp(dd.at(-1) * .12 + R() * 4, 1, 28));
        c.update('none'); upd();
      }, 1100);
      liveIv = iv;
    }
    if (view === 'usage') {
      const mk = (key, label, br) => ({ key, label, stack: 'u', data: [], maxBarThickness: 24, borderWidth: 2, borderSkipped: false, borderRadius: br, hoverBorderWidth: 2 });
      const o = baseOpts('GB'); o.scales.x.stacked = true; o.scales.y.stacked = true;
      o.plugins.tooltip.callbacks.footer = items => `Total ${f1(items.reduce((s, i) => s + i.parsed.y, 0))} GB`;
      const c = new Chart($('#ch-usage'), { type: 'bar', data: { labels: [], datasets: [mk('s1', 'Download', 0), mk('s2', 'Upload', { topLeft: 4, topRight: 4 })] }, options: o });
      register(c, 'usage', (ch, p) => { ch.data.datasets.forEach(d => { d.backgroundColor = d.key === 's1' ? p.s1 : p.s2; d.borderColor = p.card; d.hoverBackgroundColor = d.backgroundColor; }); });
      c.restyle(true); usageFill();
      const h = new Chart($('#ch-hour'), { type: 'line', data: { labels: hours.map(x => (x.h % 12 || 12) + (x.h < 12 ? 'a' : 'p')), datasets: [lineDS('s1', 'Download', hours.map(x => x.h <= nowH ? x.down : null)), lineDS('s2', 'Upload', hours.map(x => x.h <= nowH ? x.up : null))] },
        options: { ...baseOpts('GB'), plugins: { ...baseOpts('GB').plugins, crosshair: { on: true } } } });
      register(h, 'hour', lineStyle).restyle(true);
      const ct = new Chart($('#ch-cat'), { type: 'bar', data: { labels: CATS.map(c => c[0]), datasets: [{ key: 's1', label: 'Share', data: CATS.map(c => c[2]), backgroundColor: palette().s1, maxBarThickness: 18, borderRadius: { topRight: 4, bottomRight: 4 }, borderSkipped: false }] },
        options: { ...baseOpts('%'), indexAxis: 'y', layout: { padding: { right: 40 } }, interaction: { mode: 'nearest', intersect: true, axis: 'y' }, plugins: { ...baseOpts('%').plugins, tipLabels: { on: true }, tooltip: { ...baseOpts('%').plugins.tooltip, callbacks: { labelPointStyle: () => ({ pointStyle: 'rectRounded', rotation: 0 }), label: c => ` ${c.parsed.x}% of data  ·  ~${Math.round(c.parsed.x / 100 * tot30)} GB` } } }, scales: { x: { display: false, beginAtZero: true, max: 50 }, y: { grid: { display: false }, border: { display: false }, ticks: { color: palette().muted } } } } });
      register(ct, 'cat', (ch, p) => { ch.data.datasets[0].backgroundColor = p.s1; ch.data.datasets[0].hoverBackgroundColor = p.s1; ch.options.scales.y.ticks.color = p.muted; }).restyle(true);
    }
  }

  /* ================= VIEW ENHANCERS (counters / bars) ================= */
  function enhance(el) {
    $$('[data-count]', el).forEach(n => { const to = +n.dataset.count; if (!anim) return void (n.textContent = to.toLocaleString('en-IN')); const o = { v: 0 }; gsap.to(o, { v: to, duration: 1.4, ease: 'power3.out', onUpdate: () => n.textContent = Math.round(o.v).toLocaleString('en-IN') }); });
    $$('[data-w]', el).forEach(n => { const w = n.dataset.w + '%'; if (anim) gsap.fromTo(n, { width: '0%' }, { width: w, duration: 1.1, ease: 'power3.out', delay: .15 }); else n.style.width = w; });
    const rf = $('#ring-fg', el); if (rf) { if (anim) gsap.to(rf, { strokeDashoffset: +rf.dataset.to, duration: 1.6, ease: 'power3.out', delay: .1 }); else rf.setAttribute('stroke-dashoffset', rf.dataset.to); }
  }

  /* ================= ROUTER ACTIONS ================= */
  const refs = {};
  function paintRouter() {
    const art = $('#router-art'), chip = $('#r-chip'), hs = $('#home-status'), cc = $('#conn-chip');
    const st = router.booting ? ['boot', 'warn', 'Rebooting…'] : router.online ? ['', 'good', 'Online'] : ['off', 'bad', 'Offline'];
    if (art) art.className = 'router-art ' + st[0];
    if (chip) { chip.className = 'chip ' + st[1]; chip.innerHTML = '<i></i>' + st[2]; }
    if (hs) { hs.className = 'chip ' + st[1]; hs.innerHTML = '<i></i>' + st[2]; }
    if (cc) { cc.className = 'chip ' + st[1]; cc.innerHTML = router.booting ? ico('refresh') + 'Restarting' : ico('check') + 'Healthy'; }
    const up = uptimeTxt(); const a = $('#kv-up'), b = $('#r-up'); if (a) a.textContent = up; if (b) b.textContent = up;
    const dv = $('#kpi-dev'); if (dv) dv.textContent = router.booting ? 0 : devOnline();
    const sub = $('#dev-sub'); if (sub) sub.textContent = router.booting ? 'Reconnecting…' : `${devOnline()} online · ${state.blocked.length} blocked`;
  }
  async function reboot() {
    if (router.booting) return;
    closeSheet(true); router.booting = true; paintRouter(); vibrate(20);
    const prog = $('#r-prog'), step = $('#r-step');
    if (prog) { prog.hidden = false; step.hidden = false; }
    const steps = ['Saving settings…', 'Restarting router…', 'Reconnecting fiber link…', 'Bringing devices back online…'];
    toast('Router is rebooting — this takes about 10 seconds', 'info');
    for (let i = 0; i < steps.length; i++) {
      const s = $('#r-step'), bar = $('#r-prog i');
      if (s) s.textContent = steps[i];
      await tween(2300, (e) => { const b = $('#r-prog i'); if (b) b.style.width = ((i + e) / steps.length * 100) + '%'; });
    }
    router.booting = false; router.bootAt = Date.now(); router.online = true;
    const p2 = $('#r-prog'), s2 = $('#r-step'); if (p2) { p2.hidden = true; s2.hidden = true; $('#r-prog i').style.width = '0'; }
    paintRouter(); toast('Router is back online'); vibrate([10, 40, 10]);
  }
  function confirmReboot() {
    openSheet('Reboot router?', `<p class="lead">Your internet and Wi-Fi will be unavailable for about 10 seconds while the router restarts. All devices reconnect automatically.</p>
      <div class="btn-row"><button class="btn btn-danger" data-do="reboot" style="flex:1">${ico('power')}Reboot now</button><button class="btn btn-ghost" data-close style="flex:1">Cancel</button></div>`,
      b => $('[data-do="reboot"]', b).addEventListener('click', reboot));
  }

  /* ================= SPEED TEST ================= */
  function speedTest() {
    const CIRC = 100, MAX = 500;
    openSheet('Speed test', `
      <div class="st-gauge"><svg viewBox="0 0 240 135"><defs><linearGradient id="stg" x1="0" x2="1"><stop offset="0" stop-color="${css('--accent')}"/><stop offset="1" stop-color="${css('--cyan')}"/></linearGradient></defs>
        <path d="M20 125 A100 100 0 0 1 220 125" fill="none" stroke="${css('--border-2')}" stroke-width="14" stroke-linecap="round"/>
        <path id="st-arc" d="M20 125 A100 100 0 0 1 220 125" fill="none" stroke="url(#stg)" stroke-width="14" stroke-linecap="round" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/></svg>
        <div class="st-read"><b id="st-n">0</b><span id="st-u">Mbps</span></div></div>
      <p class="st-phase mono muted" id="st-phase">Ready</p>
      <div class="st-res"><div><small>${ico('bolt')}Ping</small><b id="r-ping">—<small> ms</small></b></div><div><small>${ico('download')}Down</small><b id="r-down">—<small> Mbps</small></b></div><div><small>${ico('upload')}Up</small><b id="r-up2">—<small> Mbps</small></b></div></div>
      <button class="btn btn-primary btn-block" id="st-go">Start test</button>
      <p class="fine" style="margin-top:12px">Demo test with simulated results — not a real measurement.</p>`,
      b => {
        let running = false;
        const arc = $('#st-arc', b), n = $('#st-n', b), ph = $('#st-phase', b), go = $('#st-go', b);
        const setG = v => { n.textContent = Math.round(v); arc.style.strokeDashoffset = CIRC - clamp(v / MAX, 0, 1) * CIRC; };
        go.addEventListener('click', async () => {
          if (running) return; running = true; go.disabled = true; go.textContent = 'Testing…';
          ['r-ping', 'r-down', 'r-up2'].forEach(id => $('#' + id, b).innerHTML = '—<small></small>'); setG(0);
          const live = () => !!$('#st-go', b);
          const ping = 3 + Math.round(Math.random() * 3), down = PLAN.speed * (.93 + Math.random() * .06), up = PLAN.speed * (.55 + Math.random() * .08);
          ph.textContent = 'Testing latency…'; $('#st-u', b).textContent = 'ms';
          await tween(1200, e => n.textContent = Math.round(ping * e + (1 - e) * 20)); if (!live()) { running = false; return; } n.textContent = ping; $('#r-ping', b).innerHTML = `${ping}<small> ms</small>`;
          $('#st-u', b).textContent = 'Mbps'; ph.textContent = 'Testing download…';
          await tween(3000, e => setG(down * e * (.96 + Math.random() * .08))); if (!live()) { running = false; return; } setG(down); $('#r-down', b).innerHTML = `${Math.round(down)}<small> Mbps</small>`;
          ph.textContent = 'Testing upload…'; setG(0); await sleep(250); if (!live()) { running = false; return; }
          await tween(2600, e => setG(up * e * (.96 + Math.random() * .08))); if (!live()) { running = false; return; } setG(up); $('#r-up2', b).innerHTML = `${Math.round(up)}<small> Mbps</small>`;
          ph.textContent = 'Complete ✓'; go.disabled = false; go.textContent = 'Test again'; running = false; vibrate(20);
        });
      });
  }

  /* ================= OTHER SHEETS ================= */
  function notifSheet() {
    openSheet('Notifications', `<div class="list" style="padding:0;margin:0 -8px">${NOTIFS.map(n => `<div class="li"><span class="ico ${n.cls}">${ico(n.ic)}</span><div class="grow"><b>${esc(n.t)}</b><small style="white-space:normal">${esc(n.s)}</small></div><div class="end">${esc(n.when)}</div></div>`).join('')}</div>`, null, () => { const d = $('#bell .dot'); if (d) d.style.display = 'none'; });
  }
  function paySheet(kind, plan, price) {
    const p = price || PLAN.price, label = kind === 'renew' ? `${PLAN.name} · ${PLAN.term} months` : `${plan} Mbps Unlimited · 12 months`;
    const gst = Math.round(p - p / 1.18);
    openSheet(kind === 'renew' ? 'Renew plan' : 'Switch plan', `
      <div class="summary"><div class="kv"><div><span>Plan</span><b>${esc(label)}</b></div><div><span>Base price</span><b>${inr(p - gst)}</b></div><div><span>GST (18%)</span><b>${inr(gst)}</b></div><div><span>Total payable</span><b>${inr(p)}</b></div></div></div>
      <label class="pay-opt"><input type="radio" name="pm" checked>${ico('phone')}<div><b>UPI</b><small>Google Pay, PhonePe, Paytm…</small></div></label>
      <label class="pay-opt"><input type="radio" name="pm">${ico('card')}<div><b>Debit / credit card</b><small>Visa, Mastercard, RuPay</small></div></label>
      <label class="pay-opt"><input type="radio" name="pm">${ico('globe')}<div><b>Net banking</b><small>All major banks</small></div></label>
      <button class="btn btn-primary btn-block" id="pay-go" style="margin-top:6px"><span class="bl">Pay ${inr(p)}</span><span class="spin"></span></button>
      <p class="fine" style="margin-top:12px">Demo checkout — no payment is processed.</p>`,
      b => $('#pay-go', b).addEventListener('click', async e => { const btn = e.currentTarget; btn.classList.add('loading'); btn.disabled = true; await sleep(1400); closeSheet(true); toast('Demo payment successful — no charge made'); vibrate(20); }));
  }
  function ticketSheet() {
    openSheet('Raise a ticket', `
      <label class="lab" for="tk-cat">Category</label><div class="field"><select id="tk-cat"><option>Slow speed</option><option>No internet</option><option>Wi-Fi issue</option><option>Billing</option><option>Plan change</option><option>Other</option></select></div>
      <label class="lab" for="tk-txt">Describe the issue</label><textarea class="area" id="tk-txt" placeholder="Tell us what's happening…" maxlength="300"></textarea>
      <button class="btn btn-primary btn-block" id="tk-go"><span class="bl">Submit ticket</span><span class="spin"></span></button>
      <p class="fine" style="margin-top:12px">For urgent faults, call +91 81 09 09 23 23.</p>`,
      b => $('#tk-go', b).addEventListener('click', async e => {
        const txt = $('#tk-txt', b).value.trim(); if (txt.length < 5) { $('#tk-txt', b).focus(); toast('Please describe the issue (a few words)', 'err'); return; }
        const btn = e.currentTarget; btn.classList.add('loading'); btn.disabled = true; await sleep(1000);
        state.tickets.unshift({ id: 'TKT-' + (2042 + state.tickets.length), cat: $('#tk-cat', b).value, text: txt, st: 'Open', date: new Date() }); saveState();
        closeSheet(true); const tl = $('#ticket-list'); if (tl) { tl.innerHTML = ticketRows(); if (anim) gsap.from(tl.firstElementChild, { opacity: 0, y: -12, duration: .5 }); }
        toast('Ticket raised — we\'ll get back to you soon');
      }));
  }
  function adminPwSheet() {
    openSheet('Change admin password', `
      <label class="lab" for="ap-new">New router admin password</label><div class="field">${ico('lock')}<input id="ap-new" type="password" placeholder="At least 8 characters" autocomplete="new-password"></div>
      <label class="lab" for="ap-new2">Confirm password</label><div class="field">${ico('lock')}<input id="ap-new2" type="password" placeholder="Re-enter password" autocomplete="new-password"></div>
      <button class="btn btn-primary btn-block" id="ap-go">Update password</button>`,
      b => $('#ap-go', b).addEventListener('click', () => { const a = $('#ap-new', b).value, c = $('#ap-new2', b).value; if (a.length < 8) return toast('Use at least 8 characters', 'err'); if (a !== c) return toast('Passwords do not match', 'err'); closeSheet(); toast('Admin password updated'); }));
  }
  function invoice(id) {
    const b = BILLS.find(x => x.id === id); if (!b) return;
    const txt = `SPEEDMAXX DIGITAL NETWORKS PVT LTD\nKankuri Road, Shivaji Nagar, Shirdi\n\nTAX INVOICE (DEMO)\nInvoice no : ${b.id}\nDate       : ${fmtDate(b.date)}\nCustomer   : ${USER.name} (${USER.id})\n\n${b.title}\nAmount (GST incl.): ${inr(b.amt)}\nPaid via   : ${b.via}\n\nThis is a sample invoice generated by the demo portal.\n`;
    const url = URL.createObjectURL(new Blob([txt], { type: 'text/plain' })), a = document.createElement('a');
    a.href = url; a.download = b.id + '.txt'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 500);
    toast('Invoice ' + b.id + ' downloaded');
  }

  /* ================= EVENT DELEGATION (app) ================= */
  const pages = $('#pages');
  document.addEventListener('click', e => {
    const go = e.target.closest('[data-go]'); if (go) { location.hash = '#/' + go.dataset.go; return; }
    const act = e.target.closest('[data-act]');
    if (act) {
      const a = act.dataset.act;
      if (a === 'speedtest') speedTest();
      else if (a === 'reboot') confirmReboot();
      else if (a === 'ticket') ticketSheet();
      else if (a === 'adminpw') adminPwSheet();
      else if (a === 'refresh') { act.querySelector('.i').style.transition = 'transform .6s'; act.querySelector('.i').style.transform = 'rotate(360deg)'; setTimeout(() => { act.querySelector('.i').style.transform = ''; paintRouter(); toast('Router status refreshed', 'info'); }, 650); }
    }
    if (e.target.closest('[data-logout]')) logout();
    if (e.target.closest('#bell')) notifSheet();
    const pay = e.target.closest('[data-pay]'); if (pay) paySheet('renew');
    const plan = e.target.closest('[data-plan]'); if (plan) { if (+plan.dataset.plan === PLAN.speed) toast('This is your current plan', 'info'); else paySheet('switch', plan.dataset.plan, +plan.dataset.price); }
    const inv = e.target.closest('[data-inv]'); if (inv) invoice(inv.dataset.inv);
    const eye = e.target.closest('[data-eye]'); if (eye) { const i = eye.parentElement.querySelector('input'); const show = i.type === 'password'; i.type = show ? 'text' : 'password'; eye.innerHTML = ico(show ? 'eye-off' : 'eye'); }
    const cp = e.target.closest('[data-copy]'); if (cp) { const v = cp.parentElement.querySelector('input').value; (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject()).then(() => toast('Wi-Fi password copied'), () => toast('Copy not available here', 'err')); }
    const sv = e.target.closest('[data-save]'); if (sv) saveBand(sv);
    const df = e.target.closest('#dev-filter .chip-btn'); if (df) { $$('#dev-filter .chip-btn').forEach(x => x.classList.toggle('on', x === df)); $('#dev-list').innerHTML = devListHTML(df.dataset.f); if (anim) gsap.from('#dev-list .li', { opacity: 0, y: 10, duration: .35, stagger: .04 }); }
    const rs = e.target.closest('#range-seg button'); if (rs) { $$('#range-seg button').forEach(x => x.classList.toggle('on', x === rs)); segInd($('#range-seg')); usageRange = +rs.dataset.r; usageFill(); }
    const ms = e.target.closest('#mode-seg button'); if (ms) { $$('#mode-seg button').forEach(x => x.classList.toggle('on', x === ms)); segInd($('#mode-seg')); const t = ms.dataset.m === 'table'; $('#usage-chart').hidden = t; $('#usage-table').hidden = !t; if (!t && chartInst.usage) chartInst.usage.resize(); }
  });
  pages.addEventListener('input', e => {
    const band = e.target.closest('[data-band]'); if (band && e.target.dataset.f) { const b = $('[data-save]', band); b.disabled = false; }
  });
  pages.addEventListener('change', e => {
    const t = e.target;
    const band = t.closest('[data-band]'); if (band && t.dataset.f) { $('[data-save]', band).disabled = false; }
    if (t.dataset.block) { const id = t.dataset.block, dev = DEVICES.find(d => d.id === id); if (t.checked) state.blocked = state.blocked.filter(x => x !== id); else state.blocked.push(id); saveState(); paintRouter(); toast(`${dev.name} ${t.checked ? 'unblocked' : 'blocked'}`, t.checked ? 'ok' : 'info'); const f = $('#dev-filter .chip-btn.on'); setTimeout(() => { $('#dev-list').innerHTML = devListHTML(f ? f.dataset.f : 'all'); }, 250); vibrate(10); }
    if (t.id === 'guest-on') { state.guest.on = t.checked; saveState(); $('#guest-body').hidden = !t.checked; $('#guest-off').hidden = t.checked; if (t.checked && anim) gsap.from('#guest-body', { opacity: 0, y: -8, duration: .4 }); toast(t.checked ? 'Guest network enabled' : 'Guest network disabled', t.checked ? 'ok' : 'info'); }
    if (t.dataset.adv) { state.adv[t.dataset.adv] = t.type === 'checkbox' ? t.checked : t.value; saveState(); toast('Network setting updated'); }
    if (t.id === 'auto-renew') { state.autoRenew = t.checked; saveState(); toast(t.checked ? 'Auto-renew on' : 'Auto-renew off', t.checked ? 'ok' : 'info'); }
    if (t.id === 'pref-theme') { const next = t.checked ? 'dark' : 'light'; setTheme(next, true); }
    if (t.dataset.n) { state.notif[t.dataset.n] = t.checked; saveState(); toast('Preference saved'); }
  });
  async function saveBand(btn) {
    const band = btn.closest('[data-band]'), k = band.dataset.band, w = state.wifi[k];
    const ssid = $('[data-f="ssid"]', band).value.trim(), pass = $('[data-f="pass"]', band).value;
    if (!ssid) return toast('Network name cannot be empty', 'err');
    if (pass.length < 8) return toast('Wi-Fi password needs at least 8 characters', 'err');
    btn.classList.add('loading'); btn.disabled = true; await sleep(1100);
    Object.assign(w, { ssid, pass, on: $('[data-f="on"]', band).checked, channel: $('[data-f="channel"]', band).value, sec: $('[data-f="sec"]', band).value, hidden: $('[data-f="hidden"]', band).checked });
    saveState(); btn.classList.remove('loading'); toast(`${k === '2g' ? '2.4' : '5'} GHz settings saved — applies within 30 seconds`); vibrate(12);
  }

  /* ================= ROUTING / APP ================= */
  const ORDER = ['home', 'usage', 'router', 'bills', 'account'];
  const TITLES = { home: ['Home', 'Your connection at a glance'], usage: ['Data usage', 'Track how you use your internet'], router: ['Router & Wi-Fi', 'Manage your network and devices'], bills: ['Plan & bills', 'Plans, payments and invoices'], account: ['Account', 'Profile, support and preferences'] };
  const tpl = { home: homeHTML, usage: usageHTML, router: routerHTML, bills: billsHTML, account: accountHTML };
  let current = null, started = false, liveIv = null;

  function movePill(animate = true) {
    const tb = $('#tabbar'), on = $('a.on', tb), pill = $('.pill', tb); if (!on || getComputedStyle(tb).display === 'none') return;
    pill.style.transition = animate ? '' : 'none';
    pill.style.width = on.offsetWidth + 'px'; pill.style.transform = `translateX(${on.offsetLeft}px)`; pill.style.opacity = 1;
  }
  function show(name, instant) {
    if (!tpl[name]) name = 'home';
    const el = $('#v-' + name), prev = current ? $('#v-' + current) : null;
    const dir = current ? Math.sign(ORDER.indexOf(name) - ORDER.indexOf(current)) || 1 : 1;
    if (!el.dataset.ready) { el.innerHTML = tpl[name](); el.dataset.ready = 1; }
    const swap = () => {
      $$('.view').forEach(v => v.classList.toggle('active', v === el));
      $$('[data-view]').forEach(a => { if (a.tagName === 'A') { a.classList.toggle('on', a.dataset.view === name); a.setAttribute('aria-current', a.dataset.view === name ? 'page' : 'false'); } });
      $('#page-title').textContent = TITLES[name][0]; $('#page-sub').textContent = TITLES[name][1];
      document.title = `${TITLES[name][0]} · SpeedMaxx Client Portal`;
      movePill(!instant); window.scrollTo({ top: 0 });
      current = name;
      if (!el.dataset.fx) {
        el.dataset.fx = 1; buildCharts(name);
        if (name === 'router') { paintRouter(); $('#dev-list').innerHTML = devListHTML('all'); }
        if (name === 'usage') { segInd($('#range-seg')); segInd($('#mode-seg')); }
      } else { Object.values(chartInst).forEach(c => c.resize && c.canvas.isConnected && c.resize()); }
      paintRouter();
      enhance(el);
      if (anim && !instant) {
        const items = $$(':scope > .card, :scope > .g > *, :scope > .kpis > *, :scope > .greet, :scope > .sec, :scope > .qa, :scope > .filter-row, :scope > .plan-opts, :scope > .card-h', el);
        gsap.fromTo(el, { opacity: 0, x: 26 * dir }, { opacity: 1, x: 0, duration: .45, ease: 'power3.out', clearProps: 'transform,opacity' });
        gsap.from(items, { y: 22, opacity: 0, duration: .55, stagger: .05, ease: 'power3.out', clearProps: 'transform,opacity' });
      }
    };
    if (prev && prev !== el && anim && !instant) gsap.to(prev, { opacity: 0, x: -20 * dir, duration: .16, ease: 'power1.in', onComplete: () => { gsap.set(prev, { clearProps: 'all' }); swap(); } });
    else swap();
  }
  const route = () => { if ($('#app').hidden) return; const n = (location.hash.match(/^#\/(\w+)/) || [])[1] || 'home'; if (n !== current) { show(n, !started); started = true; vibrate(6); } };
  addEventListener('hashchange', route);
  addEventListener('resize', () => { movePill(false); $$('.seg').forEach(s => segInd(s)); });

  function enterApp(animateIn) {
    $('#login').hidden = true; lrunning = false;
    const app = $('#app'); app.hidden = false;
    document.body.classList.add('skeleton');
    $('#avatar').textContent = USER.name.split(' ').map(w => w[0]).join('').slice(0, 2);
    if (!location.hash.startsWith('#/')) history.replaceState(null, '', '#/home');
    current = null; started = !!animateIn;
    clearInterval(liveIv); charts.forEach(c => c.destroy && c.destroy());
    Object.keys(built).forEach(k => delete built[k]); charts.length = 0; Object.keys(chartInst).forEach(k => delete chartInst[k]);
    $$('.view').forEach(v => { v.innerHTML = ''; delete v.dataset.ready; delete v.dataset.fx; v.classList.remove('active'); });
    route();
    if (anim && animateIn) { gsap.from('.side, .top', { opacity: 0, y: -14, duration: .6, ease: 'power3.out' }); gsap.from('.tabbar', { yPercent: 140, duration: .7, ease: 'power4.out', delay: .15 }); }
    setTimeout(() => document.body.classList.remove('skeleton'), animateIn ? 750 : 350);
    paintRouter();
  }
  function logout() {
    clearSession(); location.hash = '';
    $('#app').hidden = true; closeSheet(true);
    const lg = $('#login'); lg.hidden = false; loginNetInit(); if (!reduce) { lrunning = true; loginNetLoop(); }
    $$('#form-pw input[type=text], #form-pw input[type=password]').forEach(i => i.value = ''); $('#lg-btn').querySelector('.bl').textContent = 'Sign in'; $('#lg-btn').disabled = false;
    $('#otp-btn').querySelector('.bl').textContent = 'Send OTP'; otpSent = false; $('#otp-step2').hidden = true; otpBoxes.forEach(b => b.value = '');
    showErr(''); segInd(lseg);
    if (anim) gsap.from('#login-card', { y: 24, opacity: 0, duration: .6, ease: 'power3.out' });
    toast('You have been signed out', 'info');
  }

  // uptime ticker
  setInterval(() => { if (!$('#app').hidden && !router.booting) { const up = uptimeTxt(), a = $('#kv-up'), b = $('#r-up'); if (a) a.textContent = up; if (b) b.textContent = up; } }, 30000);

  /* ================= BOOT ================= */
  $('#yr').textContent = new Date().getFullYear();
  setTheme(root.getAttribute('data-theme'));
  if (getSession()) enterApp(false);
  else { $('#login').hidden = false; requestAnimationFrame(() => segInd(lseg)); if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => segInd(lseg)); if (anim) gsap.from('#login-card, .art-copy > *', { y: 26, opacity: 0, duration: .7, stagger: .08, ease: 'power3.out' }); }
})();
