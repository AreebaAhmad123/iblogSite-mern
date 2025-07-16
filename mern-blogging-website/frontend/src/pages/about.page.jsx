import React from 'react';
import blogBanner from '../imgs/logo.png';

const AboutPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 about-page-content">

      {/* New Section: Attention to Needs and Best Design */}
      <div className="bg-gray-50 rounded-xl p-6 mt-10 flex flex-col md:flex-row gap-6 items-center shadow-sm">
        {/* Text Section */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4">We pay attention to your needs and do the best .</h2>
          <p className="text-gray-600 text-sm md:text-base">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. In Islamic storytelling, every detail matters—whether it's the wisdom of the past or the inspiration for the future. Etiam ac purus vitae magna cursus viverra. 
          </p>
          <p className="text-gray-600 text-sm md:text-base mt-2">
            Suspendisse potenti nullam et molestie ac feugiat sed lectus vestibulum. Ullamcorper morbi tincidunt ornare massa eget. Dictum varius duis at consectetur lorem. 
          </p>
        </div>
        {/* Image Section */}
        <div className="flex-1 flex justify-center min-w-[250px] max-w-md">
          <div className="relative w-full h-48 md:h-56 rounded-lg overflow-hidden shadow-md">
            <img
              src={blogBanner}
              alt="Blog Banner"
              className="w-full h-full object-cover"
            />
            {/* Play Button Overlay */}
            
          </div>
        </div>
      </div>

      {/* Contact & Map Section */}
      <div className="bg-gray-50 rounded-xl p-6 mt-10 flex flex-col md:flex-row gap-6 items-center shadow-sm">
        {/* Map Section */}
        <div className="flex-1 min-w-0">
          <iframe
            title="Islamic Stories Location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.019019234263!2d-122.4194154846817!3d37.7749297797597!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8085809c5b0e6b1b%3A0x4a0b0b0b0b0b0b0b!2sMosque!5e0!3m2!1sen!2sus!4v1680000000000!5m2!1sen!2sus"
            width="100%"
            height="220"
            style={{ border: 0, borderRadius: '12px', width: '100%' }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
        {/* Info Section */}
        <div className="flex-1 min-w-0 md:pl-8">
          <h3 className="text-lg font-semibold mb-4">Islamic Stories Information</h3>
          <ul className="space-y-3 text-black dark:text-white text-sm">
            <li><span className="font-medium">Email:</span> info@islamicstories.com</li>
            <li><span className="font-medium">Phone Number:</span> +1 (234) 567-8910</li>
            <li><span className="font-medium">Fax:</span> +1 (234) 567-8911</li>
            <li><span className="font-medium">Address:</span> 1234 Faith Ave, City, Country, 12345</li>
            <li><span className="font-medium">Open:</span> 24 Hours a Day, 7 Days a Week</li>
          </ul>
        </div>
      </div>

      {/* Team Section */}
      <div className="bg-gray-50 rounded-xl p-6 mt-10 shadow-sm">
        <h3 className="text-lg font-semibold mb-6 flex items-center">
          <span className="text-yellow-500 mr-2 text-xl">•</span> Islamic Stories Team
        </h3>
        <div className="flex gap-6 overflow-x-auto pb-2">
          {/* Team Member 1 */}
          <div className="bg-white rounded-lg shadow p-4 min-w-[180px] flex flex-col items-center">
            <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Designer" className="w-20 h-20 rounded-full object-cover mb-3" />
            <div className="text-gray-500 text-sm">Designer</div>
            <div className="font-semibold mt-1">Ahmad Farooq</div>
          </div>
          {/* Team Member 2 */}
          <div className="bg-white rounded-lg shadow p-4 min-w-[180px] flex flex-col items-center">
            <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Programmer" className="w-20 h-20 rounded-full object-cover mb-3" />
            <div className="text-gray-500 text-sm">Programmer</div>
            <div className="font-semibold mt-1">Sara Khan</div>
          </div>
          {/* Team Member 3 */}
          <div className="bg-white rounded-lg shadow p-4 min-w-[180px] flex flex-col items-center">
            <img src="https://randomuser.me/api/portraits/men/65.jpg" alt="Marketing" className="w-20 h-20 rounded-full object-cover mb-3" />
            <div className="text-gray-500 text-sm">Marketing</div>
            <div className="font-semibold mt-1">Bilal Hussain</div>
          </div>
          {/* Team Member 4 */}
          <div className="bg-white rounded-lg shadow p-4 min-w-[180px] flex flex-col items-center">
            <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="Administration" className="w-20 h-20 rounded-full object-cover mb-3" />
            <div className="text-gray-500 text-sm">Administration</div>
            <div className="font-semibold mt-1">Fatima Zahra</div>
          </div>
          {/* Team Member 5 */}
          <div className="bg-white rounded-lg shadow p-4 min-w-[180px] flex flex-col items-center">
            <img src="https://randomuser.me/api/portraits/men/12.jpg" alt="CEO" className="w-20 h-20 rounded-full object-cover mb-3" />
            <div className="text-gray-500 text-sm">CEO</div>
            <div className="font-semibold mt-1">Yusuf Ali</div>
          </div>
          {/* Team Member 6 */}
          <div className="bg-white rounded-lg shadow p-4 min-w-[180px] flex flex-col items-center">
            <img src="https://randomuser.me/api/portraits/men/23.jpg" alt="Financial" className="w-20 h-20 rounded-full object-cover mb-3" />
            <div className="text-gray-500 text-sm">Financial</div>
            <div className="font-semibold mt-1">Imran Siddiqui</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage; 