// Inkwell — single post + comments logic (post.html)

const postId = new URLSearchParams(window.location.search).get('id');
let currentPost = null;

function onAuthChanged() {
  renderCommentArea();
  renderPostActions();
}

async function loadPost() {
  const container = document.getElementById('postDetail');
  if (!postId) {
    container.innerHTML = `<p class="empty-state">No post specified.</p>`;
    return;
  }

  try {
    const { post, comments } = await apiRequest(`/posts/${postId}`);
    currentPost = post;
    container.innerHTML = `
      <div class="post-detail">
        <h1>${escapeHtml(post.title)}</h1>
        <p class="byline mono">${escapeHtml(post.author ? post.author.name : 'Unknown')} · ${formatDate(post.createdAt)}</p>
        <div id="postActions"></div>
        <div class="post-body">${escapeHtml(post.content)}</div>
      </div>
      <hr class="divider">
      <div class="comments-head">
        <h3>Comments</h3>
        <span class="comment-chip mono">${comments.length}</span>
      </div>
      <div id="commentsList"></div>
      <div id="commentArea"></div>
    `;
    renderPostActions();
    renderComments(comments);
    renderCommentArea();
  } catch (err) {
    container.innerHTML = `<p class="empty-state">Could not load this post.<br>${err.message}</p>`;
  }
}

function renderPostActions() {
  const box = document.getElementById('postActions');
  if (!box || !currentPost) return;
  const user = getStoredUser();
  const isAuthor = user && currentPost.author && user._id === currentPost.author._id;
  if (!isAuthor) {
    box.innerHTML = '';
    return;
  }
  box.innerHTML = `
    <div class="post-actions">
      <a class="btn small secondary" href="editor.html?id=${currentPost._id}">Edit post</a>
      <button class="btn small danger" id="deletePostBtn">Delete post</button>
    </div>
  `;
  document.getElementById('deletePostBtn').addEventListener('click', deletePost);
}

async function deletePost() {
  if (!confirm('Delete this post and all of its comments? This cannot be undone.')) return;
  try {
    await apiRequest(`/posts/${currentPost._id}`, { method: 'DELETE' });
    showToast('Post deleted.');
    window.location.href = 'index.html';
  } catch (err) {
    showToast(err.message);
  }
}

function renderComments(comments) {
  const list = document.getElementById('commentsList');
  const user = getStoredUser();

  if (comments.length === 0) {
    list.innerHTML = `<p class="empty-state" style="padding:20px 0;">No comments yet. Be the first to add one.</p>`;
    return;
  }

  list.innerHTML = comments
    .map((c) => {
      const isOwn = user && c.author && user._id === c.author._id;
      return `
      <div class="comment">
        <p class="c-meta"><span class="name">${escapeHtml(c.author ? c.author.name : 'Unknown')}</span> · ${formatDate(c.createdAt)}</p>
        <p class="c-body">${escapeHtml(c.content)}</p>
        ${isOwn ? `<div class="c-actions"><button data-del-comment="${c._id}">Delete</button></div>` : ''}
      </div>`;
    })
    .join('');

  list.querySelectorAll('[data-del-comment]').forEach((btn) =>
    btn.addEventListener('click', () => deleteComment(btn.dataset.delComment))
  );
}

async function deleteComment(id) {
  if (!confirm('Delete this comment?')) return;
  try {
    await apiRequest(`/comments/${id}`, { method: 'DELETE' });
    showToast('Comment deleted.');
    loadPost();
  } catch (err) {
    showToast(err.message);
  }
}

function renderCommentArea() {
  const box = document.getElementById('commentArea');
  if (!box) return;
  const user = getStoredUser();

  if (!user) {
    box.innerHTML = `
      <div class="login-prompt">
        <button id="commentLoginBtn">Log in</button> to leave a comment.
      </div>
    `;
    document.getElementById('commentLoginBtn').addEventListener('click', openAuthModal);
    return;
  }

  box.innerHTML = `
    <form class="comment-form" id="commentForm">
      <textarea id="commentContent" placeholder="Add a comment…" required></textarea>
      <button type="submit" class="btn small">Post comment</button>
    </form>
  `;
  document.getElementById('commentForm').addEventListener('submit', handleCommentSubmit);
}

async function handleCommentSubmit(e) {
  e.preventDefault();
  const textarea = document.getElementById('commentContent');
  const content = textarea.value.trim();
  if (!content) return;
  try {
    await apiRequest(`/posts/${postId}/comments`, { method: 'POST', body: { content } });
    textarea.value = '';
    showToast('Comment added.');
    loadPost();
  } catch (err) {
    showToast(err.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderAuthArea();
  wireAuthModal();
  loadPost();
});
