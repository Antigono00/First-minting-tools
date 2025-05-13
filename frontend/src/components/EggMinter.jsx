// src/components/EggMinter.jsx
import { useContext, useEffect, useState } from 'react';
import { GameContext } from '../context/GameContext';
import { useRadixConnect } from '../context/RadixConnectContext';

const EggMinter = ({ onClose }) => {
  // Game context
  const {
    eggs,
    tcorvax,
    formatResource,
    addNotification,
    loadGameFromServer
  } = useContext(GameContext);

  // Radix Connect context
  const {
    connected,
    accounts,
    rdt,
    updateAccountSharing
  } = useRadixConnect();

  // Component states
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [mintingStage, setMintingStage] = useState('init'); // 'init', 'sending', 'pending', 'success', 'failed'
  const [intentHash, setIntentHash] = useState(null);
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [statusCheckCount, setStatusCheckCount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState(null); // 'xrd' or 'eggs'
  const [showConnectionDetails, setShowConnectionDetails] = useState(false);

  // Check connection status
  useEffect(() => {
    if (!connected) {
      setConnectionStatus('disconnected');
    } else if (!accounts || accounts.length === 0) {
      setConnectionStatus('connected-no-accounts');
    } else {
      setConnectionStatus('ready');
    }
  }, [connected, accounts]);

  // Poll transaction status if we have an intent hash
  useEffect(() => {
    if (intentHash && mintingStage === 'pending') {
      const maxStatusChecks = 30; // Limit how many times we check
      
      const checkStatus = async () => {
        try {
          const response = await fetch('/api/checkEggMintStatus', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              intentHash
            }),
            credentials: 'same-origin'
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          console.log("Transaction status:", data);
          setTransactionDetails(data.transactionStatus);
          
          const txStatus = data.transactionStatus?.status;
          
          if (txStatus === "CommittedSuccess") {
            setMintingStage('success');
            setIsLoading(false);
            loadGameFromServer(); // Refresh game state to update resources
            return;
          } else if (txStatus === "Failed" || txStatus === "Rejected") {
            setMintingStage('failed');
            setIsLoading(false);
            return;
          }
          
          setStatusCheckCount(prev => prev + 1);
          
          // If we're still pending and haven't reached max checks
          if (statusCheckCount < maxStatusChecks) {
            setTimeout(checkStatus, 3000);
          } else {
            // Max checks reached, but not failed - tell user to check later
            setIsLoading(false);
          }
        } catch (error) {
          console.error("Error checking transaction status:", error);
          setIsLoading(false);
          setMintingStage('failed');
        }
      };
      
      setTimeout(checkStatus, 3000);
    }
  }, [intentHash, mintingStage, statusCheckCount, loadGameFromServer]);

  // Send transaction to the wallet
  const sendTransaction = async (manifest) => {
    if (!rdt) {
      console.error("Radix Dapp Toolkit not initialized");
      return null;
    }
    
    try {
      console.log("Sending transaction with manifest:", manifest);
      
      const result = await rdt.walletApi.sendTransaction({
        transactionManifest: manifest,
        version: 1,
      });
      
      if (result.isErr()) {
        console.error("Transaction error:", result.error);
        return null;
      }
      
      const intentHash = result.value.transactionIntentHash;
      console.log("Transaction sent with intent hash:", intentHash);
      return intentHash;
    } catch (error) {
      console.error("Error sending transaction:", error);
      return null;
    }
  };

  // Handle the XRD minting process
  const handleXrdMint = async () => {
    if (connectionStatus !== 'ready') return;
    
    setIsLoading(true);
    setMintingStage('sending');
    setPaymentMethod('xrd');
    
    try {
      // Get the mint manifest
      const response = await fetch('/api/getMintEggManifest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountAddress: accounts[0].address,
          paymentMethod: 'xrd'
        }),
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.manifest) {
        throw new Error("Server didn't return minting manifest");
      }
      
      // Send the transaction to the wallet
      const hash = await sendTransaction(data.manifest);
      
      if (hash) {
        setIntentHash(hash);
        setMintingStage('pending');
      } else {
        throw new Error("Failed to get transaction hash");
      }
    } catch (error) {
      console.error("Minting error:", error);
      setMintingStage('failed');
      setIsLoading(false);
      addNotification(error.message, 400, 300, "#FF3D00");
    }
  };

  // Handle the egg resource minting process
  const handleEggResourceMint = async () => {
    if (connectionStatus !== 'ready') return;
    
    setIsLoading(true);
    setMintingStage('sending');
    setPaymentMethod('eggs');
    
    try {
      // Check if user has enough egg resources
      if (eggs < 150) {
        throw new Error("Not enough egg resources. 150 eggs required.");
      }
      
      // Get the backend mint manifest
      const response = await fetch('/api/getMintEggManifest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountAddress: accounts[0].address,
          paymentMethod: 'eggs'
        }),
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.manifest) {
        throw new Error("Server didn't return minting manifest");
      }
      
      // Send the transaction to the wallet
      const hash = await sendTransaction(data.manifest);
      
      if (hash) {
        setIntentHash(hash);
        setMintingStage('pending');
      } else {
        throw new Error("Failed to get transaction hash");
      }
    } catch (error) {
      console.error("Minting error:", error);
      setMintingStage('failed');
      setIsLoading(false);
      addNotification(error.message, 400, 300, "#FF3D00");
    }
  };

  // Toggle connection details panel
  const toggleConnectionDetails = () => {
    setShowConnectionDetails(prev => !prev);
  };

  // Check if user can afford the payment method
  const canAffordXrd = tcorvax >= 300;
  const canAffordEggs = eggs >= 150;

  return (
    <div className="welcome-message" style={{ maxWidth: '800px' }}>
      <h1>Evolving Creatures Egg Minter</h1>
      
      {/* Info tooltip explaining NFTs */}
      <div className="info-tooltip" style={{
        position: 'relative',
        display: 'inline-block',
        marginLeft: '10px',
        cursor: 'help'
      }}>
        <span className="info-icon" style={{
          fontSize: '16px',
          backgroundColor: '#4CAF50',
          color: 'white',
          borderRadius: '50%',
          padding: '0px 8px',
          marginRight: '5px'
        }}>ℹ️</span>
        <div className="tooltip-content" style={{
          visibility: 'hidden',
          width: '280px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: '#fff',
          textAlign: 'center',
          borderRadius: '6px',
          padding: '10px',
          position: 'absolute',
          zIndex: 1,
          bottom: '125%',
          left: '50%',
          marginLeft: '-140px',
          opacity: 0,
          transition: 'opacity 0.3s',
        }}>
          NFT eggs can grow into unique creatures that you own forever on the Radix blockchain.
          <style jsx>{`
            .info-tooltip:hover .tooltip-content {
              visibility: visible;
              opacity: 1;
            }
          `}</style>
        </div>
      </div>

      {/* Connection status indicator */}
      <div 
        style={{ 
          position: 'absolute', 
          top: '10px', 
          right: '10px',
          padding: '5px 10px',
          borderRadius: '12px',
          fontSize: '12px',
          backgroundColor: connectionStatus === 'ready' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 152, 0, 0.2)',
          color: connectionStatus === 'ready' ? '#4CAF50' : '#FF9800',
          cursor: 'pointer'
        }}
        onClick={toggleConnectionDetails}
      >
        {connectionStatus === 'ready' ? 'Connected' : 'Connection Issues'} {showConnectionDetails ? '▲' : '▼'}
      </div>

      {/* A) Wallet is disconnected */}
      {connectionStatus === 'disconnected' && (
        <div
          style={{
            background: 'rgba(255, 87, 34, 0.2)',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px',
            color: '#FF5722'
          }}
        >
          <p><strong>Your Radix wallet is not connected</strong></p>
          <p>Please connect your Radix wallet using the top-right button.</p>
        </div>
      )}

      {/* B) Wallet is connected but no account shared */}
      {connectionStatus === 'connected-no-accounts' && (
        <div
          style={{
            background: 'rgba(255, 193, 7, 0.2)',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px',
            color: '#FFC107'
          }}
        >
          <p><strong>Wallet connected but no account shared</strong></p>
          <p>Please share an account to mint your egg.</p>
          <button
            onClick={updateAccountSharing}
            style={{
              backgroundColor: '#FFC107',
              color: 'black',
              marginTop: '10px'
            }}
          >
            Share an account
          </button>
        </div>
      )}

      {/* Connection details panel */}
      {showConnectionDetails && (
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            padding: '10px',
            borderRadius: '5px',
            marginBottom: '15px',
            fontSize: '0.8em',
            color: '#EEE'
          }}
        >
          <h4 style={{ margin: '0 0 10px 0' }}>Connection Details</h4>
          
          <div>
            <p style={{ fontSize: '11px', margin: '2px 0' }}>
              <strong>Radix Connected:</strong> {connected ? 'Yes' : 'No'}
            </p>
            <p style={{ fontSize: '11px', margin: '2px 0' }}>
              <strong>Accounts Shared:</strong> {accounts?.length > 0 ? 'Yes' : 'No'}
            </p>
            <p style={{ fontSize: '11px', margin: '2px 0' }}>
              <strong>Account Address:</strong> {accounts?.[0]?.address || 'N/A'}
            </p>
            <p style={{ fontSize: '11px', margin: '2px 0' }}>
              <strong>Minting Stage:</strong> {mintingStage}
            </p>
            {intentHash && (
              <p style={{ fontSize: '11px', margin: '2px 0', wordBreak: 'break-all' }}>
                <strong>Intent Hash:</strong> {intentHash}
              </p>
            )}
          </div>
        </div>
      )}

      {/* C) Ready to mint - initial stage */}
      {connectionStatus === 'ready' && mintingStage === 'init' && !isLoading && (
        <div
          style={{
            background: 'rgba(255, 61, 0, 0.2)',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px'
          }}
        >
          <p>
            Connected to account:{' '}
            <strong>
              {accounts[0]?.label ||
                (accounts[0]?.address
                  ? accounts[0].address.slice(0, 10) + '...'
                  : 'N/A')}
            </strong>
          </p>
          
          <div style={{ 
            background: 'rgba(0, 0, 0, 0.2)', 
            padding: '20px', 
            borderRadius: '10px',
            margin: '20px 0',
            textAlign: 'center'
          }}>
            <h2 style={{ color: '#FF3D00', margin: '0 0 15px 0' }}>Choose your payment method</h2>
            <p>Mint a random Evolving Creature Egg using XRD or in-game eggs.</p>
            <p>Each mint has a 5% chance to earn a bonus item!</p>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '30px 0',
              gap: '20px',
              flexWrap: 'wrap'
            }}>
              <div style={{ 
                background: canAffordXrd ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)', 
                padding: '20px', 
                borderRadius: '10px',
                width: '200px',
                textAlign: 'center',
                cursor: canAffordXrd ? 'pointer' : 'not-allowed',
                opacity: canAffordXrd ? 1 : 0.7
              }}
              onClick={canAffordXrd ? handleXrdMint : undefined}
              >
                <h3>Pay with XRD</h3>
                <p style={{ fontSize: '20px', fontWeight: 'bold' }}>300 XRD</p>
                <p style={{ fontSize: '14px' }}>Current balance: {formatResource(tcorvax)} XRD</p>
                {!canAffordXrd && <p style={{ color: '#F44336' }}>Not enough XRD</p>}
              </div>
              
              <div style={{ 
                background: canAffordEggs ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)', 
                padding: '20px', 
                borderRadius: '10px',
                width: '200px',
                textAlign: 'center',
                cursor: canAffordEggs ? 'pointer' : 'not-allowed',
                opacity: canAffordEggs ? 1 : 0.7
              }}
              onClick={canAffordEggs ? handleEggResourceMint : undefined}
              >
                <h3>Pay with Eggs</h3>
                <p style={{ fontSize: '20px', fontWeight: 'bold' }}>150 Eggs</p>
                <p style={{ fontSize: '14px' }}>Current balance: {formatResource(eggs)} Eggs</p>
                {!canAffordEggs && <p style={{ color: '#F44336' }}>Not enough eggs</p>}
              </div>
            </div>
          </div>
          
          <p style={{ fontSize: '12px', margin: '15px 0 0 0', opacity: 0.7, textAlign: 'center' }}>
            You'll receive a random creature egg that can be evolved into a fully grown creature.
          </p>
        </div>
      )}

      {/* D) Sending transaction */}
      {mintingStage === 'sending' && (
        <div
          style={{
            background: 'rgba(255, 193, 7, 0.2)',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                border: '3px solid #FF3D00',
                borderTop: '3px solid transparent',
                animation: 'spin 1s linear infinite',
                marginRight: '15px'
              }}
            />
            <h3 style={{ margin: 0, color: '#FF3D00' }}>Sending Transaction to Wallet</h3>
          </div>
          
          <p>Please confirm the transaction in your Radix wallet.</p>
          <p style={{ fontSize: '14px', opacity: 0.7 }}>This will mint your creature egg directly to your account.</p>
          
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* E) Transaction pending */}
      {mintingStage === 'pending' && (
        <div
          style={{
            background: 'rgba(255, 193, 7, 0.2)',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                border: '3px solid #FF3D00',
                borderTop: '3px solid transparent',
                animation: 'spin 1s linear infinite',
                marginRight: '15px'
              }}
            />
            <h3 style={{ margin: 0, color: '#FF3D00' }}>Transaction Pending</h3>
          </div>
          
          <p>Your creature egg mint transaction is being processed on the Radix network.</p>
          <p style={{ fontSize: '14px', opacity: 0.7 }}>This may take 30-60 seconds to complete.</p>
          
          {intentHash && (
            <div style={{ 
              background: 'rgba(0, 0, 0, 0.2)', 
              padding: '10px', 
              borderRadius: '8px',
              marginTop: '15px',
              fontSize: '12px',
              wordBreak: 'break-all'
            }}>
              <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>Transaction Hash:</p>
              <p style={{ margin: 0 }}>{intentHash}</p>
            </div>
          )}
          
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* F) Transaction success */}
      {mintingStage === 'success' && (
        <div
          style={{
            background: 'rgba(76, 175, 80, 0.2)',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '50px', marginBottom: '10px' }}>🎉</div>
          <h3 style={{ margin: '0 0 20px 0', color: '#4CAF50' }}>Egg Minted Successfully!</h3>
          
          <p>Your creature egg has been minted and sent to your account.</p>
          
          <div style={{ 
            background: 'rgba(0, 0, 0, 0.2)', 
            padding: '15px', 
            borderRadius: '8px',
            margin: '20px 0',
            textAlign: 'left'
          }}>
            <h4 style={{ margin: '0 0 10px 0' }}>What's Next:</h4>
            <ol style={{ margin: 0, paddingLeft: '20px' }}>
              <li style={{ margin: '5px 0' }}>Visit the My Creatures section to see your new egg</li>
              <li style={{ margin: '5px 0' }}>Upgrade your egg's stats 3 times</li>
              <li style={{ margin: '5px 0' }}>Evolve your creature to the next form</li>
              <li style={{ margin: '5px 0' }}>Repeat until your creature reaches its final form!</li>
            </ol>
          </div>
          
          {intentHash && (
            <div style={{ 
              fontSize: '12px', 
              margin: '15px 0 0 0', 
              opacity: 0.7,
              wordBreak: 'break-all'
            }}>
              Transaction Hash: {intentHash}
            </div>
          )}
        </div>
      )}

      {/* G) Transaction failed */}
      {mintingStage === 'failed' && (
        <div
          style={{
            background: 'rgba(244, 67, 54, 0.2)',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center'
          }}
        >
          <h3 style={{ color: '#F44336', margin: '0 0 15px 0' }}>Transaction Failed</h3>
          
          <p>There was an error with your egg minting transaction.</p>
          
          {transactionDetails?.error_message && (
            <div style={{ 
              background: 'rgba(0, 0, 0, 0.2)', 
              padding: '10px', 
              borderRadius: '8px',
              margin: '15px 0',
              fontSize: '14px',
              wordBreak: 'break-all'
            }}>
              <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>Error Details:</p>
              <p style={{ margin: 0 }}>{transactionDetails.error_message}</p>
            </div>
          )}
          
          <p style={{ fontSize: '14px', margin: '15px 0 0 0' }}>
            You can try again or close this window and retry later.
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div
        style={{
          marginTop: '20px',
          display: 'flex',
          justifyContent: 'space-between'
        }}
      >
        {/* Close button for all stages */}
        <button 
          onClick={onClose}
          style={{
            backgroundColor: '#333',
            width: mintingStage === 'success' ? '100%' : 'auto'
          }}
        >
          {mintingStage === 'success' ? 'Close' : 'Cancel'}
        </button>
        
        {/* Try Again button for failed state */}
        {mintingStage === 'failed' && (
          <button
            onClick={() => setMintingStage('init')}
            style={{
              backgroundColor: '#F44336'
            }}
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default EggMinter;
