export const SOLUTIONS_CSS = `
  .wb-our-solutions {
    background: #f7f8fa;
    padding: 64px 0 80px;
    overflow: hidden;
    --swiper-pagination-bullet-width: 44px;
    --swiper-pagination-bullet-height: 2px;
    --swiper-pagination-bullet-border-radius: 0;
    --swiper-pagination-bullet-horizontal-gap: 0;
    --swiper-pagination-color: #000;
  }
  .wb-our-solutions__container {
    max-width: 1352px;
    margin: 0 auto;
    padding: 0 20px;
    box-sizing: border-box;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      "title actions"
      "carousel carousel";
    align-items: center;
    column-gap: 24px;
    row-gap: 40px;
  }
  .wb-our-solutions__title {
    grid-area: title;
    margin: 0;
    font-size: 48px;
    line-height: 1.2;
    font-weight: 600;
    color: #000a11;
  }
  .wb-our-solutions__actions {
    grid-area: actions;
    display: flex;
    gap: 16px;
    justify-self: end;
  }
  .wb-our-solutions__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 12px 28px;
    font-size: 16px;
    font-weight: 500;
    color: #000a11;
    text-decoration: none;
    transition: opacity 0.3s ease;
  }
  .wb-our-solutions__btn:hover {
    opacity: 0.85;
  }
  .wb-our-solutions__btn--primary {
    background: #ffd200;
    border: none;
  }
  .wb-our-solutions__btn--outline {
    color: #003152;
    border: 1px solid #003152;
  }
  .wb-our-solutions__carousel-wrap {
    grid-area: carousel;
    position: relative;
    min-width: 0;
    padding-bottom: 48px;
  }
  .wb-our-solutions__swiper.swiper {
    overflow: visible;
  }
  .wb-our-solutions__slide.swiper-slide {
    position: relative;
    overflow: hidden;
    aspect-ratio: 800 / 528;
    width: 800px;
  }
  .wb-our-solutions__slide-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .wb-our-solutions__slide-overlay {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 32px;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.6) 0%, transparent 100%);
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
  }
  .wb-our-solutions__slide-title {
    margin: 0;
    max-width: 320px;
    font-size: 28px;
    line-height: 1.4;
    font-weight: 500;
    color: #ffffff;
  }
  .wb-our-solutions__slide-link {
    align-self: flex-end;
    flex-shrink: 0;
    font-size: 14px;
    color: #ffffff;
    text-decoration: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.6);
    padding-bottom: 2px;
  }
  .wb-our-solutions__slide-link:hover {
    border-color: #ffffff;
  }
  .wb-our-solutions__pagination {
    text-align: center;
  }
  .wb-our-solutions__nav-prev,
  .wb-our-solutions__nav-next {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 10;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #768389;
    cursor: pointer;
    transition: color 0.3s ease;
    font-size: 40px;
  }
  .wb-our-solutions__nav-prev { left: -56px; }
  .wb-our-solutions__nav-next { right: -56px; }
  .wb-our-solutions__nav-icon {
    width: 32px;
    height: 32px;
  }
  .wb-our-solutions__nav-icon .icon {
    width: 1em;
    height: 1em;
  }
  @media (max-width: 767px) {
    .wb-our-solutions {
      padding: 40px 0 56px;
      --swiper-pagination-bullet-width: 32px;
    }
    .wb-our-solutions__container {
      grid-template-columns: 1fr;
      grid-template-areas:
        "title"
        "carousel"
        "actions";
      row-gap: 24px;
    }
    .wb-our-solutions__title {
      font-size: 28px;
    }
    .wb-our-solutions__actions {
      width: 100%;
      gap: 12px;
      justify-self: stretch;
      justify-content: center;
    }
    .wb-our-solutions__btn {
      padding: 10px 20px;
      font-size: 14px;
    }
    .wb-our-solutions__slide.swiper-slide {
      width: 100%;
    }
    .wb-our-solutions__slide-overlay {
      padding: 20px;
    }
    .wb-our-solutions__slide-title {
      font-size: 20px;
    }
    .wb-our-solutions__carousel-wrap {
      padding-bottom: 32px;
    }
    .wb-our-solutions__nav-prev,
    .wb-our-solutions__nav-next {
      color: #ffffff;
      width: auto;
      height: auto;
      font-size: 24px;
      margin-top: -16px;
    }
    .wb-our-solutions__nav-prev { left: 8px; }
    .wb-our-solutions__nav-next { right: 8px; }
    .wb-our-solutions__pagination {
      margin-top: 24px;
    }
  }
`
