import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

export const useScrollReveal = (options = {}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { 
    once: true, 
    amount: 0.3,
    ...options 
  });
  
  return { ref, isInView };
};

export const useParallax = (speed = 0.5) => {
  const [offset, setOffset] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const scrollY = window.pageYOffset;
        const rate = scrollY * speed;
        setOffset(rate);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return { ref, offset };
};

export const useScrollProgress = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const currentProgress = (window.pageYOffset / totalHeight) * 100;
      setProgress(Math.min(currentProgress, 100));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return progress;
};

export default { useScrollReveal, useParallax, useScrollProgress };
