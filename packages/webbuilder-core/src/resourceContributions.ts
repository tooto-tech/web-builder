import type { ResourceTransactionParticipant } from './resourceTransaction.js'
import type {
  WebBuilderFeaturePlugin,
  WebBuilderPluginContext,
} from './featurePlugin.js'

export const collectWebBuilderResourceParticipants = (
  plugins: WebBuilderFeaturePlugin[],
  context: WebBuilderPluginContext,
): ResourceTransactionParticipant[] => {
  const seenParticipantIds = new Set<string>()
  const participants: ResourceTransactionParticipant[] = []

  plugins.forEach((plugin) => {
    const providers = Array.isArray(plugin.resources) ? plugin.resources : []

    providers.forEach((provider) => {
      const providedParticipants = provider(context) ?? []
      const nextParticipants = Array.isArray(providedParticipants) ? providedParticipants : []

      nextParticipants.forEach((participant) => {
        if (seenParticipantIds.has(participant.id)) {
          throw new Error(`Duplicate WebBuilder resource participant id "${participant.id}"`)
        }
        seenParticipantIds.add(participant.id)
        participants.push(participant)
      })
    })
  })

  return participants
}
