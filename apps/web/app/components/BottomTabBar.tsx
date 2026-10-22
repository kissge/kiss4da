import { BookOpen, Users } from "lucide-react";
import { NavLink } from "react-router";

type TabIconProps = {
  className?: string;
};

function BookIcon({ className }: TabIconProps) {
  return <BookOpen aria-hidden="true" className={className} />;
}

function PeopleIcon({ className }: TabIconProps) {
  return <Users aria-hidden="true" className={className} />;
}

const tabs = [
  { to: "/", label: "問題集管理", Icon: BookIcon },
  { to: "/arrange", label: "読むやつ調整", Icon: PeopleIcon },
] as const;

export function BottomTabBar() {
  return (
    <nav className="bottom-tab-bar" aria-label="メインメニュー">
      <div className="bottom-tab-bar__inner">
        {tabs.map(({ to, label, Icon }) => (
          <NavLink
            end={to === "/"}
            key={to}
            to={to}
            className={({ isActive }) => `bottom-tab ${isActive ? "bottom-tab--active" : ""}`}
          >
            <Icon className="bottom-tab__icon" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
