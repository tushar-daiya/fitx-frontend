// Expo config plugin: the name shown UNDER THE ICON on the home screen.
//
// `expo.name` (the long "FitX - Your AI Health Companion") is also what
// prebuild writes into the Android launcher label, so a short label is
// forced here instead. Store listing names (Play Console / App Store Connect)
// are typed into those consoles and are independent of this.
//
// iOS is handled in app.json (ios.infoPlist.CFBundleDisplayName) so the Xcode
// project keeps its existing name.
const { withStringsXml, AndroidConfig } = require("@expo/config-plugins");

const LABEL = "FitX";

module.exports = function withAppLabel(config) {
  return withStringsXml(config, (cfg) => {
    cfg.modResults = AndroidConfig.Strings.setStringItem(
      [{ $: { name: "app_name" }, _: LABEL }],
      cfg.modResults
    );
    return cfg;
  });
};
