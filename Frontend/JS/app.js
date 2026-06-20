// Inkwell — post feed logic (index.html)

async function loadFeed() {
  const list = document.getElementById('postList');
  list.innerHTML = `<p class="empty-state">Loading posts…</p>`;
  try {
    const { posts } = await apiRequest('/posts');
    if (posts.length === 0) {
      list.innerHTML = `<p class="empty-state">No posts yet. Log in and write the first one.</p>`;
      return;
    }
    list.innerHTML = posts.map(renderPostCard).join('');
  } catch (err) {
    list.innerHTML = `<p class="empty-state">Could not load posts. Is the backend running?<br>${err.message}</p>`;
  }
}

function renderPostCard(post) {
  const excerpt = post.content.length > 220 ? post.content.slice(0, 220).trim() + '…' : post.content;
  return `
    <article class="post-card">
      <h2><a href="post.html?id=${post._id}">${escapeHtml(post.title)}</a></h2>
      <p class="byline mono">${escapeHtml(post.author ? post.author.name : 'Unknown')} · ${formatDate(post.createdAt)}</p>
      <p class="excerpt">${escapeHtml(excerpt)}</p>
      <div class="post-meta-row">
        <span class="comment-chip">${post.commentCount} comment${post.commentCount === 1 ? '' : 's'}</span>
      </div>
    </article>
  `;
}

function onAuthChanged() {
  // no feed-specific re-render needed beyond the header itself
}

document.addEventListener('DOMContentLoaded', () => {
  renderAuthArea();
  wireAuthModal();
  loadFeed();
});
