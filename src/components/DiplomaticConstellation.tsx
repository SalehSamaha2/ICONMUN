import React, { useState } from 'react';
import { ArrowUpRight, Compass, Orbit, Shield, Landmark, Users, Sparkles } from 'lucide-react';

const nodes = [
  { id: 'mandate', label: 'THE MANDATE', eyebrow: '01 / PURPOSE', title: 'Ideas become influence.', copy: 'Enter a space built for conviction, negotiation, and decisions that reach beyond the chamber.', icon: Compass, x: 50, y: 15 },
  { id: 'councils', label: 'THE COUNCILS', eyebrow: '02 / DEBATE', title: 'Every voice shifts the room.', copy: 'Step into a council, represent a position, and turn competing perspectives into a shared direction.', icon: Landmark, x: 82, y: 45 },
  { id: 'people', label: 'THE PEOPLE', eyebrow: '03 / COMMUNITY', title: 'Diplomacy is built together.', copy: 'Meet delegates, chairs, and a secretariat united by curiosity and the courage to speak.', icon: Users, x: 67, y: 82 },
  { id: 'principles', label: 'THE PRINCIPLES', eyebrow: '04 / LEGACY', title: 'Leave more than a resolution.', copy: 'Practice leadership, sharpen your perspective, and take the experience with you long after the final session.', icon: Shield, x: 18, y: 68 },
  { id: 'future', label: 'THE FUTURE', eyebrow: '05 / POSSIBILITY', title: 'The next move is yours.', copy: 'Your first speech, your next alliance, your defining moment. It starts with showing up.', icon: Sparkles, x: 17, y: 37 },
];

export const DiplomaticConstellation: React.FC = () => {
  const [active, setActive] = useState(nodes[0]);
  return (
    <section id="constellation" className="constellation-section relative overflow-hidden px-4 py-24 sm:px-6 md:py-32 lg:px-12">
      <div className="constellation-inner relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
        <div className="relative z-10">
          <div className="mb-5 flex items-center gap-3 text-[10px] uppercase tracking-[.34em] text-gold"><span className="h-px w-9 bg-gold/70" /> An interactive field guide <span className="text-golddeep">/ 2027</span></div>
          <h2 className="font-cinzel text-[clamp(2.3rem,5.7vw,5.4rem)] font-semibold uppercase leading-[.98] tracking-[-.035em] text-[#f3ead6]">Diplomacy is<br/><span className="constellation-outline">a constellation.</span></h2>
          <p className="mt-7 max-w-lg text-base leading-8 text-ink2">A conference is more than a room. Explore the forces that bring ICON MUN to life. Select a point in the constellation and discover what it represents.</p>
          <div className="mt-10 border-l border-gold/45 pl-5" aria-live="polite">
            <div className="text-[10px] uppercase tracking-[.28em] text-gold">{active.eyebrow}</div>
            <h3 className="mt-3 font-cinzel text-2xl sm:text-3xl text-[#f3ead6]">{active.title}</h3>
            <p className="mt-3 max-w-md text-sm leading-7 text-ink3">{active.copy}</p>
            <div className="mt-5 inline-flex items-center gap-2 text-[10px] uppercase tracking-[.24em] text-gold/80"><span className="h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_12px_rgba(216,189,131,.9)]" /> {active.label}</div>
          </div>
        </div>
        <div className="constellation-map relative mx-auto aspect-square w-full max-w-[620px]" aria-label="Interactive ICON MUN constellation">
          <div className="constellation-orbit orbit-one" /><div className="constellation-orbit orbit-two" /><div className="constellation-orbit orbit-three" />
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden="true">
            <defs><linearGradient id="constellationLine"><stop stopColor="#d8bd83" stopOpacity=".08"/><stop offset=".5" stopColor="#e8d7ad" stopOpacity=".7"/><stop offset="1" stopColor="#d8bd83" stopOpacity=".08"/></linearGradient></defs>
            {nodes.map((n, i) => { const next = nodes[(i + 1) % nodes.length]; return <line key={n.id} x1={n.x} y1={n.y} x2={next.x} y2={next.y} stroke="url(#constellationLine)" strokeWidth=".22" strokeDasharray="1.2 1.2" />; })}
            <line x1="50" y1="15" x2="67" y2="82" stroke="url(#constellationLine)" strokeWidth=".18" />
            <line x1="82" y1="45" x2="18" y2="68" stroke="url(#constellationLine)" strokeWidth=".18" />
          </svg>
          <div className="constellation-core"><img src="https://d2ol7oe51mr4n9.cloudfront.net/user_3L3BcEGyaQpmkmEhNe5xVxLe3my/9798219d-d695-44ba-ac50-1a0b70e05a70.jpg" alt="ICON MUN masquerade emblem" /><span>ICON<br/>MUN</span></div>
          {nodes.map((node) => { const Icon = node.icon; const selected = active.id === node.id; return <button key={node.id} type="button" aria-pressed={selected} onClick={() => setActive(node)} className={`constellation-node ${selected ? 'is-active' : ''}`} style={{ left: node.x + '%', top: node.y + '%' }}><span className="constellation-node-icon"><Icon size={17} strokeWidth={1.5}/></span><span className="constellation-node-label">{node.label}</span></button>; })}
          <div className="constellation-coordinate coordinate-a">24° 42' N<br/>46° 40' E</div><div className="constellation-coordinate coordinate-b">A NEW KIND<br/>OF DIALOGUE</div>
        </div>
      </div>
    </section>
  );
};
