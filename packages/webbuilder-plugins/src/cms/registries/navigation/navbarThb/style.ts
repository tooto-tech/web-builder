export const NAVBAR_THB_STYLES = `
  /* ── CSS Variables ─────────────────────────────────────── */
  .site-header {
    --primary-blue: #3C53E8;
    --dark-blue: #080E2B;
    --text-dark: #0C1029;
    --text-gray: #666;
    --transition: 0.2s ease-in-out;
    --header-height: 64px;
    --thb-mobile-header-height: 60px;
    --thb-header-bg: transparent;
    --thb-header-scroll-bg: #fff;
    --thb-header-link-color: var(--text-dark);
    --thb-header-scroll-link-color: var(--text-dark);
    --thb-logo-height: 36px;
    --thb-mobile-logo-height: 32px;
    --thb-gutter: 40px;
    --thb-mobile-gutter: 20px;
    --thb-nav-gap: 40px;
    --dropdown-menu-offset: 8px;
    --megamenu-offset: 8px;
    --dropdown-menu-radius: 8px;
    --megamenu-radius: 8px;
  }

  /* ── Page Width Grid ────────────────────────────────────── */
  .site-header .page-width {
    --content-max: 1240px;
    --gutter: var(--thb-gutter);
    display: grid;
    grid-template-columns:
      minmax(var(--gutter), 1fr)
      minmax(0, var(--content-max))
      minmax(var(--gutter), 1fr);
  }
  .site-header .page-width > * {
    grid-column: 2;
  }

  /* ── Links ──────────────────────────────────────────────── */
  .site-header a {
    text-decoration: none;
  }
  .site-header input {
    min-width: 0;
  }

  /* ── Logo ───────────────────────────────────────────────── */
  .site-header__logo {
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .site-header__logo a {
    display: flex;
    align-items: center;
  }
  .site-header__logo img {
    height: var(--thb-logo-height);
    width: auto;
    display: block;
  }

  /* ── Header Base ────────────────────────────────────────── */
  .site-header {
    background: var(--thb-header-scroll-bg);
    position: sticky;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    transition: background var(--transition), box-shadow var(--transition);
  }
  .site-header--fixed-transparent {
    background: var(--thb-header-bg);
    position: fixed;
  }
  .site-header--sticky {
    background: var(--thb-header-scroll-bg);
    position: sticky;
  }
  .site-header--scrolled {
    background: var(--thb-header-scroll-bg);
    box-shadow: 0 0 0 1px rgba(2, 5, 27, 0.09);
  }

  /* ── Primary Nav ────────────────────────────────────────── */
  .site-header__nav {
    display: flex;
    height: var(--header-height);
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }
  .site-header__nav-list {
    display: flex;
    gap: var(--thb-nav-gap);
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .site-header__nav-list.wb-menu-tree {
    width: auto;
  }
  .site-header__nav-list.wb-menu-tree .wb-menu-tree-nav {
    width: auto;
  }
  .site-header__nav-list.wb-menu-tree .wb-menu-tree-list {
    display: flex;
    flex-direction: row;
    gap: var(--thb-nav-gap);
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .site-header__nav-list.wb-menu-tree .wb-menu-tree-item {
    position: relative;
  }
  .site-header__nav-list.wb-menu-tree .wb-menu-tree-list > .wb-menu-tree-item > .wb-menu-tree-submenu {
    position: absolute;
    left: 50%;
    top: 100%;
    transform: translate(-50%, 8px);
    min-width: 200px;
    background: #fff;
    border-radius: var(--megamenu-radius);
    padding: 10px;
    box-shadow: 0 8px 30px rgba(12, 16, 41, 0.08);
    display: grid;
    gap: 4px;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: opacity var(--transition), visibility var(--transition), transform var(--transition);
    z-index: 1200;
  }
  .site-header__nav-list.wb-menu-tree .wb-menu-tree-list > .wb-menu-tree-item:hover > .wb-menu-tree-submenu,
  .site-header__nav-list.wb-menu-tree .wb-menu-tree-list > .wb-menu-tree-item:focus-within > .wb-menu-tree-submenu {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transform: translate(-50%, 0);
  }
  .site-header__nav-list.wb-menu-tree .wb-menu-tree-list > .wb-menu-tree-item > .wb-menu-tree-submenu:has(.wb-menu-tree-submenu) {
    width: 790px;
    min-width: 0;
    padding: 20px;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 28px;
  }
  .site-header__nav-list.wb-menu-tree .wb-menu-tree-list > .wb-menu-tree-item > .wb-menu-tree-submenu:has(.wb-menu-tree-submenu) > .wb-menu-tree-item:first-child {
    grid-column: span 2;
  }
  .site-header__nav-list.wb-menu-tree .wb-menu-tree-list > .wb-menu-tree-item > .wb-menu-tree-submenu:has(.wb-menu-tree-submenu) > .wb-menu-tree-item:first-child > .wb-menu-tree-submenu {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 28px;
  }
  .site-header__nav-list.wb-menu-tree .wb-menu-tree-submenu .wb-menu-tree-submenu {
    position: static;
    display: grid;
    gap: 4px;
    margin-top: 12px;
    padding: 0;
    background: transparent;
    box-shadow: none;
  }
  .site-header__nav-list.wb-menu-tree .wb-menu-tree-link {
    font-size: 14px;
    display: block;
    line-height: var(--header-height);
    color: var(--thb-header-link-color);
    font-weight: 400;
    transition: color var(--transition);
    white-space: nowrap;
    text-decoration: none;
  }
  .site-header__nav-list.wb-menu-tree .wb-menu-tree-submenu .wb-menu-tree-link {
    line-height: 1.2;
    padding: 10px;
    border-radius: 6px;
    color: #1d1d1d;
  }
  .site-header__nav-list.wb-menu-tree .wb-menu-tree-submenu .wb-menu-tree-link:hover {
    background: #F3F3F3;
    color: #1d1d1d;
    opacity: 1;
  }
  .site-header--scrolled .site-header__nav-list.wb-menu-tree .wb-menu-tree-link {
    color: var(--thb-header-scroll-link-color);
  }
  .site-header__nav-list.wb-menu-tree .wb-menu-tree-link:hover {
    color: var(--thb-header-link-color);
    opacity: 0.82;
  }
  .site-header--scrolled .site-header__nav-list.wb-menu-tree .wb-menu-tree-link:hover {
    color: var(--thb-header-scroll-link-color);
  }
  .site-header__nav-list.wb-menu-tree .wb-menu-tree-icon {
    display: none;
  }
  .site-header__nav-list.wb-menu-tree .wb-menu-tree-list > .wb-menu-tree-item > .wb-menu-tree-submenu:has(.wb-menu-tree-submenu) > .wb-menu-tree-item > .wb-menu-tree-link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
    padding-inline: 16px 4px;
    margin-bottom: 20px;
    font-size: 16px;
    font-weight: 700;
    line-height: 24px;
    background: transparent;
  }
  .site-header__nav-list.wb-menu-tree .wb-menu-tree-list > .wb-menu-tree-item > .wb-menu-tree-submenu:has(.wb-menu-tree-submenu) > .wb-menu-tree-item > .wb-menu-tree-link::after {
    content: '›';
    margin-left: auto;
    color: #666;
    font-size: 28px;
    line-height: 1;
    font-weight: 300;
  }
  .site-header__nav-list.wb-menu-tree .wb-menu-tree-list > .wb-menu-tree-item > .wb-menu-tree-submenu:has(.wb-menu-tree-submenu) > .wb-menu-tree-item > .wb-menu-tree-link .wb-menu-tree-text {
  
  }
  .site-header__nav-list.wb-menu-tree .wb-menu-tree-list > .wb-menu-tree-item > .wb-menu-tree-submenu:has(.wb-menu-tree-submenu) > .wb-menu-tree-item > .wb-menu-tree-link .wb-menu-tree-icon {
    order: 3;
    display: block;
    width: 100%;
    height: auto;
    max-height: 448px;
    aspect-ratio: 1 / 1;
    object-fit: contain;
    padding: 28px;
    margin-top: 18px;
    background: #F3F3F3;
    border-radius: 10px;
  }
  .site-header__nav-list.wb-menu-tree .wb-menu-tree-list > .wb-menu-tree-item > .wb-menu-tree-submenu:has(.wb-menu-tree-submenu) > .wb-menu-tree-item > .wb-menu-tree-link .wb-menu-tree-icon[src=''],
  .site-header__nav-list.wb-menu-tree .wb-menu-tree-list > .wb-menu-tree-item > .wb-menu-tree-submenu:has(.wb-menu-tree-submenu) > .wb-menu-tree-item > .wb-menu-tree-link .wb-menu-tree-icon:not([src]) {
    display: none;
  }
  .site-header__nav-item--has-dropdown {
    position: relative;
  }
  .site-header__nav-link {
    font-size: 14px;
    display: block;
    line-height: var(--header-height);
    color: var(--thb-header-link-color);
    font-weight: 400;
    transition: color var(--transition);
    white-space: nowrap;
  }
  .site-header--scrolled .site-header__nav-link {
    color: var(--thb-header-scroll-link-color);
  }
  .site-header__nav-link:hover {
    color: var(--thb-header-link-color);
    opacity: 0.82;
  }
  .site-header--scrolled .site-header__nav-link:hover {
    color: var(--thb-header-scroll-link-color);
  }
  .site-header--menu-left .site-header__nav-list {
    margin-right: auto;
  }
  .site-header--menu-right .site-header__nav-list {
    margin-left: auto;
  }
  .site-header__nav-link--active {
    color: var(--thb-header-link-color);
    font-weight: 600;
  }
  .site-header--scrolled .site-header__nav-link--active {
    color: var(--thb-header-scroll-link-color);
  }

  /* ── Dropdown Wrap ──────────────────────────────────────── */
  .site-header__dropdown-wrap {
    position: absolute;
    left: 50%;
    top: 100%;
    transform: translate(-50%, 8px);
    padding-top: var(--dropdown-menu-offset);
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: opacity var(--transition), visibility var(--transition), transform var(--transition);
    z-index: 1200;
  }
  .site-header__nav-item--has-dropdown:hover > .site-header__dropdown-wrap,
  .site-header__nav-item--has-dropdown:focus-within > .site-header__dropdown-wrap {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transform: translate(-50%, 0);
  }

  /* ── Dropdown ───────────────────────────────────────────── */
  .site-header__dropdown {
    min-width: 200px;
    background: #fff;
    border-radius: var(--megamenu-radius);
    padding: 10px;
    box-shadow: 0 8px 30px rgba(12, 16, 41, 0.08);
    display: grid;
    gap: 4px;
  }
  .site-header__dropdown--right {
    min-width: 180px;
  }
  .site-header__dropdown-link {
    display: block;
    white-space: nowrap;
    padding: 10px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 400;
    color: #1d1d1d;
    line-height: 1.2;
    transition: background var(--transition), color var(--transition);
  }
  .site-header__dropdown-link--active,
  .site-header__dropdown-link:hover {
    background: #F3F3F3;
  }

  /* ── Mega Menu ──────────────────────────────────────────── */
  .site-header__dropdown--mega {
    width: 790px;
    min-width: 0;
    padding: 0;
  }
  .site-header__mega {
    display: grid;
    align-items: stretch;
    gap: 28px;
    padding: 20px;
    grid-template-columns: minmax(0, 1.15fr) 240px;
  }
  .site-header__mega-col {
    flex: 1 1 0;
    min-width: 0;
  }
  .site-header__mega-col--right {
    padding-left: 0;
  }
  .site-header__mega-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 16px;
    font-weight: 700;
    color: #1d1d1d;
    line-height: 24px;
    margin-bottom: 32px;
    padding-inline: 16px 4px;
  }
  .site-header__mega-head--empty {
    height: 24px;
    margin-bottom: 32px;
  }
  .site-header__mega-head i {
    font-size: 30px;
    color: #1d1d1d;
    opacity: 0.75;
    font-weight: normal;
    font-style: normal;
  }
  .site-header__mega-list {
    display: grid;
    row-gap: 10px;
  }
  .site-header__mega-list--split {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 16px;
  }
  .site-header__mega-item {
    display: block;
    padding: 10px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: normal;
    color: #222222;
    line-height: 1.32;
    transition: background var(--transition), color var(--transition);
  }
  .site-header__mega-item--active,
  .site-header__mega-item:hover {
    background: #F3F3F3;
    color: #1d1d1d;
  }
  .site-header__mega-media {
    border-radius: 6px;
    background: #F3F4F6;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1 / 1;
    min-height: 0;
    padding: 0;
    margin-inline: 16px 0;
  }
  .site-header__mega-media img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: contain;
  }

  /* ── Actions ────────────────────────────────────────────── */
  .site-header__actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }
  .site-header__search {
    background: #fff;
    border-radius: 20px;
    padding: 0 14px;
    display: flex;
    align-items: center;
    width: 160px;
    height: 36px;
    box-shadow: 0 0 0 1px #CDCDCD inset;
    gap: 8px;
    color: #999;
    transition: all var(--transition);
  }
  .site-header__search:has(:focus-within) {
    box-shadow: 0 0 0 1px var(--primary-blue) inset;
  }
  .site-header__search svg {
    flex: 0 0 auto;
  }
  .site-header__search input {
    flex: 1;
    border: none;
    background: transparent;
    outline: none;
    font-size: 13px;
    font-family: inherit;
    color: var(--text-dark);
  }

  /* ── CTA Button ─────────────────────────────────────────── */
  .site-header .btn--consult {
    background: var(--primary-blue);
    color: #fff;
    border-radius: 999px;
    font-size: 14px;
    height: 36px;
    padding: 0 20px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    transition: background var(--transition), transform var(--transition);
    font-family: inherit;
    font-weight: 500;
    cursor: pointer;
    border: none;
    text-decoration: none;
  }
  .site-header .btn--consult:hover {
    background: #2a3fc9;
  }

  /* ── Hamburger ──────────────────────────────────────────── */
  .site-header__hamburger {
    display: none;
    flex-direction: column;
    gap: 3px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
  }
  .site-header__hamburger span {
    display: block;
    width: 17px;
    height: 3px;
    transform: scaleY(0.5);
    background: var(--thb-header-link-color);
    border-radius: 2px;
    transition: all var(--transition);
    transform-origin: center;
  }
  .site-header--scrolled .site-header__hamburger span {
    background: var(--thb-header-scroll-link-color);
  }
  .site-header__hamburger--open span:nth-child(1) {
    transform: translateY(6px) rotate(45deg) scaleY(0.5);
  }
  .site-header__hamburger--open span:nth-child(2) {
    opacity: 0;
  }
  .site-header__hamburger--open span:nth-child(3) {
    transform: translateY(-6px) rotate(-45deg) scaleY(0.5);
  }

  /* ── Mobile Search Trigger ──────────────────────────────── */
  .site-header__mobile-search {
    display: none;
  }

  /* ── Site Search Overlay (mobile only) ──────────────────── */
  .site-header .site-search {
    display: none;
  }

  /* ── Mobile Nav (hidden by default) ────────────────────── */
  .site-header .nav-mobile {
    display: none;
  }
  .site-header .nav-mobile--open {
    display: flex;
  }

  /* ── Tablet (≤ 1024px) ──────────────────────────────────── */
  @media (max-width: 1024px) {
    .site-header .page-width {
      --gutter: min(28px, var(--thb-gutter));
    }
    .site-header__nav-list {
      gap: 24px;
    }
  }

  /* ── Mobile (≤ 767px) ───────────────────────────────────── */
  @media (max-width: 767px) {
    .site-header .page-width {
      --gutter: var(--thb-mobile-gutter);
    }
    .site-header {
      z-index: 1500;
    }
    .site-header__nav {
      height: var(--thb-mobile-header-height);
      gap: 12px;
    }
    .site-header__nav-list {
      display: none;
    }
    .site-header__nav-list.wb-menu-tree {
      display: none !important;
    }
    .site-header__search {
      display: none;
    }
    .site-header .btn--consult {
      display: none;
    }
    .site-header__dropdown-wrap {
      display: none;
    }
    .site-header__actions {
      order: 1;
      width: 40px;
      flex: 0 0 40px;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 0;
    }
    .site-header__logo {
      order: 2;
      flex: 1 1 auto;
      display: flex;
      justify-content: center;
    }
    .site-header__logo img {
      width: auto;
      height: var(--thb-mobile-logo-height);
    }
    .site-header__hamburger {
      display: flex;
      margin: 0;
    }
    .site-header__mobile-search {
      order: 3;
      width: 40px;
      height: 40px;
      flex: 0 0 40px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 0;
      padding: 0;
      background: transparent;
      color: var(--thb-header-link-color);
      cursor: pointer;
    }
    .site-header--scrolled .site-header__mobile-search {
      color: var(--thb-header-scroll-link-color);
    }
    .site-header__mobile-search svg,
    .site-header .nav-mobile__back svg {
      width: 24px;
      height: 24px;
      display: block;
      stroke: currentColor;
    }

    /* ── Mobile Nav ───────────────────────────────────────── */
    .site-header .nav-mobile {
      position: fixed;
      top: var(--thb-mobile-header-height);
      right: 0;
      bottom: 0;
      left: 0;
      z-index: 1400;
      background: rgba(255, 255, 255, 0.98);
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transform: translateY(-12px);
      transition: opacity 0.26s ease, transform 0.32s cubic-bezier(0.22, 1, 0.36, 1), visibility 0s linear 0.32s;
      will-change: opacity, transform;
      flex-direction: column;
    }
    .site-header .nav-mobile--open {
      display: flex;
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
      transform: translateY(0);
      transition: opacity 0.26s ease, transform 0.32s cubic-bezier(0.22, 1, 0.36, 1), visibility 0s;
    }
    .site-header .nav-mobile__content {
      position: relative;
      height: 100%;
      overflow: hidden;
      isolation: isolate;
    }
    .site-header .nav-mobile__panel {
      position: absolute;
      inset: 0;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      display: grid;
      align-content: start;
      gap: 28px;
      padding: 44px 20px 56px;
      background: #fff;
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transform: translateX(0);
      transition: transform 0.34s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.22s ease, visibility 0s linear 0.34s;
      will-change: transform, opacity;
    }
    .site-header .nav-mobile__panel.is-active {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
      transform: translateX(0);
      transition: transform 0.34s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.22s ease, visibility 0s;
    }
    .site-header .nav-mobile__panel.is-entering-from-right {
      opacity: 0;
      visibility: visible;
      pointer-events: none;
      transform: translateX(44px);
    }
    .site-header .nav-mobile__panel.is-entering-from-left {
      opacity: 0;
      visibility: visible;
      pointer-events: none;
      transform: translateX(-44px);
    }
    .site-header .nav-mobile__panel.is-exiting-to-left {
      opacity: 0;
      visibility: visible;
      pointer-events: none;
      transform: translateX(-36px);
    }
    .site-header .nav-mobile__panel.is-exiting-to-right {
      opacity: 0;
      visibility: visible;
      pointer-events: none;
      transform: translateX(36px);
    }
    .site-header .nav-mobile__heading {
      margin: 0;
      color: #0f172a;
      font-size: 26px;
      line-height: 1.15;
      font-weight: 700;
    }
    .site-header .nav-mobile__heading-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .site-header .nav-mobile__back {
      width: 40px;
      height: 40px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 0;
      padding: 0;
      background: transparent;
      color: #111827;
      cursor: pointer;
    }
    .site-header .nav-mobile__list {
      display: grid;
      gap: 8px;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .site-header .nav-mobile__list > li {
      display: flex;
      align-items: stretch;
      gap: 8px;
    }
    .site-header .nav-mobile__link,
    .site-header .nav-mobile__viewall,
    .site-header .nav-mobile__feature-link {
      color: #111827;
      text-decoration: none;
    }
    .site-header .nav-mobile__link {
      flex: 1;
      min-height: 52px;
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 0;
      font-size: 18px;
      line-height: 1.35;
      font-weight: 400;
    }
    .site-header .nav-mobile__expand {
      flex: 0 0 44px;
      min-height: 52px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 0;
      padding: 0;
      background: transparent;
      color: #111827;
      cursor: pointer;
    }
    .site-header .nav-mobile__entry-icon {
      flex: 0 0 auto;
      font-size: 20px;
      line-height: 1;
      transition: transform 0.22s ease;
    }
    .site-header .nav-mobile img,
    .site-header .nav-mobile [data-cms-bind-src] {
      display: none !important;
    }
    .site-header .nav-mobile__expand:hover .nav-mobile__entry-icon,
    .site-header .nav-mobile__expand:focus-visible .nav-mobile__entry-icon {
      transform: rotate(90deg);
    }
    .site-header .nav-mobile__viewall,
    .site-header .nav-mobile__feature-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 500;
    }
    .site-header .nav-mobile__feature {
      display: grid;
      gap: 14px;
    }
    .site-header .nav-mobile__feature-card {
      display: block;
      overflow: hidden;
      border-radius: 14px;
      background: #f3f4f6;
    }
    .site-header .nav-mobile__feature-card img {
      width: 100%;
      height: auto;
      display: block;
    }

    /* ── Site Search Overlay ────────────────────────────── */
    .site-header .site-search {
      position: fixed;
      inset: 0;
      z-index: 1600;
      display: flex;
      flex-direction: column;
      background: #fff;
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transform: translateY(-8px);
      transition: opacity 0.22s ease, transform 0.22s ease, visibility 0s linear 0.22s;
    }
    .site-header .site-search--open {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
      transform: translateY(0);
      transition: opacity 0.22s ease, transform 0.22s ease, visibility 0s;
    }
    .site-header .site-search__bar {
      display: flex;
      align-items: center;
      gap: 8px;
      height: var(--thb-mobile-header-height);
      padding: 0 12px 0 16px;
      border-bottom: 1px solid #e8e8e8;
      background: #fff;
    }
    .site-header .site-search__form {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 10px;
      height: 40px;
      padding: 0 12px;
      border-radius: 999px;
      background: #f2f3f5;
    }
    .site-header .site-search__icon {
      color: #999;
      font-size: 15px;
      flex: 0 0 auto;
    }
    .site-header .site-search__input {
      flex: 1;
      min-width: 0;
      border: 0;
      outline: 0;
      background: transparent;
      font-size: 15px;
      font-family: inherit;
      color: var(--text-dark);
      padding: 0;
      height: 100%;
    }
    .site-header .site-search__input::placeholder {
      color: #999;
    }
    .site-header .site-search__clear {
      flex: 0 0 auto;
      width: 24px;
      height: 24px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 0;
      padding: 0;
      background: transparent;
      color: #666;
      cursor: pointer;
    }
    .site-header .site-search__clear svg {
      width: 20px;
      height: 20px;
    }
    .site-header .site-search__close {
      flex: 0 0 auto;
      height: 40px;
      padding: 0 6px;
      border: 0;
      background: transparent;
      color: var(--primary-blue);
      font: inherit;
      font-size: 15px;
      cursor: pointer;
    }
    .site-header .site-search__body {
      flex: 1 1 auto;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      padding: 16px 20px 40px;
    }
  }
`
