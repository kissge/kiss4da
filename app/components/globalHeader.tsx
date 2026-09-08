import { NavLink } from "react-router";
import "./globalHeader.css";

export default function GlobalHeader() {
  return (
    <header id="global-header">
      kiss4da
      <div className="spacer" />
      <NavLink to="/books">問題集</NavLink>
      <NavLink to="/events">フリバ</NavLink>
      <NavLink to="/circles/1">サークル</NavLink>
      <NavLink to="/users/alice_dev">マイページ</NavLink>
    </header>
  );
}
