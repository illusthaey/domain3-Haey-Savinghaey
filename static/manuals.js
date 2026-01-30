
// static/manuals.js
(function(){
  async function loadManuals(){
    const res = await fetch("/data/manuals.json", { cache: "no-store" });
    if (!res.ok) throw new Error("manuals.json 로드 실패");
    return await res.json();
  }

  function toHay(x){
    return [
      x.title || "",
      x.year || "",
      ...(x.tags || [])
    ].join(" ").toLowerCase();
  }

  function renderList(list, q, wrapId, limit){
    const wrap = document.getElementById(wrapId);
    const query = (q || "").trim().toLowerCase();

    let filtered = list;
    if (query) filtered = list.filter(x => toHay(x).includes(query));

    if (typeof limit === "number") filtered = filtered.slice(0, limit);

    if (!filtered.length) {
      wrap.innerHTML = `<div class="muted">검색 결과가 없습니다.</div>`;
      return;
    }

    wrap.innerHTML = filtered.map(x=>`
      <div class="card">
        <div class="row between wrap">
          <div style="min-width:240px;">
            <div style="font-weight:900;">${App.escapeHtml(x.title || "")}</div>
            <div class="muted">${App.escapeHtml(x.year || "")} ${App.escapeHtml((x.tags||[]).join(", "))}</div>
          </div>
          <div class="row wrap right">
            <a class="btn btn-lightgrey small" href="${x.file}" target="_blank" rel="noopener">PDF 열기</a>
          </div>
        </div>
      </div>
    `).join("");
  }

  window.Manuals = {
    async init(){
      const list = await loadManuals();
      const input = document.getElementById("manualQ");
      renderList(list, "", "manualList");
      input.addEventListener("input", ()=> renderList(list, input.value, "manualList"));
    },

    async initMini(){
      const list = await loadManuals();
      const input = document.getElementById("manualQMini");
      renderList(list, "", "manualListMini", 5);
      input.addEventListener("input", ()=> renderList(list, input.value, "manualListMini", 5));
    }
  };
})();
