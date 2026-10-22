import React, { useState } from 'react';
import { Github, PlusCircle, ExternalLink } from 'lucide-react';
import { GitHubPullRequest, GitHubIssue } from '../../types/gitWorkflow';

export interface GitHubIntegrationTabProps {
  gitHubAuthed: boolean;
  gitHubUser: { login?: string; name?: string; avatarUrl?: string } | null;
  gitHubOwner: string;
  gitHubRepo: string;
  pullRequests: GitHubPullRequest[];
  issues: GitHubIssue[];
  onSaveToken: (token: string) => Promise<void>;
  onUpdateRepo: (owner: string, repo: string) => void;
  onCreatePR: (title: string, body: string, base: string) => Promise<void>;
}

export const GitHubIntegrationTab: React.FC<GitHubIntegrationTabProps> = ({
  gitHubAuthed,
  gitHubUser,
  gitHubOwner,
  gitHubRepo,
  pullRequests,
  issues,
  onSaveToken,
  onUpdateRepo,
  onCreatePR,
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [isCreatingPR, setIsCreatingPR] = useState(false);
  const [prTitle, setPrTitle] = useState('');
  const [prBody, setPrBody] = useState('');
  const [prBase, setPrBase] = useState('main');

  const handleAuthenticate = async () => {
    if (!tokenInput.trim()) return;
    await onSaveToken(tokenInput.trim());
    setTokenInput('');
  };

  const handleSubmitPR = async () => {
    if (!prTitle.trim()) return;
    await onCreatePR(prTitle.trim(), prBody.trim(), prBase.trim());
    setPrTitle('');
    setPrBody('');
    setIsCreatingPR(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4 text-xs">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 font-bold text-slate-200">
          <Github className="w-4 h-4 text-white" />
          <span>GitHub Integration</span>
        </div>
        {gitHubAuthed && (
          <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
            Connected
          </span>
        )}
      </div>

      {!gitHubAuthed ? (
        <div className="p-3 bg-slate-900 border border-slate-700/60 rounded-lg flex flex-col gap-2.5">
          <p className="text-slate-400 leading-relaxed text-[11px]">
            Authenticate with a GitHub Personal Access Token (<code className="text-indigo-300">repo</code> scope) to inspect PRs, view issues, and trigger cloud code reviews.
          </p>
          <input
            type="password"
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            value={tokenInput}
            onChange={e => setTokenInput(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleAuthenticate}
            disabled={!tokenInput.trim()}
            className="w-full py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium transition-colors"
          >
            Authenticate with GitHub
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* User profile banner */}
          <div className="flex items-center gap-2.5 p-2 rounded bg-slate-800/50 border border-slate-700/50">
            {gitHubUser?.avatarUrl ? (
              <img src={gitHubUser.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                {gitHubUser?.login?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="truncate flex-1">
              <div className="font-bold text-white leading-tight">{gitHubUser?.login}</div>
              <div className="text-[10px] text-slate-400">{gitHubUser?.name || 'GitHub User'}</div>
            </div>
          </div>

          {/* Target Repo Config */}
          <div className="flex flex-col gap-1.5 bg-slate-900/60 p-2.5 rounded border border-slate-800">
            <label className="text-[10px] font-semibold text-slate-400">Target GitHub Repository</label>
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="owner"
                value={gitHubOwner}
                onChange={e => onUpdateRepo(e.target.value, gitHubRepo)}
                className="w-1/2 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-[11px]"
              />
              <span className="text-slate-500 self-center">/</span>
              <input
                type="text"
                placeholder="repository"
                value={gitHubRepo}
                onChange={e => onUpdateRepo(gitHubOwner, e.target.value)}
                className="w-1/2 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-[11px]"
              />
            </div>
          </div>

          {/* PR Creation & List */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300">Pull Requests ({pullRequests.length})</span>
              <button
                onClick={() => setIsCreatingPR(!isCreatingPR)}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
              >
                <PlusCircle className="w-3 h-3" />
                {isCreatingPR ? 'Cancel' : 'New PR'}
              </button>
            </div>

            {isCreatingPR && (
              <div className="p-2.5 rounded bg-slate-900 border border-indigo-700/50 flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="PR Title"
                  value={prTitle}
                  onChange={e => setPrTitle(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
                />
                <textarea
                  placeholder="Description of changes..."
                  value={prBody}
                  onChange={e => setPrBody(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs resize-none h-16"
                />
                <button
                  onClick={handleSubmitPR}
                  disabled={!prTitle.trim()}
                  className="py-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium"
                >
                  Create Pull Request
                </button>
              </div>
            )}

            {pullRequests.map(pr => (
              <div key={pr.number} className="p-2 rounded bg-slate-800/40 border border-slate-700/40 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white truncate">#{pr.number} {pr.title}</span>
                  <a href={pr.htmlUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white">
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>by {pr.author?.login}</span>
                  <span className="text-emerald-400 font-medium">{pr.state}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
