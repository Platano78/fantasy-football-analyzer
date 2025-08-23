import { useState, useMemo, useCallback, useRef } from 'react';

interface VirtualizationOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function useVirtualization<T>(
  items: T[],
  options: VirtualizationOptions
) {
  const { itemHeight, containerHeight, overscan = 3 } = options;
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length,
      startIndex + Math.ceil(containerHeight / itemHeight) + overscan * 2
    );

    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex);
  }, [items, visibleRange.startIndex, visibleRange.endIndex]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    const scrollTop = Math.max(0, Math.min(index * itemHeight, totalHeight - containerHeight));
    setScrollTop(scrollTop);
  }, [itemHeight, totalHeight, containerHeight]);

  const getItemProps = useCallback((index: number, _item?: T) => ({
    style: {
      height: itemHeight,
      transform: `translateY(${(visibleRange.startIndex + index) * itemHeight}px)`,
      position: 'absolute' as const,
      width: '100%',
      top: 0,
      left: 0,
    }
  }), [itemHeight, visibleRange.startIndex]);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    startIndex: visibleRange.startIndex,
    endIndex: visibleRange.endIndex,
    handleScroll,
    scrollToIndex,
    getItemProps,
    containerRef,
    containerProps: {
      style: { height: containerHeight },
      onScroll: handleScroll,
    }
  };
}