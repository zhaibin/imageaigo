/**
 * 统一的 Footer 模板
 * 用于所有页面保持一致的页脚样式和内容
 */

export function buildFooter() {
  return `
    <footer role="contentinfo" style="text-align: center; color: white; margin-top: 60px; padding: 30px 0; border-top: 1px solid rgba(255,255,255,0.2);">
      <p style="margin-bottom: 15px;">&copy; 2024 ImageAI Go. All rights reserved.</p>
      <nav aria-label="Footer navigation">
        <a href="/about" style="color: white; margin: 0 15px; text-decoration: none;">About</a>
        <a href="/privacy" style="color: white; margin: 0 15px; text-decoration: none;">Privacy</a>
        <a href="/terms" style="color: white; margin: 0 15px; text-decoration: none;">Terms</a>
        <a href="/search" style="color: white; margin: 0 15px; text-decoration: none;">Search</a>
        <a href="/images" style="color: white; margin: 0 15px; text-decoration: none;">Gallery</a>
      </nav>
      <p style="margin-top: 15px; opacity: 0.8; font-size: 0.9rem;">
        Powered by Cloudflare Workers & AI | <a href="https://imageaigo.cc" style="color: white; text-decoration: none;">imageaigo.cc</a>
      </p>
    </footer>
  `;
}

