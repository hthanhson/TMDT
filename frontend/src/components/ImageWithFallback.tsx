import React, { useState } from 'react';
import { Box } from '@mui/material';
import { FALLBACK_IMAGE } from '../utils/imageHelpers';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({ src, alt, className }) => {
  const [imgError, setImgError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.log('Image load error for:', src);
    setImgError(true);
    setIsLoading(false);
    // Đảm bảo fallback được set
    const target = e.currentTarget;
    if (target.src !== FALLBACK_IMAGE) {
      target.src = FALLBACK_IMAGE;
    }
  };

  return (
    <Box
      component="img"
      src={imgError ? FALLBACK_IMAGE : src}
      alt={alt}
      loading="lazy"
      onLoad={handleLoad}
      onError={handleError}
      sx={{
        width: 60,
        height: 60,
        objectFit: 'cover',
        borderRadius: 1,
        backgroundColor: 'background.paper',
        transition: 'opacity 0.3s ease',
        opacity: isLoading ? 0.5 : 1,
        border: '1px solid',
        borderColor: 'divider',
        // Fallback styling khi ảnh lỗi
        ...(imgError && {
          backgroundColor: 'grey.100',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        })
      }}
      className={className}
    />
  );
};