export type GraphEdge = { sourceId: string; targetId: string; kind: string; subtype?: string };
export function parentCycle(edges: GraphEdge[], sourceId: string, targetId: string) {
  if (sourceId === targetId) return true;
  const seen = new Set<string>(); const stack = [targetId];
  while (stack.length) {
    const id = stack.pop()!;
    if (id === sourceId) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    for (const edge of edges) if (edge.kind === "PARENT_CHILD" && edge.sourceId === id) stack.push(edge.targetId);
  }
  return false;
}
export function relationshipPath(edges: GraphEdge[], start: string, end: string): string[] {
  const queue: string[][] = [[start]]; const seen = new Set([start]);
  while (queue.length) {
    const path = queue.shift()!; const last = path[path.length - 1];
    if (last === end) return path;
    for (const edge of edges) {
      const next = edge.sourceId === last ? edge.targetId : edge.targetId === last ? edge.sourceId : null;
      if (next && !seen.has(next)) { seen.add(next); queue.push([...path, next]); }
    }
  }
  return [];
}
export function graphLayout(people: { id: string; generation: number }[]) {
  const groups = new Map<number, typeof people>();
  for (const person of people) groups.set(person.generation, [...(groups.get(person.generation) ?? []), person]);
  const result: Record<string, [number, number, number]> = {};
  for (const [generation, group] of groups) group.forEach((person, index) => {
    result[person.id] = [(index - (group.length - 1) / 2) * 2.5, (2 - generation) * 2.8 + 2, (index % 2) * 0.5];
  });
  return result;
}
