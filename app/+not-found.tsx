// The app's own navigation owns every path (see the linking config in
// ./index). On the web, going back through the browser history to a path other
// than "/" (e.g. /profile after signing in) reaches Expo Router as an unknown
// route; render the same app there so its linking opens that screen instead of
// Expo Router's "Unmatched Route" page.
export { default } from './index';
