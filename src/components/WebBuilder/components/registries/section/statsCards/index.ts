import { WB_COUNT_UP_TYPE } from '@/components/WebBuilder/components/registries/interactive/countUp'
import type { Editor } from 'grapesjs'

export const WB_STATS_CARDS_TYPE = 'wb-stats-cards'

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
  style="width:24px;height:24px;">
  <path d="M4 20V10" />
  <path d="M12 20V4" />
  <path d="M20 20v-7" />
  <path d="M2 20h20" />
</svg>`

const DEFAULT_STATS = [
  { end: 30, suffix: '+', label: 'Years of Experience' },
  { end: 200, suffix: '+', label: 'Nations of Clients' },
  { end: 360, suffix: '+', label: 'International Patents' },
  { end: 99, suffix: '%', label: 'Product Percent Of Pass' },
]

function buildStatCard(index: number) {
  const fallbackIndex = Math.max(0, index % DEFAULT_STATS.length)
  const stat = DEFAULT_STATS[index] ?? DEFAULT_STATS[fallbackIndex]

  return {
    tagName: 'div',
    name: `数据卡片 ${index + 1}`,
    draggable: '.wb-stats-cards__grid',
    droppable: false,
    selectable: true,
    stylable: true,
    copyable: true,
    removable: true,
    attributes: { class: 'wb-stats-cards__card' },
    components: [
      {
        tagName: 'div',
        selectable: false,
        draggable: false,
        droppable: false,
        copyable: false,
        removable: false,
        attributes: { class: 'wb-stats-cards__metric' },
        components: [
          {
            type: WB_COUNT_UP_TYPE,
            cuEnd: stat.end,
            cuStart: 0,
            cuDuration: 2.5,
            cuDecimals: 0,
            cuPrefix: '',
            cuSuffix: stat.suffix,
            cuSeparator: ',',
            style: {
              display: 'inline-flex',
              'align-items': 'flex-start',
              gap: '0',
            },
          },
        ],
      },
      {
        tagName: 'p',
        type: 'text',
        selectable: true,
        draggable: false,
        droppable: false,
        copyable: false,
        removable: false,
        attributes: { class: 'wb-stats-cards__label' },
        components: stat.label,
      },
    ],
  }
}

function buildStatsCardsTree() {
  return [
    {
      tagName: 'div',
      name: '内容容器',
      selectable: false,
      hoverable: false,
      highlightable: false,
      draggable: false,
      droppable: false,
      copyable: false,
      removable: false,
      attributes: { class: 'wb-stats-cards__inner' },
      components: [
        {
          tagName: 'div',
          name: '卡片列表',
          selectable: false,
          hoverable: false,
          highlightable: false,
          draggable: false,
          droppable: false,
          copyable: false,
          removable: false,
          attributes: { class: 'wb-stats-cards__grid' },
          components: DEFAULT_STATS.map((_, index) => buildStatCard(index)),
        },
      ],
    },
  ]
}

function resolveStatsCardsTarget(editor: Editor, traitCtx?: any) {
  const selected = editor.getSelected?.() as any
  if (selected?.get?.('type') === WB_STATS_CARDS_TYPE) return selected

  const fromSelected = selected?.closestType?.(WB_STATS_CARDS_TYPE) as any
  if (fromSelected?.get?.('type') === WB_STATS_CARDS_TYPE) return fromSelected

  const tmTarget = (editor.TraitManager as any)?.getTarget?.() as any
  if (tmTarget?.get?.('type') === WB_STATS_CARDS_TYPE) return tmTarget

  const fromTmTarget = tmTarget?.closestType?.(WB_STATS_CARDS_TYPE) as any
  if (fromTmTarget?.get?.('type') === WB_STATS_CARDS_TYPE) return fromTmTarget

  const traitTarget = traitCtx?.target ?? traitCtx?.get?.('target')
  if (traitTarget?.get?.('type') === WB_STATS_CARDS_TYPE) return traitTarget

  const fromTraitTarget = traitTarget?.closestType?.(WB_STATS_CARDS_TYPE) as any
  if (fromTraitTarget?.get?.('type') === WB_STATS_CARDS_TYPE) return fromTraitTarget

  return null
}

function createAddCardTrait() {
  return {
    type: 'button' as any,
    name: 'add-stat-card',
    label: false as const,
    text: '+ 添加数据卡片',
    full: true,
    command(this: any, editor: Editor) {
      const statsCards = resolveStatsCardsTarget(editor, this)
      const grid = statsCards?._getGrid?.()
      const cards = grid?.components?.()
      if (!cards) return

      const created = cards.add(buildStatCard(cards.length || 0))
      const target = Array.isArray(created) ? created[0] : created
      if (target) editor.select?.(target)
    },
  }
}

const STATS_CARDS_CSS = `
  .wb-stats-cards {
    width: 100%;
    box-sizing: border-box;
  }
  .wb-stats-cards__inner {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 20px;
    box-sizing: border-box;
  }
  .wb-stats-cards__grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 20px;
  }
  .wb-stats-cards__card {
    min-width: 0;
    min-height: 184px;
    padding: 38px 34px;
    border: 1px solid #d5dde8;
    border-radius: 16px;
    background: #ffffff;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 12px;
  }
  .wb-stats-cards__metric {
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
  }
  .wb-stats-cards__label {
    margin: 0;
    font-size: 20px;
    line-height: 1.18;
    font-weight: 500;
    color: #0f172a;
  }
  @media (max-width: 1023px) {
    .wb-stats-cards__grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }
    .wb-stats-cards__card {
      min-height: 168px;
      padding: 32px 28px;
    }
    .wb-stats-cards__label {
      font-size: 16px;
    }
  }
  @media (max-width: 767px) {
    .wb-stats-cards__inner {
      padding: 0 16px;
    }
    .wb-stats-cards__grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }
    .wb-stats-cards__card {
      min-height: 0;
      padding: 24px 22px;
      border-radius: 12px;
      gap: 10px;
    }
    .wb-stats-cards__label {
      font-size: 14px;
      line-height: 1.3;
    }
  }
`

export function registerStatsCardsComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  const blockManager = editor?.BlockManager
  if (!domComponents || domComponents.getType(WB_STATS_CARDS_TYPE)) return

  domComponents.addType(WB_STATS_CARDS_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'stats-cards'
        ? { type: WB_STATS_CARDS_TYPE }
        : false,

    model: {
      defaults: {
        name: '数字数据卡片',
        tagName: 'section',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        copyable: true,
        styles: STATS_CARDS_CSS,
        attributes: {
          'data-wb-component': 'stats-cards',
          class: 'wb-stats-cards',
        },
        traits: [
          createAddCardTrait(),
        ],
        components: buildStatsCardsTree(),
      },
      _getGrid(this: any) {
        return this.components?.().at?.(0)?.components?.().at?.(0) ?? null
      },
    },
  })

  blockManager?.add?.(WB_STATS_CARDS_TYPE, {
    label: '数字数据卡片',
    category: 'Section',
    content: { type: WB_STATS_CARDS_TYPE },
    media: BLOCK_ICON,
  })
}
