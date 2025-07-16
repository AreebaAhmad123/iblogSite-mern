# Islamic Stories Admin Panel

A standalone admin panel for managing the Islamic Stories website. This panel is completely independent of the main application and can be deployed separately.

## Features

- **User Management**: View, edit, and manage user accounts
- **Blog Management**: Manage blog posts, drafts, and content
- **Notifications**: Handle system notifications
- **Comments**: Moderate user comments
- **Utilities**: Administrative tools and utilities
- **Standalone Authentication**: Built-in login system
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Backend server running on `http://localhost:3000`

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   Create a `.env` file in the root directory:
   ```
   VITE_SERVER_DOMAIN=http://localhost:3000
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Access the admin panel**:
   Open your browser and go to `http://localhost:5174` (or the port shown in the terminal)

## Usage

### Login

1. Navigate to the admin panel
2. You'll be redirected to the login page
3. Enter your admin credentials (email and password)
4. Only users with admin privileges can access the panel

### Admin Panel Sections

- **User Management**: Manage user accounts, roles, and permissions
- **Blog Management**: Create, edit, and manage blog posts
- **Notifications**: Handle system notifications and alerts
- **Comments**: Moderate and manage user comments
- **Utilities**: Administrative tools and system utilities

### Logout

Click the "Logout" button in the sidebar to sign out and return to the login page.

## Security

- Only admin users can access the panel
- Authentication is handled independently from the main app
- Session management with localStorage
- Automatic redirect to login for unauthenticated users

## Development

### Project Structure

```
admin-panel/
├── src/
│   ├── admin/           # Admin components
│   ├── components/      # Shared components
│   ├── common/          # Utilities and config
│   └── pages/           # Page components
├── admin/               # Additional admin components
└── public/              # Static assets
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Deployment

The admin panel can be deployed independently:

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Deploy the `dist` folder** to your web server

3. **Configure the backend URL** in your production environment

## Troubleshooting

### Common Issues

1. **"userAuth is null"**: This means no user is logged in. Use the login page to authenticate.

2. **"Access denied"**: Only admin users can access the panel. Make sure your account has admin privileges.

3. **API connection errors**: Ensure the backend server is running on the correct URL.

4. **Environment variables**: Make sure `VITE_SERVER_DOMAIN` is set correctly in your `.env` file.

## Support

For issues or questions, please check the main project documentation or contact the development team. 
=======
# Islamic Stories Blogging Website

A full-stack MERN (MongoDB, Express.js, React.js, Node.js) blogging platform specifically designed for sharing Islamic stories, teachings, and content.

## 🌟 Features

### Frontend Features
- **Modern React Interface** with responsive design
- **Rich Text Editor** with EditorJS for content creation
- **Real-time Auto-save** functionality for drafts
- **Image Upload** with Cloudinary integration
- **User Authentication** with JWT tokens
- **Admin Dashboard** for content management
- **Search and Filter** functionality
- **Category Management** for organized content
- **Comment System** with nested replies
- **Like and Bookmark** functionality
- **Responsive Design** for all devices

### Backend Features
- **RESTful API** with Express.js
- **MongoDB Database** with Mongoose ODM
- **JWT Authentication** and authorization
- **Image Upload** handling with Cloudinary
- **Draft Management** system
- **Blog ID Generation** with validation
- **Error Handling** and validation
- **Rate Limiting** and security measures

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd islamic-stories-website
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install frontend dependencies
   cd "blogging website - frontend"
   npm install
   
   # Install backend dependencies
   cd ../server
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp server/env-template.txt server/.env
   
   # Edit the .env file with your configuration
   ```

4. **Database Setup**
   - Set up MongoDB (local or MongoDB Atlas)
   - Update the `MONGO_URI` in your `.env` file

5. **Cloudinary Setup** (for image uploads)
   - Create a Cloudinary account
   - Add your Cloudinary credentials to `.env`

### Running the Application

1. **Start the backend server**
   ```bash
   cd server
   npm start
   ```

2. **Start the frontend development server**
   ```bash
   cd "blogging website - frontend"
   npm run dev
   ```

3. **Access the application**
  

## 📁 Project Structure

```
islamic-stories-website/
├── mern-blogging-website/
│   ├── blogging website - frontend/     # React frontend
│   │   ├── src/
│   │   │   ├── components/             # React components
│   │   │   ├── pages/                  # Page components
│   │   │   ├── common/                 # Utility functions
│   │   │   └── imgs/                   # Static images
│   │   ├── dist/                       # Build output
│   │   └── package.json
│   ├── server/                         # Node.js backend
│   │   ├── Schema/                     # MongoDB schemas
│   │   ├── utils/                      # Utility functions
│   │   ├── scripts/                    # Database scripts
│   │   └── server.js                   # Main server file
│   └── package.json
├── .gitignore
└── README.md
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `server` directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/islamic-stories-blog

# JWT Configuration
SECRET_ACCESS_KEY=your-secret-key
JWT_AUDIENCE=islamic-stories-blog
JWT_ISSUER=islamic-stories-blog

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret


```

## 🛠️ Development

### Available Scripts

**Backend (server directory):**
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests
```

**Frontend (blogging website - frontend directory):**
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
```

### Database Management

The project includes several database management scripts:

- `test-draft-editing.js` - Test draft editing functionality
- `test-draft-saving.js` - Test draft saving functionality
- `test-blog-id-generation.js` - Test blog ID generation
- `fix-draft-blogids.js` - Fix missing blog IDs

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS configuration
- Rate limiting
- Environment variable protection

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- All modern browsers

## 🚀 Deployment

### Frontend Deployment
1. Build the frontend: `npm run build`
2. Deploy the `dist` folder to your hosting service
3. Configure environment variables for production

### Backend Deployment
1. Set up a Node.js hosting service (Heroku, Vercel, etc.)
2. Configure environment variables
3. Set up MongoDB Atlas for database
4. Deploy the server code

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the documentation files in the project
2. Review the test scripts for examples
3. Check the console logs for error messages
4. Create an issue in the repository

## 🔄 Recent Updates

### Latest Fixes
- ✅ Fixed draft editing functionality
- ✅ Resolved duplicate placeholder text issue
- ✅ Added publish button to review section
- ✅ Enhanced editor initialization logic
- ✅ Improved error handling and validation

### Known Issues
- None currently reported

## 📊 Performance

- Optimized image uploads with Cloudinary
- Efficient database queries with indexing
- Lazy loading for better performance
- Cached static assets

---

**Built with ❤️ for the Islamic community** 
