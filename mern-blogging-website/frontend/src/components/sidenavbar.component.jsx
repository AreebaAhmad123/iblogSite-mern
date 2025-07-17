import { useContext, useRef, useState, useEffect } from "react";
import { Outlet, Navigate, NavLink } from "react-router-dom";
import { UserContext } from "../App";
import axios from "axios";

const SideNav = () => {
  const { userAuth, setUserAuth } = useContext(UserContext) || {};
  const access_token = userAuth?.access_token;
  const new_notification_available = userAuth?.new_notification_available;

  let page = location.pathname.split("/")[2];

  let [pageState, setPageState] = useState(page.replace('-', ' '));
  let [showSideNav, setShowSideNav] = useState(false);

  let activeTabLine = useRef();
  let sideBarIconTab = useRef();
  let pageStateTab = useRef();

  const changePageState = (e) => {
    let { offsetWidth, offsetLeft } = e.target;

    activeTabLine.current.style.width = offsetWidth + "px";
    activeTabLine.current.style.left = offsetLeft + "px";

    if (e.target === sideBarIconTab.current) {
      setShowSideNav(true);
    } else {
      setShowSideNav(false);
    }
  }

  const handleNotificationClick = () => {
    // Immediately mark notifications as seen when clicking the link
    if (new_notification_available && access_token) {
      const updatedUserAuth = { ...userAuth, new_notification_available: false };
      updateUserAuth(updatedUserAuth, setUserAuth);
      axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/api/seen-notifications", {}, {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      }).catch(err => {
        console.log('Error marking notifications as seen:', err);
      });
    }
  };

  useEffect(() => {
    setShowSideNav(false);
    pageStateTab.current.click();
  }, [pageState]);

  return (
    access_token === null ? <Navigate to="/login" /> :
      <section className="relative flex gap-10 py-0 m-0 max-md:flex-col">
        <div className="z-30">
          {/* Mobile Header - Simple responsive header */}
          <div className="md:hidden bg-white py-1 border-b border-grey flex flex-nowrap overflow-x-auto">
            <button ref={sideBarIconTab} className="p-5 capitalize" onClick={changePageState}>
              <i className="fi fi-rr-bars-staggered pointer-events-none"></i>
            </button>
            <button ref={pageStateTab} className="p-5 capitalize" onClick={changePageState}>
              {pageState}
            </button>
            <hr ref={activeTabLine} className="absolute bottom-0 duration-500" />
          </div>

          {/* Sidebar Navigation */}
          <div className={"min-w-[200px] h-[calc(100vh-80px-60px)] md:sticky md:top-24 overflow-y-auto p-6 md:pr-0 md:border-grey md:border-r bg-white max-md:absolute max-md:top-0 max-md:left-0 max-md:w-full max-md:h-screen max-md:z-30 duration-500" +
            (showSideNav ? " max-md:translate-x-0 max-md:opacity-100 max-md:pointer-events-auto" : " max-md:-translate-x-full max-md:opacity-0 max-md:pointer-events-none")}>
            <h1 className="text-xl text-dark-grey mb-3">Settings</h1>
            <hr className="border-grey -ml-6 mb-8 mr-6" />
            <NavLink to="/settings/edit-profile" onClick={(e) => setPageState(e.target.innerText)} className="sidebar-link">
              <i className="fi fi-rr-user"></i>
              Edit Profile
            </NavLink>
            <NavLink to="/settings/change-password" onClick={(e) => setPageState(e.target.innerText)} className="sidebar-link">
              <i className="fi fi-rr-lock"></i>
              Change Password
            </NavLink>
          </div>
        </div>

        <div className="max-md:mt-0 mt-5 w-full">
          <Outlet />
        </div>
      </section>
  )
}

export default SideNav;
