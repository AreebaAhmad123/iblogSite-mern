import axios from "axios";
import { useContext, useState, useEffect, useRef } from "react";
import { UserContext } from "../App";
import NotificationCard from "../components/notification-card.component";
import Loader from "../components/loader.component";
import { filterPaginationData } from "../common/filter-pagination-data";
import LoadMoreDataBtn from "../components/load-more.component";
import InPageNavigation from "../components/inpage-navigation.component";

const AdminNotifications = () => {
  const { userAuth, setUserAuth } = useContext(UserContext);
  const [notifications, setNotifications] = useState({ results: [], totalDocs: 0, page: 1 });
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const tabRefs = useRef([]);

  const isAdmin = userAuth?.admin === true || userAuth?.super_admin === true;
  const isSuperAdmin = userAuth?.super_admin === true;
  const filters = isSuperAdmin
    ? ['all', 'like', 'comment', 'reply', 'new_user', 'admin_status_change_request']
    : isAdmin
    ? ['all', 'like', 'comment', 'reply', 'new_user']
    : ['reply'];

  const tabLabels = isSuperAdmin
    ? ["All", "Likes", "Comments", "Replies", "New Users", "Requests"]
    : isAdmin
    ? ["All", "Likes", "Comments", "Replies", "New Users"]
    : ["Replies"];

  const fetchNotifications = ({ page, deletedDocCount = 0 }) => {
    setLoading(true);
    axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/api/notifications", {
      page, filter, deletedDocCount
    }, {
      headers: { 'Authorization': `Bearer ${userAuth.access_token}` }
    })
      .then(async ({ data: { notifications: data } }) => {
        console.log('Fetched notifications:', data);
        // Mark all notifications as seen
        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/api/seen-notifications", {}, {
          headers: { 'Authorization': `Bearer ${userAuth.access_token}` }
        });
        let formattedData = await filterPaginationData({
          state: notifications,
          data, page,
          countRoute: "/all-notifications-count",
          data_to_send: { filter },
          user: userAuth.access_token
        });
        setNotifications(formattedData);
        setLoading(false);
      })
      .catch(err => {
        setLoading(false);
        setNotifications({ results: [], totalDocs: 0, page: 1 });
      });
  };

  useEffect(() => {
    if (userAuth.access_token) {
      fetchNotifications({ page: 1 });
    }
    // eslint-disable-next-line
  }, [userAuth.access_token, filter]);

  const handleTabChange = (index) => {
    setActiveTabIndex(index);
    const newFilter = filters[index];
    setFilter(newFilter);
    setNotifications({ results: [], totalDocs: 0, page: 1 });
  };

  const renderNotificationsTab = (filterType) => {
    if (filter !== filterType) {
      return <div className="text-gray-500 text-center">Loading...</div>;
    }

    return (
      <>
        {loading ? (
          <Loader />
        ) : notifications && notifications.results && notifications.results.length ? (
          <div className="space-y-6">
            {notifications.results.map((notification, idx) => (
              <NotificationCard
                key={notification._id || idx}
                data={notification}
                index={idx}
                notificationState={{ notifications, setNotifications }}
              />
            ))}
            <div className="mt-6">
              <LoadMoreDataBtn state={notifications} fetchDataFun={fetchNotifications} additionalParam={{ deletedDocCount: notifications?.deletedDocCount }} />
            </div>
          </div>
        ) : (
          <div className="text-gray-500 text-center">No {filterType === 'all' ? '' : filterType} notifications found.</div>
        )}
      </>
    );
  };

  return (
    <div className="w-full max-w-full md:max-w-3xl mx-auto p-2 xs:p-3 sm:p-4 md:p-8">
      <h1 className="text-xl sm:text-2xl font-medium mb-4 sm:mb-6">All Notifications</h1>
      <div className="relative mb-4 sm:mb-8 bg-white border-b border-grey flex flex-nowrap overflow-x-auto">
        { tabLabels.map((route, i) => (
          <button
            ref={el => tabRefs.current[i] = el}
            key={i}
            className={`p-2 sm:p-4 px-3 sm:px-5 capitalize ${
              activeTabIndex === i ? "text-black " : "text-dark-grey "
            }`}
            onClick={() => handleTabChange(i)}
          >
            {route}
          </button>
        ))}
        <hr className="absolute bottom-0 duration-300" style={{
          width: tabRefs.current[activeTabIndex]?.offsetWidth + "px",
          left: tabRefs.current[activeTabIndex]?.offsetLeft + "px"
        }} />
      </div>
      <div className="space-y-4 sm:space-y-6">
        {renderNotificationsTab(filter)}
      </div>
    </div>
  );
};

export default AdminNotifications; 