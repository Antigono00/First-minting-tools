import { useContext } from 'react';
import { GameContext } from '../context/GameContext';

const LowCorvaxMessage = () => {
  const { showLowCorvaxMessage } = useContext(GameContext);
  
  return (
    <div className="low-corvax-message" style={{ display: showLowCorvaxMessage ? 'block' : 'none' }}>
      <p>You don't have enough TCorvax to build anything. You need at least 10 TCorvax for a <strong>Cat's Lair</strong> and 10 more (plus Cat Nips) for a <strong>Reactor</strong>.</p>
      <p>Please visit 
        <a href="https://t.me/CorvaxXRD" target="_blank" rel="noopener noreferrer">t.me/CorvaxXRD</a> 
        to earn some TCorvax before you can start playing!
      </p>
    </div>
  );
};

export default LowCorvaxMessage;
