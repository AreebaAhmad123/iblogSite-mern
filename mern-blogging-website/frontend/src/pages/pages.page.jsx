import React from 'react';
import { Link } from 'react-router-dom';

const PagesPage = () => {
  const pages = [
    {
      title: "About Us",
      description: "Learn more about Islamic Stories and our mission",
      link: "/about",
      icon: "📖"
    },
    {
      title: "Contact Us", 
      description: "Get in touch with our team",
      link: "/contact",
      icon: "📧"
    },
    {
      title: "Categories",
      description: "Explore stories by category",
      link: "/categories", 
      icon: "📂"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Pages</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {pages.map((page, index) => (
          <Link 
            key={index}
            to={page.link}
            className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200"
          >
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">{page.icon}</span>
              <h2 className="text-xl font-semibold text-gray-800">{page.title}</h2>
            </div>
            <p className="text-gray-600">{page.description}</p>
          </Link>
        ))}
      </div>
      
      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">More Coming Soon</h2>
        <p className="text-gray-600">
          We're constantly adding new pages and features to enhance your experience. 
          Stay tuned for more content and functionality!
        </p>
      </div>
    </div>
  );
};

export default PagesPage; 