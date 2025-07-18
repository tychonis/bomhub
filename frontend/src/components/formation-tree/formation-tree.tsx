import React, { useState, useMemo, useCallback } from "react";
import { FixedSizeList as List } from "react-window";
import { RightOutlined, DownOutlined } from "@ant-design/icons";
import styles from "./formation-tree.module.css";

/**
 * Basic data contracts coming from .bpc
 */
export interface ItemNode {
  id: string; // unique ItemNode ID
  item_id: string; // logical Item ID (for reuse highlighting)
  children: string[]; // child ItemNode IDs (order preserved)
  parent_id?: string;
  qty?: number;
  variant?: string;
}

export interface ItemMeta {
  id: string; // logical Item ID
  name: string;
  part_number?: string;
}

export interface FormationTreeProps {
  nodes: Record<string, ItemNode>; // ItemNode ID -> node
  items: Record<string, ItemMeta>; // Item ID -> meta (for display)
  rootId: string; // root ItemNode ID
  reuseIndex: Record<string, string[]>; // Item ID -> list of ItemNode IDs
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** row height for react‑window */
  rowHeight?: number;
}

interface node {
  id: string;
  depth: number;
}

/**
 * A utility that flattens the visible part of the formation tree
 * into an array for virtualised rendering.
 */
function buildVisibleRows(
  nodes: Record<string, ItemNode>,
  rootId: string,
  expanded: Set<string>
): node[] {
  const out: node[] = [];
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
 * A utility that flattens the reused part of the formation tree
 * into an array for referencing.
 */
function buildReusedRows(
  nodes: Record<string, ItemNode>,
  visible: Set<string>,
  reuseIndex: Record<string, string[]>,
  current: string
): string[] {
  const out: string[] = [];
  const walk = (id?: string) => {
    if (!id) {
      return;
    }
    if (visible.has(id)) {
      out.push(id);
      return;
    }
    const node = nodes[id];
    walk(node.parent_id);
  };
  const node = nodes[current];
  if (!node) {
    return [];
  }
  const reused = reuseIndex[node.item_id];
  if (!reused) {
    return [];
  }
  for (const reuse of reused) {
    walk(reuse);
  }
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

  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set([rootId])
  );

  const [current, setCurrent] = useState<string>("");

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const rows = useMemo(
    () => buildVisibleRows(nodes, rootId, expanded),
    [nodes, rootId, expanded]
  );

  const visible = new Set<string>();
  for (const row of rows) {
    visible.add(row.id);
  }

  const reusedRows = useMemo(
    () => buildReusedRows(nodes, visible, reuseIndex, current),
    [nodes, visible, reuseIndex, current]
  );
  const reusedRowSet = new Set(reusedRows);

  const Row = ({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) => {
    const { id, depth } = rows[index];
    const node = nodes[id];
    const item = items[node.item_id];
    const isExpanded = expanded.has(id);
    const hasChildren = node.children.length > 0;
    const isReused = (reuseIndex[node.item_id]?.length || 0) > 1;
    const rowClass = [
      styles.row,
      selectedId === id ? styles["selected"] : "",
      reusedRowSet.has(id) ? styles["reused"] : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div
        className={rowClass}
        style={{
          ...style,
          paddingLeft: 8 + depth * 16,
        }}
        onClick={() => onSelect(id)}
        onMouseEnter={() => {
          setCurrent(id);
        }}
        onMouseLeave={() => {
          setCurrent("");
        }}
      >
        {/* toggle icon */}
        {hasChildren ? (
          <button
            className={styles["toggle"]}
            onClick={(e) => {
              e.stopPropagation();
              toggle(id);
            }}
          >
            {isExpanded ? (
              <DownOutlined style={{ fontSize: 12 }} />
            ) : (
              <RightOutlined style={{ fontSize: 12 }} />
            )}
          </button>
        ) : (
          <span style={{ width: 16 }} />
        )}

        {/* part label */}
        <span className={styles["part-label"]}>
          {item?.name || node.item_id}
          {node.qty !== undefined && (
            <span className={styles["part-qty"]}> ×{node.qty}</span>
          )}
        </span>

        {/* reuse badge */}
        {isReused && (
          <span className={styles["reuse-badge"]}>
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
