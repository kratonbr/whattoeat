import NotFoundContent from "./not-found-content";

export const metadata = {
  title: "404 | WhatToEat",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <NotFoundContent />;
}
