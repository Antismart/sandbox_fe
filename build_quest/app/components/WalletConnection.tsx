'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useToast } from './ToastProvider';

export function WalletConnection() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { pushToast } = useToast();

  const handleConnect = () => {
    const connector = connectors[0]; // Use the first available connector
    if (connector) {
      connect({ connector }, {
        onSuccess: () => {
          pushToast('Wallet connected successfully!', 'success');
        },
        onError: (error) => {
          pushToast(`Failed to connect wallet: ${error.message}`, 'error');
        }
      });
    }
  };

  const handleDisconnect = () => {
    disconnect();
    pushToast('Wallet disconnected', 'info');
  };

  const shortAddress = (addr: string) => 
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">
          {shortAddress(address)}
        </span>
        <button
          onClick={handleDisconnect}
          className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isPending}
      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50"
    >
      {isPending ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}
