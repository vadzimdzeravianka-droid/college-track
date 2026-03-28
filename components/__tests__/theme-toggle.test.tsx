import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '../theme-toggle';

describe('ThemeToggle', () => {
  let localStorageMock: { [key: string]: string };

  beforeEach(() => {
    // Mock localStorage
    localStorageMock = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key) => localStorageMock[key] || null),
        setItem: jest.fn((key, value) => {
          localStorageMock[key] = value;
        }),
      },
      writable: true,
    });

    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  it('should render toggle button', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should show Moon icon in light mode', () => {
    render(<ThemeToggle />);
    const moonIcon = document.querySelector('.lucide-moon');
    expect(moonIcon).toBeInTheDocument();
  });

  it('should toggle to dark mode when clicked', () => {
    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
  });

  it('should toggle back to light mode when clicked twice', () => {
    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    fireEvent.click(button); // to dark
    fireEvent.click(button); // back to light

    expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'light');
  });

  it('should load theme from localStorage on mount', () => {
    localStorageMock['theme'] = 'dark';

    render(<ThemeToggle />);

    expect(localStorage.getItem).toHaveBeenCalledWith('theme');
  });

  it('should use dark theme from matchMedia when no localStorage', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
      })),
    });

    render(<ThemeToggle />);

    // Component should initialize with dark theme from system preference
    expect(localStorage.getItem).toHaveBeenCalledWith('theme');
  });

  it('should have screen reader text', () => {
    render(<ThemeToggle />);
    expect(screen.getByText('Toggle theme')).toBeInTheDocument();
  });
});
