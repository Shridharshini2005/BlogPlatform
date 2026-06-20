// Inkwell — post editor logic (editor.html), used for both create and edit

const editId = new URLSearchParams(window.location.search).get('id');
let loadedPost = null;

function onAuthChanged() {
  renderGate();
}

function renderGate() {
  const user = getStoredUser();
  const gate = document.getElementById('authGate');
  const formWrap = document.getElementById('editorFormWrap');

  if (!user) {
    formWrap.style.display = 'none';
    gate.style.display = 'block';
    gate.innerHTML = `
      <div class="login-prompt">
        <button id="editorLoginBtn">Log in</button> to write a post.
      </div>
    `;
    document.getElementById('editorLoginBtn').addEventListener('click', openAuthModal);
    return;
  }

  gate.style.display = 'none';
  formWrap.style.display = 'block';

  if (editId && loadedPost && String(loadedPost.author._id) !== String(user._id)) {
    formWrap.style.display = 'none';
    gate.style.display = 'block';
    gate.innerHTML = `<p class="empty-state">You can only edit your own posts.</p>`;
  }
}

async function loadForEdit() {
  if (!editId) return;
  try {
    const { post } = await apiRequest(`/posts/${editId}`);
    loadedPost = post;
    document.getElementById('pageTitle').textContent = 'Edit post';
    document.getElementById('titleInput').value = post.title;
    document.getElementById('contentInput').value = post.content;
    renderGate();
  } catch (err) {
    document.getElementById('authGate').innerHTML = `<p class="empty-state">Could not load this post.<br>${err.message}</p>`;
  }
}

async function handleSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('titleInput').value.trim();
  const content = document.getElementById('contentInput').value.trim();
  const errBox = document.getElementById('editorError');

  if (!title || !content) {
    errBox.textContent = 'Both a title and some content are required.';
    errBox.classList.add('show');
    return;
  }

  try {
    let post;
    if (editId) {
      const res = await apiRequest(`/posts/${editId}`, { method: 'PUT', body: { title, content } });
      post = res.post;
      showToast('Post updated.');
    } else {
      const res = await apiRequest('/posts', { method: 'POST', body: { title, content } });
      post = res.post;
      showToast('Post published.');
    }
    window.location.href = `post.html?id=${post._id}`;
  } catch (err) {
    errBox.textContent = err.message;
    errBox.classList.add('show');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderAuthArea();
  wireAuthModal();
  renderGate();
  loadForEdit();
  document.getElementById('editorForm').addEventListener('submit', handleSubmit);
});
