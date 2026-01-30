// static/dashboard.js
(function(){
  function renderCards(container, items, emptyText, renderItem){
    if (!items || !items.length) {
      container.innerHTML = `<div class="muted">${emptyText}</div>`;
      return;
    }
    container.innerHTML = items.map(renderItem).join("");
  }

  window.Dashboard = {
    async initMini(){
      const store = await App.getStore();

      const today = App.todayStr();
      const events = App.getByPath(store, "calendar.events", []);
      const todayEvents = events
        .filter(e => e.date === today)
        .sort((a,b) => String(a.time||"").localeCompare(String(b.time||"")))
        .slice(0, 3);

      renderCards(
        document.getElementById("todayList"),
        todayEvents,
        "오늘 등록된 일정이 없습니다. (GitHub에서 data/store.json 수정)",
        (e) => `
          <div class="card">
            <div><b>${App.escapeHtml(e.time || "종일")}</b> ${App.escapeHtml(e.title || "")}</div>
            ${e.memo ? `<div class="muted" style="margin-top:6px;">${App.escapeHtml(e.memo)}</div>` : ""}
          </div>
        `
      );

      const approvers = App.getByPath(store, "approvers.status", []);
      renderCards(
        document.getElementById("approverList"),
        approvers,
        "등록된 결재권자 정보가 없습니다. (GitHub에서 data/store.json 수정)",
        (x) => `
          <div class="card">
            <div style="font-weight:900;">
              ${App.escapeHtml(x.name || "")}
              <span class="muted" style="font-weight:600;">(${App.escapeHtml(x.role || "")})</span>
            </div>
            <div class="muted" style="margin-top:6px;">
              상태: <span class="pill">${App.escapeHtml(x.status || "")}</span>
              ${x.until ? ` · 복귀예정: <b>${App.escapeHtml(x.until)}</b>` : ""}
            </div>
            ${x.note ? `<div class="muted" style="margin-top:6px;">비고: ${App.escapeHtml(x.note)}</div>` : ""}
          </div>
        `
      );
    }
  };
})();
