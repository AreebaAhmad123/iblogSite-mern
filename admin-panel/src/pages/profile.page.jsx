import { useState, useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import { UserContext } from "../App";
import Loader from "../components/loader.component";
import AboutUser from "../components/about.component";
import { Link } from "react-router-dom";
import NoDataMessage from "../components/nodata.component";
import axios from "../common/axios-config";
import { getFullDay } from "../common/date";

export const profileDataStructure = {
    personal_info: {
        fullname: "",
        username: "",
        profile_img: "",
        bio: "",
    },
    account_info: {
        total_posts: 0,
        total_blogs: 0,
    },
    social_links: {},
    joinedAt: ""
};

const ProfilePage = () => {
    let { username: profileId } = useParams();
    let [profile, setProfile] = useState(profileDataStructure);
    let [loading, setLoading] = useState(true);
    const { userAuth, setUserAuth } = useContext(UserContext);
    const username = userAuth?.username || "";
    const isOwnProfile = userAuth?.username && profile.personal_info.username && userAuth.username === profile.personal_info.username;
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!profileId && userAuth?.username) {
            profileId = userAuth.username;
        }
        if (profileId) {
            setLoading(true);
            axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/api/get-profile", { username: profileId })
                .then(({ data: user }) => {
                    setProfile(user || profileDataStructure);
                    setError(null);
                })
                .catch(err => {
                    setError("User not found");
                })
                .finally(() => setLoading(false));
        }
    }, [profileId, userAuth?.username]);

    if (loading) return <Loader />;
    if (error) return <NoDataMessage message={error} />;

    return (
        <div className="max-w-3xl mx-auto p-4">
            <AboutUser
                bio={profile.personal_info.bio}
                social_links={profile.social_links}
                joinedAt={profile.joinedAt}
                personal_info={profile.personal_info}
            />
        </div>
    );
};

export default ProfilePage; 