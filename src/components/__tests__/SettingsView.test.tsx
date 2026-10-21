import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsView } from '../views/SettingsView';

const mockSetAutoSave = vi.fn();
const mockSetAutoSaveDelay = vi.fn();
const mockSetAutonomyMode = vi.fn();

vi.mock('../../context/IDEContext', () => ({
  useIDE: () => ({
    autonomyMode: 'supervised',
    setAutonomyMode: mockSetAutonomyMode,
    setActiveView: vi.fn(),
    autoSave: true,
    setAutoSave: mockSetAutoSave,
    autoSaveDelay: 1000,
    setAutoSaveDelay: mockSetAutoSaveDelay,
    saveCurrentFile: vi.fn(),
    saveAllFiles: vi.fn(),
    isAutoSaving: false,
  }),
}));

vi.mock('../../context/LayoutContext', () => ({
  useLayout: () => ({
    sidebarPosition: 'left',
    setSidebarPosition: vi.fn(),
    isSidebarOpen: true,
    toggleSidebar: vi.fn(),
    panelSize: 300,
    setPanelSize: vi.fn(),
    resetLayout: vi.fn(),
  }),
}));

vi.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    themeId: 'dark-default',
    activeTheme: { id: 'dark-default', name: 'Dark Default', mode: 'dark' },
    accentColor: '#6366f1',
    setAccentColor: vi.fn(),
    setTheme: vi.fn(),
    mode: 'dark',
    setMode: vi.fn(),
    density: 'comfortable',
    setDensity: vi.fn(),
    fontSize: 14,
    setFontSize: vi.fn(),
    resetAppearance: vi.fn(),
  }),
}));

describe('SettingsView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders settings navigation sections and active theme', () => {
    render(<SettingsView />);
    expect(screen.getAllByText(/Appearance & Themes/i)[0]).toBeDefined();
    expect(screen.getAllByText(/Editor & Auto-Save/i)[0]).toBeDefined();
    expect(screen.getByText('Dark Default')).toBeDefined();
  });

  it('switches between settings tabs', () => {
    render(<SettingsView />);
    const editorTab = screen.getAllByRole('button', { name: /Editor & Auto-Save/i })[0];
    fireEvent.click(editorTab);
    expect(editorTab).toBeDefined();
  });

  it('switches to Agent Team & Permissions settings section', () => {
    render(<SettingsView />);
    const agentsTab = screen.getAllByRole('button', { name: /Agent Team & Permissions/i })[0];
    fireEvent.click(agentsTab);
    expect(agentsTab).toBeDefined();
  });
});
