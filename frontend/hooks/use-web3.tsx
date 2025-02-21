"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "@/lib/web3/config";
import { useToast } from "./use-toast";

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface Web3ContextType {
  address: string | null;
  isConnected: boolean;
  contract: ethers.Contract | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const Web3Context = createContext<Web3ContextType>({
  address: null,
  isConnected: false,
  contract: null,
  provider: null,
  signer: null,
  connect: async () => {},
  disconnect: () => {},
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const { toast } = useToast();

  // Function to connect wallet
  const connect = async () => {
    if (!window?.ethereum) {
      toast({
        title: "MetaMask Required",
        description: "Please install MetaMask to use this application.",
        variant: "destructive",
      });
      return;
    }

    try {
      const providerInstance = new ethers.BrowserProvider(window.ethereum);
      await providerInstance.send("eth_requestAccounts", []);
      const signerInstance = await providerInstance.getSigner();
      const userAddress = await signerInstance.getAddress();
      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerInstance);

      setProvider(providerInstance);
      setSigner(signerInstance);
      setAddress(userAddress);
      setContract(contractInstance);

      // Store wallet connection in localStorage
      localStorage.setItem("connectedWallet", userAddress);

      toast({
        title: "Connected",
        description: `Wallet connected: ${userAddress}`,
      });
    } catch (error) {
      console.error("Wallet connection failed:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to disconnect wallet
  const disconnect = () => {
    setProvider(null);
    setSigner(null);
    setAddress(null);
    setContract(null);
    localStorage.removeItem("connectedWallet");

    toast({
      title: "Disconnected",
      description: "Wallet disconnected successfully.",
    });
  };

  // Auto-reconnect if wallet was connected before
  useEffect(() => {
    const autoConnect = async () => {
      const savedAddress = localStorage.getItem("connectedWallet");
      if (savedAddress && window.ethereum) {
        try {
          const providerInstance = new ethers.BrowserProvider(window.ethereum);
          const signerInstance = await providerInstance.getSigner();
          const userAddress = await signerInstance.getAddress();
          const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerInstance);

          setProvider(providerInstance);
          setSigner(signerInstance);
          setAddress(userAddress);
          setContract(contractInstance);

          toast({
            title: "Reconnected",
            description: `Wallet reconnected: ${userAddress}`,
          });
        } catch (error) {
          console.error("Auto-reconnect failed:", error);
          localStorage.removeItem("connectedWallet");
        }
      }
    };

    autoConnect();
  }, []);

  // Handle account and network changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect();
        } else {
          setAddress(accounts[0]);
          localStorage.setItem("connectedWallet", accounts[0]);
        }
      });

      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners();
      }
    };
  }, []);

  return (
    <Web3Context.Provider
      value={{
        address,
        isConnected: !!address,
        contract,
        provider,
        signer,
        connect,
        disconnect,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export const useWeb3 = () => useContext(Web3Context);
