import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientOption {
  value: string;
  label: string;
}

interface ClientSearchInputProps {
  value: string;
  onValueChange: (value: string) => void;
  options: ClientOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const ClientSearchInput = ({
  value,
  onValueChange,
  options,
  placeholder = "Buscar cliente...",
  className,
  disabled = false
}: ClientSearchInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Função para atualizar posição do dropdown
  const updateDropdownPosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  // Função para lidar com o foco no input
  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
      updateDropdownPosition();
    }
  };

  // Função para lidar com mudanças no input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    
    if (!isOpen) {
      setIsOpen(true);
      updateDropdownPosition();
    }
  };

  // Função para selecionar uma opção
  const handleOptionSelect = (event: React.MouseEvent | React.TouchEvent, option: ClientOption) => {
    event.preventDefault();
    event.stopPropagation();
    // Evita que handlers globais capturem o evento
    // @ts-ignore
    if (event.nativeEvent && typeof event.nativeEvent.stopImmediatePropagation === 'function') {
      // @ts-ignore
      event.nativeEvent.stopImmediatePropagation();
    }
    console.log('Selecting client option:', option.value, option.label);
    onValueChange(option.value);
    setSearchTerm(option.label);
    setIsOpen(false);
  };

  // Função para limpar o valor
  const handleClear = () => {
    onValueChange('');
    setSearchTerm('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Filtrar opções baseado no termo de busca (tolerante a acentos e variações como Matheus/Mateus)
  const stripDiacritics = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const normalize = (s: string) =>
    stripDiacritics(s)
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  const normTerm = normalize(searchTerm).replace(/th/g, 't');
  const filteredOptions = options.filter(option => {
    const normLabel = normalize(option.label);
    const normLabelAlt = normLabel.replace(/th/g, 't');
    return normLabel.includes(normTerm) || normLabelAlt.includes(normTerm);
  });

  // Atualizar searchTerm quando value muda externamente
  useEffect(() => {
    if (value) {
      const selectedOption = options.find(option => option.value === value);
      if (selectedOption) {
        setSearchTerm(selectedOption.label);
      }
    } else {
      setSearchTerm('');
    }
  }, [value, options]);

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleResize = () => {
      if (isOpen) {
        updateDropdownPosition();
      }
    };

    const handleScroll = () => {
      if (isOpen) {
        updateDropdownPosition();
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  return (
    <>
      <div className={cn("relative", className)}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              "pr-20" // Espaço para os botões
            )}
          />
          
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {value && !disabled && (
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
              onClick={() => !disabled && setIsOpen(!isOpen)}
              disabled={disabled}
              className="p-1 hover:bg-muted rounded-sm"
            >
              <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
            </button>
          </div>
        </div>
      </div>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="fixed bg-background border border-border rounded-md shadow-lg z-[10000] max-h-60 overflow-auto pointer-events-auto"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            minWidth: '200px'
          }}
        >
          {filteredOptions.length > 0 ? (
            <ul className="py-1">
              {filteredOptions.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    onMouseDown={(event) => handleOptionSelect(event, option)}
                    onClick={(event) => handleOptionSelect(event, option)}
                    onTouchStart={(event) => handleOptionSelect(event, option)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted focus:bg-muted focus:outline-none"
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
              <Search className="h-4 w-4" />
              Nenhum cliente encontrado
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
};