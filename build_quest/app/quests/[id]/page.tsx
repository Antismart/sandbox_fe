"use client";
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/app/components/ToastProvider';
import { questStore } from '@/lib/questStore';
import { isDeadlinePassed, deadlineUrgency, Submission, Quest } from '@/lib/mockStore';
import { useAccount, useWalletClient, useChainId, useSwitchChain } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';

// Helper function to shorten addresses
function shortAddr(addr: string): string {
	if (!addr) return 'anon';
	return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// Compact badge component
function Badge({ children, color = 'indigo' }: { children: React.ReactNode; color?: 'indigo'|'rose'|'green'|'slate' }) {
	const palette: Record<string,string> = {
		indigo: 'bg-indigo-500/15 text-indigo-300 border-indigo-400/30',
		rose: 'bg-rose-500/15 text-rose-300 border-rose-400/30',
		green: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
		slate: 'bg-slate-500/15 text-slate-300 border-slate-400/30'
	};
	return <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${palette[color]}`}>{children}</span>;
}

function SubmissionItem({ s, picked, selectMode, onToggle }:{ s:Submission; picked:boolean; selectMode:boolean; onToggle:()=>void }) {
	const handleKey = (e:React.KeyboardEvent) => {
		if(!selectMode) return;
		if(e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onToggle();
		}
	};
	return (
		<li className={`group relative card p-3 text-xs flex flex-col gap-1 transition-colors opacity-0 translate-y-2 animate-[fadeSlide_.5s_ease_forwards] ${selectMode ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]' : ''} ${s.winner ? 'ring-1 ring-emerald-500/70 bg-emerald-500/5 animate-winner-pop' : picked ? 'ring-1 ring-[var(--app-accent)] bg-[var(--app-accent-light)]/40' : 'card-muted'}`} onClick={selectMode ? onToggle : undefined} onKeyDown={handleKey} tabIndex={selectMode ? 0 : -1} aria-pressed={selectMode ? picked : undefined} aria-label={selectMode ? `Submission ${s.content} ${picked ? 'selected' : 'not selected'}` : undefined}>
			<div className="flex justify-between items-start gap-2">
				<a href={s.content} target="_blank" rel="noopener" className="font-medium text-[var(--app-foreground)] line-clamp-2 break-all hover:underline">{s.content}</a>
				{s.winner && <span className="text-[9px] px-2 py-0.5 rounded-md font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">Winner</span>}
				{selectMode && !s.winner && (
					<span className={`mt-0.5 inline-block w-3 h-3 rounded-sm ring-1 ring-inset ring-[var(--app-accent)] ${picked ? 'bg-[var(--app-accent)]' : 'bg-transparent'}`} />
				)}
			</div>
			<div className="flex justify-between text-[9px] text-[var(--app-foreground-muted)]">
				<span>{s.participant ? shortAddr(s.participant) : 'anon'}</span>
				<span>{new Date(s.timestamp).toLocaleTimeString()}</span>
			</div>
		</li>
	);
}

export default function QuestDetail() {
	const params = useParams<{ id:string }>();
	const router = useRouter();
	const id = params.id as string;
	const { address } = useAccount();
	const { data: walletClient } = useWalletClient();
	const chainId = useChainId();
	const { switchChainAsync, isPending: isSwitching } = useSwitchChain();

	const [quest, setQuest] = useState<Quest | null>(null);
	const [subs, setSubs] = useState<Submission[]>([]);
	const [link, setLink] = useState('');
	const [notes, setNotes] = useState('');
	const [selectMode, setSelectMode] = useState(false);
	const [picks, setPicks] = useState<number[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [justSaved, setJustSaved] = useState(false);
	const [liveMsg, setLiveMsg] = useState('');
	const [loading, setLoading] = useState(true);
	const { pushToast } = useToast();

	// Load quest and submissions
	useEffect(() => {
		const loadData = async () => {
			try {
				const questData = await questStore.getQuest(id);
				setQuest(questData);
				
				if (questData) {
					const subsData = await questStore.listSubmissions(id);
					setSubs(subsData);
				}
			} catch (error) {
				console.error('Failed to load quest data:', error);
				pushToast('Failed to load quest', 'danger');
			} finally {
				setLoading(false);
			}
		};
		
		loadData();
	}, [id, pushToast]);

	const isCreator = quest && address && quest.creator && quest.creator.toLowerCase() === address.toLowerCase();
	const deadlinePassed = quest ? isDeadlinePassed(quest) : false;

	const togglePick = (sid:number) => setPicks(prev => prev.includes(sid) ? prev.filter(x=>x!==sid) : [...prev, sid]);

	const handleSubmission = useCallback(async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
			if (!quest || !address || !walletClient) { pushToast('Connect wallet first', 'danger'); return; }
			if (chainId !== baseSepolia.id) {
				try { await switchChainAsync({ chainId: baseSepolia.id }); await new Promise(r=>setTimeout(r,300)); }
				catch { pushToast('Please switch to Base Sepolia and try again.', 'danger'); return; }
			}
		
		// basic URL validation
		try { new URL(link); } catch { setError('Invalid URL'); return; }
		
		try {
			await questStore.addSubmission(id, address as `0x${string}`, link, walletClient);
			setLink(''); 
			setNotes(''); 
			
			// Reload submissions
			const updatedSubs = await questStore.listSubmissions(id);
			setSubs(updatedSubs);
			
			setJustSaved(true); 
			setTimeout(()=>setJustSaved(false), 2000);
			pushToast('Submission received', 'success');
		} catch (error) {
			console.error('Failed to submit:', error);
			pushToast('Failed to submit. Please try again.', 'danger');
		}
	}, [link, notes, quest, address, id, pushToast]);

	const confirmWinners = async () => {
			if (!quest || !address || !walletClient) { pushToast('Connect wallet first', 'danger'); return; }
			if (chainId !== baseSepolia.id) {
				try { await switchChainAsync({ chainId: baseSepolia.id }); await new Promise(r=>setTimeout(r,300)); }
				catch { pushToast('Please switch to Base Sepolia and try again.', 'danger'); return; }
			}
		
		try {
			await questStore.selectWinners(id, picks.map(String), address as `0x${string}`, walletClient);
			
			// Reload quest and submissions
			const updatedQuest = await questStore.getQuest(id);
			const updatedSubs = await questStore.listSubmissions(id);
			setQuest(updatedQuest);
			setSubs(updatedSubs);
			
			setSelectMode(false);
			setLiveMsg(`Selected ${picks.length} winner${picks.length!==1?'s':''}.`);
			pushToast(`Winner${picks.length!==1?'s':''} locked`, 'success');
		} catch (error) {
			console.error('Failed to select winners:', error);
			pushToast('Failed to select winners. Please try again.', 'danger');
		}
	};

	if (loading) {
		return (
			<div className="p-5 space-y-4">
				<p className="text-sm text-[var(--app-foreground-muted)]">Loading quest...</p>
			</div>
		);
	}

	if (!quest) {
		return (
			<div className="p-5 space-y-4">
				<p className="text-sm text-[var(--app-foreground-muted)]">Quest not found.</p>
				<button onClick={() => router.back()} className="text-xs text-indigo-400 hover:underline">Go Back</button>
			</div>
		);
	}

	const timeRemainingMs = new Date(quest.deadline).getTime() - Date.now();
	const totalWindow = new Date(quest.deadline).getTime() - new Date().getTime(); // Simplified for now
	const progress = Math.min(100, Math.max(0, 100 - (timeRemainingMs/totalWindow)*100));

	return (
		<div className="w-full max-w-md mx-auto px-4 py-4 space-y-5">
			<header className="flex items-start justify-between gap-3">
				<div className="space-y-1">
					<h1 className="text-lg font-semibold leading-tight break-words">{quest.title}</h1>
					<div className="flex flex-wrap gap-2">
						{(() => { const u = deadlineUrgency(quest); return <Badge color={deadlinePassed ? 'rose' : u==='high' ? 'rose' : u==='medium' ? 'slate' : 'green'}>{deadlinePassed ? 'Closed' : u==='high' ? 'Urgent' : u==='medium' ? 'Soon' : 'Open'}</Badge>; })()}
						{quest.winners && <Badge color='green'>Winners Selected</Badge>}
						{quest.prize && <Badge>{quest.prize}</Badge>}
					</div>
				</div>
				<button onClick={()=>router.push('/')} className="text-[10px] text-[var(--app-foreground-muted)] hover:text-[var(--app-foreground)] transition">Home</button>
			</header>

			<section className="card card-muted p-4 text-xs leading-relaxed text-[var(--app-foreground-muted)]">
				<div className="card-header opacity-70">Description</div>
				<div className="card-divider" />
				{quest.description}
			</section>

			<section className="space-y-2">
				<div className="flex justify-between text-[10px] uppercase tracking-wide text-[var(--app-foreground-muted)]">
					<span>Progress</span>
					<span>{deadlinePassed ? 'Ended' : timeRemainingMs > 0 ? formatRemaining(timeRemainingMs) : 'Ending…'}</span>
				</div>
				<div className="h-2 rounded-full bg-[var(--app-accent-light)] overflow-hidden">
					<div className="h-full bg-[var(--app-accent)] transition-all" style={{ width: `${progress}%` }} />
				</div>
				<div className="flex justify-between text-[10px] text-[var(--app-foreground-muted)]">
					<span>Created {new Date(quest.createdAt).toLocaleDateString()}</span>
					<span>Deadline {new Date(quest.deadline).toLocaleString()}</span>
				</div>
			</section>

			<section className="space-y-3">
				<div aria-live="polite" className="sr-only">{liveMsg}</div>
				<div className="flex items-center justify-between">
					<h2 className="text-sm font-medium">Submissions ({subs.length})</h2>
					{!quest.winners && deadlinePassed && isCreator && !selectMode && (
						<button onClick={()=>{ setSelectMode(true); setPicks([]); }} className="text-[10px] px-2 py-1 rounded-md bg-[var(--app-accent)] text-white">Select Winners</button>
					)}
					{selectMode && (
						<div className="flex gap-2">
							<button disabled={!picks.length} onClick={confirmWinners} className="text-[10px] px-2 py-1 rounded-md bg-emerald-600 disabled:opacity-40 text-white">Confirm</button>
							<button onClick={()=>setSelectMode(false)} className="text-[10px] px-2 py-1 rounded-md bg-[var(--app-accent-light)] text-[var(--app-foreground-muted)]">Cancel</button>
						</div>
					)}
				</div>
				<ul className="space-y-3 max-h-64 overflow-auto pr-1 custom-scroll">
					{subs.map(s => (
						<SubmissionItem key={s.id} s={s} picked={picks.includes(s.id)} selectMode={!!selectMode} onToggle={()=>togglePick(s.id)} />
					))}
					{subs.length === 0 && (
						<li className="text-[11px] text-[var(--app-foreground-muted)] italic">No submissions yet.</li>
					)}
				</ul>
			</section>

			{!deadlinePassed && !quest.winners && (
				<form onSubmit={handleSubmission} className="space-y-3 card p-4">
					<h3 className="text-xs font-medium">Submit Entry</h3>
					<div className="space-y-2">
						<input value={link} onChange={e=>setLink(e.target.value)} required placeholder="Project / repo URL" className="w-full px-3 py-2 rounded-md bg-[#1c2030] text-xs outline-none ring-1 ring-transparent focus:ring-[var(--app-accent)] border border-[#293044]" />
						<textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Short notes (optional)" rows={2} className="w-full px-3 py-2 rounded-md bg-[#1c2030] text-xs resize-none outline-none ring-1 ring-transparent focus:ring-[var(--app-accent)] border border-[#293044]" />
					</div>
					{error && <p className="text-[10px] text-rose-400">{error}</p>}
					<div className="flex items-center justify-between">
						<button type="submit" className="px-3 py-1.5 text-[11px] rounded-md bg-[var(--app-accent)] hover:bg-[var(--app-accent-hover)] active:bg-[var(--app-accent-active)] text-white font-medium transition">Submit</button>
						{justSaved && <span className="text-[10px] text-emerald-400">Saved ✔</span>}
					</div>
				</form>
			)}

			{deadlinePassed && !quest.winners && !isCreator && (
				<p className="text-[10px] text-center text-[var(--app-foreground-muted)]">Awaiting winner selection…</p>
			)}

			{quest.winners && (
				<div className="text-[10px] text-center text-emerald-400">
					Winners locked in • {quest.winners.length} selected
				</div>
			)}
		</div>
	);
}

function shortAddr(addr:string){ return addr.slice(0,6)+'…'+addr.slice(-4); }
function formatRemaining(ms:number){ if(ms<=0) return '0m'; const m=Math.floor(ms/60000); if(m<60) return m+'m'; const h=Math.floor(m/60); const rem=m%60; return h+'h '+rem+'m'; }

// Optionally style custom scrollbar (scoped via global class)
// Add minimal styles if Tailwind config permits; kept inline for portability.
