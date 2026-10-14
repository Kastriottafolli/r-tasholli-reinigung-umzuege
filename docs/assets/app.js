(() => {
  'use strict';
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#navigation');
  const setMenu = (open) => {
    menu?.setAttribute('aria-expanded', String(open));
    nav?.classList.toggle('is-open', open);
  };
  menu?.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
  nav?.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') { setMenu(false); menu.focus(); }
  });
  const motion = document.querySelector('.motion-toggle');
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let saved = null;
  try { saved = sessionStorage.getItem('rt-motion-paused'); } catch { /* Optional setting. */ }
  let paused = preference.matches || saved === 'true';
  function applyMotion() {
    document.body.classList.toggle('motion-paused', paused);
    motion?.setAttribute('aria-pressed', String(paused));
    const label = paused ? 'Logo-Animation abspielen' : 'Logo-Animation pausieren';
    motion?.setAttribute('aria-label', label); motion?.setAttribute('title', label);
    if (motion) motion.textContent = paused ? '▷' : 'Ⅱ';
  }
  applyMotion();
  motion?.addEventListener('click', () => {
    paused = !paused; applyMotion();
    try { sessionStorage.setItem('rt-motion-paused', String(paused)); } catch { /* Optional setting. */ }
  });
  preference.addEventListener?.('change', e => { if (e.matches) { paused = true; applyMotion(); } });
  const form = document.querySelector('#request-form');
  if (!form) return;
  const service = form.querySelector('#service');
  const preview = document.querySelector('#request-preview');
  const output = document.querySelector('#preview-body');
  const emailLink = document.querySelector('#email-draft');
  const date = document.querySelector('#date');
  const today = new Date();
  date.min = [today.getFullYear(), String(today.getMonth()+1).padStart(2,'0'), String(today.getDate()).padStart(2,'0')].join('-');
  const query = new URLSearchParams(window.location.search).get('service');
  if (query && [...service.options].some(o => o.value === query)) service.value = query;
  function showFields() {
    const value = service.value;
    const states = {
      'cleaning-fields': ['Reinigung','Umzug + Endreinigung','Mehrere Leistungen'].includes(value),
      'moving-fields': ['Umzüge','Möbeltransport','Entrümpelung','Umzug + Endreinigung','Mehrere Leistungen'].includes(value),
      'garden-fields': ['Gartenpflege','Mehrere Leistungen'].includes(value)
    };
    for (const [id, visible] of Object.entries(states)) {
      const fieldset = document.getElementById(id);
      fieldset.hidden = !visible;
      fieldset.querySelectorAll('input,select').forEach(el => { el.disabled = !visible; });
    }
  }
  showFields(); service.addEventListener('change', showFields);
  let body = '';
  const labels = { service:'Leistung',name:'Name',email:'E-Mail',phone:'Telefon',place:'Einsatzort',date:'Wunschtermin',object:'Objektart',area:'Fläche (m²)',interval:'Reinigungsrhythmus',start:'Start',destination:'Ziel',size:'Umfang',access:'Etagen / Aufzug',gardenarea:'Gartenfläche (m²)',gardeninterval:'Gartenpflege',message:'Anliegen' };
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const values = new FormData(form);
    const lines = ['Guten Tag R. Tasholli,','', 'ich möchte folgende Leistungen anfragen:',''];
    for (const [key, raw] of values.entries()) {
      const value = String(raw).trim(); if (value && labels[key]) lines.push(labels[key] + ': ' + value);
    }
    lines.push('', 'Bitte melden Sie sich zur Abstimmung von Umfang, Kosten und Termin.', '', 'Freundliche Grüße', String(values.get('name')).trim());
    body = lines.join('\n'); output.textContent = body;
    emailLink.href = 'mailto:R.tasholli-reinigung@outlook.de?subject=' + encodeURIComponent('Anfrage: '+values.get('service')) + '&body=' + encodeURIComponent(body);
    form.hidden = true; preview.hidden = false; preview.focus();
  });
  document.querySelector('#edit-request').addEventListener('click', () => {
    preview.hidden = true; form.hidden = false; service.focus();
  });
  document.querySelector('#copy-request').addEventListener('click', async () => {
    const status = document.querySelector('#copy-status');
    try { await navigator.clipboard.writeText(body); status.textContent = 'Anfrage kopiert. Sie können sie in Ihre E-Mail einfügen.'; }
    catch { status.textContent = 'Kopieren nicht verfügbar. Bitte markieren und kopieren Sie die Zusammenfassung direkt.'; }
  });
})();
