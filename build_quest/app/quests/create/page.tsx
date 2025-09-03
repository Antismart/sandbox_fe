"use client";
import { useState } from 'react';
import { questStore } from '@/lib/questStore';
import { useRouter } from 'next/navigation';
import { useAccount, useWalletClient, useChainId, useSwitchChain } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { useToast } from '@/app/components/ToastProvider';


	export default function CreateQuest() {
		const [title, setTitle] = useState('');
		const [description, setDescription] = useState('');
		const [prize, setPrize] = useState('0.05');
		const [durationHrs, setDurationHrs] = useState(12);
		const [isSubmitting, setIsSubmitting] = useState(false);
		const router = useRouter();
		const { address } = useAccount();
		const { data: walletClient } = useWalletClient();
		const { pushToast } = useToast();
	const chainId = useChainId();
	const { switchChainAsync, isPending: isSwitching } = useSwitchChain();

		async function handleSubmit(e:React.FormEvent){
			e.preventDefault();
			if (!address || !walletClient) {
				pushToast('Please connect your wallet first', 'danger');
				return;
			}

			// Ensure wallet is on Base Sepolia before writing
			if (chainId !== baseSepolia.id) {
				try {
					await switchChainAsync({ chainId: baseSepolia.id });
					// tiny delay to let wallet client update
					await new Promise((r) => setTimeout(r, 300));
				} catch (err) {
					pushToast('Please switch your wallet to Base Sepolia and try again.', 'danger');
					return;
				}
			}

			setIsSubmitting(true);
			try {
				const deadline = new Date(Date.now() + durationHrs * 60 * 60 * 1000).toISOString();
				const questId = await questStore.createQuest({ 
					title, 
					description, 
					prize: parseFloat(prize), 
					deadline, 
					creator: address 
				}, address, walletClient);
				pushToast('Quest created successfully!', 'success');
				router.push(`/quests/${questId}`);
			} catch (error) {
				console.error('Failed to create quest:', error);
				pushToast('Failed to create quest. Please try again.', 'danger');
			} finally {
				setIsSubmitting(false);
			}
		}

		return (
			<div className="w-full max-w-md mx-auto px-4 py-5 space-y-5">
				<header className="flex items-center justify-between">
					<h1 className="text-base font-semibold">New Quest</h1>
					<button onClick={()=>router.back()} className="text-[10px] text-[var(--app-foreground-muted)] hover:text-[var(--app-foreground)]">Back</button>
				</header>
				{chainId && chainId !== baseSepolia.id && (
					<div className="p-3 text-xs rounded-md border border-yellow-700 bg-yellow-950/40 text-yellow-200 flex items-center justify-between gap-3">
						<span>You are on the wrong network. Please switch to Base Sepolia.</span>
						<button
							type="button"
							onClick={() => switchChainAsync({ chainId: baseSepolia.id }).catch(() => pushToast('Network switch was rejected.', 'danger'))}
							className="px-2 py-1 rounded bg-[var(--app-accent)] text-white"
						>
							Switch
						</button>
					</div>
				)}
				<form onSubmit={handleSubmit} className="space-y-5 card">
					<div className="space-y-2">
						<label className="block text-[10px] uppercase tracking-wide text-[var(--app-foreground-muted)]">Title</label>
						<input value={title} onChange={e=>setTitle(e.target.value)} required className="w-full px-3 py-2 rounded-md bg-[#1c2030] text-xs outline-none focus:ring-1 ring-[var(--app-accent)] border border-[#293044]" placeholder="Concise quest title" />
					</div>
					<div className="space-y-2">
						<label className="block text-[10px] uppercase tracking-wide text-[var(--app-foreground-muted)]">Description</label>
						<textarea value={description} onChange={e=>setDescription(e.target.value)} required rows={5} className="w-full px-3 py-2 rounded-md bg-[#1c2030] text-xs resize-none outline-none focus:ring-1 ring-[var(--app-accent)] border border-[#293044]" placeholder="What do builders need to deliver?" />
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<label className="block text-[10px] uppercase tracking-wide text-[var(--app-foreground-muted)]">Prize (ETH)</label>
							<input 
								type="number" 
								value={prize} 
								onChange={e=>setPrize(e.target.value)} 
								className="w-full px-3 py-2 rounded-md bg-[#1c2030] text-xs outline-none focus:ring-1 ring-[var(--app-accent)] border border-[#293044]" 
								placeholder="0.05"
							/>
						</div>
						<div className="space-y-2">
							<label className="block text-[10px] uppercase tracking-wide text-[var(--app-foreground-muted)]">Duration (hrs)</label>
							<input type="number" min={1} max={168} value={durationHrs} onChange={e=>setDurationHrs(Number(e.target.value))} className="w-full px-3 py-2 rounded-md bg-[#1c2030] text-xs outline-none focus:ring-1 ring-[var(--app-accent)] border border-[#293044]" />
						</div>
					</div>
					<div className="flex justify-end">
						<button 
							type="submit" 
							disabled={isSubmitting || isSwitching}
							className="px-4 py-2 rounded-md text-xs font-medium bg-[var(--app-accent)] hover:bg-[var(--app-accent-hover)] active:bg-[var(--app-accent-active)] text-white disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isSubmitting ? 'Creating...' : isSwitching ? 'Switching...' : 'Create'}
						</button>
					</div>
				</form>
			</div>
		);
	}
