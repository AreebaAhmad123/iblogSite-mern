import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Loader from "./loader.component";
import defaultAdImage from '../imgs/banner.webp'; // fallback image

const DEFAULT_AD_IMAGE = defaultAdImage;

const AdBanner = () => {
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerLink, setBannerLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const fetchBanner = async () => {
      setLoading(true);
      try {
        const res = await axios.get("/api/ad-banner");
        setBannerUrl(res.data.banner.imageUrl);
        setBannerLink(res.data.banner.link || "");
      } catch (err) {
        setBannerUrl("");
      } finally {
        setLoading(false);
      }
    };
    fetchBanner();
  }, []);

  useEffect(() => {
    setImgError(false); // Reset error when banner changes
  }, [bannerUrl]);

  const isValidUrl = (url) => /^https?:\/\/.+/.test(url);

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto my-6 h-48 flex items-center justify-center">
        <Loader size="medium" />
      </div>
    );
  }

  const imgSrc = bannerUrl && !imgError ? bannerUrl : DEFAULT_AD_IMAGE;

  const image = (
    <img
      src={imgSrc}
      alt="Advertisement Banner"
      className="w-full h-48 object-cover rounded-3xl border border-gray-200 shadow-xl transition-transform duration-300 hover:shadow-2xl hover:-translate-y-1 bg-white"
      onError={() => setImgError(true)}
      style={{ display: 'block', margin: '0 auto' }}
    />
  );

  return (
    <div className="w-full max-w-5xl mx-auto my-8 px-2 sm:px-0 transition-all duration-300">
      {isValidUrl(bannerLink) ? (
        <a href={bannerLink} target="_blank" rel="noopener noreferrer" className="block group">
          {image}
        </a>
      ) : (
        image
      )}
    </div>
  );
};

export default AdBanner; 