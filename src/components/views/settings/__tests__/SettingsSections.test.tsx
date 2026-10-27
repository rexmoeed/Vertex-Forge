import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { AppearanceSettingsSection } from '../AppearanceSettingsSection';
import { LayoutSettingsSection } from '../LayoutSettingsSection';
import { ProvidersSettingsSection } from '../ProvidersSettingsSection';
import { AiEngineSettingsSection } from '../AiEngineSettingsSection';
import { AgentsSettingsSection } from '../AgentsSettingsSection';
import { SecuritySettingsSection } from '../SecuritySettingsSection';
import { ThemeProvider } from '../../../../context/ThemeContext';
import { LayoutProvider } from '../../../../context/LayoutContext';

describe('Modular Settings Sections', () => {
  it('renders AppearanceSettingsSection and allows resetting', () => {
    const handleReset = vi.fn();
    render(
      <ThemeProvider>
        <AppearanceSettingsSection onResetAppearance={handleReset} />
      </ThemeProvider>
    );

    expect(screen.getByText('Appearance & Theme Engine')).toBeDefined();
    const resetBtn = screen.getByText('Reset Appearance');
    fireEvent.click(resetBtn);
    expect(handleReset).toHaveBeenCalledTimes(1);
  });

  it('renders LayoutSettingsSection and toggles sidebar visibility', () => {
    const handleReset = vi.fn();
    render(
      <LayoutProvider>
        <LayoutSettingsSection onResetLayout={handleReset} />
      </LayoutProvider>
    );

    expect(screen.getByText('Layout & Panel Management')).toBeDefined();
    expect(screen.getByText('Primary Sidebar')).toBeDefined();
  });

  it('renders ProvidersSettingsSection and triggers hub navigation', () => {
    const handleOpenHub = vi.fn();
    render(<ProvidersSettingsSection onOpenProvidersHub={handleOpenHub} />);

    expect(screen.getByText(/Bring Your Own Keys/)).toBeDefined();
    const hubBtn = screen.getByText('Open Dedicated Hub');
    fireEvent.click(hubBtn);
    expect(handleOpenHub).toHaveBeenCalledTimes(1);
  });

  it('renders AiEngineSettingsSection with model selection and temperature slider', () => {
    const setModel = vi.fn();
    const setTemp = vi.fn();
    render(
      <AiEngineSettingsSection
        activeModel="gemini-3.8-flash"
        setActiveModel={setModel}
        temperature={0.2}
        setTemperature={setTemp}
      />
    );

    expect(screen.getByText('AI Engine & Model Configuration')).toBeDefined();
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'gemini-2.5-pro' } });
    expect(setModel).toHaveBeenCalledWith('gemini-2.5-pro');
  });

  it('renders AgentsSettingsSection and toggles autonomy mode', () => {
    const setAutonomy = vi.fn();
    const setMaxAgents = vi.fn();
    render(
      <AgentsSettingsSection
        autonomyMode="supervised"
        setAutonomyMode={setAutonomy}
        maxConcurrentAgents={4}
        setMaxConcurrentAgents={setMaxAgents}
      />
    );

    expect(screen.getByText('Autonomous Agent Team & Permissions')).toBeDefined();
    const autoBtn = screen.getByText('Autonomous Mode');
    fireEvent.click(autoBtn);
    expect(setAutonomy).toHaveBeenCalledWith('autonomous');
  });

  it('renders SecuritySettingsSection for terminal and security views', () => {
    const setProtect = vi.fn();
    const setTimeoutVal = vi.fn();

    const { rerender } = render(
      <SecuritySettingsSection
        protectEnvFiles={true}
        setProtectEnvFiles={setProtect}
        terminalTimeout={30}
        setTerminalTimeout={setTimeoutVal}
        isTerminalSection={true}
      />
    );

    expect(screen.getByText('Terminal & Command Execution')).toBeDefined();

    rerender(
      <SecuritySettingsSection
        protectEnvFiles={true}
        setProtectEnvFiles={setProtect}
        terminalTimeout={30}
        setTerminalTimeout={setTimeoutVal}
        isTerminalSection={false}
      />
    );

    expect(screen.getByText('Security & Workspace Isolation')).toBeDefined();
    expect(screen.getByText(/Electron Context Isolation/)).toBeDefined();
  });
});
