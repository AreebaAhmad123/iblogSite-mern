import React, { useState, useEffect } from 'react';
import axios from 'axios';

const defaultImg = "https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=crop&w=400&q=80";

const CategoryCard = ({ categoryName, onCategorySelect }) => {
    const [imageUrl, setImageUrl] = useState(defaultImg);

    useEffect(() => {
        let isMounted = true;
        
        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/api/search-blogs", {
            tag: categoryName,
            limit: 1,
            select: ["banner"] 
        })
        .then(({ data }) => {
            if (isMounted && data.blogs && data.blogs.length && data.blogs[0].banner) {
                setImageUrl(data.blogs[0].banner);
            }
        })
        .catch(err => {
            console.log(err);
        });

        return () => { isMounted = false; };
    }, [categoryName]);


    return (
        <div
          className="category-card min-w-[110px] h-[48px] rounded-xl overflow-hidden relative flex-shrink-0 cursor-pointer snap-center"
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          onClick={() => onCategorySelect && onCategorySelect(categoryName)}
        >
          <div className="absolute inset-0 bg-lime-950 bg-opacity-40 flex items-center justify-center">
            <span className="text-white font-medium text-sm capitalize">#{categoryName}</span>
          </div>
        </div>
    );
};

export default CategoryCard; 