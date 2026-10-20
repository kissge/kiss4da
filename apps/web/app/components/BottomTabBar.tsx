import { NavLink } from "react-router";

type TabIconProps = {
  className?: string;
};

function BookIcon({ className }: TabIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5.25 5.75h6.5v12.5h-6.5a1.5 1.5 0 0 1-1.5-1.5v-9.5a1.5 1.5 0 0 1 1.5-1.5Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18.75 5.75h-6.5v12.5h6.5a1.5 1.5 0 0 0 1.5-1.5v-9.5a1.5 1.5 0 0 0-1.5-1.5Z"
      />
      <path strokeLinecap="round" d="M12.25 7.5v9" />
    </svg>
  );
}

function PeopleIcon({ className }: TabIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="9" cy="8" r="2.75" />
      <circle cx="16.5" cy="9.5" r="2.25" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 19.25c.35-3.1 2.15-5 5.25-5s4.9 1.9 5.25 5"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.25 14.75c.7-.75 1.65-1.15 2.75-1.15 2.2 0 3.45 1.4 3.75 3.9"
      />
    </svg>
  );
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
