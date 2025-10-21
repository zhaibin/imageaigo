/**
 * 邮件服务模块
 * 使用 Resend API 发送邮件
 */

/**
 * 发送验证码邮件
 * @param {string} email - 收件人邮箱
 * @param {string} code - 验证码
 * @param {string} purpose - 用途：register, login, reset_password, change_password
 * @param {object} env - 环境变量
 */
export async function sendVerificationCode(email, code, purpose, env) {
  try {
    const apiKey = env.RESEND_API_TOKEN;
    if (!apiKey) {
      console.error('[Email] RESEND_API_TOKEN not configured');
      return { success: false, error: '邮件服务未配置' };
    }

    // 根据用途生成不同的邮件标题和正文
    const emailContent = getEmailContent(code, purpose);

    const requestBody = {
      from: 'ImageAI Go <noreply@mail.imageaigo.cc>',
      to: [email],
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[Email] Resend API error:', result);
      return { 
        success: false, 
        error: '发送邮件失败：' + (result.message || response.statusText) 
      };
    }

    console.log('[Email] Verification code sent:', result.id);
    return { 
      success: true, 
      messageId: result.id 
    };

  } catch (error) {
    console.error('[Email] Send error:', error);
    return { 
      success: false, 
      error: '发送邮件失败：' + error.message 
    };
  }
}

/**
 * 根据用途生成邮件内容
 */
function getEmailContent(code, purpose) {
  const templates = {
    register: {
      subject: 'Welcome to ImageAI Go - Email Verification',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px 20px; border-radius: 0 0 10px 10px; }
            .code-box { background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
            .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; font-family: 'Courier New', monospace; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
            .warning { color: #dc2626; margin-top: 15px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to ImageAI Go</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>Thank you for registering with ImageAI Go! Please use the following verification code to complete your email verification:</p>
              <div class="code-box">
                <div class="code">${code}</div>
              </div>
              <p>This code is valid for <strong>10 minutes</strong>. Please complete the verification as soon as possible.</p>
              <p class="warning">⚠️ If you did not request this, please ignore this email.</p>
              <div class="footer">
                <p>This is an automated email. Please do not reply.</p>
                <p>© 2025 ImageAI Go. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Welcome to ImageAI Go!\n\nYour verification code is: ${code}\n\nThis code is valid for 10 minutes. Please complete the verification as soon as possible.\n\nIf you did not request this, please ignore this email.\n\n© 2025 ImageAI Go`
    },
    login: {
      subject: 'ImageAI Go - Login Verification Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px 20px; border-radius: 0 0 10px 10px; }
            .code-box { background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
            .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; font-family: 'Courier New', monospace; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
            .warning { color: #dc2626; margin-top: 15px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Login Verification</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>You are logging in to ImageAI Go with a verification code. Please use the following code:</p>
              <div class="code-box">
                <div class="code">${code}</div>
              </div>
              <p>This code is valid for <strong>10 minutes</strong>.</p>
              <p class="warning">⚠️ If you did not attempt to log in, your account may be at risk. Please change your password immediately.</p>
              <div class="footer">
                <p>This is an automated email. Please do not reply.</p>
                <p>© 2025 ImageAI Go. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `ImageAI Go Login Verification\n\nYour verification code is: ${code}\n\nThis code is valid for 10 minutes.\n\nIf you did not attempt to log in, your account may be at risk. Please change your password immediately.\n\n© 2025 ImageAI Go`
    },
    reset_password: {
      subject: 'ImageAI Go - Password Reset Verification Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%); color: white; padding: 30px 20px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px 20px; border-radius: 0 0 10px 10px; }
            .code-box { background: white; border: 2px dashed #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
            .code { font-size: 32px; font-weight: bold; color: #f59e0b; letter-spacing: 5px; font-family: 'Courier New', monospace; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
            .warning { color: #dc2626; margin-top: 15px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>You are resetting your password. Please use the following verification code:</p>
              <div class="code-box">
                <div class="code">${code}</div>
              </div>
              <p>This code is valid for <strong>10 minutes</strong>.</p>
              <p class="warning">⚠️ If you did not request this, your account may be at risk. Please contact us immediately.</p>
              <div class="footer">
                <p>This is an automated email. Please do not reply.</p>
                <p>© 2025 ImageAI Go. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `ImageAI Go Password Reset\n\nYour verification code is: ${code}\n\nThis code is valid for 10 minutes.\n\nIf you did not request this, your account may be at risk. Please contact us immediately.\n\n© 2025 ImageAI Go`
    },
    change_password: {
      subject: 'ImageAI Go - Change Password Verification Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px 20px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px 20px; border-radius: 0 0 10px 10px; }
            .code-box { background: white; border: 2px dashed #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
            .code { font-size: 32px; font-weight: bold; color: #10b981; letter-spacing: 5px; font-family: 'Courier New', monospace; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
            .warning { color: #dc2626; margin-top: 15px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Change Password</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>You are changing your account password. Please use the following verification code:</p>
              <div class="code-box">
                <div class="code">${code}</div>
              </div>
              <p>This code is valid for <strong>10 minutes</strong>.</p>
              <p class="warning">⚠️ If you did not request this, your account may be at risk. Please check your account security immediately.</p>
              <div class="footer">
                <p>This is an automated email. Please do not reply.</p>
                <p>© 2025 ImageAI Go. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `ImageAI Go Change Password\n\nYour verification code is: ${code}\n\nThis code is valid for 10 minutes.\n\nIf you did not request this, your account may be at risk. Please check your account security immediately.\n\n© 2025 ImageAI Go`
    }
  };

  return templates[purpose] || templates.login;
}

/**
 * 发送测试邮件
 */
export async function sendTestEmail(email, env) {
  try {
    const apiKey = env.RESEND_API_TOKEN;
    if (!apiKey) {
      return { success: false, error: 'RESEND_API_TOKEN not configured' };
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'ImageAI Go <noreply@mail.imageaigo.cc>',
        to: [email],
        subject: 'Test Email from ImageAI Go',
        html: '<p>This is a test email from ImageAI Go!</p>',
        text: 'This is a test email from ImageAI Go!'
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.message || response.statusText };
    }

    return { success: true, messageId: result.id };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

