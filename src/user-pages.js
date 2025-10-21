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
  
  <!-- Google Analytics 4 -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-RGN9QJ4Y0Y"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-RGN9QJ4Y0Y', {
      'anonymize_ip': true,
      'cookie_flags': 'SameSite=None;Secure'
    });
  </script>
  
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
    .login-tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      border-bottom: 2px solid #e0e0e0;
    }
    .tab {
      flex: 1;
      padding: 12px;
      background: none;
      border: none;
      border-bottom: 3px solid transparent;
      cursor: pointer;
      font-size: 1rem;
      color: #666;
      transition: all 0.3s;
    }
    .tab.active {
      color: #667eea;
      border-bottom-color: #667eea;
      font-weight: 600;
    }
    .tab-content {
      display: none;
    }
    .tab-content.active {
      display: block;
    }
    .input-with-button {
      display: flex;
      gap: 10px;
    }
    .input-with-button input {
      flex: 1;
    }
    .code-btn {
      padding: 12px 20px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 0.9rem;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.3s;
    }
    .code-btn:hover {
      background: #5568d3;
    }
    .code-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
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
    
    <div class="login-tabs">
      <button class="tab active" data-tab="password">Password Login</button>
      <button class="tab" data-tab="code">Code Login</button>
    </div>
    
    <!-- Password Login -->
    <div id="password-tab" class="tab-content active">
      <form id="passwordLoginForm">
        <div class="form-group">
          <label for="email1">Email or Username</label>
          <input type="text" id="email1" name="email" required autocomplete="username">
        </div>
        
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" name="password" required autocomplete="current-password">
        </div>
        
        <button type="submit" class="btn" id="passwordSubmitBtn">
          <span class="btn-text">Login</span>
          <div class="spinner"></div>
        </button>
      </form>
    </div>
    
    <!-- Code Login -->
    <div id="code-tab" class="tab-content">
      <form id="codeLoginForm">
        <div class="form-group">
          <label for="email2">Email or Username</label>
          <input type="text" id="email2" name="email" required autocomplete="username">
        </div>
        
        <div class="form-group">
          <label for="loginCode">Verification Code</label>
          <div class="input-with-button">
            <input type="text" id="loginCode" name="code" required placeholder="Enter 6-digit code" maxlength="6">
            <button type="button" class="code-btn" id="sendLoginCodeBtn">Get Code</button>
          </div>
        </div>
        
        <button type="submit" class="btn" id="codeSubmitBtn">
          <span class="btn-text">Login</span>
          <div class="spinner"></div>
        </button>
      </form>
    </div>
    
    <div class="links">
      <a href="/register">Don't have an account? Sign up</a>
      <div class="divider">|</div>
      <a href="/forgot-password">Forgot Password?</a>
      <div class="divider">|</div>
      <a href="/">Back to Home</a>
    </div>
  </div>

  <script>
    const messageBox = document.getElementById('messageBox');
    
    // Tab switching
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        tabContents.forEach(content => content.classList.remove('active'));
        document.getElementById(tabName + '-tab').classList.add('active');
        
        messageBox.style.display = 'none';
      });
    });
    
    // Password Login
    const passwordForm = document.getElementById('passwordLoginForm');
    const passwordSubmitBtn = document.getElementById('passwordSubmitBtn');
    
    passwordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email1').value;
      const password = document.getElementById('password').value;
      
      passwordSubmitBtn.disabled = true;
      passwordSubmitBtn.classList.add('loading');
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
          passwordSubmitBtn.disabled = false;
          passwordSubmitBtn.classList.remove('loading');
        }
      } catch (error) {
        messageBox.className = 'message error';
        messageBox.textContent = 'Login failed. Please check your network connection';
        messageBox.style.display = 'block';
        passwordSubmitBtn.disabled = false;
        passwordSubmitBtn.classList.remove('loading');
      }
    });
    
    // Code Login
    const codeForm = document.getElementById('codeLoginForm');
    const codeSubmitBtn = document.getElementById('codeSubmitBtn');
    const sendLoginCodeBtn = document.getElementById('sendLoginCodeBtn');
    let loginCountdown = 0;
    
    sendLoginCodeBtn.addEventListener('click', async () => {
      const emailOrUsername = document.getElementById('email2').value;
      
      if (!emailOrUsername) {
        messageBox.className = 'message error';
        messageBox.textContent = 'Please enter your email or username';
        messageBox.style.display = 'block';
        return;
      }
      
      sendLoginCodeBtn.disabled = true;
      
      try {
        const response = await fetch('/api/auth/send-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailOrUsername, purpose: 'login' })
        });
        
        const data = await response.json();
        
        if (data.success) {
          messageBox.className = 'message success';
          messageBox.textContent = data.message || 'Verification code sent!';
          messageBox.style.display = 'block';
          
          loginCountdown = 60;
          const timer = setInterval(() => {
            if (loginCountdown > 0) {
              sendLoginCodeBtn.textContent = loginCountdown + 's';
              loginCountdown--;
            } else {
              clearInterval(timer);
              sendLoginCodeBtn.textContent = 'Get Code';
              sendLoginCodeBtn.disabled = false;
            }
          }, 1000);
        } else {
          messageBox.className = 'message error';
          messageBox.textContent = data.error || 'Failed to send code';
          messageBox.style.display = 'block';
          sendLoginCodeBtn.disabled = false;
        }
      } catch (error) {
        messageBox.className = 'message error';
        messageBox.textContent = 'Failed to send code';
        messageBox.style.display = 'block';
        sendLoginCodeBtn.disabled = false;
      }
    });
    
    codeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const emailOrUsername = document.getElementById('email2').value;
      const verificationCode = document.getElementById('loginCode').value;
      
      codeSubmitBtn.disabled = true;
      codeSubmitBtn.classList.add('loading');
      messageBox.style.display = 'none';
      
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailOrUsername, verificationCode })
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
          codeSubmitBtn.disabled = false;
          codeSubmitBtn.classList.remove('loading');
        }
      } catch (error) {
        messageBox.className = 'message error';
        messageBox.textContent = 'Login failed';
        messageBox.style.display = 'block';
        codeSubmitBtn.disabled = false;
        codeSubmitBtn.classList.remove('loading');
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
  
  <!-- Google Analytics 4 -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-RGN9QJ4Y0Y"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-RGN9QJ4Y0Y', {
      'anonymize_ip': true,
      'cookie_flags': 'SameSite=None;Secure'
    });
  </script>
  
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
        <label for="email">Email Address</label>
        <input type="email" id="email" name="email" required autocomplete="email">
      </div>
      
      <div class="form-group">
        <label for="verificationCode">Email Verification Code</label>
        <div class="input-with-button">
          <input type="text" id="verificationCode" name="code" required placeholder="Enter 6-digit code" maxlength="6" pattern="[0-9]{6}">
          <button type="button" class="code-btn" id="sendCodeBtn">Get Code</button>
        </div>
        <div class="hint">Check your email for the verification code</div>
      </div>
      
      <div class="form-group">
        <label for="username">Username</label>
        <input type="text" id="username" name="username" required autocomplete="username">
        <div class="hint">3-20 characters, letters, numbers, _ and - only</div>
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
    const sendCodeBtn = document.getElementById('sendCodeBtn');
    let countdown = 0;
    
    // Send verification code
    sendCodeBtn.addEventListener('click', async () => {
      const email = document.getElementById('email').value;
      
      if (!email) {
        messageBox.className = 'message error';
        messageBox.textContent = 'Please enter your email address first';
        messageBox.style.display = 'block';
        return;
      }
      
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        messageBox.className = 'message error';
        messageBox.textContent = 'Please enter a valid email address';
        messageBox.style.display = 'block';
        return;
      }
      
      sendCodeBtn.disabled = true;
      
      try {
        const response = await fetch('/api/auth/send-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, purpose: 'register' })
        });
        
        const data = await response.json();
        
        if (data.success) {
          messageBox.className = 'message success';
          messageBox.textContent = data.message || 'Verification code sent to your email!';
          messageBox.style.display = 'block';
          
          // Start countdown (60 seconds)
          countdown = 60;
          const timer = setInterval(() => {
            if (countdown > 0) {
              sendCodeBtn.textContent = countdown + 's';
              countdown--;
            } else {
              clearInterval(timer);
              sendCodeBtn.textContent = 'Get Code';
              sendCodeBtn.disabled = false;
            }
          }, 1000);
        } else {
          messageBox.className = 'message error';
          messageBox.textContent = data.error || 'Failed to send code';
          messageBox.style.display = 'block';
          sendCodeBtn.disabled = false;
        }
      } catch (error) {
        messageBox.className = 'message error';
        messageBox.textContent = 'Failed to send code. Please check your network connection';
        messageBox.style.display = 'block';
        sendCodeBtn.disabled = false;
      }
    });
    
    // Form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const verificationCode = document.getElementById('verificationCode').value;
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      
      if (password !== confirmPassword) {
        messageBox.className = 'message error';
        messageBox.textContent = 'Passwords do not match';
        messageBox.style.display = 'block';
        return;
      }
      
      if (!verificationCode || verificationCode.length !== 6) {
        messageBox.className = 'message error';
        messageBox.textContent = 'Please enter a valid 6-digit verification code';
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
          body: JSON.stringify({ email, username, password, verificationCode })
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
  
  <!-- Google Analytics 4 -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-RGN9QJ4Y0Y"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-RGN9QJ4Y0Y', {
      'anonymize_ip': true,
      'cookie_flags': 'SameSite=None;Secure'
    });
  </script>
  
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
    <p class="description">Enter your email address and we'll send you a verification code to reset your password.</p>
    
    ${message ? `<div class="message success">${message}</div>` : ''}
    ${error ? `<div class="message error">${error}</div>` : ''}
    <div id="messageBox" style="display: none;"></div>
    
    <form id="forgotForm">
      <div class="form-group">
        <label for="email">Email Address</label>
        <input type="email" id="email" name="email" required autocomplete="email">
      </div>
      
      <button type="submit" class="btn" id="submitBtn">
        <span class="btn-text">Send Verification Code</span>
        <div class="spinner"></div>
      </button>
    </form>
    
    <div id="nextStepSection" class="token-section">
      <p><strong>Code sent!</strong> Please check your email and then:</p>
      <a href="/reset-password" class="btn" style="display: inline-block; text-decoration: none; text-align: center;">Go to Reset Password</a>
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
    const nextStepSection = document.getElementById('nextStepSection');
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      
      submitBtn.disabled = true;
      submitBtn.classList.add('loading');
      messageBox.style.display = 'none';
      nextStepSection.classList.remove('show');
      
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
          
          // Show next step
          nextStepSection.classList.add('show');
          
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
  
  <!-- Google Analytics 4 -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-RGN9QJ4Y0Y"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-RGN9QJ4Y0Y', {
      'anonymize_ip': true,
      'cookie_flags': 'SameSite=None;Secure'
    });
  </script>
  
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
    <p class="description">Enter the verification code from your email and your new password.</p>
    
    ${message ? `<div class="message success">${message}</div>` : ''}
    ${error ? `<div class="message error">${error}</div>` : ''}
    <div id="messageBox" style="display: none;"></div>
    
    <form id="resetForm">
      <div class="form-group">
        <label for="email">Email Address</label>
        <input type="email" id="email" name="email" required autocomplete="email">
      </div>
      
      <div class="form-group">
        <label for="verificationCode">Verification Code</label>
        <input type="text" id="verificationCode" name="code" required placeholder="Enter 6-digit code" maxlength="6" pattern="[0-9]{6}">
        <div class="hint">Check your email for the verification code</div>
      </div>
      
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
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const verificationCode = document.getElementById('verificationCode').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      
      if (password !== confirmPassword) {
        messageBox.className = 'message error';
        messageBox.textContent = 'Passwords do not match';
        messageBox.style.display = 'block';
        return;
      }
      
      if (!verificationCode || verificationCode.length !== 6) {
        messageBox.className = 'message error';
        messageBox.textContent = 'Please enter a valid 6-digit verification code';
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
          body: JSON.stringify({ email, verificationCode, newPassword: password })
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
