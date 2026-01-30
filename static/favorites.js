
// static/favorites.js
(function(){
  const KEY = "favorites.items";

  function load(){ return App.load(KEY, []); }
  function save(v){ App.save(KEY, v); }

  function render(limit){
    const list = load();
    const wrap = document.getElementById("favList");
    const slice = (typeof limit === "number") ? list.slice(0, limit) : list;

    if (!slice.length) {
      wrap.innerHTML = `<div class="muted">등록된 즐겨찾기가 없습니다.</div>`;
      return;
    }

    wrap.innerHTML = slice.map((x, i) => `
      <div class="card">
        <div class="row between wrap">
          <div style="min-width:240px;">
            <div style="font-weight:900;">${App.escapeHtml(x.name)}</div>
            <div class="muted">${App.escapeHtml(x.url)}</div>
          </div>
          <div class="row wrap right">
            <a class="btn btn-lightgrey small" href="${x.url}" target="_blank" rel="noopener">열기</a>
            ${typeof limit === "number" ? "" : `<button class="btn btn-lightgrey small" data-del="${i}">삭제</button>`}
          </div>
        </div>
        ${x.memo ? `<div class="muted" style="margin-top:6px;">${App.escapeHtml(x.memo)}</div>` : ""}
      </div>
    `).join("");

    if (typeof limit !== "number") {
      wrap.querySelectorAll("button[data-del]").forEach(btn=>{
        btn.addEventListener("click", ()=>{
          const idx = Number(btn.dataset.del);
          const next = load().filter((_,i)=>i!==idx);
          save(next);
          render();
        });
      });
    }
  }

  window.Favorites = {
    init(){
      document.getElementById("favAdd").addEventListener("click", ()=>{
        const name = document.getElementById("favName").value.trim();
        const url = document.getElementById("favUrl").value.trim();
        const memo = document.getElementById("favMemo").value.trim();
        if (!name || !url) { alert("이름과 URL은 필수입니다."); return; }
        const list = load();
        list.unshift({ name, url, memo });
        save(list);
        document.getElementById("favName").value = "";
        document.getElementById("favUrl").value = "";
        document.getElementById("favMemo").value = "";
        render();
      });
      render();
    },

    renderMini(limit=6){
      render(limit);
    }
  };
})();
