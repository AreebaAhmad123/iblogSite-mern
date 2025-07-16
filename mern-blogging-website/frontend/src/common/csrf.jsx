// CSRF Token Management Utility
// Automatically handles CSRF tokens for all requests

class CSRFManager {
    constructor() {
        this.token = null;
        this.initialized = false;
    }

    // Get CSRF token from cookies
    getCSRFToken() {
        if (this.token) {
            return this.token;
        }

        // Try to get from cookie
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'csrf-token') {
                this.token = value;
                return value;
            }
        }
        return null;
    }

    // Set CSRF token (called after login/signup)
    setCSRFToken(token) {
        this.token = token;
        this.initialized = true;
    }

    // Clear CSRF token (called on logout)
    clearCSRFToken() {
        this.token = null;
        this.initialized = false;
    }

    // Check if CSRF is initialized
    isInitialized() {
        return this.initialized || this.getCSRFToken() !== null;
    }

    // Get CSRF token for headers
    getCSRFHeader() {
        const token = this.getCSRFToken();
        return token ? { 'X-CSRF-Token': token } : {};
    }
}

// Create singleton instance
const csrfManager = new CSRFManager();

export default csrfManager; 