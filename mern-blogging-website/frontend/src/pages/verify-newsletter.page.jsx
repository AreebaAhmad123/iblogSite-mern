import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";

const VerifyNewsletterPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Verifying your subscription...");
  const [error, setError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [resendError, setResendError] = useState("");
  const emailInputRef = useRef();

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("");
      setError("Invalid verification link.");
      return;
    }
    axios.get(`${import.meta.env.VITE_SERVER_DOMAIN}/api/verify-newsletter?token=${token}`)
      .then(({ data }) => {
        setStatus("Subscription verified! Thank you for subscribing.");
        toast.success("Subscription verified!");
        setTimeout(() => {
          navigate("/");
        }, 2000);
      })
      .catch((error) => {
        setStatus("");
        setError(error?.response?.data?.error || "Verification failed.");
      });
  }, [searchParams, navigate]);

  const handleResend = async (e) => {
    e.preventDefault();
    setResendMsg("");
    setResendError("");
    setResendLoading(true);
    const email = emailInputRef.current.value.trim();
    if (!email) {
      setResendError("Please enter your email.");
      setResendLoading(false);
      return;
    }
    try {
      const res = await axios.post(`${import.meta.env.VITE_SERVER_DOMAIN}/api/resend-newsletter-verification`, { email });
      setResendMsg(res.data.message || "Verification email resent. Please check your inbox.");
    } catch (err) {
      setResendError(err.response?.data?.error || "Failed to resend verification email.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4">Newsletter Verification</h2>
        {status && <p className="text-green-700 mb-2">{status}</p>}
        {error && <p className="text-red-600 mb-2">{error}</p>}
        {error && (
          <form onSubmit={handleResend} className="mt-4 flex flex-col items-center gap-2">
            <input
              type="email"
              ref={emailInputRef}
              className="border px-3 py-2 rounded w-full max-w-xs"
              placeholder="Enter your email to resend verification"
              required
              disabled={resendLoading}
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={resendLoading}
            >
              {resendLoading ? "Resending..." : "Resend Verification Email"}
            </button>
            {resendMsg && <div className="text-green-600 text-sm">{resendMsg}</div>}
            {resendError && <div className="text-red-500 text-sm">{resendError}</div>}
          </form>
        )}
      </div>
    </div>
  );
};

export default VerifyNewsletterPage; 