export function parseTagIds(value: string | string[] | undefined) {
  const parts = Array.isArray(value) ? value : value ? [value] : []
  const ids = parts
    .flatMap((part) => part.split(","))
    .map((part) => Number.parseInt(part.trim(), 10))
    .filter((id) => Number.isInteger(id) && id > 0)

  return [...new Set(ids)].sort((a, b) => a - b).slice(0, 50)
}

export function tagFilterWhere(tagIds: number[] | undefined) {
  if (!tagIds || tagIds.length === 0) return {}
  return {
    tags: {
      some: { id: { in: tagIds } },
    },
  }
}
