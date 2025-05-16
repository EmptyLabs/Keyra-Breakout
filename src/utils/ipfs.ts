import { create, IPFSHTTPClient } from 'ipfs-http-client'; // Import IPFSHTTPClient type

// Configure IPFS connection details
// Default IPFS API endpoint (correct port is 5001    !!dont change like us XDDD)
const ipfsUrl = process.env.REACT_APP_IPFS_URL || 'http://localhost:5001/api/v0';

// Connection state management
let mockEnabled = false; // Set to false to use real IPFS
let mockCidCounter = 1;
let ipfs: IPFSHTTPClient | undefined;
let connectionAttempts = 0;
const MAX_RETRY_ATTEMPTS = 3;
const RECONNECT_DELAY = 2000; // 2 seconds between retries
let isConnecting = false;

/**
 * Initialize IPFS client with retry logic
 * @returns Promise<IPFSHTTPClient | undefined>
 */
const initializeIpfs = async (): Promise<IPFSHTTPClient | undefined> => {
  if (isConnecting) return ipfs; // Prevent multiple simultaneous connection attempts
  
  isConnecting = true;
  connectionAttempts++;
  
  try {
    // Configure for local IPFS daemon with timeout
    const client = create({
      url: ipfsUrl,
      timeout: 10000, // 10 seconds timeout for API calls
    });
    
    // Validate connection by making a simple API call
    const nodeId = await client.id();
    console.log(`IPFS connected successfully. Node ID: ${nodeId.id.toString()}`);
    console.log(`Connected to IPFS daemon at: ${ipfsUrl}`);
    
    // Reset connection attempts on successful connection
    connectionAttempts = 0;
    ipfs = client;
    
    return client;
  } catch (error) {
    console.error(`IPFS connection attempt ${connectionAttempts} failed:`, error);
    
    if (connectionAttempts < MAX_RETRY_ATTEMPTS) {
      console.log(`Retrying IPFS connection in ${RECONNECT_DELAY/1000} seconds...`);
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, RECONNECT_DELAY));
      isConnecting = false;
      return initializeIpfs(); // Recursive retry
    } else {
      console.error(`Failed to connect to IPFS after ${MAX_RETRY_ATTEMPTS} attempts.`);
      console.warn('Please make sure your IPFS daemon is running with the command: ipfs daemon');
      console.warn('If you have not installed IPFS, please follow instructions at: https://docs.ipfs.tech/install/');
      isConnecting = false;
      return undefined;
    }
  } finally {
    isConnecting = false;
  }
};

// Initial connection attempt
initializeIpfs().catch(error => {
  console.error('Initial IPFS connection setup failed:', error);
});

/**
 * Force reconnection to IPFS daemon
 * Useful when the daemon was started after the application
 */
export const reconnectToIpfs = async (): Promise<boolean> => {
  console.log('Forcing IPFS reconnection...');
  connectionAttempts = 0; // Reset attempts for a fresh start
  ipfs = undefined; // Clear existing client
  
  try {
    const client = await initializeIpfs();
    return !!client;
  } catch (error) {
    console.error('IPFS reconnection failed:', error);
    return false;
  }
};

/**
 * Uploads data to IPFS.
 * @param data The data to upload (as a string or Buffer).
 * @returns A Promise that resolves with the IPFS CID as a string, or throws an error if IPFS is not connected or upload fails.
 */
export const uploadToIpfs = async (data: string | Buffer): Promise<string> => {
  // In real mode, we don't use mock functionality
  if (mockEnabled) {
    console.log('Mock IPFS: Simulating upload');
    const mockCid = `mockCid${mockCidCounter++}`;
    // Store in localStorage to simulate data persistence
    localStorage.setItem(mockCid, typeof data === 'string' ? data : data.toString());
    return mockCid;
  }

  // If not connected, try to initialize
  if (!ipfs) {
    ipfs = await initializeIpfs();
    if (!ipfs) {
      throw new Error('IPFS client is not connected. Please make sure your IPFS daemon is running.');
    }
  }
  
  try {
    const result = await ipfs.add(data);
    const cid = result.cid.toString();
    console.log('Uploaded to IPFS:', cid);
    
    // Pin the content to ensure it remains available
    try {
      await ipfs.pin.add(result.cid);
      console.log('Pinned content with CID:', cid);
    } catch (pinError) {
      console.warn('Failed to pin content, but upload was successful:', pinError);
    }
    
    return cid;
  } catch (error) {
    console.error('Failed to upload data to IPFS:', error);
    
    // If the error seems like a connection issue, try to reconnect
    if (error instanceof Error && 
        (error.message.includes('connection') || error.message.includes('timeout'))) {
      console.log('Attempting to reconnect to IPFS...');
      await reconnectToIpfs();
      if (ipfs) {
        console.log('Retrying upload after reconnection...');
        const result = await ipfs.add(data);
        const cid = result.cid.toString();
        console.log('Upload successful after reconnection. CID:', cid);
        return cid;
      }
    }
    
    throw new Error('Failed to upload data to IPFS. Please check if your IPFS daemon is running correctly.');
  }
};

/**
 * Retrieves data from IPFS using its CID.
 * @param cid The IPFS CID of the data to retrieve.
 * @returns A Promise that resolves with the retrieved data as a string, or null if retrieval fails or IPFS is not connected.
 */
export const retrieveFromIpfs = async (cid: string): Promise<string | null> => {
  // In real mode, we don't use mock functionality
  if (mockEnabled) {
    console.log(`Mock IPFS: Retrieving data for CID ${cid}`);
    const data = localStorage.getItem(cid);
    if (!data) {
      console.error(`Mock IPFS: No data found for CID ${cid}`);
      return null;
    }
    return data;
  }

  // If not connected, try to initialize
  if (!ipfs) {
    ipfs = await initializeIpfs();
    if (!ipfs) {
      console.error('IPFS client is not connected. Cannot retrieve data. Please make sure your IPFS daemon is running.');
      return null;
    }
  }
  
  try {
    const chunks = [];
    // ipfs.cat returns an async iterable
    for await (const chunk of ipfs.cat(cid)) {
      chunks.push(chunk);
    }
    const data = Buffer.concat(chunks).toString('utf8');
    console.log(`Retrieved data from IPFS for CID ${cid}`);
    return data;
  } catch (error) {
    console.error(`Failed to retrieve data from IPFS for CID ${cid}:`, error);
    
    // If the error seems like a connection issue, try to reconnect
    if (error instanceof Error && 
        (error.message.includes('connection') || error.message.includes('timeout'))) {
      console.log('Attempting to reconnect to IPFS before retrying retrieval...');
      await reconnectToIpfs();
      if (ipfs) {
        console.log(`Retrying retrieval for CID ${cid} after reconnection...`);
        try {
          const chunks = [];
          for await (const chunk of ipfs.cat(cid)) {
            chunks.push(chunk);
          }
          const data = Buffer.concat(chunks).toString('utf8');
          console.log(`Retrieval successful after reconnection. CID: ${cid}`);
          return data;
        } catch (retryError) {
          console.error(`Failed to retrieve data after reconnection:`, retryError);
        }
      }
    }
    
    return null;
  }
};

/**
 * Checks if the IPFS daemon is running and accessible.
 * @returns A Promise that resolves to true if IPFS is connected, false otherwise.
 */
export const checkIpfsConnection = async (): Promise<boolean> => {
  // If client doesn't exist, try to initialize
  if (!ipfs) {
    ipfs = await initializeIpfs();
  }
  
  if (!ipfs) {
    console.error('IPFS connection check failed: ipfs client not initialized after connection attempt.');
    return false;
  }
  
  try {
    // Try to get the IPFS node ID as a simple connection test
    const nodeInfo = await ipfs.id();
    console.log('IPFS connected. Node ID:', nodeInfo.id.toString());
    return true;
  } catch (error) {
    // Log the specific error here
    console.error('IPFS connection check failed with error:', error);
    
    // If the error seems like a connection issue, try to reconnect
    if (error instanceof Error && 
        (error.message.includes('connection') || error.message.includes('timeout'))) {
      console.log('Attempting to reconnect to IPFS during connection check...');
      const reconnected = await reconnectToIpfs();
      return reconnected;
    }
    
    return false;
  }
};

// Export reconnection function for components that need to force a check
export const forceIpfsConnectionCheck = reconnectToIpfs;
