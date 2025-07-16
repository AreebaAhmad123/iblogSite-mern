import InputBox from "../components/input.component";
import { useRef, useContext, useState, useEffect } from "react";
import googleIcon from "../imgs/google.png";
import { Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import AnimationWrapper from "../common/page-animation";
import { Toaster, toast } from "react-hot-toast";
import axios from "axios";
import { UserContext } from "../App";
import { authWithGoogle } from "../common/firebase";
import csrfManager from "../common/csrf";
import ReCAPTCHA from "react-google-recaptcha";

const UserAuthForm = ({ type }) => {
  let { userAuth, setUserAuth } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [showResend, setShowResend] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [recaptchaToken, setRecaptchaToken] = useState("");

  const params = new URLSearchParams(location.search);
  const next = params.get('next');

  // Post-login redirect logic
  useEffect(() => {
    if (userAuth && userAuth.username) {
      if (next) {
        navigate(next, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
    // eslint-disable-next-line
  }, [userAuth, next]);

  useEffect(() => {
    // Fetch CSRF token on mount to set the CSRF cookie
    const baseUrl = import.meta.env.VITE_SERVER_DOMAIN?.replace(/\/$/, '') || '';
    axios.get(`${baseUrl}/api/csrf-token`, { withCredentials: true });
  }, []);

  const userAuththroughServer = async (serverRoute, formData) => {
    try {
      
      const csrfToken = csrfManager.getCSRFToken();
      const headers = {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      };
      
      // Only add CSRF token for routes that require it (not google-auth)
      if (serverRoute !== "/google-auth" && csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
      
      // Ensure no double slashes in URL
      const baseUrl = import.meta.env.VITE_SERVER_DOMAIN?.replace(/\/$/, '') || '';
      const response = await axios.post(
        `${baseUrl}/api${serverRoute}`, 
        formData,
        {
          withCredentials: true,
          headers
        }
      );

      const { data } = response;

      if (serverRoute === "/signup") {
        setInfoMsg("Signup successful! Please check your email to verify your account.");
        setShowResend(true);
        setResendEmail(formData.email);
      } else if (serverRoute === "/login" || serverRoute === "/google-auth") {
        // Handle CSRF token from response
        if (data.csrfToken) {
          csrfManager.setCSRFToken(data.csrfToken);
        }
        
        // Show success message
        if (serverRoute === "/login") {
          toast.success("Login successful!");
        } else {
          toast.success("Google authentication successful!");
        }
        setUserAuth(data.user);
        // Only store non-sensitive info in localStorage
        const { _id, username, email, admin, super_admin, avatar, access_token } = data.user;
        localStorage.setItem('userAuth', JSON.stringify({ _id, username, email, admin, super_admin, avatar, access_token }));
      }
    } catch (error) {
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
      
      // Show a more helpful message if email is not found or invalid
      if (errorMsg === "Email not found" || errorMsg === "Invalid email or password") {
        toast.error("No account found with this email. Please sign up first.");
        return;
      } else if (
        error?.response?.status === 403 &&
        errorMsg.includes("created with a password")
      ) {
        toast.error("This account was registered using email and password. Please log in using your email and password instead of Google.");
        return;
      } else if (
        error?.response?.status === 403 &&
        errorMsg.includes("created with Google")
      ) {
        toast.error("This account was created with Google. Please use the 'Continue with Google' button to sign in.");
        return;
      } else if (
        errorMsg.toLowerCase().includes("verify your email") || errorMsg.toLowerCase().includes("not yet verified")
      ) {
        toast.error("Your email is not verified. Please check your inbox for a verification link.");
        setShowResend(true);
        setResendEmail(formData.email);
        setInfoMsg("A verification email has been sent. Please verify your account to continue.");
        return;
      } else {
        toast.error(errorMsg);
      }
      
      if (error?.response) {
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
    let serverRoute = type === "login" ? "/login" : "/signup";
    let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,128}$/;

    let formElement = document.getElementById("formElement");
    if (!formElement) {
      return;
    }
    let form = new FormData(formElement);
    let formData = {};

    for (let [key, value] of form.entries()) {
      formData[key] = value;
    }
    let { firstname, lastname, email, password, confirmPassword } = formData;

    if (type !== "login") {
      if (!firstname || firstname.length < 1) {
        return toast.error("First name is required and must be at least 1 letter long.");
      }
      if (!/^[A-Za-z]+$/.test(firstname)) {
        return toast.error("First name should only contain letters.");
      }
      if (!lastname || lastname.length < 1) {
        return toast.error("Last name is required and must be at least 1 letter long.");
      }
      if (!/^[A-Za-z]+$/.test(lastname)) {
        return toast.error("Last name should only contain letters.");
      }
      if ((firstname + ' ' + lastname).trim().length < 3) {
        return toast.error("Full name must be at least 3 letters long.");
      }
      if (!confirmPassword || password !== confirmPassword) {
        return toast.error("Passwords do not match.");
      }
      if (!recaptchaToken) {
        return toast.error("Please complete the CAPTCHA to continue.");
      }
    }
    if (!email.length) {
      return toast.error("Please enter your email address.");
    }
    if (!emailRegex.test(email)) {
      return toast.error("Please enter a valid email address.");
    }
    if (!passwordRegex.test(password)) {
      return toast.error("Password should be 8 to 128 characters long and must include at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*)");
    }
    if (type !== "login") {
      formData["recaptchaToken"] = recaptchaToken;
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
        const baseUrl = import.meta.env.VITE_SERVER_DOMAIN?.replace(/\/$/, '') || '';
        console.log("[LOGIN] Sending request to:", `${baseUrl}/api${serverRoute}`);
        userAuththroughServer(serverRoute, formData)
    })
    .catch(err => {
        console.log("[LOGIN] Error during login:", err);
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

  const handleRecaptchaChange = (token) => {
    setRecaptchaToken(token);
  };

  return (
    <AnimationWrapper keyValue={type}>
      <section className="h-cover flex items-center justify-center px-2 sm:px-0">
        <Toaster />
        <form id="formElement" className="w-full max-w-[400px] bg-white rounded-lg shadow-md p-4 sm:p-8 flex flex-col" onSubmit={handleSubmit}>
          <h1 className="text-2xl sm:text-4xl font-gelasio capitalize text-center mb-10 sm:mb-24 w-full">
            {type === "login" ? "Welcome back" : "Join us today"}
          </h1>
          {infoMsg && (
            <div className="mb-4 text-green-700 text-center text-sm sm:text-base w-full">{infoMsg}</div>
          )}
          <div className="w-full flex flex-col items-center">
          {type !== "login" ? (
            <>
              <InputBox name="firstname" type="text" placeholder="First Name" icon="fi-rr-user" />
              <InputBox name="lastname" type="text" placeholder="Last Name" icon="fi-rr-user" />
            </>
          ) : ""}
          <InputBox name="email" type="email" placeholder="Email" icon="fi-rr-envelope" autoComplete="username" onChange={e => setResendEmail(e.target.value)} />
          <InputBox name="password" type="password" placeholder="Password" icon="fi-rr-key" />
          <div className="text-xs text-gray-600 dark:text-gray-300 mb-2 w-full px-2">
            Password must be 8-128 characters, include uppercase, lowercase, a number, and a special character (!@#$%^&*).
          </div>
          {type !== "login" && (
            <>
              <ReCAPTCHA
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                onChange={handleRecaptchaChange}
                className="mb-4"
              />
              <InputBox name="confirmPassword" type="password" placeholder="Confirm Password" icon="fi-rr-key" />
            </>
          )}
          </div>
          <button className="btn-dark w-full mt-8 sm:mt-14 text-base sm:text-sm py-3 sm:py-3" type="submit">
            {type === "signup" ? "Sign Up" : "Login"}
          </button>
          {showResend && (
            <button className="btn-dark w-full mt-4" onClick={handleResendVerification} type="button">
              Resend verification email
            </button>
          )}
          <div className="relative w-full flex items-center gap-2 my-6 sm:my-10 opacity-10 uppercase text-black font-bold text-xs sm:text-base">
            <hr className="w-1/2 border-black" />
            <p>or</p>
            <hr className="w-1/2 border-black " />
          </div>
          <button className="btn-dark flex items-center justify-center gap-4 w-full text-base sm:text-sm py-3 sm:py-3" onClick={handleGoogleAuth}>
            <img src={googleIcon} className="w-5" />
            Continue with google
          </button>
          {type === "login" ? (
            <p className="mt-6 text-dark-grey text-base sm:text-xl text-center w-full">
              Don't have an account?
              <Link to={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"} className="underline text-black text-base sm:text-xl ml-1">Join us today</Link>
            </p>
          ) : (
            <p className="mt-6 text-dark-grey text-base sm:text-xl text-center w-full">
              Already a member?
              <Link to={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="underline text-black text-base sm:text-xl ml-1">Sign in here.</Link>
            </p>
          )}
        </form>
      </section>
    </AnimationWrapper>
  );
};

export default UserAuthForm;