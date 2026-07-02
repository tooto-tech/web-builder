<script setup lang="ts">
import { ref } from 'vue'
import { SelectorsProvider } from '@tootix/grapesjs-vue'

const newSelector = ref('')

const getSelectorLabel = (selector: any): string =>
  selector?.getFullName?.()
    ?? selector?.getName?.()
    ?? selector?.getLabel?.()
    ?? selector?.get?.('name')
    ?? ''

const getStateId = (state: any): string =>
  state?.getName?.() ?? state?.get?.('name') ?? state?.id ?? ''

const getStateLabel = (state: any): string =>
  (state?.getLabel?.() ?? state?.get?.('label') ?? getStateId(state)) || 'Default'

const submitSelector = (addSelector: (selector: string) => void) => {
  const value = newSelector.value.trim().replace(/^\.+/, '').split(/\s+/)[0] ?? ''
  if (!value) return
  addSelector(value)
  newSelector.value = ''
}
</script>

<template>
  <SelectorsProvider v-slot="{ selectors, states, selectedState, addSelector, removeSelector, setState }">
    <section class="wb-selector-section" data-testid="wb-selector-section">
      <div class="wb-selector-section__row">
        <span class="wb-selector-section__label">Selector</span>
        <div class="wb-selector-section__tags">
          <button
            v-for="selector in selectors"
            :key="getSelectorLabel(selector)"
            type="button"
            class="wb-selector-section__tag"
            @click="removeSelector(selector)"
          >
            {{ getSelectorLabel(selector) }}
          </button>
          <input
            v-model="newSelector"
            class="wb-selector-section__input"
            type="text"
            placeholder="class"
            @keydown.enter.prevent="submitSelector(addSelector)"
          />
        </div>
      </div>

      <div v-if="states.length" class="wb-selector-section__row">
        <span class="wb-selector-section__label">State</span>
        <div class="wb-selector-section__states">
          <button
            type="button"
            class="wb-selector-section__state"
            :class="{ 'is-active': !selectedState }"
            @click="setState('')"
          >
            Default
          </button>
          <button
            v-for="state in states"
            :key="getStateId(state)"
            type="button"
            class="wb-selector-section__state"
            :class="{ 'is-active': selectedState === getStateId(state) }"
            @click="setState(getStateId(state))"
          >
            {{ getStateLabel(state) }}
          </button>
        </div>
      </div>
    </section>
  </SelectorsProvider>
</template>

<style scoped>
.wb-selector-section {
  border-bottom: 1px solid #e5e7eb;
  padding: 10px 12px;
}

.wb-selector-section__row + .wb-selector-section__row {
  margin-top: 8px;
}

.wb-selector-section__label {
  display: block;
  margin-bottom: 6px;
  color: #4b5563;
  font-size: 11px;
  font-weight: 600;
}

.wb-selector-section__tags,
.wb-selector-section__states {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.wb-selector-section__tag,
.wb-selector-section__state {
  min-height: 24px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 0 8px;
  color: #374151;
  background: #fff;
  font: inherit;
  font-size: 11px;
}

.wb-selector-section__state.is-active {
  border-color: #2563eb;
  color: #1d4ed8;
  background: #eff6ff;
}

.wb-selector-section__input {
  min-width: 72px;
  max-width: 112px;
  height: 24px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 0 7px;
  color: #111827;
  font: inherit;
  font-size: 11px;
}
</style>
