/**
 * Legal and information pages content
 */

export const PRIVACY_CONTENT = `
<h2>1. Information We Collect</h2>
<p>When you use ImageAI Go, we collect:</p>
<ul>
  <li><strong>Images</strong>: Photos you upload or provide via URL</li>
  <li><strong>IP Address</strong>: Used for like functionality and abuse prevention</li>
  <li><strong>Usage Data</strong>: Anonymous analytics to improve our service</li>
</ul>

<h2>2. How We Use Your Information</h2>
<p>We use the collected information to:</p>
<ul>
  <li>Analyze images using AI and generate tags</li>
  <li>Store and display your images in the gallery</li>
  <li>Track likes and prevent abuse</li>
  <li>Improve our AI models and service</li>
</ul>

<h2>3. Data Storage</h2>
<p>Your data is stored securely on Cloudflare's infrastructure:</p>
<ul>
  <li><strong>Images</strong>: Stored in R2 object storage with anti-hotlinking protection</li>
  <li><strong>Metadata</strong>: Stored in D1 database</li>
  <li><strong>Cache</strong>: Temporary cache in KV storage (24 hours)</li>
</ul>

<h2>4. Data Sharing</h2>
<p>We do not sell or share your personal information with third parties. Your images are:</p>
<ul>
  <li>Publicly visible on our website</li>
  <li>Processed by Cloudflare's AI service for analysis</li>
  <li>Not shared with any other parties</li>
</ul>

<h2>5. Your Rights</h2>
<p>You have the right to:</p>
<ul>
  <li>Access your uploaded images</li>
  <li>Request deletion of your images (contact us)</li>
  <li>Opt-out of certain data collection</li>
</ul>

<h2>6. Cookies</h2>
<p>We use minimal cookies and browser storage for:</p>
<ul>
  <li>Session management</li>
  <li>User preferences</li>
  <li>Analytics</li>
</ul>

<h2>7. Security</h2>
<p>We implement industry-standard security measures including:</p>
<ul>
  <li>HTTPS encryption</li>
  <li>Anti-hotlinking protection</li>
  <li>Input validation and sanitization</li>
  <li>Regular security updates</li>
</ul>

<h2>8. Children's Privacy</h2>
<p>Our service is not directed to children under 13. We do not knowingly collect information from children.</p>

<h2>9. Changes to Privacy Policy</h2>
<p>We may update this policy from time to time. Continued use of the service constitutes acceptance of changes.</p>

<h2>10. Contact</h2>
<p>For privacy-related questions, please contact us at support@imageaigo.cc</p>

<p class="update-date"><em>Last updated: October 14, 2024</em></p>
`;

export const TERMS_CONTENT = `
<h2>1. Acceptance of Terms</h2>
<p>By accessing and using ImageAI Go, you accept and agree to be bound by these Terms of Service.</p>

<h2>2. Use License</h2>
<p>Permission is granted to:</p>
<ul>
  <li>Upload images for personal or commercial use</li>
  <li>Use AI-generated tags and descriptions</li>
  <li>Share links to images and categories</li>
  <li>Like and interact with images</li>
</ul>

<h2>3. Restrictions</h2>
<p>You must NOT:</p>
<ul>
  <li>Upload illegal, offensive, or copyrighted content you don't own</li>
  <li>Attempt to bypass security measures or anti-hotlinking protection</li>
  <li>Use automated tools to scrape or abuse the service</li>
  <li>Upload malicious content or attempt to harm the service</li>
  <li>Impersonate others or misrepresent your affiliation</li>
</ul>

<h2>4. Content Ownership</h2>
<p>You retain all rights to images you upload. By uploading, you grant us:</p>
<ul>
  <li>Right to display your images on our platform</li>
  <li>Right to process images with AI</li>
  <li>Right to use images for service improvement</li>
</ul>

<h2>5. AI-Generated Content</h2>
<p>AI-generated tags and descriptions are provided "as is". We do not guarantee:</p>
<ul>
  <li>Accuracy of AI analysis</li>
  <li>Completeness of tags</li>
  <li>Suitability for any specific purpose</li>
</ul>

<h2>6. Service Availability</h2>
<p>We strive for 99.9% uptime but do not guarantee:</p>
<ul>
  <li>Uninterrupted service</li>
  <li>Error-free operation</li>
  <li>Permanent storage of content</li>
</ul>

<h2>7. Limitation of Liability</h2>
<p>ImageAI Go and its operators shall not be liable for:</p>
<ul>
  <li>Loss of data or images</li>
  <li>AI analysis errors or inaccuracies</li>
  <li>Service interruptions or downtime</li>
  <li>Any indirect or consequential damages</li>
</ul>

<h2>8. User Conduct</h2>
<p>Users must:</p>
<ul>
  <li>Use the service lawfully and ethically</li>
  <li>Respect intellectual property rights</li>
  <li>Not upload harmful or inappropriate content</li>
  <li>Comply with all applicable laws</li>
</ul>

<h2>9. Termination</h2>
<p>We reserve the right to:</p>
<ul>
  <li>Remove content that violates these terms</li>
  <li>Ban users who abuse the service</li>
  <li>Modify or discontinue the service</li>
</ul>

<h2>10. Changes to Terms</h2>
<p>We may revise these terms at any time. Continued use constitutes acceptance of revised terms.</p>

<h2>11. Governing Law</h2>
<p>These terms are governed by applicable international laws and regulations.</p>

<h2>12. Contact</h2>
<p>Questions about these terms? Contact us at support@imageaigo.cc</p>

<p class="update-date"><em>Last updated: October 14, 2024</em></p>
`;

export const ABOUT_CONTENT = `
<h2>🎨 What is ImageAI Go?</h2>
<p>ImageAI Go is an AI-powered image tagging and analysis platform that helps you organize, categorize, and discover images using advanced artificial intelligence.</p>

<h2>✨ Our Mission</h2>
<p>To make image organization effortless and intelligent by leveraging cutting-edge AI technology, making it accessible to everyone for free.</p>

<h2>🤖 Technology</h2>
<p>We use:</p>
<ul>
  <li><strong>Llama 3.2 11B Vision Instruct</strong>: State-of-the-art vision-language model by Meta</li>
  <li><strong>Cloudflare Workers</strong>: Global edge computing platform</li>
  <li><strong>D1 Database</strong>: Fast, distributed SQL database</li>
  <li><strong>R2 Storage</strong>: Scalable object storage for images</li>
  <li><strong>KV Cache</strong>: Lightning-fast key-value cache</li>
</ul>

<h2>🏗️ Features</h2>
<ul>
  <li>🤖 AI-powered image analysis and tagging</li>
  <li>🏷️ Hierarchical 3-level tag structure</li>
  <li>📝 Automatic description generation</li>
  <li>🔍 Smart image recommendations</li>
  <li>❤️ Like and interact with images</li>
  <li>🗂️ Browse by categories and tags</li>
  <li>🔎 Full-text search</li>
  <li>📱 Mobile-friendly responsive design</li>
</ul>

<h2>🌍 Global Infrastructure</h2>
<p>Deployed on Cloudflare's global network with 300+ edge locations worldwide for ultra-low latency and high availability.</p>

<h2>💰 Free & Open Source</h2>
<p>ImageAI Go is free to use. The project is built with open technologies and best practices.</p>

<h2>🔒 Privacy & Security</h2>
<p>We take your privacy seriously:</p>
<ul>
  <li>Minimal data collection (only what's necessary)</li>
  <li>Secure storage on Cloudflare infrastructure</li>
  <li>Anti-hotlinking protection for your images</li>
  <li>No selling of user data</li>
</ul>

<h2>📊 Statistics</h2>
<p>Trusted by users worldwide to analyze thousands of images with AI-powered intelligence.</p>

<h2>🚀 Features</h2>
<ul>
  <li>✅ AI-powered image analysis (Llama 3.2 Vision)</li>
  <li>✅ Batch upload support (Admin panel)</li>
  <li>✅ API access for developers (JSON API)</li>
  <li>✅ Admin panel with statistics</li>
  <li>✅ Rate limiting and security</li>
  <li>✅ KV caching for high performance</li>
</ul>

<h2>📞 Contact & Support</h2>
<p>Have questions or feedback? We'd love to hear from you!</p>
<ul>
  <li><strong>Website</strong>: <a href="https://imageaigo.cc" target="_blank" rel="noopener">imageaigo.cc</a></li>
  <li><strong>Email</strong>: support@imageaigo.cc</li>
  <li><strong>GitHub</strong>: <a href="https://github.com/zhaibin/imageaigo" target="_blank" rel="noopener">github.com/zhaibin/imageaigo</a></li>
</ul>

<h2>🙏 Acknowledgments</h2>
<p>Built with:</p>
<ul>
  <li>Meta's Llama 3.2 Vision AI</li>
  <li>Cloudflare Workers Platform</li>
  <li>Open source community</li>
</ul>

<p class="update-date"><em>Version 1.2.2 - October 15, 2024</em></p>
`;

