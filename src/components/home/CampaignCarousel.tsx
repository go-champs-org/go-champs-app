import React, { useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFonts } from 'expo-font';
import { useTheme } from '../../theme/theme';
import type { Campaign } from '../../viewmodels/useHomeCampaigns';

const copy = {
  create: ['Seu jogo merece\num perfil.', 'Reúna suas estatísticas e mostre quem você é em quadra.', 'Criar meu perfil'],
  share: ['Sua foto.\nSeus números.', 'Coloque sua foto atrás das estatísticas e compartilhe.', 'Criar meu card'],
  progress: ['Seu próximo recorde começa aqui.', 'Acompanhe seus números e veja sua evolução a cada jogo.', 'Ver minha evolução'],
} as const;
const images = {
  create: require('../../../assets/images/banner-create.jpg'),
  progress: require('../../../assets/images/banner-progress.jpg'),
};
const fonts = {
  NunitoRegular: require('../../../assets/fonts/NunitoSans_400Regular.ttf'),
  NunitoBold: require('../../../assets/fonts/NunitoSans_700Bold.ttf'),
  NunitoBlack: require('../../../assets/fonts/NunitoSans_900Black.ttf'),
};

export function CampaignCarousel({ campaigns, canShare, onOpen }: { campaigns: Campaign[]; canShare: boolean; onOpen: (id: Campaign) => void }) {
  const theme = useTheme();
  const content = (id: Campaign) => id === 'share' && !canShare
    ? [copy.share[0], 'Seu card fica disponível depois de um jogo com estatísticas.', 'Ver meus jogos'] as const
    : copy[id];
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [ready] = useFonts(fonts);
  // Each photo is 1000 x 666. Keep its entire canvas, anchored on the right even in landscape.
  const artWidth = Math.min(width, 360);
  const artHeight = artWidth * 666 / 1000;
  return <View style={s.carousel} onLayout={({ nativeEvent }) => {
    const next = nativeEvent.layout.width;
    if (next !== width) { setWidth(next); setIndex(0); scroll.current?.scrollTo({ x: 0, animated: false }); }
  }}>
    <View style={s.frame}>
    {width > 0 && <ScrollView ref={scroll} horizontal pagingEnabled directionalLockEnabled showsHorizontalScrollIndicator={false}
      scrollEventThrottle={16} onScroll={({ nativeEvent }) => setIndex(Math.max(0, Math.min(campaigns.length - 1, Math.round(nativeEvent.contentOffset.x / width))))}>
      {campaigns.map((id, i) => {
        const [title, detail, cta] = content(id);
        return <Pressable key={id} style={[s.slide, { width, minHeight: artHeight, backgroundColor: id === 'progress' ? '#031326' : '#071009' }]}
          accessibilityRole="button" accessibilityLabel={cta} accessibilityHint={detail}
          accessibilityElementsHidden={index !== i} importantForAccessibility={index === i ? 'yes' : 'no-hide-descendants'}
          onPress={() => onOpen(id)}>
          {id !== 'share' && <Image source={images[id]} resizeMode="contain" style={[s.photo, { width: artWidth, height: artHeight }]} />}
          {id === 'share' && <Image source={require('../../../assets/images/banner-card.png')} resizeMode="contain" style={s.sample} />}
          <View style={s.copy}>
            <Text style={[s.title, ready && { fontFamily: 'NunitoBlack', fontWeight: 'normal' }]}>{title}</Text>
            <Text style={[s.body, ready && { fontFamily: 'NunitoRegular' }]}>{detail}</Text>
            <Text style={[s.cta, ready && { fontFamily: 'NunitoBold' }]}>{cta}</Text>
          </View>
        </Pressable>;
      })}
    </ScrollView>}
    </View>
    {campaigns.length > 1 && <View style={s.dots}>
      {campaigns.map((id, i) => <Pressable key={id} accessibilityRole="button" accessibilityLabel={`Mostrar banner: ${content(id)[2]}`}
        accessibilityState={{ selected: i === index }} style={s.dotTarget}
        onPress={() => scroll.current?.scrollTo({ x: i * width, animated: true })}>
        <View style={[s.dot, { backgroundColor: theme.colors.subtleText }, i === index && [s.active, { backgroundColor: theme.colors.textSecondary }]]} />
      </Pressable>)}
    </View>}
  </View>;
}

const s = StyleSheet.create({
  carousel: { width: '100%' },
  frame: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#071009' },
  slide: { padding: 18, justifyContent: 'center', overflow: 'hidden' },
  photo: { position: 'absolute', right: 0, bottom: 0 },
  sample: { position: 'absolute', right: 12, alignSelf: 'center', width: '31%', height: '88%' },
  copy: { width: '63%', maxWidth: 360 },
  title: { color: 'white', fontSize: 22, lineHeight: 26, fontWeight: '900' },
  body: { marginTop: 5, color: '#e8e9dd', fontSize: 14, lineHeight: 20 },
  cta: { marginTop: 14, alignSelf: 'flex-start', borderRadius: 20, overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 7, color: '#14240f', backgroundColor: '#8bb93b', fontSize: 12 },
  dots: { flexDirection: 'row', alignSelf: 'center' },
  dotTarget: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  active: { width: 20 },
});
