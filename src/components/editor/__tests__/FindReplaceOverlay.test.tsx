import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { FindReplaceOverlay } from '../FindReplaceOverlay';

afterEach(cleanup);

describe('FindReplaceOverlay Component', () => {
  const defaultProps = {
    isFindOpen: true,
    setIsFindOpen: vi.fn(),
    findText: 'const',
    setFindText: vi.fn(),
    replaceText: '',
    setReplaceText: vi.fn(),
    findMatches: [10, 25, 40],
    findMatchIndex: 0,
    handlePrevMatch: vi.fn(),
    handleNextMatch: vi.fn(),
    handleReplaceOne: vi.fn(),
    handleReplaceAll: vi.fn(),
  };

  it('renders nothing when isFindOpen is false', () => {
    const { container } = render(<FindReplaceOverlay {...defaultProps} isFindOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders find input with match counter when isFindOpen is true', () => {
    render(<FindReplaceOverlay {...defaultProps} />);
    const input = screen.getByPlaceholderText(/Find in file/i);
    expect(input).toBeDefined();
    expect(screen.getByText('1/3')).toBeDefined();
  });

  it('calls setFindText on typing in search field', () => {
    const setFindText = vi.fn();
    render(<FindReplaceOverlay {...defaultProps} setFindText={setFindText} />);
    const input = screen.getByPlaceholderText(/Find in file/i);
    fireEvent.change(input, { target: { value: 'function' } });
    expect(setFindText).toHaveBeenCalledWith('function');
  });

  it('toggles replace input row when replace toggle button is clicked', () => {
    render(<FindReplaceOverlay {...defaultProps} />);
    expect(screen.queryByPlaceholderText(/Replace with/i)).toBeNull();

    const toggleBtn = screen.getByTitle('Toggle Replace');
    fireEvent.click(toggleBtn);
    expect(screen.getByPlaceholderText(/Replace with/i)).toBeDefined();
  });

  it('triggers handleNextMatch and handlePrevMatch callbacks', () => {
    const handleNextMatch = vi.fn();
    const handlePrevMatch = vi.fn();
    render(
      <FindReplaceOverlay
        {...defaultProps}
        handleNextMatch={handleNextMatch}
        handlePrevMatch={handlePrevMatch}
      />
    );

    const nextBtn = screen.getByTitle(/Next Match/i);
    const prevBtn = screen.getByTitle(/Previous Match/i);

    fireEvent.click(nextBtn);
    expect(handleNextMatch).toHaveBeenCalledTimes(1);

    fireEvent.click(prevBtn);
    expect(handlePrevMatch).toHaveBeenCalledTimes(1);
  });
});
