/* ============================================================
   GRIT Learn v5.0 — Leaderboard
   ترتيب محلي + مشاركة Telegram
   ============================================================ */
'use strict';

/* بيانات وهمية واقعية للتشجيع */
const LB_MOCK_PLAYERS = [
  { name:'ياسين بلقاسم',  xp:4850, streak:22, branch:'science', avatar:'ي', hours:48, questions:320 },
  { name:'أميرة حمداني',  xp:4200, streak:18, branch:'math',    avatar:'أ', hours:42, questions:280 },
  { name:'عمر زروق',      xp:3700, streak:15, branch:'science', avatar:'ع', hours:38, questions:245 },
  { name:'نور الهدى',     xp:3100, streak:12, branch:'letters', avatar:'ن', hours:31, questions:200 },
  { name:'رياض مزيان',    xp:2900, streak:10, branch:'manage',  avatar:'ر', hours:29, questions:190 },
  { name:'سارة بن علي',   xp:2400, streak:9,  branch:'manage',  avatar:'س', hours:24, questions:155 },
  { name:'أنس طاهري',     xp:2100, streak:7,  branch:'science', avatar:'ا', hours:21, questions:140 },
  { name:'لمياء قاسمي',   xp:1800, streak:6,  branch:'letters', avatar:'ل', hours:18, questions:115 },
  { name:'هاني بوعزيز',   xp:1500, streak:5,  branch:'math',    avatar:'ه', hours:15, questions:95  },
  { name:'دنيا مسعود',    xp:1200, streak:4,  branch:'manage',  avatar:'د', hours:12, questions:78  },
];

let _lbPeriod = 'alltime';

/* ══ Render Leaderboard ══ */
function renderLeaderboard() {
  const players = buildLeaderboard();
  renderTop3(players);
  renderLBList(players);
  renderMyRank(players);
  renderLBStats(players);
}

/* ══ Build Players Array ══ */
function buildLeaderboard() {
  const st = loadState();
  const myEntry = {
    name:      st.name || 'أنت',
    xp:        st.xp || 0,
    streak:    st.streak || 0,
    branch:    st.branch || 'all',
    avatar:    st.avatar || (st.name?.[0] || 'أ'),
    hours:     Math.floor(((st.pomSessions||0)*25 + (st.ses||0)*5) / 60),
    questions: (st.ok||0) + (st.wrongCount||0),
    isMe:      true,
  };

  let players = [...LB_MOCK_PLAYERS.map(p => ({ ...p, isMe: false })), myEntry];
  players.sort((a, b) => b.xp - a.xp);
  players = players.map((p, i) => ({ ...p, rank: i + 1 }));
  return players;
}

/* ══ Top 3 Podium ══ */
function renderTop3(players) {
  const top3 = players.slice(0, 3);
  /* Support both 'lbTop3' (old) and 'lbPodium' (new HTML) */
  const container = document.getElementById('lbPodium') || document.getElementById('lbTop3');
  if (!container) return;

  const medals  = ['🥈', '🥇', '🥉'];
  const displayOrder = [top3[1], top3[0], top3[2]]; // 2nd, 1st, 3rd

  container.innerHTML = displayOrder.map((p, i) => {
    if (!p) return '';
    const isFirst = i === 1;
    const medal   = medals[i];
    const isMe    = p.isMe;
    const lvl     = getLevelInfo(p.xp);
    const avatarContent = (typeof p.avatar === 'string' && p.avatar.startsWith('data:'))
      ? `<img src="${p.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
      : `<span style="font-size:${isFirst?'22':'18'}px;font-weight:900">${p.avatar}</span>`;

    return `
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;${isFirst?'transform:translateY(-12px)':''}">
        <div style="font-size:${isFirst?'28':'22'}px">${medal}</div>
        <div style="
          width:${isFirst?'60':'50'}px;height:${isFirst?'60':'50'}px;
          border-radius:50%;background:var(--grad-primary);
          display:flex;align-items:center;justify-content:center;
          border:${isMe?'3px solid #f59e0b':'2px solid var(--border2)'};
          overflow:hidden;">
          ${avatarContent}
        </div>
        <div style="font-size:11px;font-weight:900;color:var(--text);text-align:center;max-width:70px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
          ${p.name}${isMe?' 👈':''}
        </div>
        <div style="font-size:10px;color:var(--accent);font-weight:800">⚡ ${p.xp.toLocaleString()}</div>
        <div style="font-size:9px;color:var(--text4)">${lvl.icon} ${lvl.name}</div>
      </div>`;
  }).join('');
}

/* ══ Full List (rank 4+) ══ */
function renderLBList(players) {
  const container = document.getElementById('lbList');
  if (!container) return;

  const rest = players.slice(3);
  if (!rest.length) { container.innerHTML = ''; return; }

  container.innerHTML = rest.map(p => {
    const isMe   = p.isMe;
    const lvl    = getLevelInfo(p.xp);
    const branch = BRANCHES[p.branch]?.n || '';
    const avatarContent = (typeof p.avatar === 'string' && p.avatar.startsWith('data:'))
      ? `<img src="${p.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
      : `<span style="font-size:15px;font-weight:900">${p.avatar}</span>`;

    return `
      <div style="
        display:flex;align-items:center;gap:12px;
        padding:11px 16px;
        background:${isMe?'rgba(108,99,255,0.06)':'var(--surface)'};
        border-bottom:1px solid var(--border);
        ${isMe?'border-right:3px solid var(--accent)':''}">
        <div style="width:24px;text-align:center;font-size:12px;font-weight:900;color:${p.rank<=5?'var(--accent)':'var(--text4)'}">
          ${p.rank}
        </div>
        <div style="width:36px;height:36px;border-radius:50%;background:var(--grad-primary);
                    display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;">
          ${avatarContent}
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:900;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
            ${p.name}${isMe?' 👈':''}
          </div>
          <div style="font-size:10px;color:var(--text3);font-weight:700">
            ${lvl.icon} ${lvl.name}${branch?' · '+branch:''}
          </div>
        </div>
        <div style="text-align:left;flex-shrink:0">
          <div style="font-size:12px;font-weight:900;color:var(--accent)">⚡ ${p.xp.toLocaleString()}</div>
          <div style="font-size:10px;color:var(--text4)">🔥 ${p.streak} يوم</div>
        </div>
      </div>`;
  }).join('');
}

/* ══ My Rank Banner ══ */
function renderMyRank(players) {
  const me  = players.find(p => p.isMe);
  if (!me) return;
  const lvl = getLevelInfo(me.xp);

  /* Support both old and new HTML IDs */
  const rankEl  = document.getElementById('lbMyRankNum') || document.getElementById('lbMyRankVal');
  const nameEl  = document.getElementById('lbMyRankName') || document.getElementById('lbMyName');
  const xpEl    = document.getElementById('lbMyRankXP')   || document.getElementById('lbMyXp');
  const iconEl  = document.getElementById('lbMyRankIcon') || document.getElementById('lbMyBadge');

  if (rankEl)  rankEl.textContent  = '#' + me.rank;
  if (nameEl)  nameEl.textContent  = me.name;
  if (xpEl)    xpEl.textContent    = '⚡ ' + me.xp.toLocaleString() + ' XP · 🔥 ' + me.streak + ' يوم';
  if (iconEl)  iconEl.textContent  = lvl.icon;
}

/* ══ Community Stats Section ══ */
function renderLBStats(players) {
  /* Inject stats block if not already there */
  const list = document.getElementById('lbList');
  if (!list) return;

  const totalXp      = players.reduce((s, p) => s + p.xp, 0);
  const totalQ       = players.reduce((s, p) => s + (p.questions||0), 0);
  const totalHours   = players.reduce((s, p) => s + (p.hours||0), 0);
  const activeCount  = players.filter(p => p.streak > 0).length;

  let statsEl = document.getElementById('lbCommunityStats');
  if (!statsEl) {
    statsEl = document.createElement('div');
    statsEl.id = 'lbCommunityStats';
    list.after(statsEl);
  }

  statsEl.innerHTML = `
    <div style="padding:16px;border-top:1px solid var(--border)">
      <div style="font-size:12px;font-weight:900;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px">
        📊 إحصائيات المجتمع
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        ${_lbStatCard('👥 الطلاب النشطون', activeCount + ' طالب',  '#6c63ff')}
        ${_lbStatCard('⭐ مجموع XP',       (totalXp/1000).toFixed(1)+'K', '#f59e0b')}
        ${_lbStatCard('📝 أسئلة محلولة',   totalQ.toLocaleString(),       '#10b981')}
        ${_lbStatCard('⏱ ساعات الدراسة',   totalHours + ' ساعة',          '#3b82f6')}
      </div>
    </div>
    <div style="text-align:center;padding:12px 20px 100px;color:var(--text4);font-size:11px;font-weight:700">
      🔒 اللوحة الحية قريباً — البيانات الحالية تجريبية
    </div>`;
}

function _lbStatCard(label, val, color) {
  return `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:12px;text-align:center">
      <div style="font-size:16px;font-weight:900;color:${color}">${val}</div>
      <div style="font-size:10px;color:var(--text3);font-weight:700;margin-top:2px">${label}</div>
    </div>`;
}

/* ══ Period tabs ══ */
function switchLbPeriod(btn, period) {
  _lbPeriod = period;
  document.querySelectorAll('.lb-period-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  /* Re-render with same mock data — in future, filter by period */
  renderLeaderboard();
}

/* ══ Share to Telegram ══ */
function shareLBResult() {
  const players = buildLeaderboard();
  const me = players.find(p => p.isMe);
  if (!me) return;
  const lvl  = getLevelInfo(me.xp);
  const text = `🏆 ترتيبي في GRIT Learn\n` +
               `📍 المركز #${me.rank} من ${players.length} طالب\n` +
               `⚡ ${me.xp} XP | 🔥 ${me.streak} يوم streak\n` +
               `${lvl.icon} مستوى: ${lvl.name}\n` +
               `\n📢 @bacDz_09 — BAC 2026 🇩🇿`;
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.openTelegramLink('https://t.me/share/url?text=' + encodeURIComponent(text));
  } else {
    navigator.clipboard?.writeText(text).then(() => showToast('📋 تم نسخ الترتيب!', 'success'));
  }
  const st2 = loadState();
  st2.shares = (st2.shares || 0) + 1;
  saveState(st2);
  if (typeof checkAndAwardBadges === 'function') checkAndAwardBadges(st2);
}

function _setEl(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }

