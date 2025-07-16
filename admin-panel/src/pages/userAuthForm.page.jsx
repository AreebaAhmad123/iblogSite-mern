import InputBox from "../components/input.component";
import { useRef, useContext, useState, useEffect } from "react";
import googleIcon from "../imgs/google.png";
import { Navigate, useNavigate } from "react-router-dom";
import AnimationWrapper from "../common/page-animation";
import { Toaster, toast } from "react-hot-toast";
import axios from "../common/axios-config";
import { UserContext } from "../App";
import { authWithGoogle } from "../common/firebase";
import csrfManager from "../common/csrf";
import ThemeToggle from "../components/theme-toggle.component.jsx";

const UserAuthForm = () => {
  let { userAuth, setUserAuth } = useContext(UserContext);
  const navigate = useNavigate();

  const [showResend, setShowResend] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  // If already logged in as admin, redirect to admin panel
  if (userAuth?.access_token && (userAuth?.admin || userAuth?.super_admin)) {
    return <Navigate to="/admin" replace />;
  }

  useEffect(() => {
    // Fetch CSRF token on mount to set the CSRF cookie
    axios.get(`${import.meta.env.VITE_SERVER_DOMAIN}/api/csrf-token`, { withCredentials: true });
  }, []);

  const userAuththroughServer = async (serverRoute, formData) => {
    try {
      console.log("[LOGIN] Sending request to:", import.meta.env.VITE_SERVER_DOMAIN + "/api" + serverRoute, formData);
      
      // Don't send CSRF token for Google auth requests since they don't need CSRF protection
      const csrfToken = serverRoute === "/google-auth" ? null : csrfManager.getCSRFToken();
      const response = await axios.post(
        import.meta.env.VITE_SERVER_DOMAIN + "/api" + serverRoute, 
        formData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {})
          }
        }
      );
      console.log("[LOGIN] Response received:", response);

      const { data } = response;

      if (serverRoute === "/login" || serverRoute === "/google-auth") {
        // Handle CSRF token from response
        if (data.csrfToken) {
          csrfManager.setCSRFToken(data.csrfToken);
        }
        
        // Check if user is admin
        if (!data.user.admin && !data.user.super_admin) {
          toast.error('Access denied. Admin privileges required.');
          return;
        }
        
        // Show success message
        if (serverRoute === "/login") {
          toast.success("Login successful!");
        } else {
          toast.success("Google authentication successful!");
        }
        console.log("[LOGIN] Login success, user data:", data.user);
        setUserAuth(data.user);
        // Store user data including access_token for authentication
        const { _id, username, email, admin, super_admin, avatar, access_token } = data.user;
        localStorage.setItem('userAuth', JSON.stringify({ _id, username, email, admin, super_admin, avatar, access_token }));
        console.log("[LOGIN] userAuth set in localStorage:", localStorage.getItem('userAuth'));
        
        // Redirect to admin panel
        navigate('/admin', { replace: true });
      }
    } catch (error) {
      console.error("[LOGIN] Error during login:", error);
      // Improved error handling for better debugging
      let errorMsg = "Login failed. Please try again.";
      
      if (error?.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error?.message) {
        errorMsg = error.message;
      } else if (typeof error === 'string') {
        errorMsg = error;
      }
      
      // Handle CSRF errors specifically
      if (errorMsg.includes('CSRF token validation failed')) {
        errorMsg = "Security validation failed. Please refresh the page and try again.";
      }
      
      // If login failed due to unverified email, show resend option
      if (errorMsg.includes("verify your email") || errorMsg.includes("Failed to send verification email")) {
        setShowResend(true);
        setResendEmail(formData.email);
      }
      
      // Show a more helpful message if email is not found
      if (errorMsg === "Email not found") {
        toast.error("No account found with this email. Please sign up first.");
      } else if (
        error?.response?.status === 403 &&
        errorMsg.includes("signed up without Google")
      ) {
        toast.error("This email was registered with a password. Please log in using your email and password instead, or use a different Google account.");
      } else if (
        error?.response?.status === 403 &&
        errorMsg.includes("created with a password")
      ) {
        toast.error("This account was created with a password. Please use your email and password to log in.");
      } else if (
        error?.response?.status === 403 &&
        errorMsg.includes("created with Google")
      ) {
        toast.error("This account was created with Google. Please use the 'Continue with Google' button to sign in.");
      } else {
        toast.error(errorMsg);
      }
      
      // Log the full error object for debugging
      console.error("[LOGIN] Full error object:", error);
      if (error?.response) {
        console.error("[LOGIN] Error response data:", error.response.data);
      }
      if (error?.response?.status === 409 && error?.response?.data?.error?.toLowerCase().includes('verified')) {
        toast.error("This email is already registered but not yet verified. A new verification email has been sent. Please check your inbox (and spam folder).");
        setShowResend(true);
        setResendEmail(formData.email);
        setInfoMsg("A new verification email has been sent to your address.");
        return;
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let serverRoute = "/login";
    let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,128}$/;

    let formElement = document.getElementById("formElement");
    if (!formElement) {
      console.error("Form element is not found");
      return;
    }
    let form = new FormData(formElement);
    let formData = {};

    for (let [key, value] of form.entries()) {
      formData[key] = value;
    }
    let { email, password } = formData;

    if (!email.length) {
      return toast.error("Enter Email");
    }
    if (!emailRegex.test(email)) {
      return toast.error("Email is invalid");
    }
    if (!passwordRegex.test(password)) {
      return toast.error("Password should be 8 to 128 characters long and must include at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*)");
    }
    
    userAuththroughServer(serverRoute, formData);
  };

  const handleGoogleAuth = (e) => {
    e.preventDefault();

    authWithGoogle()
    .then(({ idToken }) => {
        let serverRoute = "/google-auth";
        let formData = {
            id_token: idToken
        }
        userAuththroughServer(serverRoute, formData)
    })
    .catch(err => {
        toast.error("trouble login through google");
        return console.log(err)
    })
  }

  const handleResendVerification = async (e) => {
    e.preventDefault();
    if (!resendEmail) {
      toast.error("Enter your email to resend verification.");
      return;
    }
    
    try {
      const response = await axios.post(
        import.meta.env.VITE_SERVER_DOMAIN + "/api/resend-verification", 
        { email: resendEmail },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        }
      );
      
      toast.success(response.data.message || "Verification email resent. Please check your inbox.");
    } catch (error) {
      const errorMsg = error?.response?.data?.error || "Failed to resend verification email.";
      toast.error(errorMsg);
    }
  };

  return (
    <AnimationWrapper keyValue="login">
      <section className="h-cover flex items-center justify-center px-2 sm:px-0">
        <Toaster />
        <form id="formElement" className="w-full max-w-[400px] bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-8 flex flex-col relative" onSubmit={handleSubmit}>
          <div className="absolute top-4 right-4">
            <ThemeToggle />
          </div>
          <h1 className="text-2xl sm:text-4xl font-gelasio capitalize text-center mb-10 sm:mb-24 w-full text-gray-900 dark:text-gray-100">
            Admin Panel Login
          </h1>
          {infoMsg && (
            <div className="mb-4 text-green-700 dark:text-green-400 text-center text-sm sm:text-base w-full">{infoMsg}</div>
          )}
          <div className="w-full flex flex-col items-center">
            <InputBox name="email" type="email" placeholder="Email" icon="fi-rr-envelope" autoComplete="username" onChange={e => setResendEmail(e.target.value)} />
            <InputBox name="password" type="password" placeholder="Password" icon="fi-rr-key" />
            <div className="text-xs text-gray-600 dark:text-gray-300 mb-2 w-full px-2">
              Password must be 8-128 characters, include uppercase, lowercase, a number, and a special character (!@#$%^&*).
            </div>
          </div>
          <button className="btn-dark w-full mt-8 sm:mt-14 text-base sm:text-sm py-3 sm:py-3" type="submit">
            Login
          </button>
          {showResend && (
            <button className="btn-dark w-full mt-4" onClick={handleResendVerification} type="button">
              Resend verification email
            </button>
          )}
          <div className="relative w-full flex items-center gap-2 my-6 sm:my-10 opacity-10 uppercase text-black dark:text-white font-bold text-xs sm:text-base">
            <hr className="w-1/2 border-black dark:border-white" />
            <p>or</p>
            <hr className="w-1/2 border-black dark:border-white" />
          </div>
          <button className="btn-dark flex items-center justify-center gap-4 w-full text-base sm:text-sm py-3 sm:py-3" onClick={handleGoogleAuth}>
            <img src={googleIcon} className="w-5" />
            Continue with google
          </button>
          <p className="mt-6 text-dark-grey dark:text-gray-400 text-base sm:text-xl text-center w-full">
            Only admin users can access this panel
          </p>
        </form>
      </section>
    </AnimationWrapper>
  );
};

export default UserAuthForm; 