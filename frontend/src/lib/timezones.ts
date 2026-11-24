export type TimezoneGroup = { region: string; zones: { value: string; label: string }[] }

// "America/Argentina/Salta" -> region "America", label "Argentina / Salta"
export function groupTimezones(zones: string[], current: string): TimezoneGroup[] {
  const groups = new Map<string, TimezoneGroup['zones']>()
  for (const value of zones) {
    const [region, ...rest] = value.split('/')
    const label = rest.length ? rest.join(' / ').replaceAll('_', ' ') : value
    const key = rest.length ? region : 'Other'
    groups.set(key, [...(groups.get(key) ?? []), { value, label }])
  }
  // the browser's list can miss the saved value (e.g. UTC). without it the select
  // would silently fall back to the first option and save the wrong timezone
  if (current && !zones.includes(current)) {
    groups.set('Other', [...(groups.get('Other') ?? []), { value: current, label: current.replaceAll('_', ' ') }])
  }
  return [...groups]
    .map(([region, list]) => ({ region, zones: list.sort((a, b) => a.label.localeCompare(b.label)) }))
    .sort((a, b) => (a.region === 'Other' ? 1 : b.region === 'Other' ? -1 : a.region.localeCompare(b.region)))
}
