import Embed from "@editorjs/embed";
import List from "@editorjs/list";
import Image from "@editorjs/image";
import Header from "@editorjs/header";
import Quote from "@editorjs/quote";
import Marker from "@editorjs/marker";
import InlineCode from "@editorjs/inline-code";
import axios from "axios";
import { lookInSession } from "../common/session";

const uploadImageByFile = async (file) => {
    try {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            throw new Error("Only JPG, JPEG, and PNG files are allowed");
        }

        // Validate file size (max 2MB)
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
            throw new Error("Image size must be less than 2MB");
        }

        // Convert file to base64
        const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        const userAuth = JSON.parse(lookInSession("user") || "{}");

        const response = await axios.post(
            `${import.meta.env.VITE_SERVER_DOMAIN}/api/upload-image`,
            { image: base64 },
            {
                timeout: 90000 // 90 second timeout for image upload (increased from 30s)
            }
        );

        if (response.data.success === true) {
            return {
                success: 1,
                file: {
                    url: response.data.url
                }
            };
        } else {
            throw new Error("Upload failed");
        }
    } catch (error) {
        console.error("Image upload error:", error);
        return {
            success: 0,
            message: error.message || "Image upload failed"
        };
    }
};

const uploadImageByURL = (url) => {
    return Promise.resolve({
        success: 1,
        file: { url }
    });
};

export const tools = {
    embed: Embed,
    list: {
        class: List,
        inlineToolBar: true
    },
    image: {
        class: Image,
        config: {
            uploader: {
                uploadByUrl: uploadImageByURL,
                uploadByFile: uploadImageByFile,
            }
        }
    },
    header: {
        class: Header,
        config: {
            placeholder: "Enter heading...",
            levels: [2, 3],
            defaultLevel: 2
        }
    },
    quote: {
        class: Quote,
        inlineToolBar: true
    },
    marker: Marker,
    inlineCode: InlineCode
};
