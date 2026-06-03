/**
 * footer.ts — Footer block component
 *
 * Structure: Logo top → Contact + Nav columns → Bottom bar
 * Uses native CSS with hover animations and mobile-responsive layout.
 */
import type { Editor } from 'grapesjs'

const TYPE_FOOTER = 'footer-section'

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
  style="width:24px;height:24px;">
  <rect x="1" y="12" width="22" height="8" rx="1"/>
  <line x1="4" y1="16" x2="9" y2="16"/>
  <line x1="11" y1="16" x2="16" y2="16"/>
  <line x1="18" y1="16" x2="20" y2="16"/>
</svg>`

// ── Social icon SVGs ───────────────────────────────────────────────────────────
const SVG_X = `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.632L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`
const SVG_INSTAGRAM = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" width="20" height="20" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>`
const SVG_YOUTUBE = `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`
const SVG_LINKEDIN = `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`

// ── HTML content ───────────────────────────────────────────────────────────────
const html = `
<div class="gjs-footer">

  <!-- Top: Logo -->
  <div class="gjs-footer__top">
    <div class="gjs-footer__logo">
      <a href="/"><img src="" alt="Logo" style="width: 100%; height: auto; object-fit: cover;"/></a>
    </div>
  </div>

  <!-- Body: Contact + Nav -->
  <div class="gjs-footer__body">

    <!-- Left: Contact info + Social -->
    <div class="gjs-footer__contact">
      <div class="gjs-footer__contact-info">
        <p>Email：info@example.com</p>
        <p>Tel：+86-000-00000000</p>
        <p>Add: Your company address, City, Country</p>
      </div>
      <div class="gjs-footer__social">
        <a href="#" class="gjs-footer__social-link" aria-label="X / Twitter">${SVG_X}</a>
        <a href="#" class="gjs-footer__social-link" aria-label="Instagram">${SVG_INSTAGRAM}</a>
        <a href="#" class="gjs-footer__social-link" aria-label="YouTube">${SVG_YOUTUBE}</a>
        <a href="#" class="gjs-footer__social-link" aria-label="LinkedIn">${SVG_LINKEDIN}</a>
      </div>
    </div>

    <!-- Right: Nav columns -->
    <div class="gjs-footer__nav">
      <div class="gjs-footer__nav-col">
        <h4 class="gjs-footer__nav-title">Service</h4>
        <ul class="gjs-footer__nav-list">
          <li><a href="#">Products</a></li>
          <li><a href="#">Solutions</a></li>
          <li><a href="#">Cases</a></li>
          <li><a href="#">Customization</a></li>
        </ul>
      </div>
      <div class="gjs-footer__nav-col">
        <h4 class="gjs-footer__nav-title">Support</h4>
        <ul class="gjs-footer__nav-list">
          <li><a href="#">Partnerships</a></li>
          <li><a href="#">Technical Support</a></li>
          <li><a href="#">FAQs</a></li>
          <li><a href="#">Contact us</a></li>
          <li><a href="#">Blog</a></li>
        </ul>
      </div>
      <div class="gjs-footer__nav-col">
        <h4 class="gjs-footer__nav-title">Why FOCA</h4>
        <ul class="gjs-footer__nav-list">
          <li><a href="#">About FOCA</a></li>
          <li><a href="#">Company Structure</a></li>
          <li><a href="#">FOCA Team</a></li>
          <li><a href="#">Location</a></li>
        </ul>
      </div>
    </div>

  </div>

  <!-- Bottom bar -->
  <div class="gjs-footer__bottom">
    <div class="gjs-footer__bottom-inner">
      <p class="gjs-footer__copyright">
        © 2026 KingFisher. All rights reserved. Designed and developed by
        <a href="https://toototech.com" target="_blank">toototech</a>.
      </p>
      <div class="gjs-footer__legal">
        <a href="#">Terms &amp; Conditions</a>
        <span class="gjs-footer__legal-sep">|</span>
        <a href="#">Privacy Policy</a>
      </div>
    </div>
  </div>

</div>
`.trim()

// ── Styles ─────────────────────────────────────────────────────────────────────
const css = `
  .gjs-footer {
    background: #0057CE;
    color: #fff;
    box-sizing: border-box;
  }
  .gjs-footer *, .gjs-footer *::before, .gjs-footer *::after {
    box-sizing: border-box;
  }

  /* ── Top: Logo ────────────────────────────────────────────────────── */
  .gjs-footer__top {
    max-width: 1280px;
    margin: 0 auto;
    padding: 56px 20px 0;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 24px;
  }
  .gjs-footer__logo{
    flex: 1;
  }
  .gjs-footer__logo a {
    text-decoration: none;
  }
  .gjs-footer__logo img {
    height: 40px;
    width: auto;
    display: block;
    background: none;
  }

  /* ── Body ─────────────────────────────────────────────────────────── */
  .gjs-footer__body {
    max-width: 1280px;
    margin: 0 auto;
    padding: 64px 20px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    align-items: start;
  }

  /* ── Contact ──────────────────────────────────────────────────────── */
  .gjs-footer__contact {
    max-width: 400px;
  }
  .gjs-footer__contact-info {
    margin-bottom: 40px;
    font-weight: 300;
    line-height: 1.9;
    font-size: 0.9rem;
    color: rgba(255,255,255,0.9);
  }
  .gjs-footer__contact-info p {
    margin: 0;
  }

  /* ── Social icons ─────────────────────────────────────────────────── */
  .gjs-footer__social {
    display: flex;
    align-items: center;
    gap: 20px;
  }
  .gjs-footer__social-link {
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255,255,255,0.7);
    text-decoration: none;
    transition: color 0.2s ease, transform 0.2s ease;
  }
  .gjs-footer__social-link:hover {
    color: #fff;
    transform: translateY(-3px);
  }
  .gjs-footer__social-link svg {
    display: block;
  }

  /* ── Nav columns ──────────────────────────────────────────────────── */
  .gjs-footer__nav {
    display: flex;
    justify-content: flex-end;
    gap: 56px;
    flex-wrap: wrap;
  }
  .gjs-footer__nav-title {
    color: #fff;
    font-size: 1.125rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    margin: 0 0 16px;
  }
  .gjs-footer__nav-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .gjs-footer__nav-list a {
    color: rgba(255,255,255,0.75);
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 300;
    line-height: 1.5;
    position: relative;
    display: inline-block;
    transition: color 0.2s ease;
  }
  .gjs-footer__nav-list a::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 0;
    height: 1px;
    background: rgba(255,255,255,0.6);
    transition: width 0.25s ease;
  }
  .gjs-footer__nav-list a:hover {
    color: #fff;
  }
  .gjs-footer__nav-list a:hover::after {
    width: 100%;
  }

  /* ── Bottom bar ───────────────────────────────────────────────────── */
  .gjs-footer__bottom {
    border-top: 1px solid rgba(255,255,255,0.1);
  }
  .gjs-footer__bottom-inner {
    max-width: 1280px;
    margin: 0 auto;
    padding: 24px 20px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .gjs-footer__copyright {
    color: rgba(255,255,255,0.65);
    font-size: 0.75rem;
    margin: 0;
  }
  .gjs-footer__copyright a {
    color: rgba(255,255,255,0.65);
    text-decoration: none;
    transition: color 0.2s ease;
  }
  .gjs-footer__copyright a:hover {
    color: #fff;
  }
  .gjs-footer__legal {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .gjs-footer__legal a {
    color: rgba(255,255,255,0.65);
    text-decoration: none;
    font-size: 0.875rem;
    position: relative;
    display: inline-block;
    transition: color 0.2s ease;
  }
  .gjs-footer__legal a::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 0;
    height: 1px;
    background: rgba(255,255,255,0.5);
    transition: width 0.2s ease;
  }
  .gjs-footer__legal a:hover {
    color: #fff;
  }
  .gjs-footer__legal a:hover::after {
    width: 100%;
  }
  .gjs-footer__legal-sep {
    color: rgba(255,255,255,0.2);
    font-size: 0.875rem;
  }

  /* ── Tablet ───────────────────────────────────────────────────────── */
  @media (max-width: 1023px) {
    .gjs-footer__top {
      padding: 48px 20px 0;
    }
    .gjs-footer__body {
      grid-template-columns: minmax(0, 1fr);
      gap: 32px;
      padding: 48px 20px;
    }
    .gjs-footer__contact {
      max-width: 100%;
    }
    .gjs-footer__contact-info {
      margin-bottom: 28px;
    }
    .gjs-footer__nav {
      justify-content: flex-start;
      gap: 36px;
    }
    .gjs-footer__bottom-inner {
      gap: 16px;
    }
  }

  /* ── Mobile ───────────────────────────────────────────────────────── */
  @media (max-width: 767px) {
    .gjs-footer__top {
      padding-top: 40px;
    }
    .gjs-footer__body {
      grid-template-columns: 1fr;
      padding: 40px 20px;
    }
    .gjs-footer__contact {
      max-width: 100%;
    }
    .gjs-footer__nav {
      justify-content: flex-start;
      gap: 32px;
    }
    .gjs-footer__nav-col {
      min-width: 140px;
    }
    .gjs-footer__bottom-inner {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
  }
`

function ensureFooterStyles(editor: Editor) {
  const cssComposer = (editor as any).CssComposer || (editor as any).Css
  const groupName = `cmp:${TYPE_FOOTER}`
  const hasFooterGroup = cssComposer?.getRules?.()?.some?.((rule: any) => {
    return `${rule?.get?.('group') ?? ''}`.trim() === groupName
  })
  if (hasFooterGroup) {
    ;(editor as any).__wbFooterStyleInjected = true
    return
  }
  cssComposer?.addCollection?.(css, { avoidUpdateStyle: true }, { group: groupName })
  ;(editor as any).__wbFooterStyleInjected = true
}

// ── Registration ───────────────────────────────────────────────────────────────
export function registerFooter (editor: Editor): void {
  const { DomComponents, BlockManager } = editor

  editor.on?.('load', () => {
    ensureFooterStyles(editor)
  })
  ensureFooterStyles(editor)

  DomComponents.addType(TYPE_FOOTER, {
    isComponent: (el: HTMLElement) =>
      el.tagName === 'FOOTER' && el.classList?.contains('gjs-footer')
        ? { type: TYPE_FOOTER }
        : undefined,

    model: {
      defaults: {
        name: 'Footer',
        tagName: 'footer',
        draggable: true,
        droppable: false,
        styles: css,
        components: html,
      },
    },
  })

  BlockManager.add('footer-section', {
    label: 'Footer',
    category: 'Navigation',
    media: BLOCK_ICON,
    content: { type: TYPE_FOOTER },
  })
}

// ──导出 ─────────────────────────────────────────────────────────
export const WB_FOOTER_TYPE = TYPE_FOOTER
export function registerFooterComponent (editor: import('grapesjs').Editor): void {
  registerFooter(editor)
}
