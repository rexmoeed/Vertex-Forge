import React from 'react';
import { Lock, Trash2 } from 'lucide-react';
import { CredentialVaultService } from '../../services/credentialVaultService';
import { SecretMetadata } from '../../types/kos';

interface Props {
  secrets: SecretMetadata[];
  newSecretName: string;
  setNewSecretName: (val: string) => void;
  newSecretVal: string;
  setNewSecretVal: (val: string) => void;
  newSecretType: 'api_key' | 'token' | 'db_credential';
  setNewSecretType: (val: 'api_key' | 'token' | 'db_credential') => void;
  onAddSecret: (e: React.FormEvent) => void;
  onDeleteSecret: (id: string, name: string) => void;
}

export const OperatorVaultTab: React.FC<Props> = ({
  secrets,
  newSecretName,
  setNewSecretName,
  newSecretVal,
  setNewSecretVal,
  newSecretType,
  setNewSecretType,
  onAddSecret,
  onDeleteSecret,
}) => {
  return (
    <div className="max-w-5xl flex flex-col gap-5">
      <div>
        <h2 className="text-sm font-bold text-white">Credential Vault</h2>
        <p className="text-xs text-slate-400">
          Encrypted secret storage. Agents reference secrets as <code className="text-emerald-400">vault:name</code> and never view raw values in plain text.
        </p>
      </div>

      {/* Add Secret Form */}
      <form onSubmit={onAddSecret} className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-2">
        <input
          type="text"
          placeholder="Secret name (e.g. github-pat)"
          value={newSecretName}
          onChange={e => setNewSecretName(e.target.value)}
          className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none flex-1"
        />
        <input
          type="password"
          placeholder="Raw Secret Value"
          value={newSecretVal}
          onChange={e => setNewSecretVal(e.target.value)}
          className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none flex-1"
        />
        <select
          value={newSecretType}
          onChange={e => setNewSecretType(e.target.value as any)}
          className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
        >
          <option value="api_key">API Key</option>
          <option value="token">Token</option>
          <option value="db_credential">DB Credential</option>
        </select>
        <button
          type="submit"
          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
        >
          Save to Vault
        </button>
      </form>

      {/* Secrets List */}
      <div className="space-y-2">
        {secrets.map(s => (
          <div key={s.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span>vault:{s.name}</span>
                  <span className="text-[10px] font-mono text-slate-400 font-normal">({s.type})</span>
                </div>
                <div className="text-[10px] font-mono text-slate-400">{s.maskedPreview}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded">
                {s.policy}
              </span>
              <button
                onClick={() => onDeleteSecret(s.id, s.name)}
                className="text-slate-400 hover:text-rose-400 p-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
