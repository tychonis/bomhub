import { useState, useMemo, useCallback } from "react";
import { List, type RowComponentProps } from "react-window";
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

function getAncestors(nodes, digest: string | null) {
  const ancestors = new Set<string>();

  let id = digest ?? undefined;
  while (id && nodes[id]) {
    ancestors.add(id);
    id = nodes[id].parent;
  }

  return ancestors;
}

function TreeRow({
  row,
  style,
  expanded,
  selected,
  reused,
  hovered,
  onSelect,
  onToggle,
  onHover,
}) {
  const { id, depth, node, title, reuseCount } = row;
  const hasChildren = node.children.length > 0;

  const rowClass = [
    styles.row,
    selected && styles.selected,
    reused && styles.reused,
    hovered && styles.meshhover,
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
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover("")}
    >
      {hasChildren ? (
        <button
          className={styles.toggle}
          onClick={(e) => {
            e.stopPropagation();
            onToggle(id);
          }}
        >
          {expanded ? <DownOutlined /> : <RightOutlined />}
        </button>
      ) : (
        <span className={styles.notoggle} />
      )}

      <span className={styles["part-label"]} title={title}>
        {title}
        {node.qty !== undefined && (
          <span className={styles["part-qty"]}> ×{node.qty}</span>
        )}
      </span>

      {reuseCount > 1 && (
        <span className={styles["reuse-badge"]}>{reuseCount}</span>
      )}
    </div>
  );
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

  // Nodes explicitly expanded by the user.
  const [manualExpanded, setManualExpanded] = useState<Set<string>>(
    () => new Set([rootDigest])
  );

  // Automatically expand the path to the selected node.
  const selectedPath = useMemo(
    () => getAncestors(nodes, selectedDigest),
    [nodes, selectedDigest]
  );

  const expanded = useMemo(
    () => new Set([...manualExpanded, ...selectedPath]),
    [manualExpanded, selectedPath]
  );

  const toggle = useCallback((digest: string) => {
    setManualExpanded((prev) => {
      const next = new Set(prev);

      if (next.has(digest)) {
        next.delete(digest);
      } else {
        next.add(digest);
      }

      return next;
    });
  }, []);

  // react-window needs a flat list rather than a tree.
  const rows = useMemo(
    () =>
      buildVisibleRows(nodes, rootDigest, expanded).map(({ id, depth }) => {
        const node = nodes[id];
        const item = items[node.item];

        return {
          id,
          depth,
          node,
          title:
            item?.content?.details?.label || item?.content?.name || node.item,
          reuseCount: reuseIndex[node.item]?.length ?? 0,
        };
      }),
    [nodes, items, rootDigest, expanded, reuseIndex]
  );

  // Highlight visible instances of the part hovered in the 3D viewer.
  const reusedRows = useMemo(() => {
    const visible = new Set(rows.map((row) => row.id));

    return new Set(buildReusedRows(nodes, visible, reuseIndex, current));
  }, [nodes, rows, reuseIndex, current]);

  const Row = ({ index, style }: RowComponentProps) => {
    const row = rows[index];

    return (
      <TreeRow
        row={row}
        style={style}
        expanded={expanded.has(row.id)}
        selected={selectedDigest === row.id}
        reused={reusedRows.has(row.id)}
        hovered={current === row.id}
        onSelect={onSelect}
        onToggle={toggle}
        onHover={setCurrent}
      />
    );
  };

  return (
    <div className={styles["tree-index"]}>
      <List
        style={{
          height: window.innerHeight * 0.9,
          width: "100%",
        }}
        rowCount={rows.length}
        rowHeight={rowHeight}
        rowComponent={Row}
        rowProps={{}}
      />
    </div>
  );
}
