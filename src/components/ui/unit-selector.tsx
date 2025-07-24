import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown, Search } from 'lucide-react';

interface Unit {
  id: string;
  unit_code: string;
  unit_title: string;
}

interface UnitSelectorProps {
  units: Unit[];
  selectedUnit: string;
  onUnitSelect: (unitId: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

const UnitSelector: React.FC<UnitSelectorProps> = ({
  units,
  selectedUnit,
  onUnitSelect,
  label = "Select Unit",
  placeholder = "Search units...",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [filteredUnits, setFilteredUnits] = useState<Unit[]>(units);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedUnitData = units?.find(unit => unit.id === selectedUnit);

  // Filter units based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUnits(units || []);
    } else {
      const filtered = (units || []).filter(unit =>
        unit.unit_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        unit.unit_title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUnits(filtered);
    }
    setHighlightedIndex(-1);
  }, [searchTerm, units]);

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredUnits.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredUnits.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredUnits[highlightedIndex]) {
          handleUnitSelect(filteredUnits[highlightedIndex].id);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        break;
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedIndex]);

  // Handle unit selection
  const handleUnitSelect = (unitId: string) => {
    onUnitSelect(unitId);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div className="space-y-2" ref={dropdownRef}>
      <Label>{label}</Label>
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !selectedUnitData && "text-muted-foreground"
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="truncate">
            {selectedUnitData
              ? `${selectedUnitData.unit_code} - ${selectedUnitData.unit_title}`
              : "Select unit..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
            {/* Search Input */}
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder={placeholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Options List */}
            <ul
              ref={listRef}
              role="listbox"
              className="max-h-64 overflow-auto py-1"
              onKeyDown={handleKeyDown}
              tabIndex={-1}
            >
              {filteredUnits.length === 0 ? (
                <li className="px-3 py-2 text-sm text-gray-500 text-center">
                  No units found.
                </li>
              ) : (
                filteredUnits.map((unit, index) => (
                  <li
                    key={unit.id}
                    role="option"
                    aria-selected={selectedUnit === unit.id}
                    className={cn(
                      "relative cursor-pointer select-none px-3 py-2 text-sm",
                      "hover:bg-gray-100 focus:bg-gray-100",
                      highlightedIndex === index && "bg-gray-100",
                      selectedUnit === unit.id && "bg-primary-50"
                    )}
                    onClick={() => handleUnitSelect(unit.id)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <div className="flex items-center">
                      <Check
                        className={cn(
                          "mr-3 h-4 w-4",
                          selectedUnit === unit.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-medium text-gray-900 truncate">
                          {unit.unit_code}
                        </span>
                        <span className="text-xs text-gray-500 truncate">
                          {unit.unit_title}
                        </span>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnitSelector;