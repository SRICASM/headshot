
import { useState, useEffect } from 'react';

/**
 * Preloads a sequence of images.
 * @param {string} pathFormat - The path format string (e.g., "/frames/frame_{index}.jpg").
 * @param {number} frameCount - The total number of frames.
 * @returns {Object} - { images: HTMLImageElement[], loaded: boolean, progress: number }
 */
export const useImagePreloader = (pathFormat, frameCount) => {
  const [images, setImages] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [errors, setErrors] = useState([]);

  // Use ref to keep track of loaded count without re-rendering or dependency issues in the loop
  // But for progress we need state. 

  useEffect(() => {
    let isMounted = true;
    let loadedCount = 0;
    const imgArray = [];

    const onImageLoad = () => {
      if (!isMounted) return;
      loadedCount++;
      // Update progress state
      const currentProgress = Math.round((loadedCount / frameCount) * 100);
      setProgress(currentProgress);
      setLogs(prev => [...prev.slice(-4), `Loaded: ${loadedCount}/${frameCount}`]);

      if (loadedCount === frameCount) {
        setLoaded(true);
      }
    };

    const onImageError = (e) => {
      if (!isMounted) return;
      console.error("Image failed:", e.target.src);
      setErrors(prev => [...prev, e.target.src]);
      onImageLoad(); // Still count as 'loaded'
    };

    // Parallel loading
    for (let i = 1; i <= frameCount; i++) {
      const img = new Image();
      const frameIndex = i.toString().padStart(4, '0');
      const src = pathFormat.replace('{index}', frameIndex);
      img.src = src;
      img.onload = onImageLoad;
      img.onerror = onImageError;
      imgArray.push(img);
    }

    if (isMounted) {
      setImages(imgArray);
    }

    return () => {
      isMounted = false;
      // Optional: cancel image loads if possible (not easy with standard Image object, but explicitly ignoring callbacks works)
      imgArray.forEach(img => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, [pathFormat, frameCount]);

  return { images, loaded, progress, logs, errors };
};
