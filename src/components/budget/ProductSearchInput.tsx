import React, { useState, useRef, useEffect } from 'react';

import { createPortal } from 'react-dom';
import { Input } from '@/components/ui/input';
import { ChevronDown, X } from 'lucide-react';

interface ProductOption {
  value: string;
  label: string;
}

interface ProductSearchInputProps {
  value: string;
  onValueChange: (value: string) => void;
  options: ProductOption[];
  placeholder?: string;
  className?: string;
}

const ProductSearchInput = ({
  value,
  onValueChange,
  options,
  placeholder = "Digite para buscar produto...",
  className = ""
}: ProductSearchInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get the selected product label
  const selectedProduct = options.find(option => option.value === value);
  const displayValue = selectedProduct ? selectedProduct.label : '';

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    const updatePos = () => {
      if (inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      }
    };

    if (isOpen) {
      updatePos();
      document.addEventListener('mousedown', handleClickOutside, true);
      window.addEventListener('scroll', updatePos, true);
      window.addEventListener('resize', updatePos);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside, true);
        window.removeEventListener('scroll', updatePos, true);
        window.removeEventListener('resize', updatePos);
      };
    }
  }, [isOpen]);


  const handleInputFocus = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
    setIsOpen(true);
    setSearchTerm('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
    setIsOpen(true);
  };

  const handleOptionSelect = (option: ProductOption) => {
    console.log('=== PRODUCT SELECTION START ===');
    console.log('Option selected:', option);
    console.log('Current value before change:', value);
    console.log('Calling onValueChange with:', option.value);
    onValueChange(option.value);
    console.log('=== PRODUCT SELECTION END ===');
    setIsOpen(false);
    setSearchTerm('');
    inputRef.current?.blur();
  };

  const handleClear = () => {
    onValueChange('');
    setSearchTerm('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          value={isOpen ? searchTerm : displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className={`h-8 text-xs bg-background pr-16 ${className}`}
        />
        
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-muted rounded-sm"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:bg-muted rounded-sm"
          >
            <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="fixed bg-background border border-border rounded-md shadow-lg z-[9999] max-h-64 overflow-y-auto pointer-events-auto"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            zIndex: 9999
          }}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <div
                key={option.value}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // @ts-ignore
                  if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
                    // @ts-ignore
                    e.nativeEvent.stopImmediatePropagation();
                  }
                  handleOptionSelect(option);
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleOptionSelect(option);
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleOptionSelect(option);
                }}
                className="px-3 py-2 text-xs cursor-pointer hover:bg-muted flex items-center justify-between"
              >
                <span>{option.label}</span>
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              Nenhum produto encontrado
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default ProductSearchInput;