/* ============================================================
   GRIT Learn v6 — Pomodoro Timer (Enhanced UI + Custom Duration)
   ============================================================ */
'use strict';

const Pomodoro = (() => {

  const MODES = {
    work:        { label:'تركيز',        duration: 25*60, color:'var(--accent)',  emoji:'🎯' },
    short_break: { label:'استراحة قصيرة', duration:  5*60, color:'#10b981',       emoji:'☕' },
    long_break:  { label:'استراحة طويلة', duration: 15*60, color:'#3b82f6',       emoji:'🌙' },
  };

  const R = 88, C = 2 * Math.PI * R;

  let state = {
    mode: 'work', timeLeft: 25*60,
    running: false, interval: null,
    sessions: 0, totalFocus: 0,
    customDurations: { work: 25, short_break: 5, long_break: 15 },
  };

  /* ─── Load saved custom durations ─── */
  function _loadCustomDurations() {
    try {
      const st = loadState();
      if (st.pomCustomDurations) {
        state.customDurations = { ...state.customDurations, ...st.pomCustomDurations };
        MODES.work.duration        = state.customDurations.work        * 60;
        MODES.short_break.duration = state.customDurations.short_break * 60;
        MODES.long_break.duration  = state.customDurations.long_break  * 60;
      }
    } catch(e) {}
  }

  /* ─── Save custom durations ─── */
  function _saveCustomDurations() {
    try {
      const st = loadState();
      st.pomCustomDurations = { ...state.customDurations };
      saveState(st);
    } catch(e) {}
  }

  function fmt(sec) {
    return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;
  }

  function updateDisplay() {
    const m  = MODES[state.mode];
    const el = id => document.getElementById(id);

    if (el('pomo-time'))  el('pomo-time').textContent  = fmt(state.timeLeft);
    if (el('pomo-label')) el('pomo-label').textContent = m.label;
    if (el('pomo-emoji')) el('pomo-emoji').textContent = m.emoji;
    if (el('pomo-play'))  el('pomo-play').textContent  = state.running ? '⏸' : '▶';
    if (el('pomo-ring')) {
      const pct = state.timeLeft / m.duration;
      el('pomo-ring').style.strokeDashoffset = C * (1 - pct);
      el('pomo-ring').style.stroke = m.color;
    }
    const wrap = document.getElementById('pomo-ring-wrap');
    if (wrap) wrap.style.filter = state.running ? `drop-shadow(0 0 18px ${m.color}55)` : 'none';

    if (el('pomoTime'))      el('pomoTime').textContent      = fmt(state.timeLeft);
    if (el('pomoModeLabel')) el('pomoModeLabel').textContent = m.label;
    if (el('pomoPlayBtn')) {
      el('pomoPlayBtn').textContent = state.running ? '⏸' : '▶️';
      el('pomoPlayBtn').style.background = state.running
        ? 'linear-gradient(135deg,#ef4444,#f97316)'
        : 'linear-gradient(135deg,#6c63ff,#a855f7)';
    }
    if (el('pomoRingFill')) {
      const pct = state.timeLeft / m.duration;
      el('pomoRingFill').style.strokeDashoffset = (628 * (1 - pct)).toFixed(2);
      el('pomoRingFill').style.stroke = m.color;
    }
    if (el('pomoSessionCount')) el('pomoSessionCount').textContent = state.sessions;

    document.querySelectorAll('.pomo-mode-tab').forEach(tab => {
      const modeMap = { focus:'work', short:'short_break', long:'long_break' };
      tab.classList.toggle('active', modeMap[tab.dataset.mode] === state.mode);
    });

    const dotsEl = document.getElementById('pomoSessionDots');
    if (dotsEl) {
      const dotsArr = dotsEl.querySelectorAll('.pomo-session-dot');
      dotsArr.forEach((dot, i) => {
        dot.classList.remove('current','done');
        const posInCycle = state.sessions % 4;
        if (i < posInCycle) dot.classList.add('done');
        else if (i === posInCycle) dot.classList.add('current');
      });
    }

    /* Update custom duration inputs if visible */
    _updateDurationInputs();
    updateDots();
  }

  function _updateDurationInputs() {
    const wi = document.getElementById('pomoDurWork');
    const si = document.getElementById('pomoDurShort');
    const li = document.getElementById('pomoDurLong');
    if (wi) wi.value = state.customDurations.work;
    if (si) si.value = state.customDurations.short_break;
    if (li) li.value = state.customDurations.long_break;
  }

  function updateDots() {
    const el = document.getElementById('pomo-dots');
    if (!el) return;
    el.innerHTML = Array.from({length:4}, (_,i) => `
      <div style="
        width:10px;height:10px;border-radius:50%;transition:all .3s ease;
        background:${i < (state.sessions % 4)
          ? '#10b981'
          : 'rgba(255,255,255,.1)'};
        box-shadow:${i < (state.sessions % 4)
          ? '0 0 6px rgba(16,185,129,.5)'
          : 'none'};
      "></div>`).join('');
  }

  function tick() {
    state.timeLeft--;
    if (state.mode === 'work') state.totalFocus++;
    updateDisplay();
    if (state.timeLeft <= 0) {
      clearInterval(state.interval);
      state.running = false;
      onEnd();
    }
  }

  function onEnd() {
    if (navigator.vibrate) navigator.vibrate([200,100,200]);
    if (state.mode === 'work') {
      state.sessions++;
      try {
        const appSt = loadState();
        addXpToState(appSt, 50);
        appSt.pomSessions = (appSt.pomSessions || 0) + 1;
        saveState(appSt);
        if (typeof checkAndAwardBadges === 'function') checkAndAwardBadges(appSt);
      } catch(e) {}
      if (typeof showXpFloat === 'function') showXpFloat(50);
      if (typeof showToast === 'function') showToast('جلسة مكتملة! +50 XP 🎉', 'success');
      const next = state.sessions % 4 === 0 ? 'long_break' : 'short_break';
      setTimeout(() => setMode(next), 1200);
    } else {
      if (typeof showToast === 'function') showToast('انتهت الاستراحة! ⏰', 'info');
      setTimeout(() => setMode('work'), 1200);
    }
  }

  /* ─── Public ─── */
  function toggle() {
    if (state.running) { clearInterval(state.interval); state.running = false; }
    else { state.running = true; state.interval = setInterval(tick, 1000); }
    const ringWrap = document.getElementById('pomo-ring-wrap') || document.querySelector('.pomo-ring-wrap');
    if (ringWrap) ringWrap.classList.toggle('running', state.running);
    const timeEl = document.querySelector('.pomo-time') || document.getElementById('pomoTime');
    if (timeEl) timeEl.classList.toggle('running', state.running);
    updateDisplay();
  }

  function reset() {
    clearInterval(state.interval); state.running = false;
    state.timeLeft = MODES[state.mode].duration;
    updateDisplay();
  }

  function skip() {
    clearInterval(state.interval); state.running = false;
    state.timeLeft = 0; onEnd();
  }

  function setMode(mode) {
    clearInterval(state.interval); state.running = false;
    state.mode = mode; state.timeLeft = MODES[mode].duration;
    document.querySelectorAll('.pomo-tab').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === mode);
    });
    updateDisplay();
  }

  /* ─── Custom duration setter ─── */
  function setCustomDuration(mode, minutes) {
    const mins = Math.max(1, Math.min(120, parseInt(minutes) || 25));
    state.customDurations[mode] = mins;
    MODES[mode].duration = mins * 60;
    /* If currently in this mode, reset timer */
    if (state.mode === mode && !state.running) {
      state.timeLeft = MODES[mode].duration;
    }
    _saveCustomDurations();
    updateDisplay();
    if (typeof showToast === 'function') {
      const labels = { work:'وقت التركيز', short_break:'الاستراحة القصيرة', long_break:'الاستراحة الطويلة' };
      showToast(`✅ ${labels[mode]}: ${mins} دقيقة`, 'success');
    }
  }

  function init(containerId) {
    _loadCustomDurations();
    const hasV91 = !!document.getElementById('pomoTime');
    if (hasV91) {
      _syncV91();
      _injectDurationPanel();
      return;
    }
    const el = document.getElementById(containerId || 'pomo-container');
    if (!el) return;
    el.innerHTML = renderHTML();
    updateDisplay();
  }

  /* ─── Inject the custom duration panel below tips ─── */
  function _injectDurationPanel() {
    if (document.getElementById('pomoDurationPanel')) return;
    const tipsEl = document.querySelector('#pomodoroScreen .content > div:last-of-type')
                || document.getElementById('pomoTip')?.closest('div[style]')?.parentElement;

    const panel = document.createElement('div');
    panel.id = 'pomoDurationPanel';
    panel.style.cssText = 'padding:0 16px 16px;width:100%';
    panel.innerHTML = `
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:14px 16px">
        <div style="font-size:12px;font-weight:900;color:var(--text);margin-bottom:12px;display:flex;align-items:center;gap:6px">
          ⚙️ تخصيص المدد
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
          ${_durationInput('work','pomoDurWork','🎯 تركيز', state.customDurations.work)}
          ${_durationInput('short_break','pomoDurShort','☕ قصيرة', state.customDurations.short_break)}
          ${_durationInput('long_break','pomoDurLong','🌙 طويلة', state.customDurations.long_break)}
        </div>
      </div>`;

    /* Insert before the last spacer div */
    const screen = document.querySelector('#pomodoroScreen .content');
    if (screen) {
      const lastDiv = screen.querySelector('div[style*="height:calc"]');
      if (lastDiv) screen.insertBefore(panel, lastDiv);
      else screen.appendChild(panel);
    }
  }

  function _durationInput(mode, id, label, val) {
    return `
      <div style="text-align:center">
        <div style="font-size:10px;font-weight:800;color:var(--text3);margin-bottom:4px">${label}</div>
        <div style="display:flex;align-items:center;gap:4px;background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:2px 6px">
          <button onclick="Pomodoro.setCustomDuration('${mode}',document.getElementById('${id}').value-1)"
            style="background:none;border:none;color:var(--text3);font-size:16px;cursor:pointer;padding:0 2px;line-height:1">−</button>
          <input id="${id}" type="number" min="1" max="120" value="${val}"
            style="width:32px;text-align:center;border:none;background:transparent;font-family:inherit;font-size:13px;font-weight:900;color:var(--text);outline:none"
            onchange="Pomodoro.setCustomDuration('${mode}',this.value)">
          <button onclick="Pomodoro.setCustomDuration('${mode}',+document.getElementById('${id}').value+1)"
            style="background:none;border:none;color:var(--text3);font-size:16px;cursor:pointer;padding:0 2px;line-height:1">+</button>
        </div>
        <div style="font-size:9px;color:var(--text4);margin-top:2px">دقيقة</div>
      </div>`;
  }

  function _syncV91() {
    const m = MODES[state.mode];
    const timeEl = document.getElementById('pomoTime');
    if (timeEl) timeEl.textContent = fmt(state.timeLeft);

    const labelEl = document.getElementById('pomoModeLabel');
    if (labelEl) labelEl.textContent = m.label;

    const playBtn = document.getElementById('pomoPlayBtn');
    if (playBtn) {
      playBtn.textContent = state.running ? '⏸️' : '▶️';
      playBtn.style.transform = '';
    }

    const ringWrap = document.querySelector('.pomo-ring-wrap');
    if (ringWrap) ringWrap.classList.toggle('running', state.running);
    if (timeEl) timeEl.classList.toggle('running', state.running);

    const ring = document.getElementById('pomoRingFill');
    if (ring) {
      const pct = m.duration > 0 ? state.timeLeft / m.duration : 0;
      const offset = 628 * (1 - pct);
      ring.style.strokeDashoffset = offset.toString();
      const isBreak = state.mode !== 'work';
      const isLow   = !isBreak && pct <= 0.2;
      ring.style.stroke = isLow ? 'url(#redGrad)' : isBreak ? '#10b981' : 'url(#pomoGrad)';
    }

    const sc = document.getElementById('pomoSessionCount');
    if (sc) sc.textContent = state.sessions;

    document.querySelectorAll('.pomo-mode-tab').forEach(tab => {
      const modeMap = { focus:'work', short:'short_break', long:'long_break' };
      tab.classList.toggle('active', modeMap[tab.dataset.mode] === state.mode);
    });

    const sf = document.getElementById('pomoStatFocus');
    const sm = document.getElementById('pomoStatMins');
    const sx = document.getElementById('pomoStatXp');
    if (sf) sf.textContent = state.sessions;
    if (sm) sm.textContent = Math.floor(state.totalFocus / 60);
    if (sx) sx.textContent = (state.sessions || 0) * 50;

    const dotsEl = document.getElementById('pomoSessionDots');
    if (dotsEl) {
      const dots = dotsEl.querySelectorAll('.pomo-session-dot');
      dots.forEach((dot, i) => {
        const isDone = i < (state.sessions % 4);
        const isCurrent = i === (state.sessions % 4);
        dot.classList.toggle('done', isDone);
        dot.classList.toggle('current', isCurrent);
      });
    }
  }

  function renderHTML() {
    const totalMin = Math.floor(state.totalFocus / 60);
    return `
    <div style="display:flex;flex-direction:column;align-items:center;gap:20px;padding:20px 16px 120px">
      <div style="display:flex;background:rgba(255,255,255,.05);border-radius:14px;padding:3px;gap:3px;width:100%;max-width:340px">
        ${Object.entries(MODES).map(([key,m])=>`
          <button class="pomo-tab ${key==='work'?'active':''}" data-mode="${key}"
            onclick="Pomodoro.setMode('${key}')"
            style="flex:1;padding:8px 4px;border-radius:11px;border:none;cursor:pointer;font-size:.72rem;font-weight:700;transition:all .25s ease;
              background:${key==='work'?'var(--accent)':'transparent'};
              color:${key==='work'?'white':'var(--text3)'}"
          >${m.emoji} ${m.label}</button>`).join('')}
      </div>
      <div id="pomo-ring-wrap" style="position:relative;width:220px;height:220px;display:flex;align-items:center;justify-content:center;transition:filter .5s ease">
        <svg width="220" height="220" viewBox="0 0 220 220" style="position:absolute;top:0;left:0">
          <circle cx="110" cy="110" r="${R}" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="10"/>
          <circle id="pomo-ring" cx="110" cy="110" r="${R}"
            fill="none" stroke="var(--accent)" stroke-width="10" stroke-linecap="round"
            stroke-dasharray="${C.toFixed(2)}" stroke-dashoffset="0"
            style="transform:rotate(-90deg);transform-origin:50% 50%;transition:stroke-dashoffset 1s linear,stroke .5s ease"/>
        </svg>
        <div style="position:relative;z-index:1;text-align:center">
          <div id="pomo-emoji" style="font-size:2rem;margin-bottom:4px">🎯</div>
          <div id="pomo-time" style="font-size:2.6rem;font-weight:900;color:var(--text1);font-variant-numeric:tabular-nums;letter-spacing:-.02em">25:00</div>
          <div id="pomo-label" style="font-size:.72rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.1em">تركيز</div>
        </div>
      </div>
      <div style="display:flex;gap:14px;align-items:center">
        <button onclick="Pomodoro.reset()" style="width:48px;height:48px;border-radius:50%;border:1.5px solid rgba(255,255,255,.1);background:rgba(255,255,255,.06);font-size:1.2rem;cursor:pointer">🔄</button>
        <button id="pomo-play" onclick="Pomodoro.toggle()" style="width:68px;height:68px;border-radius:50%;border:none;background:linear-gradient(135deg,var(--accent),#818cf8);font-size:1.6rem;cursor:pointer;box-shadow:0 8px 24px rgba(139,92,246,.4)">▶</button>
        <button onclick="Pomodoro.skip()" style="width:48px;height:48px;border-radius:50%;border:1.5px solid rgba(255,255,255,.1);background:rgba(255,255,255,.06);font-size:1.2rem;cursor:pointer">⏭</button>
      </div>
      <div style="text-align:center">
        <div style="font-size:.68rem;color:var(--text3);font-weight:600;margin-bottom:8px">جلسات الدورة الحالية (4)</div>
        <div id="pomo-dots" style="display:flex;gap:8px;justify-content:center"></div>
      </div>
      <!-- Custom Duration Panel -->
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:14px 16px;width:100%;max-width:340px">
        <div style="font-size:12px;font-weight:900;color:var(--text);margin-bottom:12px">⚙️ تخصيص المدد</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
          ${_durationInput('work','pomoDurWork','🎯 تركيز', state.customDurations.work)}
          ${_durationInput('short_break','pomoDurShort','☕ قصيرة', state.customDurations.short_break)}
          ${_durationInput('long_break','pomoDurLong','🌙 طويلة', state.customDurations.long_break)}
        </div>
      </div>
    </div>`;
  }

  return { toggle, reset, skip, setMode, setCustomDuration, init };
})();

