// src/components/WelcomeMessage.jsx
import { useContext } from 'react';
import { GameContext } from '../context/GameContext';

const WelcomeMessage = () => {
  const { setShowWelcomeMessage } = useContext(GameContext);
  
  return (
    <div className="welcome-message">
      <h1>Welcome to Corvax Lab!</h1>
      
      <div style={{ 
        padding: '15px', 
        marginBottom: '20px', 
        background: 'rgba(76, 175, 80, 0.1)', 
        borderRadius: '8px' 
      }}>
        <p style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
          Build your lab, produce resources, and create a thriving economy!
        </p>
        
        <ul style={{ margin: '0', paddingLeft: '20px' }}>
          <li>Start with a <strong style={{ color: '#4CAF50' }}>Cat's Lair</strong> to produce Cat Nips</li>
          <li>Build a <strong style={{ color: '#2196F3' }}>Reactor</strong> to convert Cat Nips into TCorvax and Energy</li>
          <li>Add an <strong style={{ color: '#9C27B0' }}>Amplifier</strong> to boost your production</li>
          <li>Unlock more advanced machines as you progress!</li>
        </ul>
      </div>
      
      <div style={{ 
        display: 'flex',
        gap: '15px',
        margin: '20px 0',
        textAlign: 'center'
      }}>
        <div style={{ 
          flex: '1',
          padding: '10px',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '8px'
        }}>
          <h3 style={{ margin: '0 0 5px 0', color: '#4CAF50' }}>Desktop Controls</h3>
          <p style={{ margin: '0' }}>
            <span className="key">↑</span>
            <span className="key">↓</span>
            <span className="key">←</span>
            <span className="key">→</span> 
            to move
          </p>
          <p style={{ margin: '5px 0 0 0' }}>
            <span className="key">Space</span> to activate
          </p>
        </div>
        
        <div style={{ 
          flex: '1',
          padding: '10px',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '8px'
        }}>
          <h3 style={{ margin: '0 0 5px 0', color: '#4CAF50' }}>Mobile Controls</h3>
          <p style={{ margin: '0' }}>
            <strong>Tap</strong> to move
          </p>
          <p style={{ margin: '5px 0 0 0' }}>
            <strong>Tap Machine</strong> to activate
          </p>
        </div>
      </div>
      
      <div style={{ 
        padding: '10px', 
        background: 'rgba(0, 0, 0, 0.2)', 
        borderRadius: '8px',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <p style={{ margin: '0' }}>
          Click the <strong style={{ color: '#7e57c2' }}>?</strong> help button anytime for detailed instructions.
        </p>
      </div>
      
      <button onClick={() => setShowWelcomeMessage(false)}>
        Start Playing
      </button>
    </div>
  );
};

export default WelcomeMessage;
