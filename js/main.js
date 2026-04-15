console.log('main.js loaded successfully!');

// =============================================
// 1. DETECT file:// AND SHOW HELPFUL MESSAGE
// =============================================
if (window.location.protocol === 'file:') {
  document.body.innerHTML = `
    <div style="padding:2rem;font-family:system-ui, sans-serif;color:#ff6b6b;background:#0d1118;min-height:100vh;">
      <h2>⚠️ Cannot load components with file://</h2>
      <p>You're viewing this page directly from your file system. To make the components load, please run a local server:</p>
      <ol style="margin-bottom:1.5rem;">
        <li>Open terminal in this project folder</li>
        <li>Run: <code style="background:#1e1e2e;padding:2px 6px;border-radius:4px;">python -m http.server 8000</code></li>
        <li>Open <a href="http://localhost:8000" style="color:#4ae3a0;">http://localhost:8000</a></li>
      </ol>
      <p><small>Or use VS Code's Live Server extension.</small></p>
    </div>
  `;
  throw new Error('Open with a local server, not file://');
}

// =============================================
// 2. COMPONENT LOADER
// =============================================
async function loadComponent(containerId, filePath) {
  try {
    const response = await fetch(filePath);
    if (!response.ok) throw new Error(`Failed to load ${filePath}: ${response.status}`);
    const html = await response.text();
    document.getElementById(containerId).innerHTML = html;
  } catch (error) {
    console.error(error);
    document.getElementById(containerId).innerHTML = `<p style="color:red">Error loading component: ${filePath}</p>`;
  }
}

// Helper: Poll until element exists, then call callback
function waitForElement(selector, callback, maxAttempts = 20, interval = 100) {
  let attempts = 0;
  const check = () => {
    const el = document.querySelector(selector);
    if (el) {
      callback();
    } else if (attempts < maxAttempts) {
      attempts++;
      setTimeout(check, interval);
    } else {
      console.warn(`Element "${selector}" not found after ${maxAttempts * interval}ms`);
    }
  };
  check();
}

Promise.all([
  loadComponent('header-container', 'components/header.html'),
  loadComponent('hero-container', 'components/hero.html'),
  loadComponent('wishlist-container', 'components/wishlist.html'),
  loadComponent('battle-container', 'components/battle.html'),
  loadComponent('footer-container', 'components/footer.html')
]).then(() => {
  // Wait for each component's key element before initializing
  waitForElement('#online-count', () => {
    initOnlineCounter();
  });

  waitForElement('#wishForm', () => {
    initWishlistForm();
  });

  waitForElement('#claudeCanvas', () => {
    initBattleCanvases();
  });

  waitForElement('#typewriter-text', () => {
    initTypewriter();
  });
});

// =============================================
// 3. ONLINE COUNTER
// =============================================
function initOnlineCounter() {
  const el = document.getElementById('online-count');
  if (!el) {
    console.warn('online-count element not found');
    return;
  }

  function rand() {
    return Math.floor(Math.random() * (150 - 85 + 1)) + 85;
  }

  function tick() {
    el.classList.add('fade');
    setTimeout(function () {
      el.textContent = rand();
      el.classList.remove('fade');
    }, 300);
  }

  el.textContent = rand();
  setInterval(tick, 5000);
}

// =============================================
// 4. TYPEWRITER EFFECT FOR HERO SUBTITLE
// =============================================
function initTypewriter() {
  const el = document.getElementById('typewriter-text');
  if (!el) return;

  const messages = [
    'Turn the best result into a viral Short in seconds.',
    'Type a prompt. Watch <strong>Claude, ChatGPT, Gemini & DeepSeek</strong> compete head-to-head.'
  ];

  let messageIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  const typingSpeed = 40;
  const deletingSpeed = 20;
  const pauseBetween = 1000;

  function type() {
    const fullText = messages[messageIndex];

    if (isDeleting) {
      el.innerHTML = fullText.substring(0, charIndex - 1);
      charIndex--;
    } else {
      el.innerHTML = fullText.substring(0, charIndex + 1);
      charIndex++;
    }

    if (!isDeleting && charIndex === fullText.length) {
      isDeleting = true;
      setTimeout(type, pauseBetween);
      return;
    }

    if (isDeleting && charIndex === 0) {
      isDeleting = false;
      messageIndex = (messageIndex + 1) % messages.length;
      setTimeout(type, 300);
      return;
    }

    setTimeout(type, isDeleting ? deletingSpeed : typingSpeed);
  }

  setTimeout(type, 500);
}

// =============================================
// 5. WISHLIST FORM
// =============================================
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz4fV3BAEJFYfSG6FLH9m3NOFeOY2jFdpW5oR6EQ8VFyNAdlunNM0h6ZMUl6IRS1Ck82w/exec';

function initWishlistForm() {
  const form = document.getElementById('wishForm');
  const statusDiv = document.getElementById('formStatus');
  const submitBtn = document.getElementById('submitBtn');

  if (!form || !statusDiv || !submitBtn) {
    console.warn('Wishlist form elements not ready – retrying...');
    setTimeout(initWishlistForm, 100);
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const gmail = document.getElementById('gmail').value.trim();
    const wouldPay = document.getElementById('wouldPay').value;
    const usage = document.getElementById('usage').value.trim();

    if (!gmail || !wouldPay || !usage) {
      statusDiv.textContent = '❌ All fields are required.';
      statusDiv.className = 'status err';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    statusDiv.textContent = 'Sending...';
    statusDiv.className = 'status';

    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gmail, wouldPay, usage })
      });

      statusDiv.textContent = '✅ Entry added! Thnks for valuable response.';
      statusDiv.className = 'status ok';
      form.reset();
    } catch (error) {
      statusDiv.textContent = '❌ Error: ' + error.message;
      statusDiv.className = 'status err';
      console.error(error);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Join the waitlist →';
    }
  });
}

// =============================================
// 6. BATTLE CANVASES
// =============================================
function initBattleCanvases() {
  requestAnimationFrame(() => {
    setupCanvas('claudeCanvas', 'claude');
    setupCanvas('gptCanvas', 'gpt');
    setupCanvas('geminiCanvas', 'gemini');
    setupCanvas('deepseekCanvas', 'deepseek');
  });
}

function setupCanvas(id, type) {
  const canvas = document.getElementById(id);
  if (!canvas) {
    console.warn(`Canvas #${id} not found`);
    return;
  }

  const ctx = canvas.getContext('2d');
  let animFrame = null;
  let isAnimating = true;

  function resize() {
    const container = canvas.parentElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    if (w === 0 || h === 0) {
      setTimeout(resize, 100);
      return;
    }

    canvas.width = w * devicePixelRatio;
    canvas.height = h * devicePixelRatio;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  function draw(t) {
    if (!isAnimating) return;

    const container = canvas.parentElement;
    if (!container) return;

    const w = container.clientWidth;
    const h = container.clientHeight;

    if (w === 0 || h === 0) {
      animFrame = requestAnimationFrame(draw);
      return;
    }

    ctx.clearRect(0, 0, w, h);

    if (type === 'claude') {
      ctx.fillStyle = 'rgba(212,132,90,0.95)';
      for (let i = 0; i < 28; i++) {
        const a = (t * 0.0016) + i * 0.48;
        const r = 16 + i * 4;
        const x = w / 2 + Math.cos(a) * r;
        const y = h / 2 + Math.sin(a * 1.3) * r * 0.7;
        ctx.beginPath();
        ctx.arc(x, y, 2 + (i % 3) * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (type === 'gpt') {
      ctx.strokeStyle = 'rgba(116,170,156,0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 8) {
        const y = h / 2 + Math.sin((x * 0.03) + t * 0.002) * 22 + Math.cos((x * 0.015) + t * 0.0013) * 10;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.fillStyle = 'rgba(116,170,156,0.22)';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 8) {
        const y = h / 2 + Math.sin((x * 0.03) + t * 0.002) * 22 + Math.cos((x * 0.015) + t * 0.0013) * 10;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
    }

    if (type === 'gemini') {
      const cx = w / 2, cy = h / 2;
      for (let i = 1; i <= 4; i++) {
        ctx.strokeStyle = `rgba(108,142,245,${0.18 + i * 0.12})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(cx, cy, 18 + i * 18 + Math.sin(t * 0.0015 + i) * 2, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(108,142,245,0.95)';
      for (let i = 0; i < 9; i++) {
        const a = t * 0.001 + i * (Math.PI * 2 / 9);
        const r = 22 + (i % 3) * 15;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (type === 'deepseek') {
      const cx = w / 2, cy = h / 2;
      ctx.strokeStyle = 'rgba(201,122,255,0.85)';
      for (let i = 0; i < 6; i++) {
        const s = 24 + i * 18;
        const rot = t * 0.0006 + i * 0.14;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.strokeRect(-s / 2, -s / 2, s, s);
        ctx.restore();
      }
      ctx.fillStyle = 'rgba(201,122,255,0.9)';
      for (let i = 0; i < 14; i++) {
        const x = cx + Math.sin(t * 0.0017 + i) * (14 + i * 3);
        const y = cy + Math.cos(t * 0.0013 + i * 0.8) * (10 + i * 2);
        ctx.beginPath();
        ctx.arc(x, y, 1.8 + (i % 2) * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    animFrame = requestAnimationFrame(draw);
  }

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resize, 50);
  });

  resize();
  animFrame = requestAnimationFrame(draw);

  window.addEventListener('beforeunload', () => {
    isAnimating = false;
    if (animFrame) cancelAnimationFrame(animFrame);
  });
}