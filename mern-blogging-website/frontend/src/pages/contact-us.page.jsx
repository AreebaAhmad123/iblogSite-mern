import React, { useState, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import ReCAPTCHA from 'react-google-recaptcha';

const initialForm = { subject: '', name: '', email: '', explanation: '' };
const initialErrors = { subject: '', name: '', email: '', explanation: '' };

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ContactUsPage = () => {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [errors, setErrors] = useState(initialErrors);
  const explanationRef = useRef();
  const [recaptchaToken, setRecaptchaToken] = useState("");

  // Inline validation
  const validate = (field, value) => {
    let error = '';
    if (!value) error = 'Required';
    if (field === 'email' && value && !emailRegex.test(value)) error = 'Invalid email';
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: validate(name, value) }));
  };

  // Formatting buttons
  const insertAtCursor = (before, after = '', placeholder = '') => {
    const textarea = explanationRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end) || placeholder;
    const newText = textarea.value.substring(0, start) + before + selected + after + textarea.value.substring(end);
    setForm((prev) => ({ ...prev, explanation: newText }));
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + before.length + selected.length + after.length;
    }, 0);
  };

  const handleFormat = (type) => {
    switch (type) {
      case 'image': {
        const url = prompt('Enter image URL:');
        if (url) insertAtCursor('![Image](', ')', url);
        break;
      }
      case 'color': {
        const color = prompt('Enter color (e.g., red or #ff0000):');
        if (color) insertAtCursor(`[color=${color}]`, '[/color]');
        break;
      }
      case 'text':
        insertAtCursor('**', '**', 'bold');
        break;
      case 'align':
        insertAtCursor('[center]', '[/center]');
        break;
      case 'link': {
        const link = prompt('Enter URL:');
        if (link) insertAtCursor('[Link text](', ')', link);
        break;
      }
      default:
        break;
    }
  };

  // Validate all before submit
  const validateAll = () => {
    const newErrors = {};
    Object.keys(form).forEach((key) => {
      newErrors[key] = validate(key, form[key]);
    });
    setErrors(newErrors);
    return Object.values(newErrors).every((e) => !e);
  };

  const handleRecaptchaChange = (token) => {
    setRecaptchaToken(token);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) return;
    if (!recaptchaToken) {
      toast.error("Please complete the CAPTCHA to continue.");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_DOMAIN || ''}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, recaptchaToken })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        toast.success(data.message || 'Message sent successfully!');
        setForm(initialForm);
        setErrors(initialErrors);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send message.' });
        toast.error(data.error || 'Failed to send message.');
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to send message.' });
      toast.error('Failed to send message.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-[5vw] py-6 contact-page-content">
      <Toaster />
      {/* Feedback message */}
      {message && (
        <div className={`mb-4 p-3 rounded text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{message.text}</div>
      )}
      <div className="max-w-6xl mx-auto">
        {/* Main Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-4 sm:p-6 flex flex-col gap-6" encType="multipart/form-data">
          {/* Top Row: Subject, Name, Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm sm:text-base text-black dark:text-white mb-1">Subject</label>
              <input name="subject" value={form.subject} onChange={handleChange} type="text" className={`w-full rounded-md border ${errors.subject ? 'border-red-400' : 'border-gray-200'} bg-grey px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder-gray-400 text-sm sm:text-base`} placeholder="Subject" />
              {errors.subject && <div className="text-xs text-red-500 mt-1">{errors.subject}</div>}
            </div>
            <div>
              <label className="block text-sm sm:text-base text-black dark:text-white mb-1">Name</label>
              <input name="name" value={form.name} onChange={handleChange} type="text" className={`w-full rounded-md border ${errors.name ? 'border-red-400' : 'border-gray-200'} bg-grey px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder-gray-400 text-sm sm:text-base`} placeholder="Name" />
              {errors.name && <div className="text-xs text-red-500 mt-1">{errors.name}</div>}
            </div>
            <div>
              <label className="block text-sm sm:text-base text-black dark:text-white mb-1">Email</label>
              <input name="email" value={form.email} onChange={handleChange} type="email" className={`w-full rounded-md border ${errors.email ? 'border-red-400' : 'border-gray-200'} bg-grey px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder-gray-400 text-sm sm:text-base`} placeholder="Email" />
              {errors.email && <div className="text-xs text-red-500 mt-1">{errors.email}</div>}
            </div>
          </div>

          {/* Explanation and File Upload */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Explanation Area */}
            <div className="flex-1">
              <label className="block text-sm sm:text-base text-black dark:text-white mb-1">Explanation</label>
              <div className="bg-gray-100 rounded-lg p-3 sm:p-4">
                {/* Formatting Buttons */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <button type="button" onClick={() => handleFormat('image')} className="bg-white border border-gray-200 rounded px-2 py-1 text-xs flex items-center gap-1 hover:bg-gray-50"><i className="fi fi-rs-picture"></i> Image</button>
                  <button type="button" onClick={() => handleFormat('color')} className="bg-white border border-gray-200 rounded px-2 py-1 text-xs flex items-center gap-1 hover:bg-gray-50"><i className="fi fi-rc-eye-dropper"></i> Color</button>
                  <button type="button" onClick={() => handleFormat('text')} className="bg-white border border-gray-200 rounded px-2 py-1 text-xs flex items-center gap-1 hover:bg-gray-50"><i className="fi fi-rr-text"></i> Text</button>
                  <button type="button" onClick={() => handleFormat('align')} className="bg-white border border-gray-200 rounded px-2 py-1 text-xs flex items-center gap-1 hover:bg-gray-50"><i className="fi fi-rr-symbol"></i> Align</button>
                  <button type="button" onClick={() => handleFormat('link')} className="bg-white border border-gray-200 rounded px-2 py-1 text-xs flex items-center gap-1 hover:bg-gray-50"><i className="fi fi-rr-link-alt"></i> Link</button>
                </div>
                {/* Textarea */}
                <textarea
                  ref={explanationRef}
                  name="explanation"
                  value={form.explanation}
                  onChange={handleChange}
                  className={`w-full h-32 sm:h-40 rounded-md border ${errors.explanation ? 'border-red-400' : 'border-gray-200'} p-3 bg-gray-50 focus:outline-none resize-none placeholder-gray-400 text-sm sm:text-base`}
                  placeholder="Type..."
                />
                {errors.explanation && <div className="text-xs text-red-500 mt-1">{errors.explanation}</div>}
              </div>
            </div>
          </div>

          {/* reCAPTCHA */}
          <div className="my-4">
            <ReCAPTCHA
              sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
              onChange={handleRecaptchaChange}
            />
          </div>

          {/* Send Button */}
          <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-2">
            <button type="submit" disabled={loading} className="bg-yellow-400 hover:bg-yellow-500 text-white font-semibold px-4 sm:px-6 py-2 rounded-lg flex items-center gap-2 shadow-md disabled:opacity-50 w-full sm:w-auto">
              <i className="fi fi-rs-paper-plane"></i> {loading ? (<span className="flex items-center"><svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>Sending...</span>) : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactUsPage; 