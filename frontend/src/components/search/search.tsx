import { useEffect, useMemo, useState } from "react";
import { AutoComplete, Input, Spin, Typography } from "antd";

import bomhub from "api/ky";
export type Option = {
  value: string;
  label: string;
};

export type DebouncedSearchProps = {
  placeholder?: string;
  debounceMs?: number;
  minLength?: number;
  defaultValue?: string;
  fetcher?: (query: string, signal: AbortSignal) => Promise<Option[]>;
  onPick?: (value: string, option: Option) => void;
  onSubmit?: (query: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
};

export default function DebouncedSearch({
  placeholder = "Search part name/number etc.",
  debounceMs = 350,
  minLength = 2,
  defaultValue = "",
  fetcher,
  onPick,
  onSubmit,
  autoFocus,
  disabled,
  className,
}: DebouncedSearchProps) {
  const [query, setQuery] = useState(defaultValue);
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const effectiveFetcher = useMemo(() => {
    if (fetcher) return fetcher;

    return async (q: string, signal: AbortSignal): Promise<Option[]> => {
      const res = await bomhub.get(`/api/search?q=${encodeURIComponent(q)}`, {
        signal,
      });

      if (!res.ok) {
        throw new Error(`Search failed: ${res.status}`);
      }

      return res.json();
    };
  }, [fetcher]);

  useEffect(() => {
    const q = query.trim();

    if (q.length < minLength) {
      return;
    }

    const ctrl = new AbortController();

    const handle = setTimeout(async () => {
      setLoading(true);

      try {
        const result = await effectiveFetcher(q, ctrl.signal);

        setOptions(result);
        setOpen(true);
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") {
          console.error("search error", err);
          setOptions([]);
          setOpen(false);
        }
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => {
      ctrl.abort();
      clearTimeout(handle);
    };
  }, [query, debounceMs, minLength, effectiveFetcher]);

  const validQuery = query.trim().length >= minLength;

  return (
    <AutoComplete
      className={className}
      value={query}
      options={validQuery ? options : []}
      onSelect={(value, option) => onPick?.(value, option as Option)}
      open={validQuery && open}
      onOpenChange={setOpen}
      notFoundContent={
        <div className="py-2 px-3 flex items-center gap-2">
          {loading && <Spin size="small" />}
          <Typography.Text type="secondary">
            {loading ? "Searching..." : validQuery ? "No results" : ""}
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
        onSearch={(value) => onSubmit?.(value)}
        onChange={(e) => setQuery(e.target.value)}
      />
    </AutoComplete>
  );
}
