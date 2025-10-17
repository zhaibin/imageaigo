/**
 * User Authentication Pages
 * Includes Login, Register, Forgot Password, Reset Password pages
 */

/**
 * Build Login Page
 */
export function buildLoginPage(message = '', error = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login - ImageAI Go</title>
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
      max-width: 450px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .logo {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo h1 {
      color: #667eea;
      font-size: 2rem;
      margin-bottom: 10px;
    }
    .logo p {
      color: #666;
      font-size: 0.9rem;
    }
    h2 {
      color: #333;
      margin-bottom: 20px;
      font-size: 1.5rem;
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
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      color: #333;
      margin-bottom: 8px;
      font-weight: 500;
      font-size: 0.95rem;
    }
    input[type="email"],
    input[type="password"] {
      width: 100%;
      padding: 12px 15px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.3s;
    }
    input[type="email"]:focus,
    input[type="password"]:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    .btn {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      margin-top: 10px;
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }
    .btn:active {
      transform: translateY(0);
    }
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
    .links {
      margin-top: 20px;
      text-align: center;
    }
    .links a {
      color: #667eea;
      text-decoration: none;
      font-size: 0.9rem;
      transition: color 0.3s;
    }
    .links a:hover {
      color: #764ba2;
      text-decoration: underline;
    }
    .divider {
      margin: 15px 0;
      color: #999;
    }
    .spinner {
      display: none;
      width: 20px;
      height: 20px;
      border: 3px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .loading .spinner { display: block; }
    .loading .btn-text { display: none; }
  </style>
</head>
<body>
  <div class="login-container">
    <div class="logo">
      <h1>🎨 ImageAI Go</h1>
      <p>AI-Powered Image Analysis</p>
    </div>
    
    <h2>Login</h2>
    
    ${message ? `<div class="message success">${message}</div>` : ''}
    ${error ? `<div class="message error">${error}</div>` : ''}
    <div id="messageBox" style="display: none;"></div>
    
    <form id="loginForm">
      <div class="form-group">
        <label for="email">Email Address</label>
        <input type="email" id="email" name="email" required autocomplete="email">
      </div>
      
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" required autocomplete="current-password">
      </div>
      
      <button type="submit" class="btn" id="submitBtn">
        <span class="btn-text">Login</span>
        <div class="spinner"></div>
      </button>
    </form>
    
    <div class="links">
      <a href="/register">Don't have an account? Sign up</a>
      <div class="divider">|</div>
      <a href="/forgot-password">Forgot Password?</a>
      <div class="divider">|</div>
      <a href="/">Back to Home</a>
    </div>
  </div>

  <script>
    const form = document.getElementById('loginForm');
    const submitBtn = document.getElementById('submitBtn');
    const messageBox = document.getElementById('messageBox');
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      submitBtn.disabled = true;
      submitBtn.classList.add('loading');
      messageBox.style.display = 'none';
      
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
          messageBox.className = 'message success';
          messageBox.textContent = 'Login successful! Redirecting...';
          messageBox.style.display = 'block';
          
          setTimeout(() => {
            window.location.href = '/';
          }, 1000);
        } else {
          messageBox.className = 'message error';
          messageBox.textContent = data.error || 'Login failed';
          messageBox.style.display = 'block';
          submitBtn.disabled = false;
          submitBtn.classList.remove('loading');
        }
      } catch (error) {
        messageBox.className = 'message error';
        messageBox.textContent = 'Login failed. Please check your network connection';
        messageBox.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
      }
    });
  </script>
</body>
</html>`;
}

/**
 * Build Register Page
 */
export function buildRegisterPage(message = '', error = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign Up - ImageAI Go</title>
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
    .register-container {
      background: white;
      border-radius: 15px;
      padding: 40px;
      width: 100%;
      max-width: 450px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .logo {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo h1 {
      color: #667eea;
      font-size: 2rem;
      margin-bottom: 10px;
    }
    .logo p {
      color: #666;
      font-size: 0.9rem;
    }
    h2 {
      color: #333;
      margin-bottom: 20px;
      font-size: 1.5rem;
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
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      color: #333;
      margin-bottom: 8px;
      font-weight: 500;
      font-size: 0.95rem;
    }
    input[type="email"],
    input[type="password"],
    input[type="text"] {
      width: 100%;
      padding: 12px 15px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.3s;
    }
    input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    .hint {
      font-size: 0.85rem;
      color: #666;
      margin-top: 5px;
    }
    .btn {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      margin-top: 10px;
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }
    .btn:active {
      transform: translateY(0);
    }
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
    .links {
      margin-top: 20px;
      text-align: center;
    }
    .links a {
      color: #667eea;
      text-decoration: none;
      font-size: 0.9rem;
      transition: color 0.3s;
    }
    .links a:hover {
      color: #764ba2;
      text-decoration: underline;
    }
    .divider {
      margin: 15px 0;
      color: #999;
    }
    .spinner {
      display: none;
      width: 20px;
      height: 20px;
      border: 3px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .loading .spinner { display: block; }
    .loading .btn-text { display: none; }
  </style>
</head>
<body>
  <div class="register-container">
    <div class="logo">
      <h1>🎨 ImageAI Go</h1>
      <p>AI-Powered Image Analysis</p>
    </div>
    
    <h2>Sign Up</h2>
    
    ${message ? `<div class="message success">${message}</div>` : ''}
    ${error ? `<div class="message error">${error}</div>` : ''}
    <div id="messageBox" style="display: none;"></div>
    
    <form id="registerForm">
      <div class="form-group">
        <label for="username">Username</label>
        <input type="text" id="username" name="username" required autocomplete="username">
        <div class="hint">3-20 characters</div>
      </div>
      
      <div class="form-group">
        <label for="email">Email Address</label>
        <input type="email" id="email" name="email" required autocomplete="email">
      </div>
      
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" required autocomplete="new-password">
        <div class="hint">At least 8 characters with letters and numbers</div>
      </div>
      
      <div class="form-group">
        <label for="confirmPassword">Confirm Password</label>
        <input type="password" id="confirmPassword" name="confirmPassword" required autocomplete="new-password">
      </div>
      
      <button type="submit" class="btn" id="submitBtn">
        <span class="btn-text">Sign Up</span>
        <div class="spinner"></div>
      </button>
    </form>
    
    <div class="links">
      <a href="/login">Already have an account? Login</a>
      <div class="divider">|</div>
      <a href="/">Back to Home</a>
    </div>
  </div>

  <script>
    const form = document.getElementById('registerForm');
    const submitBtn = document.getElementById('submitBtn');
    const messageBox = document.getElementById('messageBox');
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      
      if (password !== confirmPassword) {
        messageBox.className = 'message error';
        messageBox.textContent = 'Passwords do not match';
        messageBox.style.display = 'block';
        return;
      }
      
      submitBtn.disabled = true;
      submitBtn.classList.add('loading');
      messageBox.style.display = 'none';
      
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
          messageBox.className = 'message success';
          messageBox.textContent = 'Registration successful! Redirecting to login...';
          messageBox.style.display = 'block';
          
          setTimeout(() => {
            window.location.href = '/login?message=' + encodeURIComponent('Registration successful, please login');
          }, 1500);
        } else {
          messageBox.className = 'message error';
          messageBox.textContent = data.error || 'Registration failed';
          messageBox.style.display = 'block';
          submitBtn.disabled = false;
          submitBtn.classList.remove('loading');
        }
      } catch (error) {
        messageBox.className = 'message error';
        messageBox.textContent = 'Registration failed. Please check your network connection';
        messageBox.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
      }
    });
  </script>
</body>
</html>`;
}

/**
 * Build Forgot Password Page
 */
export function buildForgotPasswordPage(message = '', error = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Forgot Password - ImageAI Go</title>
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
    .forgot-container {
      background: white;
      border-radius: 15px;
      padding: 40px;
      width: 100%;
      max-width: 450px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .logo {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo h1 {
      color: #667eea;
      font-size: 2rem;
      margin-bottom: 10px;
    }
    .logo p {
      color: #666;
      font-size: 0.9rem;
    }
    h2 {
      color: #333;
      margin-bottom: 15px;
      font-size: 1.5rem;
    }
    .description {
      color: #666;
      margin-bottom: 25px;
      font-size: 0.95rem;
      line-height: 1.5;
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
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      color: #333;
      margin-bottom: 8px;
      font-weight: 500;
      font-size: 0.95rem;
    }
    input[type="email"] {
      width: 100%;
      padding: 12px 15px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.3s;
    }
    input[type="email"]:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    .btn {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      margin-top: 10px;
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }
    .btn:active {
      transform: translateY(0);
    }
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
    .links {
      margin-top: 20px;
      text-align: center;
    }
    .links a {
      color: #667eea;
      text-decoration: none;
      font-size: 0.9rem;
      transition: color 0.3s;
    }
    .links a:hover {
      color: #764ba2;
      text-decoration: underline;
    }
    .divider {
      margin: 15px 0;
      color: #999;
    }
    .spinner {
      display: none;
      width: 20px;
      height: 20px;
      border: 3px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .loading .spinner { display: block; }
    .loading .btn-text { display: none; }
    .token-section {
      display: none;
      margin-top: 20px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    .token-section.show {
      display: block;
    }
    .token-code {
      font-family: monospace;
      background: white;
      padding: 10px;
      border-radius: 4px;
      word-break: break-all;
      margin: 10px 0;
      border: 1px solid #ddd;
    }
  </style>
</head>
<body>
  <div class="forgot-container">
    <div class="logo">
      <h1>🎨 ImageAI Go</h1>
      <p>AI-Powered Image Analysis</p>
    </div>
    
    <h2>Forgot Password</h2>
    <p class="description">Enter your email address and we'll send you a password reset link.</p>
    
    ${message ? `<div class="message success">${message}</div>` : ''}
    ${error ? `<div class="message error">${error}</div>` : ''}
    <div id="messageBox" style="display: none;"></div>
    
    <form id="forgotForm">
      <div class="form-group">
        <label for="email">Email Address</label>
        <input type="email" id="email" name="email" required autocomplete="email">
      </div>
      
      <button type="submit" class="btn" id="submitBtn">
        <span class="btn-text">Send Reset Link</span>
        <div class="spinner"></div>
      </button>
    </form>
    
    <div id="tokenSection" class="token-section">
      <p><strong>Development Note:</strong> Since email functionality is not configured, please use the following token to reset your password:</p>
      <div class="token-code" id="tokenCode"></div>
      <a href="#" id="resetLink" class="btn" style="display: inline-block; text-decoration: none; text-align: center;">Go to Reset Password</a>
    </div>
    
    <div class="links">
      <a href="/login">Back to Login</a>
      <div class="divider">|</div>
      <a href="/register">Don't have an account? Sign up</a>
      <div class="divider">|</div>
      <a href="/">Back to Home</a>
    </div>
  </div>

  <script>
    const form = document.getElementById('forgotForm');
    const submitBtn = document.getElementById('submitBtn');
    const messageBox = document.getElementById('messageBox');
    const tokenSection = document.getElementById('tokenSection');
    const tokenCode = document.getElementById('tokenCode');
    const resetLink = document.getElementById('resetLink');
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      
      submitBtn.disabled = true;
      submitBtn.classList.add('loading');
      messageBox.style.display = 'none';
      tokenSection.classList.remove('show');
      
      try {
        const response = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (data.success) {
          messageBox.className = 'message success';
          messageBox.textContent = data.message;
          messageBox.style.display = 'block';
          
          // Show token in development environment
          if (data.resetToken) {
            tokenCode.textContent = data.resetToken;
            resetLink.href = '/reset-password?token=' + data.resetToken;
            tokenSection.classList.add('show');
          }
          
          submitBtn.disabled = false;
          submitBtn.classList.remove('loading');
        } else {
          messageBox.className = 'message error';
          messageBox.textContent = data.error || 'Request failed';
          messageBox.style.display = 'block';
          submitBtn.disabled = false;
          submitBtn.classList.remove('loading');
        }
      } catch (error) {
        messageBox.className = 'message error';
        messageBox.textContent = 'Request failed. Please check your network connection';
        messageBox.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
      }
    });
  </script>
</body>
</html>`;
}

/**
 * Build Reset Password Page
 */
export function buildResetPasswordPage(token = '', message = '', error = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password - ImageAI Go</title>
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
    .reset-container {
      background: white;
      border-radius: 15px;
      padding: 40px;
      width: 100%;
      max-width: 450px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .logo {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo h1 {
      color: #667eea;
      font-size: 2rem;
      margin-bottom: 10px;
    }
    .logo p {
      color: #666;
      font-size: 0.9rem;
    }
    h2 {
      color: #333;
      margin-bottom: 15px;
      font-size: 1.5rem;
    }
    .description {
      color: #666;
      margin-bottom: 25px;
      font-size: 0.95rem;
      line-height: 1.5;
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
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      color: #333;
      margin-bottom: 8px;
      font-weight: 500;
      font-size: 0.95rem;
    }
    input[type="password"] {
      width: 100%;
      padding: 12px 15px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.3s;
    }
    input[type="password"]:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    .hint {
      font-size: 0.85rem;
      color: #666;
      margin-top: 5px;
    }
    .btn {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      margin-top: 10px;
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }
    .btn:active {
      transform: translateY(0);
    }
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
    .links {
      margin-top: 20px;
      text-align: center;
    }
    .links a {
      color: #667eea;
      text-decoration: none;
      font-size: 0.9rem;
      transition: color 0.3s;
    }
    .links a:hover {
      color: #764ba2;
      text-decoration: underline;
    }
    .divider {
      margin: 15px 0;
      color: #999;
    }
    .spinner {
      display: none;
      width: 20px;
      height: 20px;
      border: 3px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .loading .spinner { display: block; }
    .loading .btn-text { display: none; }
  </style>
</head>
<body>
  <div class="reset-container">
    <div class="logo">
      <h1>🎨 ImageAI Go</h1>
      <p>AI-Powered Image Analysis</p>
    </div>
    
    <h2>Reset Password</h2>
    <p class="description">Enter your new password below.</p>
    
    ${message ? `<div class="message success">${message}</div>` : ''}
    ${error ? `<div class="message error">${error}</div>` : ''}
    <div id="messageBox" style="display: none;"></div>
    
    <form id="resetForm">
      <input type="hidden" id="resetToken" value="${token}">
      
      <div class="form-group">
        <label for="password">New Password</label>
        <input type="password" id="password" name="password" required autocomplete="new-password">
        <div class="hint">At least 8 characters with letters and numbers</div>
      </div>
      
      <div class="form-group">
        <label for="confirmPassword">Confirm New Password</label>
        <input type="password" id="confirmPassword" name="confirmPassword" required autocomplete="new-password">
      </div>
      
      <button type="submit" class="btn" id="submitBtn">
        <span class="btn-text">Reset Password</span>
        <div class="spinner"></div>
      </button>
    </form>
    
    <div class="links">
      <a href="/login">Back to Login</a>
      <div class="divider">|</div>
      <a href="/">Back to Home</a>
    </div>
  </div>

  <script>
    const form = document.getElementById('resetForm');
    const submitBtn = document.getElementById('submitBtn');
    const messageBox = document.getElementById('messageBox');
    
    // Get token from URL if not passed by server
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    if (urlToken && !document.getElementById('resetToken').value) {
      document.getElementById('resetToken').value = urlToken;
    }
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const resetToken = document.getElementById('resetToken').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      
      if (!resetToken) {
        messageBox.className = 'message error';
        messageBox.textContent = 'Invalid reset token';
        messageBox.style.display = 'block';
        return;
      }
      
      if (password !== confirmPassword) {
        messageBox.className = 'message error';
        messageBox.textContent = 'Passwords do not match';
        messageBox.style.display = 'block';
        return;
      }
      
      submitBtn.disabled = true;
      submitBtn.classList.add('loading');
      messageBox.style.display = 'none';
      
      try {
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resetToken, newPassword: password })
        });
        
        const data = await response.json();
        
        if (data.success) {
          messageBox.className = 'message success';
          messageBox.textContent = 'Password reset successfully! Redirecting to login...';
          messageBox.style.display = 'block';
          
          setTimeout(() => {
            window.location.href = '/login?message=' + encodeURIComponent('Password reset successful, please login with your new password');
          }, 2000);
        } else {
          messageBox.className = 'message error';
          messageBox.textContent = data.error || 'Reset failed';
          messageBox.style.display = 'block';
          submitBtn.disabled = false;
          submitBtn.classList.remove('loading');
        }
      } catch (error) {
        messageBox.className = 'message error';
        messageBox.textContent = 'Reset failed. Please check your network connection';
        messageBox.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
      }
    });
  </script>
</body>
</html>`;
}
