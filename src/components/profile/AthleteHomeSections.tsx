import React from 'react';
import { Linking, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { PlayerAvatar } from '../competition/PlayerAvatar';
import { TeamBadge } from '../competition/TeamBadge';
import { ContentShell } from '../layout/ContentShell';
import { makeStyles, useTheme } from '../../theme/theme';
import { SITE_LINKS } from '../../core/config/siteLinks';
import { SocialLink, SocialNetwork } from '../../domain/usecases/shared/athleteProfile';
import { CareerSummary, MonthBar, TournamentCard } from '../../domain/usecases/shared/athleteHome';

const SOCIAL_ICONS: Record<SocialNetwork, keyof typeof Ionicons.glyphMap> = {
  instagram: 'logo-instagram',
  twitter: 'logo-twitter',
  facebook: 'logo-facebook',
};

const SOCIAL_LABELS: Record<SocialNetwork, string> = {
  instagram: 'Abrir Instagram',
  twitter: 'Abrir Twitter',
  facebook: 'Abrir Facebook',
};

type HeroProps = {
  name: string;
  photoUrl: string | null;
  socialLinks: SocialLink[];
  editLabel: string;
  onEdit: () => void;
};

// The dark band under the header: photo, name, social networks and actions.
// Sharing the profile is not built yet, so its button shows disabled.
export const AthleteHero = ({ name, photoUrl, socialLinks, editLabel, onEdit }: HeroProps) => {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.hero} testID="athlete-home-hero">
      <ContentShell style={styles.heroContent}>
        <View style={styles.identity}>
          <PlayerAvatar photoUrl={photoUrl} name={name} size={76} />
          <View style={styles.identityText}>
            <Text accessibilityRole="header" numberOfLines={2} style={styles.name}>
              {name}
            </Text>
            {socialLinks.length > 0 ? (
              <View style={styles.socials}>
                {socialLinks.map(({ network, url }) => (
                  <TouchableOpacity
                    key={network}
                    accessibilityRole="link"
                    accessibilityLabel={SOCIAL_LABELS[network]}
                    onPress={() => void Linking.openURL(url)}
                    hitSlop={{ left: 6, right: 6 }}
                    style={styles.social}
                  >
                    <Ionicons name={SOCIAL_ICONS[network]} size={24} color={theme.colors.onDark} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity accessibilityRole="button" onPress={onEdit} style={[styles.action, styles.editAction]}>
            <Text style={styles.editText}>{editLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Compartilhar perfil (em breve)"
            disabled
            style={[styles.action, styles.shareAction]}
          >
            <Text style={styles.shareText}>Compartilhar perfil</Text>
          </TouchableOpacity>
        </View>
      </ContentShell>
    </View>
  );
};

export const SectionHeading = ({
  title,
  detail,
  action,
}: {
  title: string;
  detail?: string;
  action?: { label: string; onPress: () => void };
}) => {
  const styles = useStyles();
  return (
    <View style={styles.heading}>
      <Text accessibilityRole="header" style={styles.headingTitle}>
        {title}
      </Text>
      {detail ? <Text style={styles.headingDetail}>{detail}</Text> : null}
      {action ? (
        <TouchableOpacity accessibilityRole="button" onPress={action.onPress} style={styles.headingAction}>
          <Text style={styles.headingActionText}>{action.label}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const Metric = ({ value, label }: { value: string; label: string }) => {
  const styles = useStyles();
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
};

export const CareerSummaryCard = ({ summary }: { summary: CareerSummary }) => {
  const styles = useStyles();
  return (
    <View style={styles.card} testID={`career-${summary.sportSlug}`}>
      <View style={styles.metrics}>
        <Metric value={summary.tournaments} label="Campeonatos" />
        <Metric value={summary.games} label="Jogos disputados" />
      </View>
      {summary.rows.length > 0 ? (
        <>
          <View style={styles.divider} />
          <View>
            <View style={styles.statRow}>
              <Text style={[styles.statHead, styles.statLabelCell]}>Estatística</Text>
              <Text style={[styles.statHead, styles.statValueCell]}>Total</Text>
              <Text style={[styles.statHead, styles.statValueCell]}>Por jogo</Text>
            </View>
            {summary.rows.map((row) => (
              <View key={row.key} style={[styles.statRow, styles.statBodyRow]}>
                <Text style={[styles.statLabel, styles.statLabelCell]}>{row.label}</Text>
                <Text style={[styles.statTotal, styles.statValueCell]}>{row.total}</Text>
                <Text style={[styles.statPerGame, styles.statValueCell]}>{row.perGame}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
};

const FORM_BAR_HEIGHT = 56;

export const MonthlyScoringCard = ({ bars }: { bars: MonthBar[] }) => {
  const styles = useStyles();
  if (bars.length === 0) return null;
  return (
    <View style={styles.card} testID="monthly-scoring">
      <View style={styles.formHeading}>
        <Text style={styles.formTitle}>Pontuação mensal</Text>
        <Text style={styles.formDetail}>
          {bars.length === 1 ? 'Último mês · PTS' : `Últimos ${bars.length} meses · PTS`}
        </Text>
      </View>
      <View style={styles.bars}>
        {bars.map((bar) => (
          <View
            key={bar.key}
            accessible
            accessibilityLabel={`${bar.label} pontos em ${bar.monthLong}`}
            style={styles.barColumn}
          >
            <Text style={styles.barValue}>{bar.label}</Text>
            <View
              style={[
                styles.bar,
                bar.latest && styles.barLatest,
                { height: Math.max(6, Math.round(bar.ratio * FORM_BAR_HEIGHT)) },
              ]}
            />
            <Text style={styles.barDate}>{bar.month}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// Figma's "Help us improve" card, with an accent edge, an icon and a button
// so it stands out among the stats.
export const FeedbackCard = () => {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.feedback} testID="athlete-feedback">
      <View style={styles.feedbackIcon}>
        <Ionicons name="chatbubbles-outline" size={22} color={theme.colors.onAccent} />
      </View>
      <View style={styles.feedbackBody}>
        <Text style={styles.feedbackTitle}>Ajude a melhorar o Go Champs</Text>
        <Text style={styles.feedbackText}>Conte o que achou do seu perfil e dos seus jogos. Leva 2 minutos.</Text>
        <TouchableOpacity
          accessibilityRole="link"
          accessibilityLabel="Enviar feedback (abre formulário)"
          onPress={() => void WebBrowser.openBrowserAsync(SITE_LINKS.athleteFeedback)}
          style={styles.feedbackButton}
        >
          <Text style={styles.feedbackButtonText}>Enviar feedback</Text>
          <Ionicons name="open-outline" size={16} color={theme.colors.onAccent} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const TournamentCardItem = ({ card, onOpen }: { card: TournamentCard; onOpen: () => void }) => {
  const styles = useStyles();
  return (
    <View style={styles.card} testID="athlete-tournament-card">
      <View style={styles.tournamentHeader}>
        <TeamBadge logoUrl={card.logoUrl} name={card.name} size={44} />
        <View style={styles.tournamentTitle}>
          {card.organization ? <Text style={styles.tournamentKicker}>{card.organization.toUpperCase()}</Text> : null}
          <Text style={styles.tournamentName}>{card.name}</Text>
          <Text style={styles.tournamentMeta}>{card.sport}</Text>
        </View>
      </View>
      <View style={styles.tournamentTeam}>
        <TeamBadge logoUrl={card.teamLogoUrl} name={card.teamName} size={24} />
        <Text style={styles.tournamentTeamName}>{card.team}</Text>
      </View>
      {/* A border, not textDecorationLine: native underlines sit flush on the text. */}
      <TouchableOpacity
        accessibilityRole="link"
        accessibilityLabel={`Ver campeonato ${card.name}`}
        onPress={onOpen}
        style={styles.tournamentLink}
      >
        <Text style={styles.tournamentLinkText}>Ver campeonato →</Text>
      </TouchableOpacity>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  hero: {
    backgroundColor: theme.colors.primary,
    borderBottomWidth: theme.dark ? 1 : 0,
    borderBottomColor: theme.colors.chromeBorder,
  },
  heroContent: {
    paddingHorizontal: 20,
    paddingTop: theme.spacing.sm,
    paddingBottom: 22,
    gap: 18,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  identityText: {
    flex: 1,
    gap: 3,
  },
  name: {
    color: theme.colors.onDark,
    fontSize: 28,
    fontWeight: '800',
  },
  // The icons start flush with the name: no box around them, the tap
  // area grows through hitSlop instead.
  socials: {
    flexDirection: 'row',
    gap: 12,
  },
  social: {
    height: 36,
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  action: {
    flex: 1,
    minHeight: theme.layout.touchTarget,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editAction: {
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accent,
  },
  editText: {
    color: theme.colors.onAccent,
    fontSize: 14,
    fontWeight: '600',
  },
  shareAction: {
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.chromeField,
  },
  shareText: {
    color: theme.colors.onPrimaryMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    minHeight: theme.layout.touchTarget,
  },
  headingTitle: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  headingDetail: {
    color: theme.colors.mutedText,
    fontSize: 12,
    fontWeight: '500',
  },
  headingAction: {
    minHeight: theme.layout.touchTarget,
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'center',
  },
  headingActionText: {
    color: theme.colors.olive,
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: 14,
    padding: theme.spacing.md,
    gap: 10,
  },
  metrics: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  metric: {
    flex: 1,
    gap: 2,
  },
  metricValue: {
    color: theme.colors.textPrimary,
    fontSize: 32,
    fontWeight: '800',
  },
  metricLabel: {
    color: theme.colors.mutedText,
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.subtleBorder,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
  },
  statBodyRow: {
    paddingVertical: 7,
  },
  statLabelCell: {
    flex: 1,
  },
  statValueCell: {
    width: 80,
    textAlign: 'right',
  },
  statHead: {
    color: theme.colors.mutedText,
    fontSize: 12,
  },
  statLabel: {
    color: theme.colors.textPrimary,
    fontSize: 13,
  },
  statTotal: {
    color: theme.colors.mutedText,
    fontSize: 14,
  },
  statPerGame: {
    color: theme.colors.textPrimary,
    fontSize: 14,
  },
  formHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  formTitle: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  formDetail: {
    color: theme.colors.mutedText,
    fontSize: 11,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
  },
  barValue: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  bar: {
    alignSelf: 'stretch',
    borderRadius: 4,
    backgroundColor: theme.colors.accentSoft,
  },
  barLatest: {
    backgroundColor: theme.colors.accent,
  },
  barDate: {
    color: theme.colors.mutedText,
    fontSize: 11,
  },
  feedback: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    borderRadius: 14,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.accent,
    backgroundColor: theme.colors.accentSoft,
  },
  feedbackIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent,
  },
  feedbackBody: {
    flex: 1,
    gap: 6,
  },
  feedbackTitle: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  feedbackText: {
    color: theme.colors.mutedText,
    fontSize: 13,
    lineHeight: 18,
  },
  feedbackButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    minHeight: 40,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accent,
  },
  feedbackButtonText: {
    color: theme.colors.onAccent,
    fontSize: 14,
    fontWeight: '600',
  },
  tournamentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tournamentTitle: {
    flex: 1,
    gap: 2,
  },
  tournamentTeam: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  tournamentTeamName: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  tournamentKicker: {
    color: theme.colors.mutedText,
    fontSize: 11,
    fontWeight: '500',
  },
  tournamentName: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  tournamentMeta: {
    color: theme.colors.mutedText,
    fontSize: 12,
    fontWeight: '500',
  },
  tournamentLink: {
    alignSelf: 'flex-start',
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.success,
  },
  tournamentLinkText: {
    color: theme.colors.success,
    fontSize: 12,
    fontWeight: '500',
  },
}));
