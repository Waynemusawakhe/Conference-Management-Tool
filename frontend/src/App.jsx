import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

<Route path="/login" element={<Login />} />
<Route path="/register" element={<Register />} />
export default function App() {
  return <Home />;
}
