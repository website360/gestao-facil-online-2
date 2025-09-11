import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { DataTable, DataTableColumn } from '@/components/ui/data-table';

export interface ResponsiveDataTableColumn<T> extends DataTableColumn<T> {
  mobileLabel?: string;
  mobileRender?: (item: T, index: number) => React.ReactNode;
  showInCard?: boolean;
}

interface ResponsiveDataTableProps<T> {
  data: T[];
  columns: ResponsiveDataTableColumn<T>[];
  searchPlaceholder?: string;
  itemsPerPage?: number;
  className?: string;
  emptyMessage?: string;
  hideSearch?: boolean;
  cardKeyExtractor: (item: T) => string;
  cardTitle: (item: T) => string;
  cardSubtitle?: (item: T) => string | React.ReactNode;
  cardActions?: (item: T) => React.ReactNode;
}

export function ResponsiveDataTable<T extends Record<string, any>>({
  data,
  columns,
  searchPlaceholder = 'Buscar...',
  itemsPerPage = 100,
  className = '',
  emptyMessage = 'Nenhum registro encontrado',
  hideSearch = false,
  cardKeyExtractor,
  cardTitle,
  cardSubtitle,
  cardActions,
}: ResponsiveDataTableProps<T>) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="space-y-3">
        {data.map((item, index) => (
          <Card key={cardKeyExtractor(item)} className="border border-gray-200">
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Title and subtitle */}
                <div>
                  <h3 className="font-medium text-gray-900">{cardTitle(item)}</h3>
                  {cardSubtitle && (
                    <div className="text-sm text-gray-600 mt-1">
                      {typeof cardSubtitle === 'function' ? cardSubtitle(item) : cardSubtitle}
                    </div>
                  )}
                </div>

                {/* Card fields */}
                <div className="space-y-2">
                  {columns
                    .filter(col => col.showInCard !== false)
                    .map((column) => (
                      <div key={column.key as string}>
                        <span className="text-xs text-gray-500">
                          {column.mobileLabel || column.header}:
                        </span>
                        <div className="mt-0.5">
                          {column.mobileRender
                            ? column.mobileRender(item, index)
                            : column.render
                            ? column.render(item, index)
                            : item[column.key as keyof T]?.toString() || '-'}
                        </div>
                      </div>
                    ))}
                </div>

                {/* Actions */}
                {cardActions && (
                  <div className="pt-3 border-t border-gray-100">
                    {cardActions(item)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Desktop - use regular DataTable
  return (
    <DataTable
      data={data}
      columns={columns}
      searchPlaceholder={searchPlaceholder}
      itemsPerPage={itemsPerPage}
      className={className}
      emptyMessage={emptyMessage}
      hideSearch={hideSearch}
    />
  );
}