import { useState, useMemo, useEffect } from 'react';

export interface UseTablePaginationOptions<T> {
  items: T[];
  initialPageSize?: number;
  dateField?: keyof T | ((item: T) => string | undefined | null);
}

export function useTablePagination<T>({
  items,
  initialPageSize = 10,
  dateField = 'created_at' as keyof T,
}: UseTablePaginationOptions<T>) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // 1. Date Range Filter
  const dateFilteredItems = useMemo(() => {
    if (!startDate && !endDate) return items;

    return items.filter((item) => {
      let rawDate: any = null;
      if (typeof dateField === 'function') {
        rawDate = dateField(item);
      } else if (dateField && item[dateField]) {
        rawDate = item[dateField];
      }

      if (!rawDate) return false;

      // Extract YYYY-MM-DD from rawDate (supports ISO strings, Date objects, or YYYY-MM-DD strings)
      let itemDateStr = '';
      if (typeof rawDate === 'string') {
        itemDateStr = rawDate.slice(0, 10);
      } else if (rawDate instanceof Date) {
        const y = rawDate.getFullYear();
        const m = String(rawDate.getMonth() + 1).padStart(2, '0');
        const d = String(rawDate.getDate()).padStart(2, '0');
        itemDateStr = `${y}-${m}-${d}`;
      }

      if (!itemDateStr) return false;

      if (startDate && endDate) {
        return itemDateStr >= startDate && itemDateStr <= endDate;
      }
      if (startDate) {
        return itemDateStr >= startDate;
      }
      if (endDate) {
        return itemDateStr <= endDate;
      }
      return true;
    });
  }, [items, startDate, endDate, dateField]);

  // Total pages calculation
  const totalItems = dateFilteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Reset page when filters or total pages change
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Reset to page 1 whenever search/date changes
  const handleDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setCurrentPage(1);
  };

  const handleClearDate = () => {
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  // 2. Slice paginated items for current page
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return dateFilteredItems.slice(start, start + pageSize);
  }, [dateFilteredItems, currentPage, pageSize]);

  // Continuous S.No generator
  const getSerialNumber = (indexOnPage: number): number => {
    return (currentPage - 1) * pageSize + indexOnPage + 1;
  };

  return {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize: handlePageSizeChange,
    totalPages,
    totalItems,
    startDate,
    endDate,
    setDateRange: handleDateChange,
    clearDateFilter: handleClearDate,
    paginatedItems,
    dateFilteredItems,
    getSerialNumber,
  };
}
