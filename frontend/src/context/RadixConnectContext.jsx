// src/context/RadixConnectContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { RadixDappToolkit, RadixNetwork, DataRequestBuilder } from '@radixdlt/radix-dapp-toolkit';

// 1) Create the context
export const RadixConnectContext = createContext(null);

// 2) Hook to use the Radix Connect context
export const useRadixConnect = () => {
  const context = useContext(RadixConnectContext);
  if (!context) {
    throw new Error('useRadixConnect must be used within a RadixConnectProvider');
  }
  return context;
};

// 3) Provider component
export const RadixConnectProvider = ({ children, dAppDefinitionAddress }) => {
  const [rdt, setRdt] = useState(null);
  const [connected, setConnected] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Initialize the Radix dApp Toolkit
  useEffect(() => {
    const toolkit = RadixDappToolkit(
      {
        dAppDefinitionAddress,
        networkId: RadixNetwork.Mainnet,
        applicationName: 'Corvax Lab',
        applicationVersion: '1.0.0',
      }
    );

    // (Optional) set the connect button theme
    toolkit.buttonApi.setTheme('black'); // or 'white'
    toolkit.buttonApi.setMode('dark');   // or 'light'

    // Configure the data request to include at least 1 account
    toolkit.walletApi.setRequestData(
      DataRequestBuilder.accounts().atLeast(1)
    );

    // Provide connect response callback
    toolkit.walletApi.provideConnectResponseCallback((result) => {
      if (result.isErr()) {
        console.error('Connect error:', result.error);
      } else {
        console.log('Connect success:', result.value);
        setConnected(true);
      }
    });

    setRdt(toolkit);

    // Clean up on unmount
    return () => {
      toolkit.destroy();
    };
  }, [dAppDefinitionAddress]);

  // Handle connect/disconnect events + subscribe to wallet data
  useEffect(() => {
    if (!rdt) return;

    // 1) Listen for the built-in custom element events
    const handleConnect = () => {
      console.log('Connected to Radix wallet');
      setConnected(true);
    };
    const handleDisconnect = () => {
      console.log('Disconnected from Radix wallet');
      setConnected(false);
      setAccounts([]);
      setSelectedAccount(null);
    };

    document.addEventListener('radix-connect-button:onConnect', handleConnect);
    document.addEventListener('radix-connect-button:onDisconnect', handleDisconnect);

    // 2) Subscribe to wallet data changes
    const subscription = rdt.walletApi.walletData$.subscribe((walletData) => {
      if (walletData && walletData.accounts) {
        setConnected(true);
        setAccounts(walletData.accounts);

        if (walletData.accounts.length > 0 && !selectedAccount) {
          setSelectedAccount(walletData.accounts[0]);
        }
      }
    });

    // 3) Check initial wallet state
    const initialWalletData = rdt.walletApi.getWalletData();
    if (initialWalletData && initialWalletData.accounts && initialWalletData.accounts.length > 0) {
      setConnected(true);
      setAccounts(initialWalletData.accounts);
      setSelectedAccount(initialWalletData.accounts[0]);
    }

    // Cleanup
    return () => {
      document.removeEventListener('radix-connect-button:onConnect', handleConnect);
      document.removeEventListener('radix-connect-button:onDisconnect', handleDisconnect);
      subscription.unsubscribe();
    };
  }, [rdt, selectedAccount]);

  // Function to explicitly request account sharing again
  const updateAccountSharing = async () => {
    if (!rdt) return;
    try {
      const result = await rdt.walletApi.sendRequest();
      if (result.isErr()) {
        console.error('Error updating account sharing:', result.error);
        return;
      }
      console.log('Account sharing updated:', result.value);
    } catch (error) {
      console.error('Error sending request:', error);
    }
  };

  // Provide everything to children
  const contextValue = {
    rdt,
    connected,
    accounts,
    selectedAccount,
    setSelectedAccount,
    updateAccountSharing
  };

  return (
    <RadixConnectContext.Provider value={contextValue}>
      {children}
    </RadixConnectContext.Provider>
  );
};
