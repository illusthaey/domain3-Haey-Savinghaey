// static/favorites_ro.js
(function(){
  window.FavoritesRO = {
    async init(){
      const store = await App.getStore();
      const list = App.getByPath(store, "favorites.items", []);
      const wrap = document.getElementById("favList");

      if (!list.length) {
        wrap.innerHTML = `<div class="muted">등록된 즐겨찾기가 없습니다. (data/store.json의 favorites.items 수정)</div>`;
        return;
      }

      wrap.innerHTML = list.map(x => `
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
      `).join("");
    }
  };
})();
