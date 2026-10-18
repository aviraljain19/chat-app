import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import Login from "./pages/Login";
import Chat from "./pages/Chat";
import LandingPage from "./pages/LandingPage";

const theme = extendTheme({
  fonts: {
    heading: "Inter, system-ui, sans-serif",
    body: "Inter, system-ui, sans-serif",
  },
  colors: {
    brand: {
      950: "#070b17",
      900: "#0c1220",
      850: "#121a2b",
      800: "#1b2438",
      700: "#202d4a",
      600: "#294dff",
      500: "#4f46e5",
      400: "#6d78ff",
      300: "#8aa3ff",
    },
  },
  shadows: {
    soft: "0 12px 32px rgba(15, 23, 42, 0.18)",
    glow: "0 18px 42px rgba(79, 70, 229, 0.24)",
  },
  radii: {
    xl: "22px",
    "2xl": "28px",
  },
  components: {
    Button: {
      defaultProps: {
        _focus: { boxShadow: "none" },
      },
    },
    Input: {
      defaultProps: {
        focusBorderColor: "brand.500",
      },
    },
  },
});

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/chat"
            element={
              <>
                <SignedIn>
                  <Chat />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn redirectUrl="/chat" />
                </SignedOut>
              </>
            }
          />
        </Routes>
      </Router>
    </ChakraProvider>
  );
}

export default App;
