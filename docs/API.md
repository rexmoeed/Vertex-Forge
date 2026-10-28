# Vertex Forge Backend REST API Specification

The Vertex Forge Express backend (`server.ts`) runs on port `3000` (configurable via `PORT` in `.env`) and exposes modular REST endpoints.

---

## 1. General & System

### `GET /api/health`
Returns runtime status, uptime, and telemetry configuration.

**Response**:
```json
{
  "status": "ok",
  "service": "Vertex Forge Backend API",
  "timestamp": "2026-10-28T06:00:00.000Z",
  "uptime": 124.5,
  "version": "1.2.0",
  "errorTracking": {
    "provider": "pino-structured",
    "configured": false
  }
}
```

---

## 2. File System Endpoints (`/api/fs/*`)

### `POST /api/fs/read-dir`
Recursively crawls a workspace directory up to `maxDepth`.

**Request Body**:
```json
{
  "dirPath": "E:/Projects/MyProject",
  "maxDepth": 6
}
```

### `POST /api/fs/read-file`
Reads content of a target file with path traversal defense.

**Request Body**:
```json
{
  "filePath": "src/App.tsx",
  "cwd": "E:/Projects/MyProject"
}
```

### `POST /api/fs/write-file`
Atomically writes content to a file on disk.

**Request Body**:
```json
{
  "filePath": "src/utils.ts",
  "content": "export const add = (a: number, b: number) => a + b;",
  "cwd": "E:/Projects/MyProject"
}
```

### `GET /api/fs/drives`
Lists available logical drives (Windows drive letters `C:`, `D:`, `E:` or Unix root `/`).

---

## 3. Git Operations (`/api/git/*`)

### `POST /api/git/status`
Returns modified, untracked, and staged files.

### `POST /api/git/commit`
Creates a git commit with author attribution.

### `POST /api/git/branches`
Lists local and remote branches.

### `POST /api/git/diff`
Returns split diff hunk against `HEAD` or target commit.

---

## 4. Google Jules Cloud Integration (`/api/jules/*`)

### `POST /api/jules/sources`
Fetches authenticated GitHub sources accessible to the Jules Agent.

### `POST /api/jules/create-session`
Dispatches a new background engineering session on Jules Cloud VM.

### `POST /api/jules/approve-plan`
Approves proposed execution plan to initiate cloud Pull Request generation.

---

## 5. Security & Test Execution (`/api/test/*`, `/api/process/*`)

### `POST /api/test/run`
Executes Vitest/Jest suite on disk and streams real-time test outcomes.

### `POST /api/process/execute`
Executes an interactive terminal command via PTY shell with ANSI color translation.
