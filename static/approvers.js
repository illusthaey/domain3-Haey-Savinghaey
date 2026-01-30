
// static/approvers.js
(function(){
  const KEY = "approvers.status";
  // 모델: { name, role, status, until, note }
  // status: "재실" | "출장" | "연가" | "병가" | "교육" | "기타"

  const STATUS = ["재실", "출장", "연가", "병가", "교육", "기타"];

  function load(){
    const v = App.load(KEY, null);
    if (v && Array.isArray(v)) return v;
    // 초기 기본값(필요시 수정해서 쓰면 됨)
    return [
      { name: "교장", role: "최종 결재", status: "재실", until: "", note: "" },
      { name: "교감", role: "중간 결재", status: "재실", until: "", note: "" },
      { name: "행정실장", role: "예산/회계 결재", status: "재실", until: "", note: "" },
    ];
  }

  function save(v){ App.save(KEY, v); }

  function badge(status){
    return `<span class="pill">${App.escapeHtml(status)}</span>`;
  }

  function render(){
    const wrap = document.getElementById("approverList");
    const list = load();

    wrap.innerHTML = list.map((x, i)=>`
      <div class="card">
        <div class="row between wrap">
          <div style="min-width:260px;">
            <div style="font-weight:900;">${App.escapeHtml(x.name)} <span class="muted" style="font-weight:600;">(${App.escapeHtml(x.role || "")})</span></div>
            <div class="muted" style="margin-top:6px;">
              상태: ${badge(x.status || "재실")}
              ${x.until ? ` · 복귀예정: <b>${App.escapeHtml(x.until)}</b>` : ""}
            </div>
            ${x.note ? `<div class="muted" style="margin-top:6px;">비고: ${App.escapeHtml(x.note)}</div>` : ""}
          </div>

          <div class="row wrap right">
            <button class="btn btn-lightgrey small" data-act="edit" data-idx="${i}">수정</button>
            <button class="btn btn-lightgrey small" data-act="del" data-idx="${i}">삭제</button>
          </div>
        </div>
      </div>
    `).join("");

    wrap.querySelectorAll("button[data-act]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const act = btn.dataset.act;
        const idx = Number(btn.dataset.idx);
        if (act === "del") {
          const next = load().filter((_,i)=>i!==idx);
          save(next);
          render();
        }
        if (act === "edit") openModal(idx);
      });
    });
  }

  function fillStatusOptions(sel, value){
    sel.innerHTML = STATUS.map(s => `<option value="${s}">${s}</option>`).join("");
    sel.value = STATUS.includes(value) ? value : "재실";
  }

  function openModal(idx){
    const modal = document.getElementById("apModal");
    const list = load();
    const row = (typeof idx === "number") ? list[idx] : { name:"", role:"", status:"재실", until:"", note:"" };

    document.getElementById("apIdx").value = (typeof idx === "number") ? String(idx) : "";
    document.getElementById("apName").value = row.name || "";
    document.getElementById("apRole").value = row.role || "";
    fillStatusOptions(document.getElementById("apStatus"), row.status || "재실");
    document.getElementById("apUntil").value = row.until || "";
    document.getElementById("apNote").value = row.note || "";

    modal.style.display = "block";
  }

  function closeModal(){
    document.getElementById("apModal").style.display = "none";
  }

  window.Approvers = {
    init(){
      // modal events
      document.getElementById("apClose").onclick = closeModal;
      document.getElementById("apBackdrop").onclick = closeModal;

      document.getElementById("apNew").onclick = ()=> openModal(null);

      document.getElementById("apSave").onclick = ()=>{
        const idxRaw = document.getElementById("apIdx").value;
        const name = document.getElementById("apName").value.trim();
        const role = document.getElementById("apRole").value.trim();
        const status = document.getElementById("apStatus").value;
        const until = document.getElementById("apUntil").value.trim();
        const note = document.getElementById("apNote").value.trim();

        if (!name) { alert("결재권자(명칭)는 필수입니다."); return; }

        const list = load();
        const row = { name, role, status, until, note };

        if (idxRaw !== "") list[Number(idxRaw)] = row;
        else list.push(row);

        save(list);
        closeModal();
        render();
      };

      render();
    },

    // 대시보드 미니표시(최대 n명)
    renderMini(limit=6){
      const wrap = document.getElementById("approverList");
      const list = load().slice(0, limit);
      if (!list.length) {
        wrap.innerHTML = `<div class="muted">등록된 결재권자 정보가 없습니다.</div>`;
        return;
      }
      // 미니에서도 수정/삭제 가능하게 동일 렌더 사용(운영상 편리)
      render();
    }
  };
})();
