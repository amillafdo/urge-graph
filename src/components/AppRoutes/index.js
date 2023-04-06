import { Route, Routes } from "react-router-dom";
import Dashboard from "../../Pages/Dashboard";
import SupportTickets from "../../Pages/SupportTickets";
import UrgencyLevels from "../../Pages/UrgencyLevels";
import Customers from "../../Pages/Customers";

function AppRoutes() {
  return (
    <div>
      <Routes>
        <Route path="/Dashboard" element={<Dashboard />}>
          {" "}
        </Route>
        <Route path="/SupportTickets" element={<SupportTickets />}>
          {" "}
        </Route>
        <Route path="/UrgencyLevels" element={<UrgencyLevels />}>
          {" "}
        </Route>
        <Route path="/Customers" element={<Customers />}>
          {" "}
        </Route>
      </Routes>
    </div>
  );
}

export default AppRoutes;
