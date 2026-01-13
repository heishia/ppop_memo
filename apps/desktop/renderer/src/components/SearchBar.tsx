import React, { useState, useEffect, useRef } from 'react';
import { SearchService } from '../services/search-service';

interface SearchBarProps {
  onSearchResults: (results: any[]) => void;
}

function SearchBar({ onSearchResults }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const debounceRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(async () => {
      const results = await SearchService.searchMemos(query);
      onSearchResults(results);
    }, 300);
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, onSearchResults]);
  
  return (
    <div className="p-4 border-b">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="제목 또는 내용으로 검색..."
        className="w-full p-2 border rounded"
      />
    </div>
  );
}

export default SearchBar;
