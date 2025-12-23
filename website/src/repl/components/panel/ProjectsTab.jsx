import { useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  $project,
  createNewProject,
  deleteProject,
  duplicateProject,
  exportProject,
  importProject,
  listProjects,
  renameProject,
  setCurrentProject,
} from '../../../game/projectStore.mjs';

export function ProjectsTab() {
  const current = useStore($project);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const refreshProjects = async () => {
    setLoading(true);
    try {
      const list = await listProjects();
      setProjects(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProjects();
  }, []);

  useEffect(() => {
    refreshProjects();
  }, [current?.id]);

  const handleNew = async () => {
    const name = window.prompt('Project name', 'Untitled Project');
    if (name === null) return;
    await createNewProject({ name, code: '', bpm: current?.bpm });
    await refreshProjects();
  };

  const handleRename = async (project) => {
    const name = window.prompt('Rename project', project.name);
    if (name === null) return;
    await renameProject(project.id, name);
    await refreshProjects();
  };

  const handleDuplicate = async (project) => {
    await duplicateProject(project.id);
    await refreshProjects();
  };

  const handleDelete = async (project) => {
    const confirmed = window.confirm(`Delete "${project.name}"?`);
    if (!confirmed) return;
    await deleteProject(project.id);
    await refreshProjects();
  };

  const handleSelect = async (project) => {
    await setCurrentProject(project.id);
    await refreshProjects();
  };

  const handleExport = async () => {
    if (!current) return;
    const json = await exportProject(current.id);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${current.name || 'project'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    await importProject(text);
    event.target.value = '';
    await refreshProjects();
  };

  return (
    <div className="p-4 space-y-4 text-sm text-foreground">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs uppercase tracking-[0.2em] text-foreground/70">Projects</div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleNew}
            className="rounded-full border border-foreground/10 px-3 py-1 text-xs uppercase tracking-wide hover:opacity-70"
          >
            New
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="rounded-full border border-foreground/10 px-3 py-1 text-xs uppercase tracking-wide hover:opacity-70"
            title="Export current project"
          >
            Export
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full border border-foreground/10 px-3 py-1 text-xs uppercase tracking-wide hover:opacity-70"
            title="Import project JSON"
          >
            Import
          </button>
          <input ref={fileInputRef} type="file" accept="application/json" onChange={handleImport} hidden />
        </div>
      </div>

      <div className="space-y-2">
        {loading && <div className="text-xs uppercase tracking-wide text-foreground/60">Loading...</div>}
        {!loading && projects.length === 0 && (
          <div className="text-xs uppercase tracking-wide text-foreground/60">No projects yet.</div>
        )}
        {projects.map((project) => {
          const isCurrent = current?.id === project.id;
          return (
            <div
              key={project.id}
              className="flex flex-col gap-2 rounded-lg border border-foreground/10 bg-lineBackground px-3 py-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{project.name}</span>
                  {isCurrent && (
                    <span className="rounded-full border border-foreground/20 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                      current
                    </span>
                  )}
                </div>
                {!isCurrent && (
                  <button
                    type="button"
                    onClick={() => handleSelect(project)}
                    className="text-xs uppercase tracking-wide hover:opacity-70"
                    title="Select project"
                  >
                    Select
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-foreground/70">
                <button type="button" onClick={() => handleRename(project)} className="hover:opacity-70">
                  Rename
                </button>
                <button type="button" onClick={() => handleDuplicate(project)} className="hover:opacity-70">
                  Duplicate
                </button>
                <button type="button" onClick={() => handleDelete(project)} className="hover:opacity-70">
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
