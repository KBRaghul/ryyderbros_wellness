// client/src/pages/Home.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Header from "../components/Header.jsx";
import Slider from "../components/Slider.jsx";
import HeroSection from "../components/HeroSection.jsx";
import AboutSection from "../components/AboutSection.jsx";
import ReviewsSection from "../components/ReviewsSection.jsx";
import Footer from "../components/Footer.jsx";

const API_BASE = "http://localhost:4000";

function Home() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const navigate = useNavigate();

  // On mount, check if there's a JWT and fetch user
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setLoadingUser(false);
        return;
      }

      try {
        const res = await axios.get(`${API_BASE}/api/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data.user);
      } catch (err) {
        console.error("Home: failed to fetch user", err);
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUser();
  }, []);

  const handleSignOut = async () => {
    try {
      await axios.post(`${API_BASE}/auth/logout`);
    } catch (err) {
      console.error("Logout failed (ignored):", err);
    }
    localStorage.removeItem("authToken");
    setUser(null);
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Pass user + onLogout into Header */}
      <Header user={user} onLogout={handleSignOut} />

      {/* Slider Section */}
      <section className="border-b border-slate-100">
        <Slider />
      </section>

      {/* Hero / Main Section */}
      <section className="py-12">
        <HeroSection user={user} />
      </section>

      {/* About Me Section */}
      <section className="py-12 border-b">
        <AboutSection />
      </section>

      {/* Reviews Section */}
      <section className="py-12 bg-gradient-to-r from-rose-200/60 to-rose-400/60 backdrop-blur-sm border-b border-green-200">
        <ReviewsSection />
      </section>

      <Footer />
    </div>
  );
}

export default Home;
