import { useContext } from 'react';
import { GameContext } from '../context/GameContext';

const MobileMenu = ({ isOpen, setIsOpen }) => {
  const { tcorvax, catNips, energy, eggs, formatResource, isMobile } = useContext(GameContext);

  // Don't show the mobile menu button on desktop
  if (!isMobile) {
    return null;
  }

  return (
    <>
      {/* Mobile burger menu button */}
      <button 
        className="mobile-menu-btn" 
        onClick={() => setIsOpen(!isOpen)}
      >
        ≡ Menu
      </button>
      
      {/* Mobile mini-HUD */}
      <div className="mobile-hud">
        <div className="mobile-resource">
          💎 <span id="mobile-tcorvax">{formatResource(tcorvax)}</span>
        </div>
        <div className="mobile-resource">
          🐱 <span id="mobile-catnips">{formatResource(catNips)}</span>
        </div>
        <div className="mobile-resource">
          ⚡ <span id="mobile-energy">{formatResource(energy)}</span>
        </div>
        <div className="mobile-resource">
          🥚 <span id="mobile-eggs">{formatResource(eggs)}</span>
        </div>
      </div>
    </>
  );
};

export default MobileMenu;
