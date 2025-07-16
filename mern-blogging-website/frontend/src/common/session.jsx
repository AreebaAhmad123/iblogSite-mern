const storeInSession = (key, value) => {
    sessionStorage.setItem(key, value);
}

const lookInSession = (key) => {
    return sessionStorage.getItem(key);
}

const removeFromSession = (key) => {
    sessionStorage.removeItem(key);
}

const logOutUser = () => {
    sessionStorage.clear();
}

// Draft management utilities
const saveDraftToSession = (draftData) => {
    try {
        const draftWithTimestamp = {
            ...draftData,
            lastSaved: new Date().toISOString(),
            version: '1.0'
        };
        sessionStorage.setItem("blog_draft", JSON.stringify(draftWithTimestamp));
        return true;
    } catch (error) {
        console.error("Failed to save draft to session:", error);
        return false;
    }
};

const getDraftFromSession = () => {
    try {
        const draft = sessionStorage.getItem("blog_draft");
        if (!draft) return null;
        
        const parsedDraft = JSON.parse(draft);
        
        // Validate draft structure
        if (!parsedDraft || typeof parsedDraft !== 'object') {
            console.warn("Invalid draft structure in session");
            return null;
        }
        
        // Check if draft is too old (older than 24 hours)
        if (parsedDraft.lastSaved) {
            const draftAge = Date.now() - new Date(parsedDraft.lastSaved).getTime();
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours
            if (draftAge > maxAge) {
                console.warn("Draft is too old, removing from session");
                sessionStorage.removeItem("blog_draft");
                return null;
            }
        }
        
        return parsedDraft;
    } catch (error) {
        console.error("Failed to parse draft from session:", error);
        sessionStorage.removeItem("blog_draft");
        return null;
    }
};

const clearDraftFromSession = () => {
    try {
        sessionStorage.removeItem("blog_draft");
        return true;
    } catch (error) {
        console.error("Failed to clear draft from session:", error);
        return false;
    }
};

const hasDraftInSession = () => {
    return sessionStorage.getItem("blog_draft") !== null;
};

const getDraftInfo = () => {
    try {
        const draft = sessionStorage.getItem("blog_draft");
        if (!draft) return null;
        
        const parsedDraft = JSON.parse(draft);
        return {
            hasTitle: !!parsedDraft.title?.trim(),
            hasDescription: !!parsedDraft.des?.trim(),
            hasContent: !!(parsedDraft.content && Array.isArray(parsedDraft.content) && parsedDraft.content[0]?.blocks?.length),
            lastSaved: parsedDraft.lastSaved,
            title: parsedDraft.title || "Untitled Draft"
        };
    } catch (error) {
        console.error("Failed to get draft info:", error);
        return null;
    }
};

export { 
    storeInSession, 
    lookInSession, 
    removeFromSession, 
    logOutUser,
    saveDraftToSession,
    getDraftFromSession,
    clearDraftFromSession,
    hasDraftInSession,
    getDraftInfo
};