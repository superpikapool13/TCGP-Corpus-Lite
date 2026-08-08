// -----------------------------------------------------------------------
// Configure the language files to load.
// Filenames are expected to live as ./locales/<code>.json
// -----------------------------------------------------------------------
const LANGUAGES = [
    "de_DE", "en_US", "fr_FR", "es_ES", "it_IT",
    "ja_JP", "ko_KR", "pt_BR", "zh_TW"
];
// -----------------------------------------------------------------------

function flatten(obj, prefix = "", out = {}) {
    for (const [k, v] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === "object" && !Array.isArray(v)) {
            flatten(v, newKey, out);
        } else {
            out[newKey] = Array.isArray(v) ? JSON.stringify(v) : String(v);
        }
    }
    return out;
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

let state = { status: "loading", languages: [], rows: [], missingFiles: [] };
let query = "";
let onlyIncomplete = false;

async function loadTranslations() {
    const results = await Promise.all(
        LANGUAGES.map(async (lang) => {
            try {
                const res = await fetch(`locales/${lang}.json`, { cache: "no-store" });
                if (!res.ok) throw new Error(String(res.status));
                const json = await res.json();
                return { lang, data: flatten(json), ok: true };
            } catch (err) {
                return { lang, data: {}, ok: false };
            }
        })
    );

    const found = results.filter((r) => r.ok);
    const missingFiles = results.filter((r) => !r.ok).map((r) => r.lang);

    if (found.length === 0) {
        state = { status: "empty", languages: [], rows: [], missingFiles };
        render();
        return;
    }

    const languages = found.map((r) => r.lang);
    const allKeys = new Set();
    found.forEach((r) => Object.keys(r.data).forEach((k) => allKeys.add(k)));

    const rows = Array.from(allKeys)
        .sort()
        .map((key) => {
            const values = {};
            found.forEach((r) => {
                values[r.lang] = r.data[key] !== undefined ? r.data[key] : null;
            });
            return { key, values };
        });

    state = { status: "ready", languages, rows, missingFiles };
    render();
}

function getFilteredRows() {
    let r = state.rows;
    if (query.trim()) {
        const q = query.trim().toLowerCase();
        r = r.filter(
            (row) =>
                row.key.toLowerCase().includes(q) ||
                Object.values(row.values).some((v) => v && String(v).toLowerCase().includes(q))
        );
    }
    if (onlyIncomplete) {
        r = r.filter((row) => Object.values(row.values).some((v) => v === null || v === ""));
    }
    return r;
}

function completenessPct(lang) {
    const total = state.rows.length || 1;
    const filled = state.rows.filter((r) => r.values[lang] !== null && r.values[lang] !== "").length;
    return Math.round((filled / total) * 100);
}

function render() {
    const subtitle = document.getElementById("subtitle");
    const controls = document.getElementById("controls");
    const content = document.getElementById("content");
    const shownStat = document.getElementById("shownStat");

    if (state.status === "loading") {
        subtitle.textContent = "Loading…";
        controls.style.display = "none";
        content.innerHTML = `
            <div class="loading-card">
                <div class="spinner"></div>
                <p>Loading translation files…</p>
            </div>`;
        return;
    }

    if (state.status === "empty") {
        subtitle.textContent = "./locales — no files loaded";
        controls.style.display = "none";
        content.innerHTML = `
            <div class="state-msg">
                No language files could be loaded from <code>./locales</code>.<br /><br />
                Make sure your JSON files (e.g. <code>en_US.json</code>) sit in a <code>locales/</code> folder
                next to <code>index.html</code>, and that you're serving this over HTTP rather than opening
                it directly as a <code>file://</code> URL (browsers block that fetch). A quick way:<br /><br />
                <code>npx serve .</code> or <code>python -m http.server</code>
            </div>`;
        return;
    }

    // status === "ready"
    const totalMissingCells = state.rows.reduce(
        (acc, row) => acc + Object.values(row.values).filter((v) => v === null || v === "").length,
        0
    );
    subtitle.textContent = `./locales — ${state.languages.length} languages · ${state.rows.length} keys${totalMissingCells > 0 ? ` · ${totalMissingCells} missing` : ""}`;
    controls.style.display = "flex";

    const filteredRows = getFilteredRows();
    shownStat.textContent = `${filteredRows.length} shown`;

    const headerCells = state.languages
        .map((lang) => {
            const pct = completenessPct(lang);
            return `
                <th>
                    <span class="lang-name">${escapeHtml(lang)}</span>
                    <div class="completeness-track">
                        <div class="completeness-fill ${pct < 100 ? "incomplete" : ""}" style="width:${pct}%" title="${pct}% translated"></div>
                    </div>
                </th>`;
        })
        .join("");

    const bodyRows = filteredRows
        .map((row) => {
            const hasMissing = Object.values(row.values).some((v) => v === null || v === "");
            const cells = state.languages
                .map((lang) => {
                    const v = row.values[lang];
                    const missing = v === null || v === "";
                    return `<td class="${missing ? "value-missing" : "value-cell"}">${missing ? "missing" : escapeHtml(v)}</td>`;
                })
                .join("");
            return `<tr class="${hasMissing ? "row-flagged" : ""}"><td class="key-cell">${escapeHtml(row.key)}</td>${cells}</tr>`;
        })
        .join("");

    const missingFilesNote =
        state.missingFiles.length > 0
            ? `<p class="footer-note">Note: no file found for ${escapeHtml(state.missingFiles.join(", "))} — check the LANGUAGES list at the top of index.html.</p>`
            : "";

    content.innerHTML = `
        <table>
            <thead><tr><th>Key</th>${headerCells}</tr></thead>
            <tbody>${bodyRows}</tbody>
        </table>
        ${missingFilesNote}
    `;
}

document.getElementById("searchInput").addEventListener("input", (e) => {
    query = e.target.value;
    render();
});

document.getElementById("incompleteToggle").addEventListener("change", (e) => {
    onlyIncomplete = e.target.checked;
    document.getElementById("incompleteToggleLabel").classList.toggle("active", onlyIncomplete);
    render();
});

loadTranslations();