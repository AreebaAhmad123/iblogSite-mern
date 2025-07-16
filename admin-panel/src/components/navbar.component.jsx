import { useState, useEffect, useRef, useContext } from "react";
import { Link, Outlet } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { UserContext, FooterContext } from '../App';
import UserNavigationPanel from "../components/user-navigation.component"
import axios from "../common/axios-config";
import { ThemeContext } from "../App";
import { motion, AnimatePresence } from "framer-motion";
import { 
  fadeInDown, 
  dropdownAnimation, 
  navItemHover, 
  buttonHover,
  searchBarAnimation,
  notificationAnimation
} from "../common/animations";

const Navbar = () => {
  const [userNavPanel, setUserNavPanel] = useState(false);
  const { userAuth, setUserAuth } = useContext(UserContext);
  const { blogImages, categories } = useContext(FooterContext);
  let {theme, setTheme} = useContext(ThemeContext);
  const profile_img = userAuth?.personal_info?.profile_img || userAuth?.profile_img;
  const new_notification_available = userAuth?.new_notification_available;
  // Consider user logged in if they have a username, profile_img, or fullname
  const isLoggedIn = !!(userAuth?.username || userAuth?.profile_img || userAuth?.fullname || userAuth?.personal_info?.username || userAuth?.personal_info?.profile_img || userAuth?.personal_info?.fullname);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const searchRef = useRef(null);
  const menuRef = useRef(null);
  const [searchBoxVisibility, setSearchBoxVisibility] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const inputRef = useRef(null);

  const location = useLocation();
  let navigate = useNavigate();

  const hideSearchRoutes = ["/login", "/signup"];
  const shouldShowSearch = !hideSearchRoutes.includes(location.pathname);
  const handleUserNavPanel = () => {
    setUserNavPanel(currentVal => !currentVal);
  };
  const handleBlur = () => {
    setTimeout(() => {
      setUserNavPanel(false)

    }, 200);
  }
  const handleSearch = (e) => {
    let query = e.target.value.trim();

    if (e.keyCode === 13 && query.length) {
      navigate(`/search/${query}`);
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchBoxVisibility(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (searchBoxVisibility && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchBoxVisibility]);

  useEffect(() => {
    setSearchBoxVisibility(false);
  }, [location.pathname]);

  const handleThemeToggle = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.body.setAttribute("data-theme", newTheme);
    sessionStorage.setItem("theme", newTheme);
  };

  const handleNotificationClick = () => {
    // Immediately mark notifications as seen when clicking the icon
    if (new_notification_available && isLoggedIn) {
      const updatedUserAuth = { ...userAuth, new_notification_available: false };
      setUserAuth(updatedUserAuth);
      axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/api/seen-notifications", {}, {
        headers: {
          'Authorization': `Bearer ${isLoggedIn}`
        }
      }).catch(err => {
        console.log('Error marking notifications as seen:', err);
      });
    }
  };

  // Calculate number of columns for categories dropdown
  const columns = Math.max(1, Math.ceil(categories.length / 10));
  const mainWebsiteUrl = import.meta.env.VITE_MAIN_WEBSITE_URL;

  return (
    <>
      <motion.nav 
        className="navbar z-50 mb-2 bg-white shadow-md dark:bg-dark-grey h-[80px]"
        variants={fadeInDown}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.5 }}
      >
        <div className="w-full max-w-[1400px] mx-auto px-[5vw] flex items-center justify-between h-full">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-4"
          >
            <Link to="/" className="text-2xl font-bold text-[#185d4e] shrink-0 logo-text">
              Islamuna
            </Link>
          </motion.div>

          <div className="flex items-center gap-5 shrink-0">
            <button
                className="w-12 h-12 rounded-full bg-grey relative hover:bg-black/10 dark-hover flex items-center justify-center hidden md:flex"
                onClick={handleThemeToggle}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <i className="fi fi-rr-sun text-xl "></i>
                ) : (
                  <i className="fi fi-rr-moon-stars text-xl"></i>
                )}
              </button>
            <button
              className="px-4 py-2 rounded bg-black text-white font-semibold hover:bg-gray-900 transition-colors duration-200 hidden md:block"
              onClick={() => window.open(mainWebsiteUrl, '_blank')}
            >
              Go to Main Website
            </button>
            {isLoggedIn ? (
              <>
                {userAuth?.admin && (
                  <Link className="border-2 border-grey rounded-full px-5 py-0 hidden md:block" to="/admin">
                    <i className="fi fi-rr-lock text-sm pt-2 -ml-2"></i> Admin Panel
                  </Link>
                )}
                <Link to={userAuth?.admin ? "/admin?section=notifications" : "/dashboard/notification"} className="hidden md:block">
                  <button 
                    className="w-12 h-12 rounded-full bg-grey relative hover:bg-black/10 dark-hover"
                    onClick={handleNotificationClick}
                  >
                    <i className="fi fi-rr-bell text-2xl block mt-1"></i>
                    {new_notification_available ? (
                      <span className="bg-red w-3 h-3 rounded-full absolute z-10 top-2 right-2"></span>
                    ) : ""}
                  </button>
                </Link>


                <div className="relative hidden md:block">
                  <button className="w-12 h-12 " onClick={handleUserNavPanel} onBlur={handleBlur}>
                    <img
                      src={profile_img || "/default-profile.png"}
                      alt="Profile"
                      className="w-full h-full object-cover rounded-full"
                    />
                  </button>
                  {userNavPanel && <UserNavigationPanel />}

                </div>
              </>
            ) : (
              <>
                <Link className="btn-light py-2 hidden md:block" to="/login">
                  Login
                </Link>
                <Link className="btn-dark py-2 hidden md:block" to="/signup">
                  SignUp
                </Link>
              </>
            )}
          </div>

          <div ref={menuRef} className="flex items-center gap-2 md:gap-6 ">
            <button
              className="md:hidden bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center"
              onClick={() => setSearchBoxVisibility(currentVal => !currentVal)}
            >
              <i className="fi fi-rr-search text-xl"></i>
            </button>
            <button
                className="w-12 h-12 rounded-full bg-grey relative hover:bg-black/10 dark-hover flex items-center justify-center md:hidden"
                onClick={handleThemeToggle}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <i className="fi fi-rr-sun text-xl "></i>
                ) : (
                  <i className="fi fi-rr-moon-stars text-xl"></i>
                )}
              </button>
            {isLoggedIn && (
              <>
                <Link to={userAuth?.admin ? "/admin?section=notifications" : "/dashboard/notification"} className="md:hidden">
                  <button 
                    className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center relative"
                    onClick={handleNotificationClick}
                  >
                    <i className="fi fi-rr-bell text-xl"></i>
                    {new_notification_available ? (
                      <span className="bg-red w-3 h-3 rounded-full absolute z-10 top-2 right-2"></span>
                    ) : (
                      ""
                    )}
                  </button>
                </Link>
                <div className="relative md:hidden" onClick={handleUserNavPanel} onBlur={handleBlur}>
                  <button className="w-6 h-6">
                    <img
                      src={profile_img || "/default-profile.png"}
                      alt="Profile"
                      className="w-full h-full object-cover rounded-full"
                    />
                  </button>
                  {
                    userNavPanel ? <UserNavigationPanel />
                      : ""
                  }
                </div>
              </>
            )}
            <button
              className="md:hidden "
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <i className="fi fi-br-menu-burger text-xl "></i>
            </button>
          </div>
        </div>

        <div
          ref={searchRef}
          className={
            "absolute bg-white mt-0.5 left-0 w-full border-b border-grey py-4 px-[5vw] md:block md:border-0 md:relative md:inset-0 md:p-0 md:w-auto md:show " +
            (searchBoxVisibility ? "block" : "hidden") +
            " md:hidden lg:hidden "
          }
        >
          <div className="relative">
            <div className="flex w-full md:w-[400px] lg:w-[700px] sm:w-[400px] gap-2">
              <input
                type="text"
                placeholder="Search"
                className="w-full px-4 py-2 border border-grey-100 rounded-md text-black focus:outline-none"
                onKeyDown={handleSearch}
                ref={inputRef}
              />
              <button
                className="bg-black text-white w-10 h-10 flex items-center justify-center rounded-md border border-grey-100"
                onClick={() => {
                  const query = inputRef.current?.value.trim();
                  if (query?.length) {
                    navigate(`/search/${query}`);
                  }
                }}
                tabIndex={0}
                aria-label="Search"
                type="button"
              >
                <i className="fi fi-rr-search text-xl"></i>
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-30 z-[9998] md:hidden"
              onClick={() => setIsMenuOpen(false)}
            ></div>
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 right-0 h-full w-72 max-w-full bg-white py-6 px-6 shadow-lg z-[9999] border-l border-gray-200 md:hidden flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <button
                className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-black focus:outline-none"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Close menu"
              >
                <i className="fi fi-br-cross"></i>
              </button>
              <div className="flex flex-col space-y-6 mt-10">
                <Link to="/" className="text-gray-600 navHover" onClick={() => setIsMenuOpen(false)}>
                  Home
                </Link>
                <div className="flex items-center">
                  <Link
                    to="/categories"
                    className="text-gray-600 navHover flex-1"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setShowCategoryDropdown(false);
                    }}
                  >
                    Categories
                  </Link>
                  <button
                    className="text-gray-600 navHover flex items-center text-left ml-2"
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    aria-label="Show categories dropdown"
                  >
                    <i className="fi fi-rr-angle-small-down navHover pt-1"></i>
                  </button>
                </div>
                {showCategoryDropdown && (
                  <div className="ml-4 mt-1 bg-white rounded shadow-lg z-50 max-h-60 overflow-y-auto">
                    <div className="flex flex-col">
                      {categories.map((cat) => (
                        <Link
                          key={cat}
                          to={`/categories/${encodeURIComponent(cat)}`}
                          className="block px-4 py-2 text-gray-700 categoryDropdownHover categoryDropdownItem capitalize border-b border-gray-100 last:border-b-0"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {cat}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                <Link to="/contact" className="text-gray-600 navHover" onClick={() => setIsMenuOpen(false)}>
                  Contact
                </Link>
                <Link to="/about" className="text-gray-600 navHover" onClick={() => setIsMenuOpen(false)}>
                  About
                </Link>
                {/* Go to Main Website button for mobile */}
                <button
                  className="px-4 py-2 rounded bg-black text-white font-semibold hover:bg-gray-900 transition-colors duration-200 text-left"
                  style={{ marginTop: '8px', marginBottom: '8px' }}
                  onClick={() => { setIsMenuOpen(false); window.open(mainWebsiteUrl, '_blank'); }}
                >
                  Go to Main Website
                </button>
                {isLoggedIn ? (
                  <>
                    {userAuth?.admin && (
                      <Link to="/admin" className="text-gray-600 navHover" onClick={() => setIsMenuOpen(false)}>
                        <i className="fi fi-rr-lock text-sm pt-2 -ml-2"></i> Admin Panel
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    <Link to="/login" className="text-gray-600 navHover" onClick={() => setIsMenuOpen(false)}>
                      Login
                    </Link>
                    <Link to="/signup" className="text-gray-600 navHover" onClick={() => setIsMenuOpen(false)}>
                      SignUp
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </motion.nav>
      {shouldShowSearch && (
        <div className="search flex lg:block md:block py-2 bg-white gap-4 ">
          <div className="w-full max-w-[1400px] mx-auto px-[5vw] flex items-center gap-2 ">
            <div className="flex w-full md:w-[400px] lg:w-[700px] sm:w-[400px] gap-2">
              <input
                type="text"
                placeholder="Search"
                className="w-full px-4 py-2 border border-grey-100 rounded-md text-black focus:outline-none"
                onKeyDown={handleSearch}
                ref={inputRef}
              />
              <button
                className="bg-black text-white w-10 h-10 flex items-center justify-center rounded-md border border-grey-100"
                onClick={() => {
                  const query = inputRef.current?.value.trim();
                  if (query?.length) {
                    navigate(`/search/${query}`);
                  }
                }}
                tabIndex={0}
                aria-label="Search"
                type="button"
              >
                <i className="fi fi-rr-search text-xl"></i>
              </button>
            </div>
          </div>
        </div>
      )}
      <Outlet />
    </>
  );
};

export default Navbar; 