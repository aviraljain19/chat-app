import axios from "axios";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/react";

const PrivateRoute = ({ children }) => {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [isSyncing, setIsSyncing] = useState(true);
  const [didSync, setDidSync] = useState(false);
  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      localStorage.removeItem("userInfo");
      setIsSyncing(false);
      setDidSync(true);
      return;
    }

    const syncClerkUser = async () => {
      try {
        setIsSyncing(true);

        const token = await getToken().catch(() => null);
        const payload = {
          clerkUserId: user?.id || null,
          email:
            user?.primaryEmailAddress?.emailAddress ||
            user?.emailAddresses?.[0]?.emailAddress ||
            null,
          username:
            user?.username ||
            user?.firstName ||
            `clerk-${user?.id?.slice(-6)}` ||
            "clerk-user",
          name: user?.firstName || user?.lastName || null,
        };

        const response = await axios.post(
          "https://chat-app-ochre-ten-30.vercel.app/api/users/sync-clerk-user",
          payload,
          {
            withCredentials: true,
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          },
        );

        localStorage.setItem("userInfo", JSON.stringify(response?.data?.user));
      } catch (error) {
        console.error("Clerk sync failed:", error);
        if (user) {
          localStorage.setItem(
            "userInfo",
            JSON.stringify({
              _id: user.id,
              username:
                user.username || user.firstName || `clerk-${user.id.slice(-6)}`,
              email:
                user.primaryEmailAddress?.emailAddress ||
                user.emailAddresses?.[0]?.emailAddress ||
                `${user.id}@clerk.local`,
              isAdmin: false,
              token: "offline-clerk-session",
            }),
          );
        } else {
          localStorage.removeItem("userInfo");
        }
      } finally {
        setIsSyncing(false);
        setDidSync(true);
      }
    };

    syncClerkUser();
  }, [getToken, isLoaded, isSignedIn, user]);

  if (!isLoaded || isSyncing) return null;
  if (!isSignedIn) return <Navigate to="/" replace />;
  if (!didSync) return null;

  return children;
};

export default PrivateRoute;
