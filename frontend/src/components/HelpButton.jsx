// src/components/HelpButton.jsx - With mobile-optimized tabs
import { useState, useEffect } from 'react';

const HelpButton = () => {
  const [showHelp, setShowHelp] = useState(false);
  const [activeTab, setActiveTab] = useState('basics');
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Initial check
    checkMobile();
    
    // Listen for resize events
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Toggle help modal visibility
  const toggleHelp = () => {
    setShowHelp(!showHelp);
  };
  
  // Change active tab
  const switchTab = (tab) => {
    setActiveTab(tab);
  };
  
  return (
    <>
      {/* Help button */}
      <button 
        className="help-button" 
        onClick={toggleHelp}
        aria-label="Help"
      >
        ?
      </button>
      
      {/* Help modal - Styled like Welcome Message */}
      {showHelp && (
        <div className="welcome-message" style={{ 
          maxWidth: isMobile ? '90%' : '800px',
          padding: isMobile ? '20px 15px' : '40px'
        }}>
          <button 
            className="close-button" 
            onClick={toggleHelp}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: '15px',
              right: '15px',
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              width: 'auto',
              padding: '5px',
              margin: '0'
            }}
          >
            ×
          </button>
          
          <h2 style={{ marginBottom: isMobile ? '15px' : '20px' }}>Game Guide</h2>
          
          {/* Responsive Tab Navigation - VERTICAL on mobile, HORIZONTAL on desktop */}
          <div style={isMobile ? {
            // MOBILE: Vertical tabs on left side
            display: 'flex',
            flexDirection: 'row',
            height: '60vh',
            marginBottom: '10px'
          } : {
            // DESKTOP: Horizontal tabs on top
            display: 'flex',
            gap: '5px',
            marginBottom: '20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            paddingBottom: '10px',
            overflowX: 'auto'
          }}>
            {/* For Mobile: Left vertical tab bar */}
            {isMobile && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
                marginRight: '10px',
                borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                paddingRight: '10px',
                width: '80px',
                overflowY: 'auto'
              }}>
                <button 
                  onClick={() => switchTab('basics')}
                  style={{
                    padding: '10px 5px',
                    background: activeTab === 'basics' ? 'var(--primary-color)' : 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    border: 'none',
                    color: activeTab === 'basics' ? 'white' : 'var(--text-light)',
                    fontFamily: '"Orbitron", sans-serif',
                    fontSize: '12px',
                    transition: 'all 0.3s',
                    width: '100%',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    wordBreak: 'break-word',
                    minHeight: '50px'
                  }}
                >
                  Basics
                </button>
                
                <button 
                  onClick={() => switchTab('machines')}
                  style={{
                    padding: '10px 5px',
                    background: activeTab === 'machines' ? 'var(--primary-color)' : 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    border: 'none',
                    color: activeTab === 'machines' ? 'white' : 'var(--text-light)',
                    fontFamily: '"Orbitron", sans-serif',
                    fontSize: '12px',
                    transition: 'all 0.3s',
                    width: '100%',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    wordBreak: 'break-word',
                    minHeight: '50px'
                  }}
                >
                  Machines
                </button>
                
                <button 
                  onClick={() => switchTab('resources')}
                  style={{
                    padding: '10px 5px',
                    background: activeTab === 'resources' ? 'var(--primary-color)' : 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    border: 'none',
                    color: activeTab === 'resources' ? 'white' : 'var(--text-light)',
                    fontFamily: '"Orbitron", sans-serif',
                    fontSize: '12px',
                    transition: 'all 0.3s',
                    width: '100%',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    wordBreak: 'break-word',
                    minHeight: '50px'
                  }}
                >
                  Resources
                </button>
                
                <button 
                  onClick={() => switchTab('rooms')}
                  style={{
                    padding: '10px 5px',
                    background: activeTab === 'rooms' ? 'var(--primary-color)' : 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    border: 'none',
                    color: activeTab === 'rooms' ? 'white' : 'var(--text-light)',
                    fontFamily: '"Orbitron", sans-serif',
                    fontSize: '12px',
                    transition: 'all 0.3s',
                    width: '100%',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    wordBreak: 'break-word',
                    minHeight: '50px'
                  }}
                >
                  Rooms
                </button>
                
                <button 
                  onClick={() => switchTab('controls')}
                  style={{
                    padding: '10px 5px',
                    background: activeTab === 'controls' ? 'var(--primary-color)' : 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    border: 'none',
                    color: activeTab === 'controls' ? 'white' : 'var(--text-light)',
                    fontFamily: '"Orbitron", sans-serif',
                    fontSize: '12px',
                    transition: 'all 0.3s',
                    width: '100%',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    wordBreak: 'break-word',
                    minHeight: '50px'
                  }}
                >
                  Controls
                </button>
              </div>
            )}
            
            {/* For Desktop: Horizontal tab buttons */}
            {!isMobile && (
              <>
                <button 
                  onClick={() => switchTab('basics')}
                  style={{
                    padding: '8px 15px',
                    background: activeTab === 'basics' ? 'var(--primary-color)' : 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '8px 8px 0 0',
                    cursor: 'pointer',
                    border: 'none',
                    color: activeTab === 'basics' ? 'white' : 'var(--text-light)',
                    fontFamily: '"Orbitron", sans-serif',
                    fontSize: '14px',
                    transition: 'all 0.3s',
                    width: 'auto',
                    margin: '0 2px'
                  }}
                >
                  Basics
                </button>
                <button 
                  onClick={() => switchTab('machines')}
                  style={{
                    padding: '8px 15px',
                    background: activeTab === 'machines' ? 'var(--primary-color)' : 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '8px 8px 0 0',
                    cursor: 'pointer',
                    border: 'none',
                    color: activeTab === 'machines' ? 'white' : 'var(--text-light)',
                    fontFamily: '"Orbitron", sans-serif',
                    fontSize: '14px',
                    transition: 'all 0.3s',
                    width: 'auto',
                    margin: '0 2px'
                  }}
                >
                  Machines
                </button>
                <button 
                  onClick={() => switchTab('resources')}
                  style={{
                    padding: '8px 15px',
                    background: activeTab === 'resources' ? 'var(--primary-color)' : 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '8px 8px 0 0',
                    cursor: 'pointer',
                    border: 'none',
                    color: activeTab === 'resources' ? 'white' : 'var(--text-light)',
                    fontFamily: '"Orbitron", sans-serif',
                    fontSize: '14px',
                    transition: 'all 0.3s',
                    width: 'auto',
                    margin: '0 2px'
                  }}
                >
                  Resources
                </button>
                <button 
                  onClick={() => switchTab('rooms')}
                  style={{
                    padding: '8px 15px',
                    background: activeTab === 'rooms' ? 'var(--primary-color)' : 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '8px 8px 0 0',
                    cursor: 'pointer',
                    border: 'none',
                    color: activeTab === 'rooms' ? 'white' : 'var(--text-light)',
                    fontFamily: '"Orbitron", sans-serif',
                    fontSize: '14px',
                    transition: 'all 0.3s',
                    width: 'auto',
                    margin: '0 2px'
                  }}
                >
                  Rooms
                </button>
                <button 
                  onClick={() => switchTab('controls')}
                  style={{
                    padding: '8px 15px',
                    background: activeTab === 'controls' ? 'var(--primary-color)' : 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '8px 8px 0 0',
                    cursor: 'pointer',
                    border: 'none',
                    color: activeTab === 'controls' ? 'white' : 'var(--text-light)',
                    fontFamily: '"Orbitron", sans-serif',
                    fontSize: '14px',
                    transition: 'all 0.3s',
                    width: 'auto',
                    margin: '0 2px'
                  }}
                >
                  Controls
                </button>
              </>
            )}
          
            {/* Mobile tab content - positioned to the right of the tab column */}
            {isMobile && (
              <div style={{ 
                flex: 1,
                padding: '10px', 
                background: 'rgba(0, 0, 0, 0.2)', 
                borderRadius: '8px',
                overflowY: 'auto',
                fontSize: '13px'
              }}>
                {/* Basics Tab */}
                {activeTab === 'basics' && (
                  <div>
                    <h3 style={{ fontSize: '16px' }}>Getting Started</h3>
                    <p>Corvax Lab is a resource management game where you build and upgrade machines to earn TCorvax - the main currency of the game.</p>
                    
                    <div style={{ 
                      background: 'rgba(76, 175, 80, 0.1)', 
                      padding: '10px', 
                      borderRadius: '8px',
                      margin: '10px 0'
                    }}>
                      <h4 style={{ margin: '0 0 8px 0', color: '#4CAF50', fontSize: '14px' }}>Game Progression</h4>
                      <ol style={{ paddingLeft: '20px', margin: '0' }}>
                        <li style={{ marginBottom: '5px' }}>Build a <strong style={{ color: '#4CAF50' }}>Cat's Lair</strong> to produce Cat Nips</li>
                        <li style={{ marginBottom: '5px' }}>Build a <strong style={{ color: '#2196F3' }}>Reactor</strong> to convert Cat Nips into TCorvax and Energy</li>
                        <li style={{ marginBottom: '5px' }}>Build an <strong style={{ color: '#9C27B0' }}>Amplifier</strong> to boost Reactor production</li>
                        <li style={{ marginBottom: '5px' }}>Upgrade your machines to maximum level</li>
                        <li style={{ marginBottom: '5px' }}>Build the <strong style={{ color: '#FF5722' }}>Incubator</strong> to earn TCorvax from your sCVX holdings</li>
                        <li style={{ marginBottom: '5px' }}>Build <strong style={{ color: '#FF3D00' }}>The FOMO HIT</strong> to mint an exclusive NFT and earn more TCorvax</li>
                        <li style={{ marginBottom: '5px' }}>Unlock and expand to Room 2 for better organization</li>
                        <li>Build a third Reactor (unlocked after building Incubator and FOMO HIT)</li>
                      </ol>
                    </div>
                    
                    <h3 style={{ fontSize: '16px' }}>Resources Overview</h3>
                    <ul style={{ paddingLeft: '20px' }}>
                      <li><strong style={{ color: '#4CAF50' }}>TCorvax (💎)</strong> - The main currency for building and upgrading</li>
                      <li><strong style={{ color: '#FFA726' }}>Cat Nips (🐱)</strong> - Used to fuel Reactors</li>
                      <li><strong style={{ color: '#FFD700' }}>Energy (⚡)</strong> - Powers your Amplifier</li>
                      <li><strong style={{ color: '#FFD700' }}>Eggs (🥚)</strong> - Special resource from the Incubator</li>
                    </ul>
                    
                    <h3 style={{ fontSize: '16px' }}>Tips For New Players</h3>
                    <ul style={{ paddingLeft: '20px' }}>
                      <li>Build Cat's Lair first, then a Reactor to start earning TCorvax</li>
                      <li>Upgrade your machines to increase production efficiency</li>
                      <li>Make sure your Amplifier has enough Energy to stay online</li>
                      <li>When you have enough resources, build the Incubator to earn TCorvax from your sCVX</li>
                      <li>You can move machines between rooms (costs 50 TCorvax)</li>
                      <li>Machines have cooldowns between activations (shown by a progress bar)</li>
                    </ul>
                  </div>
                )}
                
                {/* Machines Tab */}
                {activeTab === 'machines' && (
                  // Machine content...similar structure but with smaller font and padding
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      margin: '0 0 10px 0',
                      padding: '8px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: '8px'
                    }}>
                      <div style={{
                        fontSize: '20px',
                        marginRight: '10px',
                        padding: '8px',
                        borderRadius: '50%',
                        backgroundColor: "#4CAF50",
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>🐱</div>
                      <div style={{ flexGrow: 1 }}>
                        <h3 style={{ margin: '0 0 3px 0', fontSize: '14px' }}>Cat's Lair</h3>
                        <p style={{ margin: '0', color: 'var(--text-dim)', fontSize: '12px' }}>Produces Cat Nips. Each activation gives 5 + (Level - 1) Cat Nips.</p>
                        <p style={{ margin: '3px 0 0 0', color: 'var(--text-dim)', fontSize: '12px' }}>
                          <strong>Max Level:</strong> 3
                        </p>
                      </div>
                    </div>
                    
                    {/* More machines with the same condensed format... */}

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      margin: '0 0 10px 0',
                      padding: '8px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: '8px'
                    }}>
                      <div style={{
                        fontSize: '20px',
                        marginRight: '10px',
                        padding: '8px',
                        borderRadius: '50%',
                        backgroundColor: "#2196F3",
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>⚛️</div>
                      <div style={{ flexGrow: 1 }}>
                        <h3 style={{ margin: '0 0 3px 0', fontSize: '14px' }}>Reactor</h3>
                        <p style={{ margin: '0', color: 'var(--text-dim)', fontSize: '12px' }}>Consumes 3 Cat Nips to produce TCorvax and Energy.</p>
                        <p style={{ margin: '3px 0 0 0', color: 'var(--text-dim)', fontSize: '12px' }}>
                          <strong>Max Level:</strong> 3
                        </p>
                      </div>
                    </div>
                    
                    {/* More machines following the same pattern */}
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      margin: '0 0 10px 0',
                      padding: '8px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: '8px'
                    }}>
                      <div style={{
                        fontSize: '20px',
                        marginRight: '10px',
                        padding: '8px',
                        borderRadius: '50%',
                        backgroundColor: "#9C27B0",
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>🔊</div>
                      <div style={{ flexGrow: 1 }}>
                        <h3 style={{ margin: '0 0 3px 0', fontSize: '14px' }}>Amplifier</h3>
                        <p style={{ margin: '0', color: 'var(--text-dim)', fontSize: '12px' }}>Boosts Reactor TCorvax production by 0.5 per level.</p>
                        <p style={{ margin: '3px 0 0 0', color: 'var(--text-dim)', fontSize: '12px' }}>
                          <strong>Max Level:</strong> 5
                        </p>
                      </div>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      margin: '0 0 10px 0',
                      padding: '8px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: '8px'
                    }}>
                      <div style={{
                        fontSize: '20px',
                        marginRight: '10px',
                        padding: '8px',
                        borderRadius: '50%',
                        backgroundColor: "#FF5722",
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>🥚</div>
                      <div style={{ flexGrow: 1 }}>
                        <h3 style={{ margin: '0 0 3px 0', fontSize: '14px' }}>Incubator</h3>
                        <p style={{ margin: '0', color: 'var(--text-dim)', fontSize: '12px' }}>Earns TCorvax based on your sCVX holdings. Connect Radix wallet.</p>
                        <p style={{ margin: '3px 0 0 0', color: 'var(--text-dim)', fontSize: '12px' }}>
                          <strong>Max Level:</strong> 2
                        </p>
                      </div>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      margin: '0 0 10px 0',
                      padding: '8px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: '8px'
                    }}>
                      <div style={{
                        fontSize: '20px',
                        marginRight: '10px',
                        padding: '8px',
                        borderRadius: '50%',
                        backgroundColor: "#FF3D00",
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>🔥</div>
                      <div style={{ flexGrow: 1 }}>
                        <h3 style={{ margin: '0 0 3px 0', fontSize: '14px' }}>The FOMO HIT</h3>
                        <p style={{ margin: '0', color: 'var(--text-dim)', fontSize: '12px' }}>First activation mints a special NFT. After that, produces 5 TCorvax.</p>
                        <p style={{ margin: '3px 0 0 0', color: 'var(--text-dim)', fontSize: '12px' }}>
                          <strong>Max Level:</strong> 1
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Resources Tab - Mobile Optimized */}
                {activeTab === 'resources' && (
                  <div>
                    <div style={{
                      padding: '8px',
                      margin: '0 0 10px 0',
                      background: 'rgba(76, 175, 80, 0.1)',
                      borderRadius: '8px'
                    }}>
                      <h3 style={{ margin: '0 0 5px 0', color: '#4CAF50', fontSize: '14px' }}>TCorvax 💎</h3>
                      <p style={{ margin: '0 0 3px 0', fontSize: '12px' }}>Main currency for building and upgrading.</p>
                      <p style={{ margin: '3px 0 0 0', fontSize: '12px' }}><strong>Sources:</strong> Reactor, Incubator, FOMO HIT</p>
                    </div>
                    
                    <div style={{
                      padding: '8px',
                      margin: '0 0 10px 0',
                      background: 'rgba(255, 167, 38, 0.1)',
                      borderRadius: '8px'
                    }}>
                      <h3 style={{ margin: '0 0 5px 0', color: '#FFA726', fontSize: '14px' }}>Cat Nips 🐱</h3>
                      <p style={{ margin: '0 0 3px 0', fontSize: '12px' }}>Fuel for Reactors (3 per activation).</p>
                      <p style={{ margin: '3px 0 0 0', fontSize: '12px' }}><strong>Sources:</strong> Cat's Lair</p>
                    </div>
                    
                    <div style={{
                      padding: '8px',
                      margin: '0 0 10px 0',
                      background: 'rgba(255, 215, 0, 0.1)',
                      borderRadius: '8px'
                    }}>
                      <h3 style={{ margin: '0 0 5px 0', color: '#FFD700', fontSize: '14px' }}>Energy ⚡</h3>
                      <p style={{ margin: '0 0 3px 0', fontSize: '12px' }}>Powers the Amplifier (2 × Level per day).</p>
                      <p style={{ margin: '3px 0 0 0', fontSize: '12px' }}><strong>Sources:</strong> Reactor (2 per activation)</p>
                    </div>
                    
                    <div style={{
                      padding: '8px',
                      margin: '0 0 10px 0',
                      background: 'rgba(255, 215, 0, 0.1)',
                      borderRadius: '8px'
                    }}>
                      <h3 style={{ margin: '0 0 5px 0', color: '#FFD700', fontSize: '14px' }}>Eggs 🥚</h3>
                      <p style={{ margin: '0 0 3px 0', fontSize: '12px' }}>Special resource from Incubator.</p>
                      <p style={{ margin: '3px 0 0 0', fontSize: '12px' }}><strong>Rate:</strong> 1 Egg per 500 sCVX</p>
                    </div>
                    
                    <div style={{
                      padding: '8px',
                      margin: '0 0 10px 0',
                      background: 'rgba(156, 39, 176, 0.1)',
                      borderRadius: '8px'
                    }}>
                      <h3 style={{ margin: '0 0 5px 0', color: '#9C27B0', fontSize: '14px' }}>sCVX Tokens</h3>
                      <p style={{ margin: '0 0 3px 0', fontSize: '12px' }}>Staked CVX tokens from DeFi Plaza pool.</p>
                      <p style={{ margin: '3px 0 0 0', fontSize: '12px' }}><strong>Where to get:</strong> <a href="https://corvax.meme" style={{color: "#FF5722"}}>corvax.meme</a></p>
                    </div>
                  </div>
                )}
                
                {/* Rooms Tab - Mobile Optimized */}
                {activeTab === 'rooms' && (
                  <div>
                    <h3 style={{ fontSize: '16px' }}>Multiple Rooms</h3>
                    <p style={{ fontSize: '12px' }}>Your lab can expand to multiple rooms as you progress.</p>
                    
                    <div style={{
                      padding: '8px',
                      margin: '10px 0',
                      background: 'rgba(33, 150, 243, 0.1)',
                      borderRadius: '8px'
                    }}>
                      <h4 style={{ margin: '0 0 5px 0', color: '#2196F3', fontSize: '14px' }}>Room 1</h4>
                      <p style={{ margin: '0', fontSize: '12px' }}>Your starting room for building your lab.</p>
                    </div>
                    
                    <div style={{
                      padding: '8px',
                      margin: '10px 0',
                      background: 'rgba(255, 87, 34, 0.1)',
                      borderRadius: '8px'
                    }}>
                      <h4 style={{ margin: '0 0 5px 0', color: '#FF5722', fontSize: '14px' }}>Room 2</h4>
                      <p style={{ margin: '0 0 5px 0', fontSize: '12px' }}>Unlocked when you have:</p>
                      <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '12px' }}>
                        <li>2 Cat's Lairs</li>
                        <li>2 Reactors</li>
                        <li>1 Amplifier</li>
                      </ul>
                    </div>
                    
                    <h3 style={{ fontSize: '16px', marginTop: '15px' }}>Moving Machines</h3>
                    <div style={{
                      padding: '8px',
                      margin: '10px 0',
                      background: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}>
                      <p style={{ margin: '0 0 5px 0' }}><strong>Steps:</strong></p>
                      <ol style={{ margin: '0', paddingLeft: '20px' }}>
                        <li>Open side panel</li>
                        <li>Click "Move Machines" tab</li>
                        <li>Select machine to move</li>
                        <li>Click game area to place it</li>
                        <li>Confirm the move</li>
                      </ol>
                      <p style={{ margin: '5px 0 0 0' }}><strong>Cost:</strong> 50 TCorvax per move</p>
                    </div>
                  </div>
                )}
                
                {/* Controls Tab - Mobile Optimized */}
                {activeTab === 'controls' && (
                  <div>
                    <h3 style={{ fontSize: '16px' }}>Mobile Controls</h3>
                    <div style={{
                      padding: '8px',
                      margin: '10px 0',
                      background: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}>
                      <p style={{ margin: '0 0 3px 0' }}><strong>Move:</strong> Tap anywhere on the screen</p>
                      <p style={{ margin: '0 0 3px 0' }}><strong>Activate:</strong> Tap on a machine</p>
                      <p style={{ margin: '0 0 3px 0' }}><strong>Build/Upgrade:</strong> Tap ≡ Menu button</p>
                      <p style={{ margin: '0 0 3px 0' }}><strong>Switch Rooms:</strong> Tap arrows on right</p>
                      <p style={{ margin: '0' }}><strong>Connect Wallet:</strong> Top right button</p>
                    </div>
                    
                    <h3 style={{ fontSize: '16px', marginTop: '15px' }}>Desktop Controls</h3>
                    <div style={{
                      padding: '8px',
                      margin: '10px 0',
                      background: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}>
                      <p style={{ margin: '0 0 3px 0' }}><strong>Move:</strong> Arrow keys (↑ ↓ ← →)</p>
                      <p style={{ margin: '0 0 3px 0' }}><strong>Activate:</strong> Space when near machine</p>
                      <p style={{ margin: '0 0 3px 0' }}><strong>Cancel Move:</strong> Escape key</p>
                      <p style={{ margin: '0' }}><strong>Switch Rooms:</strong> Click arrows on right</p>
                    </div>
                    
                    <h3 style={{ fontSize: '16px', marginTop: '15px' }}>Tips</h3>
                    <ul style={{ paddingLeft: '20px', fontSize: '12px' }}>
                      <li>You need to be close to a machine to activate it</li>
                      <li>Incubator and FOMO HIT require connected Radix wallet</li>
                      <li>Keep enough Energy for your Amplifier to stay online</li>
                      <li>Machine cooldowns shown by progress bars underneath</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Desktop tab content - below the horizontal tab bar */}
          {!isMobile && (
            <div style={{ 
              padding: '15px', 
              background: 'rgba(0, 0, 0, 0.2)', 
              borderRadius: '8px',
              maxHeight: '60vh',
              overflowY: 'auto'
            }}>
              {/* Desktop content same as before */}
              {/* Basics Tab */}
              {activeTab === 'basics' && (
                <div>
                  <h3>Getting Started</h3>
                  <p>Corvax Lab is a resource management game where you build and upgrade machines to earn TCorvax - the main currency of the game.</p>
                  
                  <div style={{ 
                    background: 'rgba(76, 175, 80, 0.1)', 
                    padding: '10px', 
                    borderRadius: '8px',
                    margin: '15px 0'
                  }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#4CAF50' }}>Game Progression</h4>
                    <ol style={{ paddingLeft: '20px', margin: '0' }}>
                      <li>Build a <strong style={{ color: '#4CAF50' }}>Cat's Lair</strong> to produce Cat Nips</li>
                      <li>Build a <strong style={{ color: '#2196F3' }}>Reactor</strong> to convert Cat Nips into TCorvax and Energy</li>
                      <li>Build an <strong style={{ color: '#9C27B0' }}>Amplifier</strong> to boost Reactor production</li>
                      <li>Upgrade your machines to maximum level</li>
                      <li>Build the <strong style={{ color: '#FF5722' }}>Incubator</strong> to earn TCorvax from your sCVX holdings</li>
                      <li>Build <strong style={{ color: '#FF3D00' }}>The FOMO HIT</strong> to mint an exclusive NFT and earn more TCorvax</li>
                      <li>Unlock and expand to Room 2 for better organization</li>
                      <li>Build a third Reactor (unlocked after building Incubator and FOMO HIT)</li>
                    </ol>
                  </div>
                  
                  <h3>Resources Overview</h3>
                  <ul style={{ paddingLeft: '20px' }}>
                    <li><strong style={{ color: '#4CAF50' }}>TCorvax (💎)</strong> - The main currency for building and upgrading</li>
                    <li><strong style={{ color: '#FFA726' }}>Cat Nips (🐱)</strong> - Used to fuel Reactors</li>
                    <li><strong style={{ color: '#FFD700' }}>Energy (⚡)</strong> - Powers your Amplifier</li>
                    <li><strong style={{ color: '#FFD700' }}>Eggs (🥚)</strong> - Special resource from the Incubator</li>
                  </ul>
                  
                  <h3>Tips For New Players</h3>
                  <ul style={{ paddingLeft: '20px' }}>
                    <li>Build Cat's Lair first, then a Reactor to start earning TCorvax</li>
                    <li>Upgrade your machines to increase production efficiency</li>
                    <li>Make sure your Amplifier has enough Energy to stay online</li>
                    <li>When you have enough resources, build the Incubator to earn TCorvax from your sCVX</li>
                    <li>You can move machines between rooms (costs 50 TCorvax)</li>
                    <li>Machines have cooldowns between activations (shown by a progress bar)</li>
                  </ul>
                </div>
              )}
              
              {/* Machines Tab */}
              {activeTab === 'machines' && (
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    margin: '0 0 15px 0',
                    padding: '10px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '8px'
                  }}>
                    <div style={{
                      fontSize: '24px',
                      marginRight: '15px',
                      padding: '10px',
                      borderRadius: '50%',
                      backgroundColor: "#4CAF50",
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>🐱</div>
                    <div style={{ flexGrow: 1 }}>
                      <h3 style={{ margin: '0 0 5px 0' }}>Cat's Lair</h3>
                      <p style={{ margin: '0', color: 'var(--text-dim)' }}>Produces Cat Nips. Each activation gives 5 + (Level - 1) Cat Nips.</p>
                      <p style={{ margin: '5px 0 0 0', color: 'var(--text-dim)' }}>
                        <strong>Cost:</strong> 10 TCorvax (first), 40 TCorvax (second)
                      </p>
                      <p style={{ margin: '5px 0 0 0', color: 'var(--text-dim)' }}>
                        <strong>Max Level:</strong> 3
                      </p>
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    margin: '0 0 15px 0',
                    padding: '10px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '8px'
                  }}>
                    <div style={{
                      fontSize: '24px',
                      marginRight: '15px',
                      padding: '10px',
                      borderRadius: '50%',
                      backgroundColor: "#2196F3",
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>⚛️</div>
                    <div style={{ flexGrow: 1 }}>
                      <h3 style={{ margin: '0 0 5px 0' }}>Reactor</h3>
                      <p style={{ margin: '0', color: 'var(--text-dim)' }}>Consumes 3 Cat Nips to produce TCorvax and Energy.</p>
                      <p style={{ margin: '5px 0 0 0', color: 'var(--text-dim)' }}>
                        <strong>Production:</strong> 1-2 TCorvax (depends on level), 2 Energy
                      </p>
                      <p style={{ margin: '5px 0 0 0', color: 'var(--text-dim)' }}>
                        <strong>Cost:</strong> 10 TCorvax + 10 Cat Nips (first), 40 TCorvax + 40 Cat Nips (second), 640 TCorvax + 640 Cat Nips (third, requires Incubator and FOMO HIT)
                      </p>
                      <p style={{ margin: '5px 0 0 0', color: 'var(--text-dim)' }}>
                        <strong>Max Level:</strong> 3
                      </p>
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    margin: '0 0 15px 0',
                    padding: '10px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '8px'
                  }}>
                    <div style={{
                      fontSize: '24px',
                      marginRight: '15px',
                      padding: '10px',
                      borderRadius: '50%',
                      backgroundColor: "#9C27B0",
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>🔊</div>
                    <div style={{ flexGrow: 1 }}>
                      <h3 style={{ margin: '0 0 5px 0' }}>Amplifier</h3>
                      <p style={{ margin: '0', color: 'var(--text-dim)' }}>Boosts Reactor TCorvax production by 0.5 per level.</p>
                      <p style={{ margin: '5px 0 0 0', color: 'var(--text-dim)' }}>
                        <strong>Energy Cost:</strong> 2 × Level Energy per day
                      </p>
                      <p style={{ margin: '5px 0 0 0', color: 'var(--text-dim)' }}>
                        <strong>Building Cost:</strong> 10 TCorvax + 10 Cat Nips + 10 Energy
                      </p>
                      <p style={{ margin: '5px 0 0 0', color: 'var(--text-dim)' }}>
                        <strong>Max Level:</strong> 5 (Level 4-5 requires maxed Cat Lairs and Reactors)
                      </p>
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    margin: '0 0 15px 0',
                    padding: '10px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '8px'
                  }}>
                    <div style={{
                      fontSize: '24px',
                      marginRight: '15px',
                      padding: '10px',
                      borderRadius: '50%',
                      backgroundColor: "#FF5722",
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>🥚</div>
                    <div style={{ flexGrow: 1 }}>
                      <h3 style={{ margin: '0 0 5px 0' }}>Incubator</h3>
                      <p style={{ margin: '0', color: 'var(--text-dim)' }}>Earns TCorvax based on your sCVX holdings. Connect your Radix wallet to use.</p>
                      
                      <div style={{ margin: '10px 0', padding: '5px', background: 'rgba(255, 87, 34, 0.1)', borderRadius: '5px' }}>
                        <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#FF5722' }}>Level 1 Rewards:</p>
                        <ul style={{ margin: '0', paddingLeft: '20px' }}>
                          <li>1 TCorvax per 100 sCVX (maximum 10)</li>
                          <li>1 Egg per 500 sCVX</li>
                        </ul>
                      </div>
                      
                      <div style={{ margin: '10px 0', padding: '5px', background: 'rgba(230, 74, 25, 0.1)', borderRadius: '5px' }}>
                        <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#E64A19' }}>Level 2 Rewards (After Upgrade):</p>
                        <ul style={{ margin: '0', paddingLeft: '20px' }}>
                          <li>All Level 1 rewards</li>
                          <li>+1 Additional TCorvax per 1000 sCVX (no maximum)</li>
                        </ul>
                      </div>
                      
                      <p style={{ margin: '10px 0 0 0', color: 'var(--text-dim)' }}>
                        <strong>Building Cost:</strong> 320 TCorvax + 320 Cat Nips + 320 Energy
                      </p>
                      <p style={{ margin: '5px 0 0 0', color: 'var(--text-dim)' }}>
                        <strong>Requirements:</strong> All other machines must be at max level
                      </p>
                      <p style={{ margin: '5px 0 0 0', color: 'var(--text-dim)' }}>
                        <strong>Max Level:</strong> 2
                      </p>
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    margin: '0 0 15px 0',
                    padding: '10px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '8px'
                  }}>
                    <div style={{
                      fontSize: '24px',
                      marginRight: '15px',
                      padding: '10px',
                      borderRadius: '50%',
                      backgroundColor: "#FF3D00",
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>🔥</div>
                    <div style={{ flexGrow: 1 }}>
                      <h3 style={{ margin: '0 0 5px 0' }}>The FOMO HIT</h3>
                      <p style={{ margin: '0', color: 'var(--text-dim)' }}>First activation mints a special limited NFT. Connect your Radix wallet to use.</p>
                      <p style={{ margin: '5px 0 0 0', color: 'var(--text-dim)' }}>
                        <strong>Building Cost:</strong> 640 TCorvax + 640 Cat Nips + 640 Energy
                      </p>
                      <p style={{ margin: '5px 0 0 0', color: 'var(--text-dim)' }}>
                        <strong>Productions:</strong> 5 TCorvax per activation (after NFT is minted)
                      </p>
                      <p style={{ margin: '5px 0 0 0', color: 'var(--text-dim)' }}>
                        <strong>Requirements:</strong> Build all other machine types first
                      </p>
                      <p style={{ margin: '5px 0 0 0', color: 'var(--text-dim)' }}>
                        <strong>Max Level:</strong> 1
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Resources Tab */}
              {activeTab === 'resources' && (
                <div>
                  <div style={{
                    padding: '10px',
                    margin: '0 0 15px 0',
                    background: 'rgba(76, 175, 80, 0.1)',
                    borderRadius: '8px'
                  }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#4CAF50' }}>TCorvax 💎</h3>
                    <p style={{ margin: '0 0 5px 0' }}>The main currency in the game. Used to build and upgrade machines.</p>
                    <p style={{ margin: '5px 0 0 0' }}><strong>Produced by:</strong></p>
                    <ul style={{ margin: '0' }}>
                      <li>Reactor (1-2 per activation + Amplifier boost)</li>
                      <li>Incubator (based on your sCVX holdings)</li>
                      <li>FOMO HIT (5 per activation)</li>
                    </ul>
                  </div>
                  
                  <div style={{
                    padding: '10px',
                    margin: '0 0 15px 0',
                    background: 'rgba(255, 167, 38, 0.1)',
                    borderRadius: '8px'
                  }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#FFA726' }}>Cat Nips 🐱</h3>
                    <p style={{ margin: '0 0 5px 0' }}>Used to fuel Reactors. Each Reactor activation costs 3 Cat Nips.</p>
                    <p style={{ margin: '5px 0 0 0' }}><strong>Produced by:</strong></p>
                    <ul style={{ margin: '0' }}>
                      <li>Cat's Lair (5 + (Level-1) per activation)</li>
                    </ul>
                  </div>
                  
                  <div style={{
                    padding: '10px',
                    margin: '0 0 15px 0',
                    background: 'rgba(255, 215, 0, 0.1)',
                    borderRadius: '8px'
                  }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#FFD700' }}>Energy ⚡</h3>
                    <p style={{ margin: '0 0 5px 0' }}>Used to keep the Amplifier online. It consumes Energy every 24 hours.</p>
                    <p style={{ margin: '5px 0 0 0' }}><strong>Daily Energy Cost:</strong> 2 × Amplifier Level</p>
                    <p style={{ margin: '5px 0 0 0' }}><strong>Produced by:</strong></p>
                    <ul style={{ margin: '0' }}>
                      <li>Reactor (2 per activation)</li>
                    </ul>
                  </div>
                  
                  <div style={{
                    padding: '10px',
                    margin: '0 0 15px 0',
                    background: 'rgba(255, 215, 0, 0.1)',
                    borderRadius: '8px'
                  }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#FFD700' }}>Eggs 🥚</h3>
                    <p style={{ margin: '0 0 5px 0' }}>Special resource earned from the Incubator.</p>
                    <p style={{ margin: '5px 0 0 0' }}><strong>Earned Rate:</strong> 1 Egg per 500 sCVX</p>
                    <p style={{ margin: '5px 0 0 0' }}><strong>Produced by:</strong></p>
                    <ul style={{ margin: '0' }}>
                      <li>Incubator (based on your sCVX holdings)</li>
                    </ul>
                  </div>
                  
                  <div style={{
                    padding: '10px',
                    margin: '0 0 15px 0',
                    background: 'rgba(156, 39, 176, 0.1)',
                    borderRadius: '8px'
                  }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#9C27B0' }}>sCVX Tokens</h3>
                    <p style={{ margin: '0 0 5px 0' }}>Staked CVX tokens from the DeFi Plaza staking pool. Not produced in-game.</p>
                    <p style={{ margin: '5px 0 0 0' }}>You can stake your CVX tokens at <a href="https://corvax.meme" target="_blank" rel="noopener noreferrer" style={{color: "#FF5722"}}>corvax.meme</a> to earn sCVX.</p>
                    <p style={{ margin: '5px 0 0 0' }}><strong>Used by:</strong> Incubator to generate TCorvax and Eggs</p>
                  </div>
                </div>
              )}
              
              {/* Rooms Tab */}
              {activeTab === 'rooms' && (
                <div>
                  <h3>Multiple Rooms</h3>
                  <p>Your lab can expand to multiple rooms as you progress in the game.</p>
                  
                  <div style={{
                    padding: '10px',
                    margin: '15px 0',
                    background: 'rgba(33, 150, 243, 0.1)',
                    borderRadius: '8px'
                  }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#2196F3' }}>Room 1</h4>
                    <p style={{ margin: '0' }}>Your starting room. This is where you begin building your lab.</p>
                  </div>
                  
                  <div style={{
                    padding: '10px',
                    margin: '15px 0',
                    background: 'rgba(255, 87, 34, 0.1)',
                    borderRadius: '8px'
                  }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#FF5722' }}>Room 2</h4>
                    <p style={{ margin: '0 0 10px 0' }}>Unlocked when you have:</p>
                    <ul style={{ margin: '0', paddingLeft: '20px' }}>
                      <li>2 Cat's Lairs</li>
                      <li>2 Reactors</li>
                      <li>1 Amplifier</li>
                    </ul>
                    <p style={{ margin: '10px 0 0 0' }}>Room 2 gives you additional space to organize your machines.</p>
                  </div>
                  
                  <h3>Room Navigation</h3>
                  <p>Use the arrow buttons on the right side of the game area to switch between rooms. Your resources are shared between all rooms.</p>
                  
                  <h3>Moving Machines</h3>
                  <div style={{
                    padding: '10px',
                    margin: '15px 0',
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '8px'
                  }}>
                    <p style={{ margin: '0 0 10px 0' }}><strong>Moving a Machine:</strong></p>
                    <ol style={{ margin: '0', paddingLeft: '20px' }}>
                      <li>Open the side panel</li>
                      <li>Click on "Move Machines" tab</li>
                      <li>Select the machine you want to move</li>
                      <li>Click on the game area where you want to place it</li>
                      <li>Confirm the move</li>
                    </ol>
                    <p style={{ margin: '10px 0 0 0' }}><strong>Cost:</strong> 50 TCorvax per move</p>
                    <p style={{ margin: '5px 0 0 0' }}><strong>Note:</strong> You can move machines between rooms! Just switch rooms after selecting a machine.</p>
                  </div>
                </div>
              )}
              
              {/* Controls Tab */}
              {activeTab === 'controls' && (
                <div>
                  <h3>Desktop Controls</h3>
                  <div style={{
                    padding: '10px',
                    margin: '10px 0 15px 0',
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '8px'
                  }}>
                    <p style={{ margin: '0 0 5px 0' }}><strong>Movement:</strong> Arrow keys (↑ ↓ ← →)</p>
                    <p style={{ margin: '0 0 5px 0' }}><strong>Activate Machine:</strong> Press Space when near a machine</p>
                    <p style={{ margin: '0 0 5px 0' }}><strong>Build/Upgrade:</strong> Use the side panel on the left</p>
                    <p style={{ margin: '0 0 5px 0' }}><strong>Cancel Move:</strong> Press Escape key when in move mode</p>
                    <p style={{ margin: '0' }}><strong>Switch Rooms:</strong> Click the arrows on the right side</p>
                  </div>
                  
                  <h3>Mobile Controls</h3>
                  <div style={{
                    padding: '10px',
                    margin: '10px 0 15px 0',
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '8px'
                  }}>
                    <p style={{ margin: '0 0 5px 0' }}><strong>Movement:</strong> Tap anywhere on the screen to move there</p>
                    <p style={{ margin: '0 0 5px 0' }}><strong>Activate Machine:</strong> Tap on a machine to walk to it and activate it</p>
                    <p style={{ margin: '0 0 5px 0' }}><strong>Build/Upgrade:</strong> Tap the ≡ Menu button to open build options</p>
                    <p style={{ margin: '0 0 5px 0' }}><strong>Switch Rooms:</strong> Tap the arrows on the right side</p>
                    <p style={{ margin: '0' }}><strong>Connect Wallet:</strong> Use the wallet button at the top right</p>
                  </div>
                  
                  <h3>Interaction Tips</h3>
                  <ul style={{ paddingLeft: '20px' }}>
                    <li>You need to be close to a machine to activate it</li>
                    <li>The Incubator and FOMO HIT require a connected Radix wallet</li>
                    <li>Keep an eye on your Energy level to ensure your Amplifier stays online</li>
                    <li>Machine cooldowns are shown by progress bars under each machine</li>
                    <li>When placing machines, keep some space between them for better visibility</li>
                  </ul>
                </div>
              )}
            </div>
          )}
          
          {/* Close button at bottom */}
          <button 
            onClick={toggleHelp}
            style={{ marginTop: '20px', width: '100%' }}
          >
            Close Help
          </button>
        </div>
      )}
    </>
  );
};

export default HelpButton;
