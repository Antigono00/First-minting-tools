// src/components/MachineControls.jsx - Modified to add Egg Minter
import { useContext, useState } from 'react';
import { GameContext } from '../context/GameContext';
import FomoHitMinter from './FomoHitMinter';
import MoveMachines from './MoveMachines'; 
import EggMinter from './EggMinter'; // Import the new component
import MyCreatures from './MyCreatures'; // Import MyCreatures component
import '../MyCreatures.css'; // Import MyCreatures CSS

function MachineControls() {
  const {
    canBuildMachine,
    canAfford,
    calculateMachineCost,
    buildMachine,
    upgradeMachine,
    machineTypes,
    machines,
    formatResource,
    player,
    isMobile,
    setSelectedMachineToMove
  } = useContext(GameContext);

  // State for accordion - CHANGED to start with all sections collapsed (null)
  const [activeSection, setActiveSection] = useState(null);

  // Group machines by type for the upgrade section
  const machinesByType = machines.reduce((acc, machine) => {
    if (!acc[machine.type]) {
      acc[machine.type] = [];
    }
    acc[machine.type].push(machine);
    return acc;
  }, {});

  // State for NFT minting
  const [showMinter, setShowMinter] = useState(false);
  const [selectedFomoHit, setSelectedFomoHit] = useState(null);
  
  // State for Egg minting
  const [showEggMinter, setShowEggMinter] = useState(false);
  
  // State for My Creatures
  const [showMyCreatures, setShowMyCreatures] = useState(false);

  // Toggle sections - only one section open at a time
  const toggleSection = (section) => {
    setActiveSection(prev => prev === section ? null : section);
  };

  // Handle build machine
  const handleBuild = (type) => {
    // Get player's center position to build near them
    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;
    
    // Offset slightly so the machine doesn't interfere with the player
    const buildX = playerCenterX + 20;
    const buildY = playerCenterY + 20;
    
    // Build the machine at the player's position
    buildMachine(type, buildX, buildY);
  };

  // Handle upgrade machine
  const handleUpgrade = (machineId) => {
    upgradeMachine(machineId);
  };

  // Handle FOMO HIT NFT minting
  const handleFomoHitClick = (machine) => {
    // If this is the first time activating (NFT needs to be minted)
    if (machine.lastActivated === 0) {
      setSelectedFomoHit(machine);
      setShowMinter(true);
    }
  };

  // Compact format for resource cost
  const formatCost = (cost) => {
    if (!cost) return "Free";
    
    return Object.entries(cost).map(([resource, amount]) => {
      const resourceIcon = resource === 'tcorvax' ? '💎' : 
                           resource === 'catNips' ? '🐱' : 
                           resource === 'energy' ? '⚡' : 
                           resource === 'eggs' ? '🥚' : '';
      return `${resourceIcon}${amount}`;
    }).join(' ');
  };

  return (
    <div className="machine-controls">
      {/* NFT Creatures Section - NEW */}
      <div className="accordion-section">
        <div 
          className="accordion-header" 
          onClick={() => toggleSection('nft')}
        >
          <h3>
            {activeSection === 'nft' ? '▼' : '▶'} NFT Creatures
          </h3>
        </div>
        
        {activeSection === 'nft' && (
          <div className="accordion-content">
            <div className="machine-button-container">
              <button
                onClick={() => setShowEggMinter(true)}
                className="machine-button machine-nft nft-button"
                style={{
                  background: "linear-gradient(135deg, #FF3D00 0%, #FF9E80 100%)",
                  border: "2px solid #FFD600",
                  position: 'relative'
                }}
              >
                <span className="machine-icon">🥚</span>
                <span className="machine-name">Mint an Egg</span>
                <span className="machine-cost">300 XRD or 150 Eggs</span>
              </button>
            </div>
            
            <div className="machine-button-container">
              <button
                onClick={() => setShowMyCreatures(true)}
                className="machine-button machine-nft nft-button"
                style={{
                  background: "linear-gradient(135deg, #4CAF50 0%, #81C784 100%)",
                  border: "2px solid #FFD600",
                  position: 'relative'
                }}
              >
                <span className="machine-icon">🧪</span>
                <span className="machine-name">My Creatures</span>
                <span className="machine-cost">View & Evolve</span>
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Build Machines Section */}
      <div className="accordion-section">
        <div 
          className="accordion-header" 
          onClick={() => toggleSection('build')}
        >
          <h3>
            {activeSection === 'build' ? '▼' : '▶'} Build Machines
          </h3>
        </div>
        
        {activeSection === 'build' && (
          <div className="accordion-content">
            {Object.keys(machineTypes).map((type) => {
              const cost = calculateMachineCost(type);
              const canBuild = canBuildMachine(type);
              const affordable = canAfford(cost);
              const machineInfo = machineTypes[type];
              
              // For reactor, check if it's the third one and add special requirements message
              const isThirdReactor = type === 'reactor' && (machines.filter(m => m.type === 'reactor').length === 2);
              
              return (
                <div key={type} className={`machine-button-container ${!canBuild || !affordable ? 'disabled' : ''}`}>
                  <button
                    id={`build-${type}`}
                    disabled={!canBuild || !affordable}
                    onClick={() => handleBuild(type)}
                    className={`machine-button machine-${type}`}
                    style={{
                      backgroundColor: machineInfo.baseColor,
                      opacity: (!canBuild || !affordable) ? 0.5 : 1,
                      position: 'relative'
                    }}
                  >
                    <span className="machine-icon">{machineInfo.icon}</span>
                    <span className="machine-name">{machineInfo.name}</span>
                    <span className="machine-cost">{formatCost(cost)}</span>
                  </button>
                  
                  {/* Special message for third reactor requirements */}
                  {isThirdReactor && !canBuild && (
                    <div className="requirement-text critical">
                      Requires Incubator & FOMO HIT
                    </div>
                  )}
                  
                  {/* Standard requirement messages */}
                  {!canBuild && !affordable && type === 'incubator' && (
                    <div className="requirement-text critical">
                      Requires max level machines
                    </div>
                  )}
                  {!canBuild && !affordable && type === 'fomoHit' && (
                    <div className="requirement-text critical">
                      Build all other machines first
                    </div>
                  )}
                  {!affordable && canBuild && (
                    <div className="requirement-text critical">Not enough resources</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Upgrade Machines Section */}
      <div className="accordion-section">
        <div 
          className="accordion-header" 
          onClick={() => toggleSection('upgrade')}
        >
          <h3>
            {activeSection === 'upgrade' ? '▼' : '▶'} Upgrade Machines
          </h3>
        </div>
        
        {activeSection === 'upgrade' && (
          <div className="accordion-content">
            {Object.entries(machinesByType).map(([type, machineList]) => {
              const machineInfo = machineTypes[type];
              if (!machineInfo) {
                return null;
              }
              
              return (
                <div key={type} className="machine-group">
                  <div className="machine-group-header">
                    <span className="machine-icon">{machineInfo.icon}</span>
                    <span className="machine-name">{machineInfo.name}</span>
                  </div>
                  
                  {machineList.map((machine) => {
                    // FOMO HIT doesn't have level upgrades, only NFT minting on first activation
                    if (type === 'fomoHit') {
                      return (
                        <div key={machine.id} className="machine-item">
                          <button
                            className="upgrade-button special-action"
                            onClick={() => handleFomoHitClick(machine)}
                            style={{ backgroundColor: machineInfo.baseColor }}
                          >
                            {machine.lastActivated === 0 ? 
                              '🔥 Mint NFT' : 
                              '✓ NFT Minted'}
                          </button>
                        </div>
                      );
                    }
                    
                    // Define maxLevel based on machine type
                    const maxLevel = type === 'amplifier' ? 5 : 
                                   type === 'incubator' ? 2 : 3;
                    const isMaxLevel = machine.level >= maxLevel;
                    
                    return (
                      <div key={machine.id} className="machine-item">
                        <div className="machine-level">
                          Level {machine.level}{isMaxLevel ? ' (MAX)' : ''}
                        </div>
                        
                        {!isMaxLevel && (
                          <button
                            id={`level-up-${type}-${machine.id}`}
                            onClick={() => handleUpgrade(machine.id)}
                            className="upgrade-button"
                            style={{ backgroundColor: machineInfo.baseColor }}
                          >
                            LVL {machine.level} → {machine.level + 1}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Move Machines Section */}
      <div className="accordion-section">
        <div 
          className="accordion-header" 
          onClick={() => toggleSection('move')}
        >
          <h3>
            {activeSection === 'move' ? '▼' : '▶'} Move Machines
          </h3>
        </div>
        
        {activeSection === 'move' && (
          <div className="accordion-content">
            <MoveMachines />
          </div>
        )}
      </div>
      
      {/* FOMO HIT Minter Dialog */}
      {showMinter && selectedFomoHit && (
        <FomoHitMinter 
          machineId={selectedFomoHit.id} 
          onClose={() => setShowMinter(false)} 
        />
      )}
      
      {/* Egg Minter Dialog */}
      {showEggMinter && (
        <EggMinter 
          onClose={() => setShowEggMinter(false)} 
        />
      )}
      
      {/* My Creatures Dialog */}
      {showMyCreatures && (
        <MyCreatures 
          onClose={() => setShowMyCreatures(false)} 
        />
      )}
    </div>
  );
}

export default MachineControls;
