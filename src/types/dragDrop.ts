/**
 * Drag and Drop typed contracts for Explorer-to-Editor interactions in Vertex Forge
 */

export const FILE_DRAG_MIME = 'application/x-vertexforge-file';

export interface FileDragPayload {
  path: string;
  relativePath: string;
  workspaceId: string;
  type: 'file';
  size?: number;
  language?: string;
}

export interface FileDragState {
  active: boolean;
  sourcePath?: string;
  sourceWorkspaceId?: string;
  isOverEditor?: boolean;
  targetGroupId?: number;
}
