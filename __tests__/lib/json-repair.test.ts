import { describe, expect, it } from 'vitest'
import { extractAndRepairJson } from '../../src/lib/json-repair'

describe('extractAndRepairJson', () => {
  it('strips prose before a complete JSON object', () => {
    const repaired = extractAndRepairJson('I will research this first.\\n{"items":[{"title":"Found"}]}')

    expect(JSON.parse(repaired)).toEqual({
      items: [{ title: 'Found' }],
    })
  })

  it('strips prose before a truncated JSON object and closes it', () => {
    const repaired = extractAndRepairJson('I will research this first.\\n{"items":[{"title":"Found"')

    expect(JSON.parse(repaired)).toEqual({
      items: [{ title: 'Found' }],
    })
  })
})
