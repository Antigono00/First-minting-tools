// src/utils/NFTService.js
import axios from 'axios';

/**
 * Service class for handling NFT-related API calls
 */
class NFTService {
  /**
   * Fetch all NFTs for a user's account
   * @param {string} accountAddress - The Radix account address
   * @returns {Promise<Array>} Array of NFT objects
   */
  static async getUserNFTs(accountAddress) {
    try {
      const response = await axios.post('/api/getUserNFTs', { accountAddress });
      return response.data.nfts || [];
    } catch (error) {
      console.error('Error fetching user NFTs:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch NFTs');
    }
  }

  /**
   * Fetch detailed information for a specific NFT
   * @param {string} resourceAddress - The NFT resource address
   * @param {string} nftId - The specific NFT ID
   * @returns {Promise<Object>} Detailed NFT data
   */
  static async getNFTDetails(resourceAddress, nftId) {
    try {
      const response = await axios.post('/api/getNFTDetails', {
        resourceAddress,
        nftId
      });
      return response.data.nft_details || null;
    } catch (error) {
      console.error('Error fetching NFT details:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch NFT details');
    }
  }

  /**
   * Create transaction manifest for upgrading NFT stats
   * @param {string} accountAddress - The user's account address
   * @param {string} nftId - The NFT ID
   * @param {Object} statUpgrades - The stat upgrades to apply
   * @param {string} paymentMethod - 'xrd' or 'eggs'
   * @returns {Promise<Object>} Transaction manifest and info
   */
  static async getUpgradeStatsManifest(accountAddress, nftId, statUpgrades, paymentMethod) {
    try {
      const response = await axios.post('/api/getUpgradeStatsManifest', {
        accountAddress,
        nftId,
        statUpgrades,
        paymentMethod
      });
      return response.data;
    } catch (error) {
      console.error('Error getting upgrade stats manifest:', error);
      throw new Error(error.response?.data?.error || 'Failed to get upgrade manifest');
    }
  }

  /**
   * Create transaction manifest for evolving a creature
   * @param {string} accountAddress - The user's account address
   * @param {string} nftId - The NFT ID
   * @param {string} paymentMethod - 'xrd' or 'eggs'
   * @returns {Promise<Object>} Transaction manifest and info
   */
  static async getEvolveCreatureManifest(accountAddress, nftId, paymentMethod) {
    try {
      const response = await axios.post('/api/getEvolveCreatureManifest', {
        accountAddress,
        nftId,
        paymentMethod
      });
      return response.data;
    } catch (error) {
      console.error('Error getting evolve creature manifest:', error);
      throw new Error(error.response?.data?.error || 'Failed to get evolve manifest');
    }
  }

  /**
   * Check transaction status
   * @param {string} intentHash - The transaction intent hash
   * @returns {Promise<Object>} Transaction status info
   */
  static async checkTransactionStatus(intentHash) {
    try {
      const response = await axios.post('/api/checkNFTTransactionStatus', {
        intentHash
      });
      return response.data;
    } catch (error) {
      console.error('Error checking transaction status:', error);
      throw new Error(error.response?.data?.error || 'Failed to check transaction status');
    }
  }

  /**
   * Create transaction manifest for combining two creatures
   * @param {string} accountAddress - The user's account address
   * @param {string} primaryNftId - The primary NFT ID
   * @param {string} secondaryNftId - The secondary NFT ID
   * @returns {Promise<Object>} Transaction manifest and info
   */
  static async getCombineCreaturesManifest(accountAddress, primaryNftId, secondaryNftId) {
    try {
      const response = await axios.post('/api/getCombineCreaturesManifest', {
        accountAddress,
        primaryNftId,
        secondaryNftId
      });
      return response.data;
    } catch (error) {
      console.error('Error getting combine creatures manifest:', error);
      throw new Error(error.response?.data?.error || 'Failed to get combine manifest');
    }
  }
}

export default NFTService;
