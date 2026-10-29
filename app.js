(function(){
// data.js nhóm nội dung theo chủ đề; ở đây trải phẳng ra, gắn số thứ tự nhóm vào từng mục
const CATS = DATA.qa.map(g => g.cat), QA = DATA.qa.flatMap((g,c) => g.items.map(x => ({...x, c})));
const VCATS = DATA.vocab.map(g => g.cat), VOC = DATA.vocab.flatMap((g,c) => g.words.map(v => ({...v, c})));
const PHR = DATA.phrases.flatMap(g => g.items.map(p => ({...p, s:g.sit})));
const $ = (s, r=document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const shuffle = a => { a=a.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
const KEY='qa-interview-v1';
// tiến độ, điểm luyện tập và câu trả lời riêng được lưu theo id câu hỏi (không theo số thứ tự)
let st = { known:[], practice:{}, mine:{} };
try { const r = localStorage.getItem(KEY); if (r) st = Object.assign(st, JSON.parse(r)); } catch(e){}
// bản cũ lưu theo số thứ tự câu hỏi lúc trước khi tách file: đổi sang id một lần
const V1_ORDER = ["yourself", "describe-current-project", "main-responsibilities", "choose-become-qa-engineer", "strengths", "weakness", "want-leave-current-job", "want-work-for-our-company", "where-see-yourself-five-years", "software-testing", "difference-between-qa-qc", "difference-between-verification-validation", "explain-stlc", "difference-between-functional-non-functional", "regression-testing", "difference-between-smoke-testing-sanity", "difference-between-retesting-regression-testing", "difference-between-black-box-white", "explain-boundary-value-analysis-equivalence", "exploratory-testing", "testing-types-done", "write-good-test-case", "difference-between-test-case-test", "test-login-page", "should-good-bug-report-include", "difference-between-severity-priority", "explain-bug-life-cycle", "developer-says-not-a-bug", "bug-cannot-be-reproduced", "decide-test-first-when-time", "automation-tools-used", "which-test-cases-should-be", "locator-which-locators-prefer", "difference-between-implicit-wait-explicit", "page-object-model", "flaky-test-fix-it", "challenges-faced-mobile-automation", "ci-cd-does-testing-fit", "api-testing", "http-methods-status-codes-know", "use-postman-work", "check-network-traffic-logs", "test-analytics-or-tracking-tags", "test-real-time-data", "use-git-work", "role-agile-team", "if-requirements-not-clear", "difficult-bug-found", "if-missed-bug-it-went", "handle-tight-deadline", "work-with-developers", "keep-learning", "any-questions-for-us", "ban-hoi-ve-quy-trinh", "ban-hoi-ve-cong-cu", "ban-hoi-ve-co-hoi", "ban-hoi-ve-buoc-tiep"];
const v1id = k => V1_ORDER[+k] || k;
if (st.v !== 2){
  const m = (o, f) => Object.fromEntries(Object.entries(o).map(([k,v]) => [v1id(k), f ? f(v) : v]));
  st = { v:2, known: st.known.map(v1id), practice: m(st.practice), mine: m(st.mine) };
  try{ localStorage.setItem(KEY, JSON.stringify(st)); }catch(e){}
}
const idOf = i => QA[i].id;
const isKnown = i => st.known.includes(idOf(i));
const mineOf = i => st.mine[idOf(i)];
// câu trả lời riêng của người học (nếu có), nếu không thì dùng câu mẫu
const ansOf = i => mineOf(i) || QA[i];
const save = () => { try{ localStorage.setItem(KEY, JSON.stringify(st)); }catch(e){} meter(); };
function meter(){ const n = QA.filter((x,i) => isKnown(i)).length; $('#meterTxt').textContent = n + ' / ' + QA.length; $('#meterBar').style.width = (n/QA.length*100)+'%'; }
const canSpeak = 'speechSynthesis' in window;
function speak(t){ if(!canSpeak) return; try{ speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(t.replace(/\[X\]/g,'three')); u.lang='en-US'; u.rate=.88; speechSynthesis.speak(u);}catch(e){} }
const ICON = {
  sound:'<svg viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/></svg>',
  check:'<svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>'
};
// làm nổi bật từ vựng chuyên ngành trong câu trả lời
const TERMS = [];
VOC.forEach(v => v.w.split('/').forEach(p => { p = p.replace(/\(.*?\)/g,'').trim(); if (p.length>3) TERMS.push(p); }));
TERMS.sort((a,b)=>b.length-a.length);
const termRe = new RegExp('\\b(' + TERMS.map(t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|') + ')s?\\b', 'gi');
const hl = s => esc(s).replace(termRe, m => '<mark>'+m+'</mark>').replace(/\[X\]/g,'<mark>[X]</mark>');

// ---------- router ----------
const VIEWS=['cau-hoi','luyen-noi','tu-vung','meo'];
function route(){
  let v = location.hash.replace('#',''); if(!VIEWS.includes(v)) v='cau-hoi';
  VIEWS.forEach(x => $('#v-'+x).hidden = x!==v);
  document.querySelectorAll('nav.tabs a').forEach(a => { if(a.dataset.v===v) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });
  ({'cau-hoi':renderQA,'luyen-noi':renderPractice,'tu-vung':renderVocab,'meo':renderTips})[v]();
  window.scrollTo(0,0);
}
window.addEventListener('hashchange', route);

// ---------- CÂU HỎI ----------
let qaCat = -1, qaSearch = '', showAll = false;
const qaOpen = new Set();
function renderQA(){
  const el = $('#v-cau-hoi');
  const nMine = QA.filter((x,i) => mineOf(i)).length;
  el.innerHTML = `<h2>${QA.length} câu hỏi phỏng vấn QA</h2>
  <p class="lead">Câu trả lời mẫu dùng câu ngắn, từ đơn giản. Thay phần <mark style="background:var(--gold-soft);color:inherit">[X]</mark> bằng số liệu thật. Từ vựng chuyên ngành được tô màu. Bấm <b>“Viết câu của bạn”</b> để sửa câu mẫu theo kinh nghiệm của chính bạn.</p>
  <div class="mybar"><span>${nMine?`Bạn đã viết riêng <b>${nMine}</b> câu trả lời.`:'Chưa có câu trả lời riêng.'} Câu trả lời riêng chỉ lưu trên trình duyệt này.</span><span><button class="small ghost" id="myExport" ${nMine?'':'disabled'}>Sao lưu ra file</button><button class="small ghost" id="myImport">Khôi phục từ file</button><input type="file" id="myFile" accept=".json,application/json" hidden></span></div>
  <div class="chips" role="group" aria-label="Nhóm câu hỏi"><button data-c="-1" aria-pressed="${qaCat===-1}">Tất cả</button>${CATS.map((c,i)=>`<button data-c="${i}" aria-pressed="${qaCat===i}">${esc(c)}</button>`).join('')}</div>
  <div class="toolbar"><input type="text" id="qs" class="search" placeholder="Tìm câu hỏi, ví dụ: bug, API, yourself" value="${esc(qaSearch)}" aria-label="Tìm câu hỏi"><button class="small" id="tgAll">${showAll?'Ẩn':'Hiện'} tất cả câu trả lời</button></div>
  <ol class="qa" id="qaList"></ol>`;
  el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { qaCat=+b.dataset.c; renderQA(); });
  $('#qs').oninput = e => { qaSearch = e.target.value; list(); };
  $('#tgAll').onclick = () => { showAll=!showAll; qaOpen.clear(); renderQA(); };
  $('#myExport').onclick = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify({mine:st.mine}, null, 1)], {type:'application/json'}));
    a.download = 'cau-tra-loi-cua-toi.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  $('#myImport').onclick = () => $('#myFile').click();
  $('#myFile').onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    f.text().then(t => {
      const m = JSON.parse(t).mine; let n = 0;
      Object.keys(m||{}).forEach(k => { const v = m[k], id = /^\d+$/.test(k) ? v1id(k) : k; if (QA.some(x => x.id===id) && v && typeof v.a==='string' && v.a.trim()){ st.mine[id] = {a:v.a, av:typeof v.av==='string'?v.av:''}; n++; } });
      save(); renderQA(); alert(n ? `Đã khôi phục ${n} câu trả lời.` : 'File không có câu trả lời nào.');
    }).catch(() => alert('Không đọc được file. Hãy chọn file đã sao lưu từ trang này.'));
  };
  list();
  function list(){
    const q = qaSearch.trim().toLowerCase();
    const items = QA.map((x,i)=>[x,i]).filter(([x,i]) => (qaCat<0 || x.c===qaCat) && (!q || (x.q+x.qv+x.a+x.av+(mineOf(i)?mineOf(i).a+mineOf(i).av:'')).toLowerCase().includes(q)));
    const ul = $('#qaList');
    if (!items.length){ ul.innerHTML = '<li style="display:block" class="muted">Không có câu hỏi nào khớp. Thử từ khóa khác.</li>'; return; }
    ul.innerHTML = items.map(([x,i]) => {
      const known = isKnown(i), my = mineOf(i), A = my || x, open = showAll || qaOpen.has(i);
      return `<li data-i="${i}"><div class="qtxt">${qaCat<0?`<span class="cat">${esc(CATS[x.c])}</span>`:''}${my?'<span class="cat mine">Câu của bạn</span>':''}<div class="qen">${esc(x.q)}</div><div class="qvi">${esc(x.qv)}</div></div>
      <div class="acts">${canSpeak && !x.q.startsWith('(')?`<button class="icon" data-say="q" aria-label="Nghe câu hỏi">${ICON.sound}</button>`:''}<button class="small" data-open aria-expanded="${open}">${open?'Ẩn':'Trả lời'}</button></div>
      <div class="ans" ${open?'':'hidden'}><div data-view>${my?'<p class="label" style="margin:0 0 6px">Câu trả lời của bạn</p>':''}<div class="aen">${hl(A.a)}</div>${A.av?`<div class="avi">${esc(A.av)}</div>`:''}
      ${my?`<details class="sample"><summary>Xem câu trả lời mẫu</summary><div class="aen">${hl(x.a)}</div><div class="avi">${esc(x.av)}</div></details>`:''}${x.t?`<div class="tip"><b>Mẹo:</b> ${esc(x.t)}</div>`:''}
      <div class="row">${canSpeak?`<button class="small" data-say="a">Nghe câu trả lời</button>`:''}<button class="small ${known?'':'primary'}" data-known>${known?'Đã thuộc ✓':'Đánh dấu đã thuộc'}</button><button class="small ghost" data-edit>${my?'Sửa câu của bạn':'Viết câu của bạn'}</button></div></div>
      <div class="myedit" data-form hidden><label>Câu trả lời tiếng Anh của bạn<textarea data-en rows="6"></textarea></label><label>Nghĩa tiếng Việt <span class="muted">(không bắt buộc)</span><textarea data-vi rows="4"></textarea></label>
      <div class="row"><button class="small primary" data-save>Lưu</button><button class="small" data-cancel>Hủy</button>${my?'<button class="small ghost" data-reset>Dùng lại câu mẫu</button>':''}</div></div></div></li>`;
    }).join('');
    ul.querySelectorAll('li[data-i]').forEach(li => {
      const x = QA[+li.dataset.i], i = +li.dataset.i;
      const o = li.querySelector('[data-open]');
      o.onclick = () => { const a = li.querySelector('.ans'); a.hidden = !a.hidden; a.hidden ? qaOpen.delete(i) : qaOpen.add(i); o.textContent = a.hidden?'Trả lời':'Ẩn'; o.setAttribute('aria-expanded', !a.hidden); };
      li.querySelectorAll('[data-say]').forEach(b => b.onclick = () => speak(b.dataset.say==='q'?x.q:ansOf(i).a));
      const k = li.querySelector('[data-known]');
      k.onclick = () => { const on = isKnown(i); st.known = on ? st.known.filter(y=>y!==idOf(i)) : st.known.concat(idOf(i)); save(); k.textContent = on?'Đánh dấu đã thuộc':'Đã thuộc ✓'; k.classList.toggle('primary', on); };
      const view = li.querySelector('[data-view]'), form = li.querySelector('[data-form]');
      const en = form.querySelector('[data-en]'), vi = form.querySelector('[data-vi]');
      li.querySelector('[data-edit]').onclick = () => { en.value = ansOf(i).a; vi.value = ansOf(i).av || ''; view.hidden = true; form.hidden = false; en.focus(); };
      form.querySelector('[data-cancel]').onclick = () => { form.hidden = true; view.hidden = false; };
      const done = () => { save(); qaOpen.add(i); renderQA(); };
      form.querySelector('[data-save]').onclick = () => {
        const a = en.value.trim(), av = vi.value.trim();
        if (!a || (a===x.a && av===x.av)) delete st.mine[idOf(i)]; else st.mine[idOf(i)] = {a, av};
        done();
      };
      const r = form.querySelector('[data-reset]');
      if (r) r.onclick = () => { if (confirm('Xóa câu của bạn và dùng lại câu trả lời mẫu?')){ delete st.mine[idOf(i)]; done(); } };
    });
  }
}

// ---------- LUYỆN TRẢ LỜI ----------
let P = null, pScope = 'all', pSec = 60;
function renderPractice(){
  const el = $('#v-luyen-noi');
  el.innerHTML = `<h2>Luyện trả lời như phỏng vấn thật</h2>
  <p class="lead">App đọc câu hỏi bằng tiếng Anh. Bạn trả lời to trong thời gian quy định, sau đó so với câu trả lời mẫu (hoặc câu bạn đã tự viết) và tự chấm. Câu chấm “Cần luyện thêm” sẽ được hỏi lại nhiều hơn.</p>
  <div class="setup">
    <label for="pScope">Câu hỏi<select id="pScope"><option value="all">Tất cả nhóm</option><option value="weak">Câu cần luyện thêm</option><option value="new">Câu chưa thuộc</option>${CATS.map((c,i)=>`<option value="c${i}">${esc(c)}</option>`).join('')}</select></label>
    <label for="pSec">Thời gian trả lời<select id="pSec"><option value="45">45 giây</option><option value="60">60 giây</option><option value="90">90 giây</option></select></label>
    <label for="pHideVi" style="flex-direction:row;align-items:center;gap:8px;align-self:end;padding-bottom:10px"><input type="checkbox" id="pHideVi" checked> Ẩn nghĩa tiếng Việt của câu hỏi</label>
    <div class="go"><button class="primary" id="pStart">Bắt đầu</button></div>
  </div><div id="pArea"></div>`;
  $('#pScope').value = pScope; $('#pSec').value = String(pSec);
  $('#pStart').onclick = start;
  if (P) showP(); else $('#pArea').innerHTML = `<div class="qbox"><p class="label">Ví dụ câu hỏi</p><p class="prompt">${esc(QA[0].q)}</p><p class="muted" style="margin:0">Bấm “Bắt đầu” để luyện 10 câu hỏi ngẫu nhiên.</p></div>`;
  function start(){
    pScope = $('#pScope').value; pSec = +$('#pSec').value;
    let pool = QA.map((x,i)=>i).filter(i => !QA[i].q.startsWith('('));
    if (pScope==='weak') pool = pool.filter(i => st.practice[idOf(i)]==='bad');
    else if (pScope==='new') pool = pool.filter(i => !isKnown(i));
    else if (pScope[0]==='c') pool = pool.filter(i => QA[i].c===+pScope.slice(1));
    if (!pool.length){ $('#pArea').innerHTML = `<div class="qbox"><p class="muted" style="margin:0">${pScope==='weak'?'Chưa có câu nào bị chấm “Cần luyện thêm”.':'Bạn đã thuộc hết câu trong nhóm này.'} Hãy chọn nhóm khác.</p></div>`; return; }
    const weighted = shuffle(pool).sort((a,b)=>(st.practice[idOf(b)]==='bad')-(st.practice[idOf(a)]==='bad'));
    P = { items: shuffle(weighted.slice(0,10)), i:0, good:0, hideVi: $('#pHideVi').checked };
    showP();
  }
}
function showP(){
  const area = $('#pArea'); if (P.timer) clearInterval(P.timer);
  if (P.i >= P.items.length){
    area.innerHTML = `<div class="qbox result"><p class="label">Hoàn thành</p><div class="big">${P.good}/${P.items.length}</div><p>câu bạn trả lời tốt. ${P.good<P.items.length?'Chọn “Câu cần luyện thêm” để ôn lại những câu còn yếu.':'Rất tốt, bạn đã sẵn sàng!'}</p><div class="qfoot" style="justify-content:center"><button class="primary" id="pAgain">Luyện tiếp</button></div></div>`;
    $('#pAgain').onclick = () => { P=null; $('#pStart').click(); };
    return;
  }
  const i = P.items[P.i], x = QA[i];
  area.innerHTML = `<div class="qbox" style="max-width:720px"><div class="qhead"><span>Câu ${P.i+1}/${P.items.length} · ${esc(CATS[x.c])}</span><span>Tốt ${P.good}</span></div>
    <p class="label">Interviewer</p><p class="prompt">${esc(x.q)}</p><p class="hint" id="pVi" ${P.hideVi?'hidden':''}>${esc(x.qv)}</p>
    <div class="ptimer"><i id="pBar"></i></div><div class="tlabel" style="max-width:none"><span>Bạn đang trả lời…</span><span id="pTxt">${pSec} giây</span></div>
    <div class="qfoot"><button class="primary" id="pDone">Xem câu trả lời mẫu</button>${canSpeak?'<button class="ghost" id="pSayQ">Nghe lại câu hỏi</button>':''}${P.hideVi?'<button class="ghost" id="pShowVi">Dịch câu hỏi</button>':''}</div>
    <div id="pAns"></div></div>`;
  speak(x.q);
  if (canSpeak) $('#pSayQ').onclick = () => speak(x.q);
  const sv = $('#pShowVi'); if (sv) sv.onclick = () => { $('#pVi').hidden=false; sv.remove(); };
  const t0 = performance.now();
  P.timer = setInterval(() => { const left = Math.max(0, pSec - (performance.now()-t0)/1000); $('#pBar').style.width=(left/pSec*100)+'%'; $('#pTxt').textContent = Math.ceil(left)+' giây'; if(left<=0){ clearInterval(P.timer); reveal(); } }, 200);
  $('#pDone').onclick = reveal;
  function reveal(){
    clearInterval(P.timer); $('#pDone').remove();
    const A = ansOf(i), my = A !== x;
    $('#pAns').innerHTML = `<div class="ans" style="margin-top:14px"><p class="label" style="margin:0 0 6px">${my?'Câu trả lời bạn đã viết':'Câu trả lời mẫu'}</p><div class="aen">${hl(A.a)}</div>${A.av?`<div class="avi">${esc(A.av)}</div>`:''}${x.t?`<div class="tip"><b>Mẹo:</b> ${esc(x.t)}</div>`:''}</div>
      <p class="muted" style="margin:12px 0 6px">Câu trả lời của bạn có đủ ý chính và nói trôi chảy không?</p>
      <div class="qfoot" style="margin-top:0"><button class="primary" id="pGood">Trả lời tốt</button><button id="pBad">Cần luyện thêm</button>${canSpeak?`<button class="ghost" id="pSayA">Nghe ${my?'câu của bạn':'câu mẫu'}</button>`:''}</div>`;
    if (canSpeak) $('#pSayA').onclick = () => speak(A.a);
    $('#pGood').onclick = () => { st.practice[idOf(i)]='good'; P.good++; save(); P.i++; showP(); };
    $('#pBad').onclick = () => { st.practice[idOf(i)]='bad'; save(); P.i++; showP(); };
    $('#pGood').focus({preventScroll:true});
  }
}

// ---------- TỪ VỰNG ----------
let VQ = null;
function renderVocab(){
  const el = $('#v-tu-vung');
  let h = `<h2>${VOC.length} từ vựng QA</h2><p class="lead">Mỗi từ có một câu ví dụ dùng được ngay trong phỏng vấn hoặc khi làm việc. Bài kiểm tra cho câu ví dụ bị che từ, bạn chọn từ đúng.</p>
  <div class="toolbar"><button class="primary" id="vqAll">Kiểm tra 15 từ ngẫu nhiên</button><select id="vqCat" aria-label="Chọn nhóm từ"><option value="-1">hoặc chọn nhóm…</option>${VCATS.map((c,i)=>`<option value="${i}">${esc(c)}</option>`).join('')}</select></div><div id="vqBox"></div>`;
  VCATS.forEach((c,ci) => {
    h += `<h3 style="margin:18px 0 8px">${esc(c)}</h3><div class="vt"><table><thead><tr><th>Từ</th><th>Nghĩa</th><th>Ví dụ</th><th><span class="sr" style="position:absolute;left:-9999px">Nghe</span></th></tr></thead><tbody>`;
    VOC.forEach((v,i) => { if (v.c===ci) h += `<tr><td class="w">${esc(v.w)}</td><td>${esc(v.m)}</td><td class="ex">${esc(v.e)}</td><td class="s">${canSpeak?`<button class="icon" data-vs="${i}" aria-label="Nghe">${ICON.sound}</button>`:''}</td></tr>`; });
    h += `</tbody></table></div>`;
  });
  el.innerHTML = h;
  el.querySelectorAll('[data-vs]').forEach(b => b.onclick = () => { const v=VOC[+b.dataset.vs]; speak(v.w.replace(/\(.*?\)/g,'') + '. ' + v.e); });
  $('#vqAll').onclick = () => vq(shuffle(VOC.map((v,i)=>i)).slice(0,15));
  $('#vqCat').onchange = e => { const c=+e.target.value; if(c>=0) vq(shuffle(VOC.map((v,i)=>i).filter(i=>VOC[i].c===c))); };
}
function blankFor(v){
  const parts = v.w.split('/').map(p=>p.replace(/\(.*?\)/g,'').trim()).filter(Boolean);
  for (const p of parts){ const re = new RegExp('\\b'+p.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(s|ed|es)?\\b','i'); if (re.test(v.e)) return v.e.replace(re, '_____'); }
  return null;
}
function vq(items){ VQ = { items, i:0, score:0 }; showVQ(); $('#vqBox').scrollIntoView({behavior:'smooth',block:'start'}); }
function showVQ(){
  const box = $('#vqBox');
  if (VQ.i >= VQ.items.length){ box.innerHTML = `<div class="qbox result" style="margin-bottom:20px"><p class="label">Kết quả</p><div class="big">${VQ.score}/${VQ.items.length}</div><div class="qfoot" style="justify-content:center"><button class="primary" id="vqAgain">Làm lại</button><button class="ghost" id="vqClose">Đóng</button></div></div>`;
    $('#vqAgain').onclick = () => vq(shuffle(VQ.items)); $('#vqClose').onclick = () => box.innerHTML=''; return; }
  const i = VQ.items[VQ.i], v = VOC[i]; const bl = blankFor(v);
  const others = shuffle(VOC.map((x,j)=>j).filter(j=>j!==i && (VOC[j].c===v.c))).slice(0,3);
  const opts = shuffle([i].concat(others.length<3 ? others.concat(shuffle(VOC.map((x,j)=>j).filter(j=>j!==i&&!others.includes(j))).slice(0,3-others.length)) : others));
  const ask = bl ? `<p class="label">Chọn từ phù hợp cho chỗ trống</p><p class="prompt">${esc(bl)}</p><p class="hint">${esc(v.m)}</p>` : `<p class="label">Từ nào có nghĩa là</p><p class="prompt">“${esc(v.m)}”</p>`;
  box.innerHTML = `<div class="qbox" style="margin-bottom:20px"><div class="qhead"><span>${VQ.i+1}/${VQ.items.length}</span><span>Đúng ${VQ.score}</span></div>${ask}<div class="opts">${opts.map(o=>`<button data-o="${o}">${esc(VOC[o].w)}</button>`).join('')}</div><div id="vqFb"></div></div>`;
  let done=false;
  box.querySelectorAll('[data-o]').forEach(b => b.onclick = () => {
    if (done) return; done=true; const ok = +b.dataset.o===i; if(ok) VQ.score++;
    box.querySelectorAll('[data-o]').forEach(x => { if(+x.dataset.o===i) x.classList.add('right'); else if(x===b) x.classList.add('wrong'); });
    $('#vqFb').innerHTML = `<div class="answer ${ok?'ok':'no'}"><div class="en">${esc(v.e)}</div><div class="muted">${esc(v.w)}: ${esc(v.m)}</div></div><div class="qfoot"><button class="primary" id="vqNext">Tiếp</button>${canSpeak?'<button class="ghost" id="vqSay">Nghe</button>':''}</div>`;
    $('#vqNext').onclick = () => { VQ.i++; showVQ(); }; $('#vqNext').focus({preventScroll:true});
    if (canSpeak) $('#vqSay').onclick = () => speak(v.e);
  });
}

// ---------- MẸO ----------
function renderTips(){
  const el = $('#v-meo');
  let h = `<h2>Mẹo trả lời &amp; câu cứu nguy</h2><p class="lead">Không cần nói tiếng Anh hoàn hảo. Người phỏng vấn QA quan tâm bạn hiểu nghề và giải thích rõ ràng. Câu ngắn, có ví dụ thật là đủ.</p>
  <div class="tips">
    <div class="tipc"><h3>Giới thiệu bản thân trong 1 phút</h3><ol><li><b>Hiện tại:</b> I'm a QA engineer with [X] years of experience.</li><li><b>Kỹ năng:</b> I do manual and automation testing with…</li><li><b>Dự án nổi bật:</b> Recently, I tested…</li><li><b>Mục tiêu:</b> I'm now learning… / I want to grow in…</li></ol></div>
    <div class="tipc"><h3>Kể chuyện theo STAR</h3><ul><li><b>S</b>ituation: In my last project, …</li><li><b>T</b>ask: I needed to …</li><li><b>A</b>ction: So I … (phần dài nhất)</li><li><b>R</b>esult: As a result, …</li></ul><p class="muted" style="margin:8px 0 0;font-size:14px">Dùng cho câu hỏi “Tell me about a time…”, “a difficult bug”, “a conflict”.</p></div>
    <div class="tipc"><h3>Nói đơn giản để không bị vấp</h3><ul><li>Mỗi câu một ý, khoảng 8–15 từ.</li><li>Dùng từ nối: First, Then, Also, Finally, For example.</li><li>Dùng thì quá khứ đơn khi kể dự án đã làm.</li><li>Định nghĩa xong thì đưa ngay một ví dụ.</li><li>Không biết thì nói thật, rồi nói cách bạn sẽ tìm hiểu.</li></ul></div>
  </div><h3 style="margin-bottom:4px">Câu cứu nguy khi phỏng vấn</h3><ul class="phr">`;
  let last='';
  PHR.forEach((p,i) => { if (p.s!==last){ h += `<li style="display:block;border:0;padding:0"><span class="sit">${esc(p.s)}</span></li>`; last=p.s; }
    h += `<li><div><div class="pen">${esc(p.en)}</div><div class="pvi">${esc(p.vi)}</div></div>${canSpeak?`<button class="icon" data-ps="${i}" aria-label="Nghe">${ICON.sound}</button>`:''}</li>`; });
  h += `</ul>`;
  el.innerHTML = h;
  el.querySelectorAll('[data-ps]').forEach(b => b.onclick = () => speak(PHR[+b.dataset.ps].en));
}

meter(); route();
})();
