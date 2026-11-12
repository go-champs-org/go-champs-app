import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import AthleteProfileEditScreen from '../AthleteProfileEditScreen';
import { useProfileViewModel } from '../../viewmodels/ProfileViewModel';
import { analytics } from '../../core/analytics/analytics';

const mockPopTo = jest.fn();
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ popTo: mockPopTo, goBack: jest.fn() }) }));
jest.mock('../../core/analytics/analytics', () => ({ analytics: { track: jest.fn() } }));
jest.mock('../../auth/AuthSessionContext', () => ({ useAuthSession: () => ({ user: { username: 'athlete-test' }, bootstrapping: false }) }));
jest.mock('../../viewmodels/ProfileViewModel', () => ({ useProfileViewModel: jest.fn() }));
jest.mock('../../components/profile/AthleteProfileSection', () => ({
  AthleteProfileSection: ({ athlete }: { athlete: { save: () => Promise<boolean> } }) => {
    const { Button } = jest.requireActual('react-native');
    return <Button title="Salvar perfil" onPress={() => void athlete.save()} />;
  },
}));

beforeEach(() => jest.clearAllMocks());
it.each([true, false])('tracks only a successful save with is_new=%s and field names, then navigates', async (isNew) => {
  const save = jest.fn().mockResolvedValue(true);
  jest.mocked(useProfileViewModel).mockReturnValue({ loading: false, error: null,
    athlete: { data: isNew ? null : { name: 'private-name' }, changedFields: ['name', 'photo_url'], save },
  } as never);
  const screen = render(<AthleteProfileEditScreen />);
  fireEvent.press(screen.getByText('Salvar perfil'));
  await waitFor(() => expect(mockPopTo).toHaveBeenCalled());
  expect(analytics.track).toHaveBeenCalledWith('Athlete Profile Saved', { is_new: isNew, changed_fields: ['name', 'photo_url'] });
  expect(JSON.stringify(jest.mocked(analytics.track).mock.calls)).not.toContain('private');
});

it('does not emit after a failed or invalid save', async () => {
  jest.mocked(useProfileViewModel).mockReturnValue({ loading: false, error: null,
    athlete: { data: null, changedFields: ['name'], save: jest.fn().mockResolvedValue(false) },
  } as never);
  const screen = render(<AthleteProfileEditScreen />);
  await act(async () => { fireEvent.press(screen.getByText('Salvar perfil')); });
  expect(analytics.track).not.toHaveBeenCalled();
  expect(mockPopTo).not.toHaveBeenCalled();
});
