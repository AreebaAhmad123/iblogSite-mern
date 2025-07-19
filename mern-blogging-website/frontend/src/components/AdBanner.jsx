import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Loader from "./loader.component";

const AdBanner = () => {
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerLink, setBannerLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const viewCounted = useRef(false);
  const lastClickTime = useRef(0);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const fetchBanner = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get("/api/ad-banner");
        setBannerUrl(res.data.banner.imageUrl);
        setBannerLink(res.data.banner.link || "");
        // Debounce: Only count view once per session for this banner
        const bannerViewKey = `adBannerView_${res.data.banner.imageUrl}`;
        if (!sessionStorage.getItem(bannerViewKey)) {
          axios.patch("/api/ad-banner/view");
          sessionStorage.setItem(bannerViewKey, "1");
        }
      } catch (err) {
        setBannerUrl("");
        setError("No ad banner available.");
      } finally {
        setLoading(false);
      }
    };
    fetchBanner();
  }, []);

  useEffect(() => {
    setImgError(false); // Reset error when banner changes
  }, [bannerUrl]);

  const handleClick = () => {
    if (bannerUrl) {
      // Throttle: Only allow one click per 2 seconds per session
      const now = Date.now();
      const bannerClickKey = `adBannerClick_${bannerUrl}`;
      const lastClick = parseInt(sessionStorage.getItem(bannerClickKey) || "0", 10);
      if (now - lastClick > 2000) {
        axios.patch("/api/ad-banner/click");
        sessionStorage.setItem(bannerClickKey, now.toString());
      }
    }
  };

  const isValidUrl = (url) => /^https?:\/\/.+/.test(url);

  return (
    <div className="w-full flex justify-center my-8 min-h-[80px]">
      {loading ? (
        <Loader size="medium" />
      ) : bannerUrl && !imgError ? (
        isValidUrl(bannerLink) ? (
          <a href={bannerLink} target="_blank" rel="noopener noreferrer" onClick={handleClick}>
            <img
              src={bannerUrl}
              alt="Advertisement Banner"
              className="w-full max-w-5xl rounded shadow object-cover"
              style={{ height: "auto" }}
              onError={() => setImgError(true)}
            />
          </a>
        ) : (
          <img
            src={bannerUrl}
            alt="Advertisement Banner"
            className="w-full max-w-5xl rounded shadow object-cover"
            style={{ height: "auto" }}
            onClick={handleClick}
            onError={() => setImgError(true)}
          />
        )
      ) : (
        <div className="text-gray-400 italic text-center w-full">
          {imgError ? "Failed to load ad banner image." : error}
        </div>
      )}
    </div>
  );
};

export default AdBanner; 