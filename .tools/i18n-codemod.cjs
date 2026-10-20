// One-off: wraps visible English JSX text and a few attributes in t(...) so the app can be translated.
const ts = require("typescript");
const fs = require("fs");
const path = require("path");

const files = process.argv.slice(2);
const SKIP_PARENTS = new Set(["pre", "code", "script", "style"]);
const ATTRS = new Set(["placeholder", "aria-label", "title", "alt"]);

function decode(s) {
  return s.replace(/&apos;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}
const hasWords = (s) => (s.match(/[A-Za-z]/g) || []).length >= 2;
const lit = (s) => JSON.stringify(s);

for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const isClient = /^\s*["']use client["']/.test(src);
  const isServer = !isClient && /(@\/lib\/(auth|data|db)|getViewer|requireOwnView|getCurrentUser|next\/headers)/.test(src);
  if (!isClient && !isServer) { console.log("AMBIGUOUS", file); continue; }

  const edits = []; // {start,end,text}
  const components = new Map(); // fn node -> true

  function enclosingComponent(node) {
    let best = null;
    for (let n = node.parent; n; n = n.parent) {
      if (ts.isFunctionDeclaration(n) && n.name && /^[A-Z]/.test(n.name.text)) best = n;
      else if (ts.isVariableDeclaration(n) && n.initializer && (ts.isArrowFunction(n.initializer) || ts.isFunctionExpression(n.initializer)) && /^[A-Z]/.test(n.name.getText())) best = n.initializer;
      else if (ts.isFunctionDeclaration(n) && !n.name && n.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)) best = n;
    }
    return best;
  }
  function insideSkipped(node) {
    for (let n = node.parent; n; n = n.parent) {
      if (ts.isJsxElement(n) && SKIP_PARENTS.has(n.openingElement.tagName.getText())) return true;
    }
    return false;
  }

  function visit(node) {
    if (ts.isJsxText(node)) {
      const raw = node.getText();
      const trimmed = raw.trim();
      if (trimmed && hasWords(trimmed) && !insideSkipped(node)) {
        const comp = enclosingComponent(node);
        if (comp) {
          const lead = raw.match(/^\s*/)[0];
          const trail = raw.match(/\s*$/)[0];
          const key = decode(trimmed.replace(/\s+/g, " "));
          edits.push({ start: node.getStart(), end: node.getEnd(), text: `${lead}{t(${lit(key)})}${trail}` });
          components.set(comp, true);
        }
      }
    } else if (ts.isJsxAttribute(node) && ATTRS.has(node.name.getText()) && node.initializer && ts.isStringLiteral(node.initializer) && hasWords(node.initializer.text)) {
      const comp = enclosingComponent(node);
      if (comp) {
        edits.push({ start: node.initializer.getStart(), end: node.initializer.getEnd(), text: `{t(${lit(node.initializer.text)})}` });
        components.set(comp, true);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  if (edits.length === 0) continue;

  // Declare t at the top of each component that now uses it.
  for (const comp of components.keys()) {
    const body = comp.body;
    if (!body || !ts.isBlock(body)) { console.log("EXPRESSION-BODIED component, skipped decl", file); continue; }
    const text = body.getText();
    if (/\bconst t = /.test(text)) continue;
    const insertAt = body.getStart() + 1;
    if (isClient) {
      edits.push({ start: insertAt, end: insertAt, text: "\n  const t = useT();" });
    } else {
      edits.push({ start: insertAt, end: insertAt, text: "\n  const t = await getT();" });
      // make the function async if needed
      const isAsync = comp.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword);
      if (!isAsync) {
        if (ts.isFunctionDeclaration(comp)) {
          const hasExport = comp.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
          const fnKw = comp.getStart() + (comp.modifiers ? comp.modifiers.reduce((acc, m) => Math.max(acc, m.getEnd() - comp.getStart()), 0) : 0);
          const at = src.indexOf("function", comp.getStart());
          edits.push({ start: at, end: at, text: "async " });
        } else {
          edits.push({ start: comp.getStart(), end: comp.getStart(), text: "async " });
        }
      }
    }
  }

  // Apply from the end so offsets stay valid.
  edits.sort((a, b) => b.start - a.start || b.end - a.end);
  let out = src;
  for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);

  // Import.
  const imp = isClient ? 'import { useT } from "@/lib/i18n/client";' : 'import { getT } from "@/lib/i18n/server";';
  if (!out.includes(imp)) {
    const lines = out.split("\n");
    let last = -1;
    for (let i = 0; i < lines.length; i++) if (/^(import |\} from )/.test(lines[i])) last = i;
    lines.splice(last + 1, 0, imp);
    out = lines.join("\n");
  }
  fs.writeFileSync(file, out);
  console.log(isClient ? "client" : "server", file, edits.length);
}
