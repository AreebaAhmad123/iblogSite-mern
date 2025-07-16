import { useContext } from 'react';
import { ThemeContext } from '../App';
import { useRef } from 'react';

const ThemeToggle = () => {
  const { theme, setTheme } = useContext(ThemeContext);
  const buttonRef = useRef();

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.body.setAttribute('data-theme', newTheme);
    // Add a quick pulse animation on toggle
    if (buttonRef.current) {
      buttonRef.current.classList.remove('theme-toggle-pulse');
      void buttonRef.current.offsetWidth; // trigger reflow
      buttonRef.current.classList.add('theme-toggle-pulse');
    }
  };

  return (
    <button
      ref={buttonRef}
      onClick={toggleTheme}
      className={`flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors shadow-lg relative theme-toggle-btn ${theme === 'dark' ? 'theme-toggle-glow' : ''}`}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      style={{ outline: 'none', border: 'none' }}
    >
      <span className="absolute inset-0 flex items-center justify-center transition-transform duration-500">
        {theme === 'light' ? (
          <svg className="w-7 h-7 text-gray-700 transition-transform duration-500 rotate-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        ) : (
          <svg className="w-7 h-7 text-yellow-300 drop-shadow-lg transition-transform duration-500 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )}
      </span>
    </button>
  );
};

export default ThemeToggle; 