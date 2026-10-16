require 'minitest/autorun'
require 'fastlane'
UI = FastlaneCore::UI

# Load pure validation helpers without registering or running distribution lanes.
def default_platform(*)
end
def platform(*)
end
load File.expand_path('../../fastlane/Fastfile', __dir__)

class SigningPolicyTest < Minitest::Test
  def profile
    {
      'TeamIdentifier' => ['TEAM'],
      'Entitlements' => { 'application-identifier' => 'TEAM.com.gochamps.app', 'get-task-allow' => false },
      'ExpirationDate' => DateTime.now + 1
    }
  end

  def test_accepts_matching_store_profile
    check_profile!(profile, 'com.gochamps.app', 'TEAM')
  end

  def test_rejects_cross_environment_signing
    assert_raises(StandardError) { check_profile!(profile, 'com.gochamps.app.staging', 'TEAM') }
  end

  def test_rejects_development_adhoc_and_expired_profiles
    invalid = [
      profile.merge('ProvisionedDevices' => ['device']),
      profile.merge('ProvisionsAllDevices' => true),
      profile.merge('ExpirationDate' => DateTime.now - 1),
      profile.merge('Entitlements' => profile['Entitlements'].merge('get-task-allow' => true))
    ]
    invalid.each { |value| assert_raises(StandardError) { check_profile!(value, 'com.gochamps.app', 'TEAM') } }
  end

  def test_allocates_integer_build_numbers_and_rejects_unsupported_migrations
    assert_equal 1, next_build_number(0)
    assert_equal 102, next_build_number('101')
    assert_raises(StandardError) { next_build_number('1.2.3') }
    assert_raises(StandardError) { next_build_number(9999) }
  end
end
