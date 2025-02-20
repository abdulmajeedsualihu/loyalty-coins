"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "@/lib/web3/config";
import { useToast } from "./use-toast";

interface Web3ContextType {
  address: string | null;
  isConnected: boolean;
  contract: ethers.Contract | null;
  provider: ethers.Provider | null;
  signer: ethers.Signer | null;
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
  const [provider, setProvider] = useState<ethers.Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const { toast } = useToast();

  const connect = async () => {
    if (typeof window.ethereum === "undefined") {
      toast({
        title: "MetaMask Required",
        description: "Please install MetaMask to use this application.",
        variant: "destructive",
      });
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      setProvider(provider);
      setSigner(signer);
      setAddress(address);
      setContract(contract);

      toast({
        title: "Connected",
        description: "Wallet connected successfully!",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const disconnect = () => {
    setProvider(null);
    setSigner(null);
    setAddress(null);
    setContract(null);
  };

  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      window.ethereum.on("accountsChanged", () => {
        disconnect();
      });
      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }

    return () => {
      if (typeof window.ethereum !== "undefined") {
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