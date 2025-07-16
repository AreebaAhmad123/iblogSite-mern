import AnimationWrapper from "../common/page-animation";
import { Link } from "react-router-dom";
import {UserContext} from '../App';
import { useContext } from "react";
import { logoutUser } from "../common/auth"; 

// Helper to calculate age from date string
function getAgeFromDOB(dob) {
    if (!dob) return null;
    const birthDate = new Date(dob);
    if (isNaN(birthDate)) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

const UserNavigationPanel = () => {
    const { userAuth: { username, personal_info = {} }, setUserAuth } = useContext(UserContext);
    const signOutUser = () => {
        logoutUser(setUserAuth);
    }
    const profileImg = personal_info.profile_img || "/src/imgs/user profile.png";
    const fullname = personal_info.fullname || username;
    const dob = personal_info.dob || personal_info.date_of_birth;
    const age = getAgeFromDOB(dob);
    return (
        <AnimationWrapper className="absolute right-0 z-50" transition={{ duration: 0.2 }}>
            <div className="bg-white absolute right-0 border border-grey w-60 duration-200 rounded-b-xl overflow-hidden">
                <div className="flex flex-col items-center py-4 border-b border-grey">
                    <Link to={`/user/${username}`} className="flex flex-col items-center group">
                        <img src={profileImg} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-yellow-400 group-hover:scale-105 transition-transform" />
                        <span className="mt-2 font-semibold text-lg text-black group-hover:underline">{fullname}</span>
                    </Link>
                    {age !== null && (
                        <span className="text-gray-500 text-sm mt-1">Age: {age}</span>
                    )}
                </div>
                <Link to={`/user/${username}`} className="link pl-8 py-4">
                    Profile
                </Link>
                <Link to="/dashboard/notification" className="link pl-8 py-4">
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