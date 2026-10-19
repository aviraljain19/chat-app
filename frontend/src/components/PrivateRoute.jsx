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
      setIsSyncing(true);

      const maxRetries = 4;
      let attempt = 0;
      let lastError = null;

      while (attempt < maxRetries) {
        try {
          const token = await getToken().catch(() => null);

          if (!token) {
            lastError = new Error("No clerk token available");
            break;
          }

          // try syncing using the server endpoint (server will validate Clerk token)
          const { data } = await axios.post(
            "http://localhost:5000/api/users/sync-clerk-user",
            {},
            {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            },
          );

          if (data?.user) {
            localStorage.setItem("userInfo", JSON.stringify(data.user));
            lastError = null;
            break;
          }
        } catch (err) {
          lastError = err;
          const backoff = Math.pow(2, attempt) * 500;
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, backoff));
        }

        attempt += 1;
      }

      if (lastError) {
        console.error("Clerk sync failed after retries:", lastError);
        localStorage.removeItem("userInfo");
      }

      setIsSyncing(false);
      setDidSync(true);
    };

    syncClerkUser();
  }, [getToken, isLoaded, isSignedIn, user]);

  if (!isLoaded || isSyncing) return null;
  if (!isSignedIn) return <Navigate to="/" replace />;
  if (!didSync) return null;

  // If the synced user doesn't have a chosen username (or has a fallback like 'clerk-...'),
  // redirect them to the profile setup page before allowing access to protected routes.
  try {
    const stored = localStorage.getItem("userInfo");
    if (stored) {
      const u = JSON.parse(stored);
      const uname = u?.username || "";
      if (!uname || /^clerk-/i.test(uname)) {
        return <Navigate to="/setup-profile" replace />;
      }
    }
  } catch (e) {
    // ignore parse errors and continue
  }

  return children;
};

export default PrivateRoute;

