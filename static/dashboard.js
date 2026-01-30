
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
    async init(){
      const store = await App.getStore();

      // 메타
      const meta = App.getByPath(store, "meta", {});
      const metaEl = document.getElementById("metaInfo");
      if (metaEl) {
        metaEl.innerHTML = `
          <span class="pill">version: ${App.escapeHtml(meta.version ?? "")}</span>
          <span class="pill">updated_at: ${App.escapeHtml(meta.updated_at ?? "")}</span>
        `;
      }

      // 오늘 일정 3건
      const today = App.todayStr();
      const events = App.getByPath(store, "calendar.events", []);
      const todayEvents = events
        .filter(e => e.date === today)
        .sort((a,b) => String(a.time||"").localeCompare(String(b.time||"")))
        .slice(0, 3);

      renderCards(
        document.getElementById("todayList"),
        todayEvents,
        "오늘 등록된 일정이 없습니다. (GitHub에서 data/store.json의 calendar.events 수정)",
        (e) => `
          <div class="card">
            <div><b>${App.escapeHtml(e.time || "종일")}</b> ${App.escapeHtml(e.title || "")}</div>
            ${e.memo ? `<div class="muted" style="margin-top:6px;">${App.escapeHtml(e.memo)}</div>` : ""}
          </div>
        `
      );

      // 결재권자 복무상황
      const approvers = App.getByPath(store, "approvers.status", []);
      renderCards(
        document.getElementById("approverList"),
        approvers,
        "등록된 결재권자 정보가 없습니다. (data/store.json의 approvers.status 수정)",
        (x) => `
          <div class="card">
            <div class="row between wrap">
              <div style="min-width:260px;">
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
            </div>
          </div>
        `
      );

      // 즐겨찾기 6건
      const favs = App.getByPath(store, "favorites.items", []).slice(0, 6);
      renderCards(
        document.getElementById("favList"),
        favs,
        "등록된 즐겨찾기가 없습니다. (data/store.json의 favorites.items 수정)",
        (x) => `
          <div class="card">
            <div class="row between wrap">
              <div style="min-width:260px;">
                <div style="font-weight:900;">${App.escapeHtml(x.name || "")}</div>
                <div class="muted">${App.escapeHtml(x.url || "")}</div>
                ${x.memo ? `<div class="muted" style="margin-top:6px;">${App.escapeHtml(x.memo)}</div>` : ""}
              </div>
              <div class="row right wrap">
                <a class="btn" href="${x.url}" target="_blank" rel="noopener">열기</a>
              </div>
            </div>
          </div>
        `
      );

      // 편람 빠른검색(상위 5) - 초기 렌더
      const manuals = App.getByPath(store, "manuals.list", []);
      const miniWrap = document.getElementById("manualMiniList");
      const q = document.getElementById("manualMiniQ");

      function renderManuals(query){
        const qq = String(query||"").trim().toLowerCase();
        const filtered = manuals.filter(m => {
          const hay = [m.title, m.year, ...(m.tags||[])].join(" ").toLowerCase();
          return !qq || hay.includes(qq);
        }).slice(0,5);

        renderCards(
          miniWrap,
          filtered,
          "편람 목록이 없습니다. (data/store.json의 manuals.list 수정)",
          (m) => `
            <div class="card">
              <div class="row between wrap">
                <div style="min-width:260px;">
                  <div style="font-weight:900;">${App.escapeHtml(m.title || "")}</div>
                  <div class="muted">${App.escapeHtml(m.year || "")} ${App.escapeHtml((m.tags||[]).join(", "))}</div>
                </div>
                <div class="row right wrap">
                  <a class="btn" href="${m.file}" target="_blank" rel="noopener">PDF 열기</a>
                </div>
              </div>
            </div>
          `
        );
      }

      renderManuals("");
      if (q) q.addEventListener("input", () => renderManuals(q.value));
    }
  };
})();
