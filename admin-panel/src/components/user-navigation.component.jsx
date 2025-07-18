import AnimationWrapper from "../common/page-animation";
import { Link } from "react-router-dom";
import {UserContext} from '../App';
import { useContext } from "react";
import { logoutUser } from "../common/auth"; 


const UserNavigationPanel = () => {
    const { userAuth: { username, admin }, setUserAuth } = useContext(UserContext);
    const signOutUser = () => {
        logoutUser(setUserAuth);
    }
    return (
        <AnimationWrapper className="absolute right-0 z-50" transition={{ duration: 0.2 }}>
            <div className="bg-white absolute right-0 border border-grey w-60 duration-200">
                <Link to={`/user/${username}`} className="link pl-8 py-4">
                    Profile
                </Link>
                <Link to={admin ? "/admin?section=notifications" : "/dashboard/notification"} className="link pl-8 py-4">
                    Notifications
                </Link>
                <Link to="/settings/edit-profile" className="link pl-8 py-4">
                    Settings
                </Link>
                <span className="absolute border-t border-grey w-[100%]"></span>
                <button
                    className="text-left p-4 hover:bg-grey w-full pl-8 py-4"
                    onClick={signOutUser}
                >
                    <h1 className="font-bold text-xl mg-1">Sign Out</h1>
                    <p className="text-dark-grey">@{username}</p>
                </button>

            </div>
        </AnimationWrapper>
    );
};
export default UserNavigationPanel 