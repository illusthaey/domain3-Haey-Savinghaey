
// static/calendar.js
(function(){
  const KEY = "calendar.events";

  function uid() {
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
  }
  function pad(n){ return String(n).padStart(2,"0"); }
  function ymd(d){ return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }

  function parseYmd(s){
    const [y,m,d] = s.split("-").map(Number);
    return new Date(y, m-1, d);
  }

  function startOfWeek(date){ // 월요일 시작
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = d.getDay(); // 0=일
    const diff = (day === 0 ? -6 : 1 - day);
    d.setDate(d.getDate() + diff);
    return d;
  }

  function load(){ return App.load(KEY, []); }
  function save(v){ App.save(KEY, v); }

  function upsert(ev){
    const list = load();
    const idx = list.findIndex(x => x.id === ev.id);
    if (idx >= 0) list[idx] = ev; else list.push(ev);
    save(list);
  }
  function remove(id){
    const list = load().filter(x => x.id !== id);
    save(list);
  }

  function renderDayList(container, dates){
    const events = load();
    const byDate = new Map();
    for (const d of dates) byDate.set(d, []);
    for (const e of events) if (byDate.has(e.date)) byDate.get(e.date).push(e);

    const html = dates.map(d => {
      const items = (byDate.get(d) || [])
        .sort((a,b)=> (a.time||"").localeCompare(b.time||""))
        .map(e => `
          <div class="card">
            <div class="row between wrap">
              <div><b>${App.escapeHtml(e.time || "종일")}</b> ${App.escapeHtml(e.title)}</div>
              <div class="row">
                <button class="btn btn-lightgrey small" data-act="edit" data-id="${e.id}">수정</button>
                <button class="btn btn-lightgrey small" data-act="del" data-id="${e.id}">삭제</button>
              </div>
            </div>
            ${e.memo ? `<div class="muted" style="margin-top:6px;">${App.escapeHtml(e.memo)}</div>` : ""}
          </div>
        `).join("");

      return `
        <div class="section">
          <h3 class="local-h3">${d}</h3>
          ${items || `<div class="muted">등록된 일정이 없습니다.</div>`}
        </div>
      `;
    }).join("");

    container.innerHTML = html;

    container.querySelectorAll("button[data-act]").forEach(btn => {
      btn.addEventListener("click", () => {
        const act = btn.dataset.act;
        const id = btn.dataset.id;
        if (act === "del") {
          remove(id);
          window.Calendar.render();
        } else if (act === "edit") {
          window.Calendar.openEdit(id);
        }
      });
    });
  }

  function renderMonthGrid(container, focusDateStr){
    const focus = focusDateStr ? parseYmd(focusDateStr) : new Date();
    const y = focus.getFullYear();
    const m = focus.getMonth();

    const first = new Date(y, m, 1);
    const last = new Date(y, m+1, 0);

    const gridStart = startOfWeek(first);
    const gridEnd = new Date(startOfWeek(new Date(last.getFullYear(), last.getMonth(), last.getDate()+1)));
    gridEnd.setDate(gridEnd.getDate() + 6);

    const events = load();
    const counts = new Map();
    for (const e of events) counts.set(e.date, (counts.get(e.date) || 0) + 1);

    const days = [];
    for (let d = new Date(gridStart); d <= gridEnd; d.setDate(d.getDate()+1)) {
      const dStr = ymd(d);
      const isCurMonth = d.getMonth() === m;
      const c = counts.get(dStr) || 0;
      days.push({ dStr, isCurMonth, c });
    }

    const header = `
      <div class="row between wrap" style="margin-bottom:10px;">
        <div style="font-weight:900;">${y}년 ${m+1}월</div>
        <div class="row wrap right">
          <button class="btn btn-lightgrey" id="prevM">이전달</button>
          <button class="btn btn-lightgrey" id="nextM">다음달</button>
          <button class="btn primary" id="newEv">일정 추가</button>
        </div>
      </div>
    `;

    const grid = `
      <div class="grid" style="grid-template-columns:repeat(7, minmax(0,1fr)); gap:10px;">
        ${["월","화","수","목","금","토","일"].map(x=>`<div class="muted" style="text-align:center; font-weight:700;">${x}</div>`).join("")}
        ${days.map(x => `
          <div class="card" data-date="${x.dStr}" style="cursor:pointer; opacity:${x.isCurMonth?1:0.55};">
            <div class="row between">
              <div style="font-weight:900;">${x.dStr.split("-")[2]}</div>
              ${x.c ? `<div class="pill">+${x.c}</div>` : `<div class="muted"> </div>`}
            </div>
            <div class="muted" style="margin-top:6px;">${x.dStr}</div>
          </div>
        `).join("")}
      </div>
    `;

    container.innerHTML = header + grid;

    container.querySelectorAll('[data-date]').forEach(el => {
      el.addEventListener("click", ()=>{
        document.getElementById("date").value = el.dataset.date;
        window.Calendar.switchView("3day", el.dataset.date);
      });
    });

    document.getElementById("newEv").onclick = () => window.Calendar.openNew();
    document.getElementById("prevM").onclick = () => {
      const d = new Date(y, m-1, 1);
      window.Calendar.switchView("month", ymd(d));
    };
    document.getElementById("nextM").onclick = () => {
      const d = new Date(y, m+1, 1);
      window.Calendar.switchView("month", ymd(d));
    };
  }

  function openModal(ev){
    const modal = document.getElementById("evModal");
    modal.style.display = "block";
    document.getElementById("evId").value = ev?.id || "";
    document.getElementById("evDate").value = ev?.date || App.todayStr();
    document.getElementById("evTime").value = ev?.time || "";
    document.getElementById("evTitle").value = ev?.title || "";
    document.getElementById("evMemo").value = ev?.memo || "";
  }
  function closeModal(){
    document.getElementById("evModal").style.display = "none";
  }

  window.Calendar = {
    view: "month",
    anchor: null,

    init(){
      document.getElementById("evClose").onclick = closeModal;
      document.getElementById("evBackdrop").onclick = closeModal;
      document.getElementById("evSave").onclick = () => {
        const id = document.getElementById("evId").value || uid();
        const ev = {
          id,
          date: document.getElementById("evDate").value,
          time: (document.getElementById("evTime").value || "").trim(),
          title: (document.getElementById("evTitle").value || "").trim(),
          memo: (document.getElementById("evMemo").value || "").trim(),
        };
        if (!ev.date || !ev.title) {
          alert("날짜와 제목은 필수입니다.");
          return;
        }
        upsert(ev);
        closeModal();
        Calendar.render();
      };

      document.getElementById("btnMonth").onclick = () => Calendar.switchView("month");
      document.getElementById("btnWeek").onclick = () => Calendar.switchView("week");
      document.getElementById("btn3day").onclick = () => Calendar.switchView("3day");
      document.getElementById("btnNew").onclick = () => Calendar.openNew();

      Calendar.render();
    },

    openNew(){ openModal(null); },
    openEdit(id){
      const ev = load().find(x=>x.id===id);
      if (ev) openModal(ev);
    },

    switchView(view, anchorStr){
      Calendar.view = view;
      Calendar.anchor = anchorStr || Calendar.anchor || App.todayStr();
      Calendar.render();
    },

    render(){
      const wrap = document.getElementById("calWrap");
      const v = Calendar.view;
      const anchor = Calendar.anchor || App.todayStr();

      document.getElementById("viewName").textContent =
        v === "month" ? "월간달력" : (v === "week" ? "주간달력" : "어제·오늘·내일(3일)");

      if (v === "month") {
        renderMonthGrid(wrap, anchor);
        return;
      }

      if (v === "week") {
        const base = parseYmd(anchor);
        const s = startOfWeek(base);
        const dates = [];
        for (let i=0;i<7;i++){
          const d = new Date(s); d.setDate(s.getDate()+i);
          dates.push(ymd(d));
        }
        renderDayList(wrap, dates);
        return;
      }

      const base = parseYmd(anchor);
      const y = new Date(base); y.setDate(base.getDate()-1);
      const t = new Date(base);
      const n = new Date(base); n.setDate(base.getDate()+1);
      renderDayList(wrap, [ymd(y), ymd(t), ymd(n)]);
    }
  };
})();
