import { useContext, useEffect, useRef, useState } from "react";
import { UserContext } from "../App";
import axios from "axios";
import { profileDataStructure } from "./profile.page";
import Loader from "../components/loader.component";
import { Toaster, toast } from "react-hot-toast";
import InputBox from "../components/input.component";
import AnimationWrapper from "../common/page-animation";
import { storeInSession } from "../common/session";
import { uploadImage } from "../common/cloudinary";
import csrfManager from "../common/csrf";


const EditProfile = () => {
    let { userAuth, userAuth: { access_token }, setUserAuth } = useContext(UserContext);

    let bioLimit = 150;

    let profileImgEle = useRef();
    let EditProfileForm = useRef();

    const [profile, setProfile] = useState(profileDataStructure);
    const [loading, setLoading] = useState(true);
    const [charactersLeft, setCharactersLeft] = useState(bioLimit);
    const [updatedProfileImg, setUpdatedProfileImg] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [currentUsername, setCurrentUsername] = useState(userAuth.username);
    const [isSubmitting, setIsSubmitting] = useState(false); // For disabling submit button
    const [isUploading, setIsUploading] = useState(false); // For disabling upload button

    let { personal_info: { fullname, username: profile_username, profile_img, email, bio, firstname, lastname }, social_links } = profile;
    
    const handleCharacterChange = (e) => {
        setCharactersLeft(bioLimit - e.target.value.length)
    }

    const handleBioChange = (e) => {
        setCharactersLeft(bioLimit - e.target.value.length);
        // Update the profile state with the new bio value
        setProfile(prev => ({
            ...prev,
            personal_info: {
                ...prev.personal_info,
                bio: e.target.value
            }
        }));
    }

    const handleSocialLinkChange = (key, value) => {
        setProfile(prev => ({
            ...prev,
            social_links: {
                ...prev.social_links,
                [key]: value
            }
        }));
    }

    const handleUsernameChange = (e) => {
        setProfile(prev => ({
            ...prev,
            personal_info: {
                ...prev.personal_info,
                username: e.target.value
            }
        }));
    }

    const handleImagePreview = (e) => {
        let img = e.target.files[0];
        profileImgEle.current.src = URL.createObjectURL(img);
        setUpdatedProfileImg(img);
    }

    const openFilePicker = () => {
        document.getElementById('uploadImg').click();
    }

    const handleImageUpload = (e) => {
        e.preventDefault();
        if (isUploading) return;
        
        if (!updatedProfileImg) {
            openFilePicker();
            return;
        }

        setIsUploading(true);
        let loadingToast = toast.loading("Uploading...");

        uploadImage(updatedProfileImg, access_token)
            .then(url => {
                if (url) {
                    axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/api/update-profile-img", { url })
                        .then(({ data }) => {
                            let newUserAuth = { ...userAuth, profile_img: data.profile_img };
                            setUserAuth(newUserAuth);
                            setUpdatedProfileImg(null);
                            setRefreshTrigger(prev => prev + 1);
                            toast.dismiss(loadingToast);
                            toast.success("Uploaded 👍");
                        })
                        .catch((error) => {
                            toast.dismiss(loadingToast);
                            let errorMsg = error?.response?.data?.error || error.message || "Upload failed. Please try again.";
                            toast.error(errorMsg);
                        });
                } else {
                    toast.dismiss(loadingToast);
                    toast.error("Upload failed. Please try again.");
                }
            })
            .catch(err => {
                toast.dismiss(loadingToast);
                let errorMsg = err?.response?.data?.error || err.message || "Upload failed. Please try again.";
                toast.error(errorMsg);
            })
            .finally(() => {
                setIsUploading(false);
            });
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        // Use state for submission
        const { firstname, lastname, username, email, bio } = profile.personal_info;
        const { youtube, facebook, twitter, github, instagram, website } = social_links;

        if (!firstname || firstname.length < 1) {
            return toast.error("First name must be at least 1 letter long");
        }

        if (!lastname || lastname.length < 1) {
            return toast.error("Last name must be at least 1 letter long");
        }

        if (!username || username.length < 3) {
            return toast.error("Username should be at least 3 letters long");
        }

        if ((bio || '').length > bioLimit) {
            return toast.error(`Bio should not be more than ${bioLimit}`);
        }

        setIsSubmitting(true);
        let loadingToast = toast.loading("Updating ...");

        const csrfToken = csrfManager.getCSRFToken();
        axios.post(
            import.meta.env.VITE_SERVER_DOMAIN + "/api/update-profile",
            {
                firstname,
                lastname,
                fullname,
                email,
                username,
                bio,
                social_links: { youtube, facebook, twitter, github, instagram, website }
            },
            {
                headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {}
            }
        )
            .then(({ data }) => {
                // Update all relevant fields in userAuth
                let newUserAuth = {
                    ...userAuth,
                    username: data.username,
                    email: data.email,
                    fullname: data.fullname,
                    firstname: data.firstname,
                    lastname: data.lastname,
                    bio: profile.personal_info.bio,
                    social_links: profile.social_links
                };
                setUserAuth(newUserAuth);
                setCurrentUsername(data.username);
                setRefreshTrigger(prev => prev + 1);
                toast.dismiss(loadingToast);
                toast.success("Profile Updated");
            })
            .catch((error) => {
                toast.dismiss(loadingToast);
                let errorMsg = error?.response?.data?.error || error.message || "Update failed";
                toast.error(errorMsg);
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    }

    const handleFullnameChange = (e) => {
        setProfile(prev => ({
            ...prev,
            personal_info: {
                ...prev.personal_info,
                fullname: e.target.value
            }
        }));
    }

    const handleEmailChange = (e) => {
        setProfile(prev => ({
            ...prev,
            personal_info: {
                ...prev.personal_info,
                email: e.target.value
            }
        }));
    }

    useEffect(() => {
        if (access_token && currentUsername) {
            axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/api/get-profile", { username: currentUsername })
                .then(({ data }) => {
                    setProfile(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.log(err);
                    setLoading(false);
                })
        }
    }, [access_token, currentUsername, refreshTrigger]);

    // Update currentUsername when userAuth.username changes (for initial load)
    useEffect(() => {
        setCurrentUsername(userAuth.username);
    }, [userAuth.username]);

    return (
        <AnimationWrapper>
            {loading ? <Loader /> : (
                <form ref={EditProfileForm} className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-8 md:p-12 relative" onSubmit={handleSubmit}>
                    <Toaster />
                    {/* Top grid for main fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <label className="block mb-1 font-medium">First Name</label>
                            <InputBox name="firstname" type="text" value={profile.personal_info.firstname || ''} placeholder="First Name" icon="fi-rr-user" onChange={e => setProfile(prev => ({...prev, personal_info: {...prev.personal_info, firstname: e.target.value}}))} />
                        </div>
                        <div>
                            <label className="block mb-1 font-medium">Last Name</label>
                            <InputBox name="lastname" type="text" value={profile.personal_info.lastname || ''} placeholder="Last Name" icon="fi-rr-user" onChange={e => setProfile(prev => ({...prev, personal_info: {...prev.personal_info, lastname: e.target.value}}))} />
                        </div>
                        <div>
                            <label className="block mb-1 font-medium">User Name</label>
                            <InputBox name="username" type="text" value={profile.personal_info.username} placeholder="User Name" icon="fi-rr-at" onChange={handleUsernameChange} />
                        </div>
                        <div>
                            <label className="block mb-1 font-medium">Email</label>
                            <InputBox name="email" type="email" value={profile.personal_info.email || ''} placeholder="Email" icon="fi-rr-envelope" onChange={handleEmailChange} />
                        </div>
                    </div>

                    {/* Profile Image Upload */}
                    <div className="mb-10">
                        <label className="block mb-2 font-medium">Add Profile Image</label>
                        <div className="w-full max-w-2xl mx-auto">
                            <div className="border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 flex flex-col items-center justify-center py-16 relative group transition-all duration-200">
                                <img ref={profileImgEle} src={profile_img} className="w-24 h-24 object-cover rounded-full mb-4" />
                                <i className="fi fi-rr-picture text-5xl text-gray-300 mb-2"></i>
                                <p className="text-gray-400 mb-2">Drop Image Here, Paste Or</p>
                                <input type="file" id="uploadImg" accept=".jpg, .png, .jpeg" hidden onChange={handleImagePreview} />
                                <button type="button" className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md shadow hover:bg-gray-300" onClick={openFilePicker} disabled={isUploading}>+ Select</button>
                                {updatedProfileImg && (
                                    <button type="button" className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs shadow hover:bg-red-600" onClick={() => { setUpdatedProfileImg(null); profileImgEle.current.src = profile_img; }}>Reset</button>
                                )}
                                {updatedProfileImg && (
                                    <button type="button" className="mt-4 bg-yellow-400 hover:bg-yellow-500 text-white font-semibold px-6 py-2 rounded-lg shadow-lg flex items-center gap-2" onClick={handleImageUpload} disabled={isUploading}>
                                        {isUploading ? "Uploading..." : "Upload Image"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Social Links Section */}
                    <label className="block mb-1 font-medium mt-8">Social Links</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                        {Object.keys(social_links).map((key, i) => {
                            let link = social_links[key];
                            return (
                                <div key={i} className="flex items-center gap-2">
                                    <i className={"fi " + (key !== 'website' ? "fi-brands-" + key : "fi-rr-globe") + " text-xl text-dark-grey"}></i>
                                    <InputBox 
                                        name={key} 
                                        type="text" 
                                        value={link || ""} 
                                        placeholder={key.charAt(0).toUpperCase() + key.slice(1)} 
                                        onChange={(e) => handleSocialLinkChange(key, e.target.value)}
                                    />
                                </div>
                            );
                        })}
                    </div>

                    {/* Save Button */}
                    <button className="fixed bottom-8 right-8 bg-yellow-400 hover:bg-yellow-500 text-white font-semibold px-8 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50" type="submit" disabled={isSubmitting}>
                        <i className="fi fi-rr-disk"></i> {isSubmitting ? "Saving..." : "Save"}
                    </button>
                </form>
            )}
        </AnimationWrapper>
    );
}

export default EditProfile; 