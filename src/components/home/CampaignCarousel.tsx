import React, { useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFonts } from 'expo-font';
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

export function CampaignCarousel({ campaigns, onOpen }: { campaigns: Campaign[]; onOpen: (id: Campaign) => void }) {
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [ready] = useFonts(fonts);
  return <View style={s.frame} onLayout={({ nativeEvent }) => {
    const next = nativeEvent.layout.width;
    if (next !== width) { setWidth(next); setIndex(0); scroll.current?.scrollTo({ x: 0, animated: false }); }
  }}>
    {width > 0 && <ScrollView ref={scroll} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
      scrollEventThrottle={16} onScroll={({ nativeEvent }) => setIndex(Math.max(0, Math.min(campaigns.length - 1, Math.round(nativeEvent.contentOffset.x / width))))}>
      {campaigns.map((id, i) => {
        const [title, detail, cta] = copy[id];
        return <Pressable key={id} style={[s.slide, { width }]}
          accessibilityRole="button" accessibilityLabel={cta} accessibilityHint={detail}
          accessibilityElementsHidden={index !== i} importantForAccessibility={index === i ? 'yes' : 'no-hide-descendants'}
          onPress={() => onOpen(id)}>
          {id !== 'share' && <Image source={images[id]} resizeMode="cover" style={s.photo} />}
          {id === 'share' && <Image source={require('../../../assets/images/banner-card.png')} resizeMode="contain" style={s.sample} />}
          <View style={id === 'share' ? s.narrow : undefined}>
            <Text style={[s.title, ready && { fontFamily: 'NunitoBlack', fontWeight: 'normal' }]}>{title}</Text>
            <Text style={[s.body, ready && { fontFamily: 'NunitoRegular' }]}>{detail}</Text>
            <Text style={[s.cta, ready && { fontFamily: 'NunitoBold' }]}>{cta}</Text>
          </View>
        </Pressable>;
      })}
    </ScrollView>}
    {campaigns.length > 1 && <View style={s.dots}>
      {campaigns.map((id, i) => <Pressable key={id} accessibilityRole="button" accessibilityLabel={`Mostrar banner: ${copy[id][2]}`}
        accessibilityState={{ selected: i === index }} style={s.dotTarget}
        onPress={() => scroll.current?.scrollTo({ x: i * width, animated: true })}>
        <View style={[s.dot, i === index && s.active]} />
      </Pressable>)}
    </View>}
  </View>;
}

const s = StyleSheet.create({
  frame: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#09110b', minHeight: 193 },
  slide: { minHeight: 220, padding: 20, paddingBottom: 32, justifyContent: 'flex-start', overflow: 'hidden' },
  photo: { position: 'absolute', width: '100%', height: '100%', top: 0, left: 0 },
  sample: { position: 'absolute', right: 12, top: 14, width: '32%', height: 192 },
  narrow: { width: '61%' },
  title: { color: 'white', fontSize: 22, lineHeight: 26, fontWeight: '900' },
  body: { marginTop: 5, color: '#e8e9dd', fontSize: 14, lineHeight: 20 },
  cta: { marginTop: 14, alignSelf: 'flex-start', borderRadius: 20, overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 7, color: '#14240f', backgroundColor: '#8bb93b', fontSize: 12 },
  dots: { position: 'absolute', bottom: 0, flexDirection: 'row', alignSelf: 'center' },
  dotTarget: { width: 28, height: 30, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#a6ada0' },
  active: { backgroundColor: '#c4ff00' },
});
