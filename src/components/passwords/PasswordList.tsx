import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PasswordEntry } from '../../context/PasswordContext';
import { Search, Filter, SortAsc, SortDesc, X, Command, ChevronDown } from 'lucide-react';

export type SortField = 'title' | 'username' | 'url' | 'category'; // Export and update fields
export type SortOrder = 'asc' | 'desc'; // Export

interface PasswordListProps {
  passwords: PasswordEntry[]; // Still expects passwords prop
  onSearch: (query: string) => void;
  onSort: (field: SortField, order: SortOrder) => void;
  onCategoryChange: (category: string) => void;
}

const PasswordList: React.FC<PasswordListProps> = ({
  passwords,
  onSearch,
  onSort,
  onCategoryChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('title'); // Use imported type
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc'); // Use imported type
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Categories are now managed in PasswordContext, but PasswordList still needs unique categories for filtering UI
  const uniqueCategories = useMemo(() => {
    const categories = new Set(passwords.map(p => p.category));
    return ['all', ...Array.from(categories)];
  }, [passwords]); // Depend on passwords prop

  // Popular search suggestions based on existing passwords
  const searchSuggestions = useMemo(() => {
    const titles = passwords.map(p => p.title).slice(0, 3);
    const usernames = [...new Set(passwords.map(p => p.username))].slice(0, 2);
    return [...titles, ...usernames];
  }, [passwords]);

  // Add keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch(value); // Call parent's onSearch
  };

  const handleSort = (field: SortField) => {
    const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newOrder);
    onSort(field, newOrder); // Call parent's onSort
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    onCategoryChange(category); // Call parent's onCategoryChange
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSortField('title'); // Reset to default sort field
    setSortOrder('asc'); // Reset to default sort order
    setSelectedCategory('all');
    onSearch('');
    onSort('title', 'asc'); // Call parent's onSort with default
    onCategoryChange('all');
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className={`relative flex-1 w-full ${searchFocused ? 'ring-2 ring-[#a6ccb8] rounded-md shadow-lg' : ''}`}>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className={`${searchFocused ? 'text-[#a6ccb8]' : 'text-gray-400'}`} />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            placeholder=".....(⌘K)"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="input-field pl-10 pr-10 w-full transition-all duration-200 focus:border-[#a6ccb8] focus:shadow-md"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {searchQuery ? (
              <button
                onClick={clearFilters}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Clear search"
              >
                <X size={18} />
              </button>
            ) : (
              <div className="flex items-center space-x-1 text-gray-400 text-xs bg-[#222] px-1.5 py-0.5 rounded">
                <Command size={14} />
                <span>K</span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary min-w-[100px] lg:w-auto flex items-center justify-center ${showFilters ? 'border-[#a6ccb8] bg-[#1a2420]' : ''}`}
        >
          <Filter size={18} className="mr-2" />
          Filter
          <ChevronDown size={16} className={`ml-1 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Search suggestions when focused and not typing yet */}
      {searchFocused && !searchQuery && searchSuggestions.length > 0 && (
        <div className="absolute z-10 bg-[#111111] rounded-md border border-[#333333] shadow-lg p-2 mt-1 w-full max-w-2xl animate-fade-in">
          <div className="text-xs text-gray-400 px-2 pb-1.5">Suggested Searches</div>
          <div className="space-y-1">
            {searchSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSearch(suggestion)}
                className="w-full text-left px-3 py-1.5 hover:bg-[#1e1e1e] rounded transition-colors flex items-center"
              >
                <Search size={15} className="mr-2 text-gray-500" />
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {showFilters && (
        <div className="p-4 bg-[#111111] rounded-lg border border-[#333333] animate-fade-in shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-[#a0a0a0]">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="input-field focus:border-[#a6ccb8] w-full"
              >
                {uniqueCategories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-[#a0a0a0]">
                Sort
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { field: 'title', label: 'Title' },
                  { field: 'username', label: 'Username' },
                  { field: 'url', label: 'URL' },
                  { field: 'category', label: 'Category' }
                ].map(({ field, label }) => (
                  <button
                    key={field}
                    onClick={() => handleSort(field as SortField)}
                    className={`px-3 py-1.5 rounded-md text-sm transition-all flex items-center gap-1 ${
                      sortField === field
                        ? 'bg-[#a6ccb8] text-black font-medium shadow-sm'
                        : 'bg-[#1a1a1a] text-[#a0a0a0] hover:bg-[#252525]'
                    }`}
                  >
                    {label}
                    {renderSortIcon(field as SortField)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordList;
