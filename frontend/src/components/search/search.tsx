import { useEffect, useMemo, useRef, useState } from "react";
import { AutoComplete, Input, Spin, Typography } from "antd";

import bomhub from "api/ky";

/**
 * Debounced search bar with Ant Design AutoComplete.
 * - Waits for user inactivity (debounce) before calling the API
 * - Cancels in‑flight requests when the query changes
 * - Guards for min input length
 * - Handles loading / empty states
 *
 * Usage:
 * <DebouncedSearch
 *   placeholder="Search parts..."
 *   debounceMs={300}
 *   minLength={2}
 *   fetcher={async (q, signal) => {
 *     const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal });
 *     const data: { id: string; label: string }[] = await res.json();
 *     return data.map(({ id, label }) => ({ value: id, label }));
 *   }}
 *   onPick={(value, option) => console.log("picked", value, option)}
 * />
 */

export type Option = { value: string; label: string };

export type DebouncedSearchProps = {
  placeholder?: string;
  debounceMs?: number; // time to wait after user stops typing
  minLength?: number; // do nothing until query length >= minLength
  defaultValue?: string;
  // fetcher returns AutoComplete options. Use AbortSignal to support cancellation.
  fetcher?: (query: string, signal: AbortSignal) => Promise<Option[]>;
  // called when user selects an option
  onPick?: (value: string, option: Option) => void;
  // called when the input is submitted via Enter or Search icon
  onSubmit?: (query: string) => void;
  // allow full control if needed
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
  const lastCompletedQuery = useRef<string>("");

  // default fetcher hits /api/search?q=
  const effectiveFetcher = useMemo(() => {
    if (fetcher) return fetcher;
    return async (q: string, signal: AbortSignal): Promise<Option[]> => {
      const res = await bomhub.get(`/api/search?q=${encodeURIComponent(q)}`, {
        signal,
      });
      if (!res.ok) throw new Error(`Search failed: ${res.status}`);
      const data: { value: string; label: string }[] = await res.json();
      return data;
    };
  }, [fetcher]);

  // Debounced side‑effect to query backend
  useEffect(() => {
    if (query.trim().length < minLength) {
      setOptions([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    const ctrl = new AbortController();
    const handle = setTimeout(async () => {
      try {
        const opts = await effectiveFetcher(query.trim(), ctrl.signal);
        setOptions(opts);
        setOpen(true);
        lastCompletedQuery.current = query.trim();
      } catch (err) {
        if ((err as any)?.name !== "AbortError") {
          // Optionally surface an error option
          setOptions([]);
          setOpen(false);
          // eslint-disable-next-line no-console
          console.error("search error", err);
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

  const notFoundContent = (
    <div className="py-2 px-3 flex items-center gap-2">
      {loading && <Spin size="small" />}
      <Typography.Text type="secondary">
        {loading
          ? "Search part name/number etc."
          : query.trim().length < minLength
          ? ""
          : "No results"}
      </Typography.Text>
    </div>
  );

  return (
    <AutoComplete
      className={className}
      value={query}
      onSearch={setQuery}
      options={options}
      onSelect={(val, option) => onPick?.(val, option as Option)}
      open={open}
      onDropdownVisibleChange={setOpen}
      notFoundContent={notFoundContent}
      disabled={disabled}
      popupMatchSelectWidth={true}
      filterOption={false} // we rely on server filtering
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
