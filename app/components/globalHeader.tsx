import { NavLink } from "react-router";
import "./globalHeader.css";

export default function GlobalHeader() {
  return (
    <header id="global-header">
      kiss4da
      <div className="spacer" />
      <NavLink to="/">Home</NavLink>
      <NavLink to="/books">Books</NavLink>
    </header>
  );
}
