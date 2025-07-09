import React, {useState, useMemo, useCallback} from "react";
import { FixedSizeList as List } from "react-window";
import { RightOutlined, DownOutlined } from "@ant-design/icons";

/**
 * Basic data contracts coming from .bpc
 */
export interface ItemNode {
  id: string;             // unique ItemNode ID
  item_id: string;        // logical Item ID (for reuse highlighting)
  children: string[];     // child ItemNode IDs (order preserved)
  parent_id?: string | null;
  qty?: number;
  variant?: string;
}

export interface ItemMeta {
  id: string;             // logical Item ID
  name: string;
  part_number?: string;
}

export interface FormationTreeProps {
  nodes: Record<string, ItemNode>;          // ItemNode ID -> node
  items: Record<string, ItemMeta>;          // Item ID -> meta (for display)
  rootId: string;                           // root ItemNode ID
  reuseIndex: Record<string, string[]>;     // Item ID -> list of ItemNode IDs
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** row height for react‑window */
  rowHeight?: number;
}

/**
 * A utility that flattens the visible part of the formation tree
 * into an array for virtualised rendering.
 */
function buildVisibleRows(
  nodes: Record<string, ItemNode>,
  rootId: string,
  expanded: Set<string>
): { id: string; depth: number }[] {
  const out: { id: string; depth: number }[] = [];
  const walk = (id: string, depth: number) => {
    out.push({ id, depth });
    if (expanded.has(id)) {
      for (const childId of nodes[id].children) {
        walk(childId, depth + 1);
      }
    }
  };
  walk(rootId, 0);
  return out;
}

/**
 * FormationTree – left pane tree view for bomhub.
 * - Virtualised for large BoMs (react‑window)
 * - Expand/collapse with in‑memory state
 * - Highlights reused nodes (usage count >1)
 * - Calls onSelect when a row is clicked
 */
export function FormationTree(props: FormationTreeProps) {
  const {
    nodes,
    items,
    rootId,
    reuseIndex,
    selectedId,
    onSelect,
    rowHeight = 28,
  } = props;

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set([rootId]));

  const toggle = useCallback((id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const rows = useMemo(() => buildVisibleRows(nodes, rootId, expanded), [nodes, rootId, expanded]);

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const { id, depth } = rows[index];
    const node = nodes[id];
    const item = items[node.item_id];
    const isExpanded = expanded.has(id);
    const hasChildren = node.children.length > 0;
    const isReused = (reuseIndex[node.item_id]?.length || 0) > 1;

    return (
      <div
        style={{
          ...style,
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          userSelect: "none",
          paddingLeft: 8 + depth * 16,
          backgroundColor: selectedId === id ? "#ebf4ff" : undefined,
        }}
        onClick={() => onSelect(id)}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = selectedId === id ? "#ebf4ff" : "#f9f9f9")}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = selectedId === id ? "#ebf4ff" : "")}
      >
        {/* toggle icon */}
        {hasChildren ? (
          <button
            onClick={e => {
              e.stopPropagation();
              toggle(id);
            }}
            style={{
              all: "unset",
              marginRight: 4,
              color: "#666",
              cursor: "pointer",
            }}
          >
            {isExpanded ? <DownOutlined style={{ fontSize: 12 }} /> : <RightOutlined style={{ fontSize: 12 }} />}
          </button>
        ) : (
          <span style={{ width: 16 }} />
        )}

        {/* part label */}
        <span style={{ flexShrink: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {item?.name || node.item_id}
          {node.qty !== undefined && (
            <span style={{ fontSize: "0.75rem", color: "#888" }}> ×{node.qty}</span>
          )}
        </span>

        {/* reuse badge */}
        {isReused && (
          <span style={{
            marginLeft: 4,
            fontSize: "10px",
            lineHeight: 1,
            color: "#b7791f",
            backgroundColor: "#fefcbf",
            borderRadius: 4,
            padding: "0 4px",
          }}>
            {reuseIndex[node.item_id].length}
          </span>
        )}
      </div>
    );
  };

  return (
    <List
      height={window.innerHeight}
      width={"25%"}
      itemCount={rows.length}
      itemSize={rowHeight}
    >
      {Row}
    </List>
  );
}
