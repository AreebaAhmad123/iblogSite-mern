import { useState, useEffect, useCallback } from 'react';

export const useLoading = (initialState = false) => {
  const [isLoading, setIsLoading] = useState(initialState);
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('');

  const startLoading = useCallback((text = '') => {
    setIsLoading(true);
    setProgress(0);
    setLoadingText(text);
  }, []);

  const updateProgress = useCallback((newProgress) => {
    setProgress(Math.min(100, Math.max(0, newProgress)));
  }, []);

  const finishLoading = useCallback(() => {
    setProgress(100);
    setTimeout(() => {
      setIsLoading(false);
      setProgress(0);
      setLoadingText('');
    }, 300);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setProgress(0);
    setLoadingText('');
  }, []);

  return {
    isLoading,
    progress,
    loadingText,
    startLoading,
    updateProgress,
    finishLoading,
    stopLoading
  };
};

export const useAsyncLoading = (asyncFunction, dependencies = []) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const execute = useCallback(async (...args) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await asyncFunction(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [asyncFunction]);

  useEffect(() => {
    return () => {
      setIsLoading(false);
      setError(null);
      setData(null);
    };
  }, dependencies);

  return {
    isLoading,
    error,
    data,
    execute
  };
};

export const useStaggeredLoading = (items, delay = 100) => {
  const [loadedItems, setLoadedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const startStaggeredLoading = useCallback(() => {
    setIsLoading(true);
    setLoadedItems([]);

    items.forEach((item, index) => {
      setTimeout(() => {
        setLoadedItems(prev => [...prev, item]);
        if (index === items.length - 1) {
          setIsLoading(false);
        }
      }, index * delay);
    });
  }, [items, delay]);

  const resetStaggeredLoading = useCallback(() => {
    setLoadedItems([]);
    setIsLoading(false);
  }, []);

  return {
    loadedItems,
    isLoading,
    startStaggeredLoading,
    resetStaggeredLoading
  };
};

export const useImageLoading = () => {
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [failedImages, setFailedImages] = useState(new Set());

  const markImageLoaded = useCallback((imageSrc) => {
    setLoadedImages(prev => new Set([...prev, imageSrc]));
  }, []);

  const markImageFailed = useCallback((imageSrc) => {
    setFailedImages(prev => new Set([...prev, imageSrc]));
  }, []);

  const isImageLoaded = useCallback((imageSrc) => {
    return loadedImages.has(imageSrc);
  }, [loadedImages]);

  const isImageFailed = useCallback((imageSrc) => {
    return failedImages.has(imageSrc);
  }, [failedImages]);

  const resetImageLoading = useCallback(() => {
    setLoadedImages(new Set());
    setFailedImages(new Set());
  }, []);

  return {
    loadedImages,
    failedImages,
    markImageLoaded,
    markImageFailed,
    isImageLoaded,
    isImageFailed,
    resetImageLoading
  };
};

export const usePageLoading = (loadingTime = 1500) => {
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / loadingTime) * 100, 100);
      setLoadingProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsPageLoading(false);
        }, 200);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [loadingTime]);

  const resetPageLoading = useCallback(() => {
    setIsPageLoading(true);
    setLoadingProgress(0);
  }, []);

  return {
    isPageLoading,
    loadingProgress,
    resetPageLoading
  };
}; 