// components/reviewPrice/PhotoGallery.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './PhotoGallery.css';

interface Photo {
  urlString: string;
  [key: string]: any;
}

interface PhotoGalleryProps {
  priceIndex?: string | number;
}

export default function PhotoGallery({ priceIndex }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const res = await axios.get<{ photos?: Photo[] }>('/wine/pricePhotos', {
          params: { priceIndex },
        });
        setPhotos(res.data.photos || []);
      } catch (err) {
        console.error('사진 불러오기 실패', err);
      }
    };

    if (priceIndex) fetchPhotos();
  }, [priceIndex]);

  if (!photos.length) return null;

  return (
    <div className="photo-gallery">
      {photos.map((photo, idx) => (
        <a
          key={idx}
          href={photo.urlString}
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src={photo.urlString} alt={`사진 ${idx + 1}`} />
        </a>
      ))}
    </div>
  );
}

