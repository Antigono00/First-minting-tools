import { useContext, useState } from 'react';
import { GameContext } from '../context/GameContext';
import ResourcePanel from './ResourcePanel';
import MachineControls from './MachineControls';

const SidePanel = ({ isOpen }) => {
  const [saveStatus, setSaveStatus] = useState('');
  const { isMobile } = useContext(GameContext);
  
  return (
    <div className={`side-panel ${isOpen || !isMobile ? 'open' : ''}`}>
      <ResourcePanel />
      
      <MachineControls onSave={() => {
        setSaveStatus('Saved!');
        setTimeout(() => setSaveStatus(''), 2000);
      }} />
      
      {/* Save status area */}
      <div 
        style={{ 
          marginTop: '10px', 
          minHeight: '20px',
          color: 'var(--primary-color)',
          textAlign: 'center'
        }}
      >
        {saveStatus}
      </div>
    </div>
  );
};

export default SidePanel;
