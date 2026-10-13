import { useEffect, useState } from "react";
import { AutoComplete, Input, Spin, Tag, Typography } from "antd";
import { useNavigate } from "react-router-dom";

import { API_ROOT } from "api/constants";
import bomhub from "api/ky";
import styles from "./search.module.css";

type SearchResult = {
  bom_id: number;
  digest: string;
  content: {
    type: string;
    content: {
      name: string;
    };
  };
};

type Option = {
  value: string;
  label: React.ReactNode;
  bom_id?: number;
  disabled?: boolean;
};

export type DebouncedSearchProps = {
  placeholder?: string;
  debounceMs?: number;
  minLength?: number;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
};

export default function DebouncedSearch({
  placeholder = "Search part name/number etc.",
  debounceMs = 350,
  minLength = 4,
  autoFocus,
  disabled,
  className,
}: DebouncedSearchProps) {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const validQuery = query.trim().length >= minLength;

  useEffect(() => {
    if (!validQuery) return;

    const ctrl = new AbortController();

    const handle = setTimeout(async () => {
      setLoading(true);

      try {
        const results = (await bomhub
          .get(`${API_ROOT}/search`, {
            searchParams: { q: query.trim() },
            signal: ctrl.signal,
          })
          .json()) as SearchResult[];

        if (ctrl.signal.aborted) return;

        const next: Option[] = results.slice(0, 5).map((result) => ({
          value: result.digest,
          bom_id: result.bom_id,
          label: (
            <div className={styles.result}>
              <span className={styles.name}>{result.content.content.name}</span>
              <span className={styles.digest}>{result.digest.slice(0, 8)}</span>
              <Tag className={styles.tag}>{result.content.type}</Tag>
            </div>
          ),
        }));

        if (results.length > 5) {
          next.push({
            value: "__more__",
            label: "...",
            disabled: true,
          });
        }

        setOptions(next);
        setOpen(true);
      } catch (err) {
        if (!ctrl.signal.aborted) {
          console.error("search error", err);
          setOptions([]);
          setOpen(false);
        }
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, debounceMs);

    return () => {
      ctrl.abort();
      clearTimeout(handle);
    };
  }, [query, debounceMs, validQuery]);

  return (
    <AutoComplete
      className={className}
      value={query}
      options={validQuery ? options : []}
      open={validQuery && open}
      onOpenChange={setOpen}
      onChange={setQuery}
      onSelect={(value, option) => {
        if (!option.bom_id) return;
        navigate(`/mesh/${option.bom_id}/${value}`);
      }}
      notFoundContent={
        <div className={styles.empty}>
          {loading && <Spin size="small" />}
          <Typography.Text type="secondary">
            {loading ? "Searching..." : "No results"}
          </Typography.Text>
        </div>
      }
      disabled={disabled}
      popupMatchSelectWidth
    >
      <Input.Search
        placeholder={placeholder}
        enterButton
        allowClear
        autoFocus={autoFocus}
        loading={loading}
      />
    </AutoComplete>
  );
}
