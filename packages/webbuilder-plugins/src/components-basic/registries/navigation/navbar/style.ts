export const NAVBAR_STYLES = `
  a {
    text-decoration: none;
  }
  /* ── Navbar base ───────────────────────────────────────────── */
  .gjs-navbar {
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    --wb-navbar-current-link-color: var(--wb-navbar-link-color, #ffffff);
    height: var(--wb-navbar-height, 72px);
    padding: 0 var(--wb-navbar-padding-x, 24px);
    max-width: 100%;
    box-sizing: border-box;
    color: var(--wb-navbar-current-link-color);
    transition: background 0.3s, box-shadow 0.3s, color 0.3s;
    background-color: var(--wb-navbar-bg, #003152);
  }
  .gjs-navbar--sticky {
    position: sticky;
  }
  .gjs-navbar--fixed-transparent {
    position: fixed;
    --wb-navbar-current-link-color: var(--wb-navbar-transparent-link-color, #ffffff);
    background-color: var(--wb-navbar-transparent-bg, transparent);
  }
  .gjs-navbar.is-scrolled {
    --wb-navbar-current-link-color: var(--wb-navbar-scroll-link-color, var(--wb-navbar-link-color, currentColor));
    background: var(--wb-navbar-scroll-bg, var(--wb-navbar-bg, #003152));
    background-color: var(--wb-navbar-scroll-bg, var(--wb-navbar-bg, #003152));
    box-shadow: 0 10px 30px rgba(4, 16, 56, 0.12);
  }
  .gjs-navbar--fixed-transparent:hover,
  .gjs-navbar--fixed-transparent.is-scrolled {
    background: var(--wb-navbar-scroll-bg, var(--wb-navbar-bg, #003152));
    background-color: var(--wb-navbar-scroll-bg, var(--wb-navbar-bg, #003152));
  }

  /* ── Inner: three-column flex layout ────────────────────────── */
  .gjs-navbar__inner {
    display: flex;
    height: 100%;
    align-items: center;
    margin: 0 auto;
    gap: 16px;
    max-width: 1352px;
    padding-inline: 20px;
  }

  /* ── Left slot (brand / logo) ───────────────────────────────── */
  .gjs-navbar__left {
    display: flex;
    align-items: center;
    flex: 0 0 auto;
  }
  .gjs-logo{
      height: var(--wb-navbar-logo-height, 40px);
  }
  .gjs-logo__img {
      height: 100%
    }
  /* ── Center slot (nav menu) ──────────────────────────────────── */
  .gjs-navbar__center {
    display: flex;
    height: 100%;
    align-items: center;
    flex: 1;
    justify-content: center;
    min-width: 0;
  }

  /* ── Menu alignment variants (toggled via addClass in init) ──── */
  .gjs-navbar--menu-left  .gjs-navbar__center { justify-content: flex-start; }
  .gjs-navbar--menu-right .gjs-navbar__center { justify-content: flex-end; }

  /* ── Right slot (actions — droppable) ───────────────────────── */
  .gjs-navbar__right {
    display: flex;
    align-items: center;
    flex: 0 0 auto;
    row-gap: 0;
    column-gap: 16px;
    color: var(--wb-navbar-current-link-color, currentColor);
  }

  /* ── Desktop menu ───────────────────────────────────────────── */
  .gjs-navbar__menu {
    display: flex;
    align-items: center;
    gap: var(--wb-navbar-menu-gap, 28px);
    height: 100%;
  }
  .gjs-navbar__menu-item {
    display: contents;
  }
  .gjs-navbar__link {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    height: 100%;
    padding: 8px 14px;
    font-size: 0.875rem;
    text-decoration: none;
    transition: color 0.15s, background 0.15s;
    white-space: nowrap;
    color: var(--wb-navbar-current-link-color, currentColor);
    text-transform: uppercase;
  }
  .gjs-navbar__link.is-active{
    background: #0A3D60;
  }
  .gjs-navbar__link::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 3px;
    background: #FFE200;
    opacity: 0;
    transform: scaleX(0.4);
    transform-origin: left;
    transition: opacity 0.18s ease, transform 0.18s ease;
  }
  .gjs-navbar__link:hover {
    color: var(--wb-navbar-current-link-color, currentColor);
    background-color: #0A3D60;
  }
  .gjs-navbar__link.is-active::after,
  .gjs-navbar__link[aria-current="page"]::after {
    opacity: 1;
    transform: scaleX(1);
  }
  .gjs-navbar.is-scrolled .gjs-navbar__link {
    color: var(--wb-navbar-current-link-color, currentColor);
  }
  .gjs-navbar.is-scrolled .gjs-navbar__link:hover {
    color: var(--wb-navbar-current-link-color, currentColor);
  }
  .gjs-navbar__link--cta {
    padding: 10px 32px;
    background-color: #FFE200;
    color: #00101A;
    font-size: 16px;
    line-height: 1.4;
    text-transform: none;
    transition: transform .2s ease-in-out;
  }
  .gjs-navbar__link--cta:hover {
    color: #00101a;
    transform: translateY(-2px);
  }

  /* ── Burger (hidden on desktop) ─────────────────────────────── */
  .gjs-navbar__burger {
    display: none;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    cursor: pointer;
    border: none;
    background: transparent;
    padding: 6px;
  }
  .gjs-navbar__burger span {
    display: block;
    width: 18px;
    height: 2px;
    background-color: var(--wb-navbar-current-link-color, #ffffff);
    background-color: #ffffff;
    transition: transform 0.2s, opacity 0.2s;
  }
  .gjs-navbar__burger:hover span {
    background-color: var(--wb-navbar-current-link-color, #ffffff);
  }
  .gjs-navbar.is-scrolled .gjs-navbar__burger span {
    background-color: var(--wb-navbar-current-link-color, #ffffff);
    background-color: #ffffff;
  }

  /* ── Overlay ────────────────────────────────────────────────── */
  .gjs-navbar__overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    z-index: 1;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.28s, visibility 0.28s;
    backdrop-filter: blur(2px);
  }
  @media (min-width: 1023px){
    .gjs-navbar__overlay{
      top: 72px;
    }
  }
  .gjs-navbar__overlay.is-open {
    opacity: 1;
    visibility: visible;
  }

  /* ── Drawer close button ────────────────────────────────────── */
  .gjs-navbar__close {
    display: none;
    position: absolute;
    top: 16px;
    right: 16px;
    width: 36px;
    height: 36px;
    align-items: center;
    justify-content: center;
    border: none;
    background: rgba(0, 0, 0, 0.08);
    color: #000;
    cursor: pointer;
    font-size: 18px;
    line-height: 1;
    transition: background 0.15s, color 0.15s;
  }

  /* ── Mobile ─────────────────────────────────────────────────── */
  @media (max-width: 1023px) {
    .gjs-navbar__inner {
      justify-content: space-between;
      min-height: var(--wb-navbar-height, 72px);
    }
    .gjs-logo__img {
      height: var(--wb-navbar-logo-mobile-height, 28px);
    }

    /* Center slot: collapse to zero-width so fixed drawer still works */
    .gjs-navbar__center {
      flex: 0 0 0;
      width: 0;
      min-width: 0;
      overflow: visible;
    }

    /* Right slot: hide CTA; keep search and burger visible */
    .gjs-navbar__right > .gjs-navbar__link--cta {
      display: none;
    }

    .gjs-navbar__burger {
      display: flex;
    }

    /* Drawer */
    .gjs-navbar__menu {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: min(var(--wb-navbar-drawer-width, 360px), 48vw);
      flex-direction: column;
      align-items: stretch;
      gap: 2px;
      background-color: var(--wb-navbar-drawer-bg, #ffffff);
      z-index: 999;
      padding-top: var(--wb-navbar-drawer-padding-top, 72px);
      padding-bottom: var(--wb-navbar-drawer-padding-bottom, 24px);
      padding-inline: var(--wb-navbar-drawer-padding-x, 12px);
      transform: translateX(105%);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow-y: auto;
      box-shadow: -8px 0 40px rgba(0, 0, 0, 0.4);
    }
    .gjs-navbar__menu.is-open {
      transform: translateX(0);
    }

    /* ── Left drawer ─────────────────────────────────────────── */
    .gjs-navbar--drawer-left .gjs-navbar__menu {
      right: auto;
      left: 0;
      transform: translateX(-105%);
      box-shadow: 8px 0 40px rgba(0, 0, 0, 0.4);
    }
    .gjs-navbar--drawer-left .gjs-navbar__menu.is-open {
      transform: translateX(0);
    }

    .gjs-navbar__close {
      display: flex;
    }

    .gjs-navbar__link {
      padding: 12px;
      font-size: 1rem;
      width: 100%;
      height: auto;
      justify-content: flex-start;
      color: #000A11;
      text-transform: none;
    }
    .gjs-navbar__link::after {
      left: 12px;
      right: auto;
      bottom: 0;
      width: 28px;
      transform-origin: left center;
    }
    .gjs-navbar__link--cta {
      margin-top: 8px;
      text-align: center;
      padding: 12px 16px;
    }
  }

  @media (max-width: 767px) {
  .gjs-navbar {
    z-index: 100;
    max-width: 100%;
    box-sizing: border-box;
    background: var(--wb-navbar-bg, #003152);
    color: var(--wb-navbar-current-link-color, #ffffff);
    border: none;
    border-radius: 0;
    transition: background 0.3s ease, color 0.3s ease;
    height: var(--wb-navbar-mobile-height, 72px)
  }
  .gjs-navbar.is-scrolled{
  
  }
  .gjs-navbar--fixed-transparent {
    background: var(--wb-navbar-transparent-bg, transparent);
  }
  .gjs-navbar--fixed-transparent.is-scrolled {
    background: var(--wb-navbar-scroll-bg, var(--wb-navbar-bg, #003152));
  }
    .gjs-navbar__inner {
      min-height: 48px;
      gap: 12px;
      justify-content: space-between;
      align-items: center;
    }
    .gjs-navbar__left {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 14px;
      min-width: 0;
    }
    .gjs-logo__img {
      height: 100%;
    }
    .gjs-navbar__right {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      flex: 0 0 auto;
    }
    .gjs-navbar__right > .gjs-search {
      display: flex;
      color: var(--wb-navbar-current-link-color, #ffffff);
    }
    .gjs-search__btn {
      width: 42px;
      height: 42px;
      color: var(--wb-navbar-current-link-color, #ffffff);
    }
    .gjs-navbar__burger {
      flex: 0 0 auto;
      margin-right: 2px;
      padding: 0;
      border-radius: 0;
    }
    .gjs-navbar__burger span {
      width: 17px;
      height: 1.5px;
      border-radius: 0;
      background-color: var(--wb-navbar-current-link-color, #ffffff);
    background-color: #ffffff;
     
    }
    .gjs-navbar__burger:hover span{
      background-color: var(--wb-navbar-current-link-color, #ffffff);
    }
    .gjs-navbar.is-scrolled .gjs-navbar__burger span {
      background-color: var(--wb-navbar-current-link-color, #ffffff);
    }
    .gjs-navbar__menu {
      width: min(var(--wb-navbar-drawer-width, 360px), 82vw);
    }
  }

  /* ── Nav Group ───────────────────────────────────────────────── */
  .gjs-nav-group {
    height: 100%;
    position: relative;
    --wb-nav-group-dropdown-left: 0;
    --wb-nav-group-dropdown-right: auto;
    --wb-nav-group-dropdown-translate-x: 0;
    --wb-nav-group-dropdown-min-width: 180px;
    --wb-nav-group-dropdown-offset: 16px;
    --wb-nav-group-dropdown-bg: #ffffff;
    --wb-nav-group-mega-bg: #ffffff;
    --wb-nav-group-mega-radius: 0;
  }
  .gjs-nav-group--mega {
    position: static;
    height: 100%;
  }
  .gjs-nav-group__btn {
    height: 100%;
    display: inline-flex;
    align-items: center;
    position: relative;
    gap: 5px;
    padding: 8px 14px;
    font-size: 0.875rem;
    color: var(--wb-navbar-current-link-color, currentColor);
    background: none;
    border: none;
    cursor: pointer;
    transition: color 0.15s, background 0.15s;
    white-space: nowrap;
    text-transform: uppercase;
  }
  .gjs-nav-group__btn::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 3px;
    background: #FFE200;
    opacity: 0;
    transform: scaleX(0.4);
    transition: opacity 0.18s ease, transform 0.18s ease;
  }
  .gjs-nav-group__btn:hover {
    color: var(--wb-navbar-current-link-color, currentColor);
    background-color: #0A3D60;
  }
  .gjs-nav-group.is-active > .gjs-nav-group__btn::after,
  .gjs-nav-group.is-active > .gjs-nav-group__btn[aria-current="page"]::after {
    opacity: 1;
    transform: scaleX(1);
  }
  .gjs-navbar.is-scrolled .gjs-nav-group__btn {
    color: var(--wb-navbar-current-link-color, currentColor);
  }
  .gjs-navbar.is-scrolled .gjs-nav-group__btn:hover {
    color: var(--wb-navbar-current-link-color, currentColor);
  }
  .gjs-nav-group__btn-chevron {
    display: flex;
    align-items: center;
    transition: transform 0.2s;
  }
  .gjs-nav-group:hover .gjs-nav-group__btn-chevron {
    transform: rotate(180deg);
  }

  /* ── Regular dropdown ────────────────────────────────────────── */
  .gjs-nav-group__dropdown {
    position: absolute;
    top: 100%;
    left: var(--wb-nav-group-dropdown-left, 50%);
    right: var(--wb-nav-group-dropdown-right, auto);
    padding-top: var(--wb-nav-group-dropdown-offset, 16px);
    background: transparent;
    transform: translateX(var(--wb-nav-group-dropdown-translate-x, -50%));
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.18s, visibility 0.18s, transform 0.18s;
    z-index: 200;
  }
  .gjs-nav-group:hover .gjs-nav-group__dropdown {
    opacity: 1;
    visibility: visible;
  }
  .gjs-nav-group__dropdown-inner {
    min-width: var(--wb-nav-group-dropdown-min-width, 180px);
    background-color: var(--wb-nav-group-dropdown-bg, #ffffff);
    border-radius: 0;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(15, 23, 42, 0.08);
    transform: translateY(-6px);
    transition: transform 0.18s;
  }
  .gjs-nav-group:hover .gjs-nav-group__dropdown-inner {
    transform: translateY(0);
  }
  .gjs-nav-group__dropdown-item {
    display: block;
    padding: 8px 12px;
    font-size: 0.875rem;
    color: #334155;
    text-decoration: none;
    white-space: nowrap;
    transition: color 0.15s, background 0.15s;
  }
  .gjs-nav-group__dropdown-item:hover {
    color: #003152;
    background-color: #F7F8FA;
  }
  .gjs-nav-group__dropdown-item.is-active,
  .gjs-nav-group__dropdown-item[aria-current="page"] {
    color: #003152;
    background-color: #F7F8FA;
    font-weight: 600;
  }

  /* ── Mega menu ───────────────────────────────────────────────── */
  /* ── Mega Menu: transparent bridge wrapper ──────────────────────── */
  /* This outer wrapper is positioned flush to the bottom of the trigger
     button (top: 100%) and uses padding-top as a transparent "bridge"
     that keeps .gjs-nav-group--mega:hover active while the cursor travels
     across the gap. padding-top is overridden per-component via the
     ngOffset trait (inline style). */
     
  @media (min-width: 1024px) {
    .gjs-nav-group__mega {
      min-height: 480px;
    }
    .gjs-nav-group__mega-inner {
      min-height: 480px;
    }
    .gjs-nav-group__mega-left,
    .gjs-nav-group__mega-right {
      min-height: 480px;
      height: 100%;
    }
  }
  .gjs-nav-group__mega {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    padding-top: 8px;
    background: transparent;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.18s, visibility 0.18s;
    z-index: 200;
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.10);
  }
  .gjs-nav-group--mega:hover .gjs-nav-group__mega,
  .gjs-nav-group--mega.tooto-hovered .gjs-nav-group__mega,
  .gjs-nav-group--mega.tooto-selected .gjs-nav-group__mega,
  .gjs-nav-group__btn:hover + .gjs-nav-group__mega,
  .gjs-nav-group.is-open .gjs-nav-group__mega {
    opacity: 1;
    visibility: visible;
  }
  .gjs-nav-group__mega.is-scrolled{
    padding-top: 0 !important;
  }
  /* ── Mega Menu: inner visual panel (two fixed columns) ──────────── */
  .gjs-nav-group__mega-inner {
    display: block;
    position: relative;
    width: min(100%, 1352px);
    margin: 0 auto;
    padding-inline: 20px;
    box-sizing: border-box;
    overflow: visible;
    background: var(--wb-nav-group-mega-bg, #ffffff);
    border-radius: var(--wb-nav-group-mega-radius, 0);
    transform: translateY(-6px);
    transition: transform 0.18s;
  }
  .gjs-nav-group__mega-inner.is-scrolled{
  }
  .gjs-nav-group--mega:hover .gjs-nav-group__mega-inner,
  .gjs-nav-group--mega.tooto-hovered .gjs-nav-group__mega-inner,
  .gjs-nav-group--mega.tooto-selected .gjs-nav-group__mega-inner,
  .gjs-nav-group__btn:hover + .gjs-nav-group__mega .gjs-nav-group__mega-inner,
  .gjs-nav-group.is-open .gjs-nav-group__mega-inner {
    transform: translateY(0);
  }

  /* ── Left panel: stacks menu-group columns side-by-side ──────────── */
  .gjs-nav-group__mega-left {
    width: var(--wb-mega-left-width, 50%);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 80px 20px;
    min-width: 0;
    box-sizing: border-box;
    background: var(--wb-nav-group-mega-bg, #ffffff);
    min-height: 100%;
  }
  .gjs-nav-group__mega-left-stack {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-width: 0;
  }

  /* ── Right panel: feature image ──────────────────────────────────── */
  .gjs-nav-group__mega-right {
    display: var(--wb-mega-right-display, flex);
    position: absolute;
    top: 0;
    right: min(0px, calc((100vw - 1352px) / -2));
    bottom: 0;
    width: var(--wb-mega-right-width, 50vw);
    align-items: stretch;
    overflow: hidden;
    box-sizing: border-box;
    padding: var(--wb-mega-image-padding, 0);
  }
  .gjs-nav-group__mega-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  /* ── Mega column ─────────────────────────────────────────────────── */
  .gjs-nav-group__mega-col {
    flex: 1;
    min-width: 160px;
    padding: 0 32px 0 0;
    margin-right: 32px;
  }
  .gjs-nav-group__mega-col:last-child {
    padding-right: 0;
    margin-right: 0;
    border-right: none;
  }

  .gjs-nav-group__mega-col-title {
    font-size: 36px;
    font-weight: 600;
    color: #0f172a;
    padding-bottom: 16px;
    margin-bottom: 0;
  }

  /* ── Mega item ───────────────────────────────────────────────────── */
  .gjs-nav-group__mega-item {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    position: relative;
    padding: 0;
    font-size: 24px;
    line-height: 2em;
    color: #768389;
    font-weight: 400;
    text-decoration: none;
    border: none;
    transition: color 0.18s ease;
    gap: 0;
    width: max-content;
    max-width: 100%;
    opacity: 0;
    transform: translateY(10px);
    transition:
      color 0.18s ease,
      opacity 0.28s ease,
      transform 0.28s ease;
  }
  .gjs-nav-group--mega:hover .gjs-nav-group__mega-item,
  .gjs-nav-group--mega.tooto-hovered .gjs-nav-group__mega-item,
  .gjs-nav-group--mega.tooto-selected .gjs-nav-group__mega-item,
  .gjs-nav-group__btn:hover + .gjs-nav-group__mega .gjs-nav-group__mega-item,
  .gjs-nav-group.is-open .gjs-nav-group__mega-item {
    opacity: 1;
    transform: translateY(0);
  }
  .gjs-nav-group__mega-item:nth-of-type(1) { transition-delay: 0ms; }
  .gjs-nav-group__mega-item:nth-of-type(2) { transition-delay: 50ms; }
  .gjs-nav-group__mega-item:nth-of-type(3) { transition-delay: 100ms; }
  .gjs-nav-group__mega-item:nth-of-type(4) { transition-delay: 150ms; }
  .gjs-nav-group__mega-item:nth-of-type(5) { transition-delay: 200ms; }
  .gjs-nav-group__mega-item:nth-of-type(6) { transition-delay: 250ms; }
  .gjs-nav-group__mega-item:nth-of-type(7) { transition-delay: 300ms; }
  .gjs-nav-group__mega-item:nth-of-type(8) { transition-delay: 350ms; }
  .gjs-nav-group__mega-item:first-of-type {
  }
  .gjs-nav-group__mega-item:hover {
    color: #003152;
    font-weight: 500;
  }
  .gjs-nav-group__mega-item.is-active {
    color: #003152;
    font-weight: 500;
  }
  .gjs-nav-group__mega-item-label {
    flex: 1;
    position: relative;
  }
  .gjs-nav-group__mega-item-label::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: 0.2em;
    width: 0;
    height: 1px;
    background: #003152;
    transition: width 0.22s ease;
  }
  .gjs-nav-group__mega-item:hover .gjs-nav-group__mega-item-label::after,
  .gjs-nav-group__mega-item.is-active .gjs-nav-group__mega-item-label::after {
    width: 100%;
  }
  .gjs-nav-group__mega-item-icon {
    display: none;
  }
  .gjs-nav-group__mega-item:hover .gjs-nav-group__mega-item-icon {
  }
  .gjs-nav-group__mega-item.is-active .gjs-nav-group__mega-item-icon {
  }
  .gjs-nav-group__mega-footer-link {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    margin-top: 36px;
    font-size: 0.9375rem;
    color: #0b3b63;
    text-decoration: none;
    width: fit-content;
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 0.28s ease 350ms, transform 0.28s ease 350ms;
  }
  .gjs-nav-group--mega:hover .gjs-nav-group__mega-footer-link,
  .gjs-nav-group--mega.tooto-hovered .gjs-nav-group__mega-footer-link,
  .gjs-nav-group--mega.tooto-selected .gjs-nav-group__mega-footer-link,
  .gjs-nav-group__btn:hover + .gjs-nav-group__mega .gjs-nav-group__mega-footer-link,
  .gjs-nav-group.is-open .gjs-nav-group__mega-footer-link {
    opacity: 1;
    transform: translateY(0);
  }
  .gjs-nav-group__mega-footer-icon {
    font-size: 1.125rem;
    line-height: 1;
  }

  /* ── Nav Group mobile (accordion) ────────────────────────────── */
  @media (max-width: 1023px) {
    .gjs-nav-group {
      position: static;
      width: 100%;
      height: auto;
    }
    .gjs-nav-group__btn {
      width: 100%;
      height: auto;
      padding: 12px;
      font-size: 1rem;
      justify-content: space-between;
      color: #000A11;
      text-transform: none;
    }
    .gjs-nav-group__btn::after {
      left: 12px;
      right: auto;
      bottom: 6px;
      width: 28px;
      transform-origin: left center;
    }
    .gjs-nav-group__btn:hover,
    .gjs-navbar.is-scrolled .gjs-nav-group__btn,
    .gjs-navbar.is-scrolled .gjs-nav-group__btn:hover {
      color: #000A11;
      background-color: #f6f7f8;
    }
    .gjs-nav-group:hover .gjs-nav-group__btn-chevron {
      transform: none;
    }
    .gjs-nav-group.is-open .gjs-nav-group__btn-chevron {
      transform: rotate(180deg);
    }
    .gjs-nav-group:hover .gjs-nav-group__dropdown {
      opacity: 1;
      visibility: visible;
      transform: none;
    }
    .gjs-nav-group__dropdown {
      position: static;
      opacity: 1;
      visibility: visible;
      transform: none;
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.28s ease, padding 0.28s ease;
      padding: 0;
      background: transparent;
      z-index: auto;
      margin: 2px 0;
    }
    .gjs-nav-group.is-open .gjs-nav-group__dropdown {
      max-height: 500px;
      padding-top: 0;
    }
    .gjs-nav-group__dropdown-inner {
      transform: none !important;
      transition: none;
      background: rgba(255, 255, 255, 0.04);
      padding: 0;
      box-shadow: none;
      border: none;
      min-width: 0;
    }
    .gjs-nav-group.is-open .gjs-nav-group__dropdown-inner {
    }
    .gjs-nav-group__mega {
      position: static;
      padding-top: 0 !important;
      background: transparent;
      opacity: 1;
      visibility: visible;
      transition: none;
      max-height: 0;
      overflow: hidden;
      z-index: auto;
      margin: 2px 0;
    }
    .gjs-nav-group.is-open .gjs-nav-group__mega {
      max-height: 800px;
    }
    .gjs-nav-group__mega-inner {
      border:0;
      padding: 0;
      box-shadow: none;
      flex-direction: column;
      gap: 0;
      overflow: visible;
      transform: none !important;
      transition: none;
    }
    .gjs-nav-group__mega-col-title{
      display: none;
    }
    .gjs-nav-group__mega-left {
      flex: none;
      width: 100%;
      flex-direction: column;
      padding: 10px 12px;
      gap: 0;
    }
    .gjs-nav-group__mega-footer-link {
      margin-top: 18px;
    }
    .gjs-nav-group__mega-right {
      display: none !important;
    }
    .gjs-nav-group__mega-col {
      flex: none;
      width: 100%;
      padding: 8px 0;
      margin-right: 0;
      border-right: none;
      border-bottom: 1px solid #e2e8f0;
    }
    .gjs-nav-group__mega-col:last-child {
      border-bottom: none;
      padding-block: 0;
    }
    .gjs-nav-group__mega-item {
      padding: 10px 0;
      font-size: 0.9rem;
      opacity: 1;
      transform: none;
      transition: color 0.18s ease;
    }
    .gjs-nav-group__mega-footer-link {
      opacity: 1;
      transform: none;
      transition: none;
    }
  }
`
