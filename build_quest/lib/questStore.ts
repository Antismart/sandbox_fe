import { publicClient, walletClient, QUEST_BOARD_ADDRESS, QUEST_BOARD_ABI } from './contract';
import { baseSepolia } from 'viem/chains';
import { createWalletClient, custom, parseEventLogs } from 'viem';

// Types aligned with smart contract
export interface Quest {
  id: string;
  title: string;
  description: string;
  creator: `0x${string}`;
  prize: number; // in ETH
  deadline: string; // ISO string
  status: 'active' | 'completed';
  submissions: number;
}

export interface Submission {
  id: string;
  questId: string;
  participant: `0x${string}`;
  content: string;
  timestamp: string;
  winner: boolean;
}

export type DeadlineUrgency = 'low' | 'medium' | 'high';

// On-chain data types
interface OnChainQuest {
  creator: `0x${string}`;
  deadline: bigint;
  prizeWei: bigint;
  winnersSelected: boolean;
  title: string;
  uri: string;
}

interface OnChainSubmission {
  submitter: `0x${string}`;
  uri: string;
  winner: boolean;
}

// Convert on-chain quest to app format
function formatQuest(id: string, onChainQuest: OnChainQuest): Quest {
  return {
    id,
    title: onChainQuest.title,
    description: onChainQuest.uri, // Use URI as description for now
    creator: onChainQuest.creator,
    prize: Number(onChainQuest.prizeWei) / 1e18, // Convert wei to ETH
    deadline: new Date(Number(onChainQuest.deadline) * 1000).toISOString(),
    status: onChainQuest.winnersSelected ? 'completed' : 'active',
    submissions: 0 // Will be populated separately
  };
}

// Convert on-chain submission to app format
function formatSubmission(id: string, questId: string, onChainSub: OnChainSubmission): Submission {
  return {
    id,
    questId,
    participant: onChainSub.submitter,
    content: onChainSub.uri,
    timestamp: new Date().toISOString(), // Contract doesn't store timestamp
    winner: onChainSub.winner
  };
}

export class QuestStore {
  constructor() {
    if (!QUEST_BOARD_ADDRESS) {
      throw new Error('QuestBoard contract address not configured');
    }
  }

  async listQuests(): Promise<Quest[]> {
    try {
      // Read quest count from contract
      const questCount = await publicClient.readContract({
        address: QUEST_BOARD_ADDRESS,
        abi: QUEST_BOARD_ABI,
        functionName: 'questCount'
      }) as bigint;

      const quests: Quest[] = [];
      
      // Fetch all quests
      for (let i = BigInt(1); i <= questCount; i++) {
        const questTuple = await publicClient.readContract({
          address: QUEST_BOARD_ADDRESS,
          abi: QUEST_BOARD_ABI,
          functionName: 'quests',
          args: [i]
        }) as readonly [`0x${string}`, bigint, bigint, boolean, string, string];

        const questData: OnChainQuest = {
          creator: questTuple[0],
          deadline: questTuple[1],
          prizeWei: questTuple[2],
          winnersSelected: questTuple[3],
          title: questTuple[4],
          uri: questTuple[5]
        };

        // Get submission count for this quest
        const submissions = await publicClient.readContract({
          address: QUEST_BOARD_ADDRESS,
          abi: QUEST_BOARD_ABI,
          functionName: 'submissions',
          args: [i]
        }) as OnChainSubmission[];

        const quest = formatQuest(i.toString(), questData);
        quest.submissions = submissions.length;
        quests.push(quest);
      }

      return quests;
    } catch (error) {
      console.error('Error fetching quests from contract:', error);
      throw new Error('Failed to fetch quests from blockchain');
    }
  }

  async getQuest(id: string): Promise<Quest | null> {
    try {
      const questTuple = await publicClient.readContract({
        address: QUEST_BOARD_ADDRESS,
        abi: QUEST_BOARD_ABI,
        functionName: 'quests',
        args: [BigInt(id)]
      }) as readonly [`0x${string}`, bigint, bigint, boolean, string, string];

      const questData: OnChainQuest = {
        creator: questTuple[0],
        deadline: questTuple[1],
        prizeWei: questTuple[2],
        winnersSelected: questTuple[3],
        title: questTuple[4],
        uri: questTuple[5]
      };

      if (!questData || questData.creator === '0x0000000000000000000000000000000000000000') {
        return null;
      }

      const submissions = await publicClient.readContract({
        address: QUEST_BOARD_ADDRESS,
        abi: QUEST_BOARD_ABI,
        functionName: 'submissions',
        args: [BigInt(id)]
      }) as OnChainSubmission[];

      const quest = formatQuest(id, questData);
      quest.submissions = submissions.length;
      return quest;
    } catch (error) {
      console.error('Error fetching quest from contract:', error);
      return null;
    }
  }

  async createQuest(
    quest: Omit<Quest, 'id' | 'status' | 'submissions'>,
    account: `0x${string}`,
    walletClient: any
  ): Promise<string> {
    if (!walletClient || !account) {
      throw new Error('Wallet not connected. Please connect your wallet to create a quest.');
    }

    try {
      const deadline = Math.floor(new Date(quest.deadline).getTime() / 1000);
      const prizeWei = BigInt(Math.floor(quest.prize * 1e18));

      console.log('Creating quest on contract with account:', account);

      // Ensure injected wallet is on Base Sepolia (84532)
      let writer = walletClient;
      const injected = typeof window !== 'undefined' ? (window as any).ethereum : undefined;
      if (injected) {
        try {
          const currentHex = await injected.request({ method: 'eth_chainId' });
          if (currentHex !== '0x14a34') {
            try {
              await injected.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x14a34' }] });
            } catch (err: any) {
              if (err?.code === 4902) {
                // Add Base Sepolia if missing
                await injected.request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: '0x14a34',
                    chainName: 'Base Sepolia',
                    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                    rpcUrls: [process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'],
                    blockExplorerUrls: ['https://sepolia.basescan.org']
                  }]
                });
              } else {
                throw err;
              }
            }
          }
          // Rebuild a fresh wallet client on the switched chain to avoid stale chain state
          writer = createWalletClient({ chain: baseSepolia, transport: custom(injected) });
          // tiny delay for providers that need a moment
          await new Promise((r) => setTimeout(r, 150));
        } catch (switchErr) {
          console.warn('Network switch to Base Sepolia failed or was rejected:', switchErr);
        }
      }

  const { request } = await publicClient.simulateContract({
        address: QUEST_BOARD_ADDRESS,
        abi: QUEST_BOARD_ABI,
        functionName: 'createQuest',
        args: [BigInt(deadline), quest.title, quest.description],
        value: prizeWei,
        account
      });

  const hash = await (writer || walletClient).writeContract({ ...request, chain: baseSepolia });
      
      // Wait for transaction receipt to get quest ID
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      // Parse logs to get the quest ID from QuestCreated event
      const questCreatedLog = receipt.logs.find(log => {
        try {
          const decoded = parseEventLogs({
            abi: QUEST_BOARD_ABI,
            logs: [log]
          })[0];
          return decoded.eventName === 'QuestCreated';
        } catch {
          return false;
        }
      });

      if (questCreatedLog) {
        const decoded = parseEventLogs({
          abi: QUEST_BOARD_ABI,
          logs: [questCreatedLog]
        })[0];
        return decoded.args.questId.toString();
      }

      // Fallback: get current quest count
      const questCount = await publicClient.readContract({
        address: QUEST_BOARD_ADDRESS,
        abi: QUEST_BOARD_ABI,
        functionName: 'questCount'
      }) as bigint;

      return questCount.toString();
    } catch (error) {
      console.error('Error creating quest on contract:', error);
      throw new Error('Failed to create quest on blockchain');
    }
  }

  async listSubmissions(questId: string): Promise<Submission[]> {
    try {
      const submissions = await publicClient.readContract({
        address: QUEST_BOARD_ADDRESS,
        abi: QUEST_BOARD_ABI,
        functionName: 'submissions',
        args: [BigInt(questId)]
      }) as OnChainSubmission[];

      return submissions.map((sub, index) => 
        formatSubmission(index.toString(), questId, sub)
      );
    } catch (error) {
      console.error('Error fetching submissions from contract:', error);
      return [];
    }
  }

  async addSubmission(questId: string, account: `0x${string}`, uri: string, walletClientParam: any): Promise<string> {
    if (!walletClientParam || !account) {
      throw new Error('Wallet not connected. Please connect your wallet to submit.');
    }

    try {
      // Ensure correct network & rebuild writer if needed
      let writer = walletClientParam;
      const injected = typeof window !== 'undefined' ? (window as any).ethereum : undefined;
      if (injected) {
        try {
          const currentHex = await injected.request({ method: 'eth_chainId' });
          if (currentHex !== '0x14a34') {
            try {
              await injected.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x14a34' }] });
            } catch (err: any) {
              if (err?.code === 4902) {
                await injected.request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: '0x14a34',
                    chainName: 'Base Sepolia',
                    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                    rpcUrls: [process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'],
                    blockExplorerUrls: ['https://sepolia.basescan.org']
                  }]
                });
              } else {
                throw err;
              }
            }
          }
          writer = createWalletClient({ chain: baseSepolia, transport: custom(injected) });
          await new Promise((r) => setTimeout(r, 150));
        } catch (switchErr) {
          console.warn('Network switch to Base Sepolia failed or was rejected (submit):', switchErr);
        }
      }

      const { request } = await publicClient.simulateContract({
        address: QUEST_BOARD_ADDRESS,
        abi: QUEST_BOARD_ABI,
        functionName: 'submit',
        args: [BigInt(questId), uri],
        account
      });

      const hash = await (writer || walletClientParam).writeContract({ ...request, chain: baseSepolia });
      await publicClient.waitForTransactionReceipt({ hash });

      const submissions = await publicClient.readContract({
        address: QUEST_BOARD_ADDRESS,
        abi: QUEST_BOARD_ABI,
        functionName: 'submissions',
        args: [BigInt(questId)]
      }) as OnChainSubmission[];

      return (submissions.length - 1).toString();
    } catch (error) {
      console.error('Error adding submission to contract:', error);
      throw new Error('Failed to submit to blockchain');
    }
  }

  async selectWinners(questId: string, winnerIds: string[], account: `0x${string}`, walletClientParam: any): Promise<void> {
    if (!walletClientParam || !account) {
      throw new Error('Wallet not connected. Please connect your wallet to select winners.');
    }

    try {
      // Ensure correct network & rebuild writer if needed
      let writer = walletClientParam;
      const injected = typeof window !== 'undefined' ? (window as any).ethereum : undefined;
      if (injected) {
        try {
          const currentHex = await injected.request({ method: 'eth_chainId' });
          if (currentHex !== '0x14a34') {
            try {
              await injected.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x14a34' }] });
            } catch (err: any) {
              if (err?.code === 4902) {
                await injected.request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: '0x14a34',
                    chainName: 'Base Sepolia',
                    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                    rpcUrls: [process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'],
                    blockExplorerUrls: ['https://sepolia.basescan.org']
                  }]
                });
              } else {
                throw err;
              }
            }
          }
          writer = createWalletClient({ chain: baseSepolia, transport: custom(injected) });
          await new Promise((r) => setTimeout(r, 150));
        } catch (switchErr) {
          console.warn('Network switch to Base Sepolia failed or was rejected (selectWinners):', switchErr);
        }
      }

      const winnerIndices = winnerIds.map(id => BigInt(id));
      const { request } = await publicClient.simulateContract({
        address: QUEST_BOARD_ADDRESS,
        abi: QUEST_BOARD_ABI,
        functionName: 'selectWinners',
        args: [BigInt(questId), winnerIndices, account],
        account
      });

      const hash = await (writer || walletClientParam).writeContract({ ...request, chain: baseSepolia });
      await publicClient.waitForTransactionReceipt({ hash });
    } catch (error) {
      console.error('Error selecting winners on contract:', error);
      throw new Error('Failed to select winners on blockchain');
    }
  }

  deadlineUrgency(deadline: string): DeadlineUrgency {
    const now = Date.now();
    const deadlineTime = new Date(deadline).getTime();
    const timeLeft = deadlineTime - now;
    const hoursLeft = timeLeft / (1000 * 60 * 60);

    if (hoursLeft <= 24) return 'high';
    if (hoursLeft <= 72) return 'medium';
    return 'low';
  }
}

// Export singleton instance
export const questStore = new QuestStore();
