export type BasicRegistryFailurePolicy = 'core' | 'optional'

export interface BasicRegistryManifestEntry {
  id: string
  registeredTypes: string[]
  failurePolicy: BasicRegistryFailurePolicy
}

export const BASIC_REGISTRY_MANIFEST: BasicRegistryManifestEntry[] = [
  { id: 'layoutBase', registeredTypes: ['wb-layout-base'], failurePolicy: 'core' },
  { id: 'container', registeredTypes: ['wb-container'], failurePolicy: 'core' },
  { id: 'section', registeredTypes: ['wb-section'], failurePolicy: 'core' },
  { id: 'grid', registeredTypes: ['wb-grid'], failurePolicy: 'core' },
  {
    id: 'sectionGridBlock',
    registeredTypes: ['wb-section-grid-block', 'wb-section-grid-bg', 'wb-section-bg'],
    failurePolicy: 'core',
  },
  { id: 'spacer', registeredTypes: ['wb-spacer'], failurePolicy: 'core' },
  { id: 'divider', registeredTypes: ['wb-divider'], failurePolicy: 'core' },
  { id: 'heading', registeredTypes: ['wb-heading'], failurePolicy: 'core' },
  { id: 'textEditor', registeredTypes: ['wb-text-editor'], failurePolicy: 'core' },
  { id: 'carousel', registeredTypes: ['wb-carousel'], failurePolicy: 'core' },
  { id: 'image', registeredTypes: ['wb-image'], failurePolicy: 'core' },
  { id: 'icon', registeredTypes: ['wb-icon'], failurePolicy: 'core' },
  { id: 'marquee', registeredTypes: ['wb-marquee', 'wb-marquee-item'], failurePolicy: 'core' },
  { id: 'industryTabs', registeredTypes: ['wb-industry-tabs'], failurePolicy: 'core' },
  {
    id: 'productCategories',
    registeredTypes: ['wb-product-categories', 'wb-product-category-item'],
    failurePolicy: 'core',
  },
  {
    id: 'ourSolutions',
    registeredTypes: ['wb-our-solutions', 'wb-our-solutions-item'],
    failurePolicy: 'core',
  },
  { id: 'flipbook', registeredTypes: ['wb-flipbook', 'wb-flipbook-page'], failurePolicy: 'core' },
  { id: 'video', registeredTypes: ['wb-video'], failurePolicy: 'core' },
  { id: 'pdfViewer', registeredTypes: ['wb-pdf-viewer'], failurePolicy: 'core' },
  { id: 'tabMediaGallery', registeredTypes: ['wb-tab-media-gallery'], failurePolicy: 'core' },
  { id: 'button', registeredTypes: ['wb-button'], failurePolicy: 'core' },
  {
    id: 'popup',
    registeredTypes: ['wb-popup', 'wb-popup-template-ref', 'wb-popup-trigger'],
    failurePolicy: 'core',
  },
  { id: 'accordion', registeredTypes: ['wb-accordion'], failurePolicy: 'core' },
  { id: 'tabs', registeredTypes: ['wb-tabs'], failurePolicy: 'core' },
  { id: 'countUp', registeredTypes: ['wb-count-up'], failurePolicy: 'core' },
  { id: 'search', registeredTypes: ['search-spotlight'], failurePolicy: 'core' },
  { id: 'backButton', registeredTypes: ['wb-back-button'], failurePolicy: 'core' },
  { id: 'socialShare', registeredTypes: ['wb-social-share'], failurePolicy: 'core' },
  { id: 'customCode', registeredTypes: ['wb-custom-code'], failurePolicy: 'core' },
  { id: 'salesmartlyChatButton', registeredTypes: ['wb-salesmartly-chat-button'], failurePolicy: 'core' },
  { id: 'inquiryForm', registeredTypes: ['wb-inquiry-form'], failurePolicy: 'core' },
  { id: 'klaviyoSubscribe', registeredTypes: ['wb-klaviyo-subscribe'], failurePolicy: 'core' },
  { id: 'navbar', registeredTypes: ['wb-navbar'], failurePolicy: 'core' },
  { id: 'logo', registeredTypes: ['logo-brand'], failurePolicy: 'core' },
  { id: 'languageSwitcher', registeredTypes: ['wb-language-switcher'], failurePolicy: 'core' },
  { id: 'socialLinks', registeredTypes: ['wb-social-links'], failurePolicy: 'core' },
  { id: 'footer', registeredTypes: ['footer-section'], failurePolicy: 'core' },
  { id: 'historyTimeline', registeredTypes: ['wb-history-timeline'], failurePolicy: 'optional' },
  { id: 'focaHistoryTimeline', registeredTypes: ['wb-foca-history-timeline'], failurePolicy: 'optional' },
  { id: 'productCardStrip', registeredTypes: ['wb-product-card-strip'], failurePolicy: 'optional' },
  { id: 'caseSpotlight', registeredTypes: ['wb-case-spotlight'], failurePolicy: 'optional' },
  { id: 'milestoneCardStrip', registeredTypes: ['wb-milestone-card-strip'], failurePolicy: 'optional' },
  { id: 'allApplications', registeredTypes: ['wb-all-applications'], failurePolicy: 'optional' },
  { id: 'moreCardCarousel', registeredTypes: ['wb-more-card-carousel'], failurePolicy: 'optional' },
  { id: 'map', registeredTypes: ['wb-map', 'wb-map-pin'], failurePolicy: 'optional' },
  { id: 'staticPinMap', registeredTypes: ['wb-static-pin-map', 'wb-static-pin'], failurePolicy: 'optional' },
  { id: 'factoryMap', registeredTypes: ['wb-factory-map'], failurePolicy: 'optional' },
  { id: 'statsCards', registeredTypes: ['wb-stats-cards'], failurePolicy: 'optional' },
  { id: 'customizationGrid', registeredTypes: ['wb-customization-grid'], failurePolicy: 'optional' },
  { id: 'processTimeline', registeredTypes: ['wb-process-timeline'], failurePolicy: 'optional' },
  { id: 'companyScale', registeredTypes: ['wb-company-scale'], failurePolicy: 'optional' },
  { id: 'solutionList', registeredTypes: ['wb-solution-list', 'wb-solution-list-card'], failurePolicy: 'optional' },
  { id: 'ourAdvantages', registeredTypes: ['wb-our-advantages', 'wb-our-advantages-item'], failurePolicy: 'optional' },
  { id: 'serviceIconGrid', registeredTypes: ['wb-service-icon-grid', 'wb-service-icon-grid-item'], failurePolicy: 'optional' },
  { id: 'servicesCarousel', registeredTypes: ['wb-services-carousel', 'wb-services-carousel-item'], failurePolicy: 'optional' },
  { id: 'servicesShowcase', registeredTypes: ['wb-services-showcase', 'wb-services-showcase-item'], failurePolicy: 'optional' },
  { id: 'serviceThb', registeredTypes: ['wb-service-thb', 'wb-service-thb-item'], failurePolicy: 'optional' },
  { id: 'responsiveHeroCarousel', registeredTypes: ['wb-responsive-hero-carousel', 'wb-responsive-hero-carousel-item'], failurePolicy: 'optional' },
  { id: 'homeBannerCarousel', registeredTypes: ['wb-home-banner-carousel', 'wb-home-banner-slide'], failurePolicy: 'optional' },
  { id: 'overviewSplit', registeredTypes: ['wb-overview-split'], failurePolicy: 'optional' },
  { id: 'hotspotShowcase', registeredTypes: ['wb-hotspot-showcase', 'wb-hotspot-showcase-item'], failurePolicy: 'optional' },
  { id: 'resourceSection', registeredTypes: ['wb-resource-section'], failurePolicy: 'optional' },
  { id: 'cardCarouselSection', registeredTypes: ['wb-card-carousel-section'], failurePolicy: 'optional' },
]

export function getBasicRegistryTypes(entries: readonly BasicRegistryManifestEntry[] = BASIC_REGISTRY_MANIFEST) {
  return entries.flatMap(entry => entry.registeredTypes)
}

export function assertUniqueBasicRegistryTypes(
  entries: readonly BasicRegistryManifestEntry[] = BASIC_REGISTRY_MANIFEST,
) {
  const seen = new Map<string, string>()

  for (const entry of entries) {
    for (const type of entry.registeredTypes) {
      const existingEntryId = seen.get(type)
      if (existingEntryId) {
        throw new Error(`Duplicate Basic registry type "${type}" in ${existingEntryId} and ${entry.id}`)
      }
      seen.set(type, entry.id)
    }
  }
}
