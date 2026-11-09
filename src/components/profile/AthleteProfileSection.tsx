import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  EmptyProfileCard,
  ProfileCard,
  ProfileField,
  ProfileRow,
  ProfileSection,
  RowDivider,
  SectionActions,
} from './ProfileSection';
import { makeStyles, useTheme } from '../../theme/theme';
import type { useProfileViewModel } from '../../viewmodels/ProfileViewModel';
import { localFileFromPicked } from '../../domain/usecases/shared/athleteProfileForm';

type ProfileModel = ReturnType<typeof useProfileViewModel>;

export const AthleteProfileSection = ({ athlete }: { athlete: ProfileModel['athlete'] }) => {
  const theme = useTheme();
  const styles = useStyles();
  const { data, editing, values, fieldErrors } = athlete;
  const description = 'Como você aparece para a comunidade Go Champs.';

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    const asset = result.canceled ? undefined : result.assets?.[0];
    if (asset) athlete.selectPhoto(localFileFromPicked(asset));
  };

  const photo = (
    <View style={styles.photo}>
      {athlete.photoUri ? (
        <Image accessibilityLabel="Foto do perfil" source={{ uri: athlete.photoUri }} style={styles.photoImage} />
      ) : (
        <Ionicons name="camera-outline" size={24} color={theme.colors.onOliveSoft} />
      )}
    </View>
  );

  if (editing) {
    return (
      <ProfileSection title="Perfil de atleta" description={description}>
        <ProfileCard>
          <View style={styles.photoRow}>
            {photo}
            <View style={styles.photoCopy}>
              <Text style={styles.photoTitle}>Foto do perfil</Text>
              {fieldErrors.photo ? <Text style={styles.photoError}>{fieldErrors.photo}</Text> : null}
            </View>
            <View style={styles.photoActions}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={athlete.photoUri ? 'Trocar foto' : 'Adicionar foto'}
                disabled={athlete.saving}
                onPress={() => void pickPhoto()}
                style={styles.photoButton}
              >
                <Text style={styles.photoButtonText}>{athlete.photoUri ? 'Trocar' : 'Adicionar'}</Text>
              </TouchableOpacity>
              {athlete.photoUri ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Remover foto"
                  disabled={athlete.saving}
                  onPress={athlete.removePhoto}
                  style={styles.photoButton}
                >
                  <Text style={[styles.photoButtonText, styles.removeText]}>Remover</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          <RowDivider />
          <ProfileField
            label="Nome de atleta"
            value={values.name}
            onChangeText={(value) => athlete.setField('name', value)}
            placeholder="Nome que aparece nos campeonatos"
            autoCapitalize="words"
            editable={!athlete.saving}
            error={fieldErrors.name}
          />
          <ProfileField
            label="Facebook"
            value={values.facebook}
            onChangeText={(value) => athlete.setField('facebook', value)}
            placeholder="usuario ou link"
            editable={!athlete.saving}
            error={fieldErrors.facebook}
          />
          <ProfileField
            label="Instagram"
            value={values.instagram}
            onChangeText={(value) => athlete.setField('instagram', value)}
            placeholder="@usuario"
            editable={!athlete.saving}
            error={fieldErrors.instagram}
          />
          <ProfileField
            label="Twitter"
            value={values.twitter}
            onChangeText={(value) => athlete.setField('twitter', value)}
            placeholder="@usuario"
            editable={!athlete.saving}
            error={fieldErrors.twitter}
          />
          <SectionActions
            saving={athlete.saving}
            error={athlete.error}
            onCancel={athlete.cancelEdit}
            onSave={() => void athlete.save()}
            saveLabel={data ? 'Salvar' : 'Criar perfil'}
          />
        </ProfileCard>
      </ProfileSection>
    );
  }

  if (!data) {
    return (
      <ProfileSection title="Perfil de atleta" description={description}>
        <EmptyProfileCard
          title="Nenhum perfil de atleta ainda"
          description="Adicione seu nome de atleta e uma foto, depois vincule Facebook, Instagram e Twitter."
          actionLabel="Criar perfil de atleta"
          onAction={athlete.startEdit}
        />
      </ProfileSection>
    );
  }

  return (
    <ProfileSection
      title="Perfil de atleta"
      description={description}
      onEdit={athlete.startEdit}
      editLabel="Editar perfil de atleta"
    >
      <ProfileCard>
        <ProfileRow
          label="Foto do perfil"
          value={data.photo_url ? 'Foto adicionada' : null}
          placeholder="Nenhuma foto adicionada"
          leading={photo}
        />
        <RowDivider />
        <ProfileRow label="Nome de atleta" value={data.name} />
        <RowDivider />
        <ProfileRow label="Facebook" value={data.facebook} />
        <RowDivider />
        <ProfileRow label="Instagram" value={data.instagram} />
        <RowDivider />
        <ProfileRow label="Twitter" value={data.twitter} />
      </ProfileCard>
    </ProfileSection>
  );
};


const useStyles = makeStyles((theme) => ({
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: theme.spacing.md,
  },
  photo: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: theme.colors.tint,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoImage: {
    width: 54,
    height: 54,
  },
  photoCopy: {
    flex: 1,
    gap: 2,
  },
  photoTitle: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  photoError: {
    color: theme.colors.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  photoActions: {
    alignItems: 'flex-end',
  },
  photoButton: {
    minHeight: 36,
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'center',
  },
  photoButtonText: {
    color: theme.colors.olive,
    fontSize: 14,
    fontWeight: '600',
  },
  removeText: {
    color: theme.colors.danger,
  },
}));
