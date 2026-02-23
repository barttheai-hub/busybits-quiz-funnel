const view = document.getElementById('view');
const sidebar = document.getElementById('sidebar');
const mobileBackdrop = document.getElementById('mobileBackdrop');
const menuBtn = document.getElementById('menuBtn');
const tokenInput = document.getElementById('token');
const tokenStatus = document.getElementById('tokenStatus');
const themeBtn = document.getElementById('themeBtn');
const quickTaskForm = document.getElementById('quickTaskForm');
const quickTaskInput = document.getElementById('quickTaskInput');
const quickInsertButtons = Array.from(document.querySelectorAll('[data-quick-insert]'));

function autosizeQuickTaskInput() {
  if (!quickTaskInput) return;
  quickTaskInput.style.height = 'auto';
  const next = Math.min(140, Math.max(40, quickTaskInput.scrollHeight));
  quickTaskInput.style.height = `${next}px`;
}

const savedTheme = localStorage.getItem('mc_theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

tokenInput.value = localStorage.getItem('mc_token') || '';
document.getElementById('saveToken').onclick = () => {
  localStorage.setItem('mc_token', tokenInput.value.trim());
  tokenStatus.textContent = 'Saved';
  setTimeout(() => { tokenStatus.textContent = ''; }, 1200);
};
const toggleMobileMenu = (open) => {
  const shouldOpen = typeof open === 'boolean' ? open : !sidebar.classList.contains('open');
  sidebar.classList.toggle('open', shouldOpen);
  mobileBackdrop?.classList.toggle('open', shouldOpen);
  menuBtn?.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
  document.body.style.overflow = shouldOpen && window.innerWidth < 901 ? 'hidden' : '';
};

menuBtn.onclick = () => toggleMobileMenu();
mobileBackdrop?.addEventListener('click', () => toggleMobileMenu(false));

themeBtn.onclick = () => {
  const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', current);
  localStorage.setItem('mc_theme', current);
};

let state = { projects: [] };

const api = async (path, opts = {}) => {
  const token = localStorage.getItem('mc_token') || tokenInput.value.trim();
  const res = await fetch(path, {
    ...opts,
    headers: {
      'content-type': 'application/json',
      'x-api-token': token,
      ...(opts.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || JSON.stringify(data));
  return data;
};

const esc = (s = '') => s.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const badge = (text, tone = 'neutral') => `<span class="badge ${tone}">${esc(String(text || ''))}</span>`;

function parseQuickTask(raw = '') {
  let text = String(raw || '').trim();
  let owner = 'OpenClaw';
  let priority = 'High';
  let dueDate = null;

  if (!text) return { title: '', owner, priority, dueDate };

  text = text.replace(/\s@me\b/gi, () => {
    owner = 'Me';
    return '';
  });
  text = text.replace(/\s@(ai|openclaw)\b/gi, () => {
    owner = 'OpenClaw';
    return '';
  });

  text = text.replace(/\s#(high|h)\b/gi, () => {
    priority = 'High';
    return '';
  });
  text = text.replace(/\s#(med|medium|m)\b/gi, () => {
    priority = 'Medium';
    return '';
  });
  text = text.replace(/\s#(low|l)\b/gi, () => {
    priority = 'Low';
    return '';
  });

  text = text.replace(/\s\/(today|tomorrow)\b/gi, (_, when) => {
    const d = new Date();
    if (when.toLowerCase() === 'tomorrow') d.setDate(d.getDate() + 1);
    dueDate = d.toISOString().slice(0, 10);
    return '';
  });

  text = text.replace(/\sdue:(\d{4}-\d{2}-\d{2})\b/gi, (_, iso) => {
    dueDate = iso;
    return '';
  });

  const title = text.replace(/\s{2,}/g, ' ').trim();
  return { title, owner, priority, dueDate };
}

quickTaskInput?.addEventListener('input', autosizeQuickTaskInput);
quickTaskInput?.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault();
    quickTaskForm?.requestSubmit();
  }
});
quickInsertButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    if (!quickTaskInput) return;
    const token = btn.dataset.quickInsert;
    const current = quickTaskInput.value || '';
    const needsSpace = current.length > 0 && !/[\s\n]$/.test(current);
    quickTaskInput.value = `${current}${needsSpace ? ' ' : ''}${token}`;
    quickTaskInput.focus();
    autosizeQuickTaskInput();
  });
});
autosizeQuickTaskInput();

quickTaskForm?.addEventListener('submit', async e => {
  e.preventDefault();
  const raw = quickTaskInput?.value || '';
  const lines = raw
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .slice(0, 12);

  if (!lines.length) return;

  const parsedTasks = lines
    .map(parseQuickTask)
    .filter(task => task.title);

  if (!parsedTasks.length) return;

  try {
    await Promise.all(parsedTasks.map(task => api('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: task.title,
        owner: task.owner,
        status: 'To Do',
        priority: task.priority,
        dueDate: task.dueDate
      })
    })));

    if (quickTaskInput) {
      quickTaskInput.value = '';
      autosizeQuickTaskInput();
      quickTaskInput.focus();
    }
    const addedCount = parsedTasks.length;
    tokenStatus.textContent = addedCount === 1 ? 'Quick task added' : `${addedCount} tasks added`;
    setTimeout(() => {
      if (tokenStatus.textContent === 'Quick task added' || tokenStatus.textContent === `${addedCount} tasks added`) tokenStatus.textContent = '';
    }, 1800);

    const isTasksActive = document.querySelector('[data-view="tasks"].active');
    if (isTasksActive) loadTasks().catch(renderError);
  } catch (err) {
    tokenStatus.textContent = 'Quick add failed';
    setTimeout(() => {
      if (tokenStatus.textContent === 'Quick add failed') tokenStatus.textContent = '';
    }, 1800);
  }
});

function sortByMode(items, mode, type) {
  const arr = [...items];
  const byDateDesc = key => arr.sort((a, b) => String(b[key] || '').localeCompare(String(a[key] || '')));
  const byDateAsc = key => arr.sort((a, b) => String(a[key] || '9999-99-99').localeCompare(String(b[key] || '9999-99-99')));
  if (type === 'notes') {
    if (mode === 'title') return arr.sort((a, b) => a.title.localeCompare(b.title));
    return byDateDesc('updatedAt');
  }
  if (type === 'tasks') {
    if (mode === 'priority') {
      const rank = { High: 0, Medium: 1, Low: 2 };
      return arr.sort((a, b) => (rank[a.priority] ?? 9) - (rank[b.priority] ?? 9));
    }
    if (mode === 'updated') return byDateDesc('updatedAt');
    return byDateAsc('dueDate');
  }
  if (type === 'resources') {
    if (mode === 'title') return arr.sort((a, b) => a.title.localeCompare(b.title));
    return byDateDesc('createdAt');
  }
  return arr;
}

function bindSubmit(formId, handler) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    handler(new FormData(form));
  });
}

function renderError(e) {
  view.innerHTML = `<div class='card'><h3>Something went wrong</h3><p class='muted'>${esc(e.message)}</p><p class='muted'>Check API token, then retry.</p></div>`;
}

function renderLoading(title = 'Loading...') {
  view.innerHTML = `<div class='card'><h3>${esc(title)}</h3><p class='muted'>Fetching latest data...</p></div>`;
}

async function loadProjectsCache() {
  state.projects = await api('/api/projects');
}

function projectOptions(selected) {
  return [`<option value=''>No project</option>`, ...state.projects.map(p => `<option value='${p.id}' ${selected === p.id ? 'selected' : ''}>${esc(p.name)}</option>`)].join('');
}

async function loadDashboard() {
  const d = await api('/api/dashboard');
  view.innerHTML = `
    <div class="kpi-grid">
      <div class="card"><div class="muted">Active Tasks</div><div class="kpi">${d.metrics.activeTasks}</div></div>
      <div class="card"><div class="muted">Overdue</div><div class="kpi">${d.metrics.overdueTasks}</div></div>
      <div class="card"><div class="muted">Notes</div><div class="kpi">${d.metrics.notesCount}</div></div>
      <div class="card"><div class="muted">Resources</div><div class="kpi">${d.metrics.resourcesCount}</div></div>
      <div class="card"><div class="muted">Projects</div><div class="kpi">${d.metrics.projectsCount}</div></div>
    </div>
    <div class="card"><h3>Workload by Owner</h3><div>Me: ${d.byOwner.Me} · OpenClaw: ${d.byOwner.OpenClaw}</div></div>
    <div class="card"><h3>Today Queue</h3><div class="list">${d.todayTasks.map(t => `<div class='item'><strong>${esc(t.title)}</strong><div class='muted'>${esc(t.owner)} · ${esc(t.status)}${t.dueDate ? ` · due ${esc(t.dueDate)}` : ''}</div></div>`).join('') || '<div class="muted">No tasks yet. Add one in Tasks.</div>'}</div></div>
  `;
}

async function loadNotes() {
  await loadProjectsCache();
  const q = document.getElementById('notes_q')?.value || '';
  const sort = document.getElementById('notes_sort')?.value || 'updated';
  let notes = await api(`/api/notes?q=${encodeURIComponent(q)}`);
  notes = sortByMode(notes, sort, 'notes');
  view.innerHTML = `
  <div class='card'>
    <h3>Create Note</h3>
    <form id='create_note' class='stack'>
      <input name='title' placeholder='Title' required>
      <textarea name='content' placeholder='Write...' rows='4'></textarea>
      <input name='tags' placeholder='tags comma separated'>
      <select name='projectId'>${projectOptions('')}</select>
      <button class='primary' type='submit'>Save note</button>
    </form>
  </div>
  <div class='card'>
    <div class='row between'><h3>Notes</h3><div class='row'><input id='notes_q' placeholder='Search notes' value='${esc(q)}'><select id='notes_sort'><option value='updated' ${sort==='updated'?'selected':''}>Sort: Updated</option><option value='title' ${sort==='title'?'selected':''}>Sort: Title</option></select></div></div>
    <div class='list'>${notes.map(n => `
      <div class='item'>
        <div class='row between'><strong>${esc(n.title)}</strong><span class='muted'>${new Date(n.updatedAt).toLocaleString()}</span></div>
        <p>${esc((n.content || '').slice(0, 240))}</p>
        <div class='row'>
          <button data-toggle-note-edit='${n.id}'>Edit</button>
          <button data-del-note='${n.id}' class='danger'>Delete</button>
        </div>
        <form id='note_edit_${n.id}' class='stack hidden'>
          <input name='title' value='${esc(n.title)}' required>
          <textarea name='content' rows='3'>${esc(n.content || '')}</textarea>
          <div class='row'><button class='primary' type='submit'>Save</button></div>
        </form>
      </div>`).join('') || '<div class="muted">No notes yet.</div>'}
    </div>
  </div>`;

  bindSubmit('create_note', async fd => {
    await api('/api/notes', { method: 'POST', body: JSON.stringify({
      title: fd.get('title'),
      content: fd.get('content'),
      tags: String(fd.get('tags') || '').split(',').map(s => s.trim()).filter(Boolean),
      projectId: fd.get('projectId') || null
    })});
    loadNotes().catch(renderError);
  });

  document.getElementById('notes_q').onchange = () => loadNotes().catch(renderError);
  document.getElementById('notes_sort').onchange = () => loadNotes().catch(renderError);
  document.querySelectorAll('[data-del-note]').forEach(btn => btn.onclick = async () => {
    if (!confirm('Delete note?')) return;
    await api(`/api/notes/${btn.dataset.delNote}`, { method: 'DELETE' });
    loadNotes().catch(renderError);
  });
  document.querySelectorAll('[data-toggle-note-edit]').forEach(btn => btn.onclick = () => {
    const form = document.getElementById(`note_edit_${btn.dataset.toggleNoteEdit}`);
    if (form) form.classList.toggle('hidden');
  });
  notes.forEach(n => {
    bindSubmit(`note_edit_${n.id}`, async fd => {
      await api(`/api/notes/${n.id}`, { method: 'PUT', body: JSON.stringify({ title: fd.get('title'), content: fd.get('content') }) });
      loadNotes().catch(renderError);
    });
  });
}

async function loadTasks() {
  await loadProjectsCache();
  const owner = document.getElementById('tasks_owner')?.value || '';
  const status = document.getElementById('tasks_status')?.value || '';
  const sort = document.getElementById('tasks_sort')?.value || 'due';
  const qs = new URLSearchParams({ owner, status });
  let tasks = await api(`/api/tasks?${qs}`);
  tasks = sortByMode(tasks, sort, 'tasks');
  view.innerHTML = `
  <div class='card'>
    <h3>Create Task</h3>
    <form id='create_task' class='stack'>
      <input name='title' placeholder='Task title' required>
      <textarea name='description' rows='2' placeholder='Optional context'></textarea>
      <div class='row'>
        <select name='owner'><option>Me</option><option>OpenClaw</option></select>
        <select name='status'><option>To Do</option><option>In Progress</option><option>Done</option></select>
        <select name='priority'><option>High</option><option selected>Medium</option><option>Low</option></select>
      </div>
      <div class='row'><input name='dueDate' type='date'><select name='projectId'>${projectOptions('')}</select></div>
      <button class='primary' type='submit'>Save task</button>
    </form>
  </div>
  <div class='card'>
    <div class='row between'>
      <h3>Tasks</h3>
      <div class='row'>
        <select id='tasks_owner'><option value=''>All owners</option><option ${owner === 'Me' ? 'selected' : ''}>Me</option><option ${owner === 'OpenClaw' ? 'selected' : ''}>OpenClaw</option></select>
        <select id='tasks_status'><option value=''>All status</option><option ${status === 'To Do' ? 'selected' : ''}>To Do</option><option ${status === 'In Progress' ? 'selected' : ''}>In Progress</option><option ${status === 'Done' ? 'selected' : ''}>Done</option></select>
        <select id='tasks_sort'><option value='due' ${sort==='due'?'selected':''}>Sort: Due date</option><option value='priority' ${sort==='priority'?'selected':''}>Sort: Priority</option><option value='updated' ${sort==='updated'?'selected':''}>Sort: Updated</option></select>
      </div>
    </div>
    <div class='list'>${tasks.map(t => `
      <div class='item'>
        <div class='row between'><strong>${esc(t.title)}</strong>${badge(t.priority, t.priority === 'High' ? 'danger' : t.priority === 'Medium' ? 'warn' : 'ok')}</div>
        <div class='muted'>${badge(t.owner, 'neutral')} ${badge(t.status, t.status === 'Done' ? 'ok' : t.status === 'In Progress' ? 'info' : 'neutral')}${t.dueDate ? ` ${badge(`due ${t.dueDate}`, 'neutral')}` : ''}</div>
        ${t.description ? `<p>${esc(t.description)}</p>` : ''}
        <div class='row'>
          <button data-status-task='${t.id}' data-next='To Do'>To Do</button>
          <button data-status-task='${t.id}' data-next='In Progress'>In Progress</button>
          <button data-status-task='${t.id}' data-next='Done'>Done</button>
          <button data-toggle-task-edit='${t.id}'>Edit</button>
          <button data-del-task='${t.id}' class='danger'>Delete</button>
        </div>
        <form id='task_edit_${t.id}' class='stack hidden'>
          <input name='title' value='${esc(t.title)}' required>
          <textarea name='description' rows='2'>${esc(t.description || '')}</textarea>
          <div class='row'>
            <select name='owner'><option ${t.owner==='Me'?'selected':''}>Me</option><option ${t.owner==='OpenClaw'?'selected':''}>OpenClaw</option></select>
            <select name='status'><option ${t.status==='To Do'?'selected':''}>To Do</option><option ${t.status==='In Progress'?'selected':''}>In Progress</option><option ${t.status==='Done'?'selected':''}>Done</option></select>
            <select name='priority'><option ${t.priority==='High'?'selected':''}>High</option><option ${t.priority==='Medium'?'selected':''}>Medium</option><option ${t.priority==='Low'?'selected':''}>Low</option></select>
          </div>
          <div class='row'><input name='dueDate' type='date' value='${esc(t.dueDate || '')}'><select name='projectId'>${projectOptions(t.projectId || '')}</select></div>
          <div class='row'><button class='primary' type='submit'>Save</button></div>
        </form>
      </div>`).join('') || '<div class="muted">No tasks yet.</div>'}
    </div>
  </div>`;

  bindSubmit('create_task', async fd => {
    await api('/api/tasks', { method: 'POST', body: JSON.stringify({
      title: fd.get('title'), description: fd.get('description'), owner: fd.get('owner'), status: fd.get('status'),
      priority: fd.get('priority'), dueDate: fd.get('dueDate') || null, projectId: fd.get('projectId') || null
    })});
    loadTasks().catch(renderError);
  });

  document.getElementById('tasks_owner').onchange = () => loadTasks().catch(renderError);
  document.getElementById('tasks_status').onchange = () => loadTasks().catch(renderError);
  document.getElementById('tasks_sort').onchange = () => loadTasks().catch(renderError);
  document.querySelectorAll('[data-del-task]').forEach(btn => btn.onclick = async () => {
    if (!confirm('Delete task?')) return;
    await api(`/api/tasks/${btn.dataset.delTask}`, { method: 'DELETE' });
    loadTasks().catch(renderError);
  });
  document.querySelectorAll('[data-status-task]').forEach(btn => btn.onclick = async () => {
    await api(`/api/tasks/${btn.dataset.statusTask}`, { method: 'PUT', body: JSON.stringify({ status: btn.dataset.next }) });
    loadTasks().catch(renderError);
  });
  document.querySelectorAll('[data-toggle-task-edit]').forEach(btn => btn.onclick = () => {
    const form = document.getElementById(`task_edit_${btn.dataset.toggleTaskEdit}`);
    if (form) form.classList.toggle('hidden');
  });
  tasks.forEach(t => {
    bindSubmit(`task_edit_${t.id}`, async fd => {
      await api(`/api/tasks/${t.id}`, { method: 'PUT', body: JSON.stringify({
        title: fd.get('title'),
        description: fd.get('description'),
        owner: fd.get('owner'),
        status: fd.get('status'),
        priority: fd.get('priority'),
        dueDate: fd.get('dueDate') || null,
        projectId: fd.get('projectId') || null
      })});
      loadTasks().catch(renderError);
    });
  });
}

async function loadResources() {
  await loadProjectsCache();
  const q = document.getElementById('res_q')?.value || '';
  const sort = document.getElementById('res_sort')?.value || 'created';
  let resources = await api(`/api/resources?q=${encodeURIComponent(q)}`);
  resources = sortByMode(resources, sort, 'resources');
  view.innerHTML = `
  <div class='card'>
    <h3>Add Resource</h3>
    <form id='create_res' class='stack'>
      <input name='title' placeholder='Title' required>
      <div class='row'><input name='type' placeholder='Type (doc, guide, copy...)'><input name='url' placeholder='URL'></div>
      <textarea name='preview' rows='3' placeholder='Preview'></textarea>
      <select name='projectId'>${projectOptions('')}</select>
      <button class='primary' type='submit'>Save resource</button>
    </form>
  </div>
  <div class='card'>
    <div class='row between'><h3>Resources Library</h3><div class='row'><input id='res_q' placeholder='Search resources' value='${esc(q)}'><select id='res_sort'><option value='created' ${sort==='created'?'selected':''}>Sort: Created</option><option value='title' ${sort==='title'?'selected':''}>Sort: Title</option></select></div></div>
    <div class='list'>${resources.map(r => `
      <div class='item'>
        <div class='row between'><strong>${esc(r.title)}</strong>${badge(r.type || 'resource', 'info')}</div>
        <p>${esc(r.preview || '')}</p>
        ${r.url ? `<a href='${esc(r.url)}' target='_blank' rel='noreferrer'>${esc(r.url)}</a>` : ''}
        <div class='row'><button data-toggle-res-edit='${r.id}'>Edit</button><button data-del-res='${r.id}' class='danger'>Delete</button></div>
        <form id='res_edit_${r.id}' class='stack hidden'>
          <input name='title' value='${esc(r.title)}' required>
          <div class='row'><input name='type' value='${esc(r.type)}'><input name='url' value='${esc(r.url || '')}'></div>
          <textarea name='preview' rows='2'>${esc(r.preview || '')}</textarea>
          <select name='projectId'>${projectOptions(r.projectId || '')}</select>
          <div class='row'><button class='primary' type='submit'>Save</button></div>
        </form>
      </div>`).join('') || '<div class="muted">No resources yet.</div>'}
    </div>
  </div>`;

  bindSubmit('create_res', async fd => {
    await api('/api/resources', { method: 'POST', body: JSON.stringify({
      title: fd.get('title'), type: fd.get('type'), url: fd.get('url'), preview: fd.get('preview'), projectId: fd.get('projectId') || null
    })});
    loadResources().catch(renderError);
  });

  document.getElementById('res_q').onchange = () => loadResources().catch(renderError);
  document.getElementById('res_sort').onchange = () => loadResources().catch(renderError);
  document.querySelectorAll('[data-del-res]').forEach(btn => btn.onclick = async () => {
    if (!confirm('Delete resource?')) return;
    await api(`/api/resources/${btn.dataset.delRes}`, { method: 'DELETE' });
    loadResources().catch(renderError);
  });
  document.querySelectorAll('[data-toggle-res-edit]').forEach(btn => btn.onclick = () => {
    const form = document.getElementById(`res_edit_${btn.dataset.toggleResEdit}`);
    if (form) form.classList.toggle('hidden');
  });
  resources.forEach(r => {
    bindSubmit(`res_edit_${r.id}`, async fd => {
      await api(`/api/resources/${r.id}`, { method: 'PUT', body: JSON.stringify({
        title: fd.get('title'),
        type: fd.get('type'),
        url: fd.get('url'),
        preview: fd.get('preview'),
        projectId: fd.get('projectId') || null
      })});
      loadResources().catch(renderError);
    });
  });
}

async function loadProjects() {
  const projects = await api('/api/projects');
  view.innerHTML = `
  <div class='card'>
    <h3>Create Project</h3>
    <form id='create_proj' class='stack'>
      <input name='name' placeholder='Project name' required>
      <div class='row'>
        <select name='status'><option>Active</option><option>Paused</option><option>Done</option></select>
        <select name='health'><option>Green</option><option>Yellow</option><option>Red</option></select>
      </div>
      <textarea name='description' rows='2' placeholder='Description'></textarea>
      <button class='primary' type='submit'>Save project</button>
    </form>
  </div>
  <div class='card'><h3>Projects Overview</h3><div class='list'>${projects.map(p => `
    <div class='item'>
      <div class='row between'><strong>${esc(p.name)}</strong><span>${badge(p.status, p.status === 'Done' ? 'ok' : p.status === 'Paused' ? 'warn' : 'info')} ${badge(p.health, p.health === 'Green' ? 'ok' : p.health === 'Yellow' ? 'warn' : 'danger')}</span></div>
      <div class='muted'>Tasks ${p.taskCount} · Notes ${p.noteCount} · Resources ${p.resourceCount}</div>
      ${p.description ? `<p>${esc(p.description)}</p>` : ''}
      <div class='row'>
        <button data-toggle-proj-edit='${p.id}'>Edit</button>
        <button data-del-proj='${p.id}' class='danger'>Delete</button>
      </div>
      <form id='proj_edit_${p.id}' class='stack hidden'>
        <input name='name' value='${esc(p.name)}' required>
        <div class='row'>
          <select name='status'><option ${p.status==='Active'?'selected':''}>Active</option><option ${p.status==='Paused'?'selected':''}>Paused</option><option ${p.status==='Done'?'selected':''}>Done</option></select>
          <select name='health'><option ${p.health==='Green'?'selected':''}>Green</option><option ${p.health==='Yellow'?'selected':''}>Yellow</option><option ${p.health==='Red'?'selected':''}>Red</option></select>
        </div>
        <textarea name='description' rows='2'>${esc(p.description || '')}</textarea>
        <div class='row'><button class='primary' type='submit'>Save</button></div>
      </form>
    </div>`).join('') || '<div class="muted">No projects yet.</div>'}</div></div>`;

  bindSubmit('create_proj', async fd => {
    await api('/api/projects', { method: 'POST', body: JSON.stringify({
      name: fd.get('name'), status: fd.get('status'), health: fd.get('health'), description: fd.get('description')
    })});
    loadProjects().catch(renderError);
  });

  document.querySelectorAll('[data-del-proj]').forEach(btn => btn.onclick = async () => {
    if (!confirm('Delete project? linked items will be unassigned.')) return;
    await api(`/api/projects/${btn.dataset.delProj}`, { method: 'DELETE' });
    loadProjects().catch(renderError);
  });

  document.querySelectorAll('[data-toggle-proj-edit]').forEach(btn => btn.onclick = () => {
    const form = document.getElementById(`proj_edit_${btn.dataset.toggleProjEdit}`);
    if (form) form.classList.toggle('hidden');
  });
  projects.forEach(p => {
    bindSubmit(`proj_edit_${p.id}`, async fd => {
      await api(`/api/projects/${p.id}`, { method: 'PUT', body: JSON.stringify({
        name: fd.get('name'), status: fd.get('status'), health: fd.get('health'), description: fd.get('description')
      }) });
      loadProjects().catch(renderError);
    });
  });
}

async function loadActivity() {
  const acts = await api('/api/activity?limit=100');
  view.innerHTML = `<div class='card'><h3>Activity Feed</h3><div class='list'>${acts.map(a => `<div class='item'><strong>${esc(a.message)}</strong><div class='muted'>${new Date(a.createdAt).toLocaleString()} · ${esc(a.type)}</div></div>`).join('') || '<div class="muted">No activity yet.</div>'}</div></div>`;
}

const handlers = { dashboard: loadDashboard, notes: loadNotes, tasks: loadTasks, resources: loadResources, projects: loadProjects, activity: loadActivity };

function setActiveView(viewName) {
  document.querySelectorAll('[data-view]').forEach(el => {
    el.classList.toggle('active', el.dataset.view === viewName);
  });
}

document.querySelectorAll('[data-view]').forEach(btn => {
  btn.onclick = () => {
    const nextView = btn.dataset.view;
    setActiveView(nextView);
    if (window.innerWidth < 900) toggleMobileMenu(false);
    renderLoading(`Opening ${btn.textContent.trim()}...`);
    handlers[nextView]().catch(renderError);
  };
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    toggleMobileMenu(false);
  }
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    const input = document.querySelector('input[placeholder*="Search"], #notes_q, #res_q');
    if (input) input.focus();
  }
});

window.addEventListener('resize', () => {
  if (window.innerWidth >= 901) {
    toggleMobileMenu(false);
    document.body.style.overflow = '';
  }
});

setActiveView('dashboard');
loadDashboard().catch(renderError);
