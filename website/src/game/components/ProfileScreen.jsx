import { useState } from 'react';

export default function ProfileScreen({ profile, onRename, onBack }) {
  const [draftName, setDraftName] = useState(profile?.displayName || '');
  if (!profile) return null;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-foreground/60">Profile</div>
          <h2 className="text-2xl font-semibold">{profile.displayName}</h2>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-foreground/20 px-3 py-1 text-xs uppercase tracking-wide hover:opacity-80"
        >
          Back
        </button>
      </div>
      <div className="rounded-2xl border border-foreground/15 bg-black/30 p-4 space-y-3">
        <div className="text-xs uppercase tracking-[0.2em] text-foreground/60">Display name</div>
        <div className="flex gap-2">
          <input
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            className="flex-1 rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm text-foreground outline-none"
          />
          <button
            type="button"
            onClick={() => onRename(draftName)}
            className="rounded-lg border border-foreground/20 px-3 py-2 text-xs uppercase tracking-[0.2em] hover:opacity-80"
          >
            Save
          </button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-foreground/15 bg-black/30 p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-foreground/60">Total score</div>
          <div className="text-2xl font-semibold">{profile.totalScore}</div>
        </div>
        <div className="rounded-2xl border border-foreground/15 bg-black/30 p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-foreground/60">Best combo</div>
          <div className="text-2xl font-semibold">{profile.bestComboEver}</div>
        </div>
        <div className="rounded-2xl border border-foreground/15 bg-black/30 p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-foreground/60">Best accuracy</div>
          <div className="text-2xl font-semibold">{Math.round(profile.bestAccuracyEver * 100)}%</div>
        </div>
      </div>
      <div className="rounded-2xl border border-foreground/15 bg-black/30 p-4 space-y-2">
        <div className="text-xs uppercase tracking-[0.2em] text-foreground/60">Recent runs</div>
        {profile.history.slice(0, 5).map((run) => (
          <div key={`${run.timestamp}-${run.levelId}`} className="text-xs text-foreground/80">
            {new Date(run.timestamp).toLocaleString()} · Level {run.levelId} · {run.score} pts · {Math.round(run.accuracy * 100)}%
          </div>
        ))}
        {profile.history.length === 0 && (
          <div className="text-xs text-foreground/60">No runs yet.</div>
        )}
      </div>
    </div>
  );
}
