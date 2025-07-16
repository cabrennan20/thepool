import '../styles/globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import { useEffect } from 'react';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // Force dark mode by adding dark class to html element
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}