import React, { useRef } from "react";
import { FaChevronRight } from "react-icons/fa";
import CategoryCard from "./category-card.component";

export default function CategorySlider({ categories = [], blogs = [], onCategorySelect }) {
  const scrollRef = useRef(null);

  const scrollRight = () => {
    scrollRef.current.scrollBy({ left: 200, behavior: "smooth" });
  };

  return (
    <div className="w-full px-[5vw] mt-6 relative">
      <div className="bg-grey w-full max-w-[1400px] mx-auto relative">
        <div
          ref={scrollRef}
          className="flex space-x-4 overflow-x-auto scrollbar-hide mx-auto snap-x snap-mandatory"
          style={{ scrollBehavior: "smooth", paddingRight: '60px' }}
        >
          {categories.map((cat) => {
            const name = typeof cat === "string" ? cat : cat.name;
            const blogsForCategory = blogs.filter(
              (b) => b.tags && b.tags.map(t => t.toLowerCase()).includes(name.toLowerCase()) && b.banner
            );
            return (
              <CategoryCard 
                  key={name}
                  categoryName={name}
                  initialBlogs={blogsForCategory}
                  onCategorySelect={onCategorySelect}
              />
            );
          })}
        </div>
        <button
          onClick={scrollRight}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white rounded-full shadow p-2 border border-grey z-10"
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}
        >
          <FaChevronRight />
        </button>
      </div>
    </div>
  );
} 