import React, { useState, useMemo } from 'react';
import { Search, Filter, SortAsc, SortDesc, Edit2, Save, X } from 'lucide-react';

const DataTable = ({ 
  data, 
  headers, 
  onDataChange, 
  maxHeight = '400px',
  editable = true,
  title = "Data Preview"
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [selectedColumns, setSelectedColumns] = useState(new Set(headers));

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = data.filter(row =>
      headers.some(header => 
        String(row[header] || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key] || '';
        const bVal = b[sortConfig.key] || '';
        
        // Try to parse as numbers for proper numeric sorting
        const aNum = parseFloat(aVal);
        const bNum = parseFloat(bVal);
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
        }
        
        // String comparison
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        
        if (sortConfig.direction === 'asc') {
          return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
        } else {
          return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
        }
      });
    }

    return filtered;
  }, [data, headers, searchTerm, sortConfig]);

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const handleCellEdit = (rowIndex, column, value) => {
    if (!editable) return;
    
    setEditingCell({ rowIndex, column });
    setEditValue(value || '');
  };

  const handleCellSave = () => {
    if (!editingCell || !onDataChange) return;

    const newData = [...data];
    const actualRowIndex = data.indexOf(processedData[editingCell.rowIndex]);
    newData[actualRowIndex][editingCell.column] = editValue;
    
    onDataChange(newData);
    setEditingCell(null);
    setEditValue('');
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const toggleColumn = (column) => {
    const newSelected = new Set(selectedColumns);
    if (newSelected.has(column)) {
      newSelected.delete(column);
    } else {
      newSelected.add(column);
    }
    setSelectedColumns(newSelected);
  };

  const visibleHeaders = headers.filter(header => selectedColumns.has(header));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {processedData.length} of {data.length} rows
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Column Visibility Toggle */}
          <div className="relative">
            <details className="group">
              <summary className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                <Filter className="h-4 w-4 mr-2" />
                Columns ({visibleHeaders.length}/{headers.length})
              </summary>
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                <div className="p-2">
                  {headers.map(header => (
                    <label key={header} className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedColumns.has(header)}
                        onChange={() => toggleColumn(header)}
                        className="mr-3 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                        {header}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>

      {/* Table */}
      <div 
        className="overflow-auto"
        style={{ maxHeight }}
      >
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
            <tr>
              {visibleHeaders.map(header => (
                <th
                  key={header}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => handleSort(header)}
                >
                  <div className="flex items-center">
                    <span className="truncate max-w-32" title={header}>
                      {header}
                    </span>
                    {sortConfig.key === header && (
                      sortConfig.direction === 'asc' ? 
                        <SortAsc className="ml-1 h-3 w-3" /> : 
                        <SortDesc className="ml-1 h-3 w-3" />
                    )}
                  </div>
                </th>
              ))}
              {editable && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600 w-16">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {processedData.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                {visibleHeaders.map(header => (
                  <td
                    key={header}
                    className="px-4 py-3 text-sm text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 max-w-xs"
                  >
                    {editingCell?.rowIndex === rowIndex && editingCell?.column === header ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 px-2 py-1 text-sm border border-emerald-300 rounded focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCellSave();
                            if (e.key === 'Escape') handleCellCancel();
                          }}
                        />
                        <button
                          onClick={handleCellSave}
                          className="p-1 text-emerald-600 hover:text-emerald-700"
                          title="Save"
                        >
                          <Save className="h-3 w-3" />
                        </button>
                        <button
                          onClick={handleCellCancel}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Cancel"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className={`truncate ${editable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 rounded px-2 py-1' : ''}`}
                        title={String(row[header] || '')}
                        onClick={() => editable && handleCellEdit(rowIndex, header, row[header])}
                      >
                        {row[header] || '-'}
                      </div>
                    )}
                  </td>
                ))}
                {editable && (
                  <td className="px-4 py-3 text-sm border-b border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => handleCellEdit(rowIndex, visibleHeaders[0], row[visibleHeaders[0]])}
                      className="p-1 text-gray-400 hover:text-emerald-600 transition-colors"
                      title="Edit Row"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {processedData.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {searchTerm ? 'No data matches your search' : 'No data available'}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>
            Showing {processedData.length} rows
          </span>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Clear search
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataTable;
