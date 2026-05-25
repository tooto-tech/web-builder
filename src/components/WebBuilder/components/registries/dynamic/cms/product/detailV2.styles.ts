export const PRODUCT_DETAIL_V2_STYLES = `
  .wb-product-detail-v2 {
    display:block;
    width:100%;
    background:#fff;
    color:#1e3f5a;
    font-family:"Poppins","Nunito Sans","PingFang SC","Helvetica Neue",Arial,sans-serif;
  }

  .wb-product-detail-v2__header {
    display:flex;
    align-items:center;
    gap:8px;
    padding:6px 10px;
    background:#fef3c7;
    border-bottom:1px solid #fde68a;
    border-radius:4px 4px 0 0;
    font-size:11px;
    color:#78350f;
    pointer-events:none;
    user-select:none;
    font-weight:500;
  }

  .wb-product-detail-v2__container {
    max-width:1160px;
    margin:0 auto;
    padding: 72px 20px 0;
  }

  .wb-product-detail-v2__breadcrumb {
    display:flex;
    align-items:center;
    gap:10px;
    padding:16px 0 18px;
    font-size:11px;
    line-height:1.4;
    color:#6f8090;
  }

  .wb-product-detail-v2__breadcrumb-back {
    display:inline-flex;
    align-items:center;
    gap:5px;
    padding:0;
    border:none;
    background:none;
    color:#415c72;
    cursor:pointer;
    font-size:11px;
    line-height:1.4;
  }

  .wb-product-detail-v2__breadcrumb-name {
    min-width:0;
    color:#6f8090;
  }

  .wb-product-detail-v2__hero {
    display:grid;
    grid-template-columns:minmax(430px, 0.92fr) minmax(470px, 1fr);
    gap:42px;
    align-items:start;
    padding-bottom: 80px;
  }

  @media (min-width: 768px){
    .wb-product-gallery{
      position: sticky;
      top: 72px;
     }
  }
  
  .wb-product-gallery { margin-bottom:0; }
  .wb-product-gallery__stage {
    position:relative;
    overflow:hidden;
    background:#f4f5f7;
    aspect-ratio:1/1;
    margin-bottom:12px;
    cursor:zoom-in;
    border:1px solid #e4e8ee;
  }
  .wb-product-gallery__stage.is-zooming { cursor:crosshair; }
  .wb-product-gallery__main-img {
    width:100%;
    height:100%;
    display:block;
    object-fit:cover;
    background:#fff;
    transition:transform .18s ease;
    transform-origin:center center;
  }
  .wb-product-gallery__thumbs-wrap {
    display:block;
  }
  .wb-product-gallery__thumbs-viewport {
    overflow:visible;
    scrollbar-width:none;
  }
  .wb-product-gallery__thumbs-viewport::-webkit-scrollbar { display:none; }
  .wb-product-gallery__thumbs {
    display:grid;
    grid-template-columns:repeat(4, minmax(0, 1fr));
    gap:10px;
    align-items:stretch;
  }
  .wb-product-gallery__thumb {
    width:100%;
    height:auto;
    aspect-ratio:1/1;
    border:1px solid #d8dee6;
    background:#fff;
    cursor:pointer;
    padding:0;
    overflow:hidden;
    transition:border-color .2s ease, box-shadow .2s ease;
  }
  .wb-product-gallery__thumb.is-active {
    border-color:#7c90a4;
    box-shadow:0 0 0 1px #7c90a4 inset;
  }
  .wb-product-gallery__thumb-img {
    width:100%;
    height:100%;
    display:block;
    object-fit:cover;
  }
  .wb-product-gallery__nav {
    display:none;
  }
  .wb-product-gallery__nav svg {
    width:16px;
    height:16px;
    display:block;
  }

  .wb-product-detail-v2__info {
    display:flex;
    flex-direction:column;
    gap:8px;
    padding-top:10px;
  }

  .wb-product-detail-v2__brand {
    margin:0;
    font-size:14px;
    line-height:1.6;
    color:#1E2C32;
  }

  .wb-product-detail-v2__name {
    margin:0;
    font-size:30px;
    line-height:1.25;
    font-weight:600;
    color:#000A11;
    max-width:600px;
  }

  .wb-product-detail-v2__docs {
    display:flex;
    flex-wrap:wrap;
    gap:8px;
    margin-block: 24px;
  }
  .wb-product-detail-v2__docs:empty{
    margin-block: 10px;
  }

  .wb-product-detail-v2__doc-link {
    display:inline-flex;
    align-items:center;
    gap:7px;
    color:#183b56;
    font-size:14px;
    line-height:1.7;
    font-weight:500;
    text-decoration:none;
  }
  .wb-product-detail-v2__doc-link svg {
    width:14px;
    height:14px;
    display:block;
  }

  .wb-product-detail-v2__tabs {
    display:grid;
    grid-template-columns: repeat(4, 1fr);
    scroll-behavior:smooth;
  }

  .wb-product-detail-v2__tab {
    border:none;
    background:#F0F0F0;
    color:#000A11;
    font-size:16px;
    line-height:1.4;
    font-weight:500;
    cursor:pointer;
    min-height: 48px;
    position: relative;
  }
  .wb-product-detail-v2__tab::before{
    content: '';
    position: absolute;
    inset: 0;
    background:#9aa8b5;
    opacity:0;
    z-index:1;
  }
  .wb-product-detail-v2__tab-text{
    position: relative;
    z-index:2;
  }
   .wb-product-detail-v2__tab:not(:last-of-type)::after{
    content: '';
    position: absolute;
    width: 0;
    height: 60%;
    border-left: 1px solid #d8d8d8;
    top: 50%;
    transform: translateY(-50%) scaleX(0.5);
    right: 0;
   }

  .wb-product-detail-v2__tab.is-active {
    /* background:#9aa8b5; */
    color:#fff;
  }
  .wb-product-detail-v2__tab.is-active::before{
    opacity: 1;
  }

  .wb-product-detail-v2__panel {
    display:none;
    padding:16px;
  }

  .wb-product-detail-v2__panel.is-active {
    display:block;
  }

  .wb-product-detail-v2__intro,
  .wb-product-detail-v2__feature-desc,
  .wb-product-detail-v2__faq-answer {
    font-size:14px;
    line-height:1.78;
    color:#5f7284;
  }
  .wb-product-detail-v2__intro p,
  .wb-product-detail-v2__feature-desc p,
  .wb-product-detail-v2__faq-answer p,
  .wb-product-detail-v2__spec-value p {
    margin:0 0 8px;
  }
  .wb-product-detail-v2__intro p:last-child,
  .wb-product-detail-v2__feature-desc p:last-child,
  .wb-product-detail-v2__faq-answer p:last-child,
  .wb-product-detail-v2__spec-value p:last-child {
    margin-bottom:0;
  }

  .wb-product-detail-v2__feature-list,
  .wb-product-detail-v2__spec-groups,
  .wb-product-detail-v2__spec-list,
  .wb-product-detail-v2__faq-list {
    display:flex;
    flex-direction:column;
    gap:0;
  }

  .wb-product-detail-v2__spec-groups {
    gap:28px;
  }

  .wb-product-detail-v2__spec-group {
    min-width:0;
  }

  .wb-product-detail-v2__spec-group-title {
    margin:0 0 10px;
    font-size:18px;
    line-height:1.35;
    font-weight:600;
    color:#000A11;
  }

  .wb-product-detail-v2__spec-row,
  .wb-product-detail-v2__faq-item {
    border-bottom:1px solid #d7dde3;
    padding:16px 0;
  }

  .wb-product-detail-v2__spec-key {
    font-size:14px;
    font-weight:500;
    color:#000A11;
    text-transform:uppercase;
    margin:0 0 6px;
  }

  .wb-product-detail-v2__spec-row {
    display:grid;
    grid-template-columns:minmax(145px, 0.7fr) minmax(0, 1.3fr);
    gap:18px;
    align-items:start;
  }

  .wb-product-detail-v2__spec-value {
    font-size:14px;
    line-height:1.78;
    color:#5f7284;
  }

  .wb-product-detail-v2__feature-list {
    margin:0;
    padding-left:20px;
    display:block;
  }

  .wb-product-detail-v2__feature-item {
    color:#5f7284;
    font-size:14px;
    line-height:1.78;
    margin:0 0 6px;
    padding:0;
  }

  .wb-product-detail-v2__feature-item:last-child {
    margin-bottom:0;
  }

  .wb-product-detail-v2__feature-text {
    display:inline;
  }

  .wb-product-detail-v2__faq-item {
    padding:0;
  }

  .wb-product-detail-v2__faq-summary {
    list-style:none;
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:16px;
    cursor:pointer;
    padding:16px 0;
    color:#183b56;
    font-weight:600;
    font-size:14px;
    line-height:1.5;
  }

  .wb-product-detail-v2__faq-summary::-webkit-details-marker { display:none; }
  .wb-product-detail-v2__faq-summary::marker { display:none; content:''; }

  .wb-product-detail-v2__faq-icon {
    color:#90a0ae;
    font-size:16px;
    transition:transform .2s ease;
  }

  .wb-product-detail-v2__faq-item[open] .wb-product-detail-v2__faq-icon {
    transform:rotate(180deg);
  }

  .wb-product-detail-v2__faq-answer {
    padding:0 0 16px;
  }

  .wb-product-detail-v2__options {
    display:flex;
    flex-direction:column;
    gap:32px;
    padding-top:8px;
  }

  .wb-product-detail-v2__option-group {
    padding-top:0;
  }
.wb-product-detail-v2__actions--tips{
  font-size: 16px;
  line-height: 1;
  color: #344850;
  margin-top: 16px;
}
  .wb-product-detail-v2__option-label {
    margin:0 0 16px;
    font-size:16px;
    line-height:1;
    color:#1B2149;
    font-weight: 400;
  }

  .wb-product-detail-v2__option-values {
    display:flex;
    flex-wrap:wrap;
    gap:8px;
  }

  .wb-product-detail-v2__option-value {
    display:inline-flex;
    align-items:center;
    justify-content:flex-start;
    gap:8px;
    min-height:48px;
    padding: 4px;
    border:1px solid #EDEDED;
    background:#fff;
    color:#44576a;
    font-size:12px;
    line-height:1.3;
    border-radius: 2px;
    box-sizing:border-box;
    white-space:nowrap;
    cursor:pointer;
    transition:border-color .2s ease, box-shadow .2s ease, background-color .2s ease;
    appearance:none;
    outline:none;
  }
  .wb-product-detail-v2__option-value:hover{
    border-color:#29375C;
   }
  .wb-product-detail-v2__option-value.is-active {
    border-color:#29375C;
  }
  .wb-product-detail-v2__option-value.is-text-only {
    justify-content:center;
    padding-inline: 16px;
  }

  .wb-product-detail-v2__option-swatch {
    width:40px;
    height:40px;
    display:inline-block;
    flex:0 0 auto;
  }

  .wb-product-detail-v2__option-image {
    width:40px;
    height:40px;
    object-fit:cover;
    flex:0 0 auto;
  }

  .wb-product-detail-v2__option-text {
    display:inline-block;
    max-width:100%;
  }

  .wb-product-detail-v2__actions {
    display:flex;
    flex-wrap:wrap;
    gap:10px;
    margin-top: 64px;
  }

  .wb-product-detail-v2__action {
    flex:1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width:112px;
    min-height: 50px;
    padding:10px 20px;
    border:1px solid #183b56;
    background:#fff;
    color:#183b56;
    text-decoration:none;
    text-align:center;
    font-weight:500;
    font-size:16px;
    line-height:1.2;
    box-sizing:border-box;
    cursor: pointer;
  }

  .wb-product-detail-v2__action--primary {
    background:#ffd30a;
    border-color:#ffd30a;
    color:#183b56;
  }

  .wb-product-detail-v2__related {
    width:100vw;
    margin-left:calc(50% - 50vw);
    margin-right:calc(50% - 50vw);
    margin-top:0;
    padding:100px 0;
    background-color: #ECEEF0;
    overflow:hidden;
    box-sizing:border-box;
  }
  .wb-product-detail-v2__related,
  .wb-product-detail-v2__related *,
  .wb-product-detail-v2__related *::before,
  .wb-product-detail-v2__related *::after {
    box-sizing:border-box;
  }
  .wb-product-detail-v2__related a {
    color:currentColor;
    text-decoration:none;
  }
  .wb-product-detail-v2__related .wb-content-carousel__container {
    width:100%;
    max-width: 1160px;
    margin:0 auto;
    padding:0 20px;
  }
  .wb-product-detail-v2__related .wb-content-carousel__header {
    display:flex;
    align-items:flex-start;
    gap:24px;
    margin-bottom:48px;
  }
  .wb-product-detail-v2__related .wb-content-carousel__title {
    margin:0;
    color:#000a11;
    font-size:48px;
    font-weight:600;
    line-height:1.15;
    letter-spacing:0;
  }
  .wb-product-detail-v2__related .wb-content-carousel__nav {
    margin-left:auto;
    display:flex;
    align-items:center;
    gap:16px;
  }
  .wb-product-detail-v2__related .wb-content-carousel__nav-btn {
    width:64px;
    height:64px;
    display:inline-flex;
    align-items:center;
    justify-content:center;
    padding:0;
    border:0;
    border-radius:0;
    color:#000a11;
    background:transparent;
    cursor:pointer;
  }
  .wb-product-detail-v2__related .wb-content-carousel__nav-icon {
    width:48px;
    height:48px;
  }
  .wb-product-detail-v2__related .wb-content-carousel__carousel-wrap {
    margin:0 -20px;
  }
  .wb-product-detail-v2__related .wb-content-carousel__track {
    display:grid;
    grid-auto-flow:column;
    grid-auto-columns:calc((100% - 48px) / 3);
    gap:24px;
    padding:0 20px;
    overflow-x:auto;
    scroll-snap-type:x mandatory;
    scroll-behavior:smooth;
    scroll-padding-inline:20px;
    -webkit-overflow-scrolling:touch;
    scrollbar-width:none;
  }
  .wb-product-detail-v2__related .wb-content-carousel__track::-webkit-scrollbar {
    display:none;
  }
  .wb-product-detail-v2__related .wb-content-carousel__item {
    position:relative;
    display:flex;
    min-width:0;
    flex-direction:column;
    gap:16px;
    scroll-snap-align:center;
  }
  .wb-product-detail-v2__related .wb-content-carousel__item:first-child {
    scroll-snap-align:start;
  }
  .wb-product-detail-v2__related .wb-content-carousel__item:last-child {
    scroll-snap-align:end;
  }
  .wb-product-detail-v2__related .wb-content-carousel__media {
    display:block;
    width:100%;
    aspect-ratio:42 / 46;
    overflow:hidden;
    background:#d5dbe1;
  }
  .wb-product-detail-v2__related .wb-content-carousel__img {
    display:block;
    width:100%;
    height:100%;
    object-fit:cover;
    transition:transform 260ms ease;
  }
  .wb-product-detail-v2__related .wb-content-carousel__item:hover .wb-content-carousel__img {
    transform:scale(1.04);
  }
  .wb-product-detail-v2__related .wb-content-carousel__item-title {
    margin:0;
    color:#000a11;
    font-size:20px;
    font-weight:500;
    line-height:1.4;
    letter-spacing:0;
    overflow-wrap:anywhere;
  }
  .wb-product-detail-v2__related .wb-content-carousel__link::after {
    content:"";
    position:absolute;
    inset:0;
  }

  @media (max-width: 1024px) {
    .wb-product-detail-v2__container {
      padding:0 24px 56px;
    }

    .wb-product-detail-v2__hero {
      grid-template-columns:1fr;
      gap:32px;
    }

    .wb-product-detail-v2__name {
      font-size:34px;
    }

  }

  @media (max-width: 767px) {
  .wb-product-detail-v2__breadcrumb{
    display: none;
  }
  .wb-product-gallery{
    width: 100vw;
    margin-left: calc(50% - 50vw);
    margin-right: calc(50% - 50vw);
  }
    .wb-product-detail-v2__container {
    
    }
    .wb-product-gallery__stage{
      margin-bottom: 
    }

    .wb-product-detail-v2__name {
      font-size:20px;
    }

    .wb-product-gallery__thumb {
      width:100%;
      height:auto;
    }

    .wb-product-gallery__thumbs {
      grid-template-columns:repeat(4, minmax(0, 1fr));
      gap:8px;
    }

    .wb-product-detail-v2__tabs {
      display:flex;
      grid-template-columns:none;
      overflow-x:auto;
      overflow-y:hidden;
      scroll-snap-type:x mandatory;
      scroll-padding-inline:20px;
      -webkit-overflow-scrolling:touch;
      scrollbar-width:none;
      margin-inline:-24px;
      padding-inline:24px;
      width:100vw;
    }
    .wb-product-detail-v2__tabs::-webkit-scrollbar { display:none; }

    .wb-product-detail-v2__tab {
      flex:0 0 auto;
      min-width:150px;
      padding:10px 16px;
      scroll-snap-align:center;
    }
    .wb-product-detail-v2__tab-text{
      font-size: 13px;
    }
    .wb-product-detail-v2__spec-row {
      grid-template-columns:1fr;
    }

    .wb-product-detail-v2__actions {
      flex-direction:column;
    }

    .wb-product-detail-v2__action {
      width:100%;
    }

    .wb-product-detail-v2__related {
      padding:40px 0;
    }
    .wb-product-detail-v2__related .wb-content-carousel__header {
      margin-bottom:24px;
    }
    .wb-product-detail-v2__related .wb-content-carousel__title {
      font-size:24px;
    }
    .wb-product-detail-v2__related .wb-content-carousel__nav {
      gap:8px;
    }
    .wb-product-detail-v2__related .wb-content-carousel__nav-btn {
      width:32px;
      height:32px;
    }
    .wb-product-detail-v2__related .wb-content-carousel__nav-icon {
      width:24px;
      height:24px;
    }
    .wb-product-detail-v2__related .wb-content-carousel__track {
      grid-auto-columns:calc((100% - 12px) / 1.5);
      gap:12px;
    }
    .wb-product-detail-v2__related .wb-content-carousel__item {
      gap:8px;
    }
    .wb-product-detail-v2__related .wb-content-carousel__item-title {
      font-size:13px;
    }
  }
`
