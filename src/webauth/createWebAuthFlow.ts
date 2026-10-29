import { Linking, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { WebAuthFlowPort } from './WebAuthFlowPort';
import { WebAuthPurpose } from './WebAuthPurpose';
import { webAuthStartUrl } from './webAuthUrls';

export const createWebAuthFlow = (purpose: WebAuthPurpose): WebAuthFlowPort => {
  const startUrl = webAuthStartUrl[purpose];

  return {
    purpose,
    startUrl,
    async openExternal() {
      if (Platform.OS === 'web') {
        await Linking.openURL(startUrl);
        return;
      }
      await WebBrowser.openBrowserAsync(startUrl);
    },
  };
};
