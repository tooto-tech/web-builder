import { STATIC_CHILD } from '@/components/WebBuilder/utils/cmsFactory'
import { buildSeoMetaNodes } from '../helpers'
import { WB_PRODUCT_GALLERY_TYPE } from './gallery'

export const PRODUCT_DETAIL_ROOT_CLASS = 'wb-product-detail'
export const PRODUCT_DETAIL_HEADER_CLASS = 'wb-product-detail__header'
export const PRODUCT_DETAIL_BREADCRUMB_BACK_ICON_CLASS = 'wb-product-detail__breadcrumb-back-icon'
export const PRODUCT_DETAIL_BREADCRUMB_BACK_LABEL_CLASS = 'wb-product-detail__breadcrumb-back-label'

export const PRODUCT_DETAIL_HEADER_CONTENT = '📦 产品详情模板 — 每个产品生成一个独立页面（含轮播图/SKU/SEO）'

export const PRODUCT_DETAIL_BODY_CLASS = 'wb-product-detail__container wb-cms-prod-detail-body'

export function buildProductDetailBackComponents(label = 'Back') {
  return [
    {
      tagName: 'span',
      ...STATIC_CHILD,
      attributes: { class: PRODUCT_DETAIL_BREADCRUMB_BACK_ICON_CLASS, 'aria-hidden': 'true' },
      content: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="m4.296 12l8.492-8.727a.75.75 0 1 0-1.075-1.046l-9 9.25a.75.75 0 0 0 0 1.046l9 9.25a.75.75 0 1 0 1.075-1.046z"/></svg>',
    },
    {
      tagName: 'span',
      ...STATIC_CHILD,
      attributes: { class: PRODUCT_DETAIL_BREADCRUMB_BACK_LABEL_CLASS },
      content: label,
    },
  ]
}

export const PRODUCT_DETAIL_BODY_COMPONENTS = [
      {
        tagName: 'div',
        ...STATIC_CHILD,
        attributes: { class: 'wb-product-detail__breadcrumb' },
        components: [
          { tagName: 'button', attributes: { class: 'wb-product-detail__breadcrumb-back', type: 'button', 'data-wb-product-detail-back': '' }, components: buildProductDetailBackComponents() },
          { tagName: 'span', attributes: { class: 'wb-product-detail__breadcrumb-name', 'data-cms-bind': 'product.name' }, content: 'Product Name' },
        ],
      },
      {
        tagName: 'section',
        attributes: { class: 'wb-product-detail__hero' },
        components: [
          { type: WB_PRODUCT_GALLERY_TYPE },
          {
            tagName: 'div',
            attributes: { class: 'wb-product-detail__info' },
            components: [
              { tagName: 'h1', attributes: { class: 'wb-product-detail__name', 'data-cms-bind': 'product.name' }, content: 'Product Name' },
              { tagName: 'p', attributes: { class: 'wb-product-detail__desc', 'data-cms-bind': 'product.introduction' }, content: 'Introduction to product description copy content, introduction to product description copy content, introduction to product. Introduction to product description copy content, introduction to product description copy content, introduction to product.' },
              {
                tagName: 'div',
                attributes: { class: 'wb-product-detail__accordion' },
                components: [
                  {
                    tagName: 'details',
                    attributes: { class: 'wb-product-detail__accordion-item', open: true },
                    components: [
                      { tagName: 'summary', attributes: { class: 'wb-product-detail__accordion-summary' }, components: [
                        { tagName: 'span', attributes: { class: 'wb-product-detail__accordion-title' }, content: 'Product Features' },
                        { tagName: 'span', attributes: { class: 'wb-product-detail__accordion-icon' }, content: '+' },
                      ]},
                      {
                        tagName: 'div',
                        attributes: { class: 'wb-product-detail__accordion-body' },
                        components: [
                          {
                            type: 'pm-text-block',
                            tagName: 'div',
                            attributes: { class: 'pm-text-block', 'data-media-category-id': '7' },
                            components: [
                              {
                                tagName: 'div',
                                attributes: { 'data-cms-repeat': 'media@productMediaCat_7' },
                                components: [
                                  { tagName: 'div', attributes: { 'data-cms-html': 'media.description' }, content: '属性描述内容...' },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  {
                    tagName: 'details',
                    attributes: { class: 'wb-product-detail__accordion-item' },
                    components: [
                      { tagName: 'summary', attributes: { class: 'wb-product-detail__accordion-summary' }, components: [
                        { tagName: 'span', attributes: { class: 'wb-product-detail__accordion-title' }, content: 'Applicable Industries' },
                        { tagName: 'span', attributes: { class: 'wb-product-detail__accordion-icon' }, content: '+' },
                      ]},
                      {
                        tagName: 'div',
                        attributes: { class: 'wb-product-detail__accordion-body' },
                        components: [
                          {
                            type: 'pm-text-block',
                            tagName: 'div',
                            attributes: { class: 'pm-text-block', 'data-media-category-id': '11' },
                            components: [
                              {
                                tagName: 'div',
                                attributes: { 'data-cms-repeat': 'media@productMediaCat_11' },
                                components: [
                                  { tagName: 'div', attributes: { 'data-cms-html': 'media.description' }, content: '属性描述内容...' },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
	                  {
	                    tagName: 'details',
	                    attributes: { class: 'wb-product-detail__accordion-item' },
	                    components: [
	                      { tagName: 'summary', attributes: { class: 'wb-product-detail__accordion-summary' }, components: [
	                        { tagName: 'span', attributes: { class: 'wb-product-detail__accordion-title' }, content: 'Support Documentation' },
	                        { tagName: 'span', attributes: { class: 'wb-product-detail__accordion-icon' }, content: '+' },
	                      ]},
	                      {
	                        tagName: 'div',
	                        attributes: { class: 'wb-product-detail__accordion-body' },
	                        components: [
                            {
                              type: 'pm-doc-block',
                              tagName: 'div',
                              attributes: { class: 'pm-doc-block', 'data-media-category-id': '10' },
                              components: [
                                {
                                  tagName: 'div',
                                  attributes: { 'data-cms-repeat': 'doc@productMediaCat_10' },
                                  components: [
                                    { tagName: 'a', attributes: { class: 'pm-doc-block__link', 'data-cms-bind-href': 'doc.url', target: '_blank' }, components: [
                                      { tagName: 'span', content: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="14.000000953674316" height="16" viewBox="0 0 14.000000953674316 16"><path d="M0.84968245,2.1845019C0.84968245,1.4563345,1.4326041,0.86592877,2.1538463,0.86592877L13.565279,0.86592877C13.8024,0.86592877,13.99012,0.66912687,13.99012,0.43296438C13.99012,0.19680208,13.802401,0,13.565279,0L2.1637263,0C0.96824265,0,0,0.97416985,0,2.1746619L0,13.825337C0,15.025831,0.96824265,16,2.1637263,16L14.000001,16L14.000001,3.5030751L2.1637263,3.5030751C1.4424841,3.5030751,0.84968245,2.9126692,0.84968245,2.1845019ZM13.140437,15.15375L2.1637263,15.15375C1.4424841,15.15375,0.85956234,14.563345,0.8595627,13.835176L0.8595627,3.9163589C1.2251238,4.1918817,1.6796051,4.3591633,2.1637266,4.3591633L13.150318,4.3591633L13.150318,15.153752L13.140437,15.15375ZM13.575159,1.7220168L2.2526464,1.7220168C2.0155256,1.7220168,1.827805,1.9188187,1.827805,2.1549811C1.827805,2.391144,2.0155256,2.5879455,2.252646,2.5879455L13.575159,2.5879455C13.81228,2.5879455,14.000001,2.391144,14.000001,2.1549811C14.000001,1.9089788,13.812281,1.7220168,13.575159,1.7220168ZM4.6534939,10.725705C4.7226539,10.794586,4.7819338,10.971708,4.7621741,11.06027L4.4460135,12.90037C4.4064927,13.11685,4.4558935,13.323493,4.5744534,13.471095C4.6831336,13.599016,4.8412147,13.677736,5.0190554,13.677736C5.1376152,13.677736,5.2561755,13.648217,5.3747358,13.579337L7.0148211,12.713408C7.0444613,12.693727,7.1136208,12.683888,7.1926613,12.683888C7.2717004,12.683888,7.3408618,12.703568,7.3705015,12.713408L9.0105858,13.579337C9.1291466,13.638377,9.2477064,13.677736,9.3662663,13.677736C9.5441065,13.677736,9.7021885,13.608857,9.8108673,13.471095C9.9294271,13.323493,9.9788284,13.126693,9.9393072,12.90037L9.6231461,11.06027C9.6033878,10.971709,9.6626673,10.784747,9.7318277,10.725705L11.06563,9.4169741C11.263231,9.2201719,11.342273,8.9741697,11.263231,8.7478476C11.194072,8.5215244,10.986589,8.3640842,10.709949,8.3247242L8.8722668,8.059042C8.7833462,8.0492001,8.6252651,7.931119,8.5857458,7.8523993L7.7657013,6.1795826C7.6372614,5.9237399,7.4297819,5.7859783,7.1926599,5.7859783C6.9555387,5.7859783,6.7480588,5.9335799,6.6196194,6.1795826L5.7995763,7.8523993C5.760056,7.9409604,5.6019754,8.049202,5.5130553,8.059042L3.6753702,8.3247242C3.3987293,8.3640842,3.201129,8.5215263,3.1220887,8.7478476C3.0529282,8.9741697,3.1220887,9.2201719,3.319689,9.4169741L4.6534939,10.725705ZM5.6414962,8.9052877C6.0169377,8.8462467,6.4022579,8.5608835,6.5702186,8.2263222L7.1926613,6.9471083L7.8151026,8.2263203C7.9830637,8.5707235,8.3683844,8.8560867,8.743825,8.9052877L10.146789,9.1119299L9.1291466,10.10578C8.8623857,10.371461,8.7141857,10.833945,8.7734652,11.20787L9.0105858,12.615005L7.7558217,11.955717C7.5977426,11.867156,7.3902617,11.827798,7.1827817,11.827798C6.9753017,11.827798,6.7678199,11.876998,6.6097398,11.955717L5.3549767,12.615005L5.5920973,11.20787C5.6513772,10.833945,5.5031767,10.371461,5.2364168,10.10578L4.2187734,9.1119299L5.6414962,8.9052877Z" fill="#000000" fill-opacity="1" style="mix-blend-mode:passthrough"/></svg>' },
                                      { tagName: 'span', attributes: { 'data-cms-bind': 'doc.title','download': 'download' }, content: '文件名' },
                                      { tagName: 'span', content: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="12" height="11.999999046325684" viewBox="0 0 12 11.999999046325684"><path d="M9.9905081,4.1422482C9.7831869,3.9111714,9.4593859,3.9111714,9.2520647,4.1422482L6.5216689,7.2393122L6.5216689,0.56955141C6.5044446,0.24556628,6.2747836,-0.0051992978,6.0001426,0.00010166429C5.7251463,-0.0057894755,5.4949303,0.24513736,5.4776936,0.56955141L5.4776936,7.2393122L2.748219,4.1422482C2.6133933,3.9919903,2.422636,3.9342897,2.2433081,3.989522C2.0655429,4.0411501,1.9245027,4.2007709,1.8731631,4.4084277C1.8254735,4.6143007,1.8776377,4.8344798,2.008852,4.9811506L5.6299973,9.0905704C5.636322,9.0973005,5.6427855,9.1038475,5.6493812,9.1102057L5.6586118,9.1211157L5.6678429,9.1298428L5.6798425,9.1407499L5.6890736,9.148387L5.7019958,9.158206C5.7089739,9.1634865,5.7160516,9.1685781,5.7232261,9.1734791L5.7306104,9.1800222L5.745379,9.1898413L5.7527637,9.1942043L5.7666097,9.2029333L5.7758408,9.2072964L5.788763,9.2138414L5.79984,9.2192955L5.8118396,9.2247496L5.8238397,9.2302036L5.8349161,9.2334766L5.8487616,9.2400217L5.8579926,9.2422037C5.8628983,9.2437401,5.8678212,9.2451935,5.8727612,9.2465668L5.8819923,9.2498398L5.8986068,9.2531128L5.9078374,9.2542028L5.9235296,9.2585678L5.9336834,9.2585678L5.9484525,9.2618399L5.9613748,9.2618399L5.974297,9.2640219L6.0379877,9.2640219L6.0509109,9.2618399L6.0666032,9.2596588L6.0758333,9.2585688L6.0924487,9.2542057L6.1016793,9.2542057L6.1182942,9.2498417L6.1275249,9.2465677C6.1324649,9.2451963,6.1373882,9.243741,6.142293,9.2422037L6.1515241,9.2400227L6.16537,9.2334776L6.1755242,9.2302046C6.179853,9.2284594,6.1841607,9.2266417,6.1884465,9.2247515L6.2004457,9.2192965L6.2105994,9.2138424C6.2152395,9.2117367,6.2198553,9.2095537,6.2244458,9.2072973L6.2336769,9.2029333C6.2380195,9.2000971,6.2423267,9.1971874,6.2465992,9.1942053L6.2558298,9.1887512C6.2601757,9.1859198,6.264483,9.183013,6.2687521,9.1800241L6.27706,9.1745691C6.2817168,9.171381,6.2863326,9.168108,6.2909055,9.164752L6.2982898,9.159297L6.3121362,9.1483879L6.319521,9.1407509L6.3315201,9.1298437L6.3416743,9.1200256L6.3509049,9.1102076C6.3571854,9.1038294,6.3633399,9.0972824,6.3693657,9.0905714L9.9905109,4.9811511C10.087758,4.8720312,10.143103,4.7207255,10.143738,4.5622458C10.143353,4.4033871,10.087989,4.2516313,9.9905081,4.1422482ZM12,8.5931196C12,8.2647591,11.765545,7.998579,11.476627,7.998579C11.193872,7.9924912,10.960237,8.2578802,10.954179,8.5920286L10.954179,10.005834C10.954179,10.452011,10.634802,10.8131,10.241581,10.8131L1.7587043,10.8131C1.3654827,10.8131,1.0461059,10.452011,1.0461059,10.005834L1.0461059,8.5920286C1.0525879,8.3715219,0.95426476,8.1652222,0.79134256,8.0574865C0.62534845,7.9460149,0.42196488,7.9460149,0.25597063,8.0574865C0.092691757,8.1649313,-0.0060152151,8.3712893,0.00028437891,8.5920286L0.00028437891,10.005834C0.00028450217,11.104372,0.78857338,11.999999,1.7587043,11.999999L10.241581,11.999999C11.211711,11.998908,11.998155,11.106553,11.999077,10.005834L11.999077,8.5920286L12,8.5920286L12,8.5931196Z" fill="#0057CE" fill-opacity="1" style="mix-blend-mode:passthrough"/></svg>' },
                                    ]},
                                  ],
                                },
                              ],
                            },
	                        ],
	                      },
	                    ],
	                  },
	                ],
	              },
	              { tagName: 'button', attributes: { class: 'wb-product-detail__cta', type: 'button' }, content: 'Contact Now' },
	            ],
	          },
        ],
      },
      {
        tagName: 'div',
        ...STATIC_CHILD,
        attributes: { 'data-cms-if': 'product.skus', style: 'display:none;' },
        components: [
          {
            tagName: 'div', attributes: { 'data-cms-repeat': 'sku@product.skus', style: 'display:flex;gap:8px;flex-wrap:wrap;' },
            components: [{ tagName: 'div', attributes: { style: 'padding:8px 14px;border:1px solid #d1d5db;border-radius:9999px;font-size:13px;color:#374151;background:#fff;' }, components: [
              { tagName: 'span', attributes: { 'data-cms-bind': 'sku.name' }, content: 'SKU' },
              { tagName: 'span', attributes: { 'data-cms-bind': 'sku.price', style: 'margin-left:8px;color:#dc2626;font-weight:600;' }, content: '$0.00' },
            ]}],
          },
        ],
      },
      // ── pm-*-block 媒体子块（用户可选中、设置 mediaCategoryId） ──
      {
        type: 'pm-gallery-block',
        tagName: 'div',
        attributes: { class: 'pm-gallery-block', 'data-media-category-id': '8' },
        components: [
          {
            tagName: 'div',
            attributes: { 'data-cms-repeat': 'gallery@productMediaCat_8', class:'pm-gallery-block__wrap', },
            components: [
              { tagName: 'h3', attributes: { class: 'pm-gallery-block__title', 'data-cms-bind': 'gallery.title' }, content: '图集标题' },
              { tagName: 'p', attributes: { class: 'pm-gallery-block__desc', 'data-cms-bind': 'gallery.description' }, content: '图集描述' },
              {
                tagName: 'div',
                attributes: { 'data-cms-if': 'gallery.items', class: 'pm-gallery-block__carousel swiper' },
                components: [
                  {
                    tagName: 'div',
                    attributes: { class: 'swiper-wrapper' },
                    components: [
                      {
                        tagName: 'div',
                        attributes: { class: 'swiper-slide pm-gallery-block__slide', 'data-cms-repeat': 'item@gallery.items' },
                        components: [
                          {
                            tagName: 'img',
                            attributes: {
                              class: 'pm-gallery-block__image',
                              'data-cms-bind-src': 'item.url',
                              'data-cms-bind-alt': 'gallery.title',
                              src: 'https://placehold.co/1200x600/f3e8ff/6d28d9?text=Gallery',
                              alt: '产品图集图片',
                            },
                          },
                        ],
                      },
                    ],
                  },
                  { tagName: 'div', attributes: { class: 'swiper-pagination pm-gallery-block__pagination' } },
                  { tagName: 'div', attributes: { class: 'swiper-button-prev pm-gallery-block__nav pm-gallery-block__nav--prev' } },
                  { tagName: 'div', attributes: { class: 'swiper-button-next pm-gallery-block__nav pm-gallery-block__nav--next' } },
                ],
              },
            ],
          },
        ],
      },
      {
        type: 'pm-image-block',
        tagName: 'div',
        attributes: { class: 'pm-image-block', 'data-media-category-id': '9' },
        components: [
          {
            tagName: 'div',
            attributes: { 'data-cms-repeat': 'img@productMediaCat_9', class: 'pm-image-block__wrap', },
            components: [
              { tagName: 'h3', attributes: { class: 'pm-image-block__title', 'data-cms-bind': 'img.title' }, content: '图片标题' },
              { tagName: 'p', attributes: { class: 'pm-image-block__desc', 'data-cms-bind': 'img.description' }, content: '描述' },
              { tagName: 'img', attributes: { class: 'pm-image-block__image', 'data-cms-bind-src': 'img.url', 'data-cms-bind-alt': 'img.title', alt: '产品图片', style: 'width:100%;' } },
            ],
          },
        ],
      },
      ...buildSeoMetaNodes({
        titleBind: 'product.name',
        titleContent: '产品标题',
        descriptionBind: 'product.introduction',
      }),
]

export const PRODUCT_DETAIL_EXTRA_COMPONENTS: any[] = []
