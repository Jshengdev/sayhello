/**
 * lib/openui-lang.ts — a small, dependency-free parser for the OpenUI Lang DSL
 * the render node emits (docs/reference/OPENUI-RENDER.md). The @openuidev/react
 * packages are pre-1.0 and churn; per the spec's documented fallback we render
 * the openuiLang AST with this local mapper instead. The grammar is the probe's:
 *
 *   root   = Receipt("Acme", "1 fabricated claim caught and cut", [ledger, gate])
 *   ledger = ClaimsLedger([r1, r2])
 *   r1     = ClaimRow("claim text", "FABRICATED")
 *   r2     = ClaimRow("claim text", "GROUNDED", "acme.io/customers")
 *   p1     = {generation: 1, grounding: 0.4}
 *   gate   = GateBlock("Approve story", "approve_story", "Grounding 0.92 — ready")
 *
 * Output: a resolved tree where component calls become { _component, _args }.
 * Parse failures throw — the caller surfaces a visible FAILED note (no silent
 * stub) and falls back to the StoryRun-derived receipt.
 */

export interface ElementNode {
  _component: string;
  _args: LangValue[];
}
export type LangValue =
  | string
  | number
  | boolean
  | null
  | LangValue[]
  | ElementNode
  | { [k: string]: LangValue };

export function isElement(v: LangValue): v is ElementNode {
  return !!v && typeof v === "object" && !Array.isArray(v) && "_component" in v;
}

/** split a comma-separated arg list, respecting quotes/()/[]/{} nesting */
function splitTopLevel(src: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let inStr = false;
  let esc = false;
  let cur = "";
  for (const ch of src) {
    if (inStr) {
      cur += ch;
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') {
      inStr = true;
      cur += ch;
      continue;
    }
    if (ch === "(" || ch === "[" || ch === "{") depth++;
    if (ch === ")" || ch === "]" || ch === "}") depth--;
    if (ch === "," && depth === 0) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function unquote(token: string): string {
  try {
    return JSON.parse(token) as string;
  } catch {
    return token.replace(/^"|"$/g, "");
  }
}

export function parseOpenuiLang(text: string): ElementNode {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("//"));

  const decls = new Map<string, string>();
  for (const line of lines) {
    const m = line.match(/^([A-Za-z_]\w*)\s*=\s*(.+)$/);
    if (m) decls.set(m[1], m[2]);
  }
  if (!decls.has("root")) throw new Error("openui-lang: no `root` declaration");

  const memo = new Map<string, LangValue>();
  const inProgress = new Set<string>();

  function evalRef(name: string): LangValue {
    if (memo.has(name)) return memo.get(name)!;
    if (inProgress.has(name)) throw new Error(`openui-lang: cycle at ${name}`);
    inProgress.add(name);
    const v = parseExpr(decls.get(name)!);
    inProgress.delete(name);
    memo.set(name, v);
    return v;
  }

  function parseExpr(raw: string): LangValue {
    const s = raw.trim();
    if (s === "null") return null;
    if (s === "true") return true;
    if (s === "false") return false;
    if (s.startsWith('"')) return unquote(s);
    if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
    if (s.startsWith("[")) {
      const inner = s.slice(1, -1).trim();
      if (!inner) return [];
      return splitTopLevel(inner).map(parseExpr);
    }
    if (s.startsWith("{")) {
      const inner = s.slice(1, -1).trim();
      const obj: { [k: string]: LangValue } = {};
      if (inner) {
        for (const pair of splitTopLevel(inner)) {
          const ci = pair.indexOf(":");
          if (ci === -1) continue;
          const key = unquote(pair.slice(0, ci).trim());
          obj[key] = parseExpr(pair.slice(ci + 1).trim());
        }
      }
      return obj;
    }
    const call = s.match(/^([A-Za-z_]\w*)\s*\((.*)\)$/s);
    if (call) {
      const args = call[2].trim() ? splitTopLevel(call[2]) : [];
      return { _component: call[1], _args: args.map(parseExpr) };
    }
    // a bare identifier — resolve as a reference if we have it
    if (/^[A-Za-z_]\w*$/.test(s) && decls.has(s)) return evalRef(s);
    return s; // unknown bareword → render as text, never throw the whole tree
  }

  const root = evalRef("root");
  if (!isElement(root)) throw new Error("openui-lang: root is not an element");
  return root;
}
