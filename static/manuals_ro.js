// static/manuals_ro.js
(function(){
  function fileName(path){
    const s = String(path || "");
    return s.split("/").pop() || "";
  }

  function extOf(path){
    const name = fileName(path);
    const i = name.lastIndexOf(".");
    return i >= 0 ? name.slice(i+1).toLowerCase() : "";
  }

  function hay(m){
    return [
      m.title,
      m.year,
      ...(m.tags||[]),
      fileName(m.file)
    ].join(" ").toLowerCase();
  }

  function labelFor(file){
    const ext = extOf(file);
    if (ext === "pdf") return "PDF 열기";
    return "파일 열기";
  }

  function render(wrap, list){
    if (!list.length) {
      wrap.innerHTML = `<div class="muted">자료 목록이 없습니다. (data/store.json의 manuals.list 수정)</div>`;
      return;
    }

    wrap.innerHTML = list.map(m => {
      const file = m.file || "#";
      const tags = (m.tags||[]).join(", ");
      const fname = fileName(file);
      const btn = labelFor(file);

      return `
        <div class="card">
          <div class="row between wrap">
            <div style="min-width:260px;">
              <div style="font-weight:900;">${App.escapeHtml(m.title || "")}</div>
              <div class="muted">
                ${App.escapeHtml(m.year || "")}
                ${tags ? ` · ${App.escapeHtml(tags)}` : ""}
                ${fname ? ` · ${App.escapeHtml(fname)}` : ""}
              </div>
            </div>
            <div class="row right wrap">
              <a class="btn" href="${file}" target="_blank" rel="noopener">${btn}</a>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  window.ManualsRO = {
    async init(){
      const store = await App.getStore();
      const all = App.getByPath(store, "manuals.list", []);
      const q = document.getElementById("manualQ");
      const wrap = document.getElementById("manualList");

      render(wrap, all);

      q.addEventListener("input", () => {
        const qq = q.value.trim().toLowerCase();
        const filtered = all.filter(m => !qq || hay(m).includes(qq));
        render(wrap, filtered);
      });
    }
  };
})();
