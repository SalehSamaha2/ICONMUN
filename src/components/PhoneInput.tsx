import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check, Globe2 } from 'lucide-react';

export interface CountryInfo {
  name: string;
  code: string;
  flag: string;
  format?: string;
}

export const COUNTRIES: CountryInfo[] = [
  { name: 'Saudi Arabia', code: '+966', flag: '🇸🇦', format: '5X XXX XXXX' },
  { name: 'United Arab Emirates', code: '+971', flag: '🇦🇪', format: '5X XXX XXXX' },
  { name: 'Kuwait', code: '+965', flag: '🇰🇼', format: 'XXXX XXXX' },
  { name: 'Qatar', code: '+974', flag: '🇶🇦', format: 'XXXX XXXX' },
  { name: 'Bahrain', code: '+973', flag: '🇧🇭', format: 'XXXX XXXX' },
  { name: 'Oman', code: '+968', flag: '🇴🇲', format: 'XXXX XXXX' },
  { name: 'Jordan', code: '+962', flag: '🇯🇴', format: '7 XXXX XXXX' },
  { name: 'Egypt', code: '+20', flag: '🇪🇬', format: '1X XXXX XXXX' },
  { name: 'Lebanon', code: '+961', flag: '🇱🇧', format: 'XX XXX XXX' },
  { name: 'Iraq', code: '+964', flag: '🇮🇶', format: '7XX XXX XXXX' },
  { name: 'Palestine', code: '+970', flag: '🇵🇸', format: '59X XXX XXX' },
  { name: 'Syria', code: '+963', flag: '🇸🇾', format: '9X XXX XXXX' },
  { name: 'Yemen', code: '+967', flag: '🇾🇪', format: '7XX XXX XXX' },
  { name: 'Sudan', code: '+249', flag: '🇸🇩', format: '9X XXX XXXX' },
  { name: 'Morocco', code: '+212', flag: '🇲🇦', format: '6XX XXX XXX' },
  { name: 'Algeria', code: '+213', flag: '🇩🇿', format: '5XX XX XX XX' },
  { name: 'Tunisia', code: '+216', flag: '🇹🇳', format: 'XX XXX XXX' },
  { name: 'Libya', code: '+218', flag: '🇱🇾', format: '9X XXX XXXX' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧', format: '7XXX XXXXXX' },
  { name: 'United States', code: '+1', flag: '🇺🇸', format: '(XXX) XXX-XXXX' },
  { name: 'Canada', code: '+1', flag: '🇨🇦', format: '(XXX) XXX-XXXX' },
  { name: 'Turkey', code: '+90', flag: '🇹🇷', format: '5XX XXX XX XX' },
  { name: 'Pakistan', code: '+92', flag: '🇵🇰', format: '3XX XXXXXXX' },
  { name: 'India', code: '+91', flag: '🇮🇳', format: 'XXXXX XXXXX' },
  { name: 'Bangladesh', code: '+880', flag: '🇧🇩', format: '1XXX XXXXXX' },
  { name: 'Malaysia', code: '+60', flag: '🇲🇾', format: '1X XXX XXXX' },
  { name: 'Indonesia', code: '+62', flag: '🇮🇩', format: '8XX XXXX XXXX' },
  { name: 'Singapore', code: '+65', flag: '🇸🇬', format: 'XXXX XXXX' },
  { name: 'Philippines', code: '+63', flag: '🇵🇭', format: '9XX XXX XXXX' },
  { name: 'Germany', code: '+49', flag: '🇩🇪', format: '1XX XXXXXXXX' },
  { name: 'France', code: '+33', flag: '🇫🇷', format: '6 XX XX XX XX' },
  { name: 'Italy', code: '+39', flag: '🇮🇹', format: '3XX XXXXXXX' },
  { name: 'Spain', code: '+34', flag: '🇪🇸', format: '6XX XX XX XX' },
  { name: 'Netherlands', code: '+31', flag: '🇳🇱', format: '6 XXXXXXXX' },
  { name: 'Switzerland', code: '+41', flag: '🇨🇭', format: '7X XXX XX XX' },
  { name: 'Sweden', code: '+46', flag: '🇸🇪', format: '7X XXX XX XX' },
  { name: 'Norway', code: '+47', flag: '🇳🇴', format: '4XX XX XXX' },
  { name: 'Denmark', code: '+45', flag: '🇩🇰', format: 'XX XX XX XX' },
  { name: 'Belgium', code: '+32', flag: '🇧🇪', format: '4XX XX XX XX' },
  { name: 'Austria', code: '+43', flag: '🇦🇹', format: '6XX XXXXXXX' },
  { name: 'Ireland', code: '+353', flag: '🇮🇪', format: '8X XXX XXXX' },
  { name: 'Poland', code: '+48', flag: '🇵🇱', format: 'XXX XXX XXX' },
  { name: 'Portugal', code: '+351', flag: '🇵🇹', format: '9XX XXX XXX' },
  { name: 'Greece', code: '+30', flag: '🇬🇷', format: '69X XXX XXXX' },
  { name: 'Australia', code: '+61', flag: '🇦🇺', format: '4XX XXX XXX' },
  { name: 'New Zealand', code: '+64', flag: '🇳🇿', format: '2X XXX XXXX' },
  { name: 'South Africa', code: '+27', flag: '🇿🇦', format: '7X XXX XXXX' },
  { name: 'Nigeria', code: '+234', flag: '🇳🇬', format: '8XX XXX XXXX' },
  { name: 'Kenya', code: '+254', flag: '🇰🇪', format: '7XX XXXXXX' },
  { name: 'Ghana', code: '+233', flag: '🇬🇭', format: '2X XXX XXXX' },
  { name: 'Ethiopia', code: '+251', flag: '🇪🇹', format: '9XX XXX XXX' },
  { name: 'Japan', code: '+81', flag: '🇯🇵', format: '90 XXXX XXXX' },
  { name: 'South Korea', code: '+82', flag: '🇰🇷', format: '10 XXXX XXXX' },
  { name: 'China', code: '+86', flag: '🇨🇳', format: '1XX XXXX XXXX' },
  { name: 'Brazil', code: '+55', flag: '🇧🇷', format: '11 9XXXX XXXX' },
  { name: 'Mexico', code: '+52', flag: '🇲🇽', format: '1 55 XXXX XXXX' },
  { name: 'Sri Lanka', code: '+94', flag: '🇱🇰', format: '7X XXX XXXX' },
  { name: 'Nepal', code: '+977', flag: '🇳🇵', format: '98X XXXXXXX' },
  { name: 'Afghanistan', code: '+93', flag: '🇦🇫', format: '7X XXX XXXX' },
];

export interface PhoneInputProps {
  id?: string;
  countryCode: string;
  phoneNumber: string;
  onCountryCodeChange: (code: string) => void;
  onPhoneNumberChange: (phone: string) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  className?: string;
  helperText?: string;
  error?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  id = 'phone-input',
  countryCode,
  phoneNumber,
  onCountryCodeChange,
  onPhoneNumberChange,
  label,
  required = false,
  placeholder,
  autoComplete = 'tel-national',
  disabled = false,
  className = '',
  helperText,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Active country matching countryCode, default to Saudi Arabia
  const activeCountry = useMemo(() => {
    return COUNTRIES.find((c) => c.code === countryCode) || COUNTRIES[0];
  }, [countryCode]);

  // Filtered countries based on search
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return COUNTRIES;
    const q = searchQuery.toLowerCase().trim();
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.includes(q) ||
        c.code.replace('+', '').includes(q)
    );
  }, [searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      // Auto-focus search input
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const handleSelectCountry = (country: CountryInfo) => {
    onCountryCodeChange(country.code);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Keep numbers, spaces, parentheses, dashes
    const val = e.target.value.replace(/[^\d\s()-]/g, '');
    onPhoneNumberChange(val);
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label htmlFor={id} className="text-[10px] uppercase tracking-[0.16em] text-[#D8C5C5] block mb-2 font-semibold">
          {label} {required && <span className="text-[#E8CBA4]">*</span>}
        </label>
      )}

      <div
        ref={dropdownRef}
        className={`group relative flex items-center rounded-xl border bg-[#100609] transition-all duration-200 focus-within:ring-4 focus-within:ring-[#E8CBA4]/[0.1] ${
          error
            ? 'border-red-500/60 focus-within:border-red-400'
            : 'border-[#E8CBA4]/20 hover:border-[#E8CBA4]/40 focus-within:border-[#E8CBA4]/70'
        }`}
      >
        {/* Country Selector Trigger */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={`Selected country ${activeCountry.name} ${activeCountry.code}. Click to change country`}
          className="flex items-center gap-2 px-3.5 py-3 border-r border-[#E8CBA4]/15 bg-[#170910]/70 hover:bg-[#200B16] rounded-l-xl text-sm font-medium text-[#FFF5E8] transition-colors cursor-pointer select-none shrink-0"
        >
          <span className="text-lg leading-none" role="img" aria-label={activeCountry.name}>
            {activeCountry.flag}
          </span>
          <span className="font-mono text-xs text-[#E8CBA4] font-semibold">
            {activeCountry.code}
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 text-[#8D737A] transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#E8CBA4]' : 'group-hover:text-[#D8C5C5]'
            }`}
          />
        </button>

        {/* National Number Input */}
        <input
          id={id}
          type="tel"
          required={required}
          disabled={disabled}
          value={phoneNumber}
          onChange={handlePhoneChange}
          placeholder={placeholder || activeCountry.format || '5X XXX XXXX'}
          autoComplete={autoComplete}
          className="w-full bg-transparent px-3.5 py-3 text-sm text-[#FFF5E8] placeholder-[#8D737A] focus:outline-none min-h-[46px]"
        />

        {/* Dropdown Menu with Search */}
        {isOpen && (
          <div
            role="listbox"
            className="absolute left-0 top-full z-[100] mt-1.5 w-72 sm:w-80 max-h-80 rounded-xl border border-[#E8CBA4]/30 bg-[#16080E] shadow-[0_12px_40px_rgba(0,0,0,0.85)] backdrop-blur-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Search Input Bar */}
            <div className="p-2.5 border-b border-[#E8CBA4]/15 bg-[#1C0A12]/90 sticky top-0 z-10">
              <div className="relative flex items-center">
                <Search className="absolute left-3 h-3.5 w-3.5 text-[#8D737A]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search country or code..."
                  className="w-full rounded-lg border border-[#E8CBA4]/15 bg-[#100609] pl-9 pr-3 py-1.5 text-xs text-[#FFF5E8] placeholder-[#8D737A] focus:border-[#E8CBA4]/60 focus:outline-none focus:ring-2 focus:ring-[#E8CBA4]/10"
                />
              </div>
            </div>

            {/* Scrollable List */}
            <div className="overflow-y-auto p-1.5 space-y-0.5 overscroll-contain max-h-60">
              {filteredCountries.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#8D737A] flex flex-col items-center gap-1.5">
                  <Globe2 className="h-4 w-4 text-[#8D737A]/50" />
                  <span>No matching country found</span>
                </div>
              ) : (
                filteredCountries.map((c, i) => {
                  const isSelected = c.code === countryCode && c.name === activeCountry.name;
                  return (
                    <button
                      key={`${c.name}-${c.code}-${i}`}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelectCountry(c)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#E8CBA4]/15 text-[#FFF5E8] font-medium border border-[#E8CBA4]/30'
                          : 'text-[#D8C5C5] hover:bg-white/[0.05] hover:text-[#FFF5E8]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <span className="text-base leading-none shrink-0" role="img" aria-label={c.name}>
                          {c.flag}
                        </span>
                        <span className="truncate">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-[11px] text-[#E8CBA4]/90 font-medium">{c.code}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-[#E8CBA4]" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {helperText && !error && (
        <p className="mt-1 text-[11px] text-[#8D737A]">{helperText}</p>
      )}
      {error && (
        <p role="alert" className="mt-1 text-[11px] text-red-300 font-medium">
          {error}
        </p>
      )}
    </div>
  );
};
