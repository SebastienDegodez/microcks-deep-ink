import type { AgentCard, AgentProfile } from './types.js';

/** The card as the mock serves it: only `supportedInterfaces` is rewritten, in the same order. */
export function serveCardFromMock(profile: AgentProfile): AgentCard {
  return {
    ...profile.card,
    supportedInterfaces: profile.card.supportedInterfaces.map((entry) => {
      const transport = profile.transports.find((t) => t.binding === entry.protocolBinding);
      return transport ? { ...entry, url: transport.mockUrl } : entry;
    }),
  };
}

/** Pretty-printed JSON, one array entry per displayed line. */
export function cardLines(card: AgentCard): string[] {
  return JSON.stringify(card, null, 2).split('\n');
}

export interface CardDiffLine {
  /** Published line number, or undefined for an added line. */
  number?: number;
  mark: ' ' | '+' | '-';
  text: string;
}

/** Line-by-line diff of the published card and the mock copy (same line count: values change in place). */
export function diffCards(published: string[], mock: string[]): CardDiffLine[] {
  const out: CardDiffLine[] = [];
  published.forEach((line, i) => {
    const other = mock[i] ?? line;
    if (other !== line) {
      out.push({ number: undefined, mark: '-', text: line });
      out.push({ number: i + 1, mark: '+', text: other });
    } else {
      out.push({ number: i + 1, mark: ' ', text: line });
    }
  });
  return out;
}

export interface CardSection {
  key: string;
  from: string;
  to: string;
  summary: string;
}

export const CARD_SECTIONS: readonly CardSection[] = [
  { key: 'name', from: 'name', to: 'provider', summary: 'Pastry concierge 1.0 · Bakery platform' },
  { key: 'supportedInterfaces', from: 'supportedInterfaces', to: 'supportedInterfaces', summary: '3 · JSONRPC preferred, HTTP+JSON, GRPC' },
  { key: 'capabilities', from: 'capabilities', to: 'capabilities', summary: 'streaming, pushNotifications · no extended card' },
  { key: 'securitySchemes', from: 'securitySchemes', to: 'securityRequirements', summary: 'bakeryOAuth · OAuth2 client credentials' },
  { key: 'skills', from: 'skills', to: 'skills', summary: '3 · recommend, order, track' },
];

/** First and last line (1-based) of every outline section, found from the top-level keys of the JSON. */
export function sectionRanges(lines: string[], sections: readonly CardSection[] = CARD_SECTIONS): Record<string, [number, number]> {
  const keyLine: Record<string, number> = {};
  lines.forEach((line, i) => {
    const m = /^ {2}"(\w+)":/.exec(line);
    if (m?.[1]) keyLine[m[1]] = i + 1;
  });
  const order = Object.keys(keyLine);
  const endOf = (key: string): number => {
    const idx = order.indexOf(key);
    const next = order[idx + 1];
    return next ? (keyLine[next] ?? lines.length) - 1 : lines.length - 1;
  };
  const ranges: Record<string, [number, number]> = {};
  for (const s of sections) ranges[s.key] = [keyLine[s.from] ?? 0, endOf(s.to)];
  return ranges;
}

const REQUIRED = ['name', 'description', 'version', 'supportedInterfaces', 'capabilities', 'defaultInputModes', 'defaultOutputModes', 'skills'] as const;

/** Required fields of the spec that the card does not carry. */
export function missingCardFields(card: AgentCard): string[] {
  const record = card as unknown as Record<string, unknown>;
  return REQUIRED.filter((key) => record[key] === undefined || record[key] === '');
}
