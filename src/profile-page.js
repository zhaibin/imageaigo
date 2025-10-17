/**
 * User Profile Page
 */

export function buildProfilePage(user, userImages, isOwnProfile = false) {
  const imagesHtml = userImages.map(img => `
    <div class="image-card">
      <a href="/image/${img.slug}">
        <img src="${img.image_url}" alt="${img.description || 'Image'}" loading="lazy">
      </a>
      <div class="image-info">
        <p class="description">${img.description || 'No description'}</p>
        <p class="date">${new Date(img.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
      </div>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${user.username}'s Profile - ImageAI Go</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      min-height: 100vh;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px 0;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .logo a {
      color: white;
      text-decoration: none;
      font-size: 1.5rem;
      font-weight: bold;
    }
    
    .nav a {
      color: white;
      text-decoration: none;
      margin-left: 20px;
      transition: opacity 0.3s;
    }
    
    .nav a:hover {
      opacity: 0.8;
    }
    
    .container {
      max-width: 1200px;
      margin: 40px auto;
      padding: 0 20px;
    }
    
    .profile-header {
      background: white;
      border-radius: 15px;
      padding: 40px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      margin-bottom: 30px;
      display: flex;
      align-items: center;
      gap: 30px;
    }
    
    .avatar {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid #667eea;
    }
    
    .user-info {
      flex: 1;
    }
    
    .user-info h1 {
      font-size: 2rem;
      margin-bottom: 10px;
      color: #333;
    }
    
    .user-info .username {
      color: #666;
      margin-bottom: 15px;
      font-size: 1.1rem;
    }
    
    .user-info .bio {
      color: #666;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    
    .user-stats {
      display: flex;
      gap: 30px;
      margin-top: 20px;
    }
    
    .stat {
      text-align: center;
    }
    
    .stat-number {
      font-size: 1.8rem;
      font-weight: bold;
      color: #667eea;
    }
    
    .stat-label {
      color: #666;
      font-size: 0.9rem;
      margin-top: 5px;
    }
    
    .actions {
      display: flex;
      gap: 10px;
    }
    
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.3s;
      text-decoration: none;
      display: inline-block;
    }
    
    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }
    
    .btn-secondary {
      background: #f0f0f0;
      color: #333;
    }
    
    .btn-secondary:hover {
      background: #e0e0e0;
    }
    
    .section {
      background: white;
      border-radius: 15px;
      padding: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .section-title {
      font-size: 1.5rem;
      margin-bottom: 20px;
      color: #333;
    }
    
    .images-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    
    .image-card {
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      transition: transform 0.3s;
    }
    
    .image-card:hover {
      transform: translateY(-5px);
    }
    
    .image-card img {
      width: 100%;
      height: 200px;
      object-fit: cover;
    }
    
    .image-info {
      padding: 15px;
    }
    
    .image-info .description {
      color: #333;
      margin-bottom: 10px;
      font-size: 0.9rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .image-info .date {
      color: #999;
      font-size: 0.85rem;
    }
    
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #999;
    }
    
    .empty-state svg {
      width: 80px;
      height: 80px;
      margin-bottom: 20px;
      opacity: 0.5;
    }
    
    .modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 1000;
      align-items: center;
      justify-content: center;
    }
    
    .modal.show {
      display: flex;
    }
    
    .modal-content {
      background: white;
      border-radius: 15px;
      padding: 40px;
      max-width: 500px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
    }
    
    .modal-content h2 {
      margin-bottom: 20px;
      color: #333;
    }
    
    .form-group {
      margin-bottom: 20px;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 8px;
      color: #333;
      font-weight: 500;
    }
    
    .form-group input,
    .form-group textarea {
      width: 100%;
      padding: 12px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.3s;
    }
    
    .form-group textarea {
      min-height: 100px;
      resize: vertical;
    }
    
    .form-group input:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #667eea;
    }
    
    .form-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 30px;
    }
    
    .message {
      padding: 12px 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 0.9rem;
    }
    
    .message.success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    
    .message.error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
    
    @media (max-width: 768px) {
      .profile-header {
        flex-direction: column;
        text-align: center;
      }
      
      .user-stats {
        justify-content: center;
      }
      
      .actions {
        flex-direction: column;
        width: 100%;
      }
      
      .btn {
        width: 100%;
      }
      
      .images-grid {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-content">
      <div class="logo">
        <a href="/">🎨 ImageAI Go</a>
      </div>
      <div class="nav">
        <a href="/images">Gallery</a>
        ${isOwnProfile ? `
        <a href="/profile">Profile</a>
        <a href="#" onclick="logout(); return false;">Logout</a>
        ` : ''}</div>
    </div>
  </div>

  <div class="container">
    <div class="profile-header">
      <img src="${user.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.username)}" alt="${user.username}" class="avatar">
      
      <div class="user-info">
        <h1>${user.display_name || user.username}</h1>
        <p class="username">@${user.username}</p>
        <p class="bio">${user.bio || 'No bio yet...'}</p>
        
        <div class="user-stats">
          <div class="stat">
            <div class="stat-number">${userImages.length}</div>
            <div class="stat-label">Images</div>
          </div>
          <div class="stat">
            <div class="stat-number">${new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}</div>
            <div class="stat-label">Joined</div>
          </div>
        </div>
      </div>
      
      ${isOwnProfile ? `
      <div class="actions">
        <button class="btn btn-primary" onclick="showEditModal()">Edit Profile</button>
        <a href="/" class="btn btn-primary">Upload Image</a>
      </div>
      ` : ''}
    </div>

    <div class="section">
      <h2 class="section-title">${isOwnProfile ? 'My Images' : user.display_name || user.username + "'s Images"}</h2>
      
      ${userImages.length > 0 ? `
        <div class="images-grid">
          ${imagesHtml}
        </div>
      ` : `
        <div class="empty-state">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          <p>${isOwnProfile ? 'No images uploaded yet' : 'No images'}</p>
          ${isOwnProfile ? `
          <p style="margin-top: 10px;">
            <a href="/" class="btn btn-primary">Upload Now</a>
          </p>
          ` : ''}
        </div>
      `}
    </div>
  </div>

  ${isOwnProfile ? `
  <!-- Edit Profile Modal -->
  <div id="editModal" class="modal">
    <div class="modal-content">
      <h2>Edit Profile</h2>
      
      <div id="modalMessage" style="display: none;"></div>
      
      <form id="editForm">
        <div class="form-group">
          <label for="displayName">Display Name</label>
          <input type="text" id="displayName" value="${user.display_name || ''}">
        </div>
        
        <div class="form-group">
          <label for="avatarUrl">Avatar URL</label>
          <input type="text" id="avatarUrl" value="${user.avatar_url || ''}">
        </div>
        
        <div class="form-group">
          <label for="bio">Bio (50 characters)</label>
          <textarea id="bio" maxlength="50">${user.bio || ''}</textarea>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="closeEditModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save</button>
        </div>
      </form>
    </div>
  </div>
  ` : ''}

  <script>
    const userId = ${user.id};
    
    ${isOwnProfile ? `
    function showEditModal() {
      document.getElementById('editModal').classList.add('show');
    }
    
    function closeEditModal() {
      document.getElementById('editModal').classList.remove('show');
    }
    
    const editForm = document.getElementById('editForm');
    if (editForm) {
      editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const displayName = document.getElementById('displayName').value;
        const avatarUrl = document.getElementById('avatarUrl').value;
        const bio = document.getElementById('bio').value;
        
        const messageBox = document.getElementById('modalMessage');
        
        try {
          const response = await fetch('/api/profile/update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ display_name: displayName, avatar_url: avatarUrl, bio })
          });
          
          const data = await response.json();
          
          if (data.success) {
            messageBox.className = 'message success';
            messageBox.textContent = 'Profile updated successfully! Refreshing...';
            messageBox.style.display = 'block';
            
            setTimeout(() => {
              location.reload();
            }, 1500);
          } else {
            messageBox.className = 'message error';
            messageBox.textContent = data.error || 'Update failed';
            messageBox.style.display = 'block';
          }
        } catch (error) {
          messageBox.className = 'message error';
          messageBox.textContent = 'Update failed, please check your network connection';
          messageBox.style.display = 'block';
        }
      });
    }
    
    async function logout() {
      if (confirm('Are you sure you want to logout?')) {
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
          window.location.href = '/login';
        } catch (error) {
          console.error('Logout error:', error);
          window.location.href = '/login';
        }
      }
    }
    
    // 点击模态框外部关闭
    const editModal = document.getElementById('editModal');
    if (editModal) {
      editModal.addEventListener('click', (e) => {
        if (e.target.id === 'editModal') {
          closeEditModal();
        }
      });
    }
    ` : ''}
  </script>
</body>
</html>`;
}

