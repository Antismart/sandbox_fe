import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { baseSepolia } from 'viem/chains';

// Deployed QuestBoard contract address on Base Sepolia
export const QUEST_BOARD_ADDRESS = (process.env.NEXT_PUBLIC_QUEST_BOARD_ADDRESS as `0x${string}`) || '0x89eC8908164b9057C74bF4AD786231118C405369';

// Complete ABI for QuestBoard contract
export const QUEST_BOARD_ABI = [
  {
    type: 'function',
    name: 'createQuest',
    stateMutability: 'payable',
    inputs: [
      { name: 'deadline', type: 'uint96' },
      { name: 'title', type: 'string' },
      { name: 'uri', type: 'string' }
    ],
    outputs: [{ name: 'questId', type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'submit',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'questId', type: 'uint256' },
      { name: 'uri', type: 'string' }
    ],
    outputs: []
  },
  {
    type: 'function',
    name: 'selectWinners',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'questId', type: 'uint256' },
      { name: 'winnerIds', type: 'uint256[]' },
      { name: 'payoutAddress', type: 'address' }
    ],
    outputs: []
  },
  {
    type: 'function',
    name: 'questCount',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'quests',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [
      { name: 'creator', type: 'address' },
      { name: 'deadline', type: 'uint96' },
      { name: 'prizeWei', type: 'uint96' },
      { name: 'winnersSelected', type: 'bool' },
      { name: 'title', type: 'string' },
      { name: 'uri', type: 'string' }
    ]
  },
  {
    type: 'function',
    name: 'submissions',
    stateMutability: 'view',
    inputs: [{ name: 'questId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'submitter', type: 'address' },
          { name: 'uri', type: 'string' },
          { name: 'winner', type: 'bool' }
        ]
      }
    ]
  },
  // Events for log streaming / indexing
  {
    type: 'event',
    name: 'QuestCreated',
    inputs: [
      { name: 'questId', type: 'uint256', indexed: true },
      { name: 'creator', type: 'address', indexed: true },
      { name: 'deadline', type: 'uint256', indexed: false },
      { name: 'prizeWei', type: 'uint256', indexed: false },
      { name: 'title', type: 'string', indexed: false },
      { name: 'uri', type: 'string', indexed: false }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'SubmissionAdded',
    inputs: [
      { name: 'questId', type: 'uint256', indexed: true },
      { name: 'submissionId', type: 'uint256', indexed: true },
      { name: 'submitter', type: 'address', indexed: true },
      { name: 'uri', type: 'string', indexed: false }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'WinnersSelected',
    inputs: [
      { name: 'questId', type: 'uint256', indexed: true },
      { name: 'winnerIds', type: 'uint256[]', indexed: false }
    ],
    anonymous: false
  }
] as const;

// Viem clients
export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org')
});

export const walletClient = typeof window !== 'undefined' && (window as any).ethereum
  ? createWalletClient({ 
      chain: baseSepolia, 
      transport: custom((window as any).ethereum) 
    })
  : undefined;

// Type definitions based on contract
export interface OnChainQuest {
  id: string;
  creator: `0x${string}`;
  deadline: bigint;
  prizeWei: bigint;
  winnersSelected: boolean;
  title: string;
  uri: string;
}

export interface OnChainSubmission {
  submitter: `0x${string}`;
  uri: string;
  winner: boolean;
}
