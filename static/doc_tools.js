// static/doc_tools.js
(function () {
  function $(id) { return document.getElementById(id); }

  function setTab(activeId) {
    const tabs = document.querySelectorAll('.tab[role="tab"]');
    const panels = document.querySelectorAll('.tab-panel[role="tabpanel"]');

    tabs.forEach(t => {
      const on = (t.id === activeId);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });

    panels.forEach(p => {
      const tabId = p.getAttribute('aria-labelledby');
      p.classList.toggle('is-open', tabId === activeId);
    });
  }

  function readEditor() { return $('editor').value || ''; }
  function writeEditor(v) { $('editor').value = v ?? ''; syncPreview(); }
  function syncPreview() { $('preview').value = readEditor(); }

  function splitLines(text) {
    return String(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  }

  function joinLines(lines) { return lines.join("\n"); }

  // --- Actions ---
  function trimLines() {
    const lines = splitLines(readEditor()).map(l => l.trimEnd().trimStart());
    writeEditor(joinLines(lines));
  }

  function collapseBlank() {
    const lines = splitLines(readEditor());
    const out = [];
    let blank = false;
    for (const l of lines) {
      const isBlank = l.trim() === "";
      if (isBlank) {
        if (!blank) out.push("");
        blank = true;
      } else {
        out.push(l);
        blank = false;
      }
    }
    writeEditor(joinLines(out));
  }

  function dedupeLines() {
    const seen = new Set();
    const out = [];
    for (const l of splitLines(readEditor())) {
      const key = l.trim();
      if (key === "") { out.push(l); continue; }
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(l);
    }
    writeEditor(joinLines(out));
  }

  function numberLines() {
    const lines = splitLines(readEditor());
    const out = lines.map((l, i) => `${String(i + 1).padStart(2, "0")}. ${l}`);
    writeEditor(joinLines(out));
  }

  function doReplace() {
    const src = readEditor();
    const find = $('findText').value ?? '';
    const repl = $('replaceText').value ?? '';
    if (!find) return;

    const useRegex = $('useRegex').checked;
    const ignoreCase = $('ignoreCase').checked;

    if (!useRegex) {
      // 단순 치환: 전체 replaceAll
      // (구형 브라우저 대비)
      const out = src.split(find).join(repl);
      writeEditor(out);
      return;
    }

    try {
      const flags = ignoreCase ? 'gi' : 'g';
      const re = new RegExp(find, flags);
      const out = src.replace(re, repl);
      writeEditor(out);
    } catch (e) {
      alert("정규식 오류: " + (e?.message || e));
    }
  }

  async function copyEditor() {
    const text = readEditor();
    try {
      await navigator.clipboard.writeText(text);
      alert("클립보드 복사 완료");
    } catch {
      // fallback
      const ta = $('editor');
      ta.focus();
      ta.select();
      document.execCommand('copy');
      alert("클립보드 복사 완료(호환 모드)");
    }
  }

  // TSV/CSV → table preview
  function parseDelimited(delim) {
    const text = readEditor().trim();
    if (!text) { $('tablePreview').innerHTML = '<div class="muted">입력 데이터가 없습니다.</div>'; return; }
    const rows = splitLines(text).map(line => line.split(delim));
    const maxCols = Math.max(...rows.map(r => r.length));

    const table = document.createElement('table');
    table.className = 'sheetlike';
    const tbody = document.createElement('tbody');

    rows.forEach((r) => {
      const tr = document.createElement('tr');
      for (let c = 0; c < maxCols; c++) {
        const td = document.createElement('td');
        td.textContent = (r[c] ?? '');
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    $('tablePreview').innerHTML = '';
    $('tablePreview').appendChild(table);
  }

  // Templates
  function buildTemplateSelectors(categories) {
    const catSel = $('tplCategory');
    const itemSel = $('tplItem');
    catSel.innerHTML = '';
    itemSel.innerHTML = '';

    categories.forEach((c, idx) => {
      const opt = document.createElement('option');
      opt.value = String(idx);
      opt.textContent = c.name;
      catSel.appendChild(opt);
    });

    function refreshItems() {
      const idx = Number(catSel.value || 0);
      const cat = categories[idx] || { items: [] };
      itemSel.innerHTML = '';
      cat.items.forEach((it, j) => {
        const opt = document.createElement('option');
        opt.value = String(j);
        opt.textContent = it.title;
        itemSel.appendChild(opt);
      });
    }

    catSel.addEventListener('change', refreshItems);
    refreshItems();
  }

  function getSelectedTemplate(categories) {
    const ci = Number($('tplCategory').value || 0);
    const ii = Number($('tplItem').value || 0);
    return categories?.[ci]?.items?.[ii] || null;
  }

  window.DocTools = {
    async init() {
      // tab wiring
      $('tab-templates').addEventListener('click', () => setTab('tab-templates'));
      $('tab-clean').addEventListener('click', () => setTab('tab-clean'));
      $('tab-replace').addEventListener('click', () => setTab('tab-replace'));
      $('tab-table').addEventListener('click', () => setTab('tab-table'));

      // editor preview
      $('editor').addEventListener('input', syncPreview);

      // actions
      document.querySelectorAll('[data-act]').forEach(btn => {
        btn.addEventListener('click', () => {
          const act = btn.getAttribute('data-act');
          if (act === 'trimLines') trimLines();
          if (act === 'collapseBlank') collapseBlank();
          if (act === 'dedupeLines') dedupeLines();
          if (act === 'numberLines') numberLines();
        });
      });

      $('btnReplace').addEventListener('click', doReplace);
      $('btnCopyEditor').addEventListener('click', copyEditor);

      $('btnParseTSV').addEventListener('click', () => parseDelimited('\t'));
      $('btnParseCSV').addEventListener('click', () => parseDelimited(','));

      // load templates from store.json
      const store = await App.getStore();
      const categories = App.getByPath(store, 'templates.categories', []);
      buildTemplateSelectors(categories);

      $('btnLoadTemplate').addEventListener('click', () => {
        const t = getSelectedTemplate(categories);
        if (!t) { alert("선택된 템플릿이 없습니다."); return; }
        writeEditor(String(t.body || ""));
      });

      // initial state
      syncPreview();
      setTab('tab-templates');
    }
  };
})();