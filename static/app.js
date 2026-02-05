// static/app.js
// 역할:
// - 메인(index): 타이틀/제작문구만 표시(메뉴바 없음)
// - 상세페이지: 타이틀/제작문구 + 메뉴바 표시
// - data/store.json 읽기(캐시 우회) 유틸 제공

(function () {
  const NAV = [
    { href: "/index.html",        label: "메인으로 돌아가기" },
    { href: "/calendar.html",     label: "업무 일정 달력" },
    { href: "/tools/",            label: "업무 효율화 도구 모음" }, // ✅ /tools.html → /tools/
    { href: "/assist-tools.html", label: "보조 도구 모음" },
    { href: "/manuals.html",      label: "업무 자료 모음" },
    { href: "/favorites.html",    label: "외부 사이트 모음" }
  ];

  function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[m]));
  }

  function pad(n) { return String(n).padStart(2, "0"); }

  function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  // store.json (GitHub에서 수정)
  const STORE_URL = "/data/store.json";

  async function fetchStore() {
    const bust = Date.now(); // 캐시 우회
    const res = await fetch(`${STORE_URL}?v=${bust}`, { cache: "no-store" });
    if (!res.ok) throw new Error("store.json 로드 실패");
    return await res.json();
  }

  // 페이지당 1회만 로드
  const getStore = (function () {
    let memo = null;
    return async function () {
      if (memo) return memo;
      memo = await fetchStore();
      return memo;
    };
  })();

  // "calendar.events" 같은 경로 접근
  function getByPath(obj, path, fallback) {
    try {
      return path.split(".").reduce((acc, k) => acc[k], obj) ?? fallback;
    } catch {
      return fallback;
    }
  }

  function isIndexPage() {
    const p = location.pathname || "/";
    return (p === "/" || p === "/index.html");
  }

  // ✅ 네비 활성화 경로 정규화
  // - "/tools/" → "/tools/"
  // - "/tools/index.html" → "/tools/"
  // - "/tools" → "/tools/"
  // - "/" → "/index.html" (단, index는 네비를 숨김)
  function normalizeForNav(pathname) {
    let p = (pathname || "/").trim();
    if (p === "/") return "/index.html";

    if (p.endsWith("/index.html") && p !== "/index.html") {
      p = p.slice(0, -("index.html".length)); // "/tools/index.html" -> "/tools/"
    }

    if (p !== "/" && !p.endsWith("/") && !p.includes(".")) {
      p = p + "/"; // "/tools" -> "/tools/"
    }

    return p;
  }

  function headerOnlyHTML() {
    return `
      <header class="site-header">
        <div class="shell">
          <div class="header-hero">
            <h1 class="header-title">개인 업무 보조 웹페이지</h1>
            <div class="header-byline">제작·운영: 천재 고주무관</div>
          </div>
        </div>
      </header>
    `;
  }

  function headerWithNavHTML(activePath) {
    const items = NAV.map(n => {
      const active = activePath === n.href;
      const cls = active ? "nav-btn is-active" : "nav-btn";
      const aria = active ? ' aria-current="page"' : "";
      return `<a class="${cls}" href="${n.href}"${aria}>${escapeHtml(n.label)}</a>`;
    }).join("");

    return `
      <header class="site-header">
        <div class="shell">
          <div class="header-hero">
            <h1 class="header-title">개인 업무 보조 웹페이지</h1>
            <div class="header-byline">제작·운영: 천재 고주무관</div>
          </div>

          <nav class="nav" aria-label="상단 메뉴">
            ${items}
          </nav>
        </div>
      </header>
    `;
  }

  function mountHeader() {
    const el = document.getElementById("app-nav");
    if (!el) return;

    if (isIndexPage()) {
      el.innerHTML = headerOnlyHTML();
      return;
    }

    const activePath = normalizeForNav(location.pathname || "/");
    el.innerHTML = headerWithNavHTML(activePath);
  }

  // ✅ 기존 파일 호환용 별칭 (assist-tools.html 등에서 mountNav 호출해도 깨지지 않게)
  function mountNav() { mountHeader(); }

  window.App = {
    // util
    escapeHtml,
    pad,
    todayStr,

    // store
    STORE_URL,
    fetchStore,
    getStore,
    getByPath,

    // header
    mountHeader,
    mountNav
  };
})();
