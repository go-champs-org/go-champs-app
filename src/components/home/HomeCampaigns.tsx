import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthSession } from '../../auth/AuthSessionContext';
import type { RootStackParamList } from '../../navigation/types';
import { Campaign, useHomeCampaigns } from '../../viewmodels/useHomeCampaigns';
import { useShareStickerViewModel } from '../../viewmodels/ShareStickerViewModel';
import { GAME_SHARE_FORMATS, GameShareCard, GameShareFormat } from '../../domain/usecases/shared/gameShare';
import { GameSticker } from '../myGames/GameSticker';
import { ShareStickerSheet } from '../share/ShareStickerSheet';
import { CampaignCarousel } from './CampaignCarousel';

export function HomeCampaigns() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, bootstrapping } = useAuthSession();
  const { campaigns, card } = useHomeCampaigns(user?.username, bootstrapping);
  const share = useShareStickerViewModel<GameShareCard, GameShareFormat>({
    formats: GAME_SHARE_FORMATS, sticker: 'game', dialogTitle: 'Compartilhar jogo',
  });
  const open = (id: Campaign) => {
    switch (id) {
      case 'create':
        if (user) navigation.navigate('AthleteProfileEditScreen');
        else navigation.navigate('AuthScreen', { initialMode: 'signIn', afterSignIn: 'athleteProfile' });
        break;
      case 'share':
        if (card) share.open(card);
        else navigation.navigate('MainTabs', { screen: 'MyGamesTab' });
        break;
      case 'progress':
        navigation.navigate('MainTabs', { screen: 'ProfileTab' });
        break;
    }
  };
  if (!campaigns.length) return null;
  return <>
    <CampaignCarousel key={campaigns.join(':')} campaigns={campaigns} canShare={Boolean(card)} onOpen={open} />
    {card && <ShareStickerSheet model={share} title="Compartilhar jogo" testID="home-share-sheet"
      renderSticker={(data, format, backgroundUri) => <GameSticker card={data} format={format} backgroundUri={backgroundUri} />} />}
  </>;
}
