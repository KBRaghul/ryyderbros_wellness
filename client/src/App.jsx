import { Routes, Route } from "react-router-dom";
import { useState } from "react";
import Home from "./pages/Home.jsx";
import Bookings from "./pages/Bookings.jsx";
import TherapistDashboard from "./pages/TherapistDashboard.jsx";

function App() {
  const [count, setCount] = useState(0);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/bookings" element={<Bookings />} />
      <Route path="/therapist" element={<TherapistDashboard />} />
    </Routes>
  );
}

export default App;
