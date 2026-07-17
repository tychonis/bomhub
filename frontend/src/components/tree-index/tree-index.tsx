import React, { useState, useMemo, useCallback, useEffect } from "react";
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
    rootDigest,
    reuseIndex,
    selectedDigest,
    onSelect,
    current,
    setCurrent,
    rowHeight = 24,
  } = props;

  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set([rootDigest])
  );

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!selectedDigest || !nodes[selectedDigest]) {
      return;
    }

    setExpanded((prev) => {
      const next = new Set(prev);
      let id: string | undefined = selectedDigest;

      while (id && nodes[id]) {
        next.add(id);
        id = nodes[id].parent;
      }

      return next;
    });
  }, [selectedDigest, nodes]);

  const { rows, visible } = useMemo(() => {
    const rows = buildVisibleRows(nodes, rootDigest, expanded);
    const visible = new Set(rows.map((row) => row.id));

    return { rows, visible };
  }, [nodes, rootDigest, expanded]);

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
    const { id: digest, depth } = rows[index];
    const node = nodes[digest];
    const item = items[node.item];
    const isExpanded = expanded.has(digest);
    const hasChildren = node.children.length > 0;
    const isReused = (reuseIndex[node.item]?.length || 0) > 1;
    const rowClass = [
      styles.row,
      selectedDigest === digest ? styles["selected"] : "",
      reusedRowSet.has(digest) ? styles["reused"] : "",
      current === digest ? styles["meshhover"] : "",
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
        onClick={() => onSelect(digest)}
        onMouseEnter={() => {
          setCurrent(digest);
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
              toggle(digest);
            }}
          >
            {isExpanded ? <DownOutlined /> : <RightOutlined />}
          </button>
        ) : (
          <span className={styles["notoggle"]} />
        )}

        {/* part label */}
        <span className={styles["part-label"]}>
          {item?.content.name || node.item}
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
        height={window.innerHeight * 0.9}
        width={"100%"}
        itemCount={rows.length}
        itemSize={rowHeight}
      >
        {Row}
      </List>
    </div>
  );
}
