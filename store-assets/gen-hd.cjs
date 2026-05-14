const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = path.join(__dirname, 'output');
const W = 1080;
const H = 1920;

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

function base() {
  return `
    * { margin:0; padding:0; box-sizing:border-box; }
    body { width:${W}px; height:${H}px; background:#FAF6F1; font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif; color:#2D2A26; overflow:hidden; }
    .page { padding:48px; height:100%; position:relative; }
    .card { background:#fff; border:1px solid #E8DED4; border-radius:36px; padding:42px; margin-bottom:36px; }
    .primary { color:#8B5E5A; }
    .muted { color:#8A8580; }
    .serif { font-family:Georgia,"Noto Serif SC",serif; }
    h1 { font-size:60px; font-weight:600; }
    h2 { font-size:48px; font-weight:500; }
    h3 { font-size:42px; font-weight:500; }
    .xs { font-size:33px; }
    .sm { font-size:39px; }
    .grid3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:24px; }
    .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:24px; }
    .flex { display:flex; align-items:center; }
    .gap { gap:24px; }
    .ib { width:96px; height:96px; border-radius:24px; display:flex; align-items:center; justify-content:center; font-size:42px; flex-shrink:0; }
    .btn { padding:24px 48px; border-radius:24px; font-size:39px; border:none; }
    .label { position:absolute; bottom:0; left:0; right:0; background:linear-gradient(transparent,rgba(139,94,90,0.92)); padding:120px 60px 72px; color:white; text-align:center; }
    .label h2 { color:white; font-size:54px; margin-bottom:12px; }
    .label p { font-size:36px; opacity:0.9; }
    .statusbar { height:84px; display:flex; align-items:center; justify-content:flex-end; padding:0 48px; font-size:33px; color:#8A8580; }
  `;
}

function wrap(body) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${base()}</style></head><body>${body}</body></html>`;
}

const pages = {
  'phone-1-dashboard': wrap(`
    <div class="statusbar">9:41</div>
    <div class="page">
      <div style="margin-bottom:36px;"><h1 class="serif">aaronhu720，你好</h1><p class="xs muted" style="margin-top:12px;">2026年5月12日 星期二</p></div>
      <div class="grid3" style="margin-bottom:42px;">
        <div class="card" style="padding:30px;"><div class="flex gap"><div class="ib" style="background:#E8F0E4;color:#3D5E42;">✓</div><div><p class="xs muted">今日</p><p style="font-size:36px;font-weight:500;">已记录</p></div></div></div>
        <div class="card" style="padding:30px;"><div class="flex gap"><div class="ib" style="background:#E0EBF5;color:#3B5998;">☺</div><div><p class="xs muted">心情</p><p style="font-size:36px;font-weight:500;">7.2/10</p></div></div></div>
        <div class="card" style="padding:30px;"><div class="flex gap"><div class="ib" style="background:rgba(139,94,90,0.1);color:#8B5E5A;">✉</div><div><p class="xs muted">信件</p><p style="font-size:36px;font-weight:500;">2 封</p></div></div></div>
      </div>
      <div class="flex" style="justify-content:space-between;margin-bottom:30px;"><h2 class="serif">快捷操作</h2><button class="btn" style="background:#8B5E5A;color:white;">写日记</button></div>
      <div class="grid2" style="margin-bottom:42px;">
        <div class="card flex gap" style="padding:30px;"><div class="ib" style="background:#E8F0E4;color:#3D5E42;">▦</div><span class="sm" style="font-weight:500;">情绪日历</span></div>
        <div class="card flex gap" style="padding:30px;"><div class="ib" style="background:#E0EBF5;color:#3B5998;">◠</div><span class="sm" style="font-weight:500;">情绪趋势</span></div>
        <div class="card flex gap" style="padding:30px;"><div class="ib" style="background:rgba(139,94,90,0.1);color:#8B5E5A;">✉</div><span class="sm" style="font-weight:500;">延迟信件</span></div>
        <div class="card flex gap" style="padding:30px;"><div class="ib" style="background:rgba(212,197,185,0.3);color:#8B5E5A;">♡</div><span class="sm" style="font-weight:500;">AI 陪伴</span></div>
      </div>
      <div class="grid2">
        <div class="card flex gap" style="padding:30px;"><div class="ib" style="background:linear-gradient(135deg,#e0d4f5,#d5c8f0);font-size:54px;">🔮</div><div><p class="sm" style="font-weight:500;">塔罗牌</p><p class="xs muted">¥9.9/次</p></div></div>
        <div class="card flex gap" style="padding:30px;"><div class="ib" style="background:linear-gradient(135deg,#fce4ec,#f8bbd0);font-size:54px;">✨</div><div><p class="sm" style="font-weight:500;">姓名测试</p><p class="xs muted">¥9.9/次</p></div></div>
      </div>
      <div class="label"><h2 class="serif">记录每一天的心情</h2><p>智能仪表盘，一目了然</p></div>
    </div>
  `),

  'phone-2-diary': wrap(`
    <div class="statusbar">9:41</div>
    <div class="page">
      <h1 class="serif" style="margin-bottom:42px;">写日记</h1>
      <div class="card">
        <label class="sm" style="font-weight:500;display:block;margin-bottom:18px;">标题</label>
        <div style="background:#FAF6F1;border:1px solid #E8DED4;border-radius:24px;padding:24px 36px;font-size:39px;margin-bottom:36px;">今天和老朋友见面了</div>
        <label class="sm" style="font-weight:500;display:block;margin-bottom:18px;">正文</label>
        <div style="background:#FAF6F1;border:1px solid #E8DED4;border-radius:24px;padding:24px 36px;font-size:39px;min-height:210px;margin-bottom:42px;">好久没见了，聊了很多以前的事情，感觉心里暖暖的...</div>
        <label class="sm" style="font-weight:500;display:block;margin-bottom:24px;">心情标签</label>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-bottom:42px;">
          <div style="text-align:center;padding:24px 12px;border-radius:30px;background:#DBEAFE;font-size:33px;"><div style="font-size:54px;margin-bottom:6px;">💭</div>想念</div>
          <div style="text-align:center;padding:24px 12px;border-radius:30px;background:#FEE2E2;font-size:33px;"><div style="font-size:54px;margin-bottom:6px;">😢</div>痛苦</div>
          <div style="text-align:center;padding:24px 12px;border-radius:30px;background:#FEE2E2;font-size:33px;"><div style="font-size:54px;margin-bottom:6px;">😤</div>愤怒</div>
          <div style="text-align:center;padding:24px 12px;border-radius:30px;background:#34D399;color:white;font-size:33px;font-weight:600;box-shadow:0 6px 24px rgba(52,211,153,0.4);"><div style="font-size:54px;margin-bottom:6px;">😌</div>释怀</div>
          <div style="text-align:center;padding:24px 12px;border-radius:30px;background:#FEF3C7;font-size:33px;"><div style="font-size:54px;margin-bottom:6px;">😔</div>后悔</div>
          <div style="text-align:center;padding:24px 12px;border-radius:30px;background:#E0E7FF;font-size:33px;"><div style="font-size:54px;margin-bottom:6px;">🧘</div>平静</div>
          <div style="text-align:center;padding:24px 12px;border-radius:30px;background:#EDE9FE;font-size:33px;"><div style="font-size:54px;margin-bottom:6px;">🙏</div>感恩</div>
        </div>
        <label class="sm" style="font-weight:500;display:block;margin-bottom:12px;">情绪评分：<span class="primary" style="font-size:48px;">7</span> / 10</label>
        <div style="height:18px;background:#E8DED4;border-radius:9px;margin:24px 0;"><div style="height:100%;width:70%;background:#8B5E5A;border-radius:9px;"></div></div>
        <div class="flex xs muted" style="justify-content:space-between;"><span>😞 低落</span><span>😐 平静</span><span>😊 愉悦</span></div>
      </div>
      <div class="label"><h2 class="serif">用文字疗愈心灵</h2><p>七种心情标签，精准捕捉情绪</p></div>
    </div>
  `),

  'phone-3-tarot': wrap(`
    <div class="statusbar">9:41</div>
    <div class="page">
      <div style="text-align:center;margin-bottom:42px;"><div style="font-size:108px;margin-bottom:12px;">🔮</div><h1 class="serif">塔罗牌占卜</h1><p class="xs muted" style="margin-top:12px;">倾听内心的声音，探索情绪的方向</p></div>
      <div class="card"><div class="flex" style="justify-content:space-between;margin-bottom:18px;"><span class="xs muted" style="font-weight:500;">过去</span></div><div class="flex gap"><span style="font-size:84px;">🌙</span><div><p style="font-size:45px;font-weight:600;" class="serif">女祭司</p><p class="xs muted" style="margin-top:6px;">直觉、潜意识、内在智慧</p></div></div></div>
      <div class="card"><div class="flex" style="justify-content:space-between;margin-bottom:18px;"><span class="xs muted" style="font-weight:500;">现在</span><span style="font-size:27px;background:#FEF3C7;color:#92400E;padding:6px 18px;border-radius:30px;">逆位</span></div><div class="flex gap"><span style="font-size:84px;transform:rotate(180deg);display:inline-block;">⚔</span><div><p style="font-size:45px;font-weight:600;" class="serif">战车</p><p class="xs muted" style="margin-top:6px;">失控、方向不明</p></div></div></div>
      <div class="card"><div class="flex" style="justify-content:space-between;margin-bottom:18px;"><span class="xs muted" style="font-weight:500;">未来</span></div><div class="flex gap"><span style="font-size:84px;">⭐</span><div><p style="font-size:45px;font-weight:600;" class="serif">星星</p><p class="xs muted" style="margin-top:6px;">希望、灵感、内心平静</p></div></div></div>
      <div style="background:rgba(139,94,90,0.05);border-radius:36px;padding:36px;text-align:center;"><p class="xs muted">塔罗牌仅供娱乐和自我反思，不代表真实预测</p></div>
      <div class="label"><h2 class="serif">塔罗牌占卜</h2><p>过去、现在、未来三牌阵解读</p></div>
    </div>
  `),

  'phone-4-nametest': wrap(`
    <div class="statusbar">9:41</div>
    <div class="page">
      <div style="text-align:center;margin-bottom:36px;"><div style="font-size:108px;margin-bottom:12px;">✨</div><h1 class="serif">姓名测试</h1></div>
      <div style="background:linear-gradient(135deg,rgba(139,94,90,0.1),rgba(212,197,185,0.3));border:1px solid #E8DED4;border-radius:36px;padding:48px;text-align:center;margin-bottom:30px;">
        <p class="xs muted">测试结果</p>
        <p style="font-size:66px;font-weight:700;margin:12px 0;" class="serif">小明</p>
        <div class="flex" style="justify-content:center;gap:48px;margin-top:24px;">
          <div><p style="font-size:60px;font-weight:700;" class="primary">88</p><p class="xs muted">综合评分</p></div>
          <div style="width:1px;height:84px;background:#E8DED4;"></div>
          <div><p style="font-size:48px;font-weight:700;">水</p><p class="xs muted">五行属性</p></div>
          <div style="width:1px;height:84px;background:#E8DED4;"></div>
          <div><div class="flex" style="gap:12px;"><div style="width:42px;height:42px;border-radius:50%;background:#87CEEB;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.1);"></div><p class="sm" style="font-weight:500;">天空蓝</p></div><p class="xs muted">幸运色</p></div>
        </div>
      </div>
      <div class="card" style="padding:36px;"><div class="flex gap" style="margin-bottom:12px;"><span style="font-size:42px;">🧠</span><h3 class="serif">性格解析</h3></div><p class="xs muted">你感性细腻，善于察觉他人情绪，富有同理心。内心世界丰富，适合从事创意类工作。</p></div>
      <div class="card" style="padding:36px;"><div class="flex gap" style="margin-bottom:12px;"><span style="font-size:42px;">🍀</span><h3 class="serif">近期运势</h3></div><p class="xs muted">近期运势上升，适合尝试新事物。把握机会，你会有意想不到的收获。</p></div>
      <div class="card" style="padding:36px;"><div class="flex gap" style="margin-bottom:12px;"><span style="font-size:42px;">💕</span><h3 class="serif">感情分析</h3></div><p class="xs muted">你在感情中真诚坦率，容易吸引同样真诚的人。注意给对方适当的空间。</p></div>
      <div class="label"><h2 class="serif">姓名测试</h2><p>性格、运势、感情、事业全面解读</p></div>
    </div>
  `),

  'phone-5-calendar': wrap(`
    <div class="statusbar">9:41</div>
    <div class="page">
      <h1 class="serif" style="margin-bottom:42px;">情绪日历</h1>
      <div class="card" style="padding:48px;">
        <div class="flex" style="justify-content:space-between;margin-bottom:36px;"><span class="sm primary">←</span><h2 class="serif" style="font-size:42px;">2026年5月</h2><span class="sm primary">→</span></div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:12px;text-align:center;">
          <span class="xs muted" style="font-weight:500;">日</span><span class="xs muted" style="font-weight:500;">一</span><span class="xs muted" style="font-weight:500;">二</span><span class="xs muted" style="font-weight:500;">三</span><span class="xs muted" style="font-weight:500;">四</span><span class="xs muted" style="font-weight:500;">五</span><span class="xs muted" style="font-weight:500;">六</span>
          <span></span><span></span><span></span><span></span><span class="xs" style="padding:18px 0;">1</span><span class="xs" style="padding:18px 0;">2</span><span class="xs" style="padding:18px 0;">3</span>
          <span class="xs" style="padding:18px 0;">4</span>
          <span class="xs" style="padding:18px 0;background:#60A5FA;color:white;border-radius:12px;">5</span>
          <span class="xs" style="padding:18px 0;background:#F87171;color:white;border-radius:12px;">6</span>
          <span class="xs" style="padding:18px 0;background:#34D399;color:white;border-radius:12px;">7</span>
          <span class="xs" style="padding:18px 0;background:#818CF8;color:white;border-radius:12px;">8</span>
          <span class="xs" style="padding:18px 0;background:#A78BFA;color:white;border-radius:12px;">9</span>
          <span class="xs" style="padding:18px 0;background:#FBBF24;color:white;border-radius:12px;">10</span>
          <span class="xs" style="padding:18px 0;background:#60A5FA;color:white;border-radius:12px;">11</span>
          <span class="xs" style="padding:18px 0;background:#34D399;color:white;border-radius:12px;">12</span>
          <span class="xs" style="padding:18px 0;border:2px solid #8B5E5A;border-radius:12px;" class="primary">13</span>
          <span class="xs" style="padding:18px 0;">14</span><span class="xs" style="padding:18px 0;">15</span><span class="xs" style="padding:18px 0;">16</span><span class="xs" style="padding:18px 0;">17</span>
          <span class="xs" style="padding:18px 0;">18</span><span class="xs" style="padding:18px 0;">19</span><span class="xs" style="padding:18px 0;">20</span><span class="xs" style="padding:18px 0;">21</span><span class="xs" style="padding:18px 0;">22</span><span class="xs" style="padding:18px 0;">23</span><span class="xs" style="padding:18px 0;">24</span>
          <span class="xs" style="padding:18px 0;">25</span><span class="xs" style="padding:18px 0;">26</span><span class="xs" style="padding:18px 0;">27</span><span class="xs" style="padding:18px 0;">28</span><span class="xs" style="padding:18px 0;">29</span><span class="xs" style="padding:18px 0;">30</span><span class="xs" style="padding:18px 0;">31</span>
        </div>
        <div class="flex" style="justify-content:center;gap:24px;margin-top:36px;flex-wrap:wrap;">
          <div class="flex" style="gap:9px;"><div style="width:24px;height:24px;border-radius:50%;background:#60A5FA;"></div><span class="xs">想念</span></div>
          <div class="flex" style="gap:9px;"><div style="width:24px;height:24px;border-radius:50%;background:#F87171;"></div><span class="xs">痛苦</span></div>
          <div class="flex" style="gap:9px;"><div style="width:24px;height:24px;border-radius:50%;background:#34D399;"></div><span class="xs">释怀</span></div>
          <div class="flex" style="gap:9px;"><div style="width:24px;height:24px;border-radius:50%;background:#818CF8;"></div><span class="xs">平静</span></div>
          <div class="flex" style="gap:9px;"><div style="width:24px;height:24px;border-radius:50%;background:#A78BFA;"></div><span class="xs">感恩</span></div>
          <div class="flex" style="gap:9px;"><div style="width:24px;height:24px;border-radius:50%;background:#FBBF24;"></div><span class="xs">后悔</span></div>
        </div>
      </div>
      <div class="label"><h2 class="serif">情绪日历</h2><p>用颜色记录每天的心情变化</p></div>
    </div>
  `),
};

for (const [name, html] of Object.entries(pages)) {
  const htmlPath = path.join(OUT, `${name}.html`);
  const pngPath = path.join(OUT, `${name}.png`);
  fs.writeFileSync(htmlPath, html, 'utf-8');
  const url = `file:///${htmlPath.replace(/\\/g, '/')}`;
  try {
    execSync(`"${CHROME}" --headless --disable-gpu --screenshot="${pngPath}" --window-size=${W},${H} --hide-scrollbars --force-device-scale-factor=1 "${url}"`, { timeout: 15000 });
    const kb = Math.round(fs.statSync(pngPath).size / 1024);
    console.log(`OK: ${name}.png (${kb} KB)`);
  } catch (e) {
    console.error(`FAIL: ${name}`);
  }
}
console.log('Done!');
