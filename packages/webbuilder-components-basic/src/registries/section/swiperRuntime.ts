type SwiperModuleName = 'Autoplay' | 'Navigation'

interface SwiperRuntime {
  Swiper: unknown
  modules: Partial<Record<SwiperModuleName, unknown>>
}

let swiperRuntimePromise: Promise<SwiperRuntime> | null = null

const loadSwiperRuntime = async (): Promise<SwiperRuntime> => {
  if (!swiperRuntimePromise) {
    swiperRuntimePromise = Promise.all([
      import('swiper'),
      import('swiper/modules'),
    ]).then(([swiperModule, modules]) => ({
      Swiper: (swiperModule as { default?: unknown }).default ?? swiperModule,
      modules: {
        Autoplay: (modules as { Autoplay?: unknown }).Autoplay,
        Navigation: (modules as { Navigation?: unknown }).Navigation,
      },
    }))
  }

  return swiperRuntimePromise
}

export function exposeSwiperRuntimeToCanvas(
  canvasWindow: Record<string, any> | null | undefined,
  moduleNames: SwiperModuleName[],
): void {
  if (!canvasWindow) return

  void loadSwiperRuntime().then(({ Swiper, modules }) => {
    canvasWindow.Swiper = Swiper
    canvasWindow.__wbSwiperModules = {
      ...(canvasWindow.__wbSwiperModules || {}),
      ...Object.fromEntries(
        moduleNames
          .map(name => [name, modules[name]])
          .filter(([, value]) => Boolean(value))
      ),
    }
  })
}
