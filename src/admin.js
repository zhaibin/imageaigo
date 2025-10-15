// 管理后台模块
import { escapeHtml } from './templates';

// 生成管理后台登录页面
export function buildAdminLoginPage() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>管理后台登录 - ImageAI Go</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .login-container {
      background: white;
      border-radius: 15px;
      padding: 40px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 {
      color: #333;
      margin-bottom: 10px;
      font-size: 1.8rem;
    }
    .subtitle {
      color: #666;
      margin-bottom: 30px;
      font-size: 0.9rem;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      color: #333;
      margin-bottom: 8px;
      font-weight: 500;
    }
    input[type="password"] {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e8e8e8;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s;
    }
    input[type="password"]:focus {
      outline: none;
      border-color: #667eea;
    }
    .btn {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }
    .btn:active {
      transform: translateY(0);
    }
    .error {
      background: #fee;
      color: #c33;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 20px;
      display: none;
    }
    .error.show {
      display: block;
    }
    .back-link {
      display: block;
      text-align: center;
      margin-top: 20px;
      color: #667eea;
      text-decoration: none;
      font-size: 0.9rem;
    }
    .back-link:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="login-container">
    <h1>🔐 管理后台</h1>
    <p class="subtitle">ImageAI Go Admin Panel</p>
    
    <div class="error" id="error"></div>
    
    <form id="loginForm">
      <div class="form-group">
        <label for="password">管理员密码</label>
        <input type="password" id="password" name="password" required autocomplete="current-password" placeholder="请输入管理员密码">
      </div>
      
      <button type="submit" class="btn">登录</button>
    </form>
    
    <a href="/" class="back-link">← 返回首页</a>
  </div>
  
  <script>
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const password = document.getElementById('password').value;
      const errorEl = document.getElementById('error');
      
      try {
        const response = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });
        
        const data = await response.json();
        
        if (data.success) {
          localStorage.setItem('adminToken', data.token);
          window.location.href = '/admin/dashboard';
        } else {
          errorEl.textContent = data.error || '登录失败';
          errorEl.classList.add('show');
        }
      } catch (error) {
        errorEl.textContent = '登录请求失败: ' + error.message;
        errorEl.classList.add('show');
      }
    });
  </script>
</body>
</html>`;
}

// 生成管理后台主页面
export function buildAdminDashboard() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>管理后台 - ImageAI Go</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f7fa;
      min-height: 100vh;
    }
    
    /* 导航栏 */
    .navbar {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .navbar h1 {
      font-size: 1.5rem;
    }
    .navbar .actions {
      display: flex;
      gap: 15px;
      align-items: center;
    }
    .navbar button {
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.3s;
    }
    .navbar button:hover {
      background: rgba(255,255,255,0.3);
    }
    
    /* 容器 */
    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 30px;
    }
    
    /* 统计卡片 */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat-card {
      background: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.2s;
    }
    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }
    .stat-card .icon {
      font-size: 2rem;
      margin-bottom: 10px;
    }
    .stat-card .label {
      color: #666;
      font-size: 0.9rem;
      margin-bottom: 8px;
    }
    .stat-card .value {
      color: #333;
      font-size: 2rem;
      font-weight: 700;
    }
    
    /* 标签页 */
    .tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      border-bottom: 2px solid #e8e8e8;
    }
    .tab {
      padding: 12px 24px;
      background: none;
      border: none;
      color: #666;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 500;
      border-bottom: 3px solid transparent;
      transition: all 0.3s;
    }
    .tab.active {
      color: #667eea;
      border-bottom-color: #667eea;
    }
    .tab:hover {
      color: #667eea;
    }
    
    /* 内容面板 */
    .tab-content {
      display: none;
    }
    .tab-content.active {
      display: block;
    }
    
    /* 表格 */
    .table-container {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .table-header {
      padding: 20px;
      border-bottom: 1px solid #e8e8e8;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .table-header h2 {
      color: #333;
      font-size: 1.2rem;
    }
    .search-box {
      padding: 8px 16px;
      border: 2px solid #e8e8e8;
      border-radius: 8px;
      font-size: 0.9rem;
      width: 250px;
    }
    .search-box:focus {
      outline: none;
      border-color: #667eea;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
    }
    thead {
      background: #f8f9fa;
    }
    th {
      padding: 15px;
      text-align: left;
      color: #666;
      font-weight: 600;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    td {
      padding: 15px;
      border-top: 1px solid #e8e8e8;
      color: #333;
    }
    tr:hover {
      background: #f8f9fa;
    }
    
    /* 图片预览 */
    .img-preview {
      width: 80px;
      height: 80px;
      object-fit: cover;
      border-radius: 8px;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .img-preview:hover {
      transform: scale(1.1);
    }
    
    /* 按钮 */
    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.2s;
    }
    .btn-primary {
      background: #667eea;
      color: white;
    }
    .btn-primary:hover {
      background: #5568d3;
    }
    .btn-danger {
      background: #e74c3c;
      color: white;
    }
    .btn-danger:hover {
      background: #c0392b;
    }
    .btn-small {
      padding: 6px 12px;
      font-size: 0.85rem;
    }
    
    /* 标签 */
    .tag {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.75rem;
      background: #e0e7ff;
      color: #4338ca;
      margin-right: 5px;
    }
    
    /* 加载动画 */
    .loading {
      text-align: center;
      padding: 40px;
      color: #666;
    }
    .spinner {
      border: 3px solid #f3f3f3;
      border-top: 3px solid #667eea;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 15px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    /* 分页 */
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 10px;
      margin-top: 20px;
      padding: 20px;
    }
    .pagination button {
      padding: 8px 16px;
      border: 1px solid #e8e8e8;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .pagination button:hover:not(:disabled) {
      background: #667eea;
      color: white;
      border-color: #667eea;
    }
    .pagination button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .pagination .page-info {
      color: #666;
      font-size: 0.9rem;
    }
    
    /* 模态框 */
    .modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.7);
      z-index: 1000;
      align-items: center;
      justify-content: center;
    }
    .modal.show {
      display: flex;
    }
    .modal-content {
      background: white;
      border-radius: 12px;
      padding: 30px;
      max-width: 500px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .modal-header h2 {
      color: #333;
    }
    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #666;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background 0.2s;
    }
    .close-btn:hover {
      background: #f0f0f0;
    }
    
    /* 响应式 */
    @media (max-width: 768px) {
      .container {
        padding: 15px;
      }
      .stats-grid {
        grid-template-columns: 1fr;
      }
      .table-container {
        overflow-x: auto;
      }
      table {
        min-width: 600px;
      }
    }
  </style>
</head>
<body>
  <div class="navbar">
    <h1>🎨 ImageAI Go 管理后台</h1>
    <div class="actions">
      <span id="adminInfo"></span>
      <button onclick="window.location.href='/'">前台首页</button>
      <button onclick="logout()">退出登录</button>
    </div>
  </div>
  
  <div class="container">
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="icon">🖼️</div>
        <div class="label">总图片数</div>
        <div class="value" id="totalImages">-</div>
      </div>
      <div class="stat-card">
        <div class="icon">🏷️</div>
        <div class="label">总标签数</div>
        <div class="value" id="totalTags">-</div>
      </div>
      <div class="stat-card">
        <div class="icon">❤️</div>
        <div class="label">总点赞数</div>
        <div class="value" id="totalLikes">-</div>
      </div>
      <div class="stat-card">
        <div class="icon">📊</div>
        <div class="label">今日上传</div>
        <div class="value" id="todayUploads">-</div>
      </div>
    </div>
    
    <!-- 标签页 -->
    <div class="tabs">
      <button class="tab active" onclick="switchTab('images')">图片管理</button>
      <button class="tab" onclick="switchTab('tags')">标签管理</button>
      <button class="tab" onclick="switchTab('system')">系统管理</button>
    </div>
    
    <!-- 图片管理 -->
    <div id="images-tab" class="tab-content active">
      <div class="table-container">
        <div class="table-header">
          <h2>图片列表</h2>
          <div style="display: flex; gap: 10px; align-items: center;">
            <input type="search" class="search-box" id="imageSearch" placeholder="搜索描述或ID...">
            <button onclick="showBatchUpload()" style="background: #667eea; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 500; white-space: nowrap;">
              📤 批量上传
            </button>
          </div>
        </div>
        <div id="imagesContent">
          <div class="loading">
            <div class="spinner"></div>
            <p>加载中...</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 标签管理 -->
    <div id="tags-tab" class="tab-content">
      <div class="table-container">
        <div class="table-header">
          <h2>标签列表</h2>
          <input type="search" class="search-box" id="tagSearch" placeholder="搜索标签...">
        </div>
        <div id="tagsContent">
          <div class="loading">
            <div class="spinner"></div>
            <p>加载中...</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 系统管理 -->
    <div id="system-tab" class="tab-content">
      <div class="table-container">
        <div class="table-header">
          <h2>系统管理</h2>
        </div>
        <div style="padding: 30px;">
          <h3 style="margin-bottom: 20px; color: #333;">🌐 Unsplash 同步</h3>
          <p style="color: #666; margin-bottom: 20px;">从 Unsplash 自动同步最新的免费高质量图片</p>
          
          <div style="display: grid; gap: 15px; max-width: 500px; margin-bottom: 40px;">
            <button class="btn" style="background: #667eea;" onclick="triggerUnsplashSync()">
              🔄 立即同步 Unsplash 图片
            </button>
            <div style="background: #f8f9ff; padding: 15px; border-radius: 8px; font-size: 0.9rem; color: #666;">
              <strong>说明：</strong>
              <ul style="margin: 10px 0 0 20px; line-height: 1.8;">
                <li>每次同步 10 张最新图片</li>
                <li>自动 AI 分析和标签</li>
                <li>重复图片自动跳过</li>
                <li>每天凌晨 00:00 UTC 自动同步</li>
              </ul>
            </div>
          </div>
          <div id="unsplashSyncResult" style="display: none; padding: 15px; border-radius: 8px; margin-bottom: 20px;"></div>
          
          <h3 style="margin-bottom: 20px; color: #333;">🗑️ 数据清理</h3>
          <p style="color: #666; margin-bottom: 20px;">⚠️ 警告：以下操作不可逆，请谨慎操作！</p>
          
          <div style="display: grid; gap: 15px; max-width: 500px;">
            <button class="btn btn-danger" onclick="cleanupR2()">
              🗑️ 清空 R2 图片存储
            </button>
            <button class="btn btn-danger" onclick="cleanupCache()">
              🧹 清空 KV 缓存
            </button>
            <button class="btn btn-danger" onclick="cleanupDatabase()">
              🗄️ 清空数据库
            </button>
            <button class="btn btn-danger" onclick="cleanupAll()">
              ⚠️ 清空所有数据（R2 + Cache + Database）
            </button>
          </div>
          
          <div id="cleanupResult" style="margin-top: 20px; padding: 15px; border-radius: 8px; display: none;"></div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 图片详情模态框 -->
  <div id="imageModal" class="modal">
    <div class="modal-content" style="max-width: 800px;">
      <div class="modal-header">
        <h2>图片详情</h2>
        <button class="close-btn" onclick="closeModal('imageModal')">&times;</button>
      </div>
      <div id="imageModalContent"></div>
    </div>
  </div>
  
  <!-- 批量上传模态框 -->
  <!-- 批量处理进度监控 -->
  <div id="batchProgressPanel" style="position: fixed; top: 80px; right: 20px; width: 350px; background: white; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.15); z-index: 9999; display: none;">
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #eee; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0; color: white; cursor: pointer;" onclick="toggleProgressPanel()">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 1.2rem;">⚙️</span>
        <span style="font-weight: 600;">处理任务</span>
        <span id="taskCountBadge" style="background: rgba(255,255,255,0.3); padding: 2px 8px; border-radius: 12px; font-size: 0.85rem;">0</span>
      </div>
      <span id="panelToggleIcon">▼</span>
    </div>
    <div id="progressPanelContent" style="max-height: 400px; overflow-y: auto;">
      <!-- 进度内容会动态插入这里 -->
    </div>
  </div>

  <div id="batchUploadModal" class="modal">
    <div class="modal-content" style="max-width: 600px;">
      <div class="modal-header">
        <h2>📤 批量上传图片</h2>
        <button class="close-btn" onclick="closeModal('batchUploadModal')">&times;</button>
      </div>
      <div style="padding: 20px;">
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px; color: #856404;">
          <strong>提示：</strong>
          <ul style="margin: 10px 0 0 20px; line-height: 1.8;">
            <li>支持批量上传，无数量限制</li>
            <li>每张图片最大 20MB</li>
            <li>上传后会在后台异步分析</li>
            <li>重复图片会自动跳过</li>
            <li>分析失败会自动重试3次</li>
            <li>右上角可查看实时处理进度</li>
          </ul>
        </div>
        
        <div id="batchDropZone" style="border: 3px dashed #667eea; border-radius: 12px; padding: 40px; text-align: center; background: #f8f9ff; margin-bottom: 20px; transition: all 0.3s;">
          <input type="file" id="batchFileInput" multiple accept="image/*" style="display: none;" onchange="handleBatchFilesSelected(event)">
          <button onclick="document.getElementById('batchFileInput').click()" style="background: #667eea; color: white; border: none; padding: 15px 30px; border-radius: 8px; cursor: pointer; font-size: 1rem; font-weight: 600;">
            选择图片
          </button>
          <p style="color: #666; margin-top: 15px;">或拖拽图片到此处</p>
        </div>
        
        <div id="batchFilesList" style="margin-bottom: 20px;"></div>
        
        <div id="batchUploadProgress" style="display: none; background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <div style="color: #667eea; font-weight: 600;">上传处理中...</div>
            <button id="closeProgressBtn" onclick="closeUploadProgress()" style="background: #667eea; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; display: none;">
              后台处理
            </button>
          </div>
          <div id="batchProgressText"></div>
          <p style="color: #999; font-size: 0.85rem; margin-top: 10px;">💡 提示：可以关闭此窗口，图片会在后台继续处理</p>
        </div>
        
        <button id="uploadBatchBtn" onclick="uploadBatch()" disabled style="width: 100%; background: #667eea; color: white; border: none; padding: 15px; border-radius: 8px; cursor: pointer; font-size: 1rem; font-weight: 600;">
          开始上传
        </button>
      </div>
    </div>
  </div>
  
  <script>
    const API_BASE = '';
    let currentPage = 1;
    let currentTab = 'images';
    
    // 检查认证
    function checkAuth() {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        window.location.href = '/admin/login';
        return false;
      }
      return token;
    }
    
    // 退出登录
    function logout() {
      localStorage.removeItem('adminToken');
      window.location.href = '/admin/login';
    }
    
    // API 请求
    async function apiRequest(url, options = {}) {
      const token = checkAuth();
      if (!token) return null;
      
      const headers = {
        'Authorization': 'Bearer ' + token,
        ...options.headers
      };
      
      try {
        const response = await fetch(url, { ...options, headers });
        if (response.status === 401) {
          logout();
          return null;
        }
        return await response.json();
      } catch (error) {
        console.error('API Error:', error);
        alert('请求失败: ' + error.message);
        return null;
      }
    }
    
    // 加载统计数据
    async function loadStats() {
      const data = await apiRequest('/api/admin/stats');
      if (data) {
        document.getElementById('totalImages').textContent = data.totalImages || 0;
        document.getElementById('totalTags').textContent = data.totalTags || 0;
        document.getElementById('totalLikes').textContent = data.totalLikes || 0;
        document.getElementById('todayUploads').textContent = data.todayUploads || 0;
      }
    }
    
    // 加载图片列表
    async function loadImages(page = 1, search = '') {
      const content = document.getElementById('imagesContent');
      content.innerHTML = '<div class="loading"><div class="spinner"></div><p>加载中...</p></div>';
      
      let url = \`/api/admin/images?page=\${page}&limit=20\`;
      if (search) url += \`&search=\${encodeURIComponent(search)}\`;
      
      const data = await apiRequest(url);
      if (!data) return;
      
      currentPage = page;
      
      if (data.images.length === 0) {
        content.innerHTML = '<div style="padding: 40px; text-align: center; color: #666;">暂无图片</div>';
        return;
      }
      
      const tableHTML = \`
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>预览</th>
              <th>描述</th>
              <th>尺寸</th>
              <th>点赞</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            \${data.images.map(img => \`
              <tr>
                <td>#\${img.id}</td>
                <td><img src="\${img.image_url}" class="img-preview" onclick="showImageDetail(\${img.id})" /></td>
                <td style="max-width: 300px;">\${escapeHtml(img.description || '-').substring(0, 100)}</td>
                <td>\${img.width && img.height ? \`\${img.width}×\${img.height}\` : '-'}</td>
                <td>❤️ \${img.likes_count || 0}</td>
                <td>\${new Date(img.created_at).toLocaleString('zh-CN')}</td>
                <td>
                  <button class="btn btn-small btn-primary" onclick="viewImage('\${img.slug}')">查看</button>
                  <button class="btn btn-small btn-danger" onclick="deleteImage(\${img.id})">删除</button>
                </td>
              </tr>
            \`).join('')}
          </tbody>
        </table>
        <div class="pagination">
          <button onclick="loadImages(\${page - 1})" \${page <= 1 ? 'disabled' : ''}>上一页</button>
          <span class="page-info">第 \${page} 页</span>
          <button onclick="loadImages(\${page + 1})" \${!data.hasMore ? 'disabled' : ''}>下一页</button>
        </div>
      \`;
      
      content.innerHTML = tableHTML;
    }
    
    // 查看图片
    function viewImage(slug) {
      window.open(\`/image/\${slug}\`, '_blank');
    }
    
    // 显示图片详情
    async function showImageDetail(imageId) {
      const data = await apiRequest(\`/api/admin/image/\${imageId}\`);
      if (!data) return;
      
      const img = data.image;
      const tags = data.tags || [];
      
      const modalContent = \`
        <div style="margin-bottom: 20px;">
          <img src="\${img.image_url}" style="width: 100%; border-radius: 8px;" />
        </div>
        <div style="margin-bottom: 15px;">
          <strong>ID:</strong> #\${img.id}
        </div>
        <div style="margin-bottom: 15px;">
          <strong>Slug:</strong> \${img.slug}
        </div>
        <div style="margin-bottom: 15px;">
          <strong>描述:</strong><br/>\${escapeHtml(img.description || '-')}
        </div>
        <div style="margin-bottom: 15px;">
          <strong>尺寸:</strong> \${img.width}×\${img.height}
        </div>
        <div style="margin-bottom: 15px;">
          <strong>点赞数:</strong> ❤️ \${img.likes_count || 0}
        </div>
        <div style="margin-bottom: 15px;">
          <strong>创建时间:</strong> \${new Date(img.created_at).toLocaleString('zh-CN')}
        </div>
        <div style="margin-bottom: 15px;">
          <strong>标签:</strong><br/>
          <div style="margin-top: 8px;">
            \${tags.map(tag => \`<span class="tag">\${escapeHtml(tag.name)} (L\${tag.level})</span>\`).join('')}
          </div>
        </div>
        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <button class="btn btn-primary" onclick="viewImage('\${img.slug}')">前台查看</button>
          <button class="btn btn-danger" onclick="deleteImage(\${img.id}); closeModal('imageModal');">删除图片</button>
        </div>
      \`;
      
      document.getElementById('imageModalContent').innerHTML = modalContent;
      document.getElementById('imageModal').classList.add('show');
    }
    
    // 删除图片
    async function deleteImage(imageId) {
      if (!confirm('确定要删除这张图片吗？此操作不可逆！')) return;
      
      const result = await apiRequest(\`/api/admin/image/\${imageId}\`, { method: 'DELETE' });
      if (result && result.success) {
        alert('删除成功');
        loadImages(currentPage);
        loadStats();
      }
    }
    
    // 加载标签列表
    async function loadTags(search = '') {
      const content = document.getElementById('tagsContent');
      content.innerHTML = '<div class="loading"><div class="spinner"></div><p>加载中...</p></div>';
      
      let url = '/api/admin/tags';
      if (search) url += \`?search=\${encodeURIComponent(search)}\`;
      
      const data = await apiRequest(url);
      if (!data) return;
      
      if (data.tags.length === 0) {
        content.innerHTML = '<div style="padding: 40px; text-align: center; color: #666;">暂无标签</div>';
        return;
      }
      
      const tableHTML = \`
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>标签名称</th>
              <th>级别</th>
              <th>使用次数</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            \${data.tags.map(tag => \`
              <tr>
                <td>#\${tag.id}</td>
                <td>\${escapeHtml(tag.name)}</td>
                <td>Level \${tag.level}</td>
                <td>\${tag.usage_count || 0} 次</td>
                <td>
                  <button class="btn btn-small btn-primary" onclick="viewTag('\${encodeURIComponent(tag.name)}')">查看图片</button>
                  <button class="btn btn-small btn-danger" onclick="deleteTag(\${tag.id})">删除</button>
                </td>
              </tr>
            \`).join('')}
          </tbody>
        </table>
      \`;
      
      content.innerHTML = tableHTML;
    }
    
    // 查看标签
    function viewTag(tagName) {
      window.open(\`/tag/\${tagName}\`, '_blank');
    }
    
    // 删除标签
    async function deleteTag(tagId) {
      if (!confirm('确定要删除这个标签吗？此操作不可逆！')) return;
      
      const result = await apiRequest(\`/api/admin/tag/\${tagId}\`, { method: 'DELETE' });
      if (result && result.success) {
        alert('删除成功');
        loadTags();
        loadStats();
      }
    }
    
    // 系统清理
    // Unsplash 同步功能
    async function triggerUnsplashSync() {
      const resultEl = document.getElementById('unsplashSyncResult');
      resultEl.textContent = '正在同步 Unsplash 图片...';
      resultEl.style.display = 'block';
      resultEl.style.background = '#fff3cd';
      resultEl.style.color = '#856404';
      
      try {
        const result = await apiRequest('/api/admin/unsplash-sync', {
          method: 'POST'
        });
        
        if (result && result.success) {
          resultEl.innerHTML = \`
            <strong>✅ 同步启动成功！</strong><br>
            <div style="margin-top: 10px; line-height: 1.8;">
              • 已入队: \${result.queued || 0} 张<br>
              • 跳过: \${result.skipped || 0} 张（重复）<br>
              • 失败: \${result.failed || 0} 张<br>
              • 总计: \${result.total || 0} 张<br>
              <br>
              💡 图片正在队列中后台处理，请稍后刷新查看
            </div>
          \`;
          resultEl.style.background = '#d4edda';
          resultEl.style.color = '#155724';
          
          // 5秒后刷新统计和图片列表
          setTimeout(() => {
            loadStats();
            loadImages(1);
          }, 5000);
        } else {
          resultEl.textContent = '❌ 同步失败: ' + (result?.error || '未知错误');
          resultEl.style.background = '#f8d7da';
          resultEl.style.color = '#721c24';
        }
      } catch (error) {
        console.error('Unsplash sync error:', error);
        resultEl.textContent = '❌ 同步失败: ' + error.message;
        resultEl.style.background = '#f8d7da';
        resultEl.style.color = '#721c24';
      }
    }
    
    async function cleanupR2() {
      if (!confirm('⚠️ 确定要清空所有 R2 图片存储吗？此操作不可逆！')) return;
      await performCleanup('r2');
    }
    
    async function cleanupCache() {
      if (!confirm('确定要清空 KV 缓存吗？')) return;
      await performCleanup('cache');
    }
    
    async function cleanupDatabase() {
      if (!confirm('⚠️ 确定要清空数据库吗？此操作不可逆！')) return;
      if (!confirm('最后确认：真的要删除所有数据库记录吗？')) return;
      await performCleanup('database');
    }
    
    async function cleanupAll() {
      if (!confirm('⚠️⚠️⚠️ 确定要清空所有数据吗？包括 R2 存储、缓存和数据库，此操作不可逆！')) return;
      if (!confirm('最后确认：真的要删除所有数据吗？')) return;
      await performCleanup('all');
    }
    
    async function performCleanup(action) {
      const resultEl = document.getElementById('cleanupResult');
      resultEl.textContent = '清理中...';
      resultEl.style.display = 'block';
      resultEl.style.background = '#fff3cd';
      resultEl.style.color = '#856404';
      
      try {
        const result = await apiRequest('/api/cleanup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action })
        });
        
        if (result && result.success) {
          let message = '✅ 清理成功！';
          if (result.deleted.r2 > 0) {
            message += \` R2: \${result.deleted.r2} 个文件\`;
          }
          if (result.deleted.cache > 0) {
            message += \` | Cache: \${result.deleted.cache} 个键\`;
          }
          if (result.deleted.database) {
            message += \` | Database: \${result.deleted.database}\`;
          }
          
          resultEl.textContent = message;
          resultEl.style.background = '#d4edda';
          resultEl.style.color = '#155724';
          
          // 刷新统计数据
          loadStats();
          
          // 如果清理了数据库，刷新图片列表
          if (action === 'database' || action === 'all') {
            loadImages(1);
          }
        } else {
          resultEl.textContent = '❌ 清理失败: ' + (result?.error || '未知错误');
          resultEl.style.background = '#f8d7da';
          resultEl.style.color = '#721c24';
        }
      } catch (error) {
        console.error('Cleanup error:', error);
        resultEl.textContent = '❌ 清理失败: ' + error.message;
        resultEl.style.background = '#f8d7da';
        resultEl.style.color = '#721c24';
      }
    }
    
    // 切换标签页
    function switchTab(tab) {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      event.target.classList.add('active');
      document.getElementById(tab + '-tab').classList.add('active');
      
      currentTab = tab;
      
      if (tab === 'images') loadImages();
      else if (tab === 'tags') loadTags();
    }
    
    // 关闭模态框
    function closeModal(modalId) {
      document.getElementById(modalId).classList.remove('show');
    }
    
    // HTML 转义
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
    
    // 搜索
    document.getElementById('imageSearch')?.addEventListener('input', (e) => {
      clearTimeout(window.searchTimeout);
      window.searchTimeout = setTimeout(() => {
        loadImages(1, e.target.value);
      }, 500);
    });
    
    document.getElementById('tagSearch')?.addEventListener('input', (e) => {
      clearTimeout(window.searchTimeout);
      window.searchTimeout = setTimeout(() => {
        loadTags(e.target.value);
      }, 500);
    });
    
    // 初始化
    window.addEventListener('DOMContentLoaded', () => {
      if (!checkAuth()) return;
      loadStats();
      loadImages();
    });
    
    // 批量上传功能
    let batchFiles = [];
    let isUploading = false;
    let progressPollInterval = null;
    let isPanelCollapsed = false;
    
    function showBatchUpload() {
      batchFiles = [];
      isUploading = false;
      document.getElementById('batchFilesList').innerHTML = '';
      document.getElementById('uploadBatchBtn').disabled = true;
      document.getElementById('batchUploadProgress').style.display = 'none';
      document.getElementById('batchUploadModal').classList.add('show');
      
      // 设置拖拽事件
      setupBatchDragDrop();
    }
    
    function setupBatchDragDrop() {
      const dropZone = document.getElementById('batchDropZone');
      if (!dropZone) return;
      
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
      });
      
      function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
          dropZone.style.background = '#e8f0fe';
          dropZone.style.borderColor = '#4285f4';
          dropZone.style.transform = 'scale(1.02)';
        });
      });
      
      ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
          dropZone.style.background = '#f8f9ff';
          dropZone.style.borderColor = '#667eea';
          dropZone.style.transform = 'scale(1)';
        });
      });
      
      dropZone.addEventListener('drop', (e) => {
        const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
        
        if (files.length === 0) {
          alert('请拖拽图片文件');
          return;
        }
        
        // 模拟文件选择事件
        batchFiles = files;
        displayBatchFiles();
      });
    }
    
    function displayBatchFiles() {
      const listHtml = batchFiles.map((file, index) => \`
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: white; border-radius: 6px; margin-bottom: 8px;">
          <div>
            <strong>\${file.name}</strong>
            <span style="color: #666; margin-left: 10px;">\${(file.size / 1024 / 1024).toFixed(2)} MB</span>
          </div>
          <button onclick="removeBatchFile(\${index})" style="background: #e74c3c; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer;">
            删除
          </button>
        </div>
      \`).join('');
      
      document.getElementById('batchFilesList').innerHTML = listHtml;
      document.getElementById('uploadBatchBtn').disabled = batchFiles.length === 0;
    }
    
    function handleBatchFilesSelected(event) {
      const files = Array.from(event.target.files);
      
      batchFiles = files;
      displayBatchFiles();
    }
    
    function removeBatchFile(index) {
      batchFiles.splice(index, 1);
      displayBatchFiles();
    }
    
    function closeUploadProgress() {
      // 关闭模态框但不中断上传
      closeModal('batchUploadModal');
      isUploading = false;
      
      // 显示通知
      const notification = document.createElement('div');
      notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #667eea; color: white; padding: 15px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 10000;';
      notification.innerHTML = '✅ 图片正在后台处理中，请稍后刷新页面查看';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s';
        setTimeout(() => notification.remove(), 300);
      }, 5000);
    }
    
    async function uploadBatch() {
      if (batchFiles.length === 0) return;
      
      const progressEl = document.getElementById('batchUploadProgress');
      const progressText = document.getElementById('batchProgressText');
      const uploadBtn = document.getElementById('uploadBatchBtn');
      const closeProgressBtn = document.getElementById('closeProgressBtn');
      
      isUploading = true;
      progressEl.style.display = 'block';
      uploadBtn.disabled = true;
      
      try {
        const formData = new FormData();
        batchFiles.forEach((file, index) => {
          formData.append(\`file_\${index}\`, file);
        });
        
        progressText.innerHTML = \`
          <div style="margin-bottom: 10px;">
            正在上传 \${batchFiles.length} 张图片到服务器...
          </div>
          <div style="color: #666; font-size: 0.9rem;">
            📤 准备上传文件
          </div>
        \`;
        
        const result = await apiRequest('/api/admin/batch-upload', {
          method: 'POST',
          body: formData
        });
        
        if (result && result.success) {
          progressText.innerHTML = \`
            <div style="color: #28a745; font-weight: 600; margin-bottom: 10px;">✅ 上传成功！</div>
            <div style="color: #666; line-height: 1.6;">
              • 已提交 \${result.count} 张图片进行后台 AI 分析<br>
              • 预计处理时间：2-5 分钟<br>
              • 您可以关闭此窗口，处理会在后台继续<br>
              • 完成后刷新页面即可查看新图片
            </div>
          \`;
          
          // 显示关闭按钮
          closeProgressBtn.style.display = 'inline-block';
          
          // 开始监控进度
          startProgressMonitoring();
          
          // 10秒后自动关闭（给用户足够时间看到消息）
          setTimeout(() => {
            if (isUploading) {
              closeUploadProgress();
            }
          }, 10000);
        } else {
          isUploading = false;
          progressText.innerHTML = \`
            <div style="color: #e74c3c;">❌ 上传失败: \${result?.error || '未知错误'}</div>
          \`;
          uploadBtn.disabled = false;
        }
      } catch (error) {
        isUploading = false;
        progressText.innerHTML = \`
          <div style="color: #e74c3c;">❌ 上传失败: \${error.message}</div>
        \`;
        uploadBtn.disabled = false;
      }
    }
    
    // 进度监控相关函数
    function startProgressMonitoring() {
      if (progressPollInterval) return; // 避免重复启动
      
      // 立即查询一次
      updateProgressPanel();
      
      // 每5秒轮询一次
      progressPollInterval = setInterval(updateProgressPanel, 5000);
    }
    
    function stopProgressMonitoring() {
      if (progressPollInterval) {
        clearInterval(progressPollInterval);
        progressPollInterval = null;
      }
    }
    
    async function updateProgressPanel() {
      try {
        const result = await apiRequest('/api/admin/batch-status');
        
        if (result && result.batches && result.batches.length > 0) {
          // 显示进度面板
          document.getElementById('batchProgressPanel').style.display = 'block';
          document.getElementById('taskCountBadge').textContent = result.batches.length;
          
          // 渲染进度内容
          const content = result.batches.map(batch => renderBatchProgress(batch)).join('');
          document.getElementById('progressPanelContent').innerHTML = content;
        } else {
          // 没有进行中的任务，隐藏面板并停止轮询
          document.getElementById('batchProgressPanel').style.display = 'none';
          stopProgressMonitoring();
        }
      } catch (error) {
        console.error('Failed to update progress:', error);
      }
    }
    
    function renderBatchProgress(batch) {
      const progress = batch.total > 0 ? Math.round((batch.completed / batch.total) * 100) : 0;
      const elapsedTime = Math.round((Date.now() - batch.startTime) / 1000);
      const minutes = Math.floor(elapsedTime / 60);
      const seconds = elapsedTime % 60;
      
      // 计算已处理数量（成功 + 跳过 + 失败）
      const processed = (batch.completed || 0) + (batch.skipped || 0) + (batch.failed || 0);
      const processedProgress = batch.total > 0 ? Math.round((processed / batch.total) * 100) : 0;
      
      // 检测是否疑似卡死
      const isStuck = batch.possiblyStuck || false;
      const stuckWarning = isStuck ? \`
        <div style="background: #fff3cd; padding: 8px; border-radius: 6px; margin-bottom: 10px; font-size: 0.8rem; color: #856404;">
          ⚠️ 超过 \${batch.inactiveSeconds}秒 无响应，可能卡死
        </div>
      \` : '';
      
      // 显示当前处理的文件
      const currentFileInfo = batch.currentFile ? \`
        <div style="font-size: 0.75rem; color: #999; margin-top: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          正在处理: \${batch.currentFile}
        </div>
      \` : '';
      
      // 判断批次类型
      const isUnsplash = batch.sourceType === 'unsplash' || batch.batchId.startsWith('unsplash_');
      const batchTypeIcon = isUnsplash ? '🌐' : '📤';
      const batchTypeName = isUnsplash ? 'Unsplash' : '批次';
      
      return \`
        <div style="padding: 15px; border-bottom: 1px solid #eee; \${isStuck ? 'background: #fff9e6;' : ''}">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <div style="font-weight: 600; color: #333; font-size: 0.9rem;">
              \${batchTypeIcon} \${batchTypeName} #\${batch.batchId.split('_')[1]} (\${batch.total} 张)
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="color: #666; font-size: 0.85rem;">
                \${minutes}:\${seconds.toString().padStart(2, '0')}
              </span>
              <button onclick="cancelBatch('\${batch.batchId}')" style="background: #e74c3c; color: white; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 0.75rem; font-weight: 500;">
                取消
              </button>
            </div>
          </div>
          
          \${stuckWarning}
          
          <div style="margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #666; margin-bottom: 5px;">
              <span>已处理 \${processed} / \${batch.total}</span>
              <span>\${processedProgress}%</span>
            </div>
            <div style="width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden;">
              <div style="width: \${processedProgress}%; height: 100%; background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); transition: width 0.3s;"></div>
            </div>
          </div>
          
          <div style="display: flex; flex-wrap: wrap; gap: 12px; font-size: 0.8rem; color: #666; line-height: 1.8;">
            <span style="display: flex; align-items: center; gap: 4px;">
              <span style="color: #28a745;">✅</span> 
              <span>成功 \${batch.completed || 0}</span>
            </span>
            \${(batch.skipped || 0) > 0 ? \`
              <span style="display: flex; align-items: center; gap: 4px;">
                <span style="color: #ffc107;">⏭️</span>
                <span>重复 \${batch.skipped}</span>
              </span>
            \` : ''}
            \${(batch.failed || 0) > 0 ? \`
              <span style="display: flex; align-items: center; gap: 4px;">
                <span style="color: #e74c3c;">❌</span>
                <span>失败 \${batch.failed}</span>
              </span>
            \` : ''}
            \${(batch.processing || 0) > 0 ? \`
              <span style="display: flex; align-items: center; gap: 4px;">
                <span style="color: #667eea;">⚙️</span>
                <span>处理中 \${batch.processing}</span>
              </span>
            \` : ''}
          </div>
          
          \${currentFileInfo}
        </div>
      \`;
    }
    
    async function cancelBatch(batchId) {
      if (!confirm('确定要取消这个批次吗？已处理的图片不会受影响。')) {
        return;
      }
      
      try {
        const result = await apiRequest('/api/admin/batch-cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ batchId })
        });
        
        if (result && result.success) {
          alert('✅ 批次已取消');
          // 立即更新进度面板
          updateProgressPanel();
        } else {
          alert('❌ 取消失败: ' + (result?.error || '未知错误'));
        }
      } catch (error) {
        console.error('Cancel batch error:', error);
        alert('❌ 取消失败: ' + error.message);
      }
    }
    
    function toggleProgressPanel() {
      const content = document.getElementById('progressPanelContent');
      const icon = document.getElementById('panelToggleIcon');
      
      isPanelCollapsed = !isPanelCollapsed;
      
      if (isPanelCollapsed) {
        content.style.display = 'none';
        icon.textContent = '▶';
      } else {
        content.style.display = 'block';
        icon.textContent = '▼';
      }
    }
    
    // 页面加载时检查是否有进行中的任务
    window.addEventListener('DOMContentLoaded', () => {
      startProgressMonitoring();
    });
    
    // 页面关闭保护
    window.addEventListener('beforeunload', (e) => {
      if (isUploading) {
        e.preventDefault();
        e.returnValue = '图片正在后台处理中，确定要离开吗？';
        return e.returnValue;
      }
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        // 如果正在上传，提示用户
        if (e.target.id === 'batchUploadModal' && isUploading) {
          if (!confirm('图片正在处理中，关闭窗口不会中断后台处理。确定关闭吗？')) {
            return;
          }
          isUploading = false;
        }
        e.target.classList.remove('show');
      }
    });
  </script>
</body>
</html>`;
}

