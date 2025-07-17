import { useContext, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import axios from "axios";
import { UserContext } from "../App";

const NotificationCommentField = ({ _id, blog_author, index = undefined, replyingTo = undefined, setReplying, notification_id, notificationData }) => {
    let [comment, setComment] = useState('');

    let { _id: user_id } = blog_author;
    let { userAuth: { access_token } } = useContext(UserContext);
    let { notifications, notifications: { results }, setNotifications } = notificationData;

  const handleComment = () => {
    if (!comment.length) {
      return toast.error("Write something to leave a comment....");
    }

    axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/api/add-comment", {
      blog_id: _id,
      blog_author: user_id,
      comment,
      parent: replyingTo
    }, {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    })
    .then(({ data }) => {
      if (data.success) {
        setReplying(false);
        // Update the notification with the reply
        if (results[index]) {
          results[index].reply = {comment, _id: data.comment._id};
          setNotifications({
            ...notifications,
            results
          });
        }
        setComment(''); // Clear the comment field
        toast.success('Reply posted successfully!');
      }
    })
    .catch(err => {
      console.error('Error posting reply:', err);
      if (err.response?.data?.error) {
        toast.error('Error posting reply: ' + err.response.data.error);
      } else {
        toast.error('Failed to post reply. Please try again.');
      }
    });
  };

    return (
        <>
            <Toaster />
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Leave a reply..." className="input-box pl-5 placeholder:text-dark-grey resize-none h-[150px] overflow-auto"></textarea>
            <button className="btn-dark mt-5 px-10" onClick={handleComment}>Reply</button>
        </>
    );
};
export default NotificationCommentField;
