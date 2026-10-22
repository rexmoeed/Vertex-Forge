import React, { useState } from 'react';
import { Search, CheckCircle2 } from 'lucide-react';

export interface ExtensionItem {
  id: string;
  name: string;
  publisher: string;
  version: string;
  rating: string;
  downloads: string;
  icon: string;
  iconBg: string;
  desc: string;
  recommended: boolean;
}

const DEFAULT_EXTENSIONS: ExtensionItem[] = [
  {
    id: 'ts-tools',
    name: 'TypeScript & JavaScript Features',
    publisher: 'Microsoft',
    version: 'v5.6.2',
    rating: '4.9',
    downloads: '42.5M',
    icon: 'TS',
    iconBg: 'bg-blue-600/20 text-blue-400',
    desc: 'Rich IntelliSense, symbol navigation, type checking, and smart JSX/TSX diagnostics.',
    recommended: true,
  },
  {
    id: 'eslint',
    name: 'ESLint',
    publisher: 'Dirk Baeumer',
    version: 'v2.4.4',
    rating: '4.7',
    downloads: '31.2M',
    icon: 'ES',
    iconBg: 'bg-indigo-600/20 text-indigo-400',
    desc: 'Integrates ESLint into Vertex Forge with live error underlining and quick-fix actions.',
    recommended: true,
  },
  {
    id: 'prettier',
    name: 'Prettier - Code Formatter',
    publisher: 'Prettier',
    version: 'v10.1.0',
    rating: '4.8',
    downloads: '38.9M',
    icon: 'P',
    iconBg: 'bg-amber-600/20 text-amber-400',
    desc: 'Multi-language code formatting on file save with configured rules and tab width.',
    recommended: true,
  },
  {
    id: 'tailwind',
    name: 'Tailwind CSS IntelliSense',
    publisher: 'Tailwind Labs',
    version: 'v0.12.7',
    rating: '4.9',
    downloads: '18.4M',
    icon: 'TW',
    iconBg: 'bg-cyan-600/20 text-cyan-400',
    desc: 'Autocomplete, hover previews, and syntax validation for Tailwind utility classes.',
    recommended: true,
  },
  {
    id: 'gitlens',
    name: 'GitLens — Git Supercharged',
    publisher: 'GitKraken',
    version: 'v15.2.0',
    rating: '4.8',
    downloads: '29.1M',
    icon: 'GL',
    iconBg: 'bg-rose-600/20 text-rose-400',
    desc: 'Line-by-line blame annotations, visual commit graphs, and branch diff explorers.',
    recommended: true,
  },
  {
    id: 'mcp-agent',
    name: 'Model Context Protocol (MCP) Hub',
    publisher: 'Vertex Forge & Antigravity',
    version: 'v1.4.0',
    rating: '5.0',
    downloads: '2.4M',
    icon: '✦',
    iconBg: 'bg-emerald-600/20 text-emerald-400',
    desc: 'Connect specialized MCP tools, file system servers, and autonomous agent capabilities.',
    recommended: true,
  },
  {
    id: 'python',
    name: 'Python & Pylance',
    publisher: 'Microsoft',
    version: 'v2024.18.0',
    rating: '4.6',
    downloads: '95.0M',
    icon: 'Py',
    iconBg: 'bg-emerald-600/20 text-emerald-400',
    desc: 'Python language support with syntax checking, virtualenv auto-discovery, and debugging.',
    recommended: false,
  },
  {
    id: 'docker',
    name: 'Docker & Containers',
    publisher: 'Microsoft',
    version: 'v1.29.1',
    rating: '4.7',
    downloads: '26.8M',
    icon: 'Dk',
    iconBg: 'bg-blue-600/20 text-blue-400',
    desc: 'Manage dockerfiles, compose environments, image builds, and container logs directly.',
    recommended: false,
  },
  {
    id: 'prisma',
    name: 'Prisma ORM',
    publisher: 'Prisma',
    version: 'v5.19.0',
    rating: '4.9',
    downloads: '8.7M',
    icon: '▲',
    iconBg: 'bg-teal-600/20 text-teal-400',
    desc: 'Schema formatting, database migration tools, linting, and autocomplete for Prisma models.',
    recommended: false,
  },
  {
    id: 'rust',
    name: 'Rust Analyzer',
    publisher: 'rust-lang.org',
    version: 'v0.3.2100',
    rating: '4.9',
    downloads: '5.2M',
    icon: 'RS',
    iconBg: 'bg-orange-600/20 text-orange-400',
    desc: 'Cargo workspace support, macro expansions, type hints, and Rust compiler diagnostics.',
    recommended: false,
  },
];

export const ExtensionsSidebarTab: React.FC = () => {
  const [extensionSearch, setExtensionSearch] = useState('');
  const [extensionFilter, setExtensionFilter] = useState<'all' | 'installed' | 'recommended'>('all');
  const [installedExtensions, setInstalledExtensions] = useState<Record<string, { installed: boolean; enabled: boolean }>>(() => {
    try {
      const saved = localStorage.getItem('vertex_forge_installed_extensions');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      'ts-tools': { installed: true, enabled: true },
      'eslint': { installed: true, enabled: true },
      'prettier': { installed: true, enabled: true },
      'tailwind': { installed: true, enabled: true },
      'mcp-agent': { installed: true, enabled: true },
    };
  });

  const handleToggleInstall = (id: string) => {
    setInstalledExtensions(prev => {
      const next = {
        ...prev,
        [id]: { installed: !prev[id]?.installed, enabled: !prev[id]?.installed },
      };
      try {
        localStorage.setItem('vertex_forge_installed_extensions', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleToggleEnable = (id: string) => {
    setInstalledExtensions(prev => {
      const current = prev[id] || { installed: false, enabled: false };
      const next = {
        ...prev,
        [id]: { ...current, enabled: !current.enabled },
      };
      try {
        localStorage.setItem('vertex_forge_installed_extensions', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const filteredExtensions = DEFAULT_EXTENSIONS.filter(ext => {
    const info = installedExtensions[ext.id] || { installed: false, enabled: false };
    if (extensionFilter === 'installed' && !info.installed) return false;
    if (extensionFilter === 'recommended' && !ext.recommended) return false;
    if (!extensionSearch.trim()) return true;
    const q = extensionSearch.toLowerCase();
    return (
      ext.name.toLowerCase().includes(q) ||
      ext.desc.toLowerCase().includes(q) ||
      ext.publisher.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col h-full p-3 gap-3 overflow-y-auto">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Extensions & Plugins</span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          {Object.values(installedExtensions).filter(x => x.installed).length} Installed
        </span>
      </div>

      {/* Search Box */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
        <input
          type="text"
          placeholder="Search Extensions in Marketplace..."
          value={extensionSearch}
          onChange={e => setExtensionSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-750 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-1 text-[11px] border-b border-slate-800 pb-2">
        {(['all', 'installed', 'recommended'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setExtensionFilter(tab)}
            className={`px-2.5 py-1 rounded-md capitalize font-medium transition cursor-pointer ${
              extensionFilter === tab
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Extension Cards List */}
      <div className="flex flex-col gap-2">
        {filteredExtensions.map(ext => {
          const info = installedExtensions[ext.id] || { installed: false, enabled: false };
          return (
            <div
              key={ext.id}
              className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition flex flex-col gap-2 group"
            >
              <div className="flex items-start gap-2.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${ext.iconBg}`}
                >
                  {ext.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-white truncate">{ext.name}</span>
                    <span className="text-[10px] text-slate-500">{ext.version}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{ext.publisher}</div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                    <span>★ {ext.rating}</span>
                    <span>•</span>
                    <span>{ext.downloads}</span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{ext.desc}</p>

              <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-xs">
                {info.installed ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleEnable(ext.id)}
                      className={`text-[10px] px-2 py-0.5 rounded cursor-pointer ${
                        info.enabled
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {info.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                    <button
                      onClick={() => handleToggleInstall(ext.id)}
                      className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                    >
                      Uninstall
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleToggleInstall(ext.id)}
                    className="px-2.5 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium cursor-pointer transition"
                  >
                    Install
                  </button>
                )}

                {ext.recommended && (
                  <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Recommended
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
