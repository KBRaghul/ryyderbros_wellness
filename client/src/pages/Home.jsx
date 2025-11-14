import React from "react";
import Header from "../components/Header.jsx";
import Slider from "../components/Slider.jsx";
import HeroSection from "../components/HeroSection.jsx";
import AboutSection from "../components/AboutSection.jsx";
import ReviewsSection from "../components/ReviewsSection.jsx";
import Footer from "../components/Footer.jsx";

function Home() {
  const handleLogin = () => {
    window.location.href = "http://localhost:4000/auth/google";
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      {/* Slider Section */}
      <section className="border-b border-slate-100">
        <Slider />
      </section>

      {/* Hero / Main Section */}
      <section className="py-12 border-b border-slate-100">
        <HeroSection />
      </section>

      {/* About Me Section */}
      <section className="py-12 border-b border-slate-100">
        <AboutSection />
      </section>

      {/* Reviews Section */}
      <section className="py-12 border-b border-slate-100">
        <ReviewsSection />
      </section>

      <Footer />
    </div>
  );
}

export default Home;
