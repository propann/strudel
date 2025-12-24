import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $project, $saveStatus, init, setCode } from './projectStore.mjs';

const { BASE_URL } = import.meta.env;
const baseNoTrailing = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;

const statusStyles = {
  saved: 'text-green-400',
  saving: 'text-yellow-400',
  error: 'text-red-400',
};

export default function GamePage() {
  const project = useStore($project);
  const saveStatus = useStore($saveStatus);

  useEffect(() => {
    init();
  }, []);

  const handleAddToken = () => {
    if (!project) return;
    const token = '\n// token: demo';
    const nextCode = project.code.includes('// token: demo') ? project.code : `${project.code}${token}`;
    setCode(nextCode, 'demo-token');
  };

  const statusClass = statusStyles[saveStatus.status] ?? 'text-gray-400';

  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Game Mode (MVP)</h1>
          <a
            href={`${baseNoTrailing}/`}
            className="rounded-full border border-foreground/20 px-3 py-1 text-xs uppercase tracking-wide hover:opacity-80"
          >
            Repl
          </a>
        </div>

        <div className="flex items-center space-x-2">
          <span className={statusClass}>●</span>
          <span className="text-sm uppercase tracking-wide">{saveStatus.status}</span>
        </div>

        <section className="space-y-2">
          <h2 className="text-sm uppercase tracking-wide opacity-70">Code actuel</h2>
          <pre className="whitespace-pre-wrap break-words rounded bg-black/20 p-4 text-sm">
            {project?.code ?? 'Chargement...'}
          </pre>
        </section>

        <button
          type="button"
          onClick={handleAddToken}
          className="rounded bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-400"
        >
          Ajouter token demo
        </button>
      </div>
    </main>
  );
}
