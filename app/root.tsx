import { cssBundleHref } from "@remix-run/css-bundle";
import { ActionArgs, LinksFunction, json, redirect } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import styles from "./tailwind.css";

export const links: LinksFunction = () => [
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
  { rel: "stylesheet", href: styles }
];
export const action = async ({ request }: ActionArgs) => {
  const formData = await request.formData();
  const url = new URL(request.url);
  const searchParams = new URLSearchParams();
  for (let name of formData.keys()) {
    searchParams.append(name, formData.get(name) as string);

  }
  return redirect(`${url.pathname}?${searchParams.toString()}`);

}
export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
