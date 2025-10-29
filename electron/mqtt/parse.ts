// electron/mqtt/parse.ts
export type Parsed = { id: string; group: string; leaf?: string } | null;
export const parseFixtureTopic = (t: string): Parsed => {
  const m = /^fixture\/([^/]+)\/([^/]+)(?:\/([^/]+))?$/.exec(t);
  return m ? { id: m[1], group: m[2], leaf: m[3] } : null;
};
