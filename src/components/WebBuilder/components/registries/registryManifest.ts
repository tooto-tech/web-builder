export type RegistryFailurePolicy = 'core' | 'optional'

export interface RegistryManifestEntry {
  id: string
  registeredTypes: string[]
  failurePolicy: RegistryFailurePolicy
}

export const REGISTRY_MANIFEST: RegistryManifestEntry[] = [
  { id: 'trait:pageLink', registeredTypes: ['trait:page-link'], failurePolicy: 'core' },
  { id: 'trait:inquiryType', registeredTypes: ['trait:inquiry-type-select'], failurePolicy: 'core' },
  { id: 'trait:menuTreeSelect', registeredTypes: ['trait:menu-tree-select'], failurePolicy: 'core' },
  { id: 'trait:navbarMenuSelect', registeredTypes: ['trait:navbar-menu-select'], failurePolicy: 'core' },
  { id: 'trait:navbarThbMenuSelect', registeredTypes: ['trait:navbar-thb-menu-select'], failurePolicy: 'core' },
  { id: 'trait:loopItemTemplate', registeredTypes: ['trait:loop-item-template-select'], failurePolicy: 'core' },
  { id: 'trait:hotspotShowcaseItems', registeredTypes: ['trait:hotspot-showcase-items'], failurePolicy: 'core' },
  { id: 'trait:flipbookPages', registeredTypes: ['trait:flipbook-pages'], failurePolicy: 'core' },
  { id: 'trait:linkPatch', registeredTypes: ['trait:native-link-patch'], failurePolicy: 'core' },
  { id: 'layoutBase', registeredTypes: ['wb-layout-base'], failurePolicy: 'core' },
  { id: 'container', registeredTypes: ['wb-container'], failurePolicy: 'core' },
  { id: 'section', registeredTypes: ['wb-section'], failurePolicy: 'core' },
  { id: 'grid', registeredTypes: ['wb-grid'], failurePolicy: 'core' },
  {
    id: 'sectionGridBlock',
    registeredTypes: ['wb-section-grid-block', 'wb-section-grid-bg', 'wb-section-bg'],
    failurePolicy: 'core'
  },
  { id: 'heading', registeredTypes: ['wb-heading'], failurePolicy: 'core' },
  { id: 'textEditor', registeredTypes: ['wb-text-editor'], failurePolicy: 'core' },
  { id: 'carousel', registeredTypes: ['wb-carousel'], failurePolicy: 'core' },
  { id: 'button', registeredTypes: ['wb-button'], failurePolicy: 'core' },
  { id: 'accordion', registeredTypes: ['wb-accordion'], failurePolicy: 'core' },
  { id: 'tabs', registeredTypes: ['wb-tabs'], failurePolicy: 'core' },
  { id: 'image', registeredTypes: ['wb-image'], failurePolicy: 'core' },
  { id: 'icon', registeredTypes: ['wb-icon'], failurePolicy: 'core' },
  { id: 'spacer', registeredTypes: ['wb-spacer'], failurePolicy: 'core' },
  { id: 'divider', registeredTypes: ['wb-divider'], failurePolicy: 'core' },
  { id: 'marquee', registeredTypes: ['wb-marquee', 'wb-marquee-item'], failurePolicy: 'core' },
  { id: 'industryTabs', registeredTypes: ['wb-industry-tabs'], failurePolicy: 'core' },
  { id: 'historyTimeline', registeredTypes: ['wb-history-timeline'], failurePolicy: 'optional' },
  { id: 'focaHistoryTimeline', registeredTypes: ['wb-foca-history-timeline'], failurePolicy: 'optional' },
  { id: 'productCardStrip', registeredTypes: ['wb-product-card-strip'], failurePolicy: 'optional' },
  { id: 'productCategories', registeredTypes: ['wb-product-categories', 'wb-product-category-item'], failurePolicy: 'core' },
  { id: 'ourSolutions', registeredTypes: ['wb-our-solutions', 'wb-our-solutions-item'], failurePolicy: 'core' },
  { id: 'caseSpotlight', registeredTypes: ['wb-case-spotlight'], failurePolicy: 'optional' },
  { id: 'milestoneCardStrip', registeredTypes: ['wb-milestone-card-strip'], failurePolicy: 'optional' },
  { id: 'allApplications', registeredTypes: ['wb-all-applications'], failurePolicy: 'optional' },
  { id: 'moreCardCarousel', registeredTypes: ['wb-more-card-carousel'], failurePolicy: 'optional' },
  { id: 'map', registeredTypes: ['wb-map'], failurePolicy: 'optional' },
  { id: 'staticPinMap', registeredTypes: ['wb-static-pin-map'], failurePolicy: 'optional' },
  { id: 'factoryMap', registeredTypes: ['wb-factory-map'], failurePolicy: 'optional' },
  { id: 'flipbook', registeredTypes: ['wb-flipbook', 'wb-flipbook-page'], failurePolicy: 'core' },
  { id: 'cmsComponents', registeredTypes: ['wb-cms-components'], failurePolicy: 'core' },
  { id: 'loopGrid', registeredTypes: ['wb-loop-grid'], failurePolicy: 'core' },
  { id: 'countUp', registeredTypes: ['wb-count-up'], failurePolicy: 'core' },
  { id: 'statsCards', registeredTypes: ['wb-stats-cards'], failurePolicy: 'optional' },
  { id: 'customizationGrid', registeredTypes: ['wb-customization-grid'], failurePolicy: 'optional' },
  { id: 'processTimeline', registeredTypes: ['wb-process-timeline'], failurePolicy: 'optional' },
  { id: 'companyScale', registeredTypes: ['wb-company-scale'], failurePolicy: 'optional' },
  { id: 'solutionList', registeredTypes: ['wb-solution-list'], failurePolicy: 'optional' },
  { id: 'contentCarousel', registeredTypes: ['wb-content-carousel'], failurePolicy: 'optional' },
  { id: 'ourAdvantages', registeredTypes: ['wb-our-advantages'], failurePolicy: 'optional' },
  { id: 'serviceIconGrid', registeredTypes: ['wb-service-icon-grid'], failurePolicy: 'optional' },
  { id: 'servicesCarousel', registeredTypes: ['wb-services-carousel'], failurePolicy: 'optional' },
  { id: 'servicesShowcase', registeredTypes: ['wb-services-showcase'], failurePolicy: 'optional' },
  { id: 'serviceThb', registeredTypes: ['wb-services-thb'], failurePolicy: 'optional' },
  { id: 'appsCarouselThb', registeredTypes: ['wb-apps-carousel-thb'], failurePolicy: 'optional' },
  { id: 'responsiveHeroCarousel', registeredTypes: ['wb-responsive-hero-carousel'], failurePolicy: 'optional' },
  { id: 'homeBannerCarousel', registeredTypes: ['wb-home-banner-carousel'], failurePolicy: 'optional' },
  { id: 'overviewSplit', registeredTypes: ['wb-overview-split'], failurePolicy: 'optional' },
  { id: 'navbar', registeredTypes: ['wb-navbar'], failurePolicy: 'core' },
  { id: 'navbarThb', registeredTypes: ['wb-navbar-thb'], failurePolicy: 'core' },
  { id: 'logo', registeredTypes: ['wb-logo'], failurePolicy: 'core' },
  { id: 'languageSwitcher', registeredTypes: ['wb-language-switcher'], failurePolicy: 'core' },
  { id: 'socialLinks', registeredTypes: ['wb-social-links'], failurePolicy: 'core' },
  { id: 'search', registeredTypes: ['wb-search'], failurePolicy: 'core' },
  { id: 'backButton', registeredTypes: ['wb-back-button'], failurePolicy: 'core' },
  { id: 'socialShare', registeredTypes: ['wb-social-share'], failurePolicy: 'core' },
  { id: 'customCode', registeredTypes: ['wb-custom-code'], failurePolicy: 'core' },
  { id: 'klaviyoSubscribe', registeredTypes: ['wb-klaviyo-subscribe'], failurePolicy: 'core' },
  { id: 'salesmartlyChatButton', registeredTypes: ['wb-salesmartly-chat-button'], failurePolicy: 'core' },
  { id: 'footer', registeredTypes: ['wb-footer'], failurePolicy: 'core' },
  { id: 'footerMenu', registeredTypes: ['wb-footer-menu'], failurePolicy: 'core' },
  { id: 'video', registeredTypes: ['wb-video'], failurePolicy: 'core' },
  { id: 'pdfViewer', registeredTypes: ['wb-pdf-viewer'], failurePolicy: 'core' },
  { id: 'inquiryForm', registeredTypes: ['wb-inquiry-form'], failurePolicy: 'core' },
  { id: 'tabMediaGallery', registeredTypes: ['wb-tab-media-gallery'], failurePolicy: 'core' },
  { id: 'contactBlock', registeredTypes: ['wb-contact-block'], failurePolicy: 'optional' },
  { id: 'contactInfoBlock', registeredTypes: ['wb-contact-info-block'], failurePolicy: 'optional' },
  { id: 'pageHeadBanner', registeredTypes: ['wb-page-head-banner'], failurePolicy: 'optional' },
  { id: 'hotspotShowcase', registeredTypes: ['wb-hotspot-showcase', 'wb-hotspot-showcase-item'], failurePolicy: 'optional' },
  { id: 'resourceSection', registeredTypes: ['wb-resource-section'], failurePolicy: 'optional' },
  { id: 'faqSection', registeredTypes: ['wb-faq-section'], failurePolicy: 'optional' },
  { id: 'cardCarouselSection', registeredTypes: ['wb-card-carousel-section'], failurePolicy: 'optional' },
  { id: 'trait:customAttributes', registeredTypes: ['trait:custom-attributes'], failurePolicy: 'core' },
  { id: 'trait:colorPicker', registeredTypes: ['trait:color-picker'], failurePolicy: 'core' },
  { id: 'trait:codeEditor', registeredTypes: ['trait:code-editor'], failurePolicy: 'core' },
  { id: 'trait:imagePicker', registeredTypes: ['trait:image-picker'], failurePolicy: 'core' },
  { id: 'trait:svgIconPicker', registeredTypes: ['trait:svg-icon-picker'], failurePolicy: 'core' },
  { id: 'trait:iconRadio', registeredTypes: ['trait:icon-radio'], failurePolicy: 'core' },
  { id: 'trait:footerMenuSelect', registeredTypes: ['trait:footer-menu-select'], failurePolicy: 'core' },
]

export function getRegistryEntryIds(entries: RegistryManifestEntry[] = REGISTRY_MANIFEST) {
  return entries.map(entry => entry.id)
}

export function getCoreRegistryEntries(entries: RegistryManifestEntry[] = REGISTRY_MANIFEST) {
  return entries.filter(entry => entry.failurePolicy === 'core')
}

export function getOptionalRegistryEntries(entries: RegistryManifestEntry[] = REGISTRY_MANIFEST) {
  return entries.filter(entry => entry.failurePolicy === 'optional')
}

export function assertUniqueRegistryTypes(entries: RegistryManifestEntry[] = REGISTRY_MANIFEST) {
  const seen = new Map<string, string>()

  for (const entry of entries) {
    for (const type of entry.registeredTypes) {
      const existingEntryId = seen.get(type)
      if (existingEntryId) {
        throw new Error(`Duplicate registry type "${type}" in ${existingEntryId} and ${entry.id}`)
      }
      seen.set(type, entry.id)
    }
  }
}
