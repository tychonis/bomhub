import React, { useState, useMemo, useCallback } from "react";
import { FixedSizeList as List } from "react-window";
import { RightOutlined, DownOutlined } from "@ant-design/icons";
import styles from "./tree-index.module.css";

interface node {
  id: string;
  depth: number;
}

/**
 * A utility that flattens the visible part of the formation tree
 * into an array for virtualised rendering.
 */
function buildVisibleRows(nodes, rootId, expanded): node[] {
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
  nodes,
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
    walk(node.parent);
  };
  const node = nodes[current];
  if (!node) {
    return [];
  }
  const reused = reuseIndex[node.item];
  if (!reused) {
    return [];
  }
  for (const reuse of reused) {
    walk(reuse);
  }
  return out;
}

export function TreeIndex(props) {
  const {
    nodes,
    items,
    rootId,
    reuseIndex,
    selectedId,
    onSelect,
    rowHeight = 28,
  } = props;

  console.log(props);

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
    const item = items[node.item];
    const isExpanded = expanded.has(id);
    const hasChildren = node.children.length > 0;
    const isReused = (reuseIndex[node.item]?.length || 0) > 1;
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
          {item?.name || node.item}
          {node.qty !== undefined && (
            <span className={styles["part-qty"]}> ×{node.qty}</span>
          )}
        </span>

        {/* reuse badge */}
        {isReused && (
          <span className={styles["reuse-badge"]}>
            {reuseIndex[node.item].length}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className={styles["tree-index"]}>
      <List
        height={window.innerHeight}
        width={"100%"}
        itemCount={rows.length}
        itemSize={rowHeight}
      >
        {Row}
      </List>
    </div>
  );
}
