import { Link } from "react-router-dom";
import { getFullDay } from "../common/date";

const AboutUser = ({ className = "", bio = "", social_links = {}, joinedAt, personal_info = {} }) => {
    const { firstname, lastname, username, email, fullname, profile_img } = personal_info;
    return (
        <div className={"w-full max-w-xl mx-auto flex flex-col items-center justify-center bg-white rounded-xl shadow-lg p-8 md:p-12 gap-4 text-center " + className}>
            {profile_img && (
                <img src={profile_img} alt="Profile" className="w-32 h-32 object-cover rounded-full border-4 border-primary mb-4 shadow" />
            )}
            {fullname && <h2 className="text-2xl font-bold text-gray-800 mb-1">{fullname}</h2>}
            {username && <p className="text-lg text-primary font-medium mb-1">@{username}</p>}
            {(firstname || lastname) && <p className="text-lg text-gray-600 mb-1">{firstname} {lastname}</p>}
            {email && <p className="text-base text-gray-500 mb-2">{email}</p>}
            {bio?.length ? <p className="text-lg leading-7 text-black dark:text-white mb-4">{bio}</p> : null}

            <div className="flex items-center justify-center gap-x-5 gap-y-2 flex-wrap my-4 text-dark-grey">
                {Object.keys(social_links).map((key) => {
                    let link = social_links[key];
                    return link ? (
                        <Link to={link} key={key} target="_blank">
                            <i className={"fi " + (key !== 'website' ? "fi-brands-" + key : "fi-rr-globe") + " text-2xl hover:text-primary transition-colors"}></i>
                        </Link>
                    ) : null;
                })}
            </div>

            {joinedAt && (
                <p className="text-base text-gray-400 mt-2">Joined on {getFullDay(joinedAt)}</p>
            )}
        </div>
    );
};

export default AboutUser; 