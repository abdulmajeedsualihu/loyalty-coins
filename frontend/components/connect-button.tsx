import { Button } from "@/components/ui/button";
import { useWeb3 } from "@/hooks/use-web3";

export function ConnectButton() {
  const { address, isConnected, connect, disconnect } = useWeb3();

  if (isConnected) {
    return (
      <Button variant="outline" onClick={disconnect}>
        {address?.slice(0, 6)}...{address?.slice(-4)}
      </Button>
    );
  }

  return <Button onClick={connect}>Connect Wallet</Button>;
}