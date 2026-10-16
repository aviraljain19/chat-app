import { Navigate } from "react-router-dom";

const getStoredUser = () => {
  try {
    const storedUser = localStorage.getItem("userInfo");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
};

const PrivateRoute = ({ children }) => {
  const userInfo = getStoredUser();

  if (!userInfo?.token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
