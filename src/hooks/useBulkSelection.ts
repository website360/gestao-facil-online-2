import { useState, useCallback } from 'react';

export interface BulkSelectionState {
  selectedItems: Set<string>;
  isAllSelected: boolean;
  isPartiallySelected: boolean;
}

export const useBulkSelection = (itemIds: string[]) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const isAllSelected = selectedItems.size > 0 && selectedItems.size === itemIds.length;
  const isPartiallySelected = selectedItems.size > 0 && selectedItems.size < itemIds.length;

  const toggleItem = useCallback((itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(itemIds));
    }
  }, [itemIds, isAllSelected]);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const selectItems = useCallback((ids: string[]) => {
    setSelectedItems(new Set(ids));
  }, []);

  return {
    selectedItems,
    isAllSelected,
    isPartiallySelected,
    toggleItem,
    toggleAll,
    clearSelection,
    selectItems,
    selectedCount: selectedItems.size
  };
};