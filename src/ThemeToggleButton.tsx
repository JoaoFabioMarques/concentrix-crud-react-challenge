import React from 'react';
import { useTheme } from './ThemeContext';

const ThemeToggleButton: React.FC = () => {
  const { toggleTheme, theme } = useTheme();

  return (
    <div className='my-1 w-[95%] flex items-end justify-end'>
    <button
      onClick={toggleTheme}
      className={`p-2 rounded transition duration-300 ${
        theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-black'
      }`}
    >
      Alternar para {theme === 'dark' ? 'tema claro' : 'tema escuro'}
    </button>
    </div>
  );
};

export default ThemeToggleButton;
