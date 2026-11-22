import type { ReactNode } from "react";

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g).filter(Boolean).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={index}>{part.slice(1, -1)}</em>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={index}>{part.slice(1, -1)}</code>;
    return part;
  });
}

function isTableRow(line: string) { return line.trim().startsWith("|") && line.trim().endsWith("|"); }
function cells(line: string) { return line.trim().replace(/^\||\|$/g, "").split("|").map(cell => cell.trim()); }
function isSeparator(line: string) { return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line.trim()); }

export default function MarkdownOutput({ children, content }: { children?: string; content?: string }) {
  const lines = (content ?? children ?? "").split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line || line === "---") { index += 1; continue; }
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const content = inline(heading[2]);
      blocks.push(level === 1 ? <h1 key={index}>{content}</h1> : level === 2 ? <h2 key={index}>{content}</h2> : <h3 key={index}>{content}</h3>);
      index += 1;
      continue;
    }
    if (isTableRow(line)) {
      const rows: string[][] = [];
      while (index < lines.length && isTableRow(lines[index].trim())) {
        const row = lines[index].trim();
        if (!isSeparator(row)) rows.push(cells(row));
        index += 1;
      }
      if (rows.length) blocks.push(<div className="markdown-table-scroll" key={`table-${index}`}><table><thead><tr>{rows[0].map((cell, cellIndex) => <th key={cellIndex}>{inline(cell)}</th>)}</tr></thead><tbody>{rows.slice(1).map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{inline(cell)}</td>)}</tr>)}</tbody></table></div>);
      continue;
    }
    const listType = /^[-*+]\s+/.test(line) ? "ul" : /^\d+[.)]\s+/.test(line) ? "ol" : null;
    if (listType) {
      const items: string[] = [];
      const pattern = listType === "ul" ? /^[-*+]\s+/ : /^\d+[.)]\s+/;
      while (index < lines.length && pattern.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(pattern, ""));
        index += 1;
      }
      blocks.push(listType === "ul" ? <ul key={`list-${index}`}>{items.map((item, itemIndex) => <li key={itemIndex}>{inline(item)}</li>)}</ul> : <ol key={`list-${index}`}>{items.map((item, itemIndex) => <li key={itemIndex}>{inline(item)}</li>)}</ol>);
      continue;
    }
    if (line.startsWith(">")) {
      blocks.push(<blockquote key={index}>{inline(line.replace(/^>\s?/, ""))}</blockquote>);
      index += 1;
      continue;
    }
    const paragraph = [line];
    index += 1;
    while (index < lines.length) {
      const next = lines[index].trim();
      if (!next || /^(#{1,3})\s+/.test(next) || isTableRow(next) || /^[-*+]\s+/.test(next) || /^\d+[.)]\s+/.test(next) || next === "---") break;
      paragraph.push(next);
      index += 1;
    }
    blocks.push(<p key={`p-${index}`}>{inline(paragraph.join(" "))}</p>);
  }
  return <>{blocks}</>;
}
