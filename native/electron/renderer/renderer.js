const api = window.agentMemory;

const state = {
  memories: [],
  filtered: [],
  selectedId: null,
  editingId: null
};

const els = {
  query: document.getElementById("query"),
  namespaceFilter: document.getElementById("namespaceFilter"),
  tagFilter: document.getElementById("tagFilter"),
  priorityFilter: document.getElementById("priorityFilter"),
  count: document.getElementById("count"),
  reload: document.getElementById("reload"),
  list: document.getElementById("list"),
  title: document.getElementById("title"),
  subtitle: document.getElementById("subtitle"),
  detail: document.getElementById("detail"),
  copy: document.getElementById("copy"),
  edit: document.getElementById("edit"),
  delete: document.getElementById("delete"),
  newMemory: document.getElementById("newMemory"),
  openDb: document.getElementById("openDb"),
  dbPath: document.getElementById("dbPath"),
  editor: document.getElementById("editor"),
  editorForm: document.getElementById("editorForm"),
  editorTitle: document.getElementById("editorTitle"),
  namespaceInput: document.getElementById("namespaceInput"),
  keyInput: document.getElementById("keyInput"),
  priorityInput: document.getElementById("priorityInput"),
  tagsInput: document.getElementById("tagsInput"),
  sourceInput: document.getElementById("sourceInput"),
  expiresInput: document.getElementById("expiresInput"),
  valueInput: document.getElementById("valueInput"),
  error: document.getElementById("error")
};

for (const input of [els.query, els.namespaceFilter, els.tagFilter, els.priorityFilter]) {
  input.addEventListener("input", applyFilters);
}
els.reload.addEventListener("click", load);
els.newMemory.addEventListener("click", () => openEditor(null));
els.copy.addEventListener("click", copySelected);
els.edit.addEventListener("click", () => openEditor(selectedMemory()));
els.delete.addEventListener("click", deleteSelected);
els.openDb.addEventListener("click", () => api.openDbFolder());
els.editorForm.addEventListener("submit", saveEditor);

void init();

async function init() {
  els.dbPath.textContent = await api.dbPath();
  await load();
}

async function load() {
  els.count.textContent = "Loading";
  const data = await api.listMemories({ include_expired: true, limit: 1000 });
  state.memories = data.results || [];
  if (!state.selectedId && state.memories[0]) {
    state.selectedId = state.memories[0].id;
  }
  applyFilters();
}

function applyFilters() {
  const query = els.query.value.trim().toLowerCase();
  const namespace = els.namespaceFilter.value.trim().toLowerCase();
  const tag = els.tagFilter.value.trim().toLowerCase();
  const priority = els.priorityFilter.value;
  state.filtered = state.memories.filter((memory) => {
    const haystack = [memory.namespace, memory.key || "", memory.value, (memory.tags || []).join(" "), memory.source || ""].join("\n").toLowerCase();
    return (!query || haystack.includes(query))
      && (!namespace || memory.namespace.toLowerCase().includes(namespace))
      && (!tag || (memory.tags || []).some((value) => value.toLowerCase().includes(tag)))
      && (!priority || memory.priority === priority);
  });
  if (state.selectedId && !state.filtered.some((memory) => memory.id === state.selectedId)) {
    state.selectedId = state.filtered[0]?.id || null;
  }
  renderList();
  renderDetail();
}

function renderList() {
  els.count.textContent = `${state.filtered.length} / ${state.memories.length}`;
  els.list.innerHTML = "";
  if (state.filtered.length === 0) {
    els.list.innerHTML = '<div class="empty">No memories found.</div>';
    return;
  }
  for (const memory of state.filtered) {
    const button = document.createElement("button");
    button.className = "item" + (memory.id === state.selectedId ? " active" : "");
    button.addEventListener("click", () => {
      state.selectedId = memory.id;
      renderList();
      renderDetail();
    });
    button.innerHTML =
      `<div class="itemTop"><strong>${escapeHtml(displayName(memory))}</strong><span class="pill">${escapeHtml(memory.priority)}</span></div>` +
      `<div class="summary">${escapeHtml(memory.value)}</div>` +
      `<div class="meta">${escapeHtml(formatDate(memory.updated_at))}</div>`;
    els.list.appendChild(button);
  }
}

function renderDetail() {
  const memory = selectedMemory();
  els.copy.disabled = !memory;
  els.edit.disabled = !memory;
  els.delete.disabled = !memory;
  if (!memory) {
    els.title.textContent = "Select a memory";
    els.subtitle.textContent = "";
    els.detail.className = "detail empty";
    els.detail.textContent = "No memory selected.";
    return;
  }
  els.title.textContent = displayName(memory);
  els.subtitle.textContent = memory.id;
  els.detail.className = "detail";
  els.detail.innerHTML =
    '<div class="fields">' +
      field("Priority", memory.priority) +
      field("Tags", (memory.tags || []).join(", ") || "-") +
      field("Updated", formatDate(memory.updated_at)) +
      field("Expires", memory.expires_at ? formatDate(memory.expires_at) : "-") +
    '</div>' +
    `<pre>${escapeHtml(memory.value)}</pre>`;
}

function openEditor(memory) {
  state.editingId = memory?.id || null;
  els.editorTitle.textContent = memory ? "Edit memory" : "New memory";
  els.namespaceInput.value = memory?.namespace || "";
  els.keyInput.value = memory?.key || "";
  els.priorityInput.value = memory?.priority || "note";
  els.tagsInput.value = (memory?.tags || []).join(", ");
  els.sourceInput.value = memory?.source || "";
  els.expiresInput.value = memory?.expires_at || "";
  els.valueInput.value = memory?.value || "";
  els.error.textContent = "";
  els.editor.showModal();
}

async function saveEditor(event) {
  event.preventDefault();
  els.error.textContent = "";
  const input = {
    namespace: els.namespaceInput.value.trim(),
    key: els.keyInput.value.trim() || undefined,
    priority: els.priorityInput.value,
    tags: els.tagsInput.value.split(",").map((tag) => tag.trim()).filter(Boolean),
    source: els.sourceInput.value.trim() || undefined,
    expires_at: els.expiresInput.value.trim() || undefined,
    value: els.valueInput.value
  };
  try {
    if (state.editingId) {
      await api.updateMemory({ id: state.editingId, ...input });
      state.selectedId = state.editingId;
    } else {
      const created = await api.createMemory(input);
      state.selectedId = created.id;
    }
    els.editor.close();
    await load();
  } catch (error) {
    els.error.textContent = error?.message || String(error);
  }
}

async function copySelected() {
  const memory = selectedMemory();
  if (memory) {
    await navigator.clipboard.writeText(memory.value);
  }
}

async function deleteSelected() {
  const memory = selectedMemory();
  if (!memory || !confirm(`Delete ${displayName(memory)}?`)) return;
  await api.deleteMemory({ id: memory.id });
  state.selectedId = null;
  await load();
}

function selectedMemory() {
  return state.memories.find((memory) => memory.id === state.selectedId) || null;
}

function displayName(memory) {
  return memory.namespace + (memory.key ? `/${memory.key}` : "");
}

function field(label, value) {
  return `<div class="field"><div class="label">${escapeHtml(label)}</div><div class="value">${escapeHtml(value)}</div></div>`;
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "-";
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}
