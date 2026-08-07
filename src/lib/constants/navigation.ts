export type NavRouteKey =
  | "home"
  | "search"
  | "soundChange"
  | "conjugation"
  | "hanja"
  | "idioms"
  | "about";

export type NavRoute = {
  href: "/" | "/search" | "/sound-change" | "/conjugation" | "/hanja" | "/idioms" | "/about";
  key: NavRouteKey;
};

export const mainNavRoutes: NavRoute[] = [
  { href: "/", key: "home" },
  { href: "/search", key: "search" },
  { href: "/sound-change", key: "soundChange" },
  { href: "/conjugation", key: "conjugation" },
  { href: "/hanja", key: "hanja" },
  { href: "/idioms", key: "idioms" },
  { href: "/about", key: "about" },
];

export type ModuleIconName = "sound-change" | "conjugation" | "hanja" | "idioms";

export type ModuleRoute = {
  href: "/sound-change" | "/conjugation" | "/hanja" | "/idioms";
  key: ModuleIconName;
  icon: ModuleIconName;
};

export const moduleRoutes: ModuleRoute[] = [
  { href: "/sound-change", key: "sound-change", icon: "sound-change" },
  { href: "/conjugation", key: "conjugation", icon: "conjugation" },
  { href: "/hanja", key: "hanja", icon: "hanja" },
  { href: "/idioms", key: "idioms", icon: "idioms" },
];
