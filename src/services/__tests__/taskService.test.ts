import { describe, it, expect } from 'vitest';
import {
  filterTasks,
  canTransitionTask,
  getPriorityWeight,
  sortTasksByPriority,
} from '../taskService';
import { Task } from '../../types/task';

describe('TaskService', () => {
  const mockTasks: Task[] = [
    {
      id: 'task-1',
      title: 'Fix auth bug',
      description: 'Resolve token refresh bug',
      status: 'in_progress',
      priority: 'high',
      assigneeId: 'user-1',
      createdAt: '2026-10-22',
      tags: ['auth', 'bug'],
    },
    {
      id: 'task-2',
      title: 'Update readme',
      description: 'Add setup docs',
      status: 'todo',
      priority: 'low',
      assigneeId: 'user-2',
      createdAt: '2026-10-22',
      tags: ['docs'],
    },
    {
      id: 'task-3',
      title: 'Fix critical CVE',
      description: 'Upgrade vulnerable library',
      status: 'todo',
      priority: 'urgent',
      assigneeId: 'user-1',
      createdAt: '2026-10-22',
      tags: ['security'],
    },
  ];

  it('filters tasks by status and priority', () => {
    const todoTasks = filterTasks(mockTasks, 'todo');
    expect(todoTasks.length).toBe(2);
    expect(todoTasks.every(t => t.status === 'todo')).toBe(true);

    const highTasks = filterTasks(mockTasks, undefined, 'high');
    expect(highTasks.length).toBe(1);
    expect(highTasks[0].id).toBe('task-1');

    const urgentTodo = filterTasks(mockTasks, 'todo', 'urgent');
    expect(urgentTodo.length).toBe(1);
    expect(urgentTodo[0].id).toBe('task-3');
  });

  it('determines task status transition permissions based on role', () => {
    expect(canTransitionTask('todo', 'done', 'admin')).toBe(true);
    expect(canTransitionTask('todo', 'done', 'member')).toBe(false);
    expect(canTransitionTask('in_progress', 'done', 'member')).toBe(true);
    expect(canTransitionTask('todo', 'todo', 'member')).toBe(true);
  });

  it('computes priority weights accurately', () => {
    expect(getPriorityWeight('urgent')).toBe(4);
    expect(getPriorityWeight('high')).toBe(3);
    expect(getPriorityWeight('medium')).toBe(2);
    expect(getPriorityWeight('low')).toBe(1);
    expect(getPriorityWeight('none' as any)).toBe(0);
  });

  it('sorts tasks descending by priority weight', () => {
    const sorted = sortTasksByPriority(mockTasks);
    expect(sorted[0].priority).toBe('urgent');
    expect(sorted[1].priority).toBe('high');
    expect(sorted[2].priority).toBe('low');
  });
});
