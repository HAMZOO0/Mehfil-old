import axios from "axios";
import toast from "react-hot-toast";
import { BASE_URL } from "../../config variables.js";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Include credentials with requests
});

export const getAllPosts = async () => {
  try {
    const response = await api.get("/posts/all-posts");
    return response.data;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

export const uploadPost = async (data) => {
  try {
    const response = await api.post("/posts/upload-post", data);
    toast.success("Post created successfully");
    return response.data;
  } catch (error) {
    console.error("Error:", error);
    toast.error(error?.response?.data?.error || "Failed to create post");
    throw error;
  }
};
export const userPosts = async (userid) => {
  try {
    const response = await api.get(`posts/user-posts/${userid}`);

    return response.data;
  } catch (error) {
    console.error("Error:", error);
    toast.error(error?.response?.data?.error || "Failed to fetched post");
    throw error;
  }
};
export const postDelete = async (postid) => {
  try {
    const response = await api.delete(`/posts/delete-post/${postid}`);
    console.log("response", response);

    return response.data;
  } catch (error) {
    console.error("Error:", error);
    toast.error(error?.response?.data?.error || "Failed to fetched post");
    throw error;
  }
};
