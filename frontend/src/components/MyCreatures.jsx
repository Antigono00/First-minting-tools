// src/components/MyCreatures.jsx
import React, { useContext, useEffect, useState } from 'react';
import { useRadixConnect } from '../context/RadixConnectContext';
import { GameContext } from '../context/GameContext';
import NFTService from '../utils/NFTService';

// SVG placeholder for missing images
const PLACEHOLDER_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='40' fill='%23f0f0f0' stroke='%23ccc' stroke-width='2'/%3E%3Ctext x='50' y='55' font-family='Arial' font-size='14' text-anchor='middle' fill='%23888'%3EEgg%3C/text%3E%3C/svg%3E";

const MyCreatures = ({ onClose }) => {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNft, setSelectedNft] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'detail'

  const { connected, accounts } = useRadixConnect();
  const { addNotification } = useContext(GameContext);

  // Debug log when NFTs are loaded
  useEffect(() => {
    if (nfts.length > 0) {
      console.log("NFTs loaded:", nfts.length);
      console.log("First NFT sample:", nfts[0]);
    }
  }, [nfts]);

  useEffect(() => {
    // Load user's NFTs when component mounts or account changes
    if (connected && accounts && accounts.length > 0) {
      loadUserNfts(accounts[0].address);
    }
  }, [connected, accounts]);

  const loadUserNfts = async (accountAddress) => {
    try {
      setLoading(true);
      setError(null);
      
      const userNfts = await NFTService.getUserNFTs(accountAddress);
      setNfts(userNfts);
      
      // If no NFTs found, show a notification
      if (userNfts.length === 0) {
        addNotification("No creatures found! You can mint an egg from the NFT Creatures section.", 400, 300, "#FF9800");
      }
    } catch (err) {
      console.error('Error loading NFTs:', err);
      setError('Failed to load your creatures. Please try again later.');
      addNotification("Error loading creatures", 400, 300, "#F44336");
    } finally {
      setLoading(false);
    }
  };

  const handleNftClick = async (nft) => {
    try {
      setLoading(true);
      const details = await NFTService.getNFTDetails(
        "resource_rdx1n2rt6ygucac2me5jada3mluyf5f58ezhx06k6qlvasav0q0ece5svd", 
        nft.id
      );
      setSelectedNft(details);
      setViewMode('detail');
    } catch (err) {
      console.error('Error loading NFT details:', err);
      addNotification("Error loading creature details", 400, 300, "#F44336");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToGrid = () => {
    setSelectedNft(null);
    setViewMode('grid');
  };

  // Renders the grid view of all NFTs
  const renderGridView = () => {
    if (loading) {
      return <div className="loading-spinner">Loading your creatures...</div>;
    }

    if (error) {
      return <div className="error-message">{error}</div>;
    }

    if (nfts.length === 0) {
      return (
        <div className="empty-state">
          <h3>No Creatures Found</h3>
          <p>You don't have any creatures yet. Mint an egg to get started!</p>
          <button onClick={onClose} style={{ backgroundColor: '#4CAF50', marginTop: '20px' }}>
            Go to NFT Creatures
          </button>
        </div>
      );
    }

    return (
      <div className="nft-grid">
        {nfts.map(nft => (
          <div 
            key={nft.id} 
            className="nft-card"
            onClick={() => handleNftClick(nft)}
          >
            <div className="nft-image-container">
              <img 
                src={nft.image_url || PLACEHOLDER_SVG} 
                alt={nft.species_name || 'Creature'} 
                className="nft-image"
                onError={(e) => {
                  console.error(`Failed to load NFT image: ${nft.image_url}`);
                  e.target.src = PLACEHOLDER_SVG;
                  e.target.onerror = null;
                }}
              />
              <div className="nft-rarity-badge" style={{
                backgroundColor: getRarityColor(nft.rarity)
              }}>
                {nft.rarity}
              </div>
            </div>
            <div className="nft-info">
              <h4>{nft.species_name}</h4>
              <p>{nft.display_form}</p>
              {nft.display_stats && <p className="nft-stats">{nft.display_stats}</p>}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Renders the detailed view of a selected NFT
  const renderDetailView = () => {
    if (!selectedNft) return null;

    // Destructure needed properties from selectedNft
    const { 
      species_name, 
      rarity, 
      form, 
      stats, 
      evolution_progress, 
      combination_level,
      display_form
    } = selectedNft;

    // Get image_url separately to avoid the "never read" warning
    const nftImageUrl = selectedNft.image_url;
    
    // Helper function to determine if the creature can be evolved
    const canEvolve = evolution_progress?.stat_upgrades_completed >= 3 && form < 3;
    
    // Helper function to determine if stats can be upgraded
    const canUpgradeStats = (
      (form < 3) || 
      (form === 3 && selectedNft.final_form_upgrades < 3)
    );

    return (
      <div className="nft-detail-view">
        <button 
          onClick={handleBackToGrid}
          className="back-button"
        >
          ← Back to All Creatures
        </button>
        
        <div className="nft-detail-content">
          <div className="nft-detail-image-container">
            <img 
              src={nftImageUrl || PLACEHOLDER_SVG} 
              alt={species_name || 'Creature'} 
              className="nft-detail-image"
              onError={(e) => {
                console.error(`Failed to load NFT detail image: ${nftImageUrl}`);
                e.target.src = PLACEHOLDER_SVG;
                e.target.onerror = null;
              }}
            />
            <div className="nft-detail-rarity-badge" style={{
              backgroundColor: getRarityColor(rarity)
            }}>
              {rarity}
            </div>
            {combination_level > 0 && (
              <div className="nft-detail-combination-badge">
                Level {combination_level} Combo
              </div>
            )}
          </div>
          
          <div className="nft-detail-info">
            <h2>{species_name}</h2>
            <h3>{display_form}</h3>
            
            <div className="nft-detail-stats">
              <h4>Stats</h4>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Energy:</span>
                  <span className="stat-value">{stats?.energy || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Strength:</span>
                  <span className="stat-value">{stats?.strength || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Magic:</span>
                  <span className="stat-value">{stats?.magic || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Stamina:</span>
                  <span className="stat-value">{stats?.stamina || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Speed:</span>
                  <span className="stat-value">{stats?.speed || 0}</span>
                </div>
              </div>
            </div>
            
            <div className="nft-detail-evolution">
              <h4>Evolution Progress</h4>
              <div className="evolution-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{
                      width: `${(evolution_progress?.stat_upgrades_completed || 0) / 3 * 100}%`,
                      backgroundColor: canEvolve ? '#4CAF50' : '#FF9800'
                    }}
                  ></div>
                </div>
                <div className="progress-text">
                  {evolution_progress?.stat_upgrades_completed || 0}/3 Upgrades
                </div>
              </div>
            </div>
            
            <div className="nft-detail-actions">
              {canUpgradeStats && (
                <button className="action-button upgrade-stats-button">
                  Upgrade Stats
                </button>
              )}
              
              {canEvolve && (
                <button className="action-button evolve-button">
                  Evolve Creature
                </button>
              )}
              
              {form === 3 && (
                <button className="action-button combine-button">
                  Find Match to Combine
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Helper function to get color based on rarity
  const getRarityColor = (rarity) => {
    switch (rarity?.toLowerCase()) {
      case 'common':
        return '#78909C'; // Blue-grey
      case 'rare':
        return '#2196F3'; // Blue
      case 'epic':
        return '#9C27B0'; // Purple
      case 'legendary':
        return '#FF9800'; // Orange
      default:
        return '#78909C'; // Default blue-grey
    }
  };

  return (
    <div className="my-creatures-container">
      <h1>My Creatures</h1>
      
      {!connected && (
        <div className="connect-wallet-message">
          <p>Please connect your Radix wallet to view your creatures</p>
        </div>
      )}
      
      {connected && accounts?.length === 0 && (
        <div className="connect-wallet-message">
          <p>Please share an account to view your creatures</p>
        </div>
      )}
      
      {connected && accounts?.length > 0 && (
        viewMode === 'grid' ? renderGridView() : renderDetailView()
      )}
      
      <div className="creatures-footer">
        <button 
          onClick={onClose}
          style={{ backgroundColor: '#333', marginTop: '20px' }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default MyCreatures;
