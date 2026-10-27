import React from 'react';
import { CommandPaletteModal } from '../modals/CommandPaletteModal';
import { ProjectCreationWizard } from '../modals/ProjectCreationWizard';
import { MultiFileReviewModal } from '../modals/MultiFileReviewModal';
import { AcceptanceTestRunnerModal } from '../workspace/AcceptanceTestRunner';
import { ShortcutsModal } from '../modals/ShortcutsModal';
import { ProjectIntelligenceModal } from '../modals/ProjectIntelligenceModal';
import { VoiceCodingModal } from '../modals/VoiceCodingModal';
import { JulesCloudMissionModal } from '../modals/JulesCloudMissionModal';
import { CloneRepoModal } from '../modals/CloneRepoModal';
import { CloseProjectModal } from '../modals/CloseProjectModal';
import { OpenFolderModal } from '../modals/OpenFolderModal';
import { CursorComposerModal } from '../cursor/CursorComposerModal';
import { CursorRulesModal } from '../cursor/CursorRulesModal';
import { WalkthroughTourModal } from '../modals/WalkthroughTourModal';

export interface WorkbenchModalsProps {
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  isProjectWizardOpen: boolean;
  setIsProjectWizardOpen: (open: boolean) => void;
  isMultiFileReviewOpen: boolean;
  setIsMultiFileReviewOpen: (open: boolean) => void;
  proposedChanges: any;
  applySelectedChanges: any;
  isAcceptanceModalOpen: boolean;
  setIsAcceptanceModalOpen: (open: boolean) => void;
  isShortcutsOpen: boolean;
  setIsShortcutsOpen: (open: boolean) => void;
  isProjectIntelligenceOpen: boolean;
  setIsProjectIntelligenceOpen: (open: boolean) => void;
  isJulesMissionOpen: boolean;
  setIsJulesMissionOpen: (open: boolean) => void;
  isCloneModalOpen: boolean;
  setIsCloneModalOpen: (open: boolean) => void;
  isCloseModalOpen: boolean;
  setIsCloseModalOpen: (open: boolean) => void;
  isOpenFolderModalOpen: boolean;
  setIsOpenFolderModalOpen: (open: boolean) => void;
  isComposerOpen: boolean;
  setIsComposerOpen: (open: boolean) => void;
  isCursorRulesOpen: boolean;
  setIsCursorRulesOpen: (open: boolean) => void;
  isWalkthroughOpen: boolean;
  setIsWalkthroughOpen: (open: boolean) => void;
  openLocalFolder: (path: string) => Promise<any>;
  activeProject: { name: string };
  openTabs: any[];
  devServerProcess: any;
  orchestratorStatus: string;
  saveAllFiles: () => Promise<void>;
  confirmCloseProject: (save: boolean) => void;
}

export const WorkbenchModals: React.FC<WorkbenchModalsProps> = ({
  isCommandPaletteOpen,
  setIsCommandPaletteOpen,
  isProjectWizardOpen,
  setIsProjectWizardOpen,
  isMultiFileReviewOpen,
  setIsMultiFileReviewOpen,
  proposedChanges,
  applySelectedChanges,
  isAcceptanceModalOpen,
  setIsAcceptanceModalOpen,
  isShortcutsOpen,
  setIsShortcutsOpen,
  isProjectIntelligenceOpen,
  setIsProjectIntelligenceOpen,
  isJulesMissionOpen,
  setIsJulesMissionOpen,
  isCloneModalOpen,
  setIsCloneModalOpen,
  isCloseModalOpen,
  setIsCloseModalOpen,
  isOpenFolderModalOpen,
  setIsOpenFolderModalOpen,
  isComposerOpen,
  setIsComposerOpen,
  isCursorRulesOpen,
  setIsCursorRulesOpen,
  isWalkthroughOpen,
  setIsWalkthroughOpen,
  openLocalFolder,
  activeProject,
  openTabs,
  devServerProcess,
  orchestratorStatus,
  saveAllFiles,
  confirmCloseProject,
}) => {
  return (
    <>
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenNewProject={() => setIsProjectWizardOpen(true)}
      />

      <ProjectCreationWizard
        isOpen={isProjectWizardOpen}
        onClose={() => setIsProjectWizardOpen(false)}
      />

      <MultiFileReviewModal
        isOpen={isMultiFileReviewOpen}
        onClose={() => setIsMultiFileReviewOpen(false)}
        changes={proposedChanges}
        onApplySelected={applySelectedChanges}
      />

      <AcceptanceTestRunnerModal
        isOpen={isAcceptanceModalOpen}
        onClose={() => setIsAcceptanceModalOpen(false)}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <ProjectIntelligenceModal
        isOpen={isProjectIntelligenceOpen}
        onClose={() => setIsProjectIntelligenceOpen(false)}
      />

      <VoiceCodingModal />

      <JulesCloudMissionModal
        isOpen={isJulesMissionOpen}
        onClose={() => setIsJulesMissionOpen(false)}
      />

      <CloneRepoModal
        isOpen={isCloneModalOpen}
        onClose={() => setIsCloneModalOpen(false)}
        onProjectCloned={async (clonedPath) => {
          await openLocalFolder(clonedPath);
          setIsCloneModalOpen(false);
        }}
      />

      <CloseProjectModal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        projectName={activeProject.name}
        dirtyTabs={openTabs.filter(t => t.isDirty)}
        hasRunningServer={!!devServerProcess}
        hasRunningAgent={orchestratorStatus === 'executing' || orchestratorStatus === 'planning'}
        onSaveAndClose={async () => {
          await saveAllFiles();
          confirmCloseProject(true);
        }}
        onDiscardAndClose={() => {
          confirmCloseProject(false);
        }}
      />

      <OpenFolderModal
        isOpen={isOpenFolderModalOpen}
        onClose={() => setIsOpenFolderModalOpen(false)}
        onSelectFolder={async (selectedPath) => {
          await openLocalFolder(selectedPath);
          setIsOpenFolderModalOpen(false);
        }}
      />

      <CursorComposerModal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
      />

      <CursorRulesModal
        isOpen={isCursorRulesOpen}
        onClose={() => setIsCursorRulesOpen(false)}
      />

      <WalkthroughTourModal
        isOpen={isWalkthroughOpen}
        onClose={() => {
          setIsWalkthroughOpen(false);
          localStorage.setItem('vertex_forge_walkthrough_seen_v1', 'true');
        }}
        onOpenProjectWizard={() => {
          setIsWalkthroughOpen(false);
          localStorage.setItem('vertex_forge_walkthrough_seen_v1', 'true');
          setIsProjectWizardOpen(true);
        }}
      />
    </>
  );
};
