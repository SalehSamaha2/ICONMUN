import React from 'react';

interface NavigationProps {
  onOpenRegister: () => void;
  showBrandLogo: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  onOpenRegister,
  showBrandLogo,
}) => {
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        showBrandLogo
          ? 'bg-[#050505]/90 border-b border-[#D4AF6A]/20 backdrop-blur-md shadow-lg'
          : 'bg-transparent pointer-events-none'
      }`}
    >
      <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between gap-8 px-6 lg:px-12 pointer-events-auto">
        {/* Zone 1: Mask Motif + Brand Wordmark (Fades in ONLY after hero title scrolls away) */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="#"
            className={`flex items-center gap-2.5 transition-all duration-400 ${
              showBrandLogo
                ? 'opacity-100 translate-x-0 pointer-events-auto'
                : 'opacity-0 -translate-x-3 pointer-events-none'
            }`}
          >
            {/* Logo Mask Motif */}
            <div className="h-8 w-8 rounded-full overflow-hidden border border-[#D4AF6A]/60 shadow-[0_0_10px_rgba(212,175,106,0.3)] bg-black shrink-0">
              <img
                src="/assets/logo.png"
                alt="ICON MUN Emblem"
                className="h-full w-full object-cover scale-125"
                loading="lazy"
              />
            </div>
            <span className="font-cinzel text-lg sm:text-xl font-bold uppercase tracking-[0.22em] text-[#F3DFA2] whitespace-nowrap">
              ICON MUN
            </span>
          </a>
        </div>

        {/* Zone 2: 4–5 single-line navigation links */}
        <nav
          className={`hidden md:flex items-center gap-8 text-xs uppercase tracking-[0.2em] font-medium transition-all duration-300 ${
            showBrandLogo ? 'text-[#C4BAA8]' : 'text-[#C4BAA8]/75 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]'
          }`}
        >
          <a
            href="#about"
            className="hover:text-[#F3DFA2] transition-colors whitespace-nowrap shrink-0"
          >
            About
          </a>
          <a
            href="#committees"
            className="hover:text-[#F3DFA2] transition-colors whitespace-nowrap shrink-0"
          >
            Committees
          </a>
          <a
            href="#schedule"
            className="hover:text-[#F3DFA2] transition-colors whitespace-nowrap shrink-0"
          >
            Schedule
          </a>
          <a
            href="#secretariat"
            className="hover:text-[#F3DFA2] transition-colors whitespace-nowrap shrink-0"
          >
            Secretariat
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={onOpenRegister}
            className="gold-btn-primary px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] rounded-sm whitespace-nowrap shrink-0 cursor-pointer shadow-md"
          >
            Register Now
          </button>
        </div>
      </div>
    </header>
  );
};
